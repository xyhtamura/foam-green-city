import assert from 'node:assert/strict';
import {spatialFrame,spatialPoint,TWIST_LENGTH,SPATIAL_PROFILES,INVERSION,inversionRoll,VARIED,variedAngles,routeTable,setVariedSeed} from '../spatial-route.js';
import {createRoomSequence} from '../room-sequences.js';
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const sequence=createRoomSequence({sequence:'twist'});
for(const profile of SPATIAL_PROFILES)for(let d=0;d<=720;d+=0.125){
  const f=spatialFrame(d,profile);
  for(const v of [f.right,f.up,f.back])assert(Math.abs(dot(v,v)-1)<1e-10);
  assert(Math.abs(dot(f.right,f.up))<1e-10);
  assert(Math.abs(dot(f.back,f.up))<1e-10);
  const eye=spatialPoint(0,1.6,-d,profile),floor=spatialPoint(0,0,-d,profile);
  assert(Math.abs(distance(eye,floor)-1.6)<1e-10);
  assert(distance(spatialPoint(0,0,-d-0.001,profile),floor)<0.0011);
  const before=spatialFrame(d+0.001,profile);
  assert(distance(f.up,before.up)<0.00025,'roll stays under 0.25 rad per metre');
}
assert(Math.abs(spatialFrame(TWIST_LENGTH).up[1]+1)<1e-10);
for(let i=0;i<60;i++){
  const a=sequence.room(i),b=sequence.room(i+1);
  assert.equal(a.startZ-a.length,b.startZ);
  assert(a.length>=6&&a.length<=12);assert([4,6].includes(a.width));assert.equal(a.rise,0);
  assert(distance(spatialPoint(0,0,a.startZ-a.length),spatialPoint(0,0,b.startZ))<1e-10);
}
// Inversions: half a turn per stretch, continuous, never two at once, also behind the start.
const starts=[];
for(let d=-760;d<=7600;d+=0.25){
  const a=inversionRoll(d),b=inversionRoll(d+0.25);
  assert(b>=a-1e-12&&b-a<0.05,'inversion roll is monotonic and continuous');
  if(b>a&&!(inversionRoll(d-0.25)<a))starts.push(d);
}
for(let k=-4;k<40;k++)assert(Math.abs(inversionRoll((k+1)*INVERSION.period)-inversionRoll(k*INVERSION.period)-Math.PI)<1e-9,'one half-turn per stretch');
const gaps=starts.slice(1).map((d,i)=>d-starts[i]);
assert(new Set(gaps.map(g=>Math.round(g))).size>=2,'inversions are unevenly spaced');
assert(Math.min(...gaps)>=INVERSION.length,'inversions do not overlap');
console.log(`Inversions: first at ${starts.find(d=>d>=0)} m, spacing ${Math.min(...gaps)}–${Math.max(...gaps)} m`);
// The varied route, over 12 km on the default seed and on two others.
const report=[];
for(const seed of [20261008,1,77]){
  setVariedSeed(seed);
  const span=12000,centres=[];let tightest=Infinity,nearest=Infinity,fastest=0;
  const rolls={hold:0,left:0,right:0,half:0},bends={none:0,yawLeft:0,yawRight:0,up:0,down:0};
  for(let d=0;d<=span;d+=1)centres.push(spatialPoint(0,0,-d,'varied'));
  for(let i=1;i<centres.length-1;i++){
    // Radius of curvature from three centres a metre apart.
    const a=distance(centres[i-1],centres[i]),b=distance(centres[i],centres[i+1]),c=distance(centres[i-1],centres[i+1]);
    assert(Math.abs(a-1)<1e-3,'the centre line is measured in metres of travel');
    const s=(a+b+c)/2,area=Math.sqrt(Math.max(0,s*(s-a)*(s-b)*(s-c)));
    if(area>1e-9)tightest=Math.min(tightest,a*b*c/(4*area));
    assert(centres[i+1][2]<centres[i][2],'the route always makes headway along -z');
  }
  // No stretch of route comes near another that the walk could hold at the same time.
  for(let i=0;i<centres.length;i+=2)for(let j=i+60;j<=Math.min(centres.length-1,i+400);j+=2)nearest=Math.min(nearest,distance(centres[i],centres[j]));
  for(let d=0;d<span;d+=0.25){
    const [roll,yaw,pitch]=variedAngles(d),next=variedAngles(d+0.25);
    assert(Math.abs(yaw)<=VARIED.yawLimit+1e-9&&Math.abs(pitch)<=VARIED.pitchLimit+1e-9,'heading stays inside its limits');
    fastest=Math.max(fastest,Math.abs(next[0]-roll)/0.25);
  }
  for(let k=0;k<span/VARIED.rollSection;k++){
    const by=variedAngles((k+1)*VARIED.rollSection)[0]-variedAngles(k*VARIED.rollSection)[0];
    rolls[Math.abs(by)<1e-9?'hold':Math.abs(Math.abs(by)-Math.PI)<1e-9?'half':by>0?'left':'right']++;
  }
  for(let k=0;k<span/VARIED.bendSection;k++){
    const a=variedAngles(k*VARIED.bendSection),b=variedAngles((k+1)*VARIED.bendSection),yaw=b[1]-a[1],pitch=b[2]-a[2];
    bends[yaw>1e-9?'yawRight':yaw<-1e-9?'yawLeft':pitch>1e-9?'up':pitch<-1e-9?'down':'none']++;
  }
  assert(tightest>=32,`radius of curvature stays at 32 m or more, found ${tightest}`);
  assert(nearest>=40,`stretches 60 to 400 m apart stay 40 m clear, found ${nearest}`);
  assert(fastest<0.2,'roll stays under 0.2 rad per metre');
  for(const [name,count] of [...Object.entries(rolls),...Object.entries(bends)])assert(count>=8,`${name} occurs, found ${count}`);
  // The ring the shader reads holds the same samples the camera reads.
  for(const d of [0,300,5000,11000]){
    routeTable.ensure(d);
    for(const at of [d-300,d,d+0.5,d+300]){
      const column=Math.round(at/VARIED.step)&(VARIED.ring-1),centre=spatialPoint(0,0,-at,'varied');
      for(let n=0;n<3;n++)assert(Math.abs(routeTable.data[column*4+n]-centre[n])<1e-6);
      assert(Math.abs(routeTable.data[column*4+3]-spatialFrame(at,'varied').roll)<1e-6);
    }
  }
  report.push(`seed ${seed}: tightest radius ${tightest.toFixed(1)} m, nearest approach ${nearest.toFixed(1)} m, roll up to ${fastest.toFixed(3)} rad/m, roll sections ${JSON.stringify(rolls)}, bend sections ${JSON.stringify(bends)}`);
}
setVariedSeed(20261008);
console.log(['Varied route over 12 km:',...report].join('\n'));
console.log('Passed 34,566 spatial frames across six profiles, eye-height and continuity checks, 60 room joins, and the original half-turn.');
