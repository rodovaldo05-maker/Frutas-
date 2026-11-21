import { describe, it, expect } from 'vitest';
import { maxStamina, normalizeStatus, newStatus } from '../src/progression/status.js';
import { Stamina } from '../src/movement/rules.js';
import { migrate } from '../src/saves/saveSystem.js';

describe('status', () => {
  it('cada nível de Força soma 1 ao fôlego máximo', () => {
    expect(maxStamina(newStatus())).toBe(100);
    expect(maxStamina({ forca: 1 })).toBe(101);
    expect(maxStamina({ forca: 40 })).toBe(140);
    expect(maxStamina({ forca: 300 })).toBe(400);
  });

  it('Vitalidade soma 4 e as duas se acumulam', () => {
    expect(maxStamina({ vitalidade: 5 })).toBe(120);
    expect(maxStamina({ forca: 10, vitalidade: 5 })).toBe(130);
  });

  it('valores salvos estranhos não quebram a conta', () => {
    expect(normalizeStatus({ forca: '12', defesa: -3, fruta: 'x' })).toEqual({ forca: 12, defesa: 0, fruta: 0, espada: 0, vitalidade: 0 });
    expect(maxStamina(null)).toBe(100);
  });

  it('a barra de fôlego usa o novo máximo', () => {
    const s = new Stamina();
    s.setMax(maxStamina({ forca: 50 }));
    expect(s.max).toBe(150);
    expect(s.value).toBe(150);
    s.drain(75, 1); // metade
    s.setMax(maxStamina({ forca: 51 }));
    expect(s.value / s.max).toBeCloseTo(0.5);
    s.update(2);
    expect(s.value).toBeLessThanOrEqual(151);
  });

  it('salvos antigos ganham status zerado', () => {
    const save = migrate({ version: 2, coins: 500 });
    expect(save.status).toEqual(newStatus());
    expect(save.statusPoints).toBe(0);
    expect(save.coins).toBe(500);
  });
});
