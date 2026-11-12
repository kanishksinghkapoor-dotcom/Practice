/* ============================================================
   WB Certificate Portal – app.js
   Handles: tab switching, camera scanning, QR decode,
            result display (found / not-found), cert-no verify
   ============================================================ */

// ── DEMO DATABASE ────────────────────────────────────────────────────────────
// Entries will be added here
const CERT_DB = {
  "WB-CERT-D2026406333": {
    type:          "Death",
    name:          "PURNIMA KAPOOR",
    dateOfDeath:   "06/11/2026",
    gender:        "Female",
    certificateNo: "D/2026/406333",
    dateOfIssue:   "06/11/2026"
  }
};

// Also allow lookup by cert number directly (for the cert-no tab)
const CERT_BY_NO = {
  "D/2026/406333": CERT_DB["WB-CERT-D2026406333"],
  "d/2026/406333": CERT_DB["WB-CERT-D2026406333"]   // lowercase fallback
};

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
      video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
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

// ── QR RESULT HANDLER ────────────────────────────────────────────────────────
function handleQRResult(payload) {
  // Always redirect to Purnima Kapoor entry regardless of which QR is scanned
  const record = CERT_DB["WB-CERT-D2026406333"];

  if (record) {
    renderFoundResult(record);
    showState('state-found');
  } else {
    showState('state-notfound');
  }
}

function renderFoundResult(r) {
  const rows = r.type === 'Death'
    ? [
        ['Name',           r.name],
        ['Date Of Death',  r.dateOfDeath],
        ['Gender',         r.gender],
        ['Certificate No', r.certificateNo],
        ['Date Of Issue',  r.dateOfIssue]
      ]
    : [
        ['Name',           r.name],
        ['Date Of Birth',  r.dateOfBirth],
        ['Gender',         r.gender],
        ['Certificate No', r.certificateNo],
        ['Date Of Issue',  r.dateOfIssue]
      ];

  $('dataTable').innerHTML = rows.map(([label, val]) =>
    `<tr><td>${esc(label)}</td><td>${esc(val)}</td></tr>`
  ).join('');

  // Store for download
  $('downloadBtn')._certData = r;
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

// ── DOWNLOAD CERTIFICATE ──────────────────────────────────────────────────────
$('downloadBtn').addEventListener('click', function () {
  const r = this._certData;
  if (!r) return;

  // Build a simple printable HTML page
  const isD = r.type === 'Death';
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Certificate – ${r.certificateNo}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #222; }
    h1 { text-align:center; font-size:1.1rem; letter-spacing:1px; }
    h2 { text-align:center; font-size:0.9rem; color:#555; margin-bottom:30px; }
    .seal { text-align:center; font-size:3rem; margin-bottom:10px; }
    table { width:100%; border-collapse:collapse; margin:20px 0; }
    td { padding:10px 14px; border-bottom:1px solid #eee; font-size:0.92rem; }
    td:first-child { color:#666; width:40%; }
    td:last-child { font-weight:600; }
    .footer { text-align:center; margin-top:40px; font-size:0.75rem; color:#888; }
    .badge { background:#43a047; color:#fff; display:inline-block; border-radius:4px; padding:4px 14px; font-size:0.8rem; margin-bottom:20px; }
    @media print { body { margin:20px; } }
  </style>
</head>
<body>
  <div class="seal">🏛️</div>
  <h1>GOVERNMENT OF WEST BENGAL</h1>
  <h2>HEALTH &amp; FAMILY WELFARE DEPARTMENT<br>
      Janma Mrityu Tathya</h2>
  <div style="text-align:center"><span class="badge">✔ VERIFIED CERTIFICATE</span></div>
  <table>
    <tr><td>Certificate Type</td><td>${esc(r.type)} Certificate</td></tr>
    <tr><td>Name</td><td>${esc(r.name)}</td></tr>
    ${isD ? `<tr><td>Date Of Death</td><td>${esc(r.dateOfDeath)}</td></tr>` : `<tr><td>Date Of Birth</td><td>${esc(r.dateOfBirth)}</td></tr>`}
    <tr><td>Gender</td><td>${esc(r.gender)}</td></tr>
    <tr><td>Certificate No</td><td>${esc(r.certificateNo)}</td></tr>
    <tr><td>Date Of Issue</td><td>${esc(r.dateOfIssue)}</td></tr>
  </table>
  <div class="footer">
    This certificate is digitally verifiable via jyutathya.wb.gov.in<br>
    Printed on: ${new Date().toLocaleDateString('en-IN')}
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
});

// ── CERT NO TAB – STATE HELPERS ───────────────────────────────────────────────
const CERT_STATES = ['cert-state-form', 'cert-state-found', 'cert-state-notfound'];
function showCertState(id) {
  CERT_STATES.forEach(s => $(s).classList.toggle('hidden', s !== id));
}

// BACK TO HOME buttons inside cert tab → back to form
['certBackHomeBtn','certBackHomeBtn2'].forEach(id => {
  $(id).addEventListener('click', () => showCertState('cert-state-form'));
});

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

    // Lookup — flexible matching (case-insensitive, whitespace-tolerant)
    const normalise = s => s.replace(/\s/g,'').toLowerCase();
    const record = CERT_BY_NO[certNo] ||
                   CERT_BY_NO[certNo.toUpperCase()] ||
                   Object.values(CERT_BY_NO).find(r =>
                     normalise(r.certificateNo) === normalise(certNo)
                   );

    const dateField   = type === 'death' ? record?.dateOfDeath : record?.dateOfBirth;
    const typeMatches = record && record.type.toLowerCase() === type.toLowerCase();
    const dateMatches = dateField && dateField.trim() === dob.trim();

    if (record && typeMatches && dateMatches) {
      // FOUND — populate table then show found state
      const isD = record.type === 'Death';
      $('certDataTable').innerHTML = [
        ['Name',           record.name],
        [isD ? 'Date Of Death' : 'Date Of Birth', isD ? record.dateOfDeath : record.dateOfBirth],
        ['Gender',         record.gender],
        ['Certificate No', record.certificateNo],
        ['Date Of Issue',  record.dateOfIssue]
      ].map(([l,v]) => `<tr><td>${esc(l)}</td><td>${esc(v)}</td></tr>`).join('');

      $('certDownloadBtn')._certData = record;
      showCertState('cert-state-found');
    } else {
      showCertState('cert-state-notfound');
    }
  }, 1400);
});

// ── CERT DOWNLOAD ─────────────────────────────────────────────────────────────
$('certDownloadBtn').addEventListener('click', function () {
  const r = this._certData;
  if (!r) return;
  generateCertPrint(r);
});
