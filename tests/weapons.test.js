import { describe, it, expect } from 'vitest';
import { WEAPONS, WEAPON_IDS, weaponPowers, weaponStyle } from '../src/weapons/weapons.js';
import { profOf, addProfXp, profBonus, profXpToNext } from '../src/progression/proficiency.js';
import { damageMultipliers } from '../src/progression/status.js';
import { computeDamage, AttackRunner, timing } from '../src/combat/rules.js';
import { FRUTOMotion } from '../src/animation/fruto-motion.js';
import { migrate } from '../src/saves/saveSystem.js';

describe('armas e espada (atualização 4)', () => {
  it('cada espada tem preço, combo de três cortes e três habilidades com clipe existente', () => {
    expect(WEAPON_IDS.length).toBeGreaterThanOrEqual(3);
    for (const id of WEAPON_IDS) {
      const w = WEAPONS[id];
      expect(w.preco).toBeGreaterThan(0);
      const st = weaponStyle(w);
      expect(st.combo.length).toBe(3);
      for (const a of Object.values(st.attacks)) {
        expect(FRUTOMotion.clips[a.clip]).toBeTruthy();
        expect(a.weapon).toBe(id);
        expect(a.range).toBeGreaterThan(3.5); // alcança mais que o soco
      }
      const ps = weaponPowers(w);
      expect(ps.map((p) => p.custo)).toEqual([0, 0, 0]);
      for (const p of ps) expect(FRUTOMotion.clips[p.clip]).toBeTruthy();
    }
  });

  it('o combo da espada roda os três cortes', () => {
    const r = new AttackRunner(weaponStyle(WEAPONS['lamina-treino']));
    const ids = [];
    for (let i = 0; i < 240; i++) {
      if (i === 0 || r.current?.struck) r.press();
      const s = r.update(1 / 60);
      if (s) ids.push(s.id);
    }
    expect(ids.slice(0, 3)).toEqual(['lamina-treino_c1', 'lamina-treino_c2', 'lamina-treino_c3']);
    expect(timing('lamina-treino_c1', r.attacks).release).toBeGreaterThan(0);
  });

  it('pontos de Espada e proficiência aumentam o dano da espada', () => {
    const base = computeDamage(13, { mult: damageMultipliers({}).weapon * profBonus(1) });
    const forte = computeDamage(13, { mult: damageMultipliers({ espada: 10 }).weapon * profBonus(51) });
    expect(base).toBe(13);
    expect(forte).toBe(Math.round(13 * 1.3 * 1.15));
  });

  it('a proficiência é do tipo de arma: trocar de espada não muda nada', () => {
    const s = migrate(null);
    s.weapons = ['lamina-treino', 'sabre-rubro'];
    s.weapon = 'lamina-treino';
    addProfXp(s, 'espada', profXpToNext(1) + profXpToNext(2) + 5);
    expect(profOf(s, 'espada').level).toBe(3);
    s.weapon = 'sabre-rubro';
    expect(profOf(s, 'espada').level).toBe(3);
  });

  it('salvo com espada inválida é corrigido', () => {
    const s = migrate({ version: 5, level: 1, weapons: ['sabre-rubro', 'nada', 'sabre-rubro'], weapon: 'nada', proficiency: { espada: { level: '4', xp: 2 } } });
    expect(s.weapons).toEqual(['sabre-rubro']);
    expect(s.weapon).toBe('sabre-rubro');
    expect(s.proficiency.espada.level).toBe(4);
  });
});
