import * as THREE from 'three';

// Shared model clones assembled in a wall strip; local +X points into the room.
export function createRoomSet(type,models,{width,length,index=0}={}){
  if(!['kitchen','bathroom','kitchenCorner'].includes(type))return null;
  const group=new THREE.Group();group.name=type;group.userData.roomSet=type;group.userData.floorProp=true;
  function piece(name,height,z,{depth=0.55,base=0,rotation=Math.PI/2,maxWidth=0.85}={}){
    const obj=models[name].clone();obj.rotation.y=rotation;
    let box=new THREE.Box3().setFromObject(obj),size=box.getSize(new THREE.Vector3());
    obj.scale.multiplyScalar(Math.min(height/size.y,maxWidth/size.z,1.05/size.x));
    box=new THREE.Box3().setFromObject(obj);
    obj.position.set(depth-(box.min.x+box.max.x)/2,base-box.min.y,z-(box.min.z+box.max.z)/2);
    obj.userData.fixture=name;group.add(obj);return obj;
  }
  if(type==='bathroom'){
    const nozzle=new THREE.Group();nozzle.userData.fixture='showerNozzle';
    const metal=new THREE.MeshLambertMaterial({color:0x929c98});
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.22,8),metal);
    arm.rotation.z=Math.PI/2;arm.position.set(0.13,1.97,-1.1);arm.userData.own=true;arm.userData.ownMaterial=true;
    const head=new THREE.Mesh(new THREE.CylinderGeometry(0.068,0.04,0.04,12),metal);
    head.rotation.z=-0.45;head.position.set(0.24,1.94,-1.1);head.userData.own=true;
    nozzle.add(arm,head);group.add(nozzle);
    piece('toilet',0.76,0.1,{depth:0.55});
    piece('bathroomSink',0.84,1.15,{depth:0.45});
    piece('bathroomMirror',0.65,1.15,{depth:0.06,base:1.18});
  }else{
    // Fitted counters are an occasional departure from the domestic baseline.
    const seed=Math.imul(index+31,0x45d9f3b)>>>0;
    const fitted=((seed^(seed>>>16))>>>0)%5===0;
    group.userData.fittedCounters=fitted;
    // Local +X is depth; the two burners sit along the wall, on a simple stand.
    function solid(parent,geometry,color,x,y,z){
      const m=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({color}));
      m.position.set(x,y,z);m.userData.own=m.userData.ownMaterial=true;parent.add(m);return m;
    }
    function block(parent,color,x,y,z,w,h,d){return solid(parent,new THREE.BoxGeometry(w,h,d),color,x,y,z);}
    const sink=new THREE.Group();sink.userData.fixture='aluminumSink';group.add(sink);
    block(sink,0x899694,0.5,0.73,-1.15,0.62,0.04,0.82);
    // An open basin: recessed bottom and four rim walls, rather than a solid slab.
    block(sink,0x9ea9a8,0.5,0.78,-1.15,0.48,0.02,0.62);
    for(const x of [0.245,0.755])block(sink,0xbcc5c2,x,0.825,-1.15,0.03,0.11,0.68);
    for(const z of [-1.475,-0.825])block(sink,0xbcc5c2,0.5,0.825,z,0.54,0.11,0.03);
    for(const x of [0.25,0.75])for(const z of [-1.48,-0.82])block(sink,0x858d88,x,0.36,z,0.035,0.72,0.035);
    solid(sink,new THREE.CylinderGeometry(0.026,0.026,0.12,8),0xc6cdca,0.22,0.93,-1.15);
    block(sink,0xc6cdca,0.29,0.99,-1.15,0.16,0.025,0.025);
    solid(sink,new THREE.CylinderGeometry(0.027,0.027,0.004,10),0x4c5554,0.5,0.793,-1.15);
    const stove=new THREE.Group();stove.userData.fixture='tabletopBurner';group.add(stove);
    block(stove,0x88765a,0.55,0.72,-0.2,0.65,0.055,0.9);
    for(const x of [0.29,0.81])for(const z of [-0.56,0.16])block(stove,0x6f6555,x,0.35,z,0.045,0.7,0.045);
    block(stove,0x252a29,0.55,0.805,-0.2,0.52,0.115,0.82);
    block(stove,0xb6bebc,0.55,0.868,-0.2,0.54,0.018,0.84);
    for(const z of [-0.43,0.03]){
      solid(stove,new THREE.CylinderGeometry(0.095,0.095,0.022,12),0xb2a26c,0.55,0.89,z);
      const ring=solid(stove,new THREE.TorusGeometry(0.125,0.012,4,12),0x202522,0.55,0.912,z);ring.rotation.x=Math.PI/2;
      for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
        const grate=block(stove,0x202522,0.55+Math.cos(angle)*0.103,0.924,z+Math.sin(angle)*0.103,0.09,0.025,0.022);grate.rotation.y=-angle;
      }
      const knob=solid(stove,new THREE.CylinderGeometry(0.027,0.027,0.025,10),0x141918,0.828,0.803,z);knob.rotation.z=Math.PI/2;
    }
    if(type==='kitchen')piece('kitchenFridge',1.65,0.8,{maxWidth:0.8});
    if(fitted){
      piece('kitchenCabinet',0.85,type==='kitchen'?1.7:0.75);
      piece('kitchenCabinet',0.75,-1.75,{depth:0.72,rotation:0,maxWidth:0.55});
    }
    const pot=piece('phPot',0.18,-0.43,{depth:0.55,base:0.937,maxWidth:0.24});
    pot.userData.countertop=true;
    if(index%3===0)piece('phPot',0.14,0.03,{depth:0.55,base:0.937,maxWidth:0.22});
  }
  group.position.set(-width/2+0.12,0,-length/2);
  if(index%2){group.rotation.y=Math.PI;group.position.x=width/2-0.12;}
  return group;
}

export function createRoomFixture(models,{height,index=0,type,lighting,fixture:choice}={}){
  const group=new THREE.Group();group.name='room-light';group.userData.lightFixture=true;
  const kind=['bulb','tube'].includes(choice)?choice:index%3===0?'tube':'bulb';
  group.userData.fixtureType=kind;
  if(kind==='bulb'){
    const holder=new THREE.Mesh(new THREE.CylinderGeometry(0.052,0.044,0.09,12),new THREE.MeshLambertMaterial({color:0xe1dfd4}));
    holder.position.y=height-0.045;holder.userData.own=holder.userData.ownMaterial=true;
    const body=new THREE.Mesh(new THREE.CylinderGeometry(0.044,0.061,0.065,12),new THREE.MeshLambertMaterial({color:0xdedfd8}));
    body.position.y=height-0.12;body.userData.own=body.userData.ownMaterial=true;
    const globe=new THREE.Mesh(new THREE.SphereGeometry(0.075,12,8),new THREE.MeshLambertMaterial({color:lighting?.lamp?0xfff1cd:0xc9ceca,emissive:0xffe4af,emissiveIntensity:lighting?.lamp?0.8:0}));
    globe.scale.y=1.1;globe.position.y=height-0.18;globe.userData.own=globe.userData.ownMaterial=true;
    group.add(holder,body,globe);group.userData.lightColor=0xffecd0;group.userData.lightY=height-0.35;
    return group;
  }
  const fixture=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.06,0.22),new THREE.MeshLambertMaterial({color:0xc6cac6}));
  fixture.userData.own=true;fixture.userData.ownMaterial=true;
  const box=new THREE.Box3().setFromObject(fixture);
  fixture.position.set(-(box.min.x+box.max.x)/2,height-box.max.y,-0.1);
  group.add(fixture);
  const glow=new THREE.Mesh(new THREE.BoxGeometry(0.88,0.025,0.14),new THREE.MeshLambertMaterial({color:type==='bathroom'?0xe6f1e7:0xffebc1,emissive:type==='bathroom'?0xa6bca9:0xa88c52,emissiveIntensity:0.7}));
  if(!lighting?.lamp){glow.material.emissiveIntensity=0;glow.material.color.setHex(0xb3b8b2);}
  const underside=new THREE.Box3().setFromObject(fixture).min.y;
  glow.userData.own=true;glow.userData.ownMaterial=true;glow.position.set(0,underside-0.015,-0.1);group.add(glow);
  group.userData.lightColor=type==='bathroom'?0xddebe0:index%3===0?0xf3e5c9:0xffe4b5;
  group.userData.lightY=underside-0.4;
  return group;
}
