import { describe, it, expect } from 'vitest';
import { generateVillage } from '../src/world/village.js';
import { buildStreetGraph, makeVillagers, placeOf, route, crossesBuilding, activityAt, sleepingAt, streetPath, interiorOf, toWorldOfBuilding, toBuildingLocal } from '../src/world/villageLife.js';
import { questOffers, acceptQuest, questEvent, abandonQuest, normalizeQuests, QUEST_LIMIT, respecCost, questStep } from '../src/quests/village.js';
import { storeStock, buyFromStore, stockDay, STORE_SLOTS, normalizeStore } from '../src/economy/fruitStore.js';
import { chances, validate, FRUIT } from '../src/fruits/catalog.js';
import { hourOf, dayOf, fmtClock, daylight, normalizeClock, START_CLOCK, minutesUntil } from '../src/world/clock.js';
import { migrate, newSave } from '../src/saves/saveSystem.js';

const V = generateVillage({ seed: 2026 });
const G = buildStreetGraph(V);
const VS = makeVillagers(V);

describe('relógio do jogo', () => {
  it('hora, dia e formato', () => {
    expect(hourOf(START_CLOCK)).toBe(8);
    expect(dayOf(START_CLOCK)).toBe(1);
    expect(dayOf(1440 + 5)).toBe(2);
    expect(fmtClock(13 * 60 + 7)).toBe('13:07');
    expect(normalizeClock(-3)).toBe(START_CLOCK);
    expect(minutesUntil(5 * 60, 6)).toBe(60);
    expect(minutesUntil(7 * 60, 6)).toBe(23 * 60);
  });

  it('dia claro, noite escura e tom de pôr do sol', () => {
    expect(daylight(12).k).toBe(1);
    expect(daylight(1).k).toBe(0);
    expect(daylight(19).dusk).toBeGreaterThan(0.9);
    expect(daylight(12).dusk).toBe(0);
  });
});

describe('moradores e rotas', () => {
  it('cada serviço tem quem atenda e todos têm casa', () => {
    for (const papel of ['missoes', 'mercado', 'taverna', 'ferreiro', 'frutas']) expect(VS.some((m) => m.papel === papel)).toBe(true);
    for (const m of VS) expect(V.buildings.some((b) => b.id === m.home && !b.tipo.startsWith('loja') && b.tipo.startsWith('residencia'))).toBe(true);
    expect(new Set(VS.map((m) => m.id)).size).toBe(VS.length);
  });

  it('rotina: casa de madrugada, trabalho de dia, lazer no fim da tarde', () => {
    const m = { offset: 0 };
    expect(activityAt(3, m)).toBe('casa');
    expect(activityAt(10, m)).toBe('trabalho');
    expect(activityAt(19, m)).toBe('lazer');
    expect(activityAt(22.5, m)).toBe('casa');
    expect(sleepingAt(23, m)).toBe(true);
    expect(sleepingAt(12, m)).toBe(false);
    // horários um pouco diferentes por morador
    expect(activityAt(6.4, { offset: -30 })).toBe('trabalho');
    expect(activityAt(6.4, { offset: 30 })).toBe('casa');
  });

  it('rotas de casa ao trabalho, ao lazer e de volta não atravessam casas (várias sementes)', () => {
    for (const seed of [2026, 7, 8, 42]) {
      const v = generateVillage({ seed });
      const g = buildStreetGraph(v);
      for (const m of makeVillagers(v)) {
        const acts = ['casa', 'trabalho', 'lazer', 'casa'];
        for (let k = 0; k < 3; k++) {
          const A = placeOf(v, m, acts[k]);
          const B = placeOf(v, m, acts[k + 1]);
          const pts = route(v, g, A, B);
          expect(pts.length).toBeGreaterThan(2);
          for (let i = 1; i < pts.length; i++) expect(crossesBuilding(v, pts[i - 1], pts[i], [A.building, B.building].filter(Boolean))).toBeNull();
          // começa onde estava e termina no lugar novo
          expect(Math.hypot(pts[0].x - A.inner[A.inner.length - 1].x, pts[0].z - A.inner[A.inner.length - 1].z)).toBeLessThan(0.1);
          const end = B.inner[B.inner.length - 1];
          expect(Math.hypot(pts.at(-1).x - end.x, pts.at(-1).z - end.z)).toBeLessThan(0.1);
        }
      }
    }
  });

  it('o caminho pela rua liga a praça a pontos opostos da vila', () => {
    const p = streetPath(G, { x: -60, z: 0 }, { x: 0, z: 45 });
    const len = p.slice(1).reduce((s, q, i) => s + Math.hypot(q.x - p[i].x, q.z - p[i].z), 0);
    expect(len).toBeLessThan(150);
    expect(len).toBeGreaterThan(60);
  });

  it('quem atende fica atrás do balcão e o cliente na frente', () => {
    const b = V.buildings.find((x) => x.tipo === 'mercado');
    const it = interiorOf(b);
    expect(it.worker.z).toBeLessThan(it.counter.z - it.counter.d / 2);
    expect(it.customer.z).toBeGreaterThan(it.counter.z + it.counter.d / 2);
    const w = toWorldOfBuilding(b, 1.5, -2);
    const l = toBuildingLocal(b, w.x, w.z);
    expect(l.x).toBeCloseTo(1.5, 6);
    expect(l.z).toBeCloseTo(-2, 6);
  });
});

describe('Loja de Frutas', () => {
  it('a tabela da loja é válida e não vende Míticas', () => {
    expect(validate()).toEqual(expect.any(Object));
    const c = chances('loja');
    expect(c.porRank.mitica).toBe(0);
    expect(c.porRank.comum).toBeGreaterThan(c.porRank.rara);
  });

  it('o estoque é o mesmo no mesmo dia, muda com os dias e não repete fruta', () => {
    expect(storeStock(3)).toEqual(storeStock(3));
    const days = new Set(Array.from({ length: 6 }, (_, d) => storeStock(d).map((o) => o.fruit).join()));
    expect(days.size).toBeGreaterThan(1);
    for (let d = 0; d < 10; d++) {
      const s = storeStock(d);
      expect(s).toHaveLength(STORE_SLOTS);
      expect(new Set(s.map((o) => o.fruit)).size).toBe(STORE_SLOTS);
      for (const o of s) expect(o.price).toBe(FRUIT[o.fruit].precoBase);
    }
  });

  it('renova às 6h', () => {
    expect(stockDay(5 * 60 + 59)).toBe(stockDay(-1));
    expect(stockDay(6 * 60)).toBe(stockDay(5 * 60) + 1);
  });

  it('comprar cobra, vai para a mochila, esgota a vaga e nunca cobra sem espaço', () => {
    const save = { ...newSave(), coins: 2_000_000 };
    const offer = storeStock(0)[1];
    const r = buyFromStore(save, 0, 1);
    expect(r.ok).toBe(true);
    expect(save.coins).toBe(2_000_000 - offer.price);
    expect(save.bag.at(-1).fruit).toBe(offer.fruit);
    expect(buyFromStore(save, 0, 1).reason).toBe('Esgotada hoje');
    // no dia seguinte a vaga volta
    expect(buyFromStore(save, 1, 1).ok).toBe(true);
    const poor = { ...newSave(), coins: 10 };
    expect(buyFromStore(poor, 0, 0).ok).toBe(false);
    expect(poor.coins).toBe(10);
    const full = { ...newSave(), coins: 2_000_000, bag: Array.from({ length: 60 }, (_, i) => ({ uid: i + 1, fruit: 'impacto' })) };
    expect(buyFromStore(full, 0, 0).reason).toBe('Mochila cheia');
    expect(full.coins).toBe(2_000_000);
    expect(normalizeStore({ day: 2, bought: [0, 9, 'x'] })).toEqual({ day: 2, bought: [0] });
  });
});

describe('missões da vila', () => {
  const names = Object.fromEntries(VS.map((m) => [m.id, m]));

  it('3 ofertas por dia, iguais no mesmo dia e diferentes entre dias', () => {
    expect(questOffers(5, VS)).toEqual(questOffers(5, VS));
    expect(questOffers(5, VS)).toHaveLength(3);
    const set = new Set(Array.from({ length: 6 }, (_, d) => questOffers(d, VS).map((o) => o.titulo).join()));
    expect(set.size).toBeGreaterThan(1);
  });

  it('entrega: pegar com um morador e entregar a outro dá a recompensa', () => {
    const save = newSave();
    const offer = questOffers(0, VS).find((o) => o.tipo === 'entrega') ?? questOffers(1, VS).find((o) => o.tipo === 'entrega') ?? questOffers(2, VS).find((o) => o.tipo === 'entrega');
    const { quest } = acceptQuest(save, 0, offer);
    expect(questStep(quest, names)).toContain(names[offer.fonte].nome);
    expect(questEvent(save, { kind: 'talk', npc: offer.alvo }).progressed).toHaveLength(0); // ordem certa
    expect(questEvent(save, { kind: 'talk', npc: offer.fonte }).progressed).toHaveLength(1);
    expect(questStep(save.quests.active[0], names)).toContain(names[offer.alvo].nome);
    const r = questEvent(save, { kind: 'talk', npc: offer.alvo });
    expect(r.completed).toHaveLength(1);
    expect(save.quests.active).toHaveLength(0);
    expect(save.quests.done).toBe(1);
  });

  it('caça conta só o tipo certo; conversa conta moradores diferentes', () => {
    const save = newSave();
    acceptQuest(save, 0, { key: 'a', tipo: 'caca', alvo: 'elemental', total: 2, coins: 1, xp: 1 });
    acceptQuest(save, 0, { key: 'b', tipo: 'conversa', total: 2, coins: 1, xp: 1 });
    questEvent(save, { kind: 'defeat', nome: 'Recruta' });
    expect(save.quests.active[0].progresso).toBe(0);
    questEvent(save, { kind: 'defeat', nome: 'Recruta de Brasa', element: 'fogo' });
    expect(save.quests.active[0].progresso).toBe(1);
    questEvent(save, { kind: 'talk', npc: 'x', villager: true });
    questEvent(save, { kind: 'talk', npc: 'x', villager: true });
    expect(save.quests.active[1].progresso).toBe(1);
    expect(questEvent(save, { kind: 'talk', npc: 'y', villager: true }).completed).toHaveLength(1);
  });

  it('limite de missões ativas, oferta aceita uma vez por dia, abandonar libera', () => {
    const save = newSave();
    for (let i = 0; i < QUEST_LIMIT; i++) expect(acceptQuest(save, 0, { key: `k${i}`, tipo: 'conversa', total: 9 }).ok).toBe(true);
    expect(acceptQuest(save, 0, { key: 'extra', tipo: 'conversa', total: 9 }).ok).toBe(false);
    expect(acceptQuest(save, 0, { key: 'k0', tipo: 'conversa', total: 9 }).ok).toBe(false);
    abandonQuest(save, save.quests.active[0].uid);
    expect(acceptQuest(save, 0, { key: 'extra', tipo: 'conversa', total: 9 }).ok).toBe(true);
    // salvo estragado vira estado limpo
    expect(normalizeQuests('x').active).toEqual([]);
    expect(migrate({ ...newSave(), quests: save.quests }).quests.active).toHaveLength(QUEST_LIMIT);
  });

  it('redistribuir no Mestre de Missões custa mais com o nível', () => {
    expect(respecCost(1)).toBe(600);
    expect(respecCost(20)).toBeGreaterThan(respecCost(10));
  });
});
