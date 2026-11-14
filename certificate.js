/* ============================================================
   certificate.js — Renders a single certificate entry page
   URL format: certificate.html?id=WB-CERT-D2026406333
   ============================================================ */

(function () {
  const esc = s => String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  // ── 1. Parse id from URL ──────────────────────────────────────────────────
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id') || '';
  const record = CERT_DB[id] || null;

  // ── 2. Build the canonical URL for this certificate ───────────────────────
  const certURL = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(id)}`;

  // ── 3. Render ─────────────────────────────────────────────────────────────
  const container = document.getElementById('certContent');

  if (!record) {
    container.innerHTML = `
      <div class="not-found-wrap">
        <div class="not-found-icon"><i class="fas fa-xmark"></i></div>
        <p class="not-found-title">Entry Not Found</p>
        <p class="not-found-sub">
          No certificate matching <code style="background:#fafafa;padding:2px 6px;border-radius:3px;font-size:0.82em;">${esc(id || '(no id provided)')}</code>
          was found in the registry. Please check the QR code or URL and try again.
        </p>
        <a href="./index.html" style="margin-top:8px;">
          <button class="btn-cert-action home"><i class="fas fa-house"></i> BACK TO HOME</button>
        </a>
      </div>`;
    document.title = 'Entry Not Found – Janma Mrityu Tathya';
    return;
  }

  // ── 4. Build data rows ────────────────────────────────────────────────────
  const isD = record.type === 'Death';
  document.title = `${record.name} – Certificate – Janma Mrityu Tathya`;

  const rows = [
    ['Name',                              record.name],
    [isD ? 'Date Of Death' : 'Date Of Birth', isD ? record.dateOfDeath : record.dateOfBirth],
    ['Gender',                            record.gender],
    ['Certificate No.',                   record.certificateNo],
    ['Date Of Issue',                     record.dateOfIssue],
  ].map(([label, val]) => `
    <div class="cert-row">
      <span class="cert-row-label">${esc(label)}</span>
      <span class="cert-row-value">${esc(val)}</span>
    </div>`).join('');

  container.innerHTML = `
    <!-- Status banner -->
    <div class="cert-status-bar">
      <i class="fas fa-circle-check"></i> VERIFIED CERTIFICATE
    </div>

    <!-- Body -->
    <div class="cert-body">
      <div class="cert-title-row">
        <span class="cert-type-badge ${record.type.toLowerCase()}">${esc(record.type)} Certificate</span>
        <span class="cert-id">ID: ${esc(id)}</span>
      </div>
      <div class="cert-data-block">${rows}</div>
    </div>

    <!-- Action buttons -->
    <div class="cert-actions">
      <button class="btn-cert-action print" onclick="window.print()">
        <i class="fas fa-print"></i> PRINT
      </button>
      <button class="btn-cert-action download" id="dlBtn">
        <i class="fas fa-download"></i> DOWNLOAD CERTIFICATE
      </button>
      <a href="./index.html">
        <button class="btn-cert-action home">
          <i class="fas fa-house"></i> BACK TO HOME
        </button>
      </a>
    </div>

    <!-- QR Code for this URL -->
    <div class="cert-qr-section">
      <p class="cert-qr-label" style="font-weight:600;color:#555;font-size:0.8rem;">
        <i class="fas fa-qrcode"></i>&nbsp; Certificate QR Code
      </p>
      <canvas id="certQrCanvas"></canvas>
      <p class="cert-qr-label">Scan this code to open the certificate directly</p>
      <div class="cert-url-box">${esc(certURL)}</div>
    </div>`;

  // ── 5. Generate QR code encoding this page's URL ──────────────────────────
  if (window.QRCode) {
    QRCode.toCanvas(document.getElementById('certQrCanvas'), certURL, {
      width: 200, margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' }
    });
  }

  // ── 6. Download handler (printable window) ────────────────────────────────
  document.getElementById('dlBtn').addEventListener('click', () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Certificate – ${esc(record.certificateNo)}</title>
  <style>
    body { font-family:'Segoe UI',Arial,sans-serif; margin:40px; color:#222; }
    h1 { text-align:center; font-size:1.1rem; letter-spacing:1px; margin-bottom:4px; }
    h2 { text-align:center; font-size:0.88rem; color:#555; margin-bottom:28px; }
    .seal { text-align:center; font-size:3rem; margin-bottom:10px; }
    .badge { display:inline-block; background:#43a047; color:#fff; border-radius:4px; padding:4px 14px; font-size:0.78rem; margin-bottom:22px; }
    table { width:100%; border-collapse:collapse; margin:20px 0; }
    td { padding:10px 14px; border-bottom:1px solid #eee; font-size:0.9rem; }
    td:first-child { color:#666; width:40%; }
    td:last-child { font-weight:700; }
    .footer { text-align:center; margin-top:36px; font-size:0.72rem; color:#999; }
    @media print { body { margin:20px; } }
  </style>
</head>
<body>
  <div class="seal">🏛️</div>
  <h1>GOVERNMENT OF WEST BENGAL</h1>
  <h2>HEALTH &amp; FAMILY WELFARE DEPARTMENT<br>Janma Mrityu Tathya</h2>
  <div style="text-align:center"><span class="badge">✔ VERIFIED CERTIFICATE</span></div>
  <table>
    <tr><td>Certificate Type</td><td>${esc(record.type)} Certificate</td></tr>
    <tr><td>Name</td><td>${esc(record.name)}</td></tr>
    <tr><td>${isD ? 'Date Of Death' : 'Date Of Birth'}</td><td>${esc(isD ? record.dateOfDeath : record.dateOfBirth)}</td></tr>
    <tr><td>Gender</td><td>${esc(record.gender)}</td></tr>
    <tr><td>Certificate No.</td><td>${esc(record.certificateNo)}</td></tr>
    <tr><td>Date Of Issue</td><td>${esc(record.dateOfIssue)}</td></tr>
  </table>
  <div class="footer">
    Verify at: ${esc(certURL)}<br>
    Printed on: ${new Date().toLocaleDateString('en-IN')}
  </div>
</body>
</html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  });

})();
