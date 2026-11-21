// Duas fontes de evolução que convivem (doc 09 e doc 12):
// - Pontos de status: cada nível de aventureiro dá 3 pontos que o jogador DISTRIBUI
//   entre Força, Defesa, Fruta, Espada e Vitalidade (redistribuir é grátis uma vez).
// - Treino pela prática (training.js): vai sozinho para o atributo praticado e NÃO pode
//   ser distribuído.
// Os valores finais somam as duas fontes. Fôlego máximo:
//   (100 + 1 por ponto de Força + 4 por ponto de Vitalidade + 1 por nível de treino de Força
//    acima do 1) × bônus do treino de Fôlego (até +30%).

import { STAMINA } from '../movement/config.js';
import { bonuses, normalizeTraining } from './training.js';

export const STATUS_KEYS = ['forca', 'defesa', 'fruta', 'espada', 'vitalidade'];
export const POINTS_PER_LEVEL = 3;

// Quanto cada ponto distribuído soma ao fôlego máximo
export const STAMINA_PER_POINT = {
  forca: 1, // cada ponto de Força: +1 de fôlego
  vitalidade: 4,
};

// Atributo de treino que reforça o mesmo status (mostrado junto na tela)
export const TRAINED_TWIN = { forca: 'forca', defesa: 'defesa' };

export function newStatus() {
  return Object.fromEntries(STATUS_KEYS.map((k) => [k, 0]));
}

// Corrige um status salvo (chaves que faltam, valores inválidos)
export function normalizeStatus(status) {
  const out = newStatus();
  if (status && typeof status === 'object') {
    for (const k of STATUS_KEYS) {
      const v = Math.floor(Number(status[k]));
      out[k] = Number.isFinite(v) && v > 0 ? v : 0;
    }
  }
  return out;
}

// Pontos que um personagem desse nível deve ter no total (distribuídos + livres)
export const pointsForLevel = (level) => Math.max(0, (Math.floor(level) - 1) * POINTS_PER_LEVEL);

// Coloca pontos num status (limitado aos pontos livres); devolve quantos colocou
export function allocate(save, key, amount) {
  if (!STATUS_KEYS.includes(key)) return 0;
  const n = Math.max(0, Math.min(Math.floor(amount), save.statusPoints || 0));
  if (!n) return 0;
  save.status = normalizeStatus(save.status);
  save.status[key] += n;
  save.statusPoints -= n;
  return n;
}

// Devolve todos os pontos distribuídos (o treino não muda)
export function resetStatus(save) {
  const s = normalizeStatus(save.status);
  const total = STATUS_KEYS.reduce((sum, k) => sum + s[k], 0);
  save.status = newStatus();
  save.statusPoints = (save.statusPoints || 0) + total;
  return total;
}

// Textos do efeito de cada ponto distribuído (tela Personagem › Status)
export const STATUS_INFO = {
  forca: { name: 'Força', effect: (v) => `+${v * 3}% de dano corpo a corpo · +${v} de fôlego` },
  defesa: { name: 'Defesa', effect: (v) => `+${v * 6} de vida · +${(v * 0.5).toLocaleString('pt-BR')} de defesa` },
  fruta: { name: 'Fruta', effect: (v) => `+${v * 3}% de dano das frutas` },
  espada: { name: 'Espada', effect: (v) => `+${v * 3}% de dano com armas` },
  vitalidade: { name: 'Vitalidade', effect: (v) => `+${v * 4} de energia e fôlego` },
};

export function maxStamina(status, training) {
  const s = normalizeStatus(status);
  let base = STAMINA.max;
  for (const [k, per] of Object.entries(STAMINA_PER_POINT)) base += s[k] * per;
  return Math.round(bonuses(normalizeTraining(training), base).staminaMax);
}

// Vida máxima: 100 + 6 por ponto de Defesa (raças e equipamentos entram depois)
export function maxHealth(status) {
  return 100 + normalizeStatus(status).defesa * 6;
}

// Multiplicadores de dano dos pontos distribuídos (usados pelo combate)
export function damageMultipliers(status) {
  const s = normalizeStatus(status);
  return { melee: 1 + 0.03 * s.forca, fruit: 1 + 0.03 * s.fruta, weapon: 1 + 0.03 * s.espada, defense: 0.5 * s.defesa };
}
