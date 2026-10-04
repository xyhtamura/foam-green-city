import {createLedTv} from './led-tv.js';
import {createPipeKit} from './pipe-parts.js';
import {generatePipeRun, checkPipeRun} from './pipe-runs.js';

// Cached prototypes and unit fittings survive room culls. Clones own no GPU resources.
export function createWallUtilities({THREE,curvize}){
  const kit=createPipeKit();
  for(const material of Object.values(kit.materials))curvize(material);
  const tvs=new Map();
  function tv(size,screenPreset){
    const key=size+screenPreset;
    if(!tvs.has(key))tvs.set(key,createLedTv({THREE,size,screenPreset,mountMode:'wallMount',curvize}));
    return tvs.get(key).clone();
  }
  function add({group,descriptor,index,spots,params}){
    if(descriptor.rise||descriptor.shape!=='rectangle')return;
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
    const wantsTv=params.get('tv')!=='0'&&(['sala','bedroom'].includes(descriptor.type)&&(index%3!==2)||params.has('tv')&&params.get('tv')!=='0');
    if(wantsTv){
      const requested=params.get('tv');
      const screen=['offStandby','noSignalBlue','colorBars'].includes(requested)?requested:['offStandby','offStandby','noSignalBlue','colorBars'][index%4];
      for(const spot of [...spots].sort((a,b)=>Math.abs(a.z+descriptor.length/2)-Math.abs(b.z+descriptor.length/2))){
        const object=tv(descriptor.type==='bedroom'?'small32':'medium43',screen);
        object.rotation.y=spot.side>0?-Math.PI/2:Math.PI/2;
        const bounds=new THREE.Box3().setFromObject(object);
        const x=spot.side>0?descriptor.width/2-0.105-bounds.max.x:-descriptor.width/2+0.105-bounds.min.x;
        object.position.set(x,1.5,spot.z);
        object.userData.wallTv={screen,size:object.userData.size};
        if(place(object,spot))break;
      }
    }
    // These source routes assume a 2.58 m ceiling. Keep that contract initially.
    const forced=params.get('pipes');
    if(forced==='0'||descriptor.height!==2.58||!(forced||['bathroom','kitchen'].includes(descriptor.type)&&index%3!==1||index%7===3))return;
    const style=['riser','supply','loop','stack'].includes(forced)?forced:descriptor.type==='bathroom'?'stack':index%2?'riser':'supply';
    for(const spot of [...spots].sort((a,b)=>Math.abs(a.z+descriptor.length*0.65)-Math.abs(b.z+descriptor.length*0.65))){
      const pieces=generatePipeRun({width:descriptor.width,length:2,seed:index+13+Math.round(-spot.z*17),style,side:spot.side});
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
