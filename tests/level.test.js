import { describe, it, expect } from 'vitest';
import { xpToNext, addXp, MAX_LEVEL } from '../src/progression/level.js';
import { allocate, resetStatus, maxHealth, maxStamina } from '../src/progression/status.js';
import { newSave } from '../src/saves/saveSystem.js';

describe('nível e status', () => {
  it('experiência por nível segue 100 + 30 × n^1,4', () => {
    expect(xpToNext(1)).toBe(130);
    expect(xpToNext(2)).toBe(179);
    expect(xpToNext(10)).toBe(854);
  });

  it('subir de nível dá 3 pontos e guarda a sobra', () => {
    const s = newSave();
    expect(addXp(s, 100)).toBe(0);
    expect(addXp(s, 40)).toBe(1);
    expect(s.level).toBe(2);
    expect(s.xp).toBe(10);
    expect(s.statusPoints).toBe(3);
    expect(addXp(s, 10000)).toBeGreaterThan(5);
    expect(s.statusPoints).toBe((s.level - 1) * 3);
  });

  it('não passa do nível máximo', () => {
    const s = { ...newSave(), level: MAX_LEVEL - 1 };
    addXp(s, 1e12);
    expect(s.level).toBe(MAX_LEVEL);
    expect(s.xp).toBe(0);
  });

  it('colocar pontos em Força aumenta o fôlego; Defesa aumenta a vida', () => {
    const s = { ...newSave(), statusPoints: 12 };
    expect(allocate(s, 'forca', 10)).toBe(10);
    expect(allocate(s, 'defesa', 10)).toBe(2); // só sobraram 2
    expect(s.statusPoints).toBe(0);
    expect(maxStamina(s.status)).toBe(110);
    expect(maxHealth(s.status)).toBe(112);
    expect(resetStatus(s)).toBe(12);
    expect(s.statusPoints).toBe(12);
    expect(maxStamina(s.status)).toBe(100);
  });
});
