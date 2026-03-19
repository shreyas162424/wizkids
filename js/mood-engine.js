// ============================================================
// BUSINESS LOGIC: mood-engine.js
// Processes mood data, calculates energy score, calibrates session.
// ============================================================

const GKMoodEngine = (() => {

  const VIBE_SCORES = {
    high_energy: 25,
    low_energy: -20
  };

  const VIBE_LABELS = {
    high_energy: { label: "Highly Enthusiastic", color: "#F5A623", emoji: "⚡", desc: "" },
    low_energy:  { label: "Low Interest",         color: "#4A7C59", emoji: "😌", desc: "" }
  };

  /**
   * Calculate overall energy score from mood data.
   * brainBattery: 0-100
   * vibe: 'high_energy' | 'low_energy'
   * Returns energyScore 0-100 clamped.
   */
  function calcEnergyScore(brainBattery, vibe) {
    const vibeBonus = VIBE_SCORES[vibe] || 0;
    return Math.max(0, Math.min(100, brainBattery + vibeBonus));
  }

  /**
   * Returns session calibration based on energy score.
   * - High energy (>=65): Core learning first
   * - Medium energy (40-64): Mix of core and wellness
   * - Low energy (<40): Wellness / para-vidya first
   */
  function calibrateSession(brainBattery, vibe) {
    const score = calcEnergyScore(brainBattery, vibe);
    if (score >= 65) {
      return {
        energyScore: score,
        level: 'high',
        label: 'Ready to Learn! 🚀',
        message: `Great energy, ${vibe === 'high_energy' ? 'you\'re on fire' : 'you seem focused'}! Let\'s dive straight into your core subjects.`,
        sessionOrder: 'core-first',
        recommendWellness: false
      };
    } else if (score >= 40) {
      return {
        energyScore: score,
        level: 'medium',
        label: 'Moderate Energy 📚',
        message: 'Good balance today! We\'ll start with a gentle warm-up, then move to your core learning.',
        sessionOrder: 'mixed',
        recommendWellness: false
      };
    } else {
      return {
        energyScore: score,
        level: 'low',
        label: 'Need a Recharge 🌿',
        message: 'Let\'s start with some yoga and meditation to recharge your energy first, then move to academics.',
        sessionOrder: 'wellness-first',
        recommendWellness: true
      };
    }
  }

  function getVibeInfo(vibe) {
    return VIBE_LABELS[vibe] || VIBE_LABELS['high_energy'];
  }

  function getBatteryEmoji(battery) {
    if (battery >= 80) return '🔋';
    if (battery >= 50) return '🔋';
    if (battery >= 20) return '🪫';
    return '🪫';
  }

  return { calcEnergyScore, calibrateSession, getVibeInfo, getBatteryEmoji, VIBE_LABELS };
})();
