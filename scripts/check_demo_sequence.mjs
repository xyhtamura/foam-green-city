import assert from 'node:assert/strict';
import {createRoomSequence} from '../room-sequences.js';
for(const seed of [5,17,42,1024]){
  const stream=createRoomSequence({sequence:'demo',seed}),copy=createRoomSequence({sequence:'demo',seed});
  const counts={domestic:0,strange:0,rare:0},exceptionIndices=[],rareExamples=[],lengths=new Set();
  let distance=0;const variations=new Set();
  for(let i=0;i<10000;i++){
    const room=stream.room(i);assert.deepEqual(room,copy.room(i));assert.equal(-room.startZ,distance);
    counts[room.category]++;distance+=room.length;
    if(room.category==='domestic'){
      assert.ok(room.width<=8&&room.height===2.58&&room.length>=6&&room.length<=12);lengths.add(room.length);
    }else{
      if(room.category==='rare')variations.add(room.spaceVariation);
      if(exceptionIndices.length)assert.ok([6,7,8].includes(i-exceptionIndices.at(-1)));
      exceptionIndices.push(i);
      if(room.category==='rare'&&rareExamples.length<5)rareExamples.push({i,width:room.width,height:room.height});
    }
    assert.equal(stream.atDistance(distance-0.001).index,i);
    assert.equal(stream.atDistance(distance).index,i+1);
  }
  assert.ok(counts.domestic>8300&&counts.domestic<8900);assert.ok(counts.rare>0&&counts.rare<400);
  assert.equal(lengths.size,4);assert.ok(exceptionIndices[0]>=5);
  assert.equal(variations.size,6,'all six vast-space variants occur');
  console.log(JSON.stringify({seed,counts,firstException:exceptionIndices[0],rareExamples}));
}
assert.notDeepEqual(createRoomSequence({sequence:'demo',seed:5}).room(10),createRoomSequence({sequence:'demo',seed:42}).room(10));
console.log('PASS 40,000 demo rooms: seeds, 6–8-room exception spacing, bounds, lengths, and joins');
