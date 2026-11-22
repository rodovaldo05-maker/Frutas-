import { describe, it, expect } from 'vitest';
import { generateVillage, validateVillage, VILLAGE_VERSION } from '../src/world/village.js';
import { OffsetHeightfield, WorldField } from '../src/terrain/offsetField.js';
import { Heightfield } from '../src/terrain/heightfield.js';
import { villageHeight, VILLAGE, DOCKS, BOATMEN } from '../src/islands/villageIsland.js';
import { islandHeight, ISLAND } from '../src/islands/trainingIsland.js';

const plain = (v) => JSON.stringify({ streets: v.streets, buildings: v.buildings, props: v.props });

describe('gerador de vilas', () => {
  it('mesma semente e mesma versão geram a mesma vila', () => {
    const a = generateVillage({ seed: VILLAGE.seed });
    const b = generateVillage({ seed: VILLAGE.seed });
    expect(a.version).toBe(VILLAGE_VERSION);
    expect(plain(a)).toBe(plain(b));
  });

  it('sementes diferentes geram vilas diferentes', () => {
    expect(plain(generateVillage({ seed: 7 }))).not.toBe(plain(generateVillage({ seed: 8 })));
  });

  it('sem sobreposição, porta com acesso, casa fora da rua e serviços presentes (várias sementes)', () => {
    for (const seed of [1, 7, 8, 42, 2024, VILLAGE.seed]) {
      const v = generateVillage({ seed });
      expect(validateVillage(v)).toEqual([]);
      const tipos = v.buildings.map((b) => b.tipo);
      for (const t of ['prefeitura', 'mercado', 'taverna', 'ferreiro', 'loja-frutas']) expect(tipos).toContain(t);
      expect(v.buildings.length).toBeGreaterThanOrEqual(14);
    }
  });

  it('a validação acusa casas sobrepostas e serviço faltando', () => {
    const v = generateVillage({ seed: 3 });
    const copy = { ...v, buildings: v.buildings.filter((b) => b.tipo !== 'taverna') };
    copy.buildings.push({ ...copy.buildings[0], id: 'clone' });
    const problems = validateVillage(copy);
    expect(problems.some((p) => p.startsWith('sobreposição'))).toBe(true);
    expect(problems).toContain('falta taverna');
  });

  it('a avenida do cais aponta para o cais e é mais longa', () => {
    const v = generateVillage({ seed: VILLAGE.seed, dockAngle: Math.PI });
    const av = v.streets.find((s) => s.id === 'av-0');
    expect(av.b[0]).toBeLessThan(-60);
    expect(Math.abs(av.b[1])).toBeLessThan(1);
  });
});

describe('ilhas no mundo', () => {
  const training = new Heightfield({ half: ISLAND.half, spacing: 3, height: islandHeight });
  const village = new OffsetHeightfield({ half: VILLAGE.half, spacing: 3, height: villageHeight, ox: VILLAGE.offset.x, oz: VILLAGE.offset.z });
  const world = new WorldField([training, village]);

  it('o campo deslocado responde em coordenadas do mundo', () => {
    const o = VILLAGE.offset;
    expect(village.sample(o.x, o.z)).toBeCloseTo(villageHeight(0, 0), 5);
    expect(village.sampleLocal(0, 0)).toBeCloseTo(villageHeight(0, 0), 5);
    expect(village.inside(o.x + 10, o.z)).toBe(true);
    expect(village.inside(0, 0)).toBe(false);
  });

  it('as duas ilhas não se sobrepõem e o mar entre elas é fundo', () => {
    expect(ISLAND.half + VILLAGE.half).toBeLessThan(VILLAGE.offset.x);
    expect(world.fieldAt(0, 0)).toBe(training);
    expect(world.fieldAt(VILLAGE.offset.x, 0)).toBe(village);
    expect(world.inside(ISLAND.half + 20, 0)).toBe(false);
    expect(world.sample(ISLAND.half + 20, 0)).toBeLessThan(-5);
  });

  it('a praça da vila é plana e acima do mar', () => {
    for (const [x, z] of [[0, 0], [20, -10], [-30, 25], [40, 30]]) expect(villageHeight(x, z)).toBeCloseTo(VILLAGE.plateau, 1);
  });

  it('cada cais tem um Barqueiro que leva ao outro cais', () => {
    expect(BOATMEN.map((b) => b.to).sort()).toEqual(['porto', 'treino']);
    for (const b of BOATMEN) {
      const dest = DOCKS[b.to];
      const back = BOATMEN.find((o) => o.to !== b.to);
      // a chegada fica perto do Barqueiro da volta
      expect(Math.hypot(dest.x - back.x, dest.z - back.z)).toBeLessThan(7);
    }
    expect(village.inside(DOCKS.porto.x, DOCKS.porto.z)).toBe(true);
    expect(training.inside(DOCKS.treino.x, DOCKS.treino.z)).toBe(true);
  });
});
