import { generateBoard } from '../src/board.js';
import { getInspectLayers } from '../src/render.js';

console.log('Testing Step 5 vocabulary, layouts, layers, and finishes...');

const stats = {
  objects: new Set(),
  items: new Set(),
  wallThings: new Set(),
  overheads: new Set(),
  surfaces: new Set(),
  wallFinishes: new Set(),
  lightingProfiles: new Set(),
  oddLayouts: new Set(),
  maxLayersEncountered: 0,
};

// Scan 500 boards across various seeds and coordinates
for (const seed of [5, 42, 108]) {
  for (let by = -5; by <= 5; by++) {
    for (let bx = -5; bx <= 5; bx++) {
      for (const z of [0, 1, 2]) {
        const board = generateBoard(seed, bx, by, z);

        for (const r of board.rooms) {
          if (r.wall) stats.wallFinishes.add(r.wall);
          if (r.lighting) stats.lightingProfiles.add(r.lighting);
          if (r.layout && [
            'chairStacks', 'tableStacks', 'chairsOnTables',
            'pushedAside', 'facingWall', 'ring'
          ].includes(r.layout)) {
            stats.oddLayouts.add(r.layout);
          }
        }

        for (let y = 0; y < board.cells.length; y++) {
          for (let x = 0; x < board.cells[0].length; x++) {
            const cell = board.cells[y][x];
            if (cell.surface) stats.surfaces.add(cell.surface.id);
            if (cell.object) stats.objects.add(cell.object.id);
            if (cell.item) stats.items.add(cell.item.id);
            if (cell.wallThing) stats.wallThings.add(cell.wallThing.id);
            if (cell.overhead) stats.overheads.add(cell.overhead.id);

            const layers = getInspectLayers(board, { x: 0, y: 0 }, x, y);
            if (layers.length > stats.maxLayersEncountered) {
              stats.maxLayersEncountered = layers.length;
            }
          }
        }
      }
    }
  }
}

console.log('\n--- Discovered Vocabulary ---');
console.log('Objects:', Array.from(stats.objects).sort().join(', '));
console.log('Items:', Array.from(stats.items).sort().join(', '));
console.log('Wall Things:', Array.from(stats.wallThings).sort().join(', '));
console.log('Overheads:', Array.from(stats.overheads).sort().join(', '));
console.log('Wall Finishes:', Array.from(stats.wallFinishes).sort().join(', '));
console.log('Lighting Profiles:', Array.from(stats.lightingProfiles).sort().join(', '));
console.log('Odd Layouts:', Array.from(stats.oddLayouts).sort().join(', '));
console.log('Max cell layers encountered on a single cell:', stats.maxLayersEncountered);

// Assert expectations
const requiredObjects = ['monobloc', 'table', 'bed', 'sofa', 'drawers', 'bucket', 'lpg', 'fan', 'toilet', 'column', 'cockroach', 'bench'];
const requiredItems = ['chair_on_table', 'pitcher', 'plate'];
const requiredWallThings = ['photo', 'outlet', 'mirror', 'wall_tv'];
const requiredOverheads = ['tube_light', 'bulb', 'sampayan'];
const requiredFinishes = ['foam_green_wall', 'yellow_wall', 'concrete_wall', 'beige_wall', 'offwhite_wall'];
const requiredLighting = ['daylight', 'overcast', 'shaded', 'dawn', 'dusk', 'blueHour', 'darkDay', 'night', 'deepNight'];
const requiredOddLayouts = ['chairStacks', 'tableStacks', 'chairsOnTables', 'pushedAside', 'facingWall', 'ring'];

let failed = false;
for (const obj of requiredObjects) {
  if (!stats.objects.has(obj)) { console.error('MISSING OBJECT:', obj); failed = true; }
}
for (const item of requiredItems) {
  if (!stats.items.has(item)) { console.error('MISSING ITEM:', item); failed = true; }
}
for (const wt of requiredWallThings) {
  if (!stats.wallThings.has(wt)) { console.error('MISSING WALL THING:', wt); failed = true; }
}
for (const oh of requiredOverheads) {
  if (!stats.overheads.has(oh)) { console.error('MISSING OVERHEAD:', oh); failed = true; }
}
for (const fin of requiredFinishes) {
  if (!stats.wallFinishes.has(fin)) { console.error('MISSING FINISH:', fin); failed = true; }
}
for (const light of requiredLighting) {
  if (!stats.lightingProfiles.has(light)) { console.error('MISSING LIGHTING:', light); failed = true; }
}
for (const lay of requiredOddLayouts) {
  if (!stats.oddLayouts.has(lay)) { console.error('MISSING ODD LAYOUT:', lay); failed = true; }
}

if (failed) {
  console.error('\nFAILED: Some vocabulary items or features were not encountered!');
  process.exit(1);
} else {
  console.log('\nSUCCESS: 100% of Step 5 vocabulary, layouts, finishes, and lighting profiles verified!');
}
