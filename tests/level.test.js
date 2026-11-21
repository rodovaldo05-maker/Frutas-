import { describe, it, expect } from 'vitest';
import { xpToNext, addXp, MAX_LEVEL } from '../src/progression/level.js';
import { newSave } from '../src/saves/saveSystem.js';

describe('nível de aventureiro', () => {
  it('experiência por nível segue 100 + 30 × n^1,4', () => {
    expect(xpToNext(1)).toBe(130);
    expect(xpToNext(2)).toBe(179);
    expect(xpToNext(10)).toBe(854);
  });

  it('subir de nível guarda a sobra', () => {
    const s = newSave();
    expect(addXp(s, 100)).toBe(0);
    expect(addXp(s, 40)).toBe(1);
    expect(s.level).toBe(2);
    expect(s.xp).toBe(10);
    expect(addXp(s, 10000)).toBeGreaterThan(5);
  });

  it('não passa do nível máximo', () => {
    const s = { ...newSave(), level: MAX_LEVEL - 1 };
    addXp(s, 1e12);
    expect(s.level).toBe(MAX_LEVEL);
    expect(s.xp).toBe(0);
  });
});
