import { describe, it, expect } from 'vitest';
import { ITEMS, addItem, equipItem, sellValue, sellItem, sellMany, SELL_RATE } from '../src/items/items.js';
import { newSave, normalizeSettings } from '../src/saves/saveSystem.js';

const fresh = () => ({ ...newSave(), coins: 0 });

describe('Comprador de Itens', () => {
  it('paga 35% do preço, mais melhorias e estrelas, menos o desgaste', () => {
    const s = fresh();
    const it = addItem(s, 'elmo-ferro');
    const base = Math.round(ITEMS['elmo-ferro'].preco * SELL_RATE);
    expect(sellValue(it)).toBe(base);
    expect(sellValue({ ...it, up: 5, estrelas: 2 })).toBeGreaterThan(base * 1.5);
    expect(sellValue({ ...it, dur: 0 })).toBe(Math.round(base * 0.5));
    // acessório não gasta
    expect(sellValue(addItem(s, 'anel-cobre'))).toBe(Math.round(ITEMS['anel-cobre'].preco * SELL_RATE));
  });

  it('vende, tira da mochila e soma as moedas; equipado não vende', () => {
    const s = fresh();
    const a = addItem(s, 'gibao-couro');
    const b = addItem(s, 'bandana-treino');
    equipItem(s, b.uid);
    const r = sellItem(s, a.uid);
    expect(r.ok).toBe(true);
    expect(s.coins).toBe(r.coins);
    expect(s.items.map((x) => x.uid)).toEqual([b.uid]);
    const no = sellItem(s, b.uid);
    expect(no.ok).toBe(false);
    expect(s.items).toHaveLength(1);
    expect(sellItem(s, 999).ok).toBe(false);
  });

  it('venda em massa respeita o filtro e o equipado', () => {
    const s = fresh();
    const keep = addItem(s, 'bandana-treino');
    equipItem(s, keep.uid);
    addItem(s, 'bandana-treino');
    addItem(s, 'anel-cobre');
    const rare = addItem(s, 'elmo-ferro');
    const r = sellMany(s, (it, d) => d.qualidade === 'Comum');
    expect(r.count).toBe(2);
    expect(s.items.map((x) => x.uid).sort()).toEqual([keep.uid, rare.uid].sort());
    expect(sellMany(s).count).toBe(1);
    expect(s.items).toHaveLength(1);
  });
});

describe('zoom da câmera', () => {
  it('salvo com zoom fora do limite volta ao limite', () => {
    expect(normalizeSettings({ camZoom: 5 }).camZoom).toBe(1.8);
    expect(normalizeSettings({ camZoom: 'x' }).camZoom).toBe(1);
    expect(normalizeSettings({ camZoom: 0.7 }).camZoom).toBe(0.7);
  });
});
