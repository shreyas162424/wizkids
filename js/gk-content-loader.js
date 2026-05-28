// ============================================================
// GKContentLoader — maps GET /api/content → in-memory topic data
// Used for Mathematics & Science (githubFolder in data/topics.js).
// Does not change HTML/CSS; only fills concepts, games, assessments, hints.
// ============================================================

const GKContentLoader = (() => {
  const _cache = {};
  const API_SUBJECT_IDS = ['mathematics', 'science'];

  function _topicKey(subjectName, githubFolder) {
    return `${subjectName}/${githubFolder}`;
  }

  function _asList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'object') return Object.keys(value).sort((a, b) => Number(a) - Number(b)).map(k => value[k]);
    return [];
  }

  function _mapApiConcept(card) {
    const c = card.content || {};
    const narration = (card.experience && card.experience.narration) || '';
    const bodyParts = [];
    if (narration) bodyParts.push(narration);
    if (c.meaning) bodyParts.push(c.meaning);
    if (c.definition) bodyParts.push(c.definition);
    if (c.example) bodyParts.push(`Example: ${c.example}`);
    if (c.helpful_word) bodyParts.push(c.helpful_word);
    if (c.read_write) bodyParts.push(c.read_write);

    const examples = [];
    if (c.local_life) examples.push(c.local_life);
    if (c.bharatiya_connection) examples.push(c.bharatiya_connection);
    if (Array.isArray(c.takeaway)) examples.push(...c.takeaway);

    const visualParts = [];
    if (c.keyword) visualParts.push(`Keyword: ${c.keyword}`);
    if (c.video) visualParts.push(`Video: ${c.video}`);
    if (c.image) visualParts.push(c.image);
    if (c.observe) visualParts.push(`Observe: ${c.observe}`);

    return {
      title: card.concept_title || 'Concept',
      body: bodyParts.filter(Boolean).join('\n\n') || 'Read this concept carefully.',
      visual: visualParts.join('\n') || '📖',
      examples: examples.length ? examples : ['See lesson content above.']
    };
  }

  /** Skip trigger rows that are PDF-export JSON fragments, not readable lesson text. */
  function _isGarbageTriggerText(text) {
    const t = String(text || '').trim();
    if (!t || t.length < 12) return true;
    if (/^[\w\s\-]+",\s*\n\s*"/.test(t)) return true;
    if (/"content"\s*:\s*"/.test(t) && /"\s*\}\s*,?\s*\{/.test(t)) return true;
    if (/"experience"\s*:\s*\{/.test(t) || /"image_b64"\s*:/.test(t)) return true;
    if (t.startsWith('{') || t.startsWith('[')) return true;
    return false;
  }

  function _mapHookItem(hook, index) {
    const title = (hook && hook.title) || `Curiosity Hook ${index + 1}`;
    const body = (hook && hook.content) || title;
    return {
      title: String(title).slice(0, 120),
      body: String(body).slice(0, 4000),
      visual: '📖',
      examples: ['Content from Gurukul published curriculum.']
    };
  }

  function _mapTriggerItem(item, index) {
    const raw = (item && (item.question || item.content || item.title)) || '';
    const text = String(raw).replace(/\\n/g, '\n').trim();
    if (_isGarbageTriggerText(text)) return null;
    const titleLine = text.split('\n')[0].slice(0, 120) || `Section ${index + 1}`;
    return {
      title: titleLine,
      body: text.slice(0, 4000) || 'Explore this section.',
      visual: '📖',
      examples: ['Content from Gurukul published curriculum.']
    };
  }

  function _mapHookHints(hooks) {
    return _asList(hooks)
      .map(h => (h && (h.content || h.title)) || '')
      .filter(Boolean)
      .map(t => String(t).slice(0, 280));
  }

  function _parseMcqQuestion(text, answer, id) {
    const lines = String(text).split('\n').map(l => l.trim()).filter(Boolean);
    const question = lines[0] || 'Question';
    const optMatch = text.match(/A\.\s*([\s\S]*?)\s*B\.\s*([\s\S]*?)\s*C\.\s*([\s\S]*?)(?:\s*D\.|$)/i);
    if (optMatch) {
      const options = [
        optMatch[1].trim().split('\n')[0],
        optMatch[2].trim().split('\n')[0],
        optMatch[3].trim().split('\n')[0]
      ];
      const ans = String(answer || '').trim();
      let correct = 0;
      if (/^B\b/i.test(ans)) correct = 1;
      else if (/^C\b/i.test(ans)) correct = 2;
      return { id, type: 'mcq', question, options, correct, explanation: ans || 'See published answer.' };
    }
    if (/true\s*\/\s*false/i.test(text)) {
      const correct = /^false/i.test(String(answer)) ? 1 : 0;
      return {
        id,
        type: 'true-false',
        question,
        options: ['True', 'False'],
        correct,
        explanation: String(answer || '')
      };
    }
    return {
      id,
      type: 'short-answer',
      question: question.slice(0, 500),
      correct: String(answer || '').trim() || 'See teacher guide.',
      explanation: String(answer || '')
    };
  }

  function _mapAssessments(assessments) {
    const out = [];
    if (!assessments || typeof assessments !== 'object') return out;

    const light = _asList(assessments.light_assessments);
    let n = 0;
    for (const block of light) {
      const qs = _asList(block && block.questions);
      for (const q of qs) {
        out.push(_parseMcqQuestion(q.question, q.answer, `api-la-${n++}`));
      }
    }

    const finalQ = _asList(assessments.final_assessment && assessments.final_assessment.questions);
    for (const q of finalQ) {
      out.push(_parseMcqQuestion(q.question, q.answer, `api-fin-${n++}`));
    }
    return out;
  }

  function _buildMcqGame(assessmentQuestions) {
    const mcqs = assessmentQuestions.filter(q => q.type === 'mcq' && q.options && q.options.length >= 2);
    if (!mcqs.length) return null;
    return {
      type: 'mcq-game',
      title: 'Check Your Understanding',
      instructions: 'Answer from what you learned in this lesson.',
      items: mcqs.slice(0, 6).map(q => ({
        question: q.question,
        options: q.options,
        correct: q.correct,
        hint: q.explanation
      }))
    };
  }

  function _primarySubtopic(topic) {
    const sts = topic.subtopics || [];
    return sts.find(st => st.mandatory !== false) || sts[0];
  }

  function _applyContentToTopic(topic, content) {
    topic._apiContent = content;
    const st = _primarySubtopic(topic);
    if (!st) return content;

    let concepts = _asList(content.concepts)
      .map(_mapApiConcept)
      .filter(c => c.body && c.body !== 'Read this concept carefully.');

    if (!concepts.length) {
      concepts = _asList(content.hooks).map(_mapHookItem);
    }
    if (!concepts.length) {
      concepts = _asList(content.triggers)
        .map(_mapTriggerItem)
        .filter(Boolean);
    }
    if (!concepts.length) {
      concepts = [{
        title: topic.name,
        body: 'Lesson content is not available yet for this topic. The published curriculum files may be missing or incomplete — ask your mentor to verify published/Grade_6 content for this subject.',
        visual: '⚠️',
        examples: ['Check that concept_cards and curiosity_hooks JSON files are populated for this topic.']
      }];
    }

    st.concepts = concepts;

    const hints = _mapHookHints(content.hooks);
    if (hints.length) st.aiHints = hints;

    const assessment = _mapAssessments(content.assessments);
    if (assessment.length) {
      st.assessment = assessment;
      const game = _buildMcqGame(assessment);
      if (game) st.game = game;
    }

    console.log('[GKContent] applied', concepts.length, 'concepts,', assessment.length, 'assessment items for', topic.name);
    return content;
  }

  async function fetchContent(subjectName, githubFolder) {
    const key = _topicKey(subjectName, githubFolder);
    if (_cache[key]) return _cache[key];

    const url = `/api/content/${encodeURIComponent(subjectName)}/${encodeURIComponent(githubFolder)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.ok) {
      console.warn('[GKContent] fetch failed:', data.error || res.status);
      return null;
    }
    _cache[key] = data.content;
    return data.content;
  }

  async function loadAndApply(topicData) {
    const topic = topicData && topicData.topic;
    const subjectName = topicData && topicData.subject && topicData.subject.name;
    const folder = topic && topic.githubFolder;
    if (!topic || !subjectName || !folder) return null;

    const content = await fetchContent(subjectName, folder);
    if (!content) return null;
    return _applyContentToTopic(topic, content);
  }

  /** Preload all math/science topics that use githubFolder (before student opens a module). */
  async function preloadApiSubjects() {
    if (typeof GK_TOPICS === 'undefined') return;
    const jobs = [];
    for (const subject of GK_TOPICS.subjects) {
      if (!API_SUBJECT_IDS.includes(subject.id)) continue;
      for (const topic of subject.topics || []) {
        if (!topic.githubFolder) continue;
        jobs.push(loadAndApply({ subject, topic }));
      }
    }
    await Promise.all(jobs);
    console.log('[GKContent] preloaded', jobs.length, 'API topic(s)');
  }

  return { fetchContent, loadAndApply, preloadApiSubjects };
})();
