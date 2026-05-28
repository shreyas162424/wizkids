/**
 * HolisticQUIC
 *
 * UI components for the Holistic Quotient Evaluation Panel.
 * AQ and EQ use a structured question-based modal.
 * SQ and PQ use direct numeric input.
 */
const HolisticQUIC = (() => {

  let activeChart = null;
  // Tracks the open modal's context
  let _modal = { userId: null, quotient: null };

  // ── Question definitions ─────────────────────────────────────────────────

  const _CONFIG = {
    aq: {
      title: '🎓 Academic Evaluation (AQ)',
      scaleLabel: 'Academic Performance Scale',
      scale: [
        { val: 1, label: 'Not demonstrated' },
        { val: 2, label: 'Demonstrated with significant support' },
        { val: 3, label: 'Demonstrated adequately' },
        { val: 4, label: 'Demonstrated clearly and correctly' },
        { val: 5, label: 'Demonstrated with depth and insight' }
      ],
      questions: [
        'Learner is able to demonstrate understanding of the core concept through the activity.',
        'Learner is able to apply the concept while performing the activity (process, method, or decisions taken).',
        'Learner is able to explain or justify what was done and why (verbally / through work).'
      ],
      hasObservations: false
    },
    eq: {
      title: '🎭 Emotional / Social Evaluation (EQ)',
      scaleLabel: 'Participation & Engagement Scale',
      scale: [
        { val: 1, label: 'Avoids or disengages' },
        { val: 2, label: 'Participates with hesitation / needs reminders' },
        { val: 3, label: 'Participates comfortably / tries to correct mistakes' },
        { val: 4, label: 'Participates confidently / learns and improves' },
        { val: 5, label: 'Participates with enthusiasm / shows resilience and reflection' }
      ],
      questions: [
        'Learner is able to participate with confidence, focus, and emotional balance during the activity.',
        'Learner is able to work with others respectfully and handle differences or feedback positively (if applicable).',
        'Learner is able to respond to challenges, mistakes, or failure during the activity.'
      ],
      hasObservations: true
    }
  };

  // ── Evaluation Panel ─────────────────────────────────────────────────────

  function renderEvaluationPanel(userId) {
    if (!userId) return '';

    const { ai, metrics } = HolisticEvaluationEngine.getMergedScores(userId);
    const bloom = _bloomsLevel(metrics.hq);

    return `
      <div class="mas-eval-panel">
        <div class="mas-panel-header">
          <div class="mas-header-info">
            <span class="mas-icon">🛡️</span>
            <span class="mas-title">Holistic Evaluation Matrix</span>
          </div>
          <p class="mas-subtitle">Last Evaluated: ${ai.updatedAt ? new Date(ai.updatedAt).toLocaleTimeString() : 'Never'}</p>
        </div>

        <details class="mas-bloom-dropdown" style="margin-bottom:2rem;cursor:pointer;">
          <summary style="list-style:none;outline:none;">
            <div class="mas-bloom-badge" style="display:flex;align-items:center;justify-content:space-between;padding:1rem;border-radius:16px;background:${bloom.bg};border:1px solid ${bloom.color};">
              <div style="display:flex;align-items:center;gap:1rem;">
                <div style="font-size:2rem;">${bloom.icon}</div>
                <div>
                  <div style="font-weight:800;font-size:1.1rem;color:${bloom.color};">${bloom.category}</div>
                  <div style="font-size:0.8rem;font-weight:700;opacity:0.7;">Progressive Level ${bloom.level} of 6</div>
                </div>
              </div>
              <div style="font-size:0.8rem;opacity:0.5;">▼ View All Levels</div>
            </div>
          </summary>
          <div style="margin-top:1rem;display:flex;flex-direction:column;gap:0.5rem;padding:1rem;background:#fff;border:1px solid var(--m-border);border-radius:16px;">
            ${_getAllLevels().map(l => {
              const isCurrent  = l.level === bloom.level;
              const isAchieved = l.level < bloom.level;
              return `<div style="display:flex;align-items:center;gap:1rem;padding:0.75rem;border-radius:12px;background:${isCurrent ? l.bg : (isAchieved ? '#f8f9fa' : 'transparent')};border:1px solid ${isCurrent ? l.color : (isAchieved ? '#eee' : 'transparent')};opacity:${isAchieved || isCurrent ? 1 : 0.4};">
                <span style="font-size:1.2rem;">${l.icon}</span>
                <div style="flex:1;">
                  <div style="font-weight:800;font-size:0.9rem;color:${isCurrent ? l.color : '#444'};">${l.category}</div>
                  <div style="font-size:0.7rem;font-weight:700;color:#888;">Level ${l.level}: ${l.label}</div>
                </div>
                ${isAchieved ? '<span style="color:#27ae60;font-weight:900;">✓</span>' : (isCurrent ? `<span style="font-size:0.7rem;font-weight:800;color:${l.color};">CURRENT</span>` : '')}
              </div>`;
            }).join('')}
          </div>
        </details>

        <table class="mas-eval-table" style="width:100%;border-collapse:collapse;margin-bottom:2rem;">
          <thead>
            <tr style="border-bottom:2px solid var(--m-border);">
              <th style="padding:1rem;text-align:left;font-size:0.7rem;color:#888;text-transform:uppercase;">Quotient</th>
              <th style="padding:1rem;text-align:center;font-size:0.7rem;color:#888;text-transform:uppercase;">AI Score</th>
              <th style="padding:1rem;text-align:center;font-size:0.7rem;color:#888;text-transform:uppercase;">Human Score</th>
            </tr>
          </thead>
          <tbody>
            ${_evalRow(userId, 'aq', '🎓 Academic (AQ)', metrics.ai_aq, metrics.human_aq, metrics.eval_aq)}
            ${_evalRow(userId, 'eq', '🎭 Emotional (EQ)', metrics.ai_eq, metrics.human_eq, metrics.eval_eq)}
            <tr class="mas-quotient-row" style="border-bottom:1px solid rgba(0,0,0,0.05);">
              <td style="padding:1rem;font-weight:800;color:var(--m-primary);">🧘 Spiritual (SQ)</td>
              <td style="padding:1rem;text-align:center;"><div class="mas-val-pill ai">${metrics.ai_sq}</div></td>
              <td style="padding:1rem;text-align:center;">
                <input type="number" min="0" max="100" class="mas-mini-input"
                  value="${metrics.human_sq !== null ? metrics.human_sq : ''}" placeholder="--"
                  onchange="HolisticEvaluationEngine.saveMentorScore('${userId}','sq',this.value)">
              </td>
            </tr>
            <tr class="mas-quotient-row" style="border-bottom:1px solid rgba(0,0,0,0.05);">
              <td style="padding:1rem;font-weight:800;color:var(--m-primary);">⚡ Physical (PQ)</td>
              <td style="padding:1rem;text-align:center;"><div class="mas-val-pill ai">${metrics.ai_pq}</div></td>
              <td style="padding:1rem;text-align:center;">
                <input type="number" min="0" max="100" class="mas-mini-input"
                  value="${metrics.human_pq !== null ? metrics.human_pq : ''}" placeholder="--"
                  onchange="HolisticEvaluationEngine.saveMentorScore('${userId}','pq',this.value)">
              </td>
            </tr>
          </tbody>
        </table>

        <div class="mas-hq-banner" style="background:linear-gradient(135deg,var(--m-accent),#6B3F1A);color:#fff;padding:1.5rem;border-radius:20px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:2.2rem;font-weight:800;">${metrics.hq}</div>
            <div style="font-size:0.75rem;text-transform:uppercase;font-weight:700;opacity:0.8;">Composite Holistic Quotient</div>
          </div>
          <div style="max-width:200px;text-align:right;font-style:italic;font-size:0.8rem;border-left:2px solid rgba(255,255,255,0.2);padding-left:1rem;">
            "A balanced mind leads to a purposeful life."
          </div>
        </div>

        ${ai.explanation ? `
        <div style="margin-top:1.5rem;padding:1rem;background:rgba(0,0,0,0.03);border-radius:12px;font-size:0.85rem;border-left:4px solid var(--gold);">
          <strong>Acharya's Reflection:</strong> ${ai.explanation}
        </div>` : ''}
      </div>`;
  }

  // Renders a single AQ/EQ table row with the evaluate button
  function _evalRow(userId, quotient, label, aiScore, humanScore, evalData) {
    const hasScore = humanScore !== null;
    const humanCell = hasScore
      ? `<div style="display:flex;flex-direction:column;align-items:center;gap:0.4rem;">
           <div class="mas-val-pill human" style="background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;">${humanScore}</div>
           <button onclick="HolisticQUIC.openEvalModal('${userId}','${quotient}')"
             style="font-size:0.65rem;font-weight:700;color:#888;background:none;border:none;cursor:pointer;padding:0;text-decoration:underline;">
             ✏️ Edit
           </button>
         </div>`
      : `<button onclick="HolisticQUIC.openEvalModal('${userId}','${quotient}')"
           style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.45rem 0.9rem;background:linear-gradient(135deg,#fff8e1,#fffde7);border:1.5px solid #f9a825;border-radius:20px;font-size:0.75rem;font-weight:800;color:#6B3F1A;cursor:pointer;transition:all 0.2s;">
           📝 Evaluate
         </button>`;

    return `
      <tr class="mas-quotient-row" style="border-bottom:1px solid rgba(0,0,0,0.05);">
        <td style="padding:1rem;font-weight:800;color:var(--m-primary);">${label}</td>
        <td style="padding:1rem;text-align:center;"><div class="mas-val-pill ai">${aiScore}</div></td>
        <td style="padding:1rem;text-align:center;">${humanCell}</td>
      </tr>`;
  }

  // ── Modal ────────────────────────────────────────────────────────────────

  function openEvalModal(userId, quotient) {
    closeEvalModal();   // clear any existing modal first
    _modal = { userId, quotient };

    const cfg      = _CONFIG[quotient];
    const scores   = GKStore.getHolisticScores(userId) || {};
    const existing = (scores.mentor_eval || {})[quotient] || null;

    const modalHtml = `
      <div id="eval-modal-overlay"
        onclick="HolisticQUIC.closeEvalModal(event)"
        style="position:fixed;inset:0;z-index:9999;background:rgba(45,27,14,0.55);
               display:flex;align-items:center;justify-content:center;padding:1rem;">
        <div onclick="event.stopPropagation()"
          style="background:#fff;border-radius:24px;max-width:600px;width:100%;
                 max-height:92vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.25);
                 display:flex;flex-direction:column;">

          <!-- Header -->
          <div style="display:flex;justify-content:space-between;align-items:center;
                      padding:1.5rem 1.5rem 1rem;border-bottom:1px solid #f0ebe5;
                      position:sticky;top:0;background:#fff;z-index:1;border-radius:24px 24px 0 0;">
            <div>
              <div style="font-size:1.1rem;font-weight:800;color:#2D1B0E;">${cfg.title}</div>
              <div style="font-size:0.75rem;color:#c0392b;margin-top:2px;font-weight:600;">
                ★ All 3 questions are mandatory — rate each to generate the score
              </div>
            </div>
            <button onclick="HolisticQUIC.closeEvalModal()"
              style="background:#f5f0eb;border:none;cursor:pointer;width:32px;height:32px;
                     border-radius:50%;font-size:1rem;display:flex;align-items:center;
                     justify-content:center;color:#6B3F1A;font-weight:700;">✕</button>
          </div>

          <!-- Scale legend -->
          <div style="margin:1rem 1.5rem 0;padding:0.9rem 1rem;background:#fffde7;
                      border-radius:12px;border:1px solid #f9e49a;">
            <div style="font-size:0.7rem;font-weight:800;color:#6B3F1A;text-transform:uppercase;
                        letter-spacing:0.05em;margin-bottom:0.5rem;">${cfg.scaleLabel}</div>
            <div style="display:flex;flex-direction:column;gap:0.25rem;">
              ${cfg.scale.map(s => `
                <div style="display:flex;gap:0.5rem;font-size:0.75rem;color:#5a4228;">
                  <span style="font-weight:800;min-width:14px;">${s.val}</span>
                  <span>– ${s.label}</span>
                </div>`).join('')}
            </div>
          </div>

          <!-- Questions -->
          <div style="padding:1rem 1.5rem;display:flex;flex-direction:column;gap:1.5rem;">
            ${cfg.questions.map((q, i) => {
              const qKey = `q${i + 1}`;
              const saved = existing ? existing[qKey] : null;
              return `
                <div id="eval-question-${qKey}" style="padding:0.75rem;border-radius:14px;
                     border:1.5px solid ${saved ? '#e8f5e9' : '#fee2e2'};
                     background:${saved ? '#f9fff9' : '#fffafa'};transition:all 0.2s;">
                  <div style="font-size:0.85rem;font-weight:700;color:#2D1B0E;margin-bottom:0.6rem;
                              line-height:1.4;display:flex;align-items:flex-start;gap:0.4rem;">
                    <span style="color:#c0392b;font-size:0.9rem;line-height:1.4;">★</span>
                    <span>${i + 1}. ${q}</span>
                    <span id="eval-q-status-${qKey}" style="margin-left:auto;font-size:0.7rem;
                          font-weight:800;color:${saved ? '#27ae60' : '#c0392b'};white-space:nowrap;
                          padding:2px 8px;border-radius:10px;
                          background:${saved ? '#e8f5e9' : '#fee2e2'};">
                      ${saved ? '✓ Rated ' + saved : '⚠ Required'}
                    </span>
                  </div>
                  <div style="display:flex;flex-direction:column;gap:0.3rem;" data-qkey="${qKey}">
                    ${cfg.scale.map(s => {
                      const isSel = saved === s.val;
                      return `
                        <div class="eval-opt" data-qkey="${qKey}" data-val="${s.val}"
                          data-selected="${isSel ? 'true' : 'false'}"
                          onclick="HolisticQUIC.selectOption(this)"
                          style="display:flex;align-items:center;gap:0.75rem;padding:0.55rem 0.75rem;
                                 border-radius:10px;cursor:pointer;border:1.5px solid ${isSel ? '#f9a825' : '#eee'};
                                 background:${isSel ? '#fff8e1' : '#fafafa'};transition:all 0.15s;">
                          <div style="width:18px;height:18px;border-radius:50%;flex-shrink:0;
                                      border:2px solid ${isSel ? '#f9a825' : '#ccc'};
                                      background:${isSel ? '#f9a825' : 'transparent'};
                                      transition:all 0.15s;"></div>
                          <span style="font-weight:800;font-size:0.8rem;color:${isSel ? '#6B3F1A' : '#888'};min-width:14px;">${s.val}</span>
                          <span style="font-size:0.78rem;color:${isSel ? '#2D1B0E' : '#666'};font-weight:${isSel ? 700 : 500};">${s.label}</span>
                        </div>`;
                    }).join('')}
                  </div>
                </div>`;
            }).join('')}

            ${cfg.hasObservations ? `
              <div>
                <div style="font-size:0.85rem;font-weight:700;color:#2D1B0E;margin-bottom:0.6rem;">
                  Mentor Special Observations <span style="font-weight:500;color:#999;">(optional)</span>
                </div>
                <textarea id="eval-observations" rows="3" placeholder="Note any specific behaviours, patterns, or context worth recording…"
                  style="width:100%;padding:0.75rem;border-radius:12px;border:1.5px solid #eee;
                         font-size:0.82rem;color:#2D1B0E;resize:vertical;font-family:inherit;
                         box-sizing:border-box;outline:none;"
                >${existing && existing.observations ? existing.observations : ''}</textarea>
              </div>` : ''}
          </div>

          <!-- Score preview -->
          <div id="eval-score-panel"
            style="margin:0 1.5rem;padding:1rem 1.25rem;border-radius:14px;
                   background:${existing ? 'linear-gradient(135deg,#e8f5e9,#f1f8e9)' : '#f5f0eb'};
                   border:1.5px solid ${existing ? '#a5d6a7' : '#e0d8d0'};
                   display:flex;justify-content:space-between;align-items:center;
                   transition:all 0.3s;">
            <div>
              <div style="font-size:0.75rem;font-weight:800;color:#6B3F1A;text-transform:uppercase;
                          letter-spacing:0.04em;">Computed Human Score</div>
              <div id="eval-score-hint" style="font-size:0.7rem;color:#999;margin-top:2px;">
                ${existing ? 'Score generated from your ratings' : 'Rate all 3 questions above to generate score'}
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <span id="eval-score-preview" style="font-size:2rem;font-weight:900;
                    color:${existing ? '#2e7d32' : '#bbb'};transition:all 0.3s;">
                ${existing ? existing.score : '—'}
              </span>
              <span style="font-size:0.7rem;font-weight:700;color:#999;">/100</span>
            </div>
          </div>

          <!-- Actions -->
          <div style="display:flex;justify-content:flex-end;gap:0.75rem;padding:1.25rem 1.5rem;
                      border-top:1px solid #f0ebe5;margin-top:1rem;">
            <button onclick="HolisticQUIC.closeEvalModal()"
              style="padding:0.6rem 1.4rem;border-radius:20px;border:1.5px solid #ddd;
                     background:#fff;font-size:0.82rem;font-weight:700;color:#888;cursor:pointer;">
              Cancel
            </button>
            <button id="eval-save-btn"
              onclick="HolisticQUIC.submitEvalModal()"
              ${existing ? '' : 'disabled'}
              style="padding:0.6rem 1.6rem;border-radius:20px;border:none;
                     background:${existing ? 'linear-gradient(135deg,#f9a825,#e65100)' : '#e0e0e0'};
                     color:${existing ? '#fff' : '#aaa'};font-size:0.82rem;font-weight:800;
                     cursor:${existing ? 'pointer' : 'not-allowed'};transition:all 0.3s;">
              💾 Save Evaluation
            </button>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    // If answers already exist, recompute preview immediately
    if (existing) _refreshPreview();
  }

  function closeEvalModal(event) {
    if (event && event.target.id !== 'eval-modal-overlay') return;
    const el = document.getElementById('eval-modal-overlay');
    if (el) el.remove();
    _modal = { userId: null, quotient: null };
  }

  function selectOption(el) {
    const qkey = el.dataset.qkey;
    const val  = parseInt(el.dataset.val, 10);
    const group = document.querySelectorAll(`.eval-opt[data-qkey="${qkey}"]`);

    group.forEach(opt => {
      const isThis = parseInt(opt.dataset.val, 10) === val;
      // Use data-selected as the source of truth (background color is normalized by browser)
      opt.dataset.selected = isThis ? 'true' : 'false';
      opt.style.border     = `1.5px solid ${isThis ? '#f9a825' : '#eee'}`;
      opt.style.background = isThis ? '#fff8e1' : '#fafafa';
      const circle  = opt.querySelector('div');
      const numSpan = opt.querySelectorAll('span')[0];
      const txtSpan = opt.querySelectorAll('span')[1];
      if (circle)  { circle.style.border = `2px solid ${isThis ? '#f9a825' : '#ccc'}`; circle.style.background = isThis ? '#f9a825' : 'transparent'; }
      if (numSpan) { numSpan.style.color = isThis ? '#6B3F1A' : '#888'; }
      if (txtSpan) { txtSpan.style.color = isThis ? '#2D1B0E' : '#666'; txtSpan.style.fontWeight = isThis ? '700' : '500'; }
    });

    // Update per-question status badge
    const cfg = _CONFIG[_modal.quotient];
    const labelEl = document.getElementById(`eval-q-status-${qkey}`);
    const boxEl   = document.getElementById(`eval-question-${qkey}`);
    const selLabel = cfg.scale.find(s => s.val === val)?.label || '';
    if (labelEl) { labelEl.textContent = `✓ Rated ${val}`; labelEl.style.color = '#27ae60'; labelEl.style.background = '#e8f5e9'; }
    if (boxEl)   { boxEl.style.border = '1.5px solid #a5d6a7'; boxEl.style.background = '#f9fff9'; }

    _refreshPreview();
  }

  function _refreshPreview() {
    const cfg = _CONFIG[_modal.quotient];
    const vals = cfg.questions.map((_, i) => {
      const qkey = `q${i + 1}`;
      const allOpts = document.querySelectorAll(`.eval-opt[data-qkey="${qkey}"]`);
      let found = null;
      // Use data-selected attribute — browser normalizes hex colors so style checks fail
      allOpts.forEach(o => { if (o.dataset.selected === 'true') found = parseInt(o.dataset.val, 10); });
      return found;
    });

    const allAnswered = vals.every(v => v !== null);
    const preview     = document.getElementById('eval-score-preview');
    const saveBtn     = document.getElementById('eval-save-btn');
    const hintEl      = document.getElementById('eval-score-hint');
    const panelEl     = document.getElementById('eval-score-panel');

    if (allAnswered) {
      // Scale 1–5 → 0–100: rating=1 → 0, rating=5 → 100
      const avg   = vals.reduce((a, b) => a + b, 0) / vals.length;
      const score = Math.round(((avg - 1) / 4) * 100);
      if (preview)  { preview.textContent = score; preview.style.color = '#2e7d32'; }
      if (hintEl)   hintEl.textContent = 'Score generated — ready to save';
      if (panelEl)  { panelEl.style.background = 'linear-gradient(135deg,#e8f5e9,#f1f8e9)'; panelEl.style.border = '1.5px solid #a5d6a7'; }
      if (saveBtn)  {
        saveBtn.disabled         = false;
        saveBtn.style.background = 'linear-gradient(135deg,#f9a825,#e65100)';
        saveBtn.style.color      = '#fff';
        saveBtn.style.cursor     = 'pointer';
      }
    } else {
      const remaining = vals.filter(v => v === null).length;
      if (preview)  { preview.textContent = '—'; preview.style.color = '#bbb'; }
      if (hintEl)   hintEl.textContent = `${remaining} question${remaining > 1 ? 's' : ''} still need${remaining === 1 ? 's' : ''} a rating`;
      if (panelEl)  { panelEl.style.background = '#f5f0eb'; panelEl.style.border = '1.5px solid #e0d8d0'; }
      if (saveBtn)  {
        saveBtn.disabled         = true;
        saveBtn.style.background = '#e0e0e0';
        saveBtn.style.color      = '#aaa';
        saveBtn.style.cursor     = 'not-allowed';
      }
    }
  }

  function submitEvalModal() {
    const { userId, quotient } = _modal;
    if (!userId || !quotient) return;

    const cfg     = _CONFIG[quotient];
    const answers = {};
    let allAnswered = true;

    cfg.questions.forEach((_, i) => {
      const qkey    = `q${i + 1}`;
      const allOpts = document.querySelectorAll(`.eval-opt[data-qkey="${qkey}"]`);
      let found = null;
      allOpts.forEach(o => { if (o.dataset.selected === 'true') found = parseInt(o.dataset.val, 10); });
      if (found === null) {
        allAnswered = false;
        // Highlight the unanswered question
        const boxEl = document.getElementById(`eval-question-${qkey}`);
        if (boxEl) { boxEl.style.border = '2px solid #c0392b'; boxEl.style.background = '#fff0f0'; }
      }
      answers[qkey] = found;
    });

    if (!allAnswered) return;

    const obsEl        = document.getElementById('eval-observations');
    const observations = obsEl ? obsEl.value.trim() : '';

    const result = HolisticEvaluationEngine.saveEvaluation(userId, quotient, answers, observations);
    if (result === null) return;   // guard: engine rejected the call

    // Success flash then close
    const overlay = document.getElementById('eval-modal-overlay');
    if (overlay) {
      const card = overlay.querySelector('div');
      if (card) { card.style.transition = 'opacity 0.25s'; card.style.opacity = '0'; }
      setTimeout(() => closeEvalModal(), 260);
    }
  }

  // ── Visualization ────────────────────────────────────────────────────────

  function renderHQVisualization(userId) {
    if (!userId) return '';
    setTimeout(() => initTrendChart(userId), 100);
    return `
      <div class="mas-hq-viz">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;">
          <div style="display:flex;align-items:center;gap:0.8rem;">
            <h4 style="margin:0;font-size:0.85rem;color:#888;text-transform:uppercase;font-weight:800;">📈 Growth Trends</h4>
            <button class="btn btn-ghost btn-sm" title="Refresh Analysis" onclick="GKMentorApp.triggerAIEvaluation('${userId}')">🔄</button>
          </div>
          <select id="trend-quotient-select" onchange="HolisticQUIC.updateChartFilter(this.value)"
            style="padding:4px 12px;border-radius:8px;border:1px solid #ddd;font-size:0.75rem;font-weight:700;">
            <option value="all">All Quotients</option>
            <option value="aq">Academic (AQ)</option>
            <option value="eq">Emotional (EQ)</option>
            <option value="sq">Spiritual (SQ)</option>
            <option value="pq">Physical (PQ)</option>
          </select>
        </div>
        <div style="position:relative;height:320px;width:100%;background:#fff;border-radius:20px;
                    padding:1rem;box-shadow:0 4px 20px rgba(0,0,0,0.02);">
          <canvas id="hqTrendChart"></canvas>
        </div>
        <div style="margin-top:2.5rem;padding:1.5rem;background:#edf2f7;border-radius:20px;
                    text-align:center;border:1px dashed rgba(0,0,0,0.1);">
          <h4 style="margin:0 0 0.5rem;font-size:0.85rem;font-weight:800;color:#4a5568;">Curated Journey</h4>
          <p style="margin:0;font-size:0.75rem;color:#718096;font-weight:500;">AI syncs with latest performance markers for taxonomy indexing.</p>
        </div>
      </div>`;
  }

  function initTrendChart(userId) {
    const ctx = document.getElementById('hqTrendChart');
    if (!ctx) return;
    if (activeChart) { activeChart.destroy(); activeChart = null; }

    const { history } = HolisticEvaluationEngine.getMergedScores(userId);
    const sorted  = history.slice().sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
    const labels  = sorted.map(h => new Date(h.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }));
    const aqData  = sorted.map(h => h.aq || h.value || 50);
    const eqData  = sorted.map(h => h.eq || 50);
    const sqData  = sorted.map(h => h.sq || 50);
    const pqData  = sorted.map(h => h.pq || 50);

    activeChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'AQ', data: aqData, borderColor: '#42A5F5', backgroundColor: 'rgba(66,165,245,0.1)', tension: 0.4, borderWidth: 4, pointRadius: 4, fill: true },
          { label: 'EQ', data: eqData, borderColor: '#EC407A', backgroundColor: 'rgba(236,64,122,0.1)',  tension: 0.4, borderWidth: 4, pointRadius: 4, fill: true },
          { label: 'SQ', data: sqData, borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.1)',   tension: 0.4, borderWidth: 4, pointRadius: 4, fill: true },
          { label: 'PQ', data: pqData, borderColor: '#66BB6A', backgroundColor: 'rgba(102,187,106,0.1)', tension: 0.4, borderWidth: 4, pointRadius: 4, fill: true }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: 'rgba(45,27,14,0.9)', titleFont: { family: 'Poppins', size: 13, weight: 'bold' }, bodyFont: { family: 'Inter', size: 12 }, padding: 12, cornerRadius: 12, displayColors: true }
        },
        scales: {
          y: { min: 0, max: 100, grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { font: { size: 10, weight: 'bold', family: 'Inter' }, color: '#999' } },
          x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold', family: 'Inter' }, color: '#999' } }
        }
      }
    });
  }

  function updateChartFilter(val) {
    if (!activeChart) return;
    activeChart.data.datasets.forEach(ds => { ds.hidden = val !== 'all' && ds.label.toLowerCase() !== val; });
    activeChart.update();
  }

  // ── Internals ────────────────────────────────────────────────────────────

  function _bloomsLevel(score) {
    if (score >= 85) return { level: 6, label: 'Create',    category: 'Creative Innovator',    icon: '🌟', color: '#7B1FA2', bg: '#F3E5F5' };
    if (score >= 70) return { level: 5, label: 'Evaluate',  category: 'Reflective Evaluator',  icon: '⚖️', color: '#1565C0', bg: '#E3F2FD' };
    if (score >= 55) return { level: 4, label: 'Analyze',   category: 'Critical Thinker',      icon: '🔍', color: '#00695C', bg: '#E0F2F1' };
    if (score >= 40) return { level: 3, label: 'Apply',     category: 'Skill Practitioner',    icon: '🔧', color: '#E65100', bg: '#FFF3E0' };
    if (score >= 25) return { level: 2, label: 'Understand',category: 'Concept Learner',       icon: '💡', color: '#F57F17', bg: '#FFFDE7' };
    return             { level: 1, label: 'Remember',   category: 'Foundation Builder',    icon: '📝', color: '#C62828', bg: '#FFEBEE' };
  }

  function _getAllLevels() {
    return [
      { level: 1, category: 'Foundation Builder',   label: 'Remember',    icon: '📝', color: '#C62828', bg: '#FFEBEE' },
      { level: 2, category: 'Concept Learner',      label: 'Understand',  icon: '💡', color: '#F57F17', bg: '#FFFDE7' },
      { level: 3, category: 'Skill Practitioner',   label: 'Apply',       icon: '🔧', color: '#E65100', bg: '#FFF3E0' },
      { level: 4, category: 'Critical Thinker',     label: 'Analyze',     icon: '🔍', color: '#00695C', bg: '#E0F2F1' },
      { level: 5, category: 'Reflective Evaluator', label: 'Evaluate',    icon: '⚖️', color: '#1565C0', bg: '#E3F2FD' },
      { level: 6, category: 'Creative Innovator',   label: 'Create',      icon: '🌟', color: '#7B1FA2', bg: '#F3E5F5' }
    ];
  }

  window.HolisticQUIC = {
    renderEvaluationPanel,
    renderHQVisualization,
    updateChartFilter,
    openEvalModal,
    closeEvalModal,
    selectOption,
    submitEvalModal
  };

  return window.HolisticQUIC;
})();
