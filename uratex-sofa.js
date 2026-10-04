// uratex-sofa.js
// Procedural Uratex-style folding foam sofa bed with cylinder headboard bolster and pillows.
// Authored for Foam Green City by Antigravity (2026-10-04).

export const FABRIC_STYLES = [
  { id: 'trellisNavy', name: 'Diamond Trellis (Navy/Grey Reference)', isDark: true },
  { id: 'vintageFloral', name: 'Vintage Floral Mattress Print (Cream/Rose)', isDark: false },
  { id: 'retroPlaid', name: 'Retro Tartan Plaid (Red/Green/Cream)', isDark: false },
  { id: 'foamGreenDiamond', name: 'DepEd Foam Green Quilted', isDark: false },
  { id: 'solidMaroon', name: 'Solid Velvet Maroon', isDark: true },
  { id: 'solidCream', name: 'Solid Woven Cream Linen', isDark: false },
];

export const PILLOW_CONFIGS = [
  { id: 'singleCenter', name: '1 Center Throw Pillow (Reference Match)' },
  { id: 'twoThrows', name: '2 Corner Throw Pillows' },
  { id: 'threeThrows', name: '3 Throw Pillows (Lived-in Cluster)' },
  { id: 'bolsterPair', name: '2 Side Hotdog Bolsters' },
  { id: 'domesticMix', name: 'Domestic Mix (1 Throw + 1 Hotdog Bolster)' },
  { id: 'sleepingPillows', name: '2 Rectangular Sleeping Pillows' },
  { id: 'roundCushions', name: '2 Round Button-Tufted Cushions' },
  { id: 'none', name: 'No Pillows (Bare Sofa Bed)' },
];

// -----------------------------------------------------------------------------
// Procedural Fabric Canvas Texture Generators
// Sized and scaled to match authentic Philippine mattress fabric prints.
// -----------------------------------------------------------------------------

function createFabricTexture(THREE, drawFn, repeatU = 1.0, repeatV = 1.0) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatU, repeatV);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 1. Diamond trellis pattern matching the user's reference photo
// Large, bold interlocking geometric diamonds
function generateTrellisTexture(THREE) {
  return createFabricTexture(THREE, (ctx, w, h) => {
    // Dark slate / charcoal base
    ctx.fillStyle = '#424954';
    ctx.fillRect(0, 0, w, h);

    // Subtle fabric twill crosshatch
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let x = 0; x < w; x += 4) ctx.fillRect(x, 0, 1, h);

    // Interlocking diamond lattice (bold white / light silver lines)
    ctx.strokeStyle = '#e6edf5';
    ctx.lineWidth = 14;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';

    const step = 128; // 4 diamonds across 512px
    for (let offset = -w; offset <= w * 2; offset += step) {
      ctx.beginPath();
      ctx.moveTo(offset, 0); ctx.lineTo(offset + h, h);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(offset, 0); ctx.lineTo(offset - h, h);
      ctx.stroke();
    }

    // Inner dark accent pinstripe running through each band
    ctx.strokeStyle = '#2b313b';
    ctx.lineWidth = 3;
    for (let offset = -w; offset <= w * 2; offset += step) {
      ctx.beginPath();
      ctx.moveTo(offset, 0); ctx.lineTo(offset + h, h);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(offset, 0); ctx.lineTo(offset - h, h);
      ctx.stroke();
    }
  }, 1.6, 1.6);
}

// 2. Vintage Philippine floral mattress print
function generateFloralTexture(THREE) {
  return createFabricTexture(THREE, (ctx, w, h) => {
    ctx.fillStyle = '#f5efe0';
    ctx.fillRect(0, 0, w, h);

    // Soft vintage rosebuds and leafy vine scrolls
    const drawRose = (cx, cy, rad, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();

      // Petals
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 2.5;
      for (let r = rad * 0.4; r < rad; r += 5) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, (r * 1.5) % 6, (r * 1.5 + 3.8) % 6);
        ctx.stroke();
      }

      // Leaves
      ctx.fillStyle = '#658a6a';
      ctx.beginPath();
      ctx.ellipse(cx + rad + 4, cy - 2, 9, 5, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx - rad - 4, cy + 3, 8, 4, -0.5, 0, Math.PI * 2);
      ctx.fill();
    };

    for (let x = 64; x < w; x += 170) {
      for (let y = 64; y < h; y += 170) {
        drawRose(x, y, 22, '#c75d6a');
        drawRose(x + 85, y + 85, 15, '#b9737c');
      }
    }
  }, 1.2, 1.2);
}

// 3. Retro tartan / plaid mattress fabric
function generatePlaidTexture(THREE) {
  return createFabricTexture(THREE, (ctx, w, h) => {
    ctx.fillStyle = '#8f2626'; // Deep crimson base
    ctx.fillRect(0, 0, w, h);

    const step = 128;
    // Dark green bands
    ctx.fillStyle = 'rgba(28, 56, 36, 0.8)';
    for (let i = 0; i < w; i += step) {
      ctx.fillRect(i, 0, 32, h);
      ctx.fillRect(0, i, w, 32);
    }

    // Yellow lines
    ctx.strokeStyle = '#e5c450';
    ctx.lineWidth = 3;
    for (let i = 0; i < w; i += step) {
      ctx.beginPath();
      ctx.moveTo(i + 64, 0); ctx.lineTo(i + 64, h);
      ctx.moveTo(0, i + 64); ctx.lineTo(w, i + 64);
      ctx.stroke();
    }

    // White pin stripes
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (let i = 0; i < w; i += step) {
      ctx.beginPath();
      ctx.moveTo(i + 16, 0); ctx.lineTo(i + 16, h);
      ctx.moveTo(0, i + 16); ctx.lineTo(w, i + 16);
      ctx.stroke();
    }
  }, 1.2, 1.2);
}

// 4. Foam green quilted diamond fabric
function generateFoamGreenQuiltedTexture(THREE) {
  return createFabricTexture(THREE, (ctx, w, h) => {
    ctx.fillStyle = '#bfdcc9'; // DepEd Foam Green
    ctx.fillRect(0, 0, w, h);

    // Diamond tufting stitch lines
    ctx.strokeStyle = '#3e6b52';
    ctx.lineWidth = 3;
    const step = 64;
    for (let offset = -w; offset <= w * 2; offset += step) {
      ctx.beginPath();
      ctx.moveTo(offset, 0); ctx.lineTo(offset + h, h);
      ctx.moveTo(offset, 0); ctx.lineTo(offset - h, h);
      ctx.stroke();
    }

    // Tuft button dots at intersections
    ctx.fillStyle = '#335342';
    for (let x = 0; x <= w; x += step) {
      for (let y = 0; y <= h; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, 1.5, 1.5);
}

// 5. Solid woven linen texture
function generateSolidWovenTexture(THREE, baseColor) {
  return createFabricTexture(THREE, (ctx, w, h) => {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let x = 0; x < w; x += 3) ctx.fillRect(x, 0, 1, h);
  }, 2, 2);
}

// -----------------------------------------------------------------------------
// Pillow Geometries
// -----------------------------------------------------------------------------

// Square puffy throw pillow with convex bulging center
function createPuffyThrowPillowGeometry(THREE, size, depth) {
  const seg = 16;
  const geo = new THREE.BoxGeometry(size, size, depth, seg, seg, 6);
  const pos = geo.attributes.position;
  const halfS = size / 2;
  const halfD = depth / 2;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const nx = x / halfS; // -1 to 1
    const ny = y / halfS;
    const nz = z / halfD;

    // Plump dome bulge factor
    const bulge = Math.max(0, (1 - nx * nx) * (1 - ny * ny));
    const zOut = Math.sign(z) * bulge * (depth * 0.48);

    // Soft corner pull
    const cornerPull = 1 - 0.06 * (nx * nx * ny * ny);

    pos.setXYZ(i, x * cornerPull, y * cornerPull, z + zOut);
  }

  geo.computeVertexNormals();
  return geo;
}

// Round button-tufted cushion geometry
function createRoundCushionGeometry(THREE, radius, thickness) {
  const geo = new THREE.CylinderGeometry(radius, radius, thickness, 24, 6);
  const pos = geo.attributes.position;
  const halfT = thickness / 2;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const r = Math.sqrt(x * x + z * z) / radius; // 0 to 1
    const ny = y / halfT;

    // Center indentation for tuft button, outer edge plump
    let yBulge = y;
    if (Math.abs(ny) > 0.6) {
      const ringBulge = Math.sin(r * Math.PI) * (thickness * 0.28);
      yBulge = y + Math.sign(y) * ringBulge;
    }

    pos.setXYZ(i, x, yBulge, z);
  }

  geo.computeVertexNormals();
  return geo;
}

// Rounded box geometry for foam mattress tiers
function createRoundedBoxGeometry(THREE, width, height, depth, radius = 0.018) {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hd = depth / 2;

  shape.moveTo(-hw + radius, -hd);
  shape.lineTo(hw - radius, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + radius);
  shape.lineTo(hw, hd - radius);
  shape.quadraticCurveTo(hw, hd, hw - radius, hd);
  shape.lineTo(-hw + radius, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - radius);
  shape.lineTo(-hw, -hd + radius);
  shape.quadraticCurveTo(-hw, -hd, -hw + radius, -hd);

  const extrudeSettings = {
    steps: 1,
    depth: height - radius * 2,
    bevelEnabled: true,
    bevelThickness: radius,
    bevelSize: radius,
    bevelSegments: 2,
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.center();
  geo.rotateX(-Math.PI / 2);
  return geo;
}

// -----------------------------------------------------------------------------
// Main Uratex Sofa Bed Factory
// -----------------------------------------------------------------------------

export function createUratexSofa({
  THREE,
  width = 1.25,          // Mattress width in metres (1.25m = double / semi-double)
  depth = 0.76,          // Total depth when folded as sofa (metres)
  seatHeight = 0.36,     // Height of two stacked foam tiers (0.18m each)
  bolsterRadius = 0.13,  // Headboard cylinder radius (0.26m diameter)
  fabricStyle = 'trellisNavy', // Fabric style key
  pillowConfig = 'singleCenter', // Pillow layout
  isFolded = true,       // true = sofa mode, false = unfolded bed mode
  curvize = (m) => m,
} = {}) {
  if (!THREE) {
    throw new Error('createUratexSofa requires the THREE library object');
  }

  const group = new THREE.Group();
  group.name = 'uratexSofa';

  const ownedGeometries = new Set();
  const ownedMaterials = new Set();
  const ownedTextures = new Set();

  function trackGeo(g) { ownedGeometries.add(g); return g; }
  function trackMat(m) { ownedMaterials.add(m); return m; }
  function trackTex(t) { ownedTextures.add(t); return t; }

  const applyCurvize = typeof curvize === 'function' ? curvize : (m) => m;

  // 1. Generate fabric texture
  let fabricTex;
  switch (fabricStyle) {
    case 'vintageFloral':
      fabricTex = trackTex(generateFloralTexture(THREE));
      break;
    case 'retroPlaid':
      fabricTex = trackTex(generatePlaidTexture(THREE));
      break;
    case 'foamGreenDiamond':
      fabricTex = trackTex(generateFoamGreenQuiltedTexture(THREE));
      break;
    case 'solidMaroon':
      fabricTex = trackTex(generateSolidWovenTexture(THREE, '#751d28'));
      break;
    case 'solidCream':
      fabricTex = trackTex(generateSolidWovenTexture(THREE, '#e5dec9'));
      break;
    case 'trellisNavy':
    default:
      fabricTex = trackTex(generateTrellisTexture(THREE));
      break;
  }

  // Base sofa material
  const sofaMaterial = applyCurvize(trackMat(new THREE.MeshLambertMaterial({
    map: fabricTex,
  })));

  // Crease / seam indentation material
  const creaseMaterial = applyCurvize(trackMat(new THREE.MeshLambertMaterial({
    color: 0x22262c,
  })));

  // Piping welting cord material
  const pipingMaterial = applyCurvize(trackMat(new THREE.MeshLambertMaterial({
    color: 0x313842,
  })));

  const tierHeight = seatHeight / 2; // 0.18m per tier

  // ---------------------------------------------------------------------------
  // Tier 1: Bottom Foam Mattress Tier (at floor Y = 0 to 0.18m)
  // ---------------------------------------------------------------------------
  const bottomTierGeo = trackGeo(createRoundedBoxGeometry(THREE, width, tierHeight, depth, 0.015));
  const bottomTier = new THREE.Mesh(bottomTierGeo, sofaMaterial);
  bottomTier.name = 'mattress-bottom';
  bottomTier.position.set(0, tierHeight / 2, -depth / 2);
  group.add(bottomTier);

  // ---------------------------------------------------------------------------
  // Tier 2: Top Foam Mattress Tier
  // ---------------------------------------------------------------------------
  if (isFolded) {
    // Folded on top of bottom tier
    const topTierGeo = trackGeo(createRoundedBoxGeometry(THREE, width, tierHeight, depth, 0.015));
    const topTier = new THREE.Mesh(topTierGeo, sofaMaterial);
    topTier.name = 'mattress-top';
    topTier.position.set(0, tierHeight + tierHeight / 2, -depth / 2);
    group.add(topTier);

    // Inward fold crease seam between bottom and top tiers
    const creaseGeo = trackGeo(new THREE.BoxGeometry(width + 0.001, 0.006, depth + 0.001));
    const crease = new THREE.Mesh(creaseGeo, creaseMaterial);
    crease.name = 'fold-crease';
    crease.position.set(0, tierHeight, -depth / 2);
    group.add(crease);

    // Front horizontal piping welts
    for (const yPos of [tierHeight, seatHeight]) {
      const weltGeo = trackGeo(new THREE.CylinderGeometry(0.005, 0.005, width - 0.02, 8));
      weltGeo.rotateZ(Math.PI / 2);
      const welt = new THREE.Mesh(weltGeo, pipingMaterial);
      welt.position.set(0, yPos - 0.005, -0.004);
      group.add(welt);
    }
  } else {
    // Unfolded bed mode: flips forward onto floor
    const topTierGeo = trackGeo(createRoundedBoxGeometry(THREE, width, tierHeight, depth, 0.015));
    const topTier = new THREE.Mesh(topTierGeo, sofaMaterial);
    topTier.name = 'mattress-unfolded';
    topTier.position.set(0, tierHeight / 2, depth / 2);
    group.add(topTier);
  }

  // ---------------------------------------------------------------------------
  // Headboard Bolster: Cylinder headboard running along back!
  // Ends are flush with mattress sides (length = width).
  // ---------------------------------------------------------------------------
  const headboardGroup = new THREE.Group();
  headboardGroup.name = 'headboard-bolster';

  const bZ = -depth + bolsterRadius;
  const bY = isFolded ? (seatHeight + bolsterRadius) : (tierHeight + bolsterRadius);

  // Cylinder bolster mesh running along X axis (exactly matching sofa width!)
  const cylinderGeo = trackGeo(new THREE.CylinderGeometry(bolsterRadius, bolsterRadius, width, 32));
  cylinderGeo.rotateZ(Math.PI / 2);
  const cylinderMesh = new THREE.Mesh(cylinderGeo, sofaMaterial);
  cylinderMesh.name = 'bolster-cylinder';
  cylinderMesh.position.set(0, bY, bZ);
  headboardGroup.add(cylinderMesh);

  // Flat end cap discs on left and right sides (flush with mattress sides)
  for (const side of [-1, 1]) {
    const endCapGeo = trackGeo(new THREE.CircleGeometry(bolsterRadius - 0.001, 24));
    endCapGeo.rotateY(side > 0 ? Math.PI / 2 : -Math.PI / 2);
    const endCap = new THREE.Mesh(endCapGeo, sofaMaterial);
    endCap.name = `bolster-end-${side > 0 ? 'right' : 'left'}`;
    endCap.position.set(side * (width / 2 + 0.001), bY, bZ);
    headboardGroup.add(endCap);

    // Outer rim welt piping on the cylinder ends
    const rimGeo = trackGeo(new THREE.TorusGeometry(bolsterRadius, 0.004, 6, 24));
    rimGeo.rotateY(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, pipingMaterial);
    rim.position.set(side * (width / 2), bY, bZ);
    headboardGroup.add(rim);
  }

  // Under-bolster rear support filler (sealing the rear edge against wall)
  const wedgeHeight = bolsterRadius;
  const wedgeDepth = bolsterRadius;
  const wedgeGeo = trackGeo(new THREE.BoxGeometry(width - 0.004, wedgeHeight, wedgeDepth));
  const wedgeMesh = new THREE.Mesh(wedgeGeo, sofaMaterial);
  wedgeMesh.name = 'bolster-rear-support';
  wedgeMesh.position.set(
    0,
    isFolded ? (seatHeight + wedgeHeight / 2) : (tierHeight + wedgeHeight / 2),
    -depth + wedgeDepth / 2
  );
  headboardGroup.add(wedgeMesh);

  group.add(headboardGroup);

  // ---------------------------------------------------------------------------
  // Pillows System
  // ---------------------------------------------------------------------------
  const pillowsGroup = new THREE.Group();
  pillowsGroup.name = 'pillows';

  // Helper: Square throw pillow leaning against bolster
  function addThrowPillow(px, pz, py, rotY = 0, tiltX = -0.34, size = 0.32, mat = sofaMaterial) {
    const pGeo = trackGeo(createPuffyThrowPillowGeometry(THREE, size, 0.11));
    const pMesh = new THREE.Mesh(pGeo, mat);
    pMesh.name = 'throw-pillow';
    pMesh.position.set(px, py, pz);
    pMesh.rotation.y = rotY;
    pMesh.rotation.x = tiltX; // Angled back against the headboard cylinder
    pillowsGroup.add(pMesh);
    return pMesh;
  }

  // Helper: Cylindrical hotdog bolster pillow ("hotdog pillow")
  function addHotdogBolster(px, pz, py, len = 0.52, radius = 0.075, rotY = 0, mat = sofaMaterial) {
    const bGeo = trackGeo(new THREE.CylinderGeometry(radius, radius, len, 24));
    bGeo.rotateX(Math.PI / 2);
    const bMesh = new THREE.Mesh(bGeo, mat);
    bMesh.name = 'hotdog-bolster';
    bMesh.position.set(px, py, pz);
    bMesh.rotation.y = rotY;

    // Pinched ends with fabric buttons
    for (const end of [-1, 1]) {
      const btnGeo = trackGeo(new THREE.CylinderGeometry(0.016, 0.016, 0.008, 12));
      btnGeo.rotateX(Math.PI / 2);
      const btn = new THREE.Mesh(btnGeo, pipingMaterial);
      btn.position.set(0, 0, end * (len / 2 + 0.002));
      bMesh.add(btn);
    }
    pillowsGroup.add(bMesh);
    return bMesh;
  }

  // Helper: Rectangular sleeping pillow
  function addSleepingPillow(px, pz, py, rotY = 0, mat = sofaMaterial) {
    const sGeo = trackGeo(createPuffyThrowPillowGeometry(THREE, 0.46, 0.12));
    sGeo.scale(1.0, 0.65, 1.0);
    const sMesh = new THREE.Mesh(sGeo, mat);
    sMesh.name = 'sleeping-pillow';
    sMesh.position.set(px, py, pz);
    sMesh.rotation.y = rotY;
    sMesh.rotation.x = -0.22;
    pillowsGroup.add(sMesh);
    return sMesh;
  }

  // Helper: Round button-tufted cushion
  function addRoundCushion(px, pz, py, radius = 0.17, thickness = 0.09, rotX = -0.34, mat = sofaMaterial) {
    const rGeo = trackGeo(createRoundCushionGeometry(THREE, radius, thickness));
    const rMesh = new THREE.Mesh(rGeo, mat);
    rMesh.name = 'round-cushion';
    rMesh.position.set(px, py, pz);
    rMesh.rotation.x = rotX;

    // Center tuft button on front and back
    for (const side of [-1, 1]) {
      const btnGeo = trackGeo(new THREE.SphereGeometry(0.014, 12, 8));
      const btn = new THREE.Mesh(btnGeo, pipingMaterial);
      btn.position.set(0, side * (thickness / 2 - 0.005), 0);
      rMesh.add(btn);
    }

    pillowsGroup.add(rMesh);
    return rMesh;
  }

  const seatY = isFolded ? seatHeight : tierHeight;
  const pillowBaseY = seatY + 0.13;
  const pillowZ = -depth + bolsterRadius * 2 + 0.06; // Rests on seat against bolster

  switch (pillowConfig) {
    case 'singleCenter':
      // 1 square throw pillow propped in the center (exact reference match!)
      addThrowPillow(0, pillowZ, pillowBaseY, 0, -0.34, 0.33);
      break;

    case 'twoThrows':
      // 2 corner throw pillows angled slightly inward
      const pOffset = (width / 2) - 0.28;
      addThrowPillow(-pOffset, pillowZ, pillowBaseY, 0.22, -0.34, 0.32);
      addThrowPillow(pOffset, pillowZ, pillowBaseY, -0.22, -0.34, 0.32);
      break;

    case 'threeThrows':
      // 3 throw pillows across the sofa
      const p3Offset = (width / 2) - 0.26;
      addThrowPillow(-p3Offset, pillowZ, pillowBaseY, 0.25, -0.34, 0.30);
      addThrowPillow(0, pillowZ + 0.02, pillowBaseY, 0.0, -0.34, 0.32);
      addThrowPillow(p3Offset, pillowZ, pillowBaseY, -0.25, -0.34, 0.30);
      break;

    case 'bolsterPair':
      // 2 side hotdog bolsters resting along the sides of the seat
      const bSideOffset = (width / 2) - 0.15;
      addHotdogBolster(-bSideOffset, -depth * 0.44, seatY + 0.075, 0.48, 0.075, 0);
      addHotdogBolster(bSideOffset, -depth * 0.44, seatY + 0.075, 0.48, 0.075, 0);
      break;

    case 'domesticMix':
      // 1 square throw pillow + 1 side hotdog bolster pillow (the classic Filipino living room mix)
      addThrowPillow(-0.18, pillowZ, pillowBaseY, 0.15, -0.34, 0.32);
      addHotdogBolster((width / 2) - 0.16, -depth * 0.44, seatY + 0.075, 0.50, 0.075, 0.06);
      break;

    case 'sleepingPillows':
      // 2 rectangular sleeping pillows
      const sOffset = width * 0.24;
      addSleepingPillow(-sOffset, pillowZ, seatY + 0.09, 0.08);
      addSleepingPillow(sOffset, pillowZ, seatY + 0.09, -0.08);
      break;

    case 'roundCushions':
      // 2 round button-tufted cushions
      const rOffset = (width / 2) - 0.28;
      addRoundCushion(-rOffset, pillowZ, pillowBaseY, 0.16, 0.09, -0.34);
      addRoundCushion(rOffset, pillowZ, pillowBaseY, 0.16, 0.09, -0.34);
      break;

    case 'none':
    default:
      // Bare sofa bed
      break;
  }

  group.add(pillowsGroup);

  // Group metadata
  group.userData.width = width;
  group.userData.depth = depth;
  group.userData.height = seatHeight + bolsterRadius * 2;
  group.userData.fabricStyle = fabricStyle;
  group.userData.pillowConfig = pillowConfig;
  group.userData.isFolded = isFolded;

  // Explicit disposal cleanup
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
