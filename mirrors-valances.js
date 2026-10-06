import * as THREE from 'three';
export const MIRROR_TYPES=['handRound','handOval','bareOval','bareRectangle'];
export const VALANCE_TYPES=['straight','swag','swagJabots','ruffled'];
export function createMirrorsValancesKit({patchMaterial=m=>m,envMap=null}={}){
 const geometries=new Set(),materials=new Set();
 const geo=g=>{geometries.add(g);return g;};
 const mat=(colour,mirror=false,texture=null)=>{const m=patchMaterial(mirror?new THREE.MeshStandardMaterial({color:colour,metalness:1,roughness:.07,envMap,side:THREE.DoubleSide}):new THREE.MeshLambertMaterial({color:colour,map:texture,side:THREE.DoubleSide}));materials.add(m);return m;};
 const mesh=(g,m,parent)=>{const o=new THREE.Mesh(geo(g),m);parent.add(o);return o;};
 function finish(g,anchor){g.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(g);g.userData.anchor=anchor;g.userData.bounds={minX:b.min.x,maxX:b.max.x,minY:b.min.y,maxY:b.max.y,minZ:b.min.z,maxZ:b.max.z};return g;}
 function mirror(type,{width=.28,height=.40,colour=0x9b6985,handleLength=.16}={}){
  if(!MIRROR_TYPES.includes(type))throw new Error('Unknown mirror type');
  if(![width,height,handleLength].every(v=>Number.isFinite(v)&&v>0))throw new Error('Dimensions must be positive');
  const g=new THREE.Group();g.name='mirror-'+type;const hand=type.startsWith('hand'),h=type==='handRound'?width:height;
  const silver=mat(0xf1f4f5,true),back=mat(hand?colour:0x858b89),frame=hand?back:null;
  const shape=new THREE.Shape();if(type==='bareRectangle'){shape.moveTo(-width/2,-h/2);shape.lineTo(width/2,-h/2);shape.lineTo(width/2,h/2);shape.lineTo(-width/2,h/2);shape.closePath();}else shape.absellipse(0,0,width/2,h/2,0,Math.PI*2,false,0);
  mesh(new THREE.ExtrudeGeometry(shape,{depth:.006,bevelEnabled:false,curveSegments:48}),back,g).position.z=-.006;
  mesh(new THREE.ShapeGeometry(shape,48),silver,g).position.z=.0008;
  if(hand){const rim=mesh(new THREE.TorusGeometry(1,.065,6,48),frame,g);rim.scale.set(width/2,h/2,.04);const handle=mesh(new THREE.CapsuleGeometry(width*.065,handleLength,4,8),frame,g);handle.position.set(0,-h/2-handleLength/2,.0);handle.scale.z=.4;}
  g.userData.mirror={type,width,height:h,reflective:true};return finish(g,'centre');
 }
 function sheet(g,m,fn,nx=64,ny=12){const p=[],uv=[],idx=[];for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){p.push(...fn(i/nx,j/ny));uv.push(i/nx,1-j/ny);}for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;idx.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}const b=new THREE.BufferGeometry();b.setAttribute('position',new THREE.Float32BufferAttribute(p,3));b.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));b.setIndex(idx);b.computeVertexNormals();mesh(b,m,g);}
 function valance(type,{length=1.5,drop=.25,jabotDrop=.60,swags=2,folds=16,colour=0xc49b9c,accent=0xe0d1b5,texture=null}={}){
  if(!VALANCE_TYPES.includes(type))throw new Error('Unknown valance type');
  if(![length,drop,jabotDrop].every(v=>Number.isFinite(v)&&v>0)||!Number.isInteger(swags)||swags<1||swags>8||!Number.isInteger(folds)||folds<2||folds>64)throw new Error('Invalid valance dimensions or fold counts');
  const g=new THREE.Group();g.name='valance-'+type;const cloth=mat(colour,false,texture),trim=mat(accent);
  const depth=(u,v)=>Math.sin(u*folds*Math.PI*2)*.016*(.3+.7*v);
  if(type==='straight'||type==='ruffled')sheet(g,cloth,(u,v)=>[(u-.5)*length,-v*(drop+(type==='ruffled'?.025*Math.sin(u*folds*Math.PI*2):0)),depth(u,v)],folds*8,12);
  else for(let n=0;n<swags;n++)sheet(g,cloth,(u,v)=>[(n+u-swags/2)*length/swags,-v*(drop*(.18+.82*Math.sin(Math.PI*u))),Math.sin(v*Math.PI*6)*.012*Math.sin(Math.PI*u)+.014],32,12);
  // Straight top band covers the gathered attachment edge.
  sheet(g,trim,(u,v)=>[(u-.5)*length,-v*.035,.04],32,2);
  if(type==='swagJabots')for(const side of [-1,1])sheet(g,cloth,(u,v)=>[side*(length/2-u*length*.14),-v*(jabotDrop*(1-.55*u)),.045+Math.sin(u*Math.PI*8)*.022],24,16);
  if(type==='ruffled')sheet(g,trim,(u,v)=>[(u-.5)*length,-drop-.025*Math.sin(u*folds*Math.PI*2)-v*.055,depth(u,1)+.01*Math.sin(v*Math.PI)],folds*8,4);
  g.userData.valance={type,length,drop,jabotDrop,swags,folds};return finish(g,'topEdge');
 }
 return {mirror,valance,materials,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
