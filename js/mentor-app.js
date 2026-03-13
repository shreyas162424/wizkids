// ============================================================
// MENTOR UI LAYER: mentor-app.js
// Mentor dashboard SPA controller.
// Handles mentor login, student overview, and mentor actions.
// ============================================================

const GKMentorApp = (() => {



  const state = {
    currentScreen: 'login',
    mentor: null,
    students: {},
    selectedStudentId: null,
    suggestionTopicKey: null,
    sidebarCollapsed: true,
    narayanaMsg: '',
    narayanaExpanded: false, // widget state
    mentorMoodSelected: 'high_energy', // Initialized to match UI default
    mentorBrainBattery: 70            // Initialized to match UI default
  };

  const KRISHNA_STATES = {
    default: { img: 'img/krishna-default.png', anim: 'breathe-soft' },
    meditating: { img: 'img/krishna-calm.png', anim: 'sway-subtle' },
    joyful: { img: 'img/krishna-encouraging.png', anim: 'bounce-joy' },
    thinking: { img: 'img/krishna-thinking.png', anim: 'pulse-glow' }
  };

  // ---- Navigation ----
  function navigate(screen, noScroll) {
    state.currentScreen = screen;
    render();
    if (!noScroll) window.scrollTo(0, 0);
  }

  function renderInPlace() {
    // If we are on liveView, don't do a full innerHTML swap as it causes the iframe to blink black
    if (state.currentScreen === 'liveView') {
      const frame = document.getElementById('sacred-mirror-frame');
      if (frame) return; // Let the iframe handle its own sync via storage events
    }
    const scrollY = window.scrollY;
    render();
    window.scrollTo(0, scrollY);
  }

  // ---- Root Render ----
  function render() {
    const app = document.getElementById('mentor-app');
    const screens = {
      login: renderLogin,
      mentorMood: renderMentorMoodEval,
      dashboard: renderDashboard,
      studentDetail: renderStudentDetail,
      liveView: renderLiveView,
      hqGeneration: renderHQGeneration
    };
    const renderer = screens[state.currentScreen] || renderLogin;
    app.innerHTML = renderer();

    attachEvents(state.currentScreen);
  }

  function renderKrishnaBody(mood = 'default', scale = 1) {
    const config = KRISHNA_STATES[mood] || KRISHNA_STATES.default;
    return `
      <div class="krishna-presence ${config.anim}" style="transform: scale(${scale});">
        <div class="krishna-halo"></div>
        <img src="${config.img}" class="krishna-image" alt="My Krishna" />
      </div>
    `;
  }

  function renderNarayanaSays(message) {
    const currentPanel = state.narayanaPanel || 'guidelines';

    return `
      <div class="narayana-sidebar">
        <div class="narayana-identity">
          <div class="narayana-avatar-container">
            <img src="img/narayana-guide.png" class="narayana-avatar-img" alt="Narayana">
            <div class="narayana-pulse-ring"></div>
          </div>
          <div class="narayana-label-group">
            <span class="narayana-sidebar-name">Narayana AI</span>
            <span class="narayana-sidebar-status">Online Guru</span>
          </div>
        </div>

        <div class="narayana-chat-container">
          <div class="narayana-msg-bubble">
            <p>${message || "Namaste, Guru. How can I assist you with your students today?"}</p>
          </div>
          
          <div class="narayana-sidebar-panels">
            <div class="m-tabs">
              <button class="m-tab ${currentPanel === 'guidelines' ? 'active' : ''}" onclick="GKMentorApp.toggleNarayanaPanel('guidelines')">Guidelines</button>
              <button class="m-tab ${currentPanel === 'qa' ? 'active' : ''}" onclick="GKMentorApp.toggleNarayanaPanel('qa')">Q&A Search</button>
            </div>

            ${currentPanel === 'guidelines' ? `
              <div class="narayana-panel-content">
                <ul class="narayana-gl-list">
                  <li><strong>Assessments:</strong> Maintain ≥ 60% for a pass.</li>
                  <li><strong>Promotion:</strong> Requires all mandatory modules completed.</li>
                  <li><strong>Quotients:</strong> PQ and EQ are auto-computed.</li>
                </ul>
              </div>
            ` : ''}

            ${currentPanel === 'qa' ? `
              <div class="narayana-panel-content">
                <div class="narayana-query-row">
                  <input type="text" id="narayana-query-input" class="narayana-query-input" placeholder="Ask about rules..." onkeypress="if(event.key==='Enter') GKMentorApp.sendNarayanaQuery()">
                  <button class="narayana-query-btn" onclick="GKMentorApp.sendNarayanaQuery()">Ask</button>
                </div>
                <div id="narayana-query-response" class="narayana-query-response" style="display:none;"></div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // ---- Krishna: student summary for mentor detail view ----

  function renderKrishnaStudentCard(student, studentId) {
    const name = student.displayName || studentId;
    const completedTopics = student.completedTopics || [];
    const totalXP = student.totalXP || 0;
    const level = GKXPManager.getLevelForXP(totalXP);
    const sessionHistory = GKStore.getSessionHistory(studentId);
    const lastSession = sessionHistory[sessionHistory.length - 1];
    const isPromoted = student.isPromoted;

    const uniqueDays = new Set(sessionHistory.map(s => s.startTime ? s.startTime.split('T')[0] : null).filter(Boolean)).size;
    const hoursSpent = Math.round(sessionHistory.length * 0.5 * 10) / 10;
    const allCompletedSubs = (student.completedSubtopics || []).length;

    // Mood
    const moodSessions = sessionHistory.filter(s => s.mood && s.mood.currentVibe);
    const highCount = moodSessions.filter(s => s.mood.currentVibe === 'high_energy').length;
    const lowCount = moodSessions.filter(s => s.mood.currentVibe === 'low_energy').length;
    const lastMoodVibe = moodSessions.length > 0 ? moodSessions[moodSessions.length - 1].mood.currentVibe : null;
    const moodLabel = lastMoodVibe === 'high_energy' ? 'High Energy' : lastMoodVibe === 'low_energy' ? 'Low Energy' : '—';
    const moodIcon = lastMoodVibe === 'high_energy' ? '⚡' : lastMoodVibe === 'low_energy' ? '😌' : '😐';
    const moodColor = lastMoodVibe === 'high_energy' ? '#FF6F00' : '#757575';
    const moodBorder = lastMoodVibe === 'high_energy' ? '#FFA000' : lastMoodVibe === 'low_energy' ? '#BDBDBD' : '#E0E0E0';
    const moodBg = lastMoodVibe === 'high_energy' ? '#FFF8E1' : '#FAFAFA';
    const moodSub = moodSessions.length === 0 ? 'No mood data' : `⚡ ${highCount} high · 😌 ${lowCount} low`;

    const points = [
      { icon: '📚', label: 'Modules Completed', value: `${completedTopics.length}`, sub: `${allCompletedSubs} subtopics done`, color: '#E8F5E9', border: '#43A047' },
      { icon: '⏱', label: 'Hours in Learning', value: `${hoursSpent}h`, sub: `${sessionHistory.length} sessions`, color: '#E3F2FD', border: '#1E88E5' },
      { icon: '📅', label: 'Days Attended', value: `${uniqueDays}`, sub: uniqueDays > 0 ? `Last: ${_formatDate(lastSession ? lastSession.startTime : null)}` : 'No attendance yet', color: '#FFF8E1', border: '#FFC107' },
      { icon: moodIcon, label: 'Mood', value: moodLabel, sub: moodSub, color: moodBg, border: moodBorder, valColor: moodColor }
    ];

    const photo = student.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentId}`;
    return `
      <div class="ksc-wrapper">
        <div class="student-card-profile">
          <div class="card-avatar-wrap">
            <img src="${photo}" alt="${name}" class="card-avatar" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=${studentId}';">
          </div>
          <div class="card-student-meta">
            <h3 class="card-student-name">${name}</h3>
            <p class="card-student-grade">Grade ${student.grade || '6'}</p>
          </div>
        </div>


        <!-- Krishna presenter row removed as per user request -->
        <div class="ksc-speech-bubble" style="margin-left: 0;">
            <div class="ksc-speech-text">Look at ${name}'s results 🙏</div>
            <div class="ksc-speech-sub">Grade ${student.grade || '?'} · ${student.preferredStyle || 'visual'} learner${isPromoted ? ' · ⬆️ Promoted' : ''}</div>
          </div>
        </div>

        <!-- 4 highlight chips -->
        <div class="ksc-highlights-row">
          ${points.map(p => `
            <div class="ksc-chip" style="background:${p.color}; border-bottom: 3px solid ${p.border};">
              <div class="ksc-chip-icon">${p.icon}</div>
              <div class="ksc-chip-val" ${p.valColor ? `style="color:${p.valColor};"` : ''}>${p.value}</div>
              <div class="ksc-chip-label">${p.label}</div>
              <div class="ksc-chip-sub">${p.sub}</div>
            </div>`).join('')}
        </div>

      </div>`;
  }

  function renderKrishnaSays(message, mood = 'thinking') {
    return `
      <div class="krishna-initiator-v3 krishna-initiator-column">
        <div class="krishna-speech-cloud">
          <span class="krishna-initiator-name">✨ Co-Mentor Krishna</span>
          <div class="krishna-initiator-text">${message}</div>
        </div>
        <div class="krishna-mini-body">
           ${renderKrishnaBody(mood, 1.0)}
        </div>
      </div>`;
  }

  function renderLogin() {
    return `
      <div class="screen screen-login">
        <div class="login-card">
          <div class="login-logo">
            <img src="img/wizkids-logo.png" alt="Wizkids Gurukul" style="width: 100px; height: auto; margin-bottom: 0.5rem;" />
            <h1 class="logo-title">Wizkids Gurukul</h1>
            <p class="logo-subtitle">Mentor Dashboard</p>
          </div>
          <form id="mentor-login-form" class="login-form">
            <div class="form-group">
              <label for="username">Mentor Username</label>
              <input type="text" id="username" placeholder="Enter mentor username"
                autocomplete="off" value="mentor" />
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" placeholder="Enter password" value="mentor123" />
            </div>
            <div id="login-error" class="error-msg hidden"></div>
            <button type="submit" class="btn btn-primary btn-full">
              Enter Mentor Dashboard 🎓
            </button>
          </form>
          <p class="login-hint">Demo: mentor / mentor123</p>
          <p class="login-hint"><a href="start.html" class="back-link">← Back to Home</a></p>
        </div>
      </div>`;
  }


  // ---- SCREEN 1b: Mentor Mood Evaluation ----
  function renderMentorMoodEval() {
    const sel = state.mentorMoodSelected;
    const battery = state.mentorBrainBattery;
    const canSubmit = sel !== null;
    const vibeKeys = Object.keys(GKMoodEngine.VIBE_LABELS);

    return `
      <div class="screen screen-mentor screen-mood">
        ${renderMentorHeader()}
        <div class="screen-agent-row mood-unified-layout">
          ${_narayanaHtml('mentorMood', { _customMsg: "Aum! 🙏 Take a moment to reflect on your energy today, Guru. How are you feeling before you guide your students?" })}
          <div class="screen-content-col mood-glass-container">
            <div class="mood-card" style="width: 100%; max-width: 650px; margin: 0 auto; box-shadow: 0 30px 70px rgba(0,0,0,0.12);">
              <div class="mood-header">
                
                
                <p>Sync your energy with the Gurukul resonance.</p>
              </div>

              <div class="mood-section">
                <label class="mood-label" style="align-items: center; justify-content: flex-start; margin-bottom: 0.4rem;">
                  <span id="mentor-battery-label-text">🔋 Brain Battery</span>
                  <span id="mentor-battery-pct" style="margin-left: auto; font-weight: 700; color: var(--m-accent);">${battery}%</span>
                </label>
                <div style="text-align: left; margin-bottom: 0.5rem;">
                  <span id="mentor-battery-desc" style="font-size:0.85rem; color:#F57C00; font-weight:600;">
                    ${battery >= 70 ? 'Radiant & Ready' : battery >= 40 ? 'Stable & Focused' : 'Needs Contemplation'}
                  </span>
                </div>
                <input type="range" min="0" max="100" value="${battery}"
                       class="battery-slider"
                       oninput="GKMentorApp.updateMentorBattery(this.value)">
                <div class="battery-track" style="justify-content: space-between; margin-top: 0.4rem;">
                  <span style="font-weight: bold; color: #888;">0%</span>
                  <span style="font-weight: bold; color: #888;">100%</span>
                </div>
              </div>

              <div class="mood-section">
                <label class="mood-label">Current Vibe</label>
                <div class="vibe-options">
                  ${vibeKeys.map(key => {
      const v = GKMoodEngine.VIBE_LABELS[key];
      return `
                      <button class="vibe-btn ${sel === key ? 'selected' : ''}" 
                           onclick="GKMentorApp.selectMentorMood('${key}')">
                         <span class="vibe-emoji">${v.emoji}</span>
                         <span class="vibe-label">${v.label}</span>
                      </button>`;
    }).join('')}
                </div>
              </div>

              <div class="mood-action-row">
                <button class="btn btn-primary mood-action-btn" style="width: 100%;" 
                        onclick="GKMentorApp.submitMentorMood()" ${canSubmit ? '' : 'disabled'}>
                  ${canSubmit ? 'Enter Sacred Workspace →' : 'Align Energy to Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ---- SCREEN 2: Student Dashboard ----
  function renderDashboard() {
    return `
      <div class="screen screen-mentor">
        ${renderMentorHeader()}
        <div class="screen-full-col">
          <div class="mentor-content">
            <div class="mentor-page-header">
              <h2>Guru Dashboard</h2>
              <p>Monitor your students' progress and holistic development.</p>
            </div>
            
            <div class="student-grid">
              ${Object.keys(state.students).length === 0
        ? '<div class="empty-state">No students found.</div>'
        : Object.entries(state.students).map(([id, s]) => renderStudentCard(id, s)).join('')
      }
            </div>
          </div>
        </div>
        ${_narayanaHtml('dashboard')}
      </div>
    `;
  }

  function renderStudentCard(userId, student) {
    const sessionHistory = GKStore.getSessionHistory(userId);
    const tracking = _getQuotientProgress(student);
    const totalDone = tracking.IQ.done + tracking.SQ.done;
    const totalPossible = tracking.IQ.total + tracking.SQ.total;
    const progress = Math.round((totalDone / totalPossible) * 100) || 0;
    const isPromoted = student.level > 1;
    const photo = student.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;

    return `
      <div class="student-card premium-card ${isPromoted ? 'promoted-glow' : ''}" onclick="GKMentorApp.selectStudent('${userId}')">
        <div class="card-top">
          <div class="user-profile-sm">
            <div class="avatar-halo">
              <img src="${photo}" alt="${student.displayName}" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}';">
            </div>
            <div class="user-meta">
              <span class="u-name">${student.displayName}</span>
              <span class="u-grade">Grade ${student.grade || '6'}</span>
            </div>
          </div>
          ${isPromoted ? '<div class="crown-badge">👑</div>' : '<div class="progress-dot"></div>'}
        </div>
        
        <div class="card-stats-row">
          <div class="mini-stat">
            <span class="ms-val">${student.level || 1}</span>
            <span class="ms-label">Level</span>
          </div>
          <div class="mini-stat">
            <span class="ms-val">${student.xp || 0}</span>
            <span class="ms-label">XP</span>
          </div>
          <div class="mini-stat">
            <span class="ms-val">${(student.completedTopics || []).length}</span>
            <span class="ms-label">Topics</span>
          </div>
        </div>

        <div class="card-progress-section">
          <div class="cp-info">
            <span class="cp-lbl">Curriculum Mastery</span>
            <span class="cp-pct">${progress}%</span>
          </div>
          <div class="cp-track">
            <div class="cp-fill" style="width: ${progress}%"></div>
          </div>
        </div>

        <div class="card-footer-maang">
          <div class="session-pill">
            <span class="sp-icon">⚡</span> ${sessionHistory.length} Sessions
          </div>
          <div class="action-hint">View Profile →</div>
        </div>
      </div>`;
  }

  // ---- SCREEN 3: Student Detail ----

  // Krishna shows student-specific summary when mentor opens a student's dashboard
  function getKrishnaStudentSummary(student) {
    const name = student.displayName || student.name || 'Student';
    const profile = JSON.parse(localStorage.getItem('gk_profile_' + student.id) || '{}');
    const completedTopics = profile.completedTopics || [];
    const totalXP = profile.totalXP || 0;
    const sessions = JSON.parse(localStorage.getItem('gk_session_history_' + student.id) || '[]');

    let summary = `Namaste Guru! Here is ${name}'s journey so far:\n\n`;

    if (completedTopics.length > 0) {
      summary += `\u2705 Completed ${completedTopics.length} module(s): ${completedTopics.slice(0, 3).join(', ')}${completedTopics.length > 3 ? '...' : ''}\n`;
    } else {
      summary += `\ud83d\udcda ${name} hasn't completed any modules yet.\n`;
    }

    summary += `\u2728 Total XP: ${totalXP}\n`;
    summary += `\ud83d\udcc5 Sessions attended: ${sessions.length}\n`;

    // Check for areas needing attention
    const attempts = JSON.parse(localStorage.getItem('gk_assessment_attempts_' + student.id) || '{}');
    const weakAreas = [];
    Object.entries(attempts).forEach(([key, arr]) => {
      if (arr && arr.length > 0) {
        const latest = arr[arr.length - 1];
        if (latest.percentage < 60) weakAreas.push(key);
      }
    });

    if (weakAreas.length > 0) {
      summary += `\u26a0\ufe0f Needs attention in: ${weakAreas.join(', ')}\n`;
    } else if (completedTopics.length > 0) {
      summary += `\ud83c\udf1f ${name} is doing excellent! All assessments passed.\n`;
    }

    return summary;
  }

  function renderStudentDetail() {
    const id = state.selectedStudentId;
    const student = state.students[id];
    if (!student) return `<div class="screen"><p>Student not found.</p></div>`;

    const assessmentAttempts = GKStore.getAssessmentAttempts(id);
    const assessmentList = Object.values(assessmentAttempts).flat();
    const sessionHistory = GKStore.getSessionHistory(id);
    const quotientTracking = _getQuotientProgress(student);

    // Compute stats for the 4 boxes
    const totalDone = quotientTracking.IQ.done + quotientTracking.SQ.done;
    const totalPossible = quotientTracking.IQ.total + quotientTracking.SQ.total;
    const progressPerc = Math.round((totalDone / totalPossible) * 100) || 0;
    const uniqueDays = new Set(sessionHistory.map(s => s.startTime ? s.startTime.split('T')[0] : null).filter(Boolean)).size;
    const moodEmoji = student.moodEmoji || '🙂';

    return `
      <div class="screen screen-mentor">
        ${renderMentorHeader()}
        <div class="screen-full-col">
          <div class="mentor-content">
            <div class="detail-nav-row">
              <button class="btn btn-ghost btn-sm" onclick="GKMentorApp.navigate('dashboard')">← Dashboard</button>
              <div class="detail-nav-actions">
                <button class="p-header-btn btn-live-view" onclick="GKMentorApp.navigate('liveView')">👁️ VIEW LIVE SCREEN</button>
                <div class="detail-header-id">ID: ${id.toUpperCase()}</div>
              </div>
            </div>

            <!-- Unified Summary & Stats (Student-Friendly Look) -->
            <div class="summary-unified-hero">
              <div class="uh-analysis">
                <div class="uh-label">System Analysis & Insights</div>
                <div class="uh-text">
                  ${student.displayName} has completed <strong>${totalDone} out of ${totalPossible}</strong> modules. 
                  With a progress of <strong>${progressPerc}%</strong>, they are following a consistent learning curve. 
                  Recent assessments show a PASS rate of <strong>${Math.round((assessmentList.filter(a => a.percentage >= 60).length / assessmentList.length) * 100) || 0}%</strong>.
                </div>
              </div>
              <div class="uh-divider"></div>
              <div class="uh-stats-grid">
                <div class="uh-stat">
                  <span class="uh-stat-icon">📚</span>
                  <div class="uh-stat-info">
                    <span class="uh-stat-val">${totalDone}/${totalPossible}</span>
                    <span class="uh-stat-lbl">Modules</span>
                  </div>
                </div>
                <div class="uh-stat">
                  <span class="uh-stat-icon">🏫</span>
                  <div class="uh-stat-info">
                    <span class="uh-stat-val">${progressPerc}%</span>
                    <span class="uh-stat-lbl">Attendance</span>
                  </div>
                </div>
                <div class="uh-stat">
                  <span class="uh-stat-icon">📅</span>
                  <div class="uh-stat-info">
                    <span class="uh-stat-val">${uniqueDays}</span>
                    <span class="uh-stat-lbl">Study Days</span>
                  </div>
                </div>
                <div class="uh-stat">
                  <span class="uh-stat-icon">🧘</span>
                  <div class="uh-stat-info">
                    <span class="uh-stat-val">${moodEmoji}</span>
                    <span class="uh-stat-lbl">Mood</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="premium-detail-grid">
              <div class="detail-column-main">
                <section class="premium-section">
                  <div class="p-section-header">
                    <div class="p-header-info">
                      <h3>Academic & Spiritual Quotient</h3>
                      <p>PASS CRITERIA: 60% SCORE</p>
                    </div>
                  </div>
                  <div class="quotient-premium-grid">
                    <div class="qp-card color-iq-blend">
                      <div class="qp-icon">🧠</div>
                      <div class="qp-content">
                        <div class="qp-title">IQ / Intelligence</div>
                        <div class="qp-meter">
                          <div class="qp-fill" style="width: ${(quotientTracking.IQ.done / quotientTracking.IQ.total) * 100 || 0}%"></div>
                        </div>
                        <div class="qp-meta">${quotientTracking.IQ.done} of ${quotientTracking.IQ.total} Modules Mastered</div>
                      </div>
                    </div>
                    <div class="qp-card color-sq-blend">
                      <div class="qp-icon">✨</div>
                      <div class="qp-content">
                        <div class="qp-title">SQ / Para-Vidya</div>
                        <div class="qp-meter">
                          <div class="qp-fill" style="width: ${(quotientTracking.SQ.done / quotientTracking.SQ.total) * 100 || 0}%"></div>
                        </div>
                        <div class="qp-meta">${quotientTracking.SQ.done} of ${quotientTracking.SQ.total} Modules Mastered</div>
                      </div>
                    </div>
                  </div>
                </section>

                <section class="premium-section">
                  <div class="p-section-header">
                    <div class="p-header-info">
                      <h3>Assessment Log</h3>
                    </div>
                  </div>
                  <div class="maang-premium-table">
                    ${_renderAssessments(id, assessmentAttempts)}
                  </div>
                </section>

                <section class="premium-section dropdown-premium">
                  <div class="p-dropdown-header" onclick="this.parentElement.classList.toggle('active')">
                    <h3>Curriculum Progress Detail</h3>
                    <span class="p-drop-icon">⌄</span>
                  </div>
                  <div class="p-dropdown-content">
                    ${_renderTopicsProgress(student)}
                  </div>
                </section>

                <section class="premium-section dropdown-premium active">
                  <div class="p-dropdown-header" onclick="this.parentElement.classList.toggle('active')">
                    <h3>🚀 Promotion & Path</h3>
                    <span class="p-drop-icon">⌄</span>
                  </div>
                  <div class="p-dropdown-content">
                    <div class="promotion-path-content">
                       <p class="p-path-desc">Unlock advanced modules after current mastery. Promotion allows students to access higher grade curriculum.</p>
                       ${_renderNextPathSection(id, student)}
                    </div>
                  </div>
                </section>

                <!-- Static HQ button removed as it now triggers automatically after promotion -->

                <!-- Evaluation Panel: Always show if student has progress to allow mentor review -->
                <section class="premium-section evaluation-panel-premium prominent-eval-card">
                  <div class="p-section-header" style="background: linear-gradient(135deg, #2D1B0E, #4A2C17); color: #fff; padding: 1.75rem; border-radius: 24px 24px 0 0;">
                    <div class="p-header-info">
                      <h3 style="color: #fff; font-size: 1.2rem;">🎯 Evaluation Process Control</h3>
                      <p style="color: rgba(255,255,255,0.7); font-size: 0.75rem; letter-spacing: 0.05em;">REVIEW TOPICS & APPROVE FOR PROMOTION</p>
                    </div>
                  </div>
                  <div class="eval-topics-list" style="padding: 1.5rem;">
                     ${(Object.keys(assessmentAttempts).length > 0) ? `
                       <p class="eval-guide-text" style="margin-bottom: 1.25rem; font-weight: 700; color: #555; font-size: 0.9rem;">Review completed modules and their assessment scores below.</p>
                       <div class="eval-grid" style="gap: 1rem;">
                          ${Object.keys(assessmentAttempts).map(tk => {
      const attempts = assessmentAttempts[tk] || [];
      const latest = attempts.length > 0 ? attempts[attempts.length - 1] : null;
      const isDone = student.completedTopics && student.completedTopics.includes(tk);

      return `
                              <label class="eval-topic-item" style="background: ${isDone ? '#f0f9f0' : '#fafafa'}; border: 1px solid ${isDone ? '#c8e6c9' : '#eee'}; padding: 1rem; border-radius: 12px; display: flex; align-items: center; gap: 0.75rem; cursor: pointer;">
                                <input type="checkbox" class="eval-topic-cb" value="${tk}" ${isDone ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--m-accent);">
                                <div class="eti-content" style="display: flex; flex-direction: column; flex: 1;">
                                  <span class="eti-name" style="font-weight: 800; font-size: 0.9rem; color: var(--m-primary);">${_formatTopicId(tk)}</span>
                                  <span class="eti-score" style="font-size: 0.75rem; font-weight: 700; color: ${latest ? (latest.percentage >= 60 ? '#27ae60' : '#e74c3c') : '#888'};">
                                    ${latest ? `Score: ${latest.percentage}% (${latest.score}/${latest.total})` : 'No score yet'}
                                  </span>
                                </div>
                                ${isDone ? '<span style="font-size: 1.2rem;">✅</span>' : ''}
                              </label>
                            `;
    }).join('')}
                       </div>
                     ` : `
                       <div class="eval-empty-state" style="text-align:center; padding: 2rem; color: #888; background: #fafafa; border-radius: 16px; border: 1px dashed #ddd;">
                         <p style="font-size: 2rem; margin-bottom: 0.5rem;">⏳</p>
                         <p style="font-weight: 700; font-size: 0.9rem;">No Assessments Attempted Yet</p>
                         <p style="font-size: 0.8rem;">Once ${student.displayName} completes a topic assessment, it will appear here for your formal appraisal.</p>
                       </div>
                     `}
                  </div>
                  ${(Object.keys(assessmentAttempts).length > 0) ? `
                    <div class="eval-footer" style="padding: 1.25rem 1.5rem; background: #fafafa; border-top: 1px solid #eee; border-radius: 0 0 24px 24px; display: flex; gap: 0.75rem;">
                       <button class="p-btn-accent-lg" style="flex: 2; padding: 1rem; font-size: 1rem;" onclick="GKMentorApp.submitEvaluation('${id}', 'accept')">✅ Approve & Promote Student</button>
                       <button class="btn btn-outline" style="flex: 1; border-radius: 16px; font-weight: 800; font-size: 0.85rem;" onclick="GKMentorApp.submitEvaluation('${id}', 'redo')">🔄 Reject & Reset</button>
                    </div>
                  ` : ''}
                </section>
              </div>

              <div class="detail-column-side">
                <div class="premium-widget feedback-widget">
                  <div class="widget-head">✍️ Wisdom Transmission</div>
                  <div class="widget-body">
                    <div class="feedback-stack">
                      <div class="f-group">
                        <label>GUIDANCE TO STUDENT</label>
                        <textarea id="suggestion-message" placeholder="Type your mentorship guidance..."></textarea>
                        <div class="f-inline-controls">
                          <select id="suggestion-topic" class="p-select-sm">
                            <option value="">General Advice</option>
                            ${student.topicsEnrolled ? Object.keys(student.topicsEnrolled).map(tk => `<option value="${tk}">${tk}</option>`).join('') : ''}
                          </select>
                          <button class="p-btn-sm" onclick="GKMentorApp.sendSuggestion('${id}')">Send</button>
                        </div>
                      </div>
                      
                      <div class="f-divider"></div>

                      <div class="f-group">
                        <label>PRIVATE GURU NOTES</label>
                        <textarea id="admin-feedback-msg" placeholder="Confidential observations..."></textarea>
                        <button class="p-btn-ghost-sm" onclick="GKMentorApp.sendAdminFeedback('${id}')">Save Private Record</button>
                      </div>

                      <div id="note-confirm" class="confirm-pill hidden">✅ Feedback Sent Successfully</div>
                      <div id="admin-feedback-confirm" class="confirm-pill hidden">✅ Note Saved Privately</div>
                    </div>

                    <!-- Merit Award -->
                    <div class="merit-award-section">
                      <label>AWARD MERITS (XP)</label>
                      <div class="f-inline-controls">
                        <select id="reward-amount" class="p-select-sm" style="flex:1;">
                          <option value="50">👍 50 XP</option>
                          <option value="100">✨ 100 XP</option>
                          <option value="200">💎 200 XP</option>
                        </select>
                        <button class="p-btn-accent-sm" onclick="GKMentorApp.rewardStudent('${id}')">Award</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        ${_narayanaHtml('studentDetail')}
      </div>`;
  }

  // ---- Shared: Mentor Header ----
  function renderMentorHeader() {
    const mentor = state.mentor || { displayName: 'Bela', photo: 'img/mentor-photo.png', avatar: '🕉' };
    return `
      <header class="app-header">
          <div class="header-left">
            <img src="img/wizkids-logo.png" alt="Wizkids Logo" class="header-logo-img" />
            <div class="header-title-wrap">
              <div class="header-main-title">Wizkids Gurukul</div>
              <div class="header-sub-title">Mentor View</div>
            </div>
          </div>
        <div class="header-center">
        </div>

        <div class="header-right">
          <div class="mentor-profile-brief">
            <div class="mentor-brief-text">
              <div class="mentor-brief-name">${mentor.displayName}</div>
              <div class="mentor-brief-role">Lead Guru</div>
            </div>
            <div class="header-avatar-wrap">
              <img src="${mentor.photo || 'img/mentor-photo.png'}" class="header-avatar-img" 
                   onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.id || 'mentor'}'; this.style.opacity='0.5';" />
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="GKMentorApp.logout()">Sign Out</button>
        </div>
      </header>`;
  }

  // ---- Event Attachment ----
  function attachEvents(screen) {
    if (screen === 'login') {
      const form = document.getElementById('mentor-login-form');
      if (form) form.addEventListener('submit', handleLogin);
    }
  }

  // ---- Event Handlers ----
  function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (username === GK_MENTOR.username && password === GK_MENTOR.password) {
      state.mentor = GK_MENTOR;
      state.students = GKStore.getAllStudentProfiles();
      navigate('mentorMood');
    } else {
      const errEl = document.getElementById('login-error');
      errEl.textContent = 'Invalid mentor credentials. Try: mentor / mentor123';
      errEl.classList.remove('hidden');
    }
  }

  function viewStudent(userId) {
    state.selectedStudentId = userId;
    state.suggestionTopicKey = null;
    navigate('studentDetail');
  }

  function backToDashboard() {
    state.students = GKStore.getAllStudentProfiles();
    navigate('dashboard');
  }

  function rewardStudent(userId) {
    const amountEl = document.getElementById('reward-amount');
    const amount = parseInt(amountEl.value, 10);
    const reasons = { 50: 'Good effort', 100: 'Well done!', 200: 'Outstanding!', 300: 'Exceptional!' };
    const reason = reasons[amount] || 'Mentor reward';

    GKStore.awardBonusXP(userId, amount, reason);

    const btn = document.getElementById('reward-btn');
    const confirm = document.getElementById('reward-confirm');
    if (btn) { btn.textContent = '✅ Awarded!'; btn.disabled = true; }
    if (confirm) confirm.classList.remove('hidden');

    state.students = GKStore.getAllStudentProfiles();
    setTimeout(() => renderInPlace(), 1500);
  }

  function addToPath(userId, topicKey) {
    GKStore.unlockTopicForStudent(userId, topicKey);
    state.students = GKStore.getAllStudentProfiles();
    renderInPlace();
  }

  function removeFromPath(userId, topicKey) {
    GKStore.lockTopicForStudent(userId, topicKey);
    state.students = GKStore.getAllStudentProfiles();
    renderInPlace();
  }

  function openSuggestionForm(userId, topicKey) {
    state.suggestionTopicKey = topicKey;
    // Scroll to suggestion panel
    navigate('studentDetail');
    setTimeout(() => {
      const panel = document.getElementById('suggestion-panel');
      if (panel) panel.scrollIntoView({ behavior: 'smooth' });
      const select = document.getElementById('suggestion-topic');
      if (select) select.value = topicKey;
    }, 100);
  }

  function sendSuggestion(userId) {
    const topicKey = (document.getElementById('suggestion-topic') || {}).value || '';
    const message = (document.getElementById('suggestion-message') || {}).value || '';
    const focusRaw = (document.getElementById('suggestion-focus') || {}).value || '';
    const focusTopics = focusRaw.split(',').map(s => s.trim()).filter(Boolean);

    if (!message.trim()) {
      const el = document.getElementById('suggestion-message');
      if (el) { el.style.border = '2px solid #C0392B'; el.focus(); }
      return;
    }

    GKStore.addMentorNote(userId, {
      message: message.trim(),
      topicKey: topicKey || null,
      focusTopics
    });

    const confirm = document.getElementById('note-confirm');
    if (confirm) confirm.classList.remove('hidden');

    // Clear inputs
    const msgEl = document.getElementById('suggestion-message');
    const focusEl = document.getElementById('suggestion-focus');
    if (msgEl) msgEl.value = '';
    if (focusEl) focusEl.value = '';

    setTimeout(() => {
      renderInPlace();
    }, 1500);
  }

  function sendAdminFeedback(userId) {
    const message = (document.getElementById('admin-feedback-msg') || {}).value || '';
    if (!message.trim()) {
      const el = document.getElementById('admin-feedback-msg');
      if (el) { el.style.border = '2px solid #C0392B'; el.focus(); }
      return;
    }

    // Save admin feedback to profile (not visible to student)
    const profile = GKStore.getUserProfile(userId) || {};
    if (!profile.adminNotes) profile.adminNotes = [];
    profile.adminNotes.push({
      message: message.trim(),
      createdAt: new Date().toISOString(),
      mentor: state.mentor.displayName
    });
    GKStore.saveUserProfile(userId, profile);

    const confirm = document.getElementById('admin-feedback-confirm');
    if (confirm) confirm.classList.remove('hidden');
    const msgEl = document.getElementById('admin-feedback-msg');
    if (msgEl) msgEl.value = '';

    setTimeout(() => { renderInPlace(); }, 1500);
  }

  function sendParentFeedback(userId) {
    const message = (document.getElementById('parent-feedback-msg') || {}).value || '';
    if (!message.trim()) {
      const el = document.getElementById('parent-feedback-msg');
      if (el) { el.style.border = '2px solid #C0392B'; el.focus(); }
      return;
    }
    const profile = GKStore.getUserProfile(userId) || {};
    if (!profile.parentNotes) profile.parentNotes = [];
    profile.parentNotes.push({
      message: message.trim(),
      createdAt: new Date().toISOString(),
      mentor: state.mentor.displayName
    });
    GKStore.saveUserProfile(userId, profile);
    const confirm = document.getElementById('parent-feedback-confirm');
    if (confirm) confirm.classList.remove('hidden');
    const msgEl = document.getElementById('parent-feedback-msg');
    if (msgEl) msgEl.value = '';
    setTimeout(() => { renderInPlace(); }, 1500);
  }

  function renderNarayanaSays(msg) {
    return `
      <div id="narayana-left-pane" class="narayana-left-pane">
        <div class="narayana-unified-control">
          <div class="nlp-avatar-section">
            <img src="img/narayana-guide.png" alt="Narayana" class="nlp-avatar">
            <div class="nlp-status-dot"></div>
          </div>
          
          <div class="nlp-message-box bubble-style">
            <div class="nlp-bubble-title">Narayana</div>
            <div class="nlp-bubble-text">${msg || "Namaste, Guru. I am Narayana. I am monitoring the learning paths and spiritual progress of your students."}</div>
          </div>

          <div class="nlp-chat-controls">
            <input type="text" id="narayana-query-input" placeholder="Ask Acharya..." onkeydown="if(event.key==='Enter') GKMentorApp.sendNarayanaQuery()">
            <button class="nlp-send-btn" onclick="GKMentorApp.sendNarayanaQuery()">
              <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M2.01 21L23 12L2.01 3L2 10l15 2l-15 2z"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function _narayanaHtml(context, options = {}) {
    const msg = options._customMsg || state.narayanaMsg;
    return renderNarayanaSays(msg);
  }

  function _refreshNarayanaWidget() {
    const existing = document.getElementById('narayana-left-pane');
    if (!existing) return;
    const scrollY = window.scrollY;

    // Use a temporary div to generate the HTML
    const tmp = document.createElement('div');
    tmp.innerHTML = renderNarayanaSays(state.narayanaMsg);
    const narEl = tmp.querySelector('#narayana-left-pane');
    if (narEl) existing.replaceWith(narEl);
    window.scrollTo(0, scrollY);
  }

  function toggleNarayanaExpand() {
    state.narayanaExpanded = !state.narayanaExpanded;
    _refreshNarayanaWidget();
  }

  function toggleNarayanaPanel(panel) {
    state.narayanaPanel = state.narayanaPanel === panel ? null : panel;
    _refreshNarayanaWidget();
  }


  function updateMentorBattery(value) {
    state.mentorBrainBattery = parseInt(value, 10);
    const b = state.mentorBrainBattery;

    // Update labels
    const pctEl = document.getElementById('mentor-battery-pct');
    const descEl = document.getElementById('mentor-battery-desc');
    const labelEl = document.getElementById('mentor-battery-label-text');

    if (pctEl) pctEl.textContent = b + '%';
    if (descEl) {
      descEl.textContent = b >= 70 ? 'Radiant & Ready' : b >= 40 ? 'Stable & Focused' : 'Needs Contemplation';
    }
  }

  function selectMentorMood(vibe) {
    state.mentorMoodSelected = vibe;
    renderInPlace();
  }

  function submitMentorMood() {
    if (!state.mentorMoodSelected) return;
    GKStore.saveMentorMoodLog(state.mentor.id, {
      vibe: state.mentorMoodSelected,
      brainBattery: state.mentorBrainBattery,
      mentor: state.mentor.displayName
    });
    navigate('dashboard');
  }

  function sendNarayanaQuery() {
    const inputEl = document.getElementById('narayana-query-input');
    if (!inputEl) return;
    const query = inputEl.value.trim().toLowerCase();
    if (!query) return;

    const KB = [
      {
        keys: ['promot', 'next level', 'upgrade', 'advance'],
        ans: 'Promotion requires all mandatory modules completed with ≥ 60% score. Use the "Next Learning Path" section to unlock next-level modules.'
      },
      {
        keys: ['assessment', 'score', 'test', 'eval', 'pass', 'fail'],
        ans: 'Assessment scores should be ≥ 60% for a pass. If below 40%, reset the topic for re-study. See "Assessment Evaluation Guidelines" for the full protocol.'
      },
      {
        keys: ['hq', 'holistic quotient'],
        ans: 'HQ (Holistic Quotient) = average of AQ + SQ + PQ + EQ. Enter AQ and SQ in the HQ Assessment section — PQ and EQ are computed automatically.'
      },
      {
        keys: ['mood', 'emotion', 'eq', 'energy'],
        ans: 'EQ is derived from daily mood check-ins during login. Consistent low energy may signal distress — consider involving parents or a counsellor.'
      },
      {
        keys: ['xp', 'reward', 'award', 'point', 'bonus'],
        ans: 'Use the Reward Student section to award 50–300 XP. XP drives the student\'s level progression and motivation.'
      },
      {
        keys: ['feedback', 'parent', 'note', 'message'],
        ans: '"Feedback to Student" is visible to the student. "Mentor\'s Feedback" is saved internally for parent meetings and records.'
      },
      {
        keys: ['attend', 'pq', 'physical', 'day', 'school'],
        ans: 'PQ (Physical Quotient) = unique session days ÷ 20 × 100 (max 100). Encourage regular attendance to improve PQ.'
      },
      {
        keys: ['aq', 'academic quotient'],
        ans: 'AQ (Academic Quotient) is mentor-assessed (0–100) and reflects the student\'s overall academic performance across all topics.'
      },
      {
        keys: ['sq', 'spiritual', 'character', 'value'],
        ans: 'SQ (Spiritual Quotient) is mentor-assessed (0–100) and reflects spiritual development, values and character within the Gurukul system.'
      },
      {
        keys: ['topic', 'module', 'unlock', 'lock', 'progress'],
        ans: 'Use "Topics Progress" to see completed vs pending modules. Use "Next Learning Path" to unlock next-level topics when the student is ready.'
      },
      {
        keys: ['guideline', 'rule', 'protocol', 'help'],
        ans: 'Click "Assessment Evaluation Guidelines" or "Mentor Guidelines" above to view full protocols for each area.'
      }
    ];

    const matched = KB.find(e => e.keys.some(k => query.includes(k)));
    const response = matched
      ? matched.ans
      : 'For this query, please refer to the Assessment Evaluation Guidelines or Mentor Guidelines. You may also contact the Gurukul administrator for further support.';

    const msgEl = document.querySelector('.nlp-bubble-text');
    if (msgEl) {
      msgEl.textContent = response;
    }
    inputEl.value = '';
  }

  // --- Holistic Quotient ---
  function onQuotientInput(userId) {
    const aqEl = document.getElementById('hq-aq-input');
    const sqEl = document.getElementById('hq-sq-input');
    if (!aqEl || !sqEl) return;
    const aq = parseInt(aqEl.value, 10);
    const sq = parseInt(sqEl.value, 10);
    if (isNaN(aq) || isNaN(sq) || aq < 0 || aq > 100 || sq < 0 || sq > 100) return;
    const student = state.students[userId];
    const sessionHistory = GKStore.getSessionHistory(userId);
    const { pq, eq } = _computeSystemQuotients(student, sessionHistory);
    const avg = Math.round((aq + sq + pq + eq) / 4);
    const bloom = _bloomsLevel(avg);
    const panel = document.getElementById('hq-result-panel');
    if (panel) {
      panel.innerHTML = _renderHQResult({ aq, sq, pq, eq, avg, hq: bloom.label }, bloom);
      panel.classList.remove('hidden');
    }
  }

  function saveHolisticScores(userId, holisticData) {
    GKStore.saveHolisticScores(userId, holisticData);
    _showToast("✅ Holistic Quotient Saved!");
    setTimeout(() => navigate('dashboard'), 1500);
  }

  function saveHolisticQuotient(userId) {
    const aqEl = document.getElementById('hq-aq-input');
    const sqEl = document.getElementById('hq-sq-input');
    if (!aqEl || !sqEl) return;
    const aq = parseInt(aqEl.value, 10);
    const sq = parseInt(sqEl.value, 10);
    if (isNaN(aq) || aq < 0 || aq > 100) { if (aqEl) { aqEl.style.border = '2px solid #C0392B'; aqEl.focus(); } return; }
    if (isNaN(sq) || sq < 0 || sq > 100) { if (sqEl) { sqEl.style.border = '2px solid #C0392B'; sqEl.focus(); } return; }
    const student = state.students[userId];
    const sessionHistory = GKStore.getSessionHistory(userId);
    const { pq, eq } = _computeSystemQuotients(student, sessionHistory);
    const avg = Math.round((aq + sq + pq + eq) / 4);
    const bloom = _bloomsLevel(avg);
    const holisticData = {
      aq, sq, pq, eq, avg,
      hq: bloom.label,
      bloomLevel: bloom.level,
      computedAt: new Date().toISOString(),
      computedBy: state.mentor ? state.mentor.displayName : 'Mentor'
    };
    saveHolisticScores(userId, holisticData);
    const panel = document.getElementById('hq-result-panel');
    if (panel) {
      panel.innerHTML = _renderHQResult(holisticData, bloom);
      panel.classList.remove('hidden');
    }
    const confirm = document.getElementById('hq-confirm');
    if (confirm) { confirm.classList.remove('hidden'); setTimeout(() => confirm.classList.add('hidden'), 3000); }
  }

  function promoteStudent(userId) {
    const student = state.students[userId];
    const name = student ? (student.displayName || userId) : userId;

    // Build list of next-path topics that can be unlocked
    const nextPathTopics = [];
    GK_TOPICS.subjects.forEach(subj => {
      if (subj.id === 'aq-challenge') return;
      subj.topics.forEach(t => {
        if (t.moduleType === 'next-path') {
          const key = subj.id + '-' + t.id;
          const alreadyUnlocked = (student.unlockedTopics || []).includes(key);
          nextPathTopics.push({ subject: subj, topic: t, key, alreadyUnlocked });
        }
      });
    });

    let topicChoices = '';
    if (nextPathTopics.length > 0) {
      topicChoices = '\n\nSelect topics to unlock (enter numbers, comma-separated):\n';
      nextPathTopics.forEach((t, i) => {
        topicChoices += `${i + 1}. ${t.subject.icon} ${t.subject.name}: ${t.topic.name}${t.alreadyUnlocked ? ' (already unlocked)' : ''}\n`;
      });
    }

    const input = prompt(`Promote ${name} to the next level?${topicChoices}\nEnter topic numbers to unlock (e.g. 1,2,3) or leave empty to promote without unlocking:`);
    if (input === null) return false; // cancelled

    // Parse selected topic numbers
    if (input.trim()) {
      const nums = input.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      nums.forEach(n => {
        const idx = n - 1;
        if (idx >= 0 && idx < nextPathTopics.length && !nextPathTopics[idx].alreadyUnlocked) {
          GKStore.unlockTopicForStudent(userId, nextPathTopics[idx].key);
        }
      });
    }

    GKStore.promoteStudent(userId);
    state.students = GKStore.getAllStudentProfiles();
    renderInPlace();
    return true;
  }

  function submitEvaluation(userId, decision) {
    const uncheckedBoxes = document.querySelectorAll('.eval-topic-cb:not(:checked)');

    if (decision === 'accept') {
      if (uncheckedBoxes.length > 0) {
        alert("Wait! You have unchecked some topics. If you want the student to re-take them, click 'Request Redo'. Otherwise, check all boxes to Approve everything.");
        return;
      }
      // Trigger unlock topic prompt before promoting
      const promoted = promoteStudent(userId);
      if (!promoted) return; // Prompt cancelled

      GKStore.submitMentorEvaluation(userId, { feedback: '', decision });
      // Go to HQ generation screen instead of just staying here
      navigate('hqGeneration');
      GKStore.awardBonusXP(userId, 500, "Mentor Assessment Passed!");
      GKStore.addMentorNote(userId, {
        message: "🎉 Congratulations! You passed the Mentor Assessment!",
        topicKey: null,
        focusTopics: []
      });
    } else {
      if (uncheckedBoxes.length === 0) {
        alert("Please uncheck the topics you want the student to redo before clicking 'Request Redo'.");
        return;
      }

      const resetTopicKeys = [];
      const resetTopicNames = [];
      uncheckedBoxes.forEach(cb => {
        resetTopicKeys.push(cb.value);
        const label = cb.closest('label');
        if (label) resetTopicNames.push(label.textContent.split('Score:')[0].trim());
      });

      GKStore.resetTopics(userId, resetTopicKeys);
      GKStore.submitMentorEvaluation(userId, { feedback: '', decision });

      GKStore.addMentorNote(userId, {
        message: "📝 Please redo the following topics and their assessments:\n" + resetTopicNames.join(', '),
        topicKey: null,
        focusTopics: resetTopicNames
      });
    }

    // Force real-time cross-tab sync by pinging localStorage with a dummy key (hack to reliably trigger 'storage' event in the other tab)
    localStorage.setItem('gk_mentor_edit_ping', Date.now().toString());

    state.students = GKStore.getAllStudentProfiles();
    renderInPlace();
  }

  function logout() {
    state.mentor = null;
    state.students = {};
    navigate('login');
  }

  // ---- Helpers ----

  function _getQuotientProgress(studentProfile) {
    const tracking = {
      IQ: { done: 0, total: 0, color: '#3A6FA6', name: 'Intelligence (IQ)' },
      SQ: { done: 0, total: 0, color: '#4A7C59', name: 'Para-Vidya (SQ)' }
    };

    const profileSubs = studentProfile.completedSubtopics || [];

    GKRecommender.getAllTopics().forEach(t => {
      const td = GKRecommender.getTopicData(t.subjectId, t.topicId);
      if (td && td.topic && td.topic.moduleType === 'standard' && td.subject.quotient) {
        const q = td.subject.quotient;
        if (tracking[q]) {
          tracking[q].total++;
          // Module is done if all its mandatory subtopics are completed
          const mandatorySubs = td.topic.subtopics.filter(st => st.mandatory !== false);
          const allDone = mandatorySubs.length > 0 && mandatorySubs.every(st =>
            profileSubs.includes(td.topic.id + '-' + st.id)
          );
          if (allDone) tracking[q].done++;
        }
      }
    });
    return tracking;
  }

  // Returns level object for a 0-100 average score
  function _bloomsLevel(score) {
    if (score >= 85) return { level: 6, label: 'Create', category: 'Creative Innovator', icon: '🌟', desc: 'Student creates original solutions and demonstrates full mastery of the subject.', color: '#7B1FA2', bg: '#F3E5F5' };
    if (score >= 70) return { level: 5, label: 'Evaluate', category: 'Reflective Evaluator', icon: '⚖️', desc: 'Student can assess ideas, judge their quality and confidently justify decisions.', color: '#1565C0', bg: '#E3F2FD' };
    if (score >= 55) return { level: 4, label: 'Analyze', category: 'Critical Thinker', icon: '🔍', desc: 'Student can break topics into parts, draw meaningful connections and spot patterns.', color: '#00695C', bg: '#E0F2F1' };
    if (score >= 40) return { level: 3, label: 'Apply', category: 'Skill Practitioner', icon: '🔧', desc: 'Student applies learned knowledge to solve real-world problems and new situations.', color: '#E65100', bg: '#FFF3E0' };
    if (score >= 25) return { level: 2, label: 'Understand', category: 'Concept Learner', icon: '💡', desc: 'Student understands core concepts and can explain or interpret them in their own words.', color: '#F57F17', bg: '#FFFDE7' };
    return { level: 1, label: 'Remember', category: 'Foundation Builder', icon: '📝', desc: 'Student is building basic knowledge and can recall key facts and concepts from memory.', color: '#C62828', bg: '#FFEBEE' };
  }

  // Compute PQ (attendance-based) and EQ (mood/feedback-based) from system data
  function _computeSystemQuotients(student, sessionHistory) {
    // PQ: unique session days / 20 * 100, capped at 100
    const uniqueDays = new Set(
      sessionHistory.map(s => s.startTime ? s.startTime.split('T')[0] : null).filter(Boolean)
    ).size;
    const pq = Math.min(100, Math.round((uniqueDays / 20) * 100));

    // EQ: 50% feedback engagement + 50% positive mood, default 50 if no sessions
    const total = sessionHistory.length;
    if (total === 0) return { pq, eq: 50 };
    const withFeedback = sessionHistory.filter(s => s.feedback && s.feedback.responses).length;
    const highMood = sessionHistory.filter(s => s.mood && s.mood.currentVibe === 'high_energy').length;
    const eq = Math.round(((withFeedback / total) * 50) + ((highMood / total) * 50));
    return { pq, eq };
  }

  // Render the HQ result card — plain-language category breakdown
  function _renderHQResult(data, bloom) {
    const allLevels = [
      {
        level: 1, category: 'Foundation Builder', icon: '📝', color: '#C62828', bg: '#FFEBEE', minScore: 0, maxScore: 24,
        what: 'Student can recall key facts and concepts from memory.',
        how: 'Can list, name and identify what they have learned.'
      },
      {
        level: 2, category: 'Concept Learner', icon: '💡', color: '#F57F17', bg: '#FFFDE7', minScore: 25, maxScore: 39,
        what: 'Student understands core ideas and explains them in own words.',
        how: 'Can interpret, summarise and describe topics with clarity.'
      },
      {
        level: 3, category: 'Skill Practitioner', icon: '🔧', color: '#E65100', bg: '#FFF3E0', minScore: 40, maxScore: 54,
        what: 'Student applies learned knowledge to solve real-world problems.',
        how: 'Can execute, implement and use skills in new situations.'
      },
      {
        level: 4, category: 'Critical Thinker', icon: '🔍', color: '#00695C', bg: '#E0F2F1', minScore: 55, maxScore: 69,
        what: 'Student breaks topics into parts and draws meaningful connections.',
        how: 'Can differentiate, organise and spot patterns across ideas.'
      },
      {
        level: 5, category: 'Reflective Evaluator', icon: '⚖️', color: '#1565C0', bg: '#E3F2FD', minScore: 70, maxScore: 84,
        what: 'Student assesses ideas, judges their quality and justifies decisions.',
        how: 'Can critique, compare and defend conclusions with reasoning.'
      },
      {
        level: 6, category: 'Creative Innovator', icon: '🌟', color: '#7B1FA2', bg: '#F3E5F5', minScore: 85, maxScore: 100,
        what: 'Student creates original solutions and demonstrates full mastery.',
        how: 'Can design, construct and produce new ideas independently.'
      }
    ];

    return `
      <div class="hq-result-card" style="border-left:5px solid ${bloom.color}; background:${bloom.bg};">

        <!-- Summary header -->
        <div class="hq-result-header">
          <span class="hq-bloom-icon">${bloom.icon}</span>
          <div class="hq-bloom-info">
            <div class="hq-bloom-label" style="color:${bloom.color};">${bloom.category}</div>
            <div class="hq-bloom-level">Category ${bloom.level} of 6</div>
          </div>
          <div class="hq-avg-score" style="color:${bloom.color};">HQ&nbsp;${data.avg}</div>
        </div>
        <div class="hq-bloom-desc">${bloom.desc}</div>

        <!-- Score breakdown chips -->
        <div class="hq-scores-row">
          <span class="hq-score-chip">📖 AQ: ${data.aq}</span>
          <span class="hq-score-chip">🕉️ SQ: ${data.sq}</span>
          <span class="hq-score-chip">💪 PQ: ${data.pq}</span>
          <span class="hq-score-chip">❤️ EQ: ${data.eq}</span>
        </div>

        <!-- All categories: score range + student achievement -->
        <div class="hq-catlist">
          <div class="hq-catlist-heading">Student Performance Across All Categories</div>

          ${allLevels.slice().reverse().map(l => {
      const isCurrent = l.level === bloom.level;
      const isAchieved = l.level < bloom.level;
      const isTarget = l.level > bloom.level;
      const gapNeeded = isTarget ? (l.minScore - data.avg) : 0;
      return `
            <div class="hq-catlist-row ${isCurrent ? 'hq-catlist-current' : ''}"
                 style="${isCurrent ? `border-left:4px solid ${l.color}; background:${l.bg};` : 'border-left:4px solid transparent;'}">

              <div class="hq-catlist-left">
                <span class="hq-catlist-icon" style="color:${l.color};">${l.icon}</span>
                <div class="hq-catlist-body">
                  <div class="hq-catlist-name" style="color:${l.color};">${l.category}</div>
                  <div class="hq-catlist-what">${l.what}</div>
                  ${isCurrent ? `<div class="hq-catlist-how">${l.how}</div>` : ''}
                </div>
              </div>

              <div class="hq-catlist-right">
                <div class="hq-catlist-range">Expected: ${l.minScore} – ${l.maxScore}</div>
                <div class="hq-catlist-achieved">Student: ${data.avg}</div>
                <span class="hq-catlist-badge ${isAchieved ? 'hq-badge-achieved' : isCurrent ? 'hq-badge-current' : 'hq-badge-target'}"
                      style="${isCurrent ? `background:${l.color};` : ''}">
                  ${isAchieved ? '✓ Achieved' : isCurrent ? '● Current Level' : `+${gapNeeded} to reach`}
                </span>
              </div>

            </div>`;
    }).join('')}
        </div>

        ${data.computedAt ? `<div class="hq-computed-at">Generated ${_formatDate(data.computedAt)} by ${data.computedBy || 'Mentor'}</div>` : ''}
      </div>`;
  }

  function _renderTopicsProgress(studentProfile) {
    const profileSubs = studentProfile.completedSubtopics || [];
    const unlockedTopics = studentProfile.unlockedTopics || [];

    const visibleTopics = GKRecommender.getAllTopics().filter(t => {
      const td = GKRecommender.getTopicData(t.subjectId, t.topicId);
      if (!td || !td.topic) return false;
      const key = t.subjectId + '-' + t.topicId;
      return td.topic.moduleType !== 'next-path' || unlockedTopics.includes(key);
    });

    const rows = visibleTopics.map(t => {
      const td = GKRecommender.getTopicData(t.subjectId, t.topicId);
      let status = 'pending'; // 'completed', 'inprogress', 'pending'

      if (td && td.topic) {
        const key = t.subjectId + '-' + t.topicId;
        const mandatorySubs = td.topic.subtopics.filter(st => st.mandatory !== false);
        const allSubs = td.topic.subtopics;

        const doneCount = allSubs.filter(st => profileSubs.includes(td.topic.id + '-' + st.id)).length;
        const mandatoryDone = mandatorySubs.every(st => profileSubs.includes(td.topic.id + '-' + st.id));
        const isExplicitlyDone = (studentProfile.completedTopics && studentProfile.completedTopics.includes(key));

        if (mandatoryDone || isExplicitlyDone) {
          status = 'completed';
        } else if (doneCount > 0) {
          status = 'inprogress';
        } else {
          status = 'pending';
        }
      }

      const statusLabels = {
        'completed': 'COMPLETED',
        'inprogress': 'IN PROGRESS',
        'pending': 'ENROLLED'
      };

      return `
        <div class="topic-progress-row-v2 tp-v2-${status}">
          <div class="tp-v2-left">
            <span class="tp-v2-icon">${t.subjectIcon}</span>
            <div class="tp-v2-info">
              <span class="tp-v2-name">${t.topicName}</span>
              <span class="tp-v2-subject">${t.subjectName}</span>
            </div>
          </div>
          <span class="tp-v2-badge">${statusLabels[status]}</span>
        </div>`;
    });
    return `<div class="assessment-v2-list">${rows.length > 0 ? rows.join('') : '<p class="empty-note">No topics in path.</p>'}</div>`;
  }

  function _renderAssessments(userId, assessmentObj) {
    const keys = Object.keys(assessmentObj);
    if (keys.length === 0) return '<p class="empty-note">No attempts yet.</p>';

    const rows = keys.map(topicKey => {
      const attempts = assessmentObj[topicKey];
      const latest = attempts[attempts.length - 1];
      const statusClass = latest.percentage >= 60 ? 'status-pass-v2' : 'status-fail-v2';

      return `
        <div class="assessment-v2-row ${statusClass}">
          <div class="assessment-info">
            <div class="assessment-topic">${_formatTopicId(topicKey)}</div>
            <div class="assessment-meta">Assessed on ${_formatDate(latest.attemptedAt)}</div>
          </div>
          <div class="assessment-score">
            <div class="score-val">${latest.percentage}%</div>
            <div class="score-label">${latest.percentage >= 60 ? 'Mastery' : 'Needs Review'}</div>
          </div>
        </div>`;
    });

    return `<div class="assessment-v2-list">${rows.join('')}</div>`;
  }

  function _renderNextPathSection(userId, studentProfile) {
    const unlockedTopics = studentProfile.unlockedTopics || [];

    // Find all topics marked as 'next-path' but not yet unlocked
    const available = [];
    GK_TOPICS.subjects.forEach(subj => {
      subj.topics.forEach(t => {
        if (t.moduleType === 'next-path') {
          const key = subj.id + '-' + t.id;
          if (!unlockedTopics.includes(key)) {
            available.push({ subject: subj, topic: t, key });
          }
        }
      });
    });

    if (available.length === 0) {
      return `
        <div class="next-path-card empty">
          <p>No new topics available to unlock. All path topics have been assigned.</p>
        </div>`;
    }

    return `
      <div class="next-path-list">
        ${available.map(item => `
          <div class="next-path-item">
            <div class="npi-icon">${item.subject.icon}</div>
            <div class="npi-info">
              <div class="npi-name">${item.topic.name}</div>
              <div class="npi-subject">${item.subject.name}</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="GKMentorApp.addToPath('${userId}', '${item.key}')">Unlock</button>
          </div>
        `).join('')}
      </div>`;
  }



  function _renderFeedbackHistory(sessionHistory) {
    const sessionsWithFeedback = sessionHistory
      .filter(s => s.feedback && s.feedback.responses)
      .slice(-5)
      .reverse();

    if (sessionsWithFeedback.length === 0) {
      return `<p class="empty-note">No feedback submitted yet.</p>`;
    }

    return sessionsWithFeedback.map(s => {
      const formatted = GKFeedback.getFormattedResponses(s.feedback.responses);
      const insights = s.feedback.insights || [];
      return `
        <div class="feedback-history-card">
          <div class="fh-date">📅 ${_formatDate(s.startTime)}</div>
          <div class="fh-responses">
            ${formatted.map(r => `
              <div class="fh-row">
                <span class="fh-question">${r.questionText}</span>
                <span class="fh-answer">${r.label}</span>
              </div>`).join('')}
          </div>
          ${insights.length > 0 ? `
          <div class="fh-insights">
            ${insights.map(i => `<span class="fh-insight">💡 ${i}</span>`).join('')}
          </div>` : ''}
        </div>`;
    }).join('');
  }

  function _formatDate(isoString) {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  function _formatTopicId(tid) {
    if (tid === 'final') return '🏆 Final Assessment';
    return tid.replace(/-/g, ' → ').replace(/\b\w/g, c => c.toUpperCase());
  }


  function renderLiveView() {
    const id = state.selectedStudentId;
    const student = state.students[id];
    if (!student) return `<div class="screen"><p>Student not found.</p></div>`;

    return `
      <div class="screen screen-mentor">
        ${renderMentorHeader()}
        <div class="screen-agent-row">
          ${_narayanaHtml('liveView')}
          <div class="screen-content-col">
            <div class="mentor-content">
              <div class="detail-nav-row" style="margin-bottom:1.5rem;">
               <button class="btn btn-ghost" onclick="GKMentorApp.navigate('studentDetail')">← Back to Profile</button>
              </div>
              <div class="live-view-container">
                <h2 style="margin-bottom:1.5rem; color:#6B3F1A;">👁️ Live Session: Monitoring ${student.displayName}</h2>
                <div class="live-screen-preview" style="height: 750px; border-radius:15px; position:relative; background:#fff; overflow:hidden; border: 4px solid #E2C9A0; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
                   <iframe src="student.html?mirror=true&userId=${id}" 
                           style="width: 100%; height: 100%; border: none; pointer-events: none;"
                           id="sacred-mirror-frame"></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderHQGeneration() {
    const id = state.selectedStudentId;
    const student = state.students[id];
    if (!student) return `<div class="screen"><p>Student not found.</p></div>`;

    const existingHQ = GKStore.getHolisticScores(id);
    const sessionHistory = GKStore.getSessionHistory(id);
    const { pq: sysPQ, eq: sysEQ } = _computeSystemQuotients(student, sessionHistory);

    return `
      <div class="screen screen-mentor">
        ${renderMentorHeader()}
        <div class="screen-agent-row">
          ${_narayanaHtml('hqGeneration', { _customMsg: `Excellent work, Guru! 🙏 ${student.displayName} has been promoted. Now, let's generate their Holistic Quotient report to finalize this milestone.` })}
          <div class="screen-content-col">
            <div class="mentor-content">
              <div class="mentor-page-header">
                <h2>📊 Generate Holistic Quotient (HQ)</h2>
                <p>Finalize the assessment for ${student.displayName} by entering the Academic and Spiritual quotients.</p>
              </div>

              <div class="detail-section hq-generation-container hq-standalone-card">
                <div class="quotient-row-horizontal">
                  <div class="hq-input-card">
                    <div class="hqic-left">
                      <div class="hqic-icon">📖</div>
                      <div class="hqic-meta">
                        <span class="hqic-tag">AQ</span>
                        <span class="hqic-label">Academic Quotient</span>
                      </div>
                    </div>
                    <div class="hqic-right">
                      <input type="number" id="hq-aq-input" class="hq-num-input" min="0" max="100"
                             placeholder="0–100" value="${existingHQ ? existingHQ.aq : ''}" />
                    </div>
                  </div>

                  <div class="hq-input-card">
                    <div class="hqic-left">
                      <div class="hqic-icon">🕉️</div>
                      <div class="hqic-meta">
                        <span class="hqic-tag">SQ</span>
                        <span class="hqic-label">Spiritual Quotient</span>
                      </div>
                    </div>
                    <div class="hqic-right">
                      <input type="number" id="hq-sq-input" class="hq-num-input" min="0" max="100"
                             placeholder="0–100" value="${existingHQ ? existingHQ.sq : ''}" />
                    </div>
                  </div>

                  <div class="hq-status-card">
                    <div class="hqsc-item">
                      <span class="hqsc-val">${sysPQ}</span>
                      <span class="hqsc-lbl">PQ (Auto)</span>
                    </div>
                    <div class="hqsc-sep"></div>
                    <div class="hqsc-item">
                      <span class="hqsc-val">${sysEQ}</span>
                      <span class="hqsc-lbl">EQ (Auto)</span>
                    </div>
                  </div>
                </div>

                <div class="hq-actions-row">
                  <button class="btn btn-primary" onclick="GKMentorApp.generateAndSaveHQ('${id}')">🌟 Generate & Save HQ Report</button>
                  <button class="btn btn-ghost" onclick="GKMentorApp.navigate('dashboard')">Skip for now</button>
                </div>

                <div id="hq-result-panel" class="hidden"></div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function generateAndSaveHQ(userId) {
    const aq = parseInt(document.getElementById('hq-aq-input').value || 0, 10);
    const sq = parseInt(document.getElementById('hq-sq-input').value || 0, 10);
    const student = state.students[userId];
    const sessionHistory = GKStore.getSessionHistory(userId);
    const { pq, eq } = _computeSystemQuotients(student, sessionHistory);
    const avg = Math.round((aq + sq + pq + eq) / 4);
    const bloom = _bloomsLevel(avg);

    const holisticData = {
      aq, sq, pq, eq, avg,
      bloomLevel: bloom.level,
      bloomCategory: bloom.label,
      computedAt: new Date().toISOString(),
      computedBy: state.mentor ? (state.mentor.displayName || state.mentor.username) : 'Mentor'
    };

    GKStore.saveHolisticScores(userId, holisticData);
    _showToast("✅ HQ Report Generated & Saved!");

    // Show a quick preview before returning
    const card = document.querySelector('.hq-standalone-card');
    if (card) {
      card.innerHTML = `
        <div class="hq-final-preview">
          ${_renderHQResult(holisticData, bloom)}
          <div style="margin-top:2rem; text-align:center;">
            <button class="btn btn-primary" onclick="GKMentorApp.navigate('dashboard')">Return to Dashboard</button>
          </div>
        </div>
      `;
    } else {
      setTimeout(() => navigate('dashboard'), 1500);
    }
  }

  function toggleNarayana(forceState) {
    const bubble = document.getElementById('narayana-bubble');
    if (!bubble) return;

    if (forceState !== undefined) {
      if (forceState) bubble.classList.add('active');
      else bubble.classList.remove('active');
    } else {
      bubble.classList.toggle('active');
    }
  }

  function _showToast(msg) {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed; bottom:2rem; right:2rem; background:#2D1B0E; color:#fff; padding:1rem 2rem; border-radius:50px; box-shadow:0 10px 20px rgba(0,0,0,0.3); z-index:10000; animation: slideInUp 0.3s ease-out;';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'fadeOut 0.3s ease-in forwards';
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }

  // ---- Init ----
  function init() {
    if (state.currentScreen === 'dashboard' && !state.mentor) {
      state.mentor = GK_MENTOR;
      state.students = GKStore.getAllStudentProfiles();
    }
    render();

    // Auto-refresh when another tab updates localStorage (e.g. student completing modules)
    window.addEventListener('storage', (e) => {
      if (e.key === 'gk_sync_ping' || e.key === 'gk_user_profiles' || e.key === 'gk_session_log') {
        if (state.mentor) {
          state.students = GKStore.getAllStudentProfiles();
          if (state.selectedStudentId) {
            // Refresh detailed student data too
            const profile = GKStore.getUserProfile(state.selectedStudentId);
            if (profile) state.students[state.selectedStudentId] = { ...state.students[state.selectedStudentId], ...profile };
          }
          renderInPlace();
        }
      }
    });

    // Fallback polling (essential for local file:// cross-tab syncing)
    setInterval(() => {
      if (state.mentor) {
        const newDataRaw = GKStore.getAllStudentProfiles();
        const newDataStr = JSON.stringify(newDataRaw);
        
        if (JSON.stringify(state.students) !== newDataStr) {
          // Identify what changed for Narayana to announce
          Object.keys(newDataRaw).forEach(sid => {
            const oldS = state.students[sid];
            const newS = newDataRaw[sid];
            if (oldS && newS) {
              const oldDone = oldS.completedTopics || [];
              const newDone = newS.completedTopics || [];
              if (newDone.length > oldDone.length) {
                const newTopic = newDone.find(t => !oldDone.includes(t));
                if (newTopic) {
                  const msg = `Guru, ${newS.displayName} has just completed the assessment for ${_formatTopicId(newTopic)}! 🙏`;
                  state.narayanaMsg = msg;
                  if (typeof GKVoice !== 'undefined') GKVoice.speak(msg);
                }
              }
            }
          });

          state.students = newDataRaw;
          if (document.querySelector('.screen-mentor')) {
            renderInPlace();
          }
        }
      }
    }, 2000);
  }

  return {
    init, selectStudent: viewStudent, backToDashboard,
    rewardStudent, promoteStudent, logout,
    addToPath, removeFromPath,
    openSuggestionForm, sendSuggestion,
    sendAdminFeedback, sendParentFeedback, submitEvaluation,
    onQuotientInput, saveHolisticQuotient,
    toggleNarayana,
    selectMentorMood, submitMentorMood, updateMentorBattery,
    navigate, renderLiveView, generateAndSaveHQ
  };

})();

// Boot when DOM ready — v18
document.addEventListener('DOMContentLoaded', () => GKMentorApp.init());
