// Baseboards along one room's painted walls, as a single mesh that follows the floor.
// OFFSET puts a strip against a wall face 0.1 m inside the room's edge: the near end wall, which is
// the previous room's partition. WINDOW suits the authored window modules, whose face is 0.08 m in. FLUSH puts it against a face on the edge itself.
const HEIGHT=0.1,THICK=0.022,OFFSET=0.112,WINDOW=0.092,FLUSH=0.012;

// runs: side-wall stretches {side,z0,z1,flush} in room coordinates (z0 nearer the entry); flush marks
// a solid module, whose face is on the room's edge. farProud is how far the far partition stands in.
export function createBaseboards({THREE,room,runs,material,floorAt=()=>0,farProud=0}){
  const positions=[],half=room.width/2;
  function strip(x0,z0,x1,z1){
    const alongZ=x0===x1,length=alongZ?Math.abs(z1-z0):Math.abs(x1-x0);
    if(length<0.06)return;
    const steps=Math.max(1,Math.ceil(length));
    const box=new THREE.BoxGeometry(alongZ?THICK:length,HEIGHT,alongZ?length:THICK,alongZ?1:steps,1,alongZ?steps:1).toNonIndexed();
    const p=box.attributes.position,cx=(x0+x1)/2,cz=(z0+z1)/2;
    for(let i=0;i<p.count;i++){const z=p.getZ(i)+cz;positions.push(p.getX(i)+cx,p.getY(i)+HEIGHT/2+floorAt(z),z);}
    box.dispose();
  }
  for(const run of runs){const x=run.side*(half-(run.flush?FLUSH:WINDOW));strip(x,run.z0,x,run.z1);}
  // Both end walls, either side of the doorway.
  for(const z of [-OFFSET+farProud,-room.length+farProud+FLUSH])for(const side of [-1,1])strip(side*1.0,z,side*half,z);
  if(!positions.length)return null;
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);mesh.name='baseboards';mesh.userData.own=true;
  mesh.userData.length=runs.reduce((sum,run)=>sum+Math.abs(run.z1-run.z0),0)+4*(half-1);
  return mesh;
}
