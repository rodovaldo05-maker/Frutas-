// Espada em blocos (estilo voxel do jogo): punho, pomo, guarda e lâmina com fio claro e
// ponta. O cabo fica na origem e a lâmina aponta para +z (para a frente da mão).

import * as THREE from 'three';

const mats = new Map();
const mat = (color, opts = {}) => {
  const key = color + JSON.stringify(opts);
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.35, ...opts }));
  return mats.get(key);
};

export function makeSword(w) {
  const c = w.cores;
  const g = new THREE.Group();
  g.name = `Espada_${w.id}`;
  const box = (sx, sy, sz, x, y, z, m) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m);
    b.position.set(x, y, z);
    b.castShadow = true;
    g.add(b);
    return b;
  };
  // cabo e pomo (atrás da mão)
  box(0.1, 0.1, 0.42, 0, 0, -0.06, mat(c.punho, { metalness: 0, roughness: 0.8 }));
  box(0.14, 0.14, 0.12, 0, 0, -0.32, mat(c.pomo, { metalness: 0.6 }));
  // guarda
  box(0.5, 0.1, 0.12, 0, 0, 0.2, mat(c.guarda, { metalness: 0.5 }));
  box(0.12, 0.16, 0.14, 0, 0, 0.2, mat(c.pomo, { metalness: 0.6 }));
  // lâmina com fio, afinando até a ponta
  const blade = mat(c.lamina, { metalness: 0.75, roughness: 0.25 });
  const edge = mat(c.fio, { metalness: 0.8, roughness: 0.15, emissive: c.fio, emissiveIntensity: 0.12 });
  box(0.16, 0.05, 1.55, 0, 0, 1.04, blade);
  box(0.05, 0.06, 1.5, 0.09, 0, 1.02, edge);
  box(0.12, 0.05, 0.18, 0, 0, 1.9, blade);
  box(0.07, 0.05, 0.14, 0.02, 0, 2.04, edge);
  return g;
}
