import * as THREE from 'three';
import {fittingSizes} from './pipe-runs.js?v=1dff8746b9';

// Modular PVC pipe parts, drawn as geometry. No textures and no downloaded
// assets. Each part is authored once at a diameter of 1 and scaled per piece,
// so every piece in every room shares the same few geometries and materials.

// One pipe colour and one fitting colour per material. Sockets are moulded
// separately and read slightly darker than the pipe.
export const PIPE_COLOURS={
  pipeBlue:0x2f74c0,fittingBlue:0x2a66ab,       // potable-water PVC
  pipeOrange:0xd9722b,fittingOrange:0xc2621f,   // sanitary and drain PVC
  pipeGrey:0x8f9698,fittingGrey:0x7d8486,       // grey drain and conduit PVC
  clamp:0x9aa19d,
  faucet:0xb7963f,
  handle:0x2f74c0,
};

// Returns {materials, build(pieces), dispose()}. `build` returns a Group in the
// room's coordinates; add it to the segment group. `materials` is exposed so an
// integrator can pass each one through its own shader patch, such as curvize().
export function createPipeKit({radialSegments=8,colours=PIPE_COLOURS}={}){
  const materials=Object.fromEntries(Object.entries(colours).map(([name,color])=>[name,new THREE.MeshLambertMaterial({color})]));
  const S=fittingSizes(1);
  const suffix={blue:'Blue',orange:'Orange',grey:'Grey'};
  const pipeOf=p=>materials['pipe'+(suffix[p.material]??'Blue')],fittingOf=p=>materials['fitting'+(suffix[p.material]??'Blue')];

  // Unit cylinder along +Y with its base at the origin.
  const tube=new THREE.CylinderGeometry(1,1,1,radialSegments).translate(0,0.5,0);
  // Quarter bend for an elbow whose legs leave the corner along +X and +Y.
  const bend=new THREE.TorusGeometry(S.bend,S.socketRadius,Math.max(4,radialSegments-2),6,Math.PI/2).rotateZ(Math.PI).translate(S.bend,S.bend,0);
  // Half ring of a saddle clamp, arching over the pipe toward +Z.
  const saddle=new THREE.TorusGeometry(0.62,0.12,4,8,Math.PI).rotateZ(-Math.PI/2).rotateY(-Math.PI/2);
  const box=new THREE.BoxGeometry(1,1,1);
  const geometries=[tube,bend,saddle,box];

  const X=new THREE.Vector3(1,0,0),Y=new THREE.Vector3(0,1,0);
  const vector=a=>new THREE.Vector3(a[0],a[1],a[2]);
  const alongY=(object,axis)=>object.quaternion.setFromUnitVectors(Y,vector(axis));
  // Orients a part authored with its first direction on +X and its second on +Y.
  const basis=(object,x,y)=>{const a=vector(x),b=vector(y);
    object.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(a,b,new THREE.Vector3().crossVectors(a,b)));};
  const part=(parent,geometry,material,name)=>{const m=new THREE.Mesh(geometry,material);m.name=name;parent.add(m);return m;};
  // A cylinder of the given radius from `from`, running `length` along +X or +Y.
  const sleeve=(parent,material,name,radius,length,from,alongX=false)=>{
    const m=part(parent,tube,material,name);m.scale.set(radius,length,radius);m.position.copy(from);
    if(alongX)m.rotation.z=-Math.PI/2;return m;};

  const builders={
    pipe(p){const m=new THREE.Mesh(tube,pipeOf(p));m.scale.set(p.diameter/2,p.length,p.diameter/2);alongY(m,p.axis);return m;},
    coupling(p){
      const g=new THREE.Group();sleeve(g,fittingOf(p),'sleeve',S.socketRadius,S.coupling,new THREE.Vector3(0,-S.coupling/2,0));
      g.scale.setScalar(p.diameter);alongY(g,p.axis);return g;},
    cap(p){
      const g=new THREE.Group();sleeve(g,fittingOf(p),'cap',S.socketRadius,S.cap,new THREE.Vector3(0,-S.cap*0.8,0));
      g.scale.setScalar(p.diameter);alongY(g,p.axis);return g;},
    elbow(p){
      const g=new THREE.Group(),fitting=fittingOf(p);part(g,bend,fitting,'bend');
      sleeve(g,fitting,'socket',S.socketRadius,S.collar,new THREE.Vector3(0,S.bend,0));
      sleeve(g,fitting,'socket',S.socketRadius,S.collar,new THREE.Vector3(S.bend,0,0),true);
      g.scale.setScalar(p.diameter);basis(g,p.a,p.b);return g;},
    tee(p){
      const g=new THREE.Group(),fitting=fittingOf(p);
      sleeve(g,fitting,'body',S.socketRadius,2*S.teeHalf,new THREE.Vector3(-S.teeHalf,0,0),true);
      sleeve(g,fitting,'branch',S.socketRadius,S.teeHalf,new THREE.Vector3());
      g.scale.setScalar(p.diameter);basis(g,p.axis,p.branch);return g;},
    clamp(p){
      // Authored with the pipe along +X and the surface behind it at -Z.
      const g=new THREE.Group(),d=p.diameter,ring=part(g,saddle,materials.clamp,'saddle');ring.scale.setScalar(d);
      const stem=part(g,box,materials.clamp,'stem');stem.scale.set(d*0.6,d*0.5,p.standoff);stem.position.z=-p.standoff/2;
      const plate=part(g,box,materials.clamp,'plate');plate.scale.set(d*0.9,d*1.8,0.004);plate.position.z=-p.standoff+0.002;
      const n=vector(p.normal),a=vector(p.axis);
      g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(a,new THREE.Vector3().crossVectors(n,a),n));return g;},
    faucet(p){
      // Authored with the spout pointing into the room along +Z and up along +Y.
      const g=new THREE.Group(),d=p.diameter,brass=materials.faucet;
      // The socket sleeves the pipe end, which arrives from above or from below.
      const from=p.axis[1]>0?-1:1,socket=sleeve(g,fittingOf(p),'socket',d*S.socketRadius,d*1.6,new THREE.Vector3(0,-from*d*0.4,0));
      if(from<0)socket.rotation.x=Math.PI;
      const body=sleeve(g,brass,'body',0.011,0.05,new THREE.Vector3());body.rotation.x=Math.PI/2;
      const spout=sleeve(g,brass,'spout',0.008,0.035,new THREE.Vector3(0,0,0.042));spout.rotation.x=Math.PI;
      sleeve(g,brass,'stem',0.004,0.022,new THREE.Vector3(0,0,0.024));
      const handle=part(g,box,materials.handle,'handle');handle.scale.set(0.045,0.006,0.012);handle.position.set(0,0.024,0.024);
      const n=vector(p.normal);
      g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(Y,n),Y,n));return g;},
  };

  return{
    materials,
    build(pieces){
      const group=new THREE.Group();group.name='pipes';
      for(const p of pieces){
        const object=builders[p.kind](p);
        object.name=p.kind;object.userData.run=p.run;object.position.set(p.position[0],p.position[1],p.position[2]);group.add(object);
      }
      return group;
    },
    dispose(){for(const g of geometries)g.dispose();for(const m of Object.values(materials))m.dispose();},
  };
}
