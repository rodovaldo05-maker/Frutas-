import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { WEATHER, CLIMATE, rollWeather, stepWeather, weatherDamage, normalizeWeather, SPELL } from '../src/world/weather.js';
import { BEASTS, ENCOUNTER, PHASE, phaseOf, nextAttack, canSpawn, pickBeast, beastHp, beastBite, beastLoot } from '../src/ships/beastRules.js';
import { BeastManager } from '../src/ships/beasts.js';
import { MATERIALS } from '../src/crafting/materials.js';
import { mulberry32 } from '../src/core/math.js';
import { migrate, newSave } from '../src/saves/saveSystem.js';

describe('clima', () => {
  it('as chances de cada mar somam 1 e o sorteio segue as chances', () => {
    for (const t of Object.values(CLIMATE)) expect(Object.values(t).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    const r = mulberry32(3);
    const count = { sol: 0, chuva: 0, tempestade: 0 };
    for (let i = 0; i < 20000; i++) count[rollWeather(2, r)]++;
    expect(count.tempestade / 20000).toBeCloseTo(0.15, 1);
    expect(count.sol / 20000).toBeCloseTo(0.55, 1);
  });

  it('troca no fim do período ou ao mudar de mar; dura 2 a 5 horas', () => {
    const w = {};
    stepWeather(w, 0, 1, () => 0.99);
    expect(w.state).toBe('tempestade');
    expect(w.until).toBeGreaterThanOrEqual(SPELL.min);
    expect(w.until).toBeLessThanOrEqual(SPELL.max);
    expect(stepWeather(w, 10, 1, () => 0.1)).toBe(false); // ainda no período
    stepWeather(w, 10, 2, () => 0.1);
    expect(w.sea).toBe(2); // mudou de mar: sorteia de novo
    expect(w.state).toBe('sol');
  });

  it('chuva e tempestade enfraquecem só as frutas de fogo', () => {
    expect(weatherDamage('chuva', 'brasa')).toBe(0.85);
    expect(weatherDamage('tempestade', 'fenix')).toBe(0.85);
    expect(weatherDamage('sol', 'brasa')).toBe(1);
    expect(weatherDamage('chuva', 'geada')).toBe(1);
    expect(WEATHER.tempestade.storm).toBeGreaterThan(WEATHER.chuva.storm);
  });

  it('salvo estragado volta ao sol', () => {
    expect(normalizeWeather({ state: 'neve', until: 3 })).toEqual({ state: 'sol', until: 0, sea: 1 });
    expect(migrate({ ...newSave(), weather: { state: 'chuva', until: 500, sea: 2 } }).weather).toEqual({ state: 'chuva', until: 500, sea: 2 });
    expect(migrate({ ...newSave(), beasts: { serpente: 2, x: -1 } }).beasts).toEqual({ serpente: 2 });
  });
});

describe('bestas: regras', () => {
  it('fases pelo casco restante; a fúria leva mais dano', () => {
    expect(phaseOf(1)).toBe(1);
    expect(phaseOf(0.59)).toBe(2);
    expect(phaseOf(0.2)).toBe(3);
    expect(PHASE[3].taken).toBeGreaterThan(1);
    expect(PHASE[3].cd).toBeLessThan(PHASE[1].cd);
  });

  it('fase 1 só morde; ondas e mergulhos a partir da fase 2', () => {
    const r = mulberry32(5);
    for (let i = 0; i < 50; i++) expect(nextAttack('serpente', 1, r)).toBe('mordida');
    const seen = new Set();
    for (let i = 0; i < 200; i++) seen.add(nextAttack('serpente', 2, r));
    expect([...seen].sort()).toEqual(['mergulho', 'mordida', 'onda']);
  });

  it('só aparece no mar aberto, de bote (ou o tubarão para quem nada), fora da travessia', () => {
    const base = { aboard: true, crossing: false, sunk: false, distToLand: 200, sinceLast: 999 };
    expect(canSpawn(base)).toBe(true);
    expect(canSpawn({ ...base, distToLand: 30 })).toBe(false);
    expect(canSpawn({ ...base, crossing: true })).toBe(false);
    expect(canSpawn({ ...base, sinceLast: 10 })).toBe(false);
    expect(canSpawn({ ...base, aboard: false })).toBe(false);
    expect(canSpawn({ ...base, aboard: false, swimming: true, hunterOnly: true })).toBe(true);
  });

  it('a Lanterna só aparece de noite no Segundo Mar', () => {
    const r = mulberry32(9);
    for (let i = 0; i < 40; i++) expect(pickBeast(2, false, r).id).not.toBe('lanterna');
    const night = new Set();
    for (let i = 0; i < 40; i++) night.add(pickBeast(2, true, r).id);
    expect(night.has('lanterna')).toBe(true);
    expect(pickBeast(1, false, () => 0).level).toBe(BEASTS.serpente.level);
  });

  it('nenhuma besta para quem está muito abaixo do nível dela', () => {
    expect(pickBeast(1, false, () => 0, 10)).toBeNull();
    expect(pickBeast(1, false, () => 0.99, 200).id).toBe('serpente'); // o tubarão (600) ainda não
    expect(pickBeast(2, true, () => 0, 700).id).toBe('lanterna'); // a Lanterna (1200) pede nível 600
    expect(pickBeast(2, true, () => 0, 500).id).toBe('tubarao'); // abaixo disso só o tubarão (900 → 450)
  });

  it('vida, mordida e saque crescem com o nível; escama existe', () => {
    expect(beastHp(1200)).toBeGreaterThan(beastHp(300));
    expect(beastBite(600)).toBeGreaterThan(beastBite(300));
    const l = beastLoot(600, mulberry32(1));
    expect(l.mats[0][0]).toBe('escama');
    expect(MATERIALS.escama).toBeDefined();
    expect(l.fragments).toBeGreaterThanOrEqual(1);
  });
});

describe('bestas: encontro', () => {
  const setup = () => {
    const events = [];
    const fx = { burst() {}, mark() {}, flash() {} };
    const lab = { fx: { wave() {} } };
    const m = new BeastManager({ scene: new THREE.Scene(), ocean: { heightAt: () => 0 }, fx, lab, onEvent: (n, d) => events.push([n, d]) });
    return { m, events };
  };

  it('aviso, surge, ataca o casco do bote parado e respeita o mergulho', () => {
    const { m, events } = setup();
    const b = m.spawn('serpente', 300, { x: 0, z: 0 });
    let hull = 0;
    const ctx = { target: { x: 0, z: 0, vx: 0, vz: 0 }, aboard: true, onHull: (d) => (hull += d), onPlayer() {}, push() {} };
    for (let i = 0; i < ENCOUNTER.warning * 60 - 10; i++) m.update(1 / 60, ctx);
    expect(b.state).toBe('aviso');
    expect(b.alive).toBe(false); // ainda embaixo d'água: o canhão não mira
    for (let i = 0; i < 60 * 20; i++) m.update(1 / 60, ctx);
    expect(events.some(([n]) => n === 'emerge')).toBe(true);
    expect(hull).toBeGreaterThan(0); // mordidas no bote parado
  });

  it('o canhão leva às fases 2 e 3 e derrota a besta; ela some depois de afundar', () => {
    const { m, events } = setup();
    const b = m.spawn('tubarao', 600, { x: 0, z: 0 });
    b.state = 'circula';
    b.y = 0;
    b.depth = -0.5;
    let dealt = 0;
    while (b.hull > 0 && dealt < 1e6) {
      b.state = 'circula';
      b.y = 0;
      dealt += m.takeHit(b, 500, { x: b.s.x, y: 0, z: b.s.z });
    }
    const phases = events.filter(([n]) => n === 'phase').map(([, d]) => d.phase);
    expect(phases).toEqual([2, 3]);
    expect(events.some(([n]) => n === 'down')).toBe(true);
    for (let i = 0; i < 60 * 4; i++) m.update(1 / 60, { target: null });
    expect(m.beast).toBeNull();
  });

  it('sem ninguém no bote (ou longe demais) ela vai embora sem recompensa', () => {
    const { m, events } = setup();
    m.spawn('serpente', 300, { x: 0, z: 0 });
    for (let i = 0; i < 30; i++) m.update(1 / 60, { target: { x: 500, z: 500 }, aboard: true });
    expect(events.some(([n, d]) => n === 'left' && d.reason === 'longe')).toBe(true);
    expect(events.some(([n]) => n === 'down')).toBe(false);
  });
});
