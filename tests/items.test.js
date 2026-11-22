import { describe, it, expect } from 'vitest';
import { ITEMS, ITEM_IDS, SLOTS, GEAR_CAPS, addItem, equipItem, unequip, gearTotals, wearArmor, repairCost, repairAll, dropFor, normalizeGear, isBroken } from '../src/items/items.js';
import { migrate } from '../src/saves/saveSystem.js';

const fresh = (race = 'humano') => ({ ...migrate({ version: 5, race }), race });

describe('itens e equipamentos (atualização 8)', () => {
  it('cada item tem encaixe válido, qualidade, nível, preço e atributos', () => {
    expect(ITEM_IDS.length).toBeGreaterThanOrEqual(12);
    for (const id of ITEM_IDS) {
      const d = ITEMS[id];
      expect(SLOTS).toContain(d.slot);
      expect(d.preco).toBeGreaterThan(0);
      expect(Object.keys(d.attrs).length).toBeGreaterThan(0);
    }
  });

  it('equipar soma os atributos; item quebrado não conta; o peso pesa no fôlego', () => {
    const s = fresh();
    const a = addItem(s, 'elmo-ferro');
    const b = addItem(s, 'manto-brasa');
    equipItem(s, a.uid);
    equipItem(s, b.uid);
    let t = gearTotals(s);
    expect(t.defesa).toBe(13);
    expect(t.vida).toBe(35);
    expect(t.elemental).toBeCloseTo(0.08);
    a.dur = 0;
    expect(isBroken(a)).toBe(true);
    t = gearTotals(s);
    expect(t.defesa).toBe(7);
    expect(t.peso).toBe(4); // o peso continua
    unequip(s, 'torso');
    expect(gearTotals(s).vida).toBe(0);
  });

  it('bônus somados têm teto e peso acima de 6 reduz a recuperação de fôlego', () => {
    const s = fresh();
    for (const id of ['elmo-ferro', 'manto-brasa', 'grevas-aco', 'botas-vento', 'amuleto-mare', 'bracelete-tecnico']) equipItem(s, addItem(s, id).uid);
    const t = gearTotals(s);
    expect(t.vida).toBeLessThanOrEqual(GEAR_CAPS.vida);
    expect(t.elemental).toBeLessThanOrEqual(GEAR_CAPS.elemental);
    expect(t.peso).toBe(7);
    expect(t.pesoPenalty).toBeCloseTo(0.02);
  });

  it('sinergia só vale para a raça certa', () => {
    const ceu = fresh('ceu');
    equipItem(ceu, addItem(ceu, 'botas-vento').uid);
    expect(gearTotals(ceu).queda).toBeCloseTo(0.15);
    const hum = fresh('humano');
    equipItem(hum, addItem(hum, 'botas-vento').uid);
    expect(gearTotals(hum).queda).toBe(0);
  });

  it('golpes gastam a armadura; consertar custa moedas e devolve tudo', () => {
    const s = fresh();
    const it = addItem(s, 'gibao-couro');
    equipItem(s, it.uid);
    let broke = null;
    for (let i = 0; i < ITEMS['gibao-couro'].dur; i++) broke = wearArmor(s) || broke;
    expect(broke?.uid).toBe(it.uid);
    expect(repairCost(s)).toBe(Math.ceil(ITEMS['gibao-couro'].preco * 0.25));
    repairAll(s);
    expect(it.dur).toBe(ITEMS['gibao-couro'].dur);
    expect(repairCost(s)).toBe(0);
  });

  it('inimigos às vezes derrubam itens do nível deles', () => {
    expect(dropFor(2, () => 0.99)).toBe(null);
    const id = dropFor(2, () => 0.01);
    expect(ITEMS[id].nivel).toBeLessThanOrEqual(3);
  });

  it('salvo com itens estranhos é corrigido', () => {
    const s = normalizeGear({ items: [{ uid: 3, id: 'anel-cobre' }, { uid: 4, id: 'nada' }], gear: { anel: 3, torso: 3, cabeca: 9 } });
    expect(s.items.length).toBe(1);
    expect(s.gear.anel).toBe(3);
    expect(s.gear.torso).toBe(null);
    expect(s.gear.cabeca).toBe(null);
    expect(s.nextItemUid).toBe(4);
  });
});
