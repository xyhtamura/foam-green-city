import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {RAW_OBJECTS} from '../raw-object-assets.js';
assert.equal(new Set(RAW_OBJECTS.map(p=>p.id)).size,RAW_OBJECTS.length);
for(const p of RAW_OBJECTS){
  const data=await readFile(new URL('../'+p.file,import.meta.url));
  assert.equal(data.subarray(1,4).toString(),'PNG',p.file);
  const width=data.readUInt32BE(16),height=data.readUInt32BE(20);
  assert.ok(Math.abs(p.aspect-height/width)<1e-12,p.id+' aspect');
  assert.ok(p.width>0&&['floor','table','flat'].includes(p.mode));
  if(p.mode!=='floor'){
    assert.ok(p.width<=0.46,p.id+' table width');
    assert.ok(p.width*p.aspect<=0.45,p.id+' table height/depth');
  }
}
console.log(`PASS ${RAW_OBJECTS.length} PNG paths, image aspects, unique IDs, and tabletop sizes`);
