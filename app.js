/* ============================================================
   WB Certificate Portal – app.js
   Handles: tab switching, camera scanning, QR decode,
            redirect to certificate.html?id=...
   Database is loaded from data.js (included before this script)
   ============================================================ */

// ── HELPERS ──────────────────────────────────────────────────────────────────
const $  = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

// ── STATE MANAGEMENT ─────────────────────────────────────────────────────────
const STATES = ['state-home', 'state-scanning', 'state-found', 'state-notfound'];
function showState(id) {
  STATES.forEach(s => $( s).classList.toggle('hidden', s !== id));
}

// ── TAB SWITCHING ─────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.tab;
    document.getElementById('tab-qr').classList.toggle('hidden', target !== 'qr');
    document.getElementById('tab-cert').classList.toggle('hidden', target !== 'cert');
    if (target === 'qr') showState('state-home');
    else stopCamera();
  });
});

// ── CAMERA STATE ─────────────────────────────────────────────────────────────
let currentStream   = null;
let scanIntervalId  = null;
let facingMode      = 'environment'; // back camera default

// Start camera
async function startCamera(facing) {
  stopCamera();
  facingMode = facing || facingMode;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    currentStream = stream;
    $('qrVideo').srcObject = stream;
    showCamStatus('');           // clear any previous message
    if (window.jsQR) startQRPolling();
  } catch (e) {
    // No camera available — stay on scanning state, show friendly message
    showCamStatus('📷 Camera not available or permission was denied. Please allow camera access and try again.');
  }
}

function showCamStatus(msg) {
  let el = document.getElementById('camStatusMsg');
  if (!el) {
    el = document.createElement('p');
    el.id = 'camStatusMsg';
    el.style.cssText = 'text-align:center;font-size:0.82rem;color:#888;padding:10px 0 4px;';
    const box = document.querySelector('.camera-box');
    box.insertAdjacentElement('afterend', el);
  }
  el.innerHTML = msg;
}

function stopCamera() {
  if (scanIntervalId) { clearInterval(scanIntervalId); scanIntervalId = null; }
  if (currentStream)  { currentStream.getTracks().forEach(t => t.stop()); currentStream = null; }
  if ($('qrVideo'))   $('qrVideo').srcObject = null;
}

// jsQR polling loop
function startQRPolling() {
  const video  = $('qrVideo');
  const canvas = $('qrCanvas');
  const ctx    = canvas.getContext('2d');
  scanIntervalId = setInterval(() => {
    if (video.readyState < video.HAVE_ENOUGH_DATA) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const img  = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
    if (code && code.data) {
      clearInterval(scanIntervalId);
      stopCamera();
      handleQRResult(code.data.trim());
    }
  }, 300);
}

// ── QR RESULT HANDLER — redirects to certificate page ────────────────────────
function handleQRResult(payload) {
  // Always redirect to Purnima Kapoor entry regardless of which QR is scanned
  const id = 'WB-CERT-D2026406333';
  if (CERT_DB[id]) {
    window.location.href = `./certificate.html?id=${encodeURIComponent(id)}`;
  } else {
    showState('state-notfound');
  }
}



// ── SCAN BUTTON (home → scanning) ────────────────────────────────────────────
$('scanBtn').addEventListener('click', () => {
  // Show scanning UI immediately — camera starts after
  showState('state-scanning');
  // Small delay so the DOM is visible before getUserMedia fires
  setTimeout(() => startCamera('environment'), 100);
});

// ── BACK TO HOME BUTTONS ─────────────────────────────────────────────────────
['backHomeBtn1','backHomeBtn2','backHomeBtn3'].forEach(id => {
  $(id).addEventListener('click', () => {
    stopCamera();
    showState('state-home');
  });
});



// ── CERT NO TAB – STATE HELPERS ───────────────────────────────────────────────
const CERT_STATES = ['cert-state-form', 'cert-state-notfound'];
function showCertState(id) {
  CERT_STATES.forEach(s => $(s).classList.toggle('hidden', s !== id));
}

// ── CERT NO TAB – VERIFY ─────────────────────────────────────────────────────
const dobInput = $('dob');
dobInput.addEventListener('input', () => {
  let v = dobInput.value.replace(/\D/g,'').slice(0,8);
  if (v.length >= 5)      v = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4);
  else if (v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2);
  dobInput.value = v;
});

$('verifyBtn').addEventListener('click', () => {
  const certNo = $('certNo').value.trim();
  const dob    = $('dob').value.trim();
  const type   = document.querySelector('input[name="certType"]:checked').value;
  const errDiv = $('certErrMsg');
  errDiv.innerHTML = '';

  if (!certNo) { errDiv.innerHTML = '<p style="color:#c62828;font-size:0.85rem;">⚠ Please enter a Certificate Number.</p>'; return; }
  if (dob.length < 10) { errDiv.innerHTML = '<p style="color:#c62828;font-size:0.85rem;">⚠ Please enter a valid date in DD/MM/YYYY format.</p>'; return; }

  $('verifyBtn').disabled = true;
  $('verifyBtn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying…';

  setTimeout(() => {
    $('verifyBtn').disabled = false;
    $('verifyBtn').innerHTML = '<i class="fas fa-search"></i> VERIFY';

    // Lookup — find the DB key whose cert number + type + date match
    const normalise = s => s.replace(/\s/g,'').toLowerCase();
    const foundKey = Object.keys(CERT_DB).find(key => {
      const rec = CERT_DB[key];
      const certNoMatch = normalise(rec.certificateNo) === normalise(certNo);
      const typeMatch   = rec.type.toLowerCase() === type.toLowerCase();
      const dateField   = type === 'death' ? rec.dateOfDeath : rec.dateOfBirth;
      const dateMatch   = dateField && dateField.trim() === dob.trim();
      return certNoMatch && typeMatch && dateMatch;
    });

    if (foundKey) {
      window.location.href = './certificate.html?id=' + encodeURIComponent(foundKey);
    } else {
      showCertState('cert-state-notfound');
    }
  }, 1400);
});


