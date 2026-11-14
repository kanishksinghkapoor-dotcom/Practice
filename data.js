/* ============================================================
   data.js — Shared Certificate Database
   Import this in both index.html and certificate.html
   ============================================================ */

const CERT_DB = {
  "WB-CERT-D2026406333": {
    type:          "Death",
    name:          "PURNIMA KAPOOR",
    dateOfDeath:   "06/11/2026",
    gender:        "Female",
    certificateNo: "D/2026/406333",
    dateOfIssue:   "06/11/2026"
  }
  /* Add more entries here:
  "WB-CERT-B2026123456": {
    type:          "Birth",
    name:          "EXAMPLE NAME",
    dateOfBirth:   "01/01/2026",
    gender:        "Male",
    certificateNo: "B/2026/123456",
    dateOfIssue:   "02/01/2026"
  }
  */
};

// Index by certificate number for the cert-no tab (case-insensitive via normalise())
const CERT_BY_NO = {};
Object.entries(CERT_DB).forEach(([key, rec]) => {
  CERT_BY_NO[rec.certificateNo] = key;
  CERT_BY_NO[rec.certificateNo.toLowerCase()] = key;
});

// Normalise helper shared across pages
function normaliseCertNo(s) {
  return s.replace(/\s/g, '').toLowerCase();
}

function lookupByNo(inputNo) {
  const n = normaliseCertNo(inputNo);
  // Try direct key first
  const key = Object.keys(CERT_BY_NO).find(k => normaliseCertNo(k) === n);
  return key ? CERT_DB[CERT_BY_NO[key]] : null;
}
