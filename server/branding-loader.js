'use strict';
// Reads/writes config/branding.json — white-label logo + school name (no code changes).

const fs   = require('fs');
const path = require('path');

const BRANDING_PATH = process.env.BRANDING_PATH ||
  path.resolve(__dirname, '../config/branding.json');

const LOGO_DIR = path.resolve(__dirname, '../img');

const DEFAULTS = {
  schoolName: 'Gurukul',
  tagline: 'Personalized Learning',
  loginSubtitle: 'Your Personalized Learning Journey',
  loginButtonText: 'Enter Gurukul ✨',
  portalHero: 'AI-powered personalized learning. Choose your path below to begin the journey.',
  logoPath: 'img/wizkids-logo.png',
  mentorLoginSubtitle: 'Mentor Dashboard',
  mentorHeaderSubtitle: 'Mentor View',
  smeLoginTitle: 'Curated Content',
  smeLoginSubtitle: 'SME Review Portal',
  smeHeaderSubtitle: 'Curated Content',
  smeGuideHeaderSubtitle: 'Mentor Teaching Guide',
  setupPin: 'gurukul-setup'
};

function getBrandingPath() { return BRANDING_PATH; }

function readBranding() {
  let raw = {};
  if (fs.existsSync(BRANDING_PATH)) {
    try {
      raw = JSON.parse(fs.readFileSync(BRANDING_PATH, 'utf8'));
    } catch (e) {
      console.error('[GKBranding] parse error:', e.message);
    }
  }
  const merged = { ...DEFAULTS, ...raw };
  delete merged.setupPin;
  return merged;
}

function readBrandingFileRaw() {
  if (!fs.existsSync(BRANDING_PATH)) return { ...DEFAULTS };
  try {
    return JSON.parse(fs.readFileSync(BRANDING_PATH, 'utf8'));
  } catch (e) {
    return { ...DEFAULTS };
  }
}

function checkSetupPin(pin) {
  const file = readBrandingFileRaw();
  const expected = file.setupPin || DEFAULTS.setupPin;
  return pin && String(pin) === String(expected);
}

/** Merge updates into branding.json (setupPin required unless env BRANDING_OPEN=1). */
function writeBranding(updates, pin) {
  if (process.env.BRANDING_OPEN !== '1' && !checkSetupPin(pin)) {
    throw new Error('Invalid setup PIN');
  }
  const allowed = [
    'schoolName', 'tagline', 'loginSubtitle', 'loginButtonText', 'portalHero',
    'logoPath', 'mentorLoginSubtitle', 'mentorHeaderSubtitle',
    'smeLoginTitle', 'smeLoginSubtitle', 'smeHeaderSubtitle', 'smeGuideHeaderSubtitle',
    'setupPin'
  ];
  const current = readBrandingFileRaw();
  const next = { ...current };
  for (const key of allowed) {
    if (updates[key] !== undefined && updates[key] !== null) {
      next[key] = String(updates[key]).trim();
    }
  }
  fs.mkdirSync(path.dirname(BRANDING_PATH), { recursive: true });
  fs.writeFileSync(BRANDING_PATH, JSON.stringify(next, null, 2) + '\n', 'utf8');
  return readBranding();
}

/** Save uploaded logo; returns public path e.g. img/branding-logo.png */
function saveLogoFromBase64(dataUrl, pin) {
  if (process.env.BRANDING_OPEN !== '1' && !checkSetupPin(pin)) {
    throw new Error('Invalid setup PIN');
  }
  const m = String(dataUrl).match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!m) throw new Error('Invalid image data');
  const ext = normalizeImageExt(m[1]);
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 2 * 1024 * 1024) throw new Error('Image too large (max 2MB)');
  fs.mkdirSync(LOGO_DIR, { recursive: true });
  return saveLogoFile(buf, ext, pin);
}

function normalizeImageExt(mimeOrExt) {
  const e = String(mimeOrExt).toLowerCase().replace('svg+xml', 'svg');
  if (e === 'jpeg' || e === 'jpg') return 'jpg';
  if (['png', 'webp', 'svg', 'gif'].includes(e)) return e;
  return 'png';
}

/** Save raw image buffer from multipart upload */
function saveLogoFile(buffer, ext, pin) {
  if (process.env.BRANDING_OPEN !== '1' && !checkSetupPin(pin)) {
    throw new Error('Invalid setup PIN');
  }
  if (buffer.length > 2 * 1024 * 1024) throw new Error('Image too large (max 2MB)');
  const safeExt = normalizeImageExt(ext);
  fs.mkdirSync(LOGO_DIR, { recursive: true });
  const filename = `branding-logo.${safeExt}`;
  fs.writeFileSync(path.join(LOGO_DIR, filename), buffer);
  const logoPath = `img/${filename}`;
  writeBranding({ logoPath }, pin);
  return logoPath;
}

module.exports = {
  readBranding,
  readBrandingFileRaw,
  writeBranding,
  saveLogoFromBase64,
  saveLogoFile,
  getBrandingPath,
  checkSetupPin
};
