// Draws a room's still meshes as one mesh per material.
//
// A room is some hundreds of meshes, most of them clones of shared prototypes, and each is a
// draw call. After a room is built, every mesh that will not move again is copied into a merged
// mesh with the others that share its material, in the room's own frame. The originals stay in
// the room's tree, where the placement code and the inspector read them, and move to a layer
// the camera does not draw.
export const SOURCE_LAYER=1;
// A material's meshes are left as they are when together they pass this many vertices. Merging
// copies every vertex, so rows of one heavy model, such as 160 chairs, would cost megabytes
// and a long frame for each room; those keep sharing the prototype's geometry instead.
const VERTEX_LIMIT=40000;

// Left out: anything that turns or faces the camera after the build, blended materials, whose
// draw order is per object, and meshes with a material list.
function moves(object,group){
  for(let p=object;p&&p!==group;p=p.parent)if(p.userData.billboard||p.userData.spin||p.name==='fan-rotor'||p.name==='fan-head')return true;
  return false;
}
function shown(object,group){
  for(let p=object;p&&p!==group;p=p.parent)if(!p.visible)return false;
  return true;
}

export function mergeStaticMeshes(THREE,group){
  group.updateMatrixWorld(true);
  const toRoom=group.matrixWorld.clone().invert(),buckets=new Map();
  let considered=0;
  group.traverse(o=>{
    if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh)return;
    considered++;
    const material=o.material,g=o.geometry;
    if(Array.isArray(material)||material.transparent||o.renderOrder!==0)return;
    if(!g.attributes.position||!g.attributes.normal||Number.isFinite(g.drawRange.count)||g.drawRange.start!==0)return;
    if(moves(o,group)||!shown(o,group))return;
    if(!buckets.has(material))buckets.set(material,[]);
    buckets.get(material).push(o);
  });
  const matrix=new THREE.Matrix4(),normalMatrix=new THREE.Matrix3(),v=new THREE.Vector3();
  const began=performance.now(),report={meshes:considered,merged:0,into:0,heavy:0,vertices:0,bytes:0};
  for(const [material,sources] of buckets){
    if(sources.length<2)continue;
    let vertexCount=0,indexCount=0;
    for(const o of sources){const g=o.geometry;vertexCount+=g.attributes.position.count;indexCount+=g.index?g.index.count:g.attributes.position.count;}
    if(vertexCount>VERTEX_LIMIT){report.heavy+=sources.length;continue;}
    const withUv=!!material.map&&sources.some(o=>o.geometry.attributes.uv),withColour=!!material.vertexColors;
    const positions=new Float32Array(vertexCount*3),normals=new Float32Array(vertexCount*3);
    const uvs=withUv?new Float32Array(vertexCount*2):null,colours=withColour?new Float32Array(vertexCount*3).fill(1):null;
    const indices=vertexCount>65535?new Uint32Array(indexCount):new Uint16Array(indexCount);
    let at=0,indexAt=0;
    for(const o of sources){
      const g=o.geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,colour=g.attributes.color,count=p.count;
      matrix.multiplyMatrices(toRoom,o.matrixWorld);normalMatrix.getNormalMatrix(matrix);
      // Plain float attributes are read straight from their arrays, with the matrix written out;
      // this loop is most of what merging costs. Anything else goes through the accessors.
      const e=matrix.elements,k=normalMatrix.elements,direct=a=>a.isBufferAttribute&&!a.isInterleavedBufferAttribute&&!a.normalized&&a.array instanceof Float32Array;
      if(direct(p)&&direct(n)){
        const P=p.array,N=n.array;
        for(let i=0,j=at*3;i<count*3;i+=3,j+=3){
          const x=P[i],y=P[i+1],z=P[i+2],nx=N[i],ny=N[i+1],nz=N[i+2];
          positions[j]=e[0]*x+e[4]*y+e[8]*z+e[12];positions[j+1]=e[1]*x+e[5]*y+e[9]*z+e[13];positions[j+2]=e[2]*x+e[6]*y+e[10]*z+e[14];
          const a=k[0]*nx+k[3]*ny+k[6]*nz,b=k[1]*nx+k[4]*ny+k[7]*nz,c=k[2]*nx+k[5]*ny+k[8]*nz,l=1/(Math.hypot(a,b,c)||1);
          normals[j]=a*l;normals[j+1]=b*l;normals[j+2]=c*l;
        }
      }else for(let i=0;i<count;i++){
        v.fromBufferAttribute(p,i).applyMatrix4(matrix);positions[(at+i)*3]=v.x;positions[(at+i)*3+1]=v.y;positions[(at+i)*3+2]=v.z;
        v.fromBufferAttribute(n,i).applyMatrix3(normalMatrix).normalize();normals[(at+i)*3]=v.x;normals[(at+i)*3+1]=v.y;normals[(at+i)*3+2]=v.z;
      }
      if(uvs&&uv){if(direct(uv)&&uv.itemSize===2)uvs.set(uv.array.subarray(0,count*2),at*2);else for(let i=0;i<count;i++){uvs[(at+i)*2]=uv.getX(i);uvs[(at+i)*2+1]=uv.getY(i);}}
      if(colours&&colour){if(direct(colour)&&colour.itemSize===3)colours.set(colour.array.subarray(0,count*3),at*3);else for(let i=0;i<count;i++){colours[(at+i)*3]=colour.getX(i);colours[(at+i)*3+1]=colour.getY(i);colours[(at+i)*3+2]=colour.getZ(i);}}
      // A mirrored object has its triangles wound the other way.
      const flip=matrix.determinant()<0,triangles=(g.index?g.index.count:count)/3;
      const I=g.index?.array;
      for(let t=0;t<triangles*3;t+=3){
        const a=I?I[t]:t,b=I?I[t+1]:t+1,c=I?I[t+2]:t+2;
        indices[indexAt++]=at+a;indices[indexAt++]=at+(flip?c:b);indices[indexAt++]=at+(flip?b:c);
      }
      at+=count;
      o.layers.set(SOURCE_LAYER);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));
    if(uvs)geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));
    if(colours)geometry.setAttribute('color',new THREE.BufferAttribute(colours,3));
    geometry.setIndex(new THREE.BufferAttribute(indices,1));
    geometry.computeBoundingSphere();geometry.computeBoundingBox();
    // Once on the graphics card the copy in memory is not read again: bounds are already worked
    // out, and nothing casts rays at a merged mesh.
    for(const attribute of [...Object.values(geometry.attributes),geometry.index]){
      report.bytes+=attribute.array.byteLength;
      attribute.onUpload(function(){this.array=null;});
    }
    const mesh=new THREE.Mesh(geometry,material);
    mesh.name='merged-static';mesh.userData.own=true;mesh.userData.merged=sources.length;mesh.raycast=()=>{};
    group.add(mesh);
    report.merged+=sources.length;report.into++;report.vertices+=vertexCount;
  }
  report.ms=+(performance.now()-began).toFixed(1);
  return report;
}
