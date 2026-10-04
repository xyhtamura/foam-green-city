import assert from 'node:assert/strict';
import {spatialFrame,spatialPoint,TWIST_LENGTH,SPATIAL_PROFILES} from '../spatial-route.js';
import {createRoomSequence} from '../room-sequences.js';
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const sequence=createRoomSequence({sequence:'twist'});
for(const profile of SPATIAL_PROFILES)for(let d=0;d<=720;d+=0.125){
  const f=spatialFrame(d,profile);
  for(const v of [f.right,f.up,f.back])assert(Math.abs(dot(v,v)-1)<1e-10);
  assert(Math.abs(dot(f.right,f.up))<1e-10);
  assert(Math.abs(dot(f.back,f.up))<1e-10);
  const eye=spatialPoint(0,1.6,-d,profile),floor=spatialPoint(0,0,-d,profile);
  assert(Math.abs(distance(eye,floor)-1.6)<1e-10);
  assert(distance(spatialPoint(0,0,-d-0.001,profile),floor)<0.0011);
  const before=spatialFrame(d+0.001,profile);
  assert(distance(f.up,before.up)<0.0001);
}
assert(Math.abs(spatialFrame(TWIST_LENGTH).up[1]+1)<1e-10);
for(let i=0;i<60;i++){
  const a=sequence.room(i),b=sequence.room(i+1);
  assert.equal(a.startZ-a.length,b.startZ);
  assert(a.length>=6&&a.length<=12);assert([4,6].includes(a.width));assert.equal(a.rise,0);
  assert(distance(spatialPoint(0,0,a.startZ-a.length),spatialPoint(0,0,b.startZ))<1e-10);
}
console.log('Passed 28,805 spatial frames across five profiles, eye-height and continuity checks, 60 room joins, and the original half-turn.');
