// Treinamento físico com pesos (atualização 24; Prompt Mestre, fase F — testes 8 e 9).
import { describe, it, expect } from 'vitest';
import {
  LOADS, REPS_PER_SET, REST_TIME, unlockedLoads, capacity, canLift, newSession, requestRep, stepSession, repDepth, pauseSession, lowerLoad,
  repAttrs, normalizeWorkout, SESSION_SOFT_CAP, repXp,
} from '../src/progression/workout.js';
import { newTraining } from '../src/progression/training.js';

const fresh = () => newTraining();
const run = (s, t, secs, dt = 1 / 60) => {
  const events = [];
  for (let i = 0; i < Math.round(secs / dt); i++) {
    const r = stepSession(s, dt, t);
    if (r.rep || r.setDone || r.done) events.push(r);
  }
  return events;
};

describe('cargas', () => {
  it('dez cargas de 5 a 2.560 kg; iniciante só tem a de 5 kg', () => {
    expect(LOADS.map((l) => l.kg)).toEqual([5, 10, 20, 40, 80, 160, 320, 640, 1280, 2560]);
    expect(unlockedLoads(fresh()).map((l) => l.kg)).toEqual([5]);
    const t = fresh();
    t.attrs.forca.level = 100;
    t.attrs.constituicao.level = 100;
    expect(unlockedLoads(t)).toHaveLength(10);
  });

  it('liberar não garante sustentar: carga acima da capacidade não começa', () => {
    const t = fresh();
    expect(canLift(5, t)).toBe(true);
    expect(canLift(2560, t)).toBe(false);
    t.attrs.forca.level = 100;
    t.attrs.constituicao.level = 100;
    expect(capacity(t)).toBeGreaterThan(2000);
  });
});

describe('teste 8: 10 repetições válidas por série e descanso', () => {
  it('cada repetição precisa de um pedido e da animação completa (desce e sobe)', () => {
    const t = fresh();
    const s = newSession('flexao', 5, 1);
    expect(run(s, t, 5).length).toBe(0); // sem pedido, nada acontece (sem loop automático)
    expect(requestRep(s, t)).toBe(true);
    expect(requestRep(s, t)).toBe(false); // toque durante a repetição é ignorado
    stepSession(s, s.dur / 2, t);
    expect(repDepth(s)).toBeCloseTo(1, 1); // embaixo no meio
    const ev = run(s, t, s.dur);
    expect(ev.filter((e) => e.rep)).toHaveLength(1);
    expect(s.reps).toBe(1);
  });

  it('série de exatamente 10; descanso entre séries; fim depois da última', () => {
    const t = fresh();
    const s = newSession('agachamento', 5, 2);
    let reps = 0;
    for (let i = 0; i < 400 && s.phase !== 'fim'; i++) {
      if (s.phase === 'pronto') requestRep(s, t);
      reps += run(s, t, 0.25).filter((e) => e.rep).length;
      if (s.phase === 'descanso') {
        expect(s.reps).toBe(REPS_PER_SET);
        expect(s.rest).toBeLessThanOrEqual(REST_TIME);
      }
    }
    expect(s.phase).toBe('fim');
    expect(reps).toBe(2 * REPS_PER_SET);
    expect(s.total).toBe(20);
  });

  it('pausar interrompe a repetição sem contar; reduzir carga vai para a anterior liberada', () => {
    const t = fresh();
    t.attrs.forca.level = 20;
    t.attrs.constituicao.level = 20;
    const s = newSession('flexao', 40, 1);
    requestRep(s, t);
    stepSession(s, 0.2, t);
    pauseSession(s, true);
    run(s, t, 5);
    expect(s.reps).toBe(0);
    pauseSession(s, false);
    expect(s.phase).toBe('pronto');
    expect(lowerLoad(s, t)).toBe(true);
    expect(s.kg).toBe(20);
  });
});

describe('teste 9: XP só por ação válida', () => {
  it('fadiga e limite da sessão reduzem o ganho; sem fadiga total não há repetição', () => {
    const t = fresh();
    const s = newSession('flexao', 5, 1);
    const first = repXp(s, t);
    s.fatigue = 0.9;
    expect(repXp(s, t)).toBeLessThan(first);
    s.sessionXp = SESSION_SOFT_CAP * 4;
    expect(repXp(s, t)).toBeLessThan(first / 4);
    s.fatigue = 1;
    expect(requestRep(s, t)).toBe(false);
  });

  it('flexão treina constituição e força; agachamento treina constituição e impulsão; nunca a fruta', () => {
    expect(repAttrs('flexao', 10).map(([k]) => k)).toEqual(expect.arrayContaining(['constituicao', 'forca']));
    expect(repAttrs('agachamento', 10).map(([k]) => k)).toEqual(expect.arrayContaining(['constituicao', 'impulsao']));
    for (const ex of ['flexao', 'agachamento']) expect(repAttrs(ex, 10).some(([k]) => /fruta|dominio|maestria/.test(k))).toBe(false);
  });

  it('salvo do treino é validado', () => {
    expect(normalizeWorkout({ lastKg: 7, lastSets: -3, reps: { flexao: 12.7 } })).toEqual({ lastKg: 5, lastSets: 1, reps: { flexao: 12, agachamento: 0 } });
  });
});
