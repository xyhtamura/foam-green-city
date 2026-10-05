import * as THREE from 'three';

export const LINEN_TYPES=['drapedTowel','foldedClothes','laundryPile','rug','doormat','dishcloth','pillow','blanket'];
export const LINEN_COLOURS={cream:0xd7ceb4,blue:0x698caa,green:0x85966c,pink:0xbc8c94,red:0xa2605e,yellow:0xc2ab6a,grey:0x8b8b87};

// Static authored folds. Resources belong to the kit, not individual objects.
export function createLinenKit({patchMaterial=m=>m}={}){
  const geometries=new Set(),materials=new Set(),cache=new Map();
  const geo=g=>{geometries.add(g);return g;};
  const pillowGeo=geo(new THREE.SphereGeometry(1,12,8));
  function material(colour){const c=LINEN_COLOURS[colour]??colour;if(!cache.has(c)){const m=patchMaterial(new THREE.MeshLambertMaterial({color:c,side:THREE.DoubleSide}));cache.set(c,m);materials.add(m);}return cache.get(c);}
  function cloth(parent,m,{width=.3,depth=.2,thickness=.012,x=0,y=0,z=0,fold=.006,phase=0}={}){
    // A closed, softly uneven slab gives folded fabric thickness without textures.
    const positions=[],indices=[],nx=8,nz=6;
    for(let side=0;side<2;side++)for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
      const u=i/nx,v=j/nz;
      const edge=Math.sin(u*Math.PI)*Math.sin(v*Math.PI);
      const wave=edge*(.5+.5*Math.sin(u*9+v*6+phase))*fold;
      positions.push((u-.5)*width,side?thickness+wave:0,(v-.5)*depth);
    }
    const layer=(nx+1)*(nz+1);
    for(let side=0;side<2;side++)for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
      const a=side*layer+j*(nx+1)+i,b=a+1,c=a+nx+2,d=a+nx+1;
      indices.push(...(side?[a,d,b,b,d,c]:[a,b,d,b,c,d]));
    }
    const boundary=[];
    for(let i=0;i<=nx;i++)boundary.push(i);
    for(let j=1;j<=nz;j++)boundary.push(j*(nx+1)+nx);
    for(let i=nx-1;i>=0;i--)boundary.push(nz*(nx+1)+i);
    for(let j=nz-1;j>0;j--)boundary.push(j*(nx+1));
    for(let i=0;i<boundary.length;i++){const a=boundary[i],b=boundary[(i+1)%boundary.length];indices.push(a,a+layer,b,b,a+layer,b+layer);}
    const g=geo(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
    const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  function create(type,{colour='blue',scale=1,rotation=0,seed=1,fold=1}={}){
    if(!LINEN_TYPES.includes(type))throw new Error('Unknown linen type: '+type);
    if(!(Number.isFinite(scale)&&scale>0))throw new Error('Scale must be positive and finite');
    fold=Math.max(0,Math.min(2,fold));let state=seed>>>0;
    const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
    const group=new THREE.Group();group.name='linen-'+type;const m=material(colour);
    if(['rug','doormat','dishcloth'].includes(type)){
      const [w,d]=type==='rug'?[.85,.6]:type==='doormat'?[.58,.34]:[.28,.22];
      cloth(group,m,{width:w,depth:d,thickness:type==='dishcloth'?.003:.009,fold:.008*fold,phase:seed});
      // Sewn-looking border strips follow the resting plane.
      const trim=material('cream');
      for(const side of [-1,1])cloth(group,trim,{width:w-.03,depth:.012,thickness:.002,y:type==='dishcloth'?.003:.009,z:side*(d/2-.018),fold:0});
    }
    if(type==='foldedClothes'||type==='blanket'){
      const n=type==='blanket'?2:3;
      for(let i=0;i<n;i++)cloth(group,i%2?material('cream'):m,{width:type==='blanket'?.5:.29,depth:type==='blanket'?.35:.22,thickness:.018,y:i*.023,x:i*.008,fold:.006*fold,phase:seed+i}).rotation.y=(random()-.5)*.12;
    }
    if(type==='laundryPile'){
      const names=Object.keys(LINEN_COLOURS);
      for(let i=0;i<7;i++){
        const mesh=cloth(group,i===0?m:material(names[Math.floor(random()*names.length)]),{width:.18+random()*.15,depth:.16+random()*.12,thickness:.016,y:i*.014,x:(random()-.5)*.09,z:(random()-.5)*.09,fold:.025*fold,phase:random()*8});
        mesh.rotation.y=(random()-.5)*1.8;
      }
    }
    if(type==='pillow'){
      const mesh=new THREE.Mesh(pillowGeo,m);mesh.scale.set(.23,.065,.15);mesh.position.y=.065;group.add(mesh);
      // Side seam stays near the widest part of the cushion.
      const seam=new THREE.Mesh(geo(new THREE.TorusGeometry(1,.009,4,32)),material('cream'));
      seam.rotation.x=Math.PI/2;seam.scale.set(.228,.148,.228);seam.position.y=.065;group.add(seam);
    }
    if(type==='drapedTowel'){
      // Origin is the support ridge, not the hanging towel's lowest point.
      const positions=[],indices=[],nx=8,nz=20,w=.28;
      for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
        const u=i/nx,t=j/nz;
        const z=(t-.5)*.24;
        const drop=Math.max(0,Math.abs(t-.5)-.12)*.85;
        const wrinkle=Math.sin(u*Math.PI)*Math.sin(t*17+u*8+seed)*.005*fold;
        positions.push((u-.5)*w,-drop+wrinkle,z);
      }
      for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;indices.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
      const g=geo(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();group.add(new THREE.Mesh(g,m));
      group.userData.supportAnchor='ridge';
    }
    group.scale.setScalar(scale);group.rotation.y=rotation;group.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(group);
    group.userData.linen={type,colour,scale,seed,fold};
    group.userData.supportBounds={minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z,minY:b.min.y,maxY:b.max.y,height:b.max.y-b.min.y};
    return group;
  }
  return {create,materials,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
