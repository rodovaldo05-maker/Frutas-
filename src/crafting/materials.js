// Materiais e ferramentas (atualização 12): minérios (mineração), peixes e conchas (pesca) e
// restos dos inimigos (retalhos e núcleos elementais). Ficam em save.materials { id: qtd },
// com teto por pilha. A Mercadora compra pelo valor; a Forja da Rosa usa nas receitas.

export const STACK_MAX = 999;

export const MATERIALS = {
  pedra: { nome: 'Pedra', icone: '🪨', tipo: 'minerio', raridade: 'Comum', valor: 2 },
  cobre: { nome: 'Minério de Cobre', icone: '🟠', tipo: 'minerio', raridade: 'Comum', valor: 8 },
  ferro: { nome: 'Minério de Ferro', icone: '⚙️', tipo: 'minerio', raridade: 'Incomum', valor: 15 },
  cristal: { nome: 'Cristal Marinho', icone: '💎', tipo: 'minerio', raridade: 'Rara', valor: 60 },
  sardinha: { nome: 'Sardinha', icone: '🐟', tipo: 'peixe', raridade: 'Comum', valor: 6 },
  robalo: { nome: 'Robalo', icone: '🐟', tipo: 'peixe', raridade: 'Incomum', valor: 14 },
  atum: { nome: 'Atum', icone: '🐠', tipo: 'peixe', raridade: 'Rara', valor: 35 },
  dourado: { nome: 'Peixe-Dourado', icone: '🐡', tipo: 'peixe', raridade: 'Épica', valor: 120 },
  concha: { nome: 'Concha', icone: '🐚', tipo: 'pesca', raridade: 'Comum', valor: 4 },
  perola: { nome: 'Pérola', icone: '⚪', tipo: 'pesca', raridade: 'Rara', valor: 80 },
  tecido: { nome: 'Retalho de Tecido', icone: '🧵', tipo: 'inimigo', raridade: 'Comum', valor: 5 },
  'nucleo-brasa': { nome: 'Núcleo de Brasa', icone: '🔥', tipo: 'inimigo', raridade: 'Rara', valor: 40 },
  'nucleo-geada': { nome: 'Núcleo de Geada', icone: '❄️', tipo: 'inimigo', raridade: 'Rara', valor: 40 },
  'nucleo-tormenta': { nome: 'Núcleo de Tormenta', icone: '⚡', tipo: 'inimigo', raridade: 'Rara', valor: 40 },
  // navios inimigos (atualização 16)
  tabua: { nome: 'Tábua de Navio', icone: '🪵', tipo: 'navio', raridade: 'Comum', valor: 10 },
  polvora: { nome: 'Pólvora', icone: '💣', tipo: 'navio', raridade: 'Incomum', valor: 25 },
};
export const MATERIAL_IDS = Object.keys(MATERIALS);

export const TOOLS = {
  picareta: { nome: 'Picareta', preco: 400, desc: 'Minera veios de pedra, cobre, ferro e cristal.' },
  vara: { nome: 'Vara de Pesca', preco: 300, desc: 'Pesca nos cais, na praia e na lagoa.' },
};

export function normalizeMaterials(m) {
  const out = {};
  if (m && typeof m === 'object') {
    for (const id of MATERIAL_IDS) {
      const n = Math.floor(Number(m[id]));
      if (n > 0) out[id] = Math.min(STACK_MAX, n);
    }
  }
  return out;
}

export const normalizeTools = (t) => (Array.isArray(t) ? t.filter((id, i, a) => TOOLS[id] && a.indexOf(id) === i) : []);

export const countOf = (save, id) => save.materials?.[id] ?? 0;

// Soma materiais (respeita o teto da pilha); devolve quanto entrou
export function addMaterial(save, id, n = 1) {
  if (!MATERIALS[id] || !(n > 0)) return 0;
  save.materials ??= {};
  const before = save.materials[id] ?? 0;
  save.materials[id] = Math.min(STACK_MAX, before + Math.floor(n));
  return save.materials[id] - before;
}

export function hasMaterials(save, cost) {
  return Object.entries(cost).every(([id, n]) => countOf(save, id) >= n);
}

// Tira os materiais (tudo ou nada)
export function takeMaterials(save, cost) {
  if (!hasMaterials(save, cost)) return false;
  for (const [id, n] of Object.entries(cost)) {
    save.materials[id] -= n;
    if (save.materials[id] <= 0) delete save.materials[id];
  }
  return true;
}

// Vende para a Mercadora pelo valor de cada material
export function sellMaterial(save, id, n = 1) {
  const have = countOf(save, id);
  const qty = Math.min(have, Math.floor(n));
  if (!MATERIALS[id] || qty <= 0) return 0;
  takeMaterials(save, { [id]: qty });
  const coins = qty * MATERIALS[id].valor;
  save.coins += coins;
  return coins;
}

// O que os inimigos derrubam: retalho dos Recrutas; núcleo dos elementais
export function materialDrop(def, rnd = Math.random) {
  const out = [];
  if (rnd() < 0.45) out.push(['tecido', 1 + (rnd() < 0.3 ? 1 : 0)]);
  const core = { fogo: 'nucleo-brasa', gelo: 'nucleo-geada', raio: 'nucleo-tormenta' }[def.element];
  if (core && rnd() < 0.35) out.push([core, 1]);
  return out;
}
