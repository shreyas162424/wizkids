// ============================================================
// BUSINESS LOGIC: assessment.js
// Manages assessment state: question ordering, scoring, feedback.
// ============================================================

const GKAssessment = (() => {

  let _state = {
    questions: [],
    currentIndex: 0,
    answers: [],
    score: 0,
    completed: false
  };

  function init(questions) {
    _state = {
      questions: [...questions],
      currentIndex: 0,
      answers: new Array(questions.length).fill(null),
      score: 0,
      completed: false
    };
    return _state;
  }

  function getCurrentQuestion() {
    if (_state.currentIndex >= _state.questions.length) return null;
    return {
      ..._state.questions[_state.currentIndex],
      index: _state.currentIndex,
      total: _state.questions.length
    };
  }

  // Supports index (MCQ), string (Fill in blank/Short Answer), or array (Matching)
  function submitAnswer(userAnswer) {
    if (_state.completed) return null;
    const q = _state.questions[_state.currentIndex];

    let isCorrect = false;
    let correctAns = q.correct;

    if (q.type === 'fill-blank' || q.type === 'short-answer') {
      // String comparison (case-insensitive)
      if (Array.isArray(correctAns)) {
        isCorrect = correctAns.some(ans => userAnswer.toString().toLowerCase().trim() === ans.toLowerCase().trim());
      } else {
        isCorrect = userAnswer.toString().toLowerCase().trim() === correctAns.toString().toLowerCase().trim();
      }
    } else if (q.type === 'match') {
      // Array comparison for matching
      isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctAns);
    } else if (q.type === 'multiple-correct') {
      // Array comparison for multiple correct MCQs (ignoring order)
      const uSorted = [...userAnswer].sort();
      const cSorted = [...correctAns].sort();
      isCorrect = JSON.stringify(uSorted) === JSON.stringify(cSorted);
    } else {
      // Default: Standard MCQ (Single Index)
      isCorrect = userAnswer === correctAns;
    }

    _state.answers[_state.currentIndex] = {
      selected: userAnswer,
      correct: correctAns,
      isCorrect,
      explanation: q.explanation
    };

    if (isCorrect) _state.score++;

    return {
      isCorrect,
      correctAnswer: correctAns, // changed from correctIndex to generic correctAnswer
      explanation: q.explanation,
      score: _state.score,
      index: _state.currentIndex,
      type: q.type || 'mcq'
    };
  }

  function nextQuestion() {
    _state.currentIndex++;
    if (_state.currentIndex >= _state.questions.length) {
      _state.completed = true;
    }
    return _state.currentIndex;
  }

  function getResults() {
    return {
      score: _state.score,
      total: _state.questions.length,
      percentage: Math.round((_state.score / _state.questions.length) * 100),
      answers: _state.answers,
      passed: _state.score >= Math.ceil(_state.questions.length * 0.6),
      completed: _state.completed
    };
  }

  function isCompleted() {
    return _state.completed;
  }

  function getPerformanceLabel(percentage) {
    if (percentage === 100) return { label: "Perfect! 🌟", color: "#DAA520" };
    if (percentage >= 80) return { label: "Excellent! ⭐", color: "#228B22" };
    if (percentage >= 60) return { label: "Good Job! 👍", color: "#3A6FA6" };
    if (percentage >= 40) return { label: "Keep Trying! 💪", color: "#C4882A" };
    return { label: "Needs Practice 📖", color: "#C0392B" };
  }

  return { init, getCurrentQuestion, submitAnswer, nextQuestion, getResults, isCompleted, getPerformanceLabel };
})();
