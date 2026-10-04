import assert from 'node:assert/strict';
import {tableSupport,reserveSupport,surfaceSupport} from '../object-supports.js';

const ordinary={role:'table',kind:'monoblocTable',inverted:false,stack:null};
assert.equal(tableSupport({...ordinary,inverted:true}),null);
assert.equal(tableSupport({...ordinary,stack:1}),null);
assert.equal(tableSupport({...ordinary,role:'chair'}),null);
for(const kind of ['monoblocTable','woodTable']){
  const support=tableSupport({...ordinary,kind});
  const tv={minX:-0.12,maxX:0.12,minZ:-0.37,maxZ:0.37};
  assert.equal(reserveSupport(support,{...tv,minZ:-0.6}),false,'overhanging TV');
  assert.equal(support.reservations.length,0,'failed fit leaves support free');
  assert.equal(reserveSupport(support,tv),true,'32-inch TV across table length');
  assert.equal(reserveSupport(support,{minX:-0.05,maxX:0.05,minZ:-0.05,maxZ:0.05}),false,'clutter under TV');
  assert.equal(reserveSupport(support,{minX:0.16,maxX:0.26,minZ:-0.1,maxZ:0.1}),true,'free space beside TV');
  assert.equal(reserveSupport(support,{minX:-0.37,maxX:0.37,minZ:-0.12,maxZ:0.12}),false,'TV across short table width');
}
const shelf=surfaceSupport({minX:-0.425,maxX:0.425,minZ:0,maxZ:0.22,height:0.9175});
assert.equal(reserveSupport(shelf,{minX:-0.1,maxX:0.1,minZ:0.03,maxZ:0.19}),true);
assert.equal(reserveSupport(shelf,{minX:0.2,maxX:0.3,minZ:0.01,maxZ:0.23}),false,'overhanging shelf item');
assert.equal(reserveSupport(shelf,{minX:-0.02,maxX:0.02,minZ:0.08,maxZ:0.13}),false,'occupied shelf');
console.log('PASS table/shelf bounds, upright eligibility, occupied areas, and remaining support area');
