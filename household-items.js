// Places the mesh kits' objects in a room, then bakes them into one vertex-coloured mesh.
import {createTablewareKit,TABLEWARE_COLOURS} from './tableware.js?v=ae01401590';
import {createPlasticKit,PLASTIC_COLOURS} from './plastics.js?v=ae01401590';
import {createLinenKit,LINEN_COLOURS} from './linens.js?v=ae01401590';
import {placeOnSupport} from './object-supports.js?v=ae01401590';
import {createHouseholdToolKit} from './household-tools.js?v=ae01401590';
import {createPlasticStorageKit} from './plastic-storage.js?v=ae01401590';
import {createCardboardKit} from './cardboard.js?v=ae01401590';
import {createSchoolChairKit} from './school-chair.js?v=ae01401590';
import {createBasketball,BALL_COLOURS} from './basketball.js?v=ae01401590';
import {createFootwearKit,FOOTWEAR_TYPES} from './footwear.js?v=ae01401590';
import {createBathroomKit} from './bathroom-tools.js?v=ae01401590';
import {createPackagingKit} from './packaging.js?v=ae01401590';

// The kits only lend their geometry and colours to the bake, so one set serves every room.
let kits=null;
const AISLE=0.72;

export function addHouseholdItems({THREE,group,room,seed,material,blocked=[],floorAt=()=>0,amount=1,forceBall=false,paint=0xbfdcc9,force=null}){
  kits??={table:createTablewareKit({radialSegments:10}),plastic:createPlasticKit({radialSegments:10}),linen:createLinenKit(),
    tool:createHouseholdToolKit(),storage:createPlasticStorageKit(),card:createCardboardKit(),chair:createSchoolChairKit()};
  let state=(Math.imul(seed+6113,2246822519)>>>0)||1;
  const r=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const pick=list=>list[Math.floor(r()*list.length)],between=(a,b)=>a+Math.floor(r()*(b-a+1));
  const ware=Object.keys(TABLEWARE_COLOURS).filter(c=>c!=='metal'),plastic=Object.keys(PLASTIC_COLOURS),linen=Object.keys(LINEN_COLOURS);
  const T=(type,options={})=>kits.table.create(type,{colour:pick(ware),finish:r()<0.4?'plastic':'ceramic',...options});
  const P=(type,options={})=>kits.plastic.create(type,{colour:pick(plastic),scale:0.85+r()*0.3,fullness:0.3+r()*0.7,lean:(r()-0.5)*0.16,...options});
  const L=(type,options={})=>kits.linen.create(type,{colour:pick(linen),seed:Math.floor(r()*1e6),fold:0.5+r()*1.2,...options});
  const set=(name,...parts)=>{const g=new THREE.Group();g.name=name;for(const [object,x=0,y=0,z=0] of parts){object.position.set(x,y,z);g.add(object);}return g;};

  // Things that sit on a table or shelf. Each returns one group to fit as a whole.
  const dining={
    setting(){const colour=pick(ware);return set('place-setting',[T('plate',{colour})],[T('spoon',{rotation:0.1}),0.16,0,0.01],[T('fork',{rotation:-0.08}),-0.16,0,0.01]);},
    bowl:()=>set('bowl',[T(r()<0.5?'bowl':'deepBowl')]),
    drink(){return r()<0.4?set('cup-and-saucer',[T('saucer')],[T('cup'),0,0.012,0]):set('drink',[T(pick(['mug','glass','tumbler']))]);},
    plates:()=>set('plate-stack',[kits.table.stack(r()<0.7?'plate':'saucer',{count:between(3,7),colour:pick(ware)})]),
    bowls:()=>set('bowl-stack',[kits.table.stack(r()<0.6?'bowl':'deepBowl',{count:between(2,4),colour:pick(ware)})]),
    tray(){const n=between(1,3),parts=[[T('servingTray',{finish:'plastic'})]];for(let i=0;i<n;i++)parts.push([T(pick(['glass','tumbler','cup'])),(i-(n-1)/2)*0.095,0.006,(r()-0.5)*0.06]);return set('tray-of-cups',...parts);},
    container:()=>set('food-container',[r()<0.5?T('foodContainer',{finish:'plastic'}):P('liddedContainer',{scale:1})]),
    cloth:()=>set('dishcloth',[L('dishcloth')]),
    clothes:()=>set('folded-clothes',[L(r()<0.75?'foldedClothes':'blanket',{scale:0.8})]),
  };
  const onTable={kitchen:['setting','setting','bowl','drink','plates','bowls','tray','container','container','cloth'],sala:['setting','drink','drink','tray','container','cloth','bowl'],bedroom:['drink','clothes','clothes','container'],other:['drink','container','plates']};
  const onShelf={kitchen:['plates','bowls','drink','container'],bedroom:['clothes','clothes','drink'],other:['drink','clothes','plates','container']};
  const kind=onTable[room.type]?room.type:'other',placed=[],report={table:0,surface:0,floor:0,rugs:0,rejected:0};
  function fit(parent,pool,count,where){
    const support=parent.userData.supportSurface;if(!support)return;
    for(let i=0;i<count;i++){
      const object=dining[pick(pool)]();
      if(placeOnSupport({THREE,parent,object,support,random:r})){placed.push(object);report[where]++;}else report.rejected++;
    }
  }
  if(room.type!=='bathroom'){
    for(const table of group.children.filter(o=>o.userData.diningTable&&o.userData.supportSurface))
      fit(table,onTable[kind],Math.round(amount*(kind==='kitchen'?between(1,4):kind==='sala'?between(0,3):between(0,2))),'table');
    const surfaces=[];group.traverse(o=>{if(o.userData.supportSurface&&!o.userData.diningTable&&!o.userData.diningChair)surfaces.push(o);});
    for(const surface of surfaces)fit(surface,onShelf[onShelf[room.type]?room.type:'other'],Math.round(amount*between(0,2)),'surface');
  }

  // Things that stand on the floor against a wall, clear of the aisle and of everything already placed.
  const half=room.width/2,taken=[...blocked],footprints=[],walkBlocks=[];
  function stand(object,{flat=false,open=false,side:fixedSide=null,flush=false,litter=false}={}){
    const b=object.userData.supportBounds,hw=(b.maxX-b.minX)/2,hd=(b.maxZ-b.minZ)/2,cx=(b.minX+b.maxX)/2,cz=(b.minZ+b.maxZ)/2;
    if(half-0.14-hw<(flat?hw+0.1:AISLE+hw)||room.length-0.6<2*hd)return false;
    for(let attempt=0;attempt<10;attempt++){
      const side=fixedSide??(r()<0.5?-1:1);
      const x=open?side*(flat?r()*(half-0.3-hw):AISLE+hw+r()*(half-0.14-AISLE-2*hw)):flush?side*(half-0.115-hw):side*(half-0.14-hw-r()*0.3);
      const z=-(0.3+hd+r()*(room.length-0.6-2*hd)),rect={minX:x-hw,maxX:x+hw,minZ:z-hd,maxZ:z+hd};
      if(!flat&&Math.abs(x)-hw<AISLE)continue;
      if(taken.some(o=>rect.maxX>o.minX&&rect.minX<o.maxX&&rect.maxZ>o.minZ&&rect.minZ<o.maxZ))continue;
      object.position.set(x-cx,floorAt(z)+0.003,z-cz);group.add(object);placed.push(object);
      if(litter);else if(flat)report.rugs++;else{taken.push(rect);footprints.push(rect);report.floor++;if(b.height>0.24)walkBlocks.push({...rect,height:b.height});}
      return true;
    }
    report.rejected++;return false;
  }
  const basket=()=>{
    const g=set('laundry-basket',[P('laundryBasket',{scale:1})]);
    // A towel hangs over the long rim; some baskets also hold a pile.
    if(r()<0.6)g.add(set('towel',[L('drapedTowel'),(r()-0.5)*0.08,0.325,(r()<0.5?-1:1)*0.138]));
    if(r()<0.6)g.add(set('pile',[L('laundryPile',{scale:0.8}),0,0.02,0]));
    g.rotation.y=r()<0.5?0:Math.PI/2;g.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(g);g.userData.supportBounds={minX:box.min.x,maxX:box.max.x,minZ:box.min.z,maxZ:box.max.z,height:box.max.y};return g;
  };
  const bag=()=>P(r()<0.5?'ecobag':'shoppingBag',{rotation:r()*6.28}),vessel=()=>P(r()<0.5?'basin':'pail',{rotation:r()*6.28}),pile=()=>L('laundryPile',{rotation:r()*6.28});
  const floor={
    kitchen:[[vessel,0,2],[bag,0,3]],sala:[[bag,0,2],[basket,0,1],[pile,0,1]],bedroom:[[basket,0,1],[pile,0,2],[bag,0,1]],
    bathroom:[[vessel,1,2],[pile,0,1]],bare:[[bag,0,2],[vessel,0,1]],hall:[[bag,0,2]],auditorium:[[bag,0,1]],
  }[room.type]??[];
  for(const [make,low,high] of floor)for(let n=Math.round(amount*between(low,high));n>0;n--)stand(make());
  // A rug on open floor; in a bedroom, sometimes bedding laid out on one.
  if(['sala','bedroom'].includes(room.type)&&!room.rise&&r()<0.4*amount){
    const rug=L(r()<0.7?'rug':'doormat',{rotation:r()<0.5?0:Math.PI/2,scale:1+r()*0.5});
    if(stand(rug,{flat:true,open:true})&&room.type==='bedroom'&&r()<0.5){
      const bedding=set('floor-bedding',[L('pillow',{scale:0.9}),0,0.012,-0.18],[L('blanket',{scale:0.9}),0,0.012,0.12]);
      bedding.position.copy(rug.position);bedding.rotation.y=rug.rotation.y;group.add(bedding);placed.push(bedding);
    }
  }
  // A basketball left where it stopped: against a wall, or out on open floor.
  const wantBall=forceBall||(['sala','bedroom','bare','hall','auditorium'].includes(room.type)&&r()<0.12*amount);
  if(wantBall&&stand(createBasketball(THREE,{colour:pick(Object.keys(BALL_COLOURS)),scale:r()<0.15?0.75:1,seed:Math.floor(r()*1e6)}),{open:r()<0.5})){const ball=placed.at(-1);report.ball={x:+ball.position.x.toFixed(2),z:+ball.position.z.toFixed(2)};}
  // ---- The second set of kits. Drawn after everything above, so earlier placements are unchanged. ----
  // Fronts are local -z: a piece against a wall is turned to face the room.
  const facing=side=>side>0?Math.PI/2:-Math.PI/2,chance=p=>force==='kits'||r()<p*amount;
  const turned=(object,angle)=>{
    object.rotation.y=angle;object.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(object);object.userData.supportBounds={minX:box.min.x,maxX:box.max.x,minZ:box.min.z,maxZ:box.max.z,height:box.max.y};return object;
  };
  const wallSide=()=>r()<0.5?-1:1,domestic=['sala','kitchen','bedroom','bathroom','bare'].includes(room.type);
  const rubber=[0x608ca4,0xb5524a,0x3f6f58,0xd9b24a,0x2f3a44,0xc77f9a,0x8a6a47,0xe2ddd0,0x5a4a8a,0x4f9d9a];
  const tsinelas=()=>turned(kits.tool.pair({colour:pick(rubber),accent:pick(rubber),scale:0.9+r()*0.2,scattered:r()<0.55}),r()*6.28);
  // Tsinelas: left just inside the doorway, and sometimes elsewhere along a wall.
  if(domestic)for(let n=(chance(0.55)?1:0)+(chance(0.2)?1:0);n>0;n--){
    const pair=tsinelas(),b=pair.userData.supportBounds,hw=(b.maxX-b.minX)/2,hd=(b.maxZ-b.minZ)/2;
    const side=wallSide(),x=side*(AISLE+hw+0.05+r()*0.35),z=-(0.3+hd+r()*0.45),rect={minX:x-hw,maxX:x+hw,minZ:z-hd,maxZ:z+hd};
    if(Math.abs(x)+hw>half-0.14||taken.some(o=>rect.maxX>o.minX&&rect.minX<o.maxX&&rect.maxZ>o.minZ&&rect.minZ<o.maxZ)){report.rejected++;continue;}
    pair.position.set(x-(b.minX+b.maxX)/2,floorAt(z)+0.003,z-(b.minZ+b.maxZ)/2);group.add(pair);placed.push(pair);taken.push(rect);footprints.push(rect);report.tsinelas=(report.tsinelas??0)+1;
  }
  if(['bedroom','bathroom','sala'].includes(room.type)&&chance(0.3)&&stand(tsinelas())){report.tsinelas=(report.tsinelas??0)+1;const at=placed.at(-1).position;report.tsinelasAt=[+at.x.toFixed(1),+at.z.toFixed(1)];}
  // Painting left off: a tray, a roller, and a brush, in the room's own wall colour.
  if(chance(room.type==='bare'?0.22:0.06)){
    const kit=set('painting',[kits.tool.create('rollerTray',{paintColour:r()<0.75?paint:null}),0,0,0],
      [kits.tool.create('paintRoller',{paintColour:paint,rotation:r()*6.28}),0.34,0,(r()-0.5)*0.2],[kits.tool.create('paintBrush',{paintColour:r()<0.7?paint:null,rotation:r()*6.28}),-0.3,0,(r()-0.5)*0.25]);
    if(stand(turned(kit,r()*6.28)))report.painting=1;
  }
  // Plastic storage: coolers and water jugs in kitchens, bins and drawer units elsewhere.
  const plasticColours=[0xb95453,0x3f7fb0,0x4f9d7a,0xd9a441,0xe0ddce,0x8d73b0,0xc77f9a,0x556a7a];
  const storage=(type,options={})=>{const side=wallSide();return stand(kits.storage.create(type,{colour:pick(plasticColours),trimColour:r()<0.7?0xe0ddce:pick(plasticColours),rotation:facing(side),...options}),{side})&&(report.storage=(report.storage??0)+1);};
  if(room.type==='kitchen'){
    if(chance(0.3))storage('iceBox',{size:pick(['small','medium','medium','large']),wheels:r()<0.3});
    if(chance(0.25))storage('waterJug',{size:pick(['small','medium','large'])});
  }
  if(['sala','bedroom','bare'].includes(room.type)){
    if(chance(0.22))storage('liddedBin',{size:pick(['small','medium','large'])});
    if(chance(0.14))storage(r()<0.6?'drawerTower':'cabinetDrawers',{drawers:between(2,7)});
  }
  // Cardboard: cartons standing about, flattened ones on the floor, a panel leaning on a wall.
  const card=(type,options={})=>kits.card.create(type,{width:0.35+r()*0.4,depth:0.3+r()*0.3,height:0.25+r()*0.4,colour:pick([0xb18b58,0xa77f52,0xc09a68,0x9a7748]),seed:Math.floor(r()*1e6),tape:r()<0.8,labels:r()<0.6,rotation:r()*6.28,...options});
  const cartons=room.type==='bare'?between(1,4):['sala','bedroom','kitchen','hall'].includes(room.type)?between(0,2):0;
  for(let n=Math.round(amount*cartons);n>0;n--)if(stand(card(r()<0.65?'closedBox':'openBox')))report.cardboard=(report.cardboard??0)+1;
  if(room.type!=='bathroom'&&chance(0.18)&&stand(card(r()<0.5?'flattenedCarton':'foldedCarton',{width:0.4,depth:0.35})))report.cardboard=(report.cardboard??0)+1;
  if(room.type!=='bathroom'&&chance(0.14)){const side=wallSide();if(stand(card('leaningCarton',{width:0.45,depth:0.4,rotation:-facing(side)}),{side,flush:true}))report.cardboard=(report.cardboard??0)+1;}
  if(['bare','sala','hall'].includes(room.type)&&chance(0.06)){const side=wallSide();if(stand(card('boxSeat',{rotation:facing(side)}),{side}))report.cardboard=(report.cardboard??0)+1;}
  if(['bare','hall'].includes(room.type)&&room.width>=6&&chance(0.06)){const side=wallSide();if(stand(card('boxBed',{rotation:r()<0.5?0:Math.PI}),{side}))report.cardboard=(report.cardboard??0)+1;}
  // School chairs with writing arms, strays from somewhere institutional.
  const woods=[0xa57b4c,0x8f6a3f,0xb98d5c,0x7a5a38];
  for(let n=['hall','auditorium'].includes(room.type)?(chance(0.35)?between(1,3):0):(['sala','bedroom','bare'].includes(room.type)&&chance(0.07)?1:0);n>0;n--){
    const side=wallSide(),chair=turned(kits.chair.create({arm:r()<0.8?'right':'left',woodColour:pick(woods),frameColour:r()<0.7?0x282a29:0x4e5a52}),facing(side)+(r()-0.5)*0.5);
    if(stand(chair,{side}))report.schoolChairs=(report.schoolChairs??0)+1;
  }
  // ---- The third set of kits: footwear, bathroom things, packaging. Drawn after everything above. ----
  // These kits make new geometry for every object, so they are built for this room and dropped after the bake.
  const shoeKit=createFootwearKit(),bathKit=createBathroomKit(),packKit=createPackagingKit();
  const overlaps=rect=>taken.some(o=>rect.maxX>o.minX&&rect.minX<o.maxX&&rect.maxZ>o.minZ&&rect.minZ<o.maxZ);
  const count=key=>{report[key]=(report[key]??0)+1;return true;};
  // Just inside the entry doorway, beside the aisle.
  const byDoor=object=>{
    const b=object.userData.supportBounds,hw=(b.maxX-b.minX)/2,hd=(b.maxZ-b.minZ)/2;
    const side=wallSide(),x=side*(AISLE+hw+0.05+r()*0.35),z=-(0.3+hd+r()*0.45),rect={minX:x-hw,maxX:x+hw,minZ:z-hd,maxZ:z+hd};
    if(Math.abs(x)+hw>half-0.14||overlaps(rect)){report.rejected++;return false;}
    object.position.set(x-(b.minX+b.maxX)/2,floorAt(z)+0.003,z-(b.minZ+b.maxZ)/2);group.add(object);placed.push(object);taken.push(rect);footprints.push(rect);return true;
  };
  const shoeColours=[0x2f3a44,0x6b4a35,0x8c9691,0xb5524a,0x3f6f58,0xc77f9a,0x5a6f9a,0xd8d2c2,0x1f1f22,0xd9b24a],soles=[0xccc2a9,0x2a2a2a,0xe6e2d6,0x8a6a47];
  // Toes point along the room, toward or away from the door, more often than at random.
  const shoes=()=>turned(shoeKit.pair(pick(FOOTWEAR_TYPES),{colour:pick(shoeColours),soleColour:pick(soles),scale:0.88+r()*0.2,scattered:r()<0.45}),r()<0.65?(r()<0.5?0:Math.PI)+(r()-0.5)*0.5:r()*6.28);
  if(domestic&&room.type!=='bathroom')for(let n=(chance(0.3)?1:0)+(chance(0.1)?1:0);n>0;n--)if(byDoor(shoes()))count('footwear');
  if(room.type==='bedroom'&&chance(0.25)&&stand(shoes()))count('footwear');
  // Bathroom things on the floor by a wall; a spray bottle sometimes in a kitchen.
  const bath=(type,options={})=>bathKit.create(type,{colour:pick(plasticColours),accent:pick([0xdcd6c3,0xe8e6dc,0xcfd8d6]),rotation:r()*6.28,scale:0.92+r()*0.16,...options});
  const roll=()=>bath('paperRoll',{remaining:0.2+r()*0.8,tail:r()<0.4,scale:1});
  if(room.type==='bathroom'){
    if(chance(0.6)&&stand(bath('toiletBrush')))count('bathroom');
    if(chance(0.35)&&stand(bath('plunger')))count('bathroom');
    if(chance(0.5)&&stand(bath(r()<0.5?'cleanerBottle':'sprayBottle')))count('bathroom');
    if(chance(0.25)&&stand(roll()))count('bathroom');
  }else if(room.type==='kitchen'&&chance(0.15)&&stand(bath('sprayBottle')))count('bathroom');
  // Packaging in plain colours: the bake carries no textures, so these have no printed labels.
  const packColours=[0xc23b32,0xe0b23a,0x2f7d4f,0x2e5fa3,0xe8e4d8,0xd96a2b,0x7a3f8c,0x3aa6a0,0xb0b4b3,0x8c5a3a],labels=[0xe2d7b9,0xf0ece0,0xd9b24a,0xc23b32,0x2a2a2a];
  const SIZES={sachet:[0.06,0.03,0.09,0.03,0.008],packet:[0.14,0.07,0.2,0.08,0.05],pouch:[0.11,0.04,0.17,0.06,0.05],productBox:[0.09,0.1,0.12,0.12,0.05],shoppingBag:[0.26,0.1,0.3,0.1,0.11]};
  const pack=(type,options={})=>{
    const [w,dw,h,dh,d]=SIZES[type];
    return packKit.create(type,{width:w+r()*dw,height:h+r()*dh,depth:d*(0.8+r()*0.5),colour:pick(packColours),labelColour:pick(labels),seed:Math.floor(r()*1e6),
      bend:type==='productBox'?0:(r()-0.5)*0.5,crumple:type==='productBox'?0:r()*0.7,fullness:0.3+r()*0.7,rotation:r()*6.28,...options});
  };
  if(room.type!=='bathroom'){
    // On tables and shelves: a tissue roll, a box, a pouch, a packet, a sachet, a cup of toothbrushes.
    const extras={roll,cup:()=>bath('toothbrushCup',{scale:1}),box:()=>pack('productBox'),pouch:()=>pack('pouch'),packet:()=>pack('packet'),sachet:()=>pack('sachet',{pose:'flat'})};
    const onTop={kitchen:['pouch','packet','box','sachet','sachet','roll'],sala:['packet','roll','box','sachet'],bedroom:['box','roll','cup','sachet'],other:['packet','box']}[kind];
    const put=(parent,name)=>{const object=set(name,[extras[name]()]);if(placeOnSupport({THREE,parent,object,support:parent.userData.supportSurface,random:r})){placed.push(object);return count('packaging');}report.rejected++;return false;};
    for(const table of group.children.filter(o=>o.userData.diningTable&&o.userData.supportSurface))
      for(let n=chance(0.35)?between(1,2):0;n>0;n--)put(table,pick(onTop));
    const shelves=[];group.traverse(o=>{if(o.userData.supportSurface&&!o.userData.diningTable&&!o.userData.diningChair)shelves.push(o);});
    for(const shelf of shelves)if(chance(0.2))put(shelf,pick(['box','box','pouch','cup','roll']));
    // Dropped on the floor, anywhere, and walked over; a paper bag stood by a wall.
    for(let n=Math.round(amount*between(0,2));n>0;n--)if(stand(pack(r()<0.6?'sachet':'packet',{pose:'flat',crumple:0.4+r()*0.6,fullness:r()*0.4}),{flat:true,open:true,litter:true}))count('packaging');
    if(['sala','kitchen','bedroom'].includes(room.type)&&chance(0.15)&&stand(pack('shoppingBag',{colour:pick([0xb18b58,0xc9a777,0xe8e4d8,0x8c5a3a]),crumple:r()*0.4})))count('packaging');
  }
  if(!placed.length)return {mesh:null,footprints,walkBlocks,report};

  // Bake: positions into the room's frame, each mesh's material colour into its vertices.
  group.updateMatrixWorld(true);
  const inverse=group.matrixWorld.clone().invert(),tint=new THREE.Color(),m=new THREE.Matrix4(),v=new THREE.Vector3(),positions=[],colors=[];
  for(const object of placed){
    // One drift per object, so a cup and its saucer move together and no two bowls quite match.
    const drift=[(r()-0.5)*0.07,(r()-0.5)*0.16,(r()-0.5)*0.12];
    object.traverse(o=>{
      if(!o.isMesh)return;
      m.multiplyMatrices(inverse,o.matrixWorld);
      const p=o.geometry.attributes.position,index=o.geometry.index,count=index?index.count:p.count;
      // A mesh with several materials names one per group of its geometry.
      const several=Array.isArray(o.material),shade=material=>tint.copy(material.color).offsetHSL(drift[0],drift[1],drift[2]);
      let c=shade(several?o.material[0]:o.material);
      for(let i=0;i<count;i++){
        if(several){const part=o.geometry.groups.find(g=>i>=g.start&&i<g.start+g.count);c=shade(o.material[part?.materialIndex??0]);}
        v.fromBufferAttribute(p,index?index.getX(i):i).applyMatrix4(m);
        positions.push(v.x,v.y,v.z);colors.push(c.r,c.g,c.b);
      }
    });
    object.parent.remove(object);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);mesh.name='household-items';mesh.userData.own=true;
  report.triangles=positions.length/9;
  return {mesh,footprints,walkBlocks,report};
}
