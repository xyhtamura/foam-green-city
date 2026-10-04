import assert from 'node:assert/strict';
import {tableSupport,reserveSupport,surfaceSupport,seatSupport} from '../object-supports.js';

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

const seated={role:'seat',kind:'monoblocChair',inverted:false,stack:null,y:0};
for(const p of [{...seated,stack:1},{...seated,inverted:true},{...seated,y:0.759},{...seated,kind:'unknownChair'},{...seated,role:'table'}])assert.equal(seatSupport(p),null,'ineligible seat');
const seat=seatSupport(seated);
assert.equal(reserveSupport(seat,{minX:-0.12,maxX:0.12,minZ:-0.09,maxZ:0.09}),true,'small seat item');
assert.equal(reserveSupport(seat,{minX:-0.1,maxX:0.1,minZ:-0.08,maxZ:0.08}),false,'occupied seat');
assert.equal(reserveSupport(seat,{minX:-0.25,maxX:0.25,minZ:-0.1,maxZ:0.1}),false,'armrest overhang');
assert.equal(reserveSupport(seat,{minX:-0.1,maxX:0.1,minZ:-0.23,maxZ:-0.17}),false,'backrest intrusion');
console.log('PASS seat eligibility, occupied area, armrest and backrest clearances');
