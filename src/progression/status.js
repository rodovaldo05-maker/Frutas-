// Valores máximos do personagem a partir do treino (documento mestre 4.0).
// Fôlego máximo = (100 + 1 por nível de Força acima do 1) × bônus de Fôlego (até +30%).

import { bonuses, normalizeTraining } from './training.js';

export function maxStamina(training) {
  return Math.round(bonuses(normalizeTraining(training)).staminaMax);
}

// Vida máxima base (raças e equipamentos entram nas próximas fases)
export function maxHealth() {
  return 100;
}
