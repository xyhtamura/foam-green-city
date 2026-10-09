// Seeded furniture layout placement for foam-green-crawl rooms.
// Places the six domestic object types using the six ordinary layouts.
// Preserves doorway keep-out zones and walking aisles so that all walkable
// floor cells remain 100% connected and reachable.
// Aligned with SPEC.md sections 2, 5, 6, and 11.

import { unit3, pick } from './hash.js';
import { OBJECTS, ITEMS, WALL_THINGS, OVERHEADS } from '../data/objects.js';
import { BOARD_WIDTH, BOARD_HEIGHT } from './board.js';

export const ORDINARY_LAYOUT_IDS = [
  'pairedDining',
  'chairRows',
  'tableRows',
  'perimeter',
  'gathered',
  'sparse',
];

export const ODD_LAYOUT_IDS = [
  'chairStacks',
  'tableStacks',
  'chairsOnTables',
  'pushedAside',
  'facingWall',
  'ring',
];

export const LAYOUT_IDS = [...ORDINARY_LAYOUT_IDS, ...ODD_LAYOUT_IDS];

const ORDINARY_LAYOUTS_BY_ROOM = {
  sala: ['pairedDining', 'pairedDining', 'perimeter', 'sparse', 'gathered'],
  kitchen: ['pairedDining', 'tableRows', 'sparse', 'gathered'],
  bedroom: ['sparse', 'sparse', 'pairedDining'],
  bathroom: ['sparse'],
  bare: ['sparse'],
  hall: ['sparse', 'sparse', 'perimeter', 'chairRows', 'gathered'],
  auditorium: ['chairRows'],
};

// Find all doorway and stair landing cells inside the room
function getRoomLandings(board, room) {
  const b = room.bounds;
  const landings = [];

  // North edge
  if (b.y > 0) {
    for (let x = b.x; x < b.x + b.w; x++) {
      if (board.cells[b.y - 1][x].surface.id === 'doorway' || !board.cells[b.y - 1][x].solid) {
        landings.push({ x, y: b.y, fromY: b.y - 1, fromX: x });
      }
    }
  }
  // South edge
  if (b.y + b.h < BOARD_HEIGHT) {
    for (let x = b.x; x < b.x + b.w; x++) {
      if (board.cells[b.y + b.h][x].surface.id === 'doorway' || !board.cells[b.y + b.h][x].solid) {
        landings.push({ x, y: b.y + b.h - 1, fromY: b.y + b.h, fromX: x });
      }
    }
  }
  // West edge
  if (b.x > 0) {
    for (let y = b.y; y < b.y + b.h; y++) {
      if (board.cells[y][b.x - 1].surface.id === 'doorway' || !board.cells[y][b.x - 1].solid) {
        landings.push({ x: b.x, y, fromX: b.x - 1, fromY: y });
      }
    }
  }
  // East edge
  if (b.x + b.w < BOARD_WIDTH) {
    for (let y = b.y; y < b.y + b.h; y++) {
      if (board.cells[y][b.x + b.w].surface.id === 'doorway' || !board.cells[y][b.x + b.w].solid) {
        landings.push({ x: b.x + b.w - 1, y, fromX: b.x + b.w, fromY: y });
      }
    }
  }

  // Include any stairs in this room
  if (board.stairs) {
    for (const stair of board.stairs) {
      if (stair.x >= b.x && stair.x < b.x + b.w && stair.y >= b.y && stair.y < b.y + b.h) {
        landings.push({
          x: stair.landingX,
          y: stair.landingY,
          fromX: stair.x,
          fromY: stair.y,
        });
      }
    }
  }

  return landings;
}

// Check if placing an object on cells preserves room floor reachability
function canPlacePieces(board, room, landings, candidatePositions) {
  const b = room.bounds;

  // 1. Boundary & landing keep-out check
  for (const pos of candidatePositions) {
    if (pos.x < b.x || pos.x >= b.x + b.w || pos.y < b.y || pos.y >= b.y + b.h) {
      return false;
    }
    const cell = board.cells[pos.y][pos.x];
    if (cell.solid || cell.object !== null) {
      return false;
    }
    // Never place on stair cells
    if (cell.surface.id === 'stair_up' || cell.surface.id === 'stair_down') {
      return false;
    }
    // Cannot place on landing cell or 1-cell step directly inside landing
    for (const l of landings) {
      if (pos.x === l.x && pos.y === l.y) return false;
      // Step in front of landing
      const stepX = l.x + (l.fromX !== undefined ? (l.x - l.fromX) : 0);
      const stepY = l.y + (l.fromY !== undefined ? (l.y - l.fromY) : 0);
      if (pos.x === stepX && pos.y === stepY) return false;
    }
  }

  // 2. Tentatively place
  for (const pos of candidatePositions) {
    board.cells[pos.y][pos.x].solid = true;
  }

  // 3. Flood-fill test across room floor
  let totalWalkableInRoom = 0;
  let startX = -1;
  let startY = -1;

  for (let y = b.y; y < b.y + b.h; y++) {
    for (let x = b.x; x < b.x + b.w; x++) {
      if (!board.cells[y][x].solid) {
        totalWalkableInRoom++;
        if (startX === -1) {
          startX = x;
          startY = y;
        }
      }
    }
  }

  // If room has landings, start from the first landing
  if (landings.length > 0) {
    startX = landings[0].x;
    startY = landings[0].y;
  }

  let reachableCount = 0;
  let isSafe = false;

  if (totalWalkableInRoom > 0 && startX !== -1 && !board.cells[startY][startX].solid) {
    const visited = new Uint8Array(BOARD_WIDTH * BOARD_HEIGHT);
    const queue = [startX, startY];
    visited[startY * BOARD_WIDTH + startX] = 1;

    let head = 0;
    while (head < queue.length) {
      const cx = queue[head++];
      const cy = queue[head++];
      reachableCount++;

      const nbs = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1],
      ];
      for (const [nx, ny] of nbs) {
        if (nx >= b.x && nx < b.x + b.w && ny >= b.y && ny < b.y + b.h) {
          const idx = ny * BOARD_WIDTH + nx;
          if (!visited[idx] && !board.cells[ny][nx].solid) {
            visited[idx] = 1;
            queue.push(nx, ny);
          }
        }
      }
    }

    // Must reach every other landing
    let allLandingsReachable = true;
    for (const l of landings) {
      if (!visited[l.y * BOARD_WIDTH + l.x]) {
        allLandingsReachable = false;
        break;
      }
    }

    if (allLandingsReachable && reachableCount === totalWalkableInRoom) {
      isSafe = true;
    }
  }

  // 4. Revert tentative placement
  for (const pos of candidatePositions) {
    board.cells[pos.y][pos.x].solid = false;
  }

  return isSafe;
}

function placePiece(board, x, y, objectDef) {
  const cell = board.cells[y][x];
  cell.object = objectDef;
  cell.solid = objectDef.solid;
}

function placeItem(board, x, y, itemDef) {
  const cell = board.cells[y][x];
  cell.item = itemDef;
  if (itemDef.solid) cell.solid = true;
}

function placeOverhead(board, x, y, overheadDef) {
  const cell = board.cells[y][x];
  cell.overhead = overheadDef;
}

function placeWallThing(board, x, y, wallThingDef) {
  const cell = board.cells[y][x];
  cell.wallThing = wallThingDef;
  cell.solid = true;
}

export function furnishRoom(board, room, seed) {
  // Basketball courts and yero walkways have their own dedicated architectural layout
  if (room.court || room.type === 'court' || room.type === 'yero_walkway') {
    return;
  }

  const b = room.bounds;
  const landings = getRoomLandings(board, room);

  const r = (salt) => unit3(b.x, b.y, board.z, seed * 71 + salt);

  // Pick layout: check for odd layout under strangeness / probability
  let layout;
  const isOdd = room.type !== 'bathroom' && room.type !== 'auditorium' && (r(23) < 0.07 + board.strange * 0.5);
  if (isOdd) {
    layout = pick(ODD_LAYOUT_IDS, r(24));
  } else {
    const allowed = ORDINARY_LAYOUTS_BY_ROOM[room.type] || ['sparse'];
    layout = pick(allowed, r(1));
  }
  room.layout = layout;

  switch (layout) {
    case 'pairedDining': {
      // 1 or 2 dining sets: a table + 2 to 4 monobloc chairs
      const numSets = (b.w >= 14 && b.h >= 10 && r(2) < 0.5) ? 2 : 1;
      for (let s = 0; s < numSets; s++) {
        const offX = s === 0 ? Math.floor(b.w * 0.3) : Math.floor(b.w * 0.7);
        const tx = b.x + offX;
        const ty = b.y + Math.floor(b.h * 0.5);

        // Try candidate table + chairs
        const candidates = [
          { x: tx, y: ty, obj: OBJECTS.table },
          { x: tx + 1, y: ty, obj: OBJECTS.table },
          { x: tx, y: ty - 1, obj: OBJECTS.monobloc },
          { x: tx + 1, y: ty - 1, obj: OBJECTS.monobloc },
          { x: tx, y: ty + 1, obj: OBJECTS.monobloc },
          { x: tx + 1, y: ty + 1, obj: OBJECTS.monobloc },
        ];

        // Place pieces that pass reachability
        for (const item of candidates) {
          if (canPlacePieces(board, room, landings, [{ x: item.x, y: item.y }])) {
            placePiece(board, item.x, item.y, item.obj);
          }
        }
      }
      break;
    }

    case 'chairRows': {
      // Auditorium/hall seating: rows of chairs on left and right, leaving center aisle
      const centerAisleX = b.x + Math.floor(b.w / 2);
      for (let y = b.y + 2; y < b.y + b.h - 2; y += 2) {
        // Left chairs
        for (let x = b.x + 1; x < centerAisleX - 1; x++) {
          if (canPlacePieces(board, room, landings, [{ x, y }])) {
            placePiece(board, x, y, OBJECTS.monobloc);
          }
        }
        // Right chairs
        for (let x = centerAisleX + 2; x < b.x + b.w - 1; x++) {
          if (canPlacePieces(board, room, landings, [{ x, y }])) {
            placePiece(board, x, y, OBJECTS.monobloc);
          }
        }
      }
      break;
    }

    case 'tableRows': {
      // Runs of tables along length with chairs
      const startY = b.y + Math.floor(b.h * 0.4);
      for (let x = b.x + 2; x < b.x + b.w - 3; x += 3) {
        if (canPlacePieces(board, room, landings, [{ x, y: startY }, { x: x + 1, y: startY }])) {
          placePiece(board, x, startY, OBJECTS.table);
          placePiece(board, x + 1, startY, OBJECTS.table);

          // Chair above
          if (canPlacePieces(board, room, landings, [{ x, y: startY - 1 }])) {
            placePiece(board, x, startY - 1, OBJECTS.monobloc);
          }
          // Chair below
          if (canPlacePieces(board, room, landings, [{ x: x + 1, y: startY + 1 }])) {
            placePiece(board, x + 1, startY + 1, OBJECTS.monobloc);
          }
        }
      }
      break;
    }

    case 'perimeter': {
      // Seating and storage along walls
      // Sofa along North or South wall
      const sofaX = b.x + 2;
      const sofaY = b.y + 1;
      if (canPlacePieces(board, room, landings, [{ x: sofaX, y: sofaY }, { x: sofaX + 1, y: sofaY }])) {
        placePiece(board, sofaX, sofaY, OBJECTS.sofa);
        placePiece(board, sofaX + 1, sofaY, OBJECTS.sofa);
      }

      // Drawers in a corner
      const drawX = b.x + b.w - 2;
      const drawY = b.y + 1;
      if (canPlacePieces(board, room, landings, [{ x: drawX, y: drawY }])) {
        placePiece(board, drawX, drawY, OBJECTS.drawers);
      }

      // Monobloc chairs along opposite wall
      for (let x = b.x + 3; x < b.x + b.w - 3; x += 2) {
        const cy = b.y + b.h - 2;
        if (canPlacePieces(board, room, landings, [{ x, y: cy }])) {
          placePiece(board, x, cy, OBJECTS.monobloc);
        }
      }
      break;
    }

    case 'gathered': {
      // Central cluster of tables and chairs
      const cx = b.x + Math.floor(b.w / 2);
      const cy = b.y + Math.floor(b.h / 2);

      const tableGroup = [
        { x: cx, y: cy, obj: OBJECTS.table },
        { x: cx + 1, y: cy, obj: OBJECTS.table },
      ];
      for (const item of tableGroup) {
        if (canPlacePieces(board, room, landings, [{ x: item.x, y: item.y }])) {
          placePiece(board, item.x, item.y, item.obj);
        }
      }

      // Chairs gathered around
      const surroundingChairs = [
        { x: cx - 1, y: cy },
        { x: cx + 2, y: cy },
        { x: cx, y: cy - 1 },
        { x: cx + 1, y: cy - 1 },
        { x: cx, y: cy + 1 },
        { x: cx + 1, y: cy + 1 },
      ];
      for (const ch of surroundingChairs) {
        if (canPlacePieces(board, room, landings, [{ x: ch.x, y: ch.y }])) {
          placePiece(board, ch.x, ch.y, OBJECTS.monobloc);
        }
      }

      // Nearby bucket or drawers
      if (canPlacePieces(board, room, landings, [{ x: cx - 2, y: cy + 1 }])) {
        placePiece(board, cx - 2, cy + 1, r(10) < 0.5 ? OBJECTS.drawers : OBJECTS.bucket);
      }
      break;
    }

    case 'sparse':
    default: {
      if (room.type === 'bathroom') {
        // Toilet and bucket
        const bx = b.x + 1;
        const by = b.y + 1;
        if (canPlacePieces(board, room, landings, [{ x: bx, y: by }])) {
          placePiece(board, bx, by, OBJECTS.toilet);
        }
        if (canPlacePieces(board, room, landings, [{ x: bx + 1, y: by }])) {
          placePiece(board, bx + 1, by, OBJECTS.bucket);
        }
        if (b.w >= 6 && canPlacePieces(board, room, landings, [{ x: b.x + b.w - 2, y: by }])) {
          placePiece(board, b.x + b.w - 2, by, OBJECTS.drawers);
        }
      } else if (room.type === 'bedroom') {
        // Bed along a wall, plastic drawers beside it
        const bedX = b.x + 1;
        const bedY = b.y + 1;
        if (canPlacePieces(board, room, landings, [{ x: bedX, y: bedY }, { x: bedX + 1, y: bedY }])) {
          placePiece(board, bedX, bedY, OBJECTS.bed);
          placePiece(board, bedX + 1, bedY, OBJECTS.bed);
        }
        if (canPlacePieces(board, room, landings, [{ x: bedX + 2, y: bedY }])) {
          placePiece(board, bedX + 2, bedY, OBJECTS.drawers);
        }
        // One chair
        const chairX = b.x + b.w - 2;
        const chairY = b.y + b.h - 2;
        if (canPlacePieces(board, room, landings, [{ x: chairX, y: chairY }])) {
          placePiece(board, chairX, chairY, OBJECTS.monobloc);
        }
      } else {
        // One isolated table with a chair, or isolated sofa
        const midX = b.x + Math.floor(b.w / 2);
        const midY = b.y + Math.floor(b.h / 2);

        if (r(5) < 0.5) {
          if (canPlacePieces(board, room, landings, [{ x: midX, y: midY }, { x: midX + 1, y: midY }])) {
            placePiece(board, midX, midY, OBJECTS.table);
            placePiece(board, midX + 1, midY, OBJECTS.table);
            if (canPlacePieces(board, room, landings, [{ x: midX, y: midY - 1 }])) {
              placePiece(board, midX, midY - 1, OBJECTS.monobloc);
            }
          }
        } else {
          if (canPlacePieces(board, room, landings, [{ x: midX, y: midY }, { x: midX + 1, y: midY }])) {
            placePiece(board, midX, midY, OBJECTS.sofa);
            placePiece(board, midX + 1, midY, OBJECTS.sofa);
          }
        }
        // Occasional bucket in corner
        if (r(6) < 0.35 && canPlacePieces(board, room, landings, [{ x: b.x + 1, y: b.y + b.h - 2 }])) {
          placePiece(board, b.x + 1, b.y + b.h - 2, OBJECTS.bucket);
        }
      }
      break;
    }

    case 'chairStacks': {
      // Stacked chairs along walls
      const wallY = (r(25) < 0.5) ? b.y + 1 : b.y + b.h - 2;
      for (let x = b.x + 2; x < b.x + b.w - 2; x++) {
        if (canPlacePieces(board, room, landings, [{ x, y: wallY }])) {
          placePiece(board, x, wallY, OBJECTS.monobloc);
        }
      }
      break;
    }

    case 'tableStacks': {
      // Tables grouped together tightly
      const cx = b.x + Math.floor(b.w / 2);
      const cy = b.y + Math.floor(b.h / 2);
      const candidates = [
        { x: cx, y: cy },
        { x: cx + 1, y: cy },
        { x: cx, y: cy + 1 },
        { x: cx + 1, y: cy + 1 },
      ];
      for (const pos of candidates) {
        if (canPlacePieces(board, room, landings, [pos])) {
          placePiece(board, pos.x, pos.y, OBJECTS.table);
          if (r(26) < 0.5) {
            placeItem(board, pos.x, pos.y, ITEMS.plate);
          }
        }
      }
      break;
    }

    case 'chairsOnTables': {
      // Chairs put up on tables
      const cx = b.x + Math.floor(b.w / 2);
      const cy = b.y + Math.floor(b.h / 2);
      const tableCells = [
        { x: cx, y: cy },
        { x: cx + 1, y: cy },
      ];
      for (const pos of tableCells) {
        if (canPlacePieces(board, room, landings, [pos])) {
          placePiece(board, pos.x, pos.y, OBJECTS.table);
          placeItem(board, pos.x, pos.y, ITEMS.chair_on_table);
        }
      }
      break;
    }

    case 'pushedAside': {
      // Everything pushed to one wall
      const useLeft = r(27) < 0.5;
      const targetX = useLeft ? b.x + 1 : b.x + b.w - 2;
      for (let y = b.y + 2; y < b.y + b.h - 2; y += 2) {
        if (canPlacePieces(board, room, landings, [{ x: targetX, y }])) {
          placePiece(board, targetX, y, r(28) < 0.5 ? OBJECTS.table : OBJECTS.monobloc);
        }
      }
      break;
    }

    case 'facingWall': {
      // Chairs facing a side wall
      const chairX = b.x + 2;
      for (let y = b.y + 2; y < b.y + b.h - 2; y += 2) {
        if (canPlacePieces(board, room, landings, [{ x: chairX, y }])) {
          placePiece(board, chairX, y, OBJECTS.monobloc);
        }
      }
      break;
    }

    case 'ring': {
      // Ring of chairs in center facing inward
      const cx = b.x + Math.floor(b.w / 2);
      const cy = b.y + Math.floor(b.h / 2);
      const ringCells = [
        { x: cx - 1, y: cy },
        { x: cx + 1, y: cy },
        { x: cx, y: cy - 1 },
        { x: cx, y: cy + 1 },
        { x: cx - 1, y: cy - 1 },
        { x: cx + 1, y: cy - 1 },
        { x: cx - 1, y: cy + 1 },
        { x: cx + 1, y: cy + 1 },
      ];
      for (const pos of ringCells) {
        if (canPlacePieces(board, room, landings, [pos])) {
          placePiece(board, pos.x, pos.y, OBJECTS.monobloc);
        }
      }
      break;
    }
  }

  // Room-specific fixtures
  if (room.type === 'kitchen') {
    // LPG cylinder near table or wall
    const lpgX = b.x + 1;
    const lpgY = b.y + b.h - 2;
    if (canPlacePieces(board, room, landings, [{ x: lpgX, y: lpgY }])) {
      placePiece(board, lpgX, lpgY, OBJECTS.lpg);
    }
    // Items on tables in kitchen
    for (let cy = b.y; cy < b.y + b.h; cy++) {
      for (let cx = b.x; cx < b.x + b.w; cx++) {
        const cell = board.cells[cy][cx];
        if (cell.object && cell.object.id === 'table' && !cell.item) {
          if (r(30) < 0.6) {
            placeItem(board, cx, cy, (cx % 2 === 0) ? ITEMS.pitcher : ITEMS.plate);
          }
        }
      }
    }
  } else if (room.type === 'bathroom') {
    // Toilet against wall
    const toiletX = b.x + 1;
    const toiletY = b.y + 1;
    if (canPlacePieces(board, room, landings, [{ x: toiletX, y: toiletY }])) {
      placePiece(board, toiletX, toiletY, OBJECTS.toilet);
    }
    // Bucket beside toilet
    if (canPlacePieces(board, room, landings, [{ x: toiletX + 1, y: toiletY }])) {
      placePiece(board, toiletX + 1, toiletY, OBJECTS.bucket);
    }
  } else if (room.type === 'bedroom') {
    // Fan near bed or corner
    const fanX = b.x + b.w - 2;
    const fanY = b.y + 1;
    if (canPlacePieces(board, room, landings, [{ x: fanX, y: fanY }])) {
      placePiece(board, fanX, fanY, OBJECTS.fan);
    }
  } else if (room.type === 'sala') {
    // Electric fan in corner
    if (r(31) < 0.6) {
      const fanX = b.x + 1;
      const fanY = b.y + b.h - 2;
      if (canPlacePieces(board, room, landings, [{ x: fanX, y: fanY }])) {
        placePiece(board, fanX, fanY, OBJECTS.fan);
      }
    }
  }

  // Column in halls, large spaces, or unusual spaces
  if (room.type === 'hall' || room.category === 'very_large' || (room.category === 'unusual' && r(32) < 0.35)) {
    if (room.type === 'hall' && b.w >= 8 && b.h >= 8) {
      for (let cy = b.y + 3; cy <= b.y + b.h - 4; cy += 4) {
        if (canPlacePieces(board, room, landings, [{ x: b.x + 3, y: cy }])) {
          placePiece(board, b.x + 3, cy, OBJECTS.column);
        }
        if (canPlacePieces(board, room, landings, [{ x: b.x + b.w - 4, y: cy }])) {
          placePiece(board, b.x + b.w - 4, cy, OBJECTS.column);
        }
      }
    } else {
      const cx = b.x + Math.floor(b.w / 2);
      const cy = b.y + Math.floor(b.h / 2);
      if (canPlacePieces(board, room, landings, [{ x: cx, y: cy }])) {
        placePiece(board, cx, cy, OBJECTS.column);
      }
    }
  }

  // Overhead lighting
  const midX = b.x + Math.floor(b.w / 2);
  const midY = b.y + Math.floor(b.h / 2);
  const lightFixture = (room.type === 'kitchen' || room.type === 'sala') ? OVERHEADS.tube_light : OVERHEADS.bulb;
  placeOverhead(board, midX, midY, lightFixture);
  if (b.w >= 12 && b.h >= 8) {
    placeOverhead(board, midX + 3, midY, lightFixture);
  }

  // Sampayan clothesline
  if ((room.type === 'sala' || room.type === 'bare' || room.type === 'bedroom') && r(34) < 0.22 && b.h >= 6) {
    const sy = b.y + 2;
    for (let sx = b.x + 2; sx <= b.x + Math.min(5, b.w - 3); sx++) {
      if (!board.cells[sy][sx].overhead) {
        placeOverhead(board, sx, sy, OVERHEADS.sampayan);
      }
    }
  }

  // Wall things on walls bordering room
  if (b.y > 0) {
    let placedWall = false;
    for (let wx = b.x + 2; wx < b.x + b.w - 2; wx++) {
      const wCell = board.cells[b.y - 1][wx];
      if (wCell.solid && !wCell.wallThing && wCell.surface.id.includes('wall')) {
        if (room.type === 'bathroom' && !placedWall) {
          placeWallThing(board, wx, b.y - 1, WALL_THINGS.mirror);
          placedWall = true;
        } else if (room.type === 'sala' && !placedWall && r(42) < 0.5) {
          placeWallThing(board, wx, b.y - 1, WALL_THINGS.wall_tv);
          placedWall = true;
        } else if ((room.type === 'sala' || room.type === 'bedroom') && !placedWall && r(43) < 0.35) {
          placeWallThing(board, wx, b.y - 1, WALL_THINGS.photo);
          placedWall = true;
        } else if (!placedWall && r(44) < 0.4) {
          placeWallThing(board, wx, b.y - 1, WALL_THINGS.outlet);
          placedWall = true;
        }
      }
    }
  }

  // Floor scatter: harmless cockroach
  if (r(55) < 0.2) {
    const rx = b.x + 1 + Math.floor(r(56) * (b.w - 2));
    const ry = b.y + 1 + Math.floor(r(57) * (b.h - 2));
    const cCell = board.cells[ry][rx];
    if (!cCell.solid && !cCell.object && !cCell.surface.id.startsWith('stair')) {
      const isLanding = landings.some(l => l.x === rx && l.y === ry);
      if (!isLanding) {
        cCell.object = OBJECTS.cockroach;
      }
    }
  }
}

export function furnishBoard(board) {
  for (let i = 0; i < board.rooms.length; i++) {
    furnishRoom(board, board.rooms[i], board.seed + i * 17);
  }
}
