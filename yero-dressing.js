// What sometimes stands on the yero path: electric posts strung with wire, and grass in tufts.
//
// First made for a ten-second reel staged from this room, then brought back here. A yero room
// draws two even chances, one for posts and one for grass, so a quarter of them have posts, a
// quarter grass, a quarter both, and a quarter are the bare walkway they always were.
//
// One mesh in plain colour, for the shared vertex-colour material, laid out in the room's own
// straight coordinates like the sheets: x across, y up, z from 0 at the near doorway to -length.

// The two chances, from the room's own index, so a room keeps its dressing on every visit.
// `force` is 'plain', 'posts', 'grass', or 'both'.
export function yeroDressing(index,force){
  if(force==='plain')return {posts:false,grass:false};
  if(force==='posts')return {posts:true,grass:false};
  if(force==='grass')return {posts:false,grass:true};
  if(force==='both')return {posts:true,grass:true};
  const draw=salt=>{let h=Math.imul((index|0)+salt,2654435761)>>>0;h^=h>>>15;h=Math.imul(h,2246822519)>>>0;h^=h>>>13;return (h>>>0)/4294967296;};
  return {posts:draw(4409)<0.5,grass:draw(9173)<0.5};
}

const POST_GREYS=[0x8e8e86,0x7f7a70,0x9a968c],ARM=0x4a4038,WIRE=0x2c2f2e,GREENS=[0x4f8f5f,0x6b8a3a,0x88a84a,0x3f7a4c,0xa3b85a];
const POLE_DEPTH=50,CELL=0.05;

// The top of the metal on a 5 cm grid, filled from the path's triangles in one pass, so grass can
// stand on the sheets without a ray cast per tuft.
function metalTops(path,length){
  const x0=-3,columns=Math.ceil(6/CELL),rows=Math.ceil((length+1)/CELL),tops=new Float32Array(columns*rows).fill(-1),p=path.geometry.attributes.position.array;
  for(let i=0;i<p.length;i+=9){
    const ax=p[i],ay=p[i+1],az=p[i+2],bx=p[i+3],by=p[i+4],bz=p[i+5],cx=p[i+6],cy=p[i+7],cz=p[i+8],area=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);
    if(Math.abs(area)<1e-12)continue;
    const c0=Math.max(0,Math.floor((Math.min(ax,bx,cx)-x0)/CELL)),c1=Math.min(columns-1,Math.floor((Math.max(ax,bx,cx)-x0)/CELL));
    const r0=Math.max(0,Math.floor(-Math.max(az,bz,cz)/CELL)),r1=Math.min(rows-1,Math.floor(-Math.min(az,bz,cz)/CELL));
    for(let row=r0;row<=r1;row++)for(let column=c0;column<=c1;column++){
      const x=x0+(column+0.5)*CELL,z=-(row+0.5)*CELL,u=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/area,v=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/area,w=1-u-v;
      if(u<0||v<0||w<0)continue;
      const y=u*ay+v*by+w*cy,k=row*columns+column;
      if(y>tops[k])tops[k]=y;
    }
  }
  return (x,z)=>{
    const column=Math.floor((x-x0)/CELL),row=Math.floor(-z/CELL);
    if(column<0||column>=columns||row<0||row>=rows)return null;
    const y=tops[row*columns+column];return y<0?null:y;
  };
}

// `path` is the mesh from createYeroPath, still in the room's straight coordinates.
export function createYeroDressing({THREE,room,path,material,seed=1,posts=true,grass=true}){
  let state=(Math.imul(seed+3301,2246822519)>>>0)||1;
  const r=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const positions=[],colours=[],tint=new THREE.Color(),point=new THREE.Vector3(),placed=new THREE.Matrix4(),turn=new THREE.Euler(),spin=new THREE.Quaternion(),where=new THREE.Vector3(),one=new THREE.Vector3(1,1,1);
  const L=room.length,counts={posts:0,tufts:0};
  // A solid from three.js, moved by `local` and then by the post it belongs to.
  function solid(geometry,local,post,hex,shade=1){
    const flat=geometry.toNonIndexed(),p=flat.attributes.position;
    tint.setHex(hex).multiplyScalar(shade);
    for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).add(local).applyMatrix4(post);positions.push(point.x,point.y,point.z);colours.push(tint.r,tint.g,tint.b);}
    geometry.dispose();flat.dispose();
  }
  if(posts){
    // Down one side of the walkway, a little outside it, about eleven metres apart; now and then
    // one stands alone on the other side. Each runs down far past the sheets, so its foot is lost.
    const side=r()<0.5?-1:1,reach=room.width/2,stood=[];
    for(let z=3-r()*4;z>-L-9;z-=9.5+r()*4){
      const top=6.2+r()*1.2,grey=POST_GREYS[Math.floor(r()*POST_GREYS.length)];
      placed.compose(where.set(side*(reach+0.5+r()*1.1),0,z),spin.setFromEuler(turn.set((r()-0.5)*0.08,(r()-0.5)*0.7,(r()-0.5)*0.12)),one);
      const post=placed.clone();
      solid(new THREE.CylinderGeometry(0.085,0.13,POLE_DEPTH+top,7,1,true),new THREE.Vector3(0,(top-POLE_DEPTH)/2,0),post,grey);
      solid(new THREE.BoxGeometry(1.9,0.09,0.09),new THREE.Vector3(0,top-0.35,0),post,ARM);
      solid(new THREE.BoxGeometry(1.3,0.09,0.09),new THREE.Vector3(0,top-1.05,0),post,ARM);
      solid(new THREE.BoxGeometry(0.34,0.5,0.3),new THREE.Vector3(0.2,top-2.1,0),post,grey,0.9);
      stood.push([[-0.9,top-0.3],[0.9,top-0.3],[-0.6,top-1],[0.6,top-1]].map(([x,y])=>new THREE.Vector3(x,y,0).applyMatrix4(post)));
      counts.posts++;
    }
    if(r()<0.5){
      const top=6.4+r(),z=-L*(0.3+r()*0.5);
      placed.compose(where.set(-side*(reach+1.6+r()*1.4),0,z),spin.setFromEuler(turn.set((r()-0.5)*0.1,r()*3,(r()-0.5)*0.16)),one);
      const post=placed.clone();
      solid(new THREE.CylinderGeometry(0.085,0.13,POLE_DEPTH+top,7,1,true),new THREE.Vector3(0,(top-POLE_DEPTH)/2,0),post,POST_GREYS[0]);
      solid(new THREE.BoxGeometry(1.9,0.09,0.09),new THREE.Vector3(0,top-0.35,0),post,ARM);
      counts.posts++;
    }
    // Four wires from each post to the next, sagging. A wire is two thin strips crossed, since the
    // shared material draws triangles and not lines.
    const a=new THREE.Vector3(),b=new THREE.Vector3(),T=0.012;
    tint.setHex(WIRE);
    const strip=(dx,dy)=>{for(const [p,sx,sy] of [[a,-1,-1],[b,-1,-1],[b,1,1],[a,-1,-1],[b,1,1],[a,1,1]]){positions.push(p.x+sx*dx,p.y+sy*dy,p.z);colours.push(tint.r,tint.g,tint.b);}};
    for(let i=0;i+1<stood.length;i++)for(let k=0;k<4;k++){
      const from=stood[i][k],to=stood[i+1][k],sag=0.35+r()*0.5,SEGMENTS=10;
      for(let s=0;s<SEGMENTS;s++){
        const u=s/SEGMENTS,v=(s+1)/SEGMENTS;
        a.lerpVectors(from,to,u);a.y-=sag*4*u*(1-u);b.lerpVectors(from,to,v);b.y-=sag*4*v*(1-v);
        strip(T,0);strip(0,T);
      }
    }
  }
  if(grass){
    // Tufts standing on the metal, off the line the walker keeps.
    const top=metalTops(path,L),tufts=Math.round(L*4.5);
    for(let tuft=0;tuft<tufts;tuft++){
      const x=(r()<0.5?-1:1)*(0.45+r()*1.6),z=-1-r()*(L-2),y=top(x,z);
      if(y===null)continue;
      const blades=6+Math.floor(r()*10),hex=GREENS[Math.floor(r()*GREENS.length)];
      for(let blade=0;blade<blades;blade++){
        const angle=r()*6.283,spread=0.03+r()*0.07,height=0.18+r()*0.5,lean=0.05+r()*0.22,wide=0.008+r()*0.008;
        const bx=x+Math.cos(angle)*spread,bz=z+Math.sin(angle)*spread,sx=-Math.sin(angle)*wide,sz=Math.cos(angle)*wide;
        positions.push(bx-sx,y,bz-sz,bx+sx,y,bz+sz,bx+Math.cos(angle)*lean,y+height,bz+Math.sin(angle)*lean);
        // Brighter than the hex: a blade's face is seldom square to the light, and the shared
        // material is lit.
        tint.setHex(hex).multiplyScalar(1.05);colours.push(tint.r,tint.g,tint.b,tint.r,tint.g,tint.b);
        tint.setHex(hex).multiplyScalar(1.7+r()*0.4);colours.push(tint.r,tint.g,tint.b);
      }
      counts.tufts++;
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));
  geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);mesh.name='yero-dressing';mesh.userData.own=true;
  mesh.userData.yeroDressing={...counts,triangles:positions.length/9};
  return mesh;
}
