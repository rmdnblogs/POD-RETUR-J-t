const dropArea = document.getElementById('dropArea');
const preview = document.getElementById('preview');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const downloadButton = document.getElementById('downloadButton');
const shareButton = document.getElementById('shareButton');
const fileButton = document.getElementById('fileButton');
const fileInput = document.getElementById('fileInput');

let images = [];

// -------- Utility utama --------
function handleFileObject(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert('File bukan gambar. Pilih file gambar (jpg, png).');
    return;
  }
  if (images.length >= 3) return alert('Maksimal 3 foto');

  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.src = ev.target.result;
    img.onload = () => {
      images.push(img);
      updatePreview();
      drawCollage();
    };
  };
  reader.readAsDataURL(file);
}

// -------- Drag & Drop Events --------
['dragenter','dragover'].forEach(ev => {
  dropArea.addEventListener(ev, e => { e.preventDefault(); dropArea.classList.add('dragover'); });
});
['dragleave','drop'].forEach(ev => {
  dropArea.addEventListener(ev, e => { e.preventDefault(); dropArea.classList.remove('dragover'); });
});

dropArea.addEventListener('drop', e => {
  e.preventDefault();
  const dt = e.dataTransfer;
  if (dt && dt.items && dt.items.length) {
    for (let i = 0; i < dt.items.length; i++) {
      const item = dt.items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        handleFileObject(file);
        break; // satu file per drop
      }
    }
    return;
  }
  if (dt && dt.files && dt.files.length) handleFileObject(dt.files[0]);
});

// -------- Tombol pilih file dari penyimpanan --------
fileButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  handleFileObject(file);
  fileInput.value = ''; // reset agar bisa pilih file yang sama lagi
});

// -------- Preview thumbnail --------
function updatePreview() {
  preview.innerHTML = '';
  images.forEach((img, i) => {
    const thumb = document.createElement('img');
    thumb.src = img.src;
    thumb.title = `Foto ${i+1}`;
    thumb.onclick = () => {
      if (confirm('Hapus foto ini?')) {
        images.splice(i, 1);
        updatePreview();
        drawCollage();
      }
    };
    preview.appendChild(thumb);
  });
}

// -------- Kolase --------
function drawCollage() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (images.length < 1) return;

  const W = canvas.width;
  const H = canvas.height;
  const gap = 8;
  const lineColor = '#cccccc';

  const ratios = images.map(img => img.width/img.height);
  const totalRatio = ratios.reduce((a,b)=>a+b,0);
  const perUnit = (W - gap*(images.length-1))/totalRatio;

  ctx.fillStyle = '#fff';
  ctx.fillRect(0,0,W,H);

  let x = 0;
  images.forEach((img, i) => {
    const imgW = perUnit*ratios[i];
    drawImageContain(img, x, 0, imgW, H);
    if (i < images.length-1) {
      ctx.fillStyle = lineColor;
      ctx.fillRect(x + imgW, 0, gap, H);
    }
    x += imgW + gap;
  });
}

function drawImageContain(img, x, y, w, h) {
  const scale = Math.min(w/img.width, h/img.height);
  const nw = img.width * scale, nh = img.height * scale;
  const nx = x + (w - nw)/2, ny = y + (h - nh)/2;
  ctx.drawImage(img, nx, ny, nw, nh);
}

// -------- Simpan & Share --------
downloadButton.addEventListener('click', () => {
  if (images.length < 1) return alert('Belum ada foto');
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `retur_pod_${Date.now()}.png`;
  link.click();
});

shareButton.addEventListener('click', async () => {
  if (images.length < 1) return alert('Belum ada foto');
  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  const file = new File([blob], `retur_pod_${Date.now()}.png`, {type: 'image/png'});
  if (navigator.canShare && navigator.canShare({files:[file]})) {
    try {
      await navigator.share({files:[file], title: 'Bukti Retur POD'});
      return;
    } catch (err) { console.warn('Share gagal', err); }
  }
  window.open('https://wa.me/?text=Bukti Retur POD', '_blank');
});
