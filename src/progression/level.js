// Nível de aventureiro (doc 09): experiência de missões e exploração; para passar do
// nível n = 100 + 30 × n^1,4; nível máximo 2400. Cada nível dá 3 pontos de status para
// distribuir. O treino pela prática (training.js) é outra camada e não é distribuído.

import { POINTS_PER_LEVEL } from './status.js';

export const MAX_LEVEL = 2400;

export function xpToNext(level) {
  return Math.round(100 + 30 * Math.pow(level, 1.4));
}

// Soma experiência ao salvo; devolve quantos níveis subiu
export function addXp(save, amount) {
  if (!(amount > 0) || save.level >= MAX_LEVEL) return 0;
  save.xp = (save.xp || 0) + Math.round(amount);
  let gained = 0;
  while (save.level < MAX_LEVEL && save.xp >= xpToNext(save.level)) {
    save.xp -= xpToNext(save.level);
    save.level += 1;
    save.statusPoints = (save.statusPoints || 0) + POINTS_PER_LEVEL;
    gained += 1;
  }
  if (save.level >= MAX_LEVEL) save.xp = 0;
  return gained;
}

export function xpProgress(save) {
  if (save.level >= MAX_LEVEL) return 1;
  return Math.min(1, (save.xp || 0) / xpToNext(save.level));
}
