// Haki e meditação (atualização 25; Prompt Mestre, seções 10 a 13). Integra a Vontade que já
// existia (doc 07): o Haki da Observação é a evolução da Vontade de Percepção, o Haki do
// Armamento a da Vontade de Armadura e o Haki do Rei é a Vontade Soberana, que antes ficava
// bloqueada "por missão especial (futuro)" — agora libera por um Desafio da Vontade, nunca por
// meditação passiva nem compra. Cada trilha vai de 1 a 100 e é independente da fruta, dos
// atributos e das outras duas.

export const HAKI = {
  observacao: {
    nome: 'Haki da Observação', prof: 'vontade:percepcao', aprende: 'percepcao',
    estagios: [[1, 'Percepção inicial'], [15, 'Detecção de presença'], [30, 'Leitura de intenção'], [45, 'Esquiva antecipada'], [60, 'Percepção sem visão'], [75, 'Alcance expandido'], [90, 'Previsão breve']],
  },
  armamento: {
    nome: 'Haki do Armamento', prof: 'vontade:armadura', aprende: 'armadura',
    estagios: [[1, 'Revestimento localizado'], [15, 'Revestimento estável'], [30, 'Defesa'], [45, 'Golpes reforçados'], [60, 'Armas reforçadas'], [75, 'Emissão curta'], [90, 'Penetração avançada']],
  },
  rei: {
    nome: 'Haki do Rei', prof: 'vontade:rei', aprende: 'soberana',
    estagios: [[1, 'Despertar'], [15, 'Presença'], [30, 'Controle de intensidade'], [45, 'Seleção de alvos'], [60, 'Resistência a pressão'], [75, 'Emissão controlada'], [90, 'Revestimento avançado']],
  },
};
export const stagesOf = (kind, level) => HAKI[kind].estagios.filter(([lv]) => level >= lv).map(([, nome]) => nome);
export const hasStage = (kind, level, nome) => stagesOf(kind, level).includes(nome);

// ===== Armamento =====
export const armorCost = (level) => 6 - 3 * Math.min(1, (level - 1) / 99); // 6/s → 3/s (eficiência)
export const armorMitigation = (level) => 0.1 + (level >= 30 ? 0.08 * Math.min(1, (level - 30) / 70) : 0); // até −18%
export const armorWeaponBonus = (level) => (level >= 60 ? 1.05 : 1);
export const armorEmission = (level) => level >= 75; // M1-4 revestido solta uma onda curta
export const armorPenetration = (level) => (level >= 90 ? 0.25 : 0); // ignora parte da defesa (nunca toda)

// ===== Observação =====
export const senseRange = (level) => (level >= 75 ? 60 : level >= 15 ? 40 : 25); // marcadores de presença no minimapa
export const senseThroughWalls = (level) => level >= 60; // percepção sem visão
// previsão breve: uma esquiva extra a cada 20 s depois de gastar as automáticas (não é invulnerável)
export const FORESIGHT = { from: 90, cooldown: 20 };

// ===== Rei =====
export const REI = { level: 30, obs: 20, arm: 20, cost: 40, cooldown: 30 };
export function reiBlock(save, profLevel) {
  if (save.vontade?.soberana) return null;
  if ((save.level ?? 1) < REI.level) return `Desafio da Vontade: nível de aventureiro ${REI.level}.`;
  if (profLevel('vontade:percepcao') < REI.obs || profLevel('vontade:armadura') < REI.arm) return `Desafio da Vontade: Observação e Armamento ${REI.obs}.`;
  return null;
}
export const pulseRadius = (level) => 7 + 5 * Math.min(1, level / 100);
// efeito do Pulso de Vontade num alvo: fracos ficam intimidados por pouco tempo; os demais
// perdem postura; chefes e bestas resistem quase todo. Nunca é dano em área permanente.
export function pulseEffect(target, playerLevel, reiLevel) {
  const lv = target.level ?? target.def?.level ?? 1;
  if (target.boss || target.isBeast) return { kind: 'resiste', posture: 8, stun: 0 };
  const weak = lv <= playerLevel * (0.5 + 0.3 * Math.min(1, reiLevel / 100));
  if (weak) return { kind: 'intimidado', posture: 30, stun: 1.5 + 2 * Math.min(1, reiLevel / 100) };
  return { kind: 'abalado', posture: 18, stun: 0 };
}

// ===== Meditação =====
// Respirar no ritmo: um ciclo de 4 s; tocar perto do pico (±0,6 s) conta. Sem toque por 3
// ciclos, a sessão acaba (anti-AFK). Limite de XP por sessão.
export const MEDITATION = { cycle: 4, window: 0.6, maxMiss: 3, cap: 80 };
export const breathPhase = (t) => (t % MEDITATION.cycle) / MEDITATION.cycle; // 0..1; pico em 0,5
export const breathValid = (t) => Math.abs(breathPhase(t) - 0.5) * MEDITATION.cycle <= MEDITATION.window;
// lugares que ajudam (só com a sessão ativa): montanha, templo, floresta, água
export function meditationPlace(ctx) {
  if (ctx.biome === 'ceu') return { mult: 1.5, label: 'templo celeste' };
  if (ctx.biome === 'neve' || ctx.altitude) return { mult: 1.5, label: 'montanha' };
  if (ctx.biome === 'floresta' || ctx.biome === 'selva') return { mult: 1.3, label: 'floresta' };
  if (ctx.nearWater) return { mult: 1.25, label: 'água corrente' };
  return { mult: 1, label: 'neutro' };
}
export function newMeditation() {
  return { t: 0, cycle: 0, tapped: false, misses: 0, good: 0, xp: 0 };
}
// toque do jogador; devolve true se foi uma respiração válida
export function meditationTap(m) {
  if (m.tapped) return false; // um toque por ciclo
  m.tapped = true;
  if (!breathValid(m.t)) return false;
  m.good += 1;
  m.misses = 0;
  return true;
}
// avança; devolve 'fim' quando a sessão acaba por falta de participação
export function meditationStep(m, dt) {
  m.t += dt;
  const c = Math.floor(m.t / MEDITATION.cycle);
  if (c !== m.cycle) {
    if (!m.tapped) m.misses += 1;
    m.cycle = c;
    m.tapped = false;
    if (m.misses >= MEDITATION.maxMiss) return 'fim';
  }
  return null;
}
export const meditationXp = (m, mult) => (m.xp >= MEDITATION.cap ? 0 : Math.min(MEDITATION.cap - m.xp, 4 * mult));

// ===== Desafio da Vontade (libera o Haki do Rei) =====
// 20 s de pressão crescente; cada toque no ritmo (como na meditação) empurra a pressão para
// baixo. Pressão em 100 = falhou. Aguentar até o fim libera o Haki do Rei.
export const CHALLENGE = { time: 20, rise: 4.5, push: 22 }; // sem respirar, perde em ~13 s; no ritmo, aguenta
export const newChallenge = () => ({ t: 0, pressure: 20, tapped: false, cycle: 0, result: null });
export function challengeTap(c) {
  if (c.result || c.tapped) return false;
  c.tapped = true;
  if (!breathValid(c.t)) return false;
  c.pressure = Math.max(0, c.pressure - CHALLENGE.push);
  return true;
}
export function challengeStep(c, dt) {
  if (c.result) return c.result;
  c.t += dt;
  c.pressure += CHALLENGE.rise * (1 + c.t / CHALLENGE.time) * dt;
  const cyc = Math.floor(c.t / MEDITATION.cycle);
  if (cyc !== c.cycle) {
    c.cycle = cyc;
    c.tapped = false;
  }
  if (c.pressure >= 100) c.result = 'falhou';
  else if (c.t >= CHALLENGE.time) c.result = 'venceu';
  return c.result;
}

// ===== Treino da Observação =====
// Projéteis vindos de direções variadas, com aviso. Esquiva válida: sair do ponto marcado (ou
// esquivar) antes da chegada; ser atingido não dá XP. XP maior com a Percepção ligada? Não —
// com ela os avisos aparecem; sem ela é "percepção sem visão", que rende mais.
export const OBS_TRAINING = { shots: 10, every: [1.6, 2.6], telegraph: 1.1, radius: 1.4 };
export const dodgeXp = (difficulty, blind) => Math.round((2 + 2 * difficulty) * (blind ? 1.5 : 1));
