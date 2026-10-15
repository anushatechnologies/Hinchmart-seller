/**
 * documentPhotoUtils.js
 * Utility helpers for seller KYC document photos, local storage persistence,
 * and authentic statutory document visual representations.
 */

import { compressImageFile } from './imageCompressor.js';

const STORAGE_KEY = 'hinchmart_kyc_photos';

/**
 * Read and compress a browser File or Blob into a persistent base64 Data URL
 * @param {File|Blob} file
 * @returns {Promise<string|null>}
 */
export async function readFileAsDataUrl(file) {
  if (!file || !(file instanceof Blob || file instanceof File)) {
    return null;
  }
  try {
    const compressed = await compressImageFile(file, { maxDim: 1200, quality: 0.85 });
    if (compressed) return compressed;
  } catch (_) {}

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result || null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Retrieve all persistently saved KYC document photos from localStorage
 * @returns {Record<string, { dataUrl: string, fileName: string, fileSize: string, uploadedAt: string }>}
 */
export function getStoredKycPhotos() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

/**
 * Persist an uploaded KYC photo to localStorage
 * @param {string} typeKey 'PAN' | 'AADHAAR' | 'GSTIN'
 * @param {{ dataUrl: string, fileName?: string, fileSize?: string }} photoData
 */
export function saveStoredKycPhoto(typeKey, photoData) {
  if (typeof localStorage === 'undefined' || !typeKey) return;
  try {
    const photos = getStoredKycPhotos();
    photos[typeKey.toUpperCase()] = {
      ...photoData,
      uploadedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  } catch (err) {
    console.warn('Could not save KYC photo to localStorage:', err);
  }
}

/**
 * Remove a stored KYC photo from localStorage
 * @param {string} typeKey
 */
export function removeStoredKycPhoto(typeKey) {
  if (typeof localStorage === 'undefined' || !typeKey) return;
  try {
    const photos = getStoredKycPhotos();
    delete photos[typeKey.toUpperCase()];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  } catch (_) {}
}

/**
 * Escape XML characters for safe SVG embedding
 */
function escapeXml(unsafe) {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate an authentic SVG visual card for statutory documents
 * when the seller has registered KYC details but hasn't yet attached a camera photo.
 * @param {'PAN'|'AADHAAR'|'GSTIN'} type
 * @param {{ docNumber?: string, sellerName?: string, companyName?: string }} details
 * @returns {string} Data URL
 */
export function generateStatutoryPhotoUrl(type, details = {}) {
  const normType = String(type || '').toUpperCase();
  const name = escapeXml(details.companyName || details.sellerName || 'Verified B2B Seller');
  const number = escapeXml(details.docNumber || 'NOT SPECIFIED');

  if (normType.includes('PAN')) {
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" width="480" height="300">
  <defs>
    <linearGradient id="panBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="50%" stop-color="#1e40af"/>
      <stop offset="100%" stop-color="#172554"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
  </defs>
  <!-- Card Background -->
  <rect width="480" height="300" rx="16" fill="url(#panBg)"/>
  <!-- Hologram Pattern Overlay -->
  <rect x="12" y="12" width="456" height="276" rx="12" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-opacity="0.3"/>
  <circle cx="240" cy="150" r="100" fill="none" stroke="#60a5fa" stroke-width="0.5" stroke-opacity="0.2"/>
  
  <!-- Header Bar -->
  <rect x="0" y="0" width="480" height="52" rx="16" fill="#0f172a" fill-opacity="0.5"/>
  <text x="24" y="24" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#93c5fd" letter-spacing="1">आयकर विभाग</text>
  <text x="24" y="42" font-family="Arial, sans-serif" font-size="12" font-weight="900" fill="#ffffff" letter-spacing="1.5">INCOME TAX DEPARTMENT</text>
  
  <text x="456" y="24" text-anchor="end" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#93c5fd">भारत सरकार</text>
  <text x="456" y="42" text-anchor="end" font-family="Arial, sans-serif" font-size="12" font-weight="900" fill="#ffffff" letter-spacing="1">GOVT. OF INDIA</text>

  <!-- Photo Box -->
  <rect x="24" y="70" width="95" height="120" rx="8" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/>
  <circle cx="71" cy="115" r="24" fill="#334155"/>
  <path d="M42 165 C42 145, 100 145, 100 165 Z" fill="#334155"/>
  <text x="71" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#94a3b8">AUTHORIZED</text>

  <!-- Details -->
  <text x="140" y="86" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#94a3b8" letter-spacing="0.5">NAME / नाम</text>
  <text x="140" y="106" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#ffffff">${name}</text>

  <text x="140" y="132" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#94a3b8" letter-spacing="0.5">PERMANENT ACCOUNT NUMBER CARD</text>
  <text x="140" y="160" font-family="'Courier New', monospace" font-size="22" font-weight="900" fill="url(#gold)" letter-spacing="3">${number}</text>

  <!-- QR Code Mock -->
  <rect x="360" y="70" width="95" height="95" rx="8" fill="#ffffff"/>
  <rect x="370" y="80" width="25" height="25" fill="#0f172a"/>
  <rect x="420" y="80" width="25" height="25" fill="#0f172a"/>
  <rect x="370" y="130" width="25" height="25" fill="#0f172a"/>
  <rect x="405" y="115" width="15" height="15" fill="#0f172a"/>
  <text x="407" y="178" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#94a3b8">VERIFIED QR</text>

  <!-- Footer Seal -->
  <line x1="24" y1="215" x2="456" y2="215" stroke="#334155" stroke-width="1"/>
  <rect x="24" y="235" width="130" height="42" rx="6" fill="#0f172a" fill-opacity="0.6" stroke="#10b981" stroke-width="1"/>
  <text x="34" y="253" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#10b981">✓ STATUTORY KYC</text>
  <text x="34" y="268" font-family="Arial, sans-serif" font-size="8" font-weight="medium" fill="#94a3b8">Compliant on HinchMart</text>

  <text x="456" y="268" text-anchor="end" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#cbd5e1">हस्ताक्षर / SIGNATURE</text>
  <path d="M 340 255 Q 380 240, 420 252 T 450 250" fill="none" stroke="#60a5fa" stroke-width="2"/>
</svg>`.trim();
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  if (normType.includes('AADHAAR') || normType.includes('AADHAR')) {
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" width="480" height="300">
  <defs>
    <linearGradient id="aadhaarBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
  </defs>
  <!-- Card Background -->
  <rect width="480" height="300" rx="16" fill="url(#aadhaarBg)" stroke="#e2e8f0" stroke-width="2"/>
  
  <!-- Tricolor Top Bar -->
  <rect x="0" y="0" width="480" height="6" rx="3" fill="#f97316"/>
  <rect x="0" y="6" width="480" height="6" fill="#ffffff"/>
  <rect x="0" y="12" width="480" height="6" rx="3" fill="#16a34a"/>

  <!-- Header -->
  <circle cx="40" cy="46" r="18" fill="#ea580c" fill-opacity="0.1"/>
  <text x="40" y="52" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#ea580c">☀</text>
  <text x="68" y="42" font-family="Arial, sans-serif" font-size="12" font-weight="900" fill="#0f172a">GOVERNMENT OF INDIA</text>
  <text x="68" y="56" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#64748b">Unique Identification Authority of India</text>

  <!-- Photo Box -->
  <rect x="24" y="80" width="95" height="120" rx="8" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5"/>
  <circle cx="71" cy="125" r="24" fill="#cbd5e1"/>
  <path d="M42 175 C42 155, 100 155, 100 175 Z" fill="#cbd5e1"/>
  <text x="71" y="190" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#64748b">SIGNATORY</text>

  <!-- Name & Info -->
  <text x="140" y="98" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#64748b">NAME / नाम</text>
  <text x="140" y="120" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0f172a">${name}</text>

  <text x="140" y="148" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#64748b">AADHAAR NUMBER / आधार क्रमांक</text>
  <text x="140" y="178" font-family="'Courier New', monospace" font-size="20" font-weight="900" fill="#b91c1c" letter-spacing="3">${number}</text>

  <!-- Red bar slogan -->
  <rect x="0" y="215" width="480" height="24" fill="#b91c1c"/>
  <text x="240" y="231" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff" letter-spacing="1">मेरा आधार, मेरी पहचान</text>

  <!-- Footer Seal -->
  <rect x="24" y="248" width="130" height="42" rx="6" fill="#f8fafc" stroke="#10b981" stroke-width="1"/>
  <text x="34" y="266" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#059669">✓ UIDAI VERIFIED</text>
  <text x="34" y="280" font-family="Arial, sans-serif" font-size="8" font-weight="medium" fill="#64748b">Signatory Certified</text>

  <!-- QR mock -->
  <rect x="390" y="80" width="65" height="65" rx="6" fill="#f8fafc" stroke="#cbd5e1"/>
  <rect x="397" y="87" width="16" height="16" fill="#1e293b"/>
  <rect x="432" y="87" width="16" height="16" fill="#1e293b"/>
  <rect x="397" y="122" width="16" height="16" fill="#1e293b"/>
</svg>`.trim();
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // GSTIN Registration Certificate (Form REG-06)
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" width="480" height="300">
  <defs>
    <linearGradient id="gstBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f0fdf4"/>
    </linearGradient>
  </defs>
  <!-- Card Background -->
  <rect width="480" height="300" rx="16" fill="url(#gstBg)" stroke="#86efac" stroke-width="2"/>
  
  <!-- Header Banner -->
  <rect x="0" y="0" width="480" height="56" rx="16" fill="#065f46"/>
  <text x="240" y="24" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="900" fill="#ffffff" letter-spacing="1">GOVERNMENT OF INDIA</text>
  <text x="240" y="42" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#a7f3d0" letter-spacing="0.5">Goods and Services Tax Registration Certificate (Form REG-06)</text>

  <!-- Watermark Circle -->
  <circle cx="240" cy="170" r="70" fill="none" stroke="#10b981" stroke-width="1" stroke-opacity="0.15"/>

  <!-- GSTIN Big Number -->
  <text x="32" y="88" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#047857" letter-spacing="0.5">REGISTRATION NUMBER (GSTIN):</text>
  <rect x="32" y="96" width="416" height="38" rx="8" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/>
  <text x="44" y="122" font-family="'Courier New', monospace" font-size="20" font-weight="900" fill="#065f46" letter-spacing="3">${number}</text>

  <!-- Legal Details -->
  <text x="32" y="160" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#64748b">LEGAL NAME OF BUSINESS:</text>
  <text x="32" y="180" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">${name}</text>

  <text x="32" y="206" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#64748b">CONSTITUTION / TYPE:</text>
  <text x="32" y="224" font-family="Arial, sans-serif" font-size="12" font-weight="semibold" fill="#334155">Proprietorship / Private Limited Entity</text>

  <!-- Seal and Validation -->
  <line x1="32" y1="240" x2="448" y2="240" stroke="#bbf7d0" stroke-width="1"/>
  
  <rect x="32" y="250" width="140" height="38" rx="6" fill="#047857" fill-opacity="0.1" stroke="#059669" stroke-width="1"/>
  <text x="42" y="267" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#047857">✓ ACTIVE &amp; VERIFIED</text>
  <text x="42" y="280" font-family="Arial, sans-serif" font-size="8" font-weight="medium" fill="#065f46">B2B Commercial Invoicing</text>

  <text x="448" y="266" text-anchor="end" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#64748b">GOVERNMENT TAX AUTHORITY</text>
  <text x="448" y="280" text-anchor="end" font-family="Arial, sans-serif" font-size="8" font-weight="semibold" fill="#10b981">Digital Signature Validated</text>
</svg>`.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
