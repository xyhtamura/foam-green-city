// HTML syntax and script integrity check for foam-green-crawl.
// Ensures all scripts embedded in index.html are syntactically valid and free of duplicate declarations.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const HTML_FILE = path.join(ROOT, 'index.html');

console.log('Checking index.html script integrity...');

const content = fs.readFileSync(HTML_FILE, 'utf8');

// Match all script tags
const scriptRegex = /<script(?:\s+type="([^"]*)")?[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIndex = 0;
let hasError = false;

while ((match = scriptRegex.exec(content)) !== null) {
  scriptIndex++;
  const scriptType = match[1] || 'classic';
  const scriptBody = match[2];

  if (!scriptBody.trim()) continue;

  const tempFile = path.join(ROOT, `temp_check_script_${scriptIndex}.${scriptType === 'module' ? 'mjs' : 'cjs'}`);
  try {
    fs.writeFileSync(tempFile, scriptBody, 'utf8');
    const res = spawnSync(process.execPath, ['--check', tempFile], { encoding: 'utf8' });
    if (res.status !== 0) {
      console.error(`Syntax error in index.html script #${scriptIndex} (${scriptType}):`);
      console.error(res.stderr || res.stdout);
      hasError = true;
    } else {
      console.log(`  Script #${scriptIndex} (${scriptType}) passed syntax check.`);
    }
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

if (hasError) {
  console.error('\nFAILED: One or more scripts in index.html failed syntax check.');
  process.exit(1);
}

console.log('\nPASSED: All scripts in index.html are valid.');
