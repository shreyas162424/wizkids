// ============================================================
// DATA LAYER: db.js  (client-side)
// In-memory cache populated once from GET /api/init.
//
// GKDatabase singleton:
//   init()     – async; fetch full snapshot from server, populate _c.
//   refresh()  – async; re-fetch and merge (called by mentor SSE handler).
//   _post()    – fire-and-forget write to a server API endpoint.
//   getCache() – returns the raw _c cache object (used by session-store.js).
//
// session-store.js reads all data from _c (synchronous).
// session-store.js writes update _c immediately, then fire _post() async.
// ============================================================

const GKDatabase = (() => {
  // ── Internal cache ────────────────────────────────────────────────────────
  // Populated by init() / refresh(). Structure mirrors the /api/init response.
  const _c = {
    authSession:          { userId: null },
    users:                {},
    xp:                   {},
    activeSessions:       {},
    subtopicCompletions:  {},   // { [userId]: [{key, completedAt}] }
    topicCompletions:     {},   // { [userId]: [topicId] }
    subtopicScores:       {},   // { [userId]: { [subtopicKey]: {score,total,pct,completedAt} } }
    assessmentAttempts:   {},   // { [userId]: { [topicKey]: [attempt] } }
    mentorNotes:          {},   // { [userId]: [note] }
    mentorRewards:        {},   // { [userId]: [reward] }
    topicLocks:           {},   // { [userId]: { [topicKey]: 0|1 } }
    quickCheckResults:    {},   // { [userId]: [result] }
    holisticScores:       {},   // { [userId]: scoresObj | null }
    subtopicFeedback:     {},   // { [userId]: { [subtopicKey]: [fb] } }
    moduleFeedback:       {},   // { [userId]: { [topicKey]: [fb] } }
    demoOverrides:        {},   // { [userId]: { [topicKey]: override } }
    userExtras:           {},   // { [userId]: extraObj }
    sessionHistory:       {},   // { [userId]: [sessionObj] }
    reviewRequests:       {},   // { [userId]: [request] }
    mentorMoodLog:        {},   // { [mentorId]: [moodObj] }
    learningPaths:        {},   // { [pathId]: { id, name, grade, topics[], ... } }
    studentLearningPaths: {}    // { [userId]: [{ pathId, pathName, isActive, ... }] }
  };

  let _ready = false;

  // ── Merge snapshot from server into _c ───────────────────────────────────

  function _merge(snapshot) {
    Object.assign(_c.authSession,        snapshot.authSession        || {});
    Object.assign(_c.users,              snapshot.users              || {});
    Object.assign(_c.xp,                 snapshot.xp                 || {});
    Object.assign(_c.activeSessions,     snapshot.activeSessions     || {});
    Object.assign(_c.subtopicCompletions,snapshot.subtopicCompletions|| {});
    Object.assign(_c.topicCompletions,   snapshot.topicCompletions   || {});
    Object.assign(_c.subtopicScores,     snapshot.subtopicScores     || {});
    Object.assign(_c.assessmentAttempts, snapshot.assessmentAttempts || {});
    Object.assign(_c.mentorNotes,        snapshot.mentorNotes        || {});
    Object.assign(_c.mentorRewards,      snapshot.mentorRewards      || {});
    Object.assign(_c.topicLocks,         snapshot.topicLocks         || {});
    Object.assign(_c.quickCheckResults,  snapshot.quickCheckResults  || {});
    Object.assign(_c.holisticScores,     snapshot.holisticScores     || {});
    Object.assign(_c.subtopicFeedback,   snapshot.subtopicFeedback   || {});
    Object.assign(_c.moduleFeedback,     snapshot.moduleFeedback     || {});
    Object.assign(_c.demoOverrides,      snapshot.demoOverrides      || {});
    Object.assign(_c.userExtras,         snapshot.userExtras         || {});
    Object.assign(_c.sessionHistory,     snapshot.sessionHistory     || {});
    Object.assign(_c.reviewRequests,     snapshot.reviewRequests     || {});
    Object.assign(_c.mentorMoodLog,        snapshot.mentorMoodLog        || {});
    Object.assign(_c.learningPaths,        snapshot.learningPaths        || {});
    Object.assign(_c.studentLearningPaths, snapshot.studentLearningPaths || {});
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Call once before app code runs. Fetches full state from server. */
  async function init() {
    if (_ready) return;
    try {
      const res      = await fetch('/api/init');
      const snapshot = await res.json();
      _merge(snapshot);
      _ready = true;
      console.log('[GKDatabase] cache loaded from server');
    } catch (e) {
      console.error('[GKDatabase] init failed — app may not work correctly:', e);
    }
  }

  /**
   * Re-fetch full snapshot from server and merge into cache.
   * Called by mentor-app.js EventSource 'update' handler so the mentor
   * sees fresh student data after any write by a student client.
   */
  async function refresh() {
    try {
      const res      = await fetch('/api/init');
      const snapshot = await res.json();
      _merge(snapshot);
    } catch (e) {
      console.warn('[GKDatabase] refresh failed:', e);
    }
  }

  /**
   * Fire-and-forget POST to a server API endpoint.
   * session-store.js calls this after updating the local cache.
   * Returns the fetch Promise so callers can await if needed (they usually don't).
   */
  function _post(url, data) {
    return fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    }).catch(e => console.warn('[GKDatabase] write error:', url, e));
  }

  /** Returns the raw cache object. Used exclusively by session-store.js. */
  function getCache() { return _c; }

  return { init, refresh, _post, getCache };
})();
