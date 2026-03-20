// ============================================================
// VOICE LAYER: voice-engine.js
// ============================================================

const GKVoice = (() => {
  // Safe localStorage wrapper
  const _ls = {
    get: k    => { try { return localStorage.getItem(k); }  catch(_) { return null; } },
    set: (k,v)=> { try { localStorage.setItem(k, v); }      catch(_) {} }
  };

  let _enabled  = _ls.get('gk_voice') !== 'off';   // ON by default
  let _lastText = '';
  let _voices   = [];

  // Chrome loads voices asynchronously
  function _loadVoices() {
    if (typeof speechSynthesis === 'undefined') return;
    const v = speechSynthesis.getVoices();
    if (v.length) _voices = v;
  }
  if (typeof speechSynthesis !== 'undefined') {
    _loadVoices();
    speechSynthesis.addEventListener('voiceschanged', _loadVoices);
  }

  function _pickVoice() {
    const list = _voices.length ? _voices : (typeof speechSynthesis !== 'undefined' ? speechSynthesis.getVoices() : []);
    return list.find(v => /en-IN/i.test(v.lang))  ||
           list.find(v => /india/i.test(v.name))  ||
           list.find(v => /en-GB/i.test(v.lang))  ||
           list.find(v => /en/i.test(v.lang))     ||
           list[0] || null;
  }

  function _clean(str) {
    return (str || '')
      .replace(/<[^>]*>/g, ' ')                      // strip HTML tags
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')        // strip emoji
      .replace(/[🕉️🙏🌸📚🎓✅⭐🌟💫✨🏆🎮→]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function _avatarOn()  {
    document.querySelectorAll('.krishna-img-box,.krishna-initiator-wrap,.agent-avatar-wrap,.narayana-avatar-container')
      .forEach(el => el.classList.add('agent-speaking'));
  }
  function _avatarOff() {
    document.querySelectorAll('.krishna-img-box,.krishna-initiator-wrap,.agent-avatar-wrap,.narayana-avatar-container')
      .forEach(el => el.classList.remove('agent-speaking'));
  }

  // ── Core speak — MUST be called synchronously from user gesture ──
  // No setTimeout here: any delay breaks Chrome's autoplay policy.
  function speak(text) {
    if (!_enabled || typeof speechSynthesis === 'undefined') return;
    const clean = _clean(text);
    if (!clean) return;
    _lastText = clean;

    try {
      // Cancel any ongoing speech before starting new one
      speechSynthesis.cancel();

      const utt    = new SpeechSynthesisUtterance(clean);
      utt.rate     = 0.88;
      utt.pitch    = 1.05;
      utt.volume   = 1.0;
      const voice  = _pickVoice();
      if (voice) utt.voice = voice;

      utt.onstart  = _avatarOn;
      utt.onend    = _avatarOff;
      utt.onerror  = _avatarOff;

      speechSynthesis.speak(utt);   // synchronous — stays inside gesture chain
    } catch (e) {
      console.warn('[GKVoice]', e);
    }
  }

  // Replay last message (clicking Krishna avatar)
  function replay() {
    if (!_enabled) return;
    speak(_lastText || 'Namaste! I am here to guide you.');
  }

  // Toggle voice on/off — updates all buttons on the page
  function toggle() {
    _enabled = !_enabled;
    _ls.set('gk_voice', _enabled ? 'on' : 'off');

    if (!_enabled) {
      if (typeof speechSynthesis !== 'undefined') {
        try { speechSynthesis.cancel(); } catch(_) {}
      }
      _avatarOff();
    }

    const icon = _enabled ? '🔊' : '🔇';
    document.querySelectorAll('.krishna-voice-toggle').forEach(b => b.textContent = icon);

    if (_enabled) replay();
  }

  function isEnabled()  { return _enabled; }
  function isSpeaking() { return typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking; }

  return { speak, replay, toggle, isEnabled, isSpeaking };
})();
