import { describe, it, expect } from 'vitest';
import { JumpGate, Stamina, groundSpeed, fallDamage, dashClip } from '../src/movement/rules.js';
import { MOVE, STAMINA } from '../src/movement/config.js';

const dt = 1 / 60;

describe('regras do movimento', () => {
  it('velocidade pelo direcional: anda devagar, anda, corre e agacha', () => {
    expect(groundSpeed(0.05)).toBe(0);
    expect(groundSpeed(0.55)).toBeCloseTo(MOVE.walk);
    expect(groundSpeed(1)).toBeCloseTo(MOVE.run);
    expect(groundSpeed(1, { sprinting: true })).toBe(MOVE.sprint);
    expect(groundSpeed(1, { crouched: true, sprinting: true })).toBeCloseTo(MOVE.crouch);
  });

  it('buffer de salto: apertar pouco antes de tocar o chão vale', () => {
    const g = new JumpGate();
    g.update(dt, { grounded: false, pressed: true });
    for (let i = 0; i < 6; i++) g.update(dt, { grounded: false, pressed: false }); // 0,1 s no ar
    g.update(dt, { grounded: true, pressed: false });
    expect(g.ready()).toBe(true);
  });

  it('buffer de salto expira depois de 0,15 s', () => {
    const g = new JumpGate();
    g.update(dt, { grounded: false, pressed: true });
    for (let i = 0; i < 12; i++) g.update(dt, { grounded: false, pressed: false });
    g.update(dt, { grounded: true, pressed: false });
    expect(g.ready()).toBe(false);
  });

  it('coyote time: ainda pula logo depois de sair da borda', () => {
    const g = new JumpGate();
    g.update(dt, { grounded: true, pressed: false });
    for (let i = 0; i < 5; i++) g.update(dt, { grounded: false, pressed: false }); // 0,083 s
    g.update(dt, { grounded: false, pressed: true });
    expect(g.ready()).toBe(true);
    for (let i = 0; i < 10; i++) g.update(dt, { grounded: false, pressed: false });
    g.update(dt, { grounded: false, pressed: true });
    expect(g.ready()).toBe(false);
  });

  it('fôlego: gasta, espera 1 s e regenera 25/s; zerado só volta a 30', () => {
    const s = new Stamina();
    s.drain(50, 1);
    expect(s.value).toBe(50);
    s.update(0.5);
    expect(s.value).toBe(50);
    s.update(0.6);
    expect(s.value).toBeGreaterThan(50);
    s.drain(1000, 1);
    expect(s.exhausted).toBe(true);
    expect(s.available).toBe(false);
    for (let i = 0; i < 60 * 1.5; i++) s.update(dt);
    expect(s.exhausted).toBe(s.value < STAMINA.exhaustedRecover);
    for (let i = 0; i < 60 * 2; i++) s.update(dt);
    expect(s.exhausted).toBe(false);
  });

  it('dano de queda: nada até 12; rolando, nada até 26', () => {
    expect(fallDamage(11)).toBe(0);
    expect(fallDamage(20)).toBe((20 - 12) * MOVE.fallDamagePerUnit);
    expect(fallDamage(20, true)).toBe(0);
    expect(fallDamage(30, true)).toBeGreaterThan(0);
  });

  it('esquiva escolhe o clipe pela direção relativa ao personagem', () => {
    expect(dashClip({ x: 0, z: 1 }, 0).id).toBe('dashFront');
    expect(dashClip({ x: 0, z: -1 }, 0).id).toBe('dashBack');
    expect(dashClip({ x: 1, z: 0 }, 0).id).toBe('dashLeft'); // +x é a esquerda do personagem
    expect(dashClip({ x: -1, z: 0 }, 0).id).toBe('dashRight');
    expect(dashClip({ x: 0, z: 1 }, Math.PI / 2).id).toBe('dashRight');
  });
});
