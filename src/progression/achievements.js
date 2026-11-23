// Conquistas (atualização 30): metas de longo prazo lidas do próprio salvo (contadores em
// save.stats e o que o jogo já guarda: chefes, navios, mares, missões…). Cada conquista paga
// moedas e chaves da roleta uma vez e libera um TÍTULO que o jogador pode usar (aparece na janela
// do personagem e na aba Conquistas).

export const STAT_KEYS = ['kills', 'fish', 'ore', 'powers', 'combos', 'distance', 'ships', 'beasts', 'masteryUps', 'reps'];

export function normalizeStats(s) {
  const o = s && typeof s === 'object' ? s : {};
  return Object.fromEntries(STAT_KEYS.map((k) => [k, Math.max(0, Number(o[k]) || 0)]));
}

export function normalizeAchievements(a, ids = null) {
  const o = a && typeof a === 'object' ? a : {};
  const valid = (id) => !ids || ids.includes(id);
  const got = Array.isArray(o.got) ? o.got.filter((id, i, arr) => typeof id === 'string' && valid(id) && arr.indexOf(id) === i) : [];
  return { got, title: typeof o.title === 'string' && got.includes(o.title) ? o.title : null };
}

const distinctBosses = (s) => Object.keys(s.bosses ?? {}).filter((k) => k.endsWith('-chefe') && s.bosses[k] > 0).length;
const islandQuestsDone = (s) => Object.values(s.islandQuests?.by ?? {}).reduce((n, e) => n + Math.min(3, e.step ?? 0), 0);
const maxMastery = (s) => Math.max(1, ...Object.values(s.domain ?? {}).map((d) => d?.level ?? 1));
const st = (k) => (s) => s.stats?.[k] ?? 0;

// [id, grupo, título, descrição, valor(save), meta, recompensa { coins, keys }]
const RAW = [
  ['lutador', 'Combate', 'Lutador', 'Derrote 50 inimigos', st('kills'), 50, [2000, 0]],
  ['veterano', 'Combate', 'Veterano', 'Derrote 500 inimigos', st('kills'), 500, [15000, 1]],
  ['lenda', 'Combate', 'Lenda das Ilhas', 'Derrote 5.000 inimigos', st('kills'), 5000, [120000, 3]],
  ['cacador-chefes', 'Combate', 'Caçador de Chefes', 'Derrote 5 chefes diferentes', distinctBosses, 5, [8000, 1]],
  ['terror', 'Combate', 'Terror dos Mares', 'Derrote 15 chefes diferentes', distinctBosses, 15, [60000, 2]],
  ['conquistador', 'Combate', 'Conquistador dos Três Mares', 'Derrote os 25 chefes do mundo', distinctBosses, 25, [300000, 5]],
  ['combo', 'Combate', 'Mão Rápida', 'Acerte 200 finalizadores do ataque básico', st('combos'), 200, [10000, 1]],
  ['poderoso', 'Fruta', 'Portador do Poder', 'Use 500 habilidades', st('powers'), 500, [12000, 1]],
  ['evolucao', 'Fruta', 'Fruta Desperta', 'Suba 100 níveis de maestria de fruta', st('masteryUps'), 100, [20000, 1]],
  ['mestre-fruta', 'Fruta', 'Mestre da Fruta', 'Leve uma fruta à maestria 1000', maxMastery, 1000, [500000, 5]],
  ['rei', 'Vontade', 'Vontade do Rei', 'Desperte o Haki do Rei', (s) => (s.vontade?.soberana ? 1 : 0), 1, [50000, 2]],
  ['corsario', 'Mar', 'Corsário', 'Afunde 5 navios corsários', st('ships'), 5, [8000, 1]],
  ['almirante', 'Mar', 'Almirante', 'Afunde 50 navios corsários', st('ships'), 50, [80000, 2]],
  ['cacador-mar', 'Mar', 'Caçador do Mar', 'Derrote 5 bestas marinhas', st('beasts'), 5, [20000, 1]],
  ['segundo-mar', 'Mar', 'Além da Tempestade', 'Chegue ao Segundo Mar', (s) => (s.seas?.segundo ? 1 : 0), 1, [10000, 1]],
  ['terceiro-mar', 'Mar', 'Navegante do Horizonte', 'Chegue ao Terceiro Mar', (s) => (s.seas?.terceiro ? 1 : 0), 1, [40000, 2]],
  ['decifrador', 'Mar', 'Decifrador', 'Revele a Ilha Oculta', (s) => (s.islands?.oculta?.revealed ? 1 : 0), 1, [60000, 2]],
  ['pescador', 'Profissões', 'Pescador', 'Pesque 100 peixes', st('fish'), 100, [6000, 1]],
  ['minerador', 'Profissões', 'Minerador', 'Minere 200 minérios', st('ore'), 200, [6000, 1]],
  ['corpo-aco', 'Treino', 'Corpo de Aço', 'Faça 1.000 repetições com pesos', st('reps'), 1000, [10000, 1]],
  ['andarilho', 'Treino', 'Andarilho', 'Percorra 20 km a pé', st('distance'), 20000, [8000, 1]],
  ['ajudante', 'Missões', 'Amigo das Ilhas', 'Conclua 10 missões de NPCs de ilha', islandQuestsDone, 10, [15000, 1]],
  ['heroi', 'Missões', 'Herói dos Três Mares', 'Conclua as 72 missões das ilhas', islandQuestsDone, 72, [400000, 5]],
  ['diario', 'Missões', 'Disciplinado', 'Conclua 30 missões diárias', (s) => s.dailies?.total ?? 0, 30, [20000, 2]],
  ['semana', 'Missões', 'Sete Dias de Sol', 'Feche as diárias 7 dias seguidos', (s) => s.dailies?.streak ?? 0, 7, [30000, 3]],
  ['nivel-100', 'Aventura', 'Aventureiro', 'Chegue ao nível 100', (s) => s.level ?? 1, 100, [5000, 1]],
  ['nivel-1000', 'Aventura', 'Desbravador', 'Chegue ao nível 1.000', (s) => s.level ?? 1, 1000, [100000, 3]],
  ['nivel-2400', 'Aventura', 'Soberano dos Mares', 'Chegue ao nível 2.400', (s) => s.level ?? 1, 2400, [1000000, 10]],
];
export const ACHIEVEMENTS = RAW.map(([id, grupo, titulo, descricao, value, meta, [coins, keys]]) => ({ id, grupo, titulo, descricao, value, meta, reward: { coins, keys } }));
export const ACHIEVEMENT_IDS = ACHIEVEMENTS.map((a) => a.id);

export const achievementProgress = (a, save) => Math.min(a.meta, a.value(save));

// conquistas recém-alcançadas (marca em save.achievements.got; quem chama paga a recompensa)
export function checkAchievements(save) {
  save.achievements = normalizeAchievements(save.achievements, ACHIEVEMENT_IDS);
  const got = save.achievements.got;
  const fresh = ACHIEVEMENTS.filter((a) => !got.includes(a.id) && a.value(save) >= a.meta);
  for (const a of fresh) got.push(a.id);
  return fresh;
}

export const titleOf = (save) => ACHIEVEMENTS.find((a) => a.id === save.achievements?.title)?.titulo ?? null;
