import * as THREE from 'three';
export const RICE_STORAGE_TYPES=['sack','riceBin','storageTub','scoop'];
export function createRiceStorageKit({patchMaterial=m=>m}={}){
 const materials=new Set(),cache=new Map();
 function mat(c){if(!cache.has(c)){const m=patchMaterial(new THREE.MeshLambertMaterial({color:c,side:THREE.DoubleSide}));cache.set(c,m);materials.add(m);}return cache.get(c);}
 function create(type,{open=false,colour=0xb6b591,accent=0x637e76,fill=.72,seed=1,scoop=true}={}){
  if(!RICE_STORAGE_TYPES.includes(type)||!Number.isFinite(fill)||fill<0||fill>1||!Number.isInteger(seed))throw new Error('Invalid rice storage options');
  const g=new THREE.Group(),owned=new Set();g.name='rice-storage-'+type;
  const mesh=(geo,m,parent=g)=>{owned.add(geo);const o=new THREE.Mesh(geo,m);parent.add(o);return o;};
  const box=(x,y,z,w,h,d,c)=>{const o=mesh(new THREE.BoxGeometry(w,h,d),mat(c));o.position.set(x,y,z);return o;};
  function bowl(parent,x,y,z){const o=mesh(new THREE.SphereGeometry(.045,16,6,0,Math.PI*2,Math.PI/2,Math.PI/2),mat(0xd9d9c6),parent);o.scale.set(1,.6,1.2);o.position.set(x,y,z);const handle=mesh(new THREE.BoxGeometry(.018,.01,.11),mat(0xd9d9c6),parent);handle.position.set(x,y-.007,z+.09);}
  let randomState=seed>>>0;const random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
  function rice(y,rx,rz,rect=false){const surface=mesh(rect?new THREE.PlaneGeometry(rx*2,rz*2):new THREE.CircleGeometry(1,32),mat(0xe2d9b7));surface.rotation.x=-Math.PI/2;surface.position.y=y;if(!rect)surface.scale.set(rx,rz,1);
   const geometry=new THREE.SphereGeometry(.0035,5,3);owned.add(geometry);const grains=new THREE.InstancedMesh(geometry,mat(0xf0e8cb),80);const dummy=new THREE.Object3D();for(let i=0;i<80;i++){let x,z;if(rect){x=(random()-.5)*rx*1.95;z=(random()-.5)*rz*1.95;}else{const a=random()*Math.PI*2,r=Math.sqrt(random())*.95;x=Math.cos(a)*r*rx;z=Math.sin(a)*r*rz;}dummy.position.set(x,y+.002,z);dummy.scale.set(.7,.5,1.6);dummy.rotation.y=random()*Math.PI;dummy.updateMatrix();grains.setMatrixAt(i,dummy.matrix);}g.add(grains);
  }
  if(type==='scoop')bowl(g,0,.03,0);
  if(type==='sack'){
   const points=[[0,0],[.12,.01],[.17,.07],[.19,.21],[.17,.37],[open?.13:.105,.46]].map(p=>new THREE.Vector2(...p));const body=mesh(new THREE.LatheGeometry(points,24),mat(colour));body.scale.z=.68;
   if(open){const lip=mesh(new THREE.TorusGeometry(.13,.011,6,32),mat(colour));lip.rotation.x=Math.PI/2;lip.scale.y=.68;lip.position.y=.46;const lining=mesh(new THREE.CylinderGeometry(.121,.14,.06,24,1,true),mat(0x8f9075));lining.scale.z=.68;lining.position.y=.427;if(fill>0){rice(.07+fill*.36,.12,.078);if(scoop)bowl(g,.025,.077+fill*.36,.01);}}
   else{const closure=mesh(new THREE.SphereGeometry(1,20,8,0,Math.PI*2,0,Math.PI/2),mat(colour));closure.scale.set(.105,.045,.0714);closure.position.y=.46;box(0,.507,0,.205,.013,.015,accent);}
   // Generic coloured print blocks suggest a reused sack without brand artwork.
   box(0,.26,.125,.22,.105,.002,accent);box(0,.26,.127,.15,.017,.002,0xded8bd);box(0,.23,.127,.10,.009,.002,0xded8bd);
  }
  if(type==='riceBin'){
   const w=.34,d=.30,h=.43,t=.012;box(0,t/2,0,w,t,d,colour);box(-w/2+t/2,h/2,0,t,h,d,colour);box(w/2-t/2,h/2,0,t,h,d,colour);box(0,h/2,-d/2+t/2,w-t*2,h,t,colour);box(0,h/2,d/2-t/2,w-t*2,h,t,colour);
   for(const x of [-.18,.18])box(x,.34,0,.025,.055,.085,accent);
   if(open){if(fill>0){rice(.035+fill*.35,.155,.135,true);if(scoop)bowl(g,.05,.042+fill*.35,0);}const lid=box(0,.40,-.20,.36,.018,.32,accent);lid.rotation.x=-1.15;const handle=mesh(new THREE.BoxGeometry(.085,.015,.02),mat(accent),lid);handle.position.y=.017;}
   else{box(0,.44,0,.36,.022,.32,accent);box(0,.462,0,.09,.02,.035,accent);}
  }
  if(type==='storageTub'){
   const points=[[0,0],[.105,0],[.12,.025],[.14,.24],[.15,.25],[.15,.262],[.137,.262],[.128,.24],[.108,.018],[0,.018]].map(p=>new THREE.Vector2(...p));mesh(new THREE.LatheGeometry(points,24),mat(colour));
   if(open){if(fill>0){rice(.025+fill*.205,.123,.123);if(scoop)bowl(g,.015,.032+fill*.205,0);}const lid=mesh(new THREE.CylinderGeometry(.15,.15,.012,24),mat(accent));lid.position.set(.25,.008,0);box(.25,.02,0,.07,.016,.025,accent);}
   else{const lid=mesh(new THREE.CylinderGeometry(.153,.153,.017,24),mat(accent));lid.position.y=.268;box(0,.285,0,.07,.015,.025,accent);}
  }
  g.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(g);for(const o of g.children)o.position.y-=b.min.y;g.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(g);g.userData.bounds={minX:b.min.x,maxX:b.max.x,minY:b.min.y,maxY:b.max.y,minZ:b.min.z,maxZ:b.max.z};g.userData.anchor='floor';g.userData.riceStorage={type,open,fill,seed};g.userData.dispose=()=>{owned.forEach(o=>o.dispose());g.traverse(o=>{if(o.isInstancedMesh)o.dispose();});owned.clear();};return g;
 }
 return {create,materials,dispose(){materials.forEach(m=>m.dispose());cache.clear();materials.clear();}};
}
