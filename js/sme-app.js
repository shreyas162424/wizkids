// ============================================================
// UI LAYER: sme-app.js
// Content SME Portal — review and approve AI-generated
// curriculum content before it enters the student learning path.
//
// Screens: login → dashboard → module-review
// Storage: localStorage key 'gk_sme_reviews'
// ============================================================

window.GKSmeApp = (function () {

  // ── Constants ──────────────────────────────────────────────────────
  const REVIEW_KEY = 'gk_sme_reviews';
  const AUTH_KEY = 'gk_sme_auth';
  // Credentials stored locally — no dependency on external GK_SME global
  const CRED_USER = 'sme';
  const CRED_PASS = 'sme123';
  const DISPLAY_NAME = 'Content SME';
  const PAGE_TITLE = 'Curated Content';

  // ── State ──────────────────────────────────────────────────────────
  const state = {
    screen: 'login',   // 'login' | 'dashboard' | 'module-review'
    loginError: '',
    selectedTopicId: null,
    selectedSubtopicId: null,
    flagging: false,
    filterGrade: 'all',     // 'all' | 'current' | 'next'
    filterSubject: 'all',     // 'all' | subject id
    filterType: 'all',     // 'all' | 'mandatory' | 'optional' | 'next-path'
    filterStatus: 'all'      // 'all' | 'pending' | 'completed'
  };

  // ── Review storage ─────────────────────────────────────────────────

  function getReviews() {
    try { return JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}'); }
    catch (e) { return {}; }
  }

  function saveReview(topicId, subtopicId, status, comment) {
    const r = getReviews();
    if (!r[topicId]) r[topicId] = {};
    r[topicId][subtopicId] = {
      status,
      comment: comment || '',
      reviewedAt: new Date().toISOString()
    };
    localStorage.setItem(REVIEW_KEY, JSON.stringify(r));
  }

  function getReview(topicId, subtopicId) {
    const r = getReviews();
    return (r[topicId] && r[topicId][subtopicId]) || { status: 'pending', comment: '' };
  }

  // ── Auth ───────────────────────────────────────────────────────────

  function isLoggedIn() {
    return sessionStorage.getItem(AUTH_KEY) === '1';
  }

  // ── Data helpers ───────────────────────────────────────────────────

  function findTopic(topicId) {
    for (const subj of GK_TOPICS.subjects) {
      const t = subj.topics.find(function (t) { return t.id === topicId; });
      if (t) return {
        id: t.id, name: t.name, icon: t.icon, xp: t.xp,
        subtopics: t.subtopics, subjectName: subj.name,
        subjectColor: subj.color || '#C4882A'
      };
    }
    return null;
  }

  function getAllTopics() {
    const out = [];
    for (const subj of GK_TOPICS.subjects) {
      for (const t of subj.topics) {
        out.push({
          id: t.id, name: t.name, icon: t.icon, xp: t.xp,
          subtopics: t.subtopics, subjectName: subj.name,
          subjectId: subj.id, subjectColor: subj.color || '#C4882A',
          mandatory: !!t.mandatory, moduleType: t.moduleType || 'standard'
        });
      }
    }
    return out;
  }

  function getFilteredTopics() {
    return getAllTopics().map(function (t) {
      const p = topicProgress(t.id, t.subtopics);
      return { ...t, isEmpty: p.isEmpty };
    }).filter(function (t) {
      if (state.filterGrade === 'current' && t.moduleType === 'next-path') return false;
      if (state.filterGrade === 'next' && t.moduleType !== 'next-path') return false;
      if (state.filterSubject !== 'all' && t.subjectId !== state.filterSubject) return false;
      if (state.filterType === 'mandatory' && !t.mandatory) return false;
      if (state.filterType === 'optional' && (t.mandatory || t.moduleType === 'next-path')) return false;
      if (state.filterType === 'next-path' && t.moduleType !== 'next-path') return false;
      return true;
    });
  }

  function topicProgress(topicId, subtopics) {
    const reviews = getReviews()[topicId] || {};
    let approved = 0, flagged = 0;
    for (const st of subtopics) {
      const r = reviews[st.id] || {};
      if (r.status === 'approved') approved++;
      else if (r.status === 'flagged') flagged++;
    }
    const total = subtopics.length;
    // If total is 0, it counts as 1 pending item (Generation/Review Pending)
    return {
      approved,
      flagged,
      pending: total > 0 ? (total - approved - flagged) : 1,
      total: total || 1,
      isEmpty: total === 0
    };
  }

  function subtopicPrefix(st, idx) {
    return st.lessonPrefix ? st.lessonPrefix + ' ' + (idx + 1) : String(idx + 1);
  }

  // ── Actions ────────────────────────────────────────────────────────

  function login(u, p) {
    u = (u || '').trim();
    p = (p || '').trim();

    if (u === CRED_USER && p === CRED_PASS) {
      sessionStorage.setItem(AUTH_KEY, '1');
      state.screen = 'dashboard';
      state.loginError = '';
    } else {
      state.loginError = 'Invalid credentials.';
    }
    render();
  }

  function logout() {
    sessionStorage.removeItem(AUTH_KEY);
    state.screen = 'login';
    state.loginError = '';
    state.selectedTopicId = null;
    state.selectedSubtopicId = null;
    state.flagging = false;
    render();
  }

  function openModule(topicId) {
    const topic = findTopic(topicId);
    if (!topic) return;
    state.screen = 'module-review';
    state.selectedTopicId = topicId;
    state.flagging = false;
    const firstPending = topic.subtopics.find(
      function (st) { return getReview(topicId, st.id).status === 'pending'; }
    );
    state.selectedSubtopicId = (firstPending || topic.subtopics[0]).id;
    render();
  }

  function backToDashboard() {
    state.screen = 'dashboard';
    state.selectedTopicId = null;
    state.selectedSubtopicId = null;
    state.flagging = false;
    render();
  }

  function setFilter(key, value) {
    if (key === 'grade') state.filterGrade = value;
    if (key === 'subject') state.filterSubject = value;
    if (key === 'type') state.filterType = value;
    if (key === 'status') state.filterStatus = value;
    render();
  }

  function selectSubtopic(stId) {
    state.selectedSubtopicId = (state.selectedSubtopicId === stId) ? null : stId;
    state.flagging = false;
    render();
    if (state.selectedSubtopicId) {
      const el = document.querySelector('.cl-item.cl-expanded');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function approveSubtopic() {
    saveReview(state.selectedTopicId, state.selectedSubtopicId, 'approved', '');
    const topic = findTopic(state.selectedTopicId);
    const pending = topic.subtopics.find(function (st) {
      return st.id !== state.selectedSubtopicId &&
        getReview(state.selectedTopicId, st.id).status === 'pending';
    });
    if (pending) state.selectedSubtopicId = pending.id;
    state.flagging = false;
    render();
    const ca = document.querySelector('.sme-content-area');
    if (ca) ca.scrollTop = 0;
  }

  function startFlag() {
    state.flagging = true;
    render();
    const ta = document.getElementById('sme-flag-comment');
    if (ta) ta.focus();
  }

  function cancelFlag() {
    state.flagging = false;
    render();
  }

  function submitFlag() {
    const ta = document.getElementById('sme-flag-comment');
    const comment = ta ? ta.value.trim() : '';
    saveReview(state.selectedTopicId, state.selectedSubtopicId, 'flagged', comment);
    state.flagging = false;
    render();
  }

  function resetReview(topicId, stId) {
    saveReview(topicId, stId, 'pending', '');
    render();
  }

  function resetAllReviews() {
    if (!confirm('Make all modules pending? This will clear all current approvals and flags.')) return;
    localStorage.removeItem(REVIEW_KEY);
    render();
  }

  // ── Render orchestrator ────────────────────────────────────────────

  function render() {
    if (!isLoggedIn() && state.screen !== 'login') state.screen = 'login';
    const root = document.getElementById('sme-app');
    if (!root) return;
    try {
      if (state.screen === 'login') root.innerHTML = renderLogin();
      else if (state.screen === 'dashboard') root.innerHTML = renderDashboard();
      else if (state.screen === 'module-review') root.innerHTML = renderModuleReview();
    } catch (e) {
      root.innerHTML = '<div style="padding:40px;text-align:center;color:#6B3F1A">' +
        '<p>Something went wrong. <a href="sme.html">Reload</a></p>' +
        '<pre style="font-size:11px;color:#888;margin-top:12px">' + e.message + '</pre></div>';
    }
  }

  // ── Login screen ───────────────────────────────────────────────────

  function renderLogin() {
    return `
      <div class="sme-login-wrap">
        <div class="sme-login-card">
          <div class="sme-login-icon">📋</div>
          <h1 class="sme-login-title">Curated Content</h1>
          <p class="sme-login-sub">Gurukul Learning Path · SME Review Portal</p>
          ${state.loginError
        ? `<div class="sme-alert">${state.loginError}</div>`
        : ''}
          <div class="sme-field">
            <label>Username</label>
            <input type="text" id="sme-u" value="sme" autocomplete="off"
                   onkeydown="if(event.key==='Enter') GKSmeApp.login(document.getElementById('sme-u').value, document.getElementById('sme-p').value)" />
          </div>
          <div class="sme-field">
            <label>Password</label>
            <input type="password" id="sme-p" value="sme123" autocomplete="new-password"
                   onkeydown="if(event.key==='Enter') GKSmeApp.login(document.getElementById('sme-u').value, document.getElementById('sme-p').value)" />
          </div>
          <button type="button"
                  class="sme-btn sme-btn-primary sme-btn-full"
                  onclick="GKSmeApp.login(document.getElementById('sme-u').value, document.getElementById('sme-p').value)">Sign In →</button>
          <p style="text-align:center; margin-top:1rem; font-size:0.82rem;">
            <a href="start.html" style="color:#2563EB; text-decoration:none; font-weight:600;">← Back to Home</a>
          </p>
        </div>
      </div>`;
  }

  // ── Dashboard screen ───────────────────────────────────────────────

  function renderDashboard() {
    // ── global stats (all topics, unfiltered) ──
    const allTopics = getAllTopics();
    let gTotal = 0, gApproved = 0, gFlagged = 0;
    allTopics.forEach(function (t) {
      const p = topicProgress(t.id, t.subtopics);
      gTotal += p.total; gApproved += p.approved; gFlagged += p.flagged;
    });
    const gPending = gTotal - gApproved - gFlagged;

    // ── select helper ──
    function sel(key, stateKey, options) {
      const opts = options.map(function (o) {
        return `<option value="${o.v}"${stateKey === o.v ? ' selected' : ''}>${o.l}</option>`;
      }).join('');
      return `
        <div class="sme-select-wrap">
          <label>${options[0] ? key : key}</label>
          <select onchange="GKSmeApp.setFilter('${key.toLowerCase().replace(' ', '')}', this.value)">${opts}</select>
        </div>`;
    }

    const subjOpts = [{ v: 'all', l: 'All Subjects' }].concat(
      GK_TOPICS.subjects.map(function (s) { return { v: s.id, l: s.name }; })
    );

    // ── filtered module cards (metadata + status filters) ──
    const visible = getFilteredTopics().filter(function (t) {
      if (state.filterStatus === 'all') return true;
      const p = topicProgress(t.id, t.subtopics);
      if (state.filterStatus === 'pending') return p.pending > 0;
      if (state.filterStatus === 'completed') return p.pending === 0;
      return true;
    });
    const cards = visible.length === 0
      ? '<p class="sme-no-results">No modules match the selected filters.</p>'
      : visible.map(function (t) {
        const prog = topicProgress(t.id, t.subtopics);
        const allDone = prog.pending === 0;
        const flagged = prog.flagged > 0;
        const pctA = prog.total ? Math.round((prog.approved / prog.total) * 100) : 0;
        const pctF = prog.total ? Math.round((prog.flagged / prog.total) * 100) : 0;
        const chipCls = allDone ? (flagged ? 'sme-chip-flagged' : 'sme-chip-approved') : 'sme-chip-pending';
        const chipLbl = t.isEmpty ? '⚠️ Pending Gen' : (allDone ? (flagged ? '⚑ Has Flags' : '✅ Done') : '● ' + prog.pending + ' Pending');
        const gradeLbl = t.moduleType === 'next-path' ? 'Grade 7+' : 'Grade 6';
        const typeLbl = t.mandatory ? '🏅 Mandatory' : (t.moduleType === 'suggested' ? '💡 Suggested' : '🚀 Advanced');
        return `
            <div class="sme-card ${allDone && !flagged && !t.isEmpty ? 'sme-card-done' : flagged ? 'sme-card-flagged' : ''}">
              <div class="sme-card-top">
                <span class="sme-card-icon">${t.icon}</span>
                <div class="sme-card-info">
                  <div class="sme-card-name">${t.name}</div>
                  <div class="sme-card-sub">${t.subjectName} · ${gradeLbl} · ${typeLbl}</div>
                </div>
                <span class="sme-status-chip ${chipCls}">${chipLbl}</span>
              </div>
              <div class="sme-prog-bar" title="${t.isEmpty ? 'Generation Pending' : prog.approved + '/' + prog.total + ' reviewed'}">
                <div class="sme-prog-fill sme-prog-approved" style="width:${pctA}%"></div>
                <div class="sme-prog-fill sme-prog-flagged"  style="width:${pctF}%"></div>
              </div>
              <div class="sme-card-foot">
                <span class="sme-card-count">${t.isEmpty ? 'Waiting for content' : prog.approved + '/' + prog.total + ' subtopics reviewed'}</span>
                <button class="sme-btn sme-btn-primary sme-btn-sm"
                        onclick="GKSmeApp.openModule('${t.id}')" ${t.isEmpty ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                  ${allDone && !t.isEmpty ? 'View' : 'Review'} →
                </button>
              </div>
            </div>`;
      }).join('');

    return `
      <div class="sme-layout">
        <header class="sme-header">
          <div class="sme-header-brand" style="display:flex; align-items:center;">
            <img src="img/wizkids-logo.png" alt="Wizkids Logo" style="width:38px; height:auto; margin-right:0.6rem; border-radius:50%;" />
            <div style="text-align:left;">
              <div style="font-size:1.05rem; font-weight:700; color:#6B3F1A; line-height:1;">Wizkids Gurukul</div>
              <div style="font-size:0.7rem; color:rgba(107, 63, 26, 0.7); margin-top:2px;">Curated Content</div>
            </div>
          </div>
          <div class="sme-header-right">
            <span class="sme-stats-pill">
              <span class="sme-stat-ok">${gApproved} ✅</span>
              ${gFlagged ? `<span class="sme-stat-flag">${gFlagged} ⚑</span>` : ''}
              <span class="sme-stat-pen">${gPending} pending</span>
            </span>
             <button class="sme-btn sme-btn-ghost" onclick="GKSmeApp.logout()">Sign Out</button>
          </div>
        </header>

        <div class="sme-main">

          <div class="sme-caption">
            <span class="sme-caption-icon">⚠️</span>
            <div>
              <div class="sme-caption-title">SME Review Accountability</div>
              <p class="sme-caption-body">As Content SME, you are solely responsible for reviewing and approving all AI-generated curriculum content. <strong>Only approved content will be included in the student learning path.</strong> Unapproved or flagged content will be withheld until resolved.</p>
            </div>
          </div>

          <div class="sme-filter-bar">
            ${sel('Grade', state.filterGrade, [{ v: 'all', l: 'All Grades' }, { v: 'current', l: 'Grade 6' }, { v: 'next', l: 'Grade 7+' }])}
            ${sel('Subject', state.filterSubject, subjOpts)}
            ${sel('Type', state.filterType, [{ v: 'all', l: 'All Types' }, { v: 'mandatory', l: 'Mandatory' }, { v: 'optional', l: 'Optional' }, { v: 'next-path', l: 'Next Level' }])}
            ${sel('Status', state.filterStatus, [{ v: 'all', l: 'All Status' }, { v: 'pending', l: 'Review Pending' }, { v: 'completed', l: 'Review Completed' }])}
          </div>

          <div class="sme-module-grid">${cards}</div>
        </div>
      </div>`;
  }

  // ── Module Review screen — classroom accordion ─────────────────────

  function renderModuleReview() {
    const topic = findTopic(state.selectedTopicId);
    if (!topic) return '';

    const prog = topicProgress(topic.id, topic.subtopics);
    const subjectColor = topic.subjectColor;

    // ── helpers ──────────────────────────────────────────────────────

    function stPrefix(st, idx) {
      if (st.lessonPrefix) return st.lessonPrefix + ' ' + (idx + 1);
      if (st.subtopicType === 'challenge') return 'IMP ' + (idx + 1);
      if (st.subtopicType === 'advanced') return 'INT ' + (idx + 1);
      return idx === 0 ? 'EXP ' + (idx + 1) : 'EXP & INT ' + (idx + 1);
    }

    function resourceCards(st) {
      if (st.resources && st.resources.length) {
        return st.resources.map(function (r) {
          var ytId = (r.url && r.url.match(/[?&]v=([^&]+)/)) ? r.url.match(/[?&]v=([^&]+)/)[1] : '';
          var thumb = ytId ? 'https://img.youtube.com/vi/' + ytId + '/mqdefault.jpg' : '';
          var meta = r.duration ? (r.platform || 'Video') + ' · ' + r.duration : (r.platform || 'Resource');
          return `
            <a class="cl-resource-card cl-resource-link" href="${r.url}" target="_blank"
               rel="noopener noreferrer" onclick="event.stopPropagation()">
              <div class="cl-resource-text">
                <div class="cl-resource-name cl-resource-title">${r.title}</div>
                <div class="cl-resource-meta">${meta}</div>
              </div>
              ${thumb ? `<div class="cl-resource-thumb-img"><img src="${thumb}" alt="${r.title}" loading="lazy" /></div>` : ''}
            </a>`;
        }).join('');
      }
      return (st.concepts || []).map(function (c) {
        var isViz = c.visual && c.visual.length > 5;
        return `
          <div class="cl-resource-card">
            <div class="cl-resource-thumb">${isViz ? '🖼️' : '📖'}</div>
            <div class="cl-resource-info">
              <div class="cl-resource-name">${c.title}</div>
              <div class="cl-resource-type">${isViz ? 'Visual Guide' : 'Reading'}</div>
            </div>
          </div>`;
      }).join('');
    }

    // ── single accordion row ──────────────────────────────────────────

    function stRow(st, idx) {
      const rev = getReview(topic.id, st.id);
      const isExpanded = st.id === state.selectedSubtopicId;
      const isFlagging = isExpanded && state.flagging;
      const prefix = stPrefix(st, idx);
      const iconChar = st.subtopicType === 'challenge' ? '⚡'
        : st.subtopicType === 'advanced' ? '📝' : '📋';

      // row-level status badge
      const badge = rev.status === 'approved'
        ? '<span class="sme-status-chip sme-chip-approved">✅ Approved</span>'
        : rev.status === 'flagged'
          ? '<span class="sme-status-chip sme-chip-flagged">⚑ Flagged</span>'
          : '<span class="sme-status-chip sme-chip-pending">⬤ Pending</span>';

      // assessment questions (inside a native <details> — no extra JS state)
      const assessHtml = (st.assessment || []).map(function (q, i) {
        const opts = q.options.map(function (o, oi) {
          return `<span class="sme-assess-opt ${oi === q.correct ? 'sme-opt-correct' : ''}">${String.fromCharCode(65 + oi)}. ${o}</span>`;
        }).join('');
        return `
          <div class="sme-assess-q">
            <div class="sme-assess-qtext">Q${i + 1}: ${q.question}</div>
            <div class="sme-assess-opts">${opts}</div>
            <div class="sme-assess-expl">💡 ${q.explanation}</div>
          </div>`;
      }).join('');
      const assessCount = st.assessment ? st.assessment.length : 0;

      // review action bar
      var reviewBar = '';
      if (rev.status === 'approved') {
        var dt = rev.reviewedAt
          ? new Date(rev.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : '';
        reviewBar = `
          <div class="sme-review-bar sme-review-bar-approved">
            <span>✅ Approved${dt ? ' · ' + dt : ''}</span>
            <button class="sme-btn sme-btn-ghost sme-btn-sm"
                    onclick="event.stopPropagation(); GKSmeApp.resetReview('${topic.id}','${st.id}')">Reset</button>
          </div>`;
      } else if (rev.status === 'flagged') {
        reviewBar = `
          <div class="sme-review-bar sme-review-bar-flagged">
            <span>⚑ Flagged${rev.comment ? ' — "' + rev.comment + '"' : ''}</span>
            <button class="sme-btn sme-btn-ghost sme-btn-sm"
                    onclick="event.stopPropagation(); GKSmeApp.resetReview('${topic.id}','${st.id}')">Reset</button>
          </div>`;
      } else if (isFlagging) {
        reviewBar = `
          <div class="sme-review-bar sme-review-bar-flagging">
            <div class="sme-review-label">Add a note (optional):</div>
            <textarea id="sme-flag-comment" class="sme-flag-textarea" rows="2"
              onclick="event.stopPropagation()"
              placeholder="Describe the issue — e.g. incorrect answer, unclear explanation…"></textarea>
            <div class="sme-flag-actions">
              <button class="sme-btn sme-btn-flag"
                      onclick="event.stopPropagation(); GKSmeApp.submitFlag()">⚑ Submit Flag</button>
              <button class="sme-btn sme-btn-ghost"
                      onclick="event.stopPropagation(); GKSmeApp.cancelFlag()">Cancel</button>
            </div>
          </div>`;
      } else {
        reviewBar = `
          <div class="sme-review-bar">
            <span class="sme-review-bar-label">Review this content:</span>
            <div class="sme-review-btns">
              <button class="sme-btn sme-btn-approve"
                      onclick="event.stopPropagation(); GKSmeApp.approveSubtopic()">✓ Approve</button>
              <button class="sme-btn sme-btn-flag"
                      onclick="event.stopPropagation(); GKSmeApp.startFlag()">⚑ Flag for Revision</button>
            </div>
          </div>`;
      }

      return `
        <div class="cl-item ${rev.status === 'approved' ? 'cl-done' : ''} ${isExpanded ? 'cl-expanded' : ''}"
             style="--subject-color: ${subjectColor}">
          <div class="cl-row" onclick="GKSmeApp.selectSubtopic('${st.id}')">
            <div class="cl-icon-wrap ${st.subtopicType || 'core'}">${iconChar}</div>
            <div class="cl-title-area">
              <span class="cl-prefix-tag">${prefix}</span>
              <span class="cl-item-name">${st.name}</span>
              ${rev.status === 'approved' ? '<span class="cl-done-check">✅</span>' : ''}
            </div>
            <div class="cl-row-meta">
              ${badge}
              <span class="cl-chevron">${isExpanded ? '▲' : '▾'}</span>
            </div>
          </div>
          ${isExpanded ? `
          <div class="cl-body">
            <div class="cl-body-meta">
              <span class="cl-posted-date">${st.subtopicType || 'core'} · ${st.mandatory !== false ? 'Mandatory' : 'Optional'}${st.xp ? ' · ' + st.xp + ' XP' : ''}</span>
            </div>
            <p class="cl-description">${st.description || ''}</p>
            ${(st.resources && st.resources.length) ? `<div class="cl-resources">${resourceCards(st)}</div>` : ''}
            ${assessCount ? `
            <details class="sme-assess-details">
              <summary>Assessment — ${assessCount} question${assessCount !== 1 ? 's' : ''}</summary>
              ${assessHtml}
            </details>` : ''}
            ${reviewBar}
          </div>` : ''}
        </div>`;
    }

    const rows = topic.subtopics.map(function (st, idx) { return stRow(st, idx); }).join('');

    return `
      <div class="sme-layout">
        <header class="sme-header">
          <div class="sme-header-brand" style="display:flex; align-items:center;">
            <button class="sme-btn sme-btn-ghost" style="color:#C4882A;" onclick="GKSmeApp.backToDashboard()">← ${PAGE_TITLE}</button>
            <span class="sme-header-sep">|</span>
            <img src="img/wizkids-logo.png" alt="Wizkids Logo" style="width:30px; height:auto; margin-right:0.4rem;" />
            <span class="sme-brand-name" style="color:#6B3F1A;">${topic.name}</span>
          </div>
          <div class="sme-header-right">
            <span class="sme-prog-pill">${prog.approved}/${prog.total} reviewed${prog.flagged ? ' · ' + prog.flagged + ' flagged' : ''}${prog.pending === 0 ? ' · ✅ Done' : ''}</span>
            <button class="sme-btn sme-btn-ghost" onclick="GKSmeApp.logout()">Sign Out</button>
          </div>
        </header>
        <div class="sme-main">
          <div class="cl-header" style="--subject-color: ${subjectColor}">
            <div class="cl-header-body">
              <span class="cl-header-icon">${topic.icon}</span>
              <div class="cl-header-text">
                <h2 class="cl-course-code">${topic.name}</h2>
                <p class="cl-course-meta">${topic.subtopics.length} subtopic${topic.subtopics.length !== 1 ? 's' : ''} · ${prog.approved} approved · ${prog.pending} pending review</p>
              </div>
            </div>
          </div>
          <div class="cl-list">
            ${rows}
          </div>
        </div>
      </div>`;
  }

  // ── Public API ─────────────────────────────────────────────────────
  return {
    login, logout,
    openModule, backToDashboard, selectSubtopic, setFilter,
    approveSubtopic, startFlag, cancelFlag, submitFlag,
    resetReview, resetAllReviews,
    init: function () {
      if (isLoggedIn()) state.screen = 'dashboard';
      render();
    }
  };

})();

// Init — matches the mentor-app.js pattern: listener outside the IIFE
document.addEventListener('DOMContentLoaded', function () { GKSmeApp.init(); });
