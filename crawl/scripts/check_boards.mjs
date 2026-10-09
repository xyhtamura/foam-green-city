// Verification script for foam-green-crawl board generator.
// Tests determinism, edge agreement, reachability, and room mix across 3 seeds and >= 2,000 boards each.
// Adheres to SPEC.md section 10.

import { generateBoard, BOARD_WIDTH, BOARD_HEIGHT } from '../src/board.js';

const SEEDS = [5, 42, 108];
const BOARDS_PER_SEED = 2000;
// 50 x 40 board lattice = 2,000 boards
const GRID_X_MIN = -25;
const GRID_X_MAX = 24; // 50 columns
const GRID_Y_MIN = -20;
const GRID_Y_MAX = 19; // 40 rows

function checkBoardReachability(board) {
  const entrances = [];

  // Check perimeter doors
  for (let x = 0; x < BOARD_WIDTH; x++) {
    if (!board.cells[0][x].solid) entrances.push({ x, y: 0 });
    if (!board.cells[BOARD_HEIGHT - 1][x].solid) entrances.push({ x, y: BOARD_HEIGHT - 1 });
  }
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    if (!board.cells[y][0].solid) entrances.push({ x: 0, y });
    if (!board.cells[y][BOARD_WIDTH - 1].solid) entrances.push({ x: BOARD_WIDTH - 1, y });
  }

  // Check stairs if any
  for (const stair of board.stairs) {
    entrances.push({ x: stair.x, y: stair.y });
  }

  if (entrances.length === 0) {
    return { ok: false, reason: 'Board has no doors or stairs to enter from' };
  }

  // Count total walkable cells
  let totalWalkable = 0;
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (!board.cells[y][x].solid) totalWalkable++;
    }
  }

  // Flood fill from first entrance
  const visited = new Uint8Array(BOARD_WIDTH * BOARD_HEIGHT);
  const queue = [entrances[0].x, entrances[0].y];
  visited[entrances[0].y * BOARD_WIDTH + entrances[0].x] = 1;
  let visitedCount = 0;

  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];
    visitedCount++;

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < BOARD_WIDTH && ny >= 0 && ny < BOARD_HEIGHT) {
        const idx = ny * BOARD_WIDTH + nx;
        if (!visited[idx] && !board.cells[ny][nx].solid) {
          visited[idx] = 1;
          queue.push(nx, ny);
        }
      }
    }
  }

  // Check that all other entrances were visited
  for (const ent of entrances) {
    if (!visited[ent.y * BOARD_WIDTH + ent.x]) {
      return { ok: false, reason: `Entrance at (${ent.x}, ${ent.y}) not reachable from first entrance` };
    }
  }

  // Check that every walkable cell was visited
  if (visitedCount !== totalWalkable) {
    return {
      ok: false,
      reason: `Disconnected walkable cells: reached ${visitedCount} of ${totalWalkable}`,
    };
  }

  return { ok: true, totalWalkable };
}

function runChecks() {
  console.log(`Checking board generator across ${SEEDS.length} seeds, ${BOARDS_PER_SEED} boards each...\n`);

  let totalBoardsTested = 0;
  let totalRooms = 0;
  let domesticRooms = 0;
  let unusualRooms = 0;
  let veryLargeRooms = 0;
  let totalBoardsWithStair = 0;

  for (const seed of SEEDS) {
    console.log(`--- Seed ${seed} ---`);
    const startTime = Date.now();

    let seedBoards = 0;
    let seedRooms = 0;
    let seedBoardsWithStair = 0;

    for (let by = GRID_Y_MIN; by <= GRID_Y_MAX; by++) {
      for (let bx = GRID_X_MIN; bx <= GRID_X_MAX; bx++) {
        seedBoards++;

        // 1. Determinism check
        const b1 = generateBoard(seed, bx, by, 0);
        const b2 = generateBoard(seed, bx, by, 0);

        if (b1.rooms.length !== b2.rooms.length) {
          throw new Error(`Determinism failed at seed ${seed}, (${bx}, ${by}): room count mismatch`);
        }
        for (let y = 0; y < BOARD_HEIGHT; y++) {
          for (let x = 0; x < BOARD_WIDTH; x++) {
            if (b1.cells[y][x].surface.id !== b2.cells[y][x].surface.id ||
                b1.cells[y][x].solid !== b2.cells[y][x].solid) {
              throw new Error(`Determinism failed at seed ${seed}, (${bx}, ${by}) cell (${x}, ${y})`);
            }
          }
        }

        // 2. Reachability check
        const reach = checkBoardReachability(b1);
        if (!reach.ok) {
          throw new Error(`Reachability failed at seed ${seed}, (${bx}, ${by}): ${reach.reason}`);
        }

        // 3. Edge agreement check with East neighbour
        const bEast = generateBoard(seed, bx + 1, by, 0);
        for (let y = 0; y < BOARD_HEIGHT; y++) {
          const currentDoor = b1.cells[y][BOARD_WIDTH - 1].surface.id === 'doorway';
          const eastDoor = bEast.cells[y][0].surface.id === 'doorway';
          if (currentDoor !== eastDoor) {
            throw new Error(`East edge agreement failed at seed ${seed}, (${bx}, ${by}) <-> (${bx + 1}, ${by}) at y=${y}`);
          }
          if (b1.cells[y][BOARD_WIDTH - 1].solid !== bEast.cells[y][0].solid) {
            throw new Error(`East edge solidity mismatch at seed ${seed}, (${bx}, ${by}) <-> (${bx + 1}, ${by}) at y=${y}`);
          }
        }

        // Edge agreement check with South neighbour
        const bSouth = generateBoard(seed, bx, by + 1, 0);
        for (let x = 0; x < BOARD_WIDTH; x++) {
          const currentDoor = b1.cells[BOARD_HEIGHT - 1][x].surface.id === 'doorway';
          const southDoor = bSouth.cells[0][x].surface.id === 'doorway';
          if (currentDoor !== southDoor) {
            throw new Error(`South edge agreement failed at seed ${seed}, (${bx}, ${by}) <-> (${bx}, ${by + 1}) at x=${x}`);
          }
          if (b1.cells[BOARD_HEIGHT - 1][x].solid !== bSouth.cells[0][x].solid) {
            throw new Error(`South edge solidity mismatch at seed ${seed}, (${bx}, ${by}) <-> (${bx}, ${by + 1}) at x=${x}`);
          }
        }

        // 4. Stair agreement check
        const stairUp = b1.stairs.find(s => s.type === 'up');
        if (stairUp) {
          totalBoardsWithStair++;
          seedBoardsWithStair++;

          const bAbove = generateBoard(seed, bx, by, 1);
          const stairDown = bAbove.stairs.find(s => s.type === 'down');
          if (!stairDown) {
            throw new Error(`Stair agreement failed at seed ${seed}, (${bx}, ${by}): stair up on z=0 but no stair down on z=1`);
          }
          if (stairDown.x !== stairUp.x || stairDown.y !== stairUp.y) {
            throw new Error(`Stair position mismatch at seed ${seed}, (${bx}, ${by}): z=0 at (${stairUp.x}, ${stairUp.y}) vs z=1 at (${stairDown.x}, ${stairDown.y})`);
          }
          if (b1.cells[stairUp.y][stairUp.x].surface.id !== 'stair_up') {
            throw new Error(`Stair up surface mismatch at seed ${seed}, (${bx}, ${by})`);
          }
          if (bAbove.cells[stairDown.y][stairDown.x].surface.id !== 'stair_down') {
            throw new Error(`Stair down surface mismatch at seed ${seed}, (${bx}, ${by})`);
          }
          if (b1.cells[stairUp.landingY][stairUp.landingX].solid || bAbove.cells[stairDown.landingY][stairDown.landingX].solid) {
            throw new Error(`Stair landing solid at seed ${seed}, (${bx}, ${by})`);
          }

          const reachAbove = checkBoardReachability(bAbove);
          if (!reachAbove.ok) {
            throw new Error(`Reachability failed on z=1 at seed ${seed}, (${bx}, ${by}): ${reachAbove.reason}`);
          }
        }

        // 5. Mix accounting
        for (const r of b1.rooms) {
          totalRooms++;
          seedRooms++;
          if (r.category === 'domestic') domesticRooms++;
          else if (r.category === 'unusual') unusualRooms++;
          else if (r.category === 'very_large') veryLargeRooms++;
        }
      }
    }

    const elapsed = Date.now() - startTime;
    totalBoardsTested += seedBoards;
    console.log(`  Passed ${seedBoards} boards (${seedRooms} rooms, ${seedBoardsWithStair} with stairs) in ${elapsed} ms (${(elapsed / seedBoards).toFixed(2)} ms/board)`);
  }

  console.log(`\n========================================`);
  console.log(`ALL CHECKS PASSED across ${totalBoardsTested} boards!`);
  console.log(`========================================\n`);

  console.log(`Room Mix Statistics (total ${totalRooms} rooms across ${totalBoardsTested} boards):`);
  console.log(`- Domestic:    ${domesticRooms} (${((domesticRooms / totalRooms) * 100).toFixed(1)}%)  [Target: ~83%]`);
  console.log(`- Unusual:     ${unusualRooms} (${((unusualRooms / totalRooms) * 100).toFixed(1)}%)  [Target: ~15%]`);
  console.log(`- Very Large:  ${veryLargeRooms} (${((veryLargeRooms / totalRooms) * 100).toFixed(1)}%)   [Target: 1-2%]`);
  console.log(`- Average rooms per board: ${(totalRooms / totalBoardsTested).toFixed(2)}`);
  console.log(`- Boards with stairs: ${totalBoardsWithStair} (${((totalBoardsWithStair / totalBoardsTested) * 100).toFixed(1)}%)  [Target: ~16.7% / 1 in 6]\n`);

  if (process.argv.includes('--show')) {
    console.log(`--- Preview: Board (0, 0, 0) Seed 5 ---`);
    const b0 = generateBoard(5, 0, 0, 0);
    renderAsciiBoard(b0);

    console.log(`\n--- Preview: Board (1, 0, 0) Seed 5 (East neighbour) ---`);
    const b1 = generateBoard(5, 1, 0, 0);
    renderAsciiBoard(b1);
  }
}

function renderAsciiBoard(board) {
  console.log(`Rooms: ${board.rooms.length} | Strange: ${board.strange} | Scale: ${board.scale} | Zone: ${board.zone ?? 'none'}`);
  for (const room of board.rooms) {
    console.log(`  ${room.id}: ${room.type} (${room.category}) ${room.bounds.w}x${room.bounds.h} [${room.floor}]`);
  }
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    let line = '';
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const cell = board.cells[y][x];
      line += cell.object ? cell.object.glyph : cell.surface.glyph;
    }
    console.log(line);
  }
}

runChecks();
