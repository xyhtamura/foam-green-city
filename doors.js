import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const DOOR_STYLES=['wood','green','screen'];
// Door leaves are 88 cm wide. The origin is the hinge at floor level.
export function createDoorLeaves(curvize){
  return Object.fromEntries(DOOR_STYLES.map(style=>{
    const group=new THREE.Group();group.name=`door-${style}`;
    const finish=curvize(new THREE.MeshLambertMaterial({color:style==='wood'?0x8d6546:0x4e7c63}));
    const inset=curvize(new THREE.MeshLambertMaterial({color:style==='wood'?0x72503b:0x3e6350}));
    const metal=curvize(new THREE.MeshLambertMaterial({color:0xb7aaa0}));
    const box=(name,x,y,z,w,h,d,mat=finish)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.name=name;mesh.position.set(x,y,z);group.add(mesh);};
    if(style==='screen'){
      for(const x of [0.035,0.845])box('stile',x,1.02,0,0.07,2.04,0.045);
      for(const y of [0.035,0.74,2.005])box('rail',0.44,y,0,0.81,0.07,0.045);
      // Mesh strips accept the same curvature callback as walls and furniture.
      for(let x=0.09;x<0.82;x+=0.06)box('screen-wire',x,1.02,0,0.006,1.88,0.006,inset);
      for(let y=0.09;y<1.97;y+=0.06)box('screen-wire',0.44,y,0,0.74,0.006,0.006,inset);

    }else{
      box('leaf',0.44,1.02,0,0.88,2.04,0.045);
      for(const y of [0.48,1.43])box('recessed-panel',0.44,y,0.025,0.69,0.77,0.015,inset);
    }
    box('handle',0.78,1.02,0.065,0.035,0.13,0.05,metal);
    for(const y of [0.25,1.78])box('hinge',0.015,y,0.025,0.026,0.095,0.045,metal);
    // One draw per material rather than one draw per screen wire.
    const buckets=new Map();group.updateMatrixWorld(true);
    for(const obj of [...group.children]){
      obj.geometry.applyMatrix4(obj.matrixWorld);
      if(!buckets.has(obj.material))buckets.set(obj.material,[]);
      buckets.get(obj.material).push(obj.geometry);group.remove(obj);
    }
    for(const [mat,pieces] of buckets){group.add(new THREE.Mesh(mergeGeometries(pieces),mat));pieces.forEach(g=>g.dispose());}
    return [style,group];
  }));
}
