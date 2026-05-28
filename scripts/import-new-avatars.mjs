#!/usr/bin/env node
/**
 * Copy avatar images from Desktop "New avatars" into wizkids/img/avatars/{character}/
 *
 * Usage:
 *   node scripts/import-new-avatars.mjs
 *   node scripts/import-new-avatars.mjs "/path/to/New avatars"
 *
 * Expected layout (any of these):
 *   New avatars/Krishna/guide.png
 *   New avatars/krishna-thinking.png  (keyword in filename)
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'img', 'avatars');

const DEFAULT_SRC = path.join(process.env.HOME || '', 'Desktop', 'New avatars');
const CHARACTERS = ['krishna', 'arjuna', 'rama', 'hanuman', 'radha'];
const EXPRESSIONS = ['guide', 'happy', 'thinking', 'concerned', 'proud', 'exited'];

const EXPR_ALIASES = {
  guide: ['guide', 'default', 'teach', 'mentor'],
  happy: ['happy', 'joy', 'smile', 'cheer'],
  thinking: ['thinking', 'think', 'mood', 'ponder'],
  concerned: ['concerned', 'worry', 'sad', 'assess'],
  proud: ['proud', 'success', 'win'],
  exited: ['exited', 'excited', 'energy', 'celebrate', 'exited1']
};

function detectExpression(filename) {
  const lower = filename.toLowerCase().replace(/\.[^.]+$/, '');
  for (const expr of EXPRESSIONS) {
    if (lower.includes(expr)) return expr;
    for (const alias of EXPR_ALIASES[expr] || []) {
      if (lower.includes(alias)) return expr;
    }
  }
  return null;
}

function detectCharacter(name) {
  const lower = name.toLowerCase();
  return CHARACTERS.find(c => lower.includes(c)) || null;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
  console.log('  +', path.relative(ROOT, dest));
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, files);
    else if (/\.(png|jpe?g|webp)$/i.test(ent.name)) files.push(full);
  }
  return files;
}

function main() {
  const srcRoot = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SRC;
  if (!fs.existsSync(srcRoot)) {
    console.error('Source folder not found:', srcRoot);
    console.error('Usage: node scripts/import-new-avatars.mjs "/path/to/New avatars"');
    process.exit(1);
  }

  console.log('Importing from:', srcRoot);
  console.log('Output:', OUT);
  ensureDir(OUT);

  const copied = new Set();

  // Layout: character subfolders
  for (const ent of fs.readdirSync(srcRoot, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const charId = detectCharacter(ent.name);
    if (!charId) continue;
    const charDir = path.join(OUT, charId);
    ensureDir(charDir);
    for (const file of walk(path.join(srcRoot, ent.name))) {
      const expr = detectExpression(path.basename(file)) || 'guide';
      const dest = path.join(charDir, `${expr}.png`);
      copyFile(file, dest);
      copied.add(`${charId}/${expr}`);
    }
  }

  // Layout: flat files with character + expression in name
  for (const file of walk(srcRoot)) {
    if (path.dirname(file) !== srcRoot) continue;
    const base = path.basename(file);
    const charId = detectCharacter(base);
    const expr = detectExpression(base);
    if (!charId || !expr) continue;
    const charDir = path.join(OUT, charId);
    ensureDir(charDir);
    const dest = path.join(charDir, `${expr}.png`);
    copyFile(file, dest);
    copied.add(`${charId}/${expr}`);
  }

  console.log('\nDone. Imported', copied.size, 'expression(s).');
  if (copied.size === 0) {
    console.log('No files matched. Name files like krishna-guide.png or use folders Krishna/, Arjuna/, etc.');
    return;
  }

  // Blend matte backgrounds to transparent (like Krishna PNGs)
  const procScript = path.join(ROOT, 'scripts', 'process-avatar-backgrounds.py');
  if (fs.existsSync(procScript)) {
    console.log('\nBlending avatar backgrounds…');
    const py = process.env.GK_AVATAR_PYTHON || 'python3';
    const r = spawnSync(py, [procScript, '--force'], { cwd: ROOT, stdio: 'inherit' });
    if (r.status !== 0) {
      console.warn('Background processing failed (install Pillow: pip3 install Pillow)');
    }
  }
}

main();
