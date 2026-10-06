// Usage: node --experimental-default-type=module scripts/check_table_sizes.mjs
// Checks resized tables: the room and every neighbour stay clear, arrangements are unchanged,
// grouped, stacked, and inverted tables keep the standard size, and the sizes do vary.
import assert from 'node:assert/strict';
import {LAYOUT_IDS,FOOTPRINT_HALF,generateFurnitureLayout,checkFurnitureLayout,furnitureFootprint} from '../furniture-layouts.js';
import {tableSupport} from '../object-supports.js';

const seen={tables:0,resized:0,lower:0,taller:0,shorter:0,longer:0,narrower:0,wider:0};let rooms=0;
for(const layout of LAYOUT_IDS)for(const width of [4,6,8,10,12,24])for(const length of [6,8,10,12,20])for(let seed=0;seed<40;seed++){
  const placed=generateFurnitureLayout({width,length,seed,layout,finishCount:10});
  assert.deepEqual(placed,generateFurnitureLayout({width,length,seed,layout,finishCount:10}),'same seed, same sizes');
  const check=checkFurnitureLayout(placed,{width,length});
  assert.ok(check.ok,`${layout} ${width}x${length} seed ${seed}: ${JSON.stringify(check.failures[0])}`);
  // Sizes are added after the arrangement is fixed: without them the placements are what they were.
  const plain=generateFurnitureLayout({width,length,seed,layout,finishCount:10,filter:true}).map(({scale,...rest})=>rest);
  assert.deepEqual(placed.map(({scale,...rest})=>rest),plain);
  const boxes=placed.map(furnitureFootprint);
  placed.forEach((p,i)=>{
    if(p.role!=='table')return assert.equal(p.scale,undefined,'only tables are resized');
    seen.tables++;
    if(!p.scale){const s=tableSupport(p);if(s)assert.ok(Math.abs(s.maxX-(FOOTPRINT_HALF[p.kind].x-0.025))<1e-9);return;}
    const k=p.scale;seen.resized++;
    assert.ok(p.stack===null&&!p.inverted,'stacked and inverted tables keep the standard size');
    assert.ok(k.x>=0.85&&k.x<=1.15&&k.y>=0.55&&k.y<=1.08&&k.z>=0.65&&k.z<=1.7,JSON.stringify(k));
    for(const [j,o] of boxes.entries())if(j!==i&&placed[j].role==='table'){
      const gap=Math.max(boxes[i].minX-o.maxX,o.minX-boxes[i].maxX,boxes[i].minZ-o.maxZ,o.minZ-boxes[i].maxZ);
      assert.ok(gap>=0.019,'a resized table does not touch another table');
    }
    const support=tableSupport(p),half=FOOTPRINT_HALF[p.kind];
    assert.ok(Math.abs(support.maxX-(half.x*k.x-0.025))<1e-9&&Math.abs(support.maxZ-(half.z*k.z-0.025))<1e-9,'the support top follows the table');
    if(k.y<1)seen.lower++;if(k.y>1)seen.taller++;if(k.z<1)seen.shorter++;if(k.z>1)seen.longer++;if(k.x<1)seen.narrower++;if(k.x>1)seen.wider++;
  });
  rooms++;
}
for(const [name,n] of Object.entries(seen))assert.ok(n>0,`${name}: ${n}`);
assert.ok(seen.shorter>100&&seen.longer>100&&seen.resized/seen.tables>0.05,JSON.stringify(seen));
console.log(`PASS ${rooms} arrangements, ${seen.tables} tables, ${seen.resized} resized`,JSON.stringify(seen));
