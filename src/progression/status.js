// Pontos de status do personagem (doc 09, seção 1.1) e os valores que eles mudam.

import { STAMINA } from '../movement/config.js';

export const STATUS_KEYS = ['forca', 'defesa', 'fruta', 'espada', 'vitalidade'];

// Quanto cada ponto soma ao fôlego máximo
export const STAMINA_PER_POINT = {
  forca: 1, // cada nível de Força: +1 de fôlego
  vitalidade: 4,
};

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

export function maxStamina(status) {
  const s = normalizeStatus(status);
  let total = STAMINA.max;
  for (const [k, per] of Object.entries(STAMINA_PER_POINT)) total += s[k] * per;
  return total;
}
