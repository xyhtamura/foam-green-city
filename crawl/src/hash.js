// Integer hash and value noise over integer coordinates.
// Ported and adapted from foam-green-city/room-generator.js into 2D/3D space.

export function hash3(x, y, z, salt = 0) {
  let h = (Math.imul(x | 0, 0x9E3779B1) ^
           Math.imul(y | 0, 0x85EBCA6B) ^
           Math.imul(z | 0, 0xC2B2AE35) ^
           Math.imul(salt | 0, 0x27D4EB2F)) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85EBCA6B);
  h ^= h >>> 13;
  h = Math.imul(h, 0xC2B2AE35);
  h ^= h >>> 16;
  return h >>> 0;
}

export function unit3(x, y, z, salt = 0) {
  return hash3(x, y, z, salt) / 4294967296;
}

export function unit1(n, salt = 0) {
  let h = (Math.imul(n | 0, 0x9E3779B1) ^ Math.imul(salt | 0, 0x85EBCA6B)) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85EBCA6B);
  h ^= h >>> 13;
  h = Math.imul(h, 0xC2B2AE35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// 2D value noise interpolated smoothly with cubic Hermite polynomial
export function noise2D(fx, fy, z = 0, salt = 0) {
  const ix = Math.floor(fx);
  const iy = Math.floor(fy);
  const tx = fx - ix;
  const ty = fy - iy;
  const ux = tx * tx * (3 - 2 * tx);
  const uy = ty * ty * (3 - 2 * ty);

  const n00 = unit3(ix, iy, z, salt);
  const n10 = unit3(ix + 1, iy, z, salt);
  const n01 = unit3(ix, iy + 1, z, salt);
  const n11 = unit3(ix + 1, iy + 1, z, salt);

  const nx0 = n00 * (1 - ux) + n10 * ux;
  const nx1 = n01 * (1 - ux) + n11 * ux;
  return nx0 * (1 - uy) + nx1 * uy;
}

export const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
export const pick = (list, u) => list[Math.min(list.length - 1, Math.floor(u * list.length))];
