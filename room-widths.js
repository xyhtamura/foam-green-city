// Room widths remain whole 2 m wall modules. Furniture stays in metres.
export const ROOM_WIDTHS=[4,6,8,10,12,18,24];

export function seededRoomWidth(index){
  let hash=Math.imul(index+1,0x45d9f3b)>>>0;
  hash=Math.imul(hash^(hash>>>16),0x45d9f3b)>>>0;
  const value=((hash^(hash>>>16))>>>0)/4294967296;
  return value<0.4?4:value<0.75?6:8;
}

export function partitionPieces(width){
  const parts=[{name:'wallDoorway',x:-1}];
  for(let x=1;x<width/2;x+=2){
    const span=Math.min(2,width/2-x),name=span===2?'wall':'wallHalf';
    parts.push({name,x},{name,x:-x-span});
  }
  return parts;
}

export function furnitureLanes(width){
  return Array.from({length:width/2-1},(_,i)=>1.42+i);
}
