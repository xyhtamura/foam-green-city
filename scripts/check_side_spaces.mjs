import assert from 'node:assert/strict';
import {branchOpenings,sideSpacePlan} from '../side-spaces.js';
import {createWalkSequence,walkRegions,canOccupy,moveWalker,pathToRoute} from '../navigation.js';
let cases=0;
for(const sideRoom of ['bedroom','bare',undefined])for(const kind of ['room','hallway'])for(const width of [4,6,8])for(const length of [6,8,12,16])for(const index of [-5,-2,0,1,7]){
  const room={index,width,length,startZ:13,height:2.58,rise:0,shape:'rectangle',sideSpaces:kind,sideRoom};
  const portal=branchOpenings(room)[0],plan=sideSpacePlan(room,portal);
  assert.deepEqual(plan,sideSpacePlan({...room}, {...portal}));
  for(const r of plan.rectangles){assert.ok(r.minZ>=-length+.2&&r.maxZ<=-.2,'annex stays within its owning cell');}
  for(const f of plan.fixtures){assert.ok(f.x-f.w/2>=plan.roomRect.minX+.06&&f.x+f.w/2<=plan.roomRect.maxX-.06&&f.z-f.d/2>=plan.roomRect.minZ+.06&&f.z+f.d/2<=plan.roomRect.maxZ-.06,'furniture fits inside side room');}
  const regions=walkRegions(room,[portal]),blocks=plan.blocks.map(b=>({...b,minZ:b.minZ+room.startZ,maxZ:b.maxZ+room.startZ}));
  const canMove=(x,z)=>canOccupy(x,z,{regions,blocks});
  const target={x:(plan.roomRect.minX+plan.roomRect.maxX)/2,z:room.startZ+portal.z};
  const walker={x:0,z:target.z,yaw:0};
  moveWalker(walker,{strafe:portal.side,delta:Math.abs(target.x)/2.2,canMove});
  assert.ok(Math.abs(walker.x-target.x)<1e-8,'walk from main room into annex');
  assert.ok(!canMove(portal.side*(width/2),room.startZ+portal.z+plan.opening/2+.3),'doorway infill blocks lateral exit');
  assert.ok(!canMove(portal.side*(width/2+10),target.z),'outer wall bounds');
  if(plan.bedroom){const bed=plan.fixtures.find(f=>f.role==='bed');assert.ok(!canMove(bed.x,room.startZ+bed.z),'bed footprint blocks walking');}
  const path=pathToRoute(target,room,canMove);assert.ok(path&&path.path.length,'return from annex to main route');
  for(const p of path.path)assert.ok(canMove(p.x,p.z));
  cases++;
}
for(const sideSpaces of ['room','hallway','off']){
  const stream=createWalkSequence({sequence:'demo',seed:5,sideSpaces});
  for(const i of [-8,-1,0,3,15]){
    const room=stream.room(i);
    assert.deepEqual(stream.atDistance(-room.startZ+room.length/2),room,'navigation and rendering see identical side choices');
    if(sideSpaces==='off'&&room.shape==='rectangle')assert.equal(branchOpenings(room).length,0);
  }
}
assert.equal(branchOpenings({shape:'rectangle',width:80,length:48,height:32,rise:0,sideSpaces:'room'}).length,0,'vast rooms retain their own geometry');
console.log(`PASS ${cases} annexes: direct/hallway entry, wall collision, route return, deterministic reconstruction, and owning-cell bounds`);
