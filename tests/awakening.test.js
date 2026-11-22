import { describe, it, expect, beforeAll } from 'vitest';
import * as THREE from 'three';
import { raceMods, normalizeRace, SPECS, SPEC_LEVEL, SPEC_UP_LEVEL, RACE_TRIAL } from '../src/races/races.js';
import { RaceSystem } from '../src/races/raceSystem.js';
import { AWAKEN, awakenState, trialHit, normalizeAwaken, trialProgress } from '../src/fruits/awakening.js';
import { FruitPowers } from '../src/combat/powers.js';
import { powersOf } from '../src/fruits/powers.js';
import { FORMS, FORM_IDS, FORM_UNLOCK, formBlock, formMods, addFormParts, removeFormParts } from '../src/transformations/forms.js';
import { migrate, newSave } from '../src/saves/saveSystem.js';
import { makeSim } from './helpers/sim.js';
import { MOVE } from '../src/movement/config.js';
import catalog from '../data/fruto-catalog.json';

const fruit = (id) => catalog.fruits.find((f) => f.id === id);

describe('especialização racial', () => {
  it('as quatro raças têm duas trilhas', () => {
    for (const r of ['humano', 'aquatico', 'ghoul', 'ceu']) expect(Object.keys(SPECS[r])).toHaveLength(2);
  });

  it('só vale a partir da maestria 40 e melhora na 80', () => {
    expect(raceMods('humano', SPEC_LEVEL - 1, 'versatil').adaptTime).toBe(10);
    expect(raceMods('humano', SPEC_LEVEL, 'versatil').adaptTime).toBe(15);
    expect(raceMods('humano', SPEC_UP_LEVEL, 'versatil').adaptTime).toBe(20);
    expect(raceMods('ghoul', 50, 'essencia').fruitDamage).toBeCloseTo(1.2 * 1.1);
    expect(raceMods('ghoul', 80, 'essencia').fruitCd).toBe(0.9);
    expect(raceMods('aquatico', 40, 'mareViva').waterRegen).toBe(2);
    expect(raceMods('ceu', 40, 'planador').glideSpeed).toBe(1.25);
    expect(raceMods('ceu', 80, 'acrobata').extraJumps).toBe(raceMods('ceu', 80).extraJumps + 1);
    // trilha de outra raça não vale
    expect(raceMods('humano', 60, 'planador').glideSpeed).toBe(1);
  });

  it('o salvo descarta trilha de outra raça e despertar antes da maestria 100', () => {
    const s = normalizeRace({ race: 'humano', raceMastery: { level: 50 }, raceSpec: 'faminto', raceAwakened: true });
    expect(s.raceSpec).toBeNull();
    expect(s.raceAwakened).toBe(false);
    const ok = migrate({ ...newSave(), race: 'ghoul', raceMastery: { level: 100, xp: 0 }, raceSpec: 'faminto', raceAwakened: true });
    expect(ok.raceSpec).toBe('faminto');
    expect(ok.raceAwakened).toBe(true);
  });

  it('despertar racial: recarga pela metade e efeito 50% mais forte', () => {
    const a = raceMods('aquatico', 100, null, true);
    expect(a.activeCd).toBe(0.5);
    expect(a.activePower).toBe(1.5);
    expect(raceMods('aquatico', 99, null, true).activeCd).toBe(1);
  });
});

describe('prova racial', () => {
  const setup = (level = 100) => {
    const events = [];
    const save = { race: 'humano', raceMastery: { level, xp: 0 }, raceAwakened: false };
    const sys = new RaceSystem({ ctl: {}, save, onEvent: (n, d) => events.push([n, d]) });
    return { save, sys, events };
  };

  it('só abre na maestria 100', () => {
    expect(setup(99).sys.startTrial()).toBe(false);
  });

  it('três Recrutas elementais diferentes despertam a raça', () => {
    const { save, sys } = setup();
    expect(sys.startTrial()).toBe(true);
    sys.onTrialKill({ element: 'fogo' });
    sys.onTrialKill({ element: 'fogo' });
    sys.onTrialKill({});
    expect(save.raceAwakened).toBe(false);
    sys.onTrialKill({ element: 'gelo' });
    sys.onTrialKill({ element: 'raio' });
    expect(save.raceAwakened).toBe(true);
  });

  it('desmaiar ou estourar o tempo falha a prova', () => {
    const a = setup();
    a.sys.startTrial();
    a.sys.onFaint();
    expect(a.sys.trial).toBeNull();
    const b = setup();
    b.sys.startTrial();
    b.sys.update(RACE_TRIAL.tempo + 1);
    expect(b.sys.trial).toBeNull();
    expect(b.events.some(([n, d]) => n === 'trial' && d.failed)).toBe(true);
  });
});

describe('despertar das frutas', () => {
  it('bloqueado antes do domínio 59; prova de 30 acertos libera', () => {
    const save = {};
    expect(awakenState(save, 'brasa', 58)).toBe('bloqueado');
    expect(awakenState(save, 'brasa', 59)).toBe('prova');
    expect(trialHit(save, 'brasa', 30)).toBe(false); // domínio baixo não conta
    for (let i = 0; i < AWAKEN.trialHits - 1; i++) expect(trialHit(save, 'brasa', 60)).toBe(false);
    expect(trialProgress(save, 'brasa')).toBe(AWAKEN.trialHits - 1);
    expect(trialHit(save, 'brasa', 60)).toBe(true);
    expect(awakenState(save, 'brasa', 60)).toBe('liberado');
    expect(awakenState(save, 'geada', 60)).toBe('prova'); // é por fruta
    expect(normalizeAwaken({ awakened: { brasa: true, x: 'sim' }, awakenTrial: { fruit: 1 } })).toMatchObject({ awakened: { brasa: true }, awakenTrial: null });
  });

  const fakeCtl = () => ({ pos: new THREE.Vector3(), yaw: 0, state: 'ground', health: 100, maxHealth: 100, invulnerable: 0, attackLock: 0, action: null, shove() {} });
  const target = () => ({ id: 't', pos: new THREE.Vector3(0, 0, 3), alive: true, hostile: true, radius: 0.8, defense: 0, hits: [], receiveHit(h) { this.hits.push(h); return { result: 'hit', damage: h.damage }; } });

  it('ligar exige 45 de energia, custa 15 e gasta 4 por segundo até acabar', () => {
    const p = new FruitPowers({ ctl: fakeCtl(), stats: () => ({ fruit: 1, domain: 1 }) });
    p.setFruit(fruit('brasa'), powersOf(fruit('brasa')), 60);
    p.energy = 40;
    expect(p.toggleAwaken()).toBe(false);
    p.energy = 100;
    expect(p.toggleAwaken()).toBe(true);
    expect(p.energy).toBe(85);
    for (let i = 0; i < 60; i++) p.update(1 / 60, [], true);
    expect(p.energy).toBeCloseTo(81, 0);
    for (let i = 0; i < 60 * 30; i++) p.update(1 / 60, [], true);
    expect(p.awakened).toBe(false);
  });

  it('desperto: +30% de dano e recargas 50% mais rápidas; trocar de fruta desliga', () => {
    const dmg = (wake) => {
      const p = new FruitPowers({ ctl: fakeCtl(), stats: () => ({ fruit: 1, domain: 1 }) });
      p.setFruit(fruit('brasa'), powersOf(fruit('brasa')), 60);
      if (wake) p.toggleAwaken();
      const t = target();
      p.hit(t, p.powers[0]);
      return t.hits[0].damage;
    };
    expect(dmg(true)).toBeGreaterThan(dmg(false) * 1.2);
    const p = new FruitPowers({ ctl: fakeCtl(), stats: () => ({ fruit: 1, domain: 1 }) });
    p.setFruit(fruit('brasa'), powersOf(fruit('brasa')), 60);
    p.cooldown[0] = 3;
    p.toggleAwaken();
    for (let i = 0; i < 60; i++) p.update(1 / 60, [], true);
    expect(p.cooldown[0]).toBeCloseTo(1.5, 1);
    p.setFruit(fruit('geada'), powersOf(fruit('geada')), 60);
    expect(p.awakened).toBe(false);
  });
});

describe('formas híbridas', () => {
  it('só frutas de fera e a partir do domínio 20', () => {
    expect(FORM_IDS.sort()).toEqual(['besta', 'falcao', 'fenix', 'lobo', 'ocidental', 'oriental']);
    expect(formBlock('brasa', 80)).toMatch(/fera/);
    expect(formBlock('lobo', FORM_UNLOCK - 1)).toMatch(/domínio/);
    expect(formBlock('lobo', FORM_UNLOCK)).toBeNull();
    expect(formMods(null)).toMatchObject({ speed: 1, melee: 1, fruit: 1, extraJumps: 0 });
    expect(formMods('lobo').speed).toBe(1.2);
    for (const id of ['falcao', 'fenix', 'oriental', 'ocidental']) expect(formMods(id).extraJumps).toBe(2);
  });

  it('as partes entram no corpo e saem sem sobrar nada', () => {
    const joints = Object.fromEntries(['cabeca', 'tronco', 'cintura', 'mao_E', 'mao_D'].map((k) => [k, new THREE.Group()]));
    const count = () => Object.values(joints).reduce((n, j) => n + j.children.length, 0);
    for (const id of FORM_IDS) {
      const info = addFormParts({ joints }, id, '#ff0000');
      expect(count()).toBeGreaterThan(0);
      if (['falcao', 'fenix', 'ocidental'].includes(id)) expect(info.wings.length).toBe(2);
      removeFormParts(info);
      expect(count()).toBe(0);
    }
    expect(Object.keys(FORMS)).toHaveLength(6);
  });
});

describe('forma no controlador', () => {
  let sim;
  beforeAll(async () => {
    sim = await makeSim();
  }, 60000);

  it('a velocidade da forma (Lobo +20%) vale na corrida', () => {
    sim.place(0, 71, Math.PI);
    sim.ctl.speedMult = 1.2;
    sim.run(2, () => ({ moveY: 1 }));
    expect(sim.ctl.speed).toBeCloseTo(MOVE.run * 1.2, 0);
    sim.ctl.speedMult = 1;
  });
});
