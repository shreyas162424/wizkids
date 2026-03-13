// ============================================================
// DATA LAYER: session-store.js
// Persistent storage wrapper using localStorage.
// All read/write operations on session and user data go here.
// ============================================================

const GKStore = (() => {
  const KEYS = {
    CURRENT_USER: 'gk_current_user',
    USER_PROFILES: 'gk_user_profiles',
    SESSION_LOG: 'gk_session_log',
    CURRENT_SESSION: 'gk_current_session'
  };

  // ---------- User Auth ----------

  function saveCurrentUser(userId) {
    localStorage.setItem(KEYS.CURRENT_USER, userId);
  }

  function getCurrentUserId() {
    return localStorage.getItem(KEYS.CURRENT_USER);
  }

  function clearCurrentUser() {
    localStorage.removeItem(KEYS.CURRENT_USER);
    localStorage.removeItem(KEYS.CURRENT_SESSION);
  }

  // ---------- User Profiles (persisted XP, completed topics) ----------

  function getUserProfile(userId) {
    const profiles = JSON.parse(localStorage.getItem(KEYS.USER_PROFILES) || '{}');
    return profiles[userId] || null;
  }

  function saveUserProfile(userId, profileData) {
    const profiles = JSON.parse(localStorage.getItem(KEYS.USER_PROFILES) || '{}');
    profiles[userId] = { ...profiles[userId], ...profileData, updatedAt: new Date().toISOString() };
    localStorage.setItem(KEYS.USER_PROFILES, JSON.stringify(profiles));
    localStorage.setItem('gk_sync_ping', Date.now().toString());
  }

  function getTotalXP(userId) {
    const profile = getUserProfile(userId);
    return (profile && profile.totalXP) ? profile.totalXP : 0;
  }

  function addXPToUser(userId, xpAmount) {
    const profile = getUserProfile(userId) || { totalXP: 0, completedTopics: [] };
    profile.totalXP = (profile.totalXP || 0) + xpAmount;
    saveUserProfile(userId, profile);
    return profile.totalXP;
  }

  function markTopicComplete(userId, topicId) {
    if (!userId) return;
    const profile = getUserProfile(userId) || { id: userId, totalXP: 0, completedTopics: [] };
    if (!profile.completedTopics) profile.completedTopics = [];
    if (!profile.completedTopics.includes(topicId)) {
      profile.completedTopics.push(topicId);
    }
    saveUserProfile(userId, profile);
  }

  // ---------- Current Session ----------

  function startSession(userId, moodData) {
    const session = {
      userId,
      startTime: new Date().toISOString(),
      mood: moodData,
      xpEarned: 0,
      completedSubtopics: [],
      assessmentResults: {},
      feedback: null
    };
    localStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(session));
    return session;
  }

  function getSession() {
    return JSON.parse(localStorage.getItem(KEYS.CURRENT_SESSION) || 'null');
  }

  function updateSession(updates) {
    const session = getSession() || {};
    const updated = { ...session, ...updates };
    localStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(updated));
    localStorage.setItem('gk_sync_ping', Date.now().toString());
    return updated;
  }

  function addSessionXP(xpAmount) {
    const session = getSession() || { xpEarned: 0 };
    session.xpEarned = (session.xpEarned || 0) + xpAmount;
    localStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(session));
    return session.xpEarned;
  }

  function recordSubtopicComplete(subtopicId) {
    const session = getSession() || { completedSubtopics: [] };
    if (!session.completedSubtopics) session.completedSubtopics = [];
    if (!session.completedSubtopics.includes(subtopicId)) {
      session.completedSubtopics.push(subtopicId);
    }
    localStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(session));
    localStorage.setItem('gk_sync_ping', Date.now().toString());

    // Real-time mentor sync: also push immediately to the profile
    if (session.userId) {
      const profile = getUserProfile(session.userId) || {};
      if (!profile.completedSubtopics) profile.completedSubtopics = [];
      if (!profile.completedSubtopics.includes(subtopicId)) {
        profile.completedSubtopics.push(subtopicId);
        saveUserProfile(session.userId, profile);
      }
    }
  }

  function recordAssessmentResult(topicId, score, total) {
    const session = getSession() || { assessmentResults: {} };
    if (!session.assessmentResults) session.assessmentResults = {};
    const percentage = Math.round((score / total) * 100);
    session.assessmentResults[topicId] = { score, total, percentage };
    localStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(session));

    // Real-time mentor sync: if passed (100% for standard demo flow), mark as completed in profile immediately
    if (session.userId && percentage >= 60) {
      markTopicComplete(session.userId, topicId);
      // Trigger a storage event for other tabs
      localStorage.setItem('gk_sync_ping', Date.now().toString());
    }
  }

  function saveFeedback(feedbackData) {
    const session = getSession() || {};
    session.feedback = feedbackData;
    localStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(session));
  }

  // ---------- Mentor Functions ----------

  function getAllStudentProfiles() {
    const profiles = JSON.parse(localStorage.getItem(KEYS.USER_PROFILES) || '{}');
    const all = {};
    GK_USERS.forEach(u => {
      all[u.id] = {
        ...u,
        totalXP: 0,
        completedTopics: [],
        ...profiles[u.id]
      };
    });
    return all;
  }

  function awardBonusXP(userId, amount, reason) {
    const profile = getUserProfile(userId) || { totalXP: 0 };
    profile.totalXP = (profile.totalXP || 0) + amount;
    if (!profile.mentorRewards) profile.mentorRewards = [];
    profile.mentorRewards.push({ amount, reason, awardedAt: new Date().toISOString() });
    saveUserProfile(userId, profile);
    return profile.totalXP;
  }

  function promoteStudent(userId) {
    const profile = getUserProfile(userId) || {};
    profile.isPromoted = true;
    profile.promotedAt = new Date().toISOString();
    saveUserProfile(userId, profile);
  }

  // ---------- Topic Lock / Unlock (Mentor Actions) ----------

  function unlockTopicForStudent(userId, topicKey) {
    const profile = getUserProfile(userId) || {};
    if (!profile.unlockedTopics) profile.unlockedTopics = [];
    if (!profile.unlockedTopics.includes(topicKey)) {
      profile.unlockedTopics.push(topicKey);
    }
    // Remove from lockedTopics if it was explicitly locked before
    if (profile.lockedTopics) {
      profile.lockedTopics = profile.lockedTopics.filter(k => k !== topicKey);
    }
    saveUserProfile(userId, profile);
  }

  function lockTopicForStudent(userId, topicKey) {
    const profile = getUserProfile(userId) || {};
    if (!profile.lockedTopics) profile.lockedTopics = [];
    if (!profile.lockedTopics.includes(topicKey)) {
      profile.lockedTopics.push(topicKey);
    }
    // Remove from unlockedTopics if present
    if (profile.unlockedTopics) {
      profile.unlockedTopics = profile.unlockedTopics.filter(k => k !== topicKey);
    }
    saveUserProfile(userId, profile);
  }

  function getUnlockedTopics(userId) {
    const profile = getUserProfile(userId) || {};
    return profile.unlockedTopics || [];
  }

  function getLockedTopics(userId) {
    const profile = getUserProfile(userId) || {};
    return profile.lockedTopics || [];
  }

  // ---------- Mentor Notes / Suggestions ----------

  function addMentorNote(userId, noteData) {
    const profile = getUserProfile(userId) || {};
    if (!profile.mentorNotes) profile.mentorNotes = [];
    profile.mentorNotes.push({
      ...noteData,
      id: 'note_' + Date.now(),
      read: false,
      createdAt: new Date().toISOString()
    });
    saveUserProfile(userId, profile);
  }

  function getMentorNotes(userId) {
    const profile = getUserProfile(userId) || {};
    return profile.mentorNotes || [];
  }

  function markMentorNotesRead(userId) {
    const profile = getUserProfile(userId) || {};
    if (profile.mentorNotes) {
      profile.mentorNotes = profile.mentorNotes.map(n => ({ ...n, read: true }));
      saveUserProfile(userId, profile);
    }
  }

  // ---------- Detailed Assessment Attempts (persisted to profile) ----------

  function saveDetailedAssessmentResult(userId, topicKey, score, total, answers) {
    const profile = getUserProfile(userId) || {};
    if (!profile.assessmentAttempts) profile.assessmentAttempts = {};
    if (!profile.assessmentAttempts[topicKey]) profile.assessmentAttempts[topicKey] = [];
    profile.assessmentAttempts[topicKey].push({
      score,
      total,
      percentage: Math.round((score / total) * 100),
      answers: answers || [],
      attemptedAt: new Date().toISOString()
    });
    // Keep last 5 attempts per topic
    if (profile.assessmentAttempts[topicKey].length > 5) {
      profile.assessmentAttempts[topicKey].shift();
    }
    saveUserProfile(userId, profile);
  }

  function getAssessmentAttempts(userId, topicKey) {
    const profile = getUserProfile(userId) || {};
    if (!profile.assessmentAttempts) return topicKey ? [] : {};
    return topicKey
      ? (profile.assessmentAttempts[topicKey] || [])
      : profile.assessmentAttempts;
  }

  // ---------- Subtopic & Module Feedback (persisted to profile) ----------

  function saveSubtopicFeedback(userId, subtopicKey, feedbackData) {
    const profile = getUserProfile(userId) || {};
    if (!profile.subtopicFeedback) profile.subtopicFeedback = {};
    if (!profile.subtopicFeedback[subtopicKey]) profile.subtopicFeedback[subtopicKey] = [];
    profile.subtopicFeedback[subtopicKey].push({
      ...feedbackData,
      savedAt: new Date().toISOString()
    });
    saveUserProfile(userId, profile);
  }

  function saveModuleFeedback(userId, topicKey, feedbackData) {
    const profile = getUserProfile(userId) || {};
    if (!profile.moduleFeedback) profile.moduleFeedback = {};
    if (!profile.moduleFeedback[topicKey]) profile.moduleFeedback[topicKey] = [];
    profile.moduleFeedback[topicKey].push({
      ...feedbackData,
      savedAt: new Date().toISOString()
    });
    saveUserProfile(userId, profile);
  }

  // ---------- Session Log (history) ----------

  function logCompletedSession() {
    const session = getSession();
    if (!session) return;
    session.endTime = new Date().toISOString();
    const log = JSON.parse(localStorage.getItem(KEYS.SESSION_LOG) || '[]');
    log.push(session);
    // Keep last 50 sessions
    if (log.length > 50) log.shift();
    localStorage.setItem(KEYS.SESSION_LOG, JSON.stringify(log));
  }

  function getSessionHistory(userId) {
    const log = JSON.parse(localStorage.getItem(KEYS.SESSION_LOG) || '[]');
    return log.filter(s => s.userId === userId);
  }

  // ---------- Quick Check Results ----------

  function saveQuickCheckResult(userId, result) {
    const profile = getUserProfile(userId) || {};
    if (!profile.quickCheckResults) profile.quickCheckResults = [];
    profile.quickCheckResults.push({
      ...result,
      id: Date.now(),
      submittedAt: new Date().toISOString()
    });
    saveUserProfile(userId, profile);
  }

  function getQuickCheckResults(userId) {
    const profile = getUserProfile(userId) || {};
    return profile.quickCheckResults || [];
  }

  // ---------- Mentor Review Requests ----------

  function saveMentorReviewRequest(userId, data) {
    const key = `gk_review_requests_${userId}`;
    const requests = JSON.parse(localStorage.getItem(key) || '[]');
    requests.push({
      id: Date.now(),
      userId,
      ...data,
      submittedAt: new Date().toISOString(),
      read: false
    });
    localStorage.setItem(key, JSON.stringify(requests));
  }

  function getMentorReviewRequests(userId) {
    const key = `gk_review_requests_${userId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  function markReviewRequestRead(userId, requestId) {
    const key = `gk_review_requests_${userId}`;
    const requests = JSON.parse(localStorage.getItem(key) || '[]');
    const req = requests.find(r => r.id === requestId);
    if (req) {
      req.read = true;
      localStorage.setItem(key, JSON.stringify(requests));
    }
  }

  function clearMentorReviewRequests(userId) {
    const key = `gk_review_requests_${userId}`;
    localStorage.removeItem(key);
  }

  function submitMentorEvaluation(userId, data) {
    clearMentorReviewRequests(userId);
    // You could also save the evaluation history here if needed
  }

  function resetTopics(userId, topicKeys) {
    const profile = getUserProfile(userId) || {};
    if (profile.assessmentAttempts) {
      topicKeys.forEach(k => {
        delete profile.assessmentAttempts[k];
      });
    }
    if (profile.completedTopics) {
      profile.completedTopics = profile.completedTopics.filter(t => !topicKeys.includes(t));
    }
    // Remove individual quick check results so assessments can be retaken
    if (profile.quickCheckResults) {
      profile.quickCheckResults = profile.quickCheckResults.filter(r => !topicKeys.includes(`${r.subjectId}-${r.topicId}`));
    }
    // Remove individual subtopic completions (e.g. topicKey = math-fractions, remove fractions-intro-fractions etc)
    if (profile.completedSubtopics) {
      profile.completedSubtopics = profile.completedSubtopics.filter(stKey => {
        return !topicKeys.some(tk => {
          const tId = tk.includes('-') ? tk.split('-').slice(1).join('-') : tk;
          return stKey.startsWith(tId + '-');
        });
      });
    }
    // Also remove from current session if needed
    const sessionKey = KEYS.CURRENT_SESSION;
    let currentSession = null;
    try {
      currentSession = JSON.parse(localStorage.getItem(sessionKey));
    } catch (e) { }

    if (currentSession && currentSession.userId === userId) {
      let changed = false;
      if (currentSession.assessmentResults) {
        topicKeys.forEach(k => {
          if (currentSession.assessmentResults[k]) {
            delete currentSession.assessmentResults[k];
            changed = true;
          }
        });
      }
      if (currentSession.completedSubtopics) {
        const initialLen = currentSession.completedSubtopics.length;
        currentSession.completedSubtopics = currentSession.completedSubtopics.filter(stKey => {
          return !topicKeys.some(tk => {
            const tId = tk.includes('-') ? tk.split('-').slice(1).join('-') : tk;
            return stKey.startsWith(tId + '-');
          });
        });
        if (currentSession.completedSubtopics.length !== initialLen) changed = true;
      }
      if (changed) {
        localStorage.setItem(sessionKey, JSON.stringify(currentSession));
      }
    }

    // ALSO CLEAR DEMO OVERRIDES
    const overrideKey = 'gk_demo_overrides_' + userId;
    const overrides = JSON.parse(localStorage.getItem(overrideKey) || '{}');
    let overridesChanged = false;
    topicKeys.forEach(k => {
      if (overrides[k]) {
        delete overrides[k];
        overridesChanged = true;
      }
    });
    if (overridesChanged) {
      localStorage.setItem(overrideKey, JSON.stringify(overrides));
    }

    saveUserProfile(userId, profile);
  }

  // ---------- Mentor Mood Log ----------

  function saveMentorMoodLog(mentorId, moodData) {
    const key = 'gk_mentor_mood_' + mentorId;
    const logs = JSON.parse(localStorage.getItem(key) || '[]');
    logs.push({ ...moodData, loggedAt: new Date().toISOString() });
    if (logs.length > 100) logs.shift();
    localStorage.setItem(key, JSON.stringify(logs));
  }

  function getMentorMoodLog(mentorId) {
    const key = 'gk_mentor_mood_' + mentorId;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  // ---------- Holistic Quotient Scores (AQ, SQ, PQ, EQ → HQ) ----------

  function saveHolisticScores(userId, data) {
    const profile = getUserProfile(userId) || {};
    profile.holisticScores = { ...data, savedAt: new Date().toISOString() };
    saveUserProfile(userId, profile);
  }

  function getHolisticScores(userId) {
    const profile = getUserProfile(userId) || {};
    return profile.holisticScores || null;
  }

  function markSpecificMentorNoteRead(userId, noteId) {
    const profile = getUserProfile(userId) || {};
    if (profile.mentorNotes) {
      profile.mentorNotes = profile.mentorNotes.map(n => n.id === noteId ? { ...n, read: true } : n);
      saveUserProfile(userId, profile);
    }
  }

  return {
    saveCurrentUser, getCurrentUserId, clearCurrentUser,
    getUserProfile, saveUserProfile, getTotalXP, addXPToUser, markTopicComplete,
    startSession, getSession, updateSession, addSessionXP,
    recordSubtopicComplete, recordAssessmentResult, saveFeedback,
    logCompletedSession, getSessionHistory,
    getAllStudentProfiles, awardBonusXP, promoteStudent,
    // Topic lock/unlock
    unlockTopicForStudent, lockTopicForStudent, getUnlockedTopics, getLockedTopics,
    // Mentor notes
    addMentorNote, getMentorNotes, markMentorNotesRead, markSpecificMentorNoteRead,
    // Detailed assessment history
    saveDetailedAssessmentResult, getAssessmentAttempts,
    // Granular feedback
    saveSubtopicFeedback, saveModuleFeedback,
    // Quick check results (mentor-visible, student-blind)
    saveQuickCheckResult, getQuickCheckResults,
    // Mentor review requests & evaluations
    saveMentorReviewRequest, getMentorReviewRequests, markReviewRequestRead, clearMentorReviewRequests,
    submitMentorEvaluation, resetTopics,
    // Holistic Quotient
    saveHolisticScores, getHolisticScores,
    // Mentor Mood Log
    saveMentorMoodLog, getMentorMoodLog
  };
})();
