import { describe, it, expect } from 'vitest';
import { RANKS, RANK, FRUITS, TABLES, chances, draw, validate, eligible } from '../src/fruits/catalog.js';
import {
  spin, spinBlock, trade, makeKeys, eat, discard, toggleFav, hold, sortBag, bulkCandidates, rarityOf, pityLeft,
  BAG_SIZE, SPIN_COST, isWaterCursed,
} from '../src/fruits/roulette.js';
import { mulberry32 } from '../src/core/math.js';
import { newSave, migrate } from '../src/saves/saveSystem.js';

const fresh = (over = {}) => ({ ...newSave(), ...over });

describe('catálogo e raridades', () => {
  it('os dados são válidos (campos da ficha, ranks, tabelas)', () => {
    expect(validate()).toEqual([]);
    expect(FRUITS).toHaveLength(16);
  });

  it('seis ranks com pesos 45/28/16/7/3/1 que somam 100', () => {
    expect(RANKS.map((r) => r.id)).toEqual(['comum', 'incomum', 'rara', 'epica', 'lendaria', 'mitica']);
    expect(RANKS.map((r) => r.peso)).toEqual([45, 28, 16, 7, 3, 1]);
    expect(RANK.mitica.cor).toBe('#FF526B');
  });

  it('Besta, Fênix e os dois Dragões são Míticas', () => {
    expect(eligible('roleta', 'mitica').map((f) => f.id).sort()).toEqual(['besta', 'fenix', 'ocidental', 'oriental']);
  });

  it('as chances reais de cada tabela somam 100%', () => {
    for (const id of Object.keys(TABLES)) {
      const c = chances(id);
      const soma = Object.values(c.porFruta).reduce((a, b) => a + b, 0);
      expect(soma).toBeCloseTo(1, 9);
    }
    expect(chances('roleta').porRank.comum).toBeCloseTo(0.45, 9);
    expect(chances('roleta').porFruta.besta).toBeCloseTo(0.0025, 9);
  });

  it('rank sem frutas: peso redistribuído de forma explícita, sem sortear fruta inexistente', () => {
    const semLendaria = FRUITS.filter((f) => f.raridade !== 'lendaria');
    const c = chances('roleta', semLendaria);
    expect(c.redistribuidos).toEqual(['lendaria']);
    expect(c.porRank.lendaria).toBe(0);
    expect(Object.values(c.porFruta).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
    const rand = mulberry32(5);
    for (let i = 0; i < 2000; i++) {
      const r = draw('roleta', rand, { fruits: semLendaria });
      expect(r.rarity).not.toBe('lendaria');
      expect(semLendaria.some((f) => f.id === r.fruit)).toBe(true);
    }
  });

  it('distribuição estatística do sorteio segue os pesos', () => {
    const rand = mulberry32(11);
    const n = 60000;
    const count = Object.fromEntries(RANKS.map((r) => [r.id, 0]));
    for (let i = 0; i < n; i++) count[draw('roleta', rand).rarity] += 1;
    for (const r of RANKS) expect(count[r.id] / n).toBeCloseTo(r.peso / 100, 2);
  });

  it('o sorteio é reproduzível com a mesma semente', () => {
    const a = Array.from({ length: 30 }, ((rand) => () => draw('roleta', rand).fruit)(mulberry32(42)));
    const b = Array.from({ length: 30 }, ((rand) => () => draw('roleta', rand).fruit)(mulberry32(42)));
    expect(a).toEqual(b);
  });
});

describe('roleta', () => {
  it('giro ×1 custa 200 moedas, vai para a mochila e fica no histórico', () => {
    const s = fresh();
    const r = spin(s, 1, { rand: mulberry32(1) });
    expect(r.ok).toBe(true);
    expect(s.coins).toBe(0);
    expect(s.bag).toHaveLength(1);
    expect(s.history[0]).toMatchObject({ tabela: 'roleta', fruta: r.results[0].fruit, pago: 'moedas' });
    expect(spin(s, 1).reason).toBe('Faltam 200 moedas');
  });

  it('giro ×10 com chaves; sem chaves suficientes não cobra', () => {
    const s = fresh({ keys: 9 });
    const r = spin(s, 10, { useKeys: true });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('Faltam 1 chave(s)');
    expect(s.keys).toBe(9);
    s.keys = 10;
    expect(spin(s, 10, { useKeys: true }).results).toHaveLength(10);
    expect(s.keys).toBe(0);
  });

  it('mochila cheia bloqueia o giro sem cobrar', () => {
    const s = fresh({ coins: SPIN_COST * 100 });
    s.bag = Array.from({ length: BAG_SIZE - 5 }, (_, i) => ({ uid: 1000 + i, fruit: 'brasa', fav: false, at: i }));
    const before = s.coins;
    expect(spinBlock(s, 10, false)).toMatch(/Mochila cheia/);
    expect(spin(s, 10).ok).toBe(false);
    expect(s.coins).toBe(before);
    expect(spin(s, 5).ok).toBe(true);
  });

  it('garantia exibida: Lendária ou Mítica em até 50 giros', () => {
    const s = fresh({ coins: 1e9 });
    expect(pityLeft(s)).toBe(50);
    spin(s, 60, { rand: () => 0.001 }); // sorte mínima: sempre o rank mais comum
    const top = s.bag.filter((it) => ['lendaria', 'mitica'].includes(rarityOf(it)));
    expect(top).toHaveLength(1);
    expect(['lendaria', 'mitica']).toContain(rarityOf(s.bag[49]));
    expect(s.history[49].garantia).toBe(true);
  });
});

describe('trocador e mochila', () => {
  const bag = () => [
    { uid: 1, fruit: 'impacto', fav: false, at: 1 }, // comum
    { uid: 2, fruit: 'lobo', fav: false, at: 2 }, // épica
    { uid: 3, fruit: 'eclipse', fav: false, at: 3 }, // lendária
    { uid: 4, fruit: 'duna', fav: true, at: 4 }, // comum
    { uid: 5, fruit: 'eco', fav: false, at: 5 }, // comum
    { uid: 6, fruit: 'fenix', fav: false, at: 6 }, // mítica
  ];

  it('valor de troca vem da ficha: Comum 1, Épica 3, Lendária 5, Mítica 10; 10 fragmentos = 1 chave', () => {
    const s = fresh({ bag: bag(), nextUid: 7 });
    expect(trade(s, [1, 2, 3, 6])).toBe(19);
    s.fragments = 27;
    expect(makeKeys(s, 5)).toBe(2);
    expect(s.keys).toBe(2);
    expect(s.fragments).toBe(7);
  });

  it('troca em massa deixa de fora favoritas e a fruta na mão', () => {
    const s = fresh({ bag: bag(), nextUid: 7 });
    hold(s, 5);
    expect(bulkCandidates(s, 'comum').map((it) => it.uid)).toEqual([1]);
  });

  it('comer substitui a fruta atual e tira da mochila', () => {
    const s = fresh({ bag: bag(), nextUid: 7 });
    hold(s, 2);
    eat(s, 2);
    expect(s.eaten.fruit).toBe('lobo');
    expect(s.held).toBe(null);
    const r = eat(s, 3);
    expect(r.previous.fruit).toBe('lobo');
    expect(s.bag.map((it) => it.uid)).toEqual([1, 4, 5, 6]);
  });

  it('favoritar, jogar fora e ordenar por raridade', () => {
    const s = fresh({ bag: bag(), nextUid: 7 });
    expect(toggleFav(s, 1)).toBe(true);
    expect(discard(s, 5)).toBe(true);
    expect(sortBag(s.bag, 'nivel').map(rarityOf)).toEqual(['mitica', 'lendaria', 'epica', 'comum', 'comum']);
    expect(sortBag(s.bag, 'data')[0].uid).toBe(6);
  });

  it('salvo antigo com nível por cópia migra para a raridade do catálogo', () => {
    const s = migrate({ version: 2, bag: [{ uid: 1, fruit: 'brasa', rarity: 'lendario', fav: false, at: 1 }], eaten: { fruit: 'besta', rarity: 'epico' }, pity: 33 });
    expect(s.bag[0].rarity).toBeUndefined();
    expect(rarityOf(s.bag[0])).toBe('incomum');
    expect(s.eaten).toEqual({ fruit: 'besta', at: undefined });
    expect(s.pity).toBe(0);
  });

  it('Maré e Geada são imunes à água; as outras não', () => {
    expect(isWaterCursed(null)).toBe(false);
    expect(isWaterCursed({ fruit: 'mare' })).toBe(false);
    expect(isWaterCursed({ fruit: 'geada' })).toBe(false);
    expect(isWaterCursed({ fruit: 'brasa' })).toBe(true);
  });
});
