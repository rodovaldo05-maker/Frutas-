// Roleta (Mercador de Frutas), mochila e Trocador de Fragmentos sobre o catálogo de frutas.
// A raridade é da fruta (catálogo), não da cópia. Tudo aqui é puro: recebe o salvo e devolve
// o resultado, para testar sem gráficos.

import { RANK, RANKS, FRUIT, TABLES, draw, meetsGuarantee, rankOf, fruitLabel } from './catalog.js';

export const SPIN_COST = 200;
export const FRAGMENTS_PER_KEY = 10;
export const BAG_SIZE = 60;
export const HISTORY_SIZE = 200;
export const WATER_IMMUNE = ['mare', 'geada']; // doc 08, seção 1.4

export const rarityOf = (item) => rankOf(item.fruit).id;

export function ensureBag(save) {
  if (!Array.isArray(save.bag)) save.bag = [];
  if (!Array.isArray(save.history)) save.history = [];
  for (const k of ['keys', 'fragments', 'pity']) if (!Number.isFinite(save[k])) save[k] = 0;
  if (!Number.isFinite(save.nextUid)) save.nextUid = 1 + save.bag.reduce((m, it) => Math.max(m, it.uid || 0), 0);
  return save;
}

const fmt = (n) => n.toLocaleString('pt-BR');

// Motivo para não poder girar (ou null)
export function spinBlock(save, count, useKeys) {
  ensureBag(save);
  if (save.bag.length + count > BAG_SIZE) return `Mochila cheia: libere ${save.bag.length + count - BAG_SIZE} espaço(s)`;
  if (useKeys) {
    if (save.keys < count) return `Faltam ${count - save.keys} chave(s)`;
  } else if (save.coins < count * SPIN_COST) return `Faltam ${fmt(count * SPIN_COST - save.coins)} moedas`;
  return null;
}

// Giros até a garantia da tabela (ou null se não houver garantia)
export function pityLeft(save, table = 'roleta') {
  const g = TABLES[table]?.garantia;
  if (!g?.ativa) return null;
  return Math.max(1, g.giros - (save.pity || 0));
}

// Gira a roleta; nada é cobrado se o giro for bloqueado
export function spin(save, count, { useKeys = false, rand = Math.random, now = Date.now(), table = 'roleta' } = {}) {
  const reason = spinBlock(save, count, useKeys);
  if (reason) return { ok: false, reason, results: [] };
  if (useKeys) save.keys -= count;
  else save.coins -= count * SPIN_COST;
  const results = [];
  for (let i = 0; i < count; i++) {
    const r = draw(table, rand, { pity: save.pity });
    save.pity = meetsGuarantee(table, r.rarity) ? 0 : save.pity + 1;
    const item = { uid: save.nextUid++, fruit: r.fruit, fav: false, at: now + i, origem: table };
    save.bag.push(item);
    save.history.push({ at: now + i, tabela: table, fruta: r.fruit, raridade: r.rarity, garantia: r.guaranteed, pago: useKeys ? 'chave' : 'moedas' });
    results.push({ ...item, rarity: r.rarity, guaranteed: r.guaranteed });
  }
  if (save.history.length > HISTORY_SIZE) save.history.splice(0, save.history.length - HISTORY_SIZE);
  return { ok: true, reason: null, results };
}

export function findItem(save, uid) {
  return ensureBag(save).bag.find((it) => it.uid === uid) || null;
}

function remove(save, uid) {
  const i = save.bag.findIndex((it) => it.uid === uid);
  if (i < 0) return null;
  const [it] = save.bag.splice(i, 1);
  if (save.held === uid) save.held = null;
  return it;
}

// Valor de troca vem da ficha da fruta (não só da raridade)
export function tradeValue(item) {
  return FRUIT[item.fruit]?.valorTroca ?? 1;
}

// Troca frutas por fragmentos; devolve quantos fragmentos ganhou
export function trade(save, uids) {
  ensureBag(save);
  let gained = 0;
  for (const uid of uids) {
    const it = remove(save, uid);
    if (it) gained += tradeValue(it);
  }
  save.fragments += gained;
  return gained;
}

// Frutas de um rank que podem ser trocadas em massa (sem favoritas e sem a da mão)
export function bulkCandidates(save, rarity) {
  return ensureBag(save).bag.filter((it) => rarityOf(it) === rarity && !it.fav && it.uid !== save.held);
}

export function makeKeys(save, n = 1) {
  ensureBag(save);
  const can = Math.min(n, Math.floor(save.fragments / FRAGMENTS_PER_KEY));
  save.fragments -= can * FRAGMENTS_PER_KEY;
  save.keys += can;
  return can;
}

export function hold(save, uid) {
  save.held = uid === null || findItem(save, uid) ? uid : null;
  return save.held;
}

// Comer: a fruta sai da mochila e substitui a atual
export function eat(save, uid) {
  const it = remove(ensureBag(save), uid);
  if (!it) return null;
  const previous = save.eaten || null;
  save.eaten = { fruit: it.fruit, at: Date.now() };
  return { eaten: save.eaten, previous };
}

export function discard(save, uid) {
  return !!remove(ensureBag(save), uid);
}

export function toggleFav(save, uid) {
  const it = findItem(save, uid);
  if (it) it.fav = !it.fav;
  return it?.fav ?? false;
}

// Ordenação: raridade (Mítica primeiro), nome ou data
export function sortBag(bag, mode) {
  const name = (it) => FRUIT[it.fruit]?.nome ?? it.fruit;
  const order = (it) => rankOf(it.fruit).ordem;
  const by = {
    nivel: (a, b) => order(b) - order(a) || name(a).localeCompare(name(b), 'pt-BR'),
    nome: (a, b) => name(a).localeCompare(name(b), 'pt-BR') || order(b) - order(a),
    data: (a, b) => b.at - a.at,
  }[mode] || ((a, b) => b.at - a.at);
  return [...bag].sort(by);
}

export function isWaterCursed(eaten) {
  return !!eaten && !WATER_IMMUNE.includes(eaten.fruit);
}

export { RANK, RANKS, fruitLabel };
