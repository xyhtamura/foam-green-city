// Image anchors: sag ends are at the top; straight ends are at half-height.
export function wireRunPlan({span=1.8,anchorY=2.1,seed=0}={}){
  const patterns=[['line','sag','line'],['sag','sag'],['line','line','sag'],['sag','line','sag']];
  const pattern=patterns[((seed%patterns.length)+patterns.length)%patterns.length];
  const width=span/pattern.length;
  return pattern.map((kind,i)=>{
    const height=kind==='sag'?0.22+(seed%3)*0.04:0.18;
    return {kind,file:kind==='sag'?'wiresag.png':'wireline.png',width,height,
      x:(i+0.5)*width-span/2,y:anchorY-(kind==='sag'?height/2:0),
      left:[i*width-span/2,anchorY],right:[(i+1)*width-span/2,anchorY]};
  });
}

export function createWireRun({THREE,materials,span,anchorY,seed}={}){
  const group=new THREE.Group();group.userData.wireRun=true;
  const plan=wireRunPlan({span,anchorY,seed});group.userData.plan=plan;
  for(const p of plan){
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(p.width,p.height,4,1),materials[p.kind]);
    mesh.position.set(p.x,p.y,0);mesh.userData.own=true;group.add(mesh);
  }
  return group;
}
