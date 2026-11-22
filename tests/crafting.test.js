import { describe, it, expect } from 'vitest';
import { MATERIALS, addMaterial, takeMaterials, hasMaterials, sellMaterial, normalizeMaterials, normalizeTools, materialDrop, STACK_MAX, countOf } from '../src/crafting/materials.js';
import { NODE_TYPES, mineYield, mineTime, biteDelay, biteWindow, catchFish } from '../src/crafting/professions.js';
import { RECIPES, craft, craftBlock, upgrade, upgradeCost, starRoll, MAX_UP, previewAttrs } from '../src/crafting/forge.js';
import { gearTotals, equipItem, normalizeGear, itemMult, addItem } from '../src/items/items.js';
import { questEvent, acceptQuest } from '../src/quests/village.js';
import { NODES, SPOTS } from '../src/crafting/gathering.js';
import { islandHeight } from '../src/islands/trainingIsland.js';
import { villageHeight, VILLAGE } from '../src/islands/villageIsland.js';
import { mulberry32 } from '../src/core/math.js';
import { migrate, newSave } from '../src/saves/saveSystem.js';

const fresh = (extra = {}) => ({ ...newSave(), ...extra });

describe('materiais', () => {
  it('soma com teto, tira tudo ou nada e vende pelo valor', () => {
    const s = fresh({ coins: 0 });
    expect(addMaterial(s, 'ferro', 5)).toBe(5);
    addMaterial(s, 'pedra', STACK_MAX + 50);
    expect(countOf(s, 'pedra')).toBe(STACK_MAX);
    expect(takeMaterials(s, { ferro: 6 })).toBe(false);
    expect(countOf(s, 'ferro')).toBe(5);
    expect(takeMaterials(s, { ferro: 5 })).toBe(true);
    expect(s.materials.ferro).toBeUndefined();
    addMaterial(s, 'robalo', 3);
    expect(sellMaterial(s, 'robalo', Infinity)).toBe(3 * MATERIALS.robalo.valor);
    expect(s.coins).toBe(3 * MATERIALS.robalo.valor);
    expect(addMaterial(s, 'inexistente', 2)).toBe(0);
  });

  it('salvo estragado vira valores válidos', () => {
    expect(normalizeMaterials({ ferro: '3', x: 9, cobre: -2, pedra: 5000 })).toEqual({ ferro: 3, pedra: STACK_MAX });
    expect(normalizeTools(['vara', 'vara', 'espada'])).toEqual(['vara']);
    const out = migrate(fresh({ materials: { ferro: 4 }, tools: ['picareta'] }));
    expect(out.materials).toEqual({ ferro: 4 });
    expect(out.tools).toEqual(['picareta']);
  });

  it('elementais derrubam o núcleo do elemento; Recrutas derrubam retalhos', () => {
    const all = (def) => {
      const seen = new Set();
      const r = mulberry32(5);
      for (let i = 0; i < 300; i++) for (const [id] of materialDrop(def, r)) seen.add(id);
      return seen;
    };
    expect([...all({})]).toEqual(['tecido']);
    expect(all({ element: 'fogo' }).has('nucleo-brasa')).toBe(true);
    expect(all({ element: 'gelo' }).has('nucleo-brasa')).toBe(false);
  });
});

describe('mineração e pesca', () => {
  it('cada veio dá o minério dele; a maestria acelera e rende mais', () => {
    const r = mulberry32(1);
    const y = mineYield('ferro', 1, r);
    expect(y.ferro).toBeGreaterThanOrEqual(1);
    expect(mineTime(100)).toBeLessThan(mineTime(1));
    const total = (level) => {
      const rr = mulberry32(9);
      let n = 0;
      for (let i = 0; i < 2000; i++) n += Object.values(mineYield('cobre', level, rr)).reduce((a, b) => a + b, 0);
      return n;
    };
    expect(total(80)).toBeGreaterThan(total(1) * 1.1);
    for (const t of Object.keys(NODE_TYPES)) expect(Object.keys(mineYield(t, 1, mulberry32(2))).length).toBeGreaterThan(0);
  });

  it('pesca: mordida mais rápida, janela maior e raros mais comuns com a maestria', () => {
    const r = mulberry32(3);
    expect(biteDelay(100, () => 0.5)).toBeLessThan(biteDelay(1, () => 0.5));
    expect(biteWindow(100)).toBeGreaterThan(biteWindow(1));
    const rares = (level) => {
      const rr = mulberry32(4);
      let n = 0;
      for (let i = 0; i < 5000; i++) if (['atum', 'perola', 'dourado'].includes(catchFish('mar', level, rr))) n++;
      return n;
    };
    expect(rares(80)).toBeGreaterThan(rares(1) * 1.8);
    expect(MATERIALS[catchFish('lagoa', 1, r)]).toBeDefined();
  });

  it('veios em terra firme e pontos de pesca na água', () => {
    for (const n of NODES) {
      const h = n.x > 200 ? villageHeight(n.x - VILLAGE.offset.x, n.z - VILLAGE.offset.z) : islandHeight(n.x, n.z);
      expect(h).toBeGreaterThan(1.5);
    }
    for (const s of SPOTS) {
      const h = s.x > 200 ? villageHeight(s.x - VILLAGE.offset.x, s.z - VILLAGE.offset.z) : islandHeight(s.x, s.z);
      expect(h).toBeLessThan(-0.5);
    }
  });
});

describe('forja', () => {
  it('sem material ou moedas não forja nem cobra', () => {
    const s = fresh({ coins: 5000, level: 10 });
    const r = craft(s, 'r-elmo');
    expect(r.ok).toBe(false);
    expect(s.coins).toBe(5000);
    expect(s.items).toHaveLength(0);
  });

  it('forjar gasta materiais e moedas e a peça sai com 0 a 3 estrelas', () => {
    const s = fresh({ coins: 5000, level: 10, materials: { ferro: 10, tecido: 4 } });
    const r = craft(s, 'r-elmo', () => 0.99);
    expect(r.ok).toBe(true);
    expect(s.materials.ferro).toBe(4);
    expect(s.coins).toBe(5000 - RECIPES.find((x) => x.id === 'r-elmo').moedas);
    expect(r.item.estrelas).toBeGreaterThanOrEqual(0);
    expect(r.item.estrelas).toBeLessThanOrEqual(3);
    expect(s.proficiency.forja.xp).toBeGreaterThan(0);
  });

  it('espada forjada vai para as armas e não repete', () => {
    const s = fresh({ coins: 9000, level: 10, materials: { ferro: 20, 'nucleo-brasa': 4 } });
    expect(craft(s, 'r-sabre').ok).toBe(true);
    expect(s.weapons).toContain('sabre-rubro');
    expect(craftBlock(s, RECIPES.find((x) => x.id === 'r-sabre'))).toBe('Você já tem esta espada');
  });

  it('a maestria de Forja dá mais estrelas', () => {
    const avg = (level) => {
      const r = mulberry32(11);
      let n = 0;
      for (let i = 0; i < 3000; i++) n += starRoll(level, r);
      return n / 3000;
    };
    expect(avg(60)).toBeGreaterThan(avg(1) + 0.8);
  });

  it('melhorar: custo crescente, +8% por nível, prévia e teto +10', () => {
    const s = fresh({ coins: 10_000_000, level: 10, materials: { ferro: 999, cristal: 999 } });
    const it = addItem(s, 'elmo-ferro');
    equipItem(s, it.uid);
    const base = gearTotals(s).defesa;
    let last = 0;
    for (let i = 0; i < MAX_UP; i++) {
      const c = upgradeCost(it);
      expect(c.moedas).toBeGreaterThan(last);
      last = c.moedas;
      const pv = previewAttrs(it, { up: (it.up ?? 0) + 1 });
      expect(pv[0].next).toBeGreaterThan(pv[0].now);
      expect(upgrade(s, it.uid).ok).toBe(true);
    }
    expect(it.up).toBe(MAX_UP);
    expect(upgradeCost({ ...it, up: 6 }).mats.cristal).toBeGreaterThan(0);
    expect(upgrade(s, it.uid).ok).toBe(false);
    expect(gearTotals(s).defesa).toBeCloseTo(base * itemMult(it), 0);
    // salvo com valores fora do limite
    s.items[0].up = 99;
    s.items[0].estrelas = -2;
    normalizeGear(s);
    expect(s.items[0].up).toBe(10);
    expect(s.items[0].estrelas).toBe(0);
  });
});

describe('missões de coleta', () => {
  it('pescar e minerar contam para a missão certa', () => {
    const s = fresh();
    acceptQuest(s, 0, { key: 'p', tipo: 'coleta', alvo: 'peixe', total: 2, coins: 1, xp: 1 });
    acceptQuest(s, 0, { key: 'm', tipo: 'coleta', alvo: 'minerio', total: 3, coins: 1, xp: 1 });
    questEvent(s, { kind: 'gather', what: 'minerio', n: 2 });
    expect(s.quests.active[0].progresso).toBe(0);
    expect(s.quests.active[1].progresso).toBe(2);
    questEvent(s, { kind: 'gather', what: 'peixe', n: 1 });
    expect(questEvent(s, { kind: 'gather', what: 'peixe', n: 1 }).completed).toHaveLength(1);
  });
});
