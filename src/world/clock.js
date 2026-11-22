// Relógio do jogo (atualização 11): 1 minuto de jogo por segundo real, então um dia inteiro
// dura 24 minutos. Guardado no salvo em minutos desde o começo (save.clock). A luz do dia e a
// rotina dos moradores leem a hora daqui.

import { smooth } from '../core/math.js';

export const DAY_MINUTES = 1440;
export const GAME_MINUTES_PER_SECOND = 1;
export const START_CLOCK = 8 * 60; // começa às 8h do dia 1

export const hourOf = (clock) => (((clock % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES) / 60;
export const dayOf = (clock) => Math.floor(clock / DAY_MINUTES) + 1;

export function fmtClock(clock) {
  const h = hourOf(clock);
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function normalizeClock(v) {
  return Number.isFinite(v) && v >= 0 ? v : START_CLOCK;
}

// Luz do dia: k = 1 de dia, 0 de noite (amanhece 5h–7h, anoitece 18h–20h); dusk = quanto do
// tom alaranjado do nascer/pôr do sol
export function daylight(h) {
  const k = smooth(5, 7, h) * (1 - smooth(18, 20, h));
  const bell = (c) => Math.max(0, 1 - Math.abs(h - c) / 1.3);
  return { k, dusk: Math.max(bell(6), bell(19)) };
}

// Minutos de jogo até a próxima vez que o relógio marcar `hour` (para "renova às 6h")
export function minutesUntil(clock, hour) {
  const now = hourOf(clock) * 60;
  let d = hour * 60 - now;
  if (d <= 0) d += DAY_MINUTES;
  return d;
}
