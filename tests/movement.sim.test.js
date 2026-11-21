// Simula o personagem na Ilha de Treino (mesma física do jogo) e confere cada movimento.
import { describe, it, expect, beforeAll } from 'vitest';
import { makeSim } from './helpers/sim.js';
import { MOVE } from '../src/movement/config.js';

const N = Math.PI; // olhando para -z (norte)
const E = Math.PI / 2; // olhando para +x (leste)
let sim;

beforeAll(async () => {
  sim = await makeSim();
}, 60000);

describe('movimento na Ilha de Treino', () => {
  it('descendo a praia correndo, os pés não saem do chão', () => {
    sim.place(0, 71, N);
    let gap = 0;
    sim.run(4, (t, c) => {
      gap = Math.max(gap, c.pos.y - sim.ground(c.pos.x, c.pos.z));
      return { moveY: 1, sprint: t > 1 };
    });
    expect(sim.states).toEqual(['ground']);
    expect(gap).toBeLessThan(0.1);
  });

  it('anda a 3,8 e o Correr dobra a velocidade', () => {
    sim.place(0, 71, N);
    sim.run(2, () => ({ moveY: 1 }));
    expect(sim.ctl.speed).toBeCloseTo(MOVE.run, 0);
    sim.run(1.5, () => ({ moveY: 1, sprint: true }));
    expect(sim.ctl.speed).toBeCloseTo(MOVE.sprint, 0);
    expect(MOVE.sprint / MOVE.run).toBeCloseTo(2, 1);
    expect(sim.ctl.state).toBe('ground');
  });

  it('pulo sobe cerca de 1,9 e volta ao chão', () => {
    sim.place(-8, 62, N);
    const y0 = sim.ctl.pos.y;
    let top = y0;
    sim.run(1.5, (t, c) => {
      top = Math.max(top, c.pos.y);
      return { jumpPressed: t === 0, jump: t < 0.6 };
    });
    expect(top - y0).toBeGreaterThan(1.6);
    expect(top - y0).toBeLessThan(2.2);
    expect(sim.ctl.state).toBe('ground');
  });

  it('soltar o botão cedo faz um pulo mais baixo', () => {
    sim.place(-8, 62, N);
    const y0 = sim.ctl.pos.y;
    let top = y0;
    sim.run(1.2, (t, c) => {
      top = Math.max(top, c.pos.y);
      return { jumpPressed: t === 0, jump: t < 0.08 };
    });
    expect(top - y0).toBeLessThan(1.4);
  });

  it('escala a torre de pedra e sobe no topo', () => {
    sim.place(30, -5.5, N);
    const ok = sim.run(14, () => ({ moveY: 1, camYaw: N }), (c) => c.state === 'ground' && c.pos.y > sim.ground(30, -5.5) + 14);
    expect(sim.states).toContain('climb');
    expect(sim.states).toContain('mantle');
    expect(ok).toBe(true);
  });

  it('agarra a borda de madeira e sobe nela', () => {
    sim.place(12, -16.2, N);
    let hung = false;
    sim.run(3, (t, c) => {
      if (c.state === 'hang') hung = true;
      return { moveY: t < 0.4 ? 1 : 0, camYaw: N, jumpPressed: t === 0.1 || (hung && c.state === 'hang' && c.stateTime > 0.3), jump: t < 0.4 };
    });
    expect(sim.states).toContain('hang');
    expect(sim.states).toContain('mantle');
    expect(sim.ctl.state).toBe('ground');
    expect(sim.ctl.pos.y).toBeGreaterThan(sim.ground(14, -20) + 3);
  });

  it('cai na lagoa, nada, mergulha e gasta o ar', () => {
    sim.place(-44, 16, N);
    sim.ctl.pos.set(-50, 1.5, 16);
    sim.ctl.syncCollider();
    sim.ctl.setState('air');
    sim.run(2.5);
    expect(sim.ctl.state).toBe('swim');
    expect(sim.events.map((e) => e.name)).toContain('splash');
    sim.run(4, (t) => ({ crouchPressed: t === 0, crouch: true }));
    expect(sim.ctl.state).toBe('dive');
    expect(sim.ctl.breath).toBeLessThan(MOVE.breath - 2);
    sim.run(8, () => ({ jump: true }));
    expect(sim.ctl.state).toBe('swim');
  });

  it('salto duplo e planar caem devagar', () => {
    sim.place(-8, 62, N, 30);
    sim.run(2, (t) => ({ jumpPressed: t === 0.2, jump: t >= 0.2, moveY: 1 }));
    expect(sim.events.map((e) => e.name)).toContain('doubleJump');
    expect(sim.ctl.state).toBe('glide');
    expect(sim.ctl.vel.y).toBeGreaterThan(-MOVE.glideFall - 0.5);
    expect(sim.ctl.speed).toBeGreaterThan(MOVE.glideForward - 1.5);
  });

  it('corre na parede e atravessa a vala', () => {
    sim.place(59.3, 13, 0);
    let ran = false;
    const crossed = sim.run(5, (t, c) => {
      if (c.state === 'wallrun') ran = true;
      return { moveY: 1, camYaw: 0, sprint: true, jumpPressed: c.pos.z > 21.5 && c.state === 'ground' && !ran, jump: c.pos.z > 21.5 };
    }, (c) => c.state === 'ground' && c.pos.z > 34.5);
    expect(ran).toBe(true);
    expect(crossed).toBe(true);
    expect(sim.states).not.toContain('swim');
  });

  it('túnel baixo: em pé bloqueia, agachado passa', () => {
    sim.place(-10, 44, N);
    sim.run(2, () => ({ moveY: 1, camYaw: N }));
    expect(sim.ctl.pos.z).toBeGreaterThan(41);
    sim.place(-10, 44, N);
    sim.run(10, () => ({ moveY: 1, camYaw: N, crouch: true }));
    expect(sim.ctl.pos.z).toBeLessThan(31);
    expect(Math.abs(sim.ctl.pos.x + 10)).toBeLessThan(1.2);
  });

  it('queda alta machuca; agachar antes de tocar o chão rola sem dano', () => {
    sim.place(-8, 62, N, 20);
    sim.ctl.health = 100;
    sim.run(3);
    expect(sim.ctl.health).toBeLessThan(100);
    sim.place(-8, 62, N, 20);
    sim.ctl.health = 100;
    sim.run(3, () => ({ crouch: true }));
    expect(sim.events.map((e) => e.name)).toContain('roll');
    expect(sim.ctl.health).toBe(100);
  });

  it('rampa de 45° sobe; a de 55° não', () => {
    const climb = (x) => {
      sim.place(x, 24, N);
      const y0 = sim.ctl.pos.y;
      let top = y0;
      sim.run(4, (t, c) => {
        top = Math.max(top, c.pos.y);
        return { moveY: 1, camYaw: N };
      });
      return top - y0;
    };
    expect(climb(11)).toBeGreaterThan(3.5);
    expect(climb(17.5)).toBeLessThan(1.5);
  });

  it('deslize: correndo, Agachar desliza', () => {
    sim.place(0, 71, N);
    sim.run(1.5, () => ({ moveY: 1, sprint: true }));
    sim.run(0.2, (t) => ({ moveY: 1, sprint: true, crouchPressed: t === 0, crouch: true }));
    expect(sim.states).toContain('slide');
  });

  it('salto na parede sobe a chaminé', () => {
    sim.place(44.5, -6, E);
    const y0 = sim.ctl.pos.y;
    let dir = 1;
    let top = y0;
    sim.run(8, (t, c) => {
      top = Math.max(top, c.pos.y);
      let press = t === 0 || (c.state === 'ground' && c.stateTime > 0.1);
      const wall = c.state === 'air' && c.airTime > 0.12 ? c.nearestWall(MOVE.radius + 0.3) : null;
      if (wall && wall.normal.x * dir < 0) {
        press = true;
        dir = -dir;
      }
      return { moveY: 1, camYaw: dir > 0 ? E : -E, jumpPressed: press, jump: true };
    });
    expect(sim.events.filter((e) => e.name === 'wallJump').length).toBeGreaterThan(2);
    expect(top - y0).toBeGreaterThan(5);
  });
});
