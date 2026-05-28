#!/usr/bin/env node
/**
 * Install deps, import New avatars, blend backgrounds like Krishna.
 *
 * Usage:
 *   node scripts/setup-and-blend-avatars.mjs
 *   node scripts/setup-and-blend-avatars.mjs "/path/to/New avatars"
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REQ = path.join(__dirname, 'requirements-avatars.txt');
const VENV = path.join(ROOT, '.venv-avatars');
const VENV_PY =
  process.platform === 'win32'
    ? path.join(VENV, 'Scripts', 'python.exe')
    : path.join(VENV, 'bin', 'python3');
const SRC = process.argv[2] || path.join(process.env.HOME || '', 'Desktop', 'New avatars');

function run(cmd, args, opts = {}) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', ...opts });
  if (r.status !== 0) {
    console.error(`Command failed (${r.status}): ${cmd}`);
    process.exit(r.status || 1);
  }
}

function step(title) {
  console.log(`\n${'='.repeat(60)}\n${title}\n${'='.repeat(60)}`);
}

function pythonCmd() {
  if (fs.existsSync(VENV_PY)) return VENV_PY;
  return 'python3';
}

function ensurePythonDeps() {
  const py = pythonCmd();
  const check = spawnSync(py, ['-c', 'from PIL import Image'], { cwd: ROOT, stdio: 'pipe' });
  if (check.status === 0) {
    const ver = spawnSync(py, ['-c', 'from PIL import Image; print(Image.__version__)'], {
      cwd: ROOT,
      encoding: 'utf8'
    });
    console.log('Pillow already available:', (ver.stdout || '').trim(), `(${py})`);
    return py;
  }

  if (!fs.existsSync(VENV_PY)) {
    console.log('Creating venv at', VENV);
    run('python3', ['-m', 'venv', VENV]);
  }

  run(VENV_PY, ['-m', 'pip', 'install', '--upgrade', 'pip']);
  run(VENV_PY, ['-m', 'pip', 'install', '-r', REQ]);
  run(VENV_PY, ['-c', 'from PIL import Image; print("Pillow OK:", Image.__version__)']);
  return VENV_PY;
}

step('1/4 — npm dependencies (wizkids)');
if (fs.existsSync(path.join(ROOT, 'package.json'))) {
  run('npm', ['install', '--no-fund', '--no-audit']);
}

step('2/4 — Python Pillow (venv if needed)');
const py = ensurePythonDeps();
process.env.GK_AVATAR_PYTHON = py;

step('3/4 — Import avatars from source');
if (!fs.existsSync(SRC)) {
  console.error('\nSource folder not found:', SRC);
  console.error('Pass path: node scripts/setup-and-blend-avatars.mjs "/path/to/New avatars"');
  process.exit(1);
}
run('node', [path.join(__dirname, 'import-new-avatars.mjs'), SRC], {
  env: { ...process.env, GK_AVATAR_PYTHON: py }
});

console.log('\nAll done. Hard-refresh student.html (Ctrl+Shift+R) to see updated avatars.\n');
