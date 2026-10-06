import {branchOpenings,sideSpacePlan} from './side-spaces.js?v=e1cc89b005';
import {localBounds} from './object-supports.js?v=e1cc89b005';
import {RAW_OBJECTS,createRawObject} from './raw-object-assets.js?v=e1cc89b005';

// Prototype meshes stay shared; bedding and photo planes belong to this room.
export function addSideBedrooms({THREE,group,room,assets,curvize,photos,spriteMat}){
  const owner=new THREE.Group();owner.name='side-bedrooms';group.add(owner);
  const geometries=new Set(),materials=new Set(),report=[];
  const box=new THREE.BoxGeometry(1,1,1);geometries.add(box);
  const colour=c=>{const m=curvize(new THREE.MeshLambertMaterial({color:c}));materials.add(m);return m;};
  const bedding=[0x748ca5,0xb38b80,0x829476],cotton=colour(0xd6d1bc);
  const clothes=RAW_OBJECTS.filter(a=>/jeans|tshirt|shorts/.test(a.file));
  const familyPhotos=photos.filter(a=>/family|portrait/i.test(a.file));
  function block(mat,x,y,z,w,h,d){const mesh=new THREE.Mesh(box,mat);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);owner.add(mesh);return mesh;}
  function fit(f){
    const object=(assets[f.model]??assets.plasticDrawers).clone();object.traverse(o=>{o.userData.own=false;o.userData.ownMaterial=false;});
    let bounds=new THREE.Box3().setFromObject(object),size=bounds.getSize(new THREE.Vector3());
    if(f.role==='bed'&&size.z>size.x)object.rotation.y=Math.PI/2;
    if(f.role==='drawers')object.rotation.y=f.x>0?-Math.PI/2:Math.PI/2;
    bounds=new THREE.Box3().setFromObject(object);size=bounds.getSize(new THREE.Vector3());
    object.scale.multiplyScalar(Math.min(f.role==='drawers'?1:Infinity,f.w/size.x,f.d/size.z,f.h/size.y));
    bounds=new THREE.Box3().setFromObject(object);
    object.position.set(f.x-(bounds.min.x+bounds.max.x)/2,0.002-bounds.min.y,f.z-(bounds.min.z+bounds.max.z)/2);
    owner.add(object);object.name='side-bedroom-'+f.role;return object;
  }
  for(const portal of branchOpenings(room).filter(p=>p.kind!=='legacy')){
    const plan=sideSpacePlan(room,portal);if(!plan.bedroom)continue;
    // Bedding keeps its family of colour and shifts a little by room.
    const turn=(Math.imul((room.generationIndex??room.index??0)+71,2654435761)>>>0)/4294967296;
    const cloth=colour(new THREE.Color(bedding[plan.variant]).offsetHSL((turn-0.5)*0.3,(turn*7%1-0.5)*0.2,(turn*13%1-0.5)*0.14).getHex()),pieces=[];
    for(const f of plan.fixtures){
      const object=fit(f),bounds=localBounds(THREE,object,group),r=plan.roomRect;
      pieces.push({role:f.role,model:f.model,inside:bounds.min.x>=r.minX+.06&&bounds.max.x<=r.maxX-.06&&bounds.min.z>=r.minZ+.06&&bounds.max.z<=r.maxZ-.06,contactGap:bounds.min.y,bounds:{minX:bounds.min.x,maxX:bounds.max.x,minZ:bounds.min.z,maxZ:bounds.max.z},size:bounds.getSize(new THREE.Vector3()).toArray()});
      if(f.role==='bed'){
        const ray=new THREE.Raycaster(new THREE.Vector3(f.x,2,room.startZ+f.z),new THREE.Vector3(0,-1,0));
        object.updateWorldMatrix(true,true);const hit=ray.intersectObject(object,true)[0];
        if(hit){
          const top=hit.point.y,w=Math.min(1.25,bounds.max.x-bounds.min.x-.06),d=Math.min(.75,bounds.max.z-bounds.min.z-.06);
          block(cloth,f.x,top+.008,f.z,w,.012,d).name='bed-blanket';
          const headSamples=[-1,1].map(sign=>{
            ray.set(new THREE.Vector3(f.x+sign*(bounds.max.x-bounds.min.x)*.48,2,room.startZ+f.z),new THREE.Vector3(0,-1,0));
            return ray.intersectObject(object,true)[0]?.point.y??top;
          });
          const headSign=headSamples[1]>headSamples[0]?1:-1;
          for(const k of (f.model==='phDaybed'?[]:[-1,1]))block(cotton,f.x+headSign*(bounds.max.x-bounds.min.x)*.32,top+.035,f.z+k*.16,.28,.06,.24).name='bed-pillow';
          block(cotton,f.x-w*.38,top+.015,f.z,.09,.008,d).name='blanket-edge';
        }
      }else if(clothes.length&&Math.abs(room.index??0)%9===0){   // a doll-sized garment on the drawers, rarely
        const asset=clothes[Math.abs(room.index??0)%clothes.length],flat={...asset,mode:'flat',width:Math.min(.16,.28/asset.aspect)};
        const object=createRawObject({THREE,asset:flat,material:spriteMat(asset.file)});geometries.add(object.geometry);object.userData.own=false;
        object.position.set(f.x,bounds.max.y+.003,f.z);object.rotation.y=.15;owner.add(object);
      }
    }
    if(familyPhotos.length){
      const photo=familyPhotos[Math.abs(room.index??0)%familyPhotos.length],w=Math.min(.18,.2/photo.aspect),h=w*photo.aspect;
      const farX=portal.side>0?plan.roomRect.maxX:plan.roomRect.minX;
      const frame=block(colour(0x665648),farX-portal.side*.085,1.4,portal.z-.35,.024,h+.025,w+.025);
      frame.name='bedroom-family-photo';
      const geometry=new THREE.PlaneGeometry(w,h);geometries.add(geometry);const picture=new THREE.Mesh(geometry,spriteMat(photo.file));
      picture.position.set(farX-portal.side*.1,1.4,portal.z-.35);picture.rotation.y=portal.side>0?-Math.PI/2:Math.PI/2;owner.add(picture);
    }
    report.push({side:portal.side,variant:plan.variant,pieces});
  }
  owner.userData.report=report;
  owner.userData.dispose=()=>{for(const g of geometries)g.dispose();for(const m of materials)m.dispose();};
  return owner;
}
