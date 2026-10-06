// A covered basketball court for a court room: painted floor, lines, and a hoop at each end.
//
// The room's route runs down the middle, so the walker comes in under one hoop, crosses the key,
// the centre circle, and the far key, and leaves under the other. Everything is plain colour in
// one mesh, to be drawn with the shared vertex-colour material.
//
// Dimensions follow a full court, 15 by 26 m here to fit an 18 by 28 m room: lines 10 cm wide, key
// 4.9 by 5.8 m, free-throw and centre circles of 1.8 m radius, three-point arc at 6.75 m from the
// rim, rim at 3.05 m. Lines are cut into short pieces so the route's bend carries them with the floor.
export const COURT_ROOM={width:18,length:28,height:7.6};
const SCHEMES=[
  {field:0x2f7d5a,key:0xb5523a,line:0xf1efe6},{field:0x2e5fa3,key:0xc23b32,line:0xf1efe6},{field:0x8a2f2f,key:0x2e5fa3,line:0xf0c24a},
  {field:0xb5523a,key:0x2f7d5a,line:0xf1efe6},{field:null,key:0x2e5fa3,line:0xf1efe6},{field:null,key:null,line:0xf0c24a},
];
const STEP=0.5,FIELD_LIFT=0.012,KEY_LIFT=0.016,LINE_LIFT=0.02,LINE=0.1;

export function createBasketballCourt({THREE,room,material,seed=1}){
  let state=(Math.imul(seed+4421,2246822519)>>>0)||1;
  const r=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const scheme=SCHEMES[Math.floor(r()*SCHEMES.length)],positions=[],colours=[],tint=new THREE.Color();
  const L=room.length,halfLength=L/2-1,halfWidth=Math.min(7.5,room.width/2-1.2),mid=-L/2;
  const quad=(a,b,c,d,colour)=>{
    tint.setHex(colour);
    for(const p of [a,b,c,a,c,d]){positions.push(p[0],p[1],p[2]);colours.push(tint.r,tint.g,tint.b);}
  };
  // A flat rectangle on the floor, cut into cells.
  const fill=(x0,x1,z0,z1,y,colour)=>{
    const nx=Math.max(1,Math.ceil((x1-x0)/STEP)),nz=Math.max(1,Math.ceil((z1-z0)/STEP));
    for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){
      const xa=x0+(x1-x0)*i/nx,xb=x0+(x1-x0)*(i+1)/nx,za=z0+(z1-z0)*j/nz,zb=z0+(z1-z0)*(j+1)/nz;
      quad([xa,y,zb],[xb,y,zb],[xb,y,za],[xa,y,za],colour);
    }
  };
  // A line through points on the floor, of the line width.
  const stroke=(points,colour=scheme.line)=>{
    for(let i=1;i<points.length;i++){
      const [ax,az]=points[i-1],[bx,bz]=points[i],l=Math.hypot(bx-ax,bz-az)||1,nx=-(bz-az)/l*LINE/2,nz=(bx-ax)/l*LINE/2;
      quad([ax+nx,LINE_LIFT,az+nz],[bx+nx,LINE_LIFT,bz+nz],[bx-nx,LINE_LIFT,bz-nz],[ax-nx,LINE_LIFT,az-nz],colour);
    }
  };
  const straight=(x0,z0,x1,z1)=>{const n=Math.max(1,Math.ceil(Math.hypot(x1-x0,z1-z0)/STEP));stroke(Array.from({length:n+1},(_,i)=>[x0+(x1-x0)*i/n,z0+(z1-z0)*i/n]));};
  const arc=(cx,cz,radius,from,to)=>{const n=Math.max(4,Math.ceil(Math.abs(to-from)*radius/0.35));stroke(Array.from({length:n+1},(_,i)=>{const a=from+(to-from)*i/n;return [cx+Math.cos(a)*radius,cz+Math.sin(a)*radius];}));};

  if(scheme.field!==null)fill(-halfWidth,halfWidth,mid-halfLength,mid+halfLength,FIELD_LIFT,scheme.field);
  // Boundary, half-court line, centre circle.
  straight(-halfWidth,mid-halfLength,halfWidth,mid-halfLength);straight(-halfWidth,mid+halfLength,halfWidth,mid+halfLength);
  straight(-halfWidth,mid-halfLength,-halfWidth,mid+halfLength);straight(halfWidth,mid-halfLength,halfWidth,mid+halfLength);
  straight(-halfWidth,mid,halfWidth,mid);arc(0,mid,1.8,0,Math.PI*2);
  // Each end: the key, its circle, and the three-point line. `toward` points from the baseline into the court.
  for(const toward of [-1,1]){
    const baseline=mid-toward*halfLength,line=baseline+toward*5.8,rim=baseline+toward*1.575,side=halfWidth-0.9;
    if(scheme.key!==null)fill(-2.45,2.45,Math.min(baseline,line),Math.max(baseline,line),KEY_LIFT,scheme.key);
    straight(-2.45,baseline,-2.45,line);straight(2.45,baseline,2.45,line);straight(-2.45,line,2.45,line);
    arc(0,line,1.8,0,Math.PI*2);
    // The arc meets the two straight parts where it is `side` from the middle.
    const reach=Math.sqrt(Math.max(0,6.75*6.75-side*side)),open=Math.acos(side/6.75);
    straight(-side,baseline,-side,rim+toward*reach);straight(side,baseline,side,rim+toward*reach);
    if(toward>0)arc(0,rim,6.75,open,Math.PI-open);else arc(0,rim,6.75,-open,-(Math.PI-open));
  }

  // Hoops. Solid parts are taken from ordinary geometries and coloured as they are copied in.
  const m=new THREE.Matrix4(),v=new THREE.Vector3(),q=new THREE.Quaternion(),e=new THREE.Euler();
  const solid=(geometry,colour,x,y,z,rx=0,ry=0,rz=0)=>{
    tint.setHex(colour);m.compose(v.set(x,y,z),q.setFromEuler(e.set(rx,ry,rz)),new THREE.Vector3(1,1,1));
    const g=geometry.index?geometry.toNonIndexed():geometry,p=g.attributes.position,point=new THREE.Vector3();
    for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(m);positions.push(point.x,point.y,point.z);colours.push(tint.r,tint.g,tint.b);}
    if(g!==geometry)g.dispose();geometry.dispose();
  };
  const box=(w,h,d,colour,x,y,z,rx=0,ry=0,rz=0)=>solid(new THREE.BoxGeometry(w,h,d),colour,x,y,z,rx,ry,rz);
  const board=pickBoard(r),rimColour=0xd9632b,steel=0x5f6a70;
  for(const toward of [-1,1]){
    // The wall the hoop hangs from, and the backboard's face 2.2 m out from it.
    const wall=toward>0?-L+0.02:-0.1,face=mid-toward*(halfLength-1.2),back=face-toward*0.025,rimZ=face+toward*0.375;
    box(1.8,1.05,0.05,board.face,0,3.425,back);
    for(const [w,h,x,y] of [[1.8,0.05,0,3.925],[1.8,0.05,0,2.925],[0.05,1.05,-0.875,3.425],[0.05,1.05,0.875,3.425],[0.59,0.04,0,3.5],[0.59,0.04,0,3.05+0.02],[0.04,0.45,-0.275,3.275],[0.04,0.45,0.275,3.275]])
      box(w,h,0.012,board.edge,x,y,face+toward*0.006);
    // Two arms back to the wall, and a brace under each.
    const span=Math.abs(back-wall),centre=(back+wall)/2;
    for(const x of [-0.6,0.6]){
      box(0.06,0.06,span,steel,x,3.7,centre);
      const drop=0.9,slope=Math.atan2(drop,span);box(0.05,0.05,Math.hypot(drop,span),steel,x,3.7-drop/2,centre,toward>0?-slope:slope);
    }
    solid(new THREE.TorusGeometry(0.225,0.012,5,16),rimColour,0,3.05,rimZ,Math.PI/2);
    box(0.1,0.02,0.15,rimColour,0,3.04,face+toward*0.075);
    // The net: twelve cords narrowing to the bottom, and two rings round them.
    for(let k=0;k<12;k++){
      const a=k/12*Math.PI*2,top=[Math.cos(a)*0.22,3.04,rimZ+Math.sin(a)*0.22],bottom=[Math.cos(a+0.26)*0.12,2.64,rimZ+Math.sin(a+0.26)*0.12],w=0.006;
      quad([top[0]-w,top[1],top[2]],[top[0]+w,top[1],top[2]],[bottom[0]+w,bottom[1],bottom[2]],[bottom[0]-w,bottom[1],bottom[2]],0xf1efe6);
      quad([top[0],top[1],top[2]-w],[top[0],top[1],top[2]+w],[bottom[0],bottom[1],bottom[2]+w],[bottom[0],bottom[1],bottom[2]-w],0xf1efe6);
    }
    for(const [y,radius] of [[2.86,0.17],[2.68,0.125]])solid(new THREE.TorusGeometry(radius,0.004,3,12),0xf1efe6,0,y,rimZ,Math.PI/2);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));
  geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);mesh.name='basketball-court';mesh.userData.own=true;
  mesh.userData.court={scheme,triangles:positions.length/9,halfWidth,halfLength};
  return mesh;
}
function pickBoard(r){
  return [{face:0xf1efe6,edge:0xc23b32},{face:0xf1efe6,edge:0x23324a},{face:0xd8d2c2,edge:0x2f7d5a},{face:0xcfd8d6,edge:0xd9632b}][Math.floor(r()*4)];
}
