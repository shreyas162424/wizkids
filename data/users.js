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
  displayName: "Dr. Sharma",
  role: "SME",
  avatar: "📋",
  photo: "img/sharma-sme.png"
};

// Mentor credentials (separate from student accounts)
const GK_MENTOR = {
  id: "mentor01",
  username: "maitreyi",
  password: "maitreyi123",
  displayName: "Maitreyi",
  role: "Mentor",
  avatar: "🕉", // Advisor Narayana
  photo: "img/maitreyi_mentor.png"
};

const GK_USERS = [
  {
    id: "gargi",
    username: "gargi",
    password: "Gargi@2025",
    displayName: "Gargi",
    grade: "6",
    avatar: "🌸",
    photo: "img/gargi_student.png",
    joinDate: "2025-01-01",
    totalXP: 0,
    level: 1,
    completedTopics: [],
    preferredStyle: "visual",
    persona: "Hobby: Nature. Loves the outdoors, ecology, plants, and rivers. Wants all examples to be about nature."
  },
  {
    id: "ahilya",
    username: "ahilya",
    password: "Ahilya@2025",
    displayName: "Ahilya",
    grade: "6",
    avatar: "🌺",
    photo: "img/ahilya_student.png",
    joinDate: "2025-01-01",
    totalXP: 0,
    level: 1,
    completedTopics: [],
    preferredStyle: "visual",
    persona: "Hobby: Nature. Loves the outdoors, ecology, plants, and rivers. Wants all examples to be about nature."
  },
  {
    id: "nachiketa",
    username: "nachiketa",
    password: "Nachiketa@2025",
    displayName: "Nachiketa",
    grade: "Grade 6",
    avatar: "🌺",
    photo: "img/nachiketa_student.png",
    joinDate: "2025-01-01",
    totalXP: 0,
    level: 1,
    completedTopics: [],
    preferredStyle: "visual",
    persona: "Energetic, practical learner, curious. Obsessed with automobiles, engineering, and hands-on experiments. Loves quick feedback."
  },
  {
    id: "arjuna",
    username: "arjuna",
    password: "Arjuna@2025",
    displayName: "Arjuna",
    grade: "6",
    avatar: "🦁",
    photo: "img/arjuna_student.png",
    joinDate: "2025-01-01",
    totalXP: 0,
    level: 1,
    completedTopics: [],
    preferredStyle: "kinesthetic",
    persona: "Hobby: Photography. Loves camera gear, lenses, lighting, and framing. Wants all examples to be about photography."
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
