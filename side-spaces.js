// Seeded local rectangles shared by rendering and manual navigation.
function hash(n){let h=Math.imul(n+1,0x45d9f3b)>>>0;h=Math.imul(h^(h>>>16),0x45d9f3b)>>>0;return (h^(h>>>16))>>>0;}
// A plain shell has no passages, stairs, columns, or platform.
export const plainRoom=room=>room.shape==='rectangle'&&!room.stairs&&!room.columns&&!room.platform;
export function branchOpenings(room){
  if(room.length>=12&&['branches','cross'].includes(room.shape)){
    const j=Math.floor(room.length/4);
    return (room.shape==='cross'?[-1,1]:[room.index%2?-1:1]).map(side=>({side,j,z:-j*2-2,kind:'legacy'}));
  }
  if(room.sideSpaces==='off'||room.length<6||room.width>8||room.height>4||room.rise||!plainRoom(room))return [];
  const h=hash((room.index??0)+(room.branchSeed??5)*193);
  if(!['room','hallway'].includes(room.sideSpaces)&&h%100>=34)return [];
  const j=Math.max(0,Math.floor(room.length/4)-1),side=h%2?-1:1;
  return [{side,j,z:-j*2-2,kind:room.sideSpaces==='hallway'||(room.sideSpaces!=='room'&&h%3===0)?'hallway':'room',door:h%3!==1,variant:h%3}];
}
export function sideSpacePlan(room,portal){
  const {side,z}=portal,W=room.width/2,depth=3+(portal.variant??0)*0.4;
  const corridor=portal.kind==='hallway'?2.4+(portal.variant??0)*0.6:0;
  const span=2.8+(portal.variant??0)*0.3,opening=portal.door?1.15:1.6;
  const rect=(from,to,half)=>({minX:side>0?from:-to,maxX:side>0?to:-from,minZ:z-half,maxZ:z+half});
  const rectangles=[];
  if(corridor)rectangles.push(rect(W,W+corridor,0.85));
  const roomRect=rect(W+corridor,W+corridor+depth,span/2);rectangles.push(roomRect);
  const xs=[...new Set(rectangles.flatMap(r=>[r.minX,r.maxX]))].sort((a,b)=>a-b);
  const zs=[...new Set(rectangles.flatMap(r=>[r.minZ,r.maxZ]))].sort((a,b)=>a-b);
  const inside=(x,z)=>rectangles.some(r=>x>r.minX&&x<r.maxX&&z>r.minZ&&z<r.maxZ);
  const walls=[];
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){
    const x=(xs[i]+xs[i+1])/2,cz=(zs[j]+zs[j+1])/2;if(!inside(x,cz))continue;
    for(const [axis,edge,a,b,checkX,checkZ] of [
      ['x',xs[i],zs[j],zs[j+1],xs[i]-0.001,cz],['x',xs[i+1],zs[j],zs[j+1],xs[i+1]+0.001,cz],
      ['z',zs[j],xs[i],xs[i+1],x,zs[j]-0.001],['z',zs[j+1],xs[i],xs[i+1],x,zs[j+1]+0.001]]){
      if(inside(checkX,checkZ)||(axis==='x'&&Math.abs(edge-side*W)<1e-6))continue;
      walls.push({axis,edge,a,b});
    }
  }
  // Replace the skipped four-metre wall strip with a narrower usable doorway.
  walls.push({axis:'x',edge:side*W,a:z-2,b:z-opening/2},{axis:'x',edge:side*W,a:z+opening/2,b:z+2});
  const regions=rectangles.map(r=>({minX:r.minX+0.12,maxX:r.maxX-0.12,minZ:r.minZ+0.12,maxZ:r.maxZ-0.12}));
  const join=rect(W-0.35,W+(corridor||depth)-0.15,opening/2);regions.push(join);
  if(corridor)regions.push(rect(W+corridor-0.35,W+corridor+0.35,0.73));
  const wallBlocks=()=>walls.map(w=>w.axis==='x'?{minX:w.edge-0.06,maxX:w.edge+0.06,minZ:w.a,maxZ:w.b}:{minX:w.a,maxX:w.b,minZ:w.edge-0.06,maxZ:w.edge+0.06});
  const blocks=[],fixtures=[];
  // A shallow storage ledge leaves the centre and entrance clear.
  const fx=side*(W+corridor+depth-0.3);
  const furnishing=['bedroom','storage','washroom','bare'].includes(room.sideRoom)?room.sideRoom:['bedroom','bedroom','storage','storage','washroom'][hash((room.index??0)+(room.branchSeed??5)*307)%5];
  const bedroom=furnishing==='bedroom',storage=furnishing==='storage',washroom=furnishing==='washroom';
  if(bedroom){
    fixtures.push({role:'bed',x:side*(W+corridor+depth/2+0.18),z:z-span/2+0.64,w:2.05,d:0.95,h:1.25,model:(portal.variant??0)===0?'phDaybed':'bedSingle'});
    fixtures.push({role:'drawers',x:side*(W+corridor+depth-.36),z:z+span/2-0.45,w:0.5,d:0.46,h:0.82,model:'plasticDrawers'});
  }else if(storage){
    fixtures.push({role:'storageShelf',x:side*(W+corridor+depth-.75),z:z-span/2+.4,w:1.1,d:.48,h:1.7});
    fixtures.push({role:'storageStack',x:side*(W+corridor+.65),z:z-span/2+.42,w:.65,d:.52,h:.85});
    fixtures.push({role:'drawers',x:side*(W+corridor+depth-.36),z:z+span/2-.45,w:.5,d:.46,h:.82,model:'plasticDrawers'});
    fixtures.push({role:'bucket',x:side*(W+corridor+depth-1.25),z:z+span/2-.4,w:.4,d:.4,h:.4,model:(portal.variant??0)%2?'bucketPink':'bucket'});
  }else if(washroom){
    fixtures.push({role:'toilet',x:side*(W+corridor+depth-.52),z:z+span/2-.5,w:.8,d:.65,h:.76,model:'toilet'});
    fixtures.push({role:'sink',x:side*(W+corridor+depth-.4),z:z-span/2+.5,w:.5,d:.65,h:.84,model:'bathroomSink'});
    fixtures.push({role:'bucket',x:side*(W+corridor+depth-.75),z,w:.4,d:.4,h:.36,model:(portal.variant??0)%2?'bucketPink':'bucket'});
  }else fixtures.push({x:fx,z:z+span/2-0.45,w:0.4,d:0.65,h:0.7});
  // Walls are added after the exit is cut, with the doorway itself closed to the walker.
  const addWalls=()=>{blocks.push(...wallBlocks());};
  for(const f of fixtures)blocks.push({minX:f.x-f.w/2,maxX:f.x+f.w/2,minZ:f.z-f.d/2,maxZ:f.z+f.d/2});
  // Some side rooms are passageways: a doorway in the far wall, kept only where no fixture stands in front of it.
  const farX=side*(W+corridor+depth),exitZ=z+0.25,exitHalf=0.43;
  const approach={minX:Math.min(farX,farX-side*0.95),maxX:Math.max(farX,farX-side*0.95),minZ:exitZ-exitHalf,maxZ:exitZ+exitHalf};
  const wanted=room.sideExits==='all'||(room.sideExits!=='off'&&hash((room.index??0)+(room.branchSeed??5)*457)%100<30);
  const exit=wanted&&!fixtures.some(f=>f.x+f.w/2>approach.minX&&f.x-f.w/2<approach.maxX&&f.z+f.d/2>approach.minZ&&f.z-f.d/2<approach.maxZ)
    ?{x:farX,z:exitZ,half:exitHalf,side,zone:{minX:Math.min(farX,farX-side*0.75),maxX:Math.max(farX,farX-side*0.75),minZ:exitZ-exitHalf,maxZ:exitZ+exitHalf}}:null;
  if(exit){
    const at=walls.findIndex(w=>w.axis==='x'&&Math.abs(w.edge-farX)<1e-6&&w.a<exitZ&&w.b>exitZ),wall=walls[at];
    walls.splice(at,1,{...wall,b:exitZ-exitHalf},{...wall,a:exitZ+exitHalf});
  }
  if(portal.door)blocks.push({minX:side>0?W: -W-opening+0.1,maxX:side>0?W+opening-0.1:-W,minZ:z+opening/2-0.025,maxZ:z+opening/2+0.025});
  addWalls();
  return {exit,rectangles,regions,walls,blocks,fixtures,bedroom,storage,washroom,furnishing,variant:portal.variant??0,roomRect,opening,height:Math.min(room.height,2.8),kind:portal.kind,door:portal.door};
}
