import * as THREE from 'three';
import {CURTAIN_TEXTURES} from './wall-assets.js?v=536dc7bb8e';

export function loadCurtainPatterns(){
  const loader=new THREE.TextureLoader();
  return CURTAIN_TEXTURES.map(({file})=>{
    const texture=loader.load(encodeURI(file));
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.repeat.set(2,3);
    texture.magFilter=texture.minFilter=THREE.NearestFilter;
    return texture;
  });
}
