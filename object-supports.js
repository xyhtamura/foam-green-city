import {FOOTPRINT_HALF,TABLE_TOP} from './furniture-layouts.js?v=f5a77c10bb';

// Support coordinates are local to the furniture, before room deformation.
export function tableSupport(placement){
  if(placement?.role!=='table'||placement.inverted||placement.stack!==null)return null;
  const half=FOOTPRINT_HALF[placement.kind],top=TABLE_TOP[placement.kind],k=placement.scale??{x:1,y:1,z:1};
  if(!half||top===undefined)return null;
  // A resized table offers a resized top at its own height.
  return {minX:-half.x*k.x+0.025,maxX:half.x*k.x-0.025,minZ:-half.z*k.z+0.025,maxZ:half.z*k.z-0.025,height:top*k.y,reservations:[]};
}

// The inset avoids the rounded edge, rear backrest, and arm supports.
export function seatSupport(placement){
  if(placement?.role!=='seat'||placement.kind!=='monoblocChair'||placement.inverted||placement.stack!==null||(placement.y??0)!==0)return null;
  return {minX:-0.215,maxX:0.215,minZ:-0.16,maxZ:0.16,height:0.481,reservations:[]};
}

export function reserveSupport(support,footprint){
  if(footprint.minX<support.minX||footprint.maxX>support.maxX||footprint.minZ<support.minZ||footprint.maxZ>support.maxZ)return false;
  if(support.reservations.some(b=>footprint.minX<b.maxX&&footprint.maxX>b.minX&&footprint.minZ<b.maxZ&&footprint.maxZ>b.minZ))return false;
  support.reservations.push({...footprint});return true;
}

export function surfaceSupport(bounds,margin=0.015){
  return {minX:bounds.minX+margin,maxX:bounds.maxX-margin,minZ:bounds.minZ+margin,maxZ:bounds.maxZ-margin,height:bounds.height,reservations:[]};
}

// Mesh bounds in a support's coordinates, preserving rotated furniture frames.
export function localBounds(THREE,object,parent){
  parent.updateWorldMatrix(true,true);
  const inverse=parent.matrixWorld.clone().invert(),bounds=new THREE.Box3();
  object.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld)));}});
  return bounds;
}

export function placeOnSupport({THREE,parent,object,support,random,accept=()=>true}){
  object.rotation.y=(random()-0.5)*0.4;object.updateMatrixWorld(true);
  const b=new THREE.Box3().setFromObject(object);
  if(object.children.length===1&&object.children[0].userData.billboard){
    const radius=Math.hypot(b.max.x-b.min.x,b.max.z-b.min.z)/2;
    const x=(b.min.x+b.max.x)/2,z=(b.min.z+b.max.z)/2;
    b.min.x=x-radius;b.max.x=x+radius;b.min.z=z-radius;b.max.z=z+radius;
  }
  const w=b.max.x-b.min.x,d=b.max.z-b.min.z;
  if(w>support.maxX-support.minX||d>support.maxZ-support.minZ){object.userData.supportRejected='too large';return false;}
  const cx=(b.min.x+b.max.x)/2,cz=(b.min.z+b.max.z)/2;
  const start=Math.floor(random()*25);
  for(let i=0;i<25;i++){
    const slot=(start+i*7)%25;
    const x=support.minX+w/2+(support.maxX-support.minX-w)*(slot%5)/4;
    const z=support.minZ+d/2+(support.maxZ-support.minZ-d)*Math.floor(slot/5)/4;
    const footprint={minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2};
    if(support.reservations.some(r=>footprint.minX<r.maxX+0.008&&footprint.maxX>r.minX-0.008&&footprint.minZ<r.maxZ+0.008&&footprint.maxZ>r.minZ-0.008))continue;
    object.position.set(x-cx,support.height-b.min.y+0.002,z-cz);parent.add(object);parent.updateWorldMatrix(true,true);
    if(!accept(object)||!reserveSupport(support,footprint)){parent.remove(object);continue;}
    object.userData.supportPlacement={support:parent.name,footprint,height:support.height,contactGap:0.002};
    return true;
  }
  object.userData.supportRejected='no clear position';return false;
}
