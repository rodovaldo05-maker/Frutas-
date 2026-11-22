// Profissões (atualização 12): mineração e pesca, cada uma com maestria própria de 1 a 100
// (save.proficiency 'mineracao' e 'pesca', a mesma curva das proficiências). Regras puras.
//
// Mineração: com a Picareta, minerar um veio leva 1,8 s (até −50% com a maestria) e dá o
// minério do veio; a maestria aumenta a chance de minério extra e de cristal. O veio fica
// vazio e volta em 90 s.
// Pesca: com a Vara, lança a linha num ponto de pesca; o peixe morde depois de 2,5–6 s
// (menos com a maestria); é preciso puxar dentro da janela (0,9 s + maestria). A tabela do
// ponto escolhe a pesca; a maestria deixa os raros mais comuns.

export const NODE_RESPAWN = 90;

export const NODE_TYPES = {
  pedra: { nome: 'Veio de Pedra', cor: '#8d9088', minerio: '#b8b2a4', base: [['pedra', 2, 3]], extra: [['cobre', 0.35]], xp: 6 },
  cobre: { nome: 'Veio de Cobre', cor: '#8a7a6a', minerio: '#d0783a', base: [['cobre', 1, 2], ['pedra', 1, 1]], extra: [['ferro', 0.12]], xp: 9 },
  ferro: { nome: 'Veio de Ferro', cor: '#6f747a', minerio: '#c9d2dc', base: [['ferro', 1, 2]], extra: [['cristal', 0.05]], xp: 13 },
  cristal: { nome: 'Veio de Cristal', cor: '#5a6a7a', minerio: '#7fe0f0', base: [['cristal', 1, 1], ['ferro', 1, 1]], extra: [['cristal', 0.2]], xp: 20 },
};

export const mineTime = (level) => 1.8 * (1 - Math.min(0.5, (level - 1) / 198));

// Minério de um veio: base + extras (chance sobe com a maestria) + 1 a mais às vezes
export function mineYield(type, level, rnd = Math.random) {
  const t = NODE_TYPES[type];
  const out = {};
  const add = (id, n) => (out[id] = (out[id] ?? 0) + n);
  for (const [id, a, b] of t.base) add(id, a + Math.floor(rnd() * (b - a + 1)));
  for (const [id, chance] of t.extra) if (rnd() < chance * (1 + level / 50)) add(id, 1);
  if (rnd() < Math.min(0.35, level / 150)) add(t.base[0][0], 1); // maestria: minério extra
  return out;
}

export const FISH_TABLES = {
  mar: [['sardinha', 40], ['robalo', 24], ['concha', 16], ['atum', 10], ['perola', 3], ['dourado', 2]],
  lagoa: [['sardinha', 30], ['robalo', 30], ['concha', 22], ['perola', 5], ['dourado', 3]],
};
const RARE = new Set(['atum', 'perola', 'dourado']);

export const biteDelay = (level, rnd = Math.random) => (2.5 + rnd() * 3.5) * (1 - Math.min(0.4, (level - 1) / 247));
export const biteWindow = (level) => 0.9 + Math.min(0.6, (level - 1) / 165);

// Sorteia a pesca da tabela; os raros pesam mais com a maestria
export function catchFish(table, level, rnd = Math.random) {
  const rows = FISH_TABLES[table] ?? FISH_TABLES.mar;
  const weight = ([id, w]) => (RARE.has(id) ? w * (1 + (level - 1) / 40) : w);
  const total = rows.reduce((s, r) => s + weight(r), 0);
  let x = rnd() * total;
  for (const r of rows) {
    x -= weight(r);
    if (x < 0) return r[0];
  }
  return rows[0][0];
}

export const FISH_XP = { sardinha: 5, robalo: 8, concha: 4, atum: 14, perola: 16, dourado: 30 };
