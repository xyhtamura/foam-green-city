import * as THREE from 'three';

export const PLASTIC_TYPES=['ecobag','shoppingBag','basin','pail','liddedContainer','laundryBasket'];
export const PLASTIC_COLOURS={blue:0x6098b2,green:0x88a56c,pink:0xcc929d,cream:0xded7b9,red:0xaf6259,yellow:0xd3ba68};

// Resources belong to one kit. Shapes are authored in metres, resting at y=0.
export function createPlasticKit({patchMaterial=m=>m,radialSegments=16}={}){
  const geometries=new Set(),materials=new Set(),cache=new Map();
  const geo=g=>{geometries.add(g);return g;};
  const boxGeo=geo(new THREE.BoxGeometry(1,1,1));
  const lathe=p=>geo(new THREE.LatheGeometry(p.map(([x,y])=>new THREE.Vector2(x,y)),radialSegments));
  const basin=lathe([[0,0],[.12,0],[.15,.014],[.21,.11],[.218,.12],[.211,.128],[.203,.12],[.145,.025],[0,.018]]);
  const pail=lathe([[0,0],[.105,0],[.11,.01],[.145,.26],[.151,.273],[.142,.28],[.134,.27],[.101,.02],[0,.015]]);
  const handleGeo=geo(new THREE.TorusGeometry(1,.025,5,18,Math.PI));
  function material(colour,cloth=false){const c=PLASTIC_COLOURS[colour]??colour,key=c+':'+cloth;if(!cache.has(key)){const m=patchMaterial(new THREE.MeshPhongMaterial({color:c,shininess:cloth?3:32,side:THREE.DoubleSide}));cache.set(key,m);materials.add(m);}return cache.get(key);}
  function box(parent,m,x,y,z,w,h,d){const o=new THREE.Mesh(boxGeo,m);o.position.set(x,y,z);o.scale.set(w,h,d);parent.add(o);return o;}
  function panel(parent,m,points){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();const o=new THREE.Mesh(geo(g),m);parent.add(o);return o;}
  function create(type,{colour='blue',scale=1,rotation=0,fullness=.65,lean=0}={}){
    if(!PLASTIC_TYPES.includes(type))throw new Error('Unknown plastic type: '+type);
    if(!(Number.isFinite(scale)&&scale>0))throw new Error('Scale must be positive and finite');
    fullness=Math.max(0,Math.min(1,fullness));lean=Math.max(-.12,Math.min(.12,lean));
    const group=new THREE.Group();group.name='plastic-'+type;
    const m=material(colour,type==='ecobag'),light=material('cream');
    if(type==='basin'||type==='pail'){
      group.add(new THREE.Mesh(type==='basin'?basin:pail,m));
      if(type==='pail'){const h=new THREE.Mesh(handleGeo,light);h.scale.set(.14,.17,.14);h.position.y=.23;group.add(h);}
    }
    if(type==='ecobag'||type==='shoppingBag'){
      const w=type==='ecobag'?.34:.29,h=type==='ecobag'?.34:.28,d=.025+fullness*.15;
      // Open top, gusseted sides and a slightly displaced mouth.
      const lower=[[-w*.43,0,-d*.4],[w*.43,0,-d*.4],[w*.43,0,d*.4],[-w*.43,0,d*.4]];
      const upper=[[-w/2+lean,h,-d/2],[w/2+lean,h,-d/2],[w/2+lean,h,d/2],[-w/2+lean,h,d/2]];
      for(let i=0;i<4;i++){const j=(i+1)%4;panel(group,m,[lower[i],lower[j],upper[j],upper[i]]);}
      panel(group,m,[lower[3],lower[2],lower[1],lower[0]]);
      for(const side of [-1,1]){
        const hnd=new THREE.Mesh(handleGeo,m);hnd.scale.set(.075,.105,.075);hnd.position.set(lean,h,side*d*.5);group.add(hnd);
        if(type==='ecobag')for(const x of [-.075,.075])box(group,m,lean+x,h-.023,side*(d*.5+.001),.012,.045,.003);
      }
      // Low folded facets suggest contents without sealing the mouth.
      if(fullness>.4){const bundle=box(group,light,lean*.4,h*.44,0,w*.64,h*.65,d*.65);bundle.rotation.z=-lean;}
    }
    if(type==='liddedContainer'){
      const w=.22,d=.15,h=.075,t=.006;
      box(group,m,0,t/2,0,w,t,d);
      for(const side of [-1,1]){box(group,m,side*(w-t)/2,h/2,0,t,h,d);box(group,m,0,h/2,side*(d-t)/2,w-t*2,h,t);}
      box(group,light,0,h+.005,0,w+.014,.01,d+.014);
      for(const side of [-1,1])box(group,m,side*(w/2+.007),h-.006,0,.014,.025,.055);
    }
    if(type==='laundryBasket'){
      const w=.4,d=.29,h=.32,t=.014;
      box(group,m,0,.009,0,w,.018,d);
      // Actual gaps between ribs; no alpha textures or transparent surfaces.
      for(const side of [-1,1]){
        for(let i=0;i<9;i++)box(group,m,(i/8-.5)*(w-t),h/2,side*(d-t)/2,t,h,t);
        for(let i=1;i<6;i++)box(group,m,side*(w-t)/2,h/2,(i/6-.5)*(d-t),t,h,t);
        for(const y of [.055,.12,.185,.25,h]){box(group,m,0,y,side*(d-t)/2,w,.014,t);box(group,m,side*(w-t)/2,y,0,t,.014,d);}
        const grip=new THREE.Mesh(handleGeo,m);grip.scale.set(.06,.04,.06);grip.rotation.y=Math.PI/2;grip.position.set(side*(w-t)/2,h,0);group.add(grip);
      }
    }
    group.scale.setScalar(scale);group.rotation.y=rotation;group.updateMatrixWorld(true);
    const b=new THREE.Box3().setFromObject(group);
    group.userData.plastic={type,colour,scale,fullness,lean};
    group.userData.supportBounds={minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z,height:b.max.y};return group;
  }
  return {create,materials,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
