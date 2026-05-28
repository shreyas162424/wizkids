// ============================================================
// CLIENT: gk-branding.js
// Applies school name + logo from config/branding.json (via /api/init or /api/branding).
// ============================================================

const GKBranding = (() => {
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
    smeGuideHeaderSubtitle: 'Mentor Teaching Guide'
  };

  let _b = { ...DEFAULTS };
  let _ready = false;

  function _applyDom() {
    document.querySelectorAll('[data-gk-brand="schoolName"]').forEach(el => {
      el.textContent = _b.schoolName;
    });
    document.querySelectorAll('[data-gk-brand="tagline"]').forEach(el => {
      el.textContent = _b.tagline;
    });
    document.querySelectorAll('[data-gk-brand="portalHero"]').forEach(el => {
      el.textContent = _b.portalHero;
    });
    document.querySelectorAll('[data-gk-brand="logo"]').forEach(el => {
      if (el.tagName === 'IMG') {
        el.src = _b.logoPath;
        el.alt = _b.schoolName;
      }
    });
    const title = document.querySelector('title');
    if (title && !title.dataset.gkBrandLock) {
      const base = title.textContent.split('—').pop().trim() || title.textContent;
      if (base && _b.schoolName) title.textContent = `${_b.schoolName} — ${base}`;
    }
  }

  function initFromSnapshot(snapshot) {
    if (snapshot && snapshot.branding) {
      _b = { ...DEFAULTS, ...snapshot.branding };
      _ready = true;
      _applyDom();
    }
  }

  async function init() {
    if (_ready) return _b;
    try {
      const res = await fetch('/api/branding');
      if (res.ok) {
        _b = { ...DEFAULTS, ...(await res.json()) };
        _ready = true;
        _applyDom();
      }
    } catch (e) {
      console.warn('[GKBranding] using defaults', e);
    }
    return _b;
  }

  function isReady() { return _ready; }
  function get(key) { return _b[key] ?? DEFAULTS[key] ?? ''; }
  function schoolName() { return _b.schoolName; }
  function tagline() { return _b.tagline; }
  function logoPath() { return _b.logoPath; }
  function loginSubtitle() { return _b.loginSubtitle; }
  function loginButtonText() { return _b.loginButtonText; }

  return {
    init, initFromSnapshot, isReady, get,
    schoolName, tagline, logoPath, loginSubtitle, loginButtonText
  };
})();
