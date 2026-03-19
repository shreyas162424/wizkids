// ============================================================
// BUSINESS LOGIC: agent-logic.js
// Handles contextual, proactive messaging for the Krishna agent
// without relying on external AI APIs (for now).
// ============================================================

window.GKAgent = (() => {

    const PERSONAS = {
        student: {
            name: "Krishna",
            subtitle: "Your Divine Guide",
            expressions: {
                default: "img/krishna-guide.png",
                happy: "img/krishna-happy.png",
                thinking: "img/krishna-thinking.png",
                proud: "img/krishna-proud1.png",
                exited: "img/krishna-exited1.png",
                concerned: "img/krishna-concerned.png"
            }
        },
        mentor: {
            name: "Narayana",
            subtitle: "The Overseer",
            expressions: {
                default: "img/narayana-guide.png",
                happy: "img/narayana-guide.png",
                thinking: "img/narayana-guide.png",
                alert: "img/narayana-guide.png"
            }
        }
    };

    let _currentPersona = 'student';
    let _currentExpression = 'default';

    const CONTEXT_MESSAGES = {
        student: {
            login: "Welcome back to your Gurukul! 🙏 Your path to wisdom is illuminated. Shall we begin?",
            mood: "Internal balance is the first step to external mastery. How is your energy flowing today? ✨",
            ancientGame: "Ah, Moksha Patam! A mirror of life's journey. Let's see what lessons the dice have for you today. 🐍🎲",
            modules: "Behold your learning path, ${userName}! These topics are chosen to match your current spirit. Pick one! 📚",
            subtopics: "Deep roots make strong trees. Let us explore the branches of this knowledge together, ${userName}. 🌳",
            learning: "Absorb the essence of these teachings. Focus on the 'why' as much as the 'what', ${userName}. 🧘",
            assessment: "A moment of reflection. Trust your journey and your intuition, ${userName}. I am right here beside you. 🎯",
            subtopicFeedback: "Reflection is the seal of knowledge. How did this subtopic resonate with your spirit? 🧘",
            moduleFeedback: "You have completed a major milestone! Share your experience so we may refine the path. 🌟",
            feedback: "Your insights help us refine the path for those who follow. Share your heart. 📝",
            summary: "Excellent work! Your aura of knowledge is growing brighter with every step. 🌟"
        },
        mentor: {
            login: "Greetings, Guru. Your presence strengthens the foundation of this Gurukul. 🙏",
            mentorMood: "A clear mind guides most effectively. How is your inner state today?",
            dashboard: "Observing the growth of your Shishyas. Their progress is a testament to your steady hand. 🌟",
            studentDetail: "Diving deep into this student's path. Your specific guidance can spark their true potential. 🏹",
            liveView: "You are the silent observer of their struggle and success. Watch closely. ✨",
            sme_review: "Ensuring the purity of the knowledge being shared. Your expertise is the final seal. 🎯"
        }
    };

    const PROACTIVE_MESSAGES = {
        student: {
            stuck: [
                "The path seems obscured for a moment. Would you like a small spark of guidance? 💡",
                "Deep reflection is good, but don't let it become a pause. Ask and I shall answer! 🙏",
                "Shall we revisit the core concept? Sometimes the simplest truth is the most powerful. ✨"
            ],
            quiz_mistake: [
                "A small detour! It's just another way to learn. Shall we look at it from a different angle? 😊",
                "Close! But the truth lies slightly to the left. Remember our last discussion? 🏹",
                "A moment's confusion is natural. Take a deep breath and try once more. 🧘"
            ],
            quiz_perfect: [
                "Complete clarity! Your focus is as sharp as an arrow. 🌟",
                "Such mastery! You are truly walking the path of wisdom. ✨"
            ],
            notification: [
                "Wait! A word of wisdom has arrived from your mentor. 🔔",
                "A new teaching has been shared. Let's see what insight it holds! 🙏"
            ],
            xp_milestone: [
                "Incredible! Your dedication to Vidya has unlocked a new level of aura! 🌟",
                "Your spirit of inquiry is bearing fruit. A new milestone reached! ✨"
            ],
            low_energy: [
                "I sense the weight of the day upon you. Let us start with the gentlest of topics. 🌸",
                "When energy is low, slow and steady is the way. Every small step counts. 🧘"
            ],
            badge_unlock: [
                "Victory! A Sacred Token of Mastery is now yours. Shine with pride! 🏆",
                "Your accomplishments are now visible for all to admire. ✨"
            ],
            assessment_hint: [
                "That one was tricky, ${userName}. Would you like a small hint to find the right path? 💡",
                "Almost there! Take a deep breath, ${userName}. Think about the core concept we just covered. 🧘",
                "Don't worry about mistakes. They are just stepping stones to wisdom. Try again? ✨"
            ],
            assessment_correct: [
                "Great job, ${userName}! You are getting the hang of this perfectly. 🌟",
                "Your understanding is deepening! Excellent choice. ✅",
                "Perfect! Your focus is truly inspiring today, ${userName}. ✨"
            ],
            learning_speed: [
                "You are moving with great focus! Mastery is close at hand. 🚀",
                "Take your time, ${userName}. Deep roots make for strong trees. No need to rush! 🌳"
            ]
        },
        mentor: {
            student_stuck: [
                "Guru, ${userName} seems stuck on the assessment. Perhaps a small nudge would help? 💡",
                "Student is spending a long time on 'Gravity'. Might need your intervention. 🙏"
            ],
            review_ready: [
                "A student has completed their path and is awaiting your review. 📜",
                "Ready to award some XP? A new assessment is waiting for your eye. 🏹"
            ],
            live_observation: [
                "Observing the student's current focus. They are deeply engaged in the learning flow. ✨",
                "Student is moving with purpose. Their energy appears balanced and steady. 🧘",
                "Behold, student is exploring a new concept. They are expanding their horizon of knowledge. 🌅"
            ],
            student_celebration: [
                "Incredible! The student has just earned a badge. Their journey is bearing fruit. 🏆",
                "Success! A concept has been mastered. Your guidance is leading them to brilliance. ✨"
            ],
            student_idle: [
                "Guru, the student has been idle for some time. Perhaps they need a gentle reminder? ⏳",
                "Focus seems to have drifted. A short intervention might restore their path. 🙏"
            ],
            inactive_student: [
                "Guru, ${userName} hasn't logged in for 3 days. It might be time for a gentle check-in. 🔔",
                "I notice some Shishyas are slipping behind. Shall we send a word of encouragement? 🙏"
            ]
        }
    };

    let _lastMessage = "";

    /**
     * Set the current persona (student or mentor)
     */
    function setPersona(role) {
        if (PERSONAS[role]) _currentPersona = role;
    }

    /**
     * Get a message based on the current screen/state.
     * CRITICAL: This also updates the internal expression state.
     */
    function getContextMessage(screen, data = {}) {
        const pool = CONTEXT_MESSAGES[_currentPersona];
        let msg = pool[screen] || `I am here to guide you. 🙏`;

        // Expression logic based on screen/state
        _currentExpression = 'default';
        if (screen === 'assessment') _currentExpression = 'thinking';
        if (screen === 'ancientGame') _currentExpression = 'happy';
        if (screen === 'summary') _currentExpression = 'proud';
        if (data.score >= 100) _currentExpression = 'exited';

        // Context overrides
        if (_currentPersona === 'student' && screen === 'subtopics' && data.topicName) {
            msg = `Ready to explore <strong>${data.topicName}</strong>! 🎯 Pick a subtopic to start.`;
            _currentExpression = 'happy';
        }
        if (_currentPersona === 'mentor' && screen === 'studentDetail' && data.studentName) {
            msg = `Reviewing <strong>${data.studentName}</strong>'s profile. Your wisdom here is valuable. 🙏`;
            _currentExpression = 'thinking';
        }

        // Variable replacement
        const userName = data.userName || data.studentName || 'Explorer';
        msg = msg.replace(/\${userName}/g, userName);

        _lastMessage = msg;
        return msg;
    }

    /**
     * Trigger a proactive message (mistake, stuck, etc.)
     */
    function getProactiveMessage(type, data = {}) {
        const pool = PROACTIVE_MESSAGES[_currentPersona][type];
        if (!pool) return null;
        const msgTemplate = pool[Math.floor(Math.random() * pool.length)];

        // Map type to expression
        const expressionMap = {
            stuck: 'thinking',
            quiz_mistake: 'concerned',
            quiz_perfect: 'happy',
            xp_milestone: 'happy',
            low_energy: 'concerned',
            badge_unlock: 'happy',
            student_stuck: 'alert',
            review_ready: 'happy'
        };
        _currentExpression = expressionMap[type] || 'default';

        // Variable replacement
        const userName = data.userName || data.studentName || 'Explorer';
        const msg = msgTemplate.replace(/\${userName}/g, userName);

        _lastMessage = msg;
        return msg;
    }

    /**
     * Set a custom proactive message (e.g. for notifications)
     */
    function setCustomMessage(msg, expression = 'happy') {
        _lastMessage = msg;
        _currentExpression = expression;
    }

    return {
        get PERSONA() { return PERSONAS[_currentPersona]; },
        get PERSONAS() { return PERSONAS; },
        setPersona,
        getContextMessage,
        getProactiveMessage,
        setCustomMessage,
        getLastMessage: () => _lastMessage,
        getAvatar: () => {
            const persona = PERSONAS[_currentPersona];
            return persona.expressions[_currentExpression] || persona.expressions.default;
        }
    };
})();
