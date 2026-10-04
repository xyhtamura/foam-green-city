// Seeded routes for surface-mounted PVC water pipes in a Foam Green City room.
// Returns plain piece records and imports nothing, so it also runs under Node.
// pipe-parts.js turns the records into Three.js meshes.
//
// Metres. X is centred on the room, Y is up from the floor, and Z runs from 0
// at the entrance to -length at the exit, as in furniture-layouts.js.
// Every direction is a unit vector along one axis, written [x,y,z].

// Water lines: thin pipe, blue unless `material` says otherwise.
export const WATER_STYLE_IDS=['supply','riser','bundle','meander','overhead','loop'];
// Drainage: thick pipe, orange or grey.
export const DRAIN_STYLE_IDS=['stack','drain'];
// New ids are appended, so the seed mixing of the earlier styles does not change.
export const PIPE_STYLE_IDS=[...WATER_STYLE_IDS,...DRAIN_STYLE_IDS];
export const PIPE_MATERIALS=['blue','orange','grey'];

export const PIPE_STYLE_LABELS={
  supply:'Supply line with branches',
  riser:'Risers from floor to ceiling',
  bundle:'Parallel pipes',
  meander:'One pipe changing height',
  overhead:'Pipe crossing the ceiling',
  loop:'Closed loop on a wall',
  stack:'Drain stacks from floor to ceiling',
  drain:'Drain line along the floor',
};

// Outside diameters of the common nominal sizes: 1/2, 3/4, 1, and 1 1/2 inch.
export const PIPE_DIAMETERS=[0.021,0.027,0.034,0.048];
// Drainage sizes: 2, 3, and 4 inch.
export const DRAIN_DIAMETERS=[0.06,0.089,0.114];

export const PIPE_ROOM={
  height:2.58,       // floor to ceiling
  wallFace:0.1,      // from a side-wall centre plane to its surface (assumed)
  gap:0.012,         // between a wall surface and the pipe's skin, at least
  high:2.3,low:0.25, // heights of the two bands that pass above and below windows
  ceilingRun:2.45,   // height of a pipe crossing under the ceiling
  aisleHalf:0.6,     // no pipe enters the centre aisle below `headroom`
  headroom:2.2,
  fanClear:1.6,      // a ceiling crossing stays this far from the room's centre
  stock:3,           // pipe is sold in 3 m lengths, so a coupling every 3 m
  clampEvery:0.9,
};

// Fitting proportions, all multiples of the pipe's outside diameter.
// pipe-parts.js builds its meshes from the same numbers.
export function fittingSizes(d){
  return{socketRadius:d*0.65,bend:d*1.1,collar:d*0.9,teeHalf:d*1.5,coupling:d*2.2,cap:d*1.1};
}

const R=PIPE_ROOM;
function mulberry32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;
  let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;
  return((t^t>>>14)>>>0)/4294967296;};}
function mixSeed(seed,...values){
  let h=(Math.floor(Number(seed)||0)^0x51ed270b)|0;
  for(const v of values){h=Math.imul(h^v,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;}
  return h>>>0;
}
const pick=(r,list)=>list[Math.floor(r()*list.length)];
const round=v=>{const n=Math.round(v*1000)/1000;return n===0?0:n;};
const add=(a,b,k=1)=>[a[0]+b[0]*k,a[1]+b[1]*k,a[2]+b[2]*k];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const size=a=>Math.hypot(a[0],a[1],a[2]);
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const rounded=a=>a.map(round);

// ---- a line of pipe becomes pieces ----
// A line is {points, normals, standoffs, start, end, closed, diameter}.
// `normals[i]` is the direction away from the surface that segment i is fixed
// to, or null. `start` and `end` are 'surface', 'tee', 'cap', or 'faucet'.
function piecesFromLine(line,run,out){
  const{points,normals,standoffs,closed=false,diameter:d}=line,S=fittingSizes(d),count=closed?points.length:points.length-1;
  const dirs=[];
  for(let i=0;i<count;i++){const v=sub(points[(i+1)%points.length],points[i]),l=size(v);dirs.push({d:v.map(c=>c/l),length:l});}
  const base={run,diameter:d};
  for(let i=0;i<count;i++){
    const{d:dir,length}=dirs[i],first=!closed&&i===0,last=!closed&&i===count-1;
    const insetA=first?0:S.bend,insetB=last?0:S.bend,from=add(points[i],dir,insetA),pipeLength=length-insetA-insetB;
    out.push({kind:'pipe',...base,position:rounded(from),axis:dir,length:round(pipeLength)});
    for(let at=R.stock;at<pipeLength-0.2;at+=R.stock)
      out.push({kind:'coupling',...base,position:rounded(add(from,dir,at)),axis:dir});
    if(normals[i]&&pipeLength>=0.3){
      const n=Math.ceil(pipeLength/R.clampEvery);
      for(let k=0;k<n;k++)out.push({kind:'clamp',...base,position:rounded(add(from,dir,(k+0.5)*pipeLength/n)),axis:dir,normal:normals[i],standoff:round(standoffs[i])});
    }
    if(!last){const next=dirs[(i+1)%count].d;
      out.push({kind:'elbow',...base,position:rounded(points[(i+1)%points.length]),a:dir.map(c=>c===0?0:-c),b:next});}
  }
  if(closed)return;
  const lastDir=dirs[count-1].d,tip=points[points.length-1];
  if(line.end==='cap')out.push({kind:'cap',...base,position:rounded(tip),axis:lastDir});
  if(line.end==='faucet')out.push({kind:'faucet',...base,position:rounded(tip),axis:lastDir,normal:normals[count-1]});
  if(line.start==='cap')out.push({kind:'cap',...base,position:rounded(points[0]),axis:dirs[0].d.map(c=>c===0?0:-c)});
}

// ---- styles ----
// Each style receives c, with c.wall(side,d) giving a function from wall
// coordinates (u along Z, v up) to room coordinates.

// A main along one wall for the whole room, in the high or low band, with one
// to three branches ending in a faucet or a cap.
function supply(c){
  const{r,L}=c,side=c.side(),d=c.diameter([0.027,0.034]),high=r()<0.6,v=high?R.high:R.low,W=c.wall(side,d),n=c.normal(side);
  c.line({points:[W(0,v),W(-L,v)],normals:[n],diameter:d,start:'surface',end:'surface'});
  const taken=[],branches=1+Math.floor(r()*3),branchD=r()<0.6?0.021:d;
  for(let i=0;i<branches;i++){
    const u=c.freeU(side,0.8,L-0.8,0.15,taken,0.7);
    if(u===null)continue;
    taken.push(u);
    const end=high?0.5+r()*0.6:0.7+r()*0.5,dir=high?-1:1;
    c.tee(W(u,v),[0,0,-1],[0,dir,0],d);
    c.line({points:[W(u,v),W(u,end)],normals:[n],diameter:branchD,standoff:c.standoff(d),start:'tee',end:r()<0.7?'faucet':'cap'});
  }
}

// One to three pipes from floor to ceiling, most with a sideways step.
function riser(c){
  const{r,L}=c,taken=[],count=1+Math.floor(r()*3);
  for(let i=0;i<count;i++){
    const side=c.side(),d=c.diameter([0.027,0.034,0.048]),W=c.wall(side,d),n=c.normal(side);
    const step=r()<0.7?(r()<0.5?-1:1)*(0.3+r()*0.9):0,reach=Math.abs(step)+0.15;
    const u=c.freeU(side,0.6+reach,L-0.6-reach,reach,taken,1.4+reach);
    if(u===null)continue;
    taken.push(u);
    const v=0.5+r()*1.5;
    const points=step?[W(u,0),W(u,v),W(u+step,v),W(u+step,R.height)]:[W(u,0),W(u,R.height)];
    c.line({points,normals:points.slice(1).map(()=>n),diameter:d,start:'surface',end:'surface'});
  }
}

// Two to five pipes side by side. They run the whole room, or come in from one
// end, turn together, and go into the floor.
function bundle(c){
  const{r,L}=c,side=c.side(),count=2+Math.floor(r()*4),spacing=0.075,turns=r()<0.6,fromExit=r()<0.5,n=c.normal(side);
  const reach=count*spacing,turnAt=turns?c.freeU(side,1.5,L-1.5,reach,[],0):null;
  for(let k=0;k<count;k++){
    const d=pick(r,[0.021,0.027,0.034]),W=c.wall(side,0.034),v=R.high-k*spacing;
    const startU=fromExit?-L:0,endU=fromExit?0:-L;
    const points=turnAt===null?[W(startU,v),W(endU,v)]:[W(startU,v),W(turnAt+(fromExit?-1:1)*k*spacing,v),W(turnAt+(fromExit?-1:1)*k*spacing,0)];
    c.line({points,normals:points.slice(1).map(()=>n),diameter:d,standoff:c.standoff(0.034),start:'surface',end:'surface'});
  }
}

// One pipe that crosses the room along a wall and changes height on the way
// for no visible reason. It uses the middle heights only where no window is.
function meander(c){
  const{r,L}=c,side=c.side(),d=c.diameter([0.027,0.034]),W=c.wall(side,d),n=c.normal(side),levels=[R.low,0.8,1.4,R.high];
  const allowed=(from,to)=>c.blocked(side,to,from)?[R.low,R.high]:levels;
  let u=0,next=-(1+r()*2.5),v=pick(r,allowed(0,next));
  const points=[W(0,v)];
  while(next>-L){
    if(-L-next>-0.9)break;
    // A height change needs a vertical pipe, which must miss the windows.
    let after=next-(1+r()*2.5);if(after<-L+0.9)after=-L;
    const options=allowed(next,after).filter(level=>level!==v);
    if(!c.blocked(side,next-0.15,next+0.15)&&options.length){
      const to=pick(r,options);points.push(W(next,v),W(next,to));v=to;
    }else if(!allowed(next,after).includes(v)){
      // No room to change height here, so stay in a band that clears the window.
      break;
    }
    u=next;next=after;
  }
  points.push(W(-L,v));
  c.line({points,normals:points.slice(1).map(()=>n),diameter:d,start:'surface',end:'surface'});
}

// A pipe that climbs one wall, crosses the room under the ceiling, and comes
// down the other wall to the floor, a faucet, or a cap.
function overhead(c){
  const{r,L}=c,side=c.side(),d=c.diameter([0.027,0.034,0.048]),A=c.wall(side,d),B=c.wall(-side,d);
  let u=null;
  for(let i=0;i<40&&u===null;i++){
    const t=-(0.8+r()*(L-1.6));
    if(Math.abs(t+L/2)>=R.fanClear&&!c.blocked(side,t-0.15,t+0.15)&&!c.blocked(-side,t-0.15,t+0.15))u=t;
  }
  if(u===null)return;
  const finish=r(),end=finish<0.4?'surface':finish<0.75?'faucet':'cap',down=end==='surface'?0:end==='faucet'?0.5+r()*0.5:0.9+r()*0.8;
  c.line({points:[A(u,0),A(u,R.ceilingRun),B(u,R.ceilingRun),B(u,down)],
    normals:[c.normal(side),[0,-1,0],c.normal(-side)],standoffs:[c.standoff(d),R.height-R.ceilingRun,c.standoff(d)],diameter:d,start:'surface',end});
}

// A rectangle of pipe on a wall, joined to nothing, sometimes with a capped stub.
function loop(c){
  const{r,L}=c,side=c.side(),d=c.diameter([0.027,0.034]),W=c.wall(side,d),n=c.normal(side);
  const w=0.6+r()*1.6,h=0.4+r()*0.8,v=0.4+r()*(R.high-0.4-h);
  const centre=c.freeU(side,0.6+w/2,L-0.6-w/2,w/2+0.1,[],0);
  if(centre===null)return;
  const a=centre+w/2,b=centre-w/2;
  c.line({points:[W(a,v),W(b,v),W(b,v+h),W(a,v+h)],normals:[n,n,n,n],diameter:d,closed:true});
  if(r()<0.5){
    const at=b+w*(0.3+r()*0.4),up=r()<0.5,stub=Math.min(0.15+r()*0.25,up?R.height-0.1-(v+h):v-0.1);
    c.tee(W(at,up?v+h:v),[0,0,-1],[0,up?1:-1,0],d);
    c.line({points:[W(at,up?v+h:v),W(at,up?v+h+stub:v-stub)],normals:[null],diameter:d,start:'tee',end:'cap'});
  }
}

// ---- drainage styles ----

// One or two thick pipes from floor to ceiling. A stack may have a capped
// cleanout facing the room, and a thinner arm that joins it from the ceiling.
function stack(c){
  const{r,L}=c,taken=[],count=1+Math.floor(r()*2);
  for(let i=0;i<count;i++){
    const side=c.side(),d=c.diameter([0.089,0.114]),W=c.wall(side,d),n=c.normal(side);
    const arm=r()<0.5?(r()<0.5?-1:1)*(0.4+r()*0.6):0,reach=Math.abs(arm)+0.2;
    const cleanout=r()<0.6,cleanoutAt=0.3+r()*0.7,armAt=1.5+r()*0.6;
    const u=c.freeU(side,0.6+reach,L-0.6-reach,reach,taken,1.2+reach);
    if(u===null)continue;
    taken.push(u);
    c.line({points:[W(u,0),W(u,R.height)],normals:[n],diameter:d,start:'surface',end:'surface'});
    if(cleanout){
      const p=W(u,cleanoutAt);
      c.tee(p,[0,1,0],n,d);
      c.line({points:[p,add(p,n,fittingSizes(d).teeHalf+0.03)],normals:[null],diameter:d,start:'tee',end:'cap'});
    }
    if(arm){
      c.tee(W(u,armAt),[0,1,0],[0,0,Math.sign(arm)],d);
      c.line({points:[W(u,armAt),W(u+arm,armAt),W(u+arm,R.height)],normals:[n,n],diameter:0.06,standoff:c.standoff(d),start:'tee',end:'surface'});
    }
  }
}

// A thick pipe along the foot of one wall for the whole room, with one to
// three thinner pipes rising from it. Each ends in a cap at about knee height
// or continues to the ceiling as a vent.
function drain(c){
  const{r,L}=c,side=c.side(),d=c.diameter([0.089,0.114]),W=c.wall(side,d),n=c.normal(side),v=d/2+0.06+r()*0.08;
  c.line({points:[W(0,v),W(-L,v)],normals:[n],diameter:d,start:'surface',end:'surface'});
  const taken=[],count=1+Math.floor(r()*3);
  for(let i=0;i<count;i++){
    const vent=r()<0.35,top=vent?R.height:0.4+r()*0.3,u=c.freeU(side,0.8,L-0.8,0.15,taken,0.8);
    if(u===null)continue;
    taken.push(u);
    c.tee(W(u,v),[0,0,-1],[0,1,0],d);
    c.line({points:[W(u,v),W(u,top)],normals:[n],diameter:0.06,standoff:c.standoff(d),start:'tee',end:vent?'surface':'cap'});
  }
}

const STYLES={supply,riser,bundle,meander,overhead,loop,stack,drain};

// Returns an array of piece records. Every record has kind, run, diameter,
// material, and position. `material` is 'blue', 'orange', or 'grey'. Water
// styles default to blue; drainage styles are seeded orange or grey. Passing
// `material` or `diameter` overrides the default. By kind a record also has:
//   pipe      axis, length      a straight from `position` along `axis`
//   elbow     a, b              the two directions its legs leave the corner in
//   tee       axis, branch      the through direction and the branch direction
//   coupling  axis              a sleeve centred on `position`
//   cap       axis              closes a pipe end; `axis` points out of the pipe
//   clamp     axis, normal, standoff   holds a pipe to a surface `standoff` behind it
//   faucet    axis, normal      at a pipe end; `normal` points into the room
// `avoid` lists stretches of side wall, as {side, from, to} with side -1 or 1
// and from > to in Z, where no vertical pipe, faucet, or mid-height pipe goes.
// Pass the window tiles there. `side` fixes the wall; otherwise it is seeded.
export function generatePipeRun({width,length=12,seed=0,style,side,diameter,material,avoid=[]}){
  const index=PIPE_STYLE_IDS.indexOf(style);
  if(index<0)throw new Error(`Unknown pipe style "${style}". Use one of: ${PIPE_STYLE_IDS.join(', ')}.`);
  const r=mulberry32(mixSeed(seed,index,Math.round(width*1000),Math.round(length*1000))),out=[],half=width/2;
  let runs=0;
  const c={r,L:length,half,
    side:()=>{const seeded=r()<0.5?-1:1;return side===1||side===-1?side:seeded;},
    diameter:list=>{const seeded=pick(r,list);return diameter??seeded;},
    normal:s=>[s<0?1:-1,0,0],
    // A fitting socket is wider than its pipe, so a thick pipe stands further off.
    standoff:d=>Math.max(R.gap,0.16*d)+d/2,
    wall:(s,d)=>(u,v)=>[s*(half-R.wallFace-c.standoff(d)),v,u],
    blocked:(s,from,to)=>avoid.some(a=>a.side===s&&Math.min(from,to)<a.from&&Math.max(from,to)>a.to),
    // A seeded Z between `near` and `far` metres from the entrance, clear of the
    // avoided stretches by `reach` and of earlier positions by `apart`.
    freeU(s,near,far,reach,taken,apart){
      if(far<near)return null;
      for(let i=0;i<40;i++){
        const u=-(near+r()*(far-near));
        if(!c.blocked(s,u-reach,u+reach)&&taken.every(t=>Math.abs(t-u)>=apart))return u;
      }
      return null;
    },
    line(spec){
      const segments=spec.closed?spec.points.length:spec.points.length-1;
      const standoffs=spec.standoffs??Array(segments).fill(spec.standoff??c.standoff(spec.diameter));
      piecesFromLine({...spec,standoffs},runs++,out);
    },
    tee(position,axis,branch,d){out.push({kind:'tee',run:runs,diameter:d,position:rounded(position),axis,branch});},
  };
  // Drawn before the route so that a material override leaves the route unchanged.
  const seeded=DRAIN_STYLE_IDS.includes(style)?(r()<0.6?'orange':'grey'):'blue';
  STYLES[style](c);
  for(const piece of out)piece.material=material??seeded;
  return out;
}

// ---- checks ----

// Tests the pieces against the room. Rules: every pipe has positive length and
// stays inside the room; nothing enters the centre aisle below headroom; every
// pipe end meets a fitting or a room surface; no vertical pipe or faucet sits
// in an avoided stretch of wall.
export function checkPipeRun(pieces,{width,length=12,avoid=[]}={}){
  const half=width/2,failures=[],tolerance=0.002,fail=(piece,rule)=>failures.push({kind:piece.kind,run:piece.run,rule,position:piece.position});
  const joints=[];
  for(const p of pieces){
    const S=fittingSizes(p.diameter);
    if(p.kind==='elbow')joints.push(add(p.position,p.a,S.bend),add(p.position,p.b,S.bend));
    if(p.kind==='tee'||p.kind==='cap'||p.kind==='faucet')joints.push(p.position);
    if(p.kind==='elbow'&&Math.abs(dot(p.a,p.b))>1e-9)fail(p,'elbow is not a right angle');
  }
  const onSurface=q=>Math.abs(q[1])<tolerance||Math.abs(q[1]-R.height)<tolerance||Math.abs(q[2])<tolerance||Math.abs(q[2]+length)<tolerance;
  const inside=q=>Math.abs(q[0])<=half-R.wallFace+tolerance&&q[1]>=-tolerance&&q[1]<=R.height+tolerance&&q[2]<=tolerance&&q[2]>=-length-tolerance;
  const inAvoid=(x,z)=>avoid.some(a=>a.side===Math.sign(x)&&z<a.from&&z>a.to);
  for(const p of pieces){
    if(p.kind==='faucet'&&inAvoid(p.position[0],p.position[2]))fail(p,'faucet in an avoided stretch');
    if(p.kind!=='pipe')continue;
    const ends=[p.position,add(p.position,p.axis,p.length)];
    if(!(p.length>0.02))fail(p,'pipe too short');
    for(const q of ends){
      if(!inside(q))fail(p,'outside the room');
      // A joint in a bundle belongs to a pipe of another diameter, so allow 3 mm.
      if(!onSurface(q)&&!joints.some(j=>size(sub(j,q))<0.003))fail(p,'open end');
    }
    const nearest=Math.min(Math.abs(ends[0][0]),Math.abs(ends[1][0])),crosses=Math.sign(ends[0][0])!==Math.sign(ends[1][0]);
    if((crosses||nearest<R.aisleHalf)&&Math.min(ends[0][1],ends[1][1])<R.headroom)fail(p,'in the aisle below headroom');
    if(p.axis[1]!==0&&Math.abs(ends[0][0])>R.aisleHalf&&inAvoid(ends[0][0],ends[0][2]))fail(p,'vertical pipe in an avoided stretch');
  }
  const count=kind=>pieces.filter(p=>p.kind===kind).length;
  return{ok:failures.length===0,failures,
    counts:Object.fromEntries(['pipe','elbow','tee','coupling','cap','clamp','faucet'].map(k=>[k,count(k)])),
    runs:new Set(pieces.map(p=>p.run)).size,
    pipeLength:round(pieces.reduce((sum,p)=>sum+(p.kind==='pipe'?p.length:0),0))};
}
