// User-supplied cutouts remain unchanged; widths are placement sizes in metres.
const folder='2d/raw objects/';
export const RAW_OBJECTS=[
  {id:'rawPitcherPink',file:'2026-10-04 09-41-37.png',aspect:323/271,width:0.23,mode:'table',rooms:['kitchen','sala']},
  {id:'rawPitcherBlue',file:'2026-10-04 09-41-41.png',aspect:329/265,width:0.23,mode:'table',rooms:['kitchen','sala']},
  {id:'rawDrawers',file:'2026-10-04 09-42-05.png',aspect:401/232,width:0.65,mode:'floor',rooms:['sala','bedroom','kitchen','bare']},
  {id:'rawCooler',file:'2026-10-04 09-42-17.png',aspect:355/354,width:0.45,mode:'floor',rooms:['kitchen','sala','bare']},
  {id:'rawPotSilver',file:'2026-10-04 19-06-13.png',aspect:363/522,width:0.34,mode:'table',rooms:['kitchen']},
  {id:'rawPotGlass',file:'2026-10-04 19-06-16.png',aspect:362/590,width:0.34,mode:'table',rooms:['kitchen']},
  {id:'rawPotLid',file:'2026-10-04 19-06-20.png',aspect:268/426,width:0.34,mode:'table',rooms:['kitchen']},
  {id:'rawIntermediatePad',file:'2026-10-04 19-08-24.png',aspect:896/1018,width:0.22,mode:'flat',rooms:['sala','bedroom']},
  {id:'rawPadCover',file:'2026-10-04 19-08-24_cover.png',aspect:888/777,width:0.18,mode:'flat',rooms:['sala','bedroom']},
  {id:'rawFryingPan',file:'Cooks-Standard-Frying-Pan-Stainless-Steel-8-Inch-Multi-Ply-Clad-wok-Stir-Fry-Pan-Kitchen-Skillet-Silver_d70b72ff-dbcf-4296-9978-997ca9781c1e.592279a47e22eee94477ec4fffe14963.png',aspect:1375/1455,width:0.4,mode:'table',rooms:['kitchen']},
  {id:'rawYellowPad',file:'yellowpad.png',aspect:770/595,width:0.18,mode:'flat',rooms:['sala','bedroom']},
].map(p=>({...p,file:folder+p.file}));

export function createRawObject({THREE,asset,material}={}){
  const height=asset.width*asset.aspect;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(asset.width,height,4,4),material);
  mesh.name=asset.id;mesh.userData.rawObject=asset.id;mesh.userData.own=true;
  if(asset.mode==='flat'){
    mesh.rotation.x=-Math.PI/2;mesh.position.y=0.008;
  }else{
    mesh.position.y=height/2;mesh.userData.billboard=true;
  }
  mesh.userData.floorProp=asset.mode==='floor';
  return mesh;
}
