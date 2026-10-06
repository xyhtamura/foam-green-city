import {branchOpenings,sideSpacePlan} from './side-spaces.js?v=a0bea98a3c';
import {localBounds} from './object-supports.js?v=a0bea98a3c';

export function addSideWashrooms({THREE,group,room,assets,curvize}){
  const owner=new THREE.Group();owner.name='side-washrooms';group.add(owner);
  const geometries=new Set(),materials=new Set(),report=[];
  const box=new THREE.BoxGeometry(1,1,1);geometries.add(box);
  const material=c=>{const m=curvize(new THREE.MeshLambertMaterial({color:c}));materials.add(m);return m;};
  const metal=material(0x939d98),blue=material(0x497f9c),dark=material(0x48534d),cloth=material(0x9caaa0);
  function block(parent,mat,x,y,z,w,h,d){const m=new THREE.Mesh(box,mat);m.position.set(x,y,z);m.scale.set(w,h,d);parent.add(m);return m;}
  function cylinder(parent,mat,x,y,z,r,length,axis='y'){
    const g=new THREE.CylinderGeometry(r,r,length,8);geometries.add(g);
    const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);
    if(axis==='x')m.rotation.z=Math.PI/2;if(axis==='z')m.rotation.x=Math.PI/2;
    parent.add(m);return m;
  }
  for(const portal of branchOpenings(room).filter(p=>p.kind!=='legacy')){
    const plan=sideSpacePlan(room,portal);if(!plan.washroom)continue;
    const pieces=[],r=plan.roomRect,far=portal.side>0?r.maxX:r.minX;
    for(const f of plan.fixtures){
      const object=assets[f.model].clone();object.traverse(o=>{o.userData.own=false;o.userData.ownMaterial=false;});
      if(f.role!=='bucket')object.rotation.y=portal.side>0?-Math.PI/2:Math.PI/2;
      let b=new THREE.Box3().setFromObject(object),size=b.getSize(new THREE.Vector3());
      object.scale.multiplyScalar(Math.min(f.w/size.x,f.d/size.z,f.h/size.y));
      b=new THREE.Box3().setFromObject(object);
      object.position.set(f.x-(b.min.x+b.max.x)/2,.002-b.min.y,f.z-(b.min.z+b.max.z)/2);
      object.name='side-washroom-'+f.role;owner.add(object);
      b=localBounds(THREE,object,group);
      pieces.push({role:f.role,model:f.model,inside:b.min.x>=r.minX+.06&&b.max.x<=r.maxX-.06&&b.min.z>=r.minZ+.06&&b.max.z<=r.maxZ-.06,contactGap:b.min.y,size:b.getSize(new THREE.Vector3()).toArray()});
      if(f.role==='sink'){
        // A small mirror and towel remain against the outer wall.
        block(owner,dark,far-portal.side*.09,1.4,f.z,.024,.4,.3);
        block(owner,metal,far-portal.side*.106,1.4,f.z,.008,.36,.26);
        block(owner,cloth,far-portal.side*.12,.94,f.z+.45,.025,.35,.2);
      }
    }
    const plumbing=new THREE.Group();owner.add(plumbing);plumbing.name='washroom-shower-and-faucet';
    const x=far-portal.side*.11,z=portal.z;
    cylinder(plumbing,blue,x,1.15,z,.017,1.6);
    for(const y of [.4,1.2,1.85])block(plumbing,metal,far-portal.side*.06,y,z,.12,.03,.055);
    cylinder(plumbing,metal,x-portal.side*.1,1.95,z,.014,.2,'x');
    const head=cylinder(plumbing,metal,x-portal.side*.2,1.925,z,.06,.025);head.rotation.z=portal.side*.45;
    cylinder(plumbing,metal,x-portal.side*.07,.65,z,.015,.14,'x');
    cylinder(plumbing,metal,x-portal.side*.14,.62,z,.015,.065);
    block(plumbing,metal,x-portal.side*.04,.71,z,.035,.025,.11);
    // Flat drain and soap dish use authored geometry, with no shower enclosure.
    const bucket=plan.fixtures.find(f=>f.role==='bucket');
    block(owner,dark,bucket.x,.008,z-.42,.12,.012,.12);
    block(owner,metal,x-portal.side*.04,1.05,z+.24,.12,.025,.16);
    block(owner,cloth,x-portal.side*.04,1.08,z+.24,.07,.035,.1);
    report.push({side:portal.side,variant:plan.variant,pieces,shower:'nozzle',pipe:'blue',floor:'bare'});
  }
  owner.userData.report=report;
  owner.userData.dispose=()=>{for(const g of geometries)g.dispose();for(const m of materials)m.dispose();};
  return owner;
}
