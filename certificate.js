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
      <button class="btn-cert-action download" id="dlBtn">
        <i class="fas fa-download"></i> DOWNLOAD CERTIFICATE
      </button>
      <a href="./index.html">
        <button class="btn-cert-action home">
          <i class="fas fa-house"></i> BACK TO HOME
        </button>
      </a>
    </div>`;


  // ── 5. Download handler — serves the attached PDF ────────────────────────
  document.getElementById('dlBtn').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = './D2026406333.pdf';
    a.download = 'D2026406333.pdf';
    a.click();
  });

})();
