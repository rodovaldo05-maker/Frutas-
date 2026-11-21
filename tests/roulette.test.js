import { describe, it, expect } from 'vitest';
import DATA from '../data/fruto-catalog.json';
import {
  spin, spinBlock, rollFruit, rollRarity, trade, makeKeys, eat, discard, toggleFav, hold, sortBag, bulkCandidates,
  BAG_SIZE, SPIN_COST, PITY, isWaterCursed,
} from '../src/fruits/roulette.js';
import { mulberry32 } from '../src/core/math.js';
import { newSave } from '../src/saves/saveSystem.js';

const fruits = DATA.fruits;
const fresh = (over = {}) => ({ ...newSave(), ...over });

describe('roleta de frutas', () => {
  it('níveis saem perto de 70% / 25% / 5%', () => {
    const rand = mulberry32(3);
    const count = { comum: 0, epico: 0, lendario: 0 };
    for (let i = 0; i < 20000; i++) count[rollRarity(rand)] += 1;
    expect(count.comum / 20000).toBeCloseTo(0.7, 1);
    expect(count.epico / 20000).toBeCloseTo(0.25, 1);
    expect(count.lendario / 20000).toBeGreaterThan(0.04);
    expect(count.lendario / 20000).toBeLessThan(0.06);
  });

  it('frutas Míticas saem com metade da chance', () => {
    const rand = mulberry32(9);
    const hits = new Array(fruits.length).fill(0);
    for (let i = 0; i < 40000; i++) hits[rollFruit(fruits, rand)] += 1;
    const normal = hits[0];
    const mythic = hits[fruits.findIndex((f) => f.category === 'Mítica')];
    expect(mythic / normal).toBeGreaterThan(0.4);
    expect(mythic / normal).toBeLessThan(0.6);
  });

  it('giro ×1 custa 200 moedas e vai para a mochila', () => {
    const s = fresh();
    expect(s.coins).toBe(200);
    const r = spin(s, fruits, 1, { rand: mulberry32(1) });
    expect(r.ok).toBe(true);
    expect(s.coins).toBe(0);
    expect(s.bag).toHaveLength(1);
    expect(spin(s, fruits, 1).reason).toBe('Faltam 200 moedas');
  });

  it('giro ×10 com chaves; sem chaves suficientes não cobra', () => {
    const s = fresh({ keys: 9 });
    const r = spin(s, fruits, 10, { useKeys: true });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('Faltam 1 chave(s)');
    expect(s.keys).toBe(9);
    s.keys = 10;
    expect(spin(s, fruits, 10, { useKeys: true }).results).toHaveLength(10);
    expect(s.keys).toBe(0);
  });

  it('mochila cheia bloqueia o giro sem cobrar', () => {
    const s = fresh({ coins: SPIN_COST * 100 });
    spin(s, fruits, 10);
    s.bag = Array.from({ length: BAG_SIZE - 5 }, (_, i) => ({ uid: 1000 + i, fruit: 'brasa', rarity: 'comum', fav: false, at: i }));
    const before = s.coins;
    expect(spinBlock(s, 10, false)).toMatch(/Mochila cheia/);
    expect(spin(s, fruits, 10).ok).toBe(false);
    expect(s.coins).toBe(before);
    expect(spin(s, fruits, 5).ok).toBe(true);
  });

  it('garantia: depois de 49 giros sem Lendário, o próximo é Lendário', () => {
    expect(rollRarity(() => 0.99, PITY - 1)).toBe('lendario');
    const s = fresh({ coins: 1e9 });
    spin(s, fruits, 60, { rand: () => 0.99 }); // nunca sorteia Lendário por sorte
    const legend = s.bag.filter((it) => it.rarity === 'lendario').length;
    expect(legend).toBe(1);
    expect(s.bag[PITY - 1].rarity).toBe('lendario');
  });
});

describe('trocador e mochila', () => {
  const bag = () => [
    { uid: 1, fruit: 'brasa', rarity: 'comum', fav: false, at: 1 },
    { uid: 2, fruit: 'geada', rarity: 'epico', fav: false, at: 2 },
    { uid: 3, fruit: 'lobo', rarity: 'lendario', fav: false, at: 3 },
    { uid: 4, fruit: 'duna', rarity: 'comum', fav: true, at: 4 },
    { uid: 5, fruit: 'eco', rarity: 'comum', fav: false, at: 5 },
  ];

  it('Comum vale 1, Épico 3, Lendário 5; 10 fragmentos = 1 chave', () => {
    const s = fresh({ bag: bag(), nextUid: 6 });
    expect(trade(s, [1, 2, 3])).toBe(9);
    expect(s.fragments).toBe(9);
    expect(makeKeys(s)).toBe(0);
    s.fragments = 27;
    expect(makeKeys(s, 5)).toBe(2);
    expect(s.keys).toBe(2);
    expect(s.fragments).toBe(7);
  });

  it('troca em massa deixa de fora favoritas e a fruta na mão', () => {
    const s = fresh({ bag: bag(), nextUid: 6 });
    hold(s, 5);
    expect(bulkCandidates(s, 'comum').map((it) => it.uid)).toEqual([1]);
  });

  it('comer substitui a fruta atual e tira da mochila', () => {
    const s = fresh({ bag: bag(), nextUid: 6 });
    hold(s, 2);
    eat(s, 2);
    expect(s.eaten.fruit).toBe('geada');
    expect(s.held).toBe(null);
    const r = eat(s, 3);
    expect(r.previous.fruit).toBe('geada');
    expect(s.eaten).toMatchObject({ fruit: 'lobo', rarity: 'lendario' });
    expect(s.bag.map((it) => it.uid)).toEqual([1, 4, 5]);
  });

  it('favoritar, jogar fora e ordenar', () => {
    const s = fresh({ bag: bag(), nextUid: 6 });
    expect(toggleFav(s, 1)).toBe(true);
    expect(discard(s, 5)).toBe(true);
    expect(sortBag(s.bag, 'nivel', fruits).map((it) => it.rarity)).toEqual(['lendario', 'epico', 'comum', 'comum']);
    expect(sortBag(s.bag, 'data', fruits)[0].uid).toBe(4);
  });

  it('Maré e Geada são imunes à água; as outras não', () => {
    expect(isWaterCursed(null)).toBe(false);
    expect(isWaterCursed({ fruit: 'mare' })).toBe(false);
    expect(isWaterCursed({ fruit: 'geada' })).toBe(false);
    expect(isWaterCursed({ fruit: 'brasa' })).toBe(true);
  });
});
