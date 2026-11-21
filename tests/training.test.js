import { describe, it, expect } from 'vitest';
import { TRAINING, TrainingMission } from '../src/quests/training.js';

const ctl = (over = {}) => ({ state: 'ground', stateTime: 0, submerged: 0, crouched: false, pos: { x: 0, y: 0, z: 0 }, ...over });

describe('missão de treino', () => {
  it('marca objetivos por estado e por evento, uma vez cada', () => {
    const seen = [];
    const m = new TrainingMission({}, { onObjective: (o) => seen.push(o.id) });
    m.check(ctl({ state: 'climb' }));
    m.check(ctl({ state: 'climb' }));
    m.event('doubleJump');
    m.check(ctl({ state: 'glide', stateTime: 1 }));
    expect(seen).toEqual(['escalar', 'saltoDuplo']);
    m.check(ctl({ state: 'glide', stateTime: 3.1 }));
    expect(m.has('planar')).toBe(true);
    m.check(ctl({ crouched: true, pos: { x: -10, y: 2, z: 36 } }));
    expect(m.has('tunel')).toBe(true);
    m.check(ctl({ pos: { x: 30, y: 18, z: -12 } }), { towerTopY: 18 });
    expect(m.has('torre')).toBe(true);
  });

  it('a recompensa só sai com tudo feito, e uma vez', () => {
    let completed = 0;
    const state = {};
    const m = new TrainingMission(state, { onComplete: () => completed++ });
    expect(m.claim()).toBeNull();
    for (const o of TRAINING.objectives) m.mark(o.id);
    expect(completed).toBe(1);
    expect(m.claim()).toEqual({ coins: 1000, xp: 500 });
    expect(m.claim()).toBeNull();
    // o estado salvo volta igual
    const again = new TrainingMission(JSON.parse(JSON.stringify(state)));
    expect(again.complete).toBe(true);
    expect(again.claim()).toBeNull();
  });
});
