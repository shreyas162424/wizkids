const path = require('path');
const { DatabaseSync: Database } = require('node:sqlite');

const dbPath = path.resolve(__dirname, 'db/gurukul.sqlite');
const db = new Database(dbPath);

console.log('Running quick migration to rename vidwath -> vidvath...');

db.exec('PRAGMA foreign_keys = OFF;');

const tablesWithUserId = [
  'users',
  'auth_session',
  'user_xp',
  'user_extra',
  'active_sessions',
  'session_log',
  'subtopic_completions',
  'subtopic_scores',
  'topic_completions',
  'assessment_attempts',
  'subtopic_feedback',
  'module_feedback',
  'session_feedback',
  'quick_check_results',
  'mentor_notes',
  'mentor_rewards',
  'topic_locks',
  'review_requests',
  'holistic_scores',
  'demo_overrides'
];

  // Rename id in users table
  db.prepare(`UPDATE users SET id = 'vidvath' WHERE id = 'vidwath'`).run();
  
  // Fix username
  db.prepare(`UPDATE users SET username = 'vidvath' WHERE username = 'vidwath'`).run();

  // Rename across all references
  tablesWithUserId.forEach(table => {
    if (table !== 'users' && table !== 'auth_session') {
      try {
        db.prepare(`UPDATE ${table} SET user_id = 'vidvath' WHERE user_id = 'vidwath'`).run();
      } catch (e) {
        console.error('Error updating', table, e.message);
      }
    }
  });

  // student_learning_paths uses student_id
  try {
    db.prepare(`UPDATE student_learning_paths SET student_id = 'vidvath' WHERE student_id = 'vidwath'`).run();
  } catch (e) {
    console.error('Error updating student_learning_paths', e.message);
  }

db.exec('PRAGMA foreign_keys = ON;');
console.log('Migration complete!');
