import * as THREE from 'three';

export const BATHROOM_TYPES=['paperRoll','paperHolder','toiletBrush','plunger','sprayBottle','cleanerBottle','toothbrushCup'];
export function createBathroomKit({patchMaterial=m=>m}={}){
  const geometries=new Set(),materials=new Set(),cache=new Map();
  const geo=g=>{geometries.add(g);return g;};
  const boxGeo=geo(new THREE.BoxGeometry(1,1,1)),cylinder=geo(new THREE.CylinderGeometry(1,1,1,12)),ball=geo(new THREE.SphereGeometry(1,10,6));
  function mat(c){if(!cache.has(c)){const m=patchMaterial(new THREE.MeshLambertMaterial({color:c}));cache.set(c,m);materials.add(m);}return cache.get(c);}
  function box(g,m,x,y,z,w,h,d){const o=new THREE.Mesh(boxGeo,m);o.position.set(x,y,z);o.scale.set(w,h,d);g.add(o);return o;}
  function cyl(g,m,x,y,z,r,h){const o=new THREE.Mesh(cylinder,m);o.position.set(x,y,z);o.scale.set(r,h,r);g.add(o);return o;}
  function lathe(g,m,p){const o=new THREE.Mesh(geo(new THREE.LatheGeometry(p.map(v=>new THREE.Vector2(...v)),16)),m);g.add(o);return o;}
  function create(type,{colour=0x779aa1,accent=0xdcd6c3,scale=1,rotation=0,remaining=1,tail=false}={}){
    if(!BATHROOM_TYPES.includes(type))throw new Error('Unknown bathroom item: '+type);
    if(!(scale>0&&Number.isFinite(scale)))throw new Error('Scale must be positive');
    remaining=Math.max(0,Math.min(1,remaining));
    const g=new THREE.Group();g.name='bathroom-'+type;const plastic=mat(colour),cream=mat(accent),paper=mat(0xe8e2d2),metal=mat(0x98a4a1),dark=mat(0x635c53);
    if(type==='paperRoll'||type==='paperHolder'){
      const r=.023+remaining*.036;
      const roll=lathe(g,paper,[[.021,0],[r,0],[r,.1],[.021,.1],[.021,0]]);
      // Exposed brown core, with an actual hole through the roll.
      lathe(g,dark,[[.019,0],[.021,0],[.021,.1],[.019,.1],[.019,0]]);
      if(type==='paperHolder'){
        const rollGroup=new THREE.Group();g.children.slice().forEach(o=>rollGroup.add(o));g.add(rollGroup);rollGroup.rotation.z=Math.PI/2;rollGroup.position.set(.05,r,0);
        box(g,metal,0,r+.07,.075,.14,.12,.014);
        for(const s of [-1,1])box(g,metal,s*.064,r,.025,.01,.018,.10);
        const axle=cyl(g,metal,0,r,0,.005,.14);axle.rotation.z=Math.PI/2;
        if(tail)box(g,paper,0,r*.6,-r,.095,r*.7,.001);
        g.userData.wallMount={backZ:.082};
      }else if(tail)box(g,paper,r+.013,.002,0,.03,.003,.075);
    }
    if(type==='toiletBrush'){
      lathe(g,plastic,[[0,0],[.045,0],[.054,.11],[.051,.13],[.044,.13],[.038,.012],[0,.012]]);
      cyl(g,cream,0,.27,0,.009,.38);
      const head=new THREE.Mesh(ball,cream);head.position.y=.095;head.scale.set(.031,.044,.031);g.add(head);
      for(let i=0;i<10;i++){const a=i*Math.PI/5;cyl(g,cream,Math.sin(a)*.027,.12,Math.cos(a)*.027,.003,.025);}
    }
    if(type==='plunger'){
      lathe(g,plastic,[[0,0],[.065,0],[.068,.009],[.047,.047],[.023,.065],[0,.065]]);
      cyl(g,cream,0,.285,0,.009,.45);
    }
    if(type==='sprayBottle'||type==='cleanerBottle'){
      lathe(g,plastic,[[0,0],[.035,0],[.049,.022],[.045,.15],[.025,.19],[.013,.20],[0,.20]]);
      box(g,cream,0,.10,-.046,.052,.065,.003);
      if(type==='sprayBottle'){
        cyl(g,cream,0,.216,0,.017,.032);
        box(g,cream,0,.235,-.014,.026,.027,.065);
        box(g,dark,0,.234,-.05,.017,.013,.009);
        const trigger=box(g,cream,0,.202,-.027,.012,.045,.012);trigger.rotation.x=-.3;
      }else{
        const neck=cyl(g,plastic,0,.226,0,.013,.068);neck.rotation.x=-.48;
        const cap=cyl(g,cream,0,.258,-.016,.017,.023);cap.rotation.x=-.48;
      }
    }
    if(type==='toothbrushCup'){
      lathe(g,plastic,[[0,0],[.032,0],[.041,.092],[.035,.094],[.027,.009],[0,.009]]);
      for(const s of [-1,1]){
        const b=new THREE.Group();b.position.set(s*.012,.012,0);b.rotation.z=s*.12;g.add(b);
        box(b,s>0?cream:metal,0,.095,0,.009,.19,.012);
        box(b,cream,0,.204,0,.013,.032,.017);
        for(let i=0;i<5;i++)box(b,paper,0,.194+i*.005,-.012,.012,.003,.012);
      }
    }
    g.scale.setScalar(scale);g.rotation.y=rotation;g.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(g);
    g.userData.bathroomTool={type,remaining,tail};g.userData.supportBounds={minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z,height:b.max.y};return g;
  }
  return {create,materials,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
