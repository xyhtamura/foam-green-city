// Image anchors: sag ends are at the top; straight ends are at half-height.
// The sag image is stretched down from its top edge, so its two top corners stay on the anchors
// whatever its height. Each sagging length draws its own drop, from nearly taut to half a metre,
// with shallow drops the more common.
export const SAG={least:0.08,most:0.5};
function sagDrop(seed,i){
  let h=Math.imul(seed+1,0x9E3779B1)^Math.imul(i+1,0x85EBCA6B);
  h=Math.imul(h^(h>>>15),0x2C1B3C6D);h=Math.imul(h^(h>>>12),0x297A2D39);
  const u=((h^(h>>>15))>>>0)/4294967296;
  return SAG.least+(SAG.most-SAG.least)*u*u;
}
export function wireRunPlan({span=1.8,anchorY=2.1,seed=0}={}){
  const patterns=[['line','sag','line'],['sag','sag'],['line','line','sag'],['sag','line','sag']];
  const pattern=patterns[((seed%patterns.length)+patterns.length)%patterns.length];
  const width=span/pattern.length;
  return pattern.map((kind,i)=>{
    const height=kind==='sag'?sagDrop(seed,i):0.18;
    return {kind,file:kind==='sag'?'wiresag.png':'wireline.png',width,height,
      x:(i+0.5)*width-span/2,y:anchorY-(kind==='sag'?height/2:0),
      left:[i*width-span/2,anchorY],right:[(i+1)*width-span/2,anchorY]};
  });
}

// A run across a ceiling goes from the top of a side wall to the room's light. It is tried in three
// rooms of ten, in rooms up to 8 m wide; in a wider room the lengths would be stretched too far.
export function ceilingWirePlan({index=0,width=4,fixtureEnd=0.05}={}){
  let h=Math.imul(index+1,0x7FEB352D)^0x51ED270B;h=Math.imul(h^(h>>>15),0x2C1B3C6D);h=Math.imul(h^(h>>>12),0x297A2D39);h=(h^(h>>>15))>>>0;
  if(width>8||h%10>=3)return null;
  const side=h&16?1:-1,span=width/2-0.1-fixtureEnd;
  return {side,span,x:side*(fixtureEnd+span/2),seed:(h>>>8)%997};
}
// With `ceiling`, anchorY is the ceiling: a sagging length hangs from it as on a wall, and a straight
// length lies flat against it.
export function createWireRun({THREE,materials,span,anchorY,seed,ceiling=false}={}){
  const group=new THREE.Group();group.userData.wireRun=true;
  const plan=wireRunPlan({span,anchorY,seed});group.userData.plan=plan;
  for(const p of plan){
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(p.width,p.height,4,1),materials[p.kind]);
    mesh.position.set(p.x,p.y,0);mesh.userData.own=true;group.add(mesh);
    if(ceiling&&p.kind==='line'){mesh.rotation.x=Math.PI/2;mesh.position.y=anchorY-0.006;}
  }
  return group;
}
