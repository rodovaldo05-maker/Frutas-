import { describe, it, expect } from 'vitest';
import { BOAT, boatStep, landingSpot, normalizeBoat } from '../src/ships/boatRules.js';
import { migrate, newSave } from '../src/saves/saveSystem.js';
import { DOCKS, VILLAGE, villageHeight } from '../src/islands/villageIsland.js';
import { islandHeight } from '../src/islands/trainingIsland.js';

const DT = 1 / 60;
const deep = { ground: () => -12 };
const run = (s, input, world, seconds) => {
  let bumps = 0;
  for (let i = 0; i < seconds * 60; i++) if (boatStep(s, input, world, DT).bump) bumps++;
  return bumps;
};
const ahead = (yaw, mag = 1, fast = false) => ({ wx: Math.sin(yaw) * mag, wz: Math.cos(yaw) * mag, mag, fast });

describe('bote: navegação', () => {
  it('acelera aos poucos até a velocidade de cruzeiro e anda para a frente', () => {
    const s = { x: 0, z: 0, yaw: 0, speed: 0 };
    run(s, ahead(0), deep, 0.5);
    expect(s.speed).toBeGreaterThan(1);
    expect(s.speed).toBeLessThan(BOAT.speed);
    run(s, ahead(0), deep, 5);
    expect(s.speed).toBeCloseTo(BOAT.speed, 1);
    expect(s.z).toBeGreaterThan(40);
    expect(Math.abs(s.x)).toBeLessThan(1e-6);
  });

  it('Correr leva à velocidade rápida; soltar o analógico freia até parar', () => {
    const s = { x: 0, z: 0, yaw: 0, speed: 0 };
    run(s, ahead(0, 1, true), deep, 6);
    expect(s.speed).toBeCloseTo(BOAT.fast, 1);
    run(s, { wx: 0, wz: 0, mag: 0 }, deep, 4);
    expect(s.speed).toBe(0);
  });

  it('gira com raio de curva até o rumo pedido, sem passar dele', () => {
    const s = { x: 0, z: 0, yaw: 0, speed: BOAT.speed };
    boatStep(s, ahead(Math.PI / 2), deep, DT);
    expect(s.yaw).toBeGreaterThan(0);
    expect(s.yaw).toBeLessThan(BOAT.turn * DT + 1e-9);
    run(s, ahead(Math.PI / 2), deep, 4);
    expect(s.yaw).toBeCloseTo(Math.PI / 2, 5);
  });

  it('para no raso (praia) e consegue sair dando a volta', () => {
    // fundo sobe a partir de z = 40: raso depois de z ≈ 46
    const beach = { ground: (x, z) => (z < 40 ? -6 : -6 + (z - 40)) };
    const s = { x: 0, z: 0, yaw: 0, speed: 0 };
    const bumps = run(s, ahead(0), beach, 10);
    expect(bumps).toBeGreaterThan(0);
    const bow = s.z + BOAT.length / 2;
    expect(beach.ground(0, bow)).toBeLessThanOrEqual(-BOAT.draft + 0.01);
    // de volta para o mar aberto
    run(s, ahead(Math.PI), beach, 8);
    expect(s.z).toBeLessThan(20);
  });

  it('para em estruturas na frente (cais, pilares)', () => {
    const world = { ground: () => -10, blocked: (x, z, yaw, reach) => z + Math.cos(yaw) * reach > 30 };
    const s = { x: 0, z: 0, yaw: 0, speed: 0 };
    run(s, ahead(0), world, 8);
    expect(s.z + BOAT.length / 2).toBeLessThanOrEqual(30.5);
  });
});

describe('bote: descer e salvar', () => {
  it('desce no chão firme mais perto; sem chão, na água ao lado', () => {
    const s = { x: 0, z: 0, yaw: 0, speed: 0 };
    // cais à direita do bote (x < -2)
    const pier = (x) => (x < -2 ? 1.35 : null);
    const spot = landingSpot(s, pier);
    expect(spot.land).toBe(true);
    expect(spot.x).toBeLessThan(-2);
    expect(spot.y).toBeCloseTo(1.35);
    const water = landingSpot(s, () => null);
    expect(water.land).toBe(false);
    expect(Math.hypot(water.x, water.z)).toBeCloseTo(3);
  });

  it('o salvo guarda o bote e descarta valores inválidos', () => {
    expect(normalizeBoat({ x: 10, z: -4, yaw: 7, aboard: 1 })).toEqual({ x: 10, z: -4, yaw: expect.any(Number), aboard: true });
    expect(normalizeBoat({ x: NaN, z: 0, yaw: 0 })).toBeNull();
    expect(normalizeBoat('bote')).toBeNull();
    const out = migrate({ ...newSave(), boat: { x: 200, z: 5, yaw: 1, aboard: false } });
    expect(out.boat).toEqual({ x: 200, z: 5, yaw: 1, aboard: false });
    expect(migrate({ ...newSave(), boat: { x: 'a' } }).boat).toBeNull();
  });

  it('o bote amarrado em cada cais fica em água funda o bastante', () => {
    const t = DOCKS.treino.mooring;
    const p = DOCKS.porto.mooring;
    for (const [m, h] of [[t, islandHeight(t.x, t.z)], [p, villageHeight(p.x - VILLAGE.offset.x, p.z - VILLAGE.offset.z)]]) {
      expect(h).toBeLessThan(-BOAT.draft);
      expect(m.yaw).toBeDefined();
    }
  });
});
