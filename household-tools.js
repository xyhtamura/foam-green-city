import * as THREE from 'three';

export const TOOL_TYPES=['flipFlop','paintBrush','paintRoller','rollerTray'];
export function createHouseholdToolKit({patchMaterial=m=>m}={}){
  const geometries=new Set(),materials=new Set(),cache=new Map();
  const geo=g=>{geometries.add(g);return g;};
  const boxGeo=geo(new THREE.BoxGeometry(1,1,1));
  const cylinder=geo(new THREE.CylinderGeometry(1,1,1,12));
  function mat(colour){if(!cache.has(colour)){const m=patchMaterial(new THREE.MeshLambertMaterial({color:colour}));cache.set(colour,m);materials.add(m);}return cache.get(colour);}
  function box(parent,m,x,y,z,w,h,d){const o=new THREE.Mesh(boxGeo,m);o.position.set(x,y,z);o.scale.set(w,h,d);parent.add(o);return o;}
  function rod(parent,m,a,b,r=.004){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const o=new THREE.Mesh(cylinder,m);o.position.copy(start.add(end).multiplyScalar(.5));o.scale.set(r,delta.length(),r);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());parent.add(o);return o;}
  function create(type,{colour=0x608ca4,accent=0xddd5b9,scale=1,foot='right',rotation=0,paintColour=null}={}){
    if(!TOOL_TYPES.includes(type))throw new Error('Unknown household tool: '+type);
    if(!(scale>0&&Number.isFinite(scale)))throw new Error('Scale must be positive and finite');
    if(!['left','right'].includes(foot))throw new Error('Foot must be left or right');
    const group=new THREE.Group();group.name='household-'+type;
    const body=mat(colour),light=mat(accent),metal=mat(0x9da8a9),wood=mat(0xa28058);
    if(type==='flipFlop'){
      const shape=new THREE.Shape();
      const side=foot==='right'?1:-1;
      shape.moveTo(0,.135);shape.bezierCurveTo(.061,.135,.069,.083,.051,.025);shape.bezierCurveTo(.04,-.025,.049,-.103,.025,-.132);shape.bezierCurveTo(0,-.153,-.044,-.13,-.04,-.093);shape.bezierCurveTo(-.047,-.045,-.06,.049,-.052,.091);shape.bezierCurveTo(-.047,.12,-.02,.135,0,.135);
      const g=geo(new THREE.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:false,curveSegments:6}));g.rotateX(-Math.PI/2);
      if(side<0){g.scale(-1,1,1);const p=g.attributes.position;
        for(let i=0;i<p.count;i+=3)for(let k=0;k<3;k++){const a=p.array[(i+1)*3+k];p.array[(i+1)*3+k]=p.array[(i+2)*3+k];p.array[(i+2)*3+k]=a;}g.computeVertexNormals();
      }
      group.add(new THREE.Mesh(g,body));
      // Broad V-shaped straps run from a toe post to either side of the sole.
      const front=-.058,back=.035;
      rod(group,light,[side*.006,.012,front],[side*.006,.043,front],.004);
      for(const s of [-1,1]){
        const path=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.006,.043,front),new THREE.Vector3(s*.023,.047,-.02),new THREE.Vector3(s*.043,.017,back)]);
        const strap=geo(new THREE.TubeGeometry(path,8,.009,5,false));group.add(new THREE.Mesh(strap,light));
      }
    }
    if(type==='paintBrush'){
      box(group,wood,0,.012,.048,.027,.024,.13);
      box(group,metal,0,.014,-.03,.06,.025,.037);
      for(let i=0;i<9;i++)box(group,light,(i-4)*.006,.013,-.07-(i%3)*.002,.006,.022,.048);
      if(paintColour!==null)box(group,mat(paintColour),0,.013,-.093,.056,.024,.013);
    }
    if(type==='paintRoller'){
      box(group,body,0,.015,.105,.032,.03,.13);
      rod(group,metal,[0,.023,.04],[0,.041,-.04]);
      rod(group,metal,[0,.041,-.04],[-.085,.041,-.04]);
      rod(group,metal,[-.085,.041,-.04],[-.085,.041,-.09]);
      rod(group,metal,[-.085,.041,-.09],[.075,.041,-.09]);
      rod(group,paintColour===null?light:mat(paintColour),[-.073,.041,-.09],[.073,.041,-.09],.034);
    }
    if(type==='rollerTray'){
      const w=.27,d=.38,t=.007;
      box(group,body,0,t/2,0,w,t,d);
      for(const s of [-1,1]){box(group,body,s*(w-t)/2,.03,0,t,.06,d);box(group,body,0,.03,s*(d-t)/2,w-t*2,.06,t);}
      // Sloping ridged loading ramp and a deeper paint reservoir.
      const ramp=box(group,body,0,.025,.052,w-.02,.01,.21);ramp.rotation.x=-.15;
      for(let i=0;i<8;i++)box(group,light,0,.047-i*.00375,.145-i*.025,w-.033,.004,.006);
      if(paintColour!==null)box(group,mat(paintColour),0,.012,-.125,w-.025,.006,.105);
    }
    group.scale.setScalar(scale);group.rotation.y=rotation;group.updateMatrixWorld(true);
    const b=new THREE.Box3().setFromObject(group);
    // Raise the resting tool if a round roller or strap falls below the plane.
    if(b.min.y<0){for(const child of group.children)child.position.y-=b.min.y/scale;group.updateMatrixWorld(true);b.setFromObject(group);}
    group.userData.householdTool={type,foot,colour,scale};
    group.userData.supportBounds={minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z,height:b.max.y};return group;
  }
  function pair({colour=0x608ca4,accent=0xddd5b9,scale=1,scattered=false}={}){
    const group=new THREE.Group();group.name='tsinelas-pair';
    for(const [i,foot] of ['left','right'].entries()){const o=create('flipFlop',{foot,colour,accent,scale,rotation:scattered?(i?-.25:.38):0});o.position.set((i-.5)*.13*scale,0,scattered?(i?-.05:.03)*scale:0);group.add(o);}
    group.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(group);group.userData.supportBounds={minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z,height:b.max.y};return group;
  }
  return {create,pair,materials,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
