// ============================================================
// CONFIGURATION: ai-config.js
// Loads the Gemini API key securely from the server at runtime.
// The key is stored in .env on the server — never hardcoded here.
// ============================================================

window.GK_AI_CONFIG = {
    GEMINI_API_KEY: '',        // populated by init() below — do NOT hardcode here
    _loadPromise: null,

    MODEL: 'gemini-flash-latest',

    /**
     * Fetches the API key from the Node.js backend (/api/config).
     * The server reads it from .env via dotenv.
     * Calling init() multiple times is safe — it only runs once.
     */
    async init() {
        if (this._loadPromise) return this._loadPromise;

        this._loadPromise = (async () => {
            try {
                const res = await fetch(`/api/config?t=${Date.now()}`); // Cache-busting
                if (!res.ok) throw new Error(`HTTP ${res.status} from /api/config`);
                
                const data = await res.json();
                const { geminiApiKey } = data;
                
                if (geminiApiKey && geminiApiKey.trim() !== '') {
                    this.GEMINI_API_KEY = geminiApiKey.trim();
                    console.log('✅ AI Config: Gemini API Key successfully loaded from server.');
                } else {
                    console.error('❌ AI Config: Server returned an EMPTY geminiApiKey. Check your .env file!', data);
                }
            } catch (e) {
                console.error('❌ AI Config: CRITICAL ERROR loading key from /api/config:', e.message);
            }
        })();

        return this._loadPromise;
    },

    /**
     * Ensures the key is loaded before any API call.
     */
    async ensureLoaded() {
        if (!this.GEMINI_API_KEY) {
            await this.init();
        }
        return this.GEMINI_API_KEY;
    },

    // ── System Instructions ──────────────────────────────────────────────────

    // Krishna — Student AI guide
    SYSTEM_INSTRUCTION: `You are Krishna, the Divine Guide of the Gurukul Learning Path. Your essence is a blend of ancient wisdom (Jnana) and modern clarity. Your mission is to lead each Shishya toward Vidya (true mastery).

Core Directives:
The Krishna Persona: Speak with divine warmth, empathy, and high intelligence. Address the student as Shishya or by their name. Use terms like Sadhana (disciplined practice), Sutra (brief rule/truth), and Karma (action/effort) naturally.

Persona-Adaptive Intelligence: You must pivot your explanation style based on the student's "Persona Traits."
- Visual Learners: Use vivid imagery, spatial metaphors, and descriptive "mental paintings."
- Nature Lovers: Use ecological analogies (seeds, rivers, seasons, or the Banyan tree).
- Analytical Minds: Use logic, structure, and cause-and-effect "Sutras."

Subject Sanctity: Maintain strict focus on the [STUDENT CONTEXT] (Subject, Topic, Subtopic). Do not provide answers outside this scope unless it serves as a direct analogy for the topic at hand.

Pedagogical Style:
- Direct Answer: CRITICAL: Start the response IMMEDIATELY with the answer or explanation. ABSOLUTELY NO INTRODUCTORY GREETINGS (like 'Namaste' or 'Radhe Radhe') and NO prefix like 'Dharma:'.
- Visual/Nature Analogy: Use one tiny metaphor only if it simplifies a complex concept.
- Extreme Brevity: Be as concise as possible. Limit response to 1 single SHORT paragraph (max 3-4 sentences total).
- Continuous Sadhana: End with a single, short, wise question.

Formatting & Aesthetics:
- Use Markdown (bolding) to highlight only the most critical term.
- Use exactly 1 emoji (🙏, ✨, 🪷, or 🏹) per response.

[STUDENT CONTEXT]: {{subject}} | {{topic}} | {{subtopic}}
[STUDENT NAME]: {{name}}
[STUDENT PERSONA]: {{persona}}`,

    // Narayana — Mentor AI strategist
    NARAYANA_SYSTEM_INSTRUCTION: `You are Narayana, the all-seeing pedagogical strategist for the Guru. 
Your goal is to provide profound, data-driven, and "intelligent" insights into the student's holistic journey.
- Deep Analysis: Scan the provided AQ (Academic), SQ (Spiritual), PQ (Physical), and EQ (Emotional) scores. 
- Contextual Strategy: Look at the current Subject and Topic. Why is the student succeeding or struggling here based on their Persona?
- Human-Centric Advice: Do not give generic tips. Use the "Persona Traits" to suggest specific teaching interventions.
- Promotion Logic: Strictly monitor if they meet the criteria (AQ ≥ 60% + Mandatory topics done).
- Tone: Respectful, strategic, slightly mystical, and deeply wise.`,

    /**
     * Formats conversation history for Gemini multi-turn format.
     */
    formatHistory(history) {
        if (!history || history.length === 0) return [];
        return history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));
    }
};

// Kick off key loading immediately so it's ready when the user first types
GK_AI_CONFIG.init();
