import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {floorHeight} from './room-sequences.js?v=29908bed5a';

import {branchOpenings,sideSpacePlan} from './side-spaces.js?v=29908bed5a';
export {branchOpenings} from './side-spaces.js?v=29908bed5a';

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

export function createRoomArchitecture(room,curvize,{woodTexture=null,stairs=null,wallColor=0xbfdcc9,trimColor=0x4e7c63}={}){
  const group=new THREE.Group(),batches=new Map(),W=room.width/2,L=room.length,H=room.height,reservations=[];
  const reserve=(x,z,w,d)=>reservations.push({minX:x-w/2-0.12,maxX:x+w/2+0.12,minZ:z-d/2-0.12,maxZ:z+d/2+0.12});
  const materials={wood:curvize(new THREE.MeshLambertMaterial({map:woodTexture,color:0xbda887})),wall:curvize(new THREE.MeshLambertMaterial({color:wallColor})),floor:curvize(new THREE.MeshLambertMaterial({color:0x9c9c95})),trim:curvize(new THREE.MeshLambertMaterial({color:trimColor})),exit:curvize(new THREE.MeshBasicMaterial({color:0x080b0a}))};
  function box(kind,w,h,d,x,y,z,rx=0){
    const geo=new THREE.BoxGeometry(w,h,d,Math.max(1,Math.ceil(w/2)),1,Math.max(1,Math.ceil(d/2)));geo.rotateX(rx);geo.translate(x,y,z);
    if(!batches.has(kind))batches.set(kind,[]);batches.get(kind).push(geo);
  }
  const openings=branchOpenings(room),sideBlocks=[],sideSpaces=[];
  // Full-height walls behind window modules keep the perimeter closed above them.
  const upperBase=2.58+Math.min(0,room.rise);
  if(H>upperBase)for(const side of [-1,1])for(let j=0;j<L/2;j++){
    if(openings.some(p=>p.side===side&&(j===p.j||j===p.j+1)))continue;
    box('wall',0.12,H-upperBase,2,side*(W+0.04),(H+upperBase)/2,-j*2-1);
  }
  for(const portal of openings){
    if(portal.kind!=='legacy'){
      const plan=sideSpacePlan(room,portal),y=floorHeight(room,portal.z),height=plan.height;
      reserve(portal.side*(W+0.6)/2,portal.z,W-0.6,plan.opening+0.4);
      for(const r of plan.rectangles){
        const w=r.maxX-r.minX,d=r.maxZ-r.minZ,x=(r.minX+r.maxX)/2,z=(r.minZ+r.maxZ)/2;
        box('floor',w,0.12,d,x,y-0.06,z);box('wall',w,0.12,d,x,y+height+0.06,z);
      }
      for(const w of plan.walls)box('wall',w.axis==='x'?0.12:w.b-w.a,height,w.axis==='x'?w.b-w.a:0.12,w.axis==='x'?w.edge:(w.a+w.b)/2,y+height/2,w.axis==='x'?(w.a+w.b)/2:w.edge);
      box('wall',0.12,room.height-2.15,plan.opening,portal.side*W,y+(room.height+2.15)/2,portal.z);
      if(plan.exit){
        const e=plan.exit,width=e.half*2;
        if(height>2.05)box('wall',0.12,height-2.05,width,e.x,y+(height+2.05)/2,e.z);
        for(const dz of [-e.half,e.half])box('trim',0.16,2.05,0.06,e.x,y+1.025,e.z+dz);
        box('trim',0.16,0.06,width+0.06,e.x,y+2.05,e.z);
        box('exit',0.04,2.05,width,e.x+e.side*0.1,y+1.025,e.z);
      }
      for(const dz of [-plan.opening/2,plan.opening/2])box('trim',0.16,2.15,0.06,portal.side*W,y+1.075,portal.z+dz);
      box('trim',0.16,0.06,plan.opening,portal.side*W,y+2.15,portal.z);
      if(portal.door)box('trim',plan.opening-0.1,2.05,0.045,portal.side*(W+(plan.opening-0.1)/2),y+1.025,portal.z+plan.opening/2);
      for(const f of plan.fixtures.filter(f=>!f.role)){box('trim',f.w,f.h,f.d,f.x,y+f.h/2,f.z);box('floor',f.w+0.015,0.025,f.d+0.015,f.x,y+f.h+0.0125,f.z);}
      sideBlocks.push(...plan.blocks.map(b=>({...b,minY:y,maxY:y+height})));
      sideSpaces.push({...portal,exit:!!plan.exit,furnishing:plan.furnishing,roomRect:plan.roomRect,opening:plan.opening,height,regions:plan.regions});
      continue;
    }
    const {side,z,reach,turn:turnLen}=portal,P=portal.height,y=floorHeight(room,z),cx=side*(W+reach/2);
    reserve(side*(W+0.6)/2,z,W-0.6,4);
    // A real side passage with a right-angle return, as long and as high as its opening says.
    box('floor',reach,0.12,4,cx,y-0.06,z);
    box('wall',reach,P,0.12,cx,y+P/2,z+2);
    box('wall',Math.max(1,reach-3),P,0.12,side*(W+(reach-3)/2),y+P/2,z-2);
    box('wall',0.12,P,4,side*(W+reach),y+P/2,z);
    const turnX=side*(W+reach-1.5);
    box('floor',3,0.12,turnLen,turnX,y-0.06,z-2-turnLen/2);
    for(const dx of [-1.5,1.5])box('wall',0.12,P,turnLen,turnX+dx,y+P/2,z-2-turnLen/2);
    box('wall',reach,0.12,4,cx,y+P,z);
    box('wall',3,0.12,turnLen,turnX,y+P,z-2-turnLen/2);
    box('wall',0.12,H-2.2,4,side*W,y+(H+2.2)/2,z);
    // The passage ends in a dark doorway: the way out of this run of rooms.
    const endZ=z-2-turnLen;
    for(const dx of [-1.05,1.05])box('wall',0.9,P,0.12,turnX+dx,y+P/2,endZ);
    if(P>2.15)box('wall',1.2,P-2.15,0.12,turnX,y+(P+2.15)/2,endZ);
    for(const dx of [-0.6,0.6])box('trim',0.06,2.15,0.16,turnX+dx,y+1.075,endZ);
    box('trim',1.26,0.06,0.16,turnX,y+2.15,endZ);
    box('exit',1.2,2.15,0.04,turnX,y+1.075,endZ-0.1);
  }
  // Stairs, platform, and columns are separate features. Old shape names still select their defaults.
  const solids=[],solid=(x,z,w,d)=>{reserve(x,z,w,d);solids.push(reservations.at(-1));};
  const stair=room.stairs??(room.shape==='deadStairs'?{steps:12,side:room.index%2?-1:1,wooden:room.index%4!==0}:null);
  if(stair&&W>=3&&L>=14){
    const side=stair.side,x=side*(W-1.5),base=-L*0.36,y=floorHeight(room,base);
    const wooden=stairs!=='solid'&&(stairs==='wood'||stair.wooden),run=wooden?.25:.36;
    const n=Math.max(3,Math.min(stair.steps,Math.floor((0.64*L-1.95)/run))),top=n*.18;
    for(let i=0;i<n;i++){const h=(i+1)*.18;box(wooden?'wood':'floor',1.6,wooden?.045:h,wooden?.27:.36,x,wooden?y+h-.0225:y+h/2,base-i*run);}
    if(wooden){
      const dz=(n-1)*run+.28,angle=Math.atan2(top,dz),length=Math.hypot(top,dz);
      for(const dx of [-.81,.81])box('wood',.055,.24,length,x+dx,y+top/2,base-(n-1)*run/2,angle);
    }
    const end=base-n*run;
    // Handrails: both sides of an open wooden stair, the room side of a solid one, and along the landing.
    for(const dx of wooden?[-.78,.78]:[-side*.78]){
      const dz=(n-1)*run,length=Math.hypot(top-.18,dz);
      box('trim',.05,.05,length+.1,x+dx,y+(top+.18)/2+.9,base-dz/2,Math.atan2(top-.18,dz));
      for(let i=0;i<n;i+=3)box('trim',.04,.9,.04,x+dx,y+(i+1)*.18+.45,base-i*run);
      box('trim',.05,.05,1.5,x+dx,y+top+.9,end-.57);
      for(const z of [end+.1,end-1.2])box('trim',.04,.9,.04,x+dx,y+top+.45,z);
    }
    box(wooden?'wood':'floor',1.6,wooden?.055:.16,1.5,x,y+top-(wooden?.0275:.08),end-.57);
    box('wall',1.9,Math.max(0.5,H-y-top),0.15,x,(H+y+top)/2,end-1.32);
    if(!wooden)box('trim',0.09,top,n*run+.28,x+side*0.85,y+top/2,base-n*run/2+.01);
    group.userData.stairStyle=wooden?'openWood':'solid';
    solid(x,(base+.35+end-1.45)/2,2,base+.35-(end-1.45));
    group.userData.deadStairs=true;
  }
  // A platform: raised blocks at the far end, either side of the aisle or on one side only.
  const stage=room.platform===true||(room.platform==null&&room.shape==='auditorium')?{depth:4,height:0.6,inset:1.2,sides:[-1,1]}:room.platform||null;
  if(stage&&W>=5&&!room.rise)for(const side of stage.sides){
    const w=W-stage.inset,cx=side*(W+stage.inset)/2,cz=-L+1+stage.depth/2;
    box('floor',w,stage.height,stage.depth,cx,stage.height/2,cz);solid(cx,cz,w,stage.depth);
    box('trim',w,0.12,0.18,cx,stage.height+0.06,cz+stage.depth/2);
    // A rail along the edge facing the aisle, where the drop is.
    const edge=side*(stage.inset+0.06),top=stage.height+0.12;
    box('trim',0.05,0.05,stage.depth,edge,top+0.85,cz);
    for(let z=cz-stage.depth/2+0.1;z<=cz+stage.depth/2;z+=Math.max(0.9,stage.depth/Math.ceil(stage.depth)))box('trim',0.04,0.85,0.04,edge,top+0.425,z);
  }
  // Columns stand in rows from each side wall inward, and give way to anything already placed.
  const cols=room.columns??(['auditorium','colonnade'].includes(room.shape)?{inset:3,across:6,spacing:6,rows:1}:null);
  if(cols&&W>=5)for(const side of [-1,1])for(let row=0;row<cols.rows;row++){
    const x=side*(W-cols.inset-row*cols.across);if(Math.abs(x)<1.6)break;
    for(let z=-5;z> -L+3;z-=cols.spacing){
      if(reservations.some(b=>x+0.45>b.minX&&x-0.45<b.maxX&&z+0.45>b.minZ&&z-0.45<b.maxZ))continue;
      const y=floorHeight(room,z);
      box('wall',0.65,H-y,0.65,x,(H+y)/2,z);
      box('trim',0.85,0.18,0.85,x,y+0.09,z);
      solid(x,z,0.85,0.85);
    }
  }
  for(const [kind,pieces] of batches){const geometry=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());group.add(new THREE.Mesh(geometry,materials[kind]));}
  group.userData.openings=openings;
  group.userData.sideSpaces=sideSpaces;group.userData.sideBlocks=sideBlocks;
  group.userData.reservations=reservations;group.userData.solids=solids;
  group.userData.dispose=()=>{group.traverse(o=>{if(o.isMesh)o.geometry.dispose();});Object.values(materials).forEach(m=>m.dispose());};
  return group;
}
