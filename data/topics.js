// ============================================================
// DATA LAYER: topics.js
// Single source of truth for all subjects, topics and subtopics.
// UI and BL layers must NEVER embed topic content directly.
//
// Topic type flags:
//   mandatory            : true  → core, required for all students (🏅 badge)
//   requiresMentorUnlock : true  → unlocked by mentor after student earns it
//   moduleType           : "advanced" | "suggested" | "standard" | "next-path"
//     "standard"  → regular curriculum (mandatory)
//     "advanced"  → deeper dive for fast learners (🚀 badge, optional)
//     "suggested" → recommended enrichment (💡 badge, optional)
//     "next-path" → next grade/level topics; hidden until mentor promotes student
//
// Subtopic type flags:
//   subtopicType : "core" | "advanced" | "challenge"
//     "core"      → must-do for all students
//     "advanced"  → extra depth for fast learners
//     "challenge" → optional stretch exercise
// ============================================================

const GK_TOPICS = {
  subjects: [
    {
      id: "mathematics",
      name: "Mathematics",
      icon: "📐",
      type: "core",
      color: "#3A6FA6",
      topics: [
        {
          id: "fractions",
          name: "Fractions",
          description: "Learn to work with parts of a whole",
          icon: "½",
          xp: 150,
          mandatory: true,
          moduleType: "standard",
          subtopics: [
            // ---- EXP 1 · Introduction to Fractions (core, mandatory) ----
            {
              id: "intro-fractions",
              name: "Introduction to Fractions",
              lessonPrefix: "EXP",
              description: "This chapter is about Fractions.\nPlease watch the video and observe the poster to get an introduction to fractions before the next session.",
              xp: 40,
              subtopicType: "core",
              mandatory: true,
              resources: [
                {
                  title: "Fractions! | Mini Math Movies",
                  url: "https://www.youtube.com/watch?v=362JVVvgYPE",
                  type: "video",
                  platform: "YouTube",
                  duration: "6 minutes"
                },
                {
                  title: "Fraction Class 6 — Visual Poster Guide",
                  url: "https://www.youtube.com/watch?v=M44FkZDoclU",
                  type: "video",
                  platform: "YouTube",
                  duration: "5 minutes"
                }
              ],
              concepts: [
                {
                  title: "What is a Fraction?",
                  body: "A fraction represents a part of a whole. It has two parts: the numerator (top number — how many parts you have) and the denominator (bottom number — how many equal parts the whole is divided into).",
                  visual: "🍕 Pizza cut into 4 equal slices → eat 3 = 3/4\nTop (3) = parts you have | Bottom (4) = total equal parts",
                  examples: ["1/2 = one out of two equal parts", "3/4 = three out of four equal parts", "2/5 = two out of five equal parts"]
                },
                {
                  title: "Proper Fractions",
                  body: "A proper fraction has a numerator smaller than the denominator, so it always represents a value less than 1 whole.",
                  visual: "Example: 1/2 → top (1) < bottom (2) ✓",
                  examples: ["1/2 = one-half", "3/4 = three-quarters", "2/5 = two-fifths"]
                }
              ],
              game: {
                type: "classify",
                title: "Sort the Fractions!",
                instructions: "Click on all PROPER fractions to earn points. Proper = top number is smaller than bottom.",
                items: [
                  { id: 1, value: "1/2", num: 1, den: 2 },
                  { id: 2, value: "3/4", num: 3, den: 4 },
                  { id: 3, value: "5/3", num: 5, den: 3 },
                  { id: 4, value: "2/7", num: 2, den: 7 },
                  { id: 5, value: "7/2", num: 7, den: 2 },
                  { id: 6, value: "4/9", num: 4, den: 9 },
                  { id: 7, value: "11/5", num: 11, den: 5 },
                  { id: 8, value: "3/10", num: 3, den: 10 }
                ]
              },
              aiHints: [
                "A fraction always means part of a whole — think of slicing a roti!",
                "Numerator (top) = how many parts you have. Denominator (bottom) = total parts.",
                "Proper fraction: top is SMALLER than the bottom.",
                "Quick check: Is the value less than 1? YES → it's a proper fraction!"
              ],
              assessment: [
                { id: "if1-q1", type: "true-false", question: "A proper fraction always has a value less than 1.", correct: 0, explanation: "True! In a proper fraction the numerator is smaller than the denominator, so the value is always less than 1." }
              ]
            },
            // ---- EXP & INT 2 · Exploring Fractions (core, mandatory) ----
            {
              id: "exploring-fractions",
              name: "Exploring Fractions",
              lessonPrefix: "EXP & INT",
              description: "OPEN NotebookLM and learn the whole chapter from here. Take your time, go slowly, and understand each concept properly.<br><br>– Beginner's Guide to Basic Fractions – Basic Understanding Poster<br>– The Power of Parts – PPT<br>– The Explainer: Fractions – Video<br>– Fractions: A Hidden Language of Measurement – Audio Support<br>– Mind Map<br>– Quiz",
              xp: 50,
              subtopicType: "core",
              mandatory: true,
              resources: [
                {
                  title: "Exploring Fractions — Class 6",
                  url: "https://www.youtube.com/watch?v=5hG8e9jGeaA",
                  type: "video",
                  platform: "YouTube",
                  duration: "6 minutes"
                }
              ],
              concepts: [
                {
                  title: "Improper Fractions",
                  body: "An improper fraction has a numerator greater than or equal to the denominator — representing a value of 1 or more.",
                  visual: "Example: 5/3 → top (5) > bottom (3) ✓",
                  examples: ["5/3 = more than one whole", "7/4 = one and three-quarters", "9/9 = exactly one"]
                },
                {
                  title: "Converting to Mixed Numbers",
                  body: "Divide numerator by denominator. The quotient is the whole number, and the remainder forms the new fraction.",
                  visual: "7/3 → 7÷3 = 2 remainder 1 → 2 and 1/3",
                  examples: ["5/2 = 2 and 1/2", "7/3 = 2 and 1/3", "11/4 = 2 and 3/4"]
                }
              ],
              game: {
                type: "mcq-game",
                title: "Improper to Mixed Number!",
                instructions: "Convert each improper fraction — choose the correct answer",
                items: [
                  { question: "Convert 7/2", options: ["2 and 1/2", "3 and 1/2", "1 and 1/2", "4 and 1/2"], correct: 0, hint: "7÷2 = 3 remainder 1 → 3 and 1/2" },
                  { question: "Convert 5/3", options: ["1 and 1/3", "1 and 2/3", "2 and 1/3", "2 and 2/3"], correct: 1, hint: "5÷3 = 1 remainder 2 → 1 and 2/3" },
                  { question: "Convert 9/4", options: ["2 and 1/4", "2 and 2/4", "2 and 3/4", "3 and 1/4"], correct: 2, hint: "9÷4 = 2 remainder 1 → 2 and 1/4" }
                ]
              },
              aiHints: [
                "Improper fractions have the top number BIGGER than or EQUAL TO the bottom!",
                "Think of it as having more pizza slices than fit in one pizza!",
                "To convert: divide top by bottom. Quotient + remainder/divisor = mixed number",
                "Quick check: Is top ≥ bottom? YES → Improper!"
              ],
              assessment: [
                { id: "ef2-q1", type: "fill-blank", question: "Convert 7/3 to a mixed number. Write the whole number part:", correct: ["2", "two"], explanation: "7 ÷ 3 = 2 remainder 1, so the whole number part is 2 (answer: 2 and 1/3)" }
              ]
            },
            // ---- EXP 3 · Comparison Fractions (core, mandatory) ----
            {
              id: "comparison-fractions",
              name: "Comparison Fractions",
              lessonPrefix: "EXP",
              description: "Discover how mixed numbers combine a whole and a fraction, and learn to convert between mixed and improper forms. Observe the visual examples and complete the conversion challenge.",
              xp: 50,
              subtopicType: "core",
              mandatory: true,
              resources: [
                {
                  title: "Comparing Fractions — Class 6",
                  url: "https://www.youtube.com/watch?v=shGZKXQGQSE",
                  type: "video",
                  platform: "YouTube",
                  duration: "7 minutes"
                },
                {
                  title: "Fraction Class 6 — Visual Poster Guide",
                  url: "https://www.youtube.com/watch?v=M44FkZDoclU",
                  type: "video",
                  platform: "YouTube",
                  duration: "5 minutes"
                }
              ],
              concepts: [
                {
                  title: "Mixed Numbers",
                  body: "A mixed number combines a whole number with a proper fraction. It's another way to express an improper fraction.",
                  visual: "2 and 3/4 = 2 wholes + 3/4",
                  examples: ["1 and 1/2 cups of milk", "3 and 1/4 hours of study", "2 and 2/3 km to school"]
                },
                {
                  title: "Converting Mixed to Improper",
                  body: "Multiply the whole number by the denominator, then add the numerator. This becomes the new numerator, keeping the same denominator.",
                  visual: "2 and 3/4 → (2×4)+3 / 4 = 11/4",
                  examples: ["1 and 1/2 = 3/2", "3 and 1/4 = 13/4", "2 and 2/3 = 8/3"]
                }
              ],
              game: {
                type: "mcq-game",
                title: "Mixed to Improper!",
                instructions: "Convert each mixed number to an improper fraction",
                items: [
                  { question: "Convert 1 and 1/2", options: ["2/3", "3/2", "4/3", "2/4"], correct: 1, hint: "(1×2)+1 = 3, so 3/2" },
                  { question: "Convert 2 and 3/4", options: ["7/4", "9/4", "11/4", "5/4"], correct: 2, hint: "(2×4)+3 = 11, so 11/4" },
                  { question: "Convert 3 and 1/3", options: ["9/3", "10/3", "11/3", "7/3"], correct: 1, hint: "(3×3)+1 = 10, so 10/3" }
                ]
              },
              aiHints: [
                "Mixed fractions = whole number + proper fraction together!",
                "You see mixed fractions every day: 1 and 1/2 cups, 2 and 3/4 hours!",
                "To convert to improper: (whole × bottom) + top, over the same bottom",
                "Mixed numbers and their improper fractions are EQUAL in value!"
              ],
              assessment: [
                { id: "cf3-q1", type: "ordering", question: "Arrange the steps to convert 2 and 3/4 to an improper fraction:", options: ["Multiply whole number by denominator (2×4=8)", "Add the numerator (8+3=11)", "Write over the same denominator (11/4)"], correct: [0, 1, 2], explanation: "Step 1: Multiply whole × denominator, Step 2: Add numerator, Step 3: Put over same denominator → 11/4" }
              ]
            },
            // ---- INT 4 · Exploring Numerator and Denominator (advanced, optional) ----
            {
              id: "numerator-denominator",
              name: "Exploring Numerator and Denominator",
              lessonPrefix: "INT",
              description: "Dive deeper into the roles of numerator and denominator — master same-denominator and cross-multiplication comparison techniques. Work through the interactive problems to sharpen your skills.",
              xp: 75,
              subtopicType: "advanced",
              mandatory: false,
              resources: [
                {
                  title: "Comparing Fractions — Class 6",
                  url: "https://www.youtube.com/watch?v=shGZKXQGQSE",
                  type: "video",
                  platform: "YouTube",
                  duration: "7 minutes"
                },
                {
                  title: "Fractions! | Mini Math Movies",
                  url: "https://www.youtube.com/watch?v=362JVVvgYPE",
                  type: "video",
                  platform: "YouTube",
                  duration: "6 minutes"
                }
              ],
              concepts: [
                {
                  title: "Comparing with Same Denominator",
                  body: "When denominators are equal, just compare the numerators. The larger numerator means the larger fraction. Simple!",
                  visual: "3/8 vs 5/8 → denominators equal (8) → compare 3 and 5 → 5/8 > 3/8",
                  examples: ["3/7 < 5/7 (same bottom, 3 < 5)", "9/10 > 4/10 (same bottom, 9 > 4)"]
                },
                {
                  title: "Comparing with Different Denominators",
                  body: "Find the Least Common Denominator (LCD), convert both fractions, then compare numerators. Cross-multiplication is a quick shortcut.",
                  visual: "1/3 vs 1/4 → LCD=12 → 4/12 vs 3/12 → 1/3 > 1/4\nShortcut: 1×4=4 and 1×3=3 → 4>3 so 1/3 > 1/4",
                  examples: ["1/2 vs 2/3: 3/6 vs 4/6 → 2/3 > 1/2", "3/4 vs 5/6: 9/12 vs 10/12 → 5/6 > 3/4"]
                }
              ],
              game: {
                type: "mcq-game",
                title: "Greater or Less?",
                instructions: "Choose the correct comparison — which fraction is bigger?",
                items: [
                  { question: "Which is greater: 2/5 or 3/5?", options: ["2/5", "3/5", "They are equal", "Cannot compare"], correct: 1, hint: "Same denominator: compare numerators 2 < 3" },
                  { question: "Which is greater: 1/2 or 1/3?", options: ["1/3", "1/2", "They are equal", "Cannot compare"], correct: 1, hint: "LCD=6: 3/6 vs 2/6 → 1/2 is bigger" },
                  { question: "Which is greater: 3/4 or 5/8?", options: ["5/8", "3/4", "They are equal", "Cannot compare"], correct: 1, hint: "LCD=8: 6/8 vs 5/8 → 3/4 is bigger" }
                ]
              },
              aiHints: [
                "Same denominators? Just compare the numerators — quick and easy!",
                "Different denominators? Find LCD first, then convert and compare.",
                "Cross-multiplication shortcut: a/b vs c/d → compare a×d with b×c",
                "A fraction close to 1 is always bigger than a fraction close to 0!"
              ],
              assessment: [
                { id: "nd4-q1", question: "Which fraction is greater: 4/9 or 7/9?", options: ["4/9", "7/9", "Equal", "Cannot determine"], correct: 1, explanation: "Same denominator 9: 7 > 4, so 7/9 > 4/9" },
                { id: "nd4-q2", question: "Diya ate 3/5 of a pizza and Riya ate 2/3. Who ate more?", options: ["Diya (3/5)", "Riya (2/3)", "Equal", "Cannot determine"], correct: 1, explanation: "LCD=15: 9/15 vs 10/15 → Riya ate more (2/3 > 3/5)" }
              ]
            },
            // ---- IMP 5 · Fraction Challenge (challenge, optional) ----
            {
              id: "fraction-challenge",
              name: "Fraction Challenge",
              lessonPrefix: "IMP",
              description: "Put your full knowledge of fractions to the test! This challenge brings together proper fractions, improper fractions, mixed numbers, and comparisons in one comprehensive activity.",
              xp: 80,
              subtopicType: "challenge",
              mandatory: false,
              resources: [
                {
                  title: "Fractions! | Mini Math Movies",
                  url: "https://www.youtube.com/watch?v=362JVVvgYPE",
                  type: "video",
                  platform: "YouTube",
                  duration: "6 minutes"
                },
                {
                  title: "Comparing Fractions — Class 6",
                  url: "https://www.youtube.com/watch?v=shGZKXQGQSE",
                  type: "video",
                  platform: "YouTube",
                  duration: "7 minutes"
                }
              ],
              concepts: [
                {
                  title: "Challenge Overview: Fraction Mastery",
                  body: "A great mathematician once said: 'A fraction is more than just numbers — it's a relationship between part and whole.' This challenge tests whether you truly understand that relationship across all fraction types.",
                  visual: "🏆 Proper → Improper → Mixed → Compare → MASTER!",
                  examples: ["Proper: top < bottom", "Improper: top ≥ bottom", "Mixed: whole + fraction", "Compare: use LCD or cross-multiply"]
                }
              ],
              game: {
                type: "mcq-game",
                title: "Fraction Master Challenge!",
                instructions: "Mix of all fraction types — show what you know!",
                items: [
                  { question: "Identify the improper fraction:", options: ["3/7", "5/9", "11/4", "1/2"], correct: 2, hint: "Improper: numerator ≥ denominator" },
                  { question: "Convert 9/4 to a mixed number:", options: ["1 and 3/4", "2 and 1/4", "2 and 3/4", "3 and 1/4"], correct: 1, hint: "9÷4 = 2 remainder 1 → 2 and 1/4" },
                  { question: "Which is greater: 3/4 or 2/3?", options: ["3/4", "2/3", "Equal", "Cannot tell"], correct: 0, hint: "LCD=12: 9/12 vs 8/12 → 3/4 is bigger" }
                ]
              },
              aiHints: [
                "Review all three types: proper, improper, and mixed before starting!",
                "For comparisons: find the LCD or use cross-multiplication.",
                "Converting improper to mixed: divide, use quotient as whole, remainder over divisor.",
                "You've got this! Mistakes are just lessons in disguise. 🌟"
              ],
              assessment: [
                { id: "fc5-q1", question: "Which list contains ONLY proper fractions?", options: ["1/2, 3/4, 5/6", "1/2, 5/3, 7/8", "3/2, 4/3, 5/4", "1/1, 2/2, 3/3"], correct: 0, explanation: "1/2, 3/4, 5/6 are all proper: 1<2, 3<4, 5<6 ✓" },
                { id: "fc5-q2", question: "Arjun has 13 quarter-pieces of chocolate. As an improper fraction:", options: ["4/13", "13/4", "3 and 1/4", "Both 13/4 and 3 and 1/4 are correct"], correct: 3, explanation: "13/4 is the improper fraction, and 3 and 1/4 is the equivalent mixed number. Both are correct!" },
                { id: "fc5-q3", question: "A proper fraction is always:", options: ["Greater than 1", "Equal to 1", "Less than 1", "Greater than 2"], correct: 2, explanation: "Since the top is less than the bottom, a proper fraction is always less than 1" }
              ]
            },
            // ---- EXP 6 · Infographics (core, optional enrichment) ----
            {
              id: "fraction-infographics",
              name: "Infographics",
              lessonPrefix: "EXP",
              description: "Explore fractions through visual infographics and real-world poster examples. Observe the fraction number line and everyday contexts — then test your visual fraction reading skills.",
              xp: 45,
              subtopicType: "core",
              mandatory: false,
              resources: [
                {
                  title: "Fraction Class 6 — Visual Poster Guide",
                  url: "https://www.youtube.com/watch?v=M44FkZDoclU",
                  type: "video",
                  platform: "YouTube",
                  duration: "5 minutes"
                },
                {
                  title: "Fractions! | Mini Math Movies",
                  url: "https://www.youtube.com/watch?v=362JVVvgYPE",
                  type: "video",
                  platform: "YouTube",
                  duration: "6 minutes"
                }
              ],
              concepts: [
                {
                  title: "Fraction Infographic: The Big Picture",
                  body: "A visual map of all fraction types: proper fractions live between 0 and 1 on the number line; improper fractions start at 1 and go beyond; mixed numbers show the same values in a friendlier way.",
                  visual: "0 —— 1/4 — 1/2 — 3/4 —— 1 —— 5/4 — 3/2 —— 2\n      ← Proper fractions →    ← Improper fractions →",
                  examples: ["Proper: 0 to 1 on number line", "Improper: 1 and beyond", "Mixed: 1 and 1/4, 1 and 1/2..."]
                },
                {
                  title: "Real-World Fractions Around You",
                  body: "Fractions are everywhere! A clock uses fractions of an hour, recipes use fractions of cups, and sports use fractions of a pitch or court.",
                  visual: "🕐 15 min = 1/4 hour  |  🍳 3/4 cup flour  |  ⚽ 2/3 of the pitch",
                  examples: ["Pizza slices: 3/8 of a pizza", "Time: 1/4 of an hour = 15 minutes", "Money: 1/2 of ₹100 = ₹50"]
                }
              ],
              game: {
                type: "fill-blank",
                title: "Complete the Fraction Facts!",
                instructions: "Fill in the blanks with the correct words or numbers",
                sentences: [
                  { text: "A fraction where the numerator is smaller than the denominator is called a ____ fraction.", answer: "proper" },
                  { text: "On a number line, proper fractions lie between 0 and ____.", answer: "1" },
                  { text: "15 minutes is ____ of an hour.", answer: "1/4" },
                  { text: "In a fraction, the bottom number is called the ____.", answer: "denominator" },
                  { text: "3/4 as a decimal is ____.", answer: "0.75" }
                ]
              },
              aiHints: [
                "Use the number line — it makes fractions visual and easy to compare!",
                "If a fraction is greater than 1/2, the top is more than half the bottom.",
                "Real-world contexts make fractions memorable — think of your daily meals!",
                "A picture is worth a thousand words — especially in maths! 🖼️"
              ],
              assessment: [
                { id: "ig6-q1", question: "On a number line, where does 3/4 sit?", options: ["Between 0 and 1/2", "Between 1/2 and 1", "Between 1 and 2", "At exactly 1"], correct: 1, explanation: "3/4 = 0.75, which is between 0.5 (1/2) and 1 on the number line" },
                { id: "ig6-q2", question: "15 minutes is what fraction of an hour?", options: ["1/2", "1/3", "1/4", "1/6"], correct: 2, explanation: "60 minutes in an hour. 15/60 = 1/4. So 15 minutes = 1/4 of an hour." },
                { id: "ig6-q3", question: "Which fraction is greater than 1/2?", options: ["1/4", "3/8", "2/5", "3/4"], correct: 3, explanation: "3/4 = 0.75, which is greater than 0.5. All others are less than 1/2." }
              ]
            },
            // ---- IMP 7 · Worksheets (challenge, optional practice) ----
            {
              id: "fraction-worksheets",
              name: "Worksheets",
              lessonPrefix: "IMP",
              description: "Reinforce everything you have learned with this structured practice worksheet. Work through the mixed problem set independently — this is your chance to show full mastery of fractions!",
              xp: 60,
              subtopicType: "challenge",
              mandatory: false,
              resources: [
                {
                  title: "Comparing Fractions — Class 6",
                  url: "https://www.youtube.com/watch?v=shGZKXQGQSE",
                  type: "video",
                  platform: "YouTube",
                  duration: "7 minutes"
                },
                {
                  title: "Fraction Class 6 — Visual Poster Guide",
                  url: "https://www.youtube.com/watch?v=M44FkZDoclU",
                  type: "video",
                  platform: "YouTube",
                  duration: "5 minutes"
                }
              ],
              concepts: [
                {
                  title: "Worksheet Guide: How to Approach Each Problem",
                  body: "Before starting: (1) Identify the fraction type — proper, improper, or mixed. (2) Choose the correct method — classify, convert, or compare. (3) Show your working step-by-step for full marks.",
                  visual: "Step 1: Read carefully 📖\nStep 2: Identify type 🏷️\nStep 3: Apply method 🔧\nStep 4: Check answer ✅",
                  examples: ["Classify: Is top < bottom? → Proper", "Convert: top ÷ bottom → mixed number", "Compare: find LCD → convert → compare tops"]
                }
              ],
              game: {
                type: "para-writing",
                title: "Fraction Reflection",
                instructions: "Write a short paragraph explaining fractions in your own words. Use examples from real life!",
                prompt: "Explain what fractions are, how they are used in daily life, and describe the difference between proper fractions, improper fractions, and mixed numbers. Give at least 2 real-world examples.",
                hints: ["Think about pizza slices", "Cooking recipes use fractions", "Time uses fractions of an hour"],
                minWords: 30,
                sampleAnswer: "A fraction represents a part of a whole. For example, if I eat 3 slices of a pizza cut into 8 pieces, I ate 3/8 of the pizza. Proper fractions like 3/8 are less than 1, while improper fractions like 5/3 are greater than or equal to 1. Mixed numbers like 1 and 2/3 combine a whole number with a fraction. In daily life, we use fractions when cooking (1/2 cup of milk) and telling time (quarter past 3)."
              },
              aiHints: [
                "Worksheets are where real understanding is built — take your time!",
                "Stuck? Go back and review the concept guide for that subtopic.",
                "Check each answer: does it make sense? Could you explain it to someone else?",
                "Completing this worksheet means you've truly mastered fractions! 🎓"
              ],
              assessment: [
                { id: "ws7-q1", question: "Convert 13/5 to a mixed number:", options: ["2 and 2/5", "2 and 3/5", "3 and 1/5", "2 and 1/5"], correct: 1, explanation: "13 ÷ 5 = 2 remainder 3, so 13/5 = 2 and 3/5" },
                { id: "ws7-q2", question: "Arrange in ascending order: 2/3, 1/2, 3/4", options: ["1/2, 2/3, 3/4", "2/3, 1/2, 3/4", "3/4, 2/3, 1/2", "1/2, 3/4, 2/3"], correct: 0, explanation: "LCD=12: 6/12, 8/12, 9/12 → ascending order: 1/2 < 2/3 < 3/4" }
              ]
            }
          ]
        },
        {
          id: "data-handling",
          name: "Data Handling",
          description: "Organize and interpret data with graphs",
          icon: "📊",
          xp: 150,
          mandatory: true,
          moduleType: "standard",
          subtopics: [
            {
              id: "tally-marks",
              name: "Introduction to Data Recording",
              description: "This lesson introduces tally marks as a fast and organised way to record live data. Please study the examples and complete the counting activity before the next session.",
              subtopicType: "core",
              mandatory: true,
              xp: 50,
              concepts: [
                {
                  title: "What are Tally Marks?",
                  body: "Tally marks are a quick way to record counts. Four vertical lines are drawn, then the fifth is a diagonal crossing them, making a bundle of 5.",
                  visual: "| = 1,  || = 2,  ||| = 3,  |||| = 4,  ⌺|||| = 5",
                  examples: ["Counting votes: ⌺|||| ||| = 8", "Tracking goals: ⌺|||| ⌺|||| = 10"]
                },
                {
                  title: "Making a Tally Table",
                  body: "Organize tally marks in a table with columns for the item, tally marks, and total count. This makes data easy to compare.",
                  visual: "Fruit | Tally | Count\nApple | ⌺|||| | 5\nMango | ||| | 3",
                  examples: ["Class surveys", "Sports scores", "Weather records"]
                }
              ],
              game: {
                type: "classify",
                title: "Count the Tallies!",
                instructions: "Select the correct count for each tally group",
                items: [
                  { id: 1, value: "⌺|||| ⌺|||| |||", correctCount: 13 },
                  { id: 2, value: "⌺|||| ⌺|||| |", correctCount: 11 },
                  { id: 3, value: "⌺|||| ||", correctCount: 7 },
                  { id: 4, value: "⌺|||| ⌺|||| ⌺|||| ⌺||||", correctCount: 20 }
                ]
              },
              aiHints: [
                "Group tallies in fives - it's much easier to count!",
                "The 5th mark is always diagonal, crossing the four vertical marks",
                "Tallies are perfect for live counting - like scoring a game!",
                "Count by 5s for the bundles, then add the leftovers"
              ],
              assessment: [
                { id: "tm-q1", question: "What does a 'bundle' of 5 tally marks look like?", options: ["Five vertical lines", "Four vertical lines with one diagonal crossing", "Five horizontal lines", "A star shape"], correct: 1, explanation: "Four vertical lines | | | | with one diagonal crossing them = 5" },
                { id: "tm-q5", question: "Class votes: Red=⌺|||| |||, Blue=⌺|||| ⌺||||, Green=⌺||||. Which color won?", options: ["Red (8 votes)", "Blue (10 votes)", "Green (5 votes)", "It's a tie"], correct: 1, explanation: "Red=8, Blue=10, Green=5. Blue has the most votes!" }
              ]
            },
            {
              id: "pictographs",
              name: "Exploring Pictographs",
              description: "Use pictures and symbols to represent data quantities. Observe the canteen pictograph and answer questions about it — discover how visual graphs make comparisons immediate and intuitive.",
              subtopicType: "core",
              mandatory: true,
              xp: 50,
              concepts: [
                {
                  title: "What is a Pictograph?",
                  body: "A pictograph uses pictures or symbols to represent data. Each symbol represents a specific quantity shown in the key/legend.",
                  visual: "🍎 = 5 apples   →   🍎🍎🍎 = 15 apples",
                  examples: ["Each ⭐ = 2 students", "Each 🚗 = 10 cars", "Each 📚 = 5 books"]
                },
                {
                  title: "Reading a Pictograph",
                  body: "To read a pictograph: find the key to know what each symbol means, count the symbols for each category, multiply to get the actual count.",
                  visual: "Key: 🙂 = 4 students\nRow 1: 🙂🙂🙂 = 12 students",
                  examples: ["Count symbols × key value = total", "Half symbol = half the key value"]
                }
              ],
              game: {
                type: "graph-read",
                title: "Read the Pictograph!",
                instructions: "Answer questions about this pictograph",
                data: {
                  title: "Fruits Sold at School Canteen",
                  keyLabel: "Each 🍎 = 4 fruits",
                  keyValue: 4,
                  rows: [
                    { label: "Apples", symbols: 4, emoji: "🍎" },
                    { label: "Bananas", symbols: 3, emoji: "🍌" },
                    { label: "Mangoes", symbols: 5, emoji: "🥭" },
                    { label: "Oranges", symbols: 2, emoji: "🍊" }
                  ]
                },
                questions: [
                  { q: "How many mangoes were sold?", answer: 20, options: [12, 16, 20, 24] },
                  { q: "Which fruit sold the least?", answerText: "Oranges", options: ["Apples", "Bananas", "Mangoes", "Oranges"], correctIdx: 3 },
                  { q: "Total fruits sold?", answer: 56, options: [48, 52, 56, 60] }
                ]
              },
              aiHints: [
                "Always check the KEY first - it tells you what each picture means!",
                "Half a symbol usually means half the key value",
                "Add up all symbols × key value for the total",
                "Pictographs make it easy to see which category is biggest at a glance!"
              ],
              assessment: [
                { id: "pg-q1", question: "In a pictograph, what is the 'key' for?", options: ["To unlock the answer", "To show what each symbol represents", "To count the pictures", "To name the pictograph"], correct: 1, explanation: "The key tells you the value each symbol represents (e.g., 🌟 = 5 students)" },
                { id: "pg-q2", question: "If 🚗 = 3 cars, then 🚗🚗🚗🚗 = ?", options: ["4 cars", "7 cars", "12 cars", "9 cars"], correct: 2, explanation: "4 symbols × 3 cars each = 12 cars" },
                { id: "pg-q3", question: "Books: 📚📚📚 and Comics: 📚📚. If each 📚 = 5, how many more books than comics?", options: ["1", "5", "10", "15"], correct: 1, explanation: "Books = 3×5 = 15, Comics = 2×5 = 10. Difference = 15-10 = 5" },
                { id: "pg-q4", question: "Which is an advantage of pictographs?", options: ["They are very precise", "They are easy to read and visually appealing", "They work for all types of data", "They don't need a key"], correct: 1, explanation: "Pictographs are visually appealing and easy to read quickly" },
                { id: "pg-q5", question: "Half a symbol 🌟 where 🌟 = 10, represents:", options: ["5", "10", "15", "20"], correct: 0, explanation: "Half a symbol = half the key value = 10/2 = 5" }
              ]
            },
            {
              id: "bar-graphs",
              name: "Reading and Building Bar Graphs",
              description: "Compare categories side-by-side using rectangular bars. Study the sports survey bar graph, read the Y-axis scale carefully, and answer the analysis questions.",
              subtopicType: "core",
              mandatory: true,
              xp: 50,
              concepts: [
                {
                  title: "What is a Bar Graph?",
                  body: "A bar graph uses rectangular bars to show and compare data. The height of each bar represents the value for that category.",
                  visual: "↑ Values\n|  ████  ██  ████\n|__________________→ Categories",
                  examples: ["Comparing test scores", "Monthly rainfall", "Students in each class"]
                },
                {
                  title: "Parts of a Bar Graph",
                  body: "A bar graph has: Title (what it shows), X-axis (categories), Y-axis (values/scale), and Bars (data representation).",
                  visual: "Title → 'Students' Favourite Sports'\nX-axis → Cricket, Football, Tennis\nY-axis → 0, 5, 10, 15, 20",
                  examples: ["Scale: evenly spaced numbers", "Bars can be vertical or horizontal", "Each bar has a label"]
                }
              ],
              game: {
                type: "graph-read",
                title: "Analyze the Bar Graph!",
                instructions: "Use the bar graph data to answer questions",
                data: {
                  title: "Students' Favourite Sports",
                  keyLabel: "Number of Students",
                  keyValue: 1,
                  rows: [
                    { label: "Cricket", symbols: 20, emoji: "🏏" },
                    { label: "Football", symbols: 15, emoji: "⚽" },
                    { label: "Tennis", symbols: 8, emoji: "🎾" },
                    { label: "Badminton", symbols: 12, emoji: "🏸" },
                    { label: "Swimming", symbols: 10, emoji: "🏊" }
                  ]
                },
                questions: [
                  { q: "Which sport is most popular?", answerText: "Cricket", options: ["Cricket", "Football", "Tennis", "Badminton"], correctIdx: 0 },
                  { q: "How many students prefer Tennis?", answer: 8, options: [6, 8, 10, 12] },
                  { q: "Total students surveyed?", answer: 65, options: [55, 60, 65, 70] }
                ]
              },
              aiHints: [
                "Look at the Y-axis scale carefully before reading bar heights!",
                "The tallest bar = the most popular/largest value",
                "To find total: add all bar values together",
                "Bar graphs are great for comparing different categories side by side"
              ],
              assessment: [
                { id: "bg-q1", question: "What does the Y-axis in a bar graph represent?", options: ["The categories being compared", "The values or measurements", "The title of the graph", "The colors of the bars"], correct: 1, explanation: "The Y-axis (vertical) shows the values/scale. The X-axis shows the categories." },
                { id: "bg-q2", question: "A bar graph shows: Cats=8, Dogs=12, Birds=5. Which is most popular?", options: ["Cats", "Dogs", "Birds", "They're all equal"], correct: 1, explanation: "Dogs have the highest bar value (12), so Dogs are the most popular!" },
                { id: "bg-q3", question: "What is the main purpose of a bar graph?", options: ["To show changes over time", "To show parts of a whole", "To compare different categories", "To record live data"], correct: 2, explanation: "Bar graphs are best for comparing different categories or groups" },
                { id: "bg-q4", question: "Why does a bar graph need a title?", options: ["It makes the graph bigger", "It tells the reader what the data is about", "It shows the scale", "It's optional and decorative"], correct: 1, explanation: "The title tells the reader what information the bar graph is representing" },
                { id: "bg-q5", question: "If the Y-axis scale goes 0, 5, 10, 15, what is a bar halfway between 10 and 15?", options: ["10", "12", "12.5", "13"], correct: 2, explanation: "Halfway between 10 and 15 = (10+15)/2 = 12.5" }
              ]
            },
            // ---- CHALLENGE subtopic (optional stretch) ----
            {
              id: "line-graphs",
              name: "Data Trends with Line Graphs",
              description: "Discover how connected data points reveal trends over time — rising, falling, or flat. Apply your skills to the weekly temperature dataset and interpret what the line is telling you.",
              xp: 60,
              subtopicType: "challenge",
              mandatory: false,
              concepts: [
                {
                  title: "What is a Line Graph?",
                  body: "A line graph shows how values change over time. Points are plotted on a grid and connected with lines, making trends easy to see at a glance.",
                  visual: "Temperature over a week:\n📅 Mon→25°C, Tue→28°C, Wed→22°C, Thu→30°C, Fri→27°C",
                  examples: ["Plant growth over 4 weeks", "Monthly rainfall data", "Cricket scores over overs"]
                },
                {
                  title: "Reading a Line Graph",
                  body: "The X-axis shows time or categories; the Y-axis shows values. A line going UP shows increase; going DOWN shows decrease; flat line means no change.",
                  visual: "📈 Rising line = increase\n📉 Falling line = decrease\n➡️ Flat line = no change",
                  examples: ["Steeper slope = faster change", "Multiple lines = comparing two things", "Always check the scale on both axes!"]
                }
              ],
              game: {
                type: "mcq-game",
                title: "Read the Line Graph!",
                instructions: "Answer questions about a weekly temperature line graph",
                items: [
                  { question: "If temp rises Mon(20)→Tue(25)→Wed(30), the trend is:", options: ["Decreasing", "Stable", "Increasing", "Random"], correct: 2, hint: "Each day the temperature goes up — that's an increasing trend" },
                  { question: "A flat line on a line graph means:", options: ["Data is missing", "Values are increasing", "Values are decreasing", "Values are not changing"], correct: 3, hint: "Flat = no change = the value stays the same across the time period" },
                  { question: "Line graphs are best for showing:", options: ["A single measurement", "Changes over time", "Parts of a whole", "Categories at one point"], correct: 1, hint: "The x-axis is usually time — so line graphs show change over time!" }
                ]
              },
              aiHints: [
                "Line graphs are great for seeing TRENDS — is something going up, down, or staying flat?",
                "Always look at the scale on both axes before drawing conclusions!",
                "A steeper slope means a FASTER rate of change",
                "Multiple lines on one graph let you compare two things at the same time!"
              ],
              assessment: [
                { id: "lg-q1", question: "What does the X-axis in a line graph typically represent?", options: ["Values or measurements", "Categories", "Time or sequence", "Colors"], correct: 2, explanation: "X-axis usually shows time (days, months, years) in a line graph" },
                { id: "lg-q2", question: "A steep downward line in a line graph shows:", options: ["Slow increase", "Rapid decrease", "No change", "Random data"], correct: 1, explanation: "A steep line going downward = the value is falling rapidly" },
                { id: "lg-q3", question: "Which type of data suits a line graph best?", options: ["Favourite colours of students", "Scores of 5 students on one test", "Monthly temperature over a year", "Amounts spent on fruits"], correct: 2, explanation: "Monthly data over time = perfect for a line graph showing the trend" },
                { id: "lg-q4", question: "If a line graph has two lines, what does that help you do?", options: ["Show one dataset more clearly", "Compare two datasets over the same time", "Show fractions", "Display tally counts"], correct: 1, explanation: "Two lines on one graph allows easy comparison of two datasets over the same period" },
                { id: "lg-q5", question: "Plant A grew 2cm per week. After 4 weeks the line graph would look:", options: ["A curved line", "A flat horizontal line", "A straight diagonal line going up", "A zigzag line"], correct: 2, explanation: "Constant growth per week = equal increases = a straight upward diagonal line" }
              ]
            }
          ]
        },
        // ---- ADVANCED / SUGGESTED topic (optional, mentor unlocked) ----
        {
          id: "fractions-advanced",
          name: "Fractions — Advanced",
          description: "Add, subtract and multiply fractions like a pro",
          icon: "➕",
          xp: 200,
          mandatory: false,
          moduleType: "suggested",
          subtopics: [
            {
              id: "adding-fractions",
              name: "Adding Fractions — Step by Step",
              description: "Master fraction addition for same and different denominators using the LCD method. Work through the concept guides, then challenge yourself with the addition activity.",
              xp: 65,
              subtopicType: "advanced",
              mandatory: false,
              concepts: [
                {
                  title: "Adding Fractions — Same Denominator",
                  body: "When fractions share the same denominator, just add the numerators and keep the denominator the same. Simple!",
                  visual: "1/5 + 2/5 = (1+2)/5 = 3/5",
                  examples: ["2/7 + 3/7 = 5/7", "1/9 + 5/9 = 6/9 = 2/3 (simplified)", "4/11 + 6/11 = 10/11"]
                },
                {
                  title: "Adding Fractions — Different Denominators",
                  body: "Find the Least Common Denominator (LCD), convert both fractions to that denominator, then add the numerators.",
                  visual: "1/3 + 1/4 → LCD=12 → 4/12 + 3/12 = 7/12",
                  examples: ["1/2 + 1/3 = 3/6 + 2/6 = 5/6", "2/5 + 1/4 = 8/20 + 5/20 = 13/20"]
                }
              ],
              game: {
                type: "mcq-game",
                title: "Fraction Addition Challenge!",
                instructions: "Choose the correct sum for each fraction addition",
                items: [
                  { question: "1/6 + 2/6 = ?", options: ["3/6", "3/12", "2/6", "1/3"], correct: 0, hint: "Same denominator: 1+2=3, keep /6 → 3/6 = 1/2" },
                  { question: "1/4 + 1/2 = ?", options: ["2/6", "3/4", "2/4", "1/4"], correct: 1, hint: "LCD=4: 1/4 + 2/4 = 3/4" },
                  { question: "1/3 + 1/6 = ?", options: ["2/9", "1/2", "2/6", "3/6"], correct: 1, hint: "LCD=6: 2/6 + 1/6 = 3/6 = 1/2" }
                ]
              },
              aiHints: [
                "Same denominators? Just add the tops — the bottom stays the same!",
                "Different denominators? Find the LCD first, then convert.",
                "Always simplify your answer if possible!",
                "LCD = the smallest number both denominators divide into evenly."
              ],
              assessment: [
                { id: "af-q1", question: "3/8 + 2/8 = ?", options: ["5/16", "5/8", "1/8", "6/8"], correct: 1, explanation: "Same denominator: (3+2)/8 = 5/8" },
                { id: "af-q2", question: "1/2 + 1/4 = ?", options: ["2/6", "2/4", "3/4", "1/3"], correct: 2, explanation: "LCD=4: 2/4 + 1/4 = 3/4" },
                { id: "af-q3", question: "1/3 + 1/4 = ?", options: ["2/7", "7/12", "4/12", "5/12"], correct: 1, explanation: "LCD=12: 4/12 + 3/12 = 7/12" },
                { id: "af-q4", question: "Priya drank 1/3 of a bottle. Diya drank 1/6. Together they drank:", options: ["2/9", "1/2", "2/6", "1/3"], correct: 1, explanation: "1/3 + 1/6 = 2/6 + 1/6 = 3/6 = 1/2 of the bottle" },
                { id: "af-q5", question: "What is the LCD of 1/4 + 1/6?", options: ["24", "10", "12", "8"], correct: 2, explanation: "The smallest number divisible by both 4 and 6 is 12" }
              ]
            },
            {
              id: "subtracting-fractions",
              name: "Subtracting Fractions — In Practice",
              description: "Apply the LCD technique to subtract fractions with same and different denominators. Solve the real-world fraction problems to reinforce your understanding.",
              xp: 65,
              subtopicType: "advanced",
              mandatory: false,
              concepts: [
                {
                  title: "Subtracting Same Denominator Fractions",
                  body: "Subtract the numerators, keep the denominator the same. Then simplify if possible.",
                  visual: "5/8 - 2/8 = (5-2)/8 = 3/8",
                  examples: ["7/9 - 2/9 = 5/9", "6/7 - 1/7 = 5/7", "3/4 - 1/4 = 2/4 = 1/2"]
                },
                {
                  title: "Subtracting Different Denominator Fractions",
                  body: "Same process as addition: find LCD, convert, then subtract numerators.",
                  visual: "3/4 - 1/3 → LCD=12 → 9/12 - 4/12 = 5/12",
                  examples: ["1/2 - 1/3 = 3/6 - 2/6 = 1/6", "3/4 - 1/8 = 6/8 - 1/8 = 5/8"]
                }
              ],
              game: {
                type: "mcq-game",
                title: "Fraction Subtraction!",
                instructions: "Find the correct difference",
                items: [
                  { question: "5/7 - 2/7 = ?", options: ["3/7", "3/14", "7/7", "2/7"], correct: 0, hint: "Same denominator: 5-2=3, keep /7 → 3/7" },
                  { question: "3/4 - 1/2 = ?", options: ["2/2", "1/4", "1/2", "2/4"], correct: 1, hint: "LCD=4: 3/4 - 2/4 = 1/4" },
                  { question: "2/3 - 1/4 = ?", options: ["1/12", "5/12", "3/7", "8/12"], correct: 1, hint: "LCD=12: 8/12 - 3/12 = 5/12" }
                ]
              },
              aiHints: [
                "Subtracting fractions? Same rules as adding — just subtract the tops!",
                "Always convert to LCD before subtracting different denominators.",
                "Check: the answer should be smaller than the first fraction!",
                "Simplify your answer — 2/4 = 1/2, always reduce!"
              ],
              assessment: [
                { id: "sf-q1", question: "7/10 - 3/10 = ?", options: ["4/20", "10/10", "4/10", "3/10"], correct: 2, explanation: "Same denominator: (7-3)/10 = 4/10 = 2/5 simplified" },
                { id: "sf-q2", question: "3/4 - 1/4 = ?", options: ["2/8", "4/4", "1/2", "2/4"], correct: 2, explanation: "3/4 - 1/4 = 2/4 = 1/2 (simplified)" },
                { id: "sf-q3", question: "1/2 - 1/3 = ?", options: ["0", "1/6", "2/5", "1/5"], correct: 1, explanation: "LCD=6: 3/6 - 2/6 = 1/6" },
                { id: "sf-q4", question: "Arjun had 5/6 of a cake. He ate 1/3. How much is left?", options: ["4/3", "1/2", "2/6", "4/6"], correct: 1, explanation: "5/6 - 1/3 = 5/6 - 2/6 = 3/6 = 1/2" },
                { id: "sf-q5", question: "3/5 - 2/10 = ?", options: ["1/5", "4/10", "2/5", "5/10"], correct: 1, explanation: "LCD=10: 6/10 - 2/10 = 4/10 = 2/5 simplified" }
              ]
            }
          ]
        },
        {
          id: "real-numbers",
          name: "Real Numbers",
          description: "Explore integers, rational and irrational numbers on the number line",
          icon: "∞",
          xp: 200,
          mandatory: false,
          moduleType: "next-path",
          requiresMentorUnlock: true,
          subtopics: [
            {
              id: "integers",
              name: "Introduction to Integers",
              description: "Explore positive, negative, and zero on the number line. This lesson uses real-life contexts like temperature and floor levels to make integers feel natural and familiar.",
              xp: 60,
              subtopicType: "core",
              mandatory: true,
              concepts: [
                {
                  title: "What are Integers?",
                  body: "Integers are whole numbers that include positives, negatives, and zero. They extend infinitely in both directions on the number line: ...-3, -2, -1, 0, 1, 2, 3...",
                  visual: "Number line: ←  -3  -2  -1  0  1  2  3  →",
                  examples: ["Temperature: -5°C (5 below zero)", "Floor levels: -2 = basement, 0 = ground, +3 = 3rd floor", "Sea level: -200m = 200m below sea"]
                },
                {
                  title: "Adding and Subtracting Integers",
                  body: "Same signs → add and keep the sign. Different signs → subtract smaller from larger and keep the sign of the bigger number.",
                  visual: "(-3) + (-4) = -7   |   (-5) + 3 = -2",
                  examples: ["5 + (-3) = 2", "(-4) + (-6) = -10", "(-7) + 10 = 3"]
                }
              ],
              game: {
                type: "mcq-game",
                title: "Integer Challenge!",
                instructions: "Choose the correct answer about integers",
                items: [
                  { question: "What is (-5) + 8?", options: ["-3", "3", "13", "-13"], correct: 1, hint: "Different signs: subtract 5 from 8, keep + sign" },
                  { question: "Which is the smallest integer: -3, -7, 0, 2?", options: ["-3", "2", "0", "-7"], correct: 3, hint: "On the number line, farther left = smaller" },
                  { question: "What is (-6) - (-4)?", options: ["-10", "-2", "2", "10"], correct: 1, hint: "Subtracting a negative is the same as adding" }
                ]
              },
              aiHints: [
                "Think of integers like a lift: negative floors are below ground!",
                "A number line is your best friend — draw one when confused.",
                "Subtracting a negative is the same as adding a positive."
              ],
              assessment: [
                { id: "int-q1", question: "What is (-4) + (-6)?", options: ["2", "-2", "-10", "10"], correct: 2, explanation: "Same signs: add the values (4+6=10) and keep the negative sign" },
                { id: "int-q2", question: "Which number is to the right of -3 on a number line?", options: ["-5", "-4", "-3", "-2"], correct: 3, explanation: "-2 is greater than -3, so it lies to the right" },
                { id: "int-q3", question: "What is 5 - (-3)?", options: ["2", "8", "-8", "-2"], correct: 1, explanation: "Subtracting a negative is adding: 5 + 3 = 8" },
                { id: "int-q4", question: "Which set contains only integers?", options: ["{1.5, 2, 3}", "{-2, 0, 4}", "{1/2, 3/4}", "{0.1, 0.2}"], correct: 1, explanation: "Integers are whole numbers (no fractions/decimals): -2, 0, and 4 are all integers" },
                { id: "int-q5", question: "The temperature dropped from 3°C to -4°C. How many degrees did it drop?", options: ["1", "7", "-7", "4"], correct: 1, explanation: "3 - (-4) = 3 + 4 = 7 degrees drop" }
              ]
            },
            {
              id: "rational-numbers",
              name: "Exploring Rational Numbers",
              description: "Discover the family of numbers that can be expressed as fractions — including integers, terminating decimals, and repeating decimals. Observe where they sit on the number line.",
              xp: 70,
              subtopicType: "core",
              mandatory: true,
              concepts: [
                {
                  title: "What is a Rational Number?",
                  body: "A rational number is any number that can be written as a fraction p/q, where p and q are integers and q ≠ 0. This includes all fractions, integers, and terminating or repeating decimals.",
                  visual: "Examples: 1/2, -3/4, 5 (=5/1), 0.75 (=3/4), 0.333... (=1/3)",
                  examples: ["All fractions: 2/3, -5/7", "All integers: -3 = -3/1", "Terminating decimals: 0.5 = 1/2"]
                },
                {
                  title: "Rational Numbers on the Number Line",
                  body: "Rational numbers fill up the spaces between integers on the number line. Between any two integers there are infinitely many rational numbers.",
                  visual: "0 ——— 1/4 ——— 1/2 ——— 3/4 ——— 1",
                  examples: ["1/4 lies between 0 and 1/2", "-1/2 lies between -1 and 0", "2/3 ≈ 0.667"]
                }
              ],
              game: {
                type: "mcq-game",
                title: "Rational Numbers Quiz!",
                instructions: "Identify and work with rational numbers",
                items: [
                  { question: "Which of these is a rational number?", options: ["π", "√2", "3/4", "√3"], correct: 2, hint: "Can it be written as p/q? 3/4 already is!" },
                  { question: "Is 0.333... a rational number?", options: ["No, it never ends", "Yes, it equals 1/3", "Only if it stops", "Depends on context"], correct: 1, hint: "Repeating decimals are rational — they equal a fraction" },
                  { question: "Which is larger: -2/3 or -3/4?", options: ["-2/3", "-3/4", "They are equal", "Cannot compare"], correct: 0, hint: "Convert to decimals: -0.667 vs -0.75. Which is closer to 0?" }
                ]
              },
              aiHints: [
                "If you can write it as a fraction, it's rational!",
                "Integers are rational numbers too — just write them over 1.",
                "Negative fractions: -3/4 is greater than -1 (closer to 0)."
              ],
              assessment: [
                { id: "rn-q1", question: "Which is NOT a rational number?", options: ["4/5", "0.25", "√7", "-3"], correct: 2, explanation: "√7 cannot be expressed as p/q — it is irrational" },
                { id: "rn-q2", question: "Express 0.6 as a fraction", options: ["1/6", "6/10", "3/5", "Both B and C"], correct: 3, explanation: "0.6 = 6/10 = 3/5 after simplification. Both B and C are correct!" },
                { id: "rn-q3", question: "Between which two integers does -7/4 lie?", options: ["Between 1 and 2", "Between -1 and 0", "Between -2 and -1", "Between -3 and -2"], correct: 2, explanation: "-7/4 = -1.75, which lies between -2 and -1" },
                { id: "rn-q4", question: "Is every integer a rational number?", options: ["No", "Yes", "Only positive integers", "Only if divisible by 2"], correct: 1, explanation: "Every integer n can be written as n/1, making it a rational number" },
                { id: "rn-q5", question: "Which is greater: -1/2 or -3/5?", options: ["-1/2", "-3/5", "They are equal", "Cannot determine"], correct: 0, explanation: "-1/2 = -0.5 and -3/5 = -0.6. Since -0.5 > -0.6, -1/2 is greater" }
              ]
            },
            {
              id: "irrational-numbers",
              name: "Beyond Fractions — Irrational Numbers",
              description: "Meet π, √2, and other numbers whose decimals never end or repeat. Explore why they cannot be written as fractions and where they appear in real mathematics.",
              xp: 70,
              subtopicType: "advanced",
              mandatory: false,
              concepts: [
                {
                  title: "What is an Irrational Number?",
                  body: "An irrational number cannot be written as p/q. Its decimal expansion goes on forever without repeating. Famous examples: π (pi) ≈ 3.14159... and √2 ≈ 1.41421...",
                  visual: "π = 3.14159265358979323846...\n√2 = 1.41421356237...",
                  examples: ["π (pi) — ratio of circle's circumference to diameter", "√2 — diagonal of a 1×1 square", "e (Euler's number) ≈ 2.71828..."]
                }
              ],
              game: {
                type: "mcq-game",
                title: "Irrational or Rational?",
                instructions: "Classify each number correctly",
                items: [
                  { question: "Is √4 irrational?", options: ["Yes", "No, it equals 2", "Cannot tell", "Only sometimes"], correct: 1, hint: "√4 = 2 exactly, so it IS rational!" },
                  { question: "Which is irrational?", options: ["0.5", "2/3", "√5", "4/7"], correct: 2, hint: "√5 ≈ 2.2360679... never repeats" }
                ]
              },
              aiHints: [
                "If the square root gives a whole number, it's rational (√9=3).",
                "π is everywhere in circles — but its digits go on forever!",
                "Irrational + rational = always irrational."
              ],
              assessment: [
                { id: "irn-q1", question: "Which number is irrational?", options: ["√9", "√16", "√25", "√3"], correct: 3, explanation: "√3 ≈ 1.732... never terminates or repeats, making it irrational" },
                { id: "irn-q2", question: "What is π approximately equal to?", options: ["22/7 exactly", "3.14 exactly", "3.14159... (non-terminating)", "3"], correct: 2, explanation: "π is approximately 3.14159265... — 22/7 is just a close approximation, not exact" },
                { id: "irn-q3", question: "The decimal 0.101001000100001... is:", options: ["Rational", "Irrational", "An integer", "A fraction"], correct: 1, explanation: "It never repeats in a regular pattern, making it irrational" }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "wellness",
      name: "Para-Vidya",
      icon: "🧘",
      type: "para-vidya",
      color: "#4A7C59",
      topics: [
        {
          id: "yoga",
          name: "Yoga",
          description: "Reconnect your mind and body through movement",
          icon: "🧘",
          xp: 100,
          mandatory: true,
          moduleType: "standard",
          subtopics: [
            {
              id: "sun-salutation",
              name: "Introduction to Surya Namaskar",
              description: "Begin your yoga journey with this energising 12-pose morning sequence. Observe the pose order, learn the breath pattern, and complete the sequencing activity before your next session.",
              xp: 35,
              subtopicType: "core",
              mandatory: true,
              concepts: [
                {
                  title: "What is Surya Namaskar?",
                  body: "Surya Namaskar (Sun Salutation) is a sequence of 12 yoga poses performed in a flowing motion. It energizes the body, stretches all major muscles, and calms the mind.",
                  visual: "🌅 Start → 🙏 Prayer → 🙆 Reach Up → 🤸 Forward Bend → 🐕 Downward Dog → 🙏 End",
                  examples: ["Start the day with 3-5 rounds", "One round = 12 poses", "Takes about 2-3 minutes"]
                },
                {
                  title: "Breathing Pattern",
                  body: "Each pose connects to your breath. Inhale when opening/extending your body, exhale when folding/closing. This rhythm energizes and calms simultaneously.",
                  visual: "Inhale ↑ = Opening poses (arms up, lunges)\nExhale ↓ = Folding poses (forward bend, child's pose)",
                  examples: ["Breathe in on extending poses", "Breathe out on folding poses", "Move slowly and mindfully"]
                }
              ],
              game: {
                type: "sequence-order",
                title: "Order the Poses!",
                instructions: "Click the poses in the correct order of Surya Namaskar",
                items: [
                  { id: 1, pose: "Forward Bend 🤸", correct: 3 },
                  { id: 2, pose: "Prayer Pose 🙏", correct: 1 },
                  { id: 3, pose: "Raised Arms 🙌", correct: 2 },
                  { id: 4, pose: "Low Lunge 🏃", correct: 4 },
                  { id: 5, pose: "Downward Dog 🐕", correct: 5 }
                ]
              },
              aiHints: [
                "Breathe deeply! Each pose connects to your breath.",
                "Start slow - even 3 rounds in the morning makes a difference!",
                "Surya Namaskar works every muscle group in your body",
                "Feeling tired? Just 5 minutes can boost your energy!"
              ],
              assessment: [
                { id: "ss-q1", question: "How many poses are in one round of Surya Namaskar?", options: ["8", "10", "12", "14"], correct: 2, explanation: "One complete round of Surya Namaskar consists of 12 poses" },
                { id: "ss-q2", question: "What is the first pose in Surya Namaskar?", options: ["Forward Bend", "Lunge", "Prayer Pose (Pranamasana)", "Cobra Pose"], correct: 2, explanation: "Pranamasana (Prayer Pose) - standing with hands joined at heart center - is the starting pose" },
                { id: "ss-q3", question: "When should you breathe IN during Surya Namaskar?", options: ["When folding forward", "When extending/stretching poses", "Only at the beginning", "During all poses equally"], correct: 1, explanation: "Inhale when opening and extending (reaching up, arching back), exhale when folding forward" },
                { id: "ss-q4", question: "What does 'Surya' mean in Sanskrit?", options: ["Moon", "Star", "Sun", "Earth"], correct: 2, explanation: "Surya means Sun, and Namaskar means Salutation/Greeting" },
                { id: "ss-q5", question: "What is the main benefit of regular Surya Namaskar practice?", options: ["Only improves flexibility", "Only builds strength", "Energizes body, improves flexibility, strength, and calms the mind", "Only useful as a warmup"], correct: 2, explanation: "Surya Namaskar is a complete practice that builds strength, flexibility, and mental clarity" }
              ]
            },
            {
              id: "tree-pose",
              name: "Finding Your Balance — Vrikshasana",
              description: "Practice standing steady on one leg while training the Drishti (gaze focus) technique. The concentration you build here transfers directly to better focus during study sessions.",
              xp: 35,
              subtopicType: "core",
              mandatory: true,
              concepts: [
                {
                  title: "What is Vrikshasana?",
                  body: "Vrikshasana (Tree Pose) is a balancing pose where you stand on one leg with the other foot on the inner thigh or calf. It improves balance, focus, and leg strength.",
                  visual: "🌳 Stand tall, rooted like a tree!\n🦵 One leg balancing, one foot on inner thigh\n🙌 Arms raised overhead like branches",
                  examples: ["Hold for 30 seconds each side", "Practice near a wall if needed", "Focus your gaze on a fixed point"]
                },
                {
                  title: "The Drishti (Gaze Point)",
                  body: "The secret to balancing is your Drishti — a fixed gazing point. Pick a point on the wall at eye level and focus softly on it. A still mind creates a still body.",
                  visual: "👁️ Find your Drishti → 💭 Still mind = 🏋️ Still body",
                  examples: ["Choose a non-moving point", "Soft focus, not staring", "Deep breathing helps too!"]
                }
              ],
              game: {
                type: "mcq-game",
                title: "Tree Pose Knowledge Check!",
                instructions: "Test your understanding of Vrikshasana",
                items: [
                  { question: "Where should the raised foot be placed?", options: ["On the knee", "On the inner thigh or calf (not knee)", "On the ankle", "Floating in air"], correct: 1, hint: "NEVER on the knee - always above or below it" },
                  { question: "What is a Drishti?", options: ["A type of pose", "A breathing technique", "A fixed gazing point for balance", "A mudra (hand gesture)"], correct: 2, hint: "Drishti = gazing point that steadies your balance" },
                  { question: "Which direction should your raised knee point?", options: ["Forward", "To the side (outward)", "Downward", "It doesn't matter"], correct: 1, hint: "The knee opens outward, like a tree branch" }
                ]
              },
              aiHints: [
                "Wobbling is normal! Even trees sway in the wind 🌳",
                "Find your Drishti (gaze point) - it's the secret to balancing!",
                "Never place your foot directly on the knee joint to protect it",
                "Tree pose builds the concentration you need for studying!"
              ],
              assessment: [
                { id: "trp-q1", question: "What does 'Vriksha' mean in Sanskrit?", options: ["Mountain", "River", "Tree", "Wind"], correct: 2, explanation: "Vriksha means Tree in Sanskrit, so Vrikshasana = Tree Pose" },
                { id: "trp-q2", question: "Where should you NEVER place your foot in Tree Pose?", options: ["Inner thigh", "Calf", "Directly on the knee", "Near the ankle"], correct: 2, explanation: "Never place your foot on the knee joint as it puts harmful pressure on the knee" },
                { id: "trp-q3", question: "What is the main benefit of Tree Pose?", options: ["Building upper body strength", "Improving balance and concentration", "Stretching the back", "Warming up for running"], correct: 1, explanation: "Tree Pose is primarily a balancing pose that also builds mental focus and concentration" },
                { id: "trp-q4", question: "What should you look at during Tree Pose?", options: ["Your raised foot", "The ceiling", "A fixed Drishti (gazing point)", "Your hands"], correct: 2, explanation: "Focusing on a fixed Drishti point helps maintain balance by steadying the mind" },
                { id: "trp-q5", question: "How does Tree Pose help with studies?", options: ["It doesn't help at all", "It makes you physically strong only", "It trains focus and concentration that transfers to learning", "Only useful for athletes"], correct: 2, explanation: "The mental focus trained in balancing poses translates to better concentration during learning" }
              ]
            }
          ]
        },

        // ── Meditation topic ──────────────────────────────────────────────
        {
          id: "meditation",
          name: "Meditation",
          description: "Calm the mind, sharpen focus, and build inner stillness",
          icon: "🌿",
          xp: 90,
          mandatory: true,
          moduleType: "standard",
          subtopics: [
            {
              id: "breath-awareness",
              name: "Breath Awareness",
              subtopicType: "core",
              mandatory: true,
              lessonPrefix: "EXP",
              concept: "The breath is always with us. Watching it — without changing it — is the simplest form of meditation and the foundation of all mindfulness practice.",
              examples: [
                { label: "4-4-4 Box Breathing", value: "Breathe in for 4 counts · Hold for 4 · Breathe out for 4 · Hold for 4. Repeat." },
                { label: "Nadi Shodhana", value: "Alternate-nostril breathing that balances the two hemispheres of the brain." }
              ],
              game: {
                type: "breathing",
                title: "Box Breathing Practice",
                instructions: "Follow the circle — breathe in, hold, breathe out, hold. Complete 4 rounds.",
                phases: ["Breathe In", "Hold", "Breathe Out", "Hold"],
                counts: [4, 4, 4, 4]
              },
              aiHints: [
                "Just 5 minutes of mindful breathing lowers cortisol (stress hormone) measurably.",
                "Your breath is the only body function that is both automatic and voluntary — the perfect bridge to the mind.",
                "Ancient Indian texts call controlled breath 'Pranayama' — prana means life-force."
              ],
              assessment: [
                { id: "ba-q1", question: "What happens to the body when you breathe slowly and deeply?", options: ["Heart rate increases", "You feel more anxious", "Heart rate slows and the body calms", "Blood pressure rises"], correct: 2, explanation: "Deep, slow breathing activates the parasympathetic nervous system — the body's 'rest and digest' mode — reducing stress." },
                { id: "ba-q2", question: "In Box Breathing, each of the 4 phases lasts:", options: ["2 counts", "3 counts", "4 counts", "8 counts"], correct: 2, explanation: "Box Breathing uses equal counts of 4 for each phase: inhale, hold, exhale, hold — forming a perfect 'box'." },
                { id: "ba-q3", question: "What is 'Pranayama'?", options: ["A type of yoga pose", "Controlled breathing practice", "A meditation mantra", "A relaxation stretch"], correct: 1, explanation: "Pranayama is the ancient practice of breath control — 'prana' means life-force and 'ayama' means expansion." }
              ]
            },
            {
              id: "body-scan",
              name: "Body Scan & Relaxation",
              subtopicType: "core",
              mandatory: true,
              lessonPrefix: "EXP",
              concept: "A body scan moves attention slowly from head to toe, releasing tension held in each part of the body. It is one of the most effective tools for deep relaxation.",
              examples: [
                { label: "Progressive Muscle Relaxation", value: "Tense each muscle group for 5 seconds, then release. Notice the contrast between tension and relaxation." },
                { label: "Yoga Nidra", value: "A guided body-scan practice that brings the body to the edge of sleep while keeping the mind awake." }
              ],
              aiHints: [
                "Yoga Nidra ('yogic sleep') is said to give the equivalent rest of 4 hours of sleep in 45 minutes.",
                "Most of us carry tension in the jaw, shoulders, and hands without noticing it.",
                "Body scans are used by athletes, surgeons, and astronauts to manage pre-performance nerves."
              ],
              assessment: [
                { id: "bs-q1", question: "What is the purpose of a body scan meditation?", options: ["To fall asleep quickly", "To notice and release physical tension in the body", "To build muscle strength", "To improve posture"], correct: 1, explanation: "A body scan cultivates awareness of physical sensations and helps release accumulated tension." },
                { id: "bs-q2", question: "What is Yoga Nidra?", options: ["A standing yoga pose", "A type of pranayama breathing", "A guided body-scan relaxation practice", "A chanting meditation"], correct: 2, explanation: "Yoga Nidra ('yogic sleep') is a guided relaxation that progressively relaxes the entire body while keeping the mind aware." },
                { id: "bs-q3", question: "Where do people most commonly hold unnoticed tension?", options: ["Feet and toes", "Jaw, shoulders, and hands", "Stomach only", "Knees and elbows"], correct: 1, explanation: "The jaw, shoulders, and hands are the most common areas where people unconsciously store stress and tension." }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "science",
      name: "Science",
      icon: "🔬",
      type: "core",
      color: "#2E7D32",
      topics: [
        {
          id: "gravity",
          name: "Gravity",
          description: "Discover the force that keeps us grounded and governs the universe",
          icon: "🍎",
          xp: 180,
          mandatory: true,
          moduleType: "standard",
          subtopics: [
            {
              id: "what-is-gravity",
              name: "Introduction to Gravity",
              description: "Explore the invisible force that keeps us grounded — from Newton's falling apple to orbiting moons. Study the visual examples and complete the concept quiz before the next session.",
              xp: 55,
              subtopicType: "core",
              mandatory: true,
              concepts: [
                {
                  title: "The Force That Keeps Us Grounded",
                  body: "Gravity is a natural force of attraction between objects that have mass. Every object with mass pulls every other object toward it. The more mass an object has, the stronger its gravitational pull.",
                  visual: "🍎 Apple falls → Earth pulls it down\n🌍 Earth pulls → Moon stays in orbit\n☀️ Sun pulls → Planets orbit around it",
                  examples: ["You fall down, not up — Earth's gravity pulls you", "The Moon stays in orbit because Earth's gravity holds it", "Tides are caused by the Moon's gravity pulling on Earth's oceans"]
                },
                {
                  title: "Newton's Apple — The Legend",
                  body: "The story goes that Isaac Newton saw an apple fall from a tree and wondered: why does it fall DOWN and not sideways or up? This led him to formulate the Law of Universal Gravitation in 1687.",
                  visual: "🍎 → 💡 → 📐 Newton's Law of Universal Gravitation",
                  examples: ["F = G × (m₁ × m₂) / r²", "G = 6.674 × 10⁻¹¹ N·m²/kg²", "The force gets weaker as distance (r) increases"]
                }
              ],
              game: {
                type: "mcq-game",
                title: "Gravity Basics!",
                instructions: "Test your understanding of what gravity is",
                items: [
                  { question: "What causes gravity?", options: ["Speed of rotation", "Mass of objects", "Temperature", "Colour of objects"], correct: 1, hint: "More mass = more gravitational pull" },
                  { question: "Who formulated the Law of Universal Gravitation?", options: ["Einstein", "Galileo", "Newton", "Faraday"], correct: 2, hint: "Think of the falling apple story..." },
                  { question: "Why does the Moon orbit Earth?", options: ["Moon is magnetic", "Earth's gravity holds it", "Moon repels the Sun", "Space has no gravity"], correct: 1, hint: "Gravity keeps the Moon from flying off into space" }
                ]
              },
              aiHints: [
                "Gravity acts between ALL objects — even you and your pencil!",
                "The heavier the object and the closer you are, the stronger gravity pulls.",
                "Without gravity, the Moon would fly off in a straight line!"
              ],
              assessment: [
                {
                  id: "grav-q1", type: "match", question: "Match each scientist with their contribution to gravity:",
                  pairs: [{ left: "Isaac Newton" }, { left: "Galileo Galilei" }, { left: "Albert Einstein" }],
                  rightOptions: ["Law of Universal Gravitation", "Leaning Tower experiment", "General Theory of Relativity"],
                  correct: ["Law of Universal Gravitation", "Leaning Tower experiment", "General Theory of Relativity"],
                  explanation: "Newton discovered the Law of Gravitation, Galileo showed objects fall at the same rate, Einstein refined gravity with General Relativity."
                }
              ]
            },
            {
              id: "gravity-on-earth",
              name: "Gravity in Action — Earth",
              description: "Discover why a feather and a hammer fall at the same speed in a vacuum, and learn the difference between mass (what you are made of) and weight (how hard gravity pulls you).",
              xp: 65,
              subtopicType: "core",
              mandatory: true,
              concepts: [
                {
                  title: "Acceleration Due to Gravity (g)",
                  body: "On Earth, all objects fall at the same rate regardless of their mass (ignoring air resistance). This acceleration is approximately 9.8 m/s² and is called 'g'. Galileo proved this by dropping two balls of different weights from the Leaning Tower of Pisa.",
                  visual: "🪶 Feather + 🔨 Hammer → both fall at same rate in vacuum\ng = 9.8 m/s²",
                  examples: ["A 1 kg ball and a 10 kg ball hit the ground at the same time", "On Moon: g ≈ 1.6 m/s² (1/6 of Earth)", "On Jupiter: g ≈ 24.8 m/s² (2.5× Earth)"]
                },
                {
                  title: "Weight vs Mass",
                  body: "Mass is the amount of matter in an object (measured in kg) — it stays the same everywhere. Weight is the gravitational force on an object (measured in Newtons) — it changes based on gravity. Weight = Mass × g",
                  visual: "Mass: 60 kg (same on Earth and Moon)\nWeight on Earth: 60 × 9.8 = 588 N\nWeight on Moon: 60 × 1.6 = 96 N",
                  examples: ["An astronaut: 70 kg mass → 686 N weight on Earth", "Same astronaut on Moon: 70 kg mass → 112 N weight", "In deep space (no gravity): 70 kg mass → 0 N weight"]
                }
              ],
              game: {
                type: "mcq-game",
                title: "Gravity on Earth!",
                instructions: "Answer questions about how gravity works on Earth",
                items: [
                  { question: "What is the value of 'g' on Earth's surface?", options: ["9.8 m/s", "9.8 m/s²", "98 m/s²", "0.98 m/s²"], correct: 1, hint: "g is an acceleration — it includes m/s²" },
                  { question: "A 5 kg book and a 50 kg rock are dropped simultaneously. Which hits first?", options: ["The rock", "The book", "Both hit at the same time", "Depends on shape"], correct: 2, hint: "Galileo proved all objects fall at the same rate (ignoring air)!" },
                  { question: "Your weight on the Moon would be:", options: ["Same as on Earth", "Zero", "About 1/6 of your Earth weight", "Double your Earth weight"], correct: 2, hint: "Moon's gravity is about 1/6 of Earth's" }
                ]
              },
              aiHints: [
                "Weight and mass are different! Mass is kg, weight is Newtons (force).",
                "g = 9.8 m/s² is one of the most important constants in physics.",
                "In a vacuum, a feather and a hammer really do fall at the same speed!"
              ],
              assessment: [
                { id: "goe-q1", question: "What is the SI unit of weight?", options: ["Kilogram (kg)", "Newton (N)", "Joule (J)", "Pascal (Pa)"], correct: 1, explanation: "Weight is a force, and force is measured in Newtons (N)" },
                { id: "goe-q2", question: "A person has a mass of 50 kg. Their weight on Earth (g=9.8) is:", options: ["50 N", "9.8 N", "490 N", "500 N"], correct: 2, explanation: "Weight = mass × g = 50 × 9.8 = 490 N" },
                { id: "goe-q3", question: "If you travel to the Moon, your mass:", options: ["Decreases to 1/6", "Stays the same", "Increases 6 times", "Becomes zero"], correct: 1, explanation: "Mass measures the amount of matter and never changes. Only weight changes with gravity" },
                { id: "goe-q4", question: "Galileo's famous experiment showed that:", options: ["Heavier objects fall faster", "Lighter objects fall faster", "All objects fall at the same rate in absence of air", "Only round objects fall equally"], correct: 2, explanation: "Galileo proved that without air resistance, all objects fall at the same rate regardless of mass" },
                { id: "goe-q5", question: "What does 'free fall' mean?", options: ["Falling from a tree", "Falling with only gravity acting on it", "Very slow falling", "Falling in water"], correct: 1, explanation: "Free fall is when the only force acting on an object is gravity (no air resistance)" }
              ]
            },
            {
              id: "gravity-in-space",
              name: "Gravity Beyond Earth",
              description: "Explore how orbits are really just continuous free fall, why astronauts float in the ISS, and how gravity keeps every planet in its path around the Sun.",
              xp: 60,
              subtopicType: "advanced",
              mandatory: false,
              concepts: [
                {
                  title: "Orbits — Falling Forever!",
                  body: "An orbit is actually continuous free fall! When a satellite orbits Earth, it is always falling toward Earth due to gravity, but it moves forward so fast that Earth's surface curves away beneath it. It keeps falling and missing!",
                  visual: "→ Throw ball slow: falls to ground\n→ Throw ball fast: curves with Earth\n→ Throw ball at 8 km/s: orbits!",
                  examples: ["ISS (Space Station) orbits at ~7.7 km/s", "Moon orbits Earth at ~1 km/s", "Earth orbits Sun at ~30 km/s"]
                }
              ],
              game: {
                type: "mcq-game",
                title: "Space Gravity!",
                instructions: "How does gravity work in space?",
                items: [
                  { question: "Astronauts float in space stations because:", options: ["There is no gravity there", "They are in constant free fall around Earth", "Space has anti-gravity", "They wear special suits"], correct: 1, hint: "The station and astronauts are both falling at the same rate!" },
                  { question: "What keeps satellites in orbit?", options: ["Rocket engines always running", "Gravity + sideways velocity", "Anti-gravity shields", "Magnetic fields"], correct: 1, hint: "Gravity pulls down, velocity pushes forward — they balance!" }
                ]
              },
              aiHints: [
                "Astronauts aren't weightless — they're in constant free fall!",
                "An orbit is just falling sideways fast enough to miss the ground.",
                "The Moon has been 'falling' toward Earth for 4.5 billion years!"
              ],
              assessment: [
                { id: "gis-q1", type: "multiple-correct", question: "Select ALL statements that are true about gravity in space:", options: ["There is no gravity in space", "Astronauts on the ISS are in constant free fall", "The Moon has about 1/6 of Earth's gravity", "Satellites orbit due to gravity + sideways velocity"], correct: [1, 2, 3], explanation: "Gravity exists everywhere in space! Astronauts float because they're in free fall, the Moon has 1/6 gravity, and satellites orbit due to gravity + velocity balance." }
              ]
            }
          ]
        }
      ]
    },

    // ============================================================
    // SUBJECT: Social Studies
    // ============================================================
    {
      id: "social",
      name: "Social Studies",
      icon: "🌍",
      type: "core",
      color: "#7B5EA7",
      topics: [
        {
          id: "ancient-civilizations",
          name: "Ancient Civilizations",
          description: "Journey through the great civilizations of the ancient world",
          icon: "🏛️",
          xp: 120,
          mandatory: true,
          moduleType: "standard",
          subtopics: [
            {
              id: "mesopotamia",
              name: "Mesopotamia: Cradle of Civilization",
              subtopicType: "core",
              mandatory: true,
              lessonPrefix: "EXP",
              concept: "Mesopotamia, between the Tigris and Euphrates rivers, gave us writing, cities, and law codes.",
              examples: [
                { label: "Cuneiform Writing", value: "The world's first writing system — pressed into clay tablets." },
                { label: "Hammurabi's Code", value: "One of the earliest written law codes, listing 282 rules." }
              ],
              aiHints: [
                "Mesopotamia means 'land between two rivers' in Greek.",
                "The Sumerians invented the wheel around 3500 BCE.",
                "Hammurabi's Code introduced the idea of written law for everyone."
              ],
              assessment: [
                { id: "mes-q1", question: "What does 'Mesopotamia' mean?", options: ["Land of deserts", "Land between two rivers", "Land of the pharaohs", "Land of mountains"], correct: 1, explanation: "Mesopotamia is a Greek word meaning 'land between two rivers' — the Tigris and Euphrates." },
                { id: "mes-q2", question: "What was cuneiform?", options: ["A type of coin", "A farming tool", "An early writing system", "A musical instrument"], correct: 2, explanation: "Cuneiform was one of the world's earliest writing systems, pressed into clay tablets using a reed stylus." },
                { id: "mes-q3", question: "Who created one of the earliest written law codes?", options: ["Cleopatra", "Hammurabi", "Julius Caesar", "Ashoka"], correct: 1, explanation: "King Hammurabi of Babylon created Hammurabi's Code around 1754 BCE — 282 laws carved in stone." }
              ]
            },
            {
              id: "ancient-egypt",
              name: "Ancient Egypt",
              subtopicType: "core",
              mandatory: true,
              lessonPrefix: "EXP",
              concept: "Ancient Egypt flourished along the Nile for over 3,000 years, producing pyramids, pharaohs, and hieroglyphics.",
              examples: [
                { label: "The Great Pyramid of Giza", value: "Built around 2560 BCE, it was the world's tallest man-made structure for 3,800 years." },
                { label: "Hieroglyphics", value: "Egyptian writing using pictures and symbols, deciphered using the Rosetta Stone." }
              ],
              aiHints: [
                "Egypt's civilization lasted longer than any other in history — over 3,000 years.",
                "The Nile floods every year, depositing rich soil perfect for farming.",
                "Pharaohs were considered gods on Earth by ancient Egyptians."
              ],
              assessment: [
                { id: "egy-q1", question: "What river was central to ancient Egyptian civilization?", options: ["Amazon", "Tigris", "Nile", "Yangtze"], correct: 2, explanation: "The Nile River provided water, fertile soil from annual floods, and a transportation route for ancient Egypt." },
                { id: "egy-q2", question: "What were Egyptian rulers called?", options: ["Emperors", "Pharaohs", "Sultans", "Kings"], correct: 1, explanation: "Egyptian rulers were called Pharaohs and were considered both gods and kings." },
                { id: "egy-q3", question: "What was the Rosetta Stone used for?", options: ["As a calendar", "To decode hieroglyphics", "To map the Nile", "As a religious altar"], correct: 1, explanation: "The Rosetta Stone had the same text in three scripts, which allowed scholars to decode Egyptian hieroglyphics." }
              ]
            },
            {
              id: "ancient-india",
              name: "The Indus Valley Civilization",
              subtopicType: "core",
              mandatory: true,
              lessonPrefix: "EXP",
              concept: "The Indus Valley Civilization was one of the world's earliest urban societies, known for planned cities and advanced drainage systems.",
              examples: [
                { label: "Mohenjo-daro", value: "A planned city with streets in a grid pattern and an advanced sewage system." },
                { label: "Harappa", value: "Another major city, giving the civilization its alternate name: Harappan Civilization." }
              ],
              aiHints: [
                "Indus Valley cities had better sanitation than most European cities 3,000 years later.",
                "Their script has not yet been fully deciphered by modern scholars.",
                "The civilization covered an area larger than Egypt or Mesopotamia."
              ],
              assessment: [
                { id: "ivs-q1", question: "Where was the Indus Valley Civilization located?", options: ["Egypt", "China", "Modern-day Pakistan and northwest India", "Greece"], correct: 2, explanation: "The Indus Valley Civilization was centered in what is now Pakistan and northwest India, along the Indus River." },
                { id: "ivs-q2", question: "What was remarkable about Indus Valley cities?", options: ["Huge armies", "Planned grid streets and advanced drainage", "Massive stone pyramids", "Desert farming"], correct: 1, explanation: "Indus Valley cities like Mohenjo-daro had planned grid streets and one of the world's earliest urban drainage systems." },
                { id: "ivs-q3", question: "What mystery remains about the Indus Valley script?", options: ["It was never found", "It has no symbols", "It has not been fully deciphered", "It was written in Latin"], correct: 2, explanation: "Despite thousands of inscriptions, the Indus Valley script has not yet been fully deciphered by modern scholars." }
              ]
            }
          ]
        },
        {
          id: "maps-and-geography",
          name: "Maps and Geography",
          description: "Read maps, understand continents, and explore the physical world",
          icon: "🗺️",
          xp: 100,
          mandatory: false,
          moduleType: "suggested",
          subtopics: [
            {
              id: "continents-and-oceans",
              name: "Continents and Oceans",
              subtopicType: "core",
              mandatory: true,
              lessonPrefix: "EXP",
              concept: "Earth has 7 continents and 5 oceans. Each continent has unique geography, climate, and cultures.",
              examples: [
                { label: "7 Continents", value: "Asia, Africa, North America, South America, Antarctica, Europe, Australia." },
                { label: "5 Oceans", value: "Pacific, Atlantic, Indian, Arctic, Southern." }
              ],
              aiHints: [
                "Asia is the largest continent — it holds 60% of the world's population.",
                "The Pacific Ocean is larger than all the land on Earth combined.",
                "Antarctica has no permanent human residents but has a treaty protecting it."
              ],
              assessment: [
                { id: "cno-q1", question: "How many continents does Earth have?", options: ["5", "6", "7", "8"], correct: 2, explanation: "Earth has 7 continents: Asia, Africa, North America, South America, Antarctica, Europe, and Australia." },
                { id: "cno-q2", question: "Which is the largest ocean?", options: ["Atlantic", "Indian", "Pacific", "Arctic"], correct: 2, explanation: "The Pacific Ocean is the largest, covering more area than all of Earth's land combined." },
                { id: "cno-q3", question: "Which continent has no permanent human population?", options: ["Arctic", "Antarctica", "Australia", "Greenland"], correct: 1, explanation: "Antarctica has no permanent human residents — only rotating research station scientists." }
              ]
            }
          ]
        }
      ]
    },

    // ============================================================
    // SUBJECT: Social Science
    // ============================================================
    {
      id: "social-science",
      name: "Social Science",
      icon: "🏛️",
      type: "core",
      color: "#B5651D",
      topics: [
        {
          id: "civics",
          name: "Civics: Democracy & Government",
          description: "Understand how government, democracy, and citizenship work in India",
          icon: "🗳️",
          xp: 120,
          mandatory: true,
          moduleType: "standard",
          subtopics: [
            {
              id: "what-is-government",
              name: "What is Government?",
              subtopicType: "core",
              mandatory: true,
              lessonPrefix: "EXP",
              concept: "Government is the system of institutions and rules that manage a country, provide services, and protect its people.",
              examples: [
                { label: "Local Government", value: "Panchayat Raj — village-level democracy that gives communities self-governance." },
                { label: "National Government", value: "Parliament creates laws that apply to all citizens of India." }
              ],
              aiHints: [
                "India has the largest democracy in the world — over 900 million eligible voters!",
                "Three branches — Legislature, Executive, Judiciary — balance each other's power.",
                "Panchayati Raj was introduced to bring governance to the grassroots level."
              ],
              assessment: [
                { id: "gov-q1", question: "What is the main purpose of government?", options: ["Collect taxes only", "Manage society through rules and services", "Control all businesses", "Run religious institutions"], correct: 1, explanation: "Government exists to create laws, maintain order, provide services, and protect citizens' rights." },
                { id: "gov-q2", question: "India's system of government is:", options: ["A monarchy", "A military dictatorship", "A democratic republic", "A theocracy"], correct: 2, explanation: "India is a democratic republic — citizens elect representatives who govern on their behalf." },
                { id: "gov-q3", question: "What is the Panchayat system?", options: ["A national court", "Village-level local self-government", "A type of national tax", "A religious council"], correct: 1, explanation: "Panchayat Raj is India's system of village self-governance, enabling local communities to manage their own affairs." }
              ]
            },
            {
              id: "fundamental-rights",
              name: "Fundamental Rights of Citizens",
              subtopicType: "core",
              mandatory: true,
              lessonPrefix: "EXP",
              concept: "The Indian Constitution guarantees six Fundamental Rights to every citizen — protecting freedom, equality, and human dignity.",
              examples: [
                { label: "Right to Equality", value: "No discrimination on the basis of religion, race, caste, sex, or place of birth." },
                { label: "Right to Education", value: "Every child between 6–14 years has the right to free and compulsory education." }
              ],
              aiHints: [
                "The Indian Constitution, adopted in 1950, is one of the longest written constitutions in the world.",
                "Dr. B.R. Ambedkar chaired the Drafting Committee and is called the chief architect of the Constitution.",
                "Fundamental Rights can be suspended only during a national emergency declared by the President."
              ],
              assessment: [
                { id: "fr-q1", question: "How many Fundamental Rights does the Indian Constitution guarantee?", options: ["3", "5", "6", "9"], correct: 2, explanation: "The Constitution guarantees 6 Fundamental Rights: Equality, Freedom, Against Exploitation, Religion, Cultural & Educational Rights, and Constitutional Remedies." },
                { id: "fr-q2", question: "Who is called the chief architect of the Indian Constitution?", options: ["Jawaharlal Nehru", "Mahatma Gandhi", "Dr. B.R. Ambedkar", "Sardar Patel"], correct: 2, explanation: "Dr. B.R. Ambedkar chaired the Constitution's Drafting Committee and is celebrated as its chief architect." },
                { id: "fr-q3", question: "The Right to Education applies to children aged:", options: ["3–8 years", "5–12 years", "6–14 years", "8–16 years"], correct: 2, explanation: "The Right to Education Act (2009) guarantees free and compulsory education to all children between 6 and 14 years." }
              ]
            },
            {
              id: "map-of-india",
              name: "India: States and Physical Features",
              subtopicType: "core",
              mandatory: true,
              lessonPrefix: "EXP",
              concept: "India has 28 states and 8 Union Territories. Its physical features include the Himalayas, the Deccan Plateau, great rivers, and long coastlines.",
              examples: [
                { label: "Himalayas", value: "The world's highest mountain range — forms India's northern boundary and is a source of major rivers." },
                { label: "Deccan Plateau", value: "A large triangular plateau in southern India, rich in minerals and agricultural land." }
              ],
              aiHints: [
                "India shares borders with 7 countries: Pakistan, China, Nepal, Bhutan, Bangladesh, Myanmar, and Sri Lanka (by sea).",
                "The Ganga, Brahmaputra, and Indus are the three great river systems of India.",
                "India has the 7th largest land area in the world."
              ],
              assessment: [
                { id: "mi-q1", question: "How many states does India currently have?", options: ["25", "28", "29", "32"], correct: 1, explanation: "India has 28 states and 8 Union Territories as of 2024." },
                { id: "mi-q2", question: "Which mountain range forms India's northern boundary?", options: ["Western Ghats", "Eastern Ghats", "Himalayas", "Vindhya Range"], correct: 2, explanation: "The Himalayas form India's northern boundary and are the source of major rivers like the Ganga and Brahmaputra." },
                { id: "mi-q3", question: "The Deccan Plateau is located in:", options: ["Northern India", "Eastern India", "Southern India", "Western India"], correct: 2, explanation: "The Deccan Plateau occupies most of peninsular India — the southern part of the subcontinent." }
              ]
            }
          ]
        }
      ]
    },

    // ============================================================
    // SUBJECT: Kannada
    // ============================================================
    {
      id: "kannada",
      name: "Kannada",
      icon: "📖",
      type: "core",
      color: "#8B0000",
      topics: [
        {
          id: "kannada-basics",
          name: "Kannada Aksharamale",
          description: "Learn the Kannada script, vowels, consonants, and basic words",
          icon: "ಕ",
          xp: 100,
          mandatory: true,
          moduleType: "standard",
          subtopics: [
            {
              id: "kannada-vowels",
              name: "Swaraaksharagalu — Vowels",
              subtopicType: "core",
              mandatory: true,
              lessonPrefix: "EXP",
              concept: "Kannada has 13 vowels (swaras): ಅ ಆ ಇ ಈ ಉ ಊ ಋ ಎ ಏ ಐ ಒ ಓ ಔ. Each represents a distinct sound.",
              examples: [
                { label: "ಅ (a)", value: "Short 'a' sound — like 'a' in 'about'. ಅಮ್ಮ = mother." },
                { label: "ಆ (aa)", value: "Long 'aa' sound — like 'a' in 'father'. ಆನೆ = elephant." }
              ],
              aiHints: [
                "Kannada is one of the world's oldest languages with over 2,500 years of literary history.",
                "Kannada received Classical Language status from the Indian government in 2008.",
                "The Kannada script evolved from the ancient Brahmi script."
              ],
              assessment: [
                { id: "kv-q1", question: "How many vowels (swaras) does Kannada have?", options: ["10", "11", "12", "13"], correct: 3, explanation: "Kannada has 13 vowels: ಅ ಆ ಇ ಈ ಉ ಊ ಋ ಎ ಏ ಐ ಒ ಓ ಔ" },
                { id: "kv-q2", question: "What does 'ಅಮ್ಮ' mean?", options: ["Father", "Mother", "Brother", "Grandmother"], correct: 1, explanation: "'ಅಮ್ಮ' (amma) means 'mother' in Kannada — one of the first words children learn!" },
                { id: "kv-q3", question: "When was Kannada given Classical Language status?", options: ["1998", "2003", "2008", "2015"], correct: 2, explanation: "Kannada was officially declared a Classical Language of India in 2008, recognising its ancient heritage." }
              ]
            },
            {
              id: "kannada-consonants",
              name: "Vyanjanaksharagalu — Consonants",
              subtopicType: "core",
              mandatory: true,
              lessonPrefix: "EXP",
              concept: "Kannada has 34 consonants (vyanjanas), arranged scientifically by the position of the tongue and lips.",
              examples: [
                { label: "ಕ ಖ ಗ ಘ (ka, kha, ga, gha)", value: "Velar consonants — produced at the back of the throat." },
                { label: "ಪ ಫ ಬ ಭ (pa, pha, ba, bha)", value: "Labial consonants — produced with both lips." }
              ],
              aiHints: [
                "The Kannada script is written from left to right.",
                "Each consonant has an inherent 'a' sound: ಕ = 'ka', ಚ = 'cha', ತ = 'ta'.",
                "Ancient Indian grammarians mapped all speech sounds — making the script truly phonetic."
              ],
              assessment: [
                { id: "kc-q1", question: "How many consonants (vyanjanas) does Kannada have?", options: ["25", "34", "36", "49"], correct: 1, explanation: "Kannada has 34 consonants, grouped by their place and manner of articulation." },
                { id: "kc-q2", question: "Kannada script is written:", options: ["Right to left", "Left to right", "Top to bottom", "In a spiral"], correct: 1, explanation: "Kannada, like most Indian scripts, is written from left to right." },
                { id: "kc-q3", question: "What is the Kannada word for 'school'?", options: ["ಗ್ರಾಮ (graama)", "ಶಾಲೆ (shaale)", "ಮನೆ (mane)", "ನದಿ (nadi)"], correct: 1, explanation: "'ಶಾಲೆ' (shaale) means 'school' in Kannada." }
              ]
            },
            {
              id: "kannada-words",
              name: "Nityada Padagalu — Everyday Words",
              subtopicType: "core",
              mandatory: true,
              lessonPrefix: "EXP",
              concept: "Learning everyday Kannada words helps us communicate, understand our culture, and appreciate our mother tongue.",
              examples: [
                { label: "Numbers 1–5", value: "ಒಂದು (one), ಎರಡು (two), ಮೂರು (three), ನಾಲ್ಕು (four), ಐದು (five)" },
                { label: "Colours", value: "ಕೆಂಪು (red), ಹಳದಿ (yellow), ನೀಲಿ (blue), ಹಸಿರು (green)" }
              ],
              aiHints: [
                "Kannada is spoken by over 45 million people worldwide.",
                "Kuvempu, Karnataka's beloved poet, wrote the state anthem 'Jaya Bharata Jananiya Tanujate'.",
                "Learning your mother tongue strengthens identity and cultural connection."
              ],
              assessment: [
                { id: "kw-q1", question: "What does 'ಮನೆ' mean?", options: ["School", "River", "Home", "Tree"], correct: 2, explanation: "'ಮನೆ' (mane) means 'home' or 'house' in Kannada." },
                { id: "kw-q2", question: "What is the Kannada word for the number 3?", options: ["ಒಂದು", "ಎರಡು", "ಮೂರು", "ನಾಲ್ಕು"], correct: 2, explanation: "'ಮೂರು' (mooru) is the Kannada word for three." },
                { id: "kw-q3", question: "How many people speak Kannada worldwide?", options: ["5 million", "20 million", "45 million", "100 million"], correct: 2, explanation: "Kannada is spoken by over 45 million people — primarily in Karnataka and across the Kannada diaspora worldwide." }
              ]
            }
          ]
        }
      ]
    },
    // ============================================================
    // NEXT-PATH SUBJECTS (Locked by default, unlockable by mentor)
    // ============================================================
    {
      id: "bhagavadgita",
      name: "Bhagavad Gita",
      icon: "🪔",
      type: "para-vidya",
      color: "#D35400",
      quotient: "SQ",
      topics: [{ id: "gita-intro", name: "Introduction to the Gita", description: "Learn life lessons from the ancient epic", icon: "📖", xp: 100, moduleType: "next-path", subtopics: [] }]
    },
    {
      id: "sanskrit",
      name: "Sanskrit",
      icon: "🕉️",
      type: "language",
      color: "#8E44AD",
      quotient: "SQ",
      topics: [{ id: "sanskrit-intro", name: "Sanskrit Basics", description: "Learn the mother of all languages", icon: "अ", xp: 100, moduleType: "next-path", subtopics: [] }]
    },
    {
      id: "english",
      name: "English",
      icon: "📝",
      type: "language",
      color: "#2980B9",
      quotient: "IQ",
      topics: [{ id: "english-intro", name: "Grammar & Vocab", description: "Master English speaking and writing", icon: "A", xp: 100, moduleType: "next-path", subtopics: [] }]
    },
    {
      id: "ai-training",
      name: "AI Training",
      icon: "🤖",
      type: "tech",
      color: "#27AE60",
      quotient: "IQ",
      topics: [{ id: "ai-intro", name: "AI Fundamentals", description: "Understand how artificial intelligence works", icon: "🧠", xp: 100, moduleType: "next-path", subtopics: [] }]
    },
    {
      id: "young-scientist",
      name: "Young Scientist",
      icon: "🔬",
      type: "science",
      color: "#16A085",
      quotient: "IQ",
      topics: [{ id: "science-intro", name: "Experimental Science", description: "Learn through hands-on science experiments", icon: "🧪", xp: 100, moduleType: "next-path", subtopics: [] }]
    },
    {
      id: "art-craft",
      name: "Art and Craft",
      icon: "🎨",
      type: "creativity",
      color: "#F39C12",
      quotient: "EQ",
      topics: [{ id: "art-intro", name: "Creative Expressions", description: "Express yourself through art", icon: "🖌️", xp: 100, moduleType: "next-path", subtopics: [] }]
    },
    {
      id: "pe",
      name: "Physical Education",
      icon: "⚽",
      type: "physical",
      color: "#E74C3C",
      quotient: "PQ",
      topics: [{ id: "pe-intro", name: "Fitness & Sports", description: "Stay fit and active", icon: "🏃", xp: 100, moduleType: "next-path", subtopics: [] }]
    }
  ]
};

