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
    piece('kitchenSink',0.85,-1.15);
    const stove=piece('kitchenStove',0.85,-0.2);
    if(type==='kitchen')piece('kitchenFridge',1.65,0.8,{maxWidth:0.8});
    if(fitted){
      piece('kitchenCabinet',0.85,type==='kitchen'?1.7:0.75);
      piece('kitchenCabinet',0.75,-1.75,{depth:0.72,rotation:0,maxWidth:0.55});
    }
    const pot=piece('phPot',0.18,-0.2,{depth:0.58,base:new THREE.Box3().setFromObject(stove).max.y+0.01,maxWidth:0.32});
    pot.userData.countertop=true;
    piece(index%2?'phBananas':'phGinger',0.09,-1.1,{depth:0.62,base:0.86,maxWidth:0.35});
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
