// Poderes das frutas (atualização 3): três habilidades por fruta com forma de jogo real.
// Nome, custo de energia, recarga e dano vêm do laboratório (DATA.fruits[].moves); aqui
// fica o formato de cada uma (projétil, investida, área, faixa, cone...), em unidades do
// mundo (1 m ≈ 2,2), e o clipe do laboratório que anima o gesto.
// Frutas com transformação (Lobo, Falcão e as quatro míticas) usam por enquanto as
// habilidades sem transformação (moves 3 e 4); as formas chegam na atualização 13.

import { FRUTOMotion } from '../animation/fruto-motion.js';

// Clipe de reserva por formato (frutas sem gesto próprio no laboratório)
const FALLBACK = {
  projetil: 'brasa0', investida: 'tormenta1', area: 'cristal1', alvo: 'geada2', faixa: 'impacto2',
  cone: 'mare0', parede: 'geada1', teleporte: 'eclipse1', cadeia: 'tormenta0', pilares: 'brasa2',
};

// [índice do move no laboratório, formato, parâmetros]
const SHAPES = {
  impacto: [[0, 'projetil', { speed: 22, range: 7, push: 5 }], [1, 'investida', { distance: 8, push: 4 }], [2, 'faixa', { length: 10, halfWidth: 1.6, launch: 0.9 }]],
  brasa: [[0, 'projetil', { speed: 18, range: 14, explode: 2.6, burn: 2 }], [1, 'investida', { distance: 9, burn: 3 }], [2, 'pilares', { radius: 11, pillar: 1.9, delay: 0.2, launch: 0.6, burn: 2 }]],
  geada: [[0, 'faixa', { length: 12, halfWidth: 1.1, freeze: 2 }], [1, 'parede', { duration: 4 }], [2, 'area', { radius: 5.5, freeze: 3 }]],
  tormenta: [[0, 'cadeia', { range: 12, jumps: 3, jumpRange: 8 }], [1, 'investida', { distance: 11 }], [2, 'alvo', { range: 14, radius: 3.2, delay: 0.35, pulses: 3, interval: 0.35 }]],
  lobo: [[0, 'cone', { range: 5, angle: 70 }], [3, 'cone', { range: 8, angle: 80, push: 6 }], [4, 'investida', { distance: 11 }]],
  eclipse: [[0, 'projetil', { speed: 14, range: 14, explode: 3, pull: true }], [1, 'teleporte', { range: 14 }], [2, 'alvo', { range: 12, radius: 4.5, pulses: 5, interval: 0.5, pull: true }]],
  mare: [[0, 'faixa', { length: 13, halfWidth: 3.2, push: 5, launch: 0.5, travel: true }], [1, 'cone', { range: 10, angle: 60, pull: true }], [2, 'alvo', { range: 10, radius: 4.2, pulses: 4, interval: 0.45, pull: true }]],
  cristal: [[0, 'projetil', { speed: 26, range: 16 }], [1, 'area', { radius: 4, freeze: 1.2 }], [2, 'alvo', { range: 9, radius: 3.2, delay: 0.8 }]],
  eco: [[0, 'cone', { range: 9, angle: 60, mark: 3.2 }], [1, 'faixa', { length: 12, halfWidth: 1.4, pulses: 3, interval: 0.25, travel: true }], [2, 'area', { radius: 7, markBonus: true }]],
  falcao: [[0, 'projetil', { speed: 24, range: 16 }], [3, 'faixa', { length: 12, halfWidth: 1.2, travel: true }], [4, 'area', { radius: 4.5, launch: 0.9 }]],
  duna: [[0, 'projetil', { speed: 26, range: 15 }], [1, 'investida', { distance: 10 }], [2, 'alvo', { range: 10, radius: 4.6, pulses: 5, interval: 0.4, pull: true, launchLast: 0.8 }]],
  ima: [[0, 'cone', { range: 9, angle: 70, pull: true }], [1, 'area', { radius: 5, push: 7 }], [2, 'alvo', { range: 9, radius: 4, pulses: 3, interval: 0.4, pull: true }]],
  besta: [[0, 'cone', { range: 5, angle: 60, launch: 0.6 }], [3, 'cone', { range: 8, angle: 80, push: 6 }], [4, 'area', { radius: 5, launch: 0.9 }]],
  fenix: [[0, 'projetil', { speed: 22, range: 15, burn: 2 }], [3, 'cone', { range: 8, angle: 90 }], [4, 'area', { radius: 5, heal: 24, burn: 2 }]],
  oriental: [[0, 'faixa', { length: 14, halfWidth: 1.0, travel: true }], [3, 'alvo', { range: 10, radius: 3.5, pulses: 3, interval: 0.4, pull: true }], [4, 'alvo', { range: 12, radius: 3, delay: 0.5 }]],
  ocidental: [[0, 'cone', { range: 8, angle: 60, burn: 2 }], [3, 'area', { radius: 4.5, push: 6 }], [4, 'alvo', { range: 12, radius: 3.5, delay: 0.7, burn: 2 }]],
};

// Domínio necessário para cada habilidade (equivale a 0, 25 e 75 de 600 na ficha da fruta)
export const UNLOCK = [1, 41, 121]; // maestria 1–1000 (atualização 23; antes 1, 5 e 13)
export const AWAKEN_LEVEL = 59; // despertar (atualização 13)

// As três habilidades de uma fruta do laboratório, prontas para o jogo
export function powersOf(fruit) {
  const shapes = SHAPES[fruit?.id];
  if (!shapes) return [];
  return shapes.map(([index, kind, params], slot) => {
    const m = fruit.moves[index];
    const own = `${fruit.id}${index}`;
    const clip = index <= 2 && FRUTOMotion.clips[own] && !(fruit.forms && index > 0) ? own : FALLBACK[kind];
    return {
      slot, index, kind, params, clip, fruit: fruit.id, color: fruit.color,
      nome: m.name, curto: m.short || m.name, detalhe: m.detail,
      custo: m.cost, recarga: m.cd, dano: m.damage, unlock: UNLOCK[slot],
    };
  });
}

export const SHAPE_IDS = Object.keys(SHAPES);
