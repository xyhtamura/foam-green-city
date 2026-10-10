import assert from 'node:assert/strict';
import {wireRunPlan,ceilingWirePlan,SAG} from '../wire-runs.js';
const drops=[];
for(let seed=0;seed<1000;seed++)for(const span of [1.2,1.8,3.6]){
  const plan=wireRunPlan({span,anchorY:2.1,seed});
  assert.deepEqual(plan,wireRunPlan({span,anchorY:2.1,seed}));
  assert.ok(Math.abs(plan[0].left[0]+span/2)<1e-12);
  assert.ok(Math.abs(plan.at(-1).right[0]-span/2)<1e-12);
  for(let i=0;i<plan.length;i++){
    const p=plan[i];
    assert.ok(Math.abs(p.y+(p.kind==='sag'?p.height/2:0)-2.1)<1e-12);
    if(i)assert.deepEqual(p.left,plan[i-1].right);
    if(p.kind==='sag'){assert.ok(p.height>=SAG.least&&p.height<=SAG.most,'a sag stays inside its range');if(span===1.8)drops.push(p.height);}
  }
}
// Ceiling runs: three rooms in ten, either side, from the wall face to the light, never in a wide room.
let runs=0,left=0;
for(let index=0;index<20000;index++){
  const run=ceilingWirePlan({index,width:6,fixtureEnd:0.63});
  assert.deepEqual(run,ceilingWirePlan({index,width:6,fixtureEnd:0.63}));
  assert.equal(ceilingWirePlan({index,width:12}),null);
  if(!run)continue;
  runs++;if(run.side<0)left++;
  assert.ok(Math.abs(Math.abs(run.x)+run.span/2-2.9)<1e-12&&Math.abs(Math.abs(run.x)-run.span/2-0.63)<1e-12,'a ceiling run reaches from the light to the wall face');
}
assert.ok(Math.abs(runs/20000-0.3)<0.02&&Math.abs(left/runs-0.5)<0.03,'three rooms in ten, on either side');
console.log(`Ceiling runs: ${runs} of 20,000 rooms, ${left} on the left`);
drops.sort((a,b)=>a-b);
const share=limit=>drops.filter(d=>d<limit).length/drops.length;
assert.ok(share(0.15)>0.3&&share(0.15)<0.5&&share(0.35)<0.9,'shallow sags are common and deep ones occur');
console.log(`Sag drops: ${drops[0].toFixed(2)} to ${drops.at(-1).toFixed(2)} m, median ${drops[drops.length>>1].toFixed(2)} m, ${Math.round(share(0.15)*100)}% under 0.15 m, ${Math.round((1-share(0.35))*100)}% over 0.35 m`);
console.log('PASS 3,000 wire plans: chained endpoints, image anchors, spans, sag range, and determinism');
