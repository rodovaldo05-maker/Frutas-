// Roupas (guarda-roupa): conjuntos de peças em blocos presas às juntas do corpo do
// laboratório — gola, cinto com fivela, casacos, coletes, capas, chapéus, botas, solas — e as
// cores da camisa, da bermuda e do sapato. As peças são marcadas como `wear` e entram na
// malha única do corpo (mergeBody), então não custam chamadas de desenho a mais.
// Cada peça diz a qual encaixe pertence (`slot`): uma armadura no mesmo encaixe esconde a
// peça de roupa (ex.: o elmo esconde o chapéu). Medidas tiradas dos segmentos do corpo
// (cintura 1,01×0,42×0,59; tronco 1,22×1,03×0,67; cabeça 1×0,96×0,94; ...).

import * as THREE from 'three';

const mats = new Map();
export function wearMat(color, opts = {}) {
  const key = `${color}|${opts.metal ?? 0}|${opts.rough ?? 0.8}|${opts.glow ?? ''}`;
  if (!mats.has(key)) {
    mats.set(key, new THREE.MeshStandardMaterial({
      color, roughness: opts.rough ?? 0.8, metalness: opts.metal ?? 0.02,
      ...(opts.glow ? { emissive: opts.glow, emissiveIntensity: 0.9 } : {}),
    }));
  }
  return mats.get(key);
}

// peça em bloco presa a uma junta
export function wearBox(parent, size, pos, color, { rot = null, slot = 'base', list, metal, rough, glow } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), wearMat(color, { metal, rough, glow }));
  m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  m.castShadow = true;
  m.userData.wear = true;
  m.userData.slot = slot;
  parent.add(m);
  list?.push(m);
  return m;
}

const shade = (hex, k) => `#${new THREE.Color(hex).multiplyScalar(k).getHexString()}`;

// ===== Peças comuns =====
function belt(j, add, color = '#4a3020', buckle = '#e0b040') {
  add(j.cintura, [1.05, 0.11, 0.63], [0, 0.36, 0], color);
  add(j.cintura, [0.18, 0.12, 0.04], [0, 0.36, 0.32], buckle, { metal: 0.6, rough: 0.35 });
}
function soles(j, add, color = '#3a2a1a') {
  for (const s of ['E', 'D']) add(j['pe_' + s], [0.52, 0.07, 0.83], [0, -0.245, 0.13], color, { slot: 'botas' });
}
function collar(j, add, color) {
  add(j.tronco, [0.66, 0.09, 0.5], [0, 1.04, 0], color);
}
function cuffs(j, add, color, y = -0.55) {
  for (const s of ['E', 'D']) add(j['braco_' + s], [0.39, 0.08, 0.57], [0, y, 0], color);
}
function tallBoots(j, add, color, cuff = color) {
  for (const s of ['E', 'D']) {
    add(j['canela_' + s], [0.47, 0.52, 0.58], [0, -0.43, 0], color, { slot: 'botas' });
    add(j['canela_' + s], [0.51, 0.1, 0.62], [0, -0.18, 0], cuff, { slot: 'botas' });
  }
}
function hatBrim(j, add, color, w = 1.24, y = 1.0) {
  add(j.cabeca, [w, 0.07, w * 0.94], [0, y, 0], color, { slot: 'cabeca' });
}

// ===== Conjuntos =====
// body: cores dos segmentos; palettes: 3 variações (a = principal, b = secundária, c = detalhe)
export const OUTFITS = {
  basica: {
    nome: 'Roupa de Treino', preco: 0,
    desc: 'Camisa, bermuda e tênis com gola, cinto de couro e sola reforçada.',
    palettes: [
      { shirt: '#3f7fb4', shorts: '#2f3b45', shoes: '#ece6d8', a: '#2f5f8a', b: '#4a3020', c: '#e0b040' },
      { shirt: '#b8402a', shorts: '#2f2f38', shoes: '#ece6d8', a: '#8a2a1a', b: '#3a2a1a', c: '#e0b040' },
      { shirt: '#4a8a4a', shorts: '#3a3a2a', shoes: '#ece6d8', a: '#2f6a2f', b: '#4a3020', c: '#c8c8c8' },
    ],
    build(j, add, p) {
      collar(j, add, p.a);
      cuffs(j, add, p.a);
      belt(j, add, p.b, p.c);
      soles(j, add, '#3a3a3a');
    },
  },
  lutador: {
    nome: 'Kimono de Luta', preco: 0,
    desc: 'Kimono de treino com faixa amarrada, gola cruzada e bandagens nos antebraços.',
    palettes: [
      { shirt: '#f4f2ea', shorts: '#f4f2ea', shoes: '#d8b090', a: '#1a1a1a', b: '#e8e4d8', c: '#c0392b' },
      { shirt: '#2a3a6a', shorts: '#2a3a6a', shoes: '#d8b090', a: '#e8c040', b: '#1f2a4a', c: '#e8e8e8' },
      { shirt: '#1a1a1e', shorts: '#1a1a1e', shoes: '#d8b090', a: '#c0392b', b: '#2a2a30', c: '#e8e8e8' },
    ],
    build(j, add, p) {
      // gola cruzada em V
      add(j.tronco, [0.16, 0.7, 0.05], [0.14, 0.66, 0.345], p.b, { rot: [0, 0, 0.35] });
      add(j.tronco, [0.16, 0.7, 0.05], [-0.14, 0.66, 0.35], p.b, { rot: [0, 0, -0.35] });
      // faixa com nó e pontas
      add(j.cintura, [1.06, 0.13, 0.64], [0, 0.34, 0], p.a);
      add(j.cintura, [0.2, 0.16, 0.08], [0.2, 0.34, 0.34], p.a);
      add(j.cintura, [0.08, 0.34, 0.04], [0.16, 0.12, 0.36], p.a, { rot: [0, 0, 0.2] });
      add(j.cintura, [0.08, 0.3, 0.04], [0.27, 0.14, 0.36], p.a, { rot: [0, 0, -0.25] });
      // calça larga e bandagens
      for (const s of ['E', 'D']) {
        add(j['coxa_' + s], [0.52, 0.5, 0.63], [0, -0.42, 0], shade(p.b, 1), { slot: 'pernas' });
        add(j['antebraco_' + s], [0.4, 0.26, 0.58], [0, -0.4, 0], '#e8e4d8');
      }
      // faixa na cabeça
      add(j.cabeca, [1.04, 0.1, 0.98], [0, 0.78, 0], p.c, { slot: 'cabeca' });
      add(j.cabeca, [0.07, 0.3, 0.04], [0.18, 0.62, -0.5], p.c, { slot: 'cabeca', rot: [0, 0, 0.3] });
    },
  },
  marinheiro: {
    nome: 'Marinheiro', preco: 800,
    desc: 'Camisa listrada, gola de marinheiro com lenço, quepe e sapato de convés.',
    palettes: [
      { shirt: '#f2f2ee', shorts: '#22304a', shoes: '#2a2a30', a: '#22304a', b: '#c0392b', c: '#f2f2ee' },
      { shirt: '#f2f2ee', shorts: '#3a1a1a', shoes: '#2a2a30', a: '#8a1a1a', b: '#1f4f8a', c: '#f2f2ee' },
      { shirt: '#e8f0f4', shorts: '#2a4a5a', shoes: '#2a2a30', a: '#2a6a8a', b: '#e8c040', c: '#e8f0f4' },
    ],
    build(j, add, p) {
      for (const y of [0.3, 0.52, 0.74]) add(j.tronco, [1.25, 0.07, 0.7], [0, y, 0], p.a);
      add(j.tronco, [0.92, 0.38, 0.04], [0, 0.82, -0.36], p.a); // gola nas costas
      add(j.tronco, [0.26, 0.24, 0.05], [0, 0.86, 0.36], p.b); // lenço
      add(j.tronco, [0.1, 0.22, 0.04], [0, 0.66, 0.37], p.b);
      cuffs(j, add, p.a);
      add(j.cabeca, [0.98, 0.18, 0.92], [0, 1.02, 0], p.c, { slot: 'cabeca' }); // quepe
      add(j.cabeca, [1.0, 0.07, 0.94], [0, 0.95, 0], p.a, { slot: 'cabeca' });
      add(j.cabeca, [0.6, 0.05, 0.22], [0, 0.94, 0.55], '#1a1a1e', { slot: 'cabeca' }); // pala
      soles(j, add, '#f2f2ee');
    },
  },
  explorador: {
    nome: 'Explorador', preco: 1500,
    desc: 'Colete com bolsos, lenço no pescoço, bolsa a tiracolo, chapéu de abas e botas de trilha.',
    palettes: [
      { shirt: '#d8c49a', shorts: '#6a5a3a', shoes: '#5a3a22', a: '#5a6a3a', b: '#c0602a', c: '#4a3020' },
      { shirt: '#e8e0d0', shorts: '#3a4a5a', shoes: '#4a3424', a: '#7a5a3a', b: '#2a6a8a', c: '#3a2a1a' },
      { shirt: '#c8a070', shorts: '#4a4030', shoes: '#3a2a1a', a: '#3a4a2a', b: '#e8c040', c: '#2a1a10' },
    ],
    build(j, add, p) {
      for (const sx of [1, -1]) {
        add(j.tronco, [0.44, 0.92, 0.72], [sx * 0.42, 0.5, 0], p.a); // painéis do colete
        add(j.tronco, [0.22, 0.18, 0.05], [sx * 0.42, 0.38, 0.37], shade(p.a, 0.8)); // bolsos
      }
      add(j.tronco, [1.26, 0.92, 0.05], [0, 0.5, -0.36], p.a);
      add(j.tronco, [0.7, 0.14, 0.56], [0, 1.02, 0.02], p.b); // lenço
      add(j.tronco, [0.12, 1.3, 0.05], [0, 0.5, 0.37], p.c, { rot: [0, 0, 0.75] }); // alça
      add(j.cintura, [0.3, 0.32, 0.18], [-0.52, 0.2, 0.18], p.c); // bolsa
      belt(j, add, p.c, '#c8c8c8');
      hatBrim(j, add, p.a, 1.36, 1.0);
      add(j.cabeca, [0.9, 0.26, 0.86], [0, 1.14, 0], p.a, { slot: 'cabeca' });
      add(j.cabeca, [0.92, 0.07, 0.88], [0, 1.05, 0], p.c, { slot: 'cabeca' });
      for (const s of ['E', 'D']) add(j['canela_' + s], [0.47, 0.28, 0.58], [0, -0.55, 0], p.c, { slot: 'botas' });
      soles(j, add, '#2a1a10');
    },
  },
  mergulhador: {
    nome: 'Roupa de Mergulho', preco: 2500,
    desc: 'Roupa justa com faixas laterais, óculos de mergulho na testa e nadadeiras.',
    palettes: [
      { shirt: '#1a2a3a', shorts: '#1a2a3a', shoes: '#1a2a3a', a: '#ffcc33', b: '#7fd6ff', c: '#2a2a30' },
      { shirt: '#2a1a2a', shorts: '#2a1a2a', shoes: '#2a1a2a', a: '#ff6a9a', b: '#9fe0ff', c: '#2a2a30' },
      { shirt: '#10302a', shorts: '#10302a', shoes: '#10302a', a: '#4fd2a0', b: '#bfeeff', c: '#2a2a30' },
    ],
    build(j, add, p) {
      for (const sx of [1, -1]) {
        add(j.tronco, [0.06, 0.95, 0.7], [sx * 0.62, 0.5, 0], p.a);
        add(j['coxa_' + (sx > 0 ? 'E' : 'D')], [0.06, 0.66, 0.6], [sx * 0.24, -0.35, 0], p.a, { slot: 'pernas' });
      }
      add(j.tronco, [0.7, 0.12, 0.5], [0, 1.03, 0], p.a);
      // óculos na testa e tira
      add(j.cabeca, [1.04, 0.08, 0.98], [0, 0.8, 0], p.c, { slot: 'cabeca' });
      for (const sx of [1, -1]) add(j.cabeca, [0.3, 0.2, 0.08], [sx * 0.2, 0.82, 0.5], p.b, { slot: 'cabeca', rough: 0.15, metal: 0.3 });
      // nadadeiras
      for (const s of ['E', 'D']) add(j['pe_' + s], [0.56, 0.06, 1.1], [0, -0.24, 0.3], p.a, { slot: 'botas' });
    },
  },
  pirata: {
    nome: 'Corsário', preco: 4000,
    desc: 'Casaco longo aberto com botões dourados, faixa na cintura, chapéu de abas largas e botas altas.',
    palettes: [
      { shirt: '#efe6d0', shorts: '#3a2a20', shoes: '#1a1210', a: '#7a1f1f', b: '#e0b040', c: '#1a1a1e' },
      { shirt: '#efe6d0', shorts: '#2a2a30', shoes: '#1a1210', a: '#1f2f5a', b: '#e0b040', c: '#1a1a1e' },
      { shirt: '#e8e0d0', shorts: '#3a3020', shoes: '#1a1210', a: '#2a2a2a', b: '#c8c8c8', c: '#5a1a1a' },
    ],
    build(j, add, p) {
      for (const sx of [1, -1]) {
        add(j.tronco, [0.42, 1.0, 0.74], [sx * 0.43, 0.5, 0], p.a, { slot: 'torso' });
        for (const y of [0.35, 0.6, 0.85]) add(j.tronco, [0.07, 0.07, 0.05], [sx * 0.25, y, 0.38], p.b, { slot: 'torso', metal: 0.6, rough: 0.35 });
        add(j['braco_' + (sx > 0 ? 'E' : 'D')], [0.4, 0.62, 0.58], [0, -0.29, 0], p.a, { slot: 'torso' });
        add(j['antebraco_' + (sx > 0 ? 'E' : 'D')], [0.42, 0.14, 0.6], [0, -0.48, 0], p.b, { slot: 'torso' });
      }
      add(j.tronco, [1.3, 1.0, 0.06], [0, 0.5, -0.37], p.a, { slot: 'torso' });
      add(j.cintura, [1.12, 0.62, 0.07], [0, -0.12, -0.33], p.a, { slot: 'torso' }); // abas do casaco
      add(j.cintura, [1.07, 0.16, 0.65], [0, 0.34, 0], '#8a1a1a'); // faixa
      add(j.cintura, [0.12, 0.34, 0.05], [0.36, 0.16, 0.34], '#8a1a1a');
      hatBrim(j, add, p.c, 1.4, 1.02);
      add(j.cabeca, [0.92, 0.34, 0.86], [0, 1.22, 0], p.c, { slot: 'cabeca' });
      add(j.cabeca, [0.94, 0.06, 0.88], [0, 1.08, 0], p.b, { slot: 'cabeca' });
      tallBoots(j, add, '#1a1210', '#3a2a1a');
    },
  },
  andarilho: {
    nome: 'Andarilho das Dunas', preco: 4000,
    desc: 'Poncho de lã sobre os ombros, lenço de rosto, chapéu de palha largo e sandálias de couro.',
    palettes: [
      { shirt: '#c8a070', shorts: '#8a6a4a', shoes: '#6a4a2a', a: '#b8603a', b: '#e8d8a0', c: '#e0c880' },
      { shirt: '#d8c8a8', shorts: '#5a4a3a', shoes: '#5a3a22', a: '#3a6a8a', b: '#f0e0c0', c: '#d8c090' },
      { shirt: '#a88a6a', shorts: '#4a3a2a', shoes: '#4a3020', a: '#6a3a6a', b: '#e8c040', c: '#c8b080' },
    ],
    build(j, add, p) {
      add(j.tronco, [1.42, 0.5, 0.82], [0, 0.86, 0], p.a, { slot: 'torso' }); // poncho nos ombros
      add(j.tronco, [1.3, 0.5, 0.06], [0, 0.42, 0.38], p.a, { slot: 'torso' });
      add(j.tronco, [1.3, 0.5, 0.06], [0, 0.42, -0.38], p.a, { slot: 'torso' });
      for (const y of [0.7, 0.3]) add(j.tronco, [1.32, 0.06, 0.07], [0, y, 0.39], p.b, { slot: 'torso' }); // faixas
      add(j.cabeca, [0.9, 0.2, 0.08], [0, 0.3, 0.5], p.b); // lenço de rosto
      hatBrim(j, add, p.c, 1.6, 1.0);
      add(j.cabeca, [0.7, 0.26, 0.66], [0, 1.15, 0], p.c, { slot: 'cabeca' });
      for (const s of ['E', 'D']) add(j['pe_' + s], [0.52, 0.05, 0.83], [0, -0.245, 0.13], '#4a3020', { slot: 'botas' });
    },
  },
  nobre: {
    nome: 'Traje Nobre', preco: 8000,
    desc: 'Casaca com botões e dragonas douradas, faixa de honra, gola alta, capa e botas de montaria.',
    palettes: [
      { shirt: '#2a3a6a', shorts: '#e8e0d0', shoes: '#1a1a22', a: '#e0b040', b: '#8a1a1a', c: '#5a1a2a' },
      { shirt: '#1a1a22', shorts: '#e8e0d0', shoes: '#1a1a22', a: '#c8ccd2', b: '#2a5a8a', c: '#2a2a3a' },
      { shirt: '#5a1a2a', shorts: '#2a2a30', shoes: '#1a1a22', a: '#e0b040', b: '#e8e8e8', c: '#1a1a22' },
    ],
    build(j, add, p) {
      for (let k = 0; k < 5; k++) add(j.tronco, [0.08, 0.08, 0.05], [0, 0.22 + k * 0.17, 0.36], p.a, { slot: 'torso', metal: 0.7, rough: 0.3 });
      for (const s of ['E', 'D']) {
        add(j['ombro_' + s], [0.46, 0.1, 0.66], [0, 0.2, 0], p.a, { slot: 'torso', metal: 0.7, rough: 0.3 });
        add(j['ombro_' + s], [0.48, 0.08, 0.06], [0, 0.12, 0.33], p.a, { slot: 'torso', metal: 0.7, rough: 0.3 });
      }
      add(j.tronco, [0.14, 1.35, 0.05], [0, 0.5, 0.37], p.b, { rot: [0, 0, -0.7] }); // faixa de honra
      add(j.tronco, [0.74, 0.18, 0.56], [0, 1.06, 0], shade(p.c, 1.2)); // gola alta
      add(j.tronco, [1.24, 1.7, 0.06], [0, 0.18, -0.42], p.c, { slot: 'capa', rot: [0.08, 0, 0] }); // capa
      belt(j, add, '#1a1a22', p.a);
      tallBoots(j, add, '#1a1a22', p.a);
    },
  },
};
export const OUTFIT_IDS = Object.keys(OUTFITS);

// Monta a roupa no corpo; devolve as peças. hide: encaixes ocupados pela armadura.
export function buildOutfit(body, id, palette, { hide = new Set() } = {}) {
  const def = OUTFITS[id] ?? OUTFITS.basica;
  // cores que faltarem vêm da primeira paleta da roupa
  const given = Object.fromEntries(Object.entries(palette ?? {}).filter(([, v]) => typeof v === 'string'));
  palette = { ...def.palettes[0], ...given };
  const list = [];
  const add = (parent, size, pos, color, opts = {}) => {
    const slot = opts.slot ?? 'base';
    if (hide.has(slot)) return null;
    return wearBox(parent, size, pos, color, { ...opts, slot, list });
  };
  def.build(body.joints, add, palette);
  return list;
}

export function removeOutfit(parts) {
  for (const p of parts ?? []) {
    p.removeFromParent();
    p.geometry.dispose();
  }
}

// Paleta de uma roupa: as cores dos segmentos e dos detalhes
export function outfitPalette(id, cor = 0) {
  const def = OUTFITS[id] ?? OUTFITS.basica;
  return def.palettes[Math.max(0, Math.min(def.palettes.length - 1, cor | 0))];
}

// Roupa de NPC (moradores, mercadores): sorteada pelo nome; os detalhes usam as cores do NPC
export function npcOutfit(seedText, look) {
  let h = 0;
  for (const ch of seedText) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const ids = ['basica', 'marinheiro', 'explorador', 'pirata', 'andarilho', 'nobre', 'lutador'];
  const id = ids[h % ids.length];
  const base = OUTFITS[id].palettes[(h >> 4) % 3];
  return { id, palette: { ...base, shirt: look.shirt, shorts: look.shorts, shoes: look.shoes, a: shade(look.shirt, 0.65) } };
}

// Salvo: roupa equipada e roupas compradas
export function normalizeOutfit(save) {
  const owned = Array.isArray(save.outfits) ? save.outfits.filter((id) => OUTFITS[id]) : [];
  for (const id of OUTFIT_IDS) if (OUTFITS[id].preco === 0 && !owned.includes(id)) owned.push(id);
  save.outfits = [...new Set(owned)];
  const o = save.outfit && typeof save.outfit === 'object' ? save.outfit : {};
  const id = OUTFITS[o.id] && save.outfits.includes(o.id) ? o.id : 'basica';
  const cor = Number.isInteger(o.cor) && o.cor >= 0 && o.cor < OUTFITS[id].palettes.length ? o.cor : 0;
  save.outfit = { id, cor };
  return save;
}

export function buyOutfit(save, id) {
  const d = OUTFITS[id];
  if (!d) return { ok: false, why: 'Roupa não encontrada' };
  if (save.outfits.includes(id)) return { ok: false, why: 'Você já tem esta roupa' };
  if (save.coins < d.preco) return { ok: false, why: `Faltam ${d.preco - save.coins} moedas` };
  save.coins -= d.preco;
  save.outfits.push(id);
  return { ok: true };
}
