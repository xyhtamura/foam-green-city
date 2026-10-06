// The yero floor: sheets of corrugated roofing laid one over another as a walkway, with nothing
// under them and nothing round them.
//
// Remembered from a path through a long puddle, crossed on roofing sheets thrown down as they came:
// lapped, skewed, some crosswise, a plank under one end. Here there is no puddle and no ground; the
// sheets hang in the open, in the room's own colour of air.
//
// The room is an ordinary one to walk: straight down the middle. Only the laying is haphazard. A run
// of sheets down the middle keeps metal under the walker, and more are thrown to either side of it,
// as far out as a walker may stray, so the edge is ragged and the whole reads as a path that bends.
//
// One mesh in plain colour, for the shared vertex-colour material. A sheet is a zigzag in section,
// 76 mm from ridge to ridge and 18 mm deep, which is what corrugated sheet measures.

// Each entry is a colour and its weight: bare galvanised greys most, then paint.
const COLOURS=[[0xaeb4b3,14],[0x9aa3a4,12],[0xc2c7c4,10],[0x8e9698,8],[0xbfdcc9,12],[0x4f8f5f,10],[0x2f6b4f,5],[0x8a3b2a,8],[0x7a5236,7],[0x4f7fa8,5],[0xe6e6de,5],[0xd9b24a,2],[0x6b8a3a,2]];
const RUST=0x7a4a2c,PITCH=0.076,DEPTH=0.018;

export function createYeroPath({THREE,room,material,seed=1}){
  let state=(Math.imul(seed+7717,2246822519)>>>0)||1;
  const r=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const total=COLOURS.reduce((sum,[,w])=>sum+w,0);
  const paint=()=>{let at=r()*total;for(const [colour,w] of COLOURS){at-=w;if(at<0)return colour;}return COLOURS[0][0];};
  const positions=[],colours=[],base=new THREE.Color(),rust=new THREE.Color(RUST),tint=new THREE.Color();
  const point=new THREE.Vector3(),turn=new THREE.Euler(),placed=new THREE.Matrix4(),where=new THREE.Vector3(),spin=new THREE.Quaternion(),one=new THREE.Vector3(1,1,1);
  const L=room.length,reach=room.width/2-0.1;
  let sheets=0,lift=0;
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
  // Each sheet lies a little higher or lower than the last, so no two share a plane.
  const level=()=>{lift=(lift+1)%7;return 0.012+lift*0.019+r()*0.008;};
  // A plank under a sheet, lying across the way and sticking out at one side.
  function plank(x,y,z,yaw){
    const length=0.9+r()*0.9,geometry=new THREE.BoxGeometry(length,0.04,0.09).toNonIndexed(),p=geometry.attributes.position;
    placed.compose(where.set(x,y,z),spin.setFromEuler(turn.set(0,yaw,0)),one);
    tint.setHex([0x7a5a3a,0x8f6a3f,0x6b4a2f,0x9a7a52][Math.floor(r()*4)]);
    for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(placed);positions.push(point.x,point.y,point.z);colours.push(tint.r,tint.g,tint.b);}
    geometry.dispose();
  }
  // The run down the middle: lapped end to end, each a little off the line and a little askew, so
  // the walker's own line is always over metal.
  for(let z=-0.5;z>-L+0.3;){
    const length=1.3+r()*1.2,width=0.76+r()*0.16;
    sheet((r()-0.5)*0.3,level(),z-length/2+0.2,width,length,(r()-0.5)*0.45,(r()-0.5)*0.04,(r()-0.5)*0.06);
    z-=length*(0.62+r()*0.22);
  }
  // To either side: sheets thrown down along the way, across it, and at every angle between. The
  // spread swells and narrows down the room's length, which is what makes the path seem to wander.
  const phase=r()*6.28,second=r()*6.28;
  for(let z=-0.4;z>-L+0.4;z-=0.42+r()*0.5){
    const drift=0.75*Math.sin(-z*0.42+phase)+0.4*Math.sin(-z*0.97+second);
    for(const side of [-1,1]){
      // Wide on the side the path leans to, thin or bare on the other.
      const lean=Math.max(0,0.5+side*drift*0.9),chance=Math.min(0.95,0.25+lean*0.7);
      if(r()>chance)continue;
      const across=r()<0.3,width=0.72+r()*0.2,length=across?1.2+r()*0.9:1.1+r()*1.3;
      const x=side*(0.5+r()*Math.min(reach-0.5,0.5+lean*1.1)),yaw=(across?Math.PI/2:0)+(r()-0.5)*(across?0.7:0.9);
      sheet(x,level(),z+(r()-0.5)*0.3,width,length,yaw,(r()-0.5)*0.05,(r()-0.5)*0.08);
      if(r()<0.22)plank(x+(r()-0.5)*0.3,0,z+(r()-0.5)*0.5,(r()-0.5)*1.2);
    }
  }
  // One square to each doorway, so the step out of a room lands on metal.
  for(const z of [-0.55,-L+0.55])sheet((r()-0.5)*0.1,0.006,z,0.86,1.25,(r()-0.5)*0.12,0,0);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));
  geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);mesh.name='yero-path';mesh.userData.own=true;
  mesh.userData.yero={sheets,triangles:positions.length/9};
  return mesh;
}
