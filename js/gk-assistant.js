// ============================================================
// gk-assistant.js — selectable AI guide (Krishna, Radha, Rama, Hanuman)
// Images: wizkids/img/{id}-{expression}.png via config/ai-assistants.json
// ============================================================

const GKAssistant = (() => {
  const STORAGE_PREFIX = 'gk_ai_assistant';
  const EXPRESSIONS = ['guide', 'happy', 'thinking', 'concerned', 'proud', 'exited'];
  const CACHE_BUST = 'v=assistants7';

  const STANDARD_LEGACY = (id) => ({
    guide: `${id}-guide.png`,
    happy: `${id}-happy.png`,
    thinking: `${id}-thinking.png`,
    concerned: `${id}-concerned.png`,
    proud: `${id}-happy.png`,
    exited: `${id}-happy.png`
  });

  const DEFAULTS = {
    defaultAssistantId: 'krishna',
    assistants: [
      {
        id: 'krishna',
        name: 'Krishna',
        subtitle: 'Your Divine Guide',
        emoji: '🪈',
        avatarDir: 'avatars/krishna',
        legacyFiles: {
          guide: 'krishna-guide.png',
          happy: 'krishna-happy.png',
          thinking: 'krishna-thinking.png',
          concerned: 'krishna-concerned.png',
          proud: 'krishna-proud1.png',
          exited: 'krishna-exited1.png'
        }
      },
      {
        id: 'radha',
        name: 'Radha',
        subtitle: 'Grace & Devotion',
        emoji: '🌸',
        avatarDir: 'avatars/radha',
        legacyFiles: STANDARD_LEGACY('radha')
      },
      {
        id: 'rama',
        name: 'Rama',
        subtitle: 'The Noble Prince',
        emoji: '👑',
        avatarDir: 'avatars/rama',
        legacyFiles: STANDARD_LEGACY('rama')
      },
      {
        id: 'hanuman',
        name: 'Hanuman',
        subtitle: 'The Devoted Guardian',
        emoji: '🙏',
        avatarDir: 'avatars/hanuman',
        legacyFiles: STANDARD_LEGACY('hanuman')
      }
    ]
  };

  let _config = null;
  let _selectedId = DEFAULTS.defaultAssistantId;
  let _userId = null;

  function _storageKey() {
    return _userId ? `${STORAGE_PREFIX}_${_userId}` : STORAGE_PREFIX;
  }

  function init(userId) {
    _userId = userId || null;
    const cfg = getConfigSync();
    if (cfg.defaultAssistantId && getById(cfg.defaultAssistantId)) {
      _selectedId = cfg.defaultAssistantId;
    }
    if (typeof window.GKAgent !== 'undefined' && GKAgent.setStudentAssistant) {
      GKAgent.setStudentAssistant(_selectedId);
    }
    return _selectedId;
  }

  function setSelected(id) {
    const a = getById(id);
    if (!a) return false;
    _selectedId = a.id;
    try {
      localStorage.setItem(_storageKey(), _selectedId);
    } catch (_) { /* ignore */ }
    if (typeof window.GKAgent !== 'undefined' && GKAgent.setStudentAssistant) {
      GKAgent.setStudentAssistant(_selectedId);
    }
    return true;
  }

  function getSelectedId() {
    return _selectedId;
  }

  function getSelected() {
    const list = (_config && _config.assistants) ? _config.assistants : DEFAULTS.assistants;
    return getById(_selectedId) || list[0];
  }

  function list() {
    return (_config && _config.assistants) ? _config.assistants.slice() : DEFAULTS.assistants.slice();
  }

  function getById(id) {
    return list().find(a => a.id === id) || null;
  }

  function screenToExpression(screen, opts = {}) {
    if (opts.activeNotificationXp) return 'happy';
    switch (screen) {
      case 'mood':
        return 'thinking';
      case 'dashboard':
      case 'modules':
      case 'reviewRequest':
      case 'summary':
        return 'happy';
      case 'learning':
      case 'ancientGame':
      case 'subtopics':
        return 'guide';
      case 'assessment':
      case 'feedback':
      case 'subtopicFeedback':
      case 'moduleFeedback':
        return 'concerned';
      default:
        return 'guide';
    }
  }

  function _legacyFile(assistant, expression) {
    const map = assistant.legacyFiles;
    if (map && map[expression]) return map[expression];
    if (map && map.guide) return map.guide;
    if (assistant.id === 'krishna') {
      return 'krishna-guide.png';
    }
    return null;
  }

  function getImagePath(assistantId, expression, assistantOverride) {
    const assistant = assistantOverride || getById(assistantId) || getSelected();
    const expr = EXPRESSIONS.includes(expression) ? expression : 'guide';
    const configured = _legacyFile(assistant, expr);
    const dirFallback = `img/${assistant.avatarDir}/${expr}.png`;

    if (configured) {
      return {
        primary: `img/${configured}`,
        fallback: dirFallback,
        cache: CACHE_BUST
      };
    }
    return { primary: dirFallback, fallback: 'img/krishna-guide.png', cache: CACHE_BUST };
  }

  function _url(path, cache) {
    return `${path}?${cache}`;
  }

  function avatarUrlForScreen(screen, opts = {}) {
    const assistant = getSelected();
    const expr = screenToExpression(screen, opts);
    const { primary, fallback, cache } = getImagePath(assistant.id, expr, assistant);
    return {
      src: _url(primary, cache),
      fallback: _url(fallback, cache),
      alt: assistant.name,
      expression: expr,
      assistant
    };
  }

  function avatarUrlForExpression(expression) {
    const assistant = getSelected();
    const { primary, fallback, cache } = getImagePath(assistant.id, expression, assistant);
    return {
      src: _url(primary, cache),
      fallback: _url(fallback, cache),
      alt: assistant.name
    };
  }

  function thumbnailUrl(assistantId) {
    const a = getById(assistantId);
    if (!a) return _url('img/krishna-guide.png', CACHE_BUST);
    const { primary, cache } = getImagePath(a.id, 'guide', a);
    return _url(primary, cache);
  }

  function thumbnailFallbackUrl(assistantId) {
    const a = getById(assistantId);
    if (!a) return _url('img/krishna-guide.png', CACHE_BUST);
    const { fallback, cache } = getImagePath(a.id, 'guide', a);
    return _url(fallback, cache);
  }

  async function loadConfig() {
    try {
      const res = await fetch('/api/ai-assistants');
      if (res.ok) {
        _config = await res.json();
        if (_config.defaultAssistantId && getById(_config.defaultAssistantId)) {
          _selectedId = _config.defaultAssistantId;
        }
        return _config;
      }
    } catch (_) { /* use defaults */ }
    _config = DEFAULTS;
    return _config;
  }

  function getConfigSync() {
    return _config || DEFAULTS;
  }

  return {
    init,
    setSelected,
    getSelectedId,
    getSelected,
    getById,
    list,
    screenToExpression,
    avatarUrlForScreen,
    avatarUrlForExpression,
    thumbnailUrl,
    thumbnailFallbackUrl,
    loadConfig,
    getConfigSync,
    EXPRESSIONS
  };
})();
