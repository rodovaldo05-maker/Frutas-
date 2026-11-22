// Maestria 1–1000 (atualização 23; Prompt Mestre, fase E — testes de aceitação 10 a 13).
import { describe, it, expect } from 'vitest';
import {
  MASTERY_MAX, STAGES, stageOf, normalizeMastery, fromOldDomain, addMasteryXp, masteryXpToNext, masteryBonus, addTrackXp, trackXpToNext,
  marcosOf, marcoMods, MARCOS, envMultiplier, ENV_CAP, naturalLightning, BATISMO, envImmune, THRESHOLDS, affinityCostMult, techniqueCdMult, AWAKEN_TITLES,
} from '../src/progression/mastery.js';
import { addDomainXp, domainOf } from '../src/progression/domain.js';
import { migrate, newSave } from '../src/saves/saveSystem.js';
import { FRUITS } from '../src/combat/m1Catalog.js';
import { RACES } from '../src/races/races.js';

describe('maestria geral 1–1000', () => {
  it('seis estágios e teto de 1000', () => {
    expect(STAGES.map((s) => s.from)).toEqual([1, 101, 251, 451, 651, 851]);
    expect(stageOf(100).nome).toBe('Iniciação');
    expect(stageOf(101).nome).toBe('Adaptação');
    expect(stageOf(1000).nome).toBe('Despertar');
    const m = normalizeMastery(null);
    expect(addMasteryXp(m, 1e12)).toBe(MASTERY_MAX - 1);
    expect(m.level).toBe(MASTERY_MAX);
    expect(addMasteryXp(m, 100)).toBe(0);
  });

  it('salvo antigo (domínio 1–100) migra ×10 sem perder progresso; salvo novo fica igual', () => {
    expect(fromOldDomain({ level: 1, xp: 0 }).level).toBe(1);
    expect(fromOldDomain({ level: 59, xp: 0 }).level).toBe(581); // despertar continua no mesmo ponto
    expect(fromOldDomain({ level: 100, xp: 0 }).level).toBe(991);
    const half = fromOldDomain({ level: 20, xp: Math.round((100 + 30 * Math.pow(20, 1.4)) * 1.4 * 0.55) });
    expect(half.level).toBe(196);
    const s = migrate({ ...newSave(), domain: { brasa: { level: 20, xp: 0 }, geada: { v: 2, level: 333, xp: 5, tracks: { tecnica: { level: 7, xp: 2 } } } } });
    expect(s.domain.brasa.level).toBe(191);
    expect(s.domain.geada.level).toBe(333);
    expect(s.domain.geada.tracks.tecnica).toEqual({ level: 7, xp: 2 });
    expect(s.domain.geada.tracks.sincronia).toEqual({ level: 1, xp: 0 });
  });

  it('os limiares do jogo seguem a escala (habilidades, formas, despertar)', () => {
    expect(THRESHOLDS).toMatchObject({ skill2: 41, skill3: 121, hybrid: 191, complete: 491, awaken: 581 });
    expect(masteryXpToNext(1)).toBeGreaterThan(0);
    expect(masteryXpToNext(999)).toBeGreaterThan(masteryXpToNext(1));
    expect(masteryBonus(1000)).toBeCloseTo(1.3); // controle e eficiência, sem dano infinito
  });

  it('despertar da maestria: um título por fruta, as 16', () => {
    expect(Object.keys(AWAKEN_TITLES).sort()).toEqual([...FRUITS].sort());
    expect(AWAKEN_TITLES.tormenta).toBe('Soberano das Tempestades');
  });
});

describe('teste 10: evolução independente', () => {
  it('fruta e trilhas sobem separadas; trilhas param em 100', () => {
    const save = newSave();
    addDomainXp(save, 'brasa', 500);
    const m = domainOf(save, 'brasa');
    expect(m.level).toBeGreaterThan(1);
    expect(m.tracks.afinidade.level).toBe(1); // maestria geral não mexe nas trilhas
    expect(addTrackXp(m, 'tecnica', trackXpToNext(1))).toBe(1);
    expect(m.tracks.tecnica.level).toBe(2);
    expect(m.tracks.sincronia.level).toBe(1);
    addTrackXp(m, 'sincronia', 1e9);
    expect(m.tracks.sincronia.level).toBe(100);
    expect(domainOf(save, 'geada').level).toBe(1); // outra fruta intacta
    expect(save.training).toEqual(newSave().training); // atributos de treino intactos
  });

  it('trilhas: afinidade barateia no ambiente favorável; técnica encurta a recarga', () => {
    const m = normalizeMastery(null);
    m.tracks.afinidade.level = 100;
    m.tracks.tecnica.level = 100;
    expect(affinityCostMult(m, 1)).toBe(1);
    expect(affinityCostMult(m, 2)).toBeCloseTo(0.85);
    expect(techniqueCdMult(m)).toBeCloseTo(0.9);
  });

  it('dez marcos de transformação pela sincronia', () => {
    const m = normalizeMastery(null);
    expect(MARCOS).toHaveLength(10);
    expect(marcosOf(m)).toHaveLength(0);
    m.tracks.sincronia.level = 50;
    expect(marcosOf(m).map((k) => k.nome)).toEqual(['Controle inicial', 'Estabilidade', 'Mobilidade', 'Eficiência', 'Combate']);
    m.tracks.sincronia.level = 100;
    const mk = marcoMods(m, true);
    expect(mk.transform).toBeCloseTo(0.7);
    expect(mk.extraJumps).toBe(1);
    expect(mk.mitigation).toBeCloseTo(0.15);
    expect(marcoMods(m, false).extraJumps).toBe(0);
  });
});

describe('teste 11: multiplicadores de ambiente e teto de 4x', () => {
  it('neutro 1x, favorável 1,5x, ideal 2x, extremo 2,5x; vale a maior condição, não a soma', () => {
    expect(envMultiplier('brasa', {}).mult).toBe(1);
    expect(envMultiplier('brasa', { biome: 'deserto' })).toMatchObject({ mult: 1.5, tier: 'favorável' });
    expect(envMultiplier('brasa', { biome: 'vulcao' })).toMatchObject({ mult: 2, tier: 'ideal' });
    expect(envMultiplier('brasa', { biome: 'vulcao', crater: true })).toMatchObject({ mult: 2.5, tier: 'extremo' });
    expect(envMultiplier('lobo', { night: true, biome: 'floresta' }).mult).toBe(2); // não 1,5 × 2
    expect(envMultiplier('tormenta', { weather: 'tempestade', sea: true }).mult).toBe(3);
  });

  it('evento raro até 4x, nunca acima', () => {
    expect(envMultiplier('tormenta', { weather: 'tempestade', sea: true }, { rare: 2 }).mult).toBe(ENV_CAP);
    expect(envMultiplier('brasa', { biome: 'vulcao', crater: true }, { rare: 9 }).mult).toBe(4);
  });

  it('cada uma das 16 frutas tem regras de ambiente', () => {
    const base = { crater: true, weather: 'tempestade', sea: true, night: true, flying: true, altitude: true, boss: true, strongTarget: true, nearWater: true, sun: true, lowHealth: true, form: 'completa' };
    const biomes = ['vulcao', 'deserto', 'neve', 'granito', 'arena', 'floresta', 'praia', 'ceu', 'forte', 'cidade'];
    for (const f of FRUITS) expect(Math.max(...biomes.map((biome) => envMultiplier(f, { ...base, biome }).mult))).toBeGreaterThan(1);
  });
});

describe('teste 12: Batismo do Trovão', () => {
  it('o primeiro raio natural dá exatamente um nível; os seguintes dão XP com limite diário', () => {
    const m = normalizeMastery({ v: 2, level: 300, xp: 10 });
    const r = naturalLightning(m, 0);
    expect(r.batismo).toBe(true);
    expect(m.level).toBe(301);
    expect(m.xp).toBe(10);
    const r2 = naturalLightning(m, 0);
    expect(r2.batismo).toBe(false);
    expect(r2.xp).toBe(BATISMO.xp);
    for (let i = 0; i < BATISMO.perDay; i++) naturalLightning(m, 0);
    expect(naturalLightning(m, 0).xp).toBe(0); // limite do dia
    expect(naturalLightning(m, 1).xp).toBe(BATISMO.xp); // dia seguinte
    expect(normalizeMastery(JSON.parse(JSON.stringify(m))).batismo).toBe(true); // salvo
  });
});

describe('teste 13: fraqueza à água e imunidades limitadas', () => {
  it('Tormenta absorve raio natural a partir de 451, nunca ataque de chefe; outras frutas não', () => {
    expect(envImmune('tormenta', 450, 'raio-natural')).toBe(false);
    expect(envImmune('tormenta', 451, 'raio-natural')).toBe(true);
    expect(envImmune('tormenta', 1000, 'chefe')).toBe(false);
    expect(envImmune('brasa', 1000, 'raio-natural')).toBe(false);
  });

  it('a Maré não anula a fraqueza à água (só a raça Aquático tira o dano, e não o afundar)', () => {
    expect(envImmune('mare', 1000, 'agua')).toBe(false);
    const aquatic = Object.values(RACES).find((r) => r.passivas?.some((p) => /dano da água/.test(p)));
    expect(aquatic.passivas.some((p) => /afundar continua/.test(p))).toBe(true);
  });
});
