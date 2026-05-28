'use strict';
const path = require('path');
const dotenv = require('dotenv');
const ROOT = path.resolve(__dirname, '..');
// Load .env first, then env.local (fills gaps — common when key lives in env.local only)
dotenv.config({ path: path.join(ROOT, '.env') });
dotenv.config({ path: path.join(ROOT, 'env.local') });
// ============================================================
// SERVER: index.js
// Express entry point for Gurukul.
//
// Start with:  node server/index.js   (or npm start)
//
// Serves:
//   /          → static files from wizkids/  (student.html, mentor.html, etc.)
//   /api/*     → REST API routes (server/routes.js)
// ============================================================

const express = require('express');
const { init: initDB } = require('./db');
const { syncConfig }   = require('./config-loader');
const apiRoutes = require('./routes');

const PORT    = process.env.PORT || 3000;
const DB_DIR  = process.env.DB_DIR || path.join(__dirname, '../db');
const STATIC  = path.resolve(__dirname, '..');  // serve wizkids/ root

// ── Init DB then sync learning-path config ────────────────────────────────────
try {
  console.log('[GKServer] Initializing database & syncing curriculum...');
  initDB(DB_DIR);
  
  console.log('[GKServer] Syncing config...');
  const syncResult = syncConfig();
  if (syncResult === null) {
    console.warn('[GKServer] Config sync skipped (no config file).');
  }
} catch (err) {
  console.error('[GKServer] Startup error:', err);
  process.exit(1);
}

// ── Express app ──────────────────────────────────────────────────────────────
const app = express();

app.use(express.json({ limit: '5mb' }));

// Static file serving — CSS, JS, images, HTML pages
app.use(express.static(STATIC));

// API routes
app.use('/api', apiRoutes);

// SPA fallback: serve student.html for unknown paths (mentor.html is explicit)
app.get('*', (req, res) => {
  res.sendFile(path.join(STATIC, 'student.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
// Listen on 0.0.0.0 so Docker exposes the port on all interfaces.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[GKServer] Gurukul running on port ${PORT}`);
  console.log(`  Student  → http://localhost:${PORT}/student.html`);
  console.log(`  Mentor   → http://localhost:${PORT}/mentor.html`);
  console.log(`  Branding → http://localhost:${PORT}/admin/school-branding.html (admin only)`);
});
