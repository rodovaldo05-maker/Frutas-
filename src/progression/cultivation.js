// Meditação da fruta (cultivo de energia): substitui o antigo Descanso do menu de Treinamento.
// O personagem senta em flor de lótus, a aura da fruta envolve o corpo e a energia é cultivada
// sozinha: a maestria da fruta sobe sem precisar tocar na tela, até o nível máximo ou até o
// jogador cancelar (mexer-se, levar dano ou Interromper). Escolha do jogador (versão 0.27.2):
// o cultivo é automático, sem limite por sessão.
// De tempos em tempos aparece uma OPORTUNIDADE DE RESPIRAÇÃO (12 s, três ciclos de respiração):
// tocar em Respirar na hora certa (círculo dourado) dobra o progresso enquanto a respiração
// estiver certa. Errar ou não tocar não tira nada — só não ganha o dobro.
// Versão 0.27.4: quanto mais alto, mais rápido (e mais energia); cada fruta tem condições que
// multiplicam a meditação (meditationBonus, abaixo).
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

// ===== Bônus da meditação (versão 0.27.4) =====
// Tudo se MULTIPLICA: altura × condições da fruta × respiração. Exemplo da Besta: começou
// ferida (×3) e levou um raio (×2) = ×6; com a respiração certa (×2) = ×12. Teto de ×40.
export const MEDITATION_CAP = 40;

// quanto mais alto, mais rápido (e mais energia): ×1 no nível do mar até ×2,5 a 50 m de altura
export const altitudeMult = (y) => 1 + Math.min(1.5, Math.max(0, (y - 5) / 30));

// condições por fruta. ctx: { y, wounded (começou com menos de metade da vida), struck (levou
// um raio meditando), biome, night, weather, sun, nearWater, nearLava, blizzard }
const W = (c) => c.weather === 'tempestade';
const wet = (c) => c.weather === 'chuva' || c.weather === 'tempestade';
const walls = (c) => ['forte', 'granito', 'masmorra', 'arena', 'cidade'].includes(c.biome);
export const FRUIT_MEDITATION = {
  besta: [['ferida ao começar', 3, (c) => c.wounded], ['atingida por um raio', 2, (c) => c.struck]],
  lobo: [['noite de caça', 2, (c) => c.night], ['ferido ao começar', 2, (c) => c.wounded]],
  fenix: [['renascer das cinzas (ferida)', 3, (c) => c.wounded], ['sol no céu', 1.5, (c) => c.sun]],
  brasa: [['perto da lava', 3, (c) => c.nearLava], ['terra vulcânica', 2, (c) => c.biome === 'vulcao' || c.biome === 'bastiao']],
  ocidental: [['terra vulcânica', 2, (c) => c.biome === 'vulcao' || c.biome === 'bastiao'], ['perto da lava', 2, (c) => c.nearLava]],
  geada: [['gelo e neve', 2, (c) => c.biome === 'neve' || c.biome === 'geleira'], ['dentro da nevasca', 3, (c) => c.blizzard]],
  tormenta: [['tempestade', 3, W], ['atingida por um raio', 2, (c) => c.struck]],
  oriental: [['tempestade', 2, W], ['atingido por um raio', 2, (c) => c.struck]],
  mare: [['beira d’água', 2, (c) => c.nearWater], ['chuva', 2, wet]],
  eclipse: [['noite', 3, (c) => c.night], ['bosque sombrio', 2, (c) => c.biome === 'noturno']],
  cristal: [['entre pedras lapidadas', 2, (c) => c.biome === 'granito' || c.biome === 'masmorra' || c.biome === 'ruinas'], ['silêncio da noite', 1.5, (c) => c.night]],
  eco: [['entre muralhas (eco)', 2, walls], ['silêncio da noite', 1.5, (c) => c.night]],
  ima: [['perto de metal', 2, walls], ['campo elétrico da tempestade', 1.5, W]],
  duna: [['areia', 2, (c) => c.biome === 'deserto' || c.biome === 'praia'], ['tempestade de areia', 2, (c) => c.biome === 'deserto' && c.weather !== 'sol']],
  falcao: [['picos altos (40 m+)', 2, (c) => c.y >= 40], ['ventos fortes', 1.5, W]],
  impacto: [['ferido ao começar', 2, (c) => c.wounded], ['arena de luta', 2, (c) => c.biome === 'arena' || c.biome === 'forte']],
};

// bônus ativos agora: [{ label, mult }], o total (com o teto) e o bônus de energia (altura)
export function meditationBonus(fruitId, ctx, breathing = false) {
  const list = [];
  const alt = altitudeMult(ctx.y ?? 0);
  if (alt > 1.001) list.push({ label: `altura ${Math.round(ctx.y)} m`, mult: alt });
  for (const [label, mult, test] of FRUIT_MEDITATION[fruitId] ?? []) if (test(ctx)) list.push({ label, mult });
  if (breathing) list.push({ label: 'respiração', mult: CULTIVO.boost });
  const total = Math.min(MEDITATION_CAP, list.reduce((k, b) => k * b.mult, 1));
  return { list, total, energy: alt };
}

// altura da levitação (0..1) pelo tempo desde a subida de nível: sobe, paira e desce
export function liftAt(t) {
  if (!(t >= 0) || t >= CULTIVO.levitate) return 0;
  const ease = (x) => x * x * (3 - 2 * x);
  if (t < 0.9) return ease(t / 0.9);
  if (t < 1.9) return 1;
  return ease(1 - (t - 1.9) / (CULTIVO.levitate - 1.9));
}
