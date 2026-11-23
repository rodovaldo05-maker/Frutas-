// Missões das ilhas (atualização 29): cada ilha dos três mares tem um NPC com uma corrente de
// três missões ligadas à própria ilha:
//   1) Caça — derrotar 4 inimigos do acampamento da ilha;
//   2) Desafio da ilha — a mecânica própria (espelhos, chaves, nevasca, raios…), coletar núcleos
//      elementais dos inimigos ou explorar o coração da ilha;
//   3) Chefe — derrotar o chefe da ilha.
// Aceita com o NPC; o progresso conta sozinho; ao completar, volta ao NPC para receber a
// recompensa e a próxima missão. Uma missão de ilha pode ser rastreada por vez.

import { scaledDef } from '../combat/enemies.js';

// NPC de cada ilha: nome, título e a primeira fala
export const QUEST_NPCS = {
  'praia-saqueadores': ['Tamires', 'Vigia da Praia', 'Os saqueadores tomaram a enseada. Me ajuda a limpar a praia?'],
  'bosque-sussurrante': ['Ivo', 'Lenhador', 'Os bandidos se escondem entre as árvores gigantes. E o Guardião de Musgo acordou.'],
  'duna-partida': ['Zaíra', 'Caravaneira', 'Minha caravana não passa enquanto os nômades fecharem o cânion.'],
  'forte-mare-alta': ['Tenente Brás', 'Oficial Desertor', 'O Comandante perdeu o juízo. Preciso de alguém de fora para entrar no forte.'],
  'pico-gelido': ['Olga', 'Guia da Montanha', 'Os caçadores congelam a trilha. Traga núcleos de geada e eu te levo ao topo.'],
  'porto-lanternas': ['Lino', 'Lanterneiro', 'Os capangas apagam as lanternas à noite. O Duelista Mascarado manda neles.'],
  'caldeira-rubra': ['Mestra Fagulha', 'Forjadora', 'Os forjadores rebeldes roubaram o calor da minha forja. Recupere os núcleos de brasa!'],
  'coliseu-partido': ['Galeno', 'Mestre de Cerimônias', 'A arena precisa de um desafiante à altura do Campeão Imbatível.'],
  'fenda-celeste': ['Aerin', 'Sábia do Vento', 'As sentinelas guardam o céu. Os núcleos de tormenta delas abrem o caminho.'],
  'cais-correntes': ['Doca', 'Mestre do Estaleiro', 'Bem-vindo ao Segundo Mar! Os estivadores rebeldes pararam o estaleiro.'],
  'arquipelago-esmeralda': ['Iara', 'Guardiã das Cachoeiras', 'A selva está agitada. Suba ao templo no coração da ilha comigo.'],
  'cidadela-granito': ['Sargento Pedra', 'Veterano', 'A Cidadela tem camadas e camadas de muralha. O General está no centro.'],
  'geleira-silente': ['Nuno', 'Náufrago do Gelo', 'Meu navio ficou preso no gelo. Sem fogueira, ninguém aguenta a nevasca aqui.'],
  'ruinas-sol-poente': ['Professora Lúmen', 'Arqueóloga', 'Os espelhos levam a luz até uma câmara selada. Já tentou girá-los?'],
  'bosque-noturno': ['Vesper', 'Caçadora de Ilusões', 'Nem tudo que anda nesta névoa é real. Ligue a Percepção e veja os ecos.'],
  'bastiao-vulcanico': ['Brasa Velha', 'Vigia do Vulcão', 'O vulcão entra em erupção o tempo todo. Quem aguenta uma, aguenta o Titã.'],
  'masmorra-abismo': ['Carcereiro Bento', 'Ex-guarda', 'As chaves estão nos altares de cada andar. O Sem-Rosto guarda a cela do meio.'],
  'capital-mil-mastros': ['Almiranta Clara', 'Conselheira Imperial', 'Bem-vindo à Capital. O Almirante Mil-Velas tomou o castelo à força.'],
  'santuario-escamas': ['Ryu', 'Tratador de Dragões', 'O Dragão Ancião sopra fogo pela ilha toda. Aprenda a desviar antes de enfrentá-lo.'],
  'tempestade-eterna': ['Voltaire', 'Engenheiro dos Para-raios', 'Aqui o raio cai sem parar. Fique perto dos para-raios!'],
  'fortaleza-horizonte': ['Capitã Rosa', 'Sitiante', 'Os canhões do Horizonte varrem a praia. Sobreviva a uma canhonada e conversamos.'],
  'mar-dos-ossos': ['Velho Ossada', 'Pescador de Ossos', 'O mar ferve entre as ilhotas. E o Leviatã descansa na costela maior.'],
  'templo-aurora': ['Irmã Alva', 'Guardiã da Aurora', 'A escada sobe até o céu. Só quem chega lá em cima é digno do Avatar.'],
  'ilha-oculta': ['O Esquecido', 'Cronista', 'Você resolveu o enigma… então merece saber o que dorme aqui.'],
};

// desafio próprio de cada ilha (segunda missão)
const MECH = {
  'geleira-silente': ['fogueira', 1, 'Aqueça-se numa fogueira durante uma nevasca'],
  'ruinas-sol-poente': ['espelhos', 1, 'Abra a câmara secreta girando os espelhos'],
  'bosque-noturno': ['eco', 3, 'Desfaça 3 ecos ilusórios com a Percepção ligada'],
  'bastiao-vulcanico': ['erupcao', 1, 'Sobreviva a uma erupção no Bastião'],
  'masmorra-abismo': ['chaves', 1, 'Pegue as três chaves dos altares da masmorra'],
  'santuario-escamas': ['sopro', 1, 'Escape ileso de um Sopro Ancestral'],
  'tempestade-eterna': ['pararaios', 1, 'Escape de um raio ficando perto de um para-raios'],
  'fortaleza-horizonte': ['canhonada', 1, 'Sobreviva a uma canhonada do Horizonte'],
  'mar-dos-ossos': ['geiser', 1, 'Sobreviva a uma saraivada de gêiseres'],
  'templo-aurora': ['aurora', 1, 'Suba a escada e conclua a Prova da Aurora'],
};
// desafios que já podem estar feitos antes de aceitar (estado salvo das ilhas)
export const MECH_DONE = {
  espelhos: (islands) => !!islands?.ruinas?.solved,
  chaves: (islands) => (islands?.masmorra?.keys ?? 0) >= 3,
  aurora: (islands) => !!islands?.aurora?.done,
};
const CORE = { fogo: ['nucleo-brasa', 'Núcleos de Brasa'], gelo: ['nucleo-geada', 'Núcleos de Geada'], raio: ['nucleo-tormenta', 'Núcleos de Tormenta'] };

// as três missões de uma ilha
export function questsFor(def) {
  const [a] = def.faixa;
  const mid = Math.round((def.faixa[0] + def.faixa[1]) / 2);
  const caca = { tipo: 'caca', alvo: def.id, total: 4, titulo: `Limpar o acampamento`, texto: `Derrote 4 inimigos do acampamento (${def.enemy.nome}) em ${def.nome}.`, nivel: a };
  let segunda;
  const m = MECH[def.id];
  const core = CORE[def.enemy.element];
  if (m) segunda = { tipo: 'mecanica', alvo: m[0], total: m[1], titulo: 'O desafio da ilha', texto: `${m[2]}.`, nivel: mid };
  else if (core) segunda = { tipo: 'material', alvo: core[0], total: 3, titulo: 'Núcleos elementais', texto: `Junte 3 ${core[1]} derrotando os inimigos elementais de ${def.nome}.`, nivel: mid };
  else segunda = { tipo: 'explorar', alvo: { x: def.x, z: def.z, r: Math.max(8, def.R * 0.18) }, total: 1, titulo: 'O coração da ilha', texto: `Explore o coração de ${def.nome} (o centro da ilha, marcado no mapa).`, nivel: mid };
  const chefe = { tipo: 'chefe', alvo: `${def.id}-chefe`, total: 1, titulo: `Derrotar ${def.boss.nome}`, texto: `Derrote ${def.boss.nome}, o chefe de ${def.nome}.`, nivel: def.faixa[1] };
  return [caca, segunda, chefe].map((q, i) => ({ ...q, passo: i, recompensa: rewardFor(def, q, i) }));
}

// recompensas crescem com o nível da ilha e com o passo; a última dá chave, item e material raro
export function rewardFor(def, q, i) {
  const xpUnit = scaledDef(def.enemy, q.nivel).xp;
  return {
    coins: Math.round(q.nivel * 12 * (i + 1)),
    xp: Math.round(xpUnit * (3 + i * 3)),
    keys: i === 2 ? 1 : 0,
    item: i === 2,
    material: i === 2 ? ['cristal', 3] : i === 1 ? ['perola', 1] : null,
  };
}

export function normalizeIslandQuests(s) {
  const o = s && typeof s === 'object' ? s : {};
  const out = { tracked: typeof o.tracked === 'string' ? o.tracked : null, by: {} };
  const by = o.by && typeof o.by === 'object' ? o.by : {};
  for (const [id, v] of Object.entries(by)) {
    if (!QUEST_NPCS[id] || !v || typeof v !== 'object') continue;
    const step = Math.max(0, Math.min(3, Math.floor(Number(v.step)) || 0));
    out.by[id] = { step, accepted: !!v.accepted && step < 3, progress: Math.max(0, Math.floor(Number(v.progress)) || 0), base: Math.max(0, Math.floor(Number(v.base)) || 0) };
  }
  if (out.tracked && !out.by[out.tracked]?.accepted) out.tracked = null;
  return out;
}

const entry = (st, id) => (st.by[id] ??= { step: 0, accepted: false, progress: 0, base: 0 });

// 'disponivel' (tem missão para aceitar), 'ativa', 'pronta' (voltar para receber), 'concluida'
export function questStatus(st, def) {
  const e = st.by[def.id];
  if (!e) return 'disponivel';
  if (e.step >= 3) return 'concluida';
  if (!e.accepted) return 'disponivel';
  const q = questsFor(def)[e.step];
  return e.progress >= q.total ? 'pronta' : 'ativa';
}

export function currentQuest(st, def) {
  const e = st.by[def.id];
  const step = e?.step ?? 0;
  return step >= 3 ? null : questsFor(def)[step];
}

// aceita a missão atual. ctx: { islands (estado salvo das ilhas), materials (contagem atual) }
export function acceptIslandQuest(st, def, ctx = {}) {
  const e = entry(st, def.id);
  if (e.step >= 3 || e.accepted) return null;
  const q = questsFor(def)[e.step];
  e.accepted = true;
  e.progress = 0;
  e.base = q.tipo === 'material' ? ctx.materials?.[q.alvo] ?? 0 : 0;
  // desafios que já foram feitos antes contam na hora
  if (q.tipo === 'mecanica' && MECH_DONE[q.alvo]?.(ctx.islands)) e.progress = q.total;
  if (!st.tracked) st.tracked = def.id;
  return q;
}

// evento do jogo → progresso nas missões aceitas. ev: { kind: 'defeat', id } |
// { kind: 'mech', id } | { kind: 'visit', pos } | { kind: 'material', counts }
// Devolve a lista de { def, quest, ready } que mudaram
export function islandQuestEvent(st, defs, ev) {
  const changed = [];
  for (const def of defs) {
    const e = st.by[def.id];
    if (!e?.accepted || e.step >= 3) continue;
    const q = questsFor(def)[e.step];
    if (e.progress >= q.total) continue;
    const before = e.progress;
    if (ev.kind === 'defeat') {
      if (q.tipo === 'caca' && ev.id.startsWith(`${def.id}-`) && !ev.id.endsWith('-chefe')) e.progress += 1;
      if (q.tipo === 'chefe' && ev.id === q.alvo) e.progress += 1;
    } else if (ev.kind === 'mech' && q.tipo === 'mecanica' && ev.id === q.alvo) e.progress += 1;
    else if (ev.kind === 'visit' && q.tipo === 'explorar' && Math.hypot(ev.pos.x - q.alvo.x, ev.pos.z - q.alvo.z) <= q.alvo.r) e.progress = 1;
    else if (ev.kind === 'material' && q.tipo === 'material') e.progress = Math.max(e.progress, (ev.counts[q.alvo] ?? 0) - e.base);
    e.progress = Math.min(e.progress, q.total);
    if (e.progress !== before) changed.push({ def, quest: q, ready: e.progress >= q.total });
  }
  return changed;
}

// entrega a missão pronta: devolve a recompensa e passa para a próxima
export function turnInIslandQuest(st, def) {
  const e = st.by[def.id];
  if (!e?.accepted) return null;
  const q = questsFor(def)[e.step];
  if (e.progress < q.total) return null;
  e.step += 1;
  e.accepted = false;
  e.progress = 0;
  e.base = 0;
  if (st.tracked === def.id) st.tracked = null;
  return { quest: q, reward: q.recompensa, last: e.step >= 3 };
}

export function questStepText(st, def) {
  const e = st.by[def.id];
  const q = currentQuest(st, def);
  if (!q) return 'Todas as missões desta ilha concluídas';
  if (!e?.accepted) return 'Fale com o NPC da ilha';
  if (e.progress >= q.total) return `Volte a ${QUEST_NPCS[def.id][0]} para receber`;
  return q.total > 1 ? `${q.titulo}: ${e.progress}/${q.total}` : q.texto;
}
