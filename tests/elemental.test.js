import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { Conditions } from '../src/combat/conditions.js';
import { Recruta, RECRUTAS_ELEMENTAIS } from '../src/combat/enemies.js';
import { newTraining, TrainingTracker, bonuses, METER } from '../src/progression/training.js';

const fakeCtl = () => ({ state: 'ground', inWater: false, stunned: 0, slowMult: 1, hp: 100, damage(n) { this.hp -= n; } });
const run = (c, ctl, s) => { for (let i = 0; i < Math.round(s * 60); i++) c.update(1 / 60, ctl); };

describe('condições (atualização 6)', () => {
  it('queimando acumula até 3, tira vida a cada 0,5 s e a água apaga', () => {
    const c = new Conditions();
    const ctl = fakeCtl();
    for (let i = 0; i < 5; i++) c.apply('queimando', { duration: 4, stacks: 1 });
    expect(c.get('queimando').stacks).toBe(3);
    run(c, ctl, 1.05);
    expect(ctl.hp).toBe(100 - 4 * 2);
    ctl.state = 'swim';
    run(c, ctl, 0.1);
    expect(c.has('queimando')).toBe(false);
    expect(c.has('molhado')).toBe(true);
    expect(c.apply('queimando', { duration: 4 })).toBe(null); // molhado não pega fogo
  });

  it('choque: 3 cargas atordoam; molhado ganha carga extra', () => {
    const c = new Conditions();
    const ctl = fakeCtl();
    c.apply('choque', { stacks: 1 });
    c.apply('choque', { stacks: 1 });
    expect(c.has('atordoado')).toBe(false);
    expect(c.apply('choque', { stacks: 1 })).toBe('atordoado');
    run(c, ctl, 0.05);
    expect(ctl.stunned).toBeGreaterThan(0.6);
    const w = new Conditions();
    w.apply('molhado', { duration: 8 });
    w.apply('choque', { stacks: 1 });
    expect(w.apply('choque', { stacks: 1 })).toBe('atordoado');
  });

  it('congelado trava, lento reduz a velocidade e rolar encurta o fogo', () => {
    const c = new Conditions();
    const ctl = fakeCtl();
    c.apply('congelado', { duration: 1.2 });
    c.apply('lento', { duration: 2 });
    run(c, ctl, 0.1);
    expect(ctl.stunned).toBeGreaterThan(1);
    expect(ctl.slowMult).toBeCloseTo(0.6);
    run(c, ctl, 2.1);
    expect(ctl.slowMult).toBe(1);
    c.apply('queimando', { duration: 4 });
    c.onRoll();
    expect(c.get('queimando').t).toBeCloseTo(2.5);
  });

  it('Resistência Elemental encurta as condições (teto de −20%)', () => {
    const t = newTraining();
    t.attrs.elemental.level = 100;
    const b = bonuses(t);
    expect(b.condDuration).toBeCloseTo(0.8);
    expect(b.elementalMit).toBeCloseTo(0.15);
    const c = new Conditions({ resist: () => ({ duration: b.condDuration }) });
    c.apply('congelado', { duration: 1 });
    expect(c.get('congelado').t).toBeCloseTo(0.8);
  });
});

describe('Recrutas elementais', () => {
  it('avisam no chão onde o jogador estava e resolvem depois de 0,9 s', () => {
    const field = { sample: () => 0 };
    const r = new Recruta({ id: 'elemental-fogo', x: 0, z: 0, field, def: RECRUTAS_ELEMENTAIS.fogo, visual: false });
    const marks = [];
    const hits = [];
    const arena = { token: null, recrutas: [r], hitPlayer: () => ({ result: 'hit' }), onSpecial: (e, at) => marks.push(at.clone()), resolveSpecial: (e, at, sp) => hits.push([at.clone(), sp]) };
    const player = { pos: new THREE.Vector3(8, 0, 0), alive: true };
    r.specialCd = 0;
    for (let i = 0; i < 60 * 3 && !hits.length; i++) r.update(1 / 60, player, arena);
    expect(marks.length).toBe(1);
    expect(marks[0].x).toBeCloseTo(8, 0);
    expect(hits.length).toBe(1);
    expect(hits[0][1].effects.queimando.stacks).toBe(2);
  });

  it('cada elemento tem golpe com condição e ataque marcado próprio', () => {
    expect(Object.keys(RECRUTAS_ELEMENTAIS)).toEqual(['fogo', 'gelo', 'raio']);
    expect(RECRUTAS_ELEMENTAIS.gelo.special.effects.congelado.duration).toBeCloseTo(1.2);
    expect(RECRUTAS_ELEMENTAIS.raio.meleeEffects.choque.stacks).toBe(1);
  });
});

describe('Voo e Resistência Elemental treinam', () => {
  it('planar se deslocando dá XP de Voo; parado no ar não', () => {
    const tr = new TrainingTracker(newTraining());
    const ctl = { pos: { x: 0, y: 20, z: 0 }, state: 'glide', speed: 8 * METER };
    for (let i = 0; i < 60 * 12; i++) {
      ctl.pos = { x: ctl.pos.x + (8 * METER) / 60, y: ctl.pos.y, z: 0 };
      tr.step(1 / 60, ctl);
    }
    const voo = tr.t.attrs.voo.xp + tr.acc.voo;
    expect(voo).toBeGreaterThan(3);
    const tr2 = new TrainingTracker(newTraining());
    const still = { pos: { x: 0, y: 20, z: 0 }, state: 'glide', speed: 0 };
    for (let i = 0; i < 600; i++) tr2.step(1 / 60, still);
    expect(tr2.t.attrs.voo.xp + (tr2.acc.voo || 0)).toBe(0);
  });

  it('golpes elementais de inimigos dão Resistência Elemental, com teto e bônus por variar', () => {
    const tr = new TrainingTracker(newTraining());
    const pos = { x: 0, y: 0, z: 0 };
    tr.combat('elemental', { source: 'e1', life: 1, hostile: true, element: 'fogo', amount: 8 }, pos);
    expect(tr.t.attrs.elemental.xp).toBeCloseTo(2);
    tr.combat('elemental', { source: 'e2', life: 1, hostile: true, element: 'gelo', amount: 8 }, pos);
    expect(tr.t.attrs.elemental.xp).toBeCloseTo(5);
    tr.combat('elemental', { source: 'boneco', hostile: false, element: 'fogo', amount: 8 }, pos);
    expect(tr.t.attrs.elemental.xp).toBeCloseTo(5);
  });
});
