// Personagem jogável: corpo base do laboratório (FRUTOModels) com roupa base, rosto,
// planador dobrável nas costas e sombra simples para o perfil Leve (sem sombras reais).

import * as THREE from 'three';
import { FRUTOModels } from './fruto-models.js';
import { Face } from './face.js';

export const BASE_LOOK = {
  skin: '#e2b48e',
  hair: '#3a2a22',
  shirt: '#3f7fb4',
  shorts: '#2f3b45',
  shoes: '#ece6d8',
};

const SEGMENT_PART = {
  cabeca: 'skin',
  tronco: 'shirt',
  ombro_E: 'shirt', ombro_D: 'shirt',
  braco_E: 'shirt', braco_D: 'shirt',
  antebraco_E: 'skin', antebraco_D: 'skin',
  mao_E: 'skin', mao_D: 'skin',
  cintura: 'shorts',
  coxa_E: 'shorts', coxa_D: 'shorts',
  canela_E: 'skin', canela_D: 'skin',
  pe_E: 'shoes', pe_D: 'shoes',
};

export function createPlayer(scene, data, { profile = 0, look = BASE_LOOK } = {}) {
  const body = FRUTOModels.body(THREE, data, '#ffffff', 1, profile);
  body.root.name = 'Jogador';
  for (const [id, mesh] of Object.entries(body.meshes)) {
    mesh.material.color.set(look[SEGMENT_PART[id] || 'skin']);
  }
  const face = new Face(body.joints.cabeca, { hair: look.hair, skin: look.skin });

  // Planador: duas asas finas que abrem das costas
  const glider = new THREE.Group();
  glider.name = 'Planador';
  const wingMat = new THREE.MeshStandardMaterial({ color: '#ff9b79', roughness: 0.6, side: THREE.DoubleSide });
  const ribMat = new THREE.MeshStandardMaterial({ color: '#2a3133', roughness: 0.7 });
  const wings = [];
  for (const side of [1, -1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.15, 0, 0);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 1.05), wingMat);
    wing.position.set(side * 0.95, 0, -0.05);
    const rib = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.08, 0.09), ribMat);
    rib.position.set(side * 0.95, 0.03, 0.46);
    wing.castShadow = true;
    pivot.add(wing, rib);
    glider.add(pivot);
    wings.push({ pivot, side });
  }
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.62, 0.22), ribMat);
  glider.add(pack);
  glider.position.set(0, 0.6, -0.42);
  body.joints.tronco.add(glider);

  // Sombra simples
  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 20).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }),
  );
  blob.renderOrder = 1;
  scene.add(blob);

  scene.add(body.root);
  return {
    body,
    face,
    glider: { group: glider, wings, open: 0 },
    blob,
    setGlider(open) {
      this.glider.open = open;
      for (const { pivot, side } of wings) {
        pivot.rotation.z = side * (1 - open) * 1.45;
        pivot.scale.setScalar(0.25 + 0.75 * open);
      }
      pack.visible = true;
    },
  };
}
