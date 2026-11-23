import { describe, it, expect } from 'vitest';
import { CULTIVO, cultivoRate, newCultivo, cultivoStep, cultivoTap, inOpportunity, cultivoPeak, liftAt } from '../src/progression/cultivation.js';
import { masteryXpToNext, addMasteryXp, normalizeMastery, MASTERY_MAX } from '../src/progression/mastery.js';

// simula a meditação sem tocar (ou tocando no dourado) por `secs` segundos
function run(secs, { breathe = false, level = 1 } = {}) {
  const m = normalizeMastery(null);
  m.level = level;
  const c = newCultivo();
  let s = 7;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const dt = 0.1;
  for (let t = 0; t < secs; t += dt) {
    if (breathe && cultivoPeak(c)) cultivoTap(c);
    const { mult } = cultivoStep(c, dt, rand);
    addMasteryXp(m, cultivoRate(m.level) * mult * dt);
  }
  return { m, c };
}

describe('meditação da fruta (cultivo automático)', () => {
  it('sobe sozinha, sem tocar na tela (~100 s por nível)', () => {
    const { m } = run(205);
    expect(m.level).toBe(3);
    for (const lv of [1, 300, 900]) expect(masteryXpToNext(lv) / cultivoRate(lv)).toBeCloseTo(100, 0);
  });

  it('não tem limite por sessão: continua até o máximo', () => {
    const m = normalizeMastery(null);
    m.level = MASTERY_MAX - 1;
    for (let i = 0; i < 2000 && m.level < MASTERY_MAX; i++) addMasteryXp(m, cultivoRate(m.level));
    expect(m.level).toBe(MASTERY_MAX);
  });

  it('oportunidade de respiração aparece sozinha e dura 3 ciclos', () => {
    const c = newCultivo();
    let started = 0;
    let inside = 0;
    for (let t = 0; t < 120; t += 0.1) {
      if (cultivoStep(c, 0.1, () => 0.5).started) started++;
      if (inOpportunity(c) && started === 1) inside += 0.1;
    }
    expect(started).toBeGreaterThanOrEqual(3);
    expect(inside).toBeCloseTo(CULTIVO.window, 0);
  });

  it('tocar fora da oportunidade ou fora do dourado não dá nada; no dourado dobra', () => {
    const c = newCultivo();
    expect(cultivoTap(c)).toBe('sem');
    while (!inOpportunity(c)) cultivoStep(c, 0.1);
    expect(cultivoTap(c)).toBe('errado'); // começo do ciclo: ainda não é o pico
    expect(cultivoTap(c)).toBe('repetido');
    while (c.oppT < 4) cultivoStep(c, 0.05); // um toque por ciclo: espera o próximo
    while (!cultivoPeak(c)) cultivoStep(c, 0.05);
    expect(cultivoTap(c)).toBe('certo');
    expect(cultivoStep(c, 0.1).mult).toBe(CULTIVO.boost);
  });

  it('respirando certo nas oportunidades o progresso é bem maior que parado', () => {
    const calm = run(300);
    const good = run(300, { breathe: true });
    const total = (r) => r.m.level + r.m.xp / masteryXpToNext(r.m.level);
    expect(total(good)).toBeGreaterThan(total(calm) * 1.2);
    expect(good.c.good).toBeGreaterThan(0);
  });

  it('levitação: sobe, paira, desce e termina no chão', () => {
    expect(liftAt(0)).toBe(0);
    expect(liftAt(0.45)).toBeGreaterThan(0);
    expect(liftAt(CULTIVO.burstAt)).toBe(1); // explosão lá no alto
    expect(liftAt(2.3)).toBeLessThan(1);
    expect(liftAt(CULTIVO.levitate)).toBe(0);
    expect(liftAt(-1)).toBe(0);
  });
});
