// Run: node --experimental-default-type=module scripts/check_room_sequences.mjs
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const source=await readFile(new URL('../room-sequences.js',import.meta.url),'utf8');
const {createRoomSequence,SEQUENCE_NAMES,floorHeight,cameraRoute,routePoint}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const {generateRoom}=await import('../room-generator.js');
for(const options of [{},...SEQUENCE_NAMES.map(sequence=>({sequence,generate:generateRoom})),{widths:[4,8,6],lengths:[8,24,12]}]){
  const stream=createRoomSequence(options),copy=createRoomSequence(options);
  let distance=0;
  for(let i=0;i<1000;i++){
    const room=stream.room(i);
    assert.equal(-room.startZ,distance);
    assert.equal(room.length%2,0);
    assert.deepEqual(room,copy.room(i));
    assert.equal(floorHeight(room,0),0);
    assert.equal(floorHeight(room,-room.length),0);
    assert.equal(floorHeight(room,-room.length/2),room.rise);
    assert.ok(room.height-room.rise>=2.58);
    const mainRoute=cameraRoute(room);
    if(room.yero){
      // The yero path wanders, from the middle of one doorway to the middle of the next.
      const first=mainRoute.legs[0],last=mainRoute.legs.at(-1);
      assert.ok(mainRoute.length>room.length&&mainRoute.legs.length>4);
      assert.deepEqual([first.start.x,first.start.z,last.end.x,last.end.z],[0,0,0,-room.length]);
      assert.ok(mainRoute.legs.every(leg=>Math.abs(leg.end.x)<=1.6&&leg.end.z<leg.start.z),'the path keeps within 1.6 m of the middle and never turns back');
    }else{
      assert.equal(mainRoute.length,room.length);
      assert.equal(mainRoute.legs.length,1);
      assert.equal(routePoint(mainRoute,room.length/2).x,0);
    }
    const route=cameraRoute(room,[{side:1,z:-room.length/2}]);
    assert.ok(route.length>=room.length);
    assert.deepEqual({...routePoint(route,route.length),yaw:0},{x:0,z:-room.length,yaw:0});
    assert.equal(stream.atDistance(distance).index,i);
    assert.equal(stream.atDistance(distance+room.length-0.001).index,i);
    distance+=room.length;
    assert.equal(stream.atDistance(distance).index,i+1);
  }
  assert.equal(stream.atDistance(0).index,0); // Backward seek after a long run.
}
console.log(`Passed: ${(SEQUENCE_NAMES.length+2)*1000} rooms; deterministic descriptors, contiguous boundaries, floor elevations, exact joins, backward lookup.`);
const mixed=createRoomSequence(),counts={domestic:0,strange:0,rare:0},rare=[],floors={};
let previous=-1;
for(let i=0;i<10000;i++){
  const room=mixed.room(i);counts[room.category]++;floors[room.floor]=(floors[room.floor]||0)+1;
  if(room.category==='domestic'){
    assert.ok(room.width<=8&&room.length<=12);
    assert.equal(room.height,2.58);assert.equal(room.rise,0);assert.equal(room.shape,'rectangle');
  }else{
    if(previous>=0)assert.ok([3,4].includes(i-previous));previous=i;
    if(room.category==='rare')rare.push({i,height:room.height,rise:room.rise,type:room.type});
    else assert.ok(room.width<=8&&room.length<=24&&room.height<=5.5&&Math.abs(room.rise)<=0.65);
  }
}
assert.ok(counts.domestic/10000>0.71);
assert.ok(counts.rare/10000>0.02&&counts.rare/10000<0.025);
assert.ok(rare[0].i>=20);
// Bare cement is still the usual floor; plain white tile is the usual finished one; the
// coloured replacement-tile floor is retired.
assert.ok(floors.bare/10000>0.65);
assert.ok(floors.whiteTile/10000>0.08&&floors.whiteTile>(floors.maroonTile||0)*2);
assert.equal(floors.mismatchedTiles,undefined);
assert.ok(rare.some(r=>r.height===24));
assert.ok(rare.some(r=>r.rise===-3));
console.log(JSON.stringify({mixSample:10000,counts,floors,firstRare:rare.slice(0,5),firstTall:rare.find(r=>r.height===24)}));
