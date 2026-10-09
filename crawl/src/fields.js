// Slow hashed spatial fields over board coordinates (bx, by, z).
// Strangeness, scale drift, and room zone patches.
// Preserves the distribution thresholds from foam-green-city/room-generator.js.

import { noise2D, unit3, clamp } from './hash.js';

export function boardPressure(bx, by, z = 0, seed = 5) {
  // Near the spawn (0, 0, 0), keep space calm and domestic
  if (bx === 0 && by === 0 && z === 0) {
    return { strange: 0, scale: 0 };
  }

  const wave = noise2D(bx / 4.5, by / 4.5, z, seed * 7 + 11);
  const spike = unit3(bx, by, z, seed * 7 + 13);
  const strange = Math.max(
    clamp((wave - 0.78) / 0.22, 0, 1),
    spike > 0.975 ? (spike - 0.975) / 0.025 : 0
  );

  const scaleNoise = noise2D(bx / 31, by / 31, z, seed * 7 + 17);
  const scale = clamp((scaleNoise - 0.5) / 0.5, 0, 1);

  return {
    strange: Math.round(strange * 100) / 100,
    scale: Math.round(scale * 100) / 100,
  };
}

export function boardZone(bx, by, z = 0, seed = 5) {
  if (bx === 0 && by === 0 && z === 0) {
    return null;
  }
  const n = noise2D(bx / 6, by / 6, z, seed * 7 + 19);
  return n > 0.83 ? 'kitchen' : n < 0.17 ? 'bathroom' : null;
}

// Determines if a 2x3 block of boards anchored at (cx, cy) is a covered basketball court.
// cx must be an even integer, cy must be a multiple of 3.
export function isCourtCluster(cx, cy, z = 0, seed = 5) {
  // Courts are located on the ground gym level (z = 0) or multiples of 4
  if (z !== 0) return false;
  // Keep spawn zone domestic
  if (Math.abs(cx) <= 2 && Math.abs(cy) <= 3) return false;

  // Rate: approx 1 court cluster per 80 macro-blocks (1.25%)
  return unit3(cx, cy, z, seed * 73 + 997) < (1 / 80);
}

// Returns court information for board (bx, by, z), or null if not part of a court.
export function getCourtInfo(bx, by, z = 0, seed = 5) {
  if (z !== 0) return null;
  const cx = Math.floor(bx / 2) * 2;
  const cy = Math.floor(by / 3) * 3;
  if (!isCourtCluster(cx, cy, z, seed)) return null;

  return {
    cx,
    cy,
    col: bx - cx, // 0 (West) or 1 (East)
    row: by - cy, // 0 (North), 1 (Mid), 2 (South)
  };
}

// Determines if board (bx, by, z) is an open-air yero walkway.
export function isYeroBoard(bx, by, z = 0, seed = 5) {
  if (Math.abs(bx) <= 2 && Math.abs(by) <= 2 && z === 0) return false;
  if (getCourtInfo(bx, by, z, seed)) return false;

  // Rate: approx 1 in 180 boards
  return unit3(bx, by, z, seed * 59 + 883) < (1 / 180);
}
