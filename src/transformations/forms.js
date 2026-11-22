// Formas híbridas das frutas de fera (atualização 13; docs 04 e 08): Lobo, Falcão, Besta,
// Fênix, Dragão Oriental e Dragão Ocidental. A forma híbrida prende partes em blocos às juntas
// do corpo (orelhas, focinho, garras, cauda, asas, chifres, juba) e muda os números do
// personagem; não gasta energia. Libera no domínio 20 da fruta; tecla H ou botão Forma.
// Transformar leva 0,6 s, com invulnerabilidade. As formas completas (quadrúpedes, aves e
// dragões com controladores próprios) ficam para depois.

import * as THREE from 'three';

export const FORM_UNLOCK = 20;
export const FORM_TIME = 0.6;

// speed: velocidade no chão; melee/fruit: dano; mitigation: dano físico recebido; extraJumps
// e glide: voo das formas aladas (bater as asas = saltos extras); regen: vida por segundo
export const FORMS = {
  lobo: { nome: 'Lobo Híbrido', speed: 1.2, melee: 1.15, fruit: 1.15, desc: '+20% de velocidade, +15% de dano corpo a corpo e da fruta' },
  besta: { nome: 'Besta Híbrida', speed: 0.95, melee: 1.25, fruit: 1.15, mitigation: 0.1, desc: '+25% de dano corpo a corpo, −10% de dano físico recebido, um pouco mais lenta' },
  falcao: { nome: 'Falcão Híbrido', fruit: 1.15, extraJumps: 2, glide: 1.3, fall: 0.5, desc: 'Asas: +2 batidas no ar, plana 30% mais rápido, metade do dano de queda' },
  fenix: { nome: 'Fênix Híbrida', fruit: 1.25, extraJumps: 2, glide: 1.2, regen: 2, desc: 'Asas de fogo azul: +2 batidas no ar, recupera 2 de vida por segundo' },
  oriental: { nome: 'Dragão Oriental Híbrido', fruit: 1.25, extraJumps: 2, glide: 1.25, desc: 'Juba e chifres: +2 batidas no ar, +25% de dano da fruta' },
  ocidental: { nome: 'Dragão Ocidental Híbrido', fruit: 1.25, extraJumps: 2, glide: 1.2, mitigation: 0.05, desc: 'Asas de dragão: +2 batidas no ar, −5% de dano físico recebido' },
};
export const FORM_IDS = Object.keys(FORMS);
export const hasForm = (fruitId) => !!FORMS[fruitId];

const NEUTRAL = { speed: 1, melee: 1, fruit: 1, mitigation: 0, extraJumps: 0, glide: 1, fall: 1, regen: 0 };
export const formMods = (formId) => ({ ...NEUTRAL, ...(FORMS[formId] ?? {}) });

// Pode transformar agora? (motivo ou null)
export function formBlock(fruitId, domainLevel) {
  if (!hasForm(fruitId)) return 'Só frutas de fera (Lobo, Falcão, Besta, Fênix e Dragões) têm forma híbrida.';
  if (domainLevel < FORM_UNLOCK) return `Forma híbrida: domínio ${FORM_UNLOCK} da fruta.`;
  return null;
}

// ===== Partes visuais =====
const mat = (color, emissive = null) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05, ...(emissive ? { emissive, emissiveIntensity: 1.2 } : {}) });

function box(parent, size, pos, rot, material, list) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  m.castShadow = true;
  parent.add(m);
  list.push(m);
  return m;
}

function claws(j, color, list) {
  for (const side of ['E', 'D']) {
    for (let k = 0; k < 3; k++) box(j['mao_' + side], [0.06, 0.2, 0.06], [(k - 1) * 0.1, -0.42, 0.12], [0.5, 0, 0], color, list);
  }
}

function tail(j, color, segments, size, list, curl = 0.25) {
  let parent = j.cintura;
  let pos = [0, 0.1, -0.42];
  const segs = [];
  for (let i = 0; i < segments; i++) {
    const g = new THREE.Group();
    g.position.set(...pos);
    g.rotation.x = i === 0 ? 0.9 : curl;
    parent.add(g);
    list.push(g);
    const s = size * (1 - i * 0.12);
    box(g, [s, s, 0.5], [0, 0, -0.25], null, color, list);
    segs.push(g);
    parent = g;
    pos = [0, 0, -0.48];
  }
  return segs;
}

function wings(j, membrane, edge, list, span = 1.6) {
  const out = [];
  for (const s of [-1, 1]) {
    const w = new THREE.Group();
    w.position.set(s * 0.3, 0.85, -0.38);
    w.rotation.set(0, s * 0.5, 0);
    const fan = new THREE.Group();
    w.add(fan);
    box(fan, [span, 0.28, 0.06], [s * span * 0.5, 0.22, 0], [0, 0, s * 0.5], membrane, list);
    box(fan, [span * 0.9, 0.26, 0.06], [s * span * 0.45, -0.04, -0.02], [0, 0, s * 0.15], membrane, list);
    box(fan, [span * 0.7, 0.24, 0.06], [s * span * 0.36, -0.28, -0.04], [0, 0, s * -0.2], membrane, list);
    box(fan, [0.12, 0.12, span * 0.2], [s * span * 0.95, 0.55, 0], [0, 0, s * 0.5], edge, list);
    j.tronco.add(w);
    list.push(w);
    out.push({ group: fan, side: s });
  }
  return out;
}

export function addFormParts(body, formId, color = '#ffffff') {
  const j = body.joints;
  const list = [];
  const out = { parts: list, wings: null, tail: null, glow: null };
  switch (formId) {
    case 'lobo': {
      const fur = mat('#8a8f98');
      const dark = mat('#4a4e56');
      for (const s of [-1, 1]) box(j.cabeca, [0.24, 0.42, 0.14], [s * 0.32, 1.22, -0.02], [0, 0, s * -0.2], fur, list); // orelhas acima do cabelo
      box(j.cabeca, [0.42, 0.28, 0.32], [0, 0.32, 0.6], null, fur, list); // focinho
      box(j.cabeca, [0.14, 0.1, 0.08], [0, 0.42, 0.78], null, dark, list); // nariz
      for (const s of [-1, 1]) box(j.tronco, [0.5, 0.35, 0.6], [s * 0.55, 1.05, 0], null, fur, list); // pelagem nos ombros
      claws(j, mat('#f2efe6'), list);
      out.tail = tail(j, fur, 3, 0.3, list, 0.35);
      break;
    }
    case 'besta': {
      const horn = mat('#e8dcc0');
      const fur = mat('#6a4a2a');
      for (const s of [-1, 1]) {
        box(j.cabeca, [0.16, 0.5, 0.16], [s * 0.42, 1.0, 0.05], [0, 0, s * -0.6], horn, list);
        box(j.cabeca, [0.12, 0.3, 0.12], [s * 0.66, 1.3, 0.05], [0, 0, s * -0.2], horn, list);
        box(j.tronco, [0.6, 0.45, 0.7], [s * 0.6, 1.0, 0], null, fur, list);
        box(j.tronco, [0.1, 0.35, 0.1], [s * 0.6, 1.35, 0], null, horn, list);
      }
      claws(j, horn, list);
      out.tail = tail(j, fur, 3, 0.38, list, 0.15);
      break;
    }
    case 'falcao': {
      const feather = mat('#8a6440');
      const light = mat('#e8d8b8');
      out.wings = wings(j, feather, light, list, 1.8);
      box(j.cabeca, [0.2, 0.14, 0.26], [0, 0.4, 0.6], [0.3, 0, 0], mat('#e8b830'), list); // bico
      for (let k = -1; k <= 1; k++) box(j.cintura, [0.18, 0.05, 0.6], [k * 0.16, 0.05, -0.55], [0.4, k * 0.25, 0], feather, list);
      break;
    }
    case 'fenix': {
      const fire = mat('#7fd0ff', '#2a7cff');
      const core = mat('#d0f0ff', '#58b0ff');
      out.wings = wings(j, fire, core, list, 1.8);
      for (let k = -1; k <= 1; k++) box(j.cabeca, [0.08, 0.36, 0.08], [k * 0.12, 1.08, -0.1 - Math.abs(k) * 0.05], [-0.3, 0, k * 0.3], fire, list); // crista
      for (let k = -2; k <= 2; k++) box(j.cintura, [0.12, 0.05, 0.9], [k * 0.12, 0.05, -0.7], [0.3, k * 0.18, 0], fire, list);
      out.glow = color;
      break;
    }
    case 'oriental': {
      const mane = mat('#e8c040');
      const scale = mat('#3fa860');
      for (let k = 0; k < 5; k++) box(j.cabeca, [0.7, 0.18, 0.14], [0, 0.95 - k * 0.18, -0.5], [0.2, 0, 0], mane, list); // juba
      for (const s of [-1, 1]) {
        box(j.cabeca, [0.08, 0.5, 0.08], [s * 0.3, 1.15, -0.1], [-0.4, 0, s * -0.3], mat('#e8dcc0'), list); // galhos
        box(j.cabeca, [0.5, 0.04, 0.04], [s * 0.45, 0.32, 0.5], [0, s * 0.4, s * -0.2], mane, list); // bigodes
      }
      out.tail = tail(j, scale, 5, 0.28, list, 0.18);
      out.wings = [];
      break;
    }
    case 'ocidental': {
      const membrane = mat('#8a2a2a');
      const bone = mat('#3a1a1a');
      out.wings = wings(j, membrane, bone, list, 2.0);
      for (const s of [-1, 1]) box(j.cabeca, [0.12, 0.45, 0.12], [s * 0.3, 1.05, -0.15], [-0.5, 0, s * -0.2], mat('#e8dcc0'), list);
      for (let k = 0; k < 4; k++) box(j.tronco, [0.1, 0.25, 0.25], [0, 1.2 - k * 0.32, -0.42], [0.6, 0, 0], bone, list); // espinhos
      out.tail = tail(j, membrane, 4, 0.3, list, 0.2);
      break;
    }
    default:
  }
  return out;
}

export function removeFormParts(info) {
  for (const p of info?.parts ?? []) p.removeFromParent();
}

// Animação das partes: asas batendo (burst = impulso de uma batida) e cauda balançando.
// strike (M1 da forma híbrida, atualização 20): { part: 'cauda' | 'asas', k: 0..1, side }:
// a cauda chicoteia da base para a ponta (cada segmento atrasado) e as asas varrem à frente.
export function animateForm(info, t, burst = 0, speed = 0, strike = null) {
  if (!info) return;
  const wingSweep = strike?.part === 'asas' ? Math.sin(Math.PI * strike.k) : 0;
  for (const { group, side } of info.wings ?? []) {
    group.rotation.z = side * (Math.sin(t * 5) * 0.08 + burst * 0.9 * Math.sin(Math.min(1, burst) * Math.PI) + wingSweep * 0.7);
    group.rotation.y = -side * wingSweep * 0.9; // ponta da asa vem à frente no corte
  }
  (info.tail ?? []).forEach((g, i) => {
    let y = Math.sin(t * (3 + speed * 0.4) - i * 0.7) * (0.25 + i * 0.05);
    if (strike?.part === 'cauda') {
      const u = Math.max(0, Math.min(1, strike.k * 1.25 - i * 0.08)); // a ponta chega depois
      y += strike.side * (Math.sin(Math.PI * u) * (0.9 + i * 0.25) - 0.6 * (1 - u) * (u > 0 ? 1 : 0));
    }
    g.rotation.y = y;
  });
}
