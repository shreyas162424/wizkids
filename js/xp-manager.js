// ============================================================
// BUSINESS LOGIC: xp-manager.js
// XP calculation, level management, badges, streaks & rewards.
// Depends on: data/users.js (GK_LEVELS), data/session-store.js
// ============================================================

const GKXPManager = (() => {

  const XP_REWARDS = {
    conceptRead: 5,
    gameCompleted: 15,
    gameBonus: 10,   // bonus for perfect game score
    assessmentQuestion: 10,   // per correct answer
    assessmentBonus: 25,   // bonus for full marks
    topicCompleted: 50,
    feedbackSubmitted: 10
  };

  // ---- Badges (Ancient Bharatiya Themed) ----
  const BADGES = [
    { id: 'agni-streak', name: 'Agni Streak', icon: '🔥', desc: '3+ day learning streak', condition: 'streak3' },
    { id: 'pratham-vijay', name: 'Pratham Vijay', icon: '🏅', desc: 'First module completed', condition: 'modules1' },
    { id: 'panch-ratna', name: 'Panch Ratna', icon: '⭐', desc: '5 modules completed', condition: 'modules5' },
    { id: 'lakshya-siddhi', name: 'Lakshya Siddhi', icon: '🎯', desc: '100% on any assessment', condition: 'perfect' },
    { id: 'yoga-sadhak', name: 'Yoga Sadhak', icon: '🧘', desc: 'Completed a wellness module', condition: 'wellness' },
    { id: 'vidya-ratna', name: 'Vidya Ratna', icon: '📚', desc: 'All mandatory modules done', condition: 'allMandatory' },
    { id: 'guru-kripa', name: 'Guru Kripa', icon: '👑', desc: 'Promoted by mentor', condition: 'promoted' },
    { id: 'sapt-rishi', name: 'Sapt Rishi', icon: '🌟', desc: '7-day learning streak', condition: 'streak7' },
    { id: 'daan-veer', name: 'Daan Veer', icon: '💎', desc: 'Submitted feedback 5 times', condition: 'feedback5' }
  ];

  // ---- Bloom's Taxonomy Mapping ----
  const BLOOMS_LEVELS = [
    { min: 90, label: 'Create', icon: '🌟', desc: 'Highest Order Thinking', color: '#8E44AD' },
    { min: 80, label: 'Evaluate', icon: '⭐', desc: 'Critical Thinking', color: '#2980B9' },
    { min: 70, label: 'Analyze', icon: '🔍', desc: 'Deep Understanding', color: '#27AE60' },
    { min: 60, label: 'Apply', icon: '🎯', desc: 'Practical Knowledge', color: '#F39C12' },
    { min: 40, label: 'Understand', icon: '📖', desc: 'Conceptual Grasp', color: '#E67E22' },
    { min: 0, label: 'Remember', icon: '🌱', desc: 'Foundational', color: '#E74C3C' }
  ];

  function getBloomsLevel(percentage) {
    for (const level of BLOOMS_LEVELS) {
      if (percentage >= level.min) return level;
    }
    return BLOOMS_LEVELS[BLOOMS_LEVELS.length - 1];
  }

  function getLevelForXP(totalXP) {
    let current = GK_LEVELS[0];
    for (const lvl of GK_LEVELS) {
      if (totalXP >= lvl.minXP) current = lvl;
      else break;
    }
    return current;
  }

  function getNextLevel(totalXP) {
    const current = getLevelForXP(totalXP);
    const nextIdx = GK_LEVELS.findIndex(l => l.level === current.level) + 1;
    return nextIdx < GK_LEVELS.length ? GK_LEVELS[nextIdx] : null;
  }

  function getProgressToNext(totalXP) {
    const current = getLevelForXP(totalXP);
    const next = getNextLevel(totalXP);
    if (!next) return 100;
    const range = next.minXP - current.minXP;
    const progress = totalXP - current.minXP;
    return Math.min(100, Math.round((progress / range) * 100));
  }

  function calcAssessmentXP(score, total) {
    const base = score * XP_REWARDS.assessmentQuestion;
    const bonus = score === total ? XP_REWARDS.assessmentBonus : 0;
    return base + bonus;
  }

  function awardXP(userId, reason, extraAmount = 0) {
    const base = XP_REWARDS[reason] || 0;
    const amount = base + extraAmount;
    if (amount <= 0) return 0;
    GKStore.addXPToUser(userId, amount);
    GKStore.addSessionXP(amount);
    return amount;
  }

  function getXPRewards() {
    return { ...XP_REWARDS };
  }

  function formatXP(amount) {
    return `+${amount} XP`;
  }

  // ---- Streak Tracking ----
  function getStreak(userId) {
    const key = `gk_streak_${userId}`;
    const data = JSON.parse(localStorage.getItem(key) || '{"count":0,"lastDate":""}');
    return data;
  }

  function updateStreak(userId) {
    const key = `gk_streak_${userId}`;
    const data = JSON.parse(localStorage.getItem(key) || '{"count":0,"lastDate":""}');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (data.lastDate === today) {
      return data; // Already counted today
    } else if (data.lastDate === yesterday) {
      data.count += 1;
    } else {
      data.count = 1; // Streak broken, restart
    }
    data.lastDate = today;
    localStorage.setItem(key, JSON.stringify(data));
    return data;
  }

  // ---- Badge Checking ----
  function getBadges(userId) {
    const key = `gk_badges_${userId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  function getEarnedBadges(userId) {
    const key = `gk_badges_${userId}`;
    const badges = JSON.parse(localStorage.getItem(key) || '[]');
    // Migrate old string arrays natively to object
    return badges.map(b => typeof b === 'string' ? { id: b, earnedAt: 0 } : b);
  }

  function _saveBadge(userId, badgeId) {
    const key = `gk_badges_${userId}`;
    const badges = JSON.parse(localStorage.getItem(key) || '[]');
    const exists = badges.some(b => typeof b === 'string' ? b === badgeId : b.id === badgeId);
    if (!exists) {
      badges.push({ id: badgeId, earnedAt: Date.now() });
      localStorage.setItem(key, JSON.stringify(badges));
      return true; // New badge!
    }
    return false;
  }

  function checkAndAwardBadges(userId) {
    const profile = GKStore.getUserProfile(userId) || {};
    const streak = getStreak(userId);
    const completedTopics = profile.completedTopics || [];
    const sessionHistory = GKStore.getSessionHistory(userId);
    const newBadges = [];

    for (const badge of BADGES) {
      let earned = false;
      switch (badge.condition) {
        case 'streak3': earned = streak.count >= 3; break;
        case 'streak7': earned = streak.count >= 7; break;
        case 'modules1': earned = completedTopics.length >= 1; break;
        case 'modules5': earned = completedTopics.length >= 5; break;
        case 'perfect':
          // Check if any assessment has 100%
          const attempts = GKStore.getAssessmentAttempts(userId);
          earned = Object.values(attempts).some(arr =>
            arr.some(a => a.percentage === 100)
          );
          break;
        case 'wellness':
          // Check if any wellness/yoga topic is completed
          earned = completedTopics.some(t =>
            t.includes('yoga') || t.includes('meditation') || t.includes('wellness')
          );
          break;
        case 'allMandatory':
          // Check if all standard modules are completed
          if (typeof GKRecommender !== 'undefined') {
            const allTopics = GKRecommender.getAllTopics().filter(t => {
              const td = GKRecommender.getTopicData(t.subjectId, t.topicId);
              return td && td.topic && td.topic.moduleType === 'standard';
            });
            earned = allTopics.length > 0 && allTopics.every(t => completedTopics.includes(t.key));
          }
          break;
        case 'promoted':
          earned = profile.isPromoted === true;
          break;
        case 'feedback5':
          let feedbackCount = 0;
          sessionHistory.forEach(s => { if (s.feedback) feedbackCount++; });
          earned = feedbackCount >= 5;
          break;
      }
      if (earned && _saveBadge(userId, badge.id)) {
        newBadges.push(badge);
      }
    }
    return newBadges;
  }

  function getAllBadgeDefinitions() {
    return BADGES;
  }

  return {
    getLevelForXP, getNextLevel, getProgressToNext,
    calcAssessmentXP, awardXP, getXPRewards, formatXP,
    // Badges & Streaks
    BADGES: getAllBadgeDefinitions, getBadges, getEarnedBadges, checkAndAwardBadges,
    getStreak, updateStreak,
    // Bloom's Taxonomy
    getBloomsLevel, BLOOMS_LEVELS
  };
})();

