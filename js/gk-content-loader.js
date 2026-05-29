// ============================================================
// GKContentLoader — maps GET /api/content → in-memory topic data
// Lesson flow per cycle: Curiosity Hook → Concept → Light Assessment
// After all cycles: Deep Dive → Final Assessment → Project
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

  function extractVideoUrl(text) {
    const raw = String(text || '').trim();
    if (!raw) return null;

    const srcAttr = raw.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (srcAttr && /^https?:\/\//i.test(srcAttr[1])) {
      return srcAttr[1].trim();
    }

    if (/^https?:\/\//i.test(raw)) return raw.replace(/[.,;)\]]+$/, '');

    const urls = raw.match(/https?:\/\/[^\s<>"']+/gi);
    if (!urls || !urls.length) return null;

    const preferred = urls.find(u => /youtube\.com|youtu\.be|vimeo\.com|drive\.google/i.test(u));
    return (preferred || urls[0]).replace(/[.,;)\]]+$/, '');
  }

  function _isVideoHtml(value) {
    const v = String(value || '');
    return /<iframe\b/i.test(v) || /\bsrc\s*=\s*["']https?:\/\//i.test(v);
  }

  /**
   * Turn a pasted link or embed HTML into a watchable player spec.
   * Returns null if the value is only a title with no URL.
   */
  function parseVideoEmbed(input) {
    const url = extractVideoUrl(input);
    if (!url) return null;

    let yt = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (yt) {
      return {
        kind: 'iframe',
        src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1`,
        label: 'Lesson video'
      };
    }

    let vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeo) {
      return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeo[1]}`, label: 'Lesson video' };
    }

    let drive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (drive) {
      return {
        kind: 'iframe',
        src: `https://drive.google.com/file/d/${drive[1]}/preview`,
        label: 'Lesson video'
      };
    }

    if (/\.(mp4|webm|ogg|m3u8)(\?|#|$)/i.test(url)) {
      return { kind: 'video', src: url, label: 'Lesson video' };
    }

    if (/youtube\.com|youtu\.be|vimeo\.com|drive\.google/i.test(url)) {
      return { kind: 'iframe', src: url, label: 'Lesson video' };
    }

    return { kind: 'link', href: url, label: String(input || '').trim() || 'Watch video' };
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

    let videoTitle = c.video ? String(c.video).trim() : '';
    let videoLink = (c.video_link || c.video_url || '').trim();

    // Legacy: URL or iframe was pasted in "video" — treat as link, not title
    if (!videoLink && videoTitle) {
      const urlInVideo = extractVideoUrl(videoTitle);
      if (urlInVideo || _isVideoHtml(videoTitle)) {
        videoLink = urlInVideo || extractVideoUrl(videoTitle) || '';
        videoTitle = '';
      }
    }

    const videoEmbed = videoLink ? parseVideoEmbed(videoLink) : null;

    const visualParts = [];
    if (c.keyword) visualParts.push(`Keyword: ${c.keyword}`);
    if (c.image && !/^https?:\/\//i.test(String(c.image).trim())) visualParts.push(c.image);
    if (c.observe) visualParts.push(`Observe: ${c.observe}`);

    return {
      title: card.concept_title || 'Concept',
      body: bodyParts.filter(Boolean).join('\n\n') || 'Read this concept carefully.',
      keyword: c.keyword || null,
      video: videoTitle || null,
      videoTitle: videoTitle || null,
      videoLink: videoLink || null,
      videoUrl: videoLink || null,
      videoEmbed,
      image: c.image ? String(c.image).trim() : null,
      observe: c.observe || null,
      visual: visualParts.join('\n') || '📖',
      examples: examples.length ? examples : ['See lesson content above.']
    };
  }

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
      visual: '✨',
      examples: ['Think about this before you read the concept.']
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

  /** Short blurb for Today's Schedule cards (first curiosity hook or concept). */
  function scheduleDescriptionFromContent(content) {
    if (!content) return null;
    const hooks = _asList(content.hooks);
    for (const hook of hooks) {
      const text = String((hook && hook.content) || '').trim();
      if (text.length >= 20) return text.slice(0, 220);
    }
    for (const card of _asList(content.concepts)) {
      const c = card.content || {};
      const text = String(c.meaning || c.definition || (card.experience && card.experience.narration) || '').trim();
      if (text.length >= 20) return text.slice(0, 220);
    }
    const deep = content.deepDive && String(content.deepDive.content || '').trim();
    if (deep && deep.length >= 20) return deep.slice(0, 220);
    return null;
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

  function _mapLightAssessmentQuestions(block, blockIndex) {
    const qs = _asList(block && block.questions);
    return qs.map((q, qi) => _parseMcqQuestion(q.question, q.answer, `api-la-${blockIndex}-${qi}`));
  }

  function _mapAssessments(assessments) {
    const out = [];
    if (!assessments || typeof assessments !== 'object') return out;

    const light = _asList(assessments.light_assessments);
    let n = 0;
    for (const block of light) {
      out.push(..._mapLightAssessmentQuestions(block, n++));
    }

    const finalQ = _asList(assessments.final_assessment && assessments.final_assessment.questions);
    for (const q of finalQ) {
      out.push(_parseMcqQuestion(q.question, q.answer, `api-fin-${n++}`));
    }
    return out;
  }

  function _mapFinalAssessment(assessments) {
    if (!assessments || !assessments.final_assessment) return [];
    return _asList(assessments.final_assessment.questions).map((q, i) =>
      _parseMcqQuestion(q.question, q.answer, `api-fin-${i}`)
    );
  }

  function _mapDeepDive(deepDive) {
    if (!deepDive || typeof deepDive !== 'object') return null;
    const body = String(deepDive.content || '').trim();
    if (!body) return null;
    return {
      title: deepDive.title || 'Deep Dive',
      body: body.slice(0, 12000),
      visual: '🔍',
      examples: ['Take your time — think deeply about each question.']
    };
  }

  function _mapProjectZone(project) {
    if (!project || typeof project !== 'object') return null;
    const projects = _asList(project.projects);
    if (!projects.length && !project.content) return null;
    const lines = projects.map(p => {
      const title = p.project_title || p.title || 'Project';
      const obj = p.project_objective || p.objective || '';
      return `• ${title}${obj ? ` — ${obj}` : ''}`;
    });
    const body = lines.length
      ? lines.join('\n')
      : String(project.content || '').slice(0, 8000);
    return {
      title: project.title || 'Project Activity',
      body,
      visual: '🛠️',
      projects,
      examples: ['Choose one project and share with your mentor when ready.']
    };
  }

  function _buildLessonCycles(content) {
    const hooks = _asList(content.hooks);
    let concepts = _asList(content.concepts)
      .map(_mapApiConcept)
      .filter(c => c.body && c.body !== 'Read this concept carefully.');

    if (!concepts.length) {
      concepts = _asList(content.triggers).map(_mapTriggerItem).filter(Boolean);
    }

    const lightBlocks = _asList(content.assessments && content.assessments.light_assessments);
    const n = Math.max(hooks.length, concepts.length, lightBlocks.length, 0);
    const cycles = [];

    for (let i = 0; i < n; i++) {
      const hook = hooks[i] ? _mapHookItem(hooks[i], i) : null;
      const concept = concepts[i] || null;
      const lightAssessment = lightBlocks[i]
        ? _mapLightAssessmentQuestions(lightBlocks[i], i)
        : [];
      if (!hook && !concept) continue;
      cycles.push({
        hook,
        concept: concept || {
          title: hook.title,
          body: hook.body,
          visual: hook.visual,
          examples: hook.examples
        },
        lightAssessment
      });
    }
    return cycles;
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

    const cycles = _buildLessonCycles(content);
    const deepDive = _mapDeepDive(content.deepDive);
    const finalAssessment = _mapFinalAssessment(content.assessments);
    const project = _mapProjectZone(content.project);

    if (cycles.length) {
      st.lessonFlow = { cycles, deepDive, finalAssessment, project };
      st.concepts = cycles.map(c => c.concept).filter(Boolean);
    } else {
      let concepts = _asList(content.concepts).map(_mapApiConcept)
        .filter(c => c.body && c.body !== 'Read this concept carefully.');
      if (!concepts.length) concepts = _asList(content.hooks).map(_mapHookItem);
      if (!concepts.length) {
        concepts = _asList(content.triggers).map(_mapTriggerItem).filter(Boolean);
      }
      if (!concepts.length) {
        concepts = [{
          title: topic.name,
          body: 'Lesson content is not available yet for this topic.',
          visual: '⚠️',
          examples: ['Check published curriculum files for this topic.']
        }];
      }
      st.concepts = concepts;
      st.lessonFlow = null;
    }

    const hints = _mapHookHints(content.hooks);
    if (hints.length) st.aiHints = hints;

    const assessment = _mapAssessments(content.assessments);
    if (assessment.length) {
      st.assessment = assessment;
      const game = _buildMcqGame(assessment);
      if (game) st.game = game;
    }

    const scheduleBlurb = scheduleDescriptionFromContent(content);
    if (scheduleBlurb) {
      topic.scheduleDescription = scheduleBlurb;
      topic.description = scheduleBlurb;
    }

    console.log(
      '[GKContent] applied',
      st.lessonFlow ? `${st.lessonFlow.cycles.length} cycles + chapter extras` : `${st.concepts.length} concepts`,
      'for',
      topic.name
    );
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

    const key = _topicKey(subjectName, folder);
    delete _cache[key];
    const content = await fetchContent(subjectName, folder);
    if (!content) return null;
    return _applyContentToTopic(topic, content);
  }

  async function preloadApiSubjects() {
    if (typeof GK_TOPICS === 'undefined') return;
    const userId = typeof GKStore !== 'undefined' && GKStore.getCurrentUserId
      ? GKStore.getCurrentUserId() : null;
    const published = userId ? GKStore.getPublishedTopicIds(userId) : null;
    const jobs = [];
    for (const subject of GK_TOPICS.subjects) {
      if (!API_SUBJECT_IDS.includes(subject.id)) continue;
      for (const topic of subject.topics || []) {
        if (!topic.githubFolder) continue;
        if (published && !published.has(topic.id)) continue;
        jobs.push(loadAndApply({ subject, topic }));
      }
    }
    await Promise.all(jobs);
    console.log('[GKContent] preloaded', jobs.length, 'published API topic(s)');
  }

  return {
    fetchContent,
    loadAndApply,
    preloadApiSubjects,
    scheduleDescriptionFromContent,
    extractVideoUrl,
    parseVideoEmbed
  };
})();
