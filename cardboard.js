import * as THREE from 'three';

export const CARDBOARD_TYPES=['closedBox','openBox','foldedCarton','flattenedCarton','leaningCarton','boxSeat','boxBed'];
export function createCardboardKit({patchMaterial=m=>m}={}){
  const geometries=new Set(),materials=new Set(),cache=new Map();
  const geo=g=>{geometries.add(g);return g;};const boxGeo=geo(new THREE.BoxGeometry(1,1,1));
  function mat(c){if(!cache.has(c)){const m=patchMaterial(new THREE.MeshLambertMaterial({color:c}));cache.set(c,m);materials.add(m);}return cache.get(c);}
  function box(g,m,x,y,z,w,h,d){const o=new THREE.Mesh(boxGeo,m);o.position.set(x,y,z);o.scale.set(w,h,d);g.add(o);return o;}
  function create(type,{width=.55,depth=.42,height=.45,colour=0xb18b58,seed=1,scale=1,rotation=0,tape=true,labels=true}={}){
    if(!CARDBOARD_TYPES.includes(type))throw new Error('Unknown cardboard type: '+type);
    if(![width,depth,height,scale].every(v=>Number.isFinite(v)&&v>0))throw new Error('Dimensions and scale must be positive');
    let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
    const group=new THREE.Group();group.name='cardboard-'+type;
    const card=mat(colour),edge=mat(0x8f6f45),packing=mat(0xcdb488),paper=mat(0xd7d0b5),ink=mat(0x625643);
    const t=.008;
    function carton(parent,w,d,h,{open=false,y=0,x=0,z=0}={}){
      box(parent,card,x,y+t/2,z,w,t,d);
      for(const s of [-1,1]){box(parent,card,x+s*(w-t)/2,y+h/2,z,t,h,d);box(parent,card,x,y+h/2,z+s*(d-t)/2,w-t*2,h,t);}
      if(open){
        for(const s of [-1,1]){
          const pivot=new THREE.Group();pivot.position.set(x+s*w/2,y+h,z);parent.add(pivot);
          box(pivot,card,s*w*.19,0,0,w*.38,t,d-.012);pivot.rotation.z=s*(.18+random()*.6);
          const end=new THREE.Group();end.position.set(x,y+h,z+s*d/2);parent.add(end);
          box(end,card,0,0,s*d*.19,w-.012,t,d*.38);end.rotation.x=-s*(.12+random()*.7);
        }
      }else{
        box(parent,card,x,y+h-t/2,z,w,t,d);
        box(parent,edge,x,y+h+.0005,z,.003,.001,d);
        if(tape){box(parent,packing,x,y+h+.0015,z,.045,.002,d+.004);box(parent,packing,x,y+h*.7,z-d/2-.002,.045,h*.6,.003);}
      }
      if(labels){
        box(parent,paper,x+w*.18,y+h*.56,z-d/2-.006,w*.29,h*.22,.003);
        for(let i=0;i<3;i++)box(parent,ink,x+w*.18,y+h*(.60-i*.04),z-d/2-.008,w*(.12+random()*.11),.003,.001);
        for(const side of [-1,1]){box(parent,ink,x-w*.27+side*.017,y+h*.26,z-d/2-.006,.005,h*.11,.002);box(parent,ink,x-w*.27+side*.017,y+h*.32,z-d/2-.006,.014,.004,.002);}
      }
    }
    if(type==='closedBox'||type==='openBox')carton(group,width,depth,height,{open:type==='openBox'});
    if(type==='foldedCarton'||type==='flattenedCarton'||type==='leaningCarton'){
      const panel=new THREE.Group();group.add(panel);
      const w=width*1.65,d=depth*1.6;
      box(panel,card,0,t/2,0,w,t,d);
      for(const x of [-w*.25,0,w*.25])box(panel,edge,x,t+.001,0,.003,.002,d);
      for(const s of [-1,1]){
        const flap=box(panel,card,s*w*.40,t*1.5,s*d*.12,w*.2,t,d*.72);
        if(type==='foldedCarton')flap.rotation.y=s*.15;
      }
      if(tape)box(panel,packing,0,t+.003,0,.04,.003,d*.8);
      if(type==='leaningCarton'){
        panel.rotation.x=1.32;panel.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(panel);panel.position.y=-b.min.y;
      }
    }
    if(type==='boxSeat'){
      carton(group,.43,.43,.34);
      carton(group,.43,.15,.38,{y:.34,z:.14});
      // Flattened reinforced seat cap.
      box(group,card,0,.35,-.035,.45,.025,.38);
      group.userData.usableSurface={minX:-.21,maxX:.21,minZ:-.21,maxZ:.04,y:.3625};
    }
    if(type==='boxBed'){
      for(const x of [-.29,.29])for(const z of [-.56,0,.56])carton(group,.56,.54,.22,{x,z});
      box(group,card,0,.234,0,1.14,.025,1.67);
      for(const z of [-.55,0,.55])box(group,packing,0,.248,z,1.13,.002,.045);
      // Low folded cardboard pillow; no cloth assets required.
      box(group,card,0,.285,.59,.68,.075,.32);
      group.userData.usableSurface={minX:-.56,maxX:.56,minZ:-.82,maxZ:.40,y:.249};
    }
    group.scale.setScalar(scale);group.rotation.y=rotation;group.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(group);
    if(b.min.y<0){for(const child of group.children)child.position.y-=b.min.y/scale;group.updateMatrixWorld(true);b.setFromObject(group);}
    group.userData.cardboard={type,width,depth,height,seed,tape,labels};
    group.userData.supportBounds={minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z,height:b.max.y};
    if(group.userData.usableSurface)for(const key of Object.keys(group.userData.usableSurface))group.userData.usableSurface[key]*=scale;
    return group;
  }
  return {create,materials,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
