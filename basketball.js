// A low-poly basketball in metres, resting at local y=0. Same conventions as the mesh kits:
// shared geometry and materials, and `userData.supportBounds` on each object.
export const BALL_COLOURS={orange:0xc8642a,worn:0xa9603a,dusty:0x9a6b4c,dark:0x7d4a2c};
const RADIUS=0.12;

let shared=null;
export function createBasketball(THREE,{colour='orange',scale=1,seed=1}={}){
  if(!shared){
    // Eight seam panels: three great circles, and a smaller circle on each side.
    const tube=0.004,ring=r=>new THREE.TorusGeometry(r,tube,4,20);
    shared={ball:new THREE.SphereGeometry(RADIUS,14,10),great:ring(RADIUS+0.001),side:ring(Math.sqrt(RADIUS*RADIUS-0.066*0.066)+0.001),
      seam:new THREE.MeshLambertMaterial({color:0x1f1a17}),skins:new Map()};
  }
  const hex=BALL_COLOURS[colour]??colour;
  if(!shared.skins.has(hex))shared.skins.set(hex,new THREE.MeshLambertMaterial({color:hex}));
  const group=new THREE.Group(),ball=new THREE.Group();group.name='basketball';
  ball.add(new THREE.Mesh(shared.ball,shared.skins.get(hex)));
  const seam=(geometry,rx,ry,z=0)=>{const m=new THREE.Mesh(geometry,shared.seam);m.rotation.set(rx,ry,0);m.position.z=z;ball.add(m);};
  seam(shared.great,0,0);seam(shared.great,Math.PI/2,0);seam(shared.great,0,Math.PI/2);
  seam(shared.side,0,0,0.066);seam(shared.side,0,0,-0.066);
  // It stopped rolling at some arbitrary angle.
  let state=(Math.imul(seed+1,2654435761)>>>0)||1;
  const r=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  ball.rotation.set(r()*6.283,r()*6.283,r()*6.283);ball.position.y=RADIUS+0.004;
  group.add(ball);group.scale.setScalar(scale);group.userData.basketball={colour,scale};
  const reach=(RADIUS+0.005)*scale;
  group.userData.supportBounds={minX:-reach,maxX:reach,minZ:-reach,maxZ:reach,height:2*reach};
  return group;
}
