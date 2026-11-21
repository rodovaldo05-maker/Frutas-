// Regras do combate base (doc 05), sem gráficos: dados de cada golpe, combo, dano,
// defesa, defesa perfeita, Postura e hitstop. Jogador e inimigos usam as mesmas regras e os
// mesmos golpes do laboratório (Jab, Direto, Gancho), com o tempo de contato de cada clipe.
// Unidades do mundo: 1 m ≈ 2,2.

import { FRUTOMotion } from '../animation/fruto-motion.js';
import { clamp } from '../core/math.js';

export const M = 2.2;

// Golpes do Combate Básico. Tempo (preparo, ativo, duração) vem do clipe do laboratório.
export const ATTACKS = {
  jab: { clip: 'jab', nome: 'Jab', damage: 10, posture: 8, range: 1.5 * M, knock: 0.6 * M, reaction: 'leve', hitstop: 0.06, lunge: 0.35 * M },
  direto: { clip: 'direto', nome: 'Direto', damage: 12, posture: 10, range: 1.6 * M, knock: 0.8 * M, reaction: 'leve', hitstop: 0.07, lunge: 0.45 * M },
  gancho: { clip: 'gancho', nome: 'Gancho', damage: 16, posture: 18, range: 1.5 * M, knock: 1.6 * M, reaction: 'media', hitstop: 0.1, lunge: 0.5 * M, heavy: true },
};
export const COMBO = ['jab', 'direto', 'gancho'];

export const GUARD = {
  frontal: 0.25, // cosseno mínimo entre a frente do defensor e o atacante
  reduce: 0.7, // defesa comum: −70% do dano de frente
  perfect: 0.15, // defesa perfeita: começou a defender até 0,15 s antes do golpe
  stunAttacker: 0.6, // atacante atordoado depois de uma defesa perfeita
  postureMax: 100,
  postureRegen: 22, // por segundo, depois de 1,2 s sem perder postura
  postureDelay: 1.2,
  breakStun: 1.2, // postura zerada: guarda quebrada
};

const REACTION = { leve: 0.32, media: 0.5, pesada: 0.75 };
export const reactionTime = (kind) => REACTION[kind] ?? 0.3;

// Tempo de cada golpe a partir do clipe do laboratório
export function timing(id) {
  const c = FRUTOMotion.clips[ATTACKS[id].clip];
  return { release: c.release, active: c.active ?? 0.07, duration: c.duration };
}

// Fórmula do doc 05 (parte física): base × atributo × defesa do alvo × mitigação
export function computeDamage(base, { mult = 1, defense = 0, mitigation = 0 } = {}) {
  return Math.max(1, Math.round(base * mult * (100 / (100 + Math.max(0, defense))) * (1 - clamp(mitigation, 0, 0.65))));
}

// O golpe alcança o alvo? (distância horizontal, ângulo da frente do atacante e altura)
export function inReach(attacker, target, attack, { radius = 0.9, arc = 0.45 } = {}) {
  const dx = target.x - attacker.x;
  const dz = target.z - attacker.z;
  const d = Math.hypot(dx, dz);
  if (Math.abs(target.y - attacker.y) > 3.2) return false;
  if (d > attack.range + radius) return false;
  if (d < 0.6) return true;
  const facing = (dx * Math.sin(attacker.yaw) + dz * Math.cos(attacker.yaw)) / d;
  return facing >= arc;
}

// Sequência de golpes: combo com janela, entrada guardada (buffer) e evento de contato.
export class AttackRunner {
  constructor({ speed = 1 } = {}) {
    this.speed = speed;
    this.current = null; // { id, t, step, struck, tm }
    this.buffer = 0;
    this.comboStep = 0;
    this.comboTimer = 0;
  }

  get busy() {
    return !!this.current;
  }

  // Aperto de Atacar; começa já ou guarda para emendar no próximo golpe
  press() {
    this.buffer = 0.32;
  }

  start(step) {
    const id = COMBO[step % COMBO.length];
    this.current = { id, t: 0, step, struck: false, tm: timing(id) };
    this.buffer = 0;
    return this.current;
  }

  cancel() {
    this.current = null;
    this.buffer = 0;
    this.comboStep = 0;
  }

  // Avança; devolve o golpe no quadro de contato (uma vez) e se pode emendar
  update(dt, canStart = true) {
    this.buffer = Math.max(0, this.buffer - dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    let strike = null;
    const c = this.current;
    if (c) {
      c.t += dt * this.speed;
      if (!c.struck && c.t >= c.tm.release) {
        c.struck = true;
        strike = { ...ATTACKS[c.id], id: c.id, step: c.step };
      }
      // depois do contato, um novo aperto emenda o próximo golpe
      const chain = c.t >= c.tm.release + c.tm.active && this.buffer > 0 && c.step < COMBO.length - 1;
      if (chain) {
        this.start(c.step + 1);
      } else if (c.t >= c.tm.duration) {
        this.comboStep = c.step + 1 < COMBO.length ? c.step + 1 : 0;
        this.comboTimer = c.step + 1 < COMBO.length ? 0.3 : 0;
        this.current = null;
      }
    }
    if (!this.current && this.buffer > 0 && canStart) {
      this.start(this.comboTimer > 0 ? this.comboStep : 0);
    }
    return strike;
  }

  // Já passou do contato? (esquiva pode cancelar a recuperação)
  get recovering() {
    const c = this.current;
    return !!c && c.t >= c.tm.release + c.tm.active;
  }
}

// Defesa e Postura
export class Guard {
  constructor({ postureMax = GUARD.postureMax } = {}) {
    this.postureMax = postureMax;
    this.posture = postureMax;
    this.holding = false;
    this.since = 0; // tempo segurando Defender
    this.idle = 0;
    this.stun = 0;
  }

  set(holding, dt) {
    if (this.stun > 0) holding = false;
    this.since = holding ? (this.holding ? this.since + dt : 0) : 0;
    this.holding = holding;
  }

  update(dt) {
    this.stun = Math.max(0, this.stun - dt);
    this.idle += dt;
    if (this.idle >= GUARD.postureDelay) this.posture = Math.min(this.postureMax, this.posture + GUARD.postureRegen * dt);
  }

  // Recebe um golpe; devolve { result: 'hit' | 'block' | 'perfect' | 'break', damage }
  receive(damage, postureDamage, { frontal, perfectWindow = GUARD.perfect, reduce = GUARD.reduce, postureMult = 1 } = {}) {
    if (this.holding && frontal) {
      if (this.since <= perfectWindow) return { result: 'perfect', damage: 0 };
      this.idle = 0;
      this.posture -= postureDamage * postureMult;
      if (this.posture <= 0) {
        this.posture = 0;
        this.stun = GUARD.breakStun;
        this.holding = false;
        return { result: 'break', damage: Math.round(damage * (1 - reduce * 0.5)) };
      }
      return { result: 'block', damage: Math.max(0, Math.round(damage * (1 - reduce))) };
    }
    return { result: 'hit', damage };
  }
}

// O defensor está de frente para o atacante?
export function isFrontal(defender, attacker) {
  const dx = attacker.x - defender.x;
  const dz = attacker.z - defender.z;
  const d = Math.hypot(dx, dz) || 1;
  return (dx * Math.sin(defender.yaw) + dz * Math.cos(defender.yaw)) / d >= GUARD.frontal;
}
