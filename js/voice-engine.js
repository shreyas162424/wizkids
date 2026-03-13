// ============================================================
// VOICE LAYER: voice-engine.js
// Shared TTS engine for Krishna (Student) and Narayana (Mentor).
// Handles speech synthesis with India-localized voices.
// ============================================================

const GKVoice = (() => {
  let _enabled = true;
  let _unlocked = false;  // true after first user gesture
  let _speakTimer = null;
  let _lastText = null;   // last message spoken — used by toggle/replay
  let _cachedVoices = [];

  // Pre-load voices — Chrome populates them asynchronously
  function _loadVoices() {
    if (typeof speechSynthesis !== 'undefined') {
      _cachedVoices = speechSynthesis.getVoices();
    }
  }
  
  if (typeof speechSynthesis !== 'undefined') {
    _loadVoices();
    speechSynthesis.addEventListener('voiceschanged', _loadVoices);
  }

  // Strip emoji and HTML tags so TTS gets clean readable text
  function _cleanText(str) {
    return (str || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/[\u{1F000}-\u{1FAFF}]/gu, '')
      .replace(/[🕉️🙏🌸📚🎓✅⭐🌟💫✨🏆🎮🔔🎉🪷→]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  // Build a configured utterance with the best available voice
  function _buildUtt(text) {
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.88;
    utt.pitch = 1.05;
    utt.volume = 1.0;
    const voices = _cachedVoices.length ? _cachedVoices : speechSynthesis.getVoices();
    const pick =
      voices.find(v => /en-in/i.test(v.lang)) ||
      voices.find(v => /india/i.test(v.name)) ||
      voices.find(v => /en/i.test(v.lang)) ||
      voices[0];
    if (pick) utt.voice = pick;
    
    // Support visual feedback if elements exist
    utt.onstart = () => {
      document.querySelectorAll('.krishna-img-box, .krishna-initiator-wrap, .narayana-avatar-container')
        .forEach(el => el.classList.add('agent-speaking'));
    };
    utt.onend = utt.onerror = () => {
      document.querySelectorAll('.krishna-img-box, .krishna-initiator-wrap, .narayana-avatar-container')
        .forEach(el => el.classList.remove('agent-speaking'));
    };
    return utt;
  }

  function _onFirstGesture() {
    if (_unlocked || typeof speechSynthesis === 'undefined') return;
    _unlocked = true;
  }

  // Attach gesture listeners globally if we are in a browser context
  if (typeof document !== 'undefined') {
    document.addEventListener('click', _onFirstGesture, { capture: true });
    document.addEventListener('keydown', _onFirstGesture, { capture: true });
    document.addEventListener('touchstart', _onFirstGesture, { capture: true, passive: true });
  }

  function speak(text) {
    if (!_enabled || typeof speechSynthesis === 'undefined' || !_unlocked) return;
    const clean = _cleanText(text);
    if (!clean) return;
    _lastText = clean;
    clearTimeout(_speakTimer);

    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      _speakTimer = setTimeout(() => {
        _speakTimer = null;
        speechSynthesis.resume();
        speechSynthesis.speak(_buildUtt(clean));
      }, 150);
    } else {
      speechSynthesis.resume();
      speechSynthesis.speak(_buildUtt(clean));
    }
  }

  function replay() {
    if (typeof speechSynthesis === 'undefined') return;
    _unlocked = true;
    _enabled = true;
    const text = _lastText || 'Namaste! I am here to guide you.';
    speak(text);
  }

  function toggle(btn) {
    if (_enabled) {
      _enabled = false;
      clearTimeout(_speakTimer);
      speechSynthesis.cancel();
      if (btn) btn.textContent = '🔇';
    } else {
      _enabled = true;
      if (btn) btn.textContent = '🔊';
      replay();
    }
  }

  function isSpeaking() { return typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking; }

  return { speak, replay, toggle, isSpeaking };
})();
