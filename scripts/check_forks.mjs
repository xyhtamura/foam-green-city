// Usage: node --experimental-default-type=module scripts/check_forks.mjs
// Checks fork passages (route stays walkable and reaches the exit) and content salts.
import assert from 'node:assert/strict';
import {branchOpenings} from '../side-spaces.js';
import {createWalkSequence,walkRegions,canOccupy} from '../navigation.js';
import {exitRoute,passageExit,routePoint,cameraRoute} from '../room-sequences.js';

const sequence=createWalkSequence({sequence:'demo',seed:5});
let forks=0,rooms=0,first=null;
for(let i=0;i<3000;i++){
  const room=sequence.room(i),portals=branchOpenings(room).filter(p=>p.kind==='legacy');rooms++;
  if(!portals.length)continue;
  forks++;first??=i;
  const regions=walkRegions(room,branchOpenings(room));
  for(const portal of portals){
    const route=exitRoute(room,portal),end=passageExit(room,portal);
    assert.ok(route.exit&&route.length>cameraRoute(room).length*0.5);
    for(let d=0.3;d<route.length;d+=0.2){
      const p=routePoint(route,d);
      assert.ok(canOccupy(p.x,room.startZ+p.z,{regions}),`room ${i}: exit route leaves the walkable area at ${d.toFixed(1)} m`);
    }
    const last=routePoint(route,route.length-0.001);
    assert.ok(Math.abs(last.x-end.x)<1e-9&&last.z<end.z+0.8&&last.z>end.z,'route ends inside the exit zone, short of the doorway');
    assert.ok(end.z>=-room.length-1e-9,'exit doorway lies within the owning room');
    // A walker can stand in the exit zone by hand as well.
    assert.ok(canOccupy(end.x,room.startZ+end.z+0.5,{regions}));
  }
}
assert.ok(forks/rooms>0.03&&forks/rooms<0.12,`fork share ${(forks/rooms*100).toFixed(1)}%`);

const shell=r=>[r.index,r.width,r.length,r.height,r.type,r.shape,r.rise,r.startZ,r.floor,r.layout].join();
const before=sequence.room(40);
assert.equal(before.generationIndex,undefined,'unsalted rooms keep their index as the content seed');
sequence.hold(40);sequence.release(41);
assert.deepEqual(sequence.room(40),before,'a held room keeps its salt while others are discarded');
sequence.release(40);
const after=sequence.room(40);
assert.equal(shell(after),shell(before),'discarding changes contents, not the shell');
assert.notEqual(after.generationIndex,before.index);assert.notEqual(after.branchSeed,before.branchSeed);
sequence.hold(40);const held=sequence.room(40);sequence.reroll();
assert.notEqual(sequence.room(40).generationIndex,held.generationIndex,'a reroll releases every held room');
for(let i=0;i<200;i++)assert.equal(shell(sequence.room(i)),shell(createWalkSequence({sequence:'demo',seed:5}).room(i)));
console.log(`PASS ${forks} fork rooms in ${rooms} (${(forks/rooms*100).toFixed(1)}%), first at room ${first}; exit routes walkable; salts keep shells and change contents`);
