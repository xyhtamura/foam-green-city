import {floorHeight} from './room-sequences.js?v=67bc69e65d';
import {localBounds} from './object-supports.js?v=67bc69e65d';
import {branchOpenings} from './side-spaces.js?v=67bc69e65d';

export function addWoodDetails({THREE,group,room,spots,texture,curvize,force=null}){
  const owner=new THREE.Group();owner.name='wood-details';group.add(owner);
  const geometries=new Set(),materials=new Set(),report=[];
  const seed=Math.imul((room.index??0)+29,0x45d9f3b)>>>0;
  const enabled=kind=>force==='all'||force===kind||(force!=='off'&&seed%({walls:5,divider:7,planks:3}[kind])===0);
  function board(kind,x,y,z,w,h,d,yaw=0,solid=false){
    const geometry=new THREE.BoxGeometry(w,h,d,Math.max(1,Math.ceil(w)),1,Math.max(1,Math.ceil(d)));
    const material=curvize(new THREE.MeshLambertMaterial({map:texture,color:seed%2?0xbda887:0x9d8b72}));
    const mesh=new THREE.Mesh(geometry,material);mesh.name='wood-'+kind;mesh.position.set(x,y,z);mesh.rotation.y=yaw;owner.add(mesh);
    const bounds=localBounds(THREE,mesh,group);
    const inside=bounds.min.x>=-room.width/2+.06&&bounds.max.x<=room.width/2-.06&&bounds.min.z>=-room.length+.18&&bounds.max.z<=-.18;
    const b={minX:bounds.min.x,maxX:bounds.max.x,minZ:bounds.min.z+room.startZ,maxZ:bounds.max.z+room.startZ,minY:bounds.min.y,maxY:bounds.max.y};
    const clear=!group.userData.walkBlocks.some(a=>b.maxX>a.minX-.05&&b.minX<a.maxX+.05&&b.maxZ>a.minZ-.05&&b.minZ<a.maxZ+.05&&b.maxY>a.minY&&b.minY<a.maxY);
    if(!inside||(kind!=='wall'&&!clear)){owner.remove(mesh);geometry.dispose();material.dispose();return false;}
    geometries.add(geometry);materials.add(material);
    if(solid)group.userData.walkBlocks.push(b);
    report.push({kind,inside,clear:kind==='wall'?null:clear,bounds:{minX:bounds.min.x,maxX:bounds.max.x,minZ:bounds.min.z,maxZ:bounds.max.z},contactGap:kind==='plank'?bounds.min.y-floorHeight(room,z):null});return true;
  }
  if(room.shape==='rectangle'&&!room.stairs&&!room.columns&&!room.platform&&!room.rise&&room.width<=8&&room.type!=='bathroom'){
    if(enabled('walls'))for(const spot of spots){
      if(board('wall',spot.side*(room.width/2-.085),.86,spot.z,.024,1.6,1.6))break;
    }
    if(enabled('divider'))for(const spot of spots){
      if(board('divider',spot.side*(room.width/2-.7),.95,spot.z,1.2,1.9,.065,0,true))break;
    }
    const openings=branchOpenings(room),floorSpots=[...spots];
    for(const side of [-1,1])for(let z=-1;z>-room.length;z-=2){
      if(!openings.some(p=>p.side===side&&Math.abs(p.z-z)<2.1))floorSpots.push({side,z});
    }
    if(enabled('planks'))for(const spot of floorSpots){
      const x=spot.side*(room.width/2-.32),z=spot.z;
      if(board('plank',x,.017,z,1.35,.03,.15,Math.PI/2+spot.side*.055)){
        board('plank',x-spot.side*.025,.049,z-.08,1.18,.03,.14,Math.PI/2-spot.side*.05);break;
      }
    }
  }
  owner.userData.report=report;
  owner.userData.dispose=()=>{for(const g of geometries)g.dispose();for(const m of materials)m.dispose();};
  return owner;
}
