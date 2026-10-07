// Continuous route profiles; camera and GPU geometry share the same local frame.
export const RADIUS=40;
export const TWIST_LENGTH=72;
export const SPATIAL_PROFILES=['twist','reverse','unwind','sway','mixed','varied'];
// The mixed route also turns fully over now and then: one half-turn in each 190 m stretch,
// spread over 32 m, at a position that differs from stretch to stretch. The GLSL below repeats
// this arithmetic exactly; it uses only small whole numbers so both sides agree.
export const INVERSION={period:190,length:32};
export function inversionRoll(d){
  const k=Math.floor(d/INVERSION.period),t=d-k*INVERSION.period,span=INVERSION.period-INVERSION.length;
  const start=(k*71+97)-span*Math.floor((k*71+97)/span),u=Math.max(0,Math.min(1,(t-start)/INVERSION.length));
  return Math.PI*(k+u*u*(3-2*u));
}
// The varied route is drawn section by section rather than written as one formula. Roll and bend
// keep separate sections of different lengths, so their combinations do not repeat together.
//   roll: each 48 m section holds, or turns a quarter, a half, or an eighth turn, either way.
//   bend: each 64 m section keeps its heading, or turns it left or right, or tips it up or down.
// Heading is a yaw and a pitch measured against the world, each kept inside a limit, so the route
// always makes headway along -z and cannot come back across itself. The eased turns keep the
// radius of curvature above 32 m; a room 24 m wide with side rooms reaches 28 m from the centre.
export const VARIED={step:0.5,ring:2048,margin:768,rollSection:48,rollEase:30,bendSection:64,bendEase:58,yawLimit:1.3,pitchLimit:1.0};
let variedSeed=20261008;
const ROLL_DRAWS=[[0.26,0],[0.40,0.5],[0.54,-0.5],[0.68,1],[0.82,-1],[0.91,0.25],[1,-0.25]];
const drawn=(n,salt)=>{
  let h=Math.imul(n+1,0x9E3779B1)^Math.imul(salt*8191+variedSeed,0x85EBCA6B);
  h=Math.imul(h^(h>>>15),0x2C1B3C6D);h=Math.imul(h^(h>>>12),0x297A2D39);
  return ((h^(h>>>15))>>>0)/4294967296;
};
const eased=u=>{const c=Math.max(0,Math.min(1,u));return c*c*(3-2*c);};
// Values at the start of each section, and the change the section makes.
let rollAt=[0],rollBy=[],yawAt=[0],pitchAt=[0],yawBy=[],pitchBy=[];
function turnBy(value,limit,least,k,salt){
  let by=(least+least*drawn(k,salt))*(drawn(k,salt+1)<0.5?-1:1);
  // Away from the middle, a turn more often leads back toward it.
  if(Math.abs(value)>0.3&&drawn(k,salt+2)<0.7)by=-Math.sign(value)*Math.abs(by);
  return Math.abs(value+by)>limit?-by:by;
}
function rollSection(k){
  while(rollBy.length<=k){
    const n=rollBy.length,r=drawn(n,1),by=Math.PI*ROLL_DRAWS.find(([edge])=>r<edge)[1];
    rollBy.push(by);rollAt.push(rollAt[n]+by);
  }
}
function bendSection(k){
  while(yawBy.length<=k){
    const n=yawBy.length,r=drawn(n,2);
    const yaw=r>=0.3&&r<0.65?turnBy(yawAt[n],VARIED.yawLimit,0.6,n,3):0;
    const pitch=r>=0.65?turnBy(pitchAt[n],VARIED.pitchLimit,0.5,n,6):0;
    yawBy.push(yaw);pitchBy.push(pitch);yawAt.push(yawAt[n]+yaw);pitchAt.push(pitchAt[n]+pitch);
  }
}
// Roll, yaw, and pitch at a distance. Behind the start the route is straight and level.
export function variedAngles(d){
  if(d<=0)return [0,0,0];
  const kr=Math.floor(d/VARIED.rollSection),kb=Math.floor(d/VARIED.bendSection);
  rollSection(kr);bendSection(kb);
  const ur=eased((d-kr*VARIED.rollSection-9)/VARIED.rollEase),ub=eased((d-kb*VARIED.bendSection-3)/VARIED.bendEase);
  return [rollAt[kr]+rollBy[kr]*ur,yawAt[kb]+yawBy[kb]*ub,pitchAt[kb]+pitchBy[kb]*ub];
}
const heading=(yaw,pitch)=>[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)];
// The centre line has no formula, so it is summed once at half-metre samples and kept. Each sample
// is eight numbers: centre x, y, z and roll, then yaw and pitch and two spares. The camera reads
// these samples here and the shader reads the same numbers from a texture, each interpolating in
// a straight line between neighbours, so the two agree without repeating any arithmetic.
let samples=new Float32Array(8*4096),sampled=0;
const reached=[0,0,0];
function sampleTo(i){
  if((i+1)*8>samples.length){const grown=new Float32Array(Math.max(samples.length*2,(i+1)*8));grown.set(samples);samples=grown;}
  for(;sampled<=i;sampled++){
    const d=sampled*VARIED.step,[roll,yaw,pitch]=variedAngles(d);
    samples.set([reached[0],reached[1],reached[2],roll,yaw,pitch,0,0],sampled*8);
    // Simpson's rule over the step to the next sample.
    const m=variedAngles(d+VARIED.step/2),e=variedAngles(d+VARIED.step);
    const a=heading(yaw,pitch),b=heading(m[1],m[2]),c=heading(e[1],e[2]);
    for(let n=0;n<3;n++)reached[n]+=VARIED.step/6*(a[n]+4*b[n]+c[n]);
  }
}
function sampleInto(i,out,at){
  if(i<0){out.fill(0,at,at+8);out[at+2]=-i*VARIED.step;return;}
  sampleTo(i);for(let n=0;n<8;n++)out[at+n]=samples[i*8+n];
}
const pair=new Float32Array(16);
function variedSample(d){
  const s=d/VARIED.step,i=Math.floor(s),f=s-i;
  sampleInto(i,pair,0);sampleInto(i+1,pair,8);
  return Array.from({length:6},(_,n)=>pair[n]+(pair[n+8]-pair[n])*f);
}
// The texture's contents: two rows of four numbers per sample, written round a ring so that sample
// i sits in column i mod ring. `ensure` rewrites the ring about a distance when that distance has
// come within `margin` samples of either end, and counts up `version` when it does.
export const routeTable={width:VARIED.ring,height:2,data:new Float32Array(VARIED.ring*8),version:0,from:null,
  ensure(d){
    const i=Math.floor(d/VARIED.step),{ring,margin}=VARIED;
    if(this.from!==null&&i>=this.from+margin&&i<this.from+ring-margin)return false;
    this.from=i-ring/2;
    for(let j=this.from;j<this.from+ring;j++){
      const column=j&(ring-1);sampleInto(j,pair,0);
      this.data.set(pair.subarray(0,4),column*4);this.data.set(pair.subarray(4,8),(ring+column)*4);
    }
    this.version++;return true;
  }};
// Call before anything reads the route. A different seed is a different route.
export function setVariedSeed(seed){
  variedSeed=seed|0;rollAt=[0];rollBy=[];yawAt=[0];pitchAt=[0];yawBy=[];pitchBy=[];sampled=0;reached.fill(0);routeTable.from=null;
}
const normalize=v=>{const n=Math.hypot(...v);return v.map(x=>x/n);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function spatialFrame(distance,profile='twist'){
  const d=distance,a=d/RADIUS,c=Math.cos(a),s=Math.sin(a);
  let center=[RADIUS*(1-c),0,-RADIUS*s],forward=[s,0,-c],b=d*Math.PI/TWIST_LENGTH;
  if(profile==='reverse')b=-b;
  if(profile==='unwind')b=1.8*Math.sin(d/44);
  if(profile==='mixed'){
    b=d*Math.PI/96+0.55*Math.sin(d/36)+inversionRoll(d);
    center[1]=5*(1-Math.cos(d/32));forward[1]=5/32*Math.sin(d/32);
  }
  if(profile==='sway'){
    center=[14*(1-Math.cos(d/36)),3*Math.sin(d/48),-d];
    forward=[14/36*Math.sin(d/36),3/48*Math.cos(d/48),-1];
    b=1.5*Math.sin(d/52);
  }
  if(profile==='varied'){
    const v=variedSample(d);
    center=[v[0],v[1],v[2]];b=v[3];forward=heading(v[4],v[5]);
  }
  const right0=normalize(cross(forward,[0,1,0])),back=normalize(forward.map(x=>-x)),up0=cross(back,right0),cb=Math.cos(b),sb=Math.sin(b);
  return {center,right:right0.map((x,i)=>x*cb+up0[i]*sb),up:up0.map((x,i)=>x*cb-right0[i]*sb),back,roll:b};
}
export function spatialPoint(x,y,z,profile='twist'){
  const f=spatialFrame(-z,profile);
  return f.center.map((v,i)=>v+x*f.right[i]+y*f.up[i]);
}
export const SPATIAL_GLSL=`
#if SPATIAL_MODE==5
uniform highp sampler2D uRoute;
vec4 routeRow(float d,int row){
  float s=d*${(1/VARIED.step).toFixed(1)},i=floor(s);int n=int(i);
  return mix(texelFetch(uRoute,ivec2(n&${VARIED.ring-1},row),0),texelFetch(uRoute,ivec2((n+1)&${VARIED.ring-1},row),0),s-i);
}
vec3 spatialCenter(float d){return routeRow(d,0).xyz;}
mat3 spatialBasis(float d){
  float b=routeRow(d,0).w;vec2 turn=routeRow(d,1).xy;
  vec3 forward=vec3(sin(turn.x)*cos(turn.y),sin(turn.y),-cos(turn.x)*cos(turn.y));
  vec3 right=normalize(cross(forward,vec3(0.0,1.0,0.0))),back=normalize(-forward),up=cross(back,right);
  return mat3(right*cos(b)+up*sin(b),up*cos(b)-right*sin(b),back);
}
#else
vec3 spatialCenter(float d){
  float a=d/40.0;
  if(SPATIAL_MODE==3)return vec3(14.0*(1.0-cos(d/36.0)),3.0*sin(d/48.0),-d);
  return vec3(40.0*(1.0-cos(a)),SPATIAL_MODE==4?5.0*(1.0-cos(d/32.0)):0.0,-40.0*sin(a));
}
float inversionRoll(float d){
  float k=floor(d/190.0),t=d-k*190.0,start=mod(k*71.0+97.0,158.0);
  return 3.14159265359*(k+smoothstep(start,start+32.0,t));
}
mat3 spatialBasis(float d){
  float a=d/40.0,b=d*3.14159265359/72.0;
  vec3 forward=vec3(sin(a),0.0,-cos(a));
  if(SPATIAL_MODE==1)b=-b;
  if(SPATIAL_MODE==2)b=1.8*sin(d/44.0);
  if(SPATIAL_MODE==3){forward=vec3(14.0/36.0*sin(d/36.0),3.0/48.0*cos(d/48.0),-1.0);b=1.5*sin(d/52.0);}
  if(SPATIAL_MODE==4){forward.y=5.0/32.0*sin(d/32.0);b=d*3.14159265359/96.0+0.55*sin(d/36.0)+inversionRoll(d);}
  vec3 right=normalize(cross(forward,vec3(0.0,1.0,0.0))),back=normalize(-forward),up=cross(back,right);
  return mat3(right*cos(b)+up*sin(b),up*cos(b)-right*sin(b),back);
}
#endif
vec3 spatialPoint(vec3 p){
  float d=-p.z;
  return spatialCenter(d)+spatialBasis(d)*vec3(p.xy,0.0);
}`;
