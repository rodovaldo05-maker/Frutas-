// Meditação e Haki (atualização 25; Prompt Mestre, fase G — testes 10 e 13).
import { describe, it, expect } from 'vitest';
import {
  HAKI, stagesOf, armorCost, armorMitigation, armorPenetration, armorEmission, senseRange, FORESIGHT, REI, reiBlock, pulseEffect, pulseRadius,
  MEDITATION, breathValid, newMeditation, meditationTap, meditationStep, meditationXp, meditationPlace, newChallenge, challengeTap, challengeStep, dodgeXp,
} from '../src/haki/haki.js';
import { Vontade } from '../src/styles/vontade.js';
import { newSave } from '../src/saves/saveSystem.js';
import { ATTRS } from '../src/progression/training.js';

describe('três Haki com estágios próprios', () => {
  it('sete estágios cada; a Observação usa a Percepção e o Armamento a Armadura (sem duplicar)', () => {
    for (const k of ['observacao', 'armamento', 'rei']) expect(HAKI[k].estagios).toHaveLength(7);
    expect(HAKI.observacao.prof).toBe('vontade:percepcao');
    expect(HAKI.armamento.prof).toBe('vontade:armadura');
    expect(stagesOf('observacao', 1)).toEqual(['Percepção inicial']);
    expect(stagesOf('armamento', 100)).toContain('Penetração avançada');
    expect(stagesOf('rei', 44)).not.toContain('Seleção de alvos');
  });

  it('Armamento: mais barato, defende mais, nunca atravessa toda a defesa', () => {
    expect(armorCost(1)).toBe(6);
    expect(armorCost(100)).toBe(3);
    expect(armorMitigation(1)).toBeCloseTo(0.1);
    expect(armorMitigation(100)).toBeCloseTo(0.18);
    expect(armorPenetration(89)).toBe(0);
    expect(armorPenetration(100)).toBeLessThan(1);
    expect(armorEmission(74)).toBe(false);
    expect(armorEmission(75)).toBe(true);
  });

  it('Observação: alcance cresce; previsão breve dura pouco e tem recarga (não é invulnerável)', () => {
    expect(senseRange(1)).toBeLessThan(senseRange(80));
    const save = { ...newSave(), vontade: { armadura: true, percepcao: true }, proficiency: { 'vontade:percepcao': { level: 95, xp: 0 } } };
    const v = new Vontade({ save });
    v.sense = true;
    for (let i = 0; i < v.dodgesMax; i++) expect(v.autoDodge()).toBe(true);
    expect(v.autoDodge()).toBe(true); // previsão breve
    expect(v.autoDodge()).toBe(false); // recarga
    v.update(FORESIGHT.cooldown + 0.1);
    v.sense = true;
    expect(v.autoDodge()).toBe(true);
  });
});

describe('Haki do Rei', () => {
  it('não se compra nem vem da meditação: precisa do Desafio da Vontade (com requisitos)', () => {
    const lv = (map) => (k) => map[k] ?? 1;
    const save = { ...newSave(), level: 10, vontade: { armadura: true, percepcao: true } };
    expect(reiBlock(save, lv({}))).toMatch(/nível/);
    save.level = REI.level;
    expect(reiBlock(save, lv({}))).toMatch(/Observação/);
    expect(reiBlock(save, lv({ 'vontade:percepcao': 20, 'vontade:armadura': 20 }))).toBeNull();
    const v = new Vontade({ save });
    expect(v.pulse()).toMatch(/Desafio/);
    save.vontade.soberana = true;
    v.value = 100;
    expect(v.pulse()).toBeNull();
    expect(v.pulse()).toMatch(/s\./); // recarga
  });

  it('desafio: aguentar 20 s respirando no ritmo vence; sem participar, a pressão vence', () => {
    const win = newChallenge();
    for (let i = 0; i < 20 * 60 && !win.result; i++) {
      if (breathValid(win.t)) challengeTap(win);
      challengeStep(win, 1 / 60);
    }
    expect(win.result).toBe('venceu');
    const lose = newChallenge();
    for (let i = 0; i < 20 * 60 && !lose.result; i++) challengeStep(lose, 1 / 60);
    expect(lose.result).toBe('falhou');
  });

  it('pulso: fracos intimidados por pouco tempo, outros abalados, chefes e bestas resistem', () => {
    expect(pulseEffect({ level: 10 }, 100, 50).kind).toBe('intimidado');
    expect(pulseEffect({ level: 10 }, 100, 50).stun).toBeLessThan(4);
    expect(pulseEffect({ level: 90 }, 100, 50).kind).toBe('abalado');
    expect(pulseEffect({ level: 1, boss: true }, 100, 100).kind).toBe('resiste');
    expect(pulseEffect({ level: 1, isBeast: true }, 100, 100).stun).toBe(0);
    expect(pulseRadius(100)).toBeGreaterThan(pulseRadius(1));
  });
});

describe('meditação', () => {
  it('respirar no pico conta; um toque por ciclo; sem respirar 3 ciclos acaba (anti-AFK)', () => {
    const m = newMeditation();
    meditationStep(m, MEDITATION.cycle * 0.5);
    expect(meditationTap(m)).toBe(true);
    expect(meditationTap(m)).toBe(false); // segundo toque no mesmo ciclo
    const idle = newMeditation();
    let end = null;
    for (let i = 0; i < 60 * 20 && !end; i++) end = meditationStep(idle, 1 / 60);
    expect(end).toBe('fim');
    const off = newMeditation();
    meditationStep(off, 0.2);
    expect(meditationTap(off)).toBe(false); // fora do ritmo
  });

  it('lugares ajudam só durante a sessão; limite de XP por sessão', () => {
    expect(meditationPlace({ biome: 'neve' }).mult).toBe(1.5);
    expect(meditationPlace({ biome: 'ceu' }).label).toBe('templo celeste');
    expect(meditationPlace({}).mult).toBe(1);
    const m = newMeditation();
    expect(meditationXp(m, 1.5)).toBe(6);
    m.xp = MEDITATION.cap;
    expect(meditationXp(m, 1.5)).toBe(0);
  });

  it('treina Concentração e Resistência Mental (atributos próprios), não a fruta', () => {
    expect(ATTRS.concentracao).toBeTruthy();
    expect(ATTRS.mental).toBeTruthy();
  });
});

describe('teste 10: evolução independente', () => {
  it('Observação, Armamento e Rei são trilhas separadas da fruta e dos atributos', () => {
    const profs = new Set(Object.values(HAKI).map((h) => h.prof));
    expect(profs.size).toBe(3);
    for (const p of profs) expect(p.startsWith('vontade:')).toBe(true);
    expect(dodgeXp(1, true)).toBeGreaterThan(dodgeXp(1, false)); // sem visão rende mais
  });
});
