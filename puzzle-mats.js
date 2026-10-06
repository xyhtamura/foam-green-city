import * as THREE from 'three';
export const PUZZLE_MAT_TYPES=['patch','stray','stack'];
export function createPuzzleMatKit({patchMaterial=m=>m}={}){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,128,128);
 // Each boundary has a shallow puzzle-shaped detour. Copies wrap its other half.
 ctx.strokeStyle='#929292';ctx.lineWidth=1.4;ctx.lineJoin='round';
 function seam(vertical,offset){ctx.beginPath();const point=(a,b)=>vertical?[offset+b,a]:[a,offset+b];const move=(a,b)=>ctx.moveTo(...point(a,b)),line=(a,b)=>ctx.lineTo(...point(a,b)),curve=(a,b,c,d,e,f)=>ctx.bezierCurveTo(...point(a,b),...point(c,d),...point(e,f));move(0,0);line(42,0);curve(48,0,49,-2,47,-5);curve(38,-18,65,-20,67,-8);curve(69,-1,62,0,74,0);line(128,0);ctx.stroke();}
 for(const offset of [0,128]){seam(true,offset);seam(false,offset);}
 const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.NearestFilter;texture.colorSpace=THREE.SRGBColorSpace;
 const material=patchMaterial(new THREE.MeshLambertMaterial({vertexColors:true,map:texture}));
 function create(type,{columns=4,rows=3,tile=.3,thickness=.012,palette=[0xda6c66,0xe3c75e,0x75a477,0x639abe],scheme='random',missing=.12,seed=1,count=5}={}){
  if(!PUZZLE_MAT_TYPES.includes(type))throw new Error('Unknown puzzle mat type');
  if(!Number.isInteger(columns)||columns<1||columns>64||!Number.isInteger(rows)||rows<1||rows>64||!Number.isFinite(tile)||tile<=0||!Number.isFinite(thickness)||thickness<=0||!Number.isFinite(missing)||missing<0||missing>1||!Number.isInteger(seed)||!Number.isInteger(count)||count<3||count>8||!Array.isArray(palette)||!palette.length||!['checker','random','single','rows'].includes(scheme))throw new Error('Invalid puzzle mat options');
  let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const positions=[],normals=[],uvs=[],colours=[],indices=[];const subdivisions=Math.max(1,Math.ceil(tile/.3));
  function quad(points,normal,uv,colour,angle,tx,ty,tz){const base=positions.length/3,c=Math.cos(angle),s=Math.sin(angle);for(let i=0;i<4;i++){const [x,y,z]=points[i];positions.push(x*c+z*s+tx,y+ty,-x*s+z*c+tz);normals.push(normal[0]*c+normal[2]*s,normal[1],-normal[0]*s+normal[2]*c);uvs.push(...uv[i]);colours.push(colour.r,colour.g,colour.b);}indices.push(base,base+1,base+2,base,base+2,base+3);}
  const sideUV=Array.from({length:4},()=>[.5,.5]);
  function addTile(x,z,y,angle,colour,edges){for(let j=0;j<subdivisions;j++)for(let i=0;i<subdivisions;i++){const x0=(i/subdivisions-.5)*tile,x1=((i+1)/subdivisions-.5)*tile,z0=(j/subdivisions-.5)*tile,z1=((j+1)/subdivisions-.5)*tile;quad([[x0,thickness,z0],[x0,thickness,z1],[x1,thickness,z1],[x1,thickness,z0]],[0,1,0],[[i/subdivisions,j/subdivisions],[i/subdivisions,(j+1)/subdivisions],[(i+1)/subdivisions,(j+1)/subdivisions],[(i+1)/subdivisions,j/subdivisions]],colour,angle,x,y,z);}
   const h=tile/2;const faces=[[[[-h,0,-h],[-h,0,h],[-h,thickness,h],[-h,thickness,-h]],[-1,0,0]],[[[h,0,h],[h,0,-h],[h,thickness,-h],[h,thickness,h]],[1,0,0]],[[[h,0,-h],[-h,0,-h],[-h,thickness,-h],[h,thickness,-h]],[0,0,-1]],[[[-h,0,h],[h,0,h],[h,thickness,h],[-h,thickness,h]],[0,0,1]]];faces.forEach(([p,n],i)=>{if(edges[i])quad(p,n,sideUV,colour.clone().multiplyScalar(.85),angle,x,y,z);});
  }
  const choose=(x,z)=>new THREE.Color(palette[scheme==='single'?0:scheme==='checker'?(x+z)%Math.min(2,palette.length):scheme==='rows'?z%palette.length:Math.floor(random()*palette.length)]);
  let tiles=0;
  if(type==='patch'){const present=Array.from({length:rows},()=>Array.from({length:columns},()=>random()>=missing));if(!present.some(row=>row.some(Boolean)))present[Math.floor(rows/2)][Math.floor(columns/2)]=true;for(let z=0;z<rows;z++)for(let x=0;x<columns;x++)if(present[z][x]){addTile((x-(columns-1)/2)*tile,(z-(rows-1)/2)*tile,0,0,choose(x,z),[!present[z][x-1],!present[z][x+1],!present[z-1]?.[x],!present[z+1]?.[x]]);tiles++;}}
  else{tiles=type==='stray'?1:count;for(let i=0;i<tiles;i++)addTile(type==='stray'?0:(random()-.5)*tile*.05,type==='stray'?0:(random()-.5)*tile*.05,i*thickness,type==='stray'?0:(random()-.5)*.16,choose(i,0),[true,true,true,true]);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));geometry.setIndex(indices);geometry.computeBoundingBox();
  const mesh=new THREE.Mesh(geometry,material);mesh.name='puzzle-mat-'+type;const b=geometry.boundingBox;mesh.userData.bounds={minX:b.min.x,maxX:b.max.x,minY:b.min.y,maxY:b.max.y,minZ:b.min.z,maxZ:b.max.z};mesh.userData.puzzleMat={type,tiles,columns,rows,tile,thickness,seed,triangles:indices.length/3};mesh.userData.anchor='floor';return mesh;
 }
 // Geometry is caller-owned and never retained by this kit.
 return {create,material,texture,dispose(){material.dispose();texture.dispose();}};
}
