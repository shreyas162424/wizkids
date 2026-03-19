/**
 * HolisticQUIC
 * 
 * Provides UI components for the Holistic Quotient Evaluation Panel and 
 * visual representation of student development quotients using Chart.js.
 */
const HolisticQUIC = (() => {

  let activeChart = null;

  /**
   * Renders the Evaluation Panel with Dual (AI/Human) and Autopopulated scores.
   */
  function renderEvaluationPanel(userId) {
    if (!userId) return "";
    
    const { ai, mentor, metrics } = HolisticEvaluationEngine.getMergedScores(userId);
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

            <details class="mas-bloom-dropdown" style="margin-bottom: 2rem; cursor: pointer;">
                <summary style="list-style: none; outline: none;">
                    <div class="mas-bloom-badge" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border-radius: 16px; background: ${bloom.bg}; border: 1px solid ${bloom.color};">
                       <div style="display: flex; align-items: center; gap: 1rem;">
                           <div style="font-size: 2rem;">${bloom.icon}</div>
                           <div>
                             <div style="font-weight: 800; font-size: 1.1rem; color: ${bloom.color};">${bloom.category}</div>
                             <div style="font-size: 0.8rem; font-weight: 700; opacity: 0.7;">Progressive Level ${bloom.level} of 6</div>
                           </div>
                       </div>
                       <div style="font-size: 0.8rem; opacity: 0.5;">▼ View All Levels</div>
                    </div>
                </summary>
                <div class="mas-bloom-levels-list" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem; background: #fff; border: 1px solid var(--m-border); border-radius: 16px;">
                    ${_getAllLevels().map(l => {
                        const isCurrent = l.level === bloom.level;
                        const isAchieved = l.level < bloom.level;
                        return `
                            <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border-radius: 12px; background: ${isCurrent ? l.bg : (isAchieved ? '#f8f9fa' : 'transparent')}; border: 1px solid ${isCurrent ? l.color : (isAchieved ? '#eee' : 'transparent')}; opacity: ${isAchieved || isCurrent ? 1 : 0.4};">
                                <span style="font-size: 1.2rem;">${l.icon}</span>
                                <div style="flex: 1;">
                                    <div style="font-weight: 800; font-size: 0.9rem; color: ${isCurrent ? l.color : '#444'};">${l.category}</div>
                                    <div style="font-size: 0.7rem; font-weight: 700; color: #888;">Level ${l.level}: ${l.label}</div>
                                </div>
                                ${isAchieved ? '<span style="color: #27ae60; font-weight: 900;">✓</span>' : (isCurrent ? '<span style="font-size: 0.7rem; font-weight: 800; color: ' + l.color + ';">CURRENT</span>' : '')}
                            </div>
                        `;
                    }).join('')}
                </div>
            </details>

            <table class="mas-eval-table" style="width: 100%; border-collapse: collapse; margin-bottom: 2rem;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--m-border);">
                        <th style="padding: 1rem; text-align: left; font-size: 0.7rem; color: #888; text-transform: uppercase;">Quotient</th>
                        <th style="padding: 1rem; text-align: center; font-size: 0.7rem; color: #888; text-transform: uppercase;">AI Score</th>
                        <th style="padding: 1rem; text-align: center; font-size: 0.7rem; color: #888; text-transform: uppercase;">Score</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="mas-quotient-row" style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                        <td style="padding: 1rem; font-weight: 800; color: var(--m-primary);">🎓 Academic (AQ)</td>
                        <td style="padding: 1rem; text-align: center;"><div class="mas-val-pill ai">${metrics.ai_aq}</div></td>
                        <td style="padding: 1rem; text-align: center;">
                            <input type="number" min="0" max="100" class="mas-mini-input" value="${metrics.human_aq || ''}" placeholder="--" 
                                   onchange="HolisticEvaluationEngine.saveMentorScore('${userId}', 'aq', this.value)">
                        </td>
                    </tr>
                    <tr class="mas-quotient-row" style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                        <td style="padding: 1rem; font-weight: 800; color: var(--m-primary);">🧘 Spiritual (SQ)</td>
                        <td style="padding: 1rem; text-align: center;"><div class="mas-val-pill ai">${metrics.ai_sq}</div></td>
                        <td style="padding: 1rem; text-align: center;">
                            <input type="number" min="0" max="100" class="mas-mini-input" value="${metrics.human_sq || ''}" placeholder="--" 
                                   onchange="HolisticEvaluationEngine.saveMentorScore('${userId}', 'sq', this.value)">
                        </td>
                    </tr>
                    <tr class="mas-quotient-row" style="border-bottom: 1px solid rgba(0,0,0,0.05); background: rgba(0,0,0,0.02);">
                        <td style="padding: 1rem; font-weight: 800; color: var(--m-primary); opacity: 0.7;">🎭 Emotional (EQ)</td>
                        <td style="padding: 1rem; text-align: center;" colspan="2">
                            <div class="mas-val-pill system" style="margin: 0 auto; width: fit-content;">${metrics.eq}</div>
                        </td>
                    </tr>
                    <tr class="mas-quotient-row" style="border-bottom: 1px solid rgba(0,0,0,0.05); background: rgba(0,0,0,0.02);">
                        <td style="padding: 1rem; font-weight: 800; color: var(--m-primary); opacity: 0.7;">⚡ Physical (PQ)</td>
                        <td style="padding: 1rem; text-align: center;" colspan="2">
                            <div class="mas-val-pill system" style="margin: 0 auto; width: fit-content;">${metrics.pq}</div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="mas-hq-banner" style="background: linear-gradient(135deg, var(--m-accent), #6B3F1A); color: #fff; padding: 1.5rem; border-radius: 20px; display: flex; justify-content: space-between; align-items: center;">
                <div class="mas-hq-info">
                    <div class="mas-hq-val" style="font-size: 2.2rem; font-weight: 800;">${metrics.hq}</div>
                    <div class="mas-hq-lbl" style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; opacity: 0.8;">Composite Holistic Quotient</div>
                </div>
                <div class="mas-hq-quote" style="max-width: 200px; text-align: right; font-style: italic; font-size: 0.8rem; border-left: 2px solid rgba(255,255,255,0.2); padding-left: 1rem;">
                    "A balanced mind leads to a purposeful life."
                </div>
            </div>
            
            ${ai.explanation ? `
            <div class="mas-ai-insight" style="margin-top: 1.5rem; padding: 1rem; background: rgba(0,0,0,0.03); border-radius: 12px; font-size: 0.85rem; border-left: 4px solid var(--gold);">
                <strong>Acharya's Reflection:</strong> ${ai.explanation}
            </div>
            ` : ''}
        </div>
    `;
  }

  /**
   * Renders the visual development tracker (Trends).
   */
  function renderHQVisualization(userId) {
    if (!userId) return "";
    
    setTimeout(() => initTrendChart(userId), 100);

    return `
        <div class="mas-hq-viz">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <div style="display: flex; align-items: center; gap: 0.8rem;">
                  <h4 style="margin: 0; font-size: 0.85rem; color: #888; text-transform: uppercase; font-weight: 800;">📈 Growth Trends</h4>
                  <button class="btn btn-ghost btn-sm" title="Refresh Analysis" onclick="GKMentorApp.triggerAIEvaluation('${userId}')">🔄</button>
                </div>
                <select id="trend-quotient-select" onchange="HolisticQUIC.updateChartFilter(this.value)" style="padding: 4px 12px; border-radius: 8px; border: 1px solid #ddd; font-size: 0.75rem; font-weight: 700;">
                    <option value="all">All Quotients (Combined)</option>
                    <option value="aq">Academic (AQ)</option>
                    <option value="eq">Emotional (EQ)</option>
                    <option value="sq">Spiritual (SQ)</option>
                    <option value="pq">Physical (PQ)</option>
                </select>
            </div>

            <div class="mas-chart-container" style="position: relative; height: 320px; width: 100%; background: #fff; border-radius: 20px; padding: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
                <canvas id="hqTrendChart"></canvas>
            </div>

            <div style="margin-top: 2.5rem; padding: 1.5rem; background: #edf2f7; border-radius: 20px; text-align: center; border: 1px dashed rgba(0,0,0,0.1);">
              <h4 style="margin: 0 0 0.5rem 0; font-size: 0.85rem; font-weight: 800; color: #4a5568;">Curated Journey</h4>
              <p style="margin: 0; font-size: 0.75rem; color: #718096; font-weight: 500;">AI syncs with latest performance markers for taxomony indexing.</p>
            </div>
        </div>
    `;
  }

  /**
   * Initializes the Chart.js trend chart.
   */
  function initTrendChart(userId) {
    const ctx = document.getElementById('hqTrendChart');
    if (!ctx) return;

    if (activeChart) {
      activeChart.destroy();
    }

    const { history } = HolisticEvaluationEngine.getMergedScores(userId);
    
    // Sort history by date
    const sorted = history.slice().sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
    
    // Map data for the 4 lines
    // For simple demo, we derive points from history
    const labels = sorted.map(h => new Date(h.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }));
    
    // Process history into continuous lines
    // This is a simplified implementation for the demo
    const aqData = sorted.map(h => h.aq || h.value || 50);
    const eqData = sorted.map(h => h.eq || 50);
    const sqData = sorted.map(h => h.sq || 50);
    const pqData = sorted.map(h => h.pq || 50);

    activeChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label: 'AQ', data: aqData, borderColor: '#42A5F5', backgroundColor: 'rgba(66, 165, 245, 0.1)', tension: 0.4, borderWidth: 4, pointRadius: 4, fill: true },
          { label: 'EQ', data: eqData, borderColor: '#EC407A', backgroundColor: 'rgba(236, 64, 122, 0.1)', tension: 0.4, borderWidth: 4, pointRadius: 4, fill: true },
          { label: 'SQ', data: sqData, borderColor: '#FFD700', backgroundColor: 'rgba(255, 215, 0, 0.1)', tension: 0.4, borderWidth: 4, pointRadius: 4, fill: true },
          { label: 'PQ', data: pqData, borderColor: '#66BB6A', backgroundColor: 'rgba(102, 187, 106, 0.1)', tension: 0.4, borderWidth: 4, pointRadius: 4, fill: true }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(45, 27, 14, 0.9)',
            titleFont: { family: 'Poppins', size: 13, weight: 'bold' },
            bodyFont: { family: 'Inter', size: 12 },
            padding: 12,
            cornerRadius: 12,
            displayColors: true
          }
        },
        scales: {
          y: { 
            min: 0, 
            max: 100, 
            grid: { color: 'rgba(0,0,0,0.03)' },
            ticks: { font: { size: 10, weight: 'bold', family: 'Inter' }, color: '#999' } 
          },
          x: { 
            grid: { display: false },
            ticks: { font: { size: 10, weight: 'bold', family: 'Inter' }, color: '#999' } 
          }
        }
      }
    });
  }

  function updateChartFilter(val) {
    if (!activeChart) return;
    activeChart.data.datasets.forEach(ds => {
        if (val === 'all') {
            ds.hidden = false;
        } else {
            ds.hidden = ds.label.toLowerCase() !== val;
        }
    });
    activeChart.update();
  }

  // --- Internals ---

  function _bloomsLevel(score) {
    if (score >= 85) return { level: 6, label: 'Create', category: 'Creative Innovator', icon: '🌟', color: '#7B1FA2', bg: '#F3E5F5' };
    if (score >= 70) return { level: 5, label: 'Evaluate', category: 'Reflective Evaluator', icon: '⚖️', color: '#1565C0', bg: '#E3F2FD' };
    if (score >= 55) return { level: 4, label: 'Analyze', category: 'Critical Thinker', icon: '🔍', color: '#00695C', bg: '#E0F2F1' };
    if (score >= 40) return { level: 3, label: 'Apply', category: 'Skill Practitioner', icon: '🔧', color: '#E65100', bg: '#FFF3E0' };
    if (score >= 25) return { level: 2, label: 'Understand', category: 'Concept Learner', icon: '💡', color: '#F57F17', bg: '#FFFDE7' };
    return { level: 1, label: 'Remember', category: 'Foundation Builder', icon: '📝', color: '#C62828', bg: '#FFEBEE' };
  }

  function _getAllLevels() {
    return [
      { level: 1, category: 'Foundation Builder', icon: '📝', color: '#C62828', bg: '#FFEBEE' },
      { level: 2, category: 'Concept Learner', icon: '💡', color: '#F57F17', bg: '#FFFDE7' },
      { level: 3, category: 'Skill Practitioner', icon: '🔧', color: '#E65100', bg: '#FFF3E0' },
      { level: 4, category: 'Critical Thinker', icon: '🔍', color: '#00695C', bg: '#E0F2F1' },
      { level: 5, category: 'Reflective Evaluator', icon: '⚖️', color: '#1565C0', bg: '#E3F2FD' },
      { level: 6, category: 'Creative Innovator', icon: '🌟', color: '#7B1FA2', bg: '#F3E5F5' }
    ];
  }

  window.HolisticQUIC = {
    renderEvaluationPanel,
    renderHQVisualization,
    updateChartFilter
  };

  return window.HolisticQUIC;
})();
