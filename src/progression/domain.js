// Domínio da fruta (documento mestre 4.0, seção 14): progresso próprio por ID de fruta, de
// 1 a 100, com a curva dos atributos × 1,4. Sobe usando os poderes e o combo da fruta em
// situações relevantes (acertar inimigos; bonecos rendem pouco e com repetição).
// Trocar de fruta não apaga o domínio da anterior. Bônus: +0,3% de dano das habilidades
// por nível (até +30%) e liberação das habilidades 2 e 3.

import { xpToNext as attrXp, MAX_LEVEL } from './training.js';

export const DOMAIN_MULT = 1.4;
export const domainXpToNext = (L) => Math.round(attrXp(L) * DOMAIN_MULT);

export function normalizeDomain(d) {
  const out = {};
  if (d && typeof d === 'object') {
    for (const [id, v] of Object.entries(d)) {
      const level = Math.min(MAX_LEVEL, Math.max(1, Math.floor(Number(v?.level)) || 1));
      const xp = Math.max(0, Number(v?.xp) || 0);
      out[id] = { level, xp: level >= MAX_LEVEL ? 0 : xp };
    }
  }
  return out;
}

export function domainOf(save, fruitId) {
  save.domain ??= {};
  return (save.domain[fruitId] ??= { level: 1, xp: 0 });
}

export function addDomainXp(save, fruitId, amount) {
  const d = domainOf(save, fruitId);
  if (!(amount > 0) || d.level >= MAX_LEVEL) return 0;
  d.xp += amount;
  let levels = 0;
  while (d.level < MAX_LEVEL && d.xp >= domainXpToNext(d.level)) {
    d.xp -= domainXpToNext(d.level);
    d.level += 1;
    levels += 1;
  }
  if (d.level >= MAX_LEVEL) d.xp = 0;
  return levels;
}

export const domainBonus = (level) => 1 + Math.min(0.3, 0.003 * (level - 1));
export const domainProgress = (d) => (d.level >= MAX_LEVEL ? 1 : Math.min(1, d.xp / domainXpToNext(d.level)));
