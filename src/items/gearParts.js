// Visual do equipamento no corpo do laboratório (refeito na revisão visual): cada peça tem
// estrutura própria em blocos — elmo com cúpula, aba, nasal e crista; couraça com placa do
// peito, das costas, ombreiras em camadas e cinto; grevas com joelheiras e placas da coxa;
// botas com cano, biqueira e sola; amuleto com corrente e pingente brilhante; bracelete. O
// acabamento (frisos e rebites) segue a qualidade: Comum sem friso, Incomum/Rara prata,
// Épica e acima dourado. As peças são `wear` e entram na malha única do corpo; só as gemas
// brilhantes ficam separadas.

import * as THREE from 'three';
import { ITEMS, equipped } from './items.js';
import { wearBox } from '../characters/outfits.js';

const shade = (hex, k) => `#${new THREE.Color(hex).multiplyScalar(k).getHexString()}`;
const TRIM = { Comum: null, Incomum: '#b8bcc4', Rara: '#d8dce4', Épica: '#e8c050', Lendária: '#ffd36b', Mítica: '#ff9ab0' };

// desenhos por peça (id) com reserva por encaixe
const DESIGNS = {
  'bandana-treino': (j, add, c) => {
    add(j.cabeca, [1.05, 0.15, 0.99], [0, 0.72, 0], c);
    add(j.cabeca, [0.18, 0.16, 0.1], [0.22, 0.72, -0.52], c);
    add(j.cabeca, [0.1, 0.36, 0.05], [0.16, 0.52, -0.55], c, { rot: [0.2, 0, 0.35] });
    add(j.cabeca, [0.1, 0.3, 0.05], [0.3, 0.54, -0.55], c, { rot: [0.2, 0, -0.3] });
  },
  'elmo-ferro': (j, add, c, t) => {
    const metal = { metal: 0.55, rough: 0.35 };
    add(j.cabeca, [1.12, 0.44, 1.06], [0, 0.92, 0], c, metal); // cúpula (cobre o cabelo)
    add(j.cabeca, [0.9, 0.14, 0.9], [0, 1.18, 0], c, metal);
    add(j.cabeca, [1.12, 0.08, 1.06], [0, 0.72, 0], shade(c, 0.75), metal); // aro
    add(j.cabeca, [1.1, 0.42, 0.12], [0, 0.56, -0.5], c, metal); // nuca
    for (const s of [1, -1]) add(j.cabeca, [0.1, 0.42, 0.5], [s * 0.55, 0.5, -0.12], c, metal); // laterais
    add(j.cabeca, [0.1, 0.36, 0.08], [0, 0.6, 0.53], shade(c, 0.85), metal); // nasal
    if (t) add(j.cabeca, [0.1, 0.16, 0.9], [0, 1.3, -0.02], t, metal); // crista
  },
  'gibao-couro': (j, add, c) => {
    add(j.tronco, [1.3, 0.92, 0.76], [0, 0.52, 0], c, { rough: 0.9 });
    for (let k = 0; k < 4; k++) add(j.tronco, [0.05, 0.05, 0.05], [0.12 * (k % 2 ? 1 : -1), 0.3 + k * 0.17, 0.39], '#2a1a10'); // laços
    add(j.tronco, [0.05, 0.7, 0.04], [0, 0.5, 0.39], shade(c, 0.6));
    for (const s of ['E', 'D']) add(j['ombro_' + s], [0.46, 0.16, 0.68], [0, 0.2, 0], shade(c, 0.85), { rough: 0.9 });
    add(j.cintura, [1.08, 0.12, 0.66], [0, 0.36, 0], '#3a2a1a');
  },
  'couraca-escamas': (j, add, c, t) => {
    const metal = { metal: 0.45, rough: 0.35 };
    add(j.tronco, [1.3, 0.94, 0.76], [0, 0.52, 0], shade(c, 0.8), metal);
    // escamas em fileiras desencontradas na frente
    for (let r = 0; r < 4; r++) {
      for (let k = 0; k < 5; k++) {
        const x = -0.48 + k * 0.24 + (r % 2 ? 0.12 : 0);
        if (Math.abs(x) > 0.56) continue;
        add(j.tronco, [0.2, 0.2, 0.05], [x, 0.3 + r * 0.19, 0.4], c, { ...metal, rot: [0, 0, Math.PI / 4] });
      }
    }
    add(j.tronco, [0.8, 0.14, 0.6], [0, 1.03, 0], shade(c, 0.7), metal); // gola
    for (const s of ['E', 'D']) {
      add(j['ombro_' + s], [0.5, 0.16, 0.7], [0, 0.22, 0], c, metal); // ombreiras em camadas
      add(j['ombro_' + s], [0.46, 0.12, 0.66], [0, 0.08, 0], shade(c, 0.8), metal);
      add(j['braco_' + s], [0.4, 0.18, 0.58], [0, -0.08, 0], c, metal);
    }
    add(j.cintura, [1.08, 0.14, 0.67], [0, 0.35, 0], '#2a2a30', metal);
    if (t) add(j.cintura, [0.2, 0.14, 0.04], [0, 0.35, 0.35], t, { metal: 0.7, rough: 0.3 });
  },
  'manto-brasa': (j, add, c, t) => {
    add(j.tronco, [1.3, 0.94, 0.76], [0, 0.52, 0], shade(c, 0.7), { rough: 0.85 });
    add(j.tronco, [0.3, 0.94, 0.05], [0, 0.52, 0.39], c); // faixa da frente
    add(j.tronco, [1.4, 0.4, 0.84], [0, 0.88, 0], c, { rough: 0.85 }); // capuz caído nos ombros
    add(j.tronco, [1.28, 1.7, 0.06], [0, 0.15, -0.43], c, { rough: 0.85, rot: [0.08, 0, 0] }); // manto
    add(j.tronco, [1.3, 0.1, 0.07], [0, -0.66, -0.36], t ?? '#e8c050', { rot: [0.08, 0, 0] }); // barra
    for (const s of ['E', 'D']) add(j['ombro_' + s], [0.5, 0.2, 0.72], [0, 0.2, 0], shade(c, 0.85));
    add(j.cintura, [1.08, 0.14, 0.67], [0, 0.35, 0], '#2a1a14');
    if (t) add(j.tronco, [0.22, 0.22, 0.05], [0, 0.95, 0.43], t, { metal: 0.7, rough: 0.3 }); // broche
  },
  'calcas-reforcadas': (j, add, c) => {
    for (const s of ['E', 'D']) {
      add(j['coxa_' + s], [0.52, 0.66, 0.63], [0, -0.36, 0], c, { rough: 0.9 });
      add(j['coxa_' + s], [0.36, 0.22, 0.05], [0, -0.5, 0.33], shade(c, 0.75)); // remendo no joelho
    }
  },
  'grevas-aco': (j, add, c, t) => {
    const metal = { metal: 0.55, rough: 0.35 };
    for (const s of ['E', 'D']) {
      add(j['coxa_' + s], [0.52, 0.5, 0.64], [0, -0.3, 0], shade(c, 0.85), metal);
      add(j['coxa_' + s], [0.44, 0.26, 0.1], [0, -0.6, 0.31], c, metal); // joelheira
      add(j['canela_' + s], [0.48, 0.5, 0.2], [0, -0.32, 0.22], c, metal); // caneleira
      if (t) add(j['coxa_' + s], [0.08, 0.5, 0.05], [0, -0.3, 0.33], t, metal);
    }
    add(j.cintura, [1.08, 0.3, 0.1], [0, 0.16, 0.31], shade(c, 0.75), metal); // tasset
  },
  'botas-leves': (j, add, c) => {
    for (const s of ['E', 'D']) {
      add(j['pe_' + s], [0.54, 0.27, 0.86], [0, -0.12, 0.13], c, { rough: 0.9 });
      add(j['pe_' + s], [0.56, 0.07, 0.88], [0, -0.25, 0.13], '#4a3424');
      add(j['canela_' + s], [0.47, 0.3, 0.58], [0, -0.52, 0], c, { rough: 0.9 });
      add(j['canela_' + s], [0.5, 0.07, 0.6], [0, -0.38, 0], shade(c, 0.7));
    }
  },
  'botas-vento': (j, add, c, t) => {
    for (const s of ['E', 'D']) {
      add(j['pe_' + s], [0.54, 0.27, 0.86], [0, -0.12, 0.13], c, { metal: 0.3, rough: 0.4 });
      add(j['pe_' + s], [0.56, 0.08, 0.3], [0, -0.06, 0.45], t ?? '#ffffff', { metal: 0.6, rough: 0.3 }); // biqueira
      add(j['pe_' + s], [0.56, 0.07, 0.88], [0, -0.25, 0.13], '#2a3a4a');
      add(j['canela_' + s], [0.47, 0.5, 0.58], [0, -0.42, 0], c, { metal: 0.3, rough: 0.4 });
      // asinhas nos tornozelos
      for (const sx of [1, -1]) add(j['canela_' + s], [0.06, 0.18, 0.34], [sx * 0.27, -0.52, -0.1], '#ffffff', { rot: [-0.5, 0, sx * 0.3] });
    }
  },
};

function amulet(j, add, c, list, glowList) {
  // corrente em volta do pescoço e pingente com gema que brilha
  add(j.tronco, [0.7, 0.04, 0.04], [0, 1.0, 0.3], '#c8c8c8', { metal: 0.7, rough: 0.3 });
  for (const s of [1, -1]) add(j.tronco, [0.04, 0.3, 0.04], [s * 0.16, 0.86, 0.36], '#c8c8c8', { metal: 0.7, rough: 0.3, rot: [0, 0, s * 0.35] });
  add(j.tronco, [0.2, 0.2, 0.06], [0, 0.72, 0.37], '#e0b040', { metal: 0.7, rough: 0.3 });
  glowList.push(wearBox(j.tronco, [0.12, 0.12, 0.05], [0, 0.72, 0.41], c, { glow: c, slot: 'amuleto', list }));
}

function bracelet(j, add, c, list, glowList) {
  add(j.antebraco_E, [0.42, 0.14, 0.6], [0, -0.48, 0], shade(c, 0.8), { metal: 0.6, rough: 0.3 });
  glowList.push(wearBox(j.antebraco_E, [0.1, 0.1, 0.05], [0, -0.48, 0.32], c, { glow: c, slot: 'anel', list }));
}

export function applyGearVisual(body, save, prev = []) {
  for (const p of prev) {
    p.removeFromParent();
    p.geometry.dispose();
  }
  const parts = [];
  const glow = [];
  const j = body.joints;
  for (const it of equipped(save)) {
    const d = ITEMS[it.id];
    const trim = TRIM[d.qualidade] ?? null;
    const add = (parent, size, pos, color, opts = {}) => wearBox(parent, size, pos, color, { ...opts, slot: d.slot, list: parts });
    if (DESIGNS[it.id]) DESIGNS[it.id](j, add, d.cor, trim);
    else if (d.slot === 'amuleto') amulet(j, add, d.cor, parts, glow);
    else if (d.slot === 'anel') bracelet(j, add, d.cor, parts, glow);
    else if (d.slot === 'cabeca') DESIGNS['elmo-ferro'](j, add, d.cor, trim);
    else if (d.slot === 'torso') DESIGNS['couraca-escamas'](j, add, d.cor, trim);
    else if (d.slot === 'pernas') DESIGNS['grevas-aco'](j, add, d.cor, trim);
    else if (d.slot === 'botas') DESIGNS['botas-leves'](j, add, d.cor);
  }
  return parts;
}

// encaixes com armadura (escondem a peça de roupa do mesmo encaixe; o manto também esconde a capa)
export function gearSlots(save) {
  const out = new Set();
  for (const it of equipped(save)) {
    const slot = ITEMS[it.id].slot;
    out.add(slot);
    if (it.id === 'manto-brasa') out.add('capa');
  }
  return out;
}
