import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { RACES, RACE_IDS, raceMods, addRaceXp, raceXpToNext, normalizeRace } from '../src/races/races.js';
import { RaceSystem } from '../src/races/raceSystem.js';
import { migrate } from '../src/saves/saveSystem.js';
import { xpToNext } from '../src/progression/training.js';
import { makeSim } from './helpers/sim.js';

describe('quatro raças (atualização 5)', () => {
  it('cada raça tem passivas, ativa, treino, limitação e marcos 20/40/60/80/100', () => {
    expect(RACE_IDS).toEqual(['humano', 'aquatico', 'ghoul', 'ceu']);
    for (const id of RACE_IDS) {
      const r = RACES[id];
      expect(r.passivas.length).toBeGreaterThanOrEqual(3);
      expect(r.ativa.recarga).toBeGreaterThan(0);
      expect(Object.keys(r.marcos)).toEqual(['20', '40', '60', '80', '100']);
    }
  });

  it('passivas do documento: Ghoul só reforça fruta, Aquático tira só o dano da água, Céu tem 3 saltos extras', () => {
    expect(raceMods('ghoul').fruitDamage).toBeCloseTo(1.2);
    expect(raceMods('humano').fruitDamage).toBe(1);
    const aq = raceMods('aquatico');
    expect(aq.noWaterDamage && aq.breathesWater).toBe(true);
    expect(aq.swimSpeed).toBeCloseTo(1.35);
    expect(raceMods('ceu').extraJumps + 1).toBe(3); // + o salto duplo de todos
    expect(raceMods('ceu', 60).extraJumps + 1).toBe(4); // Quinto Impulso
    expect(raceMods('humano').xpPhysical).toBeCloseTo(1.15);
    expect(raceMods(null).extraJumps).toBe(0);
  });

  it('maestria racial: curva × 1,25 e marcos com nome', () => {
    expect(raceXpToNext(1)).toBe(Math.round(xpToNext(1) * 1.25));
    const s = normalizeRace({ race: 'ceu', raceMastery: null });
    let total = 0;
    for (let l = 1; l < 20; l++) total += raceXpToNext(l);
    const reached = addRaceXp(s, total);
    expect(s.raceMastery.level).toBe(20);
    expect(reached.at(-1)).toEqual({ level: 20, nome: 'Pouso Leve' });
    expect(addRaceXp({ race: null, raceMastery: { level: 1, xp: 0 } }, 100)).toEqual([]);
  });

  it('salvo antigo pede a escolha; raça inválida é limpa', () => {
    expect(migrate({ version: 5, level: 3 }).race).toBe(null);
    expect(migrate({ version: 5, race: 'dragao' }).race).toBe(null);
    expect(migrate({ version: 5, race: 'ghoul', raceMastery: { level: '7', xp: 3 } }).raceMastery).toEqual({ level: 7, xp: 3 });
  });

  it('Homem do Céu: 4 impulsos sem tocar o chão; Humano: só o salto duplo', async () => {
    for (const [race, expected] of [['ceu', 3], ['humano', 1]]) {
      const sim = await makeSim();
      sim.place(0, 60, 0);
      const m = raceMods(race);
      sim.ctl.race = { extraJumps: m.extraJumps, jumpMult: m.jumpMult, fallMult: m.fallMult, noWaterDamage: m.noWaterDamage, breathesWater: m.breathesWater };
      let maxAir = 0;
      sim.run(1.6, (t, c) => {
        const f = Math.round(t * 60);
        const press = [5, 25, 45, 65, 85].includes(f);
        maxAir = Math.max(maxAir, c.airJumps);
        return { jumpPressed: press, jump: press };
      });
      expect(maxAir).toBe(expected);
    }
  });

  it('ativas: Sifão devolve energia só em inimigo; Passo Celeste só no ar', () => {
    const ctl = { pos: new THREE.Vector3(), yaw: 0, state: 'ground', vel: new THREE.Vector3(), wish: { x: 0, z: 1, mag: 1 }, faint: 0, busyT: 0, stamina: { spend: () => true }, shove() {} };
    const events = [];
    const ghoul = new RaceSystem({ ctl, save: normalizeRace({ race: 'ghoul' }), onEvent: (n, d) => events.push([n, d]) });
    const foe = { pos: new THREE.Vector3(0, 0, 2.5), alive: true, hostile: true, receiveHit: () => ({ result: 'hit', damage: 12 }) };
    const powers = { energy: 10, energyMax: 100 };
    ghoul.activate({ targets: [foe], powers });
    expect(powers.energy).toBe(28);
    expect(ghoul.cooldown).toBe(12);
    expect(ghoul.save.raceMastery.xp).toBe(3);

    const sky = new RaceSystem({ ctl, save: normalizeRace({ race: 'ceu' }), onEvent: (n, d) => events.push([n, d]) });
    sky.activate({ targets: [] });
    expect(sky.cooldown).toBe(0);
    expect(events.at(-1)[1].message).toMatch(/só no ar/);
    ctl.state = 'air';
    sky.activate({ targets: [] });
    expect(ctl.vel.z).toBeCloseTo(15);
  });
});
