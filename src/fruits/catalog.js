// Catálogo de frutas (especificação "Sistemas de Frutas e Vilas", Parte A).
// Cada fruta tem TIPO e RARIDADE independentes (ficha em data/frutas.json). O sorteio
// escolhe primeiro o rank pelos pesos da tabela ativa e depois uma fruta elegível do rank.
// Ranks sem frutas elegíveis têm o peso redistribuído de forma explícita entre os demais.

import FRUTAS from '../../data/frutas.json';
import RARIDADES from '../../data/raridades.json';
import TABELAS from '../../data/tabelas-frutas.json';

export const RANKS = RARIDADES.ranks; // do mais comum ao mais raro
export const RANK = Object.fromEntries(RANKS.map((r) => [r.id, r]));
export const FRUITS = FRUTAS.frutas;
export const FRUIT = Object.fromEntries(FRUITS.map((f) => [f.id, f]));
export const TABLES = TABELAS.tabelas;
export const TYPES = {
  essencia: { id: 'essencia', nome: 'Essência', descricao: 'O corpo ganha um poder (impacto, espaço, cristal, som, magnetismo).' },
  elemento: { id: 'elemento', nome: 'Elemento', descricao: 'O corpo vira e controla um elemento (fogo, gelo, raio, água, areia).' },
  fera: { id: 'fera', nome: 'Fera', descricao: 'Formas animais; as Míticas têm formas lendárias.' },
};

export const rankOf = (fruitId) => RANK[FRUIT[fruitId]?.raridade] ?? RANK.comum;
export const fruitName = (fruitId) => FRUIT[fruitId]?.nome ?? fruitId;
export const fruitLabel = (fruitId) => `${fruitName(fruitId)} · ${rankOf(fruitId).nome}`;

// Frutas elegíveis de um rank numa tabela (região e peso > 0)
export function eligible(tableId, rankId, fruits = FRUITS) {
  const t = TABLES[tableId];
  return fruits.filter((f) => f.raridade === rankId && f.pesoSorteio > 0 && (!t?.regiao || f.regiaoDisponivel.includes(t.regiao)));
}

// Chances reais da tabela: por rank e por fruta (somam 1). Ranks vazios: peso redistribuído
// proporcionalmente aos ranks com frutas; a lista `redistribuidos` informa quais foram.
export function chances(tableId, fruits = FRUITS) {
  const t = TABLES[tableId];
  if (!t) throw new Error(`Tabela de frutas desconhecida: ${tableId}`);
  const ranks = RANKS.map((r) => ({ id: r.id, peso: t.pesos[r.id] ?? 0, frutas: eligible(tableId, r.id, fruits) }));
  const ativos = ranks.filter((r) => r.peso > 0 && r.frutas.length);
  const redistribuidos = ranks.filter((r) => r.peso > 0 && !r.frutas.length).map((r) => r.id);
  const total = ativos.reduce((s, r) => s + r.peso, 0);
  if (total <= 0) return { porRank: {}, porFruta: {}, redistribuidos, vazia: true };
  const porRank = {};
  const porFruta = {};
  for (const r of ranks) porRank[r.id] = 0;
  for (const r of ativos) {
    porRank[r.id] = r.peso / total;
    const soma = r.frutas.reduce((s, f) => s + f.pesoSorteio, 0);
    for (const f of r.frutas) porFruta[f.id] = porRank[r.id] * (f.pesoSorteio / soma);
  }
  return { porRank, porFruta, redistribuidos, vazia: false };
}

function pick(items, weight, rand) {
  const total = items.reduce((s, it) => s + weight(it), 0);
  let x = rand() * total;
  for (const it of items) {
    x -= weight(it);
    if (x < 0) return it;
  }
  return items[items.length - 1];
}

// Sorteia uma fruta: primeiro o rank, depois a fruta do rank. `pity` = giros seguidos
// sem atingir o mínimo da garantia (se a tabela tiver garantia ativa).
export function draw(tableId, rand = Math.random, { pity = 0, fruits = FRUITS } = {}) {
  const t = TABLES[tableId];
  const c = chances(tableId, fruits);
  if (c.vazia) return null;
  let rankIds = RANKS.map((r) => r.id).filter((id) => c.porRank[id] > 0);
  let guaranteed = false;
  const g = t.garantia;
  if (g?.ativa && pity >= g.giros - 1) {
    const min = RANK[g.minimo].ordem;
    const top = rankIds.filter((id) => RANK[id].ordem >= min);
    if (top.length) {
      rankIds = top;
      guaranteed = true;
    }
  }
  const rankId = pick(rankIds, (id) => c.porRank[id], rand);
  const fruit = pick(eligible(tableId, rankId, fruits), (f) => f.pesoSorteio, rand);
  return { fruit: fruit.id, rarity: rankId, guaranteed };
}

// O rank alcança o mínimo da garantia?
export function meetsGuarantee(tableId, rankId) {
  const g = TABLES[tableId]?.garantia;
  return !!g?.ativa && RANK[rankId].ordem >= RANK[g.minimo].ordem;
}

// Validação dos dados (usada nos testes e no início do jogo)
export function validate() {
  const problems = [];
  const fields = ['id', 'nome', 'tipo', 'subtipo', 'raridade', 'corRaridade', 'descricao', 'icone', 'modelo3D', 'precoBase', 'valorTroca',
    'pesoSorteio', 'regiaoDisponivel', 'habilidades', 'efeitos', 'sons', 'animacoes', 'formaHibrida', 'formaCompleta', 'despertar',
    'atributosPorForma', 'consumoEnergia', 'recargas', 'dominio', 'restricoes', 'versao'];
  const ids = new Set();
  for (const f of FRUITS) {
    for (const k of fields) if (!(k in f)) problems.push(`${f.id}: falta o campo ${k}`);
    if (ids.has(f.id)) problems.push(`${f.id}: id repetido`);
    ids.add(f.id);
    if (!RANK[f.raridade]) problems.push(`${f.id}: raridade desconhecida ${f.raridade}`);
    if (!TYPES[f.tipo]) problems.push(`${f.id}: tipo desconhecido ${f.tipo}`);
    if (RANK[f.raridade] && f.corRaridade !== RANK[f.raridade].cor) problems.push(`${f.id}: cor de raridade diferente do rank`);
  }
  if (RANKS.reduce((s, r) => s + r.peso, 0) !== 100) problems.push('pesos padrão dos ranks não somam 100');
  for (const [id, t] of Object.entries(TABLES)) {
    for (const r of Object.keys(t.pesos)) if (!RANK[r]) problems.push(`tabela ${id}: rank desconhecido ${r}`);
    const c = chances(id);
    if (c.vazia) problems.push(`tabela ${id}: nenhuma fruta elegível`);
    const soma = Object.values(c.porFruta).reduce((a, b) => a + b, 0);
    if (!c.vazia && Math.abs(soma - 1) > 1e-9) problems.push(`tabela ${id}: chances somam ${soma}`);
    if (t.garantia?.ativa && !RANK[t.garantia.minimo]) problems.push(`tabela ${id}: garantia com rank desconhecido`);
  }
  return problems;
}
