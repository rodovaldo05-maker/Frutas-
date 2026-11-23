// Meditação da fruta (cultivo de energia): substitui o antigo Descanso do menu de Treinamento.
// O personagem senta em flor de lótus, a aura da fruta envolve o corpo e ele cultiva a energia
// no ritmo da respiração (o mesmo ciclo da meditação da Vontade: tocar quando o círculo fica
// dourado). Cada respiração no ritmo dá maestria da fruta; sem tocar por 3 ciclos a sessão acaba
// (nada de XP parado). Também recupera vida, fôlego e energia, como o descanso fazia.
// Ao subir um nível de maestria: o corpo levita e solta uma explosão de energia na cor da aura.

import { masteryXpToNext } from './mastery.js';

export const CULTIVO = {
  xpFrac: 0.04, // parte do nível atual por respiração (~25 respirações por nível)
  cap: 25, // respirações que rendem maestria por sessão
  energy: 8, // energia recuperada por respiração
  heal: 0.04, // vida por segundo (fração da máxima, vezes a Recuperação)
  levitate: 2.6, // duração da levitação ao subir de nível (s)
  burstAt: 1.3, // momento da explosão de energia (no alto)
  height: 1.3, // altura da levitação
};

// maestria de uma respiração no ritmo (antes do multiplicador de ambiente)
export function cultivoXp(level, breaths) {
  if (breaths > CULTIVO.cap) return 0;
  return Math.max(1, masteryXpToNext(level) * CULTIVO.xpFrac);
}

// altura da levitação (0..1) pelo tempo desde a subida de nível: sobe, paira e desce
export function liftAt(t) {
  if (!(t >= 0) || t >= CULTIVO.levitate) return 0;
  const ease = (x) => x * x * (3 - 2 * x);
  if (t < 0.9) return ease(t / 0.9);
  if (t < 1.9) return 1;
  return ease(1 - (t - 1.9) / (CULTIVO.levitate - 1.9));
}
