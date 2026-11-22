// Domínio da fruta = maestria geral (atualização 23; antes: documento mestre 4.0, seção 14,
// de 1 a 100). Agora vai de 1 a 1000, com as trilhas de afinidade, técnica e sincronia
// (progression/mastery.js). Salvos antigos migram sozinhos: nível antigo × 10, sem perder
// progresso. Trocar de fruta não apaga a maestria da anterior. Bônus: até +30% de dano das
// habilidades; libera as habilidades 2 (41) e 3 (121), as formas (191 e 491) e o despertar (581).

import { normalizeMastery, addMasteryXp, masteryBonus, masteryProgress, masteryXpToNext, MASTERY_MAX } from './mastery.js';

export const DOMAIN_MAX = MASTERY_MAX;
export const domainXpToNext = masteryXpToNext;

export function normalizeDomain(d) {
  const out = {};
  if (d && typeof d === 'object') for (const [id, v] of Object.entries(d)) out[id] = normalizeMastery(v);
  return out;
}

export function domainOf(save, fruitId) {
  save.domain ??= {};
  const v = save.domain[fruitId];
  if (!v || v.v !== 2) save.domain[fruitId] = normalizeMastery(v);
  return save.domain[fruitId];
}

export const addDomainXp = (save, fruitId, amount) => addMasteryXp(domainOf(save, fruitId), amount);
export const domainBonus = masteryBonus;
export const domainProgress = masteryProgress;
