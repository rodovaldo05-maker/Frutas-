// Bestas marinhas (atualização 19; doc 03, seção 5). Regras puras, testadas em
// tests/beasts.test.js. Um encontro no mar aberto segue o modelo do documento:
// 1. Aviso: a água borbulha e o minimapa mostra uma silhueta (4 s).
// 2. Fase 1: a besta circula o bote e morde o casco.
// 3. Fase 2 (abaixo de 60%): ondas que empurram o bote e mergulhos (sobe por baixo).
// 4. Fase 3 (abaixo de 25%): fúria — mais rápida, ataques mais seguidos, ponto fraco
//    exposto (leva 25% a mais de dano).
// 5. Recompensa: Escama Abissal, pérolas, moedas, experiência e fragmentos.
// Mergulhada, a besta não leva dano. Longe demais ou sem ninguém no bote, ela vai embora.

export const BEASTS = {
  serpente: {
    nome: 'Serpente de Coral', level: 300, radius: 2.4, orbit: 14, speed: 9,
    attacks: ['mordida', 'onda', 'mergulho'], cor: '#e8604a', detalhe: '#2fb8a8',
  },
  tubarao: {
    nome: 'Mandíbula Cinzenta', level: 600, radius: 2.6, orbit: 16, speed: 12,
    attacks: ['mordida', 'mergulho', 'onda'], cor: '#7a8590', detalhe: '#e8e8e0', hunter: true, // persegue nadadores
  },
  lanterna: {
    nome: 'Lanterna das Profundezas', level: 1200, radius: 3.2, orbit: 18, speed: 7,
    attacks: ['mordida', 'onda', 'mergulho'], cor: '#1a2a3a', detalhe: '#7fffd0', night: true,
  },
};

export const ENCOUNTER = {
  warning: 4,
  cooldown: 120, // segundos entre encontros
  chancePerSecond: 1 / 40,
  openSea: 60, // distância mínima da borda de qualquer ilha
  leave: 170, // longe disso do bote, a besta vai embora
  telegraph: 0.9, // aviso do bote antes da mordida
  dive: 2.4, // segundos mergulhada
  waveSpeed: 14,
};

// quais bestas aparecem em cada mar (de noite / de dia)
export const SEA_BEASTS = {
  1: { dia: [['serpente'], ['tubarao']], noite: [['serpente'], ['tubarao']] },
  2: { dia: [['tubarao', 900]], noite: [['lanterna'], ['tubarao', 900]] },
};

// só aparece besta para quem tem pelo menos metade do nível dela (sem isso, uma mordida
// afundaria o bote de um iniciante); null = nenhuma serve para este jogador
export const minPlayerLevel = (beastLevel) => Math.round(beastLevel * 0.5);

export function pickBeast(sea, night, rand = Math.random, playerLevel = Infinity) {
  const list = (SEA_BEASTS[sea]?.[night ? 'noite' : 'dia'] ?? SEA_BEASTS[1].dia)
    .map(([id, level]) => ({ id, level: level ?? BEASTS[id].level }))
    .filter((b) => playerLevel >= minPlayerLevel(b.level));
  if (!list.length) return null;
  return list[Math.floor(rand() * list.length)];
}

// vida, dano e recompensa pelo nível (bestas valem um chefe pequeno)
export const beastHp = (level) => Math.round((300 + 9 * level) * 2.5);
export const beastBite = (level) => Math.round(30 + 0.9 * level);
export const beastWave = (level) => Math.round(20 + 0.6 * level);

export const phaseOf = (ratio) => (ratio > 0.6 ? 1 : ratio > 0.25 ? 2 : 3);
export const PHASE = {
  1: { cd: 4.5, speed: 1, taken: 1 },
  2: { cd: 3.4, speed: 1.15, taken: 1 },
  3: { cd: 2.3, speed: 1.4, taken: 1.25 }, // fúria: ponto fraco exposto
};

// próximo ataque: na fase 1 só mordida; da fase 2 em diante também onda e mergulho
export function nextAttack(beast, phase, rand = Math.random) {
  const pool = phase === 1 ? ['mordida'] : BEASTS[beast].attacks;
  return pool[Math.floor(rand() * pool.length)];
}

// pode começar um encontro agora?
export function canSpawn({ aboard, swimming = false, crossing, sunk, distToLand, sinceLast, hunterOnly = false }) {
  if (crossing || sunk) return false;
  if (!aboard && !(swimming && hunterOnly)) return false;
  return distToLand > ENCOUNTER.openSea && sinceLast >= ENCOUNTER.cooldown;
}

const xpToNext = (L) => Math.round(100 + 30 * Math.pow(L, 1.4));
export function beastLoot(level, rand = Math.random) {
  const mats = [['escama', 2 + Math.floor(rand() * 3)], ['perola', 1 + Math.floor(rand() * 2)]];
  if (rand() < 0.35) mats.push(['cristal', 1 + Math.floor(rand() * 2)]);
  return { coins: Math.round(60 + 4 * level), xp: Math.round(xpToNext(level) / 4), mats, fragments: 1 + Math.floor(rand() * 3), item: rand() < 0.4 };
}
