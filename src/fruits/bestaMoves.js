// Gestos próprios das habilidades da Besta (versão 0.27.5). Antes a Besta usava gestos de
// reserva de outras frutas (a palma da Maré e o carimbo do Cristal). Agora:
//   Presa de Marfim  — abaixa a cabeça com os chifres apontados, investe e joga a cabeça para
//                      cima (chifrada que levanta), braços para trás no embalo.
//   Rugido Carmesim  — enche o peito inclinando para trás, depois avança o tronco com os braços
//                      bem abertos em garra e a base larga; treme no fim do rugido.
//   Pisão da Besta   — sobe na ponta de um pé com a outra perna erguida bem alto e os braços
//                      acima da cabeça, e desce tudo de uma vez num agachamento fundo.
// Nas formas híbrida e completa, a forma usa a animação do laboratório da própria Besta
// (lobo0, lobo3 e lobo4: Presa de Marfim, Rugido Carmesim e Pisão da Besta), com o tempo
// ajustado para o impacto cair no mesmo instante (sourceId + remapeamento em forms.js).

import { FRUTOMotion } from '../animation/fruto-motion.js';

// pose: [deslocamento lateral, descida, inclinação, giro, rolagem, braço E, braço D, base, avanço, olhar]
// braço: [elevação, abertura, rotação, cotovelo, punho] (graus)
const POSES = {
  bestaLower: [0, 0.3, 34, 0, 0, [-28, 28, 0, 45, 0], [-28, 28, 0, 45, 0], 0.24, -0.08, 24],
  bestaGore: [0, 0.12, 12, 0, 0, [-14, 58, 0, 25, 0], [-14, 58, 0, 25, 0], 0.22, 0.22, -30],
  bestaToss: [0, 0.04, -12, 0, 0, [118, 62, 0, 30, 0], [118, 62, 0, 30, 0], 0.2, 0.14, -38],
  bestaBrace: [0, 0.2, 12, 0, 0, [44, 36, -10, 88, 0], [44, 36, 10, 88, 0], 0.22, 0.02, 4],
  roarDraw: [0, 0.1, -16, 0, 0, [-22, 42, 0, 112, 0], [-22, 42, 0, 112, 0], 0.2, -0.06, -18],
  roarBlast: [0, 0.27, 26, 0, 0, [36, 88, 0, 34, 0], [36, 88, 0, 34, 0], 0.32, 0.12, -6],
  roarShake: [0.03, 0.29, 30, 4, 2, [30, 92, 0, 46, 0], [30, 92, 0, 46, 0], 0.32, 0.12, -2],
  roarSettle: [0, 0.16, 10, 0, 0, [40, 42, -10, 80, 0], [40, 42, 10, 80, 0], 0.22, 0.02, 2],
  stompRise: [-0.08, -0.02, -9, 6, -6, [152, 32, 0, 55, 0], [152, 32, 0, 55, 0], 0.1, 0, -12],
  stompSlam: [0, 0.4, 24, 0, 0, [8, 64, 0, 22, 0], [8, 64, 0, 22, 0], 0.36, 0.06, 16],
  stompHold: [0, 0.36, 18, 0, 0, [14, 58, 0, 30, 0], [14, 58, 0, 30, 0], 0.34, 0.04, 10],
  stompUp: [0, 0.18, 8, 0, 0, [42, 40, -10, 84, 0], [42, 40, 10, 84, 0], 0.22, 0, 2],
};

const timing = (id) => ({ release: FRUTOMotion.clips[id].release, duration: FRUTOMotion.clips[id].duration });

export const BESTA_CLIPS = ['besta_presa', 'besta_rugido', 'besta_pisao'];

FRUTOMotion.define({
  id: 'besta_presa', label: 'Presa de Marfim', release: 0.3, duration: 0.86, socket: 'peito', sourceId: 'lobo0', source: timing('lobo0'),
  settle: 0.58, poses: POSES,
  keys: [[0, 'guard'], [0.2, 'bestaLower'], [0.3, 'bestaGore'], [0.4, 'bestaToss'], [0.58, 'bestaBrace'], [0.86, 'guard']],
});
FRUTOMotion.define({
  id: 'besta_rugido', label: 'Rugido Carmesim', release: 0.34, duration: 1.0, socket: 'boca', sourceId: 'lobo3', source: timing('lobo3'),
  settle: 0.74, poses: {},
  keys: [[0, 'guard'], [0.24, 'roarDraw'], [0.34, 'roarBlast'], [0.46, 'roarShake'], [0.56, 'roarBlast'], [0.64, 'roarShake'], [0.76, 'roarSettle'], [1.0, 'guard']],
});
FRUTOMotion.define({
  id: 'besta_pisao', label: 'Pisão da Besta', release: 0.46, duration: 1.15, socket: 'apoio_D', sourceId: 'lobo4', source: timing('lobo4'),
  settle: 0.82, poses: {},
  // perna direita: sobe bem alto (joelho no peito) e desce de uma vez no impacto
  kick: { side: 'D', keys: [[0, 0, 0, 0, 0], [0.2, 0.02, 0.7, 0.3, -0.15], [0.36, 0.04, 1.15, 0.35, -0.1], [0.43, 0.02, 0.6, 0.25, 0], [0.46, 0, 0, 0.12, 0], [1.15, 0, 0, 0, 0]] },
  keys: [[0, 'guard'], [0.32, 'stompRise'], [0.46, 'stompSlam'], [0.62, 'stompHold'], [0.84, 'stompUp'], [1.15, 'guard']],
});

// tempo da forma: o impacto do gesto humano cai no impacto da animação do laboratório
export function sourceTime(clip, t) {
  const s = clip?.source;
  if (!s) return t;
  if (t <= clip.release) return (t / clip.release) * s.release;
  const k = Math.min(1, (t - clip.release) / Math.max(1e-3, clip.duration - clip.release));
  return s.release + k * (s.duration - s.release);
}
