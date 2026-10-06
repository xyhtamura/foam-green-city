import * as THREE from 'three';

// Authored from the supplied shape reference; metres, floor at y=0, front at -z.
export function createSchoolChairKit({patchMaterial=m=>m,woodTexture=null}={}){
  const geometries=new Set(),materials=new Set(),cache=new Map();
  const geo=g=>{geometries.add(g);return g;};
  const boxGeo=geo(new THREE.BoxGeometry(1,1,1));
  function mat(hex,wood=false){const key=hex+':'+wood;if(!cache.has(key)){const m=patchMaterial(new THREE.MeshLambertMaterial({color:hex,map:wood?woodTexture:null}));cache.set(key,m);materials.add(m);}return cache.get(key);}
  function box(parent,m,x,y,z,w,h,d){const o=new THREE.Mesh(boxGeo,m);o.position.set(x,y,z);o.scale.set(w,h,d);parent.add(o);return o;}
  function create({arm='right',woodColour=0xa57b4c,frameColour=0x282a29,scale=1}={}){
    if(!['right','left'].includes(arm))throw new Error('Arm must be right or left');
    if(!(scale>0&&Number.isFinite(scale)))throw new Error('Scale must be positive and finite');
    const chair=new THREE.Group();chair.name='school-armchair';
    const metal=mat(frameColour),wood=mat(woodColour,true),feet=mat(0x171918),s=arm==='right'?1:-1;
    // 450×400×18 mm seat at 420 mm; 800 mm overall back height.
    for(const x of [-.225,.225])for(const z of [-.19,.19]){
      const rear=z>0;box(chair,metal,x,(rear?.8:.411)/2,z,.025,rear?.8:.411,.025);
      box(chair,feet,x,.008,z,.029,.016,.029);
    }
    box(chair,wood,0,.411,0,.45,.018,.4);
    box(chair,wood,0,.686,.199,.45,.2,.018);
    for(const x of [-.225,.225]){
      box(chair,metal,x,.385,0,.025,.025,.4);
      box(chair,metal,x,.15,0,.025,.025,.4);
    }
    for(const z of [-.19,.19])box(chair,metal,0,.15,z,.45,.025,.025);
    box(chair,metal,0,.385,-.19,.45,.025,.025);
    // One forward upright and a rail carry the tablet back to the rear post.
    box(chair,metal,s*.225,.351,-.37,.025,.702,.025);
    box(chair,metal,s*.225,.688,-.09,.025,.025,.56);
    const outline=new THREE.Shape();
    // Wide forward writing surface, with the inside cutout beside the occupant.
    const points=[[-.07,-.39],[.235,-.39],[.25,-.375],[.25,.19],[.18,.19],[.18,-.11],[-.055,-.11],[-.07,-.125]];
    points.forEach(([x,z],i)=>i?outline.lineTo(x,-z):outline.moveTo(x,-z));outline.closePath();
    const tabletGeo=geo(new THREE.ExtrudeGeometry(outline,{depth:.018,bevelEnabled:false,curveSegments:1}));
    tabletGeo.rotateX(-Math.PI/2);
    if(s<0){tabletGeo.scale(-1,1,1); // Reflection reverses triangle winding.
      const p=tabletGeo.attributes.position;
      for(let i=0;i<p.count;i+=3)for(let k=0;k<3;k++){const a=p.array[(i+1)*3+k];p.array[(i+1)*3+k]=p.array[(i+2)*3+k];p.array[(i+2)*3+k]=a;}
      tabletGeo.computeVertexNormals();
    }
    const tablet=new THREE.Mesh(tabletGeo,wood);tablet.position.y=.702;tablet.name='writing-tablet';chair.add(tablet);
    chair.scale.setScalar(scale);chair.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(chair);
    chair.userData.schoolChair={arm,seatHeight:.42*scale,tabletHeight:.72*scale};
    chair.userData.supportBounds={minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z,height:b.max.y};
    // Separate usable surfaces: the L-shaped tablet is not one full rectangle.
    chair.userData.surfaces={seat:{minX:-.225*scale,maxX:.225*scale,minZ:-.2*scale,maxZ:.2*scale,y:.42*scale},tablet:{minX:(s>0?-.05:-.23)*scale,maxX:(s>0?.23:.05)*scale,minZ:-.37*scale,maxZ:-.13*scale,y:.72*scale}};
    return chair;
  }
  return {create,materials,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
