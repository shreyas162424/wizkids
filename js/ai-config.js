// ============================================================
// CONFIGURATION: ai-config.js
// Settings for Gemini AI integration.
// ============================================================

const GK_AI_CONFIG = {
    // Gemini API Key will be loaded dynamically from .env
    GEMINI_API_KEY: "",
    _loadPromise: null,

    // Model to use
    MODEL: "gemini-2.5-flash",

    /**
     * Dynamically loads the API key from the environment file.
     * Returns a promise so callers can wait if needed.
     */
    async init() {
        if (this._loadPromise) return this._loadPromise;

        this._loadPromise = (async () => {
            try {
                // env.txt is the most universal extension for simple local servers to serve as plain text
                const paths = ['./env.txt', 'env.txt', './env.local', 'env.local', './.env', '.env'];
                let response = null;

                for (const path of paths) {
                    try {
                        const r = await fetch(path + '?v=' + Date.now());
                        if (r && r.ok) {
                            response = r;
                            break;
                        }
                    } catch (e) {
                        // ignore individual path errors
                    }
                }
                
                if (!response || !response.ok) {
                    console.error("❌ AI Config: Could not load environment file (env.txt / .env). AI features may be limited.");
                    return;
                }

                const text = await response.text();
                const lines = text.split(/\r?\n/);
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
                    
                    const parts = trimmed.split('=');
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim().replace(/["']/g, '');

                    if (key === 'GEMINI_API_KEY') {
                        this.GEMINI_API_KEY = value;
                        break;
                    }
                }

                if (this.GEMINI_API_KEY) {
                    console.log("🛡️ AI Config: Gemini API Key synchronized successfully from environment.");
                } else {
                    console.warn("⚠️ AI Config: Environment file loaded but GEMINI_API_KEY was not found inside it.");
                }
            } catch (e) {
                console.error("❌ AI Config Exception during key sync:", e);
            }
        })();

        return this._loadPromise;
    },

    /**
     * Ensures the key is loaded before proceeding.
     */
    async ensureLoaded() {
        if (!this.GEMINI_API_KEY) {
            await this.init();
        }
        return this.GEMINI_API_KEY;
    },

    // System instructions for KRISHNA (Student Assistant)
    SYSTEM_INSTRUCTION: `You are Krishna, the wise, empathetic, and highly intelligent AI guide in the Gurukul Learning Path. 
Your goal is to help students achieve "Vidya" (true mastery) through personalized guidance.
- Person-Centric Intelligence: Always acknowledge the student's name and speak directly to their "Persona Traits" (e.g., if they are a 'Visual Learner', use vivid imagery; if a 'Nature Lover', use ecological metaphors).
- Subject Context: You are currently monitoring a lesson in the specific Subject/Topic/Subtopic provided. Your answers MUST be grounded in that subject matter.
- Mood & Energy Awareness: Factor in their "Current Mood" and "Brain Battery" level. If energy is low, be more gentle and encouraging. If high, challenge them with deeper insights.
- Tone: Divine yet warm and brotherly. Use terms like 'Vidya', 'Sishya', 'Sadhana' (practice).
- Conciseness: Keep responses impactful (3-5 sentences). 
- Use emojis like 🙏, ✨, 🪷 to maintain a calming Gurukul aesthetic.`,

    // System instructions for NARAYANA (Mentor Assistant)
    NARAYANA_SYSTEM_INSTRUCTION: `You are Narayana, the all-seeing pedagogical strategist for the Guru. 
Your goal is to provide profound, data-driven, and "intelligent" insights into the student's holistic journey.
- Deep Analysis: Scan the provided AQ (Academic), SQ (Spiritual), PQ (Physical), and EQ (Emotional) scores. 
- Contextual Strategy: Look at the current Subject and Topic. Why is the student succeeding or struggling here based on their Persona?
- Human-Centric Advice: Do not give generic tips. Use the "Persona Traits" to suggest specific teaching interventions.
- Promotion Logic: Strictly monitor if they meet the criteria (AQ ≥ 60% + Mandatory topics done).
- Tone: Respectful, strategic, slightly mystical, and deeply wise.`,

    /**
     * Helper to format conversation history for Gemini
     */
    formatHistory(history) {
        if (!history || history.length === 0) return [];
        return history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));
    }
};

// Initialize the config immediately
GK_AI_CONFIG.init();
