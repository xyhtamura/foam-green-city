import * as THREE from 'three';
import {createUtilityProps} from './utility-props.js?v=5c7f556072';

export const FURNITURE_FINISHES = [
  {name:'Cream plastic',color:0xe8e4d6},{name:'Beige plastic',color:0xc9b994},
  {name:'Red plastic',color:0xbf453c},{name:'Green plastic',color:0x438967},
  {name:'Foam green plastic',color:0xbfdcc9},{name:'Blue plastic',color:0x487fb6},
  {name:'Yellow plastic',color:0xe4c54c},{name:'Pink plastic',color:0xd68ba4},
  {name:'Light wood tone',color:0xa68154},{name:'Dark wood tone',color:0x604531},
];

// Cache one material per finish; all variations keep their shared geometry.
export function createFurnitureVariants(props){
  const materials=FURNITURE_FINISHES.map(f=>new THREE.MeshLambertMaterial({color:f.color}));
  const variants={};
  for(const name of ['monoblocChair','monoblocTable','woodTable'])
    variants[name]=materials.map((material,i)=>{
      const model=props[name].clone();model.userData.finish=FURNITURE_FINISHES[i].name;
      model.traverse(o=>{if(o.isMesh)o.material=material;});return model;
    });
  return variants;
}

// Metres, Y up, front facing +Z. Prototypes share resources between clones.
export function createDomesticProps() {
  const cream = new THREE.MeshLambertMaterial({ color: 0xded6ba });
  const blue = new THREE.MeshLambertMaterial({ color: 0x699baf });
  const steel = new THREE.MeshLambertMaterial({ color: 0x8d9592 });
  const dark = new THREE.MeshLambertMaterial({ color: 0x474d49 });
  const red = new THREE.MeshLambertMaterial({ color: 0xb45f4d });
  const box = new THREE.BoxGeometry(1, 1, 1);
  function mesh(g, name, geo, mat, x=0, y=0, z=0) {
    const m = new THREE.Mesh(geo, mat); m.name=name; m.position.set(x,y,z); g.add(m); return m;
  }
  function block(g,name,mat,x,y,z,w,h,d) {
    const m=mesh(g,name,box,mat,x,y,z); m.scale.set(w,h,d); return m;
  }
  function ring(g,name,mat,r,t,y,z=0) {
    return mesh(g,name,new THREE.TorusGeometry(r,t,4,32),mat,0,y,z);
  }
  function fan(wall) {
    const g=new THREE.Group(); g.name=wall?'wallFan':'deskFan';
    const cy=wall?0.28:0.39, radius=0.19;
    if(wall) {
      block(g,'mount',cream,0,0.09,-0.14,0.09,0.18,0.045);
      block(g,'arm',cream,0,0.16,-0.065,0.055,0.06,0.15);
      block(g,'pull-switch',dark,0.028,-0.04,-0.1,0.008,0.18,0.008);
    } else {
      block(g,'base',blue,0,0.025,-0.01,0.26,0.05,0.21);
      block(g,'neck',cream,0,0.18,-0.07,0.045,0.3,0.055);
      for(let i=0;i<4;i++) block(g,'speed-button',cream,-0.06+i*0.04,0.054,0.06,0.024,0.014,0.025);
    }
    const head=new THREE.Group(); head.name='fan-head'; head.position.y=cy; g.add(head);
    const motor=mesh(head,'motor',new THREE.CylinderGeometry(0.055,0.055,0.11,12),cream,0,0,-0.075); motor.rotation.x=Math.PI/2;
    const rotor=new THREE.Group(); rotor.name='fan-rotor'; head.add(rotor);
    for(let i=0;i<3;i++) {
      const blade=block(rotor,'blade',blue,0,0,0,0.095,0.16,0.012);
      const a=i*Math.PI*2/3; blade.position.set(Math.sin(a)*0.082,Math.cos(a)*0.082,0); blade.rotation.z=-a+0.3;
    }
    for(const z of [-0.028,0.045]) {
      for(const r of [0.07,0.13,radius]) ring(head,'guard-ring',steel,r,0.0025,0,z);
      for(let i=0;i<12;i++) {
        const a=i*Math.PI/12;
        const spoke=block(head,'guard-spoke',steel,0,0,z,0.004,radius*2,0.004); spoke.rotation.z=a;
      }
    }
    const hub=mesh(head,'front-cap',new THREE.CylinderGeometry(0.029,0.029,0.018,12),cream,0,0,0.054); hub.rotation.x=Math.PI/2;
    return g;
  }
  const cooker=new THREE.Group(); cooker.name='riceCooker';
  mesh(cooker,'body',new THREE.CylinderGeometry(0.145,0.125,0.21,24),cream,0,0.145);
  mesh(cooker,'foot',new THREE.CylinderGeometry(0.12,0.12,0.04,20),dark,0,0.02);
  mesh(cooker,'lid',new THREE.CylinderGeometry(0.15,0.15,0.018,24),steel,0,0.255);
  block(cooker,'lid-handle',dark,0,0.283,0,0.08,0.04,0.035);
  for(const s of [-1,1]) block(cooker,'side-handle',dark,s*0.167,0.205,0,0.055,0.035,0.07);
  block(cooker,'switch-panel',cream,0,0.09,0.135,0.073,0.07,0.027);
  block(cooker,'cook-switch',red,0,0.085,0.155,0.043,0.017,0.018);
  block(cooker,'indicator',red,0,0.114,0.153,0.012,0.007,0.006);

  const cover=new THREE.Group(); cover.name='foodCover';
  const rim=ring(cover,'rim',blue,0.245,0.008,0.008); rim.rotation.x=Math.PI/2;
  // Open wire lattice, rather than a solid hemisphere or transparent surface.
  const domeY=(r)=>0.17*Math.sqrt(Math.max(0,1-(r/0.245)**2))+0.008;
  for(let i=1;i<9;i++) {
    const r=i*0.245/9; const hoop=ring(cover,'mesh-hoop',cream,r,0.0015,domeY(r)); hoop.rotation.x=Math.PI/2;
  }
  for(let i=0;i<24;i++) {
    const a=i*Math.PI*2/24, points=[];
    for(let j=0;j<=12;j++) {const r=j*0.245/12; points.push(new THREE.Vector3(Math.cos(a)*r,domeY(r),Math.sin(a)*r));}
    mesh(cover,'mesh-rib',new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,0.0015,3,false),cream);
  }
  mesh(cover,'knob',new THREE.SphereGeometry(0.016,8,6),blue,0,0.19);
  const plastic=new THREE.MeshLambertMaterial({color:0xe8e4d6});
  const chair=new THREE.Group();chair.name='monoblocChair';
  // Rounded molded seat and slotted back, with splayed tapered legs.
  const seatShape=new THREE.Shape();
  seatShape.moveTo(-0.23,-0.19);seatShape.lineTo(0.23,-0.19);
  seatShape.quadraticCurveTo(0.27,-0.19,0.27,-0.15);seatShape.lineTo(0.27,0.2);
  seatShape.quadraticCurveTo(0.27,0.24,0.23,0.24);seatShape.lineTo(-0.23,0.24);
  seatShape.quadraticCurveTo(-0.27,0.24,-0.27,0.2);seatShape.lineTo(-0.27,-0.15);
  seatShape.quadraticCurveTo(-0.27,-0.19,-0.23,-0.19);
  const seat=mesh(chair,'seat',new THREE.ExtrudeGeometry(seatShape,{depth:0.025,bevelEnabled:true,bevelSize:0.008,bevelThickness:0.006,bevelSegments:1,steps:1}),plastic,0,0.45);
  seat.rotation.x=-Math.PI/2;
  const backShape=new THREE.Shape();backShape.moveTo(-0.25,0);backShape.lineTo(0.25,0);
  backShape.lineTo(0.24,0.34);backShape.quadraticCurveTo(0.23,0.43,0.12,0.44);
  backShape.lineTo(-0.12,0.44);backShape.quadraticCurveTo(-0.23,0.43,-0.24,0.34);backShape.closePath();
  for(const x of [-0.15,-0.075,0,0.075,0.15]){
    const hole=new THREE.Path();hole.moveTo(x-0.018,0.12);hole.lineTo(x-0.018,0.32);
    hole.quadraticCurveTo(x,0.36,x+0.018,0.32);hole.lineTo(x+0.018,0.12);
    hole.quadraticCurveTo(x,0.085,x-0.018,0.12);backShape.holes.push(hole);
  }
  const back=mesh(chair,'slotted-back',new THREE.ExtrudeGeometry(backShape,{depth:0.022,bevelEnabled:true,bevelSize:0.004,bevelThickness:0.004,bevelSegments:1,steps:1}),plastic,0,0.45,-0.22);back.rotation.x=-0.1;
  for(const x of [-1,1])for(const z of [-1,1]){
    const leg=mesh(chair,'splayed-leg',new THREE.CylinderGeometry(0.028,0.018,0.46,4),plastic,x*0.225,0.23,z*0.19);
    leg.rotation.z=-x*0.1;leg.rotation.x=z*0.09;
  }
  for(const x of [-1,1]){
    block(chair,'arm',plastic,x*0.265,0.645,0,0.055,0.035,0.43);
    block(chair,'arm-support',plastic,x*0.265,0.56,0.18,0.035,0.17,0.035);
  }

  // Keep support metadata when the renderer merges the chair's mesh parts.
  chair.updateMatrixWorld(true);
  const seatBounds=new THREE.Box3().setFromObject(seat);
  chair.userData.seatGeometry={height:seatBounds.max.y,blockers:chair.children.filter(o=>o!==seat).map(o=>{
    const b=new THREE.Box3().setFromObject(o);
    return {minX:b.min.x,maxX:b.max.x,minY:b.min.y,maxY:b.max.y,minZ:b.min.z,maxZ:b.max.z};
  })};

  const runner=new THREE.Group();runner.name='scallopedRunner';
  const textile=new THREE.MeshLambertMaterial({color:0xeee5cc,side:THREE.DoubleSide});
  const width=0.28, length=1.15, shape=new THREE.Shape();
  shape.moveTo(-width/2,-length/2);
  for(let i=0;i<12;i++){const y=-length/2+i*length/12;shape.quadraticCurveTo(-width/2-0.025,y+length/24,-width/2,y+length/12);}
  shape.lineTo(width/2,length/2);
  for(let i=0;i<12;i++){const y=length/2-i*length/12;shape.quadraticCurveTo(width/2+0.025,y-length/24,width/2,y-length/12);}
  shape.closePath();
  for(const x of [-0.105,0.105])for(let i=0;i<12;i++){
    const hole=new THREE.Path();hole.absellipse(x,-length/2+(i+0.5)*length/12,0.009,0.015,0,Math.PI*2,true);shape.holes.push(hole);
  }
  const flatGeo=new THREE.ShapeGeometry(shape,6);
  // Split triangles at each table edge before folding; no triangle spans a fold.
  const original=flatGeo.toNonIndexed(), attribute=original.attributes.position, vertices=[];
  function clip(poly,limit,above){
    const result=[];
    for(let i=0;i<poly.length;i++){
      const a=poly[i],b=poly[(i+1)%poly.length],insideA=above?a.y>=limit:a.y<=limit,insideB=above?b.y>=limit:b.y<=limit;
      if(insideA)result.push(a);
      if(insideA!==insideB){const t=(limit-a.y)/(b.y-a.y);result.push(new THREE.Vector2(a.x+t*(b.x-a.x),limit));}
    }return result;
  }
  for(let i=0;i<attribute.count;i+=3){
    const tri=[0,1,2].map(j=>new THREE.Vector2(attribute.getX(i+j),attribute.getY(i+j)));
    for(const [lo,hi] of [[-length/2,-0.425],[-0.425,0.425],[0.425,length/2]]){
      const poly=clip(clip(tri,lo,true),hi,false);
      for(let j=1;j<poly.length-1;j++)for(const v of [poly[0],poly[j],poly[j+1]])vertices.push(v.x,v.y,0);
    }
  }
  const fabricGeo=new THREE.BufferGeometry();fabricGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  flatGeo.dispose();original.dispose();
  // Drapes over an 85 cm tabletop, with 15 cm hanging at each end.
  const p=fabricGeo.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getY(i),edge=Math.max(0,Math.abs(z)-0.425);p.setXYZ(i,x,-edge,Math.sign(z)*Math.min(Math.abs(z),0.425)+Math.sign(z)*Math.min(edge,0.015));}
  fabricGeo.computeVertexNormals();mesh(runner,'scalloped-fabric',fabricGeo,textile);
  const monoblocTable=new THREE.Group();monoblocTable.name='monoblocTable';
  const tabletopShape=new THREE.Shape();
  tabletopShape.moveTo(-0.29,-0.425);tabletopShape.lineTo(0.29,-0.425);
  tabletopShape.quadraticCurveTo(0.34,-0.425,0.34,-0.375);tabletopShape.lineTo(0.34,0.375);
  tabletopShape.quadraticCurveTo(0.34,0.425,0.29,0.425);tabletopShape.lineTo(-0.29,0.425);
  tabletopShape.quadraticCurveTo(-0.34,0.425,-0.34,0.375);tabletopShape.lineTo(-0.34,-0.375);
  tabletopShape.quadraticCurveTo(-0.34,-0.425,-0.29,-0.425);
  const moldedTop=mesh(monoblocTable,'molded-top',new THREE.ExtrudeGeometry(tabletopShape,{depth:0.035,bevelEnabled:true,bevelSize:0.006,bevelThickness:0.006,bevelSegments:1,steps:1}),plastic,0,0.718);moldedTop.rotation.x=-Math.PI/2;
  for(const x of [-1,1])for(const z of [-1,1]){
    const leg=mesh(monoblocTable,'tapered-leg',new THREE.CylinderGeometry(0.046,0.027,0.72,4),plastic,x*0.27,0.36,z*0.35);
    leg.rotation.z=-x*0.055;leg.rotation.x=z*0.04;
  }
  const woodTable=new THREE.Group();woodTable.name='woodTable';
  block(woodTable,'top',plastic,0,0.735,0,0.68,0.035,0.85);
  for(const x of [-0.27,0.27])for(const z of [-0.35,0.35])block(woodTable,'leg',plastic,x,0.36,z,0.055,0.72,0.055);
  for(const x of [-0.275,0.275])block(woodTable,'apron',plastic,x,0.68,0,0.04,0.08,0.72);
  for(const z of [-0.35,0.35])block(woodTable,'apron',plastic,0,0.68,z,0.55,0.08,0.04);
  return {...createUtilityProps(),wallFan:fan(true),deskFan:fan(false),riceCooker:cooker,foodCover:cover,monoblocChair:chair,scallopedRunner:runner,monoblocTable,woodTable};
}

export function animateDomesticProps(root, time) {
  root.traverse(o=>{
    if(o.name==='fan-rotor') o.rotation.z=-time*19;
    if(o.name==='fan-head') o.rotation.y=Math.sin(time*0.65)*0.55;
  });
}
