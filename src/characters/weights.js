// Pesos de treino em voxel (atualização 24; Prompt Mestre, seção 8): colete, pesos de pulso,
// caneleiras, mochila de carga e placas avançadas, presos às juntas do corpo (acompanham a
// animação). Mais carga = mais peças e metal mais nobre. Só aparecem durante o treino.

import * as THREE from 'three';
import { LOADS } from '../progression/workout.js';

const METALS = ['#5d646c', '#6c737a', '#7d858c', '#8a6a3a', '#a07a3a', '#b8902e', '#c9a227', '#8a5fd1', '#5fc9d1', '#ffd36b'];
const mats = new Map();
const mat = (c, glow = false) => {
  const k = c + glow;
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.45, metalness: 0.55, ...(glow ? { emissive: c, emissiveIntensity: 0.35 } : {}) }));
  return mats.get(k);
};
const geo = new THREE.BoxGeometry(1, 1, 1);

function box(parent, size, pos, color, list, glow = false) {
  const m = new THREE.Mesh(geo, mat(color, glow));
  m.scale.set(...size);
  m.position.set(...pos);
  m.castShadow = true;
  parent.add(m);
  list.push(m);
  return m;
}

// Monta os pesos da carga (kg) no corpo; devolve a lista de peças
export function buildWeights(body, kg) {
  const j = body.joints;
  const tier = Math.max(0, LOADS.findIndex((l) => l.kg === kg));
  const metal = METALS[tier];
  const strap = '#2b2f33';
  const glow = tier >= 7;
  const list = [];
  // pesos de pulso (sempre)
  for (const s of ['E', 'D']) {
    box(j[`antebraco_${s}`], [0.48, 0.16, 0.48], [0, -0.42, 0], metal, list, glow);
    box(j[`antebraco_${s}`], [0.5, 0.05, 0.5], [0, -0.42, 0], strap, list);
  }
  // caneleiras a partir do Aprendiz
  if (tier >= 1) for (const s of ['E', 'D']) {
    box(j[`canela_${s}`], [0.5, 0.2, 0.6], [0, -0.5, 0], metal, list, glow);
    box(j[`canela_${s}`], [0.52, 0.05, 0.62], [0, -0.5, 0], strap, list);
  }
  // colete a partir do Intermediário
  if (tier >= 2) {
    box(j.tronco, [1.32, 0.62, 0.8], [0, 0.42, 0], strap, list);
    for (let k = 0; k < 3; k++) box(j.tronco, [1.0, 0.14, 0.86], [0, 0.22 + k * 0.2, 0], metal, list, glow);
  }
  // mochila de carga a partir do Avançado
  if (tier >= 3) {
    box(j.tronco, [0.86, 0.9, 0.42], [0, 0.52, -0.6], strap, list);
    const plates = Math.min(5, tier - 2);
    for (let k = 0; k < plates; k++) box(j.tronco, [0.96, 0.14, 0.5], [0, 0.18 + k * 0.17, -0.62], metal, list, glow);
  }
  // equipamento avançado: ombreiras de placas a partir do Mestre
  if (tier >= 5) for (const s of ['E', 'D']) box(j[`ombro_${s}`], [0.55, 0.22, 0.7], [s === 'E' ? 0.08 : -0.08, 0.18, 0], metal, list, glow);
  return list;
}

export function removeWeights(list) {
  for (const p of list ?? []) p.removeFromParent();
}
