import { describe, it, expect } from 'vitest';
import { STYLES, STYLE_IDS, STYLE_UNLOCK, styleCombo, stylePowers } from '../src/styles/styles.js';
import { Vontade, VONTADE } from '../src/styles/vontade.js';
import { FRUTOMotion } from '../src/animation/fruto-motion.js';
import { AttackRunner } from '../src/combat/rules.js';
import { migrate } from '../src/saves/saveSystem.js';

describe('estilos de luta (atualização 7)', () => {
  it('três estilos com combo, quatro técnicas e passiva; clipes existem', () => {
    expect(STYLE_IDS).toEqual(['basico', 'voltaico', 'mares']);
    for (const id of STYLE_IDS) {
      const st = STYLES[id];
      const c = styleCombo(st);
      expect(c.combo.length).toBe(3);
      for (const a of Object.values(c.attacks)) expect(FRUTOMotion.clips[a.clip]).toBeTruthy();
      const ps = stylePowers(st);
      expect(ps.length).toBe(4);
      expect(ps.map((p) => p.unlock)).toEqual(STYLE_UNLOCK);
      expect(st.passiva.length).toBeGreaterThan(5);
    }
  });

  it('Básico mantém Jab → Direto → Gancho com +5%; Voltaico encadeia raio no 3º golpe', () => {
    const b = styleCombo(STYLES.basico);
    expect(b.combo).toEqual(['jab', 'direto', 'gancho']);
    expect(b.attacks.jab.styleMult).toBeCloseTo(1.05);
    const v = styleCombo(STYLES.voltaico);
    expect(v.attacks[v.combo[2]].chain).toBe(true);
    const r = new AttackRunner(v);
    r.press();
    let id = null;
    for (let i = 0; i < 60 && !id; i++) id = r.update(1 / 60)?.id;
    expect(id).toBe('voltaico_g1');
    expect(styleCombo(STYLES.mares).attacks.mares_g1.knock).toBeGreaterThan(styleCombo(STYLES.basico).attacks.jab.knock);
  });

  it('salvo novo tem o Combate Básico; estilos inválidos saem', () => {
    const s = migrate({ version: 5, styles: ['voltaico', 'xyz'], style: 'xyz' });
    expect(s.styles).toEqual(['basico', 'voltaico']);
    expect(s.style).toBe('basico');
    expect(s.vontade).toEqual({ armadura: false, percepcao: false });
  });
});

describe('Vontade', () => {
  const make = (learned = { armadura: true, percepcao: true }) => new Vontade({ save: { vontade: learned, proficiency: {} } });

  it('só liga se aprendida; Armadura gasta 6/s e Percepção 4/s; volta 8/s desligada', () => {
    const v0 = make({ armadura: false, percepcao: false });
    expect(v0.toggle('armor')).toBe(false);
    const v = make();
    v.toggle('armor');
    v.toggle('sense');
    for (let i = 0; i < 60; i++) v.update(1 / 60);
    expect(v.value).toBeCloseTo(100 - 10, 0);
    v.toggle('armor');
    v.toggle('sense');
    for (let i = 0; i < 60; i++) v.update(1 / 60);
    expect(v.value).toBeCloseTo(98, 0);
  });

  it('Armadura: +15% de dano e −10% de dano físico; esgota e desliga sozinha', () => {
    const v = make();
    v.toggle('armor');
    expect(v.damageMult).toBeCloseTo(1.15);
    expect(v.mitigation).toBeCloseTo(0.1);
    for (let i = 0; i < 60 * 20; i++) v.update(1 / 60);
    expect(v.armor).toBe(false);
    expect(v.damageMult).toBe(1);
  });

  it('Percepção esquiva 3 golpes e só recarrega 10 s depois de desligar', () => {
    const v = make();
    v.toggle('sense');
    expect([v.autoDodge(), v.autoDodge(), v.autoDodge(), v.autoDodge()]).toEqual([true, true, true, false]);
    v.toggle('sense');
    for (let i = 0; i < 60 * 5; i++) v.update(1 / 60);
    expect(v.dodgesLeft).toBe(0);
    for (let i = 0; i < 60 * (VONTADE.senseRecharge - 4); i++) v.update(1 / 60);
    expect(v.dodgesLeft).toBe(3);
  });
});
