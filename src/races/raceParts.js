// Partes visuais das raças presas às juntas do corpo do laboratório (estilo voxel):
// Aquático: nadadeira nas costas, nos antebraços e na cabeça, e brânquias no pescoço;
// Ghoul: marcas de energia que brilham nos antebraços, no rosto e na testa;
// Homem do Céu: asas pequenas de penas nas costas (batem nos saltos extras).
// O Humano não tem apêndices. Nada muda a cor da pele.

import * as THREE from 'three';

const mat = (color, emissive = null) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, ...(emissive ? { emissive, emissiveIntensity: 1.1 } : {}) });

function box(parent, size, pos, rot, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  m.castShadow = true;
  parent.add(m);
  return m;
}

export function addRaceParts(body, raceId) {
  const j = body.joints;
  const parts = [];
  const add = (m) => (parts.push(m), m);
  const out = { parts, wings: null };
  if (raceId === 'aquatico') {
    const fin = mat('#2fbcb4');
    const edge = mat('#8ff0e4');
    const dark = mat('#1d7c78');
    add(box(j.tronco, [0.08, 0.5, 0.34], [0, 0.66, -0.47], [-0.35, 0, 0], fin));
    add(box(j.tronco, [0.06, 0.2, 0.22], [0, 0.98, -0.5], [-0.6, 0, 0], edge));
    for (const [arm, sx] of [["antebraco_E", 1], ["antebraco_D", -1]]) {
      add(box(j[arm], [0.05, 0.42, 0.26], [sx * 0.2, -0.3, -0.2], [0.35, 0, 0], fin));
    }
    for (const s of [-1, 1]) {
      add(box(j.cabeca, [0.05, 0.3, 0.34], [s * 0.52, 0.52, -0.12], [0.3, 0, 0], fin));
      for (let k = 0; k < 3; k++) add(box(j.cabeca, [0.03, 0.05, 0.24], [s * 0.505, 0.1 + k * 0.08, 0.05], null, dark));
    }
  } else if (raceId === 'ghoul') {
    const glow = mat('#d9a8ff', '#a64dff');
    for (const [arm, sx] of [["antebraco_E", 1], ["antebraco_D", -1]]) {
      add(box(j[arm], [0.03, 0.42, 0.06], [sx * 0.185, -0.3, 0.1], null, glow));
      add(box(j[arm], [0.03, 0.3, 0.06], [sx * 0.185, -0.26, -0.08], null, glow));
    }
    for (const s of [-1, 1]) add(box(j.cabeca, [0.2, 0.035, 0.03], [s * 0.24, 0.3, 0.475], [0, 0, s * 0.25], glow));
    add(box(j.cabeca, [0.05, 0.2, 0.03], [0, 0.78, 0.475], null, glow));
    add(box(j.tronco, [0.04, 0.5, 0.03], [0, 0.55, 0.34], null, glow));
  } else if (raceId === 'ceu') {
    const white = mat('#f6f2ea');
    const tip = mat('#cfe4ff');
    const wings = [];
    for (const s of [-1, 1]) {
      const w = new THREE.Group();
      w.position.set(s * 0.3, 0.8, -0.36);
      w.rotation.set(0, s * 0.55, 0);
      w.scale.setScalar(1.35);
      const fan = new THREE.Group();
      w.add(fan);
      box(fan, [1.05, 0.22, 0.07], [s * 0.52, 0.18, 0], [0, 0, s * 0.55], white);
      box(fan, [0.95, 0.2, 0.07], [s * 0.5, -0.02, -0.02], [0, 0, s * 0.18], white);
      box(fan, [0.75, 0.18, 0.07], [s * 0.42, -0.2, -0.04], [0, 0, s * -0.18], white);
      box(fan, [0.3, 0.2, 0.08], [s * 0.98, 0.45, 0.01], [0, 0, s * 0.55], tip);
      j.tronco.add(w);
      add(w);
      wings.push({ group: fan, side: s });
    }
    out.wings = wings;
  }
  return out;
}

export function removeRaceParts(info) {
  for (const p of info?.parts || []) p.removeFromParent();
}

// Asas batendo: abertura 0..1 (sobe nos saltos extras e volta devagar)
export function flapWings(info, t, burst) {
  if (!info?.wings) return;
  for (const { group, side } of info.wings) group.rotation.z = side * (Math.sin(t * 6) * 0.05 + burst * 0.9 * Math.sin(Math.min(1, burst) * Math.PI));
}
