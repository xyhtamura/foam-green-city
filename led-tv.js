// led-tv.js
// Procedural modern LED flat screen TV for Foam Green City (DepEd MPSS / Philippine domestic interior).
// Authored for Foam Green City by Antigravity (2026-10-04).

export const SCREEN_PRESETS = [
  { id: 'noSignalBlue', name: 'No Signal (Electric Blue Screen)', emissive: 0.8 },
  { id: 'karaokeScreen', name: 'Videoke / Karaoke Screen ("My Way")', emissive: 0.85 },
  { id: 'depEdBroadcast', name: 'DepEd TV Educational Broadcast', emissive: 0.85 },
  { id: 'colorBars', name: 'SMPTE Broadcast Color Bars', emissive: 0.75 },
  { id: 'staticNoise', name: 'Analog / Digital Static Noise', emissive: 0.7 },
  { id: 'offStandby', name: 'Off / Standby (Glossy Black Panel)', emissive: 0.05 },
];

export const MOUNT_MODES = [
  { id: 'tableStand', name: 'Tabletop Stand (Dual Splayed Feet)' },
  { id: 'centerPedestal', name: 'Tabletop Stand (Center Pedestal)' },
  { id: 'wallMount', name: 'Wall Mount (VESA Bracket & Cord)' },
];

export const TV_SIZES = [
  { id: 'medium43', name: '43-inch Sala TV (0.97 m wide)', width: 0.97, height: 0.56 },
  { id: 'small32', name: '32-inch Bedroom / Sari-sari TV (0.74 m wide)', width: 0.74, height: 0.43 },
  { id: 'large55', name: '55-inch Main Hall TV (1.23 m wide)', width: 1.23, height: 0.71 },
];

// -----------------------------------------------------------------------------
// Procedural Screen Canvas Texture Generators
// 512x288 16:9 canvas textures with crisp pixelated retro / screensaver aesthetics.
// -----------------------------------------------------------------------------

function createScreenTexture(THREE, drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 288;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, 512, 288);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 1. Electric blue "NO SIGNAL" screen (classic Philippine TV standby)
function generateNoSignalTexture(THREE) {
  return createScreenTexture(THREE, (ctx, w, h) => {
    // Rich royal blue
    ctx.fillStyle = '#0a22a3';
    ctx.fillRect(0, 0, w, h);

    // Subtle scanline texture
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 2);

    // Floating dialog box
    const boxW = 220;
    const boxH = 70;
    const bx = (w - boxW) / 2;
    const by = (h - boxH) / 2 - 10;

    ctx.fillStyle = 'rgba(0, 15, 80, 0.75)';
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, boxW, boxH);

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NO SIGNAL', w / 2, by + boxH / 2);

    // HDMI 1 indicator in top-left
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('HDMI 1 / 1080p', 20, 28);
  });
}

// 2. Philippine Karaoke / Videoke lyrics screen
function generateKaraokeTexture(THREE) {
  return createScreenTexture(THREE, (ctx, w, h) => {
    // Deep midnight blue gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#04133b');
    grad.addColorStop(1, '#0b2b7a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Header badge
    ctx.fillStyle = '#d42238';
    ctx.fillRect(0, 0, w, 38);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TJ MEDIA · 04812 · MY WAY', w / 2, 24);

    // Lyrics lines
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';

    // Highlighted sung lyric in bright yellow
    ctx.fillStyle = '#ffe600';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText('AND NOW, THE END IS NEAR...', w / 2, 115);
    ctx.fillText('AND NOW, THE END IS NEAR...', w / 2, 115);

    // Upcoming lyric in crisp white
    ctx.fillStyle = '#ffffff';
    ctx.strokeText('AND SO I FACE THE FINAL CURTAIN', w / 2, 175);
    ctx.fillText('AND SO I FACE THE FINAL CURTAIN', w / 2, 175);

    // Scoring / tempo at bottom
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, h - 32, w, 32);
    ctx.fillStyle = '#5cdb95';
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('KEY: 0  TEMPO: 128  SCORE: 98', 16, h - 12);
  });
}

// 3. DepEd TV educational channel broadcast screen
function generateDepEdTvTexture(THREE) {
  return createScreenTexture(THREE, (ctx, w, h) => {
    // Classroom teal/blue studio backdrop
    ctx.fillStyle = '#1c4d5e';
    ctx.fillRect(0, 0, w, h);

    // Mint foam-green lower third banner
    ctx.fillStyle = '#bfdcc9';
    ctx.fillRect(0, h - 64, w, 52);

    // Palmyra green accent stripe
    ctx.fillStyle = '#4e7c63';
    ctx.fillRect(0, h - 68, w, 4);

    // DepEd TV logo badge in top-left
    ctx.fillStyle = '#0b3954';
    ctx.fillRect(16, 16, 120, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DepEd TV', 76, 40);

    // Topic title
    ctx.fillStyle = '#1b3b2b';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ARALING PANLIPUNAN · GRADE 7', 24, h - 38);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#3a624d';
    ctx.fillText('KABANATA IV: MGA LIKAS NA YAMAN NG PILIPINAS', 24, h - 20);

    // Blackboard slide graphic in center
    ctx.fillStyle = '#213329';
    ctx.strokeStyle = '#9e8c68';
    ctx.lineWidth = 4;
    ctx.fillRect(110, 60, 292, 140);
    ctx.strokeRect(110, 60, 292, 140);

    ctx.fillStyle = '#e5eedb';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FOAM GREEN CITY', 256, 110);
    ctx.font = '11px monospace';
    ctx.fillText('Pambansang Pabahay at Pasilidad', 256, 135);
  });
}

// 4. SMPTE broadcast color bars
function generateColorBarsTexture(THREE) {
  return createScreenTexture(THREE, (ctx, w, h) => {
    const bars = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
    const barW = w / bars.length;
    const topH = h * 0.68;

    for (let i = 0; i < bars.length; i++) {
      ctx.fillStyle = bars[i];
      ctx.fillRect(i * barW, 0, barW, topH);
    }

    // Middle cast bars
    const midH = h * 0.08;
    const midBars = ['#0000c0', '#131313', '#c000c0', '#131313', '#00c0c0', '#131313', '#c0c0c0'];
    for (let i = 0; i < midBars.length; i++) {
      ctx.fillStyle = midBars[i];
      ctx.fillRect(i * barW, topH, barW, midH);
    }

    // Bottom step blocks
    const botY = topH + midH;
    const botH = h - botY;
    const botCols = ['#00214c', '#ffffff', '#32006a', '#131313', '#090909', '#131313', '#1d1d1d'];
    for (let i = 0; i < botCols.length; i++) {
      ctx.fillStyle = botCols[i];
      ctx.fillRect(i * barW, botY, barW, botH);
    }
  });
}

// 5. Crunchy monochrome analog/digital static
function generateStaticTexture(THREE) {
  return createScreenTexture(THREE, (ctx, w, h) => {
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() < 0.5 ? Math.floor(Math.random() * 255) : (Math.random() < 0.5 ? 20 : 230);
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
  });
}

// 6. Off / Standby glossy black panel
function generateOffTexture(THREE) {
  return createScreenTexture(THREE, (ctx, w, h) => {
    ctx.fillStyle = '#0f1113';
    ctx.fillRect(0, 0, w, h);

    // Faint diagonal reflection streak
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(255,255,255,0.08)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.02)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });
}

// -----------------------------------------------------------------------------
// Main LED Flat Screen TV Factory
// -----------------------------------------------------------------------------

export function createLedTv({
  THREE,
  size = 'medium43',
  width: customWidth,
  height: customHeight,
  screenPreset = 'noSignalBlue',
  mountMode = 'tableStand',
  curvize = (m) => m,
} = {}) {
  if (!THREE) {
    throw new Error('createLedTv requires the THREE library object');
  }

  const group = new THREE.Group();
  group.name = 'ledFlatTv';

  const ownedGeometries = new Set();
  const ownedMaterials = new Set();
  const ownedTextures = new Set();

  function trackGeo(g) { ownedGeometries.add(g); return g; }
  function trackMat(m) { ownedMaterials.add(m); return m; }
  function trackTex(t) { ownedTextures.add(t); return t; }

  const applyCurvize = typeof curvize === 'function' ? curvize : (m) => m;

  // Resolve dimensions
  let tvW = 0.97;
  let tvH = 0.56;
  const sizeDef = TV_SIZES.find((s) => s.id === size);
  if (sizeDef) {
    tvW = sizeDef.width;
    tvH = sizeDef.height;
  }
  if (customWidth) tvW = customWidth;
  if (customHeight) tvH = customHeight;

  const bezelThickness = 0.012; // 1.2 cm slim side/top bezel
  const bottomBezelH = 0.024;    // 2.4 cm chin bezel with logo & LED
  const panelDepth = 0.014;      // Ultra-slim upper display profile

  // 1. Screen texture & material
  let screenTex;
  let emissiveIntensity = 0.8;
  const presetDef = SCREEN_PRESETS.find((p) => p.id === screenPreset);
  if (presetDef) emissiveIntensity = presetDef.emissive;

  switch (screenPreset) {
    case 'karaokeScreen':
      screenTex = trackTex(generateKaraokeTexture(THREE));
      break;
    case 'depEdBroadcast':
      screenTex = trackTex(generateDepEdTvTexture(THREE));
      break;
    case 'colorBars':
      screenTex = trackTex(generateColorBarsTexture(THREE));
      break;
    case 'staticNoise':
      screenTex = trackTex(generateStaticTexture(THREE));
      break;
    case 'offStandby':
      screenTex = trackTex(generateOffTexture(THREE));
      break;
    case 'noSignalBlue':
    default:
      screenTex = trackTex(generateNoSignalTexture(THREE));
      break;
  }

  // Active glowing screen material (or unlit/emissive)
  const isOff = screenPreset === 'offStandby';
  const screenMaterial = applyCurvize(trackMat(new THREE.MeshLambertMaterial({
    map: screenTex,
    emissive: isOff ? 0x050505 : 0xffffff,
    emissiveMap: isOff ? null : screenTex,
    emissiveIntensity: isOff ? 0.05 : emissiveIntensity,
  })));

  // Bezel plastic materials
  const bezelMaterial = applyCurvize(trackMat(new THREE.MeshLambertMaterial({
    color: 0x1a1c1e, // Matte charcoal TV casing
  })));

  const logoMaterial = applyCurvize(trackMat(new THREE.MeshLambertMaterial({
    color: 0xc8ced4, // Silver printed logo badge
  })));

  const powerLedMaterial = applyCurvize(trackMat(new THREE.MeshLambertMaterial({
    color: isOff ? 0xff2222 : 0x22ee44, // Red in standby, green when on
    emissive: isOff ? 0xcc0000 : 0x00cc22,
    emissiveIntensity: 0.9,
  })));

  const metalStandMaterial = applyCurvize(trackMat(new THREE.MeshLambertMaterial({
    color: 0x2e3238, // Dark graphite cast metal stand
  })));

  // TV panel center height offset
  let panelCenterY = tvH / 2;
  const standFootH = 0.055; // 5.5 cm elevation above tabletop
  if (mountMode === 'tableStand' || mountMode === 'centerPedestal') {
    panelCenterY += standFootH;
  }

  // ---------------------------------------------------------------------------
  // 1. Screen Mesh (Active 16:9 Display Area)
  // ---------------------------------------------------------------------------
  const screenW = tvW - bezelThickness * 2;
  const screenH = tvH - bezelThickness - bottomBezelH;
  const screenGeo = trackGeo(new THREE.PlaneGeometry(screenW, screenH));
  const screenMesh = new THREE.Mesh(screenGeo, screenMaterial);
  screenMesh.name = 'tv-screen';
  // Positioned slightly forward on front face
  screenMesh.position.set(0, panelCenterY + (bottomBezelH - bezelThickness) / 2, 0.0075);
  group.add(screenMesh);

  // ---------------------------------------------------------------------------
  // 2. Bezel Frame (Front Frame)
  // ---------------------------------------------------------------------------
  const bezelGroup = new THREE.Group();
  bezelGroup.name = 'tv-bezel';

  // Top rail
  const topRailGeo = trackGeo(new THREE.BoxGeometry(tvW, bezelThickness, panelDepth));
  const topRail = new THREE.Mesh(topRailGeo, bezelMaterial);
  topRail.position.set(0, panelCenterY + tvH / 2 - bezelThickness / 2, 0);
  bezelGroup.add(topRail);

  // Bottom chin rail (wider, holds logo and indicator)
  const botRailGeo = trackGeo(new THREE.BoxGeometry(tvW, bottomBezelH, panelDepth));
  const botRail = new THREE.Mesh(botRailGeo, bezelMaterial);
  botRail.position.set(0, panelCenterY - tvH / 2 + bottomBezelH / 2, 0);
  bezelGroup.add(botRail);

  // Left & right side rails
  const sideH = tvH - bezelThickness - bottomBezelH;
  const sideRailGeo = trackGeo(new THREE.BoxGeometry(bezelThickness, sideH, panelDepth));
  for (const s of [-1, 1]) {
    const sideRail = new THREE.Mesh(sideRailGeo, bezelMaterial);
    sideRail.position.set(s * (tvW / 2 - bezelThickness / 2), panelCenterY + (bottomBezelH - bezelThickness) / 2, 0);
    bezelGroup.add(sideRail);
  }

  // Brand logo badge (center of bottom chin)
  const logoGeo = trackGeo(new THREE.BoxGeometry(0.045, 0.006, 0.002));
  const logo = new THREE.Mesh(logoGeo, logoMaterial);
  logo.position.set(0, panelCenterY - tvH / 2 + bottomBezelH / 2, 0.008);
  bezelGroup.add(logo);

  // Power LED indicator diode (bottom-right chin)
  const ledGeo = trackGeo(new THREE.BoxGeometry(0.005, 0.004, 0.002));
  const led = new THREE.Mesh(ledGeo, powerLedMaterial);
  led.position.set(tvW / 2 - 0.035, panelCenterY - tvH / 2 + 0.006, 0.008);
  bezelGroup.add(led);

  group.add(bezelGroup);

  // ---------------------------------------------------------------------------
  // 3. Rear Housing (Electronics Box & Vents)
  // Slim upper panel, chunky lower enclosure with ventilation slats
  // ---------------------------------------------------------------------------
  const rearGroup = new THREE.Group();
  rearGroup.name = 'tv-rear-enclosure';

  // Slim full backplate
  const backplateGeo = trackGeo(new THREE.BoxGeometry(tvW - 0.004, tvH - 0.004, 0.004));
  const backplate = new THREE.Mesh(backplateGeo, bezelMaterial);
  backplate.position.set(0, panelCenterY, -panelDepth / 2 - 0.002);
  rearGroup.add(backplate);

  // Lower electronics hump (chunky housing on bottom half)
  const humpW = tvW * 0.65;
  const humpH = tvH * 0.52;
  const humpDepth = 0.042;
  const humpGeo = trackGeo(new THREE.BoxGeometry(humpW, humpH, humpDepth));
  const hump = new THREE.Mesh(humpGeo, bezelMaterial);
  hump.position.set(0, panelCenterY - tvH * 0.22, -panelDepth / 2 - humpDepth / 2);
  rearGroup.add(hump);

  // Rear I/O port notch (HDMI/AV ports indentation on one side)
  const portNotchGeo = trackGeo(new THREE.BoxGeometry(0.03, humpH * 0.5, humpDepth * 0.6));
  const portNotch = new THREE.Mesh(portNotchGeo, applyCurvize(trackMat(new THREE.MeshLambertMaterial({ color: 0x08090a }))));
  portNotch.position.set(-humpW / 2 + 0.015, panelCenterY - tvH * 0.22, -panelDepth / 2 - humpDepth / 2);
  rearGroup.add(portNotch);

  // 4 VESA wall mount screw points on the hump
  const vesaSpacing = Math.min(0.20, tvW * 0.25);
  for (const vx of [-vesaSpacing / 2, vesaSpacing / 2]) {
    for (const vy of [-vesaSpacing / 2, vesaSpacing / 2]) {
      const vesaScrewGeo = trackGeo(new THREE.CylinderGeometry(0.005, 0.005, 0.003, 8));
      vesaScrewGeo.rotateX(Math.PI / 2);
      const vesaScrew = new THREE.Mesh(vesaScrewGeo, logoMaterial);
      vesaScrew.position.set(vx, panelCenterY - tvH * 0.22 + vy, -panelDepth / 2 - humpDepth - 0.001);
      rearGroup.add(vesaScrew);
    }
  }

  group.add(rearGroup);

  // ---------------------------------------------------------------------------
  // 4. Mounting Hardware (Tabletop Splayed Feet vs Center Pedestal vs Wall Bracket)
  // ---------------------------------------------------------------------------
  const mountGroup = new THREE.Group();
  mountGroup.name = 'tv-mount';

  if (mountMode === 'tableStand') {
    // Dual splayed wishbone / boomerang feet (standard modern LED TV)
    const footSpan = tvW * 0.38; // Positioned near outer edges
    const footLength = 0.18;    // 18 cm front-to-back depth on table
    const footHeight = standFootH;

    for (const side of [-1, 1]) {
      const footGroup = new THREE.Group();
      footGroup.name = `stand-foot-${side > 0 ? 'right' : 'left'}`;

      // Vertical/diagonal leg riser connecting TV bottom to foot
      const riserGeo = trackGeo(new THREE.BoxGeometry(0.016, footHeight + 0.01, 0.024));
      const riser = new THREE.Mesh(riserGeo, metalStandMaterial);
      riser.position.set(0, footHeight / 2, 0);
      footGroup.add(riser);

      // Horizontal base foot (prongs extending forward and backward)
      const prongGeo = trackGeo(new THREE.BoxGeometry(0.016, 0.008, footLength));
      const prong = new THREE.Mesh(prongGeo, metalStandMaterial);
      prong.position.set(0, 0.004, -0.01);
      footGroup.add(prong);

      // Splay feet slightly outward by 8 degrees
      footGroup.position.set(side * footSpan, 0, 0);
      footGroup.rotation.y = side * -0.12;
      mountGroup.add(footGroup);
    }

  } else if (mountMode === 'centerPedestal') {
    // Center rectangular pedestal base plate + neck
    const baseW = Math.min(0.42, tvW * 0.45);
    const baseD = 0.20;
    const baseH = 0.012;

    const basePlateGeo = trackGeo(new THREE.BoxGeometry(baseW, baseH, baseD));
    const basePlate = new THREE.Mesh(basePlateGeo, metalStandMaterial);
    basePlate.position.set(0, baseH / 2, -0.02);
    mountGroup.add(basePlate);

    // Vertical neck pillar
    const neckGeo = trackGeo(new THREE.BoxGeometry(0.08, standFootH + 0.02, 0.035));
    const neck = new THREE.Mesh(neckGeo, metalStandMaterial);
    neck.position.set(0, standFootH / 2 + 0.01, -0.02);
    mountGroup.add(neck);

  } else if (mountMode === 'wallMount') {
    // Wall mount bracket: dual vertical rails + horizontal wall plate + hanging cord
    const wallPlateGeo = trackGeo(new THREE.BoxGeometry(tvW * 0.5, 0.12, 0.012));
    const wallPlate = new THREE.Mesh(wallPlateGeo, metalStandMaterial);
    wallPlate.position.set(0, panelCenterY - tvH * 0.22, -panelDepth / 2 - humpDepth - 0.02);
    mountGroup.add(wallPlate);

    // Dual vertical bracket rails
    for (const vx of [-vesaSpacing / 2, vesaSpacing / 2]) {
      const railGeo = trackGeo(new THREE.BoxGeometry(0.022, 0.26, 0.02));
      const rail = new THREE.Mesh(railGeo, metalStandMaterial);
      rail.position.set(vx, panelCenterY - tvH * 0.22, -panelDepth / 2 - humpDepth - 0.01);
      mountGroup.add(rail);
    }

    // Trailing power / AV cable running down towards floor
    const cordCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.06, panelCenterY - tvH * 0.22, -panelDepth / 2 - humpDepth - 0.01),
      new THREE.Vector3(-0.04, panelCenterY - tvH * 0.45, -panelDepth / 2 - humpDepth - 0.02),
      new THREE.Vector3(0.02, 0.10, -panelDepth / 2 - humpDepth - 0.015),
      new THREE.Vector3(0.05, 0.0, -panelDepth / 2 - humpDepth + 0.05),
    ]);
    const cordGeo = trackGeo(new THREE.TubeGeometry(cordCurve, 16, 0.004, 6, false));
    const cordMat = applyCurvize(trackMat(new THREE.MeshLambertMaterial({ color: 0x111214 })));
    const cord = new THREE.Mesh(cordGeo, cordMat);
    mountGroup.add(cord);
  }

  group.add(mountGroup);

  // Group metadata
  group.userData.width = tvW;
  group.userData.height = tvH;
  group.userData.screenPreset = screenPreset;
  group.userData.mountMode = mountMode;
  group.userData.size = size;

  // Explicit lifecycle disposal
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
