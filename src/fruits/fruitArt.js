// Frutas do laboratório (FRUTOModels.fruit, com rosto) em 3D e miniaturas para a interface.

import * as THREE from 'three';
import { FRUTOModels } from '../characters/fruto-models.js';

export function makeFruit(index, profile = 0) {
  return FRUTOModels.fruit(THREE, index, profile);
}

let cache = null;

// Miniaturas das 16 frutas (PNG em data URL), feitas uma vez com o renderizador do jogo
export function fruitThumbs(renderer, fruits, size = 128) {
  if (cache) return cache;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#fff7ea', '#4a3a6a', 1.7));
  const key = new THREE.DirectionalLight('#fff1dc', 2.2);
  key.position.set(2, 4, 5);
  scene.add(key);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
  const target = new THREE.WebGLRenderTarget(size, size);
  target.texture.colorSpace = THREE.SRGBColorSpace;
  const prevTarget = renderer.getRenderTarget();
  const prevClear = renderer.getClearColor(new THREE.Color());
  const prevAlpha = renderer.getClearAlpha();
  const pixels = new Uint8Array(size * size * 4);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const box = new THREE.Box3();
  const center = new THREE.Vector3();
  const dims = new THREE.Vector3();
  cache = fruits.map((_, i) => {
    const fruit = makeFruit(i);
    fruit.rotation.y = -0.35;
    scene.add(fruit);
    box.setFromObject(fruit);
    box.getCenter(center);
    box.getSize(dims);
    const r = Math.max(dims.x, dims.y, dims.z) * 0.62;
    const dist = r / Math.tan((cam.fov * Math.PI) / 360) * 1.15;
    cam.position.set(center.x + dist * 0.18, center.y + dist * 0.12, center.z + dist);
    cam.lookAt(center);
    renderer.setRenderTarget(target);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, cam);
    renderer.readRenderTargetPixels(target, 0, 0, size, size, pixels);
    scene.remove(fruit);
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) img.data.set(pixels.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4);
    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL('image/png');
  });
  renderer.setRenderTarget(prevTarget);
  renderer.setClearColor(prevClear, prevAlpha);
  target.dispose();
  return cache;
}
