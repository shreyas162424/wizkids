// ============================================================
// MOOD GAME ENGINE: mood-game.js
// Renders a 1-minute engagement game inline on the mood page.
// Every game = exactly 5 rounds / questions.
//
// 1. Low battery  + Low Energy  → Breathing Bubble  (5 breath cycles)
// 2. Low battery  + High Energy → Star Collector    (collect 10 stars in 5 waves)
// 3. Mid battery  + Low Energy  → Word Zen          (5 words to unscramble)
// 4. Mid battery  + High Energy → Speed Math        (5 questions, A/B/C/D)
// 5. High battery + Low Energy  → Memory Match      (5 emoji pairs, 10 cards)
// 6. High battery + High Energy → Lightning Quiz    (5 questions, A/B/C/D, timer)
// ============================================================

const GKMoodGame = (() => {

  let _onComplete = null;
  let _gameTimer  = null;
  let _gameData   = {};
  let _hostId     = null;

  // ---- Mood → game type mapping ----
  function _bucket(battery) {
    if (battery < 30) return 'low';
    if (battery < 70) return 'mid';
    return 'high';
  }

  function getGameType(battery, vibe) {
    const b = _bucket(battery);
    if (b === 'low'  && vibe === 'low_energy')  return 'breathing';
    if (b === 'low'  && vibe === 'high_energy') return 'star_tap';
    if (b === 'mid'  && vibe === 'low_energy')  return 'word_zen';
    if (b === 'mid'  && vibe === 'high_energy') return 'speed_math';
    if (b === 'high' && vibe === 'low_energy')  return 'memory_flip';
    if (b === 'high' && vibe === 'high_energy') return 'lightning_quiz';
    return 'breathing';
  }

  const GAME_META = {
    breathing:      { title: '🫧 Breathing Bubble',  sub: '5 gentle breath cycles to restore your energy',         color: '#4A7C59' },
    star_tap:       { title: '⭐ Star Collector',     sub: 'Collect 10 stars in 5 waves to power up your brain!',  color: '#F5A623' },
    word_zen:       { title: '🌿 Word Zen',           sub: '5 calming words to unscramble — tap the letters',      color: '#4A7C59' },
    speed_math:     { title: '⚡ Speed Math',          sub: '5 quick questions — pick the right answer!',          color: '#F57C00' },
    memory_flip:    { title: '🧩 Memory Match',       sub: 'Find all 5 matching pairs — flip the cards!',          color: '#3A6FA6' },
    lightning_quiz: { title: '🏆 Lightning Quiz',     sub: '5 questions · 10 seconds each — stay sharp!',         color: '#C62828' }
  };

  // ---- A/B/C/D label helper ----
  const _LABELS = ['A', 'B', 'C', 'D'];
  const _LABEL_COLORS = ['#3A6FA6', '#4A7C59', '#C62828', '#7B5EA7'];

  function _optionBtn(opt, idx, onclickStr) {
    return `
      <button class="game-opt" onclick="${onclickStr}">
        <span class="game-opt-label" style="background:${_LABEL_COLORS[idx]};">${_LABELS[idx]}</span>
        <span class="game-opt-text">${opt}</span>
      </button>`;
  }

  // ---- Public: render game inline into a host div ----
  function renderInto(hostId, battery, vibe, onComplete) {
    _onComplete = onComplete;
    _hostId     = hostId;
    _gameData   = {};
    clearTimeout(_gameTimer);

    const type = getGameType(battery, vibe);
    const meta = GAME_META[type];
    const host = document.getElementById(hostId);
    if (!host) return;

    host.innerHTML = `
      <div class="mgame-inline">
        <div class="mgame-inline-header" style="border-left:4px solid ${meta.color};">
          <span class="mgame-inline-title" style="color:${meta.color};">${meta.title}</span>
          <span class="mgame-inline-sub">${meta.sub}</span>
        </div>
        <div id="mgame-body" class="mgame-body-inline"></div>
        <div id="mgame-footer" style="display:none;margin-top:1.2rem;">
          <button class="btn btn-primary btn-full" style="font-size:1.05rem;padding:0.85rem;" onclick="GKMoodGame.complete()">
            Let's Go! 🚀
          </button>
        </div>
      </div>
    `;

    setTimeout(() => _initGame(type), 60);
  }

  function _initGame(type) {
    switch (type) {
      case 'breathing':      _initBreathing();    break;
      case 'star_tap':       _initStarTap();      break;
      case 'word_zen':       _initWordZen();      break;
      case 'speed_math':     _initSpeedMath();    break;
      case 'memory_flip':    _initMemoryFlip();   break;
      case 'lightning_quiz': _initLightningQuiz();break;
    }
  }

  // ==============================================================
  // GAME 1 — Breathing Bubble   (5 breath cycles)
  // Low battery + Low energy
  // ==============================================================
  function _initBreathing() {
    const body = document.getElementById('mgame-body');
    if (!body) return;
    body.innerHTML = `
      <div class="breath-container">
        <div class="breath-ring">
          <div class="breath-circle" id="breath-circle">
            <span id="breath-text">Get Ready…</span>
          </div>
        </div>
        <p id="breath-label" class="breath-label">Follow the bubble</p>
        <div class="breath-dots">
          ${[0,1,2,3,4].map(i=>`<span class="breath-dot" id="bdot-${i}"></span>`).join('')}
        </div>
        <p style="font-size:0.75rem;color:#aaa;text-align:center;margin:0.3rem 0 0;">
          Round <span id="breath-round">1</span> of 5
        </p>
      </div>
    `;

    const phases = [
      { text:'Breathe In…',  dur:4000, scale:1.6, label:'Inhale slowly…',  cls:'inhale' },
      { text:'Hold…',        dur:2000, scale:1.6, label:'Hold…',            cls:'hold'   },
      { text:'Breathe Out…', dur:4000, scale:1.0, label:'Exhale slowly…',  cls:'exhale' },
      { text:'Pause…',       dur:2000, scale:1.0, label:'Rest…',            cls:'pause'  }
    ];
    let pIdx = 0, cycle = 0;

    function run() {
      if (cycle >= 5) {
        const c = document.getElementById('breath-circle');
        const l = document.getElementById('breath-label');
        if (c) { c.querySelector('span').textContent = '✨ Done!'; c.className = 'breath-circle'; }
        if (l)  l.textContent = 'Wonderful — you\'re refreshed and ready!';
        _showLetsGo(); return;
      }
      const p = phases[pIdx];
      const circle = document.getElementById('breath-circle');
      const lbl    = document.getElementById('breath-label');
      const rnd    = document.getElementById('breath-round');
      if (circle) {
        circle.querySelector('span').textContent = p.text;
        circle.style.transform  = `scale(${p.scale})`;
        circle.style.transition = `transform ${p.dur}ms ease-in-out`;
        circle.className = `breath-circle ${p.cls}`;
      }
      if (lbl) lbl.textContent = p.label;
      if (rnd) rnd.textContent = cycle + 1;
      if (pIdx === 0) { const d = document.getElementById(`bdot-${cycle}`); if (d) d.classList.add('active'); }
      pIdx++; if (pIdx >= phases.length) { pIdx = 0; cycle++; }
      _gameTimer = setTimeout(run, p.dur);
    }
    setTimeout(run, 500);
  }

  // ==============================================================
  // GAME 2 — Star Collector   (5 waves of 2 stars = 10 total)
  // Low battery + High energy
  // ==============================================================
  function _initStarTap() {
    const body = document.getElementById('mgame-body');
    if (!body) return;
    body.innerHTML = `
      <div class="star-container">
        <div class="star-hud">
          <span>⭐ <strong id="star-score">0</strong> / 10 stars</span>
          <span>Wave <strong id="star-wave">1</strong> / 5</span>
        </div>
        <div class="star-field" id="star-field"></div>
        <p class="star-hint">Tap the stars before they vanish!</p>
      </div>
    `;
    _gameData.score  = 0;
    _gameData.target = 10;
    _gameData.wave   = 1;

    function spawnWave() {
      const waveEl = document.getElementById('star-wave');
      if (waveEl) waveEl.textContent = _gameData.wave;

      // Spawn 2 stars per wave
      for (let i = 0; i < 2; i++) {
        setTimeout(() => {
          if (_gameData.score >= _gameData.target) return;
          const field = document.getElementById('star-field');
          if (!field) return;
          const btn = document.createElement('button');
          btn.className = 'star-btn';
          btn.textContent = ['⭐','🌟','✨','💫'][Math.floor(Math.random()*4)];
          btn.style.left = (Math.random()*80)+'%';
          btn.style.top  = (Math.random()*68)+'%';
          btn.onclick = () => {
            btn.classList.add('star-popped');
            _gameData.score++;
            const sc = document.getElementById('star-score');
            if (sc) sc.textContent = _gameData.score;
            setTimeout(()=>btn.remove(), 260);
            if (_gameData.score >= _gameData.target) {
              clearTimeout(_gameData.starNextWave);
              _endStarTap(true);
            }
          };
          field.appendChild(btn);
          setTimeout(()=>{ if(btn.parentNode) btn.remove(); }, 3500);
        }, i * 300);
      }

      if (_gameData.wave < 5) {
        _gameData.wave++;
        _gameData.starNextWave = setTimeout(spawnWave, 4000);
      } else {
        // Last wave — give 4s to catch, then end
        setTimeout(()=>{ if(_gameData.score < _gameData.target) _endStarTap(false); }, 5000);
      }
    }

    spawnWave();
  }

  function _endStarTap(won) {
    clearTimeout(_gameData.starNextWave);
    const body = document.getElementById('mgame-body');
    if (body) body.innerHTML = `
      <div class="mgame-result">
        <div class="mgame-result-icon">⚡</div>
        <h3 style="color:#F5A623;">${won ? '🎉 All 10 stars collected!' : `⭐ You got ${_gameData.score} / 10 stars!`}</h3>
        <p>Your brain is energized and ready to learn!</p>
      </div>`;
    _showLetsGo();
  }

  // ==============================================================
  // GAME 3 — Word Zen   (5 words)
  // Mid battery + Low energy
  // ==============================================================
  const WORD_LIST = [
    { word:'PEACE',  hint:'Tranquility of mind 🕊️'        },
    { word:'LOTUS',  hint:'Sacred flower in water 🪷'      },
    { word:'FOCUS',  hint:'Clear and sharp mind 🎯'        },
    { word:'CALM',   hint:'Still like a lake 🏔️'           },
    { word:'LIGHT',  hint:'The sun\'s greatest gift ☀️'    },
    { word:'EARTH',  hint:'Our beautiful home 🌍'          },
    { word:'RIVER',  hint:'It flows endlessly 🌊'          },
    { word:'BLOOM',  hint:'Flowers opening in spring 🌸'   },
    { word:'GRACE',  hint:'Gentle elegance 🦋'             },
    { word:'STILL',  hint:'No noise, no rush 🌙'           }
  ];

  function _scramble(word) {
    let out; let t = 0;
    do { out = word.split('').sort(()=>Math.random()-0.5).join(''); t++; }
    while (out === word && t < 30);
    return out;
  }

  function _initWordZen() {
    _gameData.wList   = [...WORD_LIST].sort(()=>Math.random()-0.5).slice(0, 5);
    _gameData.wIdx    = 0;
    _gameData.wScore  = 0;
    _renderWordZen();
  }

  function _renderWordZen() {
    const body = document.getElementById('mgame-body');
    if (!body) return;
    const { wIdx, wList, wScore } = _gameData;

    if (wIdx >= wList.length) {
      body.innerHTML = `
        <div class="mgame-result">
          <div class="mgame-result-icon">🌿</div>
          <h3 style="color:#4A7C59;">${wScore} out of 5 correct!</h3>
          <p>${wScore >= 4 ? 'Your mind is calm, clear and focused!' : wScore >= 2 ? 'Good effort — your focus is building!' : 'Keep practising — every word sharpens the mind!'}</p>
        </div>`;
      _showLetsGo(); return;
    }

    const entry = wList[wIdx];
    const scrambled = _scramble(entry.word);
    _gameData.wLetters  = scrambled.split('');
    _gameData.wSelected = [];
    _gameData.wTarget   = entry.word;

    body.innerHTML = `
      <div class="wordzen-wrap">
        <div class="wordzen-progress">
          <span>Word ${wIdx+1} of 5</span>
          <span>Score: <strong>${wScore}</strong></span>
        </div>
        <div class="wordzen-hint">💡 ${entry.hint}</div>
        <div class="wordzen-answer" id="wz-answer">
          ${entry.word.split('').map(()=>`<span class="wz-slot"></span>`).join('')}
        </div>
        <div class="wordzen-letters" id="wz-letters">
          ${scrambled.split('').map((l,i)=>`
            <button class="wz-letter" data-idx="${i}" onclick="GKMoodGame._wzPick(${i})">${l}</button>
          `).join('')}
        </div>
        <button class="wz-clear-btn" onclick="GKMoodGame._wzClear()">↩ Clear</button>
      </div>`;
  }

  function _wzPick(idx) {
    if (_gameData.wSelected.includes(idx)) return;
    _gameData.wSelected.push(idx);
    const btn = document.querySelector(`[data-idx="${idx}"]`);
    if (btn) btn.classList.add('used');
    const slots = document.querySelectorAll('.wz-slot');
    const si = _gameData.wSelected.length - 1;
    if (slots[si]) { slots[si].textContent = _gameData.wLetters[idx]; slots[si].classList.add('filled'); }

    if (_gameData.wSelected.length === _gameData.wTarget.length) {
      const formed  = _gameData.wSelected.map(i => _gameData.wLetters[i]).join('');
      const correct = formed === _gameData.wTarget;
      document.querySelectorAll('.wz-slot').forEach(s => s.classList.add(correct ? 'correct' : 'wrong'));
      if (correct) _gameData.wScore++;
      _toast(correct ? '✅ Correct!' : '❌ Not quite!', correct ? '#4A7C59' : '#C0392B');
      _gameData.wIdx++;
      setTimeout(_renderWordZen, 900);
    }
  }

  function _wzClear() {
    _gameData.wSelected = [];
    document.querySelectorAll('.wz-letter').forEach(b => b.classList.remove('used'));
    document.querySelectorAll('.wz-slot').forEach(s => { s.textContent = ''; s.className = 'wz-slot'; });
  }

  // ==============================================================
  // GAME 4 — Speed Math   (5 questions, A/B/C/D buttons)
  // Mid battery + High energy
  // ==============================================================
  function _genMath(n) {
    return Array.from({ length: n }, () => {
      const op = ['+', '-', '×'][Math.floor(Math.random()*3)];
      let a, b, ans;
      if (op==='+') { a=Math.floor(Math.random()*40)+5;   b=Math.floor(Math.random()*40)+5;    ans=a+b; }
      if (op==='-') { a=Math.floor(Math.random()*40)+20;  b=Math.floor(Math.random()*(a-1))+1;  ans=a-b; }
      if (op==='×') { a=Math.floor(Math.random()*9)+2;    b=Math.floor(Math.random()*9)+2;      ans=a*b; }
      const opts = [ans];
      while (opts.length < 4) {
        const w = ans + (Math.floor(Math.random()*14) - 7);
        if (w !== ans && w > 0 && !opts.includes(w)) opts.push(w);
      }
      return { q:`${a} ${op} ${b}`, ans, opts: opts.sort(()=>Math.random()-0.5) };
    });
  }

  function _initSpeedMath() {
    _gameData.mQ    = _genMath(5);
    _gameData.mIdx  = 0;
    _gameData.mScore= 0;
    _renderMath();
  }

  function _renderMath() {
    const body = document.getElementById('mgame-body');
    if (!body) return;
    const { mIdx, mQ, mScore } = _gameData;

    if (mIdx >= mQ.length) {
      body.innerHTML = `
        <div class="mgame-result">
          <div class="mgame-result-icon">⚡</div>
          <h3 style="color:#F57C00;">${mScore} out of 5 correct!</h3>
          <p>${mScore >= 4 ? 'Brilliant! Your brain is fully warmed up!' : mScore >= 2 ? 'Good effort — ready to dive into learning!' : 'Every session you get sharper!'}</p>
        </div>`;
      _showLetsGo(); return;
    }

    const q = mQ[mIdx];
    body.innerHTML = `
      <div class="smath-wrap">
        <div class="smath-hud">
          <span>Question ${mIdx+1} of 5</span>
          <span>Score: <strong id="smath-score">${mScore}</strong></span>
        </div>
        <div class="smath-question">${q.q} = ?</div>
        <div class="game-options-list">
          ${q.opts.map((o,i) => _optionBtn(o, i, `GKMoodGame._smAns(${o},${q.ans})`)).join('')}
        </div>
      </div>`;
  }

  function _smAns(chosen, correct) {
    const ok = chosen === correct;
    if (ok) _gameData.mScore++;
    _toast(ok ? '✅ Correct!' : `❌ Answer was: ${correct}`, ok ? '#4A7C59' : '#C0392B');
    _gameData.mIdx++;
    setTimeout(_renderMath, 800);
  }

  // ==============================================================
  // GAME 5 — Memory Match   (5 pairs = 10 cards)
  // High battery + Low energy
  // ==============================================================
  const MEM_EMOJIS = ['🌸', '🌙', '⭐', '🎯', '🦋'];

  function _initMemoryFlip() {
    const deck = [...MEM_EMOJIS, ...MEM_EMOJIS].sort(()=>Math.random()-0.5);
    _gameData.mfCards   = deck.map((e,i) => ({ id:i, emoji:e, flipped:false, matched:false }));
    _gameData.mfOpen    = [];
    _gameData.mfMatches = 0;
    _gameData.mfMoves   = 0;
    _gameData.mfLocked  = false;
    _renderMemory();
  }

  function _renderMemory() {
    const body = document.getElementById('mgame-body');
    if (!body) return;
    const { mfCards, mfMatches, mfMoves } = _gameData;
    body.innerHTML = `
      <div class="memflip-wrap">
        <div class="memflip-hud">
          <span>Pairs found: <strong>${mfMatches} / 5</strong></span>
          <span>Moves: <strong>${mfMoves}</strong></span>
        </div>
        <div class="memflip-grid">
          ${mfCards.map(c=>`
            <button class="mcard${c.flipped||c.matched?' mcard-show':''}${c.matched?' mcard-matched':''}"
              onclick="GKMoodGame._mfFlip(${c.id})">
              <div class="mcard-inner">
                <div class="mcard-back">🪷</div>
                <div class="mcard-front">${c.emoji}</div>
              </div>
            </button>`).join('')}
        </div>
      </div>`;
  }

  function _mfFlip(id) {
    const { mfCards, mfOpen, mfLocked } = _gameData;
    const card = mfCards[id];
    if (mfLocked || card.matched || card.flipped || mfOpen.length >= 2) return;
    card.flipped = true;
    _gameData.mfOpen = [...mfOpen, id];
    _gameData.mfMoves++;
    _renderMemory();
    if (_gameData.mfOpen.length === 2) {
      _gameData.mfLocked = true;
      const [a, b] = _gameData.mfOpen;
      if (mfCards[a].emoji === mfCards[b].emoji) {
        mfCards[a].matched = mfCards[b].matched = true;
        _gameData.mfMatches++;
        _gameData.mfOpen   = [];
        _gameData.mfLocked = false;
        _renderMemory();
        if (_gameData.mfMatches >= 5) {
          setTimeout(() => {
            const b2 = document.getElementById('mgame-body');
            if (b2) b2.innerHTML = `
              <div class="mgame-result">
                <div class="mgame-result-icon">🧩</div>
                <h3 style="color:#3A6FA6;">All 5 pairs found in ${_gameData.mfMoves} moves!</h3>
                <p>Your memory and focus are razor-sharp!</p>
              </div>`;
            _showLetsGo();
          }, 500);
        }
      } else {
        setTimeout(() => {
          mfCards[a].flipped = mfCards[b].flipped = false;
          _gameData.mfOpen   = [];
          _gameData.mfLocked = false;
          _renderMemory();
        }, 850);
      }
    }
  }

  // ==============================================================
  // GAME 6 — Lightning Quiz   (5 questions, A/B/C/D, 10s each)
  // High battery + High energy
  // ==============================================================
  const QUIZ_BANK = [
    { q:'How many planets are in our Solar System?',  opts:['7','8','9','10'],                        ans:'8'       },
    { q:'What is 12 × 12?',                            opts:['124','144','134','148'],                  ans:'144'     },
    { q:'Which is the largest ocean on Earth?',        opts:['Atlantic','Indian','Arctic','Pacific'],  ans:'Pacific' },
    { q:'Who wrote the Mahabharata?',                  opts:['Valmiki','Vyasa','Tulsidas','Kabir'],    ans:'Vyasa'   },
    { q:'How many sides does a hexagon have?',         opts:['5','6','7','8'],                         ans:'6'       },
    { q:'What is the chemical symbol for water?',      opts:['H₂O','HO₂','O₂H','H₂O₂'],              ans:'H₂O'     },
    { q:'Which is the fastest land animal?',           opts:['Lion','Horse','Cheetah','Tiger'],        ans:'Cheetah' },
    { q:'What is 25% of 80?',                          opts:['15','20','25','30'],                     ans:'20'      },
    { q:'How many bones are in the adult human body?', opts:['196','206','216','226'],                 ans:'206'     },
    { q:'Which planet is known as the Red Planet?',    opts:['Venus','Jupiter','Saturn','Mars'],       ans:'Mars'    }
  ];

  function _initLightningQuiz() {
    // Pick 5 random questions
    _gameData.lqQs    = [...QUIZ_BANK].sort(()=>Math.random()-0.5).slice(0, 5);
    _gameData.lqIdx   = 0;
    _gameData.lqScore = 0;
    _renderQuiz();
  }

  function _renderQuiz() {
    clearInterval(_gameData.lqTick);
    const body = document.getElementById('mgame-body');
    if (!body) return;
    const { lqIdx, lqScore, lqQs } = _gameData;

    if (lqIdx >= lqQs.length) {
      body.innerHTML = `
        <div class="mgame-result">
          <div class="mgame-result-icon">🏆</div>
          <h3 style="color:#C62828;">${lqScore} out of 5 correct!</h3>
          <p>${lqScore >= 4 ? 'Outstanding! You\'re a quiz champion!' : lqScore >= 2 ? 'Great job — ready for today\'s lessons!' : 'Every quiz makes you smarter!'}</p>
        </div>`;
      _showLetsGo(); return;
    }

    const q = lqQs[lqIdx];
    _gameData.lqTimeLeft = 10;

    body.innerHTML = `
      <div class="lquiz-wrap">
        <div class="lquiz-hud">
          <span>Question ${lqIdx+1} of 5</span>
          <span class="lquiz-timer-badge" id="lq-timer">⏱ 10s</span>
          <span>Score: <strong>${lqScore}</strong></span>
        </div>
        <div class="lquiz-bar-track"><div class="lquiz-bar" id="lq-bar"></div></div>
        <div class="lquiz-question">${q.q}</div>
        <div class="game-options-list">
          ${q.opts.map((o,i) => _optionBtn(o, i, `GKMoodGame._lqAns('${o}','${q.ans}')`)).join('')}
        </div>
      </div>`;

    _gameData.lqTick = setInterval(() => {
      _gameData.lqTimeLeft--;
      const tEl = document.getElementById('lq-timer');
      const bEl = document.getElementById('lq-bar');
      if (tEl) tEl.textContent = `⏱ ${_gameData.lqTimeLeft}s`;
      if (bEl) bEl.style.width = `${(_gameData.lqTimeLeft / 10) * 100}%`;
      if (_gameData.lqTimeLeft <= 0) {
        clearInterval(_gameData.lqTick);
        _toast(`⏰ Time's up! Answer: ${q.ans}`, '#C0392B');
        _gameData.lqIdx++;
        setTimeout(_renderQuiz, 900);
      }
    }, 1000);
  }

  function _lqAns(chosen, correct) {
    clearInterval(_gameData.lqTick);
    const ok = chosen === correct;
    if (ok) _gameData.lqScore++;
    _toast(ok ? '✅ Correct!' : `❌ Answer was: ${correct}`, ok ? '#4A7C59' : '#C0392B');
    _gameData.lqIdx++;
    setTimeout(_renderQuiz, 800);
  }

  // ==============================================================
  // Shared helpers
  // ==============================================================
  function _showLetsGo() {
    const f = document.getElementById('mgame-footer');
    if (f) {
      f.style.display = 'block';
      const b = f.querySelector('button');
      if (b) b.style.animation = 'mgameBounce 0.5s ease';
    }
  }

  function _toast(msg, color) {
    const old = document.getElementById('mgame-toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.id = 'mgame-toast';
    t.style.cssText = `position:fixed;top:16px;left:50%;transform:translateX(-50%);
      background:${color};color:#fff;padding:0.55rem 1.4rem;border-radius:30px;
      font-weight:700;font-size:0.9rem;z-index:20001;pointer-events:none;
      animation:mgameFadeDown 0.3s ease;`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }

  // Called by the "Let's Go!" button
  function complete() {
    clearTimeout(_gameTimer);
    clearTimeout(_gameData.starNextWave);
    clearInterval(_gameData.lqTick);
    if (_onComplete) _onComplete();
  }

  return {
    renderInto, getGameType, complete,
    _wzPick, _wzClear,
    _smAns,
    _mfFlip,
    _lqAns
  };

})();
