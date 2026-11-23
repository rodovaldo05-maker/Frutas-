// Missões diárias (atualização 30): três missões por dia (dia do calendário do aparelho), sorteadas
// pela data, com metas e recompensas pelo nível do jogador. O progresso conta sozinho; cada
// missão concluída paga na hora. Fechar as três no mesmo dia abre o Baú Diário e soma 1 na
// sequência de dias; a cada 7 dias seguidos o baú vem dobrado com chave extra e chance de fruta.
// Pular um dia zera a sequência.

import { mulberry32 } from '../core/math.js';

// evento: { kind, n } — kinds: defeat, boss, fish, ore, rep, mastery, ship, beast, power, combo,
// distance, islandQuest
export const DAILY_POOL = [
  { id: 'caca', kind: 'defeat', meta: 12, titulo: 'Caçada do dia', texto: (n) => `Derrote ${n} inimigos` },
  { id: 'chefe', kind: 'boss', meta: 1, titulo: 'Cabeça de chefe', texto: () => 'Derrote 1 chefe de ilha' },
  { id: 'pesca', kind: 'fish', meta: 5, titulo: 'Rede cheia', texto: (n) => `Pesque ${n} peixes` },
  { id: 'mina', kind: 'ore', meta: 8, titulo: 'Veio rico', texto: (n) => `Minere ${n} minérios` },
  { id: 'treino', kind: 'rep', meta: 30, titulo: 'Corpo de ferro', texto: (n) => `Faça ${n} repetições no treino com pesos` },
  { id: 'maestria', kind: 'mastery', meta: 1, titulo: 'Fruta em evolução', texto: () => 'Suba 1 nível de maestria da fruta' },
  { id: 'navio', kind: 'ship', meta: 1, titulo: 'Afundar corsários', texto: () => 'Afunde 1 navio corsário com o canhão do bote' },
  { id: 'besta', kind: 'beast', meta: 1, titulo: 'Caçador do mar', texto: () => 'Derrote 1 besta marinha' },
  { id: 'poder', kind: 'power', meta: 15, titulo: 'Poder à solta', texto: (n) => `Use ${n} habilidades de fruta, arma ou estilo` },
  { id: 'combo', kind: 'combo', meta: 10, titulo: 'Sequência perfeita', texto: (n) => `Acerte ${n} finalizadores (4º golpe do ataque básico)` },
  { id: 'corrida', kind: 'distance', meta: 1500, titulo: 'Pernas fortes', texto: (n) => `Percorra ${n} m a pé` },
  { id: 'ilha', kind: 'islandQuest', meta: 1, titulo: 'Ajudar as ilhas', texto: () => 'Conclua 1 missão de um NPC de ilha' },
];
export const DAILY_COUNT = 3;
export const STREAK_WEEK = 7;

// chave do dia (calendário local do aparelho)
export function dayKey(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}
const dayNumber = (key) => Math.round(Date.UTC(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10)) / 86400000);

// recompensa de uma diária pelo nível
export const dailyReward = (level) => ({ coins: Math.round(300 + level * 10), xp: Math.round(150 + 40 * Math.pow(level, 1.15)) });
export const chestReward = (level, week) => ({ coins: Math.round((1500 + level * 30) * (week ? 2 : 1)), keys: week ? 2 : 1, fruitChance: week ? 0.35 : 0 });

// as três diárias de um dia (iguais para o mesmo dia; a pesca e a mina só com a ferramenta)
export function dailiesFor(key, { tools = [] } = {}) {
  const rand = mulberry32((dayNumber(key) * 2654435761) >>> 0);
  const pool = DAILY_POOL.filter((d) => (d.kind !== 'fish' || tools.includes('vara')) && (d.kind !== 'ore' || tools.includes('picareta')));
  const picked = pool.map((d) => ({ d, r: rand() })).sort((a, b) => a.r - b.r).slice(0, DAILY_COUNT).map(({ d }) => d);
  return picked.map((d) => ({ id: d.id, kind: d.kind, meta: d.meta, titulo: d.titulo, texto: d.texto(d.meta) }));
}

export function normalizeDailies(s) {
  const o = s && typeof s === 'object' ? s : {};
  const num = (v) => Math.max(0, Math.floor(Number(v)) || 0);
  return {
    day: typeof o.day === 'string' ? o.day : null,
    list: Array.isArray(o.list) ? o.list.filter((x) => x && typeof x.id === 'string').map((x) => ({ id: x.id, kind: String(x.kind), meta: num(x.meta) || 1, titulo: String(x.titulo ?? ''), texto: String(x.texto ?? ''), progress: num(x.progress), paid: !!x.paid })).slice(0, DAILY_COUNT) : [],
    chest: !!o.chest,
    streak: num(o.streak),
    lastFull: typeof o.lastFull === 'string' ? o.lastFull : null, // último dia com as três feitas
    total: num(o.total),
  };
}

// troca de dia: sorteia as novas e zera a sequência se ficou um dia sem fechar as três
export function rollDay(st, key, opts = {}) {
  if (st.day === key) return false;
  st.day = key;
  st.list = dailiesFor(key, opts).map((d) => ({ ...d, progress: 0, paid: false }));
  st.chest = false;
  if (st.lastFull && dayNumber(key) - dayNumber(st.lastFull) > 1) st.streak = 0;
  return true;
}

// evento → progresso. Devolve { done: [diárias concluídas agora], chest: bool (as três prontas) }
export function dailyEvent(st, ev) {
  const done = [];
  for (const d of st.list) {
    if (d.paid || d.kind !== ev.kind) continue;
    d.progress = Math.min(d.meta, d.progress + (ev.n ?? 1));
    if (d.progress >= d.meta) {
      d.paid = true;
      st.total += 1;
      done.push(d);
    }
  }
  let chest = false;
  if (done.length && !st.chest && st.list.length && st.list.every((d) => d.paid)) {
    st.chest = true;
    st.streak = st.lastFull && dayNumber(st.day) - dayNumber(st.lastFull) === 1 ? st.streak + 1 : 1;
    st.lastFull = st.day;
    chest = true;
  }
  return { done, chest };
}
