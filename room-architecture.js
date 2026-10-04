import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {floorHeight} from './room-sequences.js';

export function branchOpenings(room){
  if(room.length<12||!['branches','cross'].includes(room.shape))return [];
  const j=Math.floor(room.length/4);
  return (room.shape==='cross'?[-1,1]:[room.index%2?-1:1]).map(side=>({side,j,z:-j*2-2}));
}

// Bake a floor's local transforms before changing its owned vertex positions.
export function raiseFloor(floor,room){
  if(!room.rise)return;
  floor.updateMatrixWorld(true);
  floor.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const inverse=mesh.matrixWorld.clone().invert(),p=new THREE.Vector3(),positions=mesh.geometry.attributes.position;
    for(let i=0;i<positions.count;i++){
      p.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);
      p.y+=floorHeight(room,p.z);p.applyMatrix4(inverse);positions.setXYZ(i,p.x,p.y,p.z);
    }
    positions.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
  });
}

export function createRoomArchitecture(room,curvize){
  const group=new THREE.Group(),batches=new Map(),W=room.width/2,L=room.length,H=room.height,reservations=[];
  const reserve=(x,z,w,d)=>reservations.push({minX:x-w/2-0.12,maxX:x+w/2+0.12,minZ:z-d/2-0.12,maxZ:z+d/2+0.12});
  const materials={wall:curvize(new THREE.MeshLambertMaterial({color:0xbfdcc9})),floor:curvize(new THREE.MeshLambertMaterial({color:0x9c9c95})),trim:curvize(new THREE.MeshLambertMaterial({color:0x4e7c63}))};
  function box(kind,w,h,d,x,y,z){
    const geo=new THREE.BoxGeometry(w,h,d,Math.max(1,Math.ceil(w/2)),1,Math.max(1,Math.ceil(d/2)));geo.translate(x,y,z);
    if(!batches.has(kind))batches.set(kind,[]);batches.get(kind).push(geo);
  }
  const openings=branchOpenings(room);
  // Full-height walls behind window modules keep the perimeter closed above them.
  const upperBase=2.58+Math.min(0,room.rise);
  if(H>upperBase)for(const side of [-1,1])for(let j=0;j<L/2;j++){
    if(openings.some(p=>p.side===side&&(j===p.j||j===p.j+1)))continue;
    box('wall',0.12,H-upperBase,2,side*(W+0.04),(H+upperBase)/2,-j*2-1);
  }
  for(const portal of openings){
    const {side,z}=portal,y=floorHeight(room,z),reach=room.shape==='cross'?8:10,cx=side*(W+reach/2);
    reserve(side*(W+0.6)/2,z,W-0.6,4);
    // A real side passage with a right-angle return and a closed end.
    box('floor',reach,0.12,4,cx,y-0.06,z);
    box('wall',reach,H,0.12,cx,y+H/2,z+2);
    box('wall',Math.max(1,reach-3),H,0.12,side*(W+(reach-3)/2),y+H/2,z-2);
    box('wall',0.12,H,4,side*(W+reach),y+H/2,z);
    const turnX=side*(W+reach-1.5),turnLen=Math.min(8,L+z-2);
    box('floor',3,0.12,turnLen,turnX,y-0.06,z-2-turnLen/2);
    for(const dx of [-1.5,1.5])box('wall',0.12,H,turnLen,turnX+dx,y+H/2,z-2-turnLen/2);
    box('wall',3,H,0.12,turnX,y+H/2,z-2-turnLen);
    box('wall',reach,0.12,4,cx,y+H,z);
    box('wall',3,0.12,turnLen,turnX,y+H,z-2-turnLen/2);
    box('wall',0.12,H-2.2,4,side*W,y+(H+2.2)/2,z);
  }
  if(W>=5&&['auditorium','colonnade'].includes(room.shape)){
    for(const side of [-1,1])for(let z=-5;z> -L+3;z-=6){
      box('wall',0.65,H,0.65,side*(W-3),H/2,z);
      box('trim',0.85,0.18,0.85,side*(W-3),0.09,z);
      reserve(side*(W-3),z,0.85,0.85);
    }
    if(room.shape==='auditorium'){
      for(const side of [-1,1]){box('floor',W-1.2,0.6,4,side*(W+1.2)/2,0.3,-L+3);reserve(side*(W+1.2)/2,-L+3,W-1.2,4);}
      for(const side of [-1,1])box('trim',W-1.2,0.12,0.18,side*(W+1.2)/2,0.66,-L+5);
    }
  }
  if(W>=3&&L>=14&&room.shape==='deadStairs'){
    const side=room.index%2?-1:1,x=side*(W-1.5),base=-L*0.36,y=floorHeight(room,base);
    for(let i=0;i<12;i++){const h=(i+1)*0.18;box('floor',1.6,h,0.36,x,y+h/2,base-i*0.36);}
    const end=base-12*0.36;
    box('floor',1.6,0.16,1.5,x,y+2.16-0.08,end-0.57);
    box('wall',1.9,Math.max(0.5,H-y-2.16),0.15,x,(H+y+2.16)/2,end-1.32);
    box('trim',0.09,2.16,4.6,x+side*0.85,y+1.08,base-2.15);
    reserve(x,base-2.7,2,6.1);
    group.userData.deadStairs=true;
  }
  for(const [kind,pieces] of batches){const geometry=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());group.add(new THREE.Mesh(geometry,materials[kind]));}
  group.userData.openings=openings;
  group.userData.reservations=reservations;
  group.userData.dispose=()=>{group.traverse(o=>{if(o.isMesh)o.geometry.dispose();});Object.values(materials).forEach(m=>m.dispose());};
  return group;
}
