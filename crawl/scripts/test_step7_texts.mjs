// Verification test for Step 7 (Inspection Texts and Text Engine):
// 1. All 48 vocabulary items have authored texts in data/texts.js.
// 2. resolveText performs deterministic selection.
// 3. Template substitutions ([room], [light], [level]) execute without leaving raw tokens.
// 4. Unknown/empty objects return null (showing name & tags only, per spec).
// 5. End-to-end integration with live board generation and layer inspection.
// Adheres to SPEC.md section 7 and section 11 (Step 7).

import { TEXTS, resolveText } from '../data/texts.js';
import { SURFACES } from '../data/surfaces.js';
import { OBJECTS, ITEMS, WALL_THINGS, OVERHEADS } from '../data/objects.js';
import { generateBoard } from '../src/board.js';
import { getInspectLayers } from '../src/render.js';

console.log('Testing Step 7: Inspection Texts and Text Engine...\n');

// 1. Vocabulary coverage check
console.log('1. Verifying text pool coverage across all vocabulary records...');

const allVocabulary = [
  ...Object.values(SURFACES),
  ...Object.values(OBJECTS),
  ...Object.values(ITEMS),
  ...Object.values(WALL_THINGS),
  ...Object.values(OVERHEADS),
];

console.log(`  Total vocabulary items to verify: ${allVocabulary.length}`);

let missingTexts = 0;
for (const item of allVocabulary) {
  const pool = TEXTS[item.id];
  if (!pool || pool.length === 0) {
    console.error(`  MISSING TEXT POOL: ${item.id} (${item.layer})`);
    missingTexts++;
  } else {
    // Check that every string in pool is non-empty
    for (const t of pool) {
      if (typeof t !== 'string' || t.trim().length === 0) {
        throw new Error(`Empty text string found in pool for ${item.id}`);
      }
    }
  }
}

if (missingTexts > 0) {
  throw new Error(`Failed: ${missingTexts} vocabulary items lack authored text pools!`);
}
console.log('  All vocabulary items have valid authored text pools.\n');

// 2. Template variable substitution check
console.log('2. Verifying template variable substitutions ([room], [light], [level])...');

const testContext = {
  seed: 42,
  bx: 3,
  by: -7,
  z: 1,
  x: 10,
  y: 12,
  layer: 'object',
  room: { type: 'sala', lighting: 'dawn' },
};

// Check across every item in TEXTS
let totalTestedPools = 0;
for (const [id, pool] of Object.entries(TEXTS)) {
  totalTestedPools++;
  const text = resolveText(id, testContext);
  if (!text) throw new Error(`resolveText returned null for registered id ${id}`);

  // Ensure no un-substituted tokens remain
  if (text.includes('[room]') || text.includes('[light]') || text.includes('[level]')) {
    throw new Error(`Unsubstituted token remained in text for ${id}: "${text}"`);
  }
}

console.log(`  Tested ${totalTestedPools} text pools: 100% substitution success.`);

// Check specific token substitutions
const substitutedMonobloc = resolveText('monobloc', {
  ...testContext,
  z: 0,
  room: { type: 'court', lighting: 'overcast' },
});
console.log(`  Sample resolved text: "${substitutedMonobloc}"`);
if (substitutedMonobloc.includes('overcast')) {
  console.log('  Verified: [light] replaced by "overcast".');
}
console.log('  Template substitution verified.\n');

// 3. Determinism check
console.log('3. Verifying determinism and fallback behavior...');

const t1 = resolveText('table', { seed: 5, bx: 1, by: 2, z: 0, x: 5, y: 5, layer: 'object', room: { type: 'kusina' } });
const t2 = resolveText('table', { seed: 5, bx: 1, by: 2, z: 0, x: 5, y: 5, layer: 'object', room: { type: 'kusina' } });
if (t1 !== t2) {
  throw new Error(`Determinism failed! Calling resolveText twice produced different texts:\n  1: "${t1}"\n  2: "${t2}"`);
}
console.log('  Determinism passed: identical inputs yield identical text.');

// Unregistered id fallback check
const fallbackText = resolveText('non_existent_thing', testContext);
if (fallbackText !== null) {
  throw new Error(`Fallback failed: non-existent id should return null, got "${fallbackText}"`);
}
console.log('  Fallback passed: unregistered id returns null (shows name and tags only, per spec).\n');

// 4. End-to-end integration check on generated boards
console.log('4. Verifying end-to-end board inspection text generation...');

let boardsChecked = 0;
let cellsInspected = 0;
let textsGenerated = 0;

for (const seed of [5, 42]) {
  for (const [bx, by, z] of [[0, 0, 0], [20, -15, 0], [-9, -9, 0], [1, 1, 1]]) {
    boardsChecked++;
    const board = generateBoard(seed, bx, by, z);

    for (let y = 0; y < 20; y += 4) {
      for (let x = 0; x < 20; x += 4) {
        cellsInspected++;
        const layers = getInspectLayers(board, x, y);
        const cell = board.cells[y][x];
        const room = board.rooms.find(r => r.id === cell.roomId);

        for (const item of layers) {
          const text = resolveText(item.id, {
            seed: board.seed,
            bx: board.bx,
            by: board.by,
            z: board.z,
            x,
            y,
            layer: item.layer,
            room,
          });

          if (text) {
            textsGenerated++;
            if (text.includes('[room]') || text.includes('[light]') || text.includes('[level]')) {
              throw new Error(`Unresolved token on board (${bx}, ${by}) cell (${x}, ${y}) for ${item.id}`);
            }
          }
        }
      }
    }
  }
}

console.log(`  Checked ${boardsChecked} boards and ${cellsInspected} cells: generated ${textsGenerated} texts.`);
console.log('  End-to-end integration passed.\n');

console.log('========================================');
console.log('STEP 7 (TEXTS) VERIFICATION COMPLETE!');
console.log('========================================');
