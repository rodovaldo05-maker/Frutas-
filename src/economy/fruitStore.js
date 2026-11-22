// Loja de Frutas do Porto das Origens (atualização 11): o estoque do dia sai da tabela de
// raridade "loja" (data/tabelas-frutas.json), sorteado pela semente da vila e pelo dia do
// jogo; renova às 6h. Cada vaga vende uma fruta pelo preço da ficha (precoBase); a fruta vai
// para a mochila. Sem moedas ou sem espaço na mochila, nada é cobrado.

import { draw, FRUIT, RANK } from '../fruits/catalog.js';
import { BAG_SIZE, ensureBag } from '../fruits/roulette.js';
import { mulberry32 } from '../core/math.js';

export const STORE_TABLE = 'loja';
export const STORE_SLOTS = 4;
export const STORE_RESTOCK_HOUR = 6;

// Dia do estoque: muda às 6h (e não à meia-noite)
export const stockDay = (clock) => Math.floor((clock - STORE_RESTOCK_HOUR * 60) / 1440);

export function storeStock(day, seed = 2026) {
  const rand = mulberry32((seed * 7919 + day * 104729) >>> 0);
  const out = [];
  for (let slot = 0; slot < STORE_SLOTS; slot++) {
    let r = draw(STORE_TABLE, rand);
    for (let k = 0; k < 8 && out.some((o) => o.fruit === r.fruit); k++) r = draw(STORE_TABLE, rand);
    out.push({ slot, fruit: r.fruit, rarity: r.rarity, price: FRUIT[r.fruit].precoBase, rank: RANK[r.rarity] });
  }
  return out;
}

export function normalizeStore(s) {
  if (!s || typeof s !== 'object' || !Number.isInteger(s.day)) return { day: -1, bought: [] };
  return { day: s.day, bought: Array.isArray(s.bought) ? s.bought.filter((n) => Number.isInteger(n) && n >= 0 && n < STORE_SLOTS) : [] };
}

// O que já foi comprado hoje (zera quando o estoque renova)
export function boughtToday(save, day) {
  save.store = normalizeStore(save.store);
  if (save.store.day !== day) save.store = { day, bought: [] };
  return save.store.bought;
}

export function buyFromStore(save, day, slot, { seed = 2026, now = Date.now() } = {}) {
  ensureBag(save);
  const stock = storeStock(day, seed);
  const offer = stock[slot];
  if (!offer) return { ok: false, reason: 'Vaga inexistente' };
  const bought = boughtToday(save, day);
  if (bought.includes(slot)) return { ok: false, reason: 'Esgotada hoje' };
  if (save.bag.length >= BAG_SIZE) return { ok: false, reason: 'Mochila cheia' };
  if (save.coins < offer.price) return { ok: false, reason: `Faltam ${(offer.price - save.coins).toLocaleString('pt-BR')} moedas` };
  save.coins -= offer.price;
  bought.push(slot);
  const item = { uid: save.nextUid++, fruit: offer.fruit, fav: false, at: now, origem: STORE_TABLE };
  save.bag.push(item);
  save.history.push({ at: now, tabela: STORE_TABLE, fruta: offer.fruit, raridade: offer.rarity, garantia: false, pago: 'loja' });
  return { ok: true, item, offer };
}
