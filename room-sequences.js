// Phrases share proportions and furnishing rules before a visible break.
export const SEQUENCE_NAMES=['opening','repeat','density','long','stored','cleared','auditorium','levels','passages','twist','demo'];
const spec=(width,length,type,layout,floor,architecture={})=>({width,length,type,layout,floor,height:2.58,shape:'rectangle',rise:0,...architecture});
const PHRASES={
  twist:[spec(6,6,'sala','sparse','bare',{kitchenCorner:true}),spec(6,10,'kitchen','pairedDining','bare'),spec(4,6,'bathroom','sparse','bare'),spec(6,12,'sala','perimeter','bare'),spec(4,6,'kitchen','sparse','bare'),spec(6,8,'bedroom','sparse','bare')],
  opening:[spec(4,8,'sala','pairedDining','redLinoleum'),spec(4,8,'sala','pairedDining','redLinoleum'),spec(10,18,'sala','perimeter','creamCeramic'),spec(6,10,'bare','sparse','concrete')],
  repeat:[spec(6,10,'kitchen','tableRows','greenCheckerboard'),spec(6,10,'kitchen','tableRows','greenCheckerboard'),spec(6,10,'kitchen','tableRows','greenCheckerboard'),spec(4,8,'bare','sparse','whiteTile')],
  density:[spec(8,12,'sala','chairRows','creamCeramic'),spec(8,12,'sala','chairRows','creamCeramic'),spec(12,20,'bare','sparse','abruptPatches'),spec(4,8,'bedroom','sparse','whiteTile')],
  long:[spec(4,8,'bedroom','pairedDining','concrete'),spec(4,8,'bedroom','pairedDining','concrete'),spec(6,32,'sala','sparse','redLinoleum'),spec(8,14,'kitchen','gathered','abruptPatches')],
  stored:[spec(6,12,'sala','chairStacks','concrete'),spec(6,12,'sala','pushedAside','concrete'),spec(8,16,'sala','tableStacks','whiteTile'),spec(10,18,'sala','ring','greenCheckerboard')],
  cleared:[spec(6,12,'kitchen','chairsOnTables','creamCeramic'),spec(6,12,'kitchen','chairsOnTables','creamCeramic'),spec(8,14,'sala','facingWall','greenCheckerboard'),spec(12,24,'bare','sparse','concrete')],
  auditorium:[spec(6,10,'bare','sparse','bare'),spec(24,40,'auditorium','chairRows','bare',{height:8,shape:'auditorium'}),spec(8,12,'sala','perimeter','creamCeramic'),spec(18,28,'hall','sparse','bare',{height:5,shape:'colonnade'})],
  levels:[spec(10,24,'hall','perimeter','bare',{height:5,shape:'deadStairs',rise:1.5}),spec(8,24,'hall','sparse','bare',{height:4,shape:'branches',rise:-1.2}),spec(12,20,'hall','sparse','concrete',{height:5,shape:'deadStairs'}),spec(6,12,'sala','pairedDining','redLinoleum')],
  passages:[spec(4,24,'hall','sparse','bare',{height:3.6,shape:'branches'}),spec(12,24,'hall','perimeter','whiteTile',{height:5,shape:'cross'}),spec(18,28,'hall','sparse','bare',{height:6,shape:'colonnade'}),spec(6,16,'bare','sparse','bare',{height:4,shape:'deadStairs'})],
};

// Each rise returns to zero at both joins. Flat middle bays hold furniture.
export function floorHeight(room,localZ){
  const u=Math.max(0,Math.min(1,-localZ/room.length));
  return (room.rise||0)*Math.min(1,u*4,(1-u)*4)||0;
}

export function cameraRoute(room,openings=[]){
  const points=[{x:0,z:0}],portal=openings[Math.floor(room.index/4)%Math.max(1,openings.length)];
  if(portal){
    const end=passageExit(room,portal),x=end.x,endZ=end.z+1;
    points.push({x:0,z:portal.z},{x,z:portal.z},{x,z:endZ},{x,z:portal.z},{x:0,z:portal.z});
  }
  points.push({x:0,z:-room.length});
  let distance=0;
  const legs=points.slice(1).map((end,i)=>{
    const start=points[i],length=Math.hypot(end.x-start.x,end.z-start.z),leg={start,end,length,distance};distance+=length;return leg;
  });
  return {legs,length:distance};
}

// The far end of a side passage, where its return leg meets the exit doorway.
export function passageExit(room,portal){
  const reach=portal.reach??(room.shape==='cross'?8:10),turn=portal.turn??Math.min(8,room.length+portal.z-2);
  return {x:portal.side*(room.width/2+reach-1.5),z:portal.z-2-turn};
}
// A one-way route: into the side passage and up to its exit, with no return leg.
export function exitRoute(room,portal){
  const end=passageExit(room,portal),points=[{x:0,z:0},{x:0,z:portal.z},{x:end.x,z:portal.z},{x:end.x,z:end.z+0.45}];
  let distance=0;
  const legs=points.slice(1).map((to,i)=>{
    const start=points[i],length=Math.hypot(to.x-start.x,to.z-start.z),leg={start,end:to,length,distance};distance+=length;return leg;
  });
  return {legs,length:distance,exit:true};
}

export function routePoint(route,distance){
  const leg=route.legs.find(l=>distance<l.distance+l.length)??route.legs.at(-1);
  const u=Math.max(0,Math.min(1,(distance-leg.distance)/leg.length));
  return {x:leg.start.x+(leg.end.x-leg.start.x)*u,z:leg.start.z+(leg.end.z-leg.start.z)*u,yaw:Math.atan2(leg.start.x-leg.end.x,leg.start.z-leg.end.z)};
}
function hash(index){
  let h=Math.imul(index+1,0x45d9f3b)>>>0;h=Math.imul(h^(h>>>16),0x45d9f3b)>>>0;
  return (h^(h>>>16))>>>0;
}
const DOMESTIC=[
  spec(4,8,'bathroom','sparse','bare'),
  spec(4,8,'sala','pairedDining','redLinoleum'),
  spec(6,12,'sala','pairedDining','bare',{kitchenCorner:true}),
  spec(6,10,'kitchen','pairedDining','creamCeramic'),
  spec(4,10,'bedroom','sparse','bare'),
  spec(6,12,'bedroom','sparse','whiteTile'),
  spec(8,12,'sala','perimeter','greenCheckerboard'),
  spec(4,8,'kitchen','sparse','redLinoleum'),
  spec(6,10,'bare','sparse','concrete'),
];
const STRANGE=[
  spec(6,16,'sala','perimeter','bare',{height:3.6,shape:'deadStairs'}),
  spec(6,12,'bedroom','sparse','bare',{height:5.5}),
  spec(8,16,'kitchen','pairedDining','bare',{height:3.5,rise:-0.65}),
  spec(6,16,'sala','perimeter','bare',{height:3.6,rise:0.65}),
  spec(4,24,'bedroom','facingWall','concrete'),
  spec(4,16,'sala','sparse','bare',{shape:'branches'}),
  spec(8,20,'sala','perimeter','whiteTile',{height:3.6,shape:'cross'}),
  spec(6,12,'sala','chairStacks','bare'),
];
function mixedRoom(index){
  const cycle=Math.floor(index/7),slot=index%7;
  if(slot!==3&&slot!==6)return {...DOMESTIC[hash(Math.floor(index/2)+101)%DOMESTIC.length],length:6+2*(hash(index+2269)%4),category:'domestic'};
  const ordinal=cycle*2+(slot===6?1:0),block=Math.floor(ordinal/12);
  // One large exception per twelve strange rooms, at a seeded late-block slot.
  if(ordinal%12===6+hash(block+811)%6){
    const h=hash(ordinal+1907),kind=h%3;
    const room=kind===0?spec(24,40,'auditorium','chairRows','bare',{height:h%4===0?24:8,shape:'auditorium'}):
      kind===1?spec(18,40,'hall','sparse','bare',{height:h%4===0?24:12,shape:'colonnade'}):
      spec(18,40,'hall','sparse','bare',{height:8,shape:'colonnade',rise:-3});
    return {...room,category:'rare'};
  }
  return {...STRANGE[hash(ordinal+307)%STRANGE.length],category:'strange'};
}
function mixedFloor(room,index){
  if(room.court)return {...room,floor:'concrete'};
  if(room.yero)return {...room,floor:'bare'};
  if(index<3||room.rise||room.category==='rare')return {...room,floor:'bare'};
  // Bare cement most of the time; plain white tile is the usual finished floor. An image floor
  // is drawn from the tile bank and is white tile when the bank is empty.
  const roll=hash(Math.floor(index/2)+4299)%100;
  return {...room,floor:roll<68?'bare':roll<73?'concrete':roll<87?'whiteTile':roll<90?'imageTile':roll<93?'maroonTile':roll<96?'creamCeramic':roll<98?'redLinoleum':roll<99?'greenCheckerboard':'abruptPatches'};
}
// The demo run: a fixed four-room opening, then generated shells.
function createDemoRooms(seed,generate){
  const intro=[spec(6,6,'sala','sparse','bare',{kitchenCorner:true}),spec(6,8,'kitchen','pairedDining','bare'),spec(4,6,'bathroom','sparse','bare'),spec(4,8,'bedroom','sparse','bare')];
  return index=>mixedFloor(index<intro.length?{...intro[index],category:'domestic'}:generate(index,seed),index);
}

// `generate(index,seed)` supplies demo shells; this module stays free of imports.
export function createRoomSequence({sequence,widths=[],lengths=[],type,seed=5,generate}={}){
  // Cache phrase starts, rather than retaining every room in an endless run.
  const starts=[0];
  const forced=SEQUENCE_NAMES.includes(sequence);
  const demoRooms=generate&&createDemoRooms(seed,generate);
  const make=i=>sequence==='demo'&&demoRooms?demoRooms(i):forced?PHRASES[sequence][i%PHRASES[sequence].length]:mixedFloor(mixedRoom(i),i);
  // A shell is the same every time it is asked for, and the walk asks for the same few several times
  // a frame. The recent ones are kept; nothing that reads one changes it.
  const recent=new Map();
  const raw=i=>{let shell=recent.get(i);if(!shell){if(recent.size>=256)recent.clear();recent.set(i,shell=make(i));}return shell;};
  const lengthAt=i=>lengths.length?lengths[i%lengths.length]:raw(i).length;
  function room(index){
    if(!Number.isInteger(index)||index<0)throw new RangeError('Room index must be a nonnegative integer');
    const phrase=Math.floor(index/4);
    while(starts.length<=phrase){const p=starts.length-1;starts.push(starts[p]+[0,1,2,3].reduce((sum,j)=>sum+lengthAt(p*4+j),0));}
    let distance=starts[phrase];for(let j=phrase*4;j<index;j++)distance+=lengthAt(j);
    return {...raw(index),index,phrase:forced?sequence:raw(index).category,startZ:-distance,length:lengthAt(index),
      width:widths.length?widths[index%widths.length]:raw(index).width,type:type||raw(index).type};
  }
  function atDistance(distance){
    distance=Math.max(0,distance);
    while(starts.at(-1)<=distance)room(starts.length*4);
    let lo=0,hi=starts.length-1;
    while(lo+1<hi){const mid=(lo+hi)>>1;if(starts[mid]<=distance)lo=mid;else hi=mid;}
    for(let i=lo*4;i<lo*4+4;i++){const r=room(i);if(distance< -r.startZ+r.length)return r;}
    return room((lo+1)*4);
  }
  return {room,atDistance};
}
