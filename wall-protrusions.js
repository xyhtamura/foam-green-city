// Odd things that stand out from a wall: pilasters, boxed-in runs, ledges, blocks, beam stubs.
// One merged mesh per room, in the room's wall colour.
const KINDS=['pilaster','pilaster','chase','chase','ledge','ledge','block','block','block','beam'];

// spots: solid wall modules as {side,z}, 2 m wide and centred on z. Each protrusion takes its
// spot out of the list, so nothing else is hung there. avoid: {side,minZ,maxZ} stretches to skip.
export function addWallProtrusions({THREE,room,spots,seed,material,floorAt=()=>0,strangeness=0,avoid=[],force=false}){
  let state=(Math.imul(seed+2203,2654435761)>>>0)||1;
  const r=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const result={mesh:null,reservations:[],blocks:[],kinds:[]};
  if(!force&&r()>=0.2+0.5*strangeness)return result;
  const half=room.width/2,H=room.height,positions=[];
  function box(x,y,z,w,h,d){
    const g=new THREE.BoxGeometry(w,h,d).toNonIndexed(),p=g.attributes.position;
    for(let i=0;i<p.count;i++)positions.push(p.getX(i)+x,p.getY(i)+y,p.getZ(i)+z);
    g.dispose();
  }
  const usable=()=>spots.filter(s=>!avoid.some(a=>a.side===s.side&&s.z+1>a.minZ&&s.z-1<a.maxZ));
  for(let n=1+Math.floor(r()*(strangeness>0.3?5:3));n>0;n--){
    const open=usable();if(!open.length)break;
    const spot=open[Math.floor(r()*open.length)],kind=KINDS[Math.floor(r()*KINDS.length)];
    spots.splice(spots.indexOf(spot),1);
    // along the wall, out from the wall, up from the floor
    let along,out,tall,base=0;
    if(kind==='pilaster'){along=0.3+r()*0.4;out=0.1+r()*0.2;tall=H;}
    else if(kind==='chase'){along=0.14+r()*0.12;out=along;tall=H;}
    else if(kind==='ledge'){along=0.8+r()*1.1;out=0.1+r()*0.18;tall=0.06+r()*0.3;base=0.7+r()*0.8;}
    else if(kind==='block'){along=0.3+r()*0.5;out=0.15+r()*0.4;tall=0.25+r()*0.55;base=0.2+r()*1.5;}
    else{along=0.25+r()*0.25;out=0.3+r()*0.4;tall=0.2+r()*0.2;base=H-tall;}
    const runs=kind==='chase'&&r()<0.4?2:1,slack=Math.max(0,1-along/2-0.05);
    for(let k=0;k<runs;k++){
      const z=spot.z+(r()*2-1)*slack*(runs>1?0.5:1)+(k?0.45:0)-(runs>1?0.22:0),x=spot.side*(half-0.1-out/2),y=floorAt(z)+base;
      box(x,y+tall/2,z,out,tall,along);
      const rect={minX:x-out/2-0.03,maxX:x+out/2+0.03,minZ:z-along/2-0.03,maxZ:z+along/2+0.03};
      if(base<0.05)result.reservations.push(rect);
      if(base<1.8)result.blocks.push({...rect,minY:y,maxY:y+tall});
    }
    result.kinds.push(kind);
  }
  if(!positions.length)return result;
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.computeVertexNormals();
  result.mesh=new THREE.Mesh(geometry,material);result.mesh.name='wall-protrusions';result.mesh.userData.own=true;
  return result;
}
