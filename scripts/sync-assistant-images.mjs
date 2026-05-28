#!/usr/bin/env node
/**
 * Copy {krishna,radha,rama,hanuman}-*.png from project img/ into wizkids/img/
 *
 * Usage:
 *   node scripts/sync-assistant-images.mjs
 *   node scripts/sync-assistant-images.mjs "/path/to/img"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_SRC = path.resolve(ROOT, '..', 'img');
const DEST = path.join(ROOT, 'img');
const PREFIXES = ['krishna', 'radha', 'rama', 'hanuman'];

function main() {
  const srcRoot = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SRC;
  if (!fs.existsSync(srcRoot)) {
    console.error('Source img folder not found:', srcRoot);
    process.exit(1);
  }

  let copied = 0;
  for (const name of fs.readdirSync(srcRoot)) {
    if (!/\.png$/i.test(name)) continue;
    const lower = name.toLowerCase();
    if (!PREFIXES.some(p => lower.startsWith(p + '-'))) continue;
    const dest = path.join(DEST, name);
    fs.copyFileSync(path.join(srcRoot, name), dest);
    console.log('  +', name);
    copied++;
  }
  console.log(`\nSynced ${copied} file(s) → ${DEST}`);
}

main();
