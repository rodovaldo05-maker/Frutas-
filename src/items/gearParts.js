// Visual do equipamento no corpo do laboratório: capacete ou bandana, peitoral, perneiras,
// botas e amuleto, presos às juntas (cores do item). Trocar o equipamento refaz as peças.

import * as THREE from 'three';
import { ITEMS, equipped } from './items.js';

const mats = new Map();
const mat = (color, glow = false) => {
  const key = color + glow;
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.3, ...(glow ? { emissive: color, emissiveIntensity: 0.6 } : {}) }));
  return mats.get(key);
};

function piece(parent, size, pos, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  m.position.set(...pos);
  m.castShadow = true;
  parent.add(m);
  return m;
}

export function applyGearVisual(body, save, prev = []) {
  for (const p of prev) {
    p.removeFromParent();
    p.geometry.dispose();
  }
  const parts = [];
  const j = body.joints;
  for (const it of equipped(save)) {
    const d = ITEMS[it.id];
    const m = mat(d.cor);
    switch (d.slot) {
      case 'cabeca':
        if (it.id.includes('bandana')) parts.push(piece(j.cabeca, [1.06, 0.14, 1.0], [0, 0.66, 0], m));
        else {
          parts.push(piece(j.cabeca, [1.08, 0.34, 1.02], [0, 0.84, 0], m));
          parts.push(piece(j.cabeca, [1.08, 0.36, 0.12], [0, 0.6, -0.47], m));
        }
        break;
      case 'torso':
        parts.push(piece(j.tronco, [1.3, 0.86, 0.75], [0, 0.56, 0], m));
        parts.push(piece(j.ombro_E, [0.44, 0.2, 0.66], [0, 0.17, 0], m));
        parts.push(piece(j.ombro_D, [0.44, 0.2, 0.66], [0, 0.17, 0], m));
        break;
      case 'pernas':
        for (const s of ['E', 'D']) parts.push(piece(j['coxa_' + s], [0.52, 0.6, 0.63], [0, -0.36, 0], m));
        break;
      case 'botas':
        for (const s of ['E', 'D']) {
          parts.push(piece(j['pe_' + s], [0.54, 0.28, 0.85], [0, -0.12, 0.13], m));
          parts.push(piece(j['canela_' + s], [0.48, 0.24, 0.59], [0, -0.56, 0], m));
        }
        break;
      case 'amuleto':
        parts.push(piece(j.tronco, [0.18, 0.18, 0.06], [0, 0.82, 0.37], mat(d.cor, true)));
        break;
      case 'anel':
        parts.push(piece(j.mao_E, [0.36, 0.08, 0.5], [0, -0.22, 0.02], mat(d.cor, true)));
        break;
      default:
    }
  }
  return parts;
}
