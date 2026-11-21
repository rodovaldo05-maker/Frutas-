import { describe, it, expect } from 'vitest';
import { Heightfield } from '../src/terrain/heightfield.js';
import { islandHeight } from '../src/islands/trainingIsland.js';
import { waveHeight, calmAt } from '../src/ocean/ocean.js';

describe('relevo', () => {
  const field = new Heightfield({ half: 6, spacing: 1, height: (x, z) => x * 0.5 + z * 0.25 });

  it('a altura amostrada fica no plano dos triângulos', () => {
    for (const [x, z] of [[0.3, 0.2], [-2.7, 4.1], [5.5, -5.5]]) {
      expect(field.sample(x, z)).toBeCloseTo(x * 0.5 + z * 0.25, 5);
    }
  });

  it('a inclinação volta junto', () => {
    const g = {};
    field.sample(1.2, 1.7, g);
    expect(g.x).toBeCloseTo(0.5);
    expect(g.z).toBeCloseTo(0.25);
  });

  it('a ilha tem praia, platô alto ao norte e lagoa funda', () => {
    expect(islandHeight(0, 71)).toBeGreaterThan(0.6);
    expect(islandHeight(0, 71)).toBeLessThan(2.6);
    expect(islandHeight(0, -55)).toBeGreaterThan(14);
    expect(islandHeight(-50, 16)).toBeLessThan(-5);
    expect(islandHeight(0, 130)).toBeLessThan(-8);
  });
});

describe('mar', () => {
  it('as ondas são suaves perto da ilha e maiores no mar aberto', () => {
    expect(calmAt(0, 0)).toBeLessThan(0.4);
    expect(calmAt(0, 140)).toBeGreaterThan(0.95);
    let max = 0;
    for (let t = 0; t < 10; t += 0.37) max = Math.max(max, Math.abs(waveHeight(-50, 16, t)));
    expect(max).toBeLessThan(0.25);
  });
});
