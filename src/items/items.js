// Itens e equipamentos (documento mestre 4.0, seções 28–29; atualização 8).
// Armaduras (cabeça, torso, pernas, botas) e acessórios (anel, amuleto) com qualidade
// (Comum a Mítico, independente da fruta e da raça), nível recomendado, peso, durabilidade,
// preço, atributos e sinergias pequenas e opcionais de raça. Item quebrado (durabilidade 0)
// não dá bônus até ser consertado. Os bônus somados têm teto.

export const QUALITY = {
  Comum: '#A5ADB5', Incomum: '#41C978', Rara: '#3E9EFF', Épica: '#B56BFF', Lendária: '#FFB83D', Mítica: '#FF526B',
};
export const SLOTS = ['cabeca', 'torso', 'pernas', 'botas', 'anel', 'amuleto'];
export const SLOT_NAMES = { cabeca: 'Cabeça', torso: 'Torso', pernas: 'Pernas', botas: 'Botas', anel: 'Anel', amuleto: 'Amuleto' };

// atributos: defesa (valor de defesa), vida, folego, energia, elemental (fração), sinergia { raca, efeito, valor, texto }
export const ITEMS = {
  'bandana-treino': { nome: 'Bandana de Treino', slot: 'cabeca', qualidade: 'Comum', nivel: 1, preco: 300, peso: 0.3, dur: 40, cor: '#c0392b', attrs: { defesa: 2, vida: 5 } },
  'gibao-couro': { nome: 'Gibão de Couro', slot: 'torso', qualidade: 'Comum', nivel: 1, preco: 600, peso: 2, dur: 50, cor: '#8a5a32', attrs: { defesa: 4, vida: 10 } },
  'calcas-reforcadas': { nome: 'Calças Reforçadas', slot: 'pernas', qualidade: 'Comum', nivel: 1, preco: 450, peso: 1.5, dur: 45, cor: '#5a4a3a', attrs: { defesa: 3 } },
  'botas-leves': {
    nome: 'Botas Leves', slot: 'botas', qualidade: 'Incomum', nivel: 3, preco: 1200, peso: 0.5, dur: 50, cor: '#d8c49a', attrs: { defesa: 2, folego: 10 },
    sinergia: { raca: 'ceu', efeito: 'queda', valor: 0.1, texto: 'Homem do Céu: −10% de dano de queda' },
  },
  'elmo-ferro': { nome: 'Elmo de Ferro', slot: 'cabeca', qualidade: 'Rara', nivel: 5, preco: 3500, peso: 2, dur: 80, cor: '#9aa4b0', attrs: { defesa: 6, vida: 15 } },
  'couraca-escamas': {
    nome: 'Couraça de Escamas', slot: 'torso', qualidade: 'Rara', nivel: 5, preco: 5000, peso: 3, dur: 90, cor: '#2f9c96', attrs: { defesa: 8, elemental: 0.04 },
    sinergia: { raca: 'aquatico', efeito: 'nado', valor: 0.05, texto: 'Aquático: +5% nadando (hidrodinâmica)' },
  },
  'grevas-aco': { nome: 'Grevas de Aço', slot: 'pernas', qualidade: 'Rara', nivel: 5, preco: 4000, peso: 2.5, dur: 80, cor: '#7a8494', attrs: { defesa: 6, vida: 5 } },
  'botas-vento': {
    nome: 'Botas do Vento', slot: 'botas', qualidade: 'Épica', nivel: 8, preco: 9000, peso: 0.5, dur: 70, cor: '#bfe6ff', attrs: { defesa: 4, folego: 20 },
    sinergia: { raca: 'ceu', efeito: 'queda', valor: 0.15, texto: 'Homem do Céu: −15% de dano de queda' },
  },
  'manto-brasa': { nome: 'Manto de Brasa', slot: 'torso', qualidade: 'Épica', nivel: 8, preco: 12000, peso: 2, dur: 90, cor: '#c8401c', attrs: { defesa: 7, vida: 20, elemental: 0.08 } },
  'anel-cobre': { nome: 'Anel de Cobre', slot: 'anel', qualidade: 'Comum', nivel: 1, preco: 400, peso: 0, dur: 0, cor: '#c87a3a', attrs: { folego: 5 } },
  'colar-conchas': { nome: 'Colar de Conchas', slot: 'amuleto', qualidade: 'Incomum', nivel: 2, preco: 900, peso: 0, dur: 0, cor: '#f2e6c8', attrs: { elemental: 0.03 } },
  'foco-arcano': {
    nome: 'Foco Arcano', slot: 'amuleto', qualidade: 'Rara', nivel: 5, preco: 4500, peso: 0, dur: 0, cor: '#b46bff', attrs: { energia: 10 },
    sinergia: { raca: 'ghoul', efeito: 'energiaRegen', valor: 0.05, texto: 'Ghoul: +5% de recuperação de energia' },
  },
  'bracelete-tecnico': {
    nome: 'Bracelete Técnico', slot: 'anel', qualidade: 'Rara', nivel: 5, preco: 4000, peso: 0, dur: 0, cor: '#e8c070', attrs: { folego: 8 },
    sinergia: { raca: 'humano', efeito: 'adaptCd', valor: 0.1, texto: 'Humano: −10% de recarga da Adaptação Tática' },
  },
  'amuleto-mare': {
    nome: 'Amuleto da Maré', slot: 'amuleto', qualidade: 'Épica', nivel: 8, preco: 10000, peso: 0, dur: 0, cor: '#4fd2e0', attrs: { vida: 15, elemental: 0.05 },
    sinergia: { raca: 'aquatico', efeito: 'nado', valor: 0.05, texto: 'Aquático: +5% nadando' },
  },
};
export const ITEM_IDS = Object.keys(ITEMS);
export const ARMOR_SLOTS = ['cabeca', 'torso', 'pernas', 'botas'];

// Tetos dos bônus somados de equipamento
export const GEAR_CAPS = { defesa: 30, vida: 60, folego: 40, energia: 25, elemental: 0.15 };

export function normalizeGear(save) {
  save.items = Array.isArray(save.items) ? save.items.filter((it) => it && ITEMS[it.id] && Number.isFinite(it.uid)) : [];
  for (const it of save.items) it.dur = Math.max(0, Math.min(ITEMS[it.id].dur, Number.isFinite(it.dur) ? it.dur : ITEMS[it.id].dur));
  const gear = {};
  for (const s of SLOTS) {
    const uid = save.gear?.[s];
    const it = save.items.find((x) => x.uid === uid);
    gear[s] = it && ITEMS[it.id].slot === s ? uid : null;
  }
  save.gear = gear;
  if (!Number.isFinite(save.nextItemUid)) save.nextItemUid = 1 + save.items.reduce((m, it) => Math.max(m, it.uid), 0);
  return save;
}

export function addItem(save, id) {
  if (!ITEMS[id]) return null;
  save.items ??= [];
  save.nextItemUid ??= 1;
  const it = { uid: save.nextItemUid++, id, dur: ITEMS[id].dur };
  save.items.push(it);
  return it;
}

export const isBroken = (it) => ITEMS[it.id].dur > 0 && it.dur <= 0;

export function equipItem(save, uid) {
  const it = save.items.find((x) => x.uid === uid);
  if (!it) return false;
  save.gear[ITEMS[it.id].slot] = uid;
  return true;
}

export function unequip(save, slot) {
  save.gear[slot] = null;
}

export const equipped = (save) => SLOTS.map((s) => save.items.find((x) => x.uid === save.gear?.[s])).filter(Boolean);

// Soma dos atributos dos itens equipados (quebrados não contam), com tetos; sinergias só
// para a raça certa; peso total e penalidade de recuperação de fôlego
export function gearTotals(save) {
  const t = { defesa: 0, vida: 0, folego: 0, energia: 0, elemental: 0, peso: 0, queda: 0, nado: 0, energiaRegen: 0, adaptCd: 0, sinergias: [] };
  for (const it of equipped(save)) {
    const d = ITEMS[it.id];
    t.peso += d.peso;
    if (isBroken(it)) continue;
    for (const [k, v] of Object.entries(d.attrs)) t[k] += v;
    if (d.sinergia && d.sinergia.raca === save.race) {
      t[d.sinergia.efeito] += d.sinergia.valor;
      t.sinergias.push(d.sinergia.texto);
    }
  }
  for (const [k, cap] of Object.entries(GEAR_CAPS)) t[k] = Math.min(cap, t[k]);
  t.pesoPenalty = Math.min(0.2, Math.max(0, t.peso - 6) * 0.02); // −2% de recuperação de fôlego por unidade acima de 6
  return t;
}

// Golpe recebido gasta 1 de durabilidade de uma peça de armadura equipada
export function wearArmor(save, rnd = Math.random) {
  const pieces = equipped(save).filter((it) => ITEMS[it.id].dur > 0 && ARMOR_SLOTS.includes(ITEMS[it.id].slot) && it.dur > 0);
  if (!pieces.length) return null;
  const it = pieces[Math.floor(rnd() * pieces.length)];
  it.dur -= 1;
  return it.dur <= 0 ? it : null; // devolve a peça que acabou de quebrar
}

export function repairCost(save) {
  return save.items.reduce((sum, it) => {
    const d = ITEMS[it.id];
    return d.dur > 0 ? sum + Math.ceil(((d.dur - it.dur) / d.dur) * d.preco * 0.25) : sum;
  }, 0);
}

export function repairAll(save) {
  for (const it of save.items) it.dur = ITEMS[it.id].dur;
}

// Itens que os inimigos derrubam (chance por inimigo)
export function dropFor(level, rnd = Math.random) {
  const pool = ITEM_IDS.filter((id) => ITEMS[id].nivel <= level + 1);
  const chance = level >= 4 ? 0.15 : 0.06;
  if (!pool.length || rnd() > chance) return null;
  return pool[Math.floor(rnd() * pool.length)];
}
