import {floorHeight} from './room-sequences.js';
import {RAW_OBJECTS,createRawObject} from './raw-object-assets.js?v=raw-2';

// Authored low-detail household shapes. All resources belong to one streamed room.
export function addDomesticDetails({THREE,group,room,seed,curvize,spots,photos,spriteMat,ceiling,forceRoof=false}){
  let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const owner=new THREE.Group();owner.name='domestic-details';group.add(owner);
  const geometries=new Set(),materials=new Set(),textures=new Set();
  const material=color=>{const m=curvize(new THREE.MeshLambertMaterial({color}));materials.add(m);return m;};
  const palette=[0x7b8f79,0xbb9a6a,0xaaa8a0,0x547c88,0x937065,0xd0c8b1].map(material);
  const food=[0xb75a43,0xc7a75a,0x7e9a53,0xd09c79,0xc5c1a4].map(material);
  const geo=g=>{geometries.add(g);return g;};
  const box=geo(new THREE.BoxGeometry(1,1,1)),round=geo(new THREE.CylinderGeometry(0.5,0.5,1,8)),ball=geo(new THREE.SphereGeometry(0.5,6,4));
  const loop=geo(new THREE.TorusGeometry(0.5,0.09,4,12));
  const bottleBodies=[
    [[0,0],[0.42,0],[0.46,0.64],[0.36,0.76],[0.16,0.83],[0.16,1],[0,1]],
    [[0,0],[0.35,0],[0.5,0.14],[0.5,0.56],[0.32,0.72],[0.13,0.82],[0.13,1],[0,1]],
    [[0,0],[0.4,0],[0.4,0.79],[0.18,0.85],[0.18,1],[0,1]],
  ].map(points=>geo(new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(...p)),8)));
  const metal=material(0xaeb8b5),fabric=material(0xaaa995);
  const kitchen=room.type==='kitchen'||room.kitchenCorner;
  let cutouts=0,tools=0;
  const condiments=RAW_OBJECTS.filter(p=>/silverswan|datu_puti|mang_tomas|ligo|bagoong|ube_halaya/.test(p.file));
  const papers=RAW_OBJECTS.filter(p=>/envelope|pad/.test(p.file));
  const clothes=RAW_OBJECTS.filter(p=>/jeans|tshirt|shorts/.test(p.file));
  function cutout(parent,p,x,y,z,width){
    const asset={...p,width:Math.min(p.width,width)},obj=createRawObject({THREE,asset,material:spriteMat(p.file)});
    geometries.add(obj.geometry);obj.userData.own=false;obj.userData.detailCutout=true;
    obj.position.x=x;obj.position.z=z;obj.position.y+=y;parent.add(obj);cutouts++;
  }
  // Separate pools keep small household images from competing with every large prop.
  function supplied(parent,x,y,z,pool,n=2,width=0.18){
    if(!pool.length)return;
    const start=Math.floor(random()*pool.length);
    for(let i=0;i<n;i++)cutout(parent,pool[(start+i)%pool.length],x+(i-(n-1)/2)*0.25,y,z,width);
  }
  function pitcher(parent,x,y,z){
    const points=[[0,0],[0.07,0],[0.085,0.2],[0.075,0.21],[0.065,0.2],[0.054,0.018],[0,0.018]].map(p=>new THREE.Vector2(...p));
    const m=palette[3],body=mesh(parent,geo(new THREE.LatheGeometry(points,10)),m,x,y,z,1,1,1);
    body.name='clutter-pitcher';mesh(parent,loop,m,x+0.095,y+0.105,z,0.12,0.17,0.1);
    mesh(parent,box,m,x-0.072,y+0.2,z,0.055,0.02,0.045).rotation.z=-0.2;tools++;
  }
  function board(parent,x,y,z){
    const plank=mesh(parent,box,palette[1],x,y+0.008,z,0.27,0.016,0.17);plank.name='chopping-board';
    const blade=mesh(parent,box,metal,x+0.01,y+0.023,z,0.13,0.005,0.028);blade.rotation.y=0.24;blade.name='kitchen-knife';
    mesh(parent,box,palette[4],x-0.105,y+0.025,z-0.02,0.075,0.015,0.025).rotation.y=0.24;tools++;
  }
  function mesh(parent,geometry,mat,x,y,z,w,h,d){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.scale.set(w,h,d);parent.add(m);return m;}
  function assortment(parent,x,y,z,n=3){
    for(let i=0;i<n;i++){
      const shape=Math.floor(random()*13),w=0.07+random()*0.09,h=shape===0?0.16+random()*0.13:0.025+random()*0.09;
      const cx=x+(i-(n-1)/2)*0.18,cz=z+(random()-0.5)*0.1,m=palette[Math.floor(random()*palette.length)];
      if(shape>=10){
        const height=0.14+random()*0.16,width=0.055+random()*0.055;
        const bottle=mesh(parent,bottleBodies[shape-10],m,cx,y,cz,width,height,width);bottle.name='generic-bottle';
        mesh(parent,round,palette[Math.floor(random()*palette.length)],cx,y+height+0.009,cz,width*0.38,0.018,width*0.38);
        if(random()<0.75)mesh(parent,round,palette[5],cx,y+height*0.43,cz,width*0.94,height*0.23,width*0.94);
        tools++;continue;
      }
      if(shape===4){
        const width=w*1.8,depth=w*1.25;
        mesh(parent,box,m,cx,y+h/2,cz,width,h,depth);
        mesh(parent,box,palette[5],cx,y+h+0.006,cz,width+0.012,0.012,depth+0.012);
        mesh(parent,box,palette[2],cx+width/2+0.001,y+h*0.55,cz,0.002,h*0.38,depth*0.4);
        continue;
      }
      if(shape===7){pitcher(parent,cx,y,cz);continue;}
      if(shape===8){
        const width=0.15+random()*0.09,depth=0.12+random()*0.13;
        for(let k=0;k<3;k++)mesh(parent,box,k===2?m:palette[5],cx+k*0.006,y+0.005+k*0.012,cz,width,0.008,depth).rotation.y=(random()-0.5)*0.15;
        continue;
      }
      if(shape===9){
        mesh(parent,box,m,cx,y+0.014,cz,0.14,0.028,0.18);
        for(const side of [-1,1])mesh(parent,box,m,cx+side*0.078,y+0.015,cz-0.04,0.065,0.02,0.075).rotation.y=side*0.4;
        continue;
      }
      if(shape===5||shape===6){
        const skin=food[Math.floor(random()*food.length)],size=shape===6?0.035:w;
        mesh(parent,ball,skin,cx,y+size*0.4,cz,size,size*0.8,size*1.1);
        if(shape===6)for(const side of [-1,1])mesh(parent,box,skin,cx+side*size*0.65,y+size*0.4,cz,size*0.45,size*0.45,size*0.65).rotation.y=side*0.45;
        continue;
      }
      mesh(parent,shape===2?ball:shape===0?round:box,m,cx,y+h/2,cz,w,h,w);
      if(shape===0)mesh(parent,round,m,cx,y+h+0.025,cz,w*0.4,0.05,w*0.4);
      if(shape===3)for(let k=1;k<3;k++)mesh(parent,box,m,cx+k*0.012,y+h/2+k*0.025,cz,w*1.2,h,w*1.6).rotation.y=k*0.08;
    }
  }
  // Everyday objects collect at table edges instead of filling the walking aisle.
  for(const table of group.children.filter(o=>o.userData.diningTable&&!o.userData.placement?.inverted&&o.userData.placement?.stack===null).slice(0,6)){
    const cluster=new THREE.Group();cluster.name='table-clutter';assortment(cluster,0,0.768,0.28,3+Math.floor(random()*2));
    supplied(cluster,0,0.77,-0.25,kitchen?condiments:papers,2);
    if(kitchen&&random()<0.65)board(cluster,0.22,0.77,0);
    table.add(cluster);
  }
  group.updateMatrixWorld(true);
  const surfaces=[];
  group.traverse(o=>{if(['sideTableDrawers','bookcaseOpenLow','phBookshelf','phRack'].includes(o.userData.modelName)||['kitchenCabinet','kitchenFridge'].includes(o.userData.fixture))surfaces.push(o);});
  for(const surface of surfaces.slice(0,4)){
    const b=new THREE.Box3().setFromObject(surface),cluster=new THREE.Group();cluster.name='surface-clutter';
    assortment(cluster,0,0,0,2);
    supplied(cluster,0,0.005,0.12,kitchen?condiments:random()<0.5?clothes:papers,1,0.15);
    cluster.position.set((b.min.x+b.max.x)/2,b.max.y+0.004,(b.min.z+b.max.z)/2-room.startZ);group.add(cluster);
  }
  const occupied=group.children.filter(o=>o.userData.floorProp||o.userData.utilityProp||o.userData.diningTable||o.userData.diningChair||o.userData.billboard||o.userData.door||o.userData.wallTv||o.userData.pipeRun)
    .map(o=>new THREE.Box3().setFromObject(o).expandByScalar(0.04));
  function clear(object){
    group.add(object);group.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(object);
    const inside=b.min.x>=-room.width/2+0.1&&b.max.x<=room.width/2-0.1&&b.min.z>=room.startZ-room.length+0.15&&b.max.z<=room.startZ-0.15;
    const reserved=group.userData.architecture.userData.reservations.some(r=>b.min.x<r.maxX&&b.max.x>r.minX&&b.min.z<room.startZ+r.maxZ&&b.max.z>room.startZ+r.minZ);
    if(!inside||reserved||occupied.some(other=>b.intersectsBox(other))){group.remove(object);return false;}
    occupied.push(b);return true;
  }
  let shelves=0,floorClusters=0;
  const candidates=[...spots,...group.children.filter(o=>o.userData.wallPhoto).map(o=>({side:Math.sign(o.position.x),z:o.position.z}))];
  for(const spot of candidates.slice(0,8)){
    const shelf=new THREE.Group();shelf.name='household-shelf';shelf.userData.floorProp=true;
    mesh(shelf,box,palette[1],0,0.9,0.11,0.85,0.035,0.22);assortment(shelf,0,0.92,0.1,3);
    supplied(shelf,0.15,0.94,0.14,kitchen?condiments:papers,1,0.14);
    if(photos.length){
      const photo=photos[Math.floor(random()*photos.length)],w=0.16,h=Math.min(0.2,w*photo.aspect);
      mesh(shelf,box,palette[4],-0.28,0.94+h/2,0.13,w+0.025,h+0.025,0.025);
      const picture=new THREE.Mesh(geo(new THREE.PlaneGeometry(w,h)),spriteMat(photo.file));picture.position.set(-0.28,0.94+h/2,0.145);shelf.add(picture);
    }
    shelf.rotation.y=spot.side>0?-Math.PI/2:Math.PI/2;
    shelf.position.set(spot.side*(room.width/2-0.12),floorHeight(room,spot.z),spot.z);
    if(clear(shelf)){shelves++;const at=spots.indexOf(spot);if(at>=0)spots.splice(at,1);if(shelves===2)break;}
  }
  if(room.type!=='bathroom')for(let i=0;i<10&&floorClusters<3;i++){
    const side=random()<0.5?-1:1,z=-0.8-random()*(room.length-1.6),cluster=new THREE.Group();cluster.name='floor-clutter';cluster.userData.floorProp=true;
    assortment(cluster,0,0,0,2+Math.floor(random()*2));
    if(clothes.length&&random()<0.7)supplied(cluster,0,0.008,0.19,clothes,1,0.28);
    cluster.position.set(side*(room.width/2-0.45),floorHeight(room,z),z);
    if(clear(cluster))floorClusters++;
  }
  // Mop candidates use the same collision and doorway reservations as floor clutter.
  if(seed%3===0)for(const side of [-1,1]){
    const mop=new THREE.Group();mop.name='household-mop';mop.userData.floorProp=true;
    mesh(mop,round,palette[3],0,0.64,0,0.018,1.18,0.018).rotation.z=0.08;
    for(let k=0;k<9;k++)mesh(mop,box,fabric,(k%3-1)*0.035,0.06,Math.floor(k/3)*0.035-0.035,0.024,0.12,0.024).rotation.z=(k%3-1)*0.18;
    const z=-room.length*0.7;mop.position.set(side*(room.width/2-0.22),floorHeight(room,z),z);
    if(clear(mop)){tools++;break;}
  }
  // Broad stains and scuffs on the existing floor; bare floors remain untiled.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');
  for(let i=0;i<36;i++){
    ctx.fillStyle=`rgba(74,68,54,${0.025+random()*0.07})`;ctx.beginPath();ctx.ellipse(random()*256,random()*256,4+random()*24,2+random()*9,random()*Math.PI,0,Math.PI*2);ctx.fill();
  }
  for(let i=0;i<8;i++){ctx.strokeStyle='rgba(60,59,53,0.14)';ctx.lineWidth=0.6;let x=random()*256,y=random()*256;ctx.beginPath();ctx.moveTo(x,y);for(let j=0;j<4;j++){x+=random()*13-6;y+=random()*13;ctx.lineTo(x,y);}ctx.stroke();}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;textures.add(texture);
  const wear=curvize(new THREE.MeshLambertMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));materials.add(wear);
  for(const spot of spots.slice(0,4)){
    const patch=new THREE.Mesh(geo(new THREE.PlaneGeometry(1.75,1.45)),wear);
    patch.rotation.y=spot.side>0?-Math.PI/2:Math.PI/2;
    patch.position.set(spot.side*(room.width/2-0.105),floorHeight(room,spot.z)+0.83,spot.z);owner.add(patch);
  }
  const floor=geo(new THREE.PlaneGeometry(room.width,room.length,Math.ceil(room.width/2),Math.ceil(room.length)).rotateX(-Math.PI/2).translate(0,0,-room.length/2));
  const positions=floor.attributes.position;for(let i=0;i<positions.count;i++)positions.setY(i,floorHeight(room,positions.getZ(i))+0.008);floor.computeVertexNormals();owner.add(new THREE.Mesh(floor,wear));
  const exposed=forceRoof||(seed%7===2&&room.height<4&&room.shape==='rectangle');
  if(exposed){
    group.remove(ceiling);ceiling.geometry.dispose();
    const roof=geo(new THREE.PlaneGeometry(room.width,room.length,Math.ceil(room.width/0.12),Math.ceil(room.length/2)).rotateX(Math.PI/2));
    const p=roof.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,room.height-0.035+Math.cos(p.getX(i)*Math.PI/0.12)*0.025);roof.computeVertexNormals();
    const folded=geo(roof.toNonIndexed());folded.computeVertexNormals();
    const vertices=folded.attributes.position,colors=[];
    for(let i=0;i<vertices.count;i+=3){const x=(vertices.getX(i)+vertices.getX(i+1)+vertices.getX(i+2))/3;const shade=Math.floor((x+room.width/2)/0.12)%2?0.78:1;for(let k=0;k<3;k++)colors.push(shade,shade,shade);}
    folded.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    const sheet=material(0x8c918b);sheet.side=THREE.DoubleSide;sheet.flatShading=true;sheet.vertexColors=true;const panel=new THREE.Mesh(folded,sheet);panel.position.z=-room.length/2;owner.add(panel);
    for(let z=-1;z>-room.length;z-=2){const beam=new THREE.Mesh(geo(new THREE.BoxGeometry(room.width,0.14,0.09,Math.ceil(room.width/2),1,1)),palette[1]);beam.position.set(0,room.height-0.15,z);owner.add(beam);}
    for(const x of [-room.width/4,room.width/4]){const beam=new THREE.Mesh(geo(new THREE.BoxGeometry(0.1,0.13,room.length,1,1,Math.ceil(room.length))),palette[4]);beam.position.set(x,room.height-0.24,-room.length/2);owner.add(beam);}
  }
  // Tiny silhouettes at skirting level, occasional and static in this first pass.
  let roaches=0;if(seed%5===1){
    const brown=material(0x352a20);
    for(let i=0;i<2;i++){
      const x=(i?1:-1)*(room.width/2-0.25),z=-1-random()*(room.length-2),y=floorHeight(room,z)+0.008;
      mesh(owner,ball,brown,x,y+0.008,z,0.027,0.012,0.055);
      for(const side of [-1,1])for(let k=0;k<3;k++)mesh(owner,box,brown,x+side*0.02,y+0.003,z+(k-1)*0.017,0.025,0.002,0.003).rotation.y=side*(k-1)*0.45;
      roaches++;
    }
  }
  cutouts=0;tools=0;
  group.traverse(o=>{if(o.userData.detailCutout)cutouts++;if(['generic-bottle','clutter-pitcher','chopping-board','household-mop'].includes(o.name))tools++;});
  owner.userData.details={shelves,floorClusters,exposedRoof:exposed,roaches,cutouts,tools};
  owner.userData.dispose=()=>{for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();};
  return owner;
}
