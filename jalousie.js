import * as THREE from 'three';

// A 2 m wall tile, with its origin at the bottom-left corner, like the
// architecture kit. Geometry and materials are shared by streamed clones.
export function createJalousieWall({ height, wallColor, trimColor, curvize, curtains=null, variant='standard' }) {
  const group = new THREE.Group();
  group.name = 'jalousie-wall';
  const box = new THREE.BoxGeometry(1, 1, 1);
  const wall = curvize(new THREE.MeshLambertMaterial({ color: wallColor }));
  const frame = curvize(new THREE.MeshLambertMaterial({ color: trimColor }));
  const glass = curvize(new THREE.MeshLambertMaterial({
    color: 0xa6c8bc, transparent: true, opacity: 0.62, depthWrite: false,
  }));
  const light = curvize(new THREE.MeshBasicMaterial({ color: 0xe3ead5 }));
  function part(name, material, x, y, z, w, h, d) {
    const mesh = new THREE.Mesh(box, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    group.add(mesh);
    return mesh;
  }
  const bottom=variant==='high'?1.65:variant==='wide'?0.65:0.9;
  const top=variant==='high'?2.28:2.16;
  const left=variant==='narrow'?0.6:variant==='wide'?0.12:0.28,right=2-left;
  group.userData.windowVariant=variant;
  part('wall-bottom', wall, 1, bottom / 2, 0, 2, bottom, 0.16);
  part('wall-top', wall, 1, (top + height) / 2, 0, 2, height - top, 0.16);
  part('wall-left', wall, left / 2, (top + bottom) / 2, 0, left, top - bottom, 0.16);
  part('wall-right', wall, (right + 2) / 2, (top + bottom) / 2, 0, 2 - right, top - bottom, 0.16);
  for (const x of variant==='open'?[left,right]:[left,1,right])
    part('vertical-frame', frame, x, (top + bottom) / 2, 0, 0.045, top - bottom, 0.22);
  for (const y of [bottom, top])
    part('horizontal-frame', frame, 1, y, 0, right - left + 0.045, 0.055, 0.22);
  part('sill', frame, 1, bottom - 0.035, 0, 1.55, 0.045, 0.32);
  // Backing stays within the wall thickness, beyond the slats on the outside.
  part('exterior-light', light, 1, (top + bottom) / 2, -0.14, right - left, top - bottom, 0.01);
  const rows = variant==='high'?4:8, pitch = (top - bottom - 0.08) / rows;
  for (const x of variant==='open'?[]:[(left+1)/2,(right+1)/2]) {
    for (let row = 0; row < rows; row++) {
      const slat = part('glass-slat', glass, x, bottom + 0.04 + pitch * (row + 0.5),
        0, 1-left-0.05, pitch + 0.025, 0.012);
      slat.rotation.x = -Math.PI / 5;
    }
  }
  if(variant==='grille'){
    for(let x=left+0.16;x<right;x+=0.18)part('security-bar',frame,x,(top+bottom)/2,0.13,0.015,top-bottom,0.02);
    part('security-crossbar',frame,1,(top+bottom)/2,0.13,right-left,0.018,0.02);
  }
  if(curtains) {
    const fabric=curvize(new THREE.MeshLambertMaterial({
      color:curtains.map?0xffffff:(curtains.color??0xe6dbbf), map:curtains.map??null, side:THREE.DoubleSide,
    }));
    const rod=curvize(new THREE.MeshLambertMaterial({color:0x78634c}));
    const cafe=curtains.style==='cafe';
    const rodY=cafe?1.6:2.29, hemY=cafe?0.88:0.46;
    const curtainZ=0.22; // Positive Z faces the room on both rotated side walls.
    part('curtain-rod',rod,1,rodY,curtainZ,1.72,0.024,0.024);
    for(const x of [0.14,1.86]) part('rod-bracket',rod,x,rodY,0.14,0.03,0.06,0.18);
    for(const side of [-1,1]) {
      const cols=24, rows=12;
      const geo=new THREE.PlaneGeometry(1,1,cols,rows);
      const panel=new THREE.Mesh(geo,fabric); panel.name=cafe?'cafe-curtain':'gathered-curtain';group.add(panel);
      panel.userData.curtain={side,cafe,cols,rows,rodY,hemY,curtainZ};
      if(!cafe){const tie=part('curtain-tie',rod,side<0?0.35:1.65,hemY+0.38*(rodY-hemY),0.27,0.35,0.04,0.018);tie.userData.curtainSide=side;}
    }
    group.name=cafe?'jalousie-cafe-curtains':'jalousie-gathered-curtains';
    setCurtainOpenness(group,curtains.openness??0.35);
  }
  return group;
}

// Change an unshared prototype or preview. Streamed clones share its geometry.
// 0 closes the two panels at the centre; 1 gathers them beside the frame.
export function setCurtainOpenness(group,value){
  const open=THREE.MathUtils.clamp(Number.isFinite(value)?value:0.35,0,1);
  group.userData.curtainOpenness=open;
  group.traverse(o=>{
    const cfg=o.userData.curtain;
    if(cfg){
      const {side,cafe,cols,rows,rodY,hemY,curtainZ}=cfg,p=o.geometry.attributes.position;
      for(let i=0;i<p.count;i++){
        const u=(i%(cols+1))/cols,v=1-Math.floor(i/(cols+1))/rows;
        const gather=cafe?0:Math.exp(-(((v-0.38)/0.19)**2))*open;
        const width=0.81-0.63*open-0.09*gather;
        const outer=side<0?0.19:1.81;
        p.setXYZ(i,outer-side*u*width,hemY+v*(rodY-hemY)-0.012*Math.sin(u*Math.PI*10)*(1-v),
          curtainZ+(0.025+0.015*open)*Math.cos(u*Math.PI*12)+0.035*gather);
      }
      p.needsUpdate=true;o.geometry.computeVertexNormals();o.geometry.computeBoundingBox();o.geometry.computeBoundingSphere();
    }
    if(o.name==='curtain-tie'){
      const side=o.userData.curtainSide,width=0.81-0.72*open;
      o.visible=open>=0.5;o.position.x=(side<0?0.19:1.81)-side*width/2;o.scale.x=width;
    }
  });
}
