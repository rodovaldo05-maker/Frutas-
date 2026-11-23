import { describe, it, expect } from 'vitest';
import { dayKey, dailiesFor, rollDay, dailyEvent, normalizeDailies, DAILY_COUNT, dailyReward, chestReward } from '../src/progression/dailies.js';
import { ACHIEVEMENTS, checkAchievements, normalizeAchievements, normalizeStats, ACHIEVEMENT_IDS, titleOf } from '../src/progression/achievements.js';
import { migrate, newSave } from '../src/saves/saveSystem.js';

describe('missões diárias (atualização 30)', () => {
  it('três diárias diferentes por dia, sempre as mesmas para a mesma data', () => {
    const a = dailiesFor('2026-11-23', { tools: ['vara', 'picareta'] });
    expect(a.length).toBe(DAILY_COUNT);
    expect(new Set(a.map((d) => d.id)).size).toBe(DAILY_COUNT);
    expect(dailiesFor('2026-11-23', { tools: ['vara', 'picareta'] })).toEqual(a);
    const days = new Set(Array.from({ length: 10 }, (_, i) => dailiesFor(`2026-12-${String(i + 1).padStart(2, '0')}`).map((d) => d.id).join()));
    expect(days.size).toBeGreaterThan(3);
  });

  it('sem vara nem picareta não sorteia pesca nem mineração', () => {
    for (let i = 1; i <= 28; i++) {
      const ids = dailiesFor(`2026-02-${String(i).padStart(2, '0')}`).map((d) => d.kind);
      expect(ids).not.toContain('fish');
      expect(ids).not.toContain('ore');
    }
  });

  it('progresso por evento, paga uma vez, baú ao fechar as três e sequência de dias', () => {
    const st = normalizeDailies(null);
    rollDay(st, '2026-11-23');
    const kinds = st.list.map((d) => d.kind);
    let chest = false;
    for (const d of st.list) {
      const r = dailyEvent(st, { kind: d.kind, n: d.meta });
      expect(r.done.map((x) => x.id)).toContain(d.id);
      chest = chest || r.chest;
    }
    expect(chest).toBe(true);
    expect(st.streak).toBe(1);
    expect(dailyEvent(st, { kind: kinds[0], n: 99 }).done.length).toBe(0); // já paga
    // dia seguinte fechado: sequência 2; pular um dia zera
    rollDay(st, '2026-11-24');
    for (const d of st.list) dailyEvent(st, { kind: d.kind, n: d.meta });
    expect(st.streak).toBe(2);
    rollDay(st, '2026-11-26');
    expect(st.streak).toBe(0);
    expect(st.total).toBe(6);
  });

  it('recompensas crescem com o nível; a semana dobra o baú', () => {
    expect(dailyReward(1000).coins).toBeGreaterThan(dailyReward(10).coins);
    expect(chestReward(100, true).coins).toBe(chestReward(100, false).coins * 2);
    expect(chestReward(100, true).keys).toBe(2);
  });

  it('a chave do dia usa o calendário local', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('conquistas (atualização 30)', () => {
  it('liberam uma vez, pagam e dão título', () => {
    const save = { ...newSave(), stats: normalizeStats({ kills: 60 }), level: 120 };
    const fresh = checkAchievements(save).map((a) => a.id);
    expect(fresh).toContain('lutador');
    expect(fresh).toContain('nivel-100');
    expect(fresh).not.toContain('veterano');
    expect(checkAchievements(save).length).toBe(0);
    save.achievements.title = 'lutador';
    expect(titleOf(save)).toBe('Lutador');
  });

  it('chefes diferentes e missões de ilha contam pelo salvo', () => {
    const bosses = Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`ilha${i}-chefe`, 1]));
    const save = { ...newSave(), bosses, islandQuests: { by: { a: { step: 3 }, b: { step: 3 }, c: { step: 3 }, d: { step: 1 } } } };
    const fresh = checkAchievements(save).map((a) => a.id);
    expect(fresh).toContain('cacador-chefes');
    expect(fresh).toContain('ajudante');
  });

  it('salvo: listas inválidas e títulos não conquistados são limpos', () => {
    expect(normalizeAchievements({ got: ['lutador', 'lutador', 'xyz'], title: 'veterano' }, ACHIEVEMENT_IDS)).toEqual({ got: ['lutador'], title: null });
    const s = migrate({ ...newSave(), stats: { kills: '12', fish: -3 }, dailies: { streak: 4, day: '2026-11-23', list: [] } });
    expect(s.stats.kills).toBe(12);
    expect(s.stats.fish).toBe(0);
    expect(s.dailies.streak).toBe(4);
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(25);
  });
});
