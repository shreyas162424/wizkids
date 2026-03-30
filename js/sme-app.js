// ============================================================
// UI LAYER: sme-app.js  —  Curated Content · SME Review Portal
// Screens : login → dashboard → module-review
// Storage : localStorage 'gk_sme_reviews'
// ============================================================

window.GKSmeApp = (function () {

  // ── Constants ──────────────────────────────────────────────────────
  const REVIEW_KEY = 'gk_sme_reviews';
  const AUTH_KEY   = 'gk_sme_auth';
  const ROLE_KEY   = 'gk_sme_role';
  const MENTOR_PREP_KEY = 'gk_mentor_prep';  // per-module, per-guideline readiness
  const CRED_USER  = 'sme';
  const CRED_PASS  = 'sme123';
  const PAGE_TITLE = 'Curated Content';

  // ── State ──────────────────────────────────────────────────────────
  const state = {
    screen             : 'login',
    loginError         : '',
    selectedTopicId    : null,
    selectedSubtopicId : null,
    flagging           : false,
    // Filters
    filterSubject      : 'all',
    filterMethodology  : 'all',
    filterQuality      : 'all',
    filterType         : 'all',
    filterStatus       : 'all',
    filterSyllabus     : 'all',
    filterSearch       : '',
    filtersOpen        : false,
    // Review mode
    reviewMode         : 'ai',   // 'ai' | 'human'
    aiExpanded         : false,  // show AI-reviewed topics inside the scrollable box
    // Mentor view
    mentorTopicId          : null,
    mentorSection          : 'training',  // 'training' | 'experiments' | 'pacing'
    // Mentor filters
    mentorFilterSyllabus    : 'all',
    mentorFilterSubject     : 'all',
    mentorFilterMethodology : 'all',
    mentorFilterQuality     : 'all',
    mentorFilterSearch      : '',
    mentorFiltersOpen       : false,
    // Narayana agent
    narayanaMsg             : ''
  };

  // ── Review storage ─────────────────────────────────────────────────
  function getReviews() {
    try { return JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}'); }
    catch { return {}; }
  }
  function saveReview(topicId, stId, status, comment) {
    const r = getReviews();
    if (!r[topicId]) r[topicId] = {};
    r[topicId][stId] = { status, comment: comment || '', reviewedAt: new Date().toISOString() };
    localStorage.setItem(REVIEW_KEY, JSON.stringify(r));
  }
  function getReview(topicId, stId) {
    const r = getReviews();
    return (r[topicId] && r[topicId][stId]) || { status: 'pending', comment: '' };
  }

  // ── Auth ───────────────────────────────────────────────────────────
  function isLoggedIn() { return sessionStorage.getItem(AUTH_KEY) === '1'; }

  function renderHeaderRight() {
    const role = sessionStorage.getItem(ROLE_KEY) || 'sme';
    const isMentor = role === 'mentor';
    
    // Use data from users.js if available
    const userData = isMentor ? GK_MENTOR : GK_SME;
    const name = userData.displayName + (isMentor ? ' (Mentor)' : ' (SME)');
    const avatar = userData.photo + '?v=' + Date.now();
    const badge = isMentor ? '🕉 Mentor' : '📚 SME';

    return `
        <div class="sme-header-right" style="display: flex; align-items: center; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.5); padding: 4px 12px 4px 4px; border-radius: 20px; border: 1px solid #e8c96a;">
            <img src="${avatar}" alt="Avatar" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; background: #eee; display: block;" 
                 onerror="this.src='img/wizkids-logo.png'; this.onerror=null;" />
            <span style="font-size: 0.9rem; font-weight: 600; color: #4a381c;">${name}</span>
            <span class="men-role-badge" style="margin-left: 4px; padding: 2px 6px;">${badge}</span>
          </div>
          <button class="sme-btn sme-btn-ghost" onclick="GKSmeApp.logout()">Sign Out</button>
        </div>`;
  }

  // ── Data helpers ───────────────────────────────────────────────────
  function findTopic(topicId) {
    for (const subj of GK_TOPICS.subjects) {
      const t = subj.topics.find(t => t.id === topicId);
      if (t) return {
        id: t.id, name: t.name, icon: t.icon, xp: t.xp,
        subtopics: t.subtopics || [],
        subjectName: subj.name, subjectColor: subj.color || '#C4882A'
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
          subtopics: t.subtopics || [],
          subjectName: subj.name, subjectId: subj.id,
          subjectIcon: subj.icon || '', subjectColor: subj.color || '#C4882A',
          mandatory: !!t.mandatory, moduleType: t.moduleType || 'standard'
        });
      }
    }
    return out;
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
    return {
      approved, flagged,
      pending : total > 0 ? total - approved - flagged : 1,
      total   : total || 1,
      isEmpty : total === 0
    };
  }

  // ── AI review status ───────────────────────────────────────────────
  // Exactly 4 modules are surfaced to the human SME in AI-First mode.
  // All other modules are handled automatically by the AI reviewer agent.
  // Any previously-flagged module is always re-escalated regardless.
  const HUMAN_REVIEW_IDS = [
    'fractions',             // Math — foundational; needs expert validation
    'gravity',               // Science — conceptual depth requires human eye
    'civics',                // Social Science — civic accuracy is critical
    'ancient-civilizations'  // History — cultural sensitivity needs human review
  ];

  function getAIStatus(t, prog) {
    if (prog.flagged > 0) return 'escalated'; // flagged content always re-escalated
    return HUMAN_REVIEW_IDS.includes(t.id) ? 'escalated' : 'ai-reviewed';
  }

  // ── Mentor teaching guides ─────────────────────────────────────────
  // Rich, contextual teaching guidance for 6 featured modules.
  // Other modules receive a generic fallback guide.
  const MENTOR_GUIDES = {
    'fractions': {
      icon: '½', subject: 'Mathematics', color: '#3A6FA6',
      training: {
        overview: 'Fractions are foundational to all future math. A strong conceptual grasp here prevents years of procedural confusion.',
        prerequisites: [
          'Comfortable dividing physical objects into equal parts',
          'Understands division as "sharing equally"',
          'Can count, add, and subtract whole numbers up to 100'
        ],
        keyConcepts: [
          'Part-whole relationship: numerator counts selected parts, denominator counts total equal parts',
          'Equivalent fractions: same proportion, different representation (1/2 = 2/4 = 3/6)',
          'Comparing fractions: same denominator → compare numerators; same numerator → compare denominators'
        ],
        misconceptions: [
          'Bigger denominator = bigger fraction (e.g. 1/8 > 1/4) — Address with visual area models',
          'Adding numerators AND denominators (1/2 + 1/3 = 2/5) — Use fraction bars to correct',
          'Fractions only apply to circles — Use number lines, sets, and real objects'
        ],
        pedagogyTip: 'Always anchor fractions in physical reality first. Move from Concrete → Pictorial → Abstract (CPA approach). Pizza and folded paper work better than abstract symbols.'
      },
      experiments: [
        { title: 'Paper Folding Fair Shares', duration: '15 min',
          materials: ['A4 paper (4 sheets per student)', 'Pencil', 'Ruler'],
          setup: ['Pre-cut paper into equal-sized rectangles before class',
            'Students fold paper into halves, quarters, eighths and shade parts',
            'Connect shaded region to fraction notation on the board',
            'Ask: "What fraction is shaded? Not shaded?"'],
          objective: 'Students experience equal-part division physically before writing symbols' },
        { title: 'Fraction Wall on Whiteboard', duration: '20 min',
          materials: ['Whiteboard / chart paper', 'Coloured markers (6 colours)'],
          setup: ['Draw 6 equal-length horizontal bars before class',
            'Label: 1 whole, 1/2, 1/3, 1/4, 1/6, 1/12',
            'Students fill in subdivision lines with colour-coded markers',
            'Use completed wall to compare fractions and find equivalents visually'],
          objective: 'Build a permanent visual reference for the full module duration' },
        { title: 'Market Fraction Game', duration: '25 min',
          materials: ['Play money (printout)', 'Paper food items', 'Fraction price cards'],
          setup: ['Print fraction price cards (e.g. ½ of ₹10, ¾ of ₹20) the evening before',
            'Assign 3 students as shopkeepers; rest are buyers',
            'Buyers calculate and pay the correct fractional price',
            'Rotate roles every 5 minutes'],
          objective: 'Contextual real-world application of fractions' }
      ],
      pacing: {
        fast: { strategy: 'Fast learners grasp part-whole quickly. Push to mixed numbers and improper fractions; assign as peer tutors during group work.',
          activities: ['Introduce improper fractions and mixed numbers (3/2 = 1½)',
            'Challenge: create their own fraction word problem for the class',
            'Explore fractions on a number line beyond 1 whole'] },
        slow: { strategy: 'If a student struggles with equal division, return to whole-number sharing. Physical manipulation is non-negotiable before notation.',
          scaffolds: ['Use play-dough for hands-on equal-part creation',
            'Provide fraction wall as a desk reference throughout',
            'Pair with a peer who can explain verbally (Feynman method)'] },
        blockers: [
          { symptom: 'Cannot identify equal parts', solution: 'Have student fold and cut paper. Use ruler to verify equal size. Do NOT proceed to notation until this is clear.' },
          { symptom: 'Confuses numerator and denominator', solution: 'Memory anchor: Denominator = Down (bottom). Numerator = Number of pieces I have. Practice with coloured diagrams.' },
          { symptom: 'Cannot compare two fractions', solution: 'Use fraction wall to locate both visually. Only introduce cross-multiplication after visual comparison is solid.' }
        ]
      }
    },
    'gravity': {
      icon: '🌍', subject: 'Science', color: '#2D8A5E',
      training: {
        overview: 'Gravity bridges everyday experience with Newton\'s laws. The mentor\'s job is to make the invisible visible — let phenomena lead the lesson.',
        prerequisites: [
          'Observed objects falling; understands "things fall toward Earth"',
          'Familiar with mass vs weight informally (heavier bag = harder to lift)',
          'Basic understanding of Earth as a sphere'
        ],
        keyConcepts: [
          'Gravity is a force of attraction between any two masses — Earth pulls toward its centre',
          'Weight (N) = mass (kg) × g (9.8 m/s²) — weight depends on gravity; mass does not',
          'Free fall: all objects fall at the same rate in vacuum regardless of mass (Galileo)',
          'Gravity keeps planets in orbit; Moon\'s gravity causes tides'
        ],
        misconceptions: [
          'Heavier objects fall faster — False in vacuum; air resistance is the variable. Demonstrate with paper on a book.',
          'No gravity in space — ISS astronauts are in continuous free fall, not zero-gravity',
          'Gravity only pulls "down" — It pulls toward the nearest centre of mass; "down" is relative'
        ],
        pedagogyTip: 'Students should observe the drop experiment BEFORE you name gravity. Ask: "What did you see? Why?" Then introduce vocabulary for what they already know. Curiosity first, labels second.'
      },
      experiments: [
        { title: 'Simultaneous Drop Experiment', duration: '10 min',
          materials: ['Heavy book', 'Single sheet of paper', 'Open space'],
          setup: ['Write "Which falls faster?" on the board before class',
            'Drop book and flat paper simultaneously — paper floats, book drops fast',
            'Then place paper flat ON the book; drop — they fall together',
            'Ask: what changed? Guide students to discover air resistance vs mass'],
          objective: 'Distinguish mass from air resistance; set up the Galileo question' },
        { title: 'Weight vs Mass Station', duration: '20 min',
          materials: ['Spring balance', 'Pan balance', 'Assorted objects (eraser, book, bottle)'],
          setup: ['Set up two stations: spring balance (weight in Newtons) and pan balance (mass comparison)',
            'Students measure each object on both and record',
            'Prompt: "Would your mass change on the Moon? Would your weight?"',
            'Discuss — mass is constant; weight depends on gravity'],
          objective: 'Concrete distinction between mass and weight through measurement' },
        { title: 'Pendulum Period Investigation', duration: '30 min',
          materials: ['String (20 cm, 40 cm, 80 cm)', 'Small heavy nut', 'Stopwatch', 'Graph paper'],
          setup: ['Pre-tie nuts to strings the evening before; students verify lengths',
            'Time 10 full swings for each length; calculate period',
            'Plot length vs period on chart paper as a class',
            'Connect: pendulum restores because of gravity — this is how g is measured'],
          objective: 'Quantitative experience: gravity\'s strength is measurable and consistent' }
      ],
      pacing: {
        fast: { strategy: 'Fast learners can absorb the gravitational formula and calculate weight on other planets. Channel curiosity into research.',
          activities: ['Calculate their weight on Moon, Mars, Jupiter using provided g values',
            'Research: How does the Hubble telescope stay in orbit without falling?',
            'Design a poster: "Gravity Across the Solar System"'] },
        slow: { strategy: 'Focus on pulling-toward-Earth intuition first. Mass vs weight distinction comes only after the core concept is solid.',
          scaffolds: ['Keep a "What I know is true about falling" journal at each class start',
            'Use body-scale metaphors: "Imagine Earth is a giant magnet…"',
            'Provide structured worksheet: Draw object, draw the arrow of gravity',
            'Do NOT introduce the formula until student can explain gravity verbally'] },
        blockers: [
          { symptom: 'Cannot distinguish mass from weight', solution: 'Return to balance stations. "If I fly you to the Moon, would your body change size?" (No = mass same). "Would you feel lighter?" (Yes = weight different).' },
          { symptom: 'Thinks heavier objects fall faster', solution: 'Redo the paper-on-book drop. Ask student to predict, then observe. Connect surprise to air resistance, not mass.' },
          { symptom: 'Formula W=mg is unclear', solution: 'Use plain numbers: 9.8 means Earth pulls every 1 kg with 9.8 N of force. A 10 kg bag = 98 N pull. Numbers before symbols.' }
        ]
      }
    },
    'civics': {
      icon: '🏛️', subject: 'Social Science', color: '#7B5EA7',
      training: {
        overview: 'Civics connects abstract governance to students\' lived experience. The mentor must make democratic institutions feel real — not just pages in a textbook.',
        prerequisites: [
          'Awareness of India as a country with states and districts',
          'Knows what voting and elections mean at a surface level',
          'Familiar with local government (Panchayat / Municipal Corporation)'
        ],
        keyConcepts: [
          'Three pillars: Legislature (makes laws), Executive (implements), Judiciary (interprets and enforces)',
          'Fundamental Rights (Part III): Equality, Freedom, Against Exploitation, Religion, Cultural/Educational, Constitutional Remedies',
          'Panchayati Raj: 3-tier — Gram Panchayat → Panchayat Samiti → Zila Parishad',
          'Constitutional Amendments: how Parliament changes the Constitution with special majority'
        ],
        misconceptions: [
          'PM is the most powerful person — explain checks and balances; PM needs Lok Sabha majority',
          'Fundamental Rights are absolute — all have reasonable restrictions for public order and security',
          'Elections are only about voting — cover nomination, campaigning, EVMs, result certification'
        ],
        pedagogyTip: 'Use current events and local context. If a Panchayat election happened recently in your area, bring it in. Civic concepts become unforgettable when connected to real events students witnessed.'
      },
      experiments: [
        { title: 'Classroom Parliament Mock Session', duration: '40 min',
          materials: ['Role cards (Speaker, PM, MPs, Opposition)', 'A simple bill topic (e.g. school uniform rule)', 'Bell/gavel'],
          setup: ['One week before: prepare role cards and mock bill text',
            'Assign roles by draw; brief students on their character\'s position the day before',
            'Conduct: Introduction → Debate → Vote → Speaker declaration',
            'Debrief: How did deliberation feel? What was hard about reaching consensus?'],
          objective: 'Experiential understanding of democratic deliberation' },
        { title: 'Fundamental Rights Case Study Gallery', duration: '25 min',
          materials: ['6 printed case summaries (one per Right)', 'Sticky notes', 'Pens'],
          setup: ['Print and laminate 6 brief SC case summaries — one per Fundamental Right',
            'Post around room as a gallery walk',
            'Students read, discuss in pairs: "Which Right? Who was helped? How?"',
            'Whole-class share: which case surprised you most?'],
          objective: 'Make Fundamental Rights tangible through real judicial stories' }
      ],
      pacing: {
        fast: { strategy: 'Fast learners can hold multiple political concepts simultaneously. Introduce comparative civics and constitutional debates.',
          activities: ['Compare Indian parliamentary vs US presidential system',
            'Research: a constitutional amendment and explain why it was needed',
            'Write a "Citizens\' Manifesto" — what right would they add and why?'] },
        slow: { strategy: 'Anchor everything to immediate experience: school rules as laws, class monitor as local government. Build up from familiar.',
          scaffolds: ['Start with classroom governance: "How are our class rules made? Who enforces them?"',
            'Use 3-box diagram: Law Makers → Law Followers → Law Checkers',
            'Provide visual organizer for 6 Fundamental Rights with one example each',
            'Avoid abbreviations (LS, RS) until student can name them in full'] },
        blockers: [
          { symptom: 'Confuses Legislature, Executive, Judiciary', solution: 'School analogy: School Committee (legislature) makes rules → Principal (executive) enforces → School Board (judiciary) hears disputes. Map real examples to each.' },
          { symptom: 'Cannot recall Fundamental Rights', solution: 'Mnemonic FEAR CE: Freedom, Equality, Against exploitation, Religion, Cultural/educational, Enforced by courts. One Right per class day with a real story.' }
        ]
      }
    },
    'ancient-civilizations': {
      icon: '🏺', subject: 'History', color: '#C47E2A',
      training: {
        overview: 'Ancient civilizations are humanity\'s origin story. Handle cultural sensitivity carefully — India\'s ancient past is lived identity for many families. Goal is inquiry, not mythology.',
        prerequisites: [
          'Concept of timeline and BCE/CE dating',
          'Can locate ancient Mesopotamia, Egypt, Indus Valley on a map roughly',
          'Understands "ancient" means thousands of years ago'
        ],
        keyConcepts: [
          'Indus Valley (2600–1900 BCE): Urban planning, drainage systems, standardized weights; script still undecoded',
          'Mesopotamia (Sumer, 3500 BCE): Cuneiform writing, wheel, irrigation, Code of Hammurabi',
          'Ancient Egypt: Pharaoh divine rule, hieroglyphics, Nile agriculture, pyramid construction',
          'Common thread: All arose near rivers (Nile, Tigris/Euphrates, Indus/Ghaggar-Hakra)'
        ],
        misconceptions: [
          'Ancient = primitive — Harappan drainage was more sophisticated than many modern cities',
          'History is just dates to memorize — Use inquiry: "Why build near rivers? What problems did they solve?"',
          'Indian civilization started with the Vedic period — Indus Valley predates the Vedas by over 1,000 years'
        ],
        pedagogyTip: 'Treat history as detective work. "We found these artefacts — what do they tell us? What is still a mystery?" The undeciphered Indus script is a genuine ongoing puzzle that sparks natural curiosity.'
      },
      experiments: [
        { title: 'Artefact Analysis Activity', duration: '30 min',
          materials: ['Printed images of Indus Valley seals, pottery, toy cart', 'Analysis worksheet'],
          setup: ['Print 6–8 high-quality Harappan artefact images (available from ASI website)',
            'Each student/pair gets one artefact image and analysis sheet',
            'Guide with: "What material? What function? What does it tell us about daily life?"',
            'Class share: build a collective picture of Harappan society from artefacts alone'],
          objective: 'Develop archaeological thinking: evidence → inference → question' },
        { title: 'Ancient City Planning Design', duration: '35 min',
          materials: ['Grid paper', 'Coloured pencils', 'Reference: Mohenjo-daro layout image'],
          setup: ['Show Mohenjo-daro aerial plan: grid streets, citadel, granary, public baths',
            'Challenge: design your own ancient city on grid paper using what you\'ve learnt',
            'Must include: water source, market, housing, civic buildings',
            'Gallery share: explain one design choice from your city'],
          objective: 'Apply civilizational concepts creatively; develop urban planning empathy' }
      ],
      pacing: {
        fast: { strategy: 'Fast learners can absorb comparative civilizations simultaneously. Push toward research and synthesis.',
          activities: ['Compare Harappan vs Mesopotamian — similarities and differences table',
            'Research: What theories exist about why the Indus Valley declined?',
            'Write a "Day in the Life" diary as a child in Mohenjo-daro',
            'Explore: How do archaeologists date ancient artefacts? (Carbon-14 basics)'] },
        slow: { strategy: 'Start with concrete visual timelines. One civilization at a time. Anchor to students\' familiar environment before the abstract past.',
          scaffolds: ['Build a physical classroom timeline: paste events on a long string across the wall',
            'Focus only on Indus Valley first; add Egypt and Mesopotamia after IVC is solid',
            'Compare to present day: "Harappan houses had bathrooms — do you?"',
            'Provide vocabulary card: BCE, civilisation, artefact, excavation, archaeologist'] },
        blockers: [
          { symptom: 'Cannot grasp BCE dating going backward', solution: 'Use a number line with student\'s birth year as anchor. Count back from 2024 → 0 → BCE years physically before using abstract dates.' },
          { symptom: 'Confuses different civilizations', solution: 'Colour-code each civilization consistently: Indus = blue, Egypt = yellow, Mesopotamia = orange. Every note, map, and card uses the same colour.' }
        ]
      }
    },
    'data-handling': {
      icon: '📊', subject: 'Mathematics', color: '#3A6FA6',
      training: {
        overview: 'Data handling builds statistical thinking for the information age. Ground every concept in data students actually collected or care about.',
        prerequisites: [
          'Can read simple bar graphs and picture graphs',
          'Understands "average" informally ("on average I sleep 8 hours")',
          'Comfortable with basic arithmetic operations'
        ],
        keyConcepts: [
          'Types of data: categorical vs numerical; discrete vs continuous',
          'Data collection: surveys, observations, experiments — sampling matters',
          'Representations: bar graph, histogram, line graph, pie chart — each tells a different story',
          'Central tendency: Mean (sum/count), Median (middle value), Mode (most frequent)'
        ],
        misconceptions: [
          'Mean is always the "best" average — Mode is better for popularity data; Median for skewed data',
          'More data is always better — Biased sampling ruins even large datasets',
          'A graph can\'t lie — Show examples of misleading scales (y-axis not starting at zero)'
        ],
        pedagogyTip: 'Collect real class data first: heights, favourite subjects, sleep hours. Every concept — mean, median, mode, graph type — is then applied to data students generated themselves. Personal data = high engagement.'
      },
      experiments: [
        { title: 'Classroom Height Survey & Analysis', duration: '25 min',
          materials: ['Measuring tape', 'Whiteboard', 'Graph paper'],
          setup: ['Measure each student\'s height in cm and record on board before class',
            'Students calculate mean, median, mode from class data',
            'Plot a bar graph of height ranges (130–139, 140–149, 150–159 cm)',
            'Discuss: Are the mean and median close? What does a big difference mean?'],
          objective: 'Apply all three central tendency measures to personally meaningful data' },
        { title: 'Misleading Graphs Gallery', duration: '15 min',
          materials: ['Printed examples of misleading graphs (4–5 examples)', 'Red marker'],
          setup: ['Find 4–5 real examples of misleading bar graphs (truncated y-axis, inconsistent intervals)',
            'Students circle what is misleading and explain the intended manipulation',
            'Create the correct version of one misleading graph on graph paper'],
          objective: 'Develop critical statistical literacy — always check the axes before trusting a graph' }
      ],
      pacing: {
        fast: { strategy: 'Fast learners can handle spread and variability. Introduce range and the concept of distribution.',
          activities: ['Introduce range as the simplest measure of spread',
            'Explore: two datasets with the same mean can look very different (introduce spread)',
            'Research: How are election exit polls conducted? What sampling method is used?',
            'Design a survey, collect data from 20 people, present full analysis'] },
        slow: { strategy: 'One measure at a time. Start with Mode (most frequent — simplest). Mean comes last. Always use small, whole-number datasets.',
          scaffolds: ['Use tally marks and frequency tables before calculating anything',
            'Provide "steps to find mean" card: 1) Add all  2) Count how many  3) Divide',
            'Use 5 data points maximum in early practice',
            'For graphs: pre-draw axes; student only plots the bars or points'] },
        blockers: [
          { symptom: 'Confuses mean, median, mode', solution: 'Mnemonic: Mode = Most often. Median = Middle. Mean = Mathematical average. Practice identifying which is asked for before calculating.' },
          { symptom: 'Cannot calculate mean accurately', solution: 'Split across two days: Day 1 — only add. Day 2 — add then divide. Use a calculator to verify until arithmetic confidence builds.' }
        ]
      }
    },
    'yoga': {
      icon: '🧘', subject: 'Wellness', color: '#E57C2C',
      training: {
        overview: 'Yoga in the Para-Vidya framework integrates body, breath, and mind awareness. Mentors must participate authentically — model the practice, don\'t just instruct it.',
        prerequisites: [
          'Familiar with basic anatomical terms (spine, hips, shoulders)',
          'Completed safety orientation: contraindications for specific poses',
          'Comfortable leading breathing exercises in front of a group'
        ],
        keyConcepts: [
          '8 Limbs of Yoga (Ashtanga) — teach Asana and Pranayama at this level',
          'Asana as body-mind connection: attention on sensations, not performance or competition',
          'Pranayama basics: Anulom-Vilom, Kapalabhati, Bhramari',
          'Yoga Nidra: guided relaxation — ideal for closing sessions'
        ],
        misconceptions: [
          'Yoga = flexibility competition — emphasise awareness over depth. A stiff beginner in full awareness is better than a flexible student performing mindlessly.',
          'Breath-holding means going deeper — always encourage natural, comfortable breathing in poses',
          'Yoga Nidra is "just sleep" — it is conscious relaxation; clearly distinguish from napping'
        ],
        pedagogyTip: 'Create a consistent opening ritual: 3 deep breaths → set an intention → centering pose. The ritual signals the brain to shift modes. Consistency is more powerful than variety in wellness sessions.'
      },
      experiments: [
        { title: 'Heart Rate Before/After Pranayama', duration: '20 min',
          materials: ['Timer', 'Notebook per student'],
          setup: ['Students count resting heart rate (60 sec) and record',
            'Guide 5 minutes of Anulom-Vilom (alternate nostril breathing)',
            'Students count heart rate again and compare',
            'Discuss: Why might slow, rhythmic breathing calm the heart rate?'],
          objective: 'Empirical evidence for yoga\'s physiological effect; bridge to biology' },
        { title: 'Proprioception Balance Challenge', duration: '15 min',
          materials: ['Open floor space'],
          setup: ['Students stand in Tadasana (mountain pose) — eyes open, then eyes closed',
            'Progress to Tree Pose (Vrksasana) — eyes open, then eyes closed',
            'Observe: how does removing vision affect balance?',
            'Discuss: proprioception — the body\'s internal position-sensing system'],
          objective: 'Connect yoga balance practice to neuroscience of body awareness' }
      ],
      pacing: {
        fast: { strategy: 'Fast learners can absorb both philosophy and physiology simultaneously. Assign reading and self-practice journaling.',
          activities: ['Research the 8 limbs of yoga; present Yama and Niyama in their own words',
            'Design a 10-minute morning yoga flow for a peer',
            'Explore: How does yoga activate the parasympathetic nervous system?',
            'Begin a 21-day practice journal: one asana or pranayama per day with observations'] },
        slow: { strategy: 'Physical comfort and psychological safety first. Never force a pose. Always offer chair-based or wall-supported modifications.',
          scaffolds: ['Begin with only 3 poses per session, repeated across multiple sessions',
            'Always offer "rest in child\'s pose" as a safe harbour option',
            'Focus on breath over alignment in the first month',
            'Allow students to describe sensations in their own words — no "right" answers in introspection'] },
        blockers: [
          { symptom: 'Student resistant to yoga (cultural, physical, or emotional discomfort)', solution: 'Never force participation. Offer observer role initially. Connect yoga to sports they already do (breathing in cricket, focus in chess). Ask privately what feels uncomfortable.' },
          { symptom: 'Cannot hold attention in meditation or Nidra', solution: 'Shorten duration: start with 2 minutes, not 10. Use a breath-counting anchor. Normalise mind-wandering: "Notice you wandered; gently return."' }
        ]
      }
    }
  };

  // ── Tag derivation ─────────────────────────────────────────────────
  function methodologyTags(t) {
    const types = t.subtopics.map(s => s.subtopicType);
    const tags = ['5e'];
    if (types.includes('challenge')) tags.push('socratic');
    if (types.includes('advanced'))  tags.push('feynman');
    return tags;
  }
  function qualityTags(t, prog) {
    const tags = [];
    if (t.mandatory) tags.push('tqm');
    if (t.subtopics.some(s => s.assessment?.length)) tags.push('sixsigma');
    if (t.subtopics.length <= 3) tags.push('lean');
    if (prog?.flagged > 0) tags.push('kaizen');
    return tags;
  }

  // ── Filtered topic list ────────────────────────────────────────────
  function getFilteredTopics() {
    return getAllTopics().map(t => {
      const p = topicProgress(t.id, t.subtopics);
      return { ...t, _prog: p };
    }).filter(t => {
      const p = t._prog;
      if (state.filterSubject     !== 'all' && t.subjectId !== state.filterSubject) return false;
      if (state.filterType        === 'mandatory'  && !t.mandatory) return false;
      if (state.filterType        === 'optional'   && (t.mandatory || t.moduleType === 'next-path')) return false;
      if (state.filterType        === 'next-path'  && t.moduleType !== 'next-path') return false;
      if (state.filterStatus      === 'pending'    && p.pending === 0) return false;
      if (state.filterStatus      === 'completed'  && p.pending > 0) return false;
      if (state.filterSearch) {
        const q = state.filterSearch.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !t.subjectName.toLowerCase().includes(q)) return false;
      }
      if (state.filterMethodology !== 'all' && !methodologyTags(t).includes(state.filterMethodology)) return false;
      if (state.filterQuality     !== 'all' && !qualityTags(t, p).includes(state.filterQuality))     return false;
      return true;
    });
  }

  // ── Colour helpers ─────────────────────────────────────────────────
  function iconBg(hex) {
    return hex?.startsWith('#') && hex.length === 7 ? hex + '1a' : '#F0E6D31a';
  }

  // ── Actions ────────────────────────────────────────────────────────
  function login(u, p) {
    const uTrim = (u||'').trim(), pTrim = (p||'').trim();
    if (uTrim === GK_MENTOR.username && pTrim === GK_MENTOR.password) {
      sessionStorage.setItem(AUTH_KEY, '1');
      sessionStorage.setItem(ROLE_KEY, 'mentor');
      state.screen = 'mentor-overview'; state.loginError = '';
    } else if (uTrim === CRED_USER && pTrim === CRED_PASS) {
      sessionStorage.setItem(AUTH_KEY, '1');
      sessionStorage.setItem(ROLE_KEY, 'sme');
      state.screen = 'dashboard'; state.loginError = '';
    } else { state.loginError = 'Invalid credentials. Use SME or Mentor credentials.'; }
    render();
  }
  function logout() {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    Object.assign(state, { screen:'login', loginError:'', selectedTopicId:null,
      selectedSubtopicId:null, flagging:false, mentorTopicId:null });
    render();
  }
  function openModule(topicId) {
    const topic = findTopic(topicId);
    if (!topic) return;
    state.screen = 'module-review';
    state.selectedTopicId = topicId;
    state.flagging = false;
    const firstPending = topic.subtopics.find(
      st => getReview(topicId, st.id).status === 'pending'
    );
    state.selectedSubtopicId = (firstPending || topic.subtopics[0]).id;
    render();
  }
  function backToDashboard() {
    Object.assign(state, { screen:'dashboard', selectedTopicId:null,
      selectedSubtopicId:null, flagging:false });
    render();
  }
  function setFilter(key, value) {
    const map = {
      subject:'filterSubject', type:'filterType', status:'filterStatus',
      syllabus:'filterSyllabus', methodology:'filterMethodology', quality:'filterQuality'
    };
    if (map[key]) state[map[key]] = value;
    render();
  }
  function setSearch(v)     { state.filterSearch = v; render(); }
  function toggleFilters()  { state.filtersOpen = !state.filtersOpen; render(); }
  function clearFilters()   {
    Object.assign(state, {
      filterSubject:'all', filterType:'all', filterStatus:'all',
      filterSyllabus:'all', filterMethodology:'all', filterQuality:'all', filterSearch:''
    });
    render();
  }
  function toggleReviewMode() {
    state.reviewMode  = state.reviewMode === 'ai' ? 'human' : 'ai';
    state.aiExpanded  = false;
    render();
  }
  function toggleAiExpanded() { state.aiExpanded = !state.aiExpanded; render(); }

  function selectSubtopic(stId) {
    state.selectedSubtopicId = state.selectedSubtopicId === stId ? null : stId;
    state.flagging = false;
    render();
    if (state.selectedSubtopicId) {
      document.querySelector('.cl-item.cl-expanded')
        ?.scrollIntoView({ behavior:'smooth', block:'start' });
    }
  }
  function approveSubtopic() {
    saveReview(state.selectedTopicId, state.selectedSubtopicId, 'approved', '');
    const topic = findTopic(state.selectedTopicId);
    const next  = topic.subtopics.find(
      st => st.id !== state.selectedSubtopicId &&
            getReview(state.selectedTopicId, st.id).status === 'pending'
    );
    if (next) state.selectedSubtopicId = next.id;
    state.flagging = false;
    render();
    document.querySelector('.sme-content-area')?.scrollTo(0, 0);
  }
  function startFlag()  { state.flagging = true;  render(); document.getElementById('sme-flag-comment')?.focus(); }
  function cancelFlag() { state.flagging = false; render(); }
  function submitFlag() {
    const ta = document.getElementById('sme-flag-comment');
    saveReview(state.selectedTopicId, state.selectedSubtopicId, 'flagged', ta?.value.trim()||'');
    state.flagging = false; render();
  }
  function resetReview(topicId, stId) { saveReview(topicId, stId, 'pending', ''); render(); }
  function resetAllReviews() {
    if (!confirm('Reset all reviews to pending?')) return;
    localStorage.removeItem(REVIEW_KEY); render();
  }

  // ── Mentor prep storage (per-module, per-guideline) ───────────────
  // Structure: { [moduleId]: { workshop, lab, pacing, teaching } }
  function getMentorPrep() {
    try { return JSON.parse(localStorage.getItem(MENTOR_PREP_KEY) || '{}'); } catch { return {}; }
  }
  function getMentorPrepCount(moduleId) {
    const p = getMentorPrep()[moduleId] || {};
    return [p.workshop, p.lab, p.pacing, p.teaching].filter(Boolean).length;
  }
  function toggleMentorGuideline(moduleId, guidelineId) {
    const data = getMentorPrep();
    if (!data[moduleId]) data[moduleId] = {};
    data[moduleId][guidelineId] = !data[moduleId][guidelineId];
    localStorage.setItem(MENTOR_PREP_KEY, JSON.stringify(data));
    render();
  }

  // ── Mentor navigation ──────────────────────────────────────────────
  function mentorOpenModule(topicId) {
    state.mentorTopicId = topicId;
    state.screen = 'mentor-module';
    render();
  }
  function mentorBack() {
    state.screen = 'mentor-overview';
    state.mentorTopicId = null;
    render();
  }

  // ── Mentor list scroll helpers ─────────────────────────────────────
  function onMentorListScroll() {
    const list = document.getElementById('men-topic-list');
    if (!list) return;
    const wrap    = document.getElementById('men-list-wrap');
    const btnDown = document.getElementById('men-scroll-down');
    const btnUp   = document.getElementById('men-scroll-up');
    const canDown = list.scrollTop + list.clientHeight < list.scrollHeight - 4;
    const canUp   = list.scrollTop > 4;
    if (btnDown) btnDown.style.display = canDown ? 'flex' : 'none';
    if (btnUp)   btnUp.style.display   = canUp   ? 'flex' : 'none';
    if (wrap)    wrap.classList.toggle('sme-list-at-bottom', !canDown);
  }
  function scrollMentorList(dir) {
    const list = document.getElementById('men-topic-list');
    if (list) list.scrollBy({ top: dir * 240, behavior: 'smooth' });
  }

  // ── Mentor filter helpers ──────────────────────────────────────────
  function getMentorFilteredTopics() {
    return getAllTopics().map(t => {
      const p = topicProgress(t.id, t.subtopics);
      return { ...t, _prog: p };
    }).filter(t => {
      if (state.mentorFilterSubject !== 'all' && t.subjectId !== state.mentorFilterSubject) return false;
      if (state.mentorFilterSearch) {
        const q = state.mentorFilterSearch.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !t.subjectName.toLowerCase().includes(q)) return false;
      }
      if (state.mentorFilterMethodology !== 'all' && !methodologyTags(t).includes(state.mentorFilterMethodology)) return false;
      if (state.mentorFilterQuality     !== 'all' && !qualityTags(t, t._prog).includes(state.mentorFilterQuality))  return false;
      return true;
    });
  }
  function setMentorFilter(key, val) {
    const map = {
      subject: 'mentorFilterSubject', methodology: 'mentorFilterMethodology',
      quality:  'mentorFilterQuality', syllabus: 'mentorFilterSyllabus'
    };
    if (map[key]) state[map[key]] = val;
    render();
  }
  function setMentorSearch(v)     { state.mentorFilterSearch = v; render(); }
  function toggleMentorFilters()  { state.mentorFiltersOpen = !state.mentorFiltersOpen; render(); }
  function clearMentorFilters()   {
    Object.assign(state, {
      mentorFilterSyllabus: 'all', mentorFilterSubject: 'all',
      mentorFilterMethodology: 'all', mentorFilterQuality: 'all', mentorFilterSearch: ''
    });
    render();
  }

  // ── Narayana agent (teaching guide context) ────────────────────────
  function sendMentorGuideQuery() {
    const inputEl = document.getElementById('men-narayana-input');
    if (!inputEl) return;
    const query = inputEl.value.trim().toLowerCase();
    if (!query) return;
    const KB = [
      { keys: ['ncert','cbse'],
        ans: 'For NCERT: follow the prescribed chapter sequence strictly. Use the 5E approach — start with hands-on engagement before textbook content. NCERT assessments are high-stakes; ensure every core subtopic is completed before evaluation.' },
      { keys: ['icse'],
        ans: 'ICSE demands deeper analytical writing. Prioritise Feynman-style teaching — have students explain concepts in their own words. Lab experiments are mandatory for science modules under ICSE.' },
      { keys: ['nios'],
        ans: 'NIOS is self-paced. Students may progress faster in strong areas — use the Fast Learner Path strategies and unlock next-path modules early. Focus on practical and vocational connections in experiments.' },
      { keys: ['experiment','setup','activity','material','lab'],
        ans: 'For experiment prep: always do a dry-run the evening before. Check the Experiments tab of each module guide for the full materials list. Write a clear objective on the board before students enter the room.' },
      { keys: ['pacing','fast','slow','blocker','stuck','behind'],
        ans: 'Open the Pacing tab for fast-learner extensions and scaffolding for students who need support. For persistent blockers, use the Needs Support scaffolds and schedule a 5-minute one-on-one check-in.' },
      { keys: ['misconception','mistake','error','wrong'],
        ans: 'Common misconceptions per module are in the Training tab. Always address them using the "show don\'t tell" method — let students discover contradictions through an experiment or counterexample.' },
      { keys: ['fraction'],
        ans: 'For Fractions: always start with physical objects (paper folding, pizza slices). The most common error is adding numerators AND denominators. Use the Fraction Wall experiment to build visual intuition before abstract notation.' },
      { keys: ['gravity'],
        ans: 'For Gravity: let phenomena lead — do the drop experiment before naming gravity. The key misconception is heavier = faster. The paper-on-book experiment resolves this empirically. Keep W=mg until verbal understanding is solid.' },
      { keys: ['civic'],
        ans: 'For Civics: connect to real local governance events. The Mock Parliament experiment is high-impact — allocate a full 40-minute session. Mnemonic FEAR CE helps students recall Fundamental Rights.' },
      { keys: ['ancient','civilization','history'],
        ans: 'For Ancient Civilizations: treat it as detective work. The Artefact Analysis activity sparks genuine curiosity. Colour-code each civilization consistently throughout all materials to prevent confusion.' },
      { keys: ['data','statistics','graph','mean','median','mode'],
        ans: 'For Data Handling: always collect real class data first (heights, sleep hours). The misleading graphs activity builds critical thinking. Introduce Mode first — it is the most intuitive central tendency measure.' },
      { keys: ['yoga','pranayama','asana','wellness'],
        ans: 'For Yoga: create a consistent opening ritual — 3 breaths, intention, centering pose. Never force participation. The heart-rate pranayama experiment gives scientific grounding to skeptical students.' },
      { keys: ['train','ready','prepared','complete','done'],
        ans: 'Mark a module as Training Complete using the checkbox at the bottom of the Training tab. Your progress is saved locally and shown as a green badge on the module card.' },
      { keys: ['filter','search','find','subject','syllabus'],
        ans: 'Use the filter panel above to narrow modules by Subject, Syllabus (NCERT / ICSE / NIOS), Learning Methodology, or Quality Framework. Active filters appear as removable amber chips.' }
    ];
    const matched = KB.find(e => e.keys.some(k => query.includes(k)));
    state.narayanaMsg = matched
      ? matched.ans
      : 'Please check the Training, Experiments, or Pacing tabs of the relevant module, or refer to the Gurukul curriculum guidelines.';
    inputEl.value = '';
    const msgEl = document.querySelector('#men-narayana-pane .nlp-bubble-text');
    if (msgEl) msgEl.textContent = state.narayanaMsg;
  }

  function renderNarayanaPane() {
    return `
      <div id="men-narayana-pane" class="men-narayana-pane">
        <div class="narayana-unified-control">
          <div class="nlp-avatar-section">
            <img src="img/narayana-guide.png" alt="Narayana" class="nlp-avatar">
            <div class="nlp-status-dot"></div>
          </div>
          <div class="nlp-message-box bubble-style">
            <div class="nlp-bubble-title">Narayana</div>
            <div class="nlp-bubble-text">${state.narayanaMsg ||
              'Namaste, Guru. I am Narayana. Ask me about any module, experiment, pacing strategy, or syllabus guideline.'
            }</div>
          </div>
          <div class="nlp-chat-controls">
            <input type="text" id="men-narayana-input" placeholder="Ask Narayana…"
              onkeydown="if(event.key==='Enter')GKSmeApp.sendMentorGuideQuery()">
            <button class="nlp-send-btn" onclick="GKSmeApp.sendMentorGuideQuery()">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M2.01 21L23 12L2.01 3L2 10l15 2l-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>`;
  }

  // ── Scroll indicator helpers ───────────────────────────────────────
  function onListScroll() {
    const list = document.getElementById('sme-topic-list');
    if (!list) return;
    const wrap = document.getElementById('sme-list-wrap');
    const btnDown = document.getElementById('sme-scroll-down');
    const btnUp   = document.getElementById('sme-scroll-up');
    const canDown = list.scrollTop + list.clientHeight < list.scrollHeight - 4;
    const canUp   = list.scrollTop > 4;
    if (btnDown) btnDown.style.display = canDown ? 'flex' : 'none';
    if (btnUp)   btnUp.style.display   = canUp   ? 'flex' : 'none';
    if (wrap)    wrap.classList.toggle('sme-list-at-bottom', !canDown);
  }
  function scrollList(dir) {
    const list = document.getElementById('sme-topic-list');
    if (list) list.scrollBy({ top: dir * 240, behavior: 'smooth' });
  }

  // ── Render router ──────────────────────────────────────────────────
  function render() {
    if (!isLoggedIn() && state.screen !== 'login') state.screen = 'login';
    const root = document.getElementById('sme-app');
    if (!root) return;
    const role = sessionStorage.getItem(ROLE_KEY);
    try {
      if      (state.screen === 'login')                                    root.innerHTML = renderLogin();
      else if (role === 'mentor' && state.screen === 'mentor-overview')     root.innerHTML = renderMentorOverview();
      else if (role === 'mentor' && state.screen === 'mentor-module')       root.innerHTML = renderMentorModuleGuide();
      else if (state.screen === 'dashboard')                                root.innerHTML = renderDashboard();
      else if (state.screen === 'module-review')                            root.innerHTML = renderModuleReview();
      // Init scroll arrows after list renders
      if (state.screen === 'dashboard')       requestAnimationFrame(onListScroll);
      if (state.screen === 'mentor-overview') requestAnimationFrame(onMentorListScroll);
    } catch (e) {
      root.innerHTML = `<div style="padding:40px;text-align:center;color:#6B3F1A">
        <p>Something went wrong. <a href="sme.html">Reload</a></p>
        <pre style="font-size:11px;color:#aaa;margin-top:12px">${e.message}</pre></div>`;
    }
  }

  // ── Login ──────────────────────────────────────────────────────────
  function renderLogin() {
    return `
      <div class="sme-login-wrap">
        <div class="sme-login-card">
          <div class="sme-login-icon">📋</div>
          <h1 class="sme-login-title">Curated Content</h1>
          <p class="sme-login-sub">SME Review Portal &amp; Mentor Teaching Guide</p>
          ${state.loginError ? `<div class="sme-alert">${state.loginError}</div>` : ''}
          <div class="sme-field">
            <label>Username</label>
            <input type="text" id="sme-u" value="sme" autocomplete="off"
              onkeydown="if(event.key==='Enter')GKSmeApp.login(document.getElementById('sme-u').value,document.getElementById('sme-p').value)" />
          </div>
          <div class="sme-field">
            <label>Password</label>
            <input type="password" id="sme-p" value="sme123" autocomplete="new-password"
              onkeydown="if(event.key==='Enter')GKSmeApp.login(document.getElementById('sme-u').value,document.getElementById('sme-p').value)" />
          </div>
          <button class="sme-btn sme-btn-primary sme-btn-full"
            onclick="GKSmeApp.login(document.getElementById('sme-u').value,document.getElementById('sme-p').value)">
            Sign In →
          </button>
          <p style="text-align:center;margin-top:1rem;font-size:.82rem;">
            <a href="start.html" style="color:#2563EB;text-decoration:none;font-weight:600;">← Back to Home</a>
          </p>
        </div>
      </div>`;
  }

  // ── Mentor Overview ────────────────────────────────────────────────
  function renderMentorOverview() {
    const allTopics = getAllTopics();
    const prep      = getMentorPrep();

    // Stats
    let fullyPrepared = 0, inProgress = 0;
    allTopics.forEach(t => {
      const c = getMentorPrepCount(t.id);
      if (c === 4) fullyPrepared++;
      else if (c > 0) inProgress++;
    });
    const notStarted      = allTopics.length - fullyPrepared - inProgress;
    const totalPrepSlots  = allTopics.length * 4;
    const donePrepSlots   = allTopics.reduce((s, t) => s + getMentorPrepCount(t.id), 0);
    const overallPct      = totalPrepSlots ? Math.round((donePrepSlots / totalPrepSlots) * 100) : 0;

    // Subject map for filter pills
    const subjectMap = {};
    allTopics.forEach(t => {
      if (!subjectMap[t.subjectId])
        subjectMap[t.subjectId] = { id: t.subjectId, name: t.subjectName, icon: t.subjectIcon, color: t.subjectColor };
    });
    const subjects = Object.values(subjectMap);

    // Filtered modules
    const filteredTopics = getMentorFilteredTopics();

    const activeCount = [
      state.mentorFilterSubject     !== 'all', state.mentorFilterSyllabus     !== 'all',
      state.mentorFilterMethodology !== 'all', state.mentorFilterQuality      !== 'all',
      !!state.mentorFilterSearch
    ].filter(Boolean).length;

    // Label maps
    const methodLabels   = { '5e':'5E Approach', socratic:'Socratic Method', feynman:'Feynman Technique' };
    const qualityLabels  = { sixsigma:'Six Sigma', tqm:'TQM', lean:'LEAN', kaizen:'Kaizen' };
    const syllabusLabels = { ncert:'NCERT', icse:'ICSE', nios:'NIOS' };

    // Active chips
    function chip(label, key) {
      return `<button class="sme-chip-rm" onclick="GKSmeApp.setMentorFilter('${key}','all')">${label} ×</button>`;
    }
    const chips = [];
    if (state.mentorFilterSearch)                chips.push(`<button class="sme-chip-rm" onclick="GKSmeApp.setMentorSearch('')">"${state.mentorFilterSearch}" ×</button>`);
    if (state.mentorFilterSyllabus   !== 'all')  chips.push(chip(syllabusLabels[state.mentorFilterSyllabus], 'syllabus'));
    if (state.mentorFilterSubject    !== 'all')  chips.push(chip(subjects.find(s=>s.id===state.mentorFilterSubject)?.name||'', 'subject'));
    if (state.mentorFilterMethodology !== 'all') chips.push(chip(methodLabels[state.mentorFilterMethodology], 'methodology'));
    if (state.mentorFilterQuality    !== 'all')  chips.push(chip(qualityLabels[state.mentorFilterQuality], 'quality'));

    // Pill helper
    function pill(label, key, val, cur) {
      return `<button class="sme-pill${cur===val?' sme-pill-active':''}"
        onclick="GKSmeApp.setMentorFilter('${key}','${val}')">${label}</button>`;
    }

    // Topic row builder (SME-style)
    function buildRow(t) {
      const cnt  = getMentorPrepCount(t.id);
      const p    = prep[t.id] || {};
      const bg   = iconBg(t.subjectColor);
      const dotCls  = cnt === 4 ? 'sme-dot-approved' : cnt > 0 ? 'sme-dot-partial' : 'sme-dot-pending';
      const dotChar = cnt === 4 ? '✓' : cnt > 0 ? '·' : '○';
      const prepDots = ['workshop','lab','pacing','teaching'].map(k =>
        `<span class="men-prep-dot ${p[k] ? 'mpd-done' : ''}"></span>`
      ).join('');
      const ctaHtml = cnt === 4
        ? `<button class="sme-row-cta sme-row-cta-done"
             onclick="event.stopPropagation();GKSmeApp.mentorOpenModule('${t.id}')">View</button>`
        : `<button class="sme-row-cta"
             onclick="event.stopPropagation();GKSmeApp.mentorOpenModule('${t.id}')">Prepare →</button>`;
      return `
        <div class="sme-topic-row ${cnt===4?'sme-row-done':''}" onclick="GKSmeApp.mentorOpenModule('${t.id}')">
          <span class="sme-dot ${dotCls}">${dotChar}</span>
          <span class="sme-icon-bubble" style="background:${bg};color:${t.subjectColor}">${t.icon}</span>
          <div class="sme-row-body">
            <span class="sme-row-title">${t.name}</span>
            <span class="sme-row-meta">${t.subjectName}</span>
          </div>
          <div class="sme-row-prog-cell">
            <div class="men-prep-dots">${prepDots}</div>
            <span class="sme-row-prog-label">${cnt}/4 ready</span>
          </div>
          ${ctaHtml}
        </div>`;
    }

    // Group filtered topics by subject
    const bySubject = {};
    filteredTopics.forEach(t => {
      if (!bySubject[t.subjectId]) bySubject[t.subjectId] = [];
      bySubject[t.subjectId].push(t);
    });

    const listRows = Object.entries(bySubject).map(([subjId, topics]) => {
      const s = subjectMap[subjId];
      if (!s) return '';
      return `
        <div class="sme-list-section-hd" style="color:${s.color}">
          <span class="sme-lsh-dot" style="background:${s.color}"></span>
          ${s.icon} ${s.name} <span class="sme-lsh-count">${topics.length}</span>
        </div>
        ${topics.map(t => buildRow(t)).join('')}`;
    }).join('');

    const emptyState = filteredTopics.length === 0 ? `
      <div class="sme-empty-state">
        <div class="sme-empty-icon">🔍</div>
        <div class="sme-empty-text">No modules match your current filters</div>
        ${activeCount > 0 ? `<button class="sme-btn sme-btn-outline" onclick="GKSmeApp.clearMentorFilters()">Clear filters</button>` : ''}
      </div>` : '';

    return `
    <div class="sme-layout">
      <header class="sme-header">
        <div class="sme-header-brand">
          <img src="img/wizkids-logo.png" alt="Wizkids"
               style="width:34px;height:auto;border-radius:50%;flex-shrink:0;" />
          <div>
            <div class="sme-brand-name">Wizkids Gurukul</div>
            <div class="sme-brand-sub">Mentor Teaching Guide</div>
          </div>
        </div>
        ${renderHeaderRight()}
      </header>

      ${renderNarayanaPane()}

      <div class="sme-main men-main">

        <!-- Stats overview card -->
        <div class="sme-stats-overview">
          <div class="sme-stats-row-inner">
            <div class="sme-stat-item">
              <span class="sme-stat-num">${allTopics.length}</span>
              <span class="sme-stat-lbl">Total Modules</span>
            </div>
            <div class="men-stat-sep"></div>
            <div class="sme-stat-item">
              <span class="sme-stat-num" style="color:#16A34A">${fullyPrepared}</span>
              <span class="sme-stat-lbl">Fully Prepared</span>
            </div>
            <div class="men-stat-sep"></div>
            <div class="sme-stat-item">
              <span class="sme-stat-num" style="color:#D97706">${inProgress}</span>
              <span class="sme-stat-lbl">In Progress</span>
            </div>
            <div class="men-stat-sep"></div>
            <div class="sme-stat-item">
              <span class="sme-stat-num" style="color:#94A3B8">${notStarted}</span>
              <span class="sme-stat-lbl">Not Started</span>
            </div>
          </div>
          <div class="sme-stats-bar-wrap">
            <div class="sme-stats-bar">
              <div class="sme-stats-bar-fill" style="width:${overallPct}%"></div>
            </div>
            <span class="sme-stats-bar-label">${overallPct}% prepared</span>
          </div>
        </div>

        <!-- Prep legend card -->
        <div class="men-prep-context-card">
          <div class="men-pccard-title">4 preparation tasks per module:</div>
          <div class="men-pccard-pills">
            <span class="men-pccard-pill men-pcp-workshop">🗂️ Workshop Material</span>
            <span class="men-pccard-pill men-pcp-lab">🔬 Lab Activities</span>
            <span class="men-pccard-pill men-pcp-pacing">📈 Student Pacing</span>
            <span class="men-pccard-pill men-pcp-teaching">💡 Teaching Tips</span>
          </div>
        </div>

        <!-- Search + filter trigger -->
        <div class="sme-toolbar">
          <div class="sme-search-wrap">
            <span class="sme-search-icon">🔍</span>
            <input class="sme-search-input" type="text" placeholder="Search modules…"
                   value="${state.mentorFilterSearch}"
                   oninput="GKSmeApp.setMentorSearch(this.value)" />
            ${state.mentorFilterSearch
              ? `<button class="sme-search-clear" onclick="GKSmeApp.setMentorSearch('')">×</button>`
              : ''}
          </div>
          <button class="sme-filters-btn${activeCount>0?' sme-filters-btn-active':''}"
                  onclick="GKSmeApp.toggleMentorFilters()">
            ${state.mentorFiltersOpen?'⊗':'⊕'} Filters
            ${activeCount>0?`<span class="sme-filters-badge">${activeCount}</span>`:''}
          </button>
        </div>

        <!-- Active chips -->
        ${chips.length > 0 ? `
        <div class="sme-chips-row">
          ${chips.join('')}
          <button class="sme-clear-all-btn" onclick="GKSmeApp.clearMentorFilters()">Clear all</button>
        </div>` : ''}

        <!-- Filter panel -->
        ${state.mentorFiltersOpen ? `
        <div class="sme-filters-panel">

          <div class="sme-filter-group">
            <div class="sme-filter-group-hd">
              <span class="sme-fgi">📚</span><span class="sme-fgt">Curriculum</span>
            </div>
            <div class="sme-filter-row">
              <span class="sme-frl">Syllabus</span>
              <div class="sme-pill-group">
                ${pill('All','syllabus','all',state.mentorFilterSyllabus)}
                ${pill('NCERT','syllabus','ncert',state.mentorFilterSyllabus)}
                ${pill('ICSE','syllabus','icse',state.mentorFilterSyllabus)}
                ${pill('NIOS','syllabus','nios',state.mentorFilterSyllabus)}
              </div>
            </div>
            <div class="sme-filter-row">
              <span class="sme-frl">Subject</span>
              <div class="sme-pill-group">
                ${pill('All','subject','all',state.mentorFilterSubject)}
                ${subjects.map(s=>pill(s.icon+'\u00A0'+s.name,'subject',s.id,state.mentorFilterSubject)).join('')}
              </div>
            </div>
          </div>

          <div class="sme-filter-group">
            <div class="sme-filter-group-hd">
              <span class="sme-fgi">🎓</span><span class="sme-fgt">Learning Methodology</span>
            </div>
            <div class="sme-filter-row">
              <div class="sme-pill-group">
                ${pill('All Methods','methodology','all',state.mentorFilterMethodology)}
                ${pill('5E Approach','methodology','5e',state.mentorFilterMethodology)}
                ${pill('Socratic Method','methodology','socratic',state.mentorFilterMethodology)}
                ${pill('Feynman Technique','methodology','feynman',state.mentorFilterMethodology)}
              </div>
            </div>
          </div>

          <div class="sme-filter-group">
            <div class="sme-filter-group-hd">
              <span class="sme-fgi">✅</span><span class="sme-fgt">Quality Framework</span>
            </div>
            <div class="sme-filter-row">
              <div class="sme-pill-group">
                ${pill('All','quality','all',state.mentorFilterQuality)}
                ${pill('Six Sigma','quality','sixsigma',state.mentorFilterQuality)}
                ${pill('TQM','quality','tqm',state.mentorFilterQuality)}
                ${pill('LEAN','quality','lean',state.mentorFilterQuality)}
                ${pill('Kaizen','quality','kaizen',state.mentorFilterQuality)}
              </div>
            </div>
          </div>

          <div class="sme-filter-panel-footer">
            <button class="sme-btn sme-btn-outline" onclick="GKSmeApp.clearMentorFilters()">Clear All</button>
            <button class="sme-btn men-btn-primary" onclick="GKSmeApp.toggleMentorFilters()">
              Done · ${filteredTopics.length} module${filteredTopics.length!==1?'s':''}
            </button>
          </div>
        </div>` : ''}

        <!-- Notice strip -->
        <div class="men-notice-strip">
          📋 Complete all 4 preparation tasks before each teaching session
        </div>

        <!-- Scrollable topic list (SME-style) -->
        <div class="sme-list-wrap" id="men-list-wrap">
          <button class="sme-scroll-btn sme-scroll-up" id="men-scroll-up"
                  onclick="GKSmeApp.scrollMentorList(-1)" style="display:none"
                  title="Scroll up" aria-label="Scroll up">↑</button>
          <div class="sme-topic-list" id="men-topic-list"
               onscroll="GKSmeApp.onMentorListScroll()">
            ${emptyState}
            ${listRows}
          </div>
          <button class="sme-scroll-btn sme-scroll-down" id="men-scroll-down"
                  onclick="GKSmeApp.scrollMentorList(1)"
                  title="Scroll down for more modules" aria-label="Scroll down">↓</button>
        </div>

      </div>
    </div>`;
  }

  // ── Mentor Module Guide ────────────────────────────────────────────
  function renderMentorModuleGuide() {
    const topic     = findTopic(state.mentorTopicId);
    if (!topic) return '';
    const guide     = MENTOR_GUIDES[topic.id];
    const prepData  = getMentorPrep()[topic.id] || {};
    const prepCount = getMentorPrepCount(topic.id);
    const sc        = topic.subjectColor;

    // Generic fallback for modules without rich guide data
    const g = guide || {
      training: {
        overview: `This module covers "${topic.name}" in ${topic.subjectName}. Review the subtopics and learning objectives before your session.`,
        prerequisites: ['Review all subtopics in this module', 'Ensure materials and resources are prepared'],
        keyConcepts: topic.subtopics.map(s => s.name),
        misconceptions: ['Students may confuse foundational terms — define clearly on the board'],
        pedagogyTip: 'Begin with a real-world example that connects the topic to students\' daily life before introducing abstract concepts.'
      },
      experiments: [{
        title: 'Exploratory Activity', duration: '20 min',
        materials: ['Topic-specific materials', 'Notebook', 'Pencil'],
        setup: ['Prepare materials the day before', 'Open with a guiding question',
                'Let students observe before explaining', 'Connect observations to lesson objectives'],
        objective: 'Experiential introduction to the module concepts'
      }],
      pacing: {
        fast: { strategy: 'Fast learners can explore extension activities and act as peer tutors.',
          activities: ['Research a real-world application', 'Teach a concept to a peer (Feynman method)', 'Create a visual summary or mind-map'] },
        slow: { strategy: 'Break each concept into smaller steps. More hands-on time, less lecture.',
          scaffolds: ['Provide concept summary cards', 'Use worked examples before independent practice', 'Check understanding verbally before written work'] },
        blockers: [
          { symptom: 'Student not engaging', solution: 'Ask "When have you seen this in real life?" and start from their answer.' },
          { symptom: 'Student falls behind peers', solution: 'Schedule a 5-minute one-on-one check-in. Identify the exact step that is unclear.' }
        ]
      }
    };

    const tr  = g.training;
    const pac = g.pacing;

    function checkBox(id, done) {
      return `<label class="men-prep-check-label" onclick="GKSmeApp.toggleMentorGuideline('${topic.id}','${id}')">
        <span class="men-prep-chk ${done ? 'men-prep-chk-done' : ''}">${done ? '✓' : ''}</span>
        <span>${done ? 'Ready ✓' : 'Mark Ready'}</span>
      </label>`;
    }

    // Card 1: Workshop Material (amber) — from training data
    const workshopCard = `
      <div class="men-guide-card" style="--card-color:#D97706;--card-bg:#FFFBEB;--card-border:#FDE68A">
        <div class="men-guide-card-hd">
          <span class="men-guide-card-icon" style="background:#FEF3C7;color:#D97706">🗂️</span>
          <div>
            <div class="men-guide-card-title">Workshop Material</div>
            <div class="men-guide-card-sub">Pre-session preparation</div>
          </div>
        </div>
        <div class="men-guide-card-body">
          <div class="men-guide-sec-hd">Overview</div>
          <p class="men-guide-text">${tr.overview}</p>
          <div class="men-guide-sec-hd">Prerequisites</div>
          <ul class="men-guide-list">${tr.prerequisites.map(p => `<li>${p}</li>`).join('')}</ul>
          <div class="men-guide-sec-hd">Key Concepts</div>
          <div class="men-concept-list">
            ${tr.keyConcepts.slice(0,3).map((c,i) => `
              <div class="men-concept-item">
                <span class="men-concept-num">${i+1}</span><span>${c}</span>
              </div>`).join('')}
          </div>
        </div>
        <div class="men-guide-card-foot">${checkBox('workshop', prepData.workshop)}</div>
      </div>`;

    // Card 2: Lab Activities (green) — from experiments data
    const labCard = `
      <div class="men-guide-card" style="--card-color:#16A34A;--card-bg:#F0FDF4;--card-border:#BBF7D0">
        <div class="men-guide-card-hd">
          <span class="men-guide-card-icon" style="background:#DCFCE7;color:#16A34A">🔬</span>
          <div>
            <div class="men-guide-card-title">Lab Activities</div>
            <div class="men-guide-card-sub">${g.experiments.length} experiment${g.experiments.length!==1?'s':''}</div>
          </div>
        </div>
        <div class="men-guide-card-body">
          ${g.experiments.map((exp, ei) => `
            <div class="men-guide-sec-hd">
              Experiment ${ei+1}: ${exp.title}
              <span class="men-guide-dur">⏱ ${exp.duration}</span>
            </div>
            <div class="men-guide-sec-sub">Materials</div>
            <ul class="men-guide-list">${exp.materials.map(m => `<li>${m}</li>`).join('')}</ul>
            <div class="men-guide-sec-sub">Setup Steps</div>
            <ol class="men-guide-list men-guide-ol">${exp.setup.map(s => `<li>${s}</li>`).join('')}</ol>
            <p class="men-guide-obj"><em>Objective:</em> ${exp.objective}</p>
          `).join('')}
        </div>
        <div class="men-guide-card-foot">${checkBox('lab', prepData.lab)}</div>
      </div>`;

    // Card 3: Student Pacing (purple) — from pacing data
    const pacingCard = `
      <div class="men-guide-card" style="--card-color:#9333EA;--card-bg:#FAF5FF;--card-border:#E9D5FF">
        <div class="men-guide-card-hd">
          <span class="men-guide-card-icon" style="background:#F3E8FF;color:#9333EA">📈</span>
          <div>
            <div class="men-guide-card-title">Student Pacing</div>
            <div class="men-guide-card-sub">Differentiated strategies</div>
          </div>
        </div>
        <div class="men-guide-card-body">
          <div class="men-guide-sec-hd">🚀 Fast Learners</div>
          <p class="men-guide-text">${pac.fast.strategy}</p>
          <ul class="men-guide-list">${pac.fast.activities.map(a => `<li>${a}</li>`).join('')}</ul>
          <div class="men-guide-sec-hd">🤝 Needs Support</div>
          <p class="men-guide-text">${pac.slow.strategy}</p>
          <ul class="men-guide-list">${pac.slow.scaffolds.map(s => `<li>${s}</li>`).join('')}</ul>
        </div>
        <div class="men-guide-card-foot">${checkBox('pacing', prepData.pacing)}</div>
      </div>`;

    // Card 4: Teaching Tips (blue) — from pedagogy tip + misconceptions + blockers
    const teachingCard = `
      <div class="men-guide-card" style="--card-color:#2563EB;--card-bg:#EFF6FF;--card-border:#BFDBFE">
        <div class="men-guide-card-hd">
          <span class="men-guide-card-icon" style="background:#DBEAFE;color:#2563EB">💡</span>
          <div>
            <div class="men-guide-card-title">Teaching Tips</div>
            <div class="men-guide-card-sub">Pedagogy &amp; misconceptions</div>
          </div>
        </div>
        <div class="men-guide-card-body">
          <div class="men-guide-sec-hd">💡 Pedagogy Tip</div>
          <p class="men-guide-text">${tr.pedagogyTip}</p>
          <div class="men-guide-sec-hd">⚠️ Common Misconceptions</div>
          <ul class="men-guide-list men-guide-warn">${tr.misconceptions.map(m => `<li>${m}</li>`).join('')}</ul>
          ${pac.blockers.length ? `
          <div class="men-guide-sec-hd">🚧 Blockers &amp; Solutions</div>
          ${pac.blockers.map(b => `
            <div class="men-blocker-item">
              <div class="men-blocker-symptom"><span class="men-blocker-icon">⚑</span><span>${b.symptom}</span></div>
              <div class="men-blocker-solution">${b.solution}</div>
            </div>`).join('')}` : ''}
        </div>
        <div class="men-guide-card-foot">${checkBox('teaching', prepData.teaching)}</div>
      </div>`;

    return `
    <div class="sme-layout">
      <header class="sme-header">
        <div class="sme-header-brand">
          <button class="sme-btn sme-btn-ghost" style="color:#0F766E;"
                  onclick="GKSmeApp.mentorBack()">← Teaching Guide</button>
          <span class="sme-header-sep">|</span>
          <span class="sme-brand-name" style="color:${sc}">${topic.icon} ${topic.name}</span>
        </div>
        ${renderHeaderRight()}
      </header>

      ${renderNarayanaPane()}

      <div class="sme-main men-main">

        <!-- Module banner -->
        <div class="men-module-banner" style="border-left-color:${sc}">
          <span class="men-module-banner-icon" style="background:${iconBg(sc)};color:${sc}">${topic.icon}</span>
          <div>
            <div class="men-module-banner-name">${topic.name}</div>
            <div class="men-module-banner-meta">${topic.subjectName} · ${topic.subtopics.length} subtopic${topic.subtopics.length!==1?'s':''}</div>
          </div>
          <span class="men-banner-prep ${prepCount===4?'men-banner-prep-done':''}">${prepCount}/4 complete</span>
        </div>

        <!-- 4 guideline cards (2×2 grid) -->
        <div class="men-guide-grid">
          ${workshopCard}
          ${labCard}
          ${pacingCard}
          ${teachingCard}
        </div>

      </div>
    </div>`;
  }

  // ── Dashboard ──────────────────────────────────────────────────────
  function renderDashboard() {
    const allTopics = getAllTopics();

    // Global stats (unfiltered)
    let gApproved = 0, gFlagged = 0, gTotal = 0;
    allTopics.forEach(t => {
      const p = topicProgress(t.id, t.subtopics);
      gTotal += p.total; gApproved += p.approved; gFlagged += p.flagged;
    });
    const gPending = gTotal - gApproved - gFlagged;
    const gPct     = gTotal ? Math.round((gApproved / gTotal) * 100) : 0;

    // Enrich filtered topics with AI status
    const filtered = getFilteredTopics().map(t => ({
      ...t, _aiStatus: getAIStatus(t, t._prog)
    }));

    // AI-first split (over ALL topics, not just filtered — for the mode card counts)
    const allEnriched     = allTopics.map(t => ({ ...t, _prog: topicProgress(t.id, t.subtopics) }));
    const totalEscalated  = allEnriched.filter(t => getAIStatus(t, t._prog) === 'escalated').length;
    const totalAIReviewed = allTopics.length - totalEscalated;

    // What to show in the scrollable list
    const escalatedList  = filtered.filter(t => t._aiStatus === 'escalated');
    const aiReviewedList = filtered.filter(t => t._aiStatus === 'ai-reviewed');

    // In AI mode: primary = escalated; secondary = ai-reviewed (shown when expanded)
    // In Human mode: show everything
    const primaryList   = state.reviewMode === 'ai' ? escalatedList : filtered;
    const secondaryList = state.reviewMode === 'ai' && state.aiExpanded ? aiReviewedList : [];

    // Active filter count
    const activeCount = [
      state.filterSubject !== 'all', state.filterType     !== 'all',
      state.filterStatus  !== 'all', state.filterSyllabus !== 'all',
      state.filterMethodology !== 'all', state.filterQuality !== 'all',
      !!state.filterSearch
    ].filter(Boolean).length;

    // Subjects for filter panel
    const subjectMap = {};
    allTopics.forEach(t => {
      if (!subjectMap[t.subjectId])
        subjectMap[t.subjectId] = { id: t.subjectId, name: t.subjectName, icon: t.subjectIcon };
    });
    const subjects = Object.values(subjectMap);

    // Label maps
    const methodLabels  = { '5e':'5E Approach', socratic:'Socratic Method', feynman:'Feynman Technique' };
    const qualityLabels = { sixsigma:'Six Sigma', tqm:'TQM', lean:'LEAN', kaizen:'Kaizen' };
    const typeLabels    = { mandatory:'Mandatory', optional:'Optional', 'next-path':'Next Level' };
    const statusLabels  = { pending:'Pending Review', completed:'Review Done' };
    const syllabusLabels= { ncert:'NCERT', icse:'ICSE', nios:'NIOS' };

    // Active chips
    function chip(label, key) {
      return `<button class="sme-chip-rm" onclick="GKSmeApp.setFilter('${key}','all')">${label} ×</button>`;
    }
    const chips = [];
    if (state.filterSearch)              chips.push(`<button class="sme-chip-rm" onclick="GKSmeApp.setSearch('')">"${state.filterSearch}" ×</button>`);
    if (state.filterSyllabus  !== 'all') chips.push(chip(syllabusLabels[state.filterSyllabus], 'syllabus'));
    if (state.filterSubject   !== 'all') chips.push(chip(subjects.find(s=>s.id===state.filterSubject)?.name||'', 'subject'));
    if (state.filterMethodology !== 'all') chips.push(chip(methodLabels[state.filterMethodology], 'methodology'));
    if (state.filterQuality   !== 'all') chips.push(chip(qualityLabels[state.filterQuality], 'quality'));
    if (state.filterType      !== 'all') chips.push(chip(typeLabels[state.filterType], 'type'));
    if (state.filterStatus    !== 'all') chips.push(chip(statusLabels[state.filterStatus], 'status'));

    // Pill helper
    function pill(label, key, val, cur) {
      return `<button class="sme-pill${cur===val?' sme-pill-active':''}"
        onclick="GKSmeApp.setFilter('${key}','${val}')">${label}</button>`;
    }

    // Descriptions for contextual hints
    const methodDesc = {
      '5e'     : 'Engage → Explore → Explain → Elaborate → Evaluate. All standard modules follow this structured inquiry cycle.',
      socratic : 'Learning through questioning and critical dialogue. Modules with challenge-based subtopics.',
      feynman  : 'Master a concept by teaching it simply. Modules with advanced deep-dive subtopics.'
    };
    const qualityDesc = {
      sixsigma : 'Data-driven quality. Shows modules with measurable assessments and defined outcomes.',
      tqm      : 'Total Quality Management: holistic quality across all mandatory core modules.',
      lean     : 'Efficient, no-waste design. Shows concise, focused modules.',
      kaizen   : 'Continuous improvement. Shows modules with flagged content awaiting revision.'
    };

    // ── Row builder ────────────────────────────────────────────────────
    function buildRow(t, isAIRow) {
      const p       = t._prog;
      const pct     = p.total ? Math.round((p.approved / p.total) * 100) : 0;
      const pctF    = p.total ? Math.round((p.flagged  / p.total) * 100) : 0;
      const isDone  = p.pending === 0 && !t.isEmpty;
      const isFlagged = p.flagged > 0;

      let rowMod = 'sme-row-pending', dotCls = 'sme-dot-pending', dotChar = '·';
      if (t.isEmpty)              { rowMod = 'sme-row-empty';   dotCls = 'sme-dot-empty';   dotChar = '○'; }
      else if (isDone && !isFlagged) { rowMod = 'sme-row-done'; dotCls = 'sme-dot-done';   dotChar = '✓'; }
      else if (isFlagged)         { rowMod = 'sme-row-flag';    dotCls = 'sme-dot-flag';   dotChar = '⚑'; }

      // AI-reviewed rows get a tinted overlay modifier
      const aiMod = isAIRow ? ' sme-row-ai' : '';

      let ctaHtml;
      if (isAIRow) {
        // AI-reviewed: "Override" lets the human claim it back
        ctaHtml = `<button class="sme-row-cta sme-row-cta-override"
          onclick="event.stopPropagation();GKSmeApp.openModule('${t.id}')">Override</button>`;
      } else if (t.isEmpty) {
        ctaHtml = `<button class="sme-row-cta sme-row-cta-empty" disabled>Awaiting</button>`;
      } else if (isDone && !isFlagged) {
        ctaHtml = `<button class="sme-row-cta sme-row-cta-done"
          onclick="event.stopPropagation();GKSmeApp.openModule('${t.id}')">View</button>`;
      } else {
        ctaHtml = `<button class="sme-row-cta"
          onclick="event.stopPropagation();GKSmeApp.openModule('${t.id}')">Review →</button>`;
      }

      const bg = iconBg(t.subjectColor);

      return `
        <div class="sme-topic-row ${rowMod}${aiMod}" onclick="GKSmeApp.openModule('${t.id}')">
          <span class="sme-dot ${dotCls}">${dotChar}</span>
          <span class="sme-icon-bubble" style="background:${bg};color:${t.subjectColor}">${t.icon}</span>
          <div class="sme-row-body">
            <span class="sme-row-title">${t.name}</span>
            <span class="sme-row-meta">${t.subjectName}${t.mandatory?' · Core':''}</span>
          </div>
          <div class="sme-row-prog-cell">
            ${t.isEmpty
              ? `<span class="sme-row-prog-label sme-prog-empty">Generating…</span>`
              : `<div class="sme-row-prog-bar">
                   <div class="sme-row-prog-fill sme-pf-approved" style="width:${pct}%"></div>
                   <div class="sme-row-prog-fill sme-pf-flagged"  style="width:${pctF}%"></div>
                 </div>
                 <span class="sme-row-prog-label">${p.approved}/${p.total} reviewed</span>`}
          </div>
          ${ctaHtml}
        </div>`;
    }

    // Build row HTML
    const primaryRows   = primaryList.map(t => buildRow(t, false)).join('');
    const secondaryRows = secondaryList.map(t => buildRow(t, true)).join('');

    // AI section divider (shown in AI mode at bottom of list)
    const aiDivider = state.reviewMode === 'ai' ? `
      <div class="sme-ai-divider" onclick="GKSmeApp.toggleAiExpanded()">
        <span class="sme-ai-div-icon">🤖</span>
        <div class="sme-ai-div-body">
          <span class="sme-ai-div-label">AI Agent reviewed ${aiReviewedList.length} module${aiReviewedList.length!==1?'s':''}</span>
          <span class="sme-ai-div-hint">Tap to ${state.aiExpanded?'collapse':'inspect'}</span>
        </div>
        <span class="sme-ai-div-chevron">${state.aiExpanded?'▲':'▾'}</span>
      </div>` : '';

    // Empty state
    const emptyState = primaryList.length === 0 && !state.aiExpanded ? `
      <div class="sme-empty-state">
        <div class="sme-empty-icon">${state.reviewMode==='ai'?'🎉':'🔍'}</div>
        <div class="sme-empty-text">
          ${state.reviewMode==='ai'
            ? 'No modules escalated for review — AI has handled everything!'
            : 'No modules match your current filters'}
        </div>
        ${activeCount > 0
          ? `<button class="sme-btn sme-btn-outline" onclick="GKSmeApp.clearFilters()">Clear filters</button>`
          : ''}
      </div>` : '';

    // ── Full dashboard HTML ─────────────────────────────────────────
    return `
    <div class="sme-layout">

      <header class="sme-header">
        <div class="sme-header-brand">
          <img src="img/wizkids-logo.png" alt="Wizkids"
               style="width:34px;height:auto;border-radius:50%;flex-shrink:0;" />
          <div>
            <div class="sme-brand-name">Wizkids Gurukul</div>
            <div class="sme-brand-sub">Curated Content</div>
          </div>
        </div>
        ${renderHeaderRight()}
      </header>

      <div class="sme-main">

        <!-- Stats overview -->
        <div class="sme-stats-overview">
          <div class="sme-stat-block">
            <span class="sme-stat-num">${allTopics.length}</span>
            <span class="sme-stat-lbl">Modules</span>
          </div>
          <div class="sme-stat-sep"></div>
          <div class="sme-stat-block">
            <span class="sme-stat-num sme-stat-approved">${gApproved}</span>
            <span class="sme-stat-lbl">Approved</span>
          </div>
          <div class="sme-stat-sep"></div>
          <div class="sme-stat-block">
            <span class="sme-stat-num sme-stat-flag-num">${gFlagged}</span>
            <span class="sme-stat-lbl">Flagged</span>
          </div>
          <div class="sme-stat-sep"></div>
          <div class="sme-stat-block">
            <span class="sme-stat-num sme-stat-pending">${gPending}</span>
            <span class="sme-stat-lbl">Pending</span>
          </div>
          <div class="sme-stat-bar-wrap">
            <div class="sme-stat-bar">
              <div class="sme-stat-bar-fill sme-sbf-approved" style="width:${gPct}%"></div>
              <div class="sme-stat-bar-fill sme-sbf-flagged"
                   style="width:${gTotal?Math.round((gFlagged/gTotal)*100):0}%"></div>
            </div>
            <span class="sme-stat-pct">${gPct}% complete</span>
          </div>
        </div>

        <!-- AI-First / Human Review mode toggle card -->
        <div class="sme-mode-card ${state.reviewMode==='ai'?'sme-mode-ai':'sme-mode-human'}">
          <div class="sme-mode-left">
            <span class="sme-mode-icon">${state.reviewMode==='ai'?'🤖':'👤'}</span>
            <div class="sme-mode-info">
              <span class="sme-mode-title">
                ${state.reviewMode==='ai' ? 'AI-First Review Mode' : 'Full Human Review Mode'}
              </span>
              <span class="sme-mode-sub">
                ${state.reviewMode==='ai'
                  ? `AI agent handles <strong>${totalAIReviewed}</strong> modules automatically · <strong>${totalEscalated}</strong> escalated for your review`
                  : `All <strong>${allTopics.length}</strong> modules visible · Review each manually`}
              </span>
            </div>
          </div>
          <label class="sme-toggle-wrap" title="Toggle review mode">
            <span class="sme-toggle-lbl">${state.reviewMode==='ai'?'Switch to Human':'Switch to AI'}</span>
            <button class="sme-toggle${state.reviewMode==='human'?' sme-toggle-on':''}"
                    onclick="GKSmeApp.toggleReviewMode()"
                    role="switch" aria-checked="${state.reviewMode==='human'}"
                    aria-label="Toggle Human Review Mode">
              <span class="sme-toggle-knob"></span>
            </button>
          </label>
        </div>

        <!-- Toolbar: search + filter trigger -->
        <div class="sme-toolbar">
          <div class="sme-search-wrap">
            <span class="sme-search-icon">🔍</span>
            <input class="sme-search-input" type="text" placeholder="Search modules…"
                   value="${state.filterSearch}"
                   oninput="GKSmeApp.setSearch(this.value)" />
            ${state.filterSearch
              ? `<button class="sme-search-clear" onclick="GKSmeApp.setSearch('')">×</button>`
              : ''}
          </div>
          <button class="sme-filters-btn${activeCount>0?' sme-filters-btn-active':''}"
                  onclick="GKSmeApp.toggleFilters()">
            ${state.filtersOpen?'⊗':'⊕'} Filters
            ${activeCount>0?`<span class="sme-filters-badge">${activeCount}</span>`:''}
          </button>
        </div>

        <!-- Active chips -->
        ${chips.length>0?`
        <div class="sme-chips-row">
          ${chips.join('')}
          <button class="sme-clear-all-btn" onclick="GKSmeApp.clearFilters()">Clear all</button>
        </div>`:''}

        <!-- Filter panel (revealed on demand) -->
        ${state.filtersOpen?`
        <div class="sme-filters-panel">

          <!-- Curriculum group (includes Subject now) -->
          <div class="sme-filter-group">
            <div class="sme-filter-group-hd">
              <span class="sme-fgi">📚</span><span class="sme-fgt">Curriculum</span>
            </div>
            <div class="sme-filter-row">
              <span class="sme-frl">Syllabus</span>
              <div class="sme-pill-group">
                ${pill('All','syllabus','all',state.filterSyllabus)}
                ${pill('NCERT','syllabus','ncert',state.filterSyllabus)}
                ${pill('ICSE','syllabus','icse',state.filterSyllabus)}
                ${pill('NIOS','syllabus','nios',state.filterSyllabus)}
              </div>
            </div>
            <div class="sme-filter-row">
              <span class="sme-frl">Subject</span>
              <div class="sme-pill-group">
                ${pill('All','subject','all',state.filterSubject)}
                ${subjects.map(s=>pill(s.icon+'\u00A0'+s.name,'subject',s.id,state.filterSubject)).join('')}
              </div>
            </div>
            <div class="sme-filter-row">
              <span class="sme-frl">Type</span>
              <div class="sme-pill-group">
                ${pill('All','type','all',state.filterType)}
                ${pill('Mandatory','type','mandatory',state.filterType)}
                ${pill('Optional','type','optional',state.filterType)}
                ${pill('Next Level','type','next-path',state.filterType)}
              </div>
            </div>
            <div class="sme-filter-row">
              <span class="sme-frl">Status</span>
              <div class="sme-pill-group">
                ${pill('All','status','all',state.filterStatus)}
                ${pill('Pending Review','status','pending',state.filterStatus)}
                ${pill('Review Done','status','completed',state.filterStatus)}
              </div>
            </div>
          </div>

          <!-- Learning Methodology -->
          <div class="sme-filter-group">
            <div class="sme-filter-group-hd">
              <span class="sme-fgi">🎓</span><span class="sme-fgt">Learning Methodology</span>
            </div>
            <div class="sme-filter-row">
              <div class="sme-pill-group">
                ${pill('All Methods','methodology','all',state.filterMethodology)}
                ${pill('5E Approach','methodology','5e',state.filterMethodology)}
                ${pill('Socratic Method','methodology','socratic',state.filterMethodology)}
                ${pill('Feynman Technique','methodology','feynman',state.filterMethodology)}
              </div>
            </div>
            ${state.filterMethodology!=='all'
              ?`<div class="sme-filter-desc">💡 ${methodDesc[state.filterMethodology]}</div>`:''}
          </div>

          <!-- Quality Framework -->
          <div class="sme-filter-group">
            <div class="sme-filter-group-hd">
              <span class="sme-fgi">✅</span><span class="sme-fgt">Quality Framework</span>
            </div>
            <div class="sme-filter-row">
              <div class="sme-pill-group">
                ${pill('All','quality','all',state.filterQuality)}
                ${pill('Six Sigma','quality','sixsigma',state.filterQuality)}
                ${pill('TQM','quality','tqm',state.filterQuality)}
                ${pill('LEAN','quality','lean',state.filterQuality)}
                ${pill('Kaizen','quality','kaizen',state.filterQuality)}
              </div>
            </div>
            ${state.filterQuality!=='all'
              ?`<div class="sme-filter-desc">📊 ${qualityDesc[state.filterQuality]}</div>`:''}
          </div>

          <div class="sme-filter-panel-footer">
            <button class="sme-btn sme-btn-outline" onclick="GKSmeApp.clearFilters()">Clear All</button>
            <button class="sme-btn sme-btn-primary" onclick="GKSmeApp.toggleFilters()">
              Done · ${filtered.length} module${filtered.length!==1?'s':''}
            </button>
          </div>
        </div>`:''}

        <!-- Notice strip -->
        <div class="sme-notice-strip">
          <span class="sme-notice-dot"></span>
          Only <strong>approved</strong> content enters the student learning path.
        </div>

        <!-- Scrollable topic list box -->
        <div class="sme-list-wrap" id="sme-list-wrap">
        <button class="sme-scroll-btn sme-scroll-up" id="sme-scroll-up"
                style="display:none" onclick="GKSmeApp.scrollList(-1)"
                title="Scroll up" aria-label="Scroll up">↑</button>
        <div class="sme-topic-list" id="sme-topic-list"
             onscroll="GKSmeApp.onListScroll()">
          ${emptyState}
          ${primaryList.length>0 ? `
          <div class="sme-list-section-hd ${state.reviewMode==='ai'?'sme-lsh-escalated':'sme-lsh-all'}">
            ${state.reviewMode==='ai'
              ? `<span class="sme-lsh-dot sme-lsh-dot-escalated"></span> Escalated for Human Review <span class="sme-lsh-count">${escalatedList.length}</span>`
              : `<span class="sme-lsh-dot"></span> All Modules <span class="sme-lsh-count">${filtered.length}</span>`}
          </div>
          ${primaryRows}` : ''}
          ${aiDivider}
          ${secondaryRows}
        </div>
        <button class="sme-scroll-btn sme-scroll-down" id="sme-scroll-down"
                onclick="GKSmeApp.scrollList(1)"
                title="Scroll down for more modules" aria-label="Scroll down">↓</button>
        </div>

      </div>
    </div>`;
  }

  // ── Module Review (unchanged, full detail screen) ──────────────────
  function renderModuleReview() {
    const topic = findTopic(state.selectedTopicId);
    if (!topic) return '';
    const prog = topicProgress(topic.id, topic.subtopics);
    const sc   = topic.subjectColor;

    function stPrefix(st, idx) {
      if (st.lessonPrefix) return st.lessonPrefix + ' ' + (idx + 1);
      if (st.subtopicType === 'challenge') return 'IMP ' + (idx + 1);
      if (st.subtopicType === 'advanced')  return 'INT ' + (idx + 1);
      return idx === 0 ? 'EXP ' + (idx + 1) : 'EXP & INT ' + (idx + 1);
    }

    function resourceCards(st) {
      if (st.resources?.length) {
        return st.resources.map(r => {
          const ytId  = r.url?.match(/[?&]v=([^&]+)/)?.[1] || '';
          const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : '';
          const meta  = r.duration ? `${r.platform||'Video'} · ${r.duration}` : r.platform||'Resource';
          return `
            <a class="cl-resource-card cl-resource-link" href="${r.url}" target="_blank"
               rel="noopener noreferrer" onclick="event.stopPropagation()">
              <div class="cl-resource-text">
                <div class="cl-resource-name cl-resource-title">${r.title}</div>
                <div class="cl-resource-meta">${meta}</div>
              </div>
              ${thumb?`<div class="cl-resource-thumb-img"><img src="${thumb}" alt="${r.title}" loading="lazy"/></div>`:''}
            </a>`;
        }).join('');
      }
      return (st.concepts||[]).map(c => `
        <div class="cl-resource-card">
          <div class="cl-resource-thumb">${c.visual?.length>5?'🖼️':'📖'}</div>
          <div class="cl-resource-info">
            <div class="cl-resource-name">${c.title}</div>
            <div class="cl-resource-type">${c.visual?.length>5?'Visual Guide':'Reading'}</div>
          </div>
        </div>`).join('');
    }

    function stRow(st, idx) {
      const rev        = getReview(topic.id, st.id);
      const isExpanded = st.id === state.selectedSubtopicId;
      const isFlagging = isExpanded && state.flagging;
      const prefix     = stPrefix(st, idx);
      const iconChar   = st.subtopicType==='challenge'?'⚡':st.subtopicType==='advanced'?'📝':'📋';

      const badge = rev.status==='approved'
        ? '<span class="sme-status-chip sme-chip-approved">✅ Approved</span>'
        : rev.status==='flagged'
          ? '<span class="sme-status-chip sme-chip-flagged">⚑ Flagged</span>'
          : '<span class="sme-status-chip sme-chip-pending">⬤ Pending</span>';

      const assessHtml = (st.assessment||[]).map((q,i) => `
        <div class="sme-assess-q">
          <div class="sme-assess-qtext">Q${i+1}: ${q.question}</div>
          <div class="sme-assess-opts">
            ${q.options.map((o,oi) =>
              `<span class="sme-assess-opt ${oi===q.correct?'sme-opt-correct':''}">${String.fromCharCode(65+oi)}. ${o}</span>`
            ).join('')}
          </div>
          <div class="sme-assess-expl">💡 ${q.explanation}</div>
        </div>`).join('');
      const assessCount = st.assessment?.length || 0;

      let reviewBar = '';
      if (rev.status==='approved') {
        const dt = rev.reviewedAt
          ? new Date(rev.reviewedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '';
        reviewBar = `
          <div class="sme-review-bar sme-review-bar-approved">
            <span>✅ Approved${dt?' · '+dt:''}</span>
            <button class="sme-btn sme-btn-ghost sme-btn-sm"
              onclick="event.stopPropagation();GKSmeApp.resetReview('${topic.id}','${st.id}')">Reset</button>
          </div>`;
      } else if (rev.status==='flagged') {
        reviewBar = `
          <div class="sme-review-bar sme-review-bar-flagged">
            <span>⚑ Flagged${rev.comment?' — "'+rev.comment+'"':''}</span>
            <button class="sme-btn sme-btn-ghost sme-btn-sm"
              onclick="event.stopPropagation();GKSmeApp.resetReview('${topic.id}','${st.id}')">Reset</button>
          </div>`;
      } else if (isFlagging) {
        reviewBar = `
          <div class="sme-review-bar sme-review-bar-flagging">
            <div class="sme-review-label">Add a note (optional):</div>
            <textarea id="sme-flag-comment" class="sme-flag-textarea" rows="2"
              onclick="event.stopPropagation()" placeholder="Describe the issue…"></textarea>
            <div class="sme-flag-actions">
              <button class="sme-btn sme-btn-flag"
                onclick="event.stopPropagation();GKSmeApp.submitFlag()">⚑ Submit Flag</button>
              <button class="sme-btn sme-btn-ghost"
                onclick="event.stopPropagation();GKSmeApp.cancelFlag()">Cancel</button>
            </div>
          </div>`;
      } else {
        reviewBar = `
          <div class="sme-review-bar">
            <span class="sme-review-bar-label">Review this content:</span>
            <div class="sme-review-btns">
              <button class="sme-btn sme-btn-approve"
                onclick="event.stopPropagation();GKSmeApp.approveSubtopic()">✓ Approve</button>
              <button class="sme-btn sme-btn-flag"
                onclick="event.stopPropagation();GKSmeApp.startFlag()">⚑ Flag for Revision</button>
            </div>
          </div>`;
      }

      return `
        <div class="cl-item ${rev.status==='approved'?'cl-done':''} ${isExpanded?'cl-expanded':''}"
             style="--subject-color:${sc}">
          <div class="cl-row" onclick="GKSmeApp.selectSubtopic('${st.id}')">
            <div class="cl-icon-wrap ${st.subtopicType||'core'}">${iconChar}</div>
            <div class="cl-title-area">
              <span class="cl-prefix-tag">${prefix}</span>
              <span class="cl-item-name">${st.name}</span>
              ${rev.status==='approved'?'<span class="cl-done-check">✅</span>':''}
            </div>
            <div class="cl-row-meta">
              ${badge}
              <span class="cl-chevron">${isExpanded?'▲':'▾'}</span>
            </div>
          </div>
          ${isExpanded?`
          <div class="cl-body">
            <div class="cl-body-meta">
              <span class="cl-posted-date">${st.subtopicType||'core'} · ${st.mandatory!==false?'Mandatory':'Optional'}${st.xp?' · '+st.xp+' XP':''}</span>
            </div>
            <p class="cl-description">${st.description||''}</p>
            ${st.resources?.length?`<div class="cl-resources">${resourceCards(st)}</div>`:''}
            ${assessCount?`
            <details class="sme-assess-details">
              <summary>Assessment — ${assessCount} question${assessCount!==1?'s':''}</summary>
              ${assessHtml}
            </details>`:''}
            ${reviewBar}
          </div>`:''}
        </div>`;
    }

    const rows = topic.subtopics.map((st,i) => stRow(st,i)).join('');
    return `
      <div class="sme-layout">
        <header class="sme-header">
          <div class="sme-header-brand">
            <button class="sme-btn sme-btn-ghost" style="color:#C4882A;"
                    onclick="GKSmeApp.backToDashboard()">← ${PAGE_TITLE}</button>
            <span class="sme-header-sep">|</span>
            <img src="img/wizkids-logo.png" alt="Wizkids"
                 style="width:28px;height:auto;border-radius:50%;" />
            <span class="sme-brand-name">${topic.name}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <span class="sme-prog-pill">${prog.approved}/${prog.total} reviewed${prog.flagged?' · '+prog.flagged+' flagged':''}${prog.pending===0?' · ✅ Done':''}</span>
            ${renderHeaderRight()}
          </div>
        </header>
        <div class="sme-main">
          <div class="cl-header" style="--subject-color:${sc}">
            <div class="cl-header-body">
              <span class="cl-header-icon">${topic.icon}</span>
              <div class="cl-header-text">
                <h2 class="cl-course-code">${topic.name}</h2>
                <p class="cl-course-meta">${topic.subtopics.length} subtopic${topic.subtopics.length!==1?'s':''} · ${prog.approved} approved · ${prog.pending} pending</p>
              </div>
            </div>
          </div>
          <div class="cl-list">${rows}</div>
        </div>
      </div>`;
  }

  // ── Public API ─────────────────────────────────────────────────────
  return {
    login, logout,
    openModule, backToDashboard, selectSubtopic, setFilter, setSearch,
    approveSubtopic, startFlag, cancelFlag, submitFlag,
    resetReview, resetAllReviews,
    toggleFilters, clearFilters,
    toggleReviewMode, toggleAiExpanded,
    onListScroll, scrollList,
    mentorOpenModule, mentorBack,
    toggleMentorGuideline, onMentorListScroll, scrollMentorList,
    setMentorFilter, setMentorSearch, toggleMentorFilters, clearMentorFilters,
    sendMentorGuideQuery,
    init() {
      if (isLoggedIn()) {
        const role = sessionStorage.getItem(ROLE_KEY);
        state.screen = role === 'mentor' ? 'mentor-overview' : 'dashboard';
      }
      render();
    }
  };

})();

document.addEventListener('DOMContentLoaded', () => GKSmeApp.init());
