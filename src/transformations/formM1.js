// M1 das formas de fera (atualização 21; Prompt Mestre, seções 4 e 7). A forma híbrida usa a
// variante `_h` dos golpes (corpo humanoide forte + cauda, asas e mandíbula acompanhando). A
// forma completa ganha golpes próprios, sem membros humanos ausentes, escritos na linguagem de
// pose de cada módulo do laboratório e registrados nas tabelas de ação dele:
//   Lobo (quadrúpede): patada dianteira, patada cruzada, mordida, bote.
//   Besta (quadrúpede): patada dianteira, golpe de cauda, chifrada, carga.
//   Dragão Ocidental (quadrúpede alado): patada, mordida, cauda, esmagamento.
//   Falcão (ave): patada de talões, batida lateral de asa, garras em voo, mergulho.
//   Fênix (ave): corte de asa, garras, giro de asas e cauda, ascensão.
//   Dragão Oriental (serpente): garra anterior, chicote de cauda, ondulação e avanço, rugido.
// O tempo de cada golpe é o mesmo da ficha do M1 (o impacto cai no mesmo quadro).

import { FRUTOWolf, FRUTOFalcon } from '../characters/fruto-animals.js';
import { OrientalSerpent } from '../characters/orientalSerpent.js';
import { M1, FPS } from '../combat/m1Catalog.js';
import { FRUTOMotion } from '../animation/fruto-motion.js';

const mirror = (v) => Object.fromEntries(Object.entries(v).map(([k, x]) => [k, ['turn', 'bank', 'tail', 'rake', 'foot', 'blade'].includes(k) ? -x : x]));
const frames = (rows, side = 'E') => rows.map(([at, v]) => [at, side === 'D' ? mirror(v) : v]);

// ===== Quadrúpedes (tabela do Lobo): height, reach, chest, turn, bank, snout, jaw, tail, front, rear, rake, lift =====
const QUAD = {
  patada: [
    [0.55, { height: -0.08, reach: -0.08, chest: 0.1, turn: 0.22, bank: 0.1, snout: -0.05, jaw: 0.1, tail: -0.3, rake: 0.42, lift: 0.22 }],
    [1, { height: 0, reach: 0.2, chest: 0.16, turn: -0.24, bank: -0.08, snout: 0.12, jaw: 0.05, tail: 0.25, front: 0.12, rake: 0.55, lift: 0.1 }],
    [1.35, { height: -0.03, reach: 0.1, chest: 0.06, turn: -0.3, rake: 0.15, tail: 0.3 }],
  ],
  mordida: [
    [0.55, { height: -0.12, reach: -0.12, chest: 0.14, snout: 0.18, jaw: 0.62, tail: 0.2, rear: 0.06 }],
    [1, { height: -0.04, reach: 0.3, chest: 0.1, snout: 0.28, jaw: 0.03, tail: -0.2, front: 0.1 }],
    [1.35, { height: -0.06, reach: 0.08, snout: 0.1, jaw: 0.1, tail: -0.15 }],
  ],
  bote: [
    [0.5, { height: -0.28, reach: -0.18, chest: 0.3, snout: 0.2, jaw: 0.4, tail: 0.3, rear: 0.1 }],
    [0.82, { height: 0.22, reach: 0.2, chest: -0.18, front: 0.45, rear: -0.2, lift: 0.5, jaw: 0.6 }],
    [1, { height: 0.12, reach: 0.42, chest: 0.05, front: 0.5, rear: -0.26, lift: 0.32, snout: 0.25, jaw: 0.05, tail: -0.35 }],
    [1.45, { height: -0.12, reach: 0.15, chest: 0.15, front: 0.1, tail: -0.1 }],
  ],
  cauda: [
    [0.55, { height: -0.06, turn: -0.45, bank: -0.15, tail: 0.6, chest: 0.05 }],
    [1, { height: -0.02, turn: 0.5, bank: 0.18, tail: -0.75, reach: 0.05 }],
    [1.4, { turn: 0.3, tail: -0.45 }],
  ],
  chifrada: [
    [0.55, { height: -0.16, reach: -0.1, chest: 0.28, snout: 0.5, jaw: 0.1, tail: 0.2, rear: 0.1 }],
    [1, { height: 0.1, reach: 0.22, chest: -0.2, snout: -0.45, front: 0.12, lift: 0.15, tail: -0.25 }],
    [1.4, { height: 0.02, reach: 0.08, chest: -0.05, snout: -0.15 }],
  ],
  carga: [
    [0.55, { height: -0.18, reach: -0.2, chest: 0.25, snout: 0.25, tail: 0.3, rear: 0.2 }],
    [1, { height: -0.02, reach: 0.45, chest: 0.18, snout: 0.32, front: 0.22, rear: -0.2, tail: -0.2 }],
    [1.4, { height: -0.08, reach: 0.15, chest: 0.1, tail: -0.1 }],
  ],
  esmagamento: [
    [0.5, { height: 0.18, reach: -0.12, chest: -0.35, snout: -0.3, front: 0.15, lift: 0.5, rear: 0.08, jaw: 0.3 }],
    [1, { height: -0.2, reach: 0.2, chest: 0.35, snout: 0.25, front: 0.3, lift: 0, jaw: 0.1, tail: -0.2 }],
    [1.45, { height: -0.1, reach: 0.1, chest: 0.18, front: 0.12 }],
  ],
};

// ===== Aves (tabela do Falcão): height, reach, pitch, neck, turn, bank, bill, open, fold, stroke, blade, foot, fan =====
const BIRD = {
  patada: [
    [0.55, { height: -0.06, reach: -0.1, pitch: -0.12, neck: -0.15, open: 0.3, foot: 0.4, fan: 0.1 }],
    [1, { height: 0.03, reach: 0.22, pitch: 0.2, neck: 0.12, open: 0.4, foot: 1, fan: 0.15 }],
    [1.35, { reach: 0.1, pitch: 0.08, open: 0.25, foot: 0.4 }],
  ],
  asa: [
    [0.55, { height: -0.05, turn: 0.3, bank: 0.15, open: 0.8, stroke: 0.6, blade: -0.3, fan: 0.3 }],
    [1, { height: 0.03, reach: 0.1, turn: -0.3, bank: -0.15, open: 1, stroke: 0.05, blade: 1, fan: 0.6 }],
    [1.4, { turn: -0.35, open: 0.7, blade: 0.6, fan: 0.4 }],
  ],
  garrasVoo: [
    [0.5, { height: 0.12, reach: -0.05, pitch: -0.15, open: 0.9, stroke: 0.7, fan: 0.5 }],
    [0.8, { height: 0.2, open: 1, stroke: -0.2, foot: -0.6, fan: 0.7 }],
    [1, { height: 0.14, reach: 0.2, pitch: 0.15, open: 0.9, foot: -1, fan: 0.6 }],
    [1.4, { height: 0.05, reach: 0.1, open: 0.6, foot: -0.4, fan: 0.3 }],
  ],
  mergulho: [
    [0.45, { height: 0.25, reach: -0.1, pitch: -0.2, neck: -0.2, open: 1, stroke: 0.8, fan: 0.8 }],
    [0.8, { height: 0.12, reach: 0.1, pitch: 0.45, neck: 0.3, fold: 0.8, open: 0.2 }],
    [1, { height: -0.05, reach: 0.35, pitch: 0.35, neck: 0.25, open: 0.9, stroke: -0.1, foot: 1, fan: 0.9, bill: 0.1 }],
    [1.45, { height: -0.02, reach: 0.12, pitch: 0.1, open: 0.7, fan: 0.5 }],
  ],
  giro: [
    [0.55, { height: -0.04, turn: 0.6, bank: 0.2, open: 0.9, stroke: 0.4, fan: 0.8 }],
    [1, { height: 0.04, turn: -0.7, bank: -0.25, open: 1, stroke: 0.1, blade: 1, fan: 1 }],
    [1.4, { turn: -0.45, bank: -0.1, open: 0.7, blade: 0.5, fan: 0.6 }],
  ],
  ascensao: [
    [0.55, { height: -0.12, reach: -0.05, pitch: 0.15, neck: 0.1, open: 0.5, fold: 0.3, fan: 0.3 }],
    [1, { height: 0.35, reach: 0.08, pitch: -0.2, neck: -0.22, bill: 0.12, open: 1, stroke: -0.3, fan: 1 }],
    [1.45, { height: 0.2, pitch: -0.1, open: 0.9, stroke: 0.4, fan: 0.7 }],
  ],
};

// [módulo, movimento, lado] de cada M1 da forma completa
export const COMPLETE_M1 = {
  lobo: [['quad', 'patada', 'E'], ['quad', 'patada', 'D'], ['quad', 'mordida', 'E'], ['quad', 'bote', 'E']],
  besta: [['quad', 'patada', 'D'], ['quad', 'cauda', 'E'], ['quad', 'chifrada', 'E'], ['quad', 'carga', 'E']],
  ocidental: [['quad', 'patada', 'D'], ['quad', 'mordida', 'E'], ['quad', 'cauda', 'E'], ['quad', 'esmagamento', 'E']],
  falcao: [['bird', 'patada', 'E'], ['bird', 'asa', 'D'], ['bird', 'garrasVoo', 'E'], ['bird', 'mergulho', 'E']],
  fenix: [['bird', 'asa', 'E'], ['bird', 'patada', 'D'], ['bird', 'giro', 'E'], ['bird', 'ascensao', 'E']],
  oriental: [['serpent', 'garra', 'E'], ['serpent', 'cauda', 'D'], ['serpent', 'investida', 'E'], ['serpent', 'rugido', 'E']],
};

export const completeId = (m1Id) => `${m1Id}_c`;

{
  const quad = {};
  const bird = {};
  const serpent = {};
  for (const [fruit, moves] of Object.entries(COMPLETE_M1)) {
    moves.forEach(([kind, move, side], i) => {
      const rec = M1[`${fruit}_m1_${i + 1}`];
      const timing = { release: rec.impacto / FPS, duration: rec.quadros / FPS };
      const id = completeId(rec.id);
      const labels = [rec.nome, rec.nome];
      if (kind === 'quad') quad[id] = { ...timing, labels, frames: frames(QUAD[move], side), move };
      else if (kind === 'bird') bird[id] = { ...timing, labels, frames: frames(BIRD[move], side), move };
      else serpent[id] = { ...timing, kind: move, side, move };
    });
  }
  // a serpente também ganha pose para as técnicas da fruta (o laboratório usava o Lobo)
  const tm = (id) => ({ release: FRUTOMotion.clips[id].release, duration: FRUTOMotion.clips[id].duration });
  Object.assign(serpent, {
    lobo0: { ...tm('lobo0'), kind: 'rugido' }, lobo3: { ...tm('lobo3'), kind: 'rugido' }, lobo4: { ...tm('lobo4'), kind: 'investida' },
    despertar_lobo: { ...tm('despertar_lobo'), kind: 'rugido' }, lobo_dash: { ...tm('lobo_dash'), kind: 'investida' },
    lobo_j1: { ...tm('lobo_j1'), kind: 'garra', side: 'E' }, lobo_j2: { ...tm('lobo_j2'), kind: 'cauda' }, lobo_j3: { ...tm('lobo_j3'), kind: 'investida' },
  });
  FRUTOWolf.registerActions(quad);
  FRUTOFalcon.registerActions(bird);
  OrientalSerpent.registerActions(serpent);
}

// ===== Forma híbrida: cauda, asas e mandíbula acompanham o golpe humanoide =====
const sm = (x) => {
  const u = Math.max(0, Math.min(1, x));
  return u * u * (3 - 2 * u);
};
const env = (t, at, before, after) => sm(t < at ? (t - at + before) / before : (at + after - t) / after);
const TAILS = ['cauda_base', 'cauda_meio', 'cauda_ponta', 'cauda_onda', 'cauda_folha', 'cauda_lamina'];

export function hybridOverlay(rig, m1Id, t) {
  const rec = M1[m1Id];
  if (!rec) return;
  const j = rig.joints;
  const rel = rec.impacto / FPS;
  const dur = rec.quadros / FPS;
  const sign = rec.lado === 'E' ? 1 : -1;
  if (rec.tipo === 'tail') {
    // chicote da base para a ponta: cada elo chega um pouco depois
    TAILS.forEach((name, i) => {
      if (!j[name]) return;
      const wind = env(t - i * 0.02, rel * 0.55, rel * 0.55, rel * 0.5);
      const crack = env(t - i * 0.02, rel, rel * 0.45, (dur - rel) * 0.6);
      j[name].rotation.y += sign * (0.5 * wind - (0.9 + 0.2 * i) * crack);
      j[name].rotation.x -= 0.25 * crack;
    });
  }
  if (rec.tipo === 'wing' || rec.tipo === 'dive' || rec.tipo === 'spin') {
    const open = env(t, rel * 0.55, rel * 0.55, rel * 0.5);
    const sweep = env(t, rel, rel * 0.45, (dur - rel) * 0.6);
    for (const [s, sg] of [['E', 1], ['D', -1]]) {
      const active = rec.tipo !== 'wing' || s === rec.lado;
      if (j[`asa_${s}`] && active) {
        j[`asa_${s}`].rotation.z += sg * (0.6 * open - 0.4 * sweep);
        j[`asa_${s}`].rotation.y -= sg * (0.5 * sweep - 0.2 * open);
      }
      if (j[`vela_${s}`] && active) j[`vela_${s}`].rotation.y -= sg * 0.4 * sweep;
    }
  }
  if (j.mandibula && (rec.tipo === 'bite' || rec.tipo === 'roar' || rec.tipo === 'horn')) {
    const open = env(t, rel * 0.6, rel * 0.6, rel * 0.4);
    const shut = env(t, rel, rel * 0.3, 0.2);
    j.mandibula.rotation.x += 0.5 * open * (1 - shut) + (rec.tipo === 'roar' ? 0.5 * shut : 0);
  }
}
