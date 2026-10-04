import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Authored in metres. Geometry and materials survive streamed clone disposal.
export function createUtilityProps(){
  const material=color=>new THREE.MeshLambertMaterial({color});
  const blue=material(0x548cbe),pink=material(0xcf8fa5),metal=material(0x919a98);
  const dark=material(0x38474c),wood=material(0x977348),straw=material(0xc2a05b);
  const twig=material(0x79613e),binding=material(0xb2493c),cream=material(0xe3dbc4);
  function mesh(group,name,geometry,mat,x=0,y=0,z=0){
    const obj=new THREE.Mesh(geometry,mat);obj.name=name;obj.position.set(x,y,z);group.add(obj);return obj;
  }
  function block(group,name,mat,x,y,z,w,h,d){return mesh(group,name,new THREE.BoxGeometry(w,h,d),mat,x,y,z);}
  function rodGeometry(a,b,r0,r1=r0){
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
    const geo=new THREE.CylinderGeometry(r1,r0,delta.length(),5);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));
    geo.translate(...start.add(end).multiplyScalar(0.5).toArray());return geo;
  }
  function rods(group,name,mat,list){
    const pieces=list.map(([a,b,r0,r1])=>rodGeometry(a,b,r0,r1));
    mesh(group,name,mergeGeometries(pieces),mat);pieces.forEach(geo=>geo.dispose());
  }
  function bucket(name,mat){
    const group=new THREE.Group();group.name=name;
    // Cross-section travels up the outer wall and down inside to a closed base.
    const points=[[0,0],[0.125,0],[0.165,0.30],[0.171,0.31],[0.171,0.325],
      [0.155,0.325],[0.152,0.30],[0.117,0.016],[0,0.016]].map(p=>new THREE.Vector2(...p));
    mesh(group,'hollow-pail',new THREE.LatheGeometry(points,20),mat);
    const handle=[];for(let i=0;i<=20;i++){const a=i*Math.PI/20;handle.push(new THREE.Vector3(Math.cos(a)*0.17,0.27+Math.sin(a)*0.19,0));}
    mesh(group,'raised-handle',new THREE.TubeGeometry(new THREE.CatmullRomCurve3(handle),20,0.008,5,false),cream);
    for(const x of [-0.164,0.164])mesh(group,'handle-pivot',new THREE.SphereGeometry(0.014,8,6),mat,x,0.27);
    return group;
  }
  const gasul=new THREE.Group();gasul.name='gasul';
  mesh(gasul,'steel-cylinder',new THREE.LatheGeometry([[0,0.055],[0.13,0.055],[0.175,0.10],
    [0.18,0.16],[0.18,0.40],[0.165,0.455],[0.12,0.485],[0.035,0.49],[0,0.49]].map(p=>new THREE.Vector2(...p)),20),blue);
  const foot=mesh(gasul,'foot-ring',new THREE.CylinderGeometry(0.145,0.145,0.06,20,1,true),dark,0,0.03);foot.material.side=THREE.DoubleSide;
  mesh(gasul,'brass-valve',new THREE.CylinderGeometry(0.023,0.023,0.075,8),material(0xad955d),0,0.525);
  block(gasul,'valve-knob',dark,0,0.566,0,0.065,0.014,0.025);
  for(const x of [-0.095,0.095])block(gasul,'collar-upright',blue,x,0.535,0,0.022,0.14,0.095);
  const collar=mesh(gasul,'protective-collar',new THREE.TorusGeometry(0.098,0.012,5,20),blue,0,0.601);collar.rotation.x=Math.PI/2;

  const drawers=new THREE.Group();drawers.name='plasticDrawers';
  block(drawers,'cabinet-back',cream,0,0.40,-0.18,0.44,0.76,0.035);
  for(const x of [-0.22,0.22])block(drawers,'cabinet-side',cream,x,0.40,0,0.028,0.76,0.40);
  block(drawers,'cabinet-top',cream,0,0.795,0,0.49,0.04,0.44);
  const colors=[pink,blue,material(0x80a78c),material(0xd8bb6a)];
  for(let i=0;i<4;i++){
    const y=0.12+i*0.18;
    block(drawers,'drawer-shadow',dark,0,y,0,0.43,0.173,0.375);
    block(drawers,'drawer-front',colors[i],0,y,0.195,0.405,0.151,0.025);
    block(drawers,'recessed-pull',dark,0,y+0.018,0.209,0.115,0.027,0.005);
    block(drawers,'pull-lip',cream,0,y+0.03,0.217,0.13,0.012,0.018);
  }
  for(const x of [-0.19,0.19])for(const z of [-0.15,0.15])block(drawers,'cabinet-foot',cream,x,0.02,z,0.04,0.04,0.04);

  const tambo=new THREE.Group();tambo.name='walisTambo';
  rods(tambo,'bamboo-handle',wood,[[[0,0.27,0],[0,1.18,0],0.014,0.012]]);
  const leaves=[];
  for(let i=0;i<61;i++){
    const t=(i-30)/30,x=t*0.25,y=0.045+0.07*Math.abs(t),z=(i%3-1)*0.012;
    leaves.push([[t*0.025,0.36,0],[x,y,z],0.012,0.006]);
  }
  rods(tambo,'grass-fan',straw,leaves);
  for(const y of [0.30,0.33]){const band=mesh(tambo,'red-binding',new THREE.TorusGeometry(0.045,0.006,5,12),binding,0,y);band.rotation.x=Math.PI/2;band.scale.z=0.5;}
  const tingting=new THREE.Group();tingting.name='walisTingting';
  const sticks=[];
  for(let i=0;i<35;i++){
    const a=i*2.399963,spread=0.05+0.10*(i%7)/6;
    sticks.push([[Math.cos(a)*spread,0.012+(i%4)*0.008,Math.sin(a)*spread],
      [Math.cos(a)*0.014,0.94+(i%5)*0.016,Math.sin(a)*0.014],0.002,0.004]);
  }
  rods(tingting,'palm-midribs',twig,sticks);
  for(const y of [0.60,0.64]){const band=mesh(tingting,'twine-binding',new THREE.TorusGeometry(0.056,0.008,5,12),cream,0,y);band.rotation.x=Math.PI/2;}
  return {bucket:bucket('bucket',blue),bucketPink:bucket('bucketPink',pink),gasul,plasticDrawers:drawers,walisTambo:tambo,walisTingting:tingting};
}
