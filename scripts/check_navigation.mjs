import assert from 'node:assert/strict';
import {createWalkSequence,retainedRooms,walkRegions,canOccupy,moveWalker,pathToRoute} from '../navigation.js';
const stream=createWalkSequence({sequence:'demo',seed:5}),copy=createWalkSequence({sequence:'demo',seed:5});
for(let i=-1000;i<1000;i++){
  const room=stream.room(i),next=stream.room(i+1);
  assert.deepEqual(room,copy.room(i));
  assert.ok(Math.abs(room.startZ-room.length-next.startZ)<1e-9);
  assert.equal(stream.atDistance(-room.startZ+room.length/2).index,i);
  assert.equal(retainedRooms(i).length,6);assert.ok(retainedRooms(i).includes(i));
}
// Cull then reconstruct both ways, independent of the order of discovery.
const live=new Map();let rebuilt=0;
for(const i of [0,10,25,3,-12,-1,25,0]){
  const wanted=retainedRooms(i);
  for(const j of wanted)if(!live.has(j)){live.set(j,stream.room(j));rebuilt++;}
  for(const j of live.keys())if(!wanted.includes(j))live.delete(j);
  assert.equal(live.size,6);for(const [j,room] of live)assert.deepEqual(room,copy.room(j));
}
const room={width:6,length:16,height:4,startZ:0,shape:'branches'},regions=walkRegions(room,[{side:1,z:-10}]);
assert.ok(canOccupy(10,-10,{regions}));assert.ok(canOccupy(11.5,-14,{regions}));
assert.ok(!canOccupy(10,-14,{regions}));assert.ok(!canOccupy(0,1,{regions}));
const bounds=[{minX:-4,maxX:4,minZ:-10,maxZ:0}],blocks=[{minX:-0.5,maxX:0.5,minZ:-5,maxZ:-4}];
const canMove=(x,z)=>canOccupy(x,z,{regions:bounds,blocks});
const state={x:0,z:-3,yaw:0};
moveWalker(state,{forward:1,delta:5,canMove});assert.ok(state.z>=-3.8,'cannot tunnel through furniture');
const back={x:0,z:-3,yaw:0};moveWalker(back,{forward:-1,delta:0.5,canMove});assert.ok(back.z> -3);
const diagonal={x:0,z:-2,yaw:0};moveWalker(diagonal,{forward:1,strafe:1,delta:0.1,canMove});assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.z+2)-0.22)<1e-9);
const rejoinClear=(x,z)=>canOccupy(x,z,{regions:bounds,blocks:[{minX:0.8,maxX:1.4,minZ:-5,maxZ:-4}]});
const path=pathToRoute({x:2,z:-4.5}, {...room,length:10},rejoinClear);
assert.ok(path&&path.path.length>2,'rejoin finds a way around furniture');
for(const p of path.path)assert.ok(rejoinClear(p.x,p.z));assert.equal(path.path.at(-1).x,0);
console.log(`PASS 2,000 bidirectional rooms, ${rebuilt} reconstructions, bounded batches, hallways, collision, reverse input, and automatic rejoin`);
