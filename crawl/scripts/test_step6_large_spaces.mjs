// Verification test for Step 6 (Large Spaces):
// 1. Covered basketball court (18 by 28 m across 2x3 boards)
// 2. Yero walkway over open air (airwell, corrugated metal path, wooden planks, timber posts)
// 3. Multi-board open halls with continuous floor and edge agreement
// Adheres to SPEC.md section 5, 6, and 11 (Step 6).

import { generateBoard, BOARD_WIDTH, BOARD_HEIGHT, getEdge } from '../src/board.js';
import { getCourtInfo, isYeroBoard } from '../src/fields.js';

console.log('Testing Step 6: Large Spaces (Courts, Yero Walkways, Open Halls)...\n');

// --- 1. Basketball Court Verification ---
console.log('1. Verifying Covered Basketball Court (2x3 board cluster)...');

// Find a court anchor across seeds
let courtAnchor = null;
for (let seed of [5, 42, 108]) {
  for (let by = -20; by <= 20; by++) {
    for (let bx = -20; bx <= 20; bx++) {
      const c = getCourtInfo(bx, by, 0, seed);
      if (c && c.col === 0 && c.row === 0) {
        courtAnchor = { seed, bx, by, cx: c.cx, cy: c.cy };
        break;
      }
    }
    if (courtAnchor) break;
  }
  if (courtAnchor) break;
}

if (!courtAnchor) {
  throw new Error('Could not find a basketball court anchor in test lattice!');
}

console.log(`  Found court cluster at seed ${courtAnchor.seed}, anchor (${courtAnchor.cx}, ${courtAnchor.cy})`);

// Verify all 6 boards in the 2x3 cluster
const clusterBoards = [];
for (let r = 0; r < 3; r++) {
  const rowList = [];
  for (let c = 0; c < 2; c++) {
    const bx = courtAnchor.cx + c;
    const by = courtAnchor.cy + r;
    const board = generateBoard(courtAnchor.seed, bx, by, 0);
    if (board.rooms.length !== 1 || board.rooms[0].type !== 'court') {
      throw new Error(`Board (${bx}, ${by}) in court cluster is not a court room!`);
    }
    rowList.push(board);
  }
  clusterBoards.push(rowList);
}

// Check internal edge openness between cluster boards
// Horizontal internal edge between row 0 and 1, and row 1 and 2
for (let r = 0; r < 2; r++) {
  for (let c = 0; c < 2; c++) {
    const topBoard = clusterBoards[r][c];
    const botBoard = clusterBoards[r + 1][c];
    if (!topBoard.edges.south.isOpen || !botBoard.edges.north.isOpen) {
      throw new Error(`Seam between row ${r} and row ${r + 1} at col ${c} is not open!`);
    }
    // Verify seam cells are walkable floor
    for (let x = 1; x < BOARD_WIDTH - 1; x++) {
      if (topBoard.cells[BOARD_HEIGHT - 1][x].solid || botBoard.cells[0][x].solid) {
        throw new Error(`Seam cell at x=${x} between row ${r} and ${r + 1} is unexpectedly solid!`);
      }
    }
  }
}

// Vertical internal edge between col 0 and 1
for (let r = 0; r < 3; r++) {
  const leftBoard = clusterBoards[r][0];
  const rightBoard = clusterBoards[r][1];
  if (!leftBoard.edges.east.isOpen || !rightBoard.edges.west.isOpen) {
    throw new Error(`Seam between col 0 and col 1 at row ${r} is not open!`);
  }
  for (let y = 1; y < BOARD_HEIGHT - 1; y++) {
    if (leftBoard.cells[y][BOARD_WIDTH - 1].solid || rightBoard.cells[y][0].solid) {
      throw new Error(`Seam cell at y=${y} between col 0 and 1 is unexpectedly solid!`);
    }
  }
}

// Verify court markings and fixtures
const courtFeatures = {
  court_floor: 0,
  court_line: 0,
  court_key: 0,
  hoop: 0,
  bleacher: 0,
  basketball: 0,
  truss: 0,
  banderitas: 0,
};

for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 2; c++) {
    const board = clusterBoards[r][c];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = board.cells[y][x];
        if (courtFeatures[cell.surface.id] !== undefined) courtFeatures[cell.surface.id]++;
        if (cell.object && courtFeatures[cell.object.id] !== undefined) courtFeatures[cell.object.id]++;
        if (cell.item && courtFeatures[cell.item.id] !== undefined) courtFeatures[cell.item.id]++;
        if (cell.overhead && courtFeatures[cell.overhead.id] !== undefined) courtFeatures[cell.overhead.id]++;
      }
    }
  }
}

console.log('  Court cluster features:');
for (const [k, v] of Object.entries(courtFeatures)) {
  console.log(`    ${k}: ${v}`);
  if (v === 0) throw new Error(`Missing expected court feature: ${k}`);
}
console.log('  Court cluster verification passed.\n');

// --- 2. Yero Walkway Verification ---
console.log('2. Verifying Yero Walkway over Open Air...');

let yeroBoardPos = null;
for (let seed of [5, 42, 108]) {
  for (let by = -20; by <= 20; by++) {
    for (let bx = -20; bx <= 20; bx++) {
      if (isYeroBoard(bx, by, 0, seed)) {
        yeroBoardPos = { seed, bx, by };
        break;
      }
    }
    if (yeroBoardPos) break;
  }
  if (yeroBoardPos) break;
}

if (!yeroBoardPos) {
  throw new Error('Could not find a yero walkway board in test lattice!');
}

console.log(`  Found yero walkway at seed ${yeroBoardPos.seed}, (${yeroBoardPos.bx}, ${yeroBoardPos.by})`);
const yeroBoard = generateBoard(yeroBoardPos.seed, yeroBoardPos.bx, yeroBoardPos.by, 0);

if (yeroBoard.rooms.length !== 1 || yeroBoard.rooms[0].type !== 'yero_walkway') {
  throw new Error('Yero board room type is not yero_walkway!');
}

const yeroFeatures = {
  airwell: 0,
  yero_floor: 0,
  wood_plank: 0,
  grass: 0,
  wire_run: 0,
};

for (let y = 0; y < BOARD_HEIGHT; y++) {
  for (let x = 0; x < BOARD_WIDTH; x++) {
    const cell = yeroBoard.cells[y][x];
    if (yeroFeatures[cell.surface.id] !== undefined) yeroFeatures[cell.surface.id]++;
    if (cell.item && yeroFeatures[cell.item.id] !== undefined) yeroFeatures[cell.item.id]++;
    if (cell.overhead && yeroFeatures[cell.overhead.id] !== undefined) yeroFeatures[cell.overhead.id]++;
  }
}

console.log('  Yero walkway features:');
for (const [k, v] of Object.entries(yeroFeatures)) {
  console.log(`    ${k}: ${v}`);
  if (v === 0) throw new Error(`Missing expected yero feature: ${k}`);
}

// Verify majority of board is open airwell void
if (yeroFeatures.airwell < 200) {
  throw new Error(`Yero board has too few airwell cells (${yeroFeatures.airwell})`);
}
console.log('  Yero walkway verification passed.\n');

// --- 3. Open Halls Verification ---
console.log('3. Verifying Multi-Board Open Halls...');

let openHallPair = null;
for (let seed of [5, 42, 108]) {
  for (let by = -20; by <= 20; by++) {
    for (let bx = -20; bx <= 20; bx++) {
      const edge = getEdge('V', bx, by, 0, seed);
      if (edge.isOpen && !getCourtInfo(bx, by, 0, seed)) {
        openHallPair = { seed, bx, by, type: 'V' };
        break;
      }
    }
    if (openHallPair) break;
  }
  if (openHallPair) break;
}

if (!openHallPair) {
  throw new Error('Could not find an open hall pair in test lattice!');
}

console.log(`  Found open hall pair at seed ${openHallPair.seed}, (${openHallPair.bx}, ${openHallPair.by}) <-> (${openHallPair.bx + 1}, ${openHallPair.by})`);
const hLeft = generateBoard(openHallPair.seed, openHallPair.bx, openHallPair.by, 0);
const hRight = generateBoard(openHallPair.seed, openHallPair.bx + 1, openHallPair.by, 0);

// Both should have open perimeter edge cells
for (let y = 1; y < BOARD_HEIGHT - 1; y++) {
  const c1 = hLeft.cells[y][BOARD_WIDTH - 1];
  const c2 = hRight.cells[y][0];
  if (c1.solid || c2.solid) {
    throw new Error(`Open hall edge cell at y=${y} is unexpectedly solid!`);
  }
}
console.log('  Open halls verification passed.\n');

console.log('========================================');
console.log('STEP 6 (LARGE SPACES) VERIFICATION COMPLETE!');
console.log('========================================');
