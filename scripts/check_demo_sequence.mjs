// Usage: node --experimental-default-type=module scripts/check_demo_sequence.mjs
// Checks the generated demo run: determinism, joins, the limits later stages rely on, and the mix that emerges.
import assert from 'node:assert/strict';
import {createRoomSequence,floorHeight} from '../room-sequences.js';
import {generateRoom,roomPressure} from '../room-generator.js';
import {LAYOUT_IDS,ODD_LAYOUT_IDS,generateFurnitureLayout,checkFurnitureLayout} from '../furniture-layouts.js';
import {branchOpenings} from '../side-spaces.js';

const TYPES=['sala','kitchen','bedroom','bathroom','bare','hall','auditorium'];
for(const seed of [5,17,42,1024]){
  const stream=createRoomSequence({sequence:'demo',seed,generate:generateRoom}),copy=createRoomSequence({sequence:'demo',seed,generate:generateRoom});
  const counts={domestic:0,strange:0,rare:0},seen={stairs:0,columns:0,platform:0,passages:0,rise:0,tall:0,wide:0,long:0,coincide:0,oddDomestic:0},layouts=new Set(),examples=[];
  let distance=0,furnished=0;const reaches=new Set(),positions=new Set(),depths=new Set();
  for(let i=0;i<10000;i++){
    const room=stream.room(i);assert.deepEqual(room,copy.room(i));assert.equal(-room.startZ,distance);
    counts[room.category]++;distance+=room.length;layouts.add(room.layout);
    // Limits the builder, the route, and navigation assume.
    assert.ok(room.width>=4&&room.width<=80&&room.width%2===0,`width ${room.width}`);
    assert.ok(room.length>=6&&room.length<=64&&room.length%2===0,`length ${room.length}`);
    assert.ok(room.height>=2.58&&room.height-room.rise>=2.58-1e-9&&room.height<=36,`height ${room.height}, rise ${room.rise}`);
    assert.ok(TYPES.includes(room.type)&&LAYOUT_IDS.includes(room.layout));
    assert.ok(Math.abs(room.rise)<=0.3*room.length/4+1e-9&&(!room.rise||room.length>=12),'ramps stay gentle');
    assert.equal(floorHeight(room,0),0);assert.equal(floorHeight(room,-room.length),0);
    if(room.shape!=='rectangle'){
      const portals=branchOpenings({...room,index:i});
      assert.ok(room.length>=12&&portals.length===room.passages.length&&new Set(portals.map(p=>p.side)).size===portals.length,'one passage per side');
      for(const p of portals){
        assert.ok(p.j>=1&&p.z-2>=-room.length+2-1e-9,'the opening sits between the end walls');
        assert.ok(p.turn>=2&&p.z-2-p.turn>=-room.length-1e-9,'the return leg ends within the room length');
        assert.ok(p.reach>=5&&p.reach<=14&&p.height>=2.4&&p.height<=room.height+1e-9);
        reaches.add(p.reach);positions.add(p.j);
      }
    }
    if(room.stairs){
      assert.ok(room.width>=6&&room.length>=14&&room.shape!=='cross');
      assert.ok(room.stairs.steps>=4&&room.stairs.steps*0.18<=room.height-1.1+1e-9,'stairs stop below the ceiling');
      if(room.passages)assert.equal(room.stairs.side,-room.passages[0].side,'stairs take the wall opposite the passage');
    }
    if(room.columns)assert.ok(room.width>=10&&room.columns.rows>=1);
    if(room.platform){const p=room.platform;assert.ok(room.width>=10&&room.length>=16&&!room.rise&&room.type==='auditorium');assert.ok(p.depth>=2&&p.depth<=room.length/4&&p.height>=0.3&&p.height<=1.2&&room.width/2-p.inset>=2.5&&p.sides.length>=1);depths.add(p.depth);}
    if(room.type==='bathroom')assert.equal(room.width,4);
    if(room.category==='domestic')assert.ok(room.width<=8&&room.length<=12&&room.height===2.58&&!room.rise&&room.shape==='rectangle'&&!room.stairs&&!room.columns);
    if(i<4)assert.equal(room.category,'domestic','the opening stays domestic');
    // Furniture: valid at this size, and never a paired layout too large to draw whole.
    if(i%7===0&&room.type!=='bathroom'){
      const placed=generateFurnitureLayout({width:room.width,length:room.length,seed:i+41,layout:room.layout,finishCount:4});
      assert.ok(checkFurnitureLayout(placed,{width:room.width,length:room.length}).ok);
      assert.ok(placed.length<=160||['chairRows','perimeter'].includes(room.layout),`${room.layout} places ${placed.length} in ${room.width}x${room.length}`);furnished++;
    }
    const features=[room.stairs,room.columns,room.platform,room.shape!=='rectangle',room.rise].filter(Boolean).length;
    if(room.stairs)seen.stairs++;if(room.columns)seen.columns++;if(room.platform)seen.platform++;if(room.shape!=='rectangle')seen.passages++;if(room.rise)seen.rise++;
    if(room.height>=8)seen.tall++;if(room.width>=24)seen.wide++;if(room.length>=32)seen.long++;if(features>=2)seen.coincide++;
    if(room.category==='domestic'&&ODD_LAYOUT_IDS.includes(room.layout))seen.oddDomestic++;
    if(room.category==='rare'&&examples.length<4)examples.push(`${i}: ${room.width}x${room.length}x${room.height} ${room.type} ${room.layout}${room.columns?' columns':''}${room.stairs?' stairs':''}${room.rise?' rise '+room.rise:''}${room.shape==='rectangle'?'':' '+room.shape}`);
    assert.equal(stream.atDistance(distance-0.001).index,i);
    assert.equal(stream.atDistance(distance).index,i+1);
  }
  // Unusual rooms are the minority, and every kind of unusual thing turns up without being listed.
  assert.ok(counts.domestic>7800&&counts.domestic<8900,`domestic ${counts.domestic}`);
  assert.ok(counts.rare>50&&counts.rare<350,`rare ${counts.rare}`);
  for(const [name,n] of Object.entries(seen))assert.ok(n>(name==='platform'?4:10),`${name} occurs (${n})`);
  assert.equal(layouts.size,LAYOUT_IDS.length,'every layout occurs');
  assert.ok(reaches.size>=8&&positions.size>=6&&depths.size>=3,`passages and platforms vary: ${reaches.size} reaches, ${positions.size} positions, ${depths.size} platform depths`);
  console.log(JSON.stringify({seed,counts,seen,furnished}));console.log('  '+examples.join(' | '));
}
for(let i=5;i<4000;i++){const p=roomPressure(i,5);assert.ok(p.strange>=0&&p.strange<=1&&p.scale>=0&&p.scale<=1);}
assert.notDeepEqual(generateRoom(40,5),generateRoom(40,42));
console.log('PASS 40,000 generated rooms: determinism, joins, shell limits, furniture fit, and emergent mix');
