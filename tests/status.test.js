import { describe, it, expect } from 'vitest';
import { maxStamina, maxHealth, allocate, resetStatus, newStatus, damageMultipliers } from '../src/progression/status.js';
import { addXp as addAdventurerXp } from '../src/progression/level.js';
import { newTraining, normalizeTraining, bonuses, addXp, xpToNext, progress, AntiFarm, TrainingTracker, MAX_LEVEL, METER } from '../src/progression/training.js';
import { Stamina } from '../src/movement/rules.js';
import { migrate } from '../src/saves/saveSystem.js';

const withLevels = (levels) => {
  const t = newTraining();
  for (const [k, l] of Object.entries(levels)) t.attrs[k].level = l;
  return t;
};

describe('treino: curva, níveis e bônus', () => {
  it('XP do nível L para L+1 = arredondar(100 + 18·L + 1,5·L²)', () => {
    expect(xpToNext(1)).toBe(120);
    expect(xpToNext(10)).toBe(430);
    expect(xpToNext(99)).toBe(16584);
  });

  it('XP sobe o nível, guarda a sobra e mostra o progresso em %', () => {
    const t = newTraining();
    const r = addXp(t, 'folego', 150);
    expect(r.levels).toBe(1);
    expect(t.attrs.folego.level).toBe(2);
    expect(t.attrs.folego.xp).toBe(30);
    expect(progress(t.attrs.folego)).toBeCloseTo(30 / xpToNext(2), 6);
  });

  it('marcos aparecem ao alcançar o nível', () => {
    const t = withLevels({ folego: 9 });
    const r = addXp(t, 'folego', xpToNext(9));
    expect(r.marcos).toEqual([{ level: 10, nome: 'Passo Constante' }]);
  });

  it('não passa do nível 100', () => {
    const t = withLevels({ natacao: MAX_LEVEL - 1 });
    addXp(t, 'natacao', 1e9);
    expect(t.attrs.natacao.level).toBe(MAX_LEVEL);
  });

  it('cada nível de treino de Força soma 1 ao fôlego máximo', () => {
    expect(maxStamina(null, newTraining())).toBe(100);
    expect(maxStamina(null, withLevels({ forca: 2 }))).toBe(101);
    expect(maxStamina(null, withLevels({ forca: 41 }))).toBe(140);
  });

  it('pontos distribuídos e treino somam juntos (um não substitui o outro)', () => {
    // 10 pontos em Força (+10), 5 em Vitalidade (+20) e treino de Força nível 6 (+5)
    expect(maxStamina({ forca: 10, vitalidade: 5 }, withLevels({ forca: 6 }))).toBe(135);
    // o bônus do treino de Fôlego multiplica tudo
    expect(maxStamina({ forca: 10 }, withLevels({ folego: 100 }))).toBe(Math.round(110 * 1.3));
    expect(maxHealth({ defesa: 5 })).toBe(130);
    expect(damageMultipliers({ forca: 10, fruta: 2 }).melee).toBeCloseTo(1.3);
  });

  it('Fôlego dá +3% de fôlego a cada 10 níveis, com teto de +30%', () => {
    expect(maxStamina(null, withLevels({ folego: 10 }))).toBe(103);
    expect(maxStamina(null, withLevels({ folego: 100 }))).toBe(130);
    expect(maxStamina(null, withLevels({ folego: 100, forca: 11 }))).toBe(Math.round(110 * 1.3));
    expect(bonuses(withLevels({ folego: 100 })).staminaRegen).toBeCloseTo(1.2);
  });

  it('bônus de Natação e Agilidade têm teto de +20%', () => {
    const b = bonuses(withLevels({ natacao: 100, agilidade: 100 }));
    expect(b.swimSpeed).toBeCloseTo(1.2);
    expect(b.breath).toBeCloseTo(1.2);
    expect(b.response).toBeCloseTo(1.2);
  });

  it('o fôlego usa o novo máximo mantendo a proporção', () => {
    const s = new Stamina();
    s.setMax(maxStamina(null, withLevels({ forca: 51 })));
    expect(s.max).toBe(150);
    s.drain(75, 1);
    s.setMax(maxStamina(null, withLevels({ forca: 52 })));
    expect(s.value / s.max).toBeCloseTo(0.5);
  });

  it('dados salvos estranhos são corrigidos', () => {
    const t = normalizeTraining({ attrs: { forca: { level: '12', xp: 5 }, folego: { level: -4 }, natacao: { level: 500 } } });
    expect(t.attrs.forca.level).toBe(12);
    expect(t.attrs.folego.level).toBe(1);
    expect(t.attrs.natacao.level).toBe(MAX_LEVEL);
  });

  it('salvo da versão 3 mantém os pontos distribuídos e ganha o treino', () => {
    const s = migrate({ version: 3, level: 5, status: { forca: 10 }, statusPoints: 2, freeRespec: false, coins: 900 });
    expect(s.status.forca).toBe(10);
    expect(s.statusPoints).toBe(2);
    expect(s.freeRespec).toBe(false);
    expect(s.training.attrs.forca.level).toBe(1);
    expect(s.coins).toBe(900);
  });

  it('salvo da versão 4 (sem pontos) recebe os pontos do nível para distribuir', () => {
    const t = withLevels({ folego: 12 });
    const s = migrate({ version: 4, level: 8, training: t, coins: 50 });
    expect(s.statusPoints).toBe(21);
    expect(s.status).toEqual(newStatus());
    expect(s.freeRespec).toBe(true);
    expect(s.training.attrs.folego.level).toBe(12);
  });
});

describe('pontos de status por nível (distribuíveis)', () => {
  it('cada nível de aventureiro dá 3 pontos', () => {
    const s = migrate(null);
    addAdventurerXp(s, 130 + 179);
    expect(s.level).toBe(3);
    expect(s.statusPoints).toBe(6);
  });

  it('distribuir usa só os pontos livres e não mexe no treino', () => {
    const s = { ...migrate(null), statusPoints: 5 };
    expect(allocate(s, 'forca', 10)).toBe(5);
    expect(s.status.forca).toBe(5);
    expect(s.statusPoints).toBe(0);
    expect(allocate(s, 'defesa', 1)).toBe(0);
    expect(allocate(s, 'inexistente', 1)).toBe(0);
    expect(s.training.attrs.forca.level).toBe(1);
  });

  it('redistribuir devolve os pontos e mantém o treino', () => {
    const s = { ...migrate(null), statusPoints: 0, status: { ...newStatus(), forca: 4, vitalidade: 2 }, training: withLevels({ forca: 9 }) };
    expect(resetStatus(s)).toBe(6);
    expect(s.statusPoints).toBe(6);
    expect(s.status.forca).toBe(0);
    expect(s.training.attrs.forca.level).toBe(9);
  });

  it('pontos não somem: o salvo garante os pontos do nível', () => {
    const s = migrate({ version: 5, level: 4, status: { forca: 3 }, statusPoints: 0 });
    expect(s.statusPoints).toBe(6);
  });
});

describe('rastreador de prática (quantidades do documento)', () => {
  // controlador de mentira andando em linha reta
  const walk = (tr, meters, { speedMs, state = 'ground', climb = 0 }) => {
    const ctl = { pos: { x: 0, y: 0, z: 0 }, state, speed: speedMs * METER };
    const dt = 1 / 60;
    const steps = Math.round(meters / speedMs / dt);
    for (let i = 0; i <= steps; i++) {
      tr.step(dt, ctl);
      ctl.pos = { x: ctl.pos.x + speedMs * METER * dt, y: ctl.pos.y + climb * speedMs * METER * dt, z: 0 };
    }
  };
  const total = (t, tr, k) => t.attrs[k].xp + tr.acc[k];

  it('andar 100 m: +2 XP; correr 100 m: +4 XP', () => {
    let t = newTraining();
    let tr = new TrainingTracker(t);
    walk(tr, 100, { speedMs: 1.7 });
    expect(total(t, tr, 'folego')).toBeCloseTo(2, 0);
    t = newTraining();
    tr = new TrainingTracker(t);
    walk(tr, 100, { speedMs: 3.4 });
    expect(total(t, tr, 'folego')).toBeCloseTo(4, 0);
  });

  it('subida rende até +30%', () => {
    const t = newTraining();
    const tr = new TrainingTracker(t);
    walk(tr, 100, { speedMs: 1.7, climb: 0.5 });
    expect(total(t, tr, 'folego')).toBeGreaterThan(2.4);
    expect(total(t, tr, 'folego')).toBeLessThan(2.8);
  });

  it('nadar 50 m: +3 XP', () => {
    const t = newTraining();
    const tr = new TrainingTracker(t);
    walk(tr, 50, { speedMs: 1.1, state: 'swim' });
    expect(total(t, tr, 'natacao')).toBeCloseTo(3, 0);
  });

  it('afundando (usuário de fruta incapacitado) não ganha Natação', () => {
    const t = newTraining();
    const tr = new TrainingTracker(t);
    walk(tr, 50, { speedMs: 0.5, state: 'sink' });
    expect(total(t, tr, 'natacao')).toBe(0);
  });
});

describe('antifarm', () => {
  it('a mesma ação no mesmo lugar rende cada vez menos, mas nunca zero', () => {
    const f = new AntiFarm();
    const p = { x: 0, z: 0 };
    expect(f.repetition('salto', p, 0)).toBe(1);
    expect(f.repetition('salto', p, 2)).toBeCloseTo(0.6);
    expect(f.repetition('salto', p, 4)).toBeCloseTo(0.36);
    for (let i = 0; i < 20; i++) f.repetition('salto', p, 6 + i);
    expect(f.repetition('salto', p, 30)).toBe(0.05);
    // em outro lugar ou depois de um tempo, volta ao normal
    expect(f.repetition('salto', { x: 100, z: 0 }, 31)).toBe(1);
  });

  it('limite suave por minuto reduz o excesso sem bloquear', () => {
    const f = new AntiFarm();
    let factor = 1;
    for (let i = 0; i < 40; i++) factor = f.softCap('agilidade', 1, 5, i);
    expect(factor).toBeLessThan(0.6);
    expect(factor).toBeGreaterThan(0.05);
    expect(f.softCap('agilidade', 1, 5, 200)).toBe(1);
  });

  it('atributos que dependem de combate não ganham XP ainda', () => {
    const t = newTraining();
    const tr = new TrainingTracker(t);
    expect(tr.grant('resistencia', 10, 'x', { x: 0, z: 0 })).toBe(0);
    expect(t.attrs.resistencia.xp).toBe(0);
  });
});

export { METER };
