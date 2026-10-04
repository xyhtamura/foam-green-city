import assert from 'node:assert/strict';
import {wireRunPlan} from '../wire-runs.js';
for(let seed=0;seed<1000;seed++)for(const span of [1.2,1.8,3.6]){
  const plan=wireRunPlan({span,anchorY:2.1,seed});
  assert.deepEqual(plan,wireRunPlan({span,anchorY:2.1,seed}));
  assert.ok(Math.abs(plan[0].left[0]+span/2)<1e-12);
  assert.ok(Math.abs(plan.at(-1).right[0]-span/2)<1e-12);
  for(let i=0;i<plan.length;i++){
    const p=plan[i];
    assert.ok(Math.abs(p.y+(p.kind==='sag'?p.height/2:0)-2.1)<1e-12);
    if(i)assert.deepEqual(p.left,plan[i-1].right);
  }
}
console.log('PASS 3,000 wire plans: chained endpoints, image anchors, spans, and determinism');
