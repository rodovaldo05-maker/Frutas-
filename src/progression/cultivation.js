// Meditação da fruta (cultivo de energia): substitui o antigo Descanso do menu de Treinamento.
// O personagem senta em flor de lótus, a aura da fruta envolve o corpo e a energia é cultivada
// sozinha: a maestria da fruta sobe sem precisar tocar na tela, até o nível máximo ou até o
// jogador cancelar (mexer-se, levar dano ou Interromper). Escolha do jogador (versão 0.27.2):
// o cultivo é automático, sem limite por sessão.
// De tempos em tempos aparece uma OPORTUNIDADE DE RESPIRAÇÃO (12 s, três ciclos de respiração):
// tocar em Respirar na hora certa (círculo dourado) dobra o progresso enquanto a respiração
// estiver certa. Errar ou não tocar não tira nada — só não ganha o dobro.
// Ao subir um nível de maestria: o corpo levita e solta uma explosão de energia na cor da aura.

import { masteryXpToNext } from './mastery.js';
import { breathPhase, breathValid } from '../haki/haki.js';

export const CULTIVO = {
  rate: 0.01, // parte do nível atual por segundo (~100 s por nível no ritmo normal)
  boost: 2, // respiração certa dobra o progresso
  boostTime: 6, // quanto dura o dobro depois de cada respiração certa (s)
  every: [18, 30], // intervalo entre oportunidades (s)
  first: 8, // primeira oportunidade
  window: 12, // duração da oportunidade (3 ciclos de 4 s)
  energy: 2, // energia por segundo
  heal: 0.04, // vida por segundo (fração da máxima, vezes a Recuperação)
  levitate: 2.6, // duração da levitação ao subir de nível (s)
  burstAt: 1.3, // momento da explosão de energia (no alto)
  height: 1.3, // altura da levitação
};

// maestria por segundo (antes do multiplicador de ambiente e do dobro)
export const cultivoRate = (level) => masteryXpToNext(level) * CULTIVO.rate;

export function newCultivo() {
  return { t: 0, next: CULTIVO.first, opp: 0, oppT: 0, boost: 0, cycle: -1, tapped: false, good: 0, opps: 0 };
}

// há oportunidade de respiração agora?
export const inOpportunity = (c) => c.opp > 0;
// fase do círculo da respiração (só faz sentido durante a oportunidade)
export const cultivoPhase = (c) => breathPhase(c.oppT);
export const cultivoPeak = (c) => inOpportunity(c) && breathValid(c.oppT);

// avança o tempo; devolve o multiplicador do progresso neste instante (1 ou 2) e se uma
// oportunidade começou neste passo
export function cultivoStep(c, dt, rand = Math.random) {
  c.t += dt;
  c.boost = Math.max(0, c.boost - dt);
  let started = false;
  if (c.opp > 0) {
    c.opp -= dt;
    c.oppT += dt;
    const cyc = Math.floor(c.oppT / 4);
    if (cyc !== c.cycle) {
      c.cycle = cyc;
      c.tapped = false;
    }
    if (c.opp <= 0) {
      c.opp = 0;
      const [a, b] = CULTIVO.every;
      c.next = a + rand() * (b - a);
    }
  } else {
    c.next -= dt;
    if (c.next <= 0) {
      c.opp = CULTIVO.window;
      c.oppT = 0;
      c.cycle = 0;
      c.tapped = false;
      c.opps += 1;
      started = true;
    }
  }
  return { mult: c.boost > 0 ? CULTIVO.boost : 1, started };
}

// toque em Respirar: 'certo' (dobra), 'errado' (fora da hora), 'sem' (sem oportunidade agora)
// ou 'repetido' (um toque por ciclo)
export function cultivoTap(c) {
  if (!inOpportunity(c)) return 'sem';
  if (c.tapped) return 'repetido';
  c.tapped = true;
  if (!breathValid(c.oppT)) return 'errado';
  c.good += 1;
  c.boost = CULTIVO.boostTime;
  return 'certo';
}

// altura da levitação (0..1) pelo tempo desde a subida de nível: sobe, paira e desce
export function liftAt(t) {
  if (!(t >= 0) || t >= CULTIVO.levitate) return 0;
  const ease = (x) => x * x * (3 - 2 * x);
  if (t < 0.9) return ease(t / 0.9);
  if (t < 1.9) return 1;
  return ease(1 - (t - 1.9) / (CULTIVO.levitate - 1.9));
}
