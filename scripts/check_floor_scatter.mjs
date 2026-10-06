// Usage: node scripts/check_floor_scatter.mjs
// Checks floor-scatter planning: bounds, aisle, blocked areas, determinism, and level mix.
import assert from 'node:assert/strict';
import {SCATTER_LEVELS,scatterLevel,planScatter,planSideScatter,scatterBlocks} from '../floor-scatter.js';
import {branchOpenings,sideSpacePlan} from '../side-spaces.js';
import {roomLighting} from '../room-lighting.js';

let cases=0,placed=0;
for(const type of ['sala','kitchen','bedroom','bathroom','bare','hall','auditorium'])for(const width of [4,6,8,12,24,80])for(const length of [6,8,12,24,48])for(const level of SCATTER_LEVELS)for(const seed of [0,3,10007]){
  const room={type,width,length},blocked=[{minX:-width/2,maxX:-width/2+1,minZ:-length/2-1,maxZ:-length/2+1},{minX:0.6,maxX:1.6,minZ:-3,maxZ:-2}];
  const items=planScatter(room,{seed,level,blocked});
  assert.deepEqual(items,planScatter({...room},{seed,level,blocked}),'same seed, same plan');
  if(level==='none')assert.equal(items.length,0);
  assert.ok(items.length<=170,'object cap');
  for(const o of items){
    assert.ok(Math.abs(o.x)-o.radius>=0.72-1e-9,'aisle stays clear');
    assert.ok(Math.abs(o.x)+o.radius<=width/2-0.13+1e-9,'inside side walls');
    assert.ok(o.z+o.radius<=-0.22+1e-9&&o.z-o.radius>=-length+0.22-1e-9,'inside partitions');
    for(const b of blocked)assert.ok(!(o.x+o.radius>b.minX&&o.x-o.radius<b.maxX&&o.z+o.radius>b.minZ&&o.z-o.radius<b.maxZ),'outside blocked area');
  }
  for(const b of scatterBlocks(items))assert.ok(b.minX>0.6||b.maxX< -0.6,'walker blocks stay off the aisle');
  cases++;placed+=items.length;
}
// Side rooms: inside the room rectangle, off its fixtures, and off the strip from the doorway.
let sideCases=0,sidePlaced=0;
for(const sideRoom of ['bedroom','storage','washroom','bare'])for(const kind of ['room','hallway'])for(const width of [4,6,8])for(const index of [0,1,7,12])for(const level of SCATTER_LEVELS){
  const room={index,width,length:12,startZ:0,height:2.58,rise:0,shape:'rectangle',sideSpaces:kind,sideRoom};
  const portal=branchOpenings(room)[0],plan=sideSpacePlan(room,portal),rect=plan.roomRect;
  const entry={minX:rect.minX,maxX:rect.maxX,minZ:portal.z-plan.opening/2-0.1,maxZ:portal.z+plan.opening/2+0.1};
  const blocked=[entry,...plan.blocks],items=planSideScatter(rect,{seed:index,level,blocked,furnishing:plan.furnishing});
  assert.deepEqual(items,planSideScatter(rect,{seed:index,level,blocked,furnishing:plan.furnishing}));
  if(level==='heavy')assert.ok(items.length>=3,`heavy ${sideRoom} side room holds ${items.length}`);
  for(const o of items){
    assert.ok(o.x-o.radius>=rect.minX+0.13-1e-9&&o.x+o.radius<=rect.maxX-0.13+1e-9&&o.z-o.radius>=rect.minZ+0.13-1e-9&&o.z+o.radius<=rect.maxZ-0.13+1e-9,'inside the side room');
    for(const b of blocked)assert.ok(!(o.x+o.radius>b.minX&&o.x-o.radius<b.maxX&&o.z+o.radius>b.minZ&&o.z-o.radius<b.maxZ),'off fixtures and the entry strip');
  }
  sideCases++;sidePlaced+=items.length;
}
console.log(`PASS ${sideCases} side-room plans, ${sidePlaced} objects`);
const sala=level=>planScatter({type:'sala',width:4,length:8},{seed:4,level}).length;
assert.ok(sala('light')>=4&&sala('light')<sala('medium')&&sala('medium')<sala('heavy'),`levels increase: ${sala('light')}, ${sala('medium')}, ${sala('heavy')}`);

const levels={},lights={};
for(let i=0;i<4000;i++){
  const level=scatterLevel(i,'sala');levels[level]=(levels[level]??0)+1;
  const name=roomLighting(i+5).name;lights[name]=(lights[name]??0)+1;
}
assert.ok(levels.none/4000>0.06&&levels.none/4000<0.14,'about one room in ten is left without scatter');
assert.equal(scatterLevel(7,'sala','heavy'),'heavy');
const dark=['darkDay','night','deepNight','dusk','blueHour','red','violet'].reduce((sum,name)=>sum+(lights[name]??0),0)/4000;
assert.ok(lights.blueHour>100,'blue-indigo rooms occur');
assert.ok(dark<0.22,`dark profiles stay under 22% of rooms; measured ${(dark*100).toFixed(1)}%`);
console.log(`PASS ${cases} scatter plans, ${placed} objects; sala 4×8 light/medium/heavy = ${sala('light')}/${sala('medium')}/${sala('heavy')}`);
console.log('scatter levels per 4000 rooms',levels);
console.log(`lighting per 4000 rooms (dark share ${(dark*100).toFixed(1)}%)`,lights);
