import * as THREE from 'three';

export const FOOTWEAR_TYPES=['sandal','slide','lowClog','slipOn','flat'];
export function createFootwearKit({patchMaterial=m=>m}={}){
  const geometries=new Set(),materials=new Set(),cache=new Map();
  const geo=g=>{geometries.add(g);return g;};
  const boxGeo=geo(new THREE.BoxGeometry(1,1,1));
  function mat(c){if(!cache.has(c)){const m=patchMaterial(new THREE.MeshLambertMaterial({color:c,side:THREE.DoubleSide}));cache.set(c,m);materials.add(m);}return cache.get(c);}
  function box(g,m,x,y,z,w,h,d){const o=new THREE.Mesh(boxGeo,m);o.position.set(x,y,z);o.scale.set(w,h,d);g.add(o);return o;}
  function create(type,{foot='right',colour=0x8c9691,soleColour=0xccc2a9,scale=1,rotation=0}={}){
    if(!FOOTWEAR_TYPES.includes(type))throw new Error('Unknown footwear: '+type);
    if(!['left','right'].includes(foot))throw new Error('Foot must be left or right');
    if(!(scale>0&&Number.isFinite(scale)))throw new Error('Scale must be positive');
    const group=new THREE.Group();group.name='footwear-'+type;const side=foot==='right'?1:-1;
    const sole=mat(soleColour),upper=mat(colour),inside=mat(0xb2a68c);
    const shape=new THREE.Shape();shape.moveTo(0,.14);shape.bezierCurveTo(.061,.14,.064,.08,.051,.016);shape.bezierCurveTo(.042,-.03,.046,-.103,.025,-.13);shape.bezierCurveTo(0,-.149,-.039,-.132,-.042,-.092);shape.bezierCurveTo(-.045,-.03,-.06,.058,-.05,.1);shape.bezierCurveTo(-.046,.129,-.02,.14,0,.14);
    const base=geo(new THREE.ExtrudeGeometry(shape,{depth:type==='lowClog'?.014:.011,bevelEnabled:false,curveSegments:8}));base.rotateX(-Math.PI/2);
    group.add(new THREE.Mesh(base,sole));
    // Small inner heel pad is visible through the open back.
    box(group,inside,0,.014,.064,.057,.005,.095);
    function arch(z,length,height,width=.053,holes=false){
      const p=[],idx=[],nx=16,nz=12;
      for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
        const a=i/nx*Math.PI,t=j/nz;
        const roundToe=.80+.20*Math.sin(t*Math.PI/2);
        p.push(Math.cos(a)*width*roundToe,.014+Math.sin(a)*height*(.70+.30*Math.sin(t*Math.PI/2)),z+t*length);
      }
      for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
        // Actual openings in the shell, rather than dark dots.
        if(holes&&[3,6,9].includes(j)&&[4,7,10].includes(i))continue;
        const a=j*(nx+1)+i;idx.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);
      }
      const g=geo(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();group.add(new THREE.Mesh(g,upper));
      // Close the toe end with a fan; keep the rear entry open.
      const points=[0,.015,z];
      for(let i=0;i<=nx;i++)points.push(...p.slice(i*3,i*3+3));
      const fan=[];for(let i=1;i<=nx;i++)fan.push(0,i,i+1);
      const cap=geo(new THREE.BufferGeometry());cap.setAttribute('position',new THREE.Float32BufferAttribute(points,3));cap.setIndex(fan);cap.computeVertexNormals();group.add(new THREE.Mesh(cap,upper));
    }
    function band(z,width=.02){
      const path=new THREE.CatmullRomCurve3([new THREE.Vector3(-.045,.018,z),new THREE.Vector3(-.023,.048,z),new THREE.Vector3(.02,.048,z),new THREE.Vector3(.045,.018,z)]);
      group.add(new THREE.Mesh(geo(new THREE.TubeGeometry(path,12,width/2,5,false)),upper));
    }
    if(type==='sandal'){band(-.074,.014);band(.017,.014);band(.084,.012);box(group,upper,-.043,.032,.012,.013,.018,.035);}
    if(type==='slide')band(-.032,.045);
    if(type==='lowClog'){
      arch(-.131,.145,.051,.058,true);
      // Only a shallow lip at the heel: no tall back and no raised heel block.
      const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.034,.022,.078),new THREE.Vector3(-.029,.022,.115),new THREE.Vector3(0,.022,.13),new THREE.Vector3(.032,.022,.112),new THREE.Vector3(.036,.022,.078)]);
      group.add(new THREE.Mesh(geo(new THREE.TubeGeometry(curve,14,.004,5,false)),upper));
    }
    if(type==='slipOn'||type==='flat'){
      arch(-.131,type==='flat'?.094:.142,type==='flat'?.031:.052);
      const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.042,.022,-.034),new THREE.Vector3(-.04,.029,.065),new THREE.Vector3(-.025,.04,.12),new THREE.Vector3(0,.041,.129),new THREE.Vector3(.027,.04,.12),new THREE.Vector3(.041,.029,.065),new THREE.Vector3(.044,.022,-.034)]);
      group.add(new THREE.Mesh(geo(new THREE.TubeGeometry(curve,20,type==='flat'?.006:.01,5,false)),upper));
      if(type==='flat')box(group,upper,0,.038,-.057,.038,.008,.015);
    }
    // Reflect vertex data with corrected winding, leaving the toe facing -z.
    if(side<0)group.traverse(o=>{if(!o.isMesh)return;const g=geo(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone());g.scale(-1,1,1);const p=g.attributes.position;for(let i=0;i<p.count;i+=3)for(let k=0;k<3;k++){const a=p.array[(i+1)*3+k];p.array[(i+1)*3+k]=p.array[(i+2)*3+k];p.array[(i+2)*3+k]=a;}g.computeVertexNormals();o.geometry=g;o.position.x*=-1;});
    group.scale.setScalar(scale);group.rotation.y=rotation;group.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(group);
    group.userData.footwear={type,foot,colour,scale};group.userData.supportBounds={minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z,height:b.max.y};return group;
  }
  function pair(type,options={}){
    const g=new THREE.Group(),scale=options.scale??1;g.name='footwear-pair';
    for(const [i,foot] of ['left','right'].entries()){const o=create(type,{...options,foot,rotation:options.scattered?(i?-.23:.31):0});o.position.set((i-.5)*.14*scale,0,options.scattered?(i?-.035:.025)*scale:0);g.add(o);}
    g.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(g);g.userData.supportBounds={minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z,height:b.max.y};return g;
  }
  return {create,pair,materials,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
