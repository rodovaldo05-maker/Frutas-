// Forma híbrida da Besta (versão 0.27.7): o corpo do personagem continua o mesmo, no mesmo
// tamanho, com as mesmas animações; a forma só acrescenta os dois chifres rubros na cabeça e a
// cauda (pelagem branca com tufo carmesim) presa à cintura. A cauda balança parada, segue a
// corrida, estala no Golpe de Cauda do M1 e sobe no rugido e no pisão.

import * as THREE from 'three';
import { M1 } from '../combat/m1Catalog.js';

const COLORS = { fur: '#f4efe6', shade: '#d8cfc2', crimson: '#d91b34', dark: '#822a3e', ivory: '#fff1dc', ember: '#ff6b72' };
const mats = new Map();
const mat = (c, glow = 0) => {
  const k = c + glow;
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.15, ...(glow ? { emissive: c, emissiveIntensity: glow } : {}) }));
  return mats.get(k);
};
const box = new THREE.BoxGeometry(1, 1, 1);
function block(parent, size, pos, color, rot = null, glow = 0) {
  const m = new THREE.Mesh(box, mat(color, glow));
  m.scale.set(...size);
  m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  m.castShadow = true;
  parent.add(m);
  return m;
}
const sm = (x) => {
  const u = Math.max(0, Math.min(1, x));
  return u * u * (3 - 2 * u);
};
const env = (t, at, before, after) => sm(t < at ? (t - at + before) / before : (at + after - t) / after);

// caixa do pedaço do corpo no espaço da junta (para encaixar chifres e cauda no tamanho certo)
function bounds(joint) {
  const b = new THREE.Box3();
  for (const c of joint.children) {
    if (!c.isMesh || !c.geometry) continue;
    c.geometry.computeBoundingBox();
    const g = c.geometry.boundingBox.clone();
    c.updateMatrix();
    g.applyMatrix4(c.matrix);
    b.union(g);
  }
  return b.isEmpty() ? new THREE.Box3(new THREE.Vector3(-0.4, 0, -0.4), new THREE.Vector3(0.4, 0.8, 0.4)) : b;
}

export function buildBeastTraits(body) {
  const j = body.joints;
  const root = new THREE.Group();
  root.name = 'besta_hibrida_tracos';
  root.userData.formKeep = true;
  // ===== chifres: saem da testa, curvam para fora, para trás e para cima; pontas de marfim =====
  const hb = bounds(j.cabeca);
  const w = hb.max.x - hb.min.x;
  const horns = [];
  for (const side of [1, -1]) {
    const base = new THREE.Group();
    // saem das têmporas, abrem para fora e curvam para cima (bem visíveis acima do cabelo)
    base.position.set(side * w * 0.44, hb.max.y - 0.2, hb.min.z + (hb.max.z - hb.min.z) * 0.58);
    base.rotation.set(-0.2, 0, -side * 1.05);
    j.cabeca.add(base);
    let at = base;
    const segs = [[0.28, 0.3, COLORS.dark], [0.24, 0.3, COLORS.crimson], [0.19, 0.3, COLORS.crimson], [0.14, 0.26, COLORS.ember], [0.09, 0.22, COLORS.ivory]];
    segs.forEach(([s, h, c], i) => {
      const g = new THREE.Group();
      g.position.y = i === 0 ? 0 : segs[i - 1][1];
      g.rotation.set(i ? -0.18 : 0, 0, i ? side * 0.32 : 0);
      at.add(g);
      block(g, [s, h + 0.02, s], [0, h / 2, 0], c, null, c === COLORS.ember ? 0.25 : 0);
      at = g;
    });
    horns.push(base);
  }
  // pequena juba branca na nuca, sem mudar o tamanho da cabeça
  const mane = block(j.cabeca, [w * 0.7, 0.16, 0.18], [0, hb.max.y - 0.22, hb.min.z - 0.05], COLORS.fur);
  // ===== cauda: três elos de pelagem branca e um tufo carmesim que brilha um pouco =====
  const cb = bounds(j.cintura);
  const tail = [];
  let at = new THREE.Group();
  at.position.set(0, (cb.min.y + cb.max.y) * 0.5 - 0.05, cb.min.z + 0.02);
  at.rotation.x = -1.8; // aponta para trás, um pouco para baixo
  j.cintura.add(at);
  tail.push(at);
  const links = [[0.26, 0.46, COLORS.fur], [0.22, 0.42, COLORS.shade], [0.18, 0.38, COLORS.fur]];
  links.forEach(([s, len, c], i) => {
    block(at, [s, len, s], [0, len / 2, 0], c);
    if (i === 1) block(at, [s * 1.05, 0.08, s * 1.05], [0, len * 0.7, 0], COLORS.crimson); // anel carmesim
    const next = new THREE.Group();
    next.position.y = len;
    next.rotation.x = 0.42; // cada elo curva um pouco para cima
    at.add(next);
    tail.push(next);
    at = next;
  });
  // tufo: chama de pelos carmesim e marfim
  block(at, [0.32, 0.34, 0.32], [0, 0.14, 0], COLORS.crimson, null, 0.2);
  block(at, [0.22, 0.26, 0.22], [0, 0.38, 0], COLORS.ember, [0.2, 0.4, 0], 0.35);
  block(at, [0.11, 0.16, 0.11], [0, 0.56, 0], COLORS.ivory);
  const rest = tail.map((g) => g.rotation.clone());
  return {
    light: true, root, horns, tail, species: 'besta', shape: 'hibrida',
    // ctx: { dt, clock, speed (0..1), action: { clip, t } }
    update(ctx) {
      const t = ctx.clock;
      const run = Math.min(1, ctx.speed ?? 0);
      tail.forEach((g, i) => {
        g.rotation.copy(rest[i]);
        g.rotation.y += (0.18 + 0.2 * run) * Math.sin(t * (2.4 + 5 * run) - i * 0.7);
        g.rotation.x += (i ? 0.06 : 0) * Math.sin(t * 1.7 - i) - 0.25 * run * (i === 0 ? 1 : 0);
      });
      const a = ctx.action;
      if (!a?.clip) return;
      const m1 = /^besta_m1_(\d)/.exec(a.clip);
      if (m1) {
        const rec = M1[`besta_m1_${m1[1]}`];
        const rel = rec.impacto / 60;
        const dur = rec.quadros / 60;
        if (rec.tipo === 'tail') {
          // chicote da base para a ponta, cada elo um pouco depois
          const sign = rec.lado === 'E' ? 1 : -1;
          tail.forEach((g, i) => {
            const wind = env(a.t - i * 0.025, rel * 0.55, rel * 0.55, rel * 0.5);
            const crack = env(a.t - i * 0.025, rel, rel * 0.45, (dur - rel) * 0.6);
            g.rotation.y += sign * (0.7 * wind - (1.1 + 0.25 * i) * crack);
            g.rotation.x -= 0.3 * crack;
          });
        } else {
          // os outros golpes: a cauda acompanha o tranco do corpo
          const hit = env(a.t, rel, rel * 0.6, (dur - rel) * 0.6);
          tail.forEach((g, i) => (g.rotation.x += 0.25 * hit * (i + 1) * 0.5));
        }
        return;
      }
      if (a.clip === 'besta_rugido' || a.clip === 'besta_pisao') {
        // rugido e pisão: a cauda sobe e fica tensa
        const rise = env(a.t, 0.4, 0.3, 0.5);
        tail.forEach((g, i) => (g.rotation.x += (i === 0 ? 0.9 : 0.25) * rise));
      }
    },
    dispose() {
      for (const h of horns) h.removeFromParent();
      tail[0].removeFromParent();
      mane.removeFromParent();
      root.removeFromParent();
    },
  };
}
