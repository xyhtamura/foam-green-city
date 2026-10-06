import * as THREE from 'three';

export const STORAGE_TYPES=['iceBox','waterJug','drawerTower','cabinetDrawers','liddedBin'];
export function createPlasticStorageKit({patchMaterial=m=>m}={}){
  const geometries=new Set(),materials=new Set(),cache=new Map();
  const geo=g=>{geometries.add(g);return g;};
  const boxGeo=geo(new THREE.BoxGeometry(1,1,1));
  const cylinder=geo(new THREE.CylinderGeometry(1,1,1,16));
  function mat(c){if(!cache.has(c)){const m=patchMaterial(new THREE.MeshPhongMaterial({color:c,shininess:28}));cache.set(c,m);materials.add(m);}return cache.get(c);}
  function box(g,m,x,y,z,w,h,d){const o=new THREE.Mesh(boxGeo,m);o.position.set(x,y,z);o.scale.set(w,h,d);g.add(o);return o;}
  function cyl(g,m,x,y,z,r,h){const o=new THREE.Mesh(cylinder,m);o.position.set(x,y,z);o.scale.set(r,h,r);g.add(o);return o;}
  function profile(g,m,points){const o=new THREE.Mesh(geo(new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(...p)),16)),m);g.add(o);return o;}
  function handle(g,m,x,y,z,w=.12){for(const s of [-1,1])box(g,m,x+s*w/2,y+.018,z,.014,.036,.025);box(g,m,x,y+.038,z,w+.014,.015,.025);}
  function create(type,{colour=0xb95453,trimColour=0xe0ddce,scale=1,rotation=0,size='medium',drawers=5,wheels=false}={}){
    if(!STORAGE_TYPES.includes(type))throw new Error('Unknown storage type: '+type);
    if(!(scale>0&&Number.isFinite(scale)))throw new Error('Scale must be positive and finite');
    if(!['small','medium','large'].includes(size))throw new Error('Size must be small, medium, or large');
    if(!Number.isInteger(drawers)||drawers<2||drawers>7)throw new Error('Drawers must be 2–7');
    const g=new THREE.Group();g.name='plastic-storage-'+type;
    const body=mat(colour),trim=mat(trimColour),dark=mat(0x454b48);
    if(type==='iceBox'){
      const k={small:.65,medium:1,large:1.35}[size],w=.55*k,d=.34*k,h=.34*k;
      // Rounded-edge shell, solid closed lid; interior is intentionally omitted.
      const shape=new THREE.Shape(),r=.025*k;
      shape.moveTo(-w/2+r,-d/2);shape.lineTo(w/2-r,-d/2);shape.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);shape.lineTo(w/2,d/2-r);shape.quadraticCurveTo(w/2,d/2,w/2-r,d/2);shape.lineTo(-w/2+r,d/2);shape.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);shape.lineTo(-w/2,-d/2+r);shape.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);
      const shell=geo(new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,curveSegments:3}));shell.rotateX(-Math.PI/2);g.add(new THREE.Mesh(shell,body));
      box(g,trim,0,h+.022*k,0,w+.02*k,.044*k,d+.02*k);
      for(const s of [-1,1]){box(g,trim,s*(w/2+.015*k),h*.65,0,.02*k,.10*k,.025*k);box(g,trim,s*(w/2+.023*k),h*.77,0,.025*k,.022*k,.12*k);}
      for(let i=0;i<7;i++)box(g,body,(i-3)*w*.115,h*.22,-d/2-.003*k,.012*k,h*.35,.009*k);
      box(g,trim,0,h-.015*k,-d/2-.011*k,.05*k,.06*k,.025*k);
      if(wheels)for(const s of [-1,1]){const o=cyl(g,dark,s*(w/2-.04*k),.046*k,d/2,.045*k,.025*k);o.rotation.x=Math.PI/2;}
    }
    if(type==='waterJug'){
      const k={small:.8,medium:1,large:1.3}[size],r=.14*k,h=.39*k;
      profile(g,body,[[0,0],[r*.82,0],[r*.91,.025*k],[r*.87,h*.5],[r,h*.8],[r,h],[0,h]]);
      cyl(g,trim,0,h+.018*k,0,r*1.04,.036*k);handle(g,trim,0,h+.036*k,0,.11*k);
      for(const s of [-1,1])box(g,trim,s*r,h*.8,0,.025*k,.06*k,.065*k);
      const tap=cyl(g,trim,0,.065*k,-r*.96,.018*k,.036*k);tap.rotation.x=Math.PI/2;
      box(g,trim,0,.044*k,-r*1.08,.018*k,.027*k,.022*k);box(g,dark,0,.068*k,-r*1.10,.014*k,.013*k,.008*k);
    }
    if(type==='drawerTower'||type==='cabinetDrawers'){
      const w=type==='drawerTower'?.47:.68,d=.4,h=drawers*.16+.075;
      box(g,trim,0,h/2,0,w,h,d);
      const dw=type==='drawerTower'?w-.025:w*.48,cx=type==='drawerTower'?0:w*.245;
      for(let i=0;i<drawers;i++){
        const y=.055+i*.16+.075;box(g,body,cx,y,-d/2-.007,dw,.145,.025);
        box(g,dark,cx,y-.044,-d/2-.022,dw*.52,.018,.006);
        box(g,trim,cx,y-.039,-d/2-.032,dw*.48,.01,.016);
        for(let j=0;j<5;j++)box(g,body,cx+(j-2)*dw*.15,y+.017,-d/2-.025,.008,.065,.005);
      }
      if(type==='cabinetDrawers'){
        box(g,trim,-w*.245,h*.52,-d/2-.02,w*.46,h-.10,.023);
        box(g,body,-w*.245,h*.49,-d/2-.037,w*.46,.08,.018);
        box(g,trim,-.04,h*.49,-d/2-.056,.022,.068,.023);
      }
      for(const x of [-w*.4,w*.4])for(const z of [-d*.38,d*.38])box(g,trim,x,.015,z,.06,.03,.06);
    }
    if(type==='liddedBin'){
      profile(g,body,[[0,0],[.16,0],[.18,.025],[.205,.5],[.21,.53],[0,.53]]);
      profile(g,body,[[0,.53],[.224,.53],[.224,.55],[.205,.57],[.15,.585],[0,.585]]);
      handle(g,body,0,.585,0,.12);
      for(const s of [-1,1])box(g,body,0,.53,s*.215,.075,.05,.021);
      for(let i=0;i<8;i++){const a=i*Math.PI/4;const rib=box(g,body,Math.sin(a)*.192,.28,Math.cos(a)*.192,.017,.38,.012);rib.rotation.y=a;}
    }
    g.scale.setScalar(scale);g.rotation.y=rotation;g.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(g);
    g.userData.plasticStorage={type,size,drawers,colour,wheels};g.userData.supportBounds={minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z,height:b.max.y};return g;
  }
  return {create,materials,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
