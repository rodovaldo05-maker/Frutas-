// Quatro tipos corporais (documento mestre 4.0, seções 16–24): Humano, Aquático, Ghoul e
// Homem do Céu. Cada um tem visual próprio, passivas, uma habilidade ativa, maestria racial
// (1 a 100, curva dos atributos × 1,25) com marcos e limitações. A escolha é feita no começo
// do jogo; a aparência não determina gênero, cor de pele ou personalidade.

import { xpToNext } from '../progression/training.js';

export const RACE_MULT = 1.25;
export const raceXpToNext = (L) => Math.round(xpToNext(L) * RACE_MULT);
export const RACE_MAX = 100;

export const RACES = {
  humano: {
    id: 'humano', nome: 'Humano', titulo: 'O Adaptável', cor: '#e8c070', icone: 'person',
    fantasia: 'Versátil: aprende técnicas e alterna estilos com facilidade.',
    passivas: ['+15% de experiência nos atributos físicos (com os mesmos tetos)', '+10% de recuperação de fôlego fora de combate', '−10% de recarga nas habilidades de espada (manuseio)'],
    ativa: { nome: 'Adaptação Tática', desc: 'Por 10 s: trocar de item é instantâneo (cancela o golpe) e o fôlego volta 50% mais rápido.', recarga: 40 },
    treino: 'Acertar inimigos alternando fruta, espada e combate; defender; descobrir áreas.',
    limitacao: 'Sem respiração na água, sem drenagem e sem saltos extras.',
    marcos: { 20: 'Aprendiz Universal', 40: 'Técnica Composta', 60: 'Corpo Preparado', 80: 'Mestre da Adaptação', 100: 'Versatilidade Suprema' },
  },
  aquatico: {
    id: 'aquatico', nome: 'Aquático', titulo: 'O Anfíbio Resistente', cor: '#3fc8c0', icone: 'bubble',
    fantasia: 'Corpo adaptado à água, com nadadeiras e membranas.',
    passivas: ['Sem o dano da água para usuários de fruta (a fraqueza de afundar continua)', 'Respira embaixo d\'água', '+35% de velocidade nadando', '+20% de resistência física (≈ −5% de dano físico)'],
    ativa: { nome: 'Impulso Abissal', desc: 'Arrancada forte na água (gasta fôlego). Fora d\'água, um passo firme mais fraco.', recarga: 6 },
    treino: 'Nadar e mergulhar se deslocando de verdade. Boiar parado não conta.',
    limitacao: 'Os bônus dependem da água; fora dela não supera as outras raças.',
    marcos: { 20: 'Escamas Reforçadas', 40: 'Caçador de Correntes', 60: 'Pressão Profunda', 80: 'Guardião das Marés', 100: 'Soberania Oceânica' },
  },
  ghoul: {
    id: 'ghoul', nome: 'Ghoul', titulo: 'O Ressonante', cor: '#b46bff', icone: 'fruit',
    fantasia: 'Corpo sobrenatural que canaliza a energia das frutas.',
    passivas: ['+20% de dano das habilidades de fruta (não do soco nem da espada)', '+15% de recuperação de energia', '−10% de tempo atordoado (guarda quebrada)'],
    ativa: { nome: 'Sifão de Essência', desc: 'Golpe curto que, se acertar um inimigo, devolve 18 de energia.', recarga: 12 },
    treino: 'Acertar inimigos com habilidades de fruta diferentes; o Sifão que acerta.',
    limitacao: 'Sem fruta, os bônus de fruta não viram dano físico. Sem vantagens na água ou no ar.',
    marcos: { 20: 'Canalização Estável', 40: 'Sifão Refinado', 60: 'Núcleo Ressonante', 80: 'Predador Arcano', 100: 'Ressonância Absoluta' },
  },
  ceu: {
    id: 'ceu', nome: 'Homem do Céu', titulo: 'O Acrobata Aéreo', cor: '#9fd0ff', icone: 'glider',
    fantasia: 'Corpo leve com asas pequenas: saltos múltiplos e pousos precisos.',
    passivas: ['3 saltos extras no ar (4 impulsos sem tocar o chão), cada um gasta fôlego', '+20% de controle no ar', '+15% de altura do salto', 'Menos dano de queda'],
    ativa: { nome: 'Passo Celeste', desc: 'No ar: deslocamento curto para onde aponta, separado dos saltos extras.', recarga: 5 },
    treino: 'Saltos extras que levam a um lugar mais alto ou mais longe; Passo Celeste útil.',
    limitacao: 'O fôlego limita os saltos; não é voo: as asas não sustentam o corpo.',
    marcos: { 20: 'Pouso Leve', 40: 'Dança dos Ventos', 60: 'Quinto Impulso', 80: 'Senhor das Alturas', 100: 'Ascensão Celeste' },
  },
};
export const RACE_IDS = Object.keys(RACES);

// Especializações (atualização 13): duas trilhas por raça, escolhidas na maestria 40 e
// aprimoradas na 80. Trocar depois custa moedas (SPEC_CHANGE_COST).
export const SPEC_LEVEL = 40;
export const SPEC_UP_LEVEL = 80;
export const SPEC_CHANGE_COST = 2500;
export const SPECS = {
  humano: {
    versatil: { nome: 'Versátil', d40: 'Adaptação Tática dura 15 s e recarrega 25% mais rápido', d80: 'Dura 20 s e recarrega 40% mais rápido' },
    disciplinado: { nome: 'Disciplinado', d40: '+8% de dano corpo a corpo e com espada', d80: '+15% de dano e −5% de dano físico recebido' },
  },
  aquatico: {
    correnteza: { nome: 'Correnteza', d40: '+20% nadando e Impulso Abissal 30% mais forte', d80: '+35% nadando e Impulso 50% mais forte' },
    mareViva: { nome: 'Maré Viva', d40: 'Na água, recupera 2 de vida por segundo', d80: '4 de vida por segundo e +5% de resistência elemental' },
  },
  ghoul: {
    faminto: { nome: 'Faminto', d40: 'Sifão devolve 50% mais energia e cura 6', d80: 'Devolve o dobro de energia e cura 12' },
    essencia: { nome: 'Essência Pura', d40: '+10% de dano das habilidades de fruta', d80: '+20% de dano e −10% de recarga das habilidades de fruta' },
  },
  ceu: {
    planador: { nome: 'Planador', d40: 'Plana 25% mais rápido e cai 25% mais devagar', d80: 'Plana 40% mais rápido e cai 40% mais devagar' },
    acrobata: { nome: 'Acrobata', d40: 'Passo Celeste recarrega 40% mais rápido', d80: '+1 salto extra' },
  },
};

// Despertar racial (maestria 100): prova própria, não automática
export const RACE_TRIAL = { tempo: 240, alvo: 3, texto: 'Derrote os 3 Recrutas elementais em até 4 minutos sem desmaiar.' };
export const AWAKENED_TEXT = 'Ativa desperta: recarga pela metade e efeito 50% mais forte.';

// Efeitos de jogo das passivas (lidos pelo controlador, combate, poderes e treino)
export function raceMods(raceId, level = 1, spec = null, awakened = false) {
  const m = {
    xpPhysical: 1, staminaRegenCalm: 1, swordCooldown: 1, noWaterDamage: false, breathesWater: false, swimSpeed: 1,
    physicalMitigation: 0, fruitDamage: 1, energyRegen: 1, stunMult: 1, extraJumps: 0, airControl: 1, jumpMult: 1, fallMult: 1,
    // especializações e despertar (atualização 13)
    adaptTime: 10, activeCd: 1, activePower: 1, siphonMult: 1, siphonHeal: 0, meleeMult: 1, waterRegen: 0, elementalMit: 0,
    glideSpeed: 1, glideFall: 1, fruitCd: 1,
  };
  switch (raceId) {
    case 'humano':
      m.xpPhysical = 1.15;
      m.staminaRegenCalm = 1.1;
      m.swordCooldown = 0.9;
      break;
    case 'aquatico':
      m.noWaterDamage = true;
      m.breathesWater = true;
      m.swimSpeed = 1.35;
      m.physicalMitigation = level >= 20 ? 0.08 : 0.05;
      break;
    case 'ghoul':
      m.fruitDamage = 1.2;
      m.energyRegen = 1.15;
      m.stunMult = 0.9;
      break;
    case 'ceu':
      m.extraJumps = level >= 60 ? 3 : 2; // + o salto duplo de todos = 3 saltos extras (4 com o 5º impulso)
      m.airControl = 1.2;
      m.jumpMult = Math.sqrt(1.15);
      m.fallMult = level >= 20 ? 0.65 : 0.75;
      break;
    default:
  }
  // especialização escolhida (vale da maestria 40; aprimora na 80)
  const sp = level >= SPEC_LEVEL && SPECS[raceId]?.[spec] ? spec : null;
  const up = level >= SPEC_UP_LEVEL;
  switch (sp) {
    case 'versatil':
      m.adaptTime = up ? 20 : 15;
      m.activeCd *= up ? 0.6 : 0.75;
      break;
    case 'disciplinado':
      m.meleeMult = up ? 1.15 : 1.08;
      if (up) m.physicalMitigation += 0.05;
      break;
    case 'correnteza':
      m.swimSpeed *= up ? 1.35 : 1.2;
      m.activePower *= up ? 1.5 : 1.3;
      break;
    case 'mareViva':
      m.waterRegen = up ? 4 : 2;
      if (up) m.elementalMit = 0.05;
      break;
    case 'faminto':
      m.siphonMult = up ? 2 : 1.5;
      m.siphonHeal = up ? 12 : 6;
      break;
    case 'essencia':
      m.fruitDamage *= up ? 1.2 : 1.1;
      if (up) m.fruitCd = 0.9;
      break;
    case 'planador':
      m.glideSpeed = up ? 1.4 : 1.25;
      m.glideFall = up ? 0.6 : 0.75;
      break;
    case 'acrobata':
      m.activeCd *= 0.6;
      if (up) m.extraJumps += 1;
      break;
    default:
  }
  if (awakened && level >= RACE_MAX) {
    m.activeCd *= 0.5;
    m.activePower *= 1.5;
    m.siphonMult *= 1.5;
  }
  return m;
}

export function normalizeRace(save) {
  if (!RACE_IDS.includes(save.race)) save.race = null;
  const r = save.raceMastery;
  const level = Math.min(RACE_MAX, Math.max(1, Math.floor(Number(r?.level)) || 1));
  save.raceMastery = { level, xp: level >= RACE_MAX ? 0 : Math.max(0, Number(r?.xp) || 0) };
  // especialização só da raça atual; despertar só na maestria 100
  if (!save.race || !SPECS[save.race]?.[save.raceSpec]) save.raceSpec = null;
  save.raceAwakened = !!save.raceAwakened && level >= RACE_MAX;
  return save;
}

// Soma experiência racial; devolve os marcos atingidos
export function addRaceXp(save, amount) {
  const r = save.raceMastery;
  if (!save.race || !(amount > 0) || r.level >= RACE_MAX) return [];
  r.xp += amount;
  const reached = [];
  while (r.level < RACE_MAX && r.xp >= raceXpToNext(r.level)) {
    r.xp -= raceXpToNext(r.level);
    r.level += 1;
    const nome = RACES[save.race].marcos[r.level];
    reached.push({ level: r.level, nome });
  }
  if (r.level >= RACE_MAX) r.xp = 0;
  return reached;
}
