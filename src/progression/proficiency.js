// Proficiência de armas (documento mestre 4.0, seção 13): por tipo de arma (espada), de 1 a
// 100, com a mesma curva dos atributos. Sobe acertando inimigos com a arma (golpes e
// habilidades), com teto por oponente; trocar de espada não muda a proficiência.
// Bônus: +0,3% de dano com a arma por nível (até +30%) e liberação das habilidades.

import { xpToNext, MAX_LEVEL } from './training.js';

export const profXpToNext = (L) => xpToNext(L);

export function normalizeProficiency(p) {
  const out = {};
  if (p && typeof p === 'object') {
    for (const [k, v] of Object.entries(p)) {
      const level = Math.min(MAX_LEVEL, Math.max(1, Math.floor(Number(v?.level)) || 1));
      out[k] = { level, xp: level >= MAX_LEVEL ? 0 : Math.max(0, Number(v?.xp) || 0) };
    }
  }
  return out;
}

export function profOf(save, type) {
  save.proficiency ??= {};
  return (save.proficiency[type] ??= { level: 1, xp: 0 });
}

export function addProfXp(save, type, amount) {
  const p = profOf(save, type);
  if (!(amount > 0) || p.level >= MAX_LEVEL) return 0;
  p.xp += amount;
  let levels = 0;
  while (p.level < MAX_LEVEL && p.xp >= profXpToNext(p.level)) {
    p.xp -= profXpToNext(p.level);
    p.level += 1;
    levels += 1;
  }
  if (p.level >= MAX_LEVEL) p.xp = 0;
  return levels;
}

export const profBonus = (level) => 1 + Math.min(0.3, 0.003 * (level - 1));
