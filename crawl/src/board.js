// Headless board generator for foam-green-crawl.
// Generates a 52x22 cell board as pure data: deterministic, no DOM dependencies.
// Adheres to SPEC.md sections 5, 6, and 11.

import { hash3, unit3, pick, clamp } from './hash.js';
import { boardPressure, boardZone, getCourtInfo, isYeroBoard } from './fields.js';
import { SURFACES } from '../data/surfaces.js';
import { OBJECTS, ITEMS, OVERHEADS } from '../data/objects.js';
import { furnishBoard } from './furnish.js';

export const BOARD_WIDTH = 20;
export const BOARD_HEIGHT = 20;

// Canonical shared edge function.
// Vertical edge V(ex, ey, z) is the boundary between (ex, ey, z) East and (ex + 1, ey, z) West.
// Horizontal edge H(ex, ey, z) is the boundary between (ex, ey, z) South and (ex, ey + 1, z) North.
export function getEdge(type, ex, ey, z, seed) {
  if (type === 'V') {
    // 1. Check if both adjacent boards belong to the same basketball court cluster
    const c1 = getCourtInfo(ex, ey, z, seed);
    const c2 = getCourtInfo(ex + 1, ey, z, seed);
    if (c1 && c2 && c1.cx === c2.cx && c1.cy === c2.cy) {
      return {
        type: 'open',
        isOpen: true,
        hasDoor: true,
        cell: Math.floor(BOARD_HEIGHT / 2),
      };
    }

    // 2. Check if both adjacent boards are high scale halls (open hall spanning boards)
    const p1 = boardPressure(ex, ey, z, seed);
    const p2 = boardPressure(ex + 1, ey, z, seed);
    const y1 = isYeroBoard(ex, ey, z, seed);
    const y2 = isYeroBoard(ex + 1, ey, z, seed);
    if (!c1 && !c2 && !y1 && !y2 && p1.scale > 0.72 && p2.scale > 0.72 && unit3(ex, ey, z, seed * 31 + 55) < 0.38) {
      return {
        type: 'open',
        isOpen: true,
        hasDoor: true,
        cell: Math.floor(BOARD_HEIGHT / 2),
      };
    }

    // 3. Otherwise standard perimeter edge with doorway or wall
    const exitWest = (hash3(ex, ey, z, seed * 17 + 7) % 4) === 0;       // board (ex, ey) wants East
    const exitEast = (hash3(ex + 1, ey, z, seed * 17 + 7) % 4) === 2;   // board (ex+1, ey) wants West
    const randomDoor = unit3(ex, ey, z, seed * 13 + 101) < 0.65;
    const hasDoor = exitWest || exitEast || randomDoor;

    const doorY = 3 + Math.floor(unit3(ex, ey, z, seed * 13 + 103) * (BOARD_HEIGHT - 6));
    return {
      type: hasDoor ? 'door' : 'wall',
      isOpen: false,
      hasDoor,
      cell: doorY,
    };
  } else {
    // Horizontal edge H
    // 1. Check if both adjacent boards belong to the same basketball court cluster
    const c1 = getCourtInfo(ex, ey, z, seed);
    const c2 = getCourtInfo(ex, ey + 1, z, seed);
    if (c1 && c2 && c1.cx === c2.cx && c1.cy === c2.cy) {
      return {
        type: 'open',
        isOpen: true,
        hasDoor: true,
        cell: Math.floor(BOARD_WIDTH / 2),
      };
    }

    // 2. Check if both adjacent boards are high scale halls
    const p1 = boardPressure(ex, ey, z, seed);
    const p2 = boardPressure(ex, ey + 1, z, seed);
    const y1 = isYeroBoard(ex, ey, z, seed);
    const y2 = isYeroBoard(ex, ey + 1, z, seed);
    if (!c1 && !c2 && !y1 && !y2 && p1.scale > 0.72 && p2.scale > 0.72 && unit3(ex, ey, z, seed * 31 + 77) < 0.38) {
      return {
        type: 'open',
        isOpen: true,
        hasDoor: true,
        cell: Math.floor(BOARD_WIDTH / 2),
      };
    }

    // 3. Otherwise standard perimeter edge with doorway or wall
    const exitNorth = (hash3(ex, ey, z, seed * 17 + 7) % 4) === 1;       // board (ex, ey) wants South
    const exitSouth = (hash3(ex, ey + 1, z, seed * 17 + 7) % 4) === 3;   // board (ex, ey+1) wants North
    const randomDoor = unit3(ex, ey, z, seed * 13 + 102) < 0.65;
    const hasDoor = exitNorth || exitSouth || randomDoor;

    const doorX = 3 + Math.floor(unit3(ex, ey, z, seed * 13 + 104) * (BOARD_WIDTH - 6));
    return {
      type: hasDoor ? 'door' : 'wall',
      isOpen: false,
      hasDoor,
      cell: doorX,
    };
  }
}

// Canonical vertical stair connection between level z and level z + 1.
// A hash of (bx, by, z) decides whether a stair joins level z to level z + 1.
// Both boards (z as stair_up, z + 1 as stair_down) read this same function.
export function getStairLink(bx, by, z, seed) {
  // If either level is a basketball court or yero walkway, keep the space open
  if (getCourtInfo(bx, by, z, seed) || getCourtInfo(bx, by, z + 1, seed) ||
      isYeroBoard(bx, by, z, seed) || isYeroBoard(bx, by, z + 1, seed)) {
    return { hasStair: false };
  }

  // Proposed rate: 1 board in 6 has a stair up (approx 16.67%)
  const hasStair = unit3(bx, by, z, seed * 23 + 701) < (1 / 6);
  if (!hasStair) {
    return { hasStair: false };
  }

  // Choose stair cell and landing cell based on z parity to guarantee
  // that stair_up and stair_down on the same board never collide.
  // When z is even (e.g. 0 -> 1): West sector
  // When z is odd (e.g. 1 -> 2): East sector
  const isEvenZ = (Math.abs(z) % 2) === 0;

  let sx, sy, lx, ly;
  if (isEvenZ) {
    sx = 4 + Math.floor(unit3(bx, by, z, seed * 23 + 703) * 3);  // 4..6
    sy = 5 + Math.floor(unit3(bx, by, z, seed * 23 + 705) * 10); // 5..14
    lx = sx + 1; // 5..7 (East of stair)
    ly = sy;
  } else {
    sx = 13 + Math.floor(unit3(bx, by, z, seed * 23 + 703) * 3); // 13..15
    sy = 5 + Math.floor(unit3(bx, by, z, seed * 23 + 705) * 10); // 5..14
    lx = sx - 1; // 12..14 (West of stair)
    ly = sy;
  }

  return {
    hasStair: true,
    x: sx,
    y: sy,
    landingX: lx,
    landingY: ly,
  };
}

function buildCourtBoard(board, court, edges) {
  const { cells } = board;
  const { col, row } = court;

  const room = {
    id: `court_${col}_${row}`,
    type: 'court',
    category: 'very_large',
    bounds: { x: 0, y: 0, w: BOARD_WIDTH, h: BOARD_HEIGHT },
    floor: 'court_floor',
    wall: 'foam_green_wall',
    lighting: 'daylight',
    strangeness: 0,
    scale: 1,
    zone: null,
    court: true,
  };
  board.rooms.push(room);

  const gx0 = col * BOARD_WIDTH;
  const gy0 = row * BOARD_HEIGHT;

  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const gx = gx0 + x;
      const gy = gy0 + y;
      const cell = cells[y][x];

      // Exterior boundary check for the 2x3 cluster (40x60 cells):
      // North: gy === 0
      // South: gy === 59
      // West:  gx === 0
      // East:  gx === 39
      const isNorthExterior = (gy === 0);
      const isSouthExterior = (gy === 59);
      const isWestExterior  = (gx === 0);
      const isEastExterior  = (gx === 39);

      if (isNorthExterior || isSouthExterior || isWestExterior || isEastExterior) {
        const isDoor = (isNorthExterior && edges.north.hasDoor && x === edges.north.cell) ||
                       (isSouthExterior && edges.south.hasDoor && x === edges.south.cell) ||
                       (isWestExterior  && edges.west.hasDoor  && y === edges.west.cell)  ||
                       (isEastExterior  && edges.east.hasDoor  && y === edges.east.cell);

        if (isDoor) {
          cell.surface = SURFACES.doorway;
          cell.solid = false;
        } else {
          cell.surface = SURFACES.foam_green_wall;
          cell.solid = true;
        }
        continue;
      }

      // Interior cell of the covered basketball court (gx 1..38, gy 1..58)
      cell.solid = false;
      cell.roomId = room.id;

      // Determine surface finish from global court geometry (18 by 28 m = 36 by 56 cells)
      let surf = SURFACES.foam_green_floor; // Apron / out-of-bounds area

      const inBounds = (gx >= 2 && gx <= 37 && gy >= 2 && gy <= 57);
      if (inBounds) {
        surf = SURFACES.court_floor;

        // Sidelines & baselines
        if (gx === 2 || gx === 37 || gy === 2 || gy === 57) {
          surf = SURFACES.court_line;
        }

        // Half-court line
        if (gy === 29 || gy === 30) {
          surf = SURFACES.court_line;
        }

        // Center circle (radius ~3.6 cells centered at gx=19.5, gy=29.5)
        const distCenter = Math.hypot(gx - 19.5, gy - 29.5);
        if (distCenter >= 3.0 && distCenter <= 4.2) {
          surf = SURFACES.court_line;
        }

        // North Key: gx in [15..24], gy in [2..13]
        if (gx >= 15 && gx <= 24 && gy <= 13) {
          if (gx === 15 || gx === 24 || gy === 13) {
            surf = SURFACES.court_line;
          } else {
            surf = SURFACES.court_key;
          }
        }
        // North free-throw circle
        const distNorthFT = Math.hypot(gx - 19.5, gy - 13);
        if (distNorthFT >= 3.0 && distNorthFT <= 4.2) {
          surf = SURFACES.court_line;
        }
        // North three-point arc
        const distNorth3P = Math.hypot(gx - 19.5, gy - 5);
        if (distNorth3P >= 13.0 && distNorth3P <= 14.2 && gy >= 5 && gy <= 18) {
          surf = SURFACES.court_line;
        }

        // South Key: gx in [15..24], gy in [46..57]
        if (gx >= 15 && gx <= 24 && gy >= 46) {
          if (gx === 15 || gx === 24 || gy === 46) {
            surf = SURFACES.court_line;
          } else {
            surf = SURFACES.court_key;
          }
        }
        // South free-throw circle
        const distSouthFT = Math.hypot(gx - 19.5, gy - 46);
        if (distSouthFT >= 3.0 && distSouthFT <= 4.2) {
          surf = SURFACES.court_line;
        }
        // South three-point arc
        const distSouth3P = Math.hypot(gx - 19.5, gy - 54);
        if (distSouth3P >= 13.0 && distSouth3P <= 14.2 && gy >= 41 && gy <= 54) {
          surf = SURFACES.court_line;
        }
      }

      cell.surface = surf;

      // Objects & Items
      // North hoop: at gx = 18 and gx = 21, gy = 3
      if (gy === 3 && (gx === 18 || gx === 21)) {
        cell.object = OBJECTS.hoop;
        cell.solid = true;
      }
      // South hoop: at gx = 18 and gx = 21, gy = 56
      if (gy === 56 && (gx === 18 || gx === 21)) {
        cell.object = OBJECTS.hoop;
        cell.solid = true;
      }

      // Bleachers along spectator margins: gx = 1 and gx = 38
      // Keep cross-aisles at board seam boundaries (gy 19, 20, 39, 40) and at door landings
      if ((gx === 1 || gx === 38) && gy >= 6 && gy <= 53) {
        const isDoorLanding = (gx === 1 && edges.west.hasDoor && y === edges.west.cell) ||
                              (gx === 38 && edges.east.hasDoor && y === edges.east.cell);
        const isAisle = (gy === 19 || gy === 20 || gy === 39 || gy === 40);
        if (!isDoorLanding && !isAisle && (gy % 4) !== 0) {
          cell.object = OBJECTS.bleacher;
          cell.solid = true;
        }
      }

      // Loose basketballs on the court
      if ((gx === 11 && gy === 27) || (gx === 28 && gy === 33)) {
        cell.item = ITEMS.basketball;
      }

      // Overheads: roof trusses across the court every 6 cells
      if (gy % 6 === 0 && gx >= 1 && gx <= 38) {
        cell.overhead = OVERHEADS.truss;
      } else if (gy % 6 === 3 && gx >= 2 && gx <= 37) {
        cell.overhead = OVERHEADS.banderitas;
      } else if ((gx === 10 || gx === 29) && (gy % 12 === 0)) {
        cell.overhead = OVERHEADS.tube_light;
      }
    }
  }
}

function buildYeroBoard(board, edges) {
  const { bx, by, z, seed, cells } = board;

  const room = {
    id: 'yero_0',
    type: 'yero_walkway',
    category: 'unusual',
    bounds: { x: 0, y: 0, w: BOARD_WIDTH, h: BOARD_HEIGHT },
    floor: 'yero_floor',
    wall: 'foam_green_wall',
    lighting: 'daylight',
    strangeness: 1,
    scale: 0.5,
    zone: null,
  };
  board.rooms.push(room);

  // Connect doors across the board
  const nX = edges.north.hasDoor ? edges.north.cell : 10;
  const sX = edges.south.hasDoor ? edges.south.cell : 10;
  const wY = edges.west.hasDoor ? edges.west.cell : 10;
  const eY = edges.east.hasDoor ? edges.east.cell : 10;

  // Default to airwell (open sky void drop, solid) everywhere
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      cells[y][x].surface = SURFACES.airwell;
      cells[y][x].solid = true;
      cells[y][x].roomId = room.id;
    }
  }

  // Open doorway cells if present on perimeter
  if (edges.north.hasDoor) {
    cells[0][nX].surface = SURFACES.doorway;
    cells[0][nX].solid = false;
  }
  if (edges.south.hasDoor) {
    cells[BOARD_HEIGHT - 1][sX].surface = SURFACES.doorway;
    cells[BOARD_HEIGHT - 1][sX].solid = false;
  }
  if (edges.west.hasDoor) {
    cells[wY][0].surface = SURFACES.doorway;
    cells[wY][0].solid = false;
  }
  if (edges.east.hasDoor) {
    cells[eY][BOARD_WIDTH - 1].surface = SURFACES.doorway;
    cells[eY][BOARD_WIDTH - 1].solid = false;
  }

  const r = (salt) => unit3(bx, by, z, seed * 67 + salt);

  // Precompute spinal path centers pathX[y] for y from 1 to BOARD_HEIGHT - 2
  const pathX = new Int32Array(BOARD_HEIGHT);
  for (let y = 1; y < BOARD_HEIGHT - 1; y++) {
    const t = (y - 1) / (BOARD_HEIGHT - 3);
    const sway = Math.round(Math.sin(t * Math.PI) * ((r(1) - 0.5) * 6));
    pathX[y] = Math.max(3, Math.min(BOARD_WIDTH - 4, Math.round(nX + (sX - nX) * t + sway)));
  }

  // Carve spinal path ensuring vertical overlap between all adjacent rows
  for (let y = 1; y < BOARD_HEIGHT - 1; y++) {
    const prevX = y > 1 ? pathX[y - 1] : nX;
    const nextX = y < BOARD_HEIGHT - 2 ? pathX[y + 1] : sX;
    const minX = Math.max(1, Math.min(pathX[y], prevX, nextX) - 1);
    const maxX = Math.min(BOARD_WIDTH - 2, Math.max(pathX[y], prevX, nextX) + 1);

    for (let cx = minX; cx <= maxX; cx++) {
      cells[y][cx].surface = SURFACES.yero_floor;
      cells[y][cx].solid = false;

      // Occasional wooden plank underneath or crosswise
      if (r(y * 11 + cx * 7) < 0.15) {
        cells[y][cx].surface = SURFACES.wood_plank;
      }

      // Tufts of grass along path edges
      if ((cx === minX || cx === maxX) && r(y * 17 + cx * 5) < 0.25) {
        cells[y][cx].item = ITEMS.grass;
      }

      // Overhead wire run along the center of the path
      if (cx === pathX[y] && r(y * 23) < 0.5) {
        cells[y][cx].overhead = OVERHEADS.wire_run;
      }
    }

    // Occasional timber post on path margin
    if (y % 5 === 2) {
      const postX = Math.min(BOARD_WIDTH - 2, maxX + 1);
      if (postX < BOARD_WIDTH - 1 && cells[y][postX].solid) {
        cells[y][postX].object = OBJECTS.post;
        cells[y][postX].solid = true;
      }
    }
  }

  // Ensure door landings connect to the path
  if (edges.north.hasDoor) {
    cells[1][nX].surface = SURFACES.yero_floor;
    cells[1][nX].solid = false;
    cells[1][nX].object = null;
  }
  if (edges.south.hasDoor) {
    cells[BOARD_HEIGHT - 2][sX].surface = SURFACES.yero_floor;
    cells[BOARD_HEIGHT - 2][sX].solid = false;
    cells[BOARD_HEIGHT - 2][sX].object = null;
  }
  if (edges.west.hasDoor) {
    const targetX = pathX[wY];
    for (let x = 1; x <= targetX; x++) {
      cells[wY][x].surface = SURFACES.yero_floor;
      cells[wY][x].solid = false;
      cells[wY][x].object = null;
    }
  }
  if (edges.east.hasDoor) {
    const targetX = pathX[eY];
    for (let x = targetX; x < BOARD_WIDTH - 1; x++) {
      cells[eY][x].surface = SURFACES.yero_floor;
      cells[eY][x].solid = false;
      cells[eY][x].object = null;
    }
  }
}

export function generateBoard(seed, bx, by, z = 0) {
  const { strange, scale } = boardPressure(bx, by, z, seed);
  const zone = boardZone(bx, by, z, seed);

  // 1. Resolve 4 edges
  const northEdge = getEdge('H', bx, by - 1, z, seed);
  const southEdge = getEdge('H', bx, by, z, seed);
  const westEdge  = getEdge('V', bx - 1, by, z, seed);
  const eastEdge  = getEdge('V', bx, by, z, seed);

  const edges = {
    north: northEdge,
    south: southEdge,
    west:  westEdge,
    east:  eastEdge,
  };

  const northDoorX = northEdge.hasDoor ? northEdge.cell : null;
  const southDoorX = southEdge.hasDoor ? southEdge.cell : null;
  const westDoorY  = westEdge.hasDoor  ? westEdge.cell  : null;
  const eastDoorY  = eastEdge.hasDoor  ? eastEdge.cell  : null;

  // 2. Initialize cells grid: 20 rows x 20 columns
  const cells = [];
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    const row = [];
    for (let x = 0; x < BOARD_WIDTH; x++) {
      row.push({
        x,
        y,
        surface: SURFACES.foam_green_wall,
        item: null,
        object: null,
        overhead: null,
        wallThing: null,
        solid: true,
        roomId: null,
      });
    }
    cells.push(row);
  }

  // 2a. Check if this board is a basketball court or yero walkway
  const courtInfo = getCourtInfo(bx, by, z, seed);
  const isYero = !courtInfo && isYeroBoard(bx, by, z, seed);

  if (courtInfo) {
    const board = {
      seed,
      bx,
      by,
      z,
      width: BOARD_WIDTH,
      height: BOARD_HEIGHT,
      strange,
      scale,
      zone,
      edges,
      rooms: [],
      stairs: [],
      cells,
    };
    buildCourtBoard(board, courtInfo, edges);
    return board;
  }

  if (isYero) {
    const board = {
      seed,
      bx,
      by,
      z,
      width: BOARD_WIDTH,
      height: BOARD_HEIGHT,
      strange,
      scale,
      zone,
      edges,
      rooms: [],
      stairs: [],
      cells,
    };
    buildYeroBoard(board, edges);
    return board;
  }

  // 3. Carve perimeter doors and open edges for domestic / hall spaces
  if (northEdge.isOpen) {
    for (let x = 1; x < BOARD_WIDTH - 1; x++) {
      cells[0][x].surface = SURFACES.foam_green_floor;
      cells[0][x].solid = false;
    }
  } else if (northDoorX !== null) {
    cells[0][northDoorX].surface = SURFACES.doorway;
    cells[0][northDoorX].solid = false;
  }

  if (southEdge.isOpen) {
    for (let x = 1; x < BOARD_WIDTH - 1; x++) {
      cells[BOARD_HEIGHT - 1][x].surface = SURFACES.foam_green_floor;
      cells[BOARD_HEIGHT - 1][x].solid = false;
    }
  } else if (southDoorX !== null) {
    cells[BOARD_HEIGHT - 1][southDoorX].surface = SURFACES.doorway;
    cells[BOARD_HEIGHT - 1][southDoorX].solid = false;
  }

  if (westEdge.isOpen) {
    for (let y = 1; y < BOARD_HEIGHT - 1; y++) {
      cells[y][0].surface = SURFACES.foam_green_floor;
      cells[y][0].solid = false;
    }
  } else if (westDoorY !== null) {
    cells[westDoorY][0].surface = SURFACES.doorway;
    cells[westDoorY][0].solid = false;
  }

  if (eastEdge.isOpen) {
    for (let y = 1; y < BOARD_HEIGHT - 1; y++) {
      cells[y][BOARD_WIDTH - 1].surface = SURFACES.foam_green_floor;
      cells[y][BOARD_WIDTH - 1].solid = false;
    }
  } else if (eastDoorY !== null) {
    cells[eastDoorY][BOARD_WIDTH - 1].surface = SURFACES.doorway;
    cells[eastDoorY][BOARD_WIDTH - 1].solid = false;
  }

  // 4. Resolve vertical stairs for level z
  const stairUpLink = getStairLink(bx, by, z, seed);
  const stairDownLink = z > 0 ? getStairLink(bx, by, z - 1, seed) : { hasStair: false };

  const reservedStairCells = [];
  if (stairUpLink.hasStair) {
    reservedStairCells.push({ x: stairUpLink.x, y: stairUpLink.y });
    reservedStairCells.push({ x: stairUpLink.landingX, y: stairUpLink.landingY });
  }
  if (stairDownLink.hasStair) {
    reservedStairCells.push({ x: stairDownLink.x, y: stairDownLink.y });
    reservedStairCells.push({ x: stairDownLink.landingX, y: stairDownLink.landingY });
  }

  // 5. Room partitioning of inner area: 18x18 cells (9x9 m).
  // The room is square and traversals across it are rapid.
  // Most boards are one single domestic room; occasionally (~35% of boards)
  // the room is partitioned into 2 (or rarely 3) smaller rooms.
  const r = (salt) => unit3(bx, by, z, seed * 43 + salt);

  const hasAnyOpenEdge = northEdge.isOpen || southEdge.isOpen || westEdge.isOpen || eastEdge.isOpen;
  const isLargeHall = (scale > 0.72 && strange > 0.48 && r(1) < 0.38) || hasAnyOpenEdge;
  const shouldPartition = !isLargeHall && (strange > 0.4 || r(2) < 0.35);
  const targetRooms = isLargeHall ? 1 : shouldPartition ? (r(3) < 0.8 ? 2 : 3) : 1;

  let rects = [{ x: 1, y: 1, w: BOARD_WIDTH - 2, h: BOARD_HEIGHT - 2 }];
  let splitSalt = 10;

  while (rects.length < targetRooms) {
    // Find the best rectangle to split (prefer largest area)
    let bestIdx = -1;
    let maxArea = -1;
    for (let i = 0; i < rects.length; i++) {
      const area = rects[i].w * rects[i].h;
      const canSplitV = rects[i].w >= 12;
      const canSplitH = rects[i].h >= 12;
      if ((canSplitV || canSplitH) && area > maxArea) {
        maxArea = area;
        bestIdx = i;
      }
    }
    if (bestIdx === -1) break;

    const box = rects[bestIdx];
    splitSalt += 7;

    const canSplitV = box.w >= 12;
    const canSplitH = box.h >= 12;

    let splitV = false;
    if (canSplitV && !canSplitH) splitV = true;
    else if (!canSplitV && canSplitH) splitV = false;
    else {
      // Both can split: prefer aspect ratio
      if (box.w >= box.h * 1.3) splitV = true;
      else if (box.h >= box.w * 1.3) splitV = false;
      else splitV = r(splitSalt) < 0.5;
    }

    if (splitV) {
      // Find candidate splitX that does not hit north or south doors or stairs
      const minX = box.x + 5;
      const maxX = box.x + box.w - 6;
      const candidates = [];
      for (let sx = minX; sx <= maxX; sx++) {
        if (northDoorX !== null && sx === northDoorX) continue;
        if (southDoorX !== null && sx === southDoorX) continue;
        if (reservedStairCells.some(c => c.x === sx && c.y >= box.y && c.y < box.y + box.h)) continue;
        candidates.push(sx);
      }
      if (candidates.length === 0) break;

      const pickIdx = Math.min(candidates.length - 1, Math.floor(r(splitSalt + 1) * candidates.length));
      const splitX = candidates[pickIdx];

      const leftBox = { x: box.x, y: box.y, w: splitX - box.x, h: box.h };
      const rightBox = { x: splitX + 1, y: box.y, w: box.x + box.w - splitX - 1, h: box.h };
      rects.splice(bestIdx, 1, leftBox, rightBox);
    } else {
      // Horizontal split
      const minY = box.y + 5;
      const maxY = box.y + box.h - 6;
      const candidates = [];
      for (let sy = minY; sy <= maxY; sy++) {
        if (westDoorY !== null && sy === westDoorY) continue;
        if (eastDoorY !== null && sy === eastDoorY) continue;
        if (reservedStairCells.some(c => c.y === sy && c.x >= box.x && c.x < box.x + box.w)) continue;
        candidates.push(sy);
      }
      if (candidates.length === 0) break;

      const pickIdx = Math.min(candidates.length - 1, Math.floor(r(splitSalt + 2) * candidates.length));
      const splitY = candidates[pickIdx];

      const topBox = { x: box.x, y: box.y, w: box.w, h: splitY - box.y };
      const bottomBox = { x: box.x, y: splitY + 1, w: box.w, h: box.y + box.h - splitY - 1 };
      rects.splice(bestIdx, 1, topBox, bottomBox);
    }
  }

  // 5. Populate rooms and carve interior floor cells
  const rooms = [];
  let roomSalt = 100;

  for (let i = 0; i < rects.length; i++) {
    const box = rects[i];
    roomSalt += 5;
    const roomId = `room_${i}`;

    const isVeryLargeRoom = isLargeHall;
    const isUnusualRoom = !isVeryLargeRoom && (strange > 0 || box.w / box.h >= 2.5 || box.h / box.w >= 2.5);

    let category = 'domestic';
    if (isVeryLargeRoom) category = 'very_large';
    else if (isUnusualRoom) category = 'unusual';

    let type = 'sala';
    if (category === 'very_large') {
      type = r(roomSalt) < 0.6 ? 'hall' : 'auditorium';
    } else if (zone) {
      type = zone;
    } else {
      const typeList = ['sala', 'sala', 'bedroom', 'bedroom', 'kitchen', 'bathroom', 'hall', 'bare'];
      type = pick(typeList, r(roomSalt + 1));
    }

    // Floor finish: foam-green painted floor is the primary domestic surface
    let floorSurface = SURFACES.foam_green_floor;
    if (type === 'kitchen' || type === 'bathroom') {
      floorSurface = r(roomSalt + 2) < 0.75 ? SURFACES.white_tile : SURFACES.foam_green_floor;
    } else if (type === 'bedroom') {
      const u = r(roomSalt + 2);
      floorSurface = u < 0.65 ? SURFACES.foam_green_floor : u < 0.88 ? SURFACES.linoleum : SURFACES.bare_cement;
    } else if (type === 'sala') {
      const u = r(roomSalt + 2);
      floorSurface = u < 0.70 ? SURFACES.foam_green_floor : u < 0.85 ? SURFACES.white_tile : u < 0.95 ? SURFACES.linoleum : SURFACES.bare_cement;
    } else if (type === 'hall') {
      floorSurface = r(roomSalt + 2) < 0.80 ? SURFACES.foam_green_floor : SURFACES.bare_cement;
    }

    // Wall finish
    let wallSurface = SURFACES.foam_green_wall;
    const wallRoll = r(roomSalt + 3);
    if (wallRoll < 0.12) {
      wallSurface = SURFACES.yellow_wall;
    } else if (wallRoll < 0.22) {
      wallSurface = SURFACES.concrete_wall;
    } else if (wallRoll < 0.32) {
      wallSurface = SURFACES.beige_wall;
    } else if (wallRoll < 0.42) {
      wallSurface = SURFACES.offwhite_wall;
    }

    // Room lighting profile
    let lighting = 'daylight';
    const lightRoll = r(roomSalt + 4);
    if (lightRoll < 0.35) lighting = 'daylight';
    else if (lightRoll < 0.55) lighting = 'overcast';
    else if (lightRoll < 0.70) lighting = 'shaded';
    else if (lightRoll < 0.80) lighting = 'dawn';
    else if (lightRoll < 0.86) lighting = 'dusk';
    else if (lightRoll < 0.91) lighting = 'blueHour';
    else if (lightRoll < 0.95) lighting = 'darkDay';
    else if (lightRoll < 0.98) lighting = 'night';
    else lighting = 'deepNight';

    rooms.push({
      id: roomId,
      type,
      category,
      bounds: { ...box },
      floor: floorSurface.id,
      wall: wallSurface.id,
      lighting,
      strangeness: strange,
      scale,
      zone,
    });

    // Fill room cells with floor
    for (let cy = box.y; cy < box.y + box.h; cy++) {
      for (let cx = box.x; cx < box.x + box.w; cx++) {
        cells[cy][cx].surface = floorSurface;
        cells[cy][cx].solid = false;
        cells[cy][cx].roomId = roomId;
      }
    }

    // Paint open perimeter edges with room's floor surface
    if (northEdge.isOpen) {
      for (let cx = 1; cx < BOARD_WIDTH - 1; cx++) {
        cells[0][cx].surface = floorSurface;
        cells[0][cx].roomId = roomId;
      }
    }
    if (southEdge.isOpen) {
      for (let cx = 1; cx < BOARD_WIDTH - 1; cx++) {
        cells[BOARD_HEIGHT - 1][cx].surface = floorSurface;
        cells[BOARD_HEIGHT - 1][cx].roomId = roomId;
      }
    }
    if (westEdge.isOpen) {
      for (let cy = 1; cy < BOARD_HEIGHT - 1; cy++) {
        cells[cy][0].surface = floorSurface;
        cells[cy][0].roomId = roomId;
      }
    }
    if (eastEdge.isOpen) {
      for (let cy = 1; cy < BOARD_HEIGHT - 1; cy++) {
        cells[cy][BOARD_WIDTH - 1].surface = floorSurface;
        cells[cy][BOARD_WIDTH - 1].roomId = roomId;
      }
    }

    // Carve negative space: central airwells / lightwells or corner cutouts
    let hasAirwell = false;

    // Archetype A: Central Lightwell / Airwell (open void shaft in center of large rooms)
    if (!hasAnyOpenEdge && box.w >= 10 && box.h >= 10 && r(roomSalt + 15) < 0.28) {
      const vw = Math.min(box.w - 6, Math.max(4, Math.floor(box.w * 0.35)));
      const vh = Math.min(box.h - 6, Math.max(4, Math.floor(box.h * 0.35)));
      const vx0 = box.x + Math.floor((box.w - vw) / 2);
      const vy0 = box.y + Math.floor((box.h - vh) / 2);

      const hitsStair = reservedStairCells.some(c =>
        c.x >= vx0 - 1 && c.x <= vx0 + vw && c.y >= vy0 - 1 && c.y <= vy0 + vh
      );

      if (!hitsStair) {
        hasAirwell = true;
        for (let vy = vy0; vy < vy0 + vh; vy++) {
          for (let vx = vx0; vx < vx0 + vw; vx++) {
            cells[vy][vx].surface = SURFACES.airwell;
            cells[vy][vx].solid = true;
            cells[vy][vx].roomId = roomId;
          }
        }
      }
    }

    // Archetype B: Corner Cutout / L-Shaped Room (in single rooms without airwell)
    if (!hasAnyOpenEdge && !hasAirwell && rects.length === 1 && box.w === 18 && box.h === 18 && r(roomSalt + 20) < 0.25) {
      const cw = 6;
      const ch = 6;
      // 4 possible corners: 0=NW, 1=NE, 2=SW, 3=SE
      const corner = Math.floor(r(roomSalt + 21) * 4);
      let cx0 = 1;
      let cy0 = 1;
      let valid = true;

      if (corner === 0) { // NW
        cx0 = 1; cy0 = 1;
        if (northDoorX !== null && northDoorX <= cx0 + cw) valid = false;
        if (westDoorY !== null && westDoorY <= cy0 + ch) valid = false;
      } else if (corner === 1) { // NE
        cx0 = box.x + box.w - cw; cy0 = 1;
        if (northDoorX !== null && northDoorX >= cx0 - 1) valid = false;
        if (eastDoorY !== null && eastDoorY <= cy0 + ch) valid = false;
      } else if (corner === 2) { // SW
        cx0 = 1; cy0 = box.y + box.h - ch;
        if (southDoorX !== null && southDoorX <= cx0 + cw) valid = false;
        if (westDoorY !== null && westDoorY >= cy0 - 1) valid = false;
      } else { // SE
        cx0 = box.x + box.w - cw; cy0 = box.y + box.h - ch;
        if (southDoorX !== null && southDoorX >= cx0 - 1) valid = false;
        if (eastDoorY !== null && eastDoorY >= cy0 - 1) valid = false;
      }

      const hitsStair = reservedStairCells.some(c =>
        c.x >= cx0 - 1 && c.x <= cx0 + cw && c.y >= cy0 - 1 && c.y <= cy0 + ch
      );
      if (hitsStair) valid = false;

      if (valid) {
        for (let cy = cy0; cy < cy0 + ch; cy++) {
          for (let cx = cx0; cx < cx0 + cw; cx++) {
            cells[cy][cx].surface = SURFACES.airwell;
            cells[cy][cx].solid = true;
            cells[cy][cx].roomId = roomId;
          }
        }
      }
    }

    // Paint surrounding wall cells with this room's wall surface
    for (let cy = Math.max(0, box.y - 1); cy <= Math.min(BOARD_HEIGHT - 1, box.y + box.h); cy++) {
      for (let cx = Math.max(0, box.x - 1); cx <= Math.min(BOARD_WIDTH - 1, box.x + box.w); cx++) {
        const isBoundary = (cy === box.y - 1 || cy === box.y + box.h || cx === box.x - 1 || cx === box.x + box.w);
        if (isBoundary) {
          const cell = cells[cy][cx];
          if (cell.solid && cell.surface.id.endsWith('_wall')) {
            cell.surface = wallSurface;
            if (!cell.roomId) cell.roomId = roomId;
          }
        }
      }
    }

    // Occasional jalousie windows along exterior walls
    if (r(roomSalt + 8) < 0.45) {
      if (box.y === 1 && box.w >= 6) {
        const startX = box.x + 2 + Math.floor(r(roomSalt + 9) * Math.max(1, box.w - 5));
        for (let jx = startX; jx < Math.min(startX + 2, box.x + box.w - 1); jx++) {
          if (cells[0][jx].solid && cells[0][jx].surface.id.endsWith('_wall')) {
            if (northDoorX === null || Math.abs(jx - northDoorX) > 1) {
              cells[0][jx].surface = SURFACES.jalousie;
            }
          }
        }
      }
      if (box.y + box.h === BOARD_HEIGHT - 1 && box.w >= 6) {
        const startX = box.x + 2 + Math.floor(r(roomSalt + 10) * Math.max(1, box.w - 5));
        for (let jx = startX; jx < Math.min(startX + 2, box.x + box.w - 1); jx++) {
          if (cells[BOARD_HEIGHT - 1][jx].solid && cells[BOARD_HEIGHT - 1][jx].surface.id.endsWith('_wall')) {
            if (southDoorX === null || Math.abs(jx - southDoorX) > 1) {
              cells[BOARD_HEIGHT - 1][jx].surface = SURFACES.jalousie;
            }
          }
        }
      }
    }
  }

  // 6. Connect adjacent rooms with internal doorways
  // Find all pairs of adjacent rooms sharing a wall
  let doorSalt = 300;
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i].bounds;
      const b = rooms[j].bounds;
      doorSalt += 3;

      // Check vertical shared wall
      let sharedVWall = null;
      if (a.x + a.w + 1 === b.x) {
        sharedVWall = { wallX: a.x + a.w, y0: Math.max(a.y, b.y), y1: Math.min(a.y + a.h - 1, b.y + b.h - 1) };
      } else if (b.x + b.w + 1 === a.x) {
        sharedVWall = { wallX: b.x + b.w, y0: Math.max(a.y, b.y), y1: Math.min(a.y + a.h - 1, b.y + b.h - 1) };
      }

      if (sharedVWall && sharedVWall.y0 <= sharedVWall.y1) {
        const span = sharedVWall.y1 - sharedVWall.y0 + 1;
        const doorY = span >= 3
          ? sharedVWall.y0 + 1 + Math.floor(r(doorSalt) * (span - 2))
          : sharedVWall.y0 + Math.floor(r(doorSalt) * span);

        cells[doorY][sharedVWall.wallX].surface = SURFACES.doorway;
        cells[doorY][sharedVWall.wallX].solid = false;
      }

      // Check horizontal shared wall
      let sharedHWall = null;
      if (a.y + a.h + 1 === b.y) {
        sharedHWall = { wallY: a.y + a.h, x0: Math.max(a.x, b.x), x1: Math.min(a.x + a.w - 1, b.x + b.w - 1) };
      } else if (b.y + b.h + 1 === a.y) {
        sharedHWall = { wallY: b.y + b.h, x0: Math.max(a.x, b.x), x1: Math.min(a.x + a.w - 1, b.x + b.w - 1) };
      }

      if (sharedHWall && sharedHWall.x0 <= sharedHWall.x1) {
        const span = sharedHWall.x1 - sharedHWall.x0 + 1;
        const doorX = span >= 3
          ? sharedHWall.x0 + 1 + Math.floor(r(doorSalt) * (span - 2))
          : sharedHWall.x0 + Math.floor(r(doorSalt) * span);

        cells[sharedHWall.wallY][doorX].surface = SURFACES.doorway;
        cells[sharedHWall.wallY][doorX].solid = false;
      }
    }
  }

  // 7. Place stairs on board cells
  const stairs = [];
  if (stairUpLink.hasStair) {
    cells[stairUpLink.y][stairUpLink.x].surface = SURFACES.stair_up;
    cells[stairUpLink.y][stairUpLink.x].solid = false;
    stairs.push({
      type: 'up',
      x: stairUpLink.x,
      y: stairUpLink.y,
      landingX: stairUpLink.landingX,
      landingY: stairUpLink.landingY,
      targetZ: z + 1,
    });
  }
  if (stairDownLink.hasStair) {
    cells[stairDownLink.y][stairDownLink.x].surface = SURFACES.stair_down;
    cells[stairDownLink.y][stairDownLink.x].solid = false;
    stairs.push({
      type: 'down',
      x: stairDownLink.x,
      y: stairDownLink.y,
      landingX: stairDownLink.landingX,
      landingY: stairDownLink.landingY,
      targetZ: z - 1,
    });
  }

  const board = {
    seed,
    bx,
    by,
    z,
    width: BOARD_WIDTH,
    height: BOARD_HEIGHT,
    strange,
    scale,
    zone,
    edges,
    rooms,
    stairs,
    cells,
  };

  // 8. Furnish rooms with domestic furniture layouts
  furnishBoard(board);

  return board;
}
