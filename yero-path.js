// The yero path: sheets of corrugated roofing laid one over another as a walkway, with nothing
// under them and nothing round them.
//
// Remembered from a path through a long puddle, crossed on roofing sheets thrown down as they came:
// lapped, skewed, some crosswise, a plank under one end. Here there is no puddle and no ground; the
// sheets hang in the open, in the room's own colour of air. The walker's route for the room bends
// from side to side, and the sheets are laid along it, so the camera stays over them.
//
// One mesh in plain colour, for the shared vertex-colour material. A sheet is a zigzag in section,
// 76 mm from ridge to ridge and 18 mm deep, which is what corrugated sheet measures.
import {routePoint} from './room-sequences.js?v=2f62cbb3fb';

// Each entry is a colour and its weight: bare galvanised greys most, then paint.
const COLOURS=[[0xaeb4b3,14],[0x9aa3a4,12],[0xc2c7c4,10],[0x8e9698,8],[0xbfdcc9,12],[0x4f8f5f,10],[0x2f6b4f,5],[0x8a3b2a,8],[0x7a5236,7],[0x4f7fa8,5],[0xe6e6de,5],[0xd9b24a,2],[0x6b8a3a,2]];
const RUST=0x7a4a2c,PITCH=0.076,DEPTH=0.018;

export function createYeroPath({THREE,room,route,material,seed=1}){
  let state=(Math.imul(seed+7717,2246822519)>>>0)||1;
  const r=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const total=COLOURS.reduce((sum,[,w])=>sum+w,0);
  const paint=()=>{let at=r()*total;for(const [colour,w] of COLOURS){at-=w;if(at<0)return colour;}return COLOURS[0][0];};
  const positions=[],colours=[],base=new THREE.Color(),rust=new THREE.Color(RUST),tint=new THREE.Color();
  const point=new THREE.Vector3(),turn=new THREE.Euler(),placed=new THREE.Matrix4(),where=new THREE.Vector3(),spin=new THREE.Quaternion(),one=new THREE.Vector3(1,1,1);
  let sheets=0;
  // One sheet: `width` across its ridges, `length` along them, lying about (x,y,z) and turned.
  function sheet(x,y,z,width,length,yaw,pitch,roll){
    placed.compose(where.set(x,y,z),spin.setFromEuler(turn.set(pitch,yaw,roll,'YXZ')),one);
    base.setHex(paint());
    const columns=Math.max(4,Math.round(width/(PITCH/2))),rows=Math.max(2,Math.ceil(length/0.6)),worn=r()<0.6?0.15+r()*0.5:0,grid=[];
    for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++){
      const u=i/columns,v=j/rows,ridge=i%2;
      point.set((u-0.5)*width,ridge?DEPTH/2:-DEPTH/2,(v-0.5)*length).applyMatrix4(placed);
      // Ridges catch the light and valleys keep the dirt; rust comes in from the cut ends.
      const end=Math.max(0,1-Math.min(v,1-v)*length/0.35),stain=worn*end*(0.5+0.5*Math.sin(i*1.7+j*2.3+x*5));
      tint.copy(base).multiplyScalar(ridge?1.06:0.9).lerp(rust,Math.min(0.85,stain));
      grid.push([point.x,point.y,point.z,tint.r,tint.g,tint.b]);
    }
    for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){
      const a=j*(columns+1)+i;
      for(const k of [a,a+columns+1,a+1,a+1,a+columns+1,a+columns+2]){const p=grid[k];positions.push(p[0],p[1],p[2]);colours.push(p[3],p[4],p[5]);}
    }
    sheets++;
  }
  // A plank under a sheet, lying across the way and sticking out at one side.
  function plank(x,y,z,yaw){
    const length=0.9+r()*0.7,geometry=new THREE.BoxGeometry(length,0.04,0.09).toNonIndexed(),p=geometry.attributes.position;
    placed.compose(where.set(x,y,z),spin.setFromEuler(turn.set(0,yaw,0)),one);
    tint.setHex([0x7a5a3a,0x8f6a3f,0x6b4a2f,0x9a7a52][Math.floor(r()*4)]);
    for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(placed);positions.push(point.x,point.y,point.z);colours.push(tint.r,tint.g,tint.b);}
    geometry.dispose();
  }
  // Along the route: a sheet every 0.8 m or so, each lapping the last and a little higher or lower,
  // most lying along the way, some thrown across it.
  let lift=0;
  for(let d=0.2;d<route.length-0.1;d+=0.55+r()*0.55){
    const at=routePoint(route,d),across=r()<0.2,width=0.72+r()*0.2,length=across?1.5+r()*0.9:1.3+r()*1.3;
    lift=(lift+1)%5;
    const y=0.012+lift*0.022+r()*0.01,yaw=at.yaw+(across?Math.PI/2:0)+(r()-0.5)*(across?0.5:0.7);
    const x=at.x+(r()-0.5)*0.34,z=at.z+(r()-0.5)*0.2;
    sheet(x,y,z,width,length,yaw,(r()-0.5)*0.05,(r()-0.5)*0.08);
    if(r()<0.28)plank(x+(r()-0.5)*0.3,y-0.045,z+(r()-0.5)*0.6,at.yaw+(r()-0.5)*0.6);
  }
  // A few more at the two doorways, square to them, so the step out of a room lands on metal.
  for(const z of [-0.55,-room.length+0.55])sheet((r()-0.5)*0.1,0.006,z,0.86,1.25,(r()-0.5)*0.12,0,0);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));
  geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);mesh.name='yero-path';mesh.userData.own=true;
  mesh.userData.yero={sheets,triangles:positions.length/9};
  return mesh;
}
