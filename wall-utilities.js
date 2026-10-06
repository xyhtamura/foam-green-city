import {createLedTv} from './led-tv.js?v=3fc34d4d8f';
import {createPipeKit} from './pipe-parts.js?v=3fc34d4d8f';
import {generatePipeRun, checkPipeRun, PIPE_STYLE_IDS} from './pipe-runs.js?v=3fc34d4d8f';
import {tableSupport,reserveSupport} from './object-supports.js?v=3fc34d4d8f';

// Cached prototypes and unit fittings survive room culls. Clones own no GPU resources.
export function createWallUtilities({THREE,curvize}){
  const kit=createPipeKit();
  for(const material of Object.values(kit.materials))curvize(material);
  const tvs=new Map();
  function tv(size,screenPreset,mountMode='wallMount'){
    const key=size+screenPreset+mountMode;
    if(!tvs.has(key))tvs.set(key,createLedTv({THREE,size,screenPreset,mountMode,curvize}));
    return tvs.get(key).clone();
  }
  function add({group,descriptor,index,spots,params}){
    if(descriptor.rise||descriptor.shape!=='rectangle'||descriptor.stairs||descriptor.columns||descriptor.platform)return;
    group.updateMatrixWorld(true);
    const occupied=group.children.filter(o=>o.userData.floorProp||o.userData.billboard||o.userData.diningTable||o.userData.diningChair||o.userData.utilityProp||o.userData.door||o.userData.roomSet);
    // Include the assembled kitchen/bathroom set and sofa, whose flags differ.
    group.traverse(o=>{if(o.name==='uratexSofa'||o.userData.roomSetType)occupied.push(o);});
    const boxes=occupied.map(o=>new THREE.Box3().setFromObject(o).expandByScalar(0.04));
    function place(object,spot){
      group.add(object);group.updateMatrixWorld(true);
      const box=new THREE.Box3().setFromObject(object);
      if(boxes.some(b=>box.intersectsBox(b))){group.remove(object);return false;}
      object.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});
      boxes.push(box);spots.splice(spots.indexOf(spot),1);return true;
    }
    const forcedTable=params.get('tvMount')==='table';
    const wantsTv=params.get('tv')!=='0'&&(['sala','bedroom'].includes(descriptor.type)&&(index%3!==2)||params.has('tv')&&params.get('tv')!=='0'||forcedTable);
    if(wantsTv){
      const requested=params.get('tv');
      const screen=['offStandby','noSignalBlue','colorBars'].includes(requested)?requested:['offStandby','offStandby','noSignalBlue','colorBars'][((index%4)+4)%4];
      let onTable=false;
      group.userData.tvPlacement={requested:forcedTable?'table':'seeded',rejected:[]};
      if(params.get('tvMount')!=='wall'&&(forcedTable||(Math.imul(index+11,2654435761)>>>0)%2===0)){
        for(const table of group.children.filter(o=>o.userData.diningTable)){
          const support=tableSupport(table.userData.placement);if(!support)continue;
          const mountMode=index%2?'centerPedestal':'tableStand',object=tv('small32',screen,mountMode);
          // Face across the room, accounting for the table's own orientation.
          object.rotation.y=(table.position.x>0?-Math.PI/2:Math.PI/2)-table.rotation.y;
          table.add(object);group.updateMatrixWorld(true);
          const inverse=table.matrixWorld.clone().invert();
          function localBox(root){
            const b=new THREE.Box3();root.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();b.union(o.geometry.boundingBox.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld)));}});return b;
          }
          let b=localBox(object);object.position.y=support.height+0.002-b.min.y;
          group.updateMatrixWorld(true);b=localBox(object);
          const footprint={minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z};
          const props=table.children.filter(o=>o!==object&&o.name!=='scallopedRunner'&&(!o.isMesh||o.userData.rawObject));
          const overlap=props.some(o=>b.intersectsBox(localBox(o)));
          const worldBox=new THREE.Box3().setFromObject(object);
          const blocked=occupied.filter(o=>o!==table).some(o=>worldBox.intersectsBox(new THREE.Box3().setFromObject(o)))||worldBox.max.y>descriptor.height;
          if(overlap||blocked||!reserveSupport(support,footprint)){
            table.remove(object);group.userData.tvPlacement.rejected.push({table:table.userData.placement.kind,reason:overlap?'surface occupied':blocked?'room obstruction':'support too small'});continue;
          }
          table.userData.supportSurface=support;table.userData.tabletopTv=true;
          object.userData.tableTv={screen,size:object.userData.size,mount:mountMode,support:table.userData.placement.kind,contactGap:b.min.y-support.height,footprint};
          object.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});boxes.push(worldBox);onTable=true;break;
        }
      }
      if(!onTable)for(const spot of [...spots].sort((a,b)=>Math.abs(a.z+descriptor.length/2)-Math.abs(b.z+descriptor.length/2))){
        const object=tv(descriptor.type==='bedroom'?'small32':'medium43',screen);
        object.rotation.y=spot.side>0?-Math.PI/2:Math.PI/2;
        const bounds=new THREE.Box3().setFromObject(object);
        const x=spot.side>0?descriptor.width/2-0.105-bounds.max.x:-descriptor.width/2+0.105-bounds.min.x;
        object.position.set(x,1.5,spot.z);
        object.userData.wallTv={screen,size:object.userData.size,mount:'wallMount'};
        if(place(object,spot))break;
      }
    }
    // These source routes assume a 2.58 m ceiling. Keep that contract initially.
    const forced=params.get('pipes');
    if(forced==='0'||descriptor.height!==2.58||!(forced||['bathroom','kitchen'].includes(descriptor.type)&&index%3!==1||index%7===3))return;
    const pool=descriptor.type==='bathroom'?['riser','supply','riser','loop','stack','drain']:['supply','riser','loop','meander','overhead','bundle'];
    const style=PIPE_STYLE_IDS.includes(forced)?forced:pool[(Math.imul(index+19,2654435761)>>>0)%pool.length];
    for(const spot of [...spots].sort((a,b)=>Math.abs(a.z+descriptor.length*0.65)-Math.abs(b.z+descriptor.length*0.65))){
      const drainage=['stack','drain'].includes(style);
      const pieces=generatePipeRun({width:descriptor.width,length:2,seed:index+13+Math.round(-spot.z*17),style,side:spot.side,diameter:drainage?undefined:index%3===0?0.027:0.021,material:drainage?'orange':'blue'});
      if(!pieces.length||!checkPipeRun(pieces,{width:descriptor.width,length:2}).ok)continue;
      // Tile ends are not actual room surfaces. Close horizontal terminations.
      for(const p of [...pieces])if(p.kind==='pipe'&&p.axis[2]){
        for(const end of [0,1]){
          const position=p.position.map((v,k)=>v+p.axis[k]*p.length*end);
          if(Math.abs(position[2])<0.002||Math.abs(position[2]+2)<0.002)
            pieces.push({kind:'cap',run:p.run,diameter:p.diameter,material:p.material,position,axis:p.axis.map(v=>v*(end?1:-1))});
        }
      }
      const object=kit.build(pieces);object.position.z=spot.z+1;
      object.userData.pipeRun={style,pieces:pieces.length,material:pieces[0].material};
      if(place(object,spot))break;
    }
  }
  return {add,dispose(){kit.dispose();for(const prototype of tvs.values())prototype.userData.dispose();tvs.clear();}};
}
