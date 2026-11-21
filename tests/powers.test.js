import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { FruitPowers } from '../src/combat/powers.js';
import { powersOf, SHAPE_IDS, UNLOCK } from '../src/fruits/powers.js';
import { fruitStyle, AttackRunner } from '../src/combat/rules.js';
import { Recruta } from '../src/combat/enemies.js';
import { addDomainXp, domainXpToNext, domainBonus, normalizeDomain } from '../src/progression/domain.js';
import { maxEnergy } from '../src/progression/status.js';
import { FRUTOMotion } from '../src/animation/fruto-motion.js';
import catalog from '../data/fruto-catalog.json';

const FRUITS = catalog.fruits;
const fruit = (id) => FRUITS.find((f) => f.id === id);

// controlador de mentira, parado no chão olhando para +z
function fakeCtl() {
  return {
    pos: new THREE.Vector3(0, 0, 0), yaw: 0, state: 'ground', health: 50, maxHealth: 100, invulnerable: 0, attackLock: 0, action: null,
    shove(x, z, d) { this.shoveV = { x, z, d }; },
  };
}
const dummyAt = (x, z, hostile = false) => ({
  id: `alvo-${x}-${z}`, pos: new THREE.Vector3(x, 0, z), alive: true, hostile, radius: 0.8, defense: 0, hits: [],
  receiveHit(h) { this.hits.push(h); return { result: 'hit', damage: h.damage }; },
});
function setup(id, level = 100) {
  const ctl = fakeCtl();
  const events = [];
  const p = new FruitPowers({ ctl, stats: () => ({ fruit: 1, domain: 1 }), onEvent: (n, d) => events.push([n, d]) });
  p.setFruit(fruit(id), powersOf(fruit(id)), level);
  return { ctl, p, events };
}
const run = (s, targets, seconds) => {
  for (let i = 0; i < Math.round(seconds * 60); i++) s.p.update(1 / 60, targets, true);
};

describe('poderes das frutas: dados', () => {
  it('as 16 frutas têm 3 habilidades com clipe existente', () => {
    expect(SHAPE_IDS.length).toBe(16);
    for (const f of FRUITS) {
      const list = powersOf(f);
      expect(list.length).toBe(3);
      for (const p of list) {
        expect(FRUTOMotion.clips[p.clip], `${f.id} ${p.nome} ${p.clip}`).toBeTruthy();
        expect(p.custo).toBeGreaterThan(0);
      }
    }
  });

  it('frutas com transformação usam as habilidades sem forma (até a atualização 13)', () => {
    expect(powersOf(fruit('lobo')).map((p) => p.nome)).toEqual(['Rasgo da Presa', 'Uivo de Caça', 'Caçada Lunar']);
  });

  it('cada fruta tem o próprio combo (golpes assinados do laboratório)', () => {
    const st = fruitStyle(fruit('brasa'));
    expect(st.combo).toEqual(['brasa_j1', 'brasa_j2', 'brasa_j3']);
    expect(st.attacks.brasa_j1.damage).toBe(9);
    const r = new AttackRunner(st);
    r.press();
    const ids = [];
    for (let i = 0; i < 60; i++) {
      const s = r.update(1 / 60);
      if (s) ids.push(s.id);
    }
    expect(ids).toEqual(['brasa_j1']);
    expect(fruitStyle(null).combo).toEqual(['jab', 'direto', 'gancho']);
  });

  it('energia: 100 + 4 por ponto de Vitalidade', () => {
    expect(maxEnergy({})).toBe(100);
    expect(maxEnergy({ vitalidade: 5 })).toBe(120);
  });
});

describe('poderes das frutas: uso', () => {
  it('gasta energia, entra em recarga e só libera no quadro de contato do clipe', () => {
    const s = setup('brasa');
    const t = dummyAt(0, 6);
    expect(s.p.cast(0, [t], true)).toBe(true);
    expect(s.p.energy).toBe(100 - 14);
    expect(s.p.cast(0, [t], true)).toBe(false); // já está usando
    const release = FRUTOMotion.clips.brasa0.release;
    run(s, [t], release - 0.05);
    expect(s.events.some(([n]) => n === 'release')).toBe(false);
    run(s, [t], 1.2);
    expect(s.events.some(([n]) => n === 'release')).toBe(true);
    expect(t.hits.length).toBe(1); // o projétil acerta
    expect(t.hits[0].damage).toBe(30);
    expect(t.hits[0].effect.burn).toBe(2);
    expect(s.p.cooldown[0]).toBeGreaterThan(0);
  });

  it('habilidades bloqueadas pelo domínio e sem energia', () => {
    const s = setup('geada', 1);
    expect(s.p.cast(1, [], true)).toBe(false);
    expect(s.events.at(-1)[1].message).toMatch(/domínio 5/);
    const s2 = setup('geada');
    s2.p.energy = 5;
    expect(s2.p.cast(0, [], true)).toBe(false);
    expect(s2.events.at(-1)[1].message).toMatch(/Energia/);
  });

  it('área atinge todos em volta; ponto marcado atinge depois do aviso', () => {
    const s = setup('geada');
    const near = [dummyAt(2, 2), dummyAt(-3, 1), dummyAt(20, 0)];
    s.p.cast(2, near, true);
    run(s, near, 2);
    expect(near[0].hits[0].effect.freeze).toBe(3);
    expect(near[1].hits.length).toBe(1);
    expect(near[2].hits.length).toBe(0);

    const c = setup('cristal');
    const far = dummyAt(0, 7);
    c.p.cast(2, [far], true);
    run(c, [far], FRUTOMotion.clips.cristal2.release + 0.6);
    expect(far.hits.length).toBe(0); // o geodo ainda não rompeu (0,8 s)
    run(c, [far], 0.5);
    expect(far.hits.length).toBe(1);
  });

  it('raio em cadeia salta por até três alvos', () => {
    const s = setup('tormenta');
    const ts = [dummyAt(0, 5), dummyAt(3, 8), dummyAt(6, 10), dummyAt(9, 12)];
    s.p.cast(0, ts, true);
    run(s, ts, 1);
    expect(ts.filter((t) => t.hits.length).length).toBe(3);
  });

  it('muralha de gelo segura golpes de frente', () => {
    const s = setup('geada');
    s.p.cast(1, [], true);
    run(s, [], 1);
    expect(s.p.wallBlocks({ x: 0, z: 5 })).toBe(true);
    expect(s.p.wallBlocks({ x: 0, z: -5 })).toBe(false);
    run(s, [], 4);
    expect(s.p.wallBlocks({ x: 0, z: 5 })).toBe(false);
  });

  it('Recruta congelado fica parado; puxão o traz para o centro', () => {
    const field = { sample: () => 0 };
    const r = new Recruta({ id: 'recruta-x', x: 0, z: 0, field, visual: false });
    r.receiveHit({ attacker: { x: 0, y: 0, z: -3, yaw: 0 }, attack: { posture: 10, knock: 2, reaction: 'leve' }, damage: 10, effect: { freeze: 2 } });
    expect(r.state).toBe('stun');
    expect(r.frozen).toBe(2);
    const arena = { token: null, recrutas: [r], hitPlayer: () => null };
    const player = { pos: new THREE.Vector3(0, 0, -3), alive: true };
    const before = r.pos.clone();
    for (let i = 0; i < 60; i++) r.update(1 / 60, player, arena);
    expect(r.pos.distanceTo(before)).toBeLessThan(0.05);
    for (let i = 0; i < 90; i++) r.update(1 / 60, player, arena);
    expect(r.frozen).toBe(0);

    const r2 = new Recruta({ id: 'recruta-y', x: 6, z: 0, field, visual: false });
    r2.receiveHit({ attacker: { x: 0, y: 0, z: 0, yaw: 0 }, attack: { posture: 10, knock: 1, reaction: 'leve' }, damage: 5, effect: { pull: new THREE.Vector3(0, 0, 0) } });
    for (let i = 0; i < 20; i++) r2.update(1 / 60, { pos: new THREE.Vector3(30, 0, 30), alive: true }, { token: null, recrutas: [r2], hitPlayer: () => null });
    expect(r2.pos.x).toBeLessThan(5);
  });
});

describe('domínio da fruta', () => {
  it('curva × 1,4 e bônus de dano até +30%', () => {
    expect(domainXpToNext(1)).toBe(Math.round(120 * 1.4));
    expect(domainBonus(1)).toBe(1);
    expect(domainBonus(100)).toBeCloseTo(1.3);
  });

  it('sobe por fruta e não apaga ao trocar', () => {
    const save = { domain: {} };
    expect(addDomainXp(save, 'brasa', 400)).toBeGreaterThan(1);
    addDomainXp(save, 'geada', 10);
    expect(save.domain.brasa.level).toBeGreaterThan(2);
    expect(save.domain.geada.level).toBe(1);
    expect(normalizeDomain({ brasa: { level: '7', xp: 3 }, x: { level: -2 } })).toEqual({ brasa: { level: 7, xp: 3 }, x: { level: 1, xp: 0 } });
  });

  it('as habilidades 2 e 3 abrem nos domínios 5 e 13', () => {
    expect(UNLOCK).toEqual([1, 5, 13]);
  });
});
