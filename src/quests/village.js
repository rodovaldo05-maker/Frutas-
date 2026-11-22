// Missões da vila (atualização 11): o Mestre de Missões da Prefeitura oferece 3 missões por
// dia (sorteadas pela semente da vila e pelo dia), até 5 ativas ao mesmo tempo. Tipos: entrega
// (pegar com um morador e levar a outro), caça (Recrutas na Ilha de Treino), conversa (conhecer
// moradores) e recado (falar com o Barqueiro da Ilha de Treino). A recompensa sai ao concluir.
// Também cobra a redistribuição dos pontos de status depois da primeira (grátis).

import { mulberry32 } from '../core/math.js';

export const QUEST_LIMIT = 5;
export const OFFERS_PER_DAY = 3;
export const respecCost = (level) => 500 + 100 * Math.max(1, Math.floor(level || 1));

const pick = (rand, list) => list[Math.floor(rand() * list.length)];

// Ofertas do dia. villagers: lista de makeVillagers (id, nome, titulo, papel)
export function questOffers(day, villagers, seed = 2026) {
  const rand = mulberry32((seed * 6007 + day * 7919 + 13) >>> 0);
  const byPapel = (p) => villagers.find((m) => m.papel === p);
  const people = villagers.filter((m) => m.papel === 'morador');
  const mercadora = byPapel('mercado');
  const ferreira = byPapel('ferreiro');
  const templates = [
    () => {
      const to = pick(rand, people);
      return { tipo: 'entrega', titulo: 'Encomenda do Mercado', fonte: mercadora.id, alvo: to.id, total: 2, coins: 250, xp: 120, descricao: `Pegue a encomenda com ${mercadora.nome} (Mercado) e leve até ${to.nome} (${to.titulo}).` };
    },
    () => {
      const to = pick(rand, people.filter((m) => m.titulo !== 'Carpinteiro')) ?? people[0];
      return { tipo: 'entrega', titulo: 'Ferramentas da forja', fonte: ferreira.id, alvo: to.id, total: 2, coins: 300, xp: 140, descricao: `Pegue as ferramentas com ${ferreira.nome} (Ferreiro) e leve até ${to.nome} (${to.titulo}).` };
    },
    () => ({ tipo: 'caca', titulo: 'Recrutas na praia', alvo: 'Recruta', total: 5, coins: 400, xp: 200, descricao: 'Derrote 5 Recrutas na Arena da Ilha de Treino.' }),
    () => ({ tipo: 'caca', titulo: 'Acampamento Elemental', alvo: 'elemental', total: 3, coins: 600, xp: 260, descricao: 'Derrote 3 Recrutas elementais (Brasa, Geada ou Tormenta) no Acampamento Elemental.' }),
    () => ({ tipo: 'conversa', titulo: 'Conhecer a vila', total: 4, coins: 150, xp: 80, descricao: 'Converse com 4 moradores diferentes do Porto das Origens.' }),
    () => ({ tipo: 'recado', titulo: 'Recado ao outro cais', alvo: 'barqueiro-treino', total: 1, coins: 200, xp: 100, descricao: 'Leve um recado ao Barqueiro do cais da Ilha de Treino (de bote ou com a viagem rápida).' }),
  ];
  const order = templates.map((t, i) => ({ t, i, r: rand() })).sort((a, b) => a.r - b.r).slice(0, OFFERS_PER_DAY);
  return order.map(({ t, i }) => ({ key: `${day}:${i}`, ...t() }));
}

export function normalizeQuests(q) {
  const base = { day: -1, accepted: [], active: [], tracked: null, nextUid: 1, done: 0 };
  if (!q || typeof q !== 'object') return base;
  const active = Array.isArray(q.active) ? q.active.filter((x) => x && typeof x === 'object' && Number.isInteger(x.uid) && typeof x.tipo === 'string').slice(0, QUEST_LIMIT) : [];
  return {
    day: Number.isInteger(q.day) ? q.day : -1,
    accepted: Array.isArray(q.accepted) ? q.accepted.filter((k) => typeof k === 'string') : [],
    active,
    tracked: active.some((x) => x.uid === q.tracked) ? q.tracked : null,
    nextUid: Math.max(Number.isInteger(q.nextUid) ? q.nextUid : 1, 1 + active.reduce((m, x) => Math.max(m, x.uid), 0)),
    done: Number.isInteger(q.done) ? q.done : 0,
  };
}

// Ofertas aceitas são por dia (no dia seguinte vêm outras)
function today(save, day) {
  save.quests = normalizeQuests(save.quests);
  if (save.quests.day !== day) {
    save.quests.day = day;
    save.quests.accepted = [];
  }
  return save.quests;
}

export function offerState(save, day, offer) {
  const q = today(save, day);
  if (q.accepted.includes(offer.key)) return 'aceita';
  if (q.active.length >= QUEST_LIMIT) return 'cheio';
  return 'livre';
}

export function acceptQuest(save, day, offer) {
  const q = today(save, day);
  if (q.accepted.includes(offer.key)) return { ok: false, reason: 'Missão já aceita hoje' };
  if (q.active.length >= QUEST_LIMIT) return { ok: false, reason: `Limite de ${QUEST_LIMIT} missões ativas` };
  const quest = { uid: q.nextUid++, ...offer, progresso: 0, falados: [] };
  q.accepted.push(offer.key);
  q.active.push(quest);
  if (q.tracked === null) q.tracked = quest.uid;
  return { ok: true, quest };
}

export function abandonQuest(save, uid) {
  save.quests = normalizeQuests(save.quests);
  const q = save.quests;
  q.active = q.active.filter((x) => x.uid !== uid);
  if (q.tracked === uid) q.tracked = q.active[0]?.uid ?? null;
}

// Texto do passo atual (rastreador e janela de missões); names: id → { nome, titulo }
export function questStep(quest, names = {}) {
  const n = (id) => names[id]?.nome ?? id;
  switch (quest.tipo) {
    case 'entrega':
      return quest.progresso === 0 ? `Pegue com ${n(quest.fonte)}` : `Entregue a ${n(quest.alvo)}`;
    case 'caca':
      return `${quest.alvo === 'elemental' ? 'Recrutas elementais' : 'Recrutas'}: ${quest.progresso}/${quest.total}`;
    case 'conversa':
      return `Moradores: ${quest.progresso}/${quest.total}`;
    case 'recado':
      return 'Fale com o Barqueiro da Ilha de Treino';
    default:
      return '';
  }
}

// Evento do jogo → progresso. ev: { kind: 'talk', npc } | { kind: 'defeat', nome, element }
// Devolve { progressed: [quest], completed: [quest] } (as concluídas saem da lista; a
// recompensa é dada por quem chamou)
export function questEvent(save, ev) {
  save.quests = normalizeQuests(save.quests);
  const q = save.quests;
  const progressed = [];
  const completed = [];
  for (const quest of q.active) {
    const before = quest.progresso;
    if (ev.kind === 'talk') {
      if (quest.tipo === 'entrega') {
        if (quest.progresso === 0 && ev.npc === quest.fonte) quest.progresso = 1;
        else if (quest.progresso === 1 && ev.npc === quest.alvo) quest.progresso = 2;
      } else if (quest.tipo === 'conversa' && ev.villager && !quest.falados.includes(ev.npc)) {
        quest.falados.push(ev.npc);
        quest.progresso = quest.falados.length;
      } else if (quest.tipo === 'recado' && ev.npc === quest.alvo) quest.progresso = 1;
    } else if (ev.kind === 'defeat' && quest.tipo === 'caca') {
      const elemental = !!ev.element;
      if (quest.alvo === 'elemental' ? elemental : /Recruta/.test(ev.nome ?? '')) quest.progresso += 1;
    }
    quest.progresso = Math.min(quest.progresso, quest.total);
    if (quest.progresso !== before) (quest.progresso >= quest.total ? completed : progressed).push(quest);
  }
  if (completed.length) {
    q.active = q.active.filter((x) => !completed.includes(x));
    q.done += completed.length;
    if (completed.some((x) => x.uid === q.tracked)) q.tracked = q.active[0]?.uid ?? null;
  }
  return { progressed, completed };
}
