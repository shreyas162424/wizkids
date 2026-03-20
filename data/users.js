// ============================================================
// DATA LAYER: users.js
// User credentials and profile data.
// In production, credentials would be managed server-side.
// ============================================================

// Content SME credentials
const GK_SME = {
  id: "sme01",
  username: "sme",
  password: "sme123",
  displayName: "Content SME",
  avatar: "📋"
};

// Mentor credentials (separate from student accounts)
const GK_MENTOR = {
  id: "mentor01",
  username: "mentor",
  password: "mentor123",
  displayName: "Bela",
  avatar: "🕉", // Advisor Narayana
  photo: "img/mentor-photo.png"
};

const GK_USERS = [
  {
    id: "diya",
    username: "diya",
    password: "Diya@2025",
    displayName: "Diya",
    grade: "6",
    avatar: "🌸",
    photo: "img/avatar-diya.jpeg",
    joinDate: "2025-01-01",
    totalXP: 0,
    level: 1,
    completedTopics: [],
    preferredStyle: "visual",
    persona: "Nature lover, silent, high IQ. Struggles with noisy environments but blossoms in quiet contemplation."
  },
  {
    id: "disha",
    username: "disha",
    password: "Disha@2025",
    displayName: "Disha",
    grade: "6",
    avatar: "🌺",
    photo: "img/avatar-disha.png",
    joinDate: "2025-01-01",
    totalXP: 0,
    level: 1,
    completedTopics: [],
    preferredStyle: "visual",
    persona: "Creative and expressive learner. Thrives on storytelling, art connections, and collaborative activities."
  },
  {
    id: "vidwath",
    username: "vidwath",
    password: "Vidwath@2025",
    displayName: "Vidwath",
    grade: "6",
    avatar: "🌟",
    photo: "img/avatar-vidwath.png",
    joinDate: "2025-01-01",
    totalXP: 0,
    level: 1,
    completedTopics: [],
    preferredStyle: "visual",
    persona: "Energetic, practical learner, curious. Loves hands-on experiments and quick feedback."
  },
  {
    id: "mahanth",
    username: "mahanth",
    password: "Mahanth@2025",
    displayName: "Mahanth",
    grade: "6",
    avatar: "🦁",
    photo: "img/avatar-mahanth.png",
    joinDate: "2025-01-01",
    totalXP: 0,
    level: 1,
    completedTopics: [],
    preferredStyle: "kinesthetic",
    persona: "Bold, competitive, and analytical. Motivated by challenges, rankings, and mastery of concepts."
  }
];

// XP thresholds per level
const GK_LEVELS = [
  { level: 1, title: "Beginner", minXP: 0, icon: "🌱" },
  { level: 2, title: "Learner", minXP: 100, icon: "📖" },
  { level: 3, title: "Practitioner", minXP: 250, icon: "🎯" },
  { level: 4, title: "Student", minXP: 500, icon: "⭐" },
  { level: 5, title: "Advanced", minXP: 900, icon: "🏆" },
  { level: 6, title: "Expert", minXP: 1500, icon: "🌟" }
];
