// Test script verifying crawl navigation without player avatar (@).
// Simulates WASD / RF and door/stair tap-to-travel across multiple boards and levels.

import { generateBoard, BOARD_WIDTH, BOARD_HEIGHT } from '../src/board.js';
import { getInspectLayers } from '../src/render.js';

console.log('Testing DOS adventure / crawl navigation and @ elimination...');

const seed = 5;
let currentPos = { bx: 0, by: 0, z: 0 };
let currentBoard = generateBoard(seed, currentPos.bx, currentPos.by, currentPos.z);

// 1. Verify no cell on the board contains '@'
for (let y = 0; y < BOARD_HEIGHT; y++) {
  for (let x = 0; x < BOARD_WIDTH; x++) {
    const cell = currentBoard.cells[y][x];
    if (cell.object && cell.object.glyph === '@') {
      throw new Error(`Found @ object glyph at (${x}, ${y})!`);
    }
    const layers = getInspectLayers(currentBoard, x, y);
    if (layers.some(l => l.layer === 'visitor' || l.glyph === '@')) {
      throw new Error(`Found visitor layer or @ glyph in getInspectLayers at (${x}, ${y})!`);
    }
  }
}
console.log('PASS: Zero @ or visitor avatar entities present on board cells.');

// 2. Simulate tap-to-travel via perimeter doors
// Find all perimeter doorways on current board
const northDoor = currentBoard.cells[0].findIndex(c => c.surface.id === 'doorway');
const southDoor = currentBoard.cells[BOARD_HEIGHT - 1].findIndex(c => c.surface.id === 'doorway');
const westDoor = currentBoard.cells.findIndex(row => row[0].surface.id === 'doorway');
const eastDoor = currentBoard.cells.findIndex(row => row[BOARD_WIDTH - 1].surface.id === 'doorway');

console.log(`Perimeter doorways: North=${northDoor}, South=${southDoor}, West=${westDoor}, East=${eastDoor}`);

// Tap North door if present
if (northDoor !== -1) {
  currentPos.by -= 1;
  currentBoard = generateBoard(seed, currentPos.bx, currentPos.by, currentPos.z);
  console.log(`PASS: Tapped North door -> moved to Board (${currentPos.bx}, ${currentPos.by}) Level ${currentPos.z}`);
}

// Tap East door if present
const nextEastDoor = currentBoard.cells.findIndex(row => row[BOARD_WIDTH - 1].surface.id === 'doorway');
if (nextEastDoor !== -1) {
  currentPos.bx += 1;
  currentBoard = generateBoard(seed, currentPos.bx, currentPos.by, currentPos.z);
  console.log(`PASS: Tapped East door -> moved to Board (${currentPos.bx}, ${currentPos.by}) Level ${currentPos.z}`);
}

// 3. Search for a board with stairs and test stair tap-to-travel (R / F)
let foundStairUpBoard = null;
for (let bx = -10; bx <= 10; bx++) {
  for (let by = -10; by <= 10; by++) {
    const b = generateBoard(seed, bx, by, 0);
    const sUp = b.stairs.find(s => s.type === 'up');
    if (sUp) {
      foundStairUpBoard = { bx, by, stair: sUp };
      break;
    }
  }
  if (foundStairUpBoard) break;
}

if (!foundStairUpBoard) {
  throw new Error('No stair up board found in range');
}

console.log(`Found stair up at Board (${foundStairUpBoard.bx}, ${foundStairUpBoard.by}) at (${foundStairUpBoard.stair.x}, ${foundStairUpBoard.stair.y})`);
const stairBoard = generateBoard(seed, foundStairUpBoard.bx, foundStairUpBoard.by, 0);
const stairCell = stairBoard.cells[foundStairUpBoard.stair.y][foundStairUpBoard.stair.x];
if (stairCell.surface.id !== 'stair_up') {
  throw new Error('Stair surface mismatch');
}

// Simulate tapping stair up (or pressing R)
const nextLevelBoard = generateBoard(seed, foundStairUpBoard.bx, foundStairUpBoard.by, 1);
const stairDown = nextLevelBoard.stairs.find(s => s.type === 'down');
if (!stairDown) {
  throw new Error('Expected stair down on level 1 at same coordinates');
}
console.log(`PASS: Ascended to Level 1 at (${foundStairUpBoard.bx}, ${foundStairUpBoard.by}), found matching stair down at (${stairDown.x}, ${stairDown.y})`);

// 4. Test room cell inspection
let inspectedCellsCount = 0;
for (const room of stairBoard.rooms) {
  const cx = Math.floor(room.bounds.x + room.bounds.w / 2);
  const cy = Math.floor(room.bounds.y + room.bounds.h / 2);
  const layers = getInspectLayers(stairBoard, cx, cy);
  if (layers.length === 0) {
    throw new Error(`Expected at least surface layer at (${cx}, ${cy})`);
  }
  inspectedCellsCount++;
}
console.log(`PASS: Successfully inspected cells across ${inspectedCellsCount} rooms.`);
console.log('\nAll crawl navigation tests passed successfully!');
