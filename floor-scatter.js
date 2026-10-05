// Indistinct low-poly floor objects. Planning is pure; one merged mesh is built per room.
export const SCATTER_LEVELS=['none','light','medium','heavy'];
const RATE={none:0,light:0.7,medium:1.6,heavy:3}; // objects per metre of side wall
const CAP=170,AISLE=0.72;

const PLASTIC=[0xc94f3f,0x2f6fa8,0xe2b93b,0x3f8f5e,0xd97b2b,0xe59aa8,0x7d5fa6,0x9fc7d6,0xe8e4d8,0x4a4a48];
const GLASS=[0x6f7f3a,0x5a3b24,0xc9d7c8,0x3d6b52,0xb7c9cf];
const CARD=[0xb98a56,0x8a6a47,0xc9a878,0xa77f52,0xd8cdb4];
const PAPER=[0xe8e4d8,0xd8d2bf,0xc9c4b0,0xf0ead2,0xb9c6c4];
const CLOTH=[0xe8e4d8,0xd6cbb0,0x7f8f9c,0x9b6b5a,0x5f7355,0xc2b280];
// radius is the planning footprint; tall kinds also stop the walker.
const KINDS={
  bottle:{radius:0.05,tall:false,colors:[...GLASS,...PLASTIC]},
  bottleDown:{radius:0.15,tall:false,colors:[...GLASS,...PLASTIC]},
  can:{radius:0.045,tall:false,colors:[...PLASTIC,0xa8a8a0]},
  canDown:{radius:0.07,tall:false,colors:[...PLASTIC,0xa8a8a0]},
  jug:{radius:0.11,tall:false,colors:[0x2f6fa8,0xe8e4d8,0x9fc7d6,0xe2b93b,0xc94f3f]},
  carton:{radius:0.2,tall:false,colors:CARD},
  cartonStack:{radius:0.27,tall:true,colors:CARD},
  crumple:{radius:0.09,tall:false,colors:[...PAPER,...PLASTIC]},
  bag:{radius:0.17,tall:false,colors:[...PLASTIC,...PAPER,0x2c2c2e]},
  sack:{radius:0.28,tall:true,colors:CLOTH},
  tub:{radius:0.22,tall:false,colors:PLASTIC},
  sheet:{radius:0.22,tall:false,flat:true,colors:[...PAPER,...CARD]},
  slippers:{radius:0.16,tall:false,colors:PLASTIC},
};
const MIX={
  domestic:[['bottle',14],['bottleDown',7],['can',8],['canDown',6],['jug',5],['carton',12],['cartonStack',5],['crumple',14],['bag',10],['sack',5],['tub',5],['sheet',9],['slippers',5]],
  kitchen:[['bottle',20],['bottleDown',7],['can',12],['canDown',6],['jug',9],['carton',10],['cartonStack',4],['crumple',9],['bag',10],['sack',7],['tub',7],['sheet',4],['slippers',2]],
  bathroom:[['bottle',30],['bottleDown',8],['jug',10],['tub',14],['crumple',8],['bag',6],['slippers',10],['can',4]],
  bare:[['carton',18],['cartonStack',10],['sheet',16],['crumple',16],['bag',10],['sack',9],['bottle',7],['bottleDown',6],['canDown',6],['jug',2]],
};
function hash(n){let h=Math.imul(n+1,0x45d9f3b)>>>0;h=Math.imul(h^(h>>>16),0x45d9f3b)>>>0;return (h^(h>>>16))>>>0;}
function stream(seed){let a=seed>>>0;return ()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}

// Roughly one room in ten receives nothing; undecorated room types are left empty more often.
export function scatterLevel(index,type,override){
  if(SCATTER_LEVELS.includes(override))return override;
  const roll=hash(index+5417)%100,none=type==='bare'?35:10;
  return roll<none?'none':roll<none+22?'light':roll<none+58?'medium':'heavy';
}

// blocked: local rectangles {minX,maxX,minZ,maxZ}; z runs from 0 down to -length.
export function planScatter(room,{seed=0,level='medium',blocked=[]}={}){
  const half=room.width/2,L=room.length,r=stream(Math.imul(seed+977,2654435761)>>>0);
  const large=['hall','auditorium'].includes(room.type),factor=room.type==='bathroom'?0.5:large?0.4:1;
  const target=Math.min(CAP,Math.round(RATE[level]*2*L*factor));
  const mix=MIX[room.type==='kitchen'||room.kitchenCorner?'kitchen':room.type==='bathroom'?'bathroom':room.type==='bare'||large?'bare':'domestic'];
  const inside=(x,z,radius)=>Math.abs(x)-radius>=AISLE&&Math.abs(x)+radius<=half-0.13&&z+radius<=-0.22&&z-radius>=-L+0.22;
  return fill({r,target,mix,level,blocked,inside,anchor(){
    const side=r()<0.5?-1:1,where=r();
    if(where<0.14)return [side*(half-0.25-r()*0.5),r()<0.5?-0.35-r()*0.6:-L+0.35+r()*0.6];       // corner
    if(where<0.82||room.width<6)return [side*(half-0.2-r()*r()*1.1),-0.3-r()*(L-0.6)];           // along a wall
    return [side*(AISLE+0.2+r()*(half-AISLE-0.4)),-0.3-r()*(L-0.6)];                             // open floor
  }});
}

// A side room: rect is its floor in the owning room's frame; objects keep to its edges.
export function planSideScatter(rect,{seed=0,level='medium',blocked=[],furnishing='bare'}={}){
  const r=stream(Math.imul(seed+3571,2654435761)>>>0),w=rect.maxX-rect.minX,d=rect.maxZ-rect.minZ;
  const mix=MIX[furnishing==='bedroom'?'domestic':furnishing==='washroom'?'bathroom':'bare'];
  const inside=(x,z,radius)=>x-radius>=rect.minX+0.13&&x+radius<=rect.maxX-0.13&&z-radius>=rect.minZ+0.13&&z+radius<=rect.maxZ-0.13;
  return fill({r,target:Math.round(RATE[level]*(w+d)*0.9),mix,level,blocked,inside,anchor(){
    const inset=0.2+r()*r()*0.6,along=r();
    return [[rect.minX+inset,rect.minZ+along*d],[rect.maxX-inset,rect.minZ+along*d],[rect.minX+along*w,rect.minZ+inset],[rect.minX+along*w,rect.maxZ-inset]][Math.floor(r()*4)];
  }});
}

function fill({r,target,mix,level,blocked,inside,anchor}){
  const total=mix.reduce((sum,[,w])=>sum+w,0);
  const pick=()=>{let n=r()*total;for(const [kind,w] of mix){n-=w;if(n<0)return kind;}return mix[0][0];};
  const items=[];
  function fits(x,z,radius,flat){
    if(!inside(x,z,radius))return false;
    if(blocked.some(b=>x+radius>b.minX&&x-radius<b.maxX&&z+radius>b.minZ&&z-radius<b.maxZ))return false;
    return items.every(o=>(flat||o.flat)||Math.hypot(o.x-x,o.z-z)>=(o.radius+radius)*0.8);
  }
  for(let attempt=0;items.length<target&&attempt<target*8;attempt++){
    const [ax,az]=anchor();
    const group=1+Math.floor(r()*r()*(level==='heavy'?8:5));
    for(let n=0;n<group&&items.length<target;n++){
      const kind=pick(),spec=KINDS[kind],size=0.8+r()*0.5,radius=spec.radius*size;
      const angle=r()*Math.PI*2,reach=n?0.12+r()*0.38:0;
      const x=ax+Math.cos(angle)*reach,z=az+Math.sin(angle)*reach;
      const item={kind,x,z,radius,size,yaw:r()*Math.PI*2,tall:spec.tall,flat:!!spec.flat,
        color:spec.colors[Math.floor(r()*spec.colors.length)],accent:PLASTIC[Math.floor(r()*PLASTIC.length)],shade:0.82+r()*0.3,u:[r(),r(),r()]};
      if(fits(x,z,radius,item.flat))items.push(item);
    }
  }
  return items;
}

// Rectangles that stop the walker, in the same local frame as the plan.
export function scatterBlocks(items){
  return items.filter(o=>o.tall).map(o=>({minX:o.x-o.radius*0.8,maxX:o.x+o.radius*0.8,minZ:o.z-o.radius*0.8,maxZ:o.z+o.radius*0.8,height:0.45*o.size}));
}

let templates=null;
function unitShapes(THREE){
  const flat=g=>{const out=g.index?g.toNonIndexed():g;return out.attributes.position.array;};
  const lathe=points=>flat(new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(...p)),6));
  return templates??={
    box:flat(new THREE.BoxGeometry(1,1,1).translate(0,0.5,0)),
    tube:flat(new THREE.CylinderGeometry(0.5,0.5,1,6).translate(0,0.5,0)),
    cone:flat(new THREE.CylinderGeometry(0.5,0.36,1,7).translate(0,0.5,0)),
    lump:flat(new THREE.IcosahedronGeometry(0.5,0).translate(0,0.5,0)),
    round:flat(new THREE.SphereGeometry(0.5,6,4).translate(0,0.5,0)),
    bottle:lathe([[0,0],[0.42,0],[0.46,0.6],[0.2,0.8],[0.16,1],[0,1]]),
    flask:lathe([[0,0],[0.36,0],[0.5,0.14],[0.5,0.58],[0.16,0.82],[0.16,1],[0,1]]),
  };
}

export function createScatterMesh(THREE,items,{material,floorAt=()=>0}={}){
  if(!items.length)return null;
  const shapes=unitShapes(THREE),positions=[],colors=[];
  const dust=new THREE.Color(0x9a988c),m=new THREE.Matrix4(),base=new THREE.Matrix4(),part=new THREE.Matrix4(),v=new THREE.Vector3(),c=new THREE.Color(),e=new THREE.Euler();
  // Each part is a unit shape, scaled, turned, then moved in the object's own frame.
  function add(shape,color,shade,[w,h,d],[x,y,z]=[0,0,0],[rx,ry,rz]=[0,0,0]){
    part.makeRotationFromEuler(e.set(rx,ry,rz)).scale(v.set(w,h,d)).setPosition(x,y,z);m.multiplyMatrices(base,part);
    c.setHex(color).lerp(dust,0.22).multiplyScalar(shade);   // dulled toward the floor, so plastics do not read as new
    const source=shapes[shape];
    for(let i=0;i<source.length;i+=3){v.set(source[i],source[i+1],source[i+2]).applyMatrix4(m);positions.push(v.x,v.y,v.z);colors.push(c.r,c.g,c.b);}
  }
  const side=Math.PI/2;
  for(const o of items){
    const s=o.size,[a,b,d]=o.u,k=o.shade;
    base.makeRotationY(o.yaw).setPosition(o.x,floorAt(o.z)+0.004,o.z);
    if(o.kind==='bottle'||o.kind==='bottleDown'){
      const w=(0.06+a*0.035)*s,h=(0.17+b*0.13)*s,shape=d<0.5?'bottle':'flask',down=o.kind==='bottleDown';
      add(shape,o.color,k,[w,h,w],down?[h/2,w/2,0]:[0,0,0],down?[0,0,side]:[0,0,0]);
      if(d>0.3)add('tube',o.accent,k,[w*0.42,0.02*s,w*0.42],down?[-h/2,w/2,0]:[0,h,0],down?[0,0,side]:[0,0,0]);
    }else if(o.kind==='can'||o.kind==='canDown'){
      const w=(0.055+a*0.03)*s,h=(0.09+b*0.05)*s,down=o.kind==='canDown';
      add('tube',o.color,k,[w,h,w],down?[h/2,w/2,0]:[0,0,0],down?[0,0,side]:[0,0,0]);
      if(!down)add('tube',0xa8a8a0,k,[w*0.9,0.006,w*0.9],[0,h,0]);
    }else if(o.kind==='jug'){
      const w=0.17*s,h=(0.24+a*0.08)*s;
      add('box',o.color,k,[w,h,w*0.8]);add('tube',o.accent,k,[w*0.3,0.035*s,w*0.3],[w*0.2,h,0]);
      add('box',o.color,k*0.9,[w*0.4,0.03*s,w*0.2],[-w*0.2,h,0]);
    }else if(o.kind==='carton'){
      const w=(0.16+a*0.2)*s,h=(0.1+b*0.18)*s,dp=(0.14+d*0.16)*s;
      add('box',o.color,k,[w,h,dp]);
      if(a>0.45)add('box',o.color,k*0.86,[w*0.5,0.008,dp],[w*0.3,h,0],[0,0,0.5+b*0.6]);   // a raised flap
    }else if(o.kind==='cartonStack'){
      let y=0;
      for(let n=0;n<2+Math.floor(a*2);n++){
        const w=(0.36-n*0.05+b*0.08)*s,h=(0.17+d*0.1)*s;
        add('box',o.color,k*(1-n*0.07),[w,h,w*0.8],[(d-0.5)*0.05*n,y,(b-0.5)*0.05*n],[0,(a-0.5)*0.5*n,0]);y+=h;
      }
    }else if(o.kind==='crumple'){
      const w=(0.08+a*0.1)*s;add('lump',o.color,k,[w,w*(0.55+b*0.35),w*(0.8+d*0.4)],[0,0,0],[a*2,0,b*2]);
    }else if(o.kind==='bag'){
      const w=(0.2+a*0.14)*s,h=(0.12+b*0.14)*s;
      add('lump',o.color,k,[w,h,w*(0.75+d*0.3)],[0,-h*0.12,0],[0,0,(a-0.5)*0.5]);
      add('lump',o.color,k*0.88,[w*0.22,h*0.35,w*0.22],[0,h*0.8,0]);                   // the knot
    }else if(o.kind==='sack'){
      const w=(0.38+a*0.14)*s,h=(0.22+b*0.14)*s;
      add('round',o.color,k,[w,h,w*0.72],[0,-h*0.1,0]);
      if(d>0.5)add('round',o.color,k*0.92,[w*0.9,h*0.9,w*0.66],[0.03,h*0.7,0.02],[0,0.5,0]);
    }else if(o.kind==='tub'){
      const w=(0.28+a*0.14)*s,h=(0.1+b*0.1)*s;
      add('cone',o.color,k,[w,h,w]);add('tube',o.color,k*0.6,[w*0.86,0.004,w*0.86],[0,h,0]);   // the dark interior
    }else if(o.kind==='sheet'){
      const w=(0.24+a*0.2)*s,dp=(0.18+b*0.2)*s;
      for(let n=0;n<1+Math.floor(d*3);n++)add('box',o.color,k*(1-n*0.06),[w,0.006,dp],[n*0.012,n*0.006,0],[0,n*0.2*(a-0.5),0]);
    }else if(o.kind==='slippers'){
      for(const dx of [-0.07,0.07]){
        add('box',o.color,k,[0.085*s,0.018,0.23*s],[dx*s,0,dx*a*0.4],[0,(b-0.5)*0.8*Math.sign(dx),0]);
        add('box',o.accent,k,[0.09*s,0.022,0.03*s],[dx*s,0.018,dx*a*0.4-0.05*s],[0,(b-0.5)*0.8*Math.sign(dx),0]);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);mesh.name='floor-scatter';mesh.userData.own=true;
  mesh.userData.scatter={count:items.length,triangles:positions.length/9};
  return mesh;
}
