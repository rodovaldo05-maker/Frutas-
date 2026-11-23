import { describe, it, expect } from 'vitest';
import { SEA, seaHeight, seaSpots, levelsFor } from '../src/islands/firstSea.js';
import { SEA2, GATES, ARRIVALS, seaOf } from '../src/islands/secondSea.js';
import { SEA3, ENIGMA, touchRune } from '../src/islands/thirdSea.js';
import { fleetPlan } from '../src/ships/fleet.js';
import { BREATH, breathLanes, inLane, rodNear, BARRAGE, barrageTargets, auroraReached, normalizeIslands } from '../src/islands/islandRules.js';

const ALL = [...SEA, ...SEA2, ...SEA3];
const box = (x, z, half) => ({ x0: x - half, x1: x + half, z0: z - half, z1: z + half });
const overlap = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1;
function height(x, z) {
  for (const d of ALL) if (Math.max(Math.abs(x - d.x), Math.abs(z - d.z)) < d.R + 32) return seaHeight(d)(x - d.x, z - d.z);
  return -20;
}

describe('Terceiro Mar: ilhas 19 a 25', () => {
  it('sete ilhas com faixas seguidas de 1500 a 2400, no Terceiro Mar, com os chefes do doc 02', () => {
    expect(SEA3.map((d) => d.faixa)).toEqual([[1500, 1600], [1600, 1725], [1725, 1850], [1850, 1975], [1975, 2100], [2100, 2250], [2250, 2400]]);
    expect(SEA3.map((d) => d.boss.nome)).toEqual(['Almirante Mil-Velas', 'Dragão Ancião', 'Senhor dos Trovões', 'Marechal do Horizonte', 'Leviatã Ósseo', 'Avatar da Aurora', 'Soberano Esquecido']);
    for (const d of SEA3) expect(seaOf(d.z)).toBe(3);
  });

  it('nenhuma ilha dos três mares encosta em outra', () => {
    const boxes = ALL.map((d) => box(d.x, d.z, d.R + 32));
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(overlap(boxes[i], boxes[j]), `${ALL[i].id} × ${ALL[j].id}`).toBe(false);
  });

  it('acampamentos, chefes e praias em terra; níveis na faixa', () => {
    for (const d of SEA3) {
      const h = seaHeight(d);
      const s = seaSpots(d);
      for (const p of [s.camp, s.boss, ...s.enemies]) expect(h(p.x, p.z), d.id).toBeGreaterThan(1.4);
      expect(h(s.landing.x, s.landing.z), d.id).toBeGreaterThan(0.6);
      for (const lv of levelsFor(d)) expect(lv).toBeGreaterThanOrEqual(d.faixa[0]);
    }
  });

  it('o Portão do Horizonte e a chegada ficam em mar aberto, longe da Capital', () => {
    expect(height(GATES.horizonte.x, GATES.horizonte.z)).toBeLessThan(-5);
    expect(height(ARRIVALS.horizonte.x, ARRIVALS.horizonte.z)).toBeLessThan(-5);
  });

  it('navios corsários em volta das ilhas novas, em mar aberto', () => {
    const plan = fleetPlan(ALL);
    for (const d of SEA3) {
      const p = plan.find((x) => x.id === `navio-${d.id}`);
      expect(p, d.id).toBeDefined();
      for (const pt of p.route) expect(height(pt.x, pt.z), d.id).toBeLessThan(-2);
    }
  });
});

describe('mecânicas do Terceiro Mar', () => {
  it('Sopro Ancestral: faixas passam perto do jogador', () => {
    let s = 3;
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const p = { x: 10, z: -5 };
    const lanes = breathLanes({ x: 0, z: 0 }, 70, p, rand);
    expect(lanes.length).toBe(BREATH.lanes);
    expect(lanes.some((l) => inLane(l, p, BREATH.halfWidth + 3.5))).toBe(true);
  });

  it('para-raios protegem quem está perto', () => {
    const rods = [{ x: 0, z: 0 }];
    expect(rodNear(rods, { x: 3, z: 3 })).toBeTruthy();
    expect(rodNear(rods, { x: 30, z: 0 })).toBeNull();
  });

  it('saraivada: o primeiro tiro cai no jogador, os outros em volta', () => {
    const t = barrageTargets(BARRAGE.fortaleza, { x: 5, z: 5 }, Math.random);
    expect(t[0]).toMatchObject({ x: 5, z: 5 });
    for (const q of t) expect(Math.hypot(q.x - 5, q.z - 5)).toBeLessThanOrEqual(BARRAGE.fortaleza.spread + 1e-6);
  });

  it('prova da Aurora: só vale no alto do santuário', () => {
    const shrine = { x: 0, y: 40, z: 0 };
    expect(auroraReached(shrine, { x: 1, y: 40, z: 1 })).toBe(true);
    expect(auroraReached(shrine, { x: 1, y: 10, z: 1 })).toBe(false);
  });

  it('enigma: três pedras na ordem revelam a Ilha Oculta; errar recomeça', () => {
    const st = { step: 0, revealed: false };
    expect(touchRune(st, 1)).toBe('errada');
    expect(touchRune(st, 0)).toBe('certa');
    expect(touchRune(st, 2)).toBe('errada');
    expect(st.step).toBe(0);
    expect(touchRune(st, 0)).toBe('certa');
    expect(touchRune(st, 1)).toBe('certa');
    expect(touchRune(st, 2)).toBe('revelou');
    expect(st.revealed).toBe(true);
    expect(SEA3.filter((d) => d.runa !== undefined).map((d) => d.id)).toEqual(ENIGMA.order);
    expect(normalizeIslands({ oculta: { step: 9, revealed: 1 } }).oculta).toEqual({ step: 3, revealed: true });
  });
});
