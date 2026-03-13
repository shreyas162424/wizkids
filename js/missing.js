function submitSubtopicFeedback() {
    const enjoyEl = document.getElementById('stfb-enjoy');
    const improveEl = document.getElementById('stfb-improve');
    const enjoyText = enjoyEl ? enjoyEl.value.trim() : '';
    const improveText = improveEl ? improveEl.value.trim() : '';

    if (!enjoyText && !improveText) {
        document.getElementById('stfb-error').classList.remove('hidden');
        return;
    }

    const feedbackData = {
        type: 'open-ended',
        responses: {
            enjoyedMost: enjoyText,
            improvementPoint: improveText
        }
    };

    if (state._pendingSubtopicKey) {
        GKStore.saveSubtopicFeedback(state.user.id, state._pendingSubtopicKey, feedbackData);
    }
    GKXPManager.awardXP(state.user.id, 'feedbackSubmitted');
    state.subtopicFeedbackResponses = {};
    navigate('subtopics');
}

function skipSubtopicFeedback() {
    state.subtopicFeedbackResponses = {};
    navigate('subtopics');
}

// ---- Module Feedback Handlers ----
function selectModuleFeedback(questionId, value) {
    if (!state.moduleFeedbackResponses) state.moduleFeedbackResponses = {};
    state.moduleFeedbackResponses[questionId] = value;
    render();
}

function submitModuleFeedback() {
    const enjoyEl = document.getElementById('mfb-enjoy');
    const improveEl = document.getElementById('mfb-improve');
    const enjoyText = enjoyEl ? enjoyEl.value.trim() : '';
    const improveText = improveEl ? improveEl.value.trim() : '';

    if (!enjoyText && !improveText) {
        document.getElementById('mfb-error').classList.remove('hidden');
        return;
    }

    const feedbackData = {
        type: 'open-ended',
        responses: {
            enjoyedMost: enjoyText,
            improvementPoint: improveText
        }
    };

    if (state._pendingTopicKey) {
        GKStore.saveModuleFeedback(state.user.id, state._pendingTopicKey, feedbackData);
    }
    GKXPManager.awardXP(state.user.id, 'feedbackSubmitted');
    state.moduleFeedbackResponses = {};
    // After module feedback: continue to next module or back to modules
    if (_hasMoreModules()) {
        startModule(state.activeModuleIdx + 1);
    } else {
        navigate('modules');
    }
}

function skipModuleFeedback() {
    state.moduleFeedbackResponses = {};
    if (_hasMoreModules()) {
        startModule(state.activeModuleIdx + 1);
    } else {
        navigate('modules');
    }
}

// ---- End-of-Session Feedback Handlers ----
function selectFeedback(questionId, value) {
    if (!state.feedbackResponses) state.feedbackResponses = {};
    state.feedbackResponses[questionId] = value;
    render();
}

function submitFeedback() {
    const enjoyEl = document.getElementById('fb-enjoy');
    const improveEl = document.getElementById('fb-improve');
    const enjoyText = enjoyEl ? enjoyEl.value.trim() : '';
    const improveText = improveEl ? improveEl.value.trim() : '';

    if (!enjoyText && !improveText) {
        const errEl = document.getElementById('fb-error');
        if (errEl) errEl.classList.remove('hidden');
        return;
    }

    const feedbackData = {
        type: 'open-ended',
        sessionDate: new Date().toISOString(),
        responses: {
            enjoyedMost: enjoyText,
            improvementPoint: improveText
        }
    };
    GKStore.saveFeedback(feedbackData);
    GKStore.logCompletedSession();
    GKXPManager.awardXP(state.user.id, 'feedbackSubmitted');
    state.feedbackResponses = {};
    navigate('summary');
}

// ---- AI Tutor Handlers ----
function askAI() {
    const input = document.getElementById('ai-input');
    if (!input) return;
    const question = input.value.trim();
    if (!question) return;
    if (!state.aiMessages) state.aiMessages = [];
    state.aiMessages.push({ role: 'user', text: question });
    const response = GKAITutor.respond(question);
    state.aiMessages.push({ role: 'ai', text: response });
    input.value = '';
    render();
    setTimeout(() => {
        const chat = document.getElementById('sidebar-chat');
        if (chat) chat.scrollTop = chat.scrollHeight;
    }, 50);
}

function getHint() {
    if (!state.aiMessages) state.aiMessages = [];
    const hint = GKAITutor.getNextHint();
    state.aiMessages.push({ role: 'ai', text: `💡 Hint: ${hint}` });
    render();
    setTimeout(() => {
        const chat = document.getElementById('sidebar-chat');
        if (chat) chat.scrollTop = chat.scrollHeight;
    }, 50);
}

// ---- Session Flow ----
function goToFeedback() {
    navigate('feedback');
}

function nextModule() {
    const nextIdx = state.activeModuleIdx + 1;
    if (nextIdx < state.modules.length) {
        startModule(nextIdx);
    } else {
        goToFeedback();
    }
}

function startNewSession() {
    state.mood = null;
    state.calibration = null;
    state.modules = [];
    state.activeModuleIdx = 0;
    state.activeSubtopicIdx = 0;
    state.conceptIdx = 0;
    state.phase = 'concepts';
    state.gameState = {};
    state.aiMessages = [];
    state.feedbackResponses = {};
    state.subtopicFeedbackResponses = {};
    state.moduleFeedbackResponses = {};
    state.sessionXP = 0;
    state.expandedDoneModules = new Set();
    state.optionalSubtopicsExpanded = false;
    state.expandedSubtopicIdx = 0;
    state.user = GKAuth.refreshUser();
    navigate('mood');
}


// ---- Notifications System ----
function checkNotifications() {
    if (!state.user) return;
    const badgeEl = document.getElementById('notif-badge');
    if (!badgeEl) return;

    // Check for unread mentor notes
    const unreadNotes = GKStore.getMentorNotes(state.user.id).filter(n => !n.read);

    // Check for recently earned badges (in last 5 mins)
    const recentBadges = GKXPManager.getEarnedBadges(state.user.id).filter(b => (Date.now() - b.earnedAt) < 5 * 60 * 1000);

    const totalUnread = unreadNotes.length + recentBadges.length;

    if (totalUnread > 0) {
        badgeEl.style.display = 'flex';
        badgeEl.textContent = totalUnread;
    } else {
        badgeEl.style.display = 'none';
        badgeEl.textContent = '0';
    }
}

function toggleNotifications() {
    const overlay = document.getElementById('notif-overlay');
    if (!overlay) return;

    if (overlay.style.display === 'none' || overlay.style.display === '') {
        // Populating before showing
        const listEl = document.getElementById('notif-list');
        if (listEl && state.user) {
            let html = '';

            // 1. Unread Mentor Notes
            const unreadNotes = GKStore.getMentorNotes(state.user.id).filter(n => !n.read);
            if (unreadNotes.length > 0) {
                html += `<div class="notif-section-title">Message from Acharya</div>`;
                unreadNotes.forEach(note => {
                    html += `
              <div class="notif-item">
                <div class="notif-icon">📜</div>
                <div class="notif-content">
                  <p>${note.text}</p>
                  <button class="btn btn-sm" onclick="GKApp.markNoteRead('${note.id}')" style="margin-top:0.5rem">Got it</button>
                </div>
              </div>`;
                });
            }

            // 2. Newly Earned Badges
            const recentBadges = GKXPManager.getEarnedBadges(state.user.id).filter(b => (Date.now() - b.earnedAt) < 5 * 60 * 1000);
            if (recentBadges.length > 0) {
                html += `<div class="notif-section-title">Sacred Badges Earned</div>`;
                const allBadges = GKXPManager.BADGES();
                recentBadges.forEach(eb => {
                    const b = allBadges.find(x => x.id === eb.id);
                    if (b) {
                        html += `
                <div class="notif-item notif-badge-item">
                  <div class="notif-icon">${b.icon}</div>
                  <div class="notif-content">
                    <strong>${b.name}</strong>
                    <p style="font-size:0.8rem;color:#888">${b.desc}</p>
                  </div>
                </div>`;
                    }
                });
            }

            if (html === '') {
                html = `
            <div style="text-align:center; padding: 2rem; color: #888;">
              <div style="font-size: 3rem; margin-bottom: 1rem;">🛕</div>
              <p>Everything is peaceful. No new messages.</p>
            </div>`;
            }
            listEl.innerHTML = html;
        }

        overlay.style.display = 'flex';
    } else {
        overlay.style.display = 'none';
    }
}

function markNoteRead(id) {
    if (!state.user) return;
    const notes = GKStore.getMentorNotes(state.user.id);
    const updated = notes.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem('gk_mentor_notes_' + state.user.id, JSON.stringify(updated));
    checkNotifications();
    toggleNotifications(); // refresh open panel
    setTimeout(() => toggleNotifications(), 100); // re-open to show updated list
}

function dismissMentorNotes() {
    const el = document.getElementById('mentor-notes-banner');
    if (el) el.style.display = 'none';
    if (state.user && state.user.id) {
        GKStore.markMentorNotesRead(state.user.id);
        render();
    }
}

function logout() {
    GKAuth.logout();
    state.user = null;
    navigate('login');
}

// ---- Helpers ----
function _getCurrentSubtopic() {
    const m = state.modules[state.activeModuleIdx];
    const topicData = GKRecommender.getTopicData(m.subjectId, m.topicId);
    return topicData.topic.subtopics[state.activeSubtopicIdx];
}

function _hasMoreSubtopics() {
    const m = state.modules[state.activeModuleIdx];
    const topicData = GKRecommender.getTopicData(m.subjectId, m.topicId);
    return state.activeSubtopicIdx + 1 < topicData.topic.subtopics.length;
}

function _hasMoreModules() {
    return state.activeModuleIdx + 1 < state.modules.length;
}

// ---- Init ----
function init() {
    // Check if user is already logged in
    const user = GKStore.getUserProfile();
    if (user) {
        state.user = user;
        navigate('mood');
    } else {
        navigate('login');
    }

    // Real-time synchronization: listen for changes from mentor dashboard (or other tabs)
    window.addEventListener('storage', (e) => {
        if (state.user) {
            // Re-sync user profile from storage
            const updatedUser = GKStore.getUserProfile(state.user.id);
            if (updatedUser) {
                state.user = updatedUser;

                // Re-populate and re-filter modules if we have a session active
                if (state.calibration) {
                    const unlockedTopics = updatedUser.unlockedTopics || [];
                    state.modules = GKRecommender.getRecommendedModules(
                        state.calibration,
                        updatedUser.completedTopics || []
                    ).filter(m => !_isTopicHidden(m, unlockedTopics))
                        .map((m, idx) => ({ ...m, _origIdx: idx }));
                }

                // Re-render current screen to reflect new completions/unlocks/resets
                render();
            }
        }
    });
}

// Expose public API
// ── Timetable drag-and-drop handlers ─────────────────────────────────────
function onTTDragStart(event, fp) {
    state.ttDragSrc = fp;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(fp));
    // Apply dragging style after a tick so the ghost image is captured first
    setTimeout(() => {
        const el = document.querySelector(`[data-fp="${fp}"]`);
        if (el) el.classList.add('tt-dragging');
    }, 0);
}

function onTTDragEnd(event) {
    document.querySelectorAll('.tt-dragging, .tt-drag-over').forEach(el => {
        el.classList.remove('tt-dragging', 'tt-drag-over');
    });
    state.ttDragSrc = null;
}

function onTTDragOver(event, fp) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (fp !== state.ttDragSrc) {
        event.currentTarget.classList.add('tt-drag-over');
    }
}

function onTTDragLeave(event) {
    event.currentTarget.classList.remove('tt-drag-over');
}

function onTTDrop(event, fp) {
    event.preventDefault();
    event.currentTarget.classList.remove('tt-drag-over');
    const src = state.ttDragSrc;
    if (src === null || src === fp) return;
    // Swap the two flex-slot assignments
    const order = state.ttFlexOrder;
    [order[src], order[fp]] = [order[fp], order[src]];
    state.ttFlexOrder = order;
    sessionStorage.setItem('gk_tt_flex_order_v2', JSON.stringify(order));
    render();
}

// ---- Demo Override (tick button to mark a module as complete) ----
function toggleDemoOverride(subjectId, topicId) {
    const userId = state.user.id;
    const key = `${subjectId}-${topicId}`;
    const overrides = JSON.parse(localStorage.getItem('gk_demo_overrides_' + userId) || '{}');
    if (overrides[key]) {
        delete overrides[key];
    } else {
        overrides[key] = true;
    }
    localStorage.setItem('gk_demo_overrides_' + userId, JSON.stringify(overrides));
    render(); // Re-render to reflect the change
}

function completeDay() {
    const userId = state.user.id;
    const overrides = JSON.parse(localStorage.getItem('gk_demo_overrides_' + userId) || '{}');

    // Mark ALL currently assigned modules as complete for demo purposes
    state.modules.forEach(m => {
        overrides[`${m.subjectId}-${m.topicId}`] = true;
    });

    localStorage.setItem('gk_demo_overrides_' + userId, JSON.stringify(overrides));
    render();
}

// ---- Topic Quick-Check Modal ----

function openTopicQuickCheck(subjectId, topicId) {
    const td = GKRecommender.getTopicData(subjectId, topicId);
    if (!td) return;

    // Check if user already has a result for this (Single Attempt Limit)
    const results = GKStore.getQuickCheckResults(state.user.id) || [];
    const existing = results.find(r => r.subjectId === subjectId && r.topicId === topicId);

    if (existing) {
        _quickCheck = { ...existing, submitted: true, alreadyDone: true };
        _renderQuickCheckModal();
        return;
    }

    // Try to get assessment questions from subtopics first
    let qs = td.topic.subtopics.flatMap(st => st.assessment || []);

    // Specific override for Gravity topic assessment as per user request
    if (topicId === 'gravity') {
        qs = [
            {
                question: "What keeps satellites in orbit?",
                type: "mcq",
                options: ["Rocket engines always running", "Gravity + sideways velocity", "Anti-gravity shields", "Magnetic fields"],
                correct: 1,
                explanation: "Gravity pulls down, velocity pushes forward — they balance!"
            },
            {
                question: "Arrange these planets in order of their gravitational pull (Strongest to Weakest):",
                type: "ordering",
                options: ["Jupiter", "Earth", "Mars", "Moon"],
                correct: ["Jupiter", "Earth", "Mars", "Moon"],
                explanation: "Jupiter has the most mass, followed by Earth, Mars, and finally the Moon."
            },
            {
                question: "Complete this sentence: The value of acceleration due to gravity on Earth is approximately ____ m/s².",
                type: "fill-blank",
                correct: ["9.8", "9.81"],
                explanation: "Earth's gravity pulls objects down at an acceleration of 9.8 m/s²."
            },
            {
                question: "Draw or diagram how gravity pulls objects toward the center of the Earth. Upload a picture of your drawing.",
                type: "file-upload",
                explanation: "Your mentor will review your diagram to ensure you understand gravitational direction."
            },
            {
                question: "Imagine you are an astronaut on the International Space Station. Describe how gravity affects you and the station in 2-3 sentences.",
                type: "long-answer",
                explanation: "You are both in constant free fall around the Earth, which makes it feel like you are floating (weightlessness), even though gravity is still pulling you."
            }
        ];
    } else if (qs.length < 1) {
        // If no embedded questions, generate mixed-type demo questions (Variety)
        const tName = td.topic.name;

        // Basic pool of questions to randomly draw from for retakes
        const pool = [
            { question: `What is a core principle of ${tName}?`, type: 'mcq', options: ['Option A', 'Option B', 'Option C', 'Option D'], correct: 0, explanation: `The core principle involves Option A.` },
            { question: `True or False: ${tName} is fundamental to this subject area.`, type: 'true-false', options: ['True', 'False'], correct: 0 },
            { question: `Complete this sentence: ${tName} allows us to explore ___. (Hint: "knowledge")`, type: 'fill-blank', correct: ['knowledge', 'concepts'], explanation: 'Accurate terminology is key.' },
            { question: `Give a brief real-world example of ${tName} in 1-2 sentences.`, type: 'short-answer', explanation: 'Your mentor will review your practical understanding.' },
            { question: `Reflecting on your studies, how does ${tName} connect to other topics we've covered? Write a paragraph.`, type: 'long-answer', explanation: 'This helps gauge your depth of synthesis.' },
            { question: `Which of the following is NOT related to ${tName}?`, type: 'mcq', options: ['Concept X', 'Concept Y', 'Unrelated Concept', 'Concept Z'], correct: 2, explanation: `The unrelated concept is not part of ${tName}.` },
            { question: `Write a short summary of the most interesting fact you learned about ${tName}.`, type: 'short-answer', explanation: 'Reflection helps solidify memory.' },
            { question: `True or False: The concepts in ${tName} are only theoretical and have no practical application.`, type: 'true-false', options: ['True', 'False'], correct: 1, explanation: 'False! Most concepts here have strong practical components.' }
        ];

        // Shuffle and pick 5 to provide variety on retakes
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        qs = shuffled.slice(0, 5);
    }

    // Take up to 5 questions
    qs = qs.slice(0, 5);
    _quickCheck = { subjectId, topicId, topicName: td.topic.name, questions: qs, answers: {}, submitted: false };
    _renderQuickCheckModal();
}

function _renderQuickCheckModal() {
    const existing = document.getElementById('qc-overlay');
    if (existing) existing.remove();
    const { topicName, questions, answers, submitted } = _quickCheck;

    const overlay = document.createElement('div');
    overlay.id = 'qc-overlay';
    overlay.className = 'qc-overlay';
    // Prevent closing by clicking backdrop once submitted
    overlay.addEventListener('click', e => {
        if (e.target === overlay && !submitted) GKApp.closeTopicQuickCheck();
    });

    overlay.innerHTML = submitted
        ? `
        <div class="qc-modal">
          <div class="qc-header">
            <span class="qc-title">📝 Quick Check · ${topicName}</span>
          </div>
          <div class="qc-body qc-submitted-body">
            <div class="qc-submitted-icon">✅</div>
            <p class="qc-submitted-msg">Assessment submitted!</p>
            <p class="qc-submitted-sub">Your responses have been recorded. Your mentor will review your answers.</p>
          </div>
          <div class="qc-footer">
            <button class="btn qc-done-btn" onclick="GKApp.closeTopicQuickCheck()">Done</button>
          </div>
        </div>`
        : `
        <div class="qc-modal">
          <div class="qc-header">
            <span class="qc-title">📝 Quick Check · ${topicName}</span>
            <button class="qc-close-btn" onclick="GKApp.closeTopicQuickCheck()">✕</button>
          </div>
          <div class="qc-body">
            ${_quickCheck.alreadyDone ? `
              <div class="qc-submitted-body" style="padding: 1rem; text-align: center;">
                <div class="qc-submitted-icon" style="font-size: 2.5rem; margin-bottom: 0.5rem;">📜</div>
                <p class="qc-submitted-msg" style="font-weight: 700;">Assessment Already Completed</p>
                <p class="qc-submitted-sub">You have already submitted this assessment. To maintain the integrity of your learning path, each topic assessment can only be taken once.</p>
              </div>
            ` :
            questions.map((q, qi) => {
                const hasOptions = q.options && Array.isArray(q.options) && q.options.length > 0;
                const isLong = q.type === 'long-answer';
                const isFile = q.type === 'file-upload';
                const isOrder = q.type === 'ordering';

                return `
                <div class="qc-question">
                  <p class="qc-q-text">${qi + 1}. ${q.question}</p>
                  <div class="qc-options">
                    ${hasOptions && !isOrder ? q.options.map((opt, oi) => `
                      <label class="qc-option">
                        <input type="radio" name="qcq${qi}" value="${oi}"
                          ${answers[qi] === oi ? 'checked' : ''}
                          onchange="GKApp.onQCAnswer(${qi},${oi})">
                        <span>${opt}</span>
                      </label>`).join('') :
                        (isOrder ? `
                      <div class="ordering-items">
                         ${q.options.map((opt, oi) => `
                          <button class="btn btn-secondary ordering-btn-qc" onclick="GKApp.onQCOrdering(${qi}, ${oi}); this.disabled=true; this.style.opacity='0.5';">${opt}</button>`
                        ).join('')}
                      </div>
                      <div id="ordering-qc-${qi}" style="margin-top:10px; font-size:0.8rem; background:#eee; padding:5px;"></div>
                    ` :
                            (isFile ? `
                      <div class="file-upload-wrap" style="text-align:center;">
                        <input type="file" onchange="GKApp.onQCAnswer(${qi}, this.files[0] ? this.files[0].name : '')" />
                      </div>
                    ` :
                                (isLong ? `
                      <textarea class="qc-text-area" placeholder="Write your paragraph here..." 
                                style="width: 100%; min-height: 100px; padding: 0.75rem; border: 1.5px solid var(--border); border-radius: 8px; font-family: inherit; font-size: 0.88rem; resize: vertical;"
                                oninput="GKApp.onQCAnswer(${qi}, this.value)">${answers[qi] || ''}</textarea>
                      ` : `
                      <div class="qc-text-input-wrap">
                        <input type="text" class="qc-text-input" placeholder="Type your answer here..." 
                               oninput="GKApp.onQCAnswer(${qi}, this.value)"
                               value="${answers[qi] || ''}"
                               style="width: 100%; padding: 0.65rem; border: 1.5px solid var(--border); border-radius: 8px; font-size: 0.88rem;">
                      </div>
                    `))))}
                  </div>
                </div>`;
}).join('')}
          </div >
    <div class="qc-footer">
        ${_quickCheck.alreadyDone ?
            `<button class="btn btn-primary qc-done-btn" style="width: 100%" onclick="GKApp.closeTopicQuickCheck()">Understood</button>` :
            `<button class="btn btn-primary qc-submit-btn" style="width: 100%" onclick="GKApp.submitTopicQuickCheck()">Submit Assessment</button>`
        }
    </div>
        </div > `;

    document.body.appendChild(overlay);
  }

  function onQCAnswer(qi, oi) {
    if (!_quickCheck || _quickCheck.submitted) return;
    _quickCheck.answers[qi] = oi;
  }

  function onQCOrdering(qi, oi) {
    if (!_quickCheck || _quickCheck.submitted) return;
    if (!Array.isArray(_quickCheck.answers[qi])) _quickCheck.answers[qi] = [];
    _quickCheck.answers[qi].push(oi);
    
    // Add visual feedback
    const selEl = document.getElementById(`ordering - qc - ${ qi } `);
    if (selEl) {
      const q = _quickCheck.questions[qi];
      selEl.innerHTML = _quickCheck.answers[qi].map((selectedOi, pos) => `< span style = "display:inline-block;background:#E3F2FD;padding:4px 8px;border-radius:8px;margin:2px;font-size:0.75rem;" > ${ pos + 1 }. ${ q.options[selectedOi] }</span > `).join('');
    }
  }

  function submitTopicQuickCheck() {
    if (!_quickCheck || _quickCheck.submitted) return;
    const { subjectId, topicId, topicName, questions, answers } = _quickCheck;

    // Build per-question answer record (results hidden from student, visible to mentor)
    const answerRecord = questions.map((q, i) => ({
      question: q.question,
      options: q.options,
      selectedOption: answers[i] !== undefined ? answers[i] : null,
      correct: q.correct,
      isCorrect: Array.isArray(q.correct) ? 
        (Array.isArray(answers[i]) ? JSON.stringify(answers[i]) === JSON.stringify(q.options.map((_, idx) => idx).reverse()) : answers[i] === q.correct) : 
        (answers[i] === q.correct)
    }));
    const score = answerRecord.filter(a => a.isCorrect).length;

    // Persist to data layer under the student's profile (mentor-visible, score hidden from student)
    GKStore.saveQuickCheckResult(state.user.id, {
      subjectId, topicId, topicName,
      answers: answerRecord,
      score,
      total: questions.length,
      submittedAt: new Date().toISOString()
    });

    // Also record it as a formal assessment attempt so it shows as "Done" on timetable
    GKStore.saveDetailedAssessmentResult(state.user.id, `${ subjectId } -${ topicId } `, score, questions.length, answerRecord);

    // Topic completion is recorded
    GKStore.markTopicComplete(state.user.id, `${ subjectId } -${ topicId } `);

    _quickCheck.submitted = true;
    _renderQuickCheckModal();
    render(); // Re-render the background screen to reflect completion (unlock buttons)
  }

  function closeTopicQuickCheck() {
    const overlay = document.getElementById('qc-overlay');
    if (overlay) {
      overlay.classList.add('qc-closing');
      setTimeout(() => overlay.remove(), 220);
    }
    _quickCheck = null;
  }

  // ---- Floating Krishna Chat ----
  function toggleKrishnaChat() {
    const panel = document.getElementById('krishna-chat-panel');
    const btn = document.getElementById('krishna-float-btn');
    if (!panel) return;
    if (panel.style.display === 'none' || panel.style.display === '') {
      panel.style.display = 'block';
      if (btn) btn.style.transform = 'scale(0)';
    } else {
      panel.style.display = 'none';
      if (btn) btn.style.transform = 'scale(1)';
    }
  }

  function sendKrishnaChat() {
    const input = document.getElementById('krishna-chat-input');
    const msgs = document.getElementById('krishna-chat-msgs');
    if (!input || !msgs || !input.value.trim()) return;
    const q = input.value.trim();
    msgs.innerHTML += `< div style = "background:#E3F2FD;padding:0.6rem 0.8rem;border-radius:12px;margin-bottom:0.5rem;text-align:right;" > ${ q }</div > `;
    const response = GKAITutor.respond(q);
    msgs.innerHTML += `< div style = "background:#FFF8E1;padding:0.6rem 0.8rem;border-radius:12px;margin-bottom:0.5rem;" > ${ response }</div > `;
    input.value = '';
    msgs.scrollTop = msgs.scrollHeight;
  }

  // ---- Mentor Review Submission ----

  function submitForMentorReview() {
    const { user } = state;
    const session = GKStore.getSession() || {};
    GKStore.saveMentorReviewRequest(user.id, {
      studentName: user.displayName,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      xpEarned: session.xpEarned || state.sessionXP || 0,
      completedSubtopics: session.completedSubtopics || []
    });
    GKXPManager.checkAndAwardBadges(user.id);
    navigate('reviewRequest');
  }

  function renderReviewRequest() {
    return `
    < div class="screen screen-review-request" >
        <div class="review-card">
            ${renderHeader(true)}
            <div class="content-wrap" style="padding: 1rem 2rem;">
                <div class="vy-krishna-box" style="max-width:550px; margin:1.5rem auto; padding:2rem; background: #FFFDE7; border: 2px solid #FFF59D; border-radius: 20px; text-align: center;">
                    <div class="vy-krishna-avatar" style="margin-bottom: 1rem;">
                        <img src="img/krishna-guide.png" style="width:120px; height:auto;" />
                    </div>
                    <div class="vy-krishna-speech" style="font-size:1.15rem; color: #6B3F1A; line-height: 1.6;">
                        <strong style="color: #F57C00; font-size:1.3rem;">✨ My Krishna</strong><br /><br />
                        ${krishnaInitiatorFor('reviewRequest')}
                    </div>
                </div>

                <div style="max-width:550px; margin: 0 auto 2rem; background: #fff; border-radius: 15px; padding: 1.5rem; border: 1px solid #eee; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
                    <h3 style="font-size: 1.1rem; color: #6B3F1A; margin-bottom: 0.8rem; display:flex; align-items:center; gap: 0.5rem;">
                        <span>✍️</span> My Letter to Guru
                    </h3>
                    <p style="font-size: 0.9rem; color: #888; margin-bottom: 1rem;">Share your thoughts, reflections, or questions for your Guru from today's learning journey.</p>
                    <textarea id="student-reflection" style="width: 100%; min-height: 100px; padding: 1rem; border: 2px solid #F5EDD8; border-radius: 10px; font-family: inherit; font-size: 1rem; resize: vertical;" placeholder="Dear Guru, today I learned..."></textarea>
                </div>

                <div style="text-align:center; margin-top:2rem; display:flex; flex-direction:column; gap: 1rem; align-items:center;">
                    <button class="btn btn-primary" onclick="GKApp.submitReflectionAndContinue()" style="font-size:1.1rem; padding:1rem 2.5rem; width:fit-content; border-radius:30px; box-shadow: 0 4px 15px rgba(107,63,26,0.2);">
                        Continue to Summary →
                    </button>
                </div>
            </div>
        </div>
      </div > `;
  }

  function submitReflectionAndContinue() {
    const reflectionEl = document.getElementById('student-reflection');
    if (reflectionEl) {
      const text = reflectionEl.value.trim();
      if (text) {
        // Save the reflection using the correct GKStore API
        GKStore.updateSession({ studentReflection: text });
      }
    }
    navigate('summary');
  }

  function _showToast(message) {
    const existing = document.getElementById('gk-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'gk-toast';
    toast.className = 'gk-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('gk-toast-visible'));
    setTimeout(() => {
      toast.classList.remove('gk-toast-visible');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  return {
    init, navigate, render,
    // Mood
    updateBattery, selectVibe, submitMood, skipToLearning,
    // Modules
    startModule, startModuleRetake, backToModules,
    toggleCompletedModule,
    dismissMentorNotes,
    // Mentor Review Submission
    submitForMentorReview, submitReflectionAndContinue,
    // Topic Quick-Check Modal
    openTopicQuickCheck, onQCAnswer, onQCOrdering, submitTopicQuickCheck, closeTopicQuickCheck,
    // Demo Override
    toggleDemoOverride, completeDay,
    // Timetable drag-and-drop
    onTTDragStart, onTTDragEnd, onTTDragOver, onTTDragLeave, onTTDrop,
    // Subtopics
    startSubtopic, backToSubtopics, startChallenge, retakeChallenge,
    toggleOptionalSubtopics, toggleSubtopicExpand,
    // Concepts
    nextConcept, prevConcept, startGame,
    // Games 
    classifyToggle, submitClassify,
    answerMCQGame, nextMCQGame,
    answerGraph, nextGraphQ,
    seqClick, checkSequence,
    startBreathing, stopBreathing,
    afterGame,
    // Assessment
    selectAnswer, nextQuestion,
    // New assessment question type handlers
    submitFillBlankAssessment, submitShortAnswer, submitMultipleCorrect,
    selectOrderItem, submitOrdering, submitMatch, submitFileUpload,
    // Subtopic feedback
    selectSubtopicFeedback: () => { }, submitSubtopicFeedback, skipSubtopicFeedback,
    // Module feedback
    selectModuleFeedback: () => { }, submitModuleFeedback, skipModuleFeedback,
    goToModuleFeedback,
    // End-of-session feedback
    selectFeedback: () => { }, submitFeedback,
    // AI
    askAI, getHint,
    // Final Assessment
    startFinalAssessment, finishFinalAssessment,
    // Navigation
    goToFeedback, nextModule, startNewSession, logout,
    toggleNotifications, toggleKrishnaChat, sendKrishnaChat, markNoteRead, checkNotifications,
    // Veda Yatra & New Game types
    rollAncientDice, toggleMokshaPanel, showMokshaRules,
    rollMokshaDice,
    submitFillBlank, submitParaWriting, _fbUpdate
  };
})();

// Boot the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => GKApp.init());
