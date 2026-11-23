import { describe, it, expect } from 'vitest';
import { CULTIVO, cultivoXp, liftAt } from '../src/progression/cultivation.js';
import { masteryXpToNext, addMasteryXp, normalizeMastery } from '../src/progression/mastery.js';

describe('meditação da fruta (cultivo)', () => {
  it('cada respiração no ritmo dá uma parte do nível; ~25 respirações sobem um nível', () => {
    for (const lv of [1, 120, 500, 900]) {
      const xp = cultivoXp(lv, 1);
      expect(xp).toBeGreaterThan(0);
      expect(Math.ceil(masteryXpToNext(lv) / xp)).toBeLessThanOrEqual(CULTIVO.cap + 1);
    }
  });

  it('limite por sessão: depois do teto não rende mais', () => {
    expect(cultivoXp(10, CULTIVO.cap)).toBeGreaterThan(0);
    expect(cultivoXp(10, CULTIVO.cap + 1)).toBe(0);
    // uma sessão inteira sobe no máximo um nível (com folga de arredondamento)
    const m = normalizeMastery(null);
    let levels = 0;
    for (let b = 1; b <= CULTIVO.cap + 5; b++) levels += addMasteryXp(m, cultivoXp(m.level, b));
    expect(levels).toBeLessThanOrEqual(1);
  });

  it('levitação: sobe, paira, desce e termina no chão', () => {
    expect(liftAt(0)).toBe(0);
    expect(liftAt(0.45)).toBeGreaterThan(0);
    expect(liftAt(1.2)).toBe(1);
    expect(liftAt(CULTIVO.burstAt)).toBe(1); // explosão lá no alto
    expect(liftAt(2.3)).toBeLessThan(1);
    expect(liftAt(CULTIVO.levitate)).toBe(0);
    expect(liftAt(-1)).toBe(0);
  });
});
