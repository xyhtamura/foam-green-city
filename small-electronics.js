import * as THREE from 'three';
export const SMALL_ELECTRONICS_TYPES=['powerStrip','extensionCord','charger','remote','phone','radio','looseCable'];
export function createSmallElectronicsKit({patchMaterial=m=>m}={}){
 const materials=new Set(),cache=new Map();
 function mat(c){if(!cache.has(c)){const m=patchMaterial(new THREE.MeshLambertMaterial({color:c}));materials.add(m);cache.set(c,m);}return cache.get(c);}
 function create(type,{colour=0xd0cdbd,accent=0x444b47,cable=true,cableLength=.65,seed=1,sockets=4,screenOn=false}={}){
  if(!SMALL_ELECTRONICS_TYPES.includes(type)||!Number.isFinite(cableLength)||cableLength<=0||!Number.isInteger(seed)||!Number.isInteger(sockets)||sockets<2||sockets>6)throw new Error('Invalid electronics options');
  const g=new THREE.Group(),geometries=new Set();g.name='electronics-'+type;
  function mesh(geo,c,parent=g){geometries.add(geo);const o=new THREE.Mesh(geo,mat(c));parent.add(o);return o;}
  function box(x,y,z,w,h,d,c,parent=g){const o=mesh(new THREE.BoxGeometry(w,h,d),c,parent);o.position.set(x,y,z);return o;}
  function disc(x,y,z,r,h,c,parent=g){const o=mesh(new THREE.CylinderGeometry(r,r,h,12),c,parent);o.position.set(x,y,z);return o;}
  function wire(points,r=.0025){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));mesh(new THREE.TubeGeometry(curve,Math.max(20,points.length*6),r,5,false),accent);}
  function plug(x,z,angle=0){const p=new THREE.Group();g.add(p);p.position.set(x,.015,z);p.rotation.y=angle;box(0,0,0,.027,.019,.035,accent,p);for(const dx of [-.007,.007])box(dx,0,.028,.003,.013,.020,0xa4a69c,p);return p;}
  function connector(x,z){box(x,.01,z,.018,.009,.025,accent);box(x,.01,z+.017,.012,.006,.012,0x9ca29b);}
  function trailing(x,z,length=cableLength){const pts=[[x,.012,z]];for(let i=1;i<=8;i++)pts.push([x+Math.sin(i*.95+seed)*length*.12,.004,z+i*length/8]);wire(pts);const end=pts.at(-1);plug(end[0],end[2]+.02,.25);}
  if(type==='powerStrip'){
   const l=sockets*.055+.05;box(0,.016,0,.064,.032,l,colour);for(let i=0;i<sockets;i++){const z=(i-(sockets-1)/2)*.055;disc(0,.033,z,.021,.003,colour);for(const x of [-.007,.007])box(x,.035,z,.004,.001,.011,accent);box(0,.035,z-.012,.005,.001,.004,accent);}box(0,.035,-l/2+.014,.03,.007,.017,0x99716a);if(cable)trailing(0,l/2);
  }
  if(type==='extensionCord'||type==='looseCable'){
   const pts=[];for(let i=0;i<=60;i++){const a=i/60*Math.PI*6,r=cableLength/(Math.PI*6)*(.85+.1*Math.sin(a*1.5+seed));pts.push([Math.cos(a)*r,.006+i/60*.004,Math.sin(a)*r]);}wire(pts);const start=pts[0],end=pts.at(-1);wire([[start[0],start[1],start[2]],[start[0]+.035,.004,start[2]-.04],[start[0]+.09,.004,start[2]-.08]]);wire([[end[0],end[1],end[2]],[end[0]-.03,.004,end[2]+.05],[end[0]-.08,.004,end[2]+.10]]);if(type==='extensionCord'){plug(start[0]+.09,start[2]-.10,Math.PI);box(end[0]-.08,.016,end[2]+.12,.038,.026,.05,colour);for(const dx of [-.007,.007])box(end[0]-.08+dx,.03,end[2]+.12,.004,.001,.012,accent);}else{connector(start[0]+.09,start[2]-.08);connector(end[0]-.08,end[2]+.10);}
  }
  if(type==='charger'){
   box(0,.024,0,.045,.048,.052,colour);for(const x of [-.008,.008])box(x,.024,-.04,.003,.018,.027,0xa4a69c);box(0,.024,.027,.016,.008,.002,accent);if(cable){wire([[0,.024,.03],[.03,.004,.07],[.09,.004,.14],[.03,.004,.22],[-.07,.004,.18],[-.10,.004,.32],[.04,.004,cableLength]]);connector(.04,cableLength);}
  }
  if(type==='remote'){
   box(0,.011,0,.048,.022,.17,accent);disc(-.012,.024,-.062,.005,.003,0xa06560);for(let j=0;j<3;j++)for(let i=0;i<3;i++)disc((i-1)*.011,.024,-.037+j*.017,.0035,.003,colour);disc(0,.024,.029,.015,.003,colour);disc(0,.026,.029,.007,.003,accent);for(let i=0;i<2;i++)box((i-.5)*.023,.024,.066,.018,.004,.012,colour);
  }
  if(type==='phone'){
   box(0,.005,0,.072,.01,.145,accent);box(0,.0105,0,.064,.001,.126,screenOn?0x738c91:0x293432);box(0,.0115,-.059,.019,.001,.003,accent);disc(0,.0115,.065,.003,.001,colour);
  }
  if(type==='radio'){
   box(0,.075,0,.25,.15,.075,colour);for(let i=0;i<9;i++)box(-.055,.075+(i-4)*.011,.038,.105,.003,.002,accent);box(.067,.105,.039,.065,.022,.002,0x79866e);const knob=disc(.067,.060,.043,.015,.009,accent);knob.rotation.x=Math.PI/2;box(0,.16,0,.12,.012,.018,accent);for(const x of [-.06,.06])box(x,.15,0,.012,.026,.018,accent);const antenna=mesh(new THREE.CylinderGeometry(.002,.002,.25,6),0xa5aaa2);antenna.position.set(.09,.26,-.025);antenna.rotation.z=-.35;
  }
  g.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(g);for(const o of g.children)o.position.y-=b.min.y;g.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(g);g.userData.bounds={minX:b.min.x,maxX:b.max.x,minY:b.min.y,maxY:b.max.y,minZ:b.min.z,maxZ:b.max.z};g.userData.anchor='floor';g.userData.electronics={type,seed,cableLength};g.userData.dispose=()=>{geometries.forEach(o=>o.dispose());geometries.clear();};return g;
 }
 return {create,materials,dispose(){materials.forEach(m=>m.dispose());materials.clear();cache.clear();}};
}
