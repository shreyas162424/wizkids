// ============================================================
// BUSINESS LOGIC: ai-tutor.js
// Simulates Ask Acharya responses based on keywords and context.
// ============================================================

const GKAITutor = (() => {

  const RESPONSES = {
    // Fractions
    "what is fraction": "A fraction represents a part of a whole. It has two numbers: numerator (top) and denominator (bottom). Example: 3/4 means 3 parts out of 4 equal parts! 🍕",
    "proper fraction": "A proper fraction has numerator SMALLER than denominator (e.g., 3/4). It's always less than 1. Think of it as a slice smaller than the whole pizza!",
    "improper fraction": "An improper fraction has numerator GREATER than or EQUAL TO the denominator (e.g., 7/3). It equals 1 or more. Like having more slices than fit in one pizza!",
    "mixed fraction": "A mixed number = whole number + proper fraction (e.g., 2¾). It's the same as an improper fraction, just written differently. 2¾ = 11/4 ✨",
    "convert": "To convert improper to mixed: divide top by bottom. Quotient = whole number, remainder becomes the new top. Example: 7/3 → 7÷3=2 r1 → 2⅓",
    // Data Handling
    "tally": "Tally marks use groups of 5 for easy counting. Four vertical lines, then a diagonal crossing them = 5. Count by 5s, then add any leftovers! ⌺||||",
    "pictograph": "A pictograph uses pictures to represent data. The KEY tells you what each symbol means. Always check the key first before counting! 🔑",
    "bar graph": "A bar graph uses rectangular bars to compare data. The Y-axis shows values, X-axis shows categories. The tallest bar = the biggest value! 📊",
    // Yoga
    "surya namaskar": "Surya Namaskar has 12 poses done in a flow. Inhale when extending, exhale when folding. Even 3 rounds each morning can energize your whole day! 🌅",
    "tadasana": "Mountain Pose: Stand tall, feet together, spine long, gaze forward. It looks simple but builds powerful posture and body awareness! 🏔️",
    "vrikshasana": "Tree Pose: Balance on one foot, other foot on inner thigh (NOT the knee!). Find your Drishti - a fixed gazing point - to stay steady. 🌳",
    "tree pose": "Tree Pose: Balance on one foot, other foot on inner thigh (NOT the knee!). Find your Drishti - a fixed gazing point - to stay steady. 🌳",
    // Meditation
    "breathing": "Box breathing: In (4 counts) → Hold (4 counts) → Out (4 counts) → Hold (4 counts). This calms your nervous system and boosts focus in minutes! 📦",
    "body scan": "Body scan: Start at your toes and slowly move awareness upward. Just notice sensations without judgment. It's amazing for releasing hidden tension! 👣",
    "visualization": "Visualization uses your imagination to create calm or confidence. Imagine your safe place using all 5 senses - sight, sound, smell, touch, taste! 🧠",
    // Generic
    "hint": null,  // triggers next hint
    "help": "I'm Acharya, here to help! Ask me about the topic you're studying, or ask for a 'hint' for the current activity. You've got this! 💪",
    "don't understand": "No worries! Try re-reading the concept slowly. Focus on the visual example. Then ask me a specific question about what's confusing! 🤔",
    "difficult": "It's okay if it's hard at first! Every expert was once a beginner. Take a breath, re-read the concept, and try again. I believe in you! 🌟",
    "easy": "Great confidence! You're doing wonderfully. Challenge yourself in the game section and see if you can get a perfect score! ⭐",
    "bored": "Let's make it fun! Jump to the game section - it's more interactive. Or ask me an interesting question about the topic! 🎮",
    "tired": "Maybe try the breathing exercise or body scan from our Wellness section - it can help recharge your energy! 🌿",
    "good": "That's the spirit! Keep it up and you'll master this in no time. What question can I answer for you? 😊"
  };

  const DEFAULT_RESPONSES = [
    "Great question! Focus on the key concept at the top of the lesson. The visual example will help it click! 💡",
    "Let's think about this step by step. What part specifically is confusing you? 🤔",
    "I believe in you! Review the concept and try the game - hands-on practice helps a lot! 🎯",
    "Excellent curiosity! Every question you ask makes you smarter. Keep going! ⭐"
  ];

  let _defaultIdx = 0;
  let _hintIdx = 0;
  let _currentHints = [];

  function setContext(hints) {
    _currentHints = hints || [];
    _hintIdx = 0;
  }

  function getNextHint() {
    if (_currentHints.length === 0) return "Ask me anything about the current topic! 💡";
    const hint = _currentHints[_hintIdx % _currentHints.length];
    _hintIdx++;
    return hint;
  }

  async function respond(input) {
    if (!input || input.trim() === '') return getNextHint();
    const lower = input.toLowerCase();

    // 1. Check for hint request (Local Fallback)
    if (lower.includes('hint') || lower.includes('clue') || lower.includes('help me')) {
      return getNextHint();
    }

    // 2. Try Gemini API if key exists
    if (window.GK_AI_CONFIG && GK_AI_CONFIG.GEMINI_API_KEY) {
      try {
        const geminiResponse = await callGemini(input);
        if (geminiResponse) return geminiResponse;
      } catch (e) {
        console.error("Gemini API Error:", e);
      }
    }

    // 3. Match keyword responses (Local Fallback)
    for (const [keyword, response] of Object.entries(RESPONSES)) {
      if (response && lower.includes(keyword)) {
        return response;
      }
    }

    // 4. Default rotating response (Local Fallback)
    const resp = DEFAULT_RESPONSES[_defaultIdx % DEFAULT_RESPONSES.length];
    _defaultIdx++;
    return resp;
  }

  async function callGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GK_AI_CONFIG.MODEL}:generateContent?key=${GK_AI_CONFIG.GEMINI_API_KEY}`;

    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text: GK_AI_CONFIG.SYSTEM_INSTRUCTION + "\n\nStudent asks: " + prompt }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.7
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error("API request failed");

    const data = await response.json();
    return data.candidates && data.candidates[0].content.parts[0].text;
  }

  function getWelcomeMessage(subtopicName) {
    return `Namaste! 🙏 I'm Acharya, your AI guide. We're learning about <strong>${subtopicName}</strong>. Ask me anything or type 'hint' for a clue!`;
  }

  function getModulesMessage(userName) {
    return `Namaste, <strong>${userName}</strong>! 🙏 I'm Acharya. Your learning path is ready. Click any topic to begin, or ask me about what you'll learn today!`;
  }

  function getSubtopicsMessage(topicName) {
    return `Ready to explore <strong>${topicName}</strong>! 🎯 Pick a subtopic to start. Complete them all to unlock the Challenge Zone ⚡`;
  }

  return { setContext, respond, getNextHint, getWelcomeMessage, getModulesMessage, getSubtopicsMessage };
})();
