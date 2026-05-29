// ============================================================
// DATA LAYER: topics.js
// Single source of truth for all subjects, topics and subtopics.
// Mathematics & Science: empty shells + githubFolder; lesson body from GET /api/content.
// Other subjects may still embed content here until migrated to the API.
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
      quotient: "IQ",
      topics: [
        {
          id: "fractions",
          name: "Symmetry",
          description: "Discover symmetry in shapes, patterns, and the world around you.",
          icon: "🔄",
          xp: 150,
          mandatory: true,
          moduleType: "standard",
          githubFolder: "Symmetry",
          subtopics: [
            {
              id: "symmetry-core",
              name: "Symmetry",
              lessonPrefix: "EXP",
              description: "Guided lesson from your published Grade 6 mathematics curriculum.",
              xp: 50,
              subtopicType: "core",
              mandatory: true,
              concepts: [],
              aiHints: []
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
      quotient: "IQ",
      topics: [
        {
          id: "gravity",
          name: "The Wonderful World of Science",
          description: "Explore science through curiosity, observation, and everyday mysteries.",
          icon: "🔬",
          xp: 180,
          mandatory: true,
          moduleType: "standard",
          githubFolder: "The_Wonderful_World_of_Science",
          subtopics: [
            {
              id: "wonderful-world-core",
              name: "The Wonderful World of Science",
              lessonPrefix: "EXP",
              description: "Guided lesson from your published Grade 6 science curriculum.",
              xp: 55,
              subtopicType: "core",
              mandatory: true,
              concepts: [],
              aiHints: []
            }
          ]
        }
      ]
    },
    {
      id: "sanskrit",
      name: "Sanskrit",
      icon: "🕉️",
      type: "language",
      color: "#8E44AD",
      topics: [{ id: "sanskrit-intro", name: "Sanskrit Basics", description: "Learn the mother of all languages", icon: "अ", xp: 100, moduleType: "next-path", subtopics: [] }]
    },
    {
      id: "english",
      name: "English",
      icon: "📝",
      type: "language",
      color: "#2980B9",
      topics: [{ id: "english-intro", name: "Grammar & Vocab", description: "Master English speaking and writing", icon: "A", xp: 100, moduleType: "next-path", subtopics: [] }]
    },
    {
      id: "ai-training",
      name: "AI Training",
      icon: "🤖",
      type: "tech",
      color: "#27AE60",
      topics: [{ id: "ai-intro", name: "AI Fundamentals", description: "Understand how artificial intelligence works", icon: "🧠", xp: 100, moduleType: "next-path", subtopics: [] }]
    },
    {
      id: "young-scientist",
      name: "Young Scientist",
      icon: "🔬",
      type: "science",
      color: "#16A085",
      topics: [{ id: "science-intro", name: "Experimental Science", description: "Learn through hands-on science experiments", icon: "🧪", xp: 100, moduleType: "next-path", subtopics: [] }]
    },
    {
      id: "art-craft",
      name: "Art and Craft",
      icon: "🎨",
      type: "creativity",
      color: "#F39C12",
      topics: [{ id: "art-intro", name: "Creative Expressions", description: "Express yourself through art", icon: "🖌️", xp: 100, moduleType: "next-path", subtopics: [] }]
    },
    {
      id: "pe",
      name: "Physical Education",
      icon: "⚽",
      type: "physical",
      color: "#E74C3C",
      topics: [{ id: "pe-intro", name: "Fitness & Sports", description: "Stay fit and active", icon: "🏃", xp: 100, moduleType: "next-path", subtopics: [] }]
    }
  ]
};

