// floor-variants.js
// Procedural floor variants for Foam Green City (DepEd MPSS / Philippine domestic interior aesthetic)
// Authored for FGC by Antigravity under delegated brief (2026-10-03).

export const FLOOR_IDS = [
  'bare',
  'creamCeramic',
  'greenCheckerboard',
  'redLinoleum',
  'concrete',
  'mismatchedTiles',
  'abruptPatches',
  'whiteTile',
  'maroonTile',
  'imageTile',
];

import { FLOOR_TILE_IMAGES } from './floor-tiles.js?v=7a89c05d69';

// Images from the floor tile bank are loaded once and shared between rooms.
const bankTextures = new Map();
function bankTexture(THREE, file) {
  if (!bankTextures.has(file)) {
    const texture = new THREE.TextureLoader().load(encodeURI(file));
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    bankTextures.set(file, texture);
  }
  return bankTextures.get(file);
}

// Color palette constants aligning with DepEd MPSS scheme & Philippine domestic interiors
const PALETTE = {
  foamGreen:       '#BFDCC9', // DepEd Foam Green
  palmyraGreen:    '#4E7C63', // DepEd Palmyra Green accent
  darkPalmyra:     '#335342', // Deep green accent / tile border
  creamBase:       '#EAE5D5', // Classroom / office cream ceramic tile
  creamLight:      '#F4EFE0',
  creamDark:       '#D9D3C1',
  groutDark:       '#858074', // Cement grout line
  concreteGray:    '#9C9C95', // DepEd non-skid gray cement
  concreteLight:   '#A8A8A1',
  concreteDark:    '#878780',
  terracotta:      '#B0553A', // Clay replacement tile
  mustardYellow:   '#CFA348', // Vintage ochre replacement
  fadedMint:       '#639077', // Soft green replacement
  darkBrown:       '#4C3729', // Dark brown replacement
  starkWhite:      '#F8F8F7', // Bright glazed replacement
  slateBlue:       '#5E737E', // Slate blue replacement
  linoRed:         '#8E2323', // Vintage Philippine red linoleum
  linoDarkRed:     '#6F1919',
  linoGoldCream:   '#DECFA8',
  thresholdMetal:  '#9B9790', // Aluminium transition strip
  joinTape:        '#B0A17A', // Heavy-duty seam tape
};

// Deterministic PRNG (mulberry32) matching Foam Green City streaming
function createPrng(seed) {
  let s = (typeof seed === 'number' ? seed : 12345) >>> 0;
  return function() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Normalize incoming variant names to canonical FLOOR_IDS
function normalizeVariant(v) {
  if (!v) return 'creamCeramic';
  const clean = String(v).trim().toLowerCase().replace(/[-_\s]/g, '');
  if(clean==='bare') return 'bare';
  if(clean==='whitetile') return 'whiteTile';
  if(clean==='maroontile') return 'maroonTile';
  if(clean==='imagetile') return 'imageTile';
  if (clean.includes('cream') || clean.includes('ceramic')) return 'creamCeramic';
  if (clean.includes('check') || (clean.includes('green') && !clean.includes('foam'))) return 'greenCheckerboard';
  if (clean.includes('lino') || clean.includes('red')) return 'redLinoleum';
  if (clean.includes('concrete') || clean.includes('cement')) return 'concrete';
  if (clean.includes('mismatch') || clean.includes('replace')) return 'mismatchedTiles';
  if (clean.includes('patch') || clean.includes('border') || clean.includes('abrupt')) return 'abruptPatches';
  return 'creamCeramic';
}

// -----------------------------------------------------------------------------
// Procedural Canvas Texture Generators
// All textures are created on-demand, modest resolution (512x512) for older 2GB GPUs.
// Crunchy NearestFilter preserves the retro screensaver / lo-fi aesthetic.
// -----------------------------------------------------------------------------

function createTileCanvasTexture(THREE, width, height, drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Grouted square tiles, 4x4 to the texture. `grout` is the joint's half-width in pixels: at 1,
// with 0.4 m tiles, a joint is about 6 mm. The default colours are the cream ceramic tile.
function generateCreamTileTexture(THREE, rng, { rgb = [234, 229, 213], groutColour = PALETTE.groutDark, grout = 1, tintRange = 12 } = {}) {
  return createTileCanvasTexture(THREE, 512, 512, (ctx, w, h) => {
    // Cement grout base
    ctx.fillStyle = groutColour;
    ctx.fillRect(0, 0, w, h);

    const tiles = 4;
    const size = w / tiles;

    for (let x = 0; x < tiles; x++) {
      for (let y = 0; y < tiles; y++) {
        const tx = x * size + grout;
        const ty = y * size + grout;
        const tw = size - grout * 2;
        const th = size - grout * 2;

        // Slight tonal difference per tile glaze
        const tint = (rng() - 0.5) * tintRange;
        const r = Math.min(255, Math.max(0, rgb[0] + tint));
        const g = Math.min(255, Math.max(0, rgb[1] + tint * 0.9));
        const b = Math.min(255, Math.max(0, rgb[2] + tint * 0.7));
        ctx.fillStyle = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
        ctx.fillRect(tx, ty, tw, th);

        // Pressed edge bevel highlights (top/left bright, bottom/right soft shadow)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(tx, ty, tw, 1);
        ctx.fillRect(tx, ty, 1, th);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(tx, ty + th - 1, tw, 1);
        ctx.fillRect(tx + tw - 1, ty, 1, th);

        // Faint micro-mottle / ceramic glaze speckle
        for (let s = 0; s < 40; s++) {
          const sx = tx + rng() * tw;
          const sy = ty + rng() * th;
          ctx.fillStyle = rng() < 0.5 ? 'rgba(255,255,255,0.25)' : 'rgba(120,110,95,0.12)';
          ctx.fillRect(sx, sy, 2, 2);
        }
      }
    }
  });
}

// Green checkerboard: 4x4 tiles in 1.6 m x 1.6 m (0.4 m per tile)
function generateGreenCheckerTexture(THREE, rng, inverted = false) {
  return createTileCanvasTexture(THREE, 512, 512, (ctx, w, h) => {
    ctx.fillStyle = PALETTE.darkPalmyra;
    ctx.fillRect(0, 0, w, h);

    const tiles = 4;
    const size = w / tiles;
    const seam = 3;

    for (let x = 0; x < tiles; x++) {
      for (let y = 0; y < tiles; y++) {
        const isPalmyra = ((x + y) % 2 === 0) ^ inverted;
        const tx = x * size + seam;
        const ty = y * size + seam;
        const tw = size - seam * 2;
        const th = size - seam * 2;

        if (isPalmyra) {
          ctx.fillStyle = PALETTE.palmyraGreen;
        } else {
          ctx.fillStyle = PALETTE.foamGreen;
        }
        ctx.fillRect(tx, ty, tw, th);

        // Subtle vintage vinyl scuff / grain streaks
        ctx.fillStyle = isPalmyra ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.18)';
        for (let k = 0; k < 6; k++) {
          const qy = ty + rng() * th;
          ctx.fillRect(tx, qy, tw * (0.3 + rng() * 0.7), 2);
        }

        // Tile edge bevel
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(tx, ty, tw, 2);
        ctx.fillRect(tx, ty, 2, th);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(tx, ty + th - 2, tw, 2);
        ctx.fillRect(tx + tw - 2, ty, 2, th);
      }
    }
  });
}

// Raw concrete / non-skid gray cement: 2.0 m x 2.0 m bay
function generateConcreteTexture(THREE, rng, options = {}) {
  const { toneShift = 0 } = options;
  return createTileCanvasTexture(THREE, 512, 512, (ctx, w, h) => {
    // Base gray cement
    const gray = Math.round(Math.min(220, Math.max(90, 156 + toneShift)));
    ctx.fillStyle = `rgb(${gray}, ${gray}, ${Math.round(gray * 0.96)})`;
    ctx.fillRect(0, 0, w, h);

    // Mottled curing clouds / float trowel marks
    for (let i = 0; i < 24; i++) {
      const cx = rng() * w;
      const cy = rng() * h;
      const rad = 40 + rng() * 120;
      const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, rad);
      const isLight = rng() < 0.5;
      grad.addColorStop(0, isLight ? 'rgba(210,210,205,0.22)' : 'rgba(95,95,90,0.25)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Trowel swipe lines
    ctx.strokeStyle = 'rgba(110,110,105,0.14)';
    ctx.lineWidth = 3;
    for (let j = 0; j < 8; j++) {
      ctx.beginPath();
      const sy = rng() * h;
      ctx.arc(w * 0.5, sy, 180 + rng() * 100, -0.4, 0.4);
      ctx.stroke();
    }

    // Expansion screed groove on borders (2m bay cut lines)
    ctx.fillStyle = PALETTE.concreteDark;
    ctx.fillRect(0, 0, w, 4);
    ctx.fillRect(0, 0, 4, h);
    ctx.fillRect(0, h - 4, w, 4);
    ctx.fillRect(w - 4, 0, 4, h);

    // Fine aggregate specks
    for (let n = 0; n < 300; n++) {
      const px = rng() * w;
      const py = rng() * h;
      ctx.fillStyle = rng() < 0.4 ? 'rgba(60,60,55,0.4)' : 'rgba(240,240,235,0.35)';
      ctx.fillRect(px, py, 2, 2);
    }
  });
}

// Procedural Philippine domestic red linoleum (2.0 m x 2.0 m repeat)
// Used as fallback or standalone generator with authentic starburst-diamond mat motif
function generateRedLinoleumTexture(THREE, rng) {
  return createTileCanvasTexture(THREE, 512, 512, (ctx, w, h) => {
    ctx.fillStyle = PALETTE.linoDarkRed;
    ctx.fillRect(0, 0, w, h);

    const cells = 4;
    const cs = w / cells;

    for (let cx = 0; cx < cells; cx++) {
      for (let cy = 0; cy < cells; cy++) {
        const x0 = cx * cs;
        const y0 = cy * cs;
        const isCheck = (cx + cy) % 2 === 0;

        ctx.fillStyle = isCheck ? PALETTE.linoRed : PALETTE.linoDarkRed;
        ctx.fillRect(x0 + 2, y0 + 2, cs - 4, cs - 4);

        // Gold-cream geometric decorative diamond & starburst
        ctx.strokeStyle = PALETTE.linoGoldCream;
        ctx.lineWidth = 2;
        ctx.strokeRect(x0 + 12, y0 + 12, cs - 24, cs - 24);

        // Center diamond
        const midX = x0 + cs / 2;
        const midY = y0 + cs / 2;
        ctx.fillStyle = PALETTE.linoGoldCream;
        ctx.beginPath();
        ctx.moveTo(midX, midY - 14);
        ctx.lineTo(midX + 14, midY);
        ctx.lineTo(midX, midY + 14);
        ctx.lineTo(midX - 14, midY);
        ctx.closePath();
        ctx.fill();

        // Dark red center pip
        ctx.fillStyle = PALETTE.linoDarkRed;
        ctx.fillRect(midX - 3, midY - 3, 6, 6);
      }
    }

    // Subtle gloss sheen
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, 0, w, h);
  });
}

// Transition / threshold strip texture (aluminium or dark wood)
function generateThresholdTexture(THREE, isMetal = true) {
  return createTileCanvasTexture(THREE, 256, 64, (ctx, w, h) => {
    ctx.fillStyle = isMetal ? PALETTE.thresholdMetal : PALETTE.darkBrown;
    ctx.fillRect(0, 0, w, h);

    // Bevel highlights & longitudinal extrusion lines
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(0, 0, w, 3);
    ctx.fillRect(0, 6, w, 2);

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, h - 3, w, 3);
    ctx.fillRect(0, h - 8, w, 2);

    // Screw / rivet points every 32px
    if (isMetal) {
      for (let sx = 16; sx < w; sx += 48) {
        ctx.fillStyle = '#6E6A63';
        ctx.beginPath();
        ctx.arc(sx, h / 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#E5E2DB';
        ctx.fillRect(sx - 3, h / 2 - 1, 6, 2);
      }
    }
  });
}

// -----------------------------------------------------------------------------
// Geometry Helper: Metric-Subdivided Floor Plane
// Generates X [-width/2, width/2], Z [-length, 0], at Y=0.
// UVs are mapped to true metric sizes so changing room width NEVER stretches pattern.
// Vertex density is subdivided along length/width for distance-squared curvature shader.
// -----------------------------------------------------------------------------

function createMetricFloorPlane({
  THREE,
  width,
  length,
  metricScaleX,
  metricScaleY,
  offsetX = 0,
  offsetZ = 0,
  rotate90 = false,
  widthSegments = Math.max(2, Math.round(width * 2)),
  lengthSegments = Math.max(4, Math.round(length * 2)),
}) {
  const geo = new THREE.PlaneGeometry(width, length, widthSegments, lengthSegments);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;

  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);

    // Coordinate mapping:
    // When plane is rotated -PI/2 on X and positioned at (0, 0, -length/2):
    // px is in [-width/2, width/2]
    // py is in [-length/2, length/2]
    // local Z from entrance (Z=0) to far wall (Z=-length) equals (py + length/2)
    const worldDistX = px + width / 2 + offsetX;
    const worldDistZ = py + length / 2 + offsetZ;

    let u = worldDistX / metricScaleX;
    let v = worldDistZ / metricScaleY;

    if (rotate90) {
      const temp = u;
      u = v;
      v = temp;
    }

    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;
  return geo;
}

// -----------------------------------------------------------------------------
// Main Floor Variant Factory
// -----------------------------------------------------------------------------

export function createFloorVariant({
  THREE,
  width = 4,
  length = 12,
  seed = 0,
  variant = 'creamCeramic',
  retired = false,
  curvize = (m) => m,
  linoleumTextureUrl,
  sharedLinoleumTexture,
} = {}) {
  if (!THREE) {
    throw new Error('createFloorVariant requires the THREE library object');
  }

  const group = new THREE.Group();
  group.name = `floor-${variant}-${seed}`;

  // Resource ownership ledger: tracks resources explicitly owned by this group
  const ownedGeometries = new Set();
  const ownedMaterials = new Set();
  const ownedTextures = new Set();

  function trackGeo(g) { ownedGeometries.add(g); return g; }
  function trackMat(m) { ownedMaterials.add(m); return m; }
  function trackTex(t) { ownedTextures.add(t); return t; }

  const applyCurvize = typeof curvize === 'function' ? curvize : (m) => m;
  const rng = createPrng(seed);
  let normalizedVariant = normalizeVariant(variant);
  // The coloured replacement-tile floor is retired: it is not a floor seen in Philippine houses.
  // It stays reachable for inspection through `retired`.
  if (normalizedVariant === 'mismatchedTiles' && !retired) normalizedVariant = 'whiteTile';
  // With no images in the bank, an image floor is a plain white tiled one.
  if (normalizedVariant === 'imageTile' && !FLOOR_TILE_IMAGES.length) normalizedVariant = 'whiteTile';

  // Helper to construct a standard floor mesh positioned at Y=0
  function createMesh(geo, mat, posY = 0, posZ = -length / 2) {
    const mesh = new THREE.Mesh(trackGeo(geo), trackMat(mat));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, posY, posZ);
    group.add(mesh);
    return mesh;
  }

  // Helper for overlays to completely prevent Z-fighting and flicker
  function prepareOverlayMaterial(mat) {
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = -1.0;
    mat.polygonOffsetUnits = -1.0;
    return applyCurvize(mat);
  }

  // Determine linoleum texture source
  function getLinoleumTexture() {
    if (sharedLinoleumTexture) return sharedLinoleumTexture;

    // Resolve URL: prefer explicit URL, else check location
    let url = linoleumTextureUrl;
    if (!url) {
      const isFgcAgPreview = typeof window !== 'undefined' && window.location.pathname.includes('/fgc-ag/');
      url = isFgcAgPreview
        ? '../foam-green-city/models/textures/floor_linoleum_red.png'
        : 'models/textures/floor_linoleum_red.png';
    }

    const loader = new THREE.TextureLoader();
    let tex;
    try {
      tex = loader.load(url);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      trackTex(tex);
    } catch {
      // Fallback to procedural linoleum canvas if file loading throws
      tex = trackTex(generateRedLinoleumTexture(THREE, rng));
    }
    return tex;
  }

  // ---------------------------------------------------------------------------
  // Variant 1: Cream Ceramic Tiles (0.4 m x 0.4 m)
  // Strange variations: scale jump to 0.8m large format, diagonal band, or offset fault
  // ---------------------------------------------------------------------------
  if (normalizedVariant === 'whiteTile' || normalizedVariant === 'maroonTile') {
    // Plain glazed tiles with narrow joints: white is the usual floor, maroon the older one.
    const white = normalizedVariant === 'whiteTile';
    const tile = white ? [0.3, 0.4, 0.4, 0.6][Math.floor(rng() * 4)] : [0.2, 0.3, 0.3][Math.floor(rng() * 3)];
    const tex = trackTex(generateCreamTileTexture(THREE, rng, white
      ? { rgb: [238, 238, 232], groutColour: '#b4b1a6', tintRange: 6 }
      : { rgb: [116, 40, 42], groutColour: '#5f554d', tintRange: 16 }));
    createMesh(createMetricFloorPlane({ THREE, width, length, metricScaleX: tile * 4, metricScaleY: tile * 4 }),
      applyCurvize(new THREE.MeshLambertMaterial({ map: tex })));
    group.userData.tile = tile;
  }
  else if (normalizedVariant === 'imageTile') {
    // A supplied image, repeated at the size its file name gives. The texture is shared, not owned.
    const entry = FLOOR_TILE_IMAGES[Math.floor(rng() * FLOOR_TILE_IMAGES.length)];
    createMesh(createMetricFloorPlane({ THREE, width, length, metricScaleX: entry.metres, metricScaleY: entry.metres * entry.aspect }),
      applyCurvize(new THREE.MeshLambertMaterial({ map: bankTexture(THREE, entry.file) })));
    group.userData.tileImage = entry.file;
  }
  if(normalizedVariant==='bare'){
    createMesh(new THREE.PlaneGeometry(width,length,Math.ceil(width),Math.ceil(length*2)),applyCurvize(new THREE.MeshLambertMaterial({color:0x9c9c95})));
  }
  if (normalizedVariant === 'creamCeramic') {
    const tex = trackTex(generateCreamTileTexture(THREE, rng));
    const mat = applyCurvize(new THREE.MeshLambertMaterial({ map: tex }));

    const mode = Math.abs(seed) % 4;

    if (mode === 1) {
      // Strange variation: Scale jump halfway through the room (Z = -6m)
      // Front half is 0.4m tiles; back half jumps to 0.8m large-format tiles!
      const halfLen = length / 2;
      const frontGeo = createMetricFloorPlane({
        THREE, width, length: halfLen,
        metricScaleX: 1.6, metricScaleY: 1.6, // 4 tiles per 1.6m = 0.4m tiles
      });
      createMesh(frontGeo, mat, 0, -halfLen / 2);

      const backGeo = createMetricFloorPlane({
        THREE, width, length: halfLen,
        metricScaleX: 3.2, metricScaleY: 3.2, // doubled repeat = 0.8m tiles
      });
      createMesh(backGeo, mat, 0, -length + halfLen / 2);

      // Join seam divider at Z = -6m
      const seamGeo = createMetricFloorPlane({
        THREE, width, length: 0.05,
        metricScaleX: 1.6, metricScaleY: 0.05,
        lengthSegments: 1,
      });
      const seamMat = prepareOverlayMaterial(new THREE.MeshLambertMaterial({ color: 0x6e685f }));
      createMesh(seamGeo, seamMat, 0.001, -halfLen);

    } else if (mode === 2) {
      // Strange variation: Central section (Z -3m to -9m) turned 45 degrees
      const frontLen = length / 4;
      const midLen = length / 2;
      const backLen = length - frontLen - midLen;

      // Front straight
      const frontGeo = createMetricFloorPlane({
        THREE, width, length: frontLen,
        metricScaleX: 1.6, metricScaleY: 1.6,
      });
      createMesh(frontGeo, mat, 0, -frontLen / 2);

      // Middle 45-degree diamond band
      const midGeo = new THREE.PlaneGeometry(
        width, midLen,
        Math.max(2, Math.round(width * 2)),
        Math.max(4, Math.round(midLen * 2))
      );
      const pos = midGeo.attributes.position;
      const uv = midGeo.attributes.uv;
      const sqrt2 = Math.SQRT1_2;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i) + width / 2;
        const py = pos.getY(i) + midLen / 2;
        const u = ((px + py) * sqrt2) / 1.6;
        const v = ((px - py) * sqrt2) / 1.6;
        uv.setXY(i, u, v);
      }
      uv.needsUpdate = true;
      createMesh(midGeo, mat, 0, -frontLen - midLen / 2);

      // Back straight
      const backGeo = createMetricFloorPlane({
        THREE, width, length: backLen,
        metricScaleX: 1.6, metricScaleY: 1.6,
      });
      createMesh(backGeo, mat, 0, -frontLen - midLen - backLen / 2);

    } else if (mode === 3) {
      // Strange variation: Longitudinal seam fault down the center (X = 0)
      // Left and right halves staggered by 0.2 m (half a tile offset)
      const halfW = width / 2;
      const leftGeo = createMetricFloorPlane({
        THREE, width: halfW, length,
        metricScaleX: 1.6, metricScaleY: 1.6,
        offsetX: 0, offsetZ: 0,
      });
      const leftMesh = createMesh(leftGeo, mat, 0, -length / 2);
      leftMesh.position.x = -halfW / 2;

      const rightGeo = createMetricFloorPlane({
        THREE, width: halfW, length,
        metricScaleX: 1.6, metricScaleY: 1.6,
        offsetX: 0, offsetZ: 0.2, // half-tile slip
      });
      const rightMesh = createMesh(rightGeo, mat, 0, -length / 2);
      rightMesh.position.x = halfW / 2;

    } else {
      // Standard continuous 0.4 m tile grid across the room
      const geo = createMetricFloorPlane({
        THREE, width, length,
        metricScaleX: 1.6, metricScaleY: 1.6,
      });
      createMesh(geo, mat);
    }
  }

  // ---------------------------------------------------------------------------
  // Variant 2: Green Checkerboard (DepEd Foam Green & Palmyra Green)
  // Strange variations: checkerboard phase inversion fault, scale step, or diamond band
  // ---------------------------------------------------------------------------
  else if (normalizedVariant === 'greenCheckerboard') {
    const tex = trackTex(generateGreenCheckerTexture(THREE, rng, false));
    const mat = applyCurvize(new THREE.MeshLambertMaterial({ map: tex }));

    const mode = Math.abs(seed) % 4;

    if (mode === 1) {
      // Strange variation: Longitudinal phase fault line at X = 0 (or X = -1m)
      // Across the fault line, the checkerboard inverts so green meets green!
      const splitX = width > 4 ? -1.0 : 0.0;
      const leftW = splitX - (-width / 2);
      const rightW = (width / 2) - splitX;

      const leftGeo = createMetricFloorPlane({
        THREE, width: leftW, length,
        metricScaleX: 1.6, metricScaleY: 1.6,
      });
      const leftMesh = createMesh(leftGeo, mat, 0, -length / 2);
      leftMesh.position.x = -width / 2 + leftW / 2;

      const invertedTex = trackTex(generateGreenCheckerTexture(THREE, rng, true));
      const invertedMat = applyCurvize(new THREE.MeshLambertMaterial({ map: invertedTex }));
      const rightGeo = createMetricFloorPlane({
        THREE, width: rightW, length,
        metricScaleX: 1.6, metricScaleY: 1.6,
      });
      const rightMesh = createMesh(rightGeo, invertedMat, 0, -length / 2);
      rightMesh.position.x = width / 2 - rightW / 2;

    } else if (mode === 2) {
      // Strange variation: Scale step at Z = -6m (0.4m check jumps to 0.8m large check)
      const halfLen = length / 2;
      const frontGeo = createMetricFloorPlane({
        THREE, width, length: halfLen,
        metricScaleX: 1.6, metricScaleY: 1.6,
      });
      createMesh(frontGeo, mat, 0, -halfLen / 2);

      const backGeo = createMetricFloorPlane({
        THREE, width, length: halfLen,
        metricScaleX: 3.2, metricScaleY: 3.2, // 0.8m check
      });
      createMesh(backGeo, mat, 0, -length + halfLen / 2);

    } else if (mode === 3) {
      // Strange variation: 45-degree diamond checker transition in back half
      const halfLen = length / 2;
      const frontGeo = createMetricFloorPlane({
        THREE, width, length: halfLen,
        metricScaleX: 1.6, metricScaleY: 1.6,
      });
      createMesh(frontGeo, mat, 0, -halfLen / 2);

      const backGeo = new THREE.PlaneGeometry(
        width, halfLen,
        Math.max(2, Math.round(width * 2)),
        Math.max(4, Math.round(halfLen * 2))
      );
      const pos = backGeo.attributes.position;
      const uv = backGeo.attributes.uv;
      const sqrt2 = Math.SQRT1_2;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i) + width / 2;
        const py = pos.getY(i) + halfLen / 2;
        const u = ((px + py) * sqrt2) / 1.6;
        const v = ((px - py) * sqrt2) / 1.6;
        uv.setXY(i, u, v);
      }
      uv.needsUpdate = true;
      createMesh(backGeo, mat, 0, -length + halfLen / 2);

    } else {
      // Uniform checkerboard
      const geo = createMetricFloorPlane({
        THREE, width, length,
        metricScaleX: 1.6, metricScaleY: 1.6,
      });
      createMesh(geo, mat);
    }
  }

  // ---------------------------------------------------------------------------
  // Variant 3: Red Linoleum (Philippine Vintage Floor Mat Roll)
  // Owns UV mapping at 2.0 m repeat.
  // Strange variations: roll seam pattern mismatch or 90-degree rotated end offcut
  // ---------------------------------------------------------------------------
  else if (normalizedVariant === 'redLinoleum') {
    const tex = getLinoleumTexture();
    const mat = applyCurvize(new THREE.MeshLambertMaterial({ map: tex }));

    const mode = Math.abs(seed) % 3;

    if (mode === 1) {
      // Strange variation: Linoleum roll seams with pattern offset slip!
      // In real Filipino homes, 2m rolls are laid side-by-side with no pattern match.
      const numRolls = Math.max(2, Math.round(width / 2));
      const rollWidth = width / numRolls;

      for (let r = 0; r < numRolls; r++) {
        const rollOffsetZ = (r % 2 === 1) ? 0.67 : 0.0; // 67cm pattern slip
        const rollGeo = createMetricFloorPlane({
          THREE, width: rollWidth, length,
          metricScaleX: 2.0, metricScaleY: 2.0, // 2.0m repeat
          offsetX: 0, offsetZ: rollOffsetZ,
        });
        const rollMesh = createMesh(rollGeo, mat, 0, -length / 2);
        rollMesh.position.x = -width / 2 + (r + 0.5) * rollWidth;
      }

    } else if (mode === 2) {
      // Strange variation: Roll ran out at Z = -8.5m!
      // Back 3.5m is an offcut piece laid sideways (90-degree rotated pattern) with a join tape!
      const runLen = length * 8.5 / 12;
      const offcutLen = length - runLen;

      const mainGeo = createMetricFloorPlane({
        THREE, width, length: runLen,
        metricScaleX: 2.0, metricScaleY: 2.0,
      });
      createMesh(mainGeo, mat, 0, -runLen / 2);

      const offcutGeo = createMetricFloorPlane({
        THREE, width, length: offcutLen,
        metricScaleX: 2.0, metricScaleY: 2.0,
        rotate90: true,
      });
      createMesh(offcutGeo, mat, 0, -runLen - offcutLen / 2);

      // Join tape seam line along Z = -8.5m
      const tapeGeo = createMetricFloorPlane({
        THREE, width, length: 0.06,
        metricScaleX: 2.0, metricScaleY: 0.06,
        lengthSegments: 1,
      });
      const tapeTex = trackTex(generateThresholdTexture(THREE, false));
      const tapeMat = prepareOverlayMaterial(new THREE.MeshLambertMaterial({ map: tapeTex }));
      createMesh(tapeGeo, tapeMat, 0.001, -runLen);

    } else {
      // Continuous uniform 2.0 m repeat roll
      const geo = createMetricFloorPlane({
        THREE, width, length,
        metricScaleX: 2.0, metricScaleY: 2.0,
      });
      createMesh(geo, mat);
    }
  }

  // ---------------------------------------------------------------------------
  // Variant 4: Concrete (DepEd Non-Skid Gray Cement)
  // Strange variations: irregular screed bay intervals or diagonal cold-joint pour
  // ---------------------------------------------------------------------------
  else if (normalizedVariant === 'concrete') {
    const tex = trackTex(generateConcreteTexture(THREE, rng));
    const mat = applyCurvize(new THREE.MeshLambertMaterial({ map: tex }));

    const mode = Math.abs(seed) % 3;

    if (mode === 1) {
      // Strange variation: Irregular screed bay intervals
      // Instead of regular 2m bays, bays are 1.8m, 3.4m, 2.2m, 4.6m with tone shifts
      const bayLengths = [2.0, 3.5, 2.0, 4.5].map(n => n * length / 12);
      let currentZ = 0;

      for (let b = 0; b < bayLengths.length; b++) {
        const blen = bayLengths[b];
        const toneShift = (b % 2 === 0 ? 15 : -18);
        const bayTex = trackTex(generateConcreteTexture(THREE, rng, { toneShift }));
        const bayMat = applyCurvize(new THREE.MeshLambertMaterial({ map: bayTex }));

        const bayGeo = createMetricFloorPlane({
          THREE, width, length: blen,
          metricScaleX: 2.0, metricScaleY: 2.0,
        });
        createMesh(bayGeo, bayMat, 0, -(currentZ + blen / 2));
        currentZ += blen;
      }

    } else if (mode === 2) {
      // Strange variation: Diagonal pour cold joint across the floor
      // Base slab + diagonal cold joint overlay
      const baseGeo = createMetricFloorPlane({
        THREE, width, length,
        metricScaleX: 2.0, metricScaleY: 2.0,
      });
      createMesh(baseGeo, mat);

      // Contrast pour section in front corner
      const altTex = trackTex(generateConcreteTexture(THREE, rng, { toneShift: 24 }));
      const altMat = prepareOverlayMaterial(new THREE.MeshLambertMaterial({ map: altTex }));
      const patchGeo = createMetricFloorPlane({
        THREE, width: width * 0.6, length: 5.0,
        metricScaleX: 2.0, metricScaleY: 2.0,
      });
      const patchMesh = createMesh(patchGeo, altMat, 0.001, -3.5);
      patchMesh.position.x = -width / 2 + (width * 0.6) / 2;

      // Diagonal joint line
      const jointGeo = createMetricFloorPlane({
        THREE, width: 0.05, length: 6.0,
        metricScaleX: 0.05, metricScaleY: 2.0,
        lengthSegments: 6,
      });
      const jointMat = prepareOverlayMaterial(new THREE.MeshLambertMaterial({ color: 0x5a5852 }));
      const jointMesh = createMesh(jointGeo, jointMat, 0.0015, -3.5);
      jointMesh.position.x = -width / 2 + (width * 0.6);

    } else {
      // Standard continuous concrete slab with 2.0m expansion bays
      const geo = createMetricFloorPlane({
        THREE, width, length,
        metricScaleX: 2.0, metricScaleY: 2.0,
      });
      createMesh(geo, mat);
    }
  }

  // ---------------------------------------------------------------------------
  // Variant 5: Mismatched Replacement Tiles
  // Base cream ceramic floor with discrete mismatched replacement tiles
  // snapped to the 0.4 m grid.
  // Strange variations: random scattered patches, trench repair line, or quad-tile cluster
  // ---------------------------------------------------------------------------
  else if (normalizedVariant === 'mismatchedTiles') {
    // 1. Base cream ceramic floor
    const baseTex = trackTex(generateCreamTileTexture(THREE, rng));
    const baseMat = applyCurvize(new THREE.MeshLambertMaterial({ map: baseTex }));
    const baseGeo = createMetricFloorPlane({
      THREE, width, length,
      metricScaleX: 1.6, metricScaleY: 1.6,
    });
    createMesh(baseGeo, baseMat);

    // Replacement palette (terracotta, mustard, mint, chocolate brown, white, slate blue)
    const REPLACEMENT_COLORS = [
      PALETTE.terracotta,
      PALETTE.mustardYellow,
      PALETTE.fadedMint,
      PALETTE.darkBrown,
      PALETTE.starkWhite,
      PALETTE.slateBlue,
    ];

    const repMaterials = REPLACEMENT_COLORS.map(col => {
      return prepareOverlayMaterial(new THREE.MeshLambertMaterial({ color: col }));
    });

    const tileSize = 0.4;
    const cols = Math.round(width / tileSize);
    const rows = Math.round(length / tileSize);

    const mode = Math.abs(seed) % 3;

    // Pick slots to replace
    const replacedSlots = new Set();

    if (mode === 1) {
      // Trench repair: continuous line of terracotta replacement tiles across corridor
      const trenchRow = 6 + Math.floor(rng() * (rows - 12));
      for (let c = 1; c < cols - 1; c++) {
        replacedSlots.add(`${c},${trenchRow}`);
        if (rng() < 0.3) replacedSlots.add(`${c},${trenchRow + 1}`);
      }
    }

    // Additional scattered replacement tiles (10 to 20 total)
    const count = Math.min(cols * rows * 0.15, 12 + Math.floor(rng() * 12));
    while (replacedSlots.size < count) {
      const c = Math.floor(rng() * cols);
      const r = Math.floor(rng() * rows);
      replacedSlots.add(`${c},${r}`);
    }

    // Place replacement tile overlay meshes
    for (const key of replacedSlots) {
      const [colStr, rowStr] = key.split(',');
      const c = parseInt(colStr, 10);
      const r = parseInt(rowStr, 10);

      const posX = -width / 2 + (c + 0.5) * tileSize;
      const posZ = -(r + 0.5) * tileSize;

      const matIndex = Math.floor(rng() * repMaterials.length);
      const tileMat = repMaterials[matIndex];

      // Quad-tile cluster surprise: in 1 slot, 4 miniature 0.2m tiles jammed into 1 slot!
      if (mode === 2 && rng() < 0.1) {
        for (let dx = -1; dx <= 1; dx += 2) {
          for (let dz = -1; dz <= 1; dz += 2) {
            const subGeo = createMetricFloorPlane({
              THREE, width: 0.18, length: 0.18,
              metricScaleX: 0.18, metricScaleY: 0.18,
              widthSegments: 1, lengthSegments: 1,
            });
            const subMat = repMaterials[Math.floor(rng() * repMaterials.length)];
            const subMesh = createMesh(
              subGeo, subMat, 0.0012,
              posZ + dz * 0.095
            );
            subMesh.position.x = posX + dx * 0.095;
          }
        }
      } else {
        // Standard 0.38m replacement tile (leaving 2cm visible grout around edge)
        const tileGeo = createMetricFloorPlane({
          THREE, width: 0.38, length: 0.38,
          metricScaleX: 0.38, metricScaleY: 0.38,
          widthSegments: 1, lengthSegments: 1,
        });
        const tileMesh = createMesh(tileGeo, tileMat, 0.001, posZ);
        tileMesh.position.x = posX;

        // Subtle crooked hand-laid rotation on occasional replacement
        if (rng() < 0.25) {
          tileMesh.rotation.z = (rng() - 0.5) * 0.04;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Variant 6: Abrupt Patches or Borders
  // Styles: central linoleum runner over concrete, perimeter border, transverse room split,
  // or asymmetrical corner patch.
  // ---------------------------------------------------------------------------
  else if (normalizedVariant === 'abruptPatches') {
    const style = Math.abs(seed) % 4;

    if (style === 0) {
      // Style 0: Central Linoleum Runner / Island over Bare Concrete
      // Base concrete floor
      const concTex = trackTex(generateConcreteTexture(THREE, rng));
      const concMat = applyCurvize(new THREE.MeshLambertMaterial({ map: concTex }));
      const baseGeo = createMetricFloorPlane({
        THREE, width, length,
        metricScaleX: 2.0, metricScaleY: 2.0,
      });
      createMesh(baseGeo, concMat);

      // Red linoleum central runner (2.4m wide, spanning Z -1.5m to -10.5m)
      const runnerW = Math.min(width - 1.2, 2.4);
      const runnerLen = length - 3.0;
      const linoTex = getLinoleumTexture();
      const linoMat = prepareOverlayMaterial(new THREE.MeshLambertMaterial({ map: linoTex }));

      const runnerGeo = createMetricFloorPlane({
        THREE, width: runnerW, length: runnerLen,
        metricScaleX: 2.0, metricScaleY: 2.0,
      });
      createMesh(runnerGeo, linoMat, 0.0012, -length / 2);

      // Seam tape border along perimeter of the runner
      const tapeW = 0.05;
      const tapeTex = trackTex(generateThresholdTexture(THREE, false));
      const tapeMat = prepareOverlayMaterial(new THREE.MeshLambertMaterial({ map: tapeTex }));

      // Left & right tape strips
      for (const side of [-1, 1]) {
        const sideTapeGeo = createMetricFloorPlane({
          THREE, width: tapeW, length: runnerLen,
          metricScaleX: tapeW, metricScaleY: 2.0,
        });
        const tMesh = createMesh(sideTapeGeo, tapeMat, 0.0016, -length / 2);
        tMesh.position.x = side * (runnerW / 2);
      }

    } else if (style === 1) {
      // Style 1: Framed Perimeter Border (Dark Green Tile Frame around Cream Center)
      const borderWidth = 0.4;

      // Base cream ceramic center
      const creamTex = trackTex(generateCreamTileTexture(THREE, rng));
      const creamMat = applyCurvize(new THREE.MeshLambertMaterial({ map: creamTex }));
      const baseGeo = createMetricFloorPlane({
        THREE, width, length,
        metricScaleX: 1.6, metricScaleY: 1.6,
      });
      createMesh(baseGeo, creamMat);

      // Dark palmyra green tile border overlays along perimeter
      const borderTex = trackTex(generateGreenCheckerTexture(THREE, rng, false));
      const borderMat = prepareOverlayMaterial(new THREE.MeshLambertMaterial({ map: borderTex }));

      // Left border strip
      const leftBorderGeo = createMetricFloorPlane({
        THREE, width: borderWidth, length,
        metricScaleX: 0.4, metricScaleY: 0.4,
      });
      const leftMesh = createMesh(leftBorderGeo, borderMat, 0.001, -length / 2);
      leftMesh.position.x = -width / 2 + borderWidth / 2;

      // Right border strip
      const rightBorderGeo = createMetricFloorPlane({
        THREE, width: borderWidth, length,
        metricScaleX: 0.4, metricScaleY: 0.4,
      });
      const rightMesh = createMesh(rightBorderGeo, borderMat, 0.001, -length / 2);
      rightMesh.position.x = width / 2 - borderWidth / 2;

      // Front threshold border strip
      const frontW = width - borderWidth * 2;
      const frontBorderGeo = createMetricFloorPlane({
        THREE, width: frontW, length: borderWidth,
        metricScaleX: 0.4, metricScaleY: 0.4,
      });
      createMesh(frontBorderGeo, borderMat, 0.0012, -borderWidth / 2);

      // Back threshold border strip
      const backBorderGeo = createMetricFloorPlane({
        THREE, width: frontW, length: borderWidth,
        metricScaleX: 0.4, metricScaleY: 0.4,
      });
      createMesh(backBorderGeo, borderMat, 0.0012, -length + borderWidth / 2);

    } else if (style === 2) {
      // Style 2: Transverse Room Split (Two distinct halves meeting head-on)
      // Front half is cream ceramic (Z 0 to -6m), back half is red linoleum (Z -6 to -12m)
      const splitZ = length / 2;

      const creamTex = trackTex(generateCreamTileTexture(THREE, rng));
      const creamMat = applyCurvize(new THREE.MeshLambertMaterial({ map: creamTex }));
      const frontGeo = createMetricFloorPlane({
        THREE, width, length: splitZ,
        metricScaleX: 1.6, metricScaleY: 1.6,
      });
      createMesh(frontGeo, creamMat, 0, -splitZ / 2);

      const linoTex = getLinoleumTexture();
      const linoMat = applyCurvize(new THREE.MeshLambertMaterial({ map: linoTex }));
      const backGeo = createMetricFloorPlane({
        THREE, width, length: splitZ,
        metricScaleX: 2.0, metricScaleY: 2.0,
      });
      createMesh(backGeo, linoMat, 0, -splitZ - splitZ / 2);

      // Metal transition threshold strip at the join line
      const thresholdTex = trackTex(generateThresholdTexture(THREE, true));
      const thresholdMat = prepareOverlayMaterial(new THREE.MeshLambertMaterial({ map: thresholdTex }));
      const thresholdGeo = createMetricFloorPlane({
        THREE, width, length: 0.08,
        metricScaleX: 2.0, metricScaleY: 0.08,
        lengthSegments: 1,
      });
      createMesh(thresholdGeo, thresholdMat, 0.0018, -splitZ);

    } else {
      // Style 3: Asymmetrical Corner / Repair Patch
      // Base cream ceramic floor with abrupt concrete patch in one quadrant
      const creamTex = trackTex(generateCreamTileTexture(THREE, rng));
      const creamMat = applyCurvize(new THREE.MeshLambertMaterial({ map: creamTex }));
      const baseGeo = createMetricFloorPlane({
        THREE, width, length,
        metricScaleX: 1.6, metricScaleY: 1.6,
      });
      createMesh(baseGeo, creamMat);

      const patchW = Math.min(width * 0.55, 3.2);
      const patchLen = length / 3;
      const patchZ = -length * 6.5 / 12;

      const concTex = trackTex(generateConcreteTexture(THREE, rng));
      const concMat = prepareOverlayMaterial(new THREE.MeshLambertMaterial({ map: concTex }));
      const patchGeo = createMetricFloorPlane({
        THREE, width: patchW, length: patchLen,
        metricScaleX: 2.0, metricScaleY: 2.0,
      });
      const patchMesh = createMesh(patchGeo, concMat, 0.0012, patchZ);
      patchMesh.position.x = -width / 2 + patchW / 2;

      // Raw cut edge border lines
      const edgeGeo = createMetricFloorPlane({
        THREE, width: 0.04, length: patchLen,
        metricScaleX: 0.04, metricScaleY: 2.0,
      });
      const edgeMat = prepareOverlayMaterial(new THREE.MeshLambertMaterial({ color: 0x4a4740 }));
      const edgeMesh = createMesh(edgeGeo, edgeMat, 0.0016, patchZ);
      edgeMesh.position.x = -width / 2 + patchW;
    }
  }

  // Attach group metadata
  group.userData.variant = normalizedVariant;
  group.userData.width = width;
  group.userData.length = length;
  group.userData.seed = seed;

  // Explicit lifecycle cleanup function
  group.userData.dispose = function() {
    for (const tex of ownedTextures) {
      if (tex && typeof tex.dispose === 'function') tex.dispose();
    }
    ownedTextures.clear();

    for (const mat of ownedMaterials) {
      if (mat && typeof mat.dispose === 'function') mat.dispose();
    }
    ownedMaterials.clear();

    for (const geo of ownedGeometries) {
      if (geo && typeof geo.dispose === 'function') geo.dispose();
    }
    ownedGeometries.clear();

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }
  };

  return group;
}
