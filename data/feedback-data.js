// ============================================================
// DATA LAYER: feedback-data.js
// Single source of truth for all student feedback questions.
// Consumed by: js/feedback.js (BL layer only — never by UI directly).
// Three question sets:
//   GK_FEEDBACK_QUESTIONS          – end-of-session (existing)
//   GK_SUBTOPIC_FEEDBACK_QUESTIONS – quick pulse after each subtopic game
//   GK_MODULE_FEEDBACK_QUESTIONS   – deeper check after completing a full module
// ============================================================

// ---- Quick post-subtopic feedback (2 questions) ----
const GK_SUBTOPIC_FEEDBACK_QUESTIONS = [
  {
    id: "enjoyedMost",
    question: "What did you enjoy the most?",
    type: "text",
  },
  {
    id: "improvementPoint",
    question: "What is the  improvement point u suggest?",
    type: "text",
  },
];

// ---- Post-module feedback (2 questions) ----
const GK_MODULE_FEEDBACK_QUESTIONS = [
  {
    id: "enjoyedMost",
    question: "What did you enjoy the most about this module?",
    type: "text",
  },
  {
    id: "improvementPoint",
    question: "What is your improvement point?",
    type: "text",
  },
];

// ---- End-of-session feedback (2 questions) ----
const GK_FEEDBACK_QUESTIONS = [
  {
    id: "enjoyedMost",
    question: "What did you enjoy the most in today's session?",
    type: "text",
  },
  {
    id: "improvementPoint",
    question: "What is one thing you want to improve or understand better?",
    type: "text",
  },
];
