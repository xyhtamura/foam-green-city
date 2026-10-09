// Stillness enforcement check for foam-green-crawl.
// Adheres to SPEC.md section 4 and section 10:
// "scripts/check_still.mjs searches index.html, style.css, and src/ for
// requestAnimationFrame, setInterval, setTimeout, animation, and transition,
// and fails on any match."

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const FORBIDDEN = [
  'requestAnimationFrame',
  'setInterval',
  'setTimeout',
  'animation',
  'transition',
];

const TARGET_PATHS = [
  path.join(ROOT, 'index.html'),
  path.join(ROOT, 'style.css'),
  path.join(ROOT, 'src'),
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];

  for (const word of FORBIDDEN) {
    // Word boundary or property regex
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    let match;
    while ((match = regex.exec(content)) !== null) {
      // Find line number
      const line = content.substring(0, match.index).split('\n').length;
      violations.push({ word, line });
    }
  }

  return violations;
}

function scanDir(dirPath) {
  const results = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...scanDir(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.css') || entry.name.endsWith('.html'))) {
      const v = scanFile(fullPath);
      if (v.length > 0) {
        results.push({ file: fullPath, violations: v });
      }
    }
  }
  return results;
}

function runStillCheck() {
  console.log('Running stillness check...');
  const allViolations = [];

  for (const target of TARGET_PATHS) {
    if (!fs.existsSync(target)) continue;
    const stat = fs.statSync(target);
    if (stat.isDirectory()) {
      allViolations.push(...scanDir(target));
    } else if (stat.isFile()) {
      const v = scanFile(target);
      if (v.length > 0) {
        allViolations.push({ file: target, violations: v });
      }
    }
  }

  if (allViolations.length > 0) {
    console.error('STILLNESS CHECK FAILED! Forbidden dynamic mechanisms found:');
    for (const item of allViolations) {
      const rel = path.relative(ROOT, item.file);
      for (const v of item.violations) {
        console.error(`  ${rel}:${v.line} -> matches forbidden "${v.word}"`);
      }
    }
    process.exit(1);
  }

  console.log('STILLNESS CHECK PASSED: zero animations, transitions, or timer loops detected.\n');
}

runStillCheck();
