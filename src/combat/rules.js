// Regras do combate base (doc 05), sem gráficos: dados de cada golpe, combo, dano,
// defesa, defesa perfeita, Postura e hitstop. Jogador e inimigos usam as mesmas regras e os
// mesmos golpes do laboratório (Jab, Direto, Gancho), com o tempo de contato de cada clipe.
// Unidades do mundo: 1 m ≈ 2,2.

import { FRUTOMotion } from '../animation/fruto-motion.js';
import { clamp } from '../core/math.js';
import { m1Of, M1_BASE, M1_RULES, CATALOG, FPS } from './m1Catalog.js';

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

// Tempo de um clipe do laboratório (contato, ativo e duração)
export function clipTiming(clip) {
  const c = FRUTOMotion.clips[clip];
  return { release: c.release, active: c.active ?? 0.07, duration: c.duration };
}

// Tempo de cada golpe a partir do clipe do laboratório
export function timing(id, attacks = ATTACKS) {
  return clipTiming(attacks[id].clip);
}

// Combo de M1 de uma fruta comida (atualização 20): os quatro golpes do catálogo oficial
// (fruta_m1_1..4), com o dano da unidade básica da fruta × 0,85 / 0,95 / 1,05 / 1,25,
// hitstop em quadros e o efeito de cada golpe. As frutas de fera têm a variante híbrida.
export function fruitStyle(fruit) {
  if (!fruit?.combat) return { attacks: ATTACKS, combo: COMBO, nome: 'Combate Básico' };
  const recs = m1Of(fruit.id);
  if (recs.length !== 4) return { attacks: ATTACKS, combo: COMBO, nome: 'Combate Básico' };
  const dmg = fruit.combat.damage || [10, 12, 16];
  const unit = dmg.reduce((a, b) => a + b, 0) / (M1_BASE.damage[0] + M1_BASE.damage[1] + M1_BASE.damage[2]);
  const attacks = {};
  const combo = [];
  for (const r of recs) {
    const i = r.passo - 1;
    attacks[r.id] = {
      clip: r.id, clipHybrid: r.formas.includes('hibrida') ? `${r.id}_h` : null, nome: r.nome,
      damage: Math.round(unit * r.dano), posture: M1_BASE.posture[i], range: r.hitbox.alcance * M, arc: r.hitbox.arco,
      knock: M1_BASE.knock[i] * M, reaction: r.reacao, hitstop: r.hitstop / FPS, lunge: r.avanco * M,
      heavy: r.passo === 4, fruit: fruit.id, m1: r.passo, vfx: r.vfx, sfx: r.sfx, effect: r.efeito, low: r.hitbox.baixo,
      ground: r.hitbox.solo, appendage: r.apendice, kind: r.tipo, socket: r.hitbox.socket,
    };
    combo.push(r.id);
  }
  return { attacks, combo, nome: CATALOG[fruit.id].estilo, m1: true };
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

// Máquina do M1 (Prompt Mestre, seção 2), a mesma para fruta, estilo e espada:
// - um clique válido executa UM golpe; segurar não repete;
// - com um golpe em curso, o próximo clique só é aceito nos últimos 8 quadros dele e fica
//   guardado (um só, sem duplicar) por até 0,35 s;
// - os golpes não se sobrepõem: o próximo começa quando o atual termina;
// - depois da recuperação há 0,65 s para continuar a sequência; passou disso, volta ao M1-1;
// - depois do último golpe (M1-4 nas frutas) volta ao M1-1;
// - reset() zera a sequência (troca de fruta, morte, atordoamento ou ação incompatível).
export class AttackRunner {
  constructor({ speed = 1, attacks = ATTACKS, combo = COMBO } = {}) {
    this.speed = speed;
    this.attacks = attacks;
    this.combo = combo;
    this.current = null; // { id, t, step, struck, tm }
    this.buffer = 0;
    this.comboStep = 0;
    this.comboTimer = 0;
    this.clicks = 0; // cliques aceitos (para testes e HUD)
  }

  get busy() {
    return !!this.current;
  }

  // Clique de Atacar
  press() {
    const c = this.current;
    if (c) {
      const left = (c.tm.duration - c.t) / this.speed;
      if (left > M1_RULES.bufferFrames / FPS) return false; // cedo demais: ignorado
    }
    if (this.buffer > 0) return false; // já há um clique guardado
    this.buffer = M1_RULES.bufferExpire;
    this.clicks += 1;
    return true;
  }

  // Troca o estilo (combo de uma fruta, de um estilo de luta ou da espada): recomeça do M1-1
  setStyle({ attacks, combo }) {
    this.attacks = attacks;
    this.combo = combo;
    this.reset();
  }

  start(step) {
    const id = this.combo[step % this.combo.length];
    this.current = { id, t: 0, step, struck: false, tm: timing(id, this.attacks) };
    this.buffer = 0;
    return this.current;
  }

  // Interrompe o golpe e zera a sequência
  cancel() {
    this.current = null;
    this.buffer = 0;
    this.comboStep = 0;
    this.comboTimer = 0;
  }

  reset() {
    this.cancel();
  }

  // Próximo passo da sequência (0 = M1-1) e quanto resta da janela de continuação
  get nextStep() {
    return this.comboTimer > 0 ? this.comboStep : 0;
  }

  // Avança; devolve o golpe no quadro de impacto (uma vez)
  update(dt, canStart = true) {
    this.buffer = Math.max(0, this.buffer - dt);
    let strike = null;
    const c = this.current;
    if (c) {
      c.t += dt * this.speed;
      if (!c.struck && c.t >= c.tm.release) {
        c.struck = true;
        strike = { ...this.attacks[c.id], id: c.id, step: c.step };
      }
      if (c.t >= c.tm.duration) {
        const next = c.step + 1;
        const last = next >= this.combo.length;
        this.comboStep = last ? 0 : next;
        this.comboTimer = last ? 0 : M1_RULES.window;
        this.current = null;
      }
    } else {
      this.comboTimer = Math.max(0, this.comboTimer - dt);
      if (this.comboTimer <= 0) this.comboStep = 0;
    }
    if (!this.current && this.buffer > 0 && canStart) this.start(this.nextStep);
    return strike;
  }

  // Já passou da janela de colisão? (esquiva pode cancelar a recuperação)
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
