// Clotheslines and clothes on hangers, built light enough to fill a room.
//
// The household-details kit from fgc-cx draws each hanger as a tube of some 1,150 triangles, which
// is right for one rack and not for a room strung with lines. Here a hanger is two flat ribbons of
// 16 triangles and a garment is a flat silhouette, so a hundred garments on their hangers come to
// about 3,000 triangles. Everything is plain colour, to be baked with the room's other household
// objects; nothing here is added to a scene by itself.
//
// A line runs along local x, from -length/2 to +length/2, its ends at y=0, sagging between. Clothes
// on hangers hang across the line, facing along it, as they do on a real one; pegged clothes hang
// along it. Turn the group to run a line down a room.

// Outlines in metres, hung from y=0 at the middle of the top edge.
const OUTLINES={
  shirt:[[-.11,0],[-.22,-.08],[-.17,-.19],[-.11,-.15],[-.11,-.36],[.11,-.36],[.11,-.15],[.17,-.19],[.22,-.08],[.11,0],[.045,-.025],[-.045,-.025]],
  sando:[[-.06,0],[-.1,-.03],[-.125,-.16],[-.12,-.38],[.12,-.38],[.125,-.16],[.1,-.03],[.06,0],[.035,-.09],[-.035,-.09]],
  shorts:[[-.14,0],[-.15,-.24],[-.02,-.24],[0,-.12],[.02,-.24],[.15,-.24],[.14,0]],
  trousers:[[-.13,0],[-.15,-.47],[-.025,-.47],[0,-.13],[.025,-.47],[.15,-.47],[.13,0]],
  duster:[[-.1,0],[-.19,-.07],[-.15,-.16],[-.11,-.13],[-.17,-.58],[.17,-.58],[.11,-.13],[.15,-.16],[.19,-.07],[.1,0],[.04,-.03],[-.04,-.03]],
  towel:[[-.16,0],[-.16,-.46],[.16,-.46],[.16,0]],
  blouse:[[-.1,0],[-.17,-.05],[-.15,-.12],[-.105,-.1],[-.12,-.3],[.12,-.3],[.105,-.1],[.15,-.12],[.17,-.05],[.1,0],[.04,-.04],[-.04,-.04]],
};
export const GARMENTS=Object.keys(OUTLINES);
// Weighted toward shirts, as a line of washing is.
const DRAW=['shirt','shirt','shirt','shirt','sando','sando','shorts','shorts','trousers','duster','towel','blouse','blouse'];
export const CLOTHES_COLOURS=[0xf1efe6,0xf1efe6,0xe9e4d2,0xdfe6ea,0xc9d6e2,0x8fa9c4,0x5f7fa8,0x2f4a78,0x23324a,0x3b3b40,0x6e6f73,0xb9b9b4,
  0xd94f4a,0xa83238,0x7a1f2b,0xe58a3a,0xf0c24a,0xf3e08a,0x8fbf7a,0x4f9d6a,0x2f6b4f,0x6fb7b0,0xd98fb0,0xf2b8c6,0xb089c9,0x6b4a8a,0x9a6b4a,0xc9a57a,0xbfdcc9];
export const HANGER_COLOURS=[0x438eca,0x438eca,0xe2574c,0xf0c24a,0x4fae6a,0xf2f0e8,0xd98fb0,0x2f3a44,0xf08a3a];

export function createSampayan(THREE){
  const materials=new Map(),shapes=new Map();
  const material=colour=>{if(!materials.has(colour))materials.set(colour,new THREE.MeshLambertMaterial({color:colour,side:THREE.DoubleSide}));return materials.get(colour);};
  const shape=type=>{
    if(!shapes.has(type)){const s=new THREE.Shape();OUTLINES[type].forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();shapes.set(type,new THREE.ShapeGeometry(s));}
    return shapes.get(type);
  };
  // A flat ribbon through the given points, facing local z.
  function ribbon(points,width){
    const positions=[],indices=[];
    points.forEach(([x,y],i)=>{
      const [ax,ay]=points[Math.max(0,i-1)],[bx,by]=points[Math.min(points.length-1,i+1)],l=Math.hypot(bx-ax,by-ay)||1,nx=-(by-ay)/l*width/2,ny=(bx-ax)/l*width/2;
      positions.push(x+nx,y+ny,0,x-nx,y-ny,0);
      if(i){const a=(i-1)*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
    });
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);return g;
  }
  let hangerShape=null;
  const hangerGeometry=()=>hangerShape??=[ribbon([[-.17,-.02],[-.095,.014],[0,.027],[.095,.014],[.17,-.02]],0.011),ribbon([[0,.027],[-.012,.075],[-.012,.117],[.012,.14],[.04,.13],[.048,.104]],0.01)];
  // One garment on a hanger, its hook's top at the origin.
  function onHanger(type,colour,hangerColour,scale){
    const g=new THREE.Group(),drop=0.14*scale;
    for(const geometry of hangerGeometry()){const m=new THREE.Mesh(geometry,material(hangerColour));m.scale.setScalar(scale);m.position.y=-drop;g.add(m);}
    const cloth=new THREE.Mesh(shape(type),material(colour));cloth.scale.setScalar(scale);cloth.position.set(0,-drop-0.004*scale,0.004);g.add(cloth);
    return g;
  }
  // One garment held by two pegs, its top edge at the origin.
  function pegged(type,colour,scale){
    const g=new THREE.Group(),cloth=new THREE.Mesh(shape(type),material(colour));cloth.scale.setScalar(scale);g.add(cloth);
    const peg=new THREE.BoxGeometry(0.014,0.034,0.014);
    for(const dx of [-.05,.05]){const m=new THREE.Mesh(peg,material(0xd2bda0));m.position.set(dx*scale,0.008,0);g.add(m);}
    return g;
  }
  const bounds=group=>{group.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(group);return {minX:b.min.x,maxX:b.max.x,minY:b.min.y,maxY:b.max.y,minZ:b.min.z,maxZ:b.max.z};};

  // A string with clothes along it. `gap`, if given, is a stretch [from,to] in metres along the line,
  // measured from its middle, that is left bare: where a walker passes under it.
  function line({length,sag=length*0.03,count=6,hangers=true,seed=1,cluster=0.8,gap=null,colours=CLOTHES_COLOURS,hangerColours=HANGER_COLOURS,oneHangerColour=false}){
    let state=(seed>>>0)||1;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
    const pick=list=>list[Math.floor(random()*list.length)],group=new THREE.Group();group.name='sampayan-line';
    const low=x=>-sag*Math.sin(Math.PI*(x/length+0.5));
    // The string: two crossed ribbons, so it shows from any side.
    const points=Array.from({length:25},(_,i)=>{const x=(i/24-0.5)*length;return [x,low(x)];});
    for(const turn of [0,Math.PI/2]){const m=new THREE.Mesh(ribbon(points,0.004),material(0xc4bfab));m.rotation.x=turn;group.add(m);}
    // Small gaps make groups; now and then a wide one parts them.
    const steps=[0];for(let i=1;i<count;i++)steps.push(steps[i-1]+(1-cluster)+cluster*(random()<0.22?2.4+random()*2.2:0.14+random()*0.3));
    const total=steps[count-1]||1,single=pick(hangerColours);
    for(let i=0;i<count;i++){
      const x=(count===1?0:(0.06+0.88*steps[i]/total)-0.5)*length,type=pick(DRAW),scale=type==='towel'?0.9+random()*0.5:random()<0.2?0.55+random()*0.15:0.78+random()*0.14,colour=pick(colours);
      if(gap&&x>gap[0]&&x<gap[1])continue;
      const item=hangers?onHanger(type,colour,oneHangerColour?single:pick(hangerColours),scale):pegged(type,colour,scale);
      // On a hanger the garment hangs across the line, a little askew; pegged, it hangs along it.
      item.rotation.y=hangers?Math.PI/2+(random()-0.5)*0.5:(random()-0.5)*0.12;
      item.position.set(x,low(x),0);group.add(item);
    }
    group.userData.bounds=bounds(group);group.userData.garments=group.children.length-2;
    return group;
  }
  // A rail on two uprights with clothes on hangers, standing on the floor at y=0.
  function rack({length=1.1,height=1.5,depth=0.42,count=6,seed=1,colour=0x8c9691,colours=CLOTHES_COLOURS,hangerColours=HANGER_COLOURS}){
    const group=new THREE.Group();group.name='sampayan-rack';
    const bar=(w,h,d,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(colour));m.position.set(x,y,z);group.add(m);};
    for(const x of [-length/2,length/2]){bar(0.028,height,0.028,x,height/2,0);bar(0.028,0.028,depth,x,0.014,0);}
    bar(length,0.026,0.026,0,height,0);
    const clothes=line({length:length-0.12,sag:0,count,seed,cluster:0.5,colours,hangerColours});
    for(const string of clothes.children.slice(0,2))clothes.remove(string);   // the rail stands in for the string
    clothes.position.y=height-0.013;group.add(clothes);
    group.userData.bounds=bounds(group);
    return group;
  }
  return {line,rack};
}
