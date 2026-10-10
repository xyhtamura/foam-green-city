import {branchOpenings,sideSpacePlan} from './side-spaces.js?v=7a89c05d69';
import {localBounds} from './object-supports.js?v=7a89c05d69';

export function addSideStorage({THREE,group,room,assets,curvize}){
  const owner=new THREE.Group();owner.name='side-storage';group.add(owner);
  const geometries=new Set(),materials=new Set(),report=[];
  const box=new THREE.BoxGeometry(1,1,1);geometries.add(box);
  const material=c=>{const m=curvize(new THREE.MeshLambertMaterial({color:c}));materials.add(m);return m;};
  const wood=material(0x786855),tape=material(0xc9b997);
  const cartons=[0x9c805b,0xae9674,0x797f75,0x888fa3].map(material);
  function block(parent,mat,x,y,z,w,h,d){const mesh=new THREE.Mesh(box,mat);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;}
  function carton(parent,x,bottom,z,w,h,d,colour){
    block(parent,cartons[colour%cartons.length],x,bottom+h/2,z,w,h,d);
    block(parent,tape,x,bottom+h+.003,z,.045,.006,d+.006);
    block(parent,tape,x,bottom+h/2,z+d/2+.002,.045,h,.004);
  }
  for(const portal of branchOpenings(room).filter(p=>p.kind!=='legacy')){
    const plan=sideSpacePlan(room,portal);if(!plan.storage)continue;
    const pieces=[];
    for(const f of plan.fixtures){
      const object=new THREE.Group();object.position.set(f.x,.002,f.z);owner.add(object);
      if(f.role==='storageShelf'){
        for(const x of [-.52,.52])for(const z of [-.21,.21])block(object,wood,x,.85,z,.035,1.7,.035);
        for(const [n,y] of [.1,.62,1.14,1.66].entries()){
          block(object,wood,0,y-.015,0,1.1,.03,.48);
          if(n<3)for(const k of [-1,1])carton(object,k*.27,y+.002,0,.38,.25+(Math.abs(room.index??0)+n)%3*.04,.34,n+plan.variant+(k+1));
        }
      }else if(f.role==='storageStack'){
        carton(object,0,0,0,.6,.32,.47,plan.variant);
        carton(object,.04,.328,-.025,.46,.25,.38,plan.variant+1);
        carton(object,-.04,.586,.01,.33,.19,.29,plan.variant+2);
      }else{
        const model=(assets[f.model]??assets.plasticDrawers).clone();model.traverse(o=>{o.userData.own=false;o.userData.ownMaterial=false;});
        if(f.role==='drawers')model.rotation.y=f.x>0?-Math.PI/2:Math.PI/2;
        let bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
        model.scale.multiplyScalar(Math.min(f.role==='drawers'?1:Infinity,f.w/size.x,f.d/size.z,f.h/size.y));   // drawers keep their own size when they fit
        bounds=new THREE.Box3().setFromObject(model);
        model.position.set(-(bounds.min.x+bounds.max.x)/2,-bounds.min.y,-(bounds.min.z+bounds.max.z)/2);object.add(model);
        if(f.role==='drawers')carton(object,0,bounds.max.y-bounds.min.y+.002,0,.27,.14,.26,plan.variant+2);
      }
      object.name='side-storage-'+f.role;
      const b=localBounds(THREE,object,group),r=plan.roomRect;
      pieces.push({role:f.role,model:f.model??'authored',inside:b.min.x>=r.minX+.06&&b.max.x<=r.maxX-.06&&b.min.z>=r.minZ+.06&&b.max.z<=r.maxZ-.06,contactGap:b.min.y,bounds:{minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z},size:b.getSize(new THREE.Vector3()).toArray()});
    }
    report.push({side:portal.side,variant:plan.variant,pieces});
  }
  owner.userData.report=report;
  owner.userData.dispose=()=>{for(const g of geometries)g.dispose();for(const m of materials)m.dispose();};
  return owner;
}
