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

// Vida máxima: 100 + 6 por ponto de Defesa
export function maxHealth(status) {
  return 100 + normalizeStatus(status).defesa * 6;
}

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

// Devolve todos os pontos (redistribuir)
export function resetStatus(save) {
  const s = normalizeStatus(save.status);
  const total = STATUS_KEYS.reduce((sum, k) => sum + s[k], 0);
  save.status = newStatus();
  save.statusPoints = (save.statusPoints || 0) + total;
  return total;
}

// Textos do efeito de cada status (para a tela de Status)
export const STATUS_INFO = {
  forca: { name: 'Força', effect: (v) => `+${v * 3}% de dano corpo a corpo · +${v} de fôlego` },
  defesa: { name: 'Defesa', effect: (v) => `+${v * 6} de vida · +${(v * 0.5).toLocaleString('pt-BR')} de defesa` },
  fruta: { name: 'Fruta', effect: (v) => `+${v * 3}% de dano das frutas` },
  espada: { name: 'Espada', effect: (v) => `+${v * 3}% de dano com armas` },
  vitalidade: { name: 'Vitalidade', effect: (v) => `+${v * 4} de energia e fôlego` },
};

export function maxStamina(status) {
  const s = normalizeStatus(status);
  let total = STAMINA.max;
  for (const [k, per] of Object.entries(STAMINA_PER_POINT)) total += s[k] * per;
  return total;
}
