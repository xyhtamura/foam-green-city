import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export const MODEL_ASSETS={
  phPot:{file:'pot_enamel_01',label:'Enamel pot'},
  phSpoon:{file:'wooden_spoon',label:'Wooden spoon'},
  phCrate:{file:'plastic_crate_01',label:'Worn plastic crate'},
  phBookshelf:{file:'wooden_bookshelf_worn',label:'Worn wooden bookshelf'},
  phDaybed:{file:'vintage_day_bed',label:'Vintage daybed'},
  phChair:{file:'plastic_monobloc_chair_01',label:'Weathered monobloc chair'},
  phApple:{file:'food_apple_01',label:'Apple'},
  phPillows:{file:'throw_pillows_01',label:'Throw pillows'},
  phBananas:{file:'bananas',label:'Bananas'},
  phGinger:{file:'food_ginger_01',label:'Ginger'},
  phSweetPotato:{file:'sweet_potato',label:'Sweet potato'},
  phNotepads:{file:'office_notepads',label:'Notepads'},
  phCrate2:{file:'plastic_crate_02',label:'Plastic storage crate'},
  phRack:{file:'worn_metal_rack',label:'Worn metal rack'},
};

export async function loadModelAssets(curvize=m=>m){
  const loader=new GLTFLoader(),assets={};
  await Promise.all(Object.entries(MODEL_ASSETS).map(async([name,spec])=>{
    const {scene}=await loader.loadAsync(new URL(`./models/polyhaven/${spec.file}.glb`,import.meta.url).href);
    scene.traverse(o=>{if(o.isMesh){
      const source=o.material,map=source.map;
      if(map){map.magFilter=THREE.NearestFilter;map.minFilter=THREE.NearestFilter;}
      o.material=curvize(new THREE.MeshLambertMaterial({map,color:source.color,side:source.side,alphaTest:source.alphaTest}));
      source.dispose();
    }});
    if(name==='phGinger'||name==='phSweetPotato')scene.rotation.x=Math.PI/2;
    if(name==='phGinger')scene.scale.setScalar(0.3);
    const box=new THREE.Box3().setFromObject(scene),center=box.getCenter(new THREE.Vector3());
    scene.position.sub(new THREE.Vector3(center.x,box.min.y,center.z));
    const group=new THREE.Group();group.add(scene);group.name=name;group.userData.importedModel=name;assets[name]=group;
  }));
  return assets;
}
