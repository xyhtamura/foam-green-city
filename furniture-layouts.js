// Seeded furniture layouts for Foam Green City rooms.
// Returns plain placement data and imports nothing, so it also runs under Node.
// Metres and radians. X is centred on the room; Z runs from 0 at the entrance
// to -length at the exit. A piece at rotationY 0 faces +Z, toward the entrance.

// Arrangements a room could be in while in use.
export const ORDINARY_LAYOUT_IDS=['chairRows','tableRows','perimeter','gathered','sparse','pairedDining'];
// Arrangements of furniture put away, left over, or set out with no evident use.
export const ODD_LAYOUT_IDS=['chairStacks','tableStacks','chairsOnTables','pushedAside','facingWall','ring'];
// New ids are appended, so the seed mixing of the earlier layouts does not change.
export const LAYOUT_IDS=[...ORDINARY_LAYOUT_IDS,...ODD_LAYOUT_IDS];

export const LAYOUT_LABELS={
  chairRows:'Chair rows with a centre aisle',
  tableRows:'Table rows',
  perimeter:'Perimeter seating',
  gathered:'Tables gathered together',
  sparse:'One isolated group',
  pairedDining:'Paired dining groups (baseline)',
  chairStacks:'Stacked chairs along a wall',
  tableStacks:'Tables stacked on tables',
  chairsOnTables:'Chairs put up on tables',
  pushedAside:'Everything pushed to one wall',
  facingWall:'Chairs facing a side wall',
  ring:'Ring of chairs',
};

// Clearances every layout keeps. checkFurnitureLayout() tests the same values.
export const CLEARANCE={
  aisleHalf:0.6,   // half of the 1.2 m centre aisle along X = 0
  wall:0.2,        // from a side-wall centre plane to the nearest furniture
  endWall:0.2,     // from a partition centre plane to the nearest furniture
  doorHalf:1.5,    // half-width of the keep-out zone in front of each doorway
  doorDepth:1.5,   // depth of that zone, measured from the partition
  ceiling:2.45,    // highest point of any stack; the room is 2.58 m high
};

// Half-extents of each piece at rotationY 0. Each value is a few millimetres
// larger than the mesh in ../foam-green-city/domestic-props.js; preview.html
// compares them with the real Box3 bounds.
export const FOOTPRINT_HALF={
  monoblocChair:{x:0.30,z:0.28},
  monoblocTable:{x:0.35,z:0.435},
  woodTable:{x:0.345,z:0.43},
};

// Height of each piece standing on the floor, rounded up.
export const PIECE_HEIGHT={monoblocChair:0.90,monoblocTable:0.765,woodTable:0.76};
// Height of the surface a table offers to whatever stands on it.
export const TABLE_TOP={monoblocTable:0.759,woodTable:0.7525};
// Rise per chair in a nested stack. The meshes pass through each other, as
// nested monobloc chairs appear to.
export const CHAIR_NEST=0.11;

const CH=FOOTPRINT_HALF.monoblocChair;
const TABLE_MAX=FOOTPRINT_HALF.monoblocTable;
const HALF_PI=Math.PI/2;
const EPS=0.001;        // positions are rounded to the millimetre
const CHAIR_GAP=0.08;   // between neighbouring chairs in a run
const SEAT_GAP=0.08;    // between a table edge and a chair
const TABLE_GAP=0.02;   // between tables pushed together

// Same generator as the segment seed in index.html.
function mulberry32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;
  let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;
  return((t^t>>>14)>>>0)/4294967296;};}

function mixSeed(seed,layoutIndex,width,length){
  let h=(Math.floor(Number(seed)||0)^0x9e3779b9)|0;
  for(const v of [layoutIndex,Math.round(width*1000),Math.round(length*1000)]){
    h=Math.imul(h^v,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;
  }
  return h>>>0;
}

const pick=(r,list)=>list[Math.floor(r()*list.length)];
const round=v=>Math.round(v*1000)/1000;

// The floor rectangle a piece covers, as an axis-aligned box, with its height
// range. For an inverted piece, y is its highest point.
export function furnitureFootprint(p){
  const h=FOOTPRINT_HALF[p.kind],c=Math.abs(Math.cos(p.rotationY)),s=Math.abs(Math.sin(p.rotationY));
  const hx=c*h.x+s*h.z,hz=s*h.x+c*h.z,y=p.y??0,height=PIECE_HEIGHT[p.kind];
  return{minX:p.x-hx,maxX:p.x+hx,minZ:p.z-hz,maxZ:p.z+hz,minY:p.inverted?y-height:y,maxY:p.inverted?y:y+height};
}

// Rules a single box breaks. Shared by the generator, the checker, and the preview.
export function boxProblems(b,width,length){
  const C=CLEARANCE,half=width/2,out=[];
  if(!(b.minX>=C.aisleHalf-EPS||b.maxX<=-C.aisleHalf+EPS))out.push('aisle');
  if(Math.max(-b.minX,b.maxX)>half-C.wall+EPS)out.push('wall');
  if(b.maxZ>-C.endWall+EPS||b.minZ<-(length-C.endWall)-EPS)out.push('endWall');
  const nearDoorX=b.minX<C.doorHalf-EPS&&b.maxX>-C.doorHalf+EPS;
  if(nearDoorX&&(b.maxZ>-C.doorDepth+EPS||b.minZ<-(length-C.doorDepth)-EPS))out.push('doorway');
  if(b.maxY!==undefined&&(b.maxY>C.ceiling+EPS||b.minY<-0.02))out.push('height');
  return out;
}

export const boxesOverlap=(a,b)=>
  a.minX<b.maxX-EPS&&a.maxX>b.minX+EPS&&a.minZ<b.maxZ-EPS&&a.maxZ>b.minZ+EPS;

// Pieces in one stack share a floor rectangle on purpose.
const sameStack=(a,b)=>a.stack!=null&&a.stack===b.stack;

// Checks placements against the room. `boxes` may supply measured bounds;
// by default the module's own footprints are used.
export function checkFurnitureLayout(placements,{width,length=12,boxes}={}){
  const bs=boxes??placements.map(furnitureFootprint),failures=[];
  bs.forEach((b,i)=>{for(const rule of boxProblems(b,width,length))failures.push({index:i,kind:placements[i].kind,rule});});
  for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++)
    if(!sameStack(placements[i],placements[j])&&boxesOverlap(bs[i],bs[j]))failures.push({index:i,other:j,kind:placements[i].kind,rule:'overlap'});
  const C=CLEARANCE,half=width/2,min={aisle:Infinity,wall:Infinity,endWall:Infinity,pair:Infinity};
  let top=0;
  bs.forEach((b,i)=>{
    min.aisle=Math.min(min.aisle,(b.minX>0?b.minX:-b.maxX)-C.aisleHalf);
    min.wall=Math.min(min.wall,half-Math.max(-b.minX,b.maxX));
    min.endWall=Math.min(min.endWall,-b.maxZ,b.minZ+length);
    if(b.maxY!==undefined)top=Math.max(top,b.maxY);
    for(let j=i+1;j<bs.length;j++){
      if(sameStack(placements[i],placements[j]))continue;
      const o=bs[j],dx=Math.max(b.minX-o.maxX,o.minX-b.maxX),dz=Math.max(b.minZ-o.maxZ,o.minZ-b.maxZ);
      min.pair=Math.min(min.pair,Math.max(dx,dz));
    }
  });
  for(const k in min)min[k]=Number.isFinite(min[k])?round(min[k]):null;
  min.ceiling=round(C.ceiling-top);
  return{ok:failures.length===0,failures,min};
}

// Z spans the furniture occupies, merged, for an integrator that places other
// props in the gaps. Each span is {from,to} with from > to.
export function occupiedSpans(placements,pad=0.25){
  const spans=placements.map(furnitureFootprint).map(b=>({from:b.maxZ+pad,to:b.minZ-pad})).sort((a,b)=>b.from-a.from),out=[];
  for(const s of spans){const last=out[out.length-1];
    if(last&&s.from>=last.to)last.to=Math.min(last.to,s.to);else out.push({...s});}
  return out.map(s=>({from:round(s.from),to:round(s.to)}));
}

// ---- helpers shared by the layouts ----

// Centres (positive X) of as many items as fit between the aisle and one wall.
function lateralRun(c,itemWidth,gap,from=c.x0){
  const usable=c.x1-from,n=Math.max(0,Math.floor((usable+gap)/(itemWidth+gap)+1e-9));
  const run=n*itemWidth+(n-1)*gap,start=from+(usable-run)/2+itemWidth/2;
  return Array.from({length:n},(_,i)=>start+i*(itemWidth+gap));
}

// Centres along Z of repeated units of the given depth, centred between the doorway zones.
function depthRun(c,depth,pitch){
  const span=c.length-2*CLEARANCE.doorDepth,n=span<depth?0:Math.floor((span-depth)/pitch+1e-9)+1;
  const slack=span-depth-(n-1)*pitch,first=-CLEARANCE.doorDepth-slack/2-depth/2;
  return Array.from({length:n},(_,i)=>first-i*pitch);
}

// A seeded Z centre for something of the given depth, clear of both doorway zones.
function depthAt(c,depth){
  const top=-CLEARANCE.doorDepth-depth/2,bottom=-(c.length-CLEARANCE.doorDepth)+depth/2;
  return top-c.r()*Math.max(0,top-bottom);
}

// Chairs nested one on another. `finish` is an index or a function of the level.
function chairStack(c,x,z,rotationY,count,finish,group,baseY=0){
  const stack=c.stack();
  for(let i=0;i<count;i++)
    c.put('monoblocChair',x,z,rotationY,typeof finish==='function'?finish(i):finish,group,'seat',{y:baseY+i*CHAIR_NEST,stack});
}

// Tables standing on tables. The top one may be upside down, and an upright
// top may carry a chair when the ceiling limit allows it.
function tablePile(c,x,z,rotationY,levels,finish,group,{invertTop=false,chairOnTop=false}={}){
  const{r}=c,stack=c.stack();let y=0,inverted=false;
  for(let i=0;i<levels;i++){
    const kind=r()<0.65?'monoblocTable':'woodTable';
    inverted=invertTop&&i>0&&i===levels-1;
    c.put(kind,x,z,rotationY,finish(),group,'table',{y:inverted?y+TABLE_TOP[kind]:y,inverted,stack});
    y+=TABLE_TOP[kind];
  }
  if(chairOnTop&&!inverted&&y+PIECE_HEIGHT.monoblocChair<=CLEARANCE.ceiling)
    c.put('monoblocChair',x,z,pick(r,[0,Math.PI,HALF_PI,-HALF_PI]),finish(),group,'seat',{y,stack});
}

// ---- layouts ----

// Rows of chairs on both sides of the aisle, all facing one way. One finish
// throughout, a few odd chairs, a few absent ones, and usually a short run of
// rows missing on one side.
function chairRows(c){
  const{r}=c,xs=lateralRun(c,2*CH.x,CHAIR_GAP),zs=depthRun(c,2*CH.z,pick(r,[0.8,0.9,1.0]));
  const facing=r()<0.7?Math.PI:0,finish=c.finish(),odd=c.finish();
  const hasBreak=r()<0.75,breakSide=r()<0.5?-1:1,breakLength=1+Math.floor(r()*3);
  const breakAt=Math.floor(r()*Math.max(1,zs.length-breakLength+1));
  zs.forEach((z,row)=>{for(const side of [-1,1]){
    const group=c.group(),missing=hasBreak&&side===breakSide&&row>=breakAt&&row<breakAt+breakLength;
    for(const x of xs){
      const absent=r()<0.03,isOdd=r()<0.05;
      if(!missing&&!absent)c.put('monoblocChair',side*x,z,facing,isOdd?odd:finish,group,'seat');
    }
  }});
}

// Tables turned across the room and set end to end, in rows on both sides of
// the aisle. Chairs sit on one long side of each row or on both.
function tableRows(c){
  const{r}=c,kind=r()<0.65?'monoblocTable':'woodTable',T=FOOTPRINT_HALF[kind],bothSides=r()<0.5;
  const tableFinish=c.finish(),chairFinish=r()<0.5?tableFinish:c.finish();
  const tx=lateralRun(c,2*T.z,TABLE_GAP);
  if(!tx.length)return;
  const runFrom=tx[0]-T.z,runTo=tx[tx.length-1]+T.z,chairPitch=2*CH.x+CHAIR_GAP;
  const chairCount=Math.floor((runTo-runFrom+CHAIR_GAP)/chairPitch+1e-9);
  const chairStart=(runFrom+runTo)/2-(chairCount*chairPitch-CHAIR_GAP)/2+CH.x;
  const cx=Array.from({length:chairCount},(_,i)=>chairStart+i*chairPitch);
  const seatDepth=SEAT_GAP+2*CH.z,seat=T.x+SEAT_GAP+CH.z;
  const depth=2*T.x+(bothSides?2:1)*seatDepth,zs=depthRun(c,depth,depth+(bothSides?0.35:0.45));
  const emptyRow=r()<0.5?Math.floor(r()*zs.length):-1,emptySide=r()<0.5?-1:1;
  zs.forEach((zc,row)=>{for(const side of [-1,1]){
    const group=c.group(),tz=bothSides?zc:zc+depth/2-seatDepth-T.x;
    for(const x of tx)c.put(kind,side*x,tz,HALF_PI,tableFinish,group,'table');
    const empty=row===emptyRow&&side===emptySide;
    for(const x of cx){
      // The chair on the entrance side faces the exit; the far chair faces back.
      const nearAbsent=r()<0.04,farAbsent=r()<0.04;
      if(!empty&&!nearAbsent)c.put('monoblocChair',side*x,tz+seat,Math.PI,chairFinish,group,'seat');
      if(bothSides&&!empty&&!farAbsent)c.put('monoblocChair',side*x,tz-seat,0,chairFinish,group,'seat');
    }
  }});
}

// Chairs with their backs to the walls, facing the room. The middle of the
// floor stays empty. Shoulders beside each doorway take chairs where the room
// is wide enough.
function perimeter(c){
  const{r,half,length:L}=c,C=CLEARANCE,wallX=half-C.wall-CH.z,pitch=pick(r,[0.66,0.9,1.2]);
  const finishA=c.finish(),finishB=c.finish(),alternate=r()<0.5;
  const hasGap=r()<0.7,gapSide=r()<0.5?-1:1,gapLength=2+Math.floor(r()*3);
  // In a 4 m room the side chairs reach into the doorway zones, so the run starts below them.
  const inset=wallX-CH.z<C.doorHalf?C.doorDepth+CH.x:C.endWall+2*CH.z+0.06+CH.x;
  const span=L-2*inset,n=Math.floor(span/pitch+1e-9)+1,first=-inset-(span-(n-1)*pitch)/2;
  const gapAt=Math.floor(r()*Math.max(1,n-gapLength+1));
  for(const side of [-1,1]){
    const group=c.group();
    for(let i=0;i<n;i++){
      if(hasGap&&side===gapSide&&i>=gapAt&&i<gapAt+gapLength)continue;
      c.put('monoblocChair',side*wallX,first-i*pitch,side<0?HALF_PI:-HALF_PI,alternate&&i%2?finishB:finishA,group,'seat');
    }
  }
  const ex=lateralRun(c,2*CH.x,CHAIR_GAP,C.doorHalf);
  for(const end of [0,1])for(const side of [-1,1]){
    const group=c.group(),z=end?-(L-C.endWall-CH.z):-(C.endWall+CH.z);
    ex.forEach((x,i)=>c.put('monoblocChair',side*x,z,end?0:Math.PI,alternate&&i%2?finishB:finishA,group,'seat'));
  }
}

// One block of tables pushed together, with chairs around it. Kinds and
// finishes are mixed, as if collected from other rooms.
function tableBlock(c,side,columns,rows,chairSides,dominant,group){
  const{r}=c,px=2*TABLE_MAX.x+TABLE_GAP,pz=2*TABLE_MAX.z+TABLE_GAP,seatDepth=0.06+2*CH.z;
  const blockWidth=columns*px-TABLE_GAP;
  const extent=blockWidth+(chairSides==='both'?2:chairSides==='none'?0:1)*seatDepth;
  const left=c.x0+(c.x1-c.x0-extent)*r();
  const blockFrom=left+(chairSides==='both'||chairSides==='aisle'?seatDepth:0);
  const depth=rows*pz-TABLE_GAP+2*seatDepth;
  const top=-CLEARANCE.doorDepth-depth/2,bottom=-(c.length-CLEARANCE.doorDepth)+depth/2;
  const zc=top-r()*Math.max(0,top-bottom);
  const colX=i=>blockFrom+TABLE_MAX.x+i*px,rowZ=j=>zc+(rows-1)*pz/2-j*pz;
  for(let i=0;i<columns;i++)for(let j=0;j<rows;j++)
    c.put(r()<0.65?'monoblocTable':'woodTable',side*colX(i),rowZ(j),0,r()<0.6?dominant:c.finish(),group,'table');
  const chair=(x,z,rotation)=>{
    const absent=r()<0.15,finish=r()<0.5?dominant:c.finish();
    if(!absent)c.put('monoblocChair',side*x,z,side*rotation,finish,group,'seat');
  };
  const seat=TABLE_MAX.x+0.06+CH.z,endSeat=TABLE_MAX.z+0.06+CH.z;
  for(let j=0;j<rows;j++){
    if(chairSides==='both'||chairSides==='aisle')chair(colX(0)-seat,rowZ(j),HALF_PI);
    if(chairSides==='both'||chairSides==='wall')chair(colX(columns-1)+seat,rowZ(j),-HALF_PI);
  }
  for(let i=0;i<columns;i++){chair(colX(i),rowZ(0)+endSeat,Math.PI);chair(colX(i),rowZ(rows-1)-endSeat,0);}
}

function gathered(c){
  const{r}=c,usable=c.x1-c.x0,px=2*TABLE_MAX.x+TABLE_GAP,seatDepth=0.06+2*CH.z,options=[];
  for(let columns=1;columns<=4;columns++)for(const[sides,count]of[['both',2],['aisle',1],['wall',1],['none',0]])
    if(columns*px-TABLE_GAP+count*seatDepth<=usable+1e-9)options.push({columns,sides,count});
  if(!options.length)return;
  // Prefer the widest block that still takes chairs on a long side.
  const seated=options.filter(o=>o.count>0),pool=seated.length?seated:options;
  const widest=Math.max(...pool.map(o=>o.columns));
  const choices=pool.filter(o=>o.columns===widest||(o.columns===widest-1&&o.sides==='both'));
  const side=r()<0.5?-1:1,main=pick(r,choices),dominant=c.finish();
  tableBlock(c,side,main.columns,2+Math.floor(r()*3),main.sides,dominant,c.group());
  const second=r()<0.6,small=pick(r,pool.filter(o=>o.columns===1)),smallRows=1+Math.floor(r()*2);
  if(second&&small)tableBlock(c,-side,1,smallRows,small.sides,dominant,c.group());
}

// A single group in an otherwise empty room.
function sparse(c){
  const{r,half}=c,C=CLEARANCE,side=r()<0.5?-1:1,type=r(),finish=c.finish(),group=c.group();
  const zAt=depth=>{const top=-C.doorDepth-depth/2,bottom=-(c.length-C.doorDepth)+depth/2;return top-r()*Math.max(0,top-bottom);};
  if(type<0.3){
    // Chairs in a short row against one wall.
    const n=2+Math.floor(r()*2),pitch=2*CH.x+0.06,zc=zAt(n*pitch),x=half-C.wall-CH.z;
    for(let i=0;i<n;i++)c.put('monoblocChair',side*x,zc+(n-1)*pitch/2-i*pitch,side<0?HALF_PI:-HALF_PI,finish,group,'seat');
    return;
  }
  const kind=r()<0.65?'monoblocTable':'woodTable',T=FOOTPRINT_HALF[kind],seat=0.86;
  const sideSeat=T.x+0.06+CH.z,roomForSide=c.x1-c.x0>=2*T.x+0.06+2*CH.z;
  const withSide=roomForSide&&r()<0.5,alone=type>=0.8;
  const from=c.x0+(withSide?0.06+2*CH.z:0)+T.x,x=from+(c.x1-T.x-from)*r(),zc=zAt(2*(seat+CH.z));
  c.put(kind,side*x,zc,0,finish,group,'table');
  const chairFinish=()=>r()<0.5?finish:c.finish();
  c.put('monoblocChair',side*x,zc+seat,Math.PI,chairFinish(),group,'seat');
  if(!alone)c.put('monoblocChair',side*x,zc-seat,0,chairFinish(),group,'seat');
  if(withSide&&!alone)c.put('monoblocChair',side*(x-sideSeat),zc,side*HALF_PI,chairFinish(),group,'seat');
}

// The arrangement index.html builds now: one table with a chair at each end,
// in every lateral lane, at two depths on alternating sides.
function pairedDining(c){
  const{r,length:L}=c,side=r()<0.5?-1:1;
  for(let lane=1.42;lane+TABLE_MAX.x<=c.x1+1e-9;lane+=1)
    for(const[z,s]of[[-Math.max(2.7,L*0.25),side],[-Math.min(L-2.7,L*2/3),-side]]){
      const group=c.group(),finish=c.finish(),kind=r()<0.65?'monoblocTable':'woodTable';
      c.put(kind,s*lane,z,0,finish,group,'table');
      for(const end of [-1,1])
        c.put('monoblocChair',s*lane,z+end*0.86,end>0?Math.PI:0,r()<0.5?finish:c.finish(),group,'seat');
    }
}

// ---- odd layouts ----

// Stacks of nested chairs in a line against one wall, as if stored. Heights
// rise, fall, or vary along the line. The rest of the room is empty, apart
// from a short second line or one chair left out, facing the stacks.
function chairStacks(c){
  const{r,half}=c,C=CLEARANCE,wallX=half-C.wall-CH.z,pitch=2*CH.x+0.06,side=r()<0.5?-1:1;
  const finish=c.finish(),odd=c.finish(),order=pick(r,['varied','rising','falling']);
  const most=Math.max(1,Math.floor((c.length-2*C.doorDepth+0.06)/pitch));
  const line=(s,wanted)=>{
    const count=Math.min(wanted,most),depth=count*pitch-0.06,zc=depthAt(c,depth),group=c.group();
    for(let i=0;i<count;i++){
      const t=count>1?i/(count-1):0,varied=2+Math.floor(r()*9);
      const n=order==='varied'?varied:Math.round(2+(order==='rising'?t:1-t)*9);
      chairStack(c,s*wallX,zc+depth/2-CH.x-i*pitch,s<0?HALF_PI:-HALF_PI,n,()=>r()<0.06?odd:finish,group);
    }
  };
  line(side,3+Math.floor(r()*6));
  const other=r();
  if(other<0.3)line(-side,1+Math.floor(r()*3));
  else if(other<0.75){
    const x=c.x0+CH.z+r()*(c.x1-c.x0-2*CH.z);
    c.put('monoblocChair',-side*x,depthAt(c,2*CH.x),side*HALF_PI,finish,c.group(),'seat');
  }
}

// Tables standing on tables, one to three high, in a line against one wall.
// The top table of a pile is often upside down; some piles carry a chair.
function tableStacks(c){
  const{r}=c,C=CLEARANCE,side=r()<0.5?-1:1,x=c.x1-TABLE_MAX.x,pitch=2*TABLE_MAX.z+TABLE_GAP,dominant=c.finish();
  const most=Math.max(1,Math.floor((c.length-2*C.doorDepth+TABLE_GAP)/pitch));
  const finish=()=>r()<0.6?dominant:c.finish();
  const line=(s,wanted)=>{
    const count=Math.min(wanted,most),depth=count*pitch-TABLE_GAP,zc=depthAt(c,depth),group=c.group();
    for(let i=0;i<count;i++){
      const levels=1+Math.floor(r()*3),invertTop=r()<0.5,chairOnTop=r()<0.3;
      tablePile(c,s*x,zc+depth/2-TABLE_MAX.z-i*pitch,0,levels,finish,group,{invertTop,chairOnTop});
    }
  };
  line(side,3+Math.floor(r()*6));
  if(c.width>=6&&r()<0.5)line(-side,1+Math.floor(r()*3));
}

// A grid of tables with the chairs put up on them, as at closing time. Most
// tables carry one chair, some a short stack, a few none.
function chairsOnTables(c){
  const{r}=c,kind=r()<0.65?'monoblocTable':'woodTable',T=FOOTPRINT_HALF[kind];
  const tableFinish=c.finish(),chairFinish=r()<0.5?tableFinish:c.finish(),odd=c.finish();
  const xs=lateralRun(c,2*T.x,0.3),zs=depthRun(c,2*T.z,2*T.z+0.6);
  for(const z of zs)for(const side of [-1,1])for(const x of xs){
    const group=c.group(),stack=c.stack(),u=r(),count=u<0.12?0:u<0.8?1:2+Math.floor(r()*3);
    const rotation=pick(r,[0,Math.PI,HALF_PI,-HALF_PI]);
    c.put(kind,side*x,z,0,tableFinish,group,'table',{stack});
    for(let i=0;i<count;i++)
      c.put('monoblocChair',side*x,z,rotation,r()<0.08?odd:chairFinish,group,'seat',{y:TABLE_TOP[kind]+i*CHAIR_NEST,stack});
  }
}

// Chair stacks and table piles in one line along one wall, for most of the
// room's length, with occasional gaps. The other side of the room is empty
// except, usually, for one chair facing the line.
function pushedAside(c){
  const{r,half}=c,C=CLEARANCE,side=r()<0.5?-1:1,wallX=half-C.wall-CH.z,dominant=c.finish(),group=c.group();
  const finish=()=>r()<0.6?dominant:c.finish(),end=-(c.length-C.doorDepth);
  let z=-C.doorDepth;
  for(;;){
    const table=r()<0.45,depth=table?2*TABLE_MAX.z:2*CH.x;
    if(z-depth<end-1e-9)break;
    if(table)tablePile(c,side*(c.x1-TABLE_MAX.x),z-depth/2,0,1+Math.floor(r()*3),finish,group,{invertTop:r()<0.5,chairOnTop:r()<0.3});
    else chairStack(c,side*wallX,z-depth/2,side<0?HALF_PI:-HALF_PI,1+Math.floor(r()*10),finish,group);
    z-=depth+(r()<0.15?0.4+r()*0.8:0.04);
  }
  if(r()<0.7){
    const x=c.x0+CH.z+r()*(c.x1-c.x0-2*CH.z);
    c.put('monoblocChair',-side*x,depthAt(c,2*CH.x),side*HALF_PI,dominant,c.group(),'seat');
  }
}

// Chairs on one side of the room only, in lines, all facing the side wall with
// their backs to the aisle.
function facingWall(c){
  const{r}=c,side=r()<0.5?-1:1,finish=c.finish(),odd=c.finish();
  const xs=lateralRun(c,2*CH.z,0.3),zs=depthRun(c,2*CH.x,2*CH.x+pick(r,[0.06,0.3]));
  for(const x of xs){
    const group=c.group();
    for(const z of zs){
      const absent=r()<0.05,isOdd=r()<0.04;
      if(!absent)c.put('monoblocChair',side*x,z,side*HALF_PI,isOdd?odd:finish,group,'seat');
    }
  }
}

// A ring of chairs on one side of the room, all facing outward or all facing
// in, sometimes around a stack of chairs. A 4 m room has space for two chairs
// only, back to back or face to face.
function ring(c){
  const{r}=c,side=r()<0.5?-1:1,usable=c.x1-c.x0,reach=0.42,inward=r()<0.5,finish=c.finish(),group=c.group();
  const maxRadius=usable/2-reach;
  if(maxRadius<0.5){
    const x=c.x0+usable/2,offset=CH.z+0.02,zc=depthAt(c,2*(offset+CH.z));
    c.put('monoblocChair',side*x,zc+offset,inward?Math.PI:0,finish,group,'seat');
    c.put('monoblocChair',side*x,zc-offset,inward?0:Math.PI,finish,group,'seat');
    return;
  }
  const radius=Math.max(0.62,maxRadius*(0.75+0.25*r()));
  const cx=c.x0+reach+radius+r()*Math.max(0,usable-2*(radius+reach)),zc=depthAt(c,2*(radius+reach));
  const seats=count=>Array.from({length:count},(_,i)=>{const a=i*2*Math.PI/count;
    return{kind:'monoblocChair',x:round(side*(cx+radius*Math.sin(a))),z:round(zc+radius*Math.cos(a)),rotationY:side*(inward?a+Math.PI:a)};});
  const clear=list=>{const boxes=list.map(furnitureFootprint);return boxes.every((b,i)=>boxes.every((o,j)=>j<=i||!boxesOverlap(b,o)));};
  // The overlap rule works on axis-aligned boxes, so a turned chair needs more
  // room than its true outline. Take the largest count whose boxes stay apart.
  let count=Math.max(3,Math.floor(2*Math.PI*radius/(2*CH.x+0.06)));
  while(count>3&&!clear(seats(count)))count--;
  const list=seats(count),absent=r()<0.5?Math.floor(r()*count):-1,wantStack=r()<0.6;
  const turn=pick(r,[0,HALF_PI,Math.PI,-HALF_PI]),height=4+Math.floor(r()*7);
  list.forEach((p,i)=>{if(i!==absent)c.put(p.kind,p.x,p.z,p.rotationY,finish,group,'seat');});
  if(wantStack&&clear([...list,{kind:'monoblocChair',x:round(side*cx),z:round(zc),rotationY:turn}]))chairStack(c,side*cx,zc,turn,height,finish,group);
}

const LAYOUTS={chairRows,tableRows,perimeter,gathered,sparse,pairedDining,chairStacks,tableStacks,chairsOnTables,pushedAside,facingWall,ring};

// Returns an array of {kind,x,y,z,rotationY,inverted,finishIndex,group,role,stack}.
// `group` is shared by pieces placed as one unit; `role` is 'table' or 'seat'.
// `y` is the height to give the model's origin, 0 for a piece on the floor.
// An `inverted` piece is upside down: turn it half a revolution about Z.
// `stack` is shared by pieces standing on one another, and is null otherwise.
// With `filter` on, a piece that breaks a clearance or overlaps an earlier
// piece is left out, which only happens at sizes the layouts were not drawn for.
export function generateFurnitureLayout({width,length=12,seed=0,layout,finishCount=10,filter=true}){
  const index=LAYOUT_IDS.indexOf(layout);
  if(index<0)throw new Error(`Unknown layout "${layout}". Use one of: ${LAYOUT_IDS.join(', ')}.`);
  const r=mulberry32(mixSeed(seed,index,width,length)),out=[];
  let groups=0,stacks=0;
  const c={r,width,length,half:width/2,x0:CLEARANCE.aisleHalf,x1:width/2-CLEARANCE.wall,
    finish:()=>Math.floor(r()*finishCount),group:()=>groups++,stack:()=>stacks++,
    put(kind,x,z,rotationY,finishIndex,group,role,{y=0,inverted=false,stack=null}={}){
      out.push({kind,x:round(x),y:round(y),z:round(z),rotationY:Math.abs(rotationY)<1e-12?0:rotationY,inverted,finishIndex,group,role,stack});
    }};
  LAYOUTS[layout](c);
  if(!filter)return out;
  const kept=[],boxes=[];
  for(const p of out){
    const b=furnitureFootprint(p);
    if(boxProblems(b,width,length).length||boxes.some((o,i)=>!sameStack(p,kept[i])&&boxesOverlap(b,o)))continue;
    kept.push(p);boxes.push(b);
  }
  return kept;
}
