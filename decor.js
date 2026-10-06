import * as THREE from 'three';

export const DECOR_TYPES=['runner','banner','bunting','fringe','skirting','wallHanging'];
export function createDecorKit({patchMaterial=m=>m}={}){
  const geometries=new Set(),materials=new Set(),cache=new Map();
  const geo=g=>{geometries.add(g);return g;};
  function material(colour,texture=null){const key=colour+':'+(texture?.uuid??'');if(!cache.has(key)){const m=patchMaterial(new THREE.MeshLambertMaterial({color:colour,map:texture,side:THREE.DoubleSide}));cache.set(key,m);materials.add(m);}return cache.get(key);}
  function sheet(parent,mat,fn,nx=24,ny=6){const p=[],uv=[],idx=[];for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){p.push(...fn(i/nx,j/ny));uv.push(i/nx,1-j/ny);}for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;idx.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}const g=geo(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();parent.add(new THREE.Mesh(g,mat));}
  function create(type,{length=1.2,width=.22,drop=.28,sag=.08,colour=0xb28082,accent=0xd7caaa,palette=[0xa56962,0xd2b968,0x6f95a5,0x879765],texture=null,seed=1,flags=9,overhang=.15}={}){
    if(!DECOR_TYPES.includes(type))throw new Error('Unknown decor type: '+type);
    if(![length,width,drop].every(v=>Number.isFinite(v)&&v>0))throw new Error('Dimensions must be positive');
    if(!Number.isInteger(flags)||flags<2||flags>64)throw new Error('Flags must be 2–64');
    if(!Array.isArray(palette)||!palette.length)throw new Error('Palette must contain colours');
    if(![sag,overhang,seed].every(Number.isFinite))throw new Error('Sag, overhang and seed must be finite');
    sag=Math.max(0,Math.min(sag,length*.4));overhang=Math.max(0,Math.min(overhang,length*.3));
    const g=new THREE.Group();g.name='decor-'+type;const cloth=material(colour,texture),trim=material(accent);
    const low=u=>-Math.sin(Math.PI*u)*sag;
    if(type==='runner'){
      // Origin lies on the tabletop; overhang folds descend at both ends.
      const span=length-2*overhang;
      sheet(g,cloth,(u,v)=>{const d=u*length;return [d<overhang?-span/2:d>length-overhang?span/2:d-length/2,d<overhang?d-overhang:d>length-overhang?length-overhang-d:0,(v-.5)*width];},32,6);
      g.userData.anchor='tabletop';
    }
    if(type==='banner'||type==='wallHanging'){
      const l=type==='wallHanging'?width:length,h=type==='wallHanging'?drop:width;
      sheet(g,cloth,(u,v)=>[(u-.5)*l,low(u)-v*h,Math.sin(u*12+seed)*Math.sin(v*Math.PI)*.012]);
      sheet(g,trim,(u,v)=>[(u-.5)*l,low(u)-h-v*.025,.002],24,2);
    }
    if(type==='bunting'){
      const curve=new THREE.CatmullRomCurve3(Array.from({length:25},(_,i)=>new THREE.Vector3((i/24-.5)*length,low(i/24),0)));
      g.add(new THREE.Mesh(geo(new THREE.TubeGeometry(curve,32,.002,4,false)),trim));
      for(let i=0;i<flags;i++){
        const u=(i+.5)/flags,x=(u-.5)*length,w=length/flags*.78,y=low(u),mat=material(palette[i%palette.length]);
        const p=[x-w/2,y+.002,0,x+w/2,y+.002,0,x,y-drop,.012*Math.sin(i+seed)];
        const tri=geo(new THREE.BufferGeometry());tri.setAttribute('position',new THREE.Float32BufferAttribute(p,3));tri.setAttribute('uv',new THREE.Float32BufferAttribute([0,1,1,1,.5,0],2));tri.computeVertexNormals();g.add(new THREE.Mesh(tri,mat));
      }
    }
    if(type==='fringe'||type==='skirting'){
      sheet(g,cloth,(u,v)=>[(u-.5)*length,-v*(type==='fringe'?.035:drop),type==='skirting'?Math.sin(u*Math.PI*flags*2)*.022:0],Math.max(24,flags*4),6);
      if(type==='fringe')for(let i=0;i<flags*3;i++){
        const x=((i+.5)/(flags*3)-.5)*length,h=drop*(.75+.25*Math.sin(i*2+seed)**2);
        sheet(g,i%2?cloth:trim,(u,v)=>[x+(u-.5)*length/(flags*3)*.55,-.03-v*h,Math.sin(v*3+i)*.004],1,4);
      }
    }
    g.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(g);
    // Hanging items deliberately extend below the attachment origin.
    g.userData.decor={type,length,width,drop,sag,seed};g.userData.anchor??='topEdge';
    g.userData.bounds={minX:b.min.x,maxX:b.max.x,minY:b.min.y,maxY:b.max.y,minZ:b.min.z,maxZ:b.max.z};return g;
  }
  return {create,materials,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
