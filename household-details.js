import * as THREE from 'three';
export const DETAIL_TYPES=['helmet','paperPlate','screenDoor','screenWindow','clock','clothesline','dryingStand','hangerRack','hangingClothes'];
export function createHouseholdDetailsKit({patchMaterial=m=>m}={}){
 const geometries=new Set(),materials=new Set(),textures=new Set(),cache=new Map();
 const geo=g=>{geometries.add(g);return g;};
 function material(c){if(!cache.has(c)){const m=patchMaterial(new THREE.MeshLambertMaterial({color:c,side:THREE.DoubleSide}));materials.add(m);cache.set(c,m);}return cache.get(c);}
 function mesh(g,m,p){const o=new THREE.Mesh(geo(g),m);p.add(o);return o;}
 function box(p,x,y,z,w,h,d,c){const o=mesh(new THREE.BoxGeometry(w,h,d),material(c),p);o.position.set(x,y,z);return o;}
 function rod(p,a,b,r,c){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);const o=mesh(new THREE.CylinderGeometry(r,r,d.length(),6),material(c),p);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
 let screenMat;
 function screen(p,w,h){if(!screenMat){const c=document.createElement('canvas');c.width=c.height=16;const ctx=c.getContext('2d');ctx.clearRect(0,0,16,16);ctx.fillStyle='#444b46';ctx.fillRect(0,0,2,16);ctx.fillRect(0,0,16,2);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;textures.add(t);screenMat=patchMaterial(new THREE.MeshLambertMaterial({color:0xa9b1a8,map:t,transparent:true,alphaTest:.1,side:THREE.DoubleSide,depthWrite:false}));materials.add(screenMat);}
  // Per-object UV scaling leaves the shared texture unchanged.
  const g=new THREE.PlaneGeometry(w,h);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w*75,uv.getY(i)*h*75);const o=mesh(g,screenMat,p);o.position.y=h/2;return o;
 }
 function garment(p,type,x,y,z,scale,c){const s=new THREE.Shape();const points=type==='shirt'?[[-.11,0],[-.22,-.08],[-.17,-.19],[-.11,-.15],[-.11,-.36],[.11,-.36],[.11,-.15],[.17,-.19],[.22,-.08],[.11,0],[.045,-.025],[-.045,-.025]]:type==='shorts'?[[-.14,0],[-.15,-.24],[-.02,-.24],[0,-.12],[.02,-.24],[.15,-.24],[.14,0]]:[[-.13,0],[-.15,-.47],[-.025,-.47],[0,-.13],[.025,-.47],[.15,-.47],[.13,0]];points.forEach(([a,b],i)=>i?s.lineTo(a,b):s.moveTo(a,b));s.closePath();const o=mesh(new THREE.ShapeGeometry(s),material(c),p);o.position.set(x,y,z);o.scale.setScalar(scale);o.rotation.y=Math.sin(x*8)*.16;return o;}
 function hanger(p,x,y,z,scale=1,colour=0x438eca){
  // Rounded plastic outline with shoulder notches and an open hook.
  const outline=[[-.17,-.02],[-.095,.014],[0,.027],[.095,.014],[.17,-.02]];
  const points=outline.map(([a,b])=>new THREE.Vector3(x+a*scale,y+b*scale,z));
  const body=new THREE.CatmullRomCurve3(points,false,'centripetal',.15);mesh(new THREE.TubeGeometry(body,72,.005*scale,6,false),material(colour),p);
  const hook=new THREE.CatmullRomCurve3([[0,.027],[-.012,.075],[-.012,.117],[.012,.14],[.04,.13],[.048,.104]].map(([a,b])=>new THREE.Vector3(x+a*scale,y+b*scale,z)));
  mesh(new THREE.TubeGeometry(hook,24,.005*scale,6,false),material(colour),p);
 }
 function clothes(p,length,count,y,z,sag,hangers,palette,hangerColour,seed,clusterStrength,pegOrientation){
  let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  // Small gaps form groups; occasional wider gaps separate them.
  const distances=[0];for(let i=1;i<count;i++){const clustered=random()<.28?2.5+random()*2:.12+random()*.25;distances.push(distances[i-1]+(1-clusterStrength)+clusterStrength*clustered);}
  const total=distances[count-1]||1;
  for(let i=0;i<count;i++){
   const u=count===1?.5:.1+.8*distances[i]/total,x=(u-.5)*length,top=y-sag*Math.sin(Math.PI*u),c=palette[i%palette.length];
   if(hangers){const assembly=new THREE.Group();p.add(assembly);hanger(assembly,0,-.10,0,.8,hangerColour);const cloth=garment(assembly,['shirt','shorts','trousers'][i%3],0,-.12,.004,.8,c);cloth.rotation.y=0;assembly.rotation.y=Math.PI/2;assembly.position.set(x,top,z);}
   else{const assembly=new THREE.Group();p.add(assembly);const cloth=garment(assembly,['shirt','shorts','trousers'][i%3],0,0,0,.8,c);cloth.rotation.y=0;for(const dx of [-.06,.06])box(assembly,dx,.01,0,.015,.035,.015,0xd2bda0);const transverse=pegOrientation==='transverse'||(pegOrientation==='mixed'&&random()<.5);assembly.rotation.y=transverse?Math.PI/2:0;assembly.position.set(x,top,z);}
  }
 }
 function create(type,{width=1,height=1.8,depth=.50,length=1.8,sag=.09,count=5,colour=0x779591,palette=[0xadb2a4,0x8f707d,0x697f9b,0xc4af79],hangers=false,hangerColour=0x438eca,seed=1,clusterStrength=.85,pegOrientation='mixed',hour=10,minute=10,helmetStyle='openFace'}={}){
  if(!DETAIL_TYPES.includes(type))throw new Error('Unknown household detail');
  if(![width,height,depth,length].every(v=>Number.isFinite(v)&&v>0)||!Number.isFinite(sag)||sag<0||!Number.isInteger(count)||count<0||count>24||!palette.length||![hour,minute].every(Number.isFinite))throw new Error('Invalid dimensions, count, palette or time');
  if(!['along','transverse','mixed'].includes(pegOrientation))throw new Error('Unknown peg orientation');
  if(!Number.isInteger(seed)||!Number.isFinite(clusterStrength)||clusterStrength<0||clusterStrength>1)throw new Error('Invalid cluster seed or strength');
  if(!['openFace','fullFace'].includes(helmetStyle))throw new Error('Unknown helmet style');
  const p=new THREE.Group();p.name='detail-'+type;
  if(type==='helmet'){
   // A hollow upper shell, padded opening and visor face local +Z.
   const shell=mesh(new THREE.SphereGeometry(.16,24,12,0,Math.PI*2,0,Math.PI*.61),material(colour),p);shell.position.y=.13;
   const rim=mesh(new THREE.TorusGeometry(.15,.012,6,32),material(0x333936),p);rim.rotation.x=Math.PI/2;rim.position.y=.075;
   const visor=mesh(new THREE.SphereGeometry(.165,20,8,Math.PI*.24,Math.PI*.52,Math.PI*.36,Math.PI*.25),material(0x394c51),p);visor.position.y=.13;
   if(helmetStyle==='fullFace')box(p,0,.065,.125,.23,.07,.05,colour);
   rod(p,[-.12,.08,0],[0,.005,0],.008,0x343936);rod(p,[0,.005,0],[.12,.08,0],.008,0x343936);
  }
  if(type==='paperPlate'){
   const positions=[],indices=[],rings=5,n=96;for(let j=0;j<=rings;j++)for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,r=.13*j/rings,frill=j>=4?Math.cos(a*48)*.002*(j-3):0;positions.push(Math.cos(a)*(r+frill),j<4?.005:.005+(j-3)*.012+frill,Math.sin(a)*(r+frill));}for(let j=0;j<rings;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i;indices.push(a,a+1,a+n+1,a+1,a+n+2,a+n+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();mesh(g,material(0xe5dfcb),p);
  }
  if(type==='screenDoor'||type==='screenWindow'){
   screen(p,width,height);for(const x of [-width/2,width/2])box(p,x,height/2,.01,.035,height,.04,colour);for(const y of [0,height])box(p,0,y,.01,width,.035,.04,colour);
   if(type==='screenDoor'){box(p,0,height*.42,.022,width,.035,.045,colour);box(p,width*.38,height*.5,.055,.025,.12,.025,0x424b46);p.userData.hinge={x:-width/2,y:0,z:0};}
   else{const bars=Math.max(3,Math.round(width/.12));for(let i=1;i<bars;i++)rod(p,[-width/2+i*width/bars,0,.045],[-width/2+i*width/bars,height,.045],.007,0x494f4b);box(p,0,height*.5,.045,width,.015,.015,0x494f4b);}
  }
  if(type==='clock'){
   const rim=mesh(new THREE.CylinderGeometry(.19,.19,.025,48),material(colour),p);rim.rotation.x=Math.PI/2;rim.position.y=.20;
   const face=mesh(new THREE.CircleGeometry(.173,48),material(0xe9e3cd),p);face.position.set(0,.20,.014);
   for(let i=0;i<12;i++){const a=i*Math.PI/6;const mark=box(p,Math.sin(a)*.148,.20+Math.cos(a)*.148,.016,.007,.020,.002,0x38413a);mark.rotation.z=-a;}
   for(const [a,l,w] of [[(hour%12+minute/60)*Math.PI/6,.083,.009],[minute*Math.PI/30,.125,.006]]){const hand=box(p,Math.sin(a)*l/2,.20+Math.cos(a)*l/2,.020,w,l,.004,0x323c35);hand.rotation.z=-a;}mesh(new THREE.SphereGeometry(.009,8,6),material(0x323c35),p).position.set(0,.20,.024);
  }
  if(type==='clothesline'||type==='dryingStand'||type==='hangerRack'||type==='hangingClothes'){
   const stand=type==='dryingStand'||type==='hangerRack',top=stand?height:0;
   if(stand){for(const x of [-length/2,length/2]){if(type==='dryingStand'){rod(p,[x,0,-depth/2],[x,height,depth/2],.014,colour);rod(p,[x,0,depth/2],[x,height,-depth/2],.014,colour);}else{rod(p,[x,0,0],[x,height,0],.015,colour);rod(p,[x,0,-depth/2],[x,0,depth/2],.015,colour);}}
    rod(p,[-length/2,height,0],[length/2,height,0],.014,colour);
    if(type==='dryingStand')for(const x of [-length/2,length/2])rod(p,[x,height,-depth/2],[x,height,depth/2],.014,colour);
   }
   const rows=type==='dryingStand'?3:1;for(let j=0;j<rows;j++){const z=rows===1?0:(j-1)*depth*.35;if(type!=='hangingClothes'){const curve=new THREE.CatmullRomCurve3(Array.from({length:25},(_,i)=>new THREE.Vector3((i/24-.5)*length,top-(stand?0:sag)*Math.sin(Math.PI*i/24),z)));mesh(new THREE.TubeGeometry(curve,32,.002,4,false),material(0xc4bfab),p);}clothes(p,length,count,top,z,stand?0:sag,hangers||type==='hangerRack'||type==='hangingClothes',palette,hangerColour,seed+j*97,clusterStrength,pegOrientation);}
  }
  p.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(p);if(!['clothesline','hangingClothes'].includes(type)){for(const child of p.children)child.position.y-=b.min.y;p.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(p);}p.userData.bounds={minX:b.min.x,maxX:b.max.x,minY:b.min.y,maxY:b.max.y,minZ:b.min.z,maxZ:b.max.z};p.userData.anchor=['clothesline','hangingClothes'].includes(type)?'lineEndpoints':'floor';p.userData.detail={type,seed,clusterStrength};return p;
 }
 return {create,materials,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
