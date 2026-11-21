// Retrato do personagem para o HUD: renderiza a cabeça do próprio modelo 3D uma vez
// numa textura e devolve a imagem (PNG em data URL).

import * as THREE from 'three';
import { createPlayer } from '../characters/player.js';

export function renderPortrait(renderer, data, size = 192) {
  const scene = new THREE.Scene();
  const player = createPlayer(scene, data);
  player.blob.visible = false;
  player.setGlider(0);
  player.face.update(1, { expression: 'feliz', look: { x: -0.25, y: 0.1 } });
  player.body.root.rotation.y = 0.35;
  scene.add(new THREE.HemisphereLight('#fff7ea', '#4a3a6a', 1.6));
  const key = new THREE.DirectionalLight('#fff1dc', 2.4);
  key.position.set(2, 5, 4);
  scene.add(key);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  cam.position.set(0.25, 3.75, 3.3);
  cam.lookAt(0.05, 3.62, 0);

  const target = new THREE.WebGLRenderTarget(size, size);
  target.texture.colorSpace = THREE.SRGBColorSpace;
  const prevTarget = renderer.getRenderTarget();
  const prevClear = renderer.getClearColor(new THREE.Color());
  const prevAlpha = renderer.getClearAlpha();
  renderer.setRenderTarget(target);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  renderer.render(scene, cam);
  const pixels = new Uint8Array(size * size * 4);
  renderer.readRenderTargetPixels(target, 0, 0, size, size, pixels);
  renderer.setRenderTarget(prevTarget);
  renderer.setClearColor(prevClear, prevAlpha);
  target.dispose();

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  // as linhas vêm de baixo para cima
  for (let y = 0; y < size; y++) img.data.set(pixels.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4);
  ctx.putImageData(img, 0, 0);
  scene.traverse((o) => {
    if (o.material && !Array.isArray(o.material)) o.material.dispose?.();
  });
  return canvas.toDataURL('image/png');
}
