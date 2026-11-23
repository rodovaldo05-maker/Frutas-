// Maestria das frutas — 1 a 1000 (atualização 23; Prompt Mestre, seções 6 e 7).
// A maestria geral é o antigo domínio da fruta, agora de 1 a 1000 (migração: nível antigo × 10,
// sem perder progresso). Estágios: 1–100 Iniciação, 101–250 Adaptação, 251–450 Especialização,
// 451–650 Domínio, 651–850 Ascensão, 851–1000 Despertar. Além dela, três trilhas por fruta
// (1 a 100 cada):
//   afinidade  — usar a fruta no ambiente favorável (biomas, clima, noite, altitude, mar);
//   técnica    — execução correta (sequência de M1 completa acertando, habilidades no alvo);
//   sincronia  — combater transformado (só frutas de fera); dá os 10 marcos de transformação.
// XP só por ação válida (alvo real; bonecos com retorno decrescente), nunca por flexões,
// agachamentos ou meditação. Multiplicador de ambiente: neutro 1x, favorável 1,5x, ideal 2x,
// extremo 2,5x, evento natural raro até 4x; teto combinado de 4x.

export const MASTERY_MAX = 1000;
export const TRACK_MAX = 100;
export const ENV_CAP = 4;

export const STAGES = [
  { from: 1, nome: 'Iniciação' },
  { from: 101, nome: 'Adaptação' },
  { from: 251, nome: 'Especialização' },
  { from: 451, nome: 'Domínio' },
  { from: 651, nome: 'Ascensão' },
  { from: 851, nome: 'Despertar' },
];
export const stageOf = (level) => [...STAGES].reverse().find((s) => level >= s.from) ?? STAGES[0];

// títulos de despertar da maestria (camada sobre o Despertar existente, tecla V)
export const AWAKEN_TITLES = {
  impacto: 'Núcleo Cinético', brasa: 'Coração Incandescente', geada: 'Inverno Absoluto', tormenta: 'Soberano das Tempestades',
  lobo: 'Lobo Alfa Ancestral', eclipse: 'Domínio do Eclipse', mare: 'Soberano das Marés', cristal: 'Coração Prismático',
  eco: 'Ressonância Absoluta', falcao: 'Predador dos Céus', duna: 'Deserto Infinito', ima: 'Campo Magnético Absoluto',
  besta: 'Predador Absoluto', fenix: 'Renascimento Celestial', oriental: 'Imperador dos Céus', ocidental: 'Coração do Cataclismo',
};
// no estágio Despertar (851+) o despertar da fruta gasta menos e bate um pouco mais
export const MASTERY_AWAKEN = { from: 851, drain: 0.75, damage: 1.1 };

// Limiares do jogo na escala nova (antes: habilidades 1/5/13, híbrida 20, completa 50, despertar 59)
export const THRESHOLDS = { skill2: 41, skill3: 121, hybrid: 191, complete: 491, awaken: 581, immunity: 451 };

// ===== Maestria geral =====
// curva: cada 10 níveis novos custam o mesmo que 1 nível antigo do domínio
const oldXp = (L) => Math.round((100 + 30 * Math.pow(L, 1.4)) * 1.4);
export const masteryXpToNext = (L) => Math.max(5, Math.round(oldXp(Math.ceil(L / 10)) / 10));
export const masteryBonus = (level) => 1 + Math.min(0.3, 0.0003 * (level - 1)); // até +30%, sem crescer para sempre

// Converte um registro de domínio antigo (1 a 100) para a escala nova
export function fromOldDomain(d) {
  const level = Math.min(100, Math.max(1, Math.floor(Number(d?.level)) || 1));
  const progress = level >= 100 ? 0 : Math.min(0.999, Math.max(0, (Number(d?.xp) || 0) / oldXp(level)));
  const tenths = Math.floor(progress * 10);
  const nl = Math.min(MASTERY_MAX, 1 + (level - 1) * 10 + tenths);
  return { level: nl, xp: 0 };
}

const emptyTracks = () => ({ afinidade: { level: 1, xp: 0 }, tecnica: { level: 1, xp: 0 }, sincronia: { level: 1, xp: 0 } });
const clampTrack = (t) => {
  const level = Math.min(TRACK_MAX, Math.max(1, Math.floor(Number(t?.level)) || 1));
  return { level, xp: level >= TRACK_MAX ? 0 : Math.max(0, Number(t?.xp) || 0) };
};

// Registro salvo de uma fruta: { v: 2, level, xp, tracks, batismo, raios }
export function normalizeMastery(v) {
  if (!v || typeof v !== 'object') return { v: 2, level: 1, xp: 0, tracks: emptyTracks(), batismo: false, raios: { dia: -1, n: 0 } };
  const base = v.v === 2 ? v : fromOldDomain(v); // salvos antigos: domínio de 1 a 100
  const level = Math.min(MASTERY_MAX, Math.max(1, Math.floor(Number(base.level)) || 1));
  const xp = level >= MASTERY_MAX ? 0 : Math.max(0, Number(base.xp) || 0);
  const t = v.v === 2 && v.tracks && typeof v.tracks === 'object' ? v.tracks : {};
  return {
    v: 2, level, xp,
    tracks: { afinidade: clampTrack(t.afinidade), tecnica: clampTrack(t.tecnica), sincronia: clampTrack(t.sincronia) },
    batismo: v.batismo === true,
    raios: v.raios && Number.isFinite(v.raios.dia) && Number.isFinite(v.raios.n) ? { dia: v.raios.dia, n: Math.max(0, v.raios.n | 0) } : { dia: -1, n: 0 },
  };
}

export function addMasteryXp(m, amount) {
  if (!(amount > 0) || m.level >= MASTERY_MAX) return 0;
  m.xp += amount;
  let levels = 0;
  while (m.level < MASTERY_MAX && m.xp >= masteryXpToNext(m.level)) {
    m.xp -= masteryXpToNext(m.level);
    m.level += 1;
    levels += 1;
  }
  if (m.level >= MASTERY_MAX) m.xp = 0;
  return levels;
}
export const masteryProgress = (m) => (m.level >= MASTERY_MAX ? 1 : Math.min(1, m.xp / masteryXpToNext(m.level)));

// ===== Trilhas =====
export const trackXpToNext = (L) => 20 + 6 * L;
export function addTrackXp(m, track, amount) {
  const t = m.tracks[track];
  if (!t || !(amount > 0) || t.level >= TRACK_MAX) return 0;
  t.xp += amount;
  let levels = 0;
  while (t.level < TRACK_MAX && t.xp >= trackXpToNext(t.level)) {
    t.xp -= trackXpToNext(t.level);
    t.level += 1;
    levels += 1;
  }
  if (t.level >= TRACK_MAX) t.xp = 0;
  return levels;
}
// afinidade: até −15% de energia no ambiente favorável; técnica: até −10% de recarga
export const affinityCostMult = (m, envMult) => (envMult > 1 ? 1 - 0.15 * (m.tracks.afinidade.level / TRACK_MAX) : 1);
export const techniqueCdMult = (m) => 1 - 0.1 * (m.tracks.tecnica.level / TRACK_MAX);

// ===== Marcos de transformação (sincronia; frutas de fera) =====
export const MARCOS = [
  { nivel: 10, nome: 'Controle inicial', desc: 'transformação 30% mais rápida', mods: { transform: 0.7 } },
  { nivel: 20, nome: 'Estabilidade', desc: '−5% de dano físico na forma', mods: { mitigation: 0.05 } },
  { nivel: 30, nome: 'Mobilidade', desc: '+5% de velocidade na forma', mods: { speed: 0.05 } },
  { nivel: 40, nome: 'Eficiência', desc: '+10% de recuperação de energia na forma', mods: { energy: 0.1 } },
  { nivel: 50, nome: 'Combate', desc: '+5% de dano corpo a corpo na forma', mods: { melee: 0.05 } },
  { nivel: 60, nome: 'Resistência', desc: '−5% de dano físico na forma', mods: { mitigation: 0.05 } },
  { nivel: 70, nome: 'Domínio corporal', desc: '+5% de alcance dos golpes na forma', mods: { reach: 0.05 } },
  { nivel: 80, nome: 'Sincronização', desc: '+5% de dano da fruta na forma', mods: { fruit: 0.05 } },
  { nivel: 90, nome: 'Ascensão', desc: '+1 batida no ar (aladas) ou +5% de velocidade', mods: { ascend: 1 } },
  { nivel: 100, nome: 'Domínio completo', desc: '+5% de dano e −5% de dano físico na forma', mods: { melee: 0.05, fruit: 0.05, mitigation: 0.05 } },
];
export const marcosOf = (m) => MARCOS.filter((k) => (m?.tracks?.sincronia?.level ?? 1) >= k.nivel);
// soma dos marcos alcançados (aplicada por cima dos números da forma)
export function marcoMods(m, winged = false) {
  const out = { transform: 1, mitigation: 0, speed: 0, energy: 0, melee: 0, reach: 0, fruit: 0, extraJumps: 0 };
  for (const k of marcosOf(m)) {
    for (const [key, v] of Object.entries(k.mods)) {
      if (key === 'transform') out.transform *= v;
      else if (key === 'ascend') {
        if (winged) out.extraJumps += v;
        else out.speed += 0.05;
      } else out[key] += v;
    }
  }
  return out;
}

// ===== Ambiente =====
// ctx: { biome, night, weather, sea (no mar aberto/no bote), nearWater, flying, altitude,
//        form, lowHealth, strongTarget, boss, crater, sun }
const RULES = {
  impacto: [[(c) => c.strongTarget, 1.5, 'alvo resistente'], [(c) => c.biome === 'forte', 1.75, 'obstáculos do forte'], [(c) => c.biome === 'arena', 2, 'arena de impacto'], [(c) => c.boss, 2.5, 'rival mais forte']],
  brasa: [[(c) => c.biome === 'deserto', 1.5, 'deserto'], [(c) => c.biome === 'vulcao', 2, 'vulcão'], [(c) => c.biome === 'vulcao' && c.crater, 2.5, 'cratera']],
  geada: [[(c) => c.biome === 'neve', 1.5, 'neve'], [(c) => c.biome === 'neve' && c.altitude, 2, 'montanha glacial'], [(c) => c.biome === 'neve' && c.weather !== 'sol', 2.5, 'nevasca']],
  tormenta: [[(c) => c.weather === 'chuva', 1.5, 'chuva'], [(c) => c.weather === 'tempestade', 2, 'tempestade'], [(c) => c.weather === 'tempestade' && c.sea, 3, 'tempestade elétrica no mar']],
  lobo: [[(c) => c.biome === 'floresta' || c.biome === 'selva', 1.5, 'caça na mata'], [(c) => c.night, 2, 'caça noturna'], [(c) => c.strongTarget, 2, 'rival'], [(c) => c.boss, 2.5, 'alfa']],
  eclipse: [[(c) => c.night, 1.75, 'noite'], [(c) => c.biome === 'ceu', 2.5, 'arena instável'], [(c) => c.night && c.biome === 'ceu', 3, 'eclipse na fenda']],
  mare: [[(c) => c.nearWater, 1.5, 'beira d’água'], [(c) => c.biome === 'praia', 1.75, 'praia'], [(c) => c.sea, 2, 'maré aberta'], [(c) => c.sea && c.weather === 'tempestade', 2.5, 'tempestade oceânica']],
  cristal: [[(c) => c.biome === 'forte' || c.biome === 'cidade', 1.5, 'estruturas geométricas'], [(c) => c.biome === 'granito', 2, 'minas de granito'], [(c) => c.biome === 'granito' && c.night, 2.5, 'caverna rara']],
  eco: [[(c) => c.biome === 'granito' || c.biome === 'cidade', 1.5, 'paredes de eco'], [(c) => c.biome === 'arena', 2, 'câmara acústica'], [(c) => c.boss, 2.5, 'alvo resistente a som']],
  falcao: [[(c) => c.flying, 1.5, 'voo aberto'], [(c) => c.altitude || c.biome === 'neve', 2, 'montanhas'], [(c) => c.flying && c.weather === 'tempestade', 2.5, 'ventos fortes']],
  duna: [[(c) => c.biome === 'praia', 1.5, 'areia'], [(c) => c.biome === 'deserto', 2, 'deserto'], [(c) => c.biome === 'deserto' && c.weather !== 'sol', 2.5, 'tempestade de areia']],
  ima: [[(c) => c.biome === 'forte' || c.biome === 'cidade', 1.5, 'depósitos metálicos'], [(c) => c.biome === 'granito', 2, 'minas'], [(c) => c.biome === 'ceu', 2.5, 'anomalia']],
  besta: [[(c) => c.biome === 'floresta' || c.biome === 'selva', 1.5, 'caça'], [(c) => c.strongTarget, 2, 'predador'], [(c) => c.boss, 2.5, 'criatura maior']],
  fenix: [[(c) => c.flying || c.altitude, 1.5, 'altitude'], [(c) => c.sun, 1.75, 'sol'], [(c) => c.lowHealth, 2, 'sobrevivência'], [(c) => c.flying && c.form === 'completa', 2.5, 'voo completo']],
  oriental: [[(c) => c.flying || c.altitude, 1.5, 'nuvens'], [(c) => c.weather === 'tempestade', 2, 'tempestade'], [(c) => c.weather === 'tempestade' && c.sea, 3, 'tempestade oceânica']],
  ocidental: [[(c) => c.biome === 'vulcao', 2, 'vulcão'], [(c) => c.strongTarget, 2, 'criatura gigante'], [(c) => c.boss, 2, 'chefe']],
};
export const tierOf = (mult) => (mult >= 3 ? 'raro' : mult >= 2.5 ? 'extremo' : mult >= 2 ? 'ideal' : mult > 1 ? 'favorável' : 'neutro');

// melhor condição que vale agora (não somam: vale a maior), mais bônus raro; teto de 4x
export function envMultiplier(fruitId, ctx, { rare = 1 } = {}) {
  let best = { mult: 1, label: 'neutro' };
  for (const [test, mult, label] of RULES[fruitId] ?? []) if (mult > best.mult && test(ctx)) best = { mult, label };
  const mult = Math.min(ENV_CAP, best.mult * rare);
  return { mult, label: best.label, tier: tierOf(mult) };
}

// ===== Batismo do Trovão (Tormenta) =====
// O primeiro raio NATURAL válido dá exatamente um nível de maestria; os seguintes dão XP
// especial, no máximo 5 por dia do jogo. Raios do próprio jogador não passam por aqui.
export const BATISMO = { xp: 40, perDay: 5 };
export function naturalLightning(m, day) {
  if (!m.batismo) {
    m.batismo = true;
    if (m.level < MASTERY_MAX) {
      m.level += 1;
      if (m.level >= MASTERY_MAX) m.xp = 0;
    }
    return { batismo: true, levels: 1, xp: 0 };
  }
  if (m.raios.dia !== day) m.raios = { dia: day, n: 0 };
  if (m.raios.n >= BATISMO.perDay) return { batismo: false, levels: 0, xp: 0 };
  m.raios.n += 1;
  return { batismo: false, levels: addMasteryXp(m, BATISMO.xp), xp: BATISMO.xp };
}

// ===== Imunidades limitadas (a partir do estágio Domínio, 451) =====
// Tormenta: raio natural comum (não ataques de chefes). Maré continua fraca na água.
export function envImmune(fruitId, level, source) {
  if (level < THRESHOLDS.immunity) return false;
  if (fruitId === 'tormenta' && source === 'raio-natural') return true;
  if (fruitId === 'geada' && source === 'frio') return true; // nevasca da Geleira Silente
  if (fruitId === 'brasa' && source === 'lava') return true; // lava e erupções (só a queimadura)
  return false;
}
