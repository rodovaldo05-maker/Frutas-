// Catálogo oficial dos 64 golpes M1 (atualização 20; Prompt Mestre, seções 2 a 5).
// Quatro ataques básicos por fruta (M1-1 a M1-4), um por clique, com ficha técnica quadro a
// quadro: poses-chave por articulação, quadro de impacto, janela de colisão, hitstop,
// escalonamento de dano, alcance, efeito, som e reação do alvo. As poses usam o formato do
// laboratório (FRUTOMotion): deslocamento e descida do quadril, inclinação, giro e rolagem do
// tronco, e cada braço com elevação, abertura, rotação, flexão do cotovelo e rolagem do punho.
// Golpes de perna ainda guiam o tornozelo da perna do chute. Os clipes são registrados no
// FRUTOMotion na importação deste módulo; os efeitos saem do evento de impacto da animação.
// Só ataques básicos: as habilidades especiais das frutas não mudam.

import { FRUTOMotion } from '../animation/fruto-motion.js';

export const FPS = 60;

// Valores de referência do Prompt Mestre (seção 2), ajustados por peso da fruta
export const M1_BASE = {
  frames: [18, 20, 24, 30],
  impact: [7, 9, 12, 16],
  hitstop: [3, 4, 5, 7],
  damage: [0.85, 0.95, 1.05, 1.25],
  posture: [8, 10, 14, 22],
  knock: [0.6, 0.8, 1.2, 1.8], // metros
  reaction: ['leve', 'leve', 'media', 'pesada'],
};

// Regras do encadeamento (seção 2): buffer nos últimos 8 quadros, expira em 0,35 s;
// janela de continuação de 0,65 s depois da recuperação.
export const M1_RULES = { bufferFrames: 8, bufferExpire: 0.35, window: 0.65 };

// As 16 frutas oficiais (não adicionar, remover ou renomear)
export const FRUITS = ['impacto', 'brasa', 'geada', 'tormenta', 'lobo', 'eclipse', 'mare', 'cristal', 'eco', 'falcao', 'duna', 'ima', 'besta', 'fenix', 'oriental', 'ocidental'];

// Peso aparente: personagens grandes giram mais devagar (seção 3)
export const WEIGHT = {
  tormenta: 0.95, eco: 0.95, eclipse: 1, falcao: 1,
  impacto: 1.05, brasa: 1.05, geada: 1.05, lobo: 1.05, mare: 1.05, duna: 1.05, ima: 1.05, fenix: 1.05, oriental: 1.1,
  cristal: 1.15, besta: 1.2, ocidental: 1.25,
};

// Formas com variante híbrida (as formas completas ainda não existem no jogo)
export const HYBRID = { lobo: true, falcao: true, besta: true, fenix: true, oriental: true, ocidental: true };

// ===== Biblioteca de movimentos =====
// Cada tipo tem três poses autorais (preparo, contato, seguimento) com o lado ativo à
// esquerda (E); o lado D é espelhado. p = [desloc., descida, inclinação, giro, rolagem,
// braço E, braço D, base, avanço, olhar]; braço = [elevação, abertura, rotação, cotovelo, punho].
const K = {
  jab: {
    socket: 'punho', poses: [
      [-0.055, 0.13, 2, 19, -3, [8, 18, -7, 78, 4], [29, 10, 6, 71, 2], 0.12],
      [0.085, 0.2, 14, -27, 3, [70, 8, 1, 16, -5], [18, 15, 7, 86, 6], 0.21, 0.13, 1],
      [0.03, 0.13, 6, -8, 1, [42, 12, -3, 58, -2], [18, 15, 8, 78, 5], 0.15, 0.03],
    ],
  },
  cross: {
    socket: 'punho', poses: [
      [-0.11, 0.19, 7, 30, -6, [-12, 28, -19, 83, 10], [25, 12, 6, 76, -5], 0.19, -0.04],
      [0.105, 0.15, 14, -36, 5, [80, 7, -1, 8, -13], [13, 22, 5, 83, -4], 0.16, 0.15],
      [0.04, 0.14, 8, -12, 2, [45, 14, -3, 50, -6], [16, 18, 6, 78, -2], 0.15, 0.05],
    ],
  },
  uppercut: {
    socket: 'punho', effect: { hop: 4.5 }, poses: [
      [-0.06, 0.31, 18, 24, -6, [-8, 30, -12, 96, 4], [22, 14, 8, 76, 2], 0.24, -0.02, 6],
      [0.1, 0.1, -6, -32, 7, [112, 22, -24, 92, -18], [16, 18, 8, 84, 4], 0.22, 0.08, -8],
      [0.05, 0.14, 2, -14, 3, [70, 18, -12, 80, -8], [18, 16, 8, 78, 4], 0.18, 0.03],
    ],
  },
  hammer: {
    socket: 'punho', ground: true, poses: [
      [-0.04, 0.12, -8, 22, -4, [150, 26, -12, 78, 12], [24, 16, 8, 70, 2], 0.26, -0.04, -6],
      [0.06, 0.31, 27, -18, 6, [48, 14, -6, 22, -6], [30, 18, 10, 82, 4], 0.3, 0.16, 12],
      [0.03, 0.22, 12, -8, 2, [30, 16, -4, 50, -4], [22, 16, 8, 76, 4], 0.26, 0.06, 4],
    ],
  },
  thrust: {
    socket: 'palma', range: 0.1, poses: [
      [-0.1, 0.27, 6, 34, -7, [10, 24, -10, 118, 40], [30, 20, 8, 72, 2], 0.3, -0.06],
      [0.12, 0.29, 18, -30, 5, [82, 6, 0, 6, 60], [14, 24, 8, 90, 4], 0.32, 0.18, 2],
      [0.05, 0.2, 9, -12, 2, [50, 12, -2, 40, 30], [18, 18, 8, 80, 4], 0.26, 0.06],
    ],
  },
  palm: {
    socket: 'palma', poses: [
      [-0.05, 0.13, 3, 18, -3, [14, 20, -8, 96, 40], [28, 12, 6, 72, 2], 0.13],
      [0.08, 0.19, 13, -25, 3, [74, 8, 0, 8, 62], [18, 16, 8, 84, 6], 0.2, 0.13],
      [0.03, 0.13, 6, -8, 1, [44, 12, -2, 52, 30], [18, 15, 8, 78, 5], 0.15, 0.03],
    ],
  },
  elbow: {
    socket: 'punho', range: -0.25, poses: [
      [-0.07, 0.16, 6, 32, -5, [48, 38, -22, 118, 6], [22, 16, 8, 80, 4], 0.18, -0.02],
      [0.09, 0.18, 12, -42, 6, [86, 58, -62, 138, -18], [16, 20, 8, 90, 6], 0.2, 0.1],
      [0.04, 0.15, 7, -16, 2, [60, 40, -30, 110, -6], [18, 16, 8, 80, 4], 0.17, 0.04],
    ],
  },
  roundKick: {
    socket: 'apoio', range: 0.25, arc: 0.2, legs: true,
    kick: [[0.5, 0.05, 0.7, 0.35, -0.2], [1, 0.32, 1.05, 1.3, -0.55], [1.25, -0.08, 1.0, 1.25, -0.5], [1.7, 0.05, 0.35, 0.3, -0.1]],
    poses: [
      [-0.03, 0.1, -4, 16, -6, [24, 14, -8, 92, 0], [22, 16, 8, 96, 6], 0.14, -0.02],
      [0.04, 0.08, -14, -34, -10, [34, 30, -8, 70, 0], [18, 20, 8, 100, 6], 0.12, 0],
      [0.02, 0.1, -2, -10, -2, [22, 14, -6, 80, 0], [18, 16, 8, 86, 6], 0.12, 0],
    ],
  },
  frontKick: {
    socket: 'apoio', range: 0.3, legs: true,
    kick: [[0.5, 0, 0.75, 0.35, -0.2], [1, 0.02, 1.0, 1.35, -0.6], [1.25, 0.02, 0.95, 1.3, -0.55], [1.7, 0, 0.35, 0.3, -0.1]],
    poses: [
      [0, 0.1, -6, 10, -4, [26, 18, -8, 90, 0], [22, 16, 8, 96, 6], 0.13, -0.04],
      [0.02, 0.1, -16, -10, -6, [30, 34, -8, 74, 0], [24, 22, 8, 96, 6], 0.12, -0.02],
      [0.01, 0.1, -3, -4, -2, [22, 16, -6, 82, 0], [18, 16, 8, 86, 6], 0.12, 0],
    ],
  },
  sweep: {
    socket: 'apoio', range: 0.2, arc: -0.2, legs: true, low: true,
    kick: [[0.5, 0.25, 0.05, -0.1, 0], [1, 0.55, 0.05, 0.75, -0.3], [1.25, -0.05, 0.05, 0.8, -0.3], [1.7, 0.05, 0.05, 0.2, 0]],
    poses: [
      [-0.04, 0.34, 12, 22, -6, [30, 30, -10, 70, 0], [10, 30, 10, 70, 4], 0.26, -0.04],
      [0.02, 0.5, 18, -40, -6, [30, 40, -10, 60, 0], [-10, 30, 10, 60, 4], 0.28, 0],
      [0.02, 0.3, 10, -16, -2, [24, 24, -6, 70, 0], [14, 22, 8, 74, 4], 0.22, 0],
    ],
  },
  airKick: {
    socket: 'apoio', range: 0.25, legs: true, hop: true,
    kick: [[0.5, 0, 0.8, 0.3, -0.2], [1, 0.05, 1.2, 1.3, -0.6], [1.25, 0.05, 1.1, 1.25, -0.55], [1.7, 0, 0.4, 0.3, -0.1]],
    poses: [
      [0, 0.34, 8, 10, -4, [40, 40, -6, 70, 0], [40, 40, 6, 70, 0], 0.18, -0.04],
      [0.02, -0.16, -14, -14, -6, [60, 62, -6, 30, 0], [60, 62, 6, 30, 0], 0.12, 0.08],
      [0.01, 0.16, 2, -6, -2, [30, 30, -4, 66, 0], [30, 30, 4, 66, 0], 0.14, 0.02],
    ],
  },
  claw: {
    socket: 'palma', poses: [
      [-0.06, 0.17, 2, 24, -6, [132, 38, -18, 62, 24], [24, 16, 8, 74, 4], 0.18, -0.02, -4],
      [0.1, 0.27, 24, -34, 8, [44, 26, -44, 28, -34], [22, 18, 8, 80, 4], 0.24, 0.13, 8],
      [0.04, 0.2, 12, -14, 3, [30, 20, -20, 50, -14], [20, 16, 8, 78, 4], 0.2, 0.05, 2],
    ],
  },
  lowClaw: {
    socket: 'palma', low: true, poses: [
      [-0.06, 0.34, 20, 26, -6, [70, 40, -10, 70, 24], [20, 24, 8, 80, 4], 0.26, -0.04, -12],
      [0.1, 0.4, 32, -36, 8, [30, 30, -46, 20, -34], [12, 26, 8, 84, 4], 0.3, 0.16, -10],
      [0.04, 0.3, 18, -14, 3, [26, 22, -20, 56, -14], [16, 20, 8, 80, 4], 0.24, 0.06, -4],
    ],
  },
  bite: {
    socket: 'boca', range: -0.15, poses: [
      [-0.02, 0.18, 6, 8, 0, [26, 36, 8, 72, 0], [26, 36, -8, 72, 0], 0.18, -0.06, 14],
      [0, 0.22, 30, 0, 0, [34, 44, 10, 64, 0], [34, 44, -10, 64, 0], 0.22, 0.2, -22],
      [0, 0.16, 10, 2, 0, [22, 30, 4, 70, 0], [22, 30, -4, 70, 0], 0.18, 0.03, -4],
    ],
  },
  leap: {
    socket: 'palmas', lunge: 0.9, both: true, hop: true, poses: [
      [0, 0.42, 26, 0, 0, [-14, 30, -6, 70, 0], [-14, 30, 6, 70, 0], 0.26, -0.06, -10],
      [0, -0.1, 24, 0, 0, [96, 22, -14, 30, -18], [96, 22, 14, 30, 18], 0.24, 0.26, -12],
      [0, 0.22, 12, 0, 0, [40, 20, -6, 56, -6], [40, 20, 6, 56, 6], 0.22, 0.06, -2],
    ],
  },
  slashSmall: {
    socket: 'palma', poses: [
      [-0.04, 0.12, 4, 14, -3, [44, 34, 22, 60, 30], [22, 16, 8, 80, 4], 0.14],
      [0.06, 0.15, 10, -22, 4, [72, 20, -38, 30, -46], [18, 16, 8, 82, 6], 0.18, 0.1],
      [0.03, 0.12, 6, -8, 1, [50, 16, -14, 50, -14], [18, 15, 8, 78, 5], 0.15, 0.03],
    ],
  },
  step: {
    socket: 'punho', lunge: 1.0, range: 0.2, poses: [
      [-0.06, 0.24, 16, 20, -4, [10, 22, -6, 88, 4], [26, 12, 6, 72, 2], 0.3, -0.08],
      [0.09, 0.21, 20, -30, 4, [76, 7, 1, 12, -6], [16, 18, 7, 88, 6], 0.3, 0.24, 2],
      [0.04, 0.15, 9, -10, 1, [42, 12, -3, 58, -2], [18, 15, 8, 78, 5], 0.2, 0.06],
    ],
  },
  reverse: {
    socket: 'punho', poses: [
      [0.06, 0.14, 8, -26, 4, [60, 10, 0, 30, -4], [20, 16, 8, 80, 4], 0.16, 0.05],
      [-0.1, 0.17, 10, 40, -6, [78, 64, 46, 22, 34], [24, 18, 8, 84, 4], 0.18, 0.08],
      [-0.04, 0.13, 6, 16, -2, [48, 40, 20, 50, 16], [20, 16, 8, 78, 4], 0.15, 0.03],
    ],
  },
  converge: {
    socket: 'palmas', both: true, range: 0.1, poses: [
      [0, 0.26, -2, 0, 0, [30, 46, 24, 112, 30], [30, 46, -24, 112, -30], 0.24, -0.06],
      [0, 0.24, 16, 0, 0, [82, 10, -6, 10, 40], [82, 10, 6, 10, -40], 0.26, 0.18],
      [0, 0.18, 8, 0, 0, [50, 20, 0, 50, 20], [50, 20, 0, 50, -20], 0.2, 0.05],
    ],
  },
  rising: {
    socket: 'palmas', both: true, effect: { hop: 5 }, poses: [
      [0, 0.42, 22, 0, 0, [-10, 24, -4, 70, 0], [-10, 24, 4, 70, 0], 0.26, -0.04, -6],
      [0, -0.04, -12, 0, 0, [158, 20, -6, 26, -6], [158, 20, 6, 26, 6], 0.2, 0.06, 8],
      [0, 0.14, 2, 0, 0, [80, 20, -4, 50, 0], [80, 20, 4, 50, 0], 0.18, 0.02],
    ],
  },
  shield: {
    socket: 'palmas', both: true, lunge: 0.6, poses: [
      [-0.02, 0.2, 8, 10, 0, [64, 18, -34, 104, -30], [64, 18, 34, 104, 30], 0.22, -0.06],
      [0, 0.18, 18, -4, 0, [78, 8, -36, 98, -30], [78, 8, 36, 98, 30], 0.3, 0.26],
      [0, 0.15, 9, 0, 0, [56, 14, -24, 96, -20], [56, 14, 24, 96, 20], 0.22, 0.06],
    ],
  },
  ground: {
    socket: 'punho', ground: true, arc: -0.1, poses: [
      [-0.03, 0.14, -6, 18, -4, [148, 26, -10, 82, 10], [26, 16, 8, 72, 2], 0.28, -0.04],
      [0.06, 0.52, 48, -16, 6, [34, 10, -4, 8, -4], [-8, 32, 10, 60, 4], 0.36, 0.18, 14],
      [0.03, 0.34, 26, -8, 2, [24, 14, -4, 40, -4], [14, 22, 8, 70, 4], 0.3, 0.08, 6],
    ],
  },
  pull: {
    socket: 'punho', strikeOther: true, effect: { pullIn: true }, poses: [
      [0.04, 0.14, 8, -20, 3, [82, 8, 0, 8, -4], [24, 14, 8, 84, 4], 0.17, 0.07],
      [-0.1, 0.16, 14, 32, -5, [30, 24, -6, 120, 4], [80, 7, 1, 8, 13], 0.17, 0.14],
      [-0.04, 0.13, 7, 12, -2, [24, 18, -6, 90, 2], [44, 14, 4, 50, 8], 0.15, 0.04],
    ],
  },
  wing: {
    socket: 'palma', arc: 0.1, appendage: 'asas', poses: [
      [-0.05, 0.12, 2, 30, -6, [88, 84, 44, 14, 10], [22, 16, 8, 80, 4], 0.16, -0.02],
      [0.08, 0.16, 12, -38, 6, [86, 18, -58, 16, -22], [20, 18, 8, 84, 4], 0.2, 0.1],
      [0.04, 0.14, 7, -16, 2, [60, 30, -30, 40, -10], [18, 16, 8, 80, 4], 0.17, 0.04],
    ],
  },
  dive: {
    socket: 'palmas', both: true, lunge: 0.8, hop: true, appendage: 'asas', poses: [
      [0, -0.16, -10, 0, 0, [160, 30, -6, 36, 0], [160, 30, 6, 36, 0], 0.16, -0.04, 8],
      [0, 0.36, 36, 0, 0, [62, 20, -10, 22, -10], [62, 20, 10, 22, 10], 0.26, 0.22, -14],
      [0, 0.22, 16, 0, 0, [38, 20, -6, 52, -4], [38, 20, 6, 52, 4], 0.22, 0.06, -2],
    ],
  },
  spin: {
    socket: 'palmas', both: true, arc: -1, range: 0.1, appendage: 'asas', poses: [
      [-0.04, 0.18, 6, 60, -4, [78, 72, 10, 14, 0], [78, 72, -10, 14, 0], 0.24, -0.02],
      [0.04, 0.2, 8, -80, 6, [84, 74, -10, 12, 0], [84, 74, 10, 12, 0], 0.24, 0.04],
      [0.02, 0.16, 6, -30, 2, [50, 40, -6, 40, 0], [50, 40, 6, 40, 0], 0.2, 0.02],
    ],
  },
  tail: {
    socket: 'palma', arc: -0.3, range: 0.2, appendage: 'cauda', poses: [
      [0.06, 0.2, 8, 52, 4, [30, 40, 8, 70, 6], [30, 40, -8, 70, -6], 0.24, -0.02],
      [-0.08, 0.22, 12, -68, -6, [48, 62, -30, 40, -12], [40, 52, 20, 56, 10], 0.26, 0.02],
      [-0.03, 0.17, 7, -24, -2, [30, 34, -10, 60, -4], [26, 30, 8, 70, 4], 0.2, 0.02],
    ],
  },
  horn: {
    socket: 'boca', effect: { hop: 5 }, appendage: 'chifres', poses: [
      [0, 0.34, 34, 4, 0, [-6, 34, -4, 64, 0], [-6, 34, 4, 64, 0], 0.26, -0.02, 26],
      [0, 0.08, -14, -4, 0, [20, 40, -6, 60, 0], [20, 40, 6, 60, 0], 0.22, 0.14, -22],
      [0, 0.15, 4, 0, 0, [16, 28, -4, 66, 0], [16, 28, 4, 66, 0], 0.18, 0.04, 4],
    ],
  },
  charge: {
    socket: 'peito', lunge: 1.3, range: 0.2, poses: [
      [-0.06, 0.26, 16, 24, -4, [10, 24, -20, 80, 6], [30, 10, 6, 96, 14], 0.3, -0.08],
      [-0.09, 0.23, 29, 31, -5, [-5, 24, -24, 72, 8], [36, 7, 4, 107, 18], 0.3, 0.24],
      [-0.04, 0.17, 12, 12, -2, [16, 20, -10, 76, 4], [24, 12, 6, 84, 8], 0.22, 0.06],
    ],
  },
  rush: {
    socket: 'punho', lunge: 1.2, range: 0.3, poses: [
      [-0.08, 0.3, 26, 26, -5, [0, 26, -10, 100, 6], [30, 14, 6, 80, 4], 0.32, -0.08],
      [0.1, 0.24, 28, -32, 5, [80, 7, 0, 10, -6], [20, 20, 8, 90, 6], 0.32, 0.28],
      [0.04, 0.17, 12, -12, 2, [44, 12, -3, 56, -2], [18, 16, 8, 80, 4], 0.22, 0.06],
    ],
  },
  roar: {
    socket: 'boca', arc: 0.1, range: 0.15, poses: [
      [0, 0.18, -6, 0, 0, [30, 30, -6, 80, 0], [30, 30, 6, 80, 0], 0.2, -0.04, 10],
      [0, 0.16, 16, 0, 0, [40, 66, 14, 40, -10], [40, 66, -14, 40, 10], 0.24, 0.12, -26],
      [0, 0.14, 6, 0, 0, [24, 30, -4, 70, 0], [24, 30, 4, 70, 0], 0.18, 0.02, -4],
    ],
  },
  slam: {
    socket: 'palmas', both: true, ground: true, arc: -0.2, poses: [
      [0, 0.08, -12, 0, 0, [160, 20, -4, 60, 0], [160, 20, 4, 60, 0], 0.24, -0.04, -8],
      [0, 0.5, 44, 0, 0, [40, 16, -6, 14, 0], [40, 16, 6, 14, 0], 0.34, 0.2, 16],
      [0, 0.32, 22, 0, 0, [26, 18, -4, 44, 0], [26, 18, 4, 44, 0], 0.3, 0.06, 6],
    ],
  },
};
export const KINDS = K;

// ===== Catálogo (seção 4): [nome, tipo, lado ativo, efeito, som] por fruta =====
export const CATALOG = {
  impacto: { estilo: 'Punho Cinético', golpes: [
    ['Jab de Pressão', 'jab', 'E', 'onda'], ['Cruzado Cinético', 'cross', 'D', 'pulso'],
    ['Gancho Ascendente', 'uppercut', 'E', 'choque'], ['Martelo Cinético', 'hammer', 'D', 'anel']] },
  brasa: { estilo: 'Chama Marcial', golpes: [
    ['Punho de Ignição', 'jab', 'E', 'chama'], ['Cotovelada Flamejante', 'elbow', 'D', 'explosao'],
    ['Chute Solar', 'roundKick', 'D', 'arco_fogo'], ['Explosão de Brasa', 'thrust', 'E', 'clarao']] },
  geada: { estilo: 'Punho do Inverno', golpes: [
    ['Palma Congelante', 'palm', 'E', 'cristais'], ['Cotovelo de Gelo', 'elbow', 'D', 'gelo'],
    ['Varredura Glacial', 'sweep', 'E', 'geada'], ['Martelo Glacial', 'hammer', 'D', 'estilhacos']] },
  tormenta: { estilo: 'Passo do Relâmpago', golpes: [
    ['Estalo Elétrico', 'jab', 'E', 'faiscas'], ['Passo Relâmpago', 'step', 'D', 'rastro'],
    ['Chute de Descarga', 'roundKick', 'E', 'descarga'], ['Investida Fulminante', 'rush', 'D', 'arco']] },
  lobo: { estilo: 'Predador Lunar', golpes: [
    ['Garra Rasteira', 'lowClaw', 'E', 'garras'], ['Garra Cruzada', 'claw', 'D', 'garras'],
    ['Mordida Predatória', 'bite', 'E', 'mordida'], ['Salto do Caçador', 'leap', 'E', 'garras_duplas']] },
  eclipse: { estilo: 'Dança do Vazio', golpes: [
    ['Corte Espacial', 'slashSmall', 'E', 'distorcao'], ['Passo Dimensional', 'step', 'D', 'sombra'],
    ['Golpe Reverso', 'reverse', 'E', 'sombra'], ['Ruptura do Eclipse', 'converge', 'E', 'ruptura']] },
  mare: { estilo: 'Fluxo Oceânico', golpes: [
    ['Palma da Corrente', 'palm', 'E', 'fita'], ['Cotovelo da Onda', 'elbow', 'D', 'crista'],
    ['Varredura Aquática', 'sweep', 'D', 'agua'], ['Maré Ascendente', 'rising', 'E', 'onda_mare']] },
  cristal: { estilo: 'Guardião Prismático', golpes: [
    ['Punho Prismático', 'jab', 'E', 'prisma'], ['Cotovelo Cristalino', 'elbow', 'D', 'cristais_rosa'],
    ['Escudo de Impacto', 'shield', 'E', 'escudo'], ['Coluna Cristalina', 'ground', 'D', 'coluna']] },
  eco: { estilo: 'Ritmo Ressonante', golpes: [
    ['Palma Sonora', 'palm', 'E', 'som'], ['Cotovelo Rítmico', 'elbow', 'D', 'som'],
    ['Chute de Frequência', 'roundKick', 'D', 'vibracao'], ['Pulso Harmônico', 'thrust', 'E', 'aneis']] },
  falcao: { estilo: 'Garras do Céu', golpes: [
    ['Garra Descendente', 'claw', 'E', 'vento'], ['Corte de Asa', 'wing', 'D', 'vento'],
    ['Chute Aéreo', 'airKick', 'E', 'vento'], ['Mergulho Predatório', 'dive', 'E', 'garras_ar']] },
  duna: { estilo: 'Dança das Areias', golpes: [
    ['Palma Arenosa', 'palm', 'E', 'areia'], ['Varredura de Duna', 'sweep', 'D', 'faixa_areia'],
    ['Passo Subterrâneo', 'step', 'E', 'areia'], ['Redemoinho Cortante', 'spin', 'E', 'anel_areia']] },
  ima: { estilo: 'Polaridade Marcial', golpes: [
    ['Repulsão Magnética', 'palm', 'E', 'repulsao'], ['Atração Forçada', 'pull', 'E', 'atracao'],
    ['Cotovelo Metálico', 'elbow', 'E', 'placas'], ['Martelo de Sucata', 'hammer', 'D', 'sucata']] },
  besta: { estilo: 'Fúria Primordial', golpes: [
    ['Garra Brutal', 'claw', 'D', 'poeira'], ['Golpe de Cauda', 'tail', 'E', 'cauda'],
    ['Chifrada Ascendente', 'horn', 'E', 'chifres'], ['Investida da Besta', 'charge', 'D', 'massa']] },
  fenix: { estilo: 'Dança do Renascimento', golpes: [
    ['Corte de Asa', 'wing', 'E', 'penas'], ['Chute Flamejante', 'frontKick', 'D', 'fogo_azul'],
    ['Giro de Penas', 'spin', 'E', 'penas_giro'], ['Ascensão Flamejante', 'rising', 'E', 'explosao_azul']] },
  oriental: { estilo: 'Serpente Celestial', golpes: [
    ['Garra Celestial', 'claw', 'E', 'nuvem'], ['Chicote de Cauda', 'tail', 'D', 'cauda_raio'],
    ['Investida das Nuvens', 'rush', 'E', 'nuvem'], ['Rugido da Tempestade', 'roar', 'E', 'rugido']] },
  ocidental: { estilo: 'Colosso Dracônico', golpes: [
    ['Garra do Colosso', 'claw', 'D', 'poeira'], ['Mordida Dracônica', 'bite', 'E', 'mordida_fogo'],
    ['Chicote de Cauda', 'tail', 'E', 'cauda'], ['Esmagamento Dracônico', 'slam', 'E', 'esmagamento']] },
};

// som do contato por tipo de golpe (banco de sons do jogo: impacto/acerto e base/swing)
const SFX = { punho: 'soco', palma: 'palma', apoio: 'chute', palmas: 'duplo', boca: 'mordida', peito: 'investida' };

// ===== Montagem das fichas =====
const mirrorArm = (a) => [a[0], a[1], -a[2], a[3], -a[4]];
function mirror(p) {
  return [-p[0], p[1], p[2], -p[3], -p[4], mirrorArm(p[6]), mirrorArm(p[5]), p[7], p[8] ?? 0, p[9] ?? 0];
}
const lerpPose = (a, b, u) => a.map((v, i) => (Array.isArray(v) ? v.map((x, k) => x + (b[i][k] - x) * u) : v + ((b[i] ?? 0) - v) * u));
const full = (p) => [p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7] ?? 0.09, p[8] ?? 0, p[9] ?? 0];
// forma híbrida: base mais baixa e larga, tronco projetado e mãos mais abertas (garras)
function hybridPose(p) {
  const q = full(p);
  return [q[0], q[1] + 0.04, q[2] + 4, q[3], q[4], [q[5][0], q[5][1] + 6, q[5][2], q[5][3], q[5][4]], [q[6][0], q[6][1] + 6, q[6][2], q[6][3], q[6][4]], q[7] + 0.03, q[8], q[9]];
}

const r1 = (v) => Math.round(v * 10) / 10;
// Tabela por articulação (graus), com as mesmas fórmulas do aplicador do laboratório
function joints(p, kick) {
  const [shift, drop, lean, twist, tilt, L, R, stance, forward, look] = full(p);
  const arm = (a) => ({ elevacao: a[0], abertura: a[1], rotacao: a[2], cotovelo: a[3], punho: a[4] });
  const out = {
    quadril: { lateral: shift, descida: drop, inclinacao: r1(lean * 0.24), giro: r1(twist * 0.38), rolagem: r1(-tilt * 0.38) },
    tronco: { inclinacao: r1(lean * 0.76), giro: r1(twist * 0.62), rolagem: r1(-tilt * 0.62) },
    cabeca: { inclinacao: r1(look - lean * 0.44), giro: r1(-twist * 0.6), rolagem: r1(tilt * 0.48) },
    ombro_E: { elevacao: r1(L[0] * 0.15), giro: r1(L[2] * 0.22), abertura: r1(5 + L[1] * 0.25) },
    braco_E: arm(L), ombro_D: { elevacao: r1(R[0] * 0.15), giro: r1(R[2] * 0.22), abertura: r1(5 + R[1] * 0.25) }, braco_D: arm(R),
    pernas: { base: stance, avanco: forward, joelhos: r1(20 + drop * 120) },
  };
  if (kick) out.chute = { perna: kick.side, lateral: kick.o[0], altura: kick.o[1], frente: kick.o[2], pe: kick.o[3] };
  return out;
}

function sampleKick(keys, t) {
  let i = 1;
  while (i < keys.length - 1 && t > keys[i][0]) i++;
  const a = keys[i - 1];
  const b = keys[i];
  const u = Math.max(0, Math.min(1, (t - a[0]) / Math.max(1e-4, b[0] - a[0])));
  const s = u * u * (3 - 2 * u);
  return [1, 2, 3, 4].map((k) => Math.round(((a[k] ?? 0) + ((b[k] ?? 0) - (a[k] ?? 0)) * s) * 100) / 100);
}

export const m1Id = (fruit, step) => `${fruit}_m1_${step}`;

function buildRecord(fruit, step) {
  const [nome, kindId, side, vfx] = CATALOG[fruit].golpes[step - 1];
  const kind = K[kindId];
  const i = step - 1;
  const w = WEIGHT[fruit] ?? 1;
  const frames = Math.round(M1_BASE.frames[i] * w);
  const impact = Math.round(M1_BASE.impact[i] * w);
  const active = Math.max(2, Math.round(3 * w));
  const hitstop = Math.round(M1_BASE.hitstop[i] * (w > 1.1 ? 1.15 : 1));
  const prepEnd = Math.max(2, Math.round(impact * 0.45));
  const follow = impact + active + Math.round((frames - impact - active) * 0.45);
  const phases = {
    preparacao: [0, prepEnd], aceleracao: [prepEnd + 1, impact - 1], colisao: [impact, impact + active - 1],
    seguimento: [impact + active, follow], recuperacao: [follow + 1, frames],
  };
  const flip = side === 'D';
  const [load, hit, fol] = kind.poses.map((p) => full(flip ? mirror(full(p)) : p));
  const carry = lerpPose(hit, fol, 0.28);
  const id = m1Id(fruit, step);
  const names = { load: `${id}:preparo`, hit: `${id}:contato`, carry: `${id}:seguimento`, follow: `${id}:recuperacao` };
  // chaves em quadros; o clipe guarda em segundos (60 quadros por segundo)
  const keyFrames = [
    [0, 'guard'], [prepEnd, names.load], [impact, names.hit], [impact + active, names.carry], [follow, names.follow], [frames, 'guard'],
  ];
  const kickSide = kind.legs ? side : null;
  const otherSide = side === 'E' ? 'D' : 'E';
  // chute: as chaves do tipo são relativas ao quadro de impacto (1 = impacto)
  const kick = kind.kick
    ? { side: kickSide, keys: [[0, 0, 0, 0, 0], ...kind.kick.map(([f, x, y, z, roll]) => [Math.min(frames - 1, Math.round(f * impact)) / FPS, x, y, z, roll]), [frames / FPS, 0, 0, 0, 0]] }
    : null;
  const poseOf = { guard: null, [names.load]: load, [names.hit]: hit, [names.carry]: carry, [names.follow]: fol };
  const keyframes = keyFrames.map(([f, n]) => {
    const p = n === 'guard' ? [0, 0.095, 4, 5, 0, [19, 12, -7, 59, -4], [15, 15, 9, 71, 6], 0.09, 0, 0] : poseOf[n];
    const k = kick ? { side: kick.side, o: sampleKick(kick.keys, f / FPS) } : null;
    return { quadro: f, pose: n === 'guard' ? 'guarda' : n.split(':')[1], articulacoes: joints(p, k) };
  });
  const activeHand = kind.both ? 'ambas' : kind.strikeOther ? otherSide : side;
  const socket = kind.socket === 'palmas' || kind.socket === 'boca' || kind.socket === 'peito' ? kind.socket : `${kind.socket}_${kind.socket === 'apoio' ? kickSide ?? side : activeHand}`;
  const appendage = kind.appendage ?? (/(garra|claw)/i.test(kindId) ? 'garras' : kindId === 'bite' ? 'mandibula' : null);
  return {
    id, fruta: fruit, passo: step, nome, estilo: CATALOG[fruit].estilo, tipo: kindId, lado: side,
    formas: HYBRID[fruit] ? ['humana', 'hibrida'] : ['humana'],
    quadros: frames, impacto: impact, ativos: active, hitstop, dano: M1_BASE.damage[i],
    fases: phases, keyframes, chute: kick ? { perna: kick.side } : null,
    hitbox: { alcance: Math.round((1.5 + (kind.range ?? 0)) * 100) / 100, arco: kind.arc ?? 0.45, baixo: !!kind.low, solo: !!kind.ground, socket },
    avanco: kind.lunge ?? 0.35,
    vfx, sfx: SFX[kind.socket] ?? 'soco',
    reacao: M1_BASE.reaction[i], efeito: kind.effect ?? null,
    apendice: HYBRID[fruit] ? appendage : null,
    janelaProximo: [Math.max(0, frames - M1_RULES.bufferFrames), frames],
    transicao: step < 4 ? `M1-${step + 1} (janela de ${M1_RULES.window} s)` : 'M1-1 (reinício)',
    _poses: { [names.load]: load, [names.hit]: hit, [names.carry]: carry, [names.follow]: fol },
    _keys: keyFrames, _kick: kick,
  };
}

export const M1 = {};
for (const f of FRUITS) for (let s = 1; s <= 4; s++) M1[m1Id(f, s)] = buildRecord(f, s);
export const M1_IDS = Object.keys(M1);
export const m1Of = (fruit) => [1, 2, 3, 4].map((s) => M1[m1Id(fruit, s)]).filter(Boolean);

// ===== Registro dos clipes no FRUTOMotion =====
// Clipe humano: `fruta_m1_n`; variante híbrida (frutas de fera): `fruta_m1_n_h`, com o mesmo
// tempo (o impacto continua no mesmo quadro) e poses de base mais baixa e garras abertas.
function register(rec, hybrid) {
  const poses = {};
  const rename = (n) => (n === 'guard' ? n : hybrid ? `${n}:h` : n);
  for (const [n, p] of Object.entries(rec._poses)) poses[rename(n)] = hybrid ? hybridPose(p) : p;
  const release = rec.impacto / FPS;
  const def = {
    id: hybrid ? `${rec.id}_h` : rec.id,
    label: rec.nome, release, duration: rec.quadros / FPS, active: rec.ativos / FPS,
    socket: rec.hitbox.socket, hand: rec.lado, m1: rec.passo,
    settle: rec.fases.seguimento[1] / FPS,
    keys: rec._keys.map(([f, n]) => [f / FPS, rename(n)]),
    poses,
  };
  if (rec._kick) def.kick = rec._kick;
  FRUTOMotion.define(def);
}
for (const rec of Object.values(M1)) {
  register(rec, false);
  if (HYBRID[rec.fruta]) register(rec, true);
}

// Ficha pública (sem os campos internos de montagem)
export function sheet(id) {
  const r = M1[id];
  if (!r) return null;
  const { _poses, _keys, _kick, ...pub } = r;
  return pub;
}
