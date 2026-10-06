// Room shells drawn from distributions. Nothing here names a particular strange room:
// two slow fields along the route widen the tails of each dimension and switch on
// features, and an unusual room is whatever those draws happen to coincide in.
import {ORDINARY_LAYOUT_IDS,ODD_LAYOUT_IDS} from './furniture-layouts.js?v=73a43d5120';

// A full avalanche mix of index and salt, so neighbouring indices and nearby salts are unrelated.
function unit(n,salt){
  let h=(Math.imul(n|0,0x9E3779B1)^Math.imul(salt|0,0x85EBCA6B))>>>0;
  h^=h>>>16;h=Math.imul(h,0x85EBCA6B);h^=h>>>13;h=Math.imul(h,0xC2B2AE35);h^=h>>>16;
  return (h>>>0)/4294967296;
}
// Smooth value noise over the room index, so neighbouring rooms share a mood.
function field(x,salt){
  const i=Math.floor(x),t=x-i,u=t*t*(3-2*t);
  return unit(i,salt)*(1-u)+unit(i+1,salt)*u;
}
const even=n=>2*Math.round(n/2);
const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
const pick=(list,u)=>list[Math.min(list.length-1,Math.floor(u*list.length))];

// Strangeness is zero for most rooms and rises in short stretches; scale drifts more slowly.
export function roomPressure(index,seed=5){
  if(index<5)return {strange:0,scale:0};
  const wave=field(index/4.5,seed*7+11),spike=unit(index,seed*7+13);
  const strange=Math.max(clamp((wave-0.78)/0.22,0,1),spike>0.975?(spike-0.975)/0.025:0);
  const scale=clamp((field(index/31,seed*7+17)-0.5)/0.5,0,1);
  return {strange,scale};
}

// Some stretches of the route are all kitchen or all bathroom. A third slow field picks them.
export function roomZone(index,seed=5){
  if(index<5)return null;
  const n=field(index/6,seed*7+19);
  return n>0.83?'kitchen':n<0.17?'bathroom':null;
}

// Layouts whose pieces depend on each other cannot be thinned, so they stay in rooms they fill sensibly.
const DENSE=['tableRows','pairedDining','chairsOnTables','facingWall','pushedAside'];
const ORDINARY={
  sala:['pairedDining','pairedDining','perimeter','sparse','gathered'],
  kitchen:['pairedDining','tableRows','sparse','gathered'],
  bedroom:['sparse','sparse','pairedDining'],
  bathroom:['sparse'],bare:['sparse'],
  hall:['sparse','sparse','perimeter','chairRows','gathered'],
  auditorium:['chairRows'],
};

export function generateRoom(index,seed=5){
  const r=n=>unit(index,seed*7+100+n),{strange:s,scale}=roomPressure(index,seed);
  // Dimensions: a domestic base, plus a tail that only opens under pressure.
  const reach=s*(0.35+0.65*scale);
  // Ordinary rooms are small: mostly 4 or 6 m wide and 6 or 8 m long.
  const zone=roomZone(index,seed);
  let width=pick([4,4,4,4,4,4,4,6,6,6,6,8],r(1))+even(reach*Math.pow(r(2),2.2)*72);
  let length=pick([6,6,6,6,6,8,8,8,8,10,12],r(3))+even(s*Math.pow(r(4),1.6)*(18+34*scale));
  let height=2.58+Math.round(s*Math.pow(r(5),2.6)*(8+26*scale)*5)/5;
  const tidy=n=>Math.round(n*100)/100;
  width=clamp(width,4,80);length=clamp(length,6,64);
  // A bathroom keeps to the narrowest width, in a bathroom zone as anywhere else.
  if(zone==='bathroom'&&width<10&&length<20&&height<5)width=4;
  // Floor level: a rise or a pit, limited by how long the room has to ramp.
  let rise=0;
  if(length>=12&&r(6)<s*0.4){
    const limit=Math.min(3,0.3*length/4),amount=Math.round((0.4+r(7)*(limit-0.4))*10)/10;
    rise=r(8)<0.55?-amount:amount;
  }
  if(height-rise<2.58)height=2.58+rise;
  height=tidy(height);
  // Features are independent draws, so they can coincide.
  // Each passage draws its own wall position, reach, return length, and height.
  const passages=[];
  if(length>=12&&r(9)<0.02+s*0.5){
    const first=r(26)<0.5?-1:1;
    for(let n=0;n<(r(10)<0.35?2:1);n++){
      const q=k=>r(30+n*8+k),j=1+Math.floor(q(0)*((length-6)/2));
      passages.push({side:n?-first:first,j,reach:5+Math.round(q(1)*9),turn:2+Math.round(q(2)*8),height:Math.min(height,tidy(2.4+q(3)*q(3)*2.4))});
    }
  }
  const shape=passages.length===2?'cross':passages.length===1?'branches':'rectangle';
  let stairs=null;
  if(width>=6&&length>=14&&passages.length<2&&r(11)<s*0.4){
    const most=Math.min(20,Math.floor((height-1.1)/0.18));
    if(most>=4)stairs={steps:clamp(Math.round(4+r(12)*16),4,most),side:passages.length?-passages[0].side:r(27)<0.5?-1:1,wooden:r(13)<0.7};
  }
  let columns=null;
  if(width>=10&&r(14)<(width>=24?0.55:0.15)+s*0.35){
    const inset=3+Math.round(r(15)*2),across=4+Math.round(r(16)*4);
    columns={inset,across,spacing:4+2*Math.round(r(17)*2),rows:1+Math.floor(r(18)*r(18)*Math.max(0,(width/2-inset-1.5)/across+1))};
  }
  // A platform spans the far end, so it does not share a room with stairs or passages.
  const platform=width>=10&&length>=16&&!rise&&!stairs&&!passages.length&&r(19)<s*0.45
    ?{depth:2+Math.round(r(28)*Math.min(6,length/4-2)),height:tidy(0.3+r(29)*0.9),inset:tidy(1.2+r(50)*r(50)*Math.min(3,width/2-4)),sides:r(51)<0.7?[-1,1]:[r(52)<0.5?-1:1]}:null;
  // Use: large shells stop being domestic rooms.
  const large=width>=10||length>=20||height>=5;
  let type=platform?'auditorium':large?'hall':zone??pick(width===4?['sala','sala','kitchen','bedroom','bedroom','bathroom','bathroom','bare']:['sala','sala','sala','kitchen','kitchen','bedroom','bedroom','bare'],r(20));
  const kitchenCorner=type==='sala'&&width>=6&&!s&&r(21)<0.25;
  const roomy=width*length<=120;
  let layout=pick(ORDINARY[type],r(22));
  if(type!=='bathroom'&&type!=='auditorium'&&r(23)<0.07+s*0.5)layout=pick(ODD_LAYOUT_IDS,r(24));
  if(!roomy&&DENSE.includes(layout))layout=pick(['sparse','perimeter','ring','chairStacks','tableStacks','gathered'],r(25));
  if(!ORDINARY_LAYOUT_IDS.includes(layout)&&!ODD_LAYOUT_IDS.includes(layout))layout='sparse';
  // The category is read off the result, not off the pressure that produced it.
  const plain=shape==='rectangle'&&!stairs&&!columns&&!platform&&!rise&&height===2.58&&width<=8&&length<=12;
  const category=plain?'domestic':width>=24||height>=12||length>=40?'rare':'strange';
  return {width,length,height,rise,shape,type,layout,floor:'bare',category,strangeness:Math.round(s*100)/100,...(zone?{zone}:{}),
    ...(passages.length?{passages}:{}),...(stairs?{stairs}:{}),...(columns?{columns}:{}),...(platform?{platform}:{}),...(kitchenCorner?{kitchenCorner}:{})};
}
