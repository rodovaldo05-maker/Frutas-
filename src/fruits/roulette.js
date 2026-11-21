// Regras da roleta de frutas, da mochila e do Trocador de Fragmentos (doc 09, seções 3 a 5).
// Tudo aqui é puro: recebe o salvo e devolve o resultado, para testar sem gráficos.

export const RARITIES = {
  comum: { id: 'comum', name: 'Comum', chance: 0.7, damage: 1, cooldown: 1, fragments: 1, color: '#8fd16a', order: 2 },
  epico: { id: 'epico', name: 'Épico', chance: 0.25, damage: 1.35, cooldown: 0.8, fragments: 3, color: '#b57bff', order: 1 },
  lendario: { id: 'lendario', name: 'Lendário', chance: 0.05, damage: 1.75, cooldown: 0.6, fragments: 5, color: '#ffc93c', order: 0 },
};
export const SPIN_COST = 200;
export const FRAGMENTS_PER_KEY = 10;
export const BAG_SIZE = 60;
export const PITY = 50; // a cada 50 giros sem Lendário, o próximo é Lendário
export const WATER_IMMUNE = ['mare', 'geada']; // doc 08, seção 1.4

// Frutas Míticas têm metade da chance das demais
export function fruitWeights(fruits) {
  return fruits.map((f) => (f.category === 'Mítica' ? 0.5 : 1));
}

export function rollFruit(fruits, rand = Math.random) {
  const w = fruitWeights(fruits);
  const total = w.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < w.length; i++) {
    r -= w[i];
    if (r < 0) return i;
  }
  return w.length - 1;
}

export function rollRarity(rand = Math.random, pity = 0) {
  if (pity >= PITY - 1) return 'lendario';
  const r = rand();
  if (r < RARITIES.lendario.chance) return 'lendario';
  if (r < RARITIES.lendario.chance + RARITIES.epico.chance) return 'epico';
  return 'comum';
}

export function ensureBag(save) {
  if (!Array.isArray(save.bag)) save.bag = [];
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

// Gira a roleta; nada é cobrado se o giro for bloqueado
export function spin(save, fruits, count, { useKeys = false, rand = Math.random, now = Date.now() } = {}) {
  const reason = spinBlock(save, count, useKeys);
  if (reason) return { ok: false, reason, results: [] };
  if (useKeys) save.keys -= count;
  else save.coins -= count * SPIN_COST;
  const results = [];
  for (let i = 0; i < count; i++) {
    const rarity = rollRarity(rand, save.pity);
    save.pity = rarity === 'lendario' ? 0 : save.pity + 1;
    const item = { uid: save.nextUid++, fruit: fruits[rollFruit(fruits, rand)].id, rarity, fav: false, at: now + i };
    save.bag.push(item);
    results.push(item);
  }
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

export function tradeValue(item) {
  return RARITIES[item.rarity]?.fragments ?? 1;
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

// Frutas de um nível que podem ser trocadas em massa (sem favoritas e sem a da mão)
export function bulkCandidates(save, rarity) {
  return ensureBag(save).bag.filter((it) => it.rarity === rarity && !it.fav && it.uid !== save.held);
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
  save.eaten = { fruit: it.fruit, rarity: it.rarity, at: Date.now() };
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

// Ordenação: nível (Lendário primeiro), nome ou data
export function sortBag(bag, mode, fruits) {
  const name = (it) => fruits.find((f) => f.id === it.fruit)?.name ?? it.fruit;
  const by = {
    nivel: (a, b) => RARITIES[a.rarity].order - RARITIES[b.rarity].order || name(a).localeCompare(name(b), 'pt-BR'),
    nome: (a, b) => name(a).localeCompare(name(b), 'pt-BR') || RARITIES[a.rarity].order - RARITIES[b.rarity].order,
    data: (a, b) => b.at - a.at,
  }[mode] || ((a, b) => b.at - a.at);
  return [...bag].sort(by);
}

export function isWaterCursed(eaten) {
  return !!eaten && !WATER_IMMUNE.includes(eaten.fruit);
}
