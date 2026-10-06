import * as THREE from 'three';

export const PACKAGE_TYPES=['sachet','packet','pouch','shoppingBag','productBox'];
// Dimensions are metres; vertical packages stand on y=0 and face toward +z.
export function createPackagingKit({patchMaterial=m=>m}={}){
  const geometries=new Set(),materials=new Set(),cache=new Map();
  const geo=g=>{geometries.add(g);return g;};
  function material(colour,texture=null){
    const key=colour+':'+(texture?.uuid??'');
    if(!cache.has(key)){const m=patchMaterial(new THREE.MeshLambertMaterial({color:colour,map:texture,side:THREE.DoubleSide}));cache.set(key,m);materials.add(m);}return cache.get(key);
  }
  function create(type,{width=.12,height=.18,depth=.025,colour=0x67919a,labelColour=0xe2d7b9,texture=null,seed=1,bend=0,crumple=.2,fullness=.65,scale=1,rotation=0,pose='standing'}={}){
    if(!PACKAGE_TYPES.includes(type))throw new Error('Unknown package type: '+type);
    if(![width,height,depth,scale].every(v=>Number.isFinite(v)&&v>0))throw new Error('Dimensions and scale must be positive');
    if(!['standing','flat'].includes(pose))throw new Error('Pose must be standing or flat');
    bend=Math.max(-1,Math.min(1,bend));crumple=Math.max(0,Math.min(1,crumple));fullness=Math.max(0,Math.min(1,fullness));
    const group=new THREE.Group();group.name='package-'+type;
    const body=material(colour),label=material(texture?0xffffff:labelColour,texture);
    const phase=(seed>>>0)*.731;
    function warp(x,y,z){
      const u=x/width,v=y/height;
      const boundary=Math.sin(Math.PI*v);
      const taper=type==='pouch'?.86+.14*v:type==='packet'?.9+.1*Math.sin(Math.PI*v):1;
      return [x*taper+Math.sin(v*Math.PI)*bend*width*.28,y,
        z+bend*height*.22*Math.sin(v*Math.PI)+crumple*depth*.35*boundary*Math.sin(u*19+v*23+phase)];
    }
    function grid(surface,mat,nx=12,ny=16,labelFace=false){
      const p=[],uv=[],idx=[];
      for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){p.push(...warp(...surface(i/nx,j/ny)));uv.push(labelFace?(i/nx-1/6)/(2/3):i/nx,labelFace?(j/ny-.25)/.5:j/ny);}
      for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;idx.push(a,a+1,a+nx+1,a+1,a+nx+2,a+nx+1);}
      const g=geo(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);
      if(labelFace)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)g.addGroup((j*nx+i)*6,6,i>=nx/6&&i<nx*5/6&&j>=ny/4&&j<ny*3/4?1:0);
      g.computeVertexNormals();group.add(new THREE.Mesh(g,mat));
    }
    const rigid=type==='productBox';
    const thickness=(u,v)=>rigid?depth/2:depth*(.07+fullness*.43*Math.sin(Math.PI*u)*Math.sin(Math.PI*v));
    // Front and back skins; packet edges pinch into sealed seams.
    for(const sign of [-1,1])grid((u,v)=>[(u-.5)*width,v*height,sign*thickness(u,v)],sign>0?[body,label]:body,12,16,sign>0);
    for(const sign of [-1,1])grid((u,v)=>[sign*width/2,v*height,(u-.5)*depth*(rigid?1:.14)],body,4,16);
    for(const v of (type==='shoppingBag'?[0]:[0,1]))grid((u,t)=>[(u-.5)*width,v*height,(t-.5)*depth*(rigid?1:.14)],body,12,4);
    // Front material groups keep labels flush under every deformation.
    if(type==='shoppingBag'){
      // Handles are deliberately separate loops; deformation applies to their vertices too.
      for(const sign of [-1,1]){
        const p=[],idx=[],n=20;
        for(let i=0;i<=n;i++)for(const r of [.20,.24]){const a=i/n*Math.PI*2;p.push(...warp(Math.cos(a)*width*r,height+height*.17+Math.sin(a)*height*.19,sign*depth*.07));}
        for(let i=0;i<n;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
        const g=geo(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();group.add(new THREE.Mesh(g,body));
      }
    }
    if(pose==='flat')group.rotation.x=-Math.PI/2;
    group.rotation.y=rotation;group.scale.setScalar(scale);group.updateMatrixWorld(true);
    let b=new THREE.Box3().setFromObject(group);
    // A wrapper preserves the requested resting pose and floor contact.
    const owner=new THREE.Group();owner.name=group.name;owner.add(group);group.position.y=-b.min.y;owner.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(owner);
    owner.userData.package={type,width,height,depth,bend,crumple,fullness,seed,pose};
    owner.userData.supportBounds={minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z,height:b.max.y};
    return owner;
  }
  return {create,materials,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
