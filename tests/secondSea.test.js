import { describe, it, expect } from 'vitest';
import { SEA, seaHeight, seaSpots, levelsFor } from '../src/islands/firstSea.js';
import { SEA2, GATES, ARRIVALS, CROSSING, seaOf, crossingUnlocked } from '../src/islands/secondSea.js';
import { fleetPlan } from '../src/ships/fleet.js';
import { ISLAND } from '../src/islands/trainingIsland.js';
import { VILLAGE } from '../src/islands/villageIsland.js';
import { waveHeight } from '../src/ocean/ocean.js';
import { migrate, newSave } from '../src/saves/saveSystem.js';

const ALL = [...SEA, ...SEA2];
const box = (x, z, half) => ({ x0: x - half, x1: x + half, z0: z - half, z1: z + half });
const overlap = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1;
// altura do mundo (fora das ilhas: mar aberto e fundo)
function height(x, z) {
  for (const d of ALL) if (Math.max(Math.abs(x - d.x), Math.abs(z - d.z)) < d.R + 32) return seaHeight(d)(x - d.x, z - d.z);
  if (Math.max(Math.abs(x), Math.abs(z)) < ISLAND.half) return 0;
  if (Math.max(Math.abs(x - VILLAGE.offset.x), Math.abs(z - VILLAGE.offset.z)) < VILLAGE.half) return 0;
  return -20;
}

describe('Segundo Mar: ilhas', () => {
  it('três ilhas com faixas seguidas de 700 a 975, no Segundo Mar', () => {
    expect(SEA2.map((d) => d.faixa)).toEqual([[700, 775], [775, 875], [875, 975]]);
    for (const d of SEA2) expect(seaOf(d.z)).toBe(2);
    for (const d of SEA) expect(seaOf(d.z)).toBe(1);
  });

  it('nenhuma ilha (dos dois mares) encosta em outra', () => {
    const boxes = ALL.map((d) => box(d.x, d.z, d.R + 32));
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(overlap(boxes[i], boxes[j])).toBe(false);
  });

  it('acampamentos, chefes e praias de chegada em terra; níveis dentro da faixa', () => {
    for (const d of SEA2) {
      const h = seaHeight(d);
      const s = seaSpots(d);
      for (const p of [s.camp, s.boss, ...s.enemies]) expect(h(p.x, p.z), d.id).toBeGreaterThan(1.4);
      expect(h(s.landing.x, s.landing.z)).toBeGreaterThan(0.6);
      for (const lv of levelsFor(d)) expect(lv).toBeGreaterThanOrEqual(d.faixa[0]);
    }
  });

  it('as praias de chegada do Segundo Mar olham para o Cais das Correntes', () => {
    for (const d of SEA2.slice(1)) {
      const l = seaSpots(d).landing;
      const toHub = Math.atan2(SEA2[0].z - d.z, SEA2[0].x - d.x);
      expect(Math.abs(Math.atan2(l.z, l.x) - toHub)).toBeLessThan(0.01);
    }
  });
});

describe('travessia', () => {
  it('portões e chegadas em mar aberto, longe das ilhas, sem cair de novo no portão', () => {
    for (const g of Object.values(GATES)) expect(height(g.x, g.z)).toBeLessThan(-5);
    for (const [k, a] of Object.entries(ARRIVALS)) {
      expect(height(a.x, a.z)).toBeLessThan(-5);
      const gate = Object.values(GATES).find((g) => g.to === k);
      expect(Math.hypot(a.x - GATES[gate.to === 'sul' ? 'norte' : 'sul'].x, 0)).toBeGreaterThanOrEqual(0);
      // a chegada fica fora do raio do portão daquele mar
      const here = Object.values(GATES).find((g) => seaOf(g.z) === a.mar);
      expect(Math.hypot(a.x - here.x, a.z - here.z)).toBeGreaterThan(here.r + 10);
    }
    expect(seaOf(ARRIVALS.sul.z)).toBe(2);
    expect(seaOf(ARRIVALS.norte.z)).toBe(1);
  });

  it('o caminho da tempestade (a corrente leva o bote) é só mar aberto', () => {
    for (const g of Object.values(GATES)) {
      const dur = g.id === 'sul' ? CROSSING.back : CROSSING.time;
      for (let t = 0; t <= dur; t += 0.5) {
        const d = 19 * t;
        expect(height(g.x + Math.sin(g.dir) * d, g.z + Math.cos(g.dir) * d), `${g.id} ${t}`).toBeLessThan(-3);
      }
    }
  });

  it('só abre depois de derrotar a Guardiã da Fenda Celeste', () => {
    expect(crossingUnlocked({})).toBe(false);
    expect(crossingUnlocked({ bosses: { 'fenda-celeste-chefe': 1 } })).toBe(true);
    expect(migrate({ ...newSave(), seas: { segundo: 'sim' } }).seas).toEqual({ segundo: false });
    expect(migrate({ ...newSave(), seas: { segundo: true } }).seas.segundo).toBe(true);
  });

  it('a tempestade aumenta as ondas', () => {
    let calm = 0;
    let rough = 0;
    for (let t = 0; t < 10; t += 0.37) {
      calm = Math.max(calm, Math.abs(waveHeight(500, -1200, t)));
      rough = Math.max(rough, Math.abs(waveHeight(500, -1200, t, 0, 1)));
    }
    expect(rough).toBeGreaterThan(calm * 2.2);
  });

  it('navios corsários também no Segundo Mar, em mar aberto', () => {
    const plan = fleetPlan(ALL);
    for (const d of SEA2) {
      const p = plan.find((x) => x.id === `navio-${d.id}`);
      expect(p).toBeDefined();
      for (const pt of p.route) expect(height(pt.x, pt.z)).toBeLessThan(-2);
    }
  });
});
