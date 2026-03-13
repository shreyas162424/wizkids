// ============================================================
// BUSINESS LOGIC: recommender.js
// AI-style topic recommender. Orders modules based on mood/energy.
// Depends on: data/topics.js, js/mood-engine.js
// ============================================================

const GKRecommender = (() => {

  /**
   * Returns an ordered list of modules (topic references) for today's session.
   * If energy is high → core academic topics first.
   * If energy is low → wellness (para-vidya) topics first.
   */
  function getRecommendedModules(calibration, completedTopics = []) {
    const allModules = [];

    GK_TOPICS.subjects.forEach(subject => {
      subject.topics.forEach(topic => {
        allModules.push({
          subjectId: subject.id,
          subjectName: subject.name,
          subjectIcon: subject.icon,
          subjectType: subject.type,
          subjectColor: subject.color,
          topicId: topic.id,
          topicName: topic.name,
          topicDescription: topic.description,
          topicIcon: topic.icon,
          topicXP: topic.xp,
          subtopicCount: topic.subtopics.length,
          isCompleted: completedTopics.includes(`${subject.id}-${topic.id}`),
          requiresMentorUnlock: topic.requiresMentorUnlock || false,
          mandatory: topic.mandatory || false,
          moduleType: topic.moduleType || 'standard'
        });
      });
    });

    // Separate into core and wellness
    const core = allModules.filter(m => m.subjectType !== 'para-vidya');
    const wellness = allModules.filter(m => m.subjectType === 'para-vidya');

    let ordered;
    if (calibration.sessionOrder === 'core-first') {
      ordered = [...core, ...wellness];
    } else if (calibration.sessionOrder === 'wellness-first') {
      ordered = [...wellness, ...core];
    } else {
      // Mixed: interleave - one wellness first, then core
      ordered = [];
      const wellnessCopy = [...wellness];
      const coreCopy = [...core];
      if (wellnessCopy.length > 0) ordered.push(wellnessCopy.shift());
      ordered.push(...coreCopy);
      ordered.push(...wellnessCopy);
    }

    // Mark priority label
    return ordered.map((m, idx) => ({
      ...m,
      priority: idx + 1,
      priorityLabel: idx === 0 ? 'Start Here ✨' : idx < 2 ? 'Up Next' : 'Later'
    }));
  }

  /**
   * Get a specific topic object from the data layer.
   */
  function getTopicData(subjectId, topicId) {
    const subject = GK_TOPICS.subjects.find(s => s.id === subjectId);
    if (!subject) return null;
    const topic = subject.topics.find(t => t.id === topicId);
    if (!topic) return null;
    return { subject, topic };
  }

  /**
   * Get a specific subtopic object.
   */
  function getSubtopicData(subjectId, topicId, subtopicId) {
    const data = getTopicData(subjectId, topicId);
    if (!data) return null;
    const subtopic = data.topic.subtopics.find(s => s.id === subtopicId);
    return subtopic ? { ...data, subtopic } : null;
  }

  /**
   * Returns a flat list of all topics across all subjects.
   * Used by the mentor dashboard to display topic progress
   * without the UI layer touching GK_TOPICS directly.
   */
  function getAllTopics() {
    const all = [];
    GK_TOPICS.subjects.forEach(subject => {
      subject.topics.forEach(topic => {
        all.push({
          key: `${subject.id}-${topic.id}`,
          subjectId: subject.id,
          subjectName: subject.name,
          subjectIcon: subject.icon,
          topicId: topic.id,
          topicName: topic.name
        });
      });
    });
    return all;
  }

  function getQuotientProgress(completedTopics) {
    const tracking = {
      IQ: { done: 0, total: 0, color: '#3A6FA6', name: 'Intelligence (IQ)' },
      SQ: { done: 0, total: 0, color: '#4A7C59', name: 'Para-Vidya (SQ)' }
    };

    getAllTopics().forEach(t => {
      const td = getTopicData(t.subjectId, t.topicId);
      if (td && td.topic && td.topic.moduleType === 'standard' && td.subject.quotient) {
        const q = td.subject.quotient;
        if (tracking[q]) {
          tracking[q].total++;
          if (completedTopics.includes(t.key)) tracking[q].done++;
        }
      }
    });
    return tracking;
  }

  return { getRecommendedModules, getTopicData, getSubtopicData, getAllTopics, getQuotientProgress };
})();
