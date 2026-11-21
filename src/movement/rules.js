// Regras puras do movimento (sem física nem gráficos), usadas pelo controlador e pelos testes.

import { MOVE, STAMINA } from './config.js';
import { clamp, lerp } from '../core/math.js';

// Velocidade alvo no chão pela força do direcional (0..1)
export function groundSpeed(magnitude, { sprinting = false, crouched = false } = {}) {
  const m = clamp(magnitude);
  if (m < 0.08) return 0;
  if (crouched) return MOVE.crouch * clamp(m / 0.7);
  if (sprinting && m > 0.3) return MOVE.sprint;
  return m < 0.55 ? MOVE.walk * (m / 0.55) : lerp(MOVE.walk, MOVE.run, (m - 0.55) / 0.45);
}

// Salto: buffer (apertou pouco antes de tocar o chão) e coyote time (saiu da borda há pouco)
export class JumpGate {
  constructor() {
    this.buffer = 0;
    this.coyote = 0;
  }

  update(dt, { grounded, pressed }) {
    this.buffer = pressed ? MOVE.jumpBuffer : Math.max(0, this.buffer - dt);
    this.coyote = grounded ? MOVE.coyoteTime : Math.max(0, this.coyote - dt);
  }

  // Pode pular do chão agora?
  ready() {
    return this.buffer > 0 && this.coyote > 0;
  }

  consume() {
    this.buffer = 0;
    this.coyote = 0;
  }
}

// Fôlego: gastar trava a recuperação por 1 s; zerado, precisa recuperar até 30
export class Stamina {
  constructor() {
    this.value = STAMINA.max;
    this.idle = 0;
    this.exhausted = false;
  }

  // gasto contínuo (por segundo)
  drain(rate, dt) {
    if (rate <= 0) return;
    this.value = Math.max(0, this.value - rate * dt);
    this.idle = 0;
    if (this.value <= 0) this.exhausted = true;
  }

  // gasto de uma vez; retorna falso se não houver fôlego
  spend(amount) {
    if (this.exhausted || this.value < amount * 0.5) return false;
    this.value = Math.max(0, this.value - amount);
    this.idle = 0;
    if (this.value <= 0) this.exhausted = true;
    return true;
  }

  get available() {
    return !this.exhausted && this.value > 0;
  }

  update(dt) {
    this.idle += dt;
    if (this.idle >= STAMINA.regenDelay) this.value = Math.min(STAMINA.max, this.value + STAMINA.regen * dt);
    if (this.exhausted && this.value >= STAMINA.exhaustedRecover) this.exhausted = false;
  }
}

// Dano de queda pela altura (rolando, a margem segura aumenta)
export function fallDamage(height, rolled = false) {
  const safe = rolled ? MOVE.rollFall : MOVE.safeFall;
  if (height <= safe) return 0;
  return Math.round((height - safe) * MOVE.fallDamagePerUnit * (rolled ? 0.5 : 1));
}

// Direção relativa ao personagem para escolher a esquiva do laboratório
// (x positivo = esquerda do personagem, como no laboratório)
export function dashClip(dir, yaw) {
  const nose = { x: Math.sin(yaw), z: Math.cos(yaw) };
  const side = { x: nose.z, z: -nose.x };
  const x = dir.x * side.x + dir.z * side.z;
  const z = dir.x * nose.x + dir.z * nose.z;
  const ax = Math.abs(x) > 0.38 ? Math.sign(x) : 0;
  const az = Math.abs(z) > 0.38 ? Math.sign(z) : 0;
  const names = {
    '0,1': 'dashFront', '0,-1': 'dashBack', '1,0': 'dashLeft', '-1,0': 'dashRight',
    '1,1': 'dashFrontLeft', '-1,1': 'dashFrontRight', '1,-1': 'dashBackLeft', '-1,-1': 'dashBackRight', '0,0': 'dashFront',
  };
  return { id: names[`${ax},${az}`], relative: { x, z, slide: false } };
}
