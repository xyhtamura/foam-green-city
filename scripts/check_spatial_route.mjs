import assert from 'node:assert/strict';
import {spatialFrame,spatialPoint,TWIST_LENGTH,SPATIAL_PROFILES,INVERSION,inversionRoll} from '../spatial-route.js';
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
  assert(distance(f.up,before.up)<0.00025,'roll stays under 0.25 rad per metre');
}
assert(Math.abs(spatialFrame(TWIST_LENGTH).up[1]+1)<1e-10);
for(let i=0;i<60;i++){
  const a=sequence.room(i),b=sequence.room(i+1);
  assert.equal(a.startZ-a.length,b.startZ);
  assert(a.length>=6&&a.length<=12);assert([4,6].includes(a.width));assert.equal(a.rise,0);
  assert(distance(spatialPoint(0,0,a.startZ-a.length),spatialPoint(0,0,b.startZ))<1e-10);
}
// Inversions: half a turn per stretch, continuous, never two at once, also behind the start.
const starts=[];
for(let d=-760;d<=7600;d+=0.25){
  const a=inversionRoll(d),b=inversionRoll(d+0.25);
  assert(b>=a-1e-12&&b-a<0.05,'inversion roll is monotonic and continuous');
  if(b>a&&!(inversionRoll(d-0.25)<a))starts.push(d);
}
for(let k=-4;k<40;k++)assert(Math.abs(inversionRoll((k+1)*INVERSION.period)-inversionRoll(k*INVERSION.period)-Math.PI)<1e-9,'one half-turn per stretch');
const gaps=starts.slice(1).map((d,i)=>d-starts[i]);
assert(new Set(gaps.map(g=>Math.round(g))).size>=2,'inversions are unevenly spaced');
assert(Math.min(...gaps)>=INVERSION.length,'inversions do not overlap');
console.log(`Inversions: first at ${starts.find(d=>d>=0)} m, spacing ${Math.min(...gaps)}–${Math.max(...gaps)} m`);
console.log('Passed 28,805 spatial frames across five profiles, eye-height and continuity checks, 60 room joins, and the original half-turn.');
