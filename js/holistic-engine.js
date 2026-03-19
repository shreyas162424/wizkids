/**
 * HolisticEvaluationEngine
 * 
 * Responsible for analyzing student activity (reflections, feedback, performance)
 * and generating automated AQ, EQ, SQ, and PQ scores using AI.
 */
const HolisticEvaluationEngine = (() => {

  /**
   * Analyzes student data and generates automatic scores.
   * @param {string} userId 
   * @returns {Promise<Object>} The AI-generated scores.
   */
  async function analyzeStudent(userId) {
    if (!userId) return null;

    const profile = GKStore.getUserProfile(userId) || {};
    const sessionHistory = GKStore.getSessionHistory(userId) || [];
    const recentFeedback = _gatherRecentFeedback(profile);
    const recentReflections = _gatherRecentReflections(sessionHistory);
    const performance = _gatherPerformanceData(profile);

    const prompt = `
        Analyze the following student data and provide holistic evaluation scores (0-100) for internal development tracking.
        
        [STUDENT PROFILE]
        Name: ${profile.displayName || 'Shishya'}
        XP: ${profile.totalXP || 0}
        Topics Completed: ${profile.completedTopics ? profile.completedTopics.join(', ') : 'None'}
        
        [RECENT REFLECTIONS]
        ${recentReflections || 'No reflections yet.'}
        
        [LEARNING FEEDBACK]
        ${recentFeedback || 'No specific feedback yet.'}
        
        [PERFORMANCE METRICS]
        ${performance || 'No assessment data yet.'}
        
        Evaluate the student across these four quotients:
        - AQ (Academic Quotient): Based on performance, synthesis of knowledge in reflections, and topic mastery.
        - EQ (Emotional Quotient): Based on mood consistency, openness in feedback, and self-awareness in reflections.
        - SQ (Spiritual Quotient): Based on the depth of philosophical inquiry, use of Gurukul values, and focus in reflections.
        - PQ (Physical Quotient): Based on consistency, energy levels reported, and regular engagement with the learning path.

        Return ONLY a JSON object with this exact structure:
        {
          "aq": number,
          "eq": number,
          "sq": number,
          "pq": number,
          "explanation": "Short overall rationale"
        }
    `;

    try {
      const responseText = await GKAITutor.respond(prompt, { history: [] }, 'mentor'); // Use mentor persona for evaluation
      // Handle potential extra text in Gemini response
      const jsonStr = responseText.match(/\{[\s\S]*\}/)[0];
      const scores = JSON.parse(jsonStr);
      
      // Save to profile as AI scores and append to history
      const scoresData = GKStore.getHolisticScores(userId) || { history: [] };
      const newAiScore = {
          aq: scores.aq,
          eq: scores.eq,
          sq: scores.sq,
          pq: scores.pq,
          explanation: scores.explanation,
          updatedAt: new Date().toISOString(),
          type: 'ai'
      };
      
      scoresData.ai = newAiScore;
      if (!scoresData.history) scoresData.history = [];
      scoresData.history.push(newAiScore);
      
      GKStore.saveHolisticScores(userId, scoresData);

      return scores;
    } catch (e) {
      console.error("Holistic Analysis Error:", e);
      return null;
    }
  }

  /**
   * Gets the final metrics for a student.
   * Now separates AI and Mentor scores for AQ/SQ.
   */
  function getMergedScores(userId) {
    const scores = GKStore.getHolisticScores(userId) || {};
    const ai = scores.ai || { aq: 50, eq: 50, sq: 50, pq: 50 };
    const mentor = scores.mentor || {};
    const history = scores.history || [];

    const metrics = {
      ai_aq: ai.aq,
      human_aq: mentor.aq !== undefined ? mentor.aq : null,
      ai_sq: ai.sq,
      human_sq: mentor.sq !== undefined ? mentor.sq : null,
      eq: ai.eq, // EQ and PQ are autopopulated by AI/System for now
      pq: ai.pq
    };

    // composite calculation
    const avgAQ = metrics.human_aq !== null ? (metrics.ai_aq + metrics.human_aq) / 2 : metrics.ai_aq;
    const avgSQ = metrics.human_sq !== null ? (metrics.ai_sq + metrics.human_sq) / 2 : metrics.ai_sq;
    
    metrics.hq = Math.round((avgAQ + avgSQ + metrics.eq + metrics.pq) / 4);
    
    return {
        ai,
        mentor,
        metrics,
        history
    };
  }

  /**
   * Saves a mentor override score and records in history.
   */
  function saveMentorScore(userId, quotient, value) {
    const scoresData = GKStore.getHolisticScores(userId) || { history: [] };
    if (!scoresData.mentor) scoresData.mentor = {};
    const val = parseInt(value, 10);
    scoresData.mentor[quotient] = val;
    
    // Add to history for trend plotting
    const hPoint = {
        type: 'mentor',
        quotient: quotient,
        value: val,
        updatedAt: new Date().toISOString()
    };
    if (!scoresData.history) scoresData.history = [];
    scoresData.history.push(hPoint);
    
    GKStore.saveHolisticScores(userId, scoresData);
    
    if (typeof GKMentorApp !== 'undefined') {
        GKMentorApp.renderInPlace();
    }
  }

  // --- Internals ---

  function _gatherRecentFeedback(profile) {
    let text = "";
    if (profile.subtopicFeedback) {
        Object.entries(profile.subtopicFeedback).slice(-3).forEach(([key, items]) => {
            items.forEach(it => {
                if (it.responses) text += `Subtopic (${key}): ${it.responses.enjoyedMost}. Needs: ${it.responses.improvementPoint}\n`;
            });
        });
    }
    return text;
  }

  function _gatherRecentReflections(history) {
    return history
      .filter(s => s.studentReflection)
      .slice(-3)
      .map(s => `- ${s.studentReflection}`)
      .join('\n');
  }

  function _gatherPerformanceData(profile) {
    if (!profile.assessmentAttempts) return "";
    let text = "";
    Object.entries(profile.assessmentAttempts).forEach(([topic, attempts]) => {
        const best = attempts.reduce((prev, curr) => (prev.percentage > curr.percentage) ? prev : curr, {percentage:0});
        text += `${topic}: Best score ${best.percentage}% over ${attempts.length} attempts.\n`;
    });
    return text;
  }

  return {
    analyzeStudent,
    getMergedScores,
    saveMentorScore
  };
})();
