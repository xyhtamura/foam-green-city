import {FOOTPRINT_HALF,TABLE_TOP} from './furniture-layouts.js';

// Support coordinates are local to the furniture, before room deformation.
export function tableSupport(placement){
  if(placement?.role!=='table'||placement.inverted||placement.stack!==null)return null;
  const half=FOOTPRINT_HALF[placement.kind],height=TABLE_TOP[placement.kind];
  if(!half||height===undefined)return null;
  return {minX:-half.x+0.025,maxX:half.x-0.025,minZ:-half.z+0.025,maxZ:half.z-0.025,height,reservations:[]};
}

export function reserveSupport(support,footprint){
  if(footprint.minX<support.minX||footprint.maxX>support.maxX||footprint.minZ<support.minZ||footprint.maxZ>support.maxZ)return false;
  if(support.reservations.some(b=>footprint.minX<b.maxX&&footprint.maxX>b.minX&&footprint.minZ<b.maxZ&&footprint.maxZ>b.minZ))return false;
  support.reservations.push({...footprint});return true;
}
