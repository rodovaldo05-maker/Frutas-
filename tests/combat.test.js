import { describe, it, expect } from 'vitest';
import { ATTACKS, COMBO, AttackRunner, Guard, computeDamage, inReach, isFrontal, timing, GUARD } from '../src/combat/rules.js';
import { newTraining, TrainingTracker, bonuses, ATTRS } from '../src/progression/training.js';
import { damageMultipliers } from '../src/progression/status.js';

const run = (runner, seconds, onFrame = () => {}) => {
  const strikes = [];
  for (let i = 0; i < Math.round(seconds * 60); i++) {
    onFrame(i / 60, runner);
    const s = runner.update(1 / 60);
    if (s) strikes.push(s.id);
  }
  return strikes;
};

describe('golpes e combo', () => {
  it('os golpes usam o tempo de contato dos clipes do laboratório', () => {
    const t = timing('jab');
    expect(t.release).toBeCloseTo(0.1);
    expect(t.duration).toBeCloseTo(0.35);
    expect(timing('gancho').release).toBeGreaterThan(t.release);
  });

  it('um aperto dá um golpe; apertos emendados fazem Jab → Direto → Gancho', () => {
    const one = new AttackRunner();
    one.press();
    expect(run(one, 1)).toEqual(['jab']);

    const combo = new AttackRunner();
    const strikes = run(combo, 2.5, (t, r) => {
      if (r.current?.struck) r.press();
      if (t === 0) r.press();
    });
    expect(strikes.slice(0, 3)).toEqual(COMBO);
  });

  it('depois do gancho o combo recomeça', () => {
    const r = new AttackRunner();
    const strikes = run(r, 4, (t, rr) => {
      if (t === 0 || rr.current?.struck) rr.press();
    });
    expect(strikes.slice(0, 4)).toEqual(['jab', 'direto', 'gancho', 'jab']);
  });
});

describe('dano, alcance e defesa', () => {
  it('fórmula: base × (1 + 3% por ponto de Força) × 100/(100 + defesa)', () => {
    expect(computeDamage(10)).toBe(10);
    expect(computeDamage(10, { mult: damageMultipliers({ forca: 10 }).melee })).toBe(13);
    expect(computeDamage(10, { defense: 100 })).toBe(5);
    expect(computeDamage(20, { mitigation: 0.15 })).toBe(17);
  });

  it('o golpe só alcança quem está na frente e perto', () => {
    const a = { x: 0, y: 0, z: 0, yaw: 0 };
    expect(inReach(a, { x: 0, y: 0, z: 3 }, ATTACKS.jab)).toBe(true);
    expect(inReach(a, { x: 0, y: 0, z: -3 }, ATTACKS.jab)).toBe(false);
    expect(inReach(a, { x: 0, y: 0, z: 9 }, ATTACKS.jab)).toBe(false);
    expect(inReach(a, { x: 0, y: 8, z: 3 }, ATTACKS.jab)).toBe(false);
  });

  it('defesa de frente reduz 70%; defesa perfeita anula; postura zerada quebra a guarda', () => {
    const g = new Guard();
    g.set(true, 0);
    expect(g.receive(20, 10, { frontal: true }).result).toBe('perfect');
    g.set(true, 0.5);
    const b = g.receive(20, 10, { frontal: true });
    expect(b).toEqual({ result: 'block', damage: 6 });
    expect(g.receive(20, 10, { frontal: false }).result).toBe('hit');
    let last;
    for (let i = 0; i < 12 && last?.result !== 'break'; i++) last = g.receive(20, 10, { frontal: true });
    expect(last.result).toBe('break');
    expect(g.stun).toBeCloseTo(GUARD.breakStun);
    expect(g.holding).toBe(false);
  });

  it('postura volta depois de um tempo sem apanhar', () => {
    const g = new Guard();
    g.set(true, 0);
    g.set(true, 1);
    g.receive(10, 50, { frontal: true });
    expect(g.posture).toBe(50);
    for (let i = 0; i < 60; i++) g.update(1 / 60);
    expect(g.posture).toBe(50);
    for (let i = 0; i < 180; i++) g.update(1 / 60);
    expect(g.posture).toBeGreaterThan(90);
  });

  it('de frente é o lado para onde o defensor olha', () => {
    expect(isFrontal({ x: 0, z: 0, yaw: 0 }, { x: 0, z: 3 })).toBe(true);
    expect(isFrontal({ x: 0, z: 0, yaw: Math.PI }, { x: 0, z: 3 })).toBe(false);
  });
});

describe('treino em combate', () => {
  const tracker = () => new TrainingTracker(newTraining());
  const pos = { x: 0, y: 0, z: 0 };

  it('Resistência, Reflexos e Defesa agora treinam', () => {
    expect(ATTRS.resistencia.ativo && ATTRS.reflexos.ativo && ATTRS.defesa.ativo).toBe(true);
  });

  it('acertar treina Força, com teto por oponente hostil', () => {
    const tr = tracker();
    for (let i = 0; i < 30; i++) tr.combat('acerto', { target: 'recruta-1', life: 1, hostile: true, attack: COMBO[i % 3], heavy: i % 3 === 2 }, pos);
    const a = tr.t.attrs.forca;
    const total = a.xp + (a.level - 1) * 120;
    expect(total).toBeLessThanOrEqual(12.01);
    expect(total).toBeGreaterThan(8);
  });

  it('bater no mesmo boneco com o mesmo golpe rende cada vez menos', () => {
    const tr = tracker();
    const gains = [];
    for (let i = 0; i < 6; i++) {
      const before = tr.t.attrs.forca.xp;
      tr.combat('acerto', { target: 'boneco-1', hostile: false, attack: 'jab' }, pos);
      gains.push(tr.t.attrs.forca.xp - before);
    }
    expect(gains[0]).toBe(1);
    expect(gains[5]).toBeLessThan(0.2);
  });

  it('apanhar de inimigo treina Resistência; de boneco ou queda não', () => {
    const tr = tracker();
    tr.combat('apanhar', { source: 'recruta-2', life: 1, hostile: true, amount: 8 }, pos);
    expect(tr.t.attrs.resistencia.xp).toBeCloseTo(2);
    tr.combat('apanhar', { source: 'queda', hostile: false, amount: 30 }, pos);
    expect(tr.t.attrs.resistencia.xp).toBeCloseTo(2);
  });

  it('defesa perfeita treina Defesa e Reflexos; esquiva de golpe real treina Reflexos', () => {
    const tr = tracker();
    tr.combat('defesa', { source: 'recruta-1', hostile: true, perfect: true }, pos);
    tr.combat('esquiva', { source: 'recruta-1', hostile: true }, pos);
    expect(tr.t.attrs.defesa.xp).toBe(4);
    expect(tr.t.attrs.reflexos.xp).toBe(4);
  });

  it('bônus de combate têm teto', () => {
    const t = newTraining();
    for (const k of ['resistencia', 'reflexos', 'defesa']) t.attrs[k].level = 100;
    const b = bonuses(t);
    expect(b.mitigation).toBeCloseTo(0.15);
    expect(b.perfectWindow).toBeCloseTo(0.2);
    expect(b.blockReduce).toBeCloseTo(0.8);
    expect(b.dodgeTime).toBeCloseTo(1.1);
  });
});

import { Recruta, Dummy, RECRUTA } from '../src/combat/enemies.js';
import * as THREE from 'three';

describe('Recrutas (IA sem gráficos)', () => {
  const field = { sample: () => 0 };
  const setup = (px, pz) => {
    const r = new Recruta({ id: 'recruta-1', x: 0, z: 0, field, visual: false });
    const player = { pos: new THREE.Vector3(px, 0, pz), yaw: Math.PI, alive: true };
    const hits = [];
    const arena = { token: null, recrutas: [r], hitPlayer: (e, atk, dmg) => { hits.push({ atk: atk.id, dmg }); return arena.reply ?? { result: 'hit' }; } };
    return { r, player, arena, hits };
  };
  const tick = (s, seconds, each = () => {}) => {
    for (let i = 0; i < Math.round(seconds * 60); i++) {
      s.r.update(1 / 60, s.player, s.arena);
      each(s);
    }
  };

  it('não percebe o jogador fora do acampamento', () => {
    const s = setup(30, 0);
    tick(s, 2);
    expect(s.r.state).toBe('idle');
  });

  it('chega perto, avisa (preparo) e só então bate', () => {
    const s = setup(7, 0);
    const states = [];
    tick(s, 6, (x) => states.push(x.r.state));
    const firstWindup = states.indexOf('windup');
    const firstAttack = states.indexOf('attack');
    expect(firstWindup).toBeGreaterThan(-1);
    expect(firstAttack - firstWindup).toBeGreaterThanOrEqual(Math.round(RECRUTA.windup * 60) - 1);
    expect(s.hits.length).toBeGreaterThan(0);
    expect(s.hits[0].dmg).toBeLessThan(12);
  });

  it('defesa perfeita atordoa o Recruta', () => {
    const s = setup(3, 0);
    s.arena.reply = { result: 'perfect', damage: 0 };
    let stunned = false;
    tick(s, 6, (x) => (stunned ||= x.r.state === 'stun'));
    expect(stunned).toBe(true);
  });

  it('apanhar interrompe o preparo; derrotado cai e volta depois', () => {
    const s = setup(3, 0);
    tick(s, 4, (x) => {
      if (x.r.state === 'windup' && !x.done) {
        x.done = true;
        x.r.receiveHit({ attacker: { x: 3, y: 0, z: 0, yaw: -Math.PI / 2 }, attack: ATTACKS.jab, damage: 10 });
      }
    });
    expect(s.done).toBe(true);
    let defeated = 0;
    s.r.onDefeated = () => (defeated += 1);
    s.r.receiveHit({ attacker: { x: 3, y: 0, z: 0, yaw: -Math.PI / 2 }, attack: ATTACKS.gancho, damage: 999 });
    expect(s.r.alive).toBe(false);
    expect(defeated).toBe(1);
    tick(s, 4 + RECRUTA.respawn + 0.5);
    expect(s.r.alive).toBe(true);
    expect(s.r.life).toBe(2);
    expect(s.r.health).toBe(RECRUTA.hp);
  });

  it('boneco aguenta tudo e conta os golpes', () => {
    const d = new Dummy({ id: 'boneco-1', x: 0, z: 0, field, visual: false });
    const r = d.receiveHit({ attacker: { x: 2, y: 0, z: 0 }, attack: ATTACKS.jab, damage: 10 });
    expect(r).toEqual({ result: 'hit', damage: 10 });
    expect(d.alive).toBe(true);
    expect(d.hits).toBe(1);
  });
});
