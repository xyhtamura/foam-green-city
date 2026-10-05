import * as THREE from 'three';

// Metres; every object rests at local y=0. Resources belong to the kit.
export const TABLEWARE_TYPES=['plate','saucer','bowl','deepBowl','cup','mug','glass','tumbler','servingTray','foodContainer','spoon','fork'];
export const TABLEWARE_COLOURS={cream:0xe6dfca,white:0xd9dfdb,blue:0x618eaa,green:0x8ba583,pink:0xc58c8b,orange:0xd39b61,metal:0xadb5b5};

export function createTablewareKit({radialSegments=16,patchMaterial=m=>m}={}){
  const geometries=new Set(),materials=new Set(),cache=new Map();
  const geo=g=>{geometries.add(g);return g;};
  const lathe=points=>geo(new THREE.LatheGeometry(points.map(([x,y])=>new THREE.Vector2(x,y)),radialSegments));
  const shapes={
    plate:lathe([[0,0],[.065,0],[.074,.004],[.118,.016],[.12,.021],[.111,.023],[.071,.009],[0,.009]]),
    saucer:lathe([[0,0],[.04,0],[.07,.012],[.072,.017],[.064,.018],[.039,.007],[0,.007]]),
    bowl:lathe([[0,0],[.035,0],[.05,.01],[.077,.055],[.082,.064],[.076,.068],[.07,.055],[.042,.012],[0,.01]]),
    deepBowl:lathe([[0,0],[.035,0],[.045,.008],[.067,.084],[.069,.091],[.063,.093],[.06,.083],[.039,.014],[0,.01]]),
    cup:lathe([[0,0],[.027,0],[.038,.076],[.039,.082],[.034,.084],[.032,.077],[.023,.009],[0,.009]]),
    mug:lathe([[0,0],[.035,0],[.039,.004],[.041,.094],[.039,.099],[.034,.099],[.034,.012],[0,.009]]),
    glass:lathe([[0,0],[.028,0],[.032,.115],[.029,.117],[.025,.011],[0,.009]]),
    tumbler:lathe([[0,0],[.026,0],[.04,.098],[.04,.103],[.035,.104],[.022,.009],[0,.009]]),
  };
  const unitBox=geo(new THREE.BoxGeometry(1,1,1));
  const handle=geo(new THREE.TorusGeometry(.024,.005,5,12,Math.PI*1.65));
  const spoonHead=geo(new THREE.SphereGeometry(1,10,6));
  function material(colour,finish){
    const hex=TABLEWARE_COLOURS[colour]??colour??TABLEWARE_COLOURS.cream;
    const key=hex+':'+finish;
    if(!cache.has(key)){
      // Opaque pale glass fits the existing low-detail scene without sorting costs.
      const m=patchMaterial(new THREE.MeshPhongMaterial({color:hex,shininess:finish==='metal'?65:finish==='plastic'?22:38}));
      materials.add(m);cache.set(key,m);
    }
    return cache.get(key);
  }
  function box(parent,m,x,y,z,w,h,d){const obj=new THREE.Mesh(unitBox,m);obj.position.set(x,y,z);obj.scale.set(w,h,d);parent.add(obj);return obj;}
  function create(type,{colour='cream',finish='ceramic',scale=1,rotation=0}={}){
    if(!TABLEWARE_TYPES.includes(type))throw new Error('Unknown tableware type: '+type);
    if(!(scale>0&&Number.isFinite(scale)))throw new Error('Scale must be positive and finite');
    const group=new THREE.Group();group.name='tableware-'+type;
    const m=material(['spoon','fork'].includes(type)?'metal':colour,['spoon','fork'].includes(type)?'metal':finish);
    if(shapes[type])group.add(new THREE.Mesh(shapes[type],m));
    if(type==='cup'||type==='mug'){
      const h=new THREE.Mesh(handle,m);h.rotation.z=-Math.PI*.825;
      h.position.set(type==='cup'?.046:.052,type==='cup'?.043:.054,0);group.add(h);
    }
    if(type==='servingTray'||type==='foodContainer'){
      const w=type==='servingTray'?.32:.18,d=type==='servingTray'?.22:.13,h=type==='servingTray'?.024:.065,t=.006;
      box(group,m,0,t/2,0,w,t,d);
      for(const side of [-1,1]){box(group,m,side*(w-t)/2,h/2,0,t,h,d);box(group,m,0,h/2,side*(d-t)/2,w-t*2,h,t);}
    }
    if(type==='spoon'||type==='fork'){
      box(group,m,0,.004,.035,.012,.008,.12);
      if(type==='spoon'){const head=new THREE.Mesh(spoonHead,m);head.position.set(0,.004,-.04);head.scale.set(.021,.004,.031);group.add(head);}
      else{box(group,m,0,.004,-.022,.032,.007,.026);for(let i=0;i<4;i++)box(group,m,(i-1.5)*.009,.004,-.049,.004,.007,.028);}
    }
    group.scale.setScalar(scale);group.rotation.y=rotation;
    group.userData.tableware={type,colour,finish,scale};
    // Bounds in the parent frame include the rotation; insertion point remains y=0.
    group.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(group);
    group.userData.supportBounds={minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z,height:b.max.y};
    return group;
  }
  function stack(type='plate',{count=4,colour='cream',finish='ceramic',scale=1}={}){
    if(!['plate','saucer','bowl','deepBowl'].includes(type))throw new Error('Unsupported stack: '+type);
    if(!Number.isInteger(count)||count<1||count>12)throw new Error('Stack count must be 1–12');
    const group=new THREE.Group();group.name='tableware-stack';
    const step=({plate:.012,saucer:.011,bowl:.024,deepBowl:.027}[type])*scale;
    for(let i=0;i<count;i++){const obj=create(type,{colour,finish,scale,rotation:i*.075});obj.position.y=i*step;group.add(obj);}
    group.userData.tableware={type:'stack',item:type,count};
    group.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(group);
    group.userData.supportBounds={minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z,height:b.max.y};
    return group;
  }
  return {create,stack,materials,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
