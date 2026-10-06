// Things made of patterned cloth or woven mat: banig and sheets on the floor, mattresses, a rolled
// banig, cloth hung on a wall, and tablecloths. The patterns are the page-sized copies listed in
// fabric-assets.js. Each pattern has one material for the whole session; each object has its own
// small geometry, disposed with its room.
import {FABRICS} from './fabric-assets.js?v=16a4f83f8d';
import {wallThingsOf} from './household-items.js?v=16a4f83f8d';

const AISLE=0.72,LIFT=0.008,STEP=0.4;
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

export function addFabricItems({THREE,group,room,seed,loader,patch,blocked=[],hung=[],wallSpots=[],floorAt=()=>0,force=null}){
  let state=(Math.imul(seed+90173,2246822519)>>>0)||1;
  const r=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const pick=list=>list[Math.floor(r()*list.length)],chance=p=>force==='fabric'||r()<p;
  const tela=FABRICS.filter(f=>f.kind==='tela'),banig=FABRICS.filter(f=>f.kind==='banig');
  const half=room.width/2,taken=[...blocked],footprints=[],walkBlocks=[],report={},level=!room.rise;
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
  // Cloth hung flat on a solid stretch of side wall: a curtain with no window, a cover, a backdrop.
  if({sala:0.1,bedroom:0.1,bare:0.1,kitchen:0.06,hall:0.08}[room.type]&&chance({sala:0.1,bedroom:0.1,bare:0.1,kitchen:0.06,hall:0.08}[room.type])&&wallSpots.length){
    const w=0.9+r()*0.7,h=1+r()*0.7,top=Math.min(2.2,room.height-0.25),spots=[...wallSpots];
    // The cloth hangs in front of a wire run or an outlet and covers it; anything standing further out is avoided.
    const things=[...wallThingsOf(THREE,group,half).filter(t=>t.depth>0.115),...hung];
    while(spots.length){
      const spot=spots.splice(Math.floor(r()*spots.length),1)[0],z=spot.z,y=floorAt(z);
      if(things.some(t=>t.side===spot.side&&z+w/2+0.1>t.minZ&&z-w/2-0.1<t.maxZ&&y+top>t.low&&y+top-h<t.high))continue;
      const entry=pick(tela),b=builder(THREE,entry.repeat),phase=r()*6.28;
      // Hung from its top edge, with shallow folds that deepen toward the hem.
      b.surface(Math.max(8,cells(w)*4),cells(h)*2,(u,v)=>[(u-0.5)*w,-v*h,Math.sin(u*w*9+phase)*0.012*(0.25+v)],(u,v)=>[u*w,(1-v)*h]);
      const cloth=b.mesh(fabricMaterial(THREE,entry,loader,patch),'fabric-wall-cloth');
      cloth.rotation.y=-spot.side*Math.PI/2;add(cloth,spot.side*(half-0.128),y+top,z);count('wallCloths');
      break;
    }
  }
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
