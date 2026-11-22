// Forja da Rosa (atualização 12): receitas com materiais e moedas, qualidade da peça forjada
// em estrelas (0 a 3, sorteada com a maestria de Forja) e melhorias de +1 a +10 com custo
// crescente. Cada estrela soma +6% e cada melhoria +8% nos atributos da peça (com os tetos do
// equipamento). Sempre mostra a prévia antes; nada é cobrado se faltar algo.

import { ITEMS, addItem, itemMult } from '../items/items.js';
import { WEAPONS } from '../weapons/weapons.js';
import { hasMaterials, takeMaterials } from './materials.js';
import { profOf, addProfXp } from '../progression/proficiency.js';

export const MAX_UP = 10;
export const MAX_STARS = 3;

// item: id do equipamento (items.js) ou arma: id da espada (weapons.js)
export const RECIPES = [
  { id: 'r-anel-cobre', item: 'anel-cobre', mats: { cobre: 4 }, moedas: 120, nivel: 1 },
  { id: 'r-bandana', item: 'bandana-treino', mats: { tecido: 3 }, moedas: 80, nivel: 1 },
  { id: 'r-gibao', item: 'gibao-couro', mats: { tecido: 5, pedra: 2 }, moedas: 180, nivel: 1 },
  { id: 'r-calcas', item: 'calcas-reforcadas', mats: { tecido: 4, cobre: 2 }, moedas: 150, nivel: 1 },
  { id: 'r-colar', item: 'colar-conchas', mats: { concha: 4 }, moedas: 150, nivel: 2 },
  { id: 'r-elmo', item: 'elmo-ferro', mats: { ferro: 6, tecido: 2 }, moedas: 900, nivel: 5 },
  { id: 'r-grevas', item: 'grevas-aco', mats: { ferro: 8 }, moedas: 1000, nivel: 5 },
  { id: 'r-couraca', item: 'couraca-escamas', mats: { ferro: 4, robalo: 3 }, moedas: 1200, nivel: 5 },
  { id: 'r-manto', item: 'manto-brasa', mats: { 'nucleo-brasa': 3, tecido: 6 }, moedas: 2500, nivel: 8 },
  { id: 'r-amuleto', item: 'amuleto-mare', mats: { cristal: 3, perola: 1 }, moedas: 2500, nivel: 8 },
  { id: 'r-sabre', arma: 'sabre-rubro', mats: { ferro: 6, 'nucleo-brasa': 2 }, moedas: 900, nivel: 3 },
  { id: 'r-lamina', arma: 'lamina-mares', mats: { ferro: 10, cristal: 3, 'nucleo-geada': 2 }, moedas: 3500, nivel: 6 },
];
export const RECIPE = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

export { itemMult };

export const recipeName = (r) => (r.item ? ITEMS[r.item].nome : WEAPONS[r.arma].nome);

// Estrelas da peça: a maestria de Forja empurra o sorteio para cima
export function starRoll(level, rnd = Math.random) {
  const x = rnd() * (1 + (level - 1) / 25);
  return x > 1.7 ? 3 : x > 1.2 ? 2 : x > 0.75 ? 1 : 0;
}

// Motivo de não poder forjar (ou null)
export function craftBlock(save, r) {
  if (save.level < r.nivel) return `Nível ${r.nivel} para esta receita`;
  if (r.arma && (save.weapons ?? []).includes(r.arma)) return 'Você já tem esta espada';
  if (!hasMaterials(save, r.mats)) return 'Faltam materiais';
  if (save.coins < r.moedas) return `Faltam ${(r.moedas - save.coins).toLocaleString('pt-BR')} moedas`;
  return null;
}

export function craft(save, recipeId, rnd = Math.random) {
  const r = RECIPE[recipeId];
  if (!r) return { ok: false, reason: 'Receita desconhecida' };
  const why = craftBlock(save, r);
  if (why) return { ok: false, reason: why };
  takeMaterials(save, r.mats);
  save.coins -= r.moedas;
  const forja = profOf(save, 'forja');
  const xp = 10 + r.nivel * 4;
  let out;
  if (r.arma) {
    save.weapons ??= [];
    save.weapons.push(r.arma);
    out = { ok: true, weapon: r.arma };
  } else {
    const it = addItem(save, r.item);
    it.estrelas = starRoll(forja.level, rnd);
    it.up = 0;
    out = { ok: true, item: it };
  }
  out.levels = addProfXp(save, 'forja', xp);
  out.xp = xp;
  return out;
}

// Custo da próxima melhoria (cresce a cada nível): moedas, ferro e, a partir do +5, cristal
export function upgradeCost(it) {
  const d = ITEMS[it.id];
  const up = it.up ?? 0;
  const moedas = Math.round(120 * Math.pow(1.55, up) * (1 + d.nivel / 4));
  const mats = { ferro: 2 + up };
  if (up >= 5) mats.cristal = up - 3;
  return { moedas, mats };
}

export function upgradeBlock(save, it) {
  if (!it) return 'Item não encontrado';
  if ((it.up ?? 0) >= MAX_UP) return 'Já está no máximo (+10)';
  const c = upgradeCost(it);
  if (!hasMaterials(save, c.mats)) return 'Faltam materiais';
  if (save.coins < c.moedas) return `Faltam ${(c.moedas - save.coins).toLocaleString('pt-BR')} moedas`;
  return null;
}

export function upgrade(save, uid) {
  const it = (save.items ?? []).find((x) => x.uid === uid);
  const why = upgradeBlock(save, it);
  if (why) return { ok: false, reason: why };
  const c = upgradeCost(it);
  takeMaterials(save, c.mats);
  save.coins -= c.moedas;
  it.up = (it.up ?? 0) + 1;
  const xp = 6 + it.up * 2;
  return { ok: true, item: it, levels: addProfXp(save, 'forja', xp), xp };
}

// Prévia: atributos da peça agora e depois (multiplicador aplicado)
export function previewAttrs(it, next = {}) {
  const d = ITEMS[it.id];
  const m0 = itemMult(it);
  const m1 = itemMult({ ...it, ...next });
  return Object.entries(d.attrs).map(([k, v]) => ({ k, now: v * m0, next: v * m1 }));
}
