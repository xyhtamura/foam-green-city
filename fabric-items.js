// Things made of patterned cloth or woven mat: banig, sheets, carpets, and small mats on the floor,
// mattresses, a rolled banig, cloth hung on a wall, tablecloths, potholders, and sofa covers. The patterns are the page-sized copies listed in
// fabric-assets.js. Each pattern has one material for the whole session; each object has its own
// small geometry, disposed with its room.
import {FABRICS} from './fabric-assets.js?v=bfa26a66b6';
import {createPuzzleMatKit} from './puzzle-mats.js?v=bfa26a66b6';
import {placeOnSupport} from './object-supports.js?v=bfa26a66b6';
import {wallThingsOf} from './household-items.js?v=bfa26a66b6';

const AISLE=0.72,LIFT=0.008,STEP=0.4;
// One puzzle-mat kit for the session: it holds one seam texture and one material, and no geometry.
let puzzleKit=null;
const materials=new Map();
function fabricMaterial(THREE,entry,loader,patch){
  if(!materials.has(entry.id)){
    const texture=loader.load(entry.file);
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.colorSpace=THREE.SRGBColorSpace;
    texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
    materials.set(entry.id,patch(new THREE.MeshLambertMaterial({map:texture,side:THREE.DoubleSide})));
  }
  return materials.get(entry.id);
}

// A sofa's own geometry expects its cloth to repeat about one and a half times across a face, which
// is set on the texture, so upholstery loads a pattern a second time with that repeat.
const covers=new Map();
function upholstery(THREE,entry,loader,patch){
  if(!covers.has(entry.id)){
    const texture=loader.load(entry.file);
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.colorSpace=THREE.SRGBColorSpace;texture.repeat.set(1.5,1.5);
    texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
    covers.set(entry.id,patch(new THREE.MeshLambertMaterial({map:texture})));
  }
  return covers.get(entry.id);
}

// Collects surfaces into one geometry. A surface is a grid of points with texture coordinates in
// metres, which the caller divides by the pattern's repeat.
function builder(THREE,repeat){
  const positions=[],uvs=[],indices=[];
  return {
    surface(nx,ny,point,metres){
      const base=positions.length/3;
      for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
        const u=i/nx,v=j/ny,m=metres(u,v);
        positions.push(...point(u,v));uvs.push(m[0]/repeat,m[1]/repeat);
      }
      for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=base+j*(nx+1)+i;indices.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
    },
    mesh(material,name){
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
      geometry.setIndex(indices);geometry.computeVertexNormals();
      const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.userData.own=true;return mesh;
    },
  };
}
const cells=length=>Math.max(1,Math.ceil(length/STEP));

export function addFabricItems({THREE,group,room,seed,loader,patch,blocked=[],fixed=[],hung=[],wallSpots=[],farWallTaken=false,floorAt=()=>0,force=null}){
  let state=(Math.imul(seed+90173,2246822519)>>>0)||1;
  const r=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const pick=list=>list[Math.floor(r()*list.length)],chance=p=>force==='fabric'||r()<p;
  const tela=FABRICS.filter(f=>f.kind==='tela'),banig=FABRICS.filter(f=>f.kind==='banig');
  const half=room.width/2,taken=[...blocked],footprints=[],walkBlocks=[],report={},level=!room.rise&&!room.court;   // nothing is laid on a court
  const count=key=>{report[key]=(report[key]??0)+1;};
  const add=(mesh,x,y,z)=>{mesh.position.set(x,y,z);group.add(mesh);return mesh;};
  const overlaps=rect=>taken.some(o=>rect.maxX>o.minX&&rect.minX<o.maxX&&rect.maxZ>o.minZ&&rect.minZ<o.maxZ);
  // A clear patch of floor for a thing hw by hd in half-size: against a wall, or anywhere it fits.
  function patchOfFloor(hw,hd,{byWall=false,inset=0.16}={}){
    if(half-inset-hw<(byWall?AISLE+hw:hw)||room.length-0.8<2*hd)return null;
    for(let attempt=0;attempt<12;attempt++){
      const side=r()<0.5?-1:1,x=byWall?side*(half-inset-hw):side*r()*(half-0.2-hw),z=-(0.4+hd+r()*(room.length-0.8-2*hd));
      const rect={minX:x-hw,maxX:x+hw,minZ:z-hd,maxZ:z+hd};
      if(!overlaps(rect))return {x,z,side,rect};
    }
    return null;
  }
  // A flat sheet lying on the floor, long side down the room.
  function sheetOnFloor(entry,w,l,name){
    const b=builder(THREE,entry.repeat);
    b.surface(cells(w),cells(l),(u,v)=>[(u-0.5)*w,0,(v-0.5)*l],(u,v)=>[u*w,v*l]);
    return b.mesh(fabricMaterial(THREE,entry,loader,patch),name);
  }
  // A box covered in one cloth: top, bottom, and four sides, the pattern running on round the edges.
  function slab(entry,w,t,l,name){
    const b=builder(THREE,entry.repeat),nx=cells(w),nz=cells(l);
    b.surface(nx,nz,(u,v)=>[(u-0.5)*w,t,(v-0.5)*l],(u,v)=>[u*w,v*l]);
    b.surface(nx,nz,(u,v)=>[(u-0.5)*w,0,(0.5-v)*l],(u,v)=>[u*w,v*l]);
    for(const s of [-1,1]){
      b.surface(nz,1,(u,v)=>[s*w/2,v*t,s*(u-0.5)*l],(u,v)=>[u*l,v*t]);
      b.surface(nx,1,(u,v)=>[-s*(u-0.5)*w,v*t,s*l/2],(u,v)=>[u*w,v*t]);
    }
    return b.mesh(fabricMaterial(THREE,entry,loader,patch),name);
  }

  if(level){
    const mats={bedroom:0.2,sala:0.1,bare:0.14,hall:0.04}[room.type],beds={bedroom:0.16,bare:0.12,sala:0.06}[room.type];
    // A mattress on the floor, single or double, sometimes on a banig of its own.
    if(beds&&chance(beds)){
      // Along a wall if there is room there, and otherwise wherever it fits: it is low enough to walk over.
      const w=r()<0.3?1.35:0.9,l=1.85+r()*0.1,t=0.1+r()*0.08,spot=patchOfFloor(w/2+0.08,l/2+0.08,{byWall:true})??patchOfFloor(w/2+0.08,l/2+0.08);
      if(spot){
        const y=floorAt(spot.z);
        if(r()<0.3){add(sheetOnFloor(pick(banig),w+0.16,l+0.16,'fabric-banig'),spot.x,y+LIFT,spot.z);count('banig');}
        add(slab(pick(tela),w,t,l,'fabric-mattress'),spot.x,y+LIFT*2,spot.z);
        taken.push(spot.rect);footprints.push(spot.rect);count('mattresses');
      }
    }
    // A banig, or a length of cloth, spread on open floor.
    if(mats&&chance(mats)){
      const cloth=r()<0.25,w=0.8+r()*0.7,l=1.7+r()*0.3,spot=patchOfFloor(w/2,l/2);
      if(spot){add(sheetOnFloor(pick(cloth?tela:banig),w,l,cloth?'fabric-floor-cloth':'fabric-banig'),spot.x,floorAt(spot.z)+LIFT,spot.z);taken.push(spot.rect);count(cloth?'floorCloths':'banig');}
    }
    // A banig rolled up and stood against the wall.
    if(mats&&chance(0.08)){
      const radius=0.06+r()*0.03,height=0.9+r()*0.3,spot=patchOfFloor(radius+0.03,radius+0.03,{byWall:true,inset:0.13});
      if(spot){
        const entry=pick(banig),geometry=new THREE.CylinderGeometry(radius,radius,height,10,1,false),uv=geometry.attributes.uv;
        // The side of the roll shows two turns of the mat; the ends take the same pattern small.
        for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2*Math.PI*radius*2/entry.repeat,uv.getY(i)*height/entry.repeat);
        const roll=new THREE.Mesh(geometry,fabricMaterial(THREE,entry,loader,patch));roll.name='fabric-banig-roll';roll.userData.own=true;
        roll.rotation.z=spot.side*0.06;add(roll,spot.x,floorAt(spot.z)+height/2,spot.z);
        taken.push(spot.rect);footprints.push(spot.rect);walkBlocks.push({...spot.rect,height});count('banigRolls');
      }
    }
  }
  // Cloth hung flat on a wall: a curtain with no window, a cover, a backdrop. On a solid stretch of
  // side wall where one is free, at a size that fits it; failing that, on the far wall beside the
  // doorway, on the side the door leaf does not stand against.
  const clothRate={sala:0.28,bedroom:0.28,bare:0.3,hall:0.22,kitchen:0.16}[room.type];
  if(clothRate&&chance(clothRate)){
    const top=Math.min(2.2,room.height-0.25),entry=pick(tela),phase=r()*6.28;
    // Hung from its top edge, with shallow folds that deepen toward the hem.
    const cloth=(w,h)=>{
      const b=builder(THREE,entry.repeat);
      b.surface(Math.max(8,cells(w)*4),cells(h)*2,(u,v)=>[(u-0.5)*w,-v*h,Math.sin(u*w*9+phase)*0.012*(0.25+v)],(u,v)=>[u*w,(1-v)*h]);
      return b.mesh(fabricMaterial(THREE,entry,loader,patch),'fabric-wall-cloth');
    };
    // The cloth hangs in front of a wire run or an outlet and covers it; anything standing further out is avoided.
    const things=[...wallThingsOf(THREE,group,half).filter(t=>t.depth>0.115),...hung],spots=[...wallSpots];
    const wide=0.9+r()*0.7,tall=1+r()*0.7;
    let done=false;
    // Full size first, then narrower and shorter, on each free stretch in turn.
    for(const scale of [1,0.72,0.5]){
      const w=wide*scale,h=Math.max(0.6,tall*(scale===1?1:0.8)),order=[...spots].sort(()=>r()-0.5);
      for(const spot of order){
        const z=spot.z,y=floorAt(z);
        if(things.some(t=>t.side===spot.side&&z+w/2+0.1>t.minZ&&z-w/2-0.1<t.maxZ&&y+top>t.low&&y+top-h<t.high))continue;
        const mesh=cloth(w,h);mesh.rotation.y=-spot.side*Math.PI/2;add(mesh,spot.side*(half-0.128),y+top,z);count('wallCloths');done=true;break;
      }
      if(done)break;
    }
    if(!done&&level&&!farWallTaken){
      const leaf=group.userData.thresholdDoor??0,side=leaf?-leaf:(r()<0.5?-1:1),inner=1.05,outer=half-0.15,w=Math.min(1.6,outer-inner,wide);
      if(w>=0.55){
        const x=side*(inner+w/2+r()*(outer-inner-w)),z=-room.length+0.032,mesh=cloth(w,tall);
        add(mesh,x,floorAt(z)+top,z);count('wallCloths');report.endWallCloths=1;
      }
    }
  }
  if(level){
    // A carpet: a large cloth laid under whatever stands in the room. Only the building itself is in its way.
    const carpets={sala:0.18,bedroom:0.12,hall:0.05}[room.type];
    if(carpets&&chance(carpets)){
      const w=Math.min(1.4+r()*0.9,room.width-0.9),l=Math.min(2+r()*1.1,room.length-1.2);
      for(let attempt=0;attempt<8;attempt++){
        const x=(r()-0.5)*(room.width-0.5-w),z=-(0.6+l/2+r()*(room.length-1.2-l)),rect={minX:x-w/2,maxX:x+w/2,minZ:z-l/2,maxZ:z+l/2};
        if(fixed.some(o=>rect.maxX>o.minX&&rect.minX<o.maxX&&rect.maxZ>o.minZ&&rect.minZ<o.maxZ))continue;
        const entry=pick(tela);
        // The pattern is drawn half again as large as on a hanging cloth.
        add(sheetOnFloor({...entry,repeat:entry.repeat*1.5},w,l,'fabric-carpet'),x,floorAt(z)+LIFT*0.5,z);count('carpets');break;
      }
    }
    // Puzzle mats: foam tiles laid as a patch under whatever stands in the room, a few missing, with
    // a stray tile or two beside it and sometimes a stack by the wall. Small tiles at home; in a hall,
    // now and then, a field of large ones.
    const tiles={bedroom:0.12,sala:0.1,bare:0.06,hall:0.04}[room.type];
    if(tiles&&chance(tiles)){
      puzzleKit??=createPuzzleMatKit({patchMaterial:patch});
      const large=room.type==='hall'&&r()<0.6,tile=large?0.6:0.3,scheme=pick(['random','random','checker','checker','single','rows']);
      const palette=large?pick([[0x3a3f44,0x6e7378],[0x2e5fa3,0xc23b32],[0x3a3f44]]):pick([[0xda6c66,0xe3c75e,0x75a477,0x639abe],[0xf2a0b5,0xa9d5e8,0xf5e08a,0xb9e0b0],[0x2e5fa3,0xe0b23a],[0xc23b32,0x2f7d5a,0xe0b23a,0x2e5fa3,0xd96a2b],[0x8c9691,0xd8d2c2]]);
      const columns=Math.max(2,Math.min(Math.floor((room.width-1)/tile),large?3+Math.floor(r()*6):3+Math.floor(r()*5))),rows=Math.max(2,Math.min(Math.floor((room.length-1.4)/tile),large?4+Math.floor(r()*8):4+Math.floor(r()*6)));
      const w=columns*tile,l=rows*tile,own=mesh=>{mesh.userData.own=true;mesh.name='fabric-'+mesh.name;return mesh;};
      for(let attempt=0;attempt<8;attempt++){
        const x=(r()-0.5)*(room.width-0.5-w),z=-(0.7+l/2+r()*(room.length-1.4-l)),rect={minX:x-w/2,maxX:x+w/2,minZ:z-l/2,maxZ:z+l/2};
        if(fixed.some(o=>rect.maxX>o.minX&&rect.minX<o.maxX&&rect.maxZ>o.minZ&&rect.minZ<o.maxZ))continue;
        const seedOf=()=>Math.floor(r()*1e6)+1,y=floorAt(z)+LIFT*0.75;
        add(own(puzzleKit.create('patch',{columns,rows,tile,palette,scheme,missing:r()<0.3?0:0.04+r()*0.2,seed:seedOf()})),x,y,z);count('puzzleMats');
        for(let n=Math.floor(r()*3);n>0;n--){
          const stray=own(puzzleKit.create('stray',{tile,palette,scheme:'random',seed:seedOf()}));stray.rotation.y=r()*6.28;
          add(stray,x+(r()-0.5)*(w+1.2),y+0.013,z+(r()-0.5)*(l+1.2));
        }
        if(r()<0.3){
          const spot=patchOfFloor(tile/2+0.05,tile/2+0.05,{byWall:true,inset:0.14});
          if(spot){add(own(puzzleKit.create('stack',{tile,palette,scheme:'random',count:3+Math.floor(r()*6),seed:seedOf()})),spot.x,floorAt(spot.z)+0.003,spot.z);taken.push(spot.rect);}
        }
        break;
      }
    }
    // A small cloth mat: by a bed, at a sink, inside a bathroom door.
    const smalls={kitchen:0.2,bathroom:0.25,bedroom:0.15,sala:0.12}[room.type];
    if(smalls&&chance(smalls)){
      const w=0.42+r()*0.2,l=0.6+r()*0.3,turned=r()<0.5,spot=patchOfFloor((turned?l:w)/2,(turned?w:l)/2);
      if(spot){const mat=sheetOnFloor(pick(tela),w,l,'fabric-mat');mat.rotation.y=turned?Math.PI/2:0;add(mat,spot.x,floorAt(spot.z)+LIFT*1.5,spot.z);taken.push(spot.rect);count('mats');}
    }
  }
  // Potholders: square quilted pads, lying on a kitchen table or hung in a row on the wall.
  if(room.type==='kitchen'||room.kitchenCorner){
    const pad=(entry,size)=>{
      const b=builder(THREE,0.22),t=0.008;
      b.surface(2,2,(u,v)=>[(u-0.5)*size,t,(v-0.5)*size],(u,v)=>[u*size,v*size]);
      b.surface(2,2,(u,v)=>[(u-0.5)*size,0,(0.5-v)*size],(u,v)=>[u*size,v*size]);
      for(const s of [-1,1]){
        b.surface(1,1,(u,v)=>[s*size/2,v*t,s*(u-0.5)*size],(u,v)=>[u*size,v*t]);
        b.surface(1,1,(u,v)=>[-s*(u-0.5)*size,v*t,s*size/2],(u,v)=>[u*size,v*t]);
      }
      return b.mesh(fabricMaterial(THREE,entry,loader,patch),'fabric-potholder');
    };
    if(chance(0.35))for(const table of group.children.filter(o=>o.userData.diningTable&&o.userData.supportSurface).slice(0,1)){
      for(let n=1+Math.floor(r()*2);n>0;n--){
        const holder=new THREE.Group();holder.name='potholder';holder.add(pad(pick(tela),0.16+r()*0.05));
        if(placeOnSupport({THREE,parent:table,object:holder,support:table.userData.supportSurface,random:r}))count('potholders');
      }
    }
    if(chance(0.25)&&wallSpots.length){
      const things=[...wallThingsOf(THREE,group,half).filter(t=>t.depth>0.115),...hung],spots=[...wallSpots].sort(()=>r()-0.5),n=2+Math.floor(r()*2),y=1.35+r()*0.2;
      for(const spot of spots){
        const z=spot.z,base=floorAt(z);
        if(things.some(t=>t.side===spot.side&&z+0.45>t.minZ&&z-0.45<t.maxZ&&base+y+0.05>t.low&&base+y-0.3<t.high))continue;
        for(let k=0;k<n;k++){
          // Each hangs by one corner, so it shows as a diamond.
          const size=0.16+r()*0.04,p=pad(pick(tela),size),hook=new THREE.Group();
          p.rotation.x=Math.PI/2;hook.rotation.z=Math.PI/4;hook.position.y=-size*0.7071;hook.add(p);
          const holder=new THREE.Group();holder.name='potholder';holder.add(hook);
          holder.rotation.y=-spot.side*Math.PI/2;add(holder,spot.side*(half-0.112),base+y,z+(k-(n-1)/2)*0.26);count('potholders');
        }
        break;
      }
    }
  }
  // A sofa covered in one of the cloths: its seat, back, and any cushions that matched them.
  group.traverse(sofa=>{
    if(sofa.name!=='uratexSofa'||!chance(0.5))return;
    const uses=new Map();
    sofa.traverse(o=>{if(o.isMesh&&o.material.map)uses.set(o.material,(uses.get(o.material)??0)+1);});
    const main=[...uses].sort((a,b)=>b[1]-a[1])[0]?.[0];if(!main)return;
    const cover=upholstery(THREE,pick(tela),loader,patch);
    sofa.traverse(o=>{if(o.isMesh&&o.material===main)o.material=cover;});
    count('sofas');
  });
  // A tablecloth on every table of a kitchen or sala, the one cloth through the room.
  if({kitchen:0.14,sala:0.14,hall:0.08}[room.type]&&chance({kitchen:0.14,sala:0.14,hall:0.08}[room.type])){
    const entry=pick(tela),drop=0.12+r()*0.12;
    for(const table of group.children.filter(o=>o.userData.diningTable&&o.userData.supportSurface)){
      const s=table.userData.supportSurface,x0=s.minX-0.03,x1=s.maxX+0.03,z0=s.minZ-0.03,z1=s.maxZ+0.03,w=x1-x0,l=z1-z0,top=s.height+0.004,b=builder(THREE,entry.repeat);
      b.surface(cells(w),cells(l),(u,v)=>[x0+u*w,top,z0+v*l],(u,v)=>[u*w,v*l]);
      // The overhang falls straight on each side, the pattern carrying on over the edge.
      b.surface(cells(w),1,(u,v)=>[x0+u*w,top-v*drop,z1],(u,v)=>[u*w,l+v*drop]);
      b.surface(cells(w),1,(u,v)=>[x0+u*w,top-v*drop,z0],(u,v)=>[u*w,-v*drop]);
      b.surface(cells(l),1,(u,v)=>[x1,top-v*drop,z0+u*l],(u,v)=>[w+v*drop,u*l]);
      b.surface(cells(l),1,(u,v)=>[x0,top-v*drop,z0+u*l],(u,v)=>[-v*drop,u*l]);
      table.add(b.mesh(fabricMaterial(THREE,entry,loader,patch),'fabric-tablecloth'));count('tablecloths');
    }
  }
  return {footprints,walkBlocks,report};
}
