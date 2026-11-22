// Combate naval (atualização 16; doc 03, seção 4). Regras puras (sem Three.js), testadas em
// tests/naval.test.js:
// - canhão com balística real (gravidade e velocidade de saída) e mira que acha o ângulo
//   baixo para acertar a distância; prévia do arco;
// - casco com vida (o do jogador cresce com o nível; o dos navios inimigos com o nível deles);
// - dano do canhão (explosão com raio e queda pela distância) e de abalroar (velocidade);
// - IA dos navios inimigos: patrulha, persegue, fica de lado a distância de tiro, atira
//   prevendo o movimento, volta à patrulha longe demais;
// - recompensas, conserto no Barqueiro e naufrágio.

import { clamp, wrapAngle } from '../core/math.js';

export const CANNON = {
  speed: 46, // velocidade de saída (unidades/s)
  gravity: 24,
  cooldown: 1.6, // canhão do bote
  enemyCooldown: [2.6, 3.6], // canhões dos navios inimigos (sorteado a cada tiro)
  radius: 3.4, // raio da explosão
  range: 86, // alcance máximo de mira
  height: 1.1, // altura da boca do canhão acima do convés
};

export const NAVAL = {
  aggro: 75, // navio inimigo vê o bote
  leash: 150, // longe disso da patrulha volta
  fireMin: 18,
  fireMax: 64,
  keep: 36, // distância que tenta manter (de lado)
  sinkTime: 6, // segundos afundando
  respawn: 150,
  boatRespawnHull: 0.5, // bote consertado pelo Barqueiro depois de afundar
  repairPerHp: 0.6, // moedas por ponto de casco no Barqueiro
  ramMin: 6, // velocidade relativa mínima para abalroar causar dano
};

// ===== Casco e dano =====
export const playerHull = (level) => Math.round(300 + 6 * Math.max(1, level));
export const shipHull = (level) => Math.round(300 + 9 * Math.max(1, level));
export const playerCannonDamage = (level) => Math.round(40 + 1.2 * Math.max(1, level));
export const enemyCannonDamage = (level) => Math.round(18 + 0.55 * Math.max(1, level));

// dano da explosão a uma distância do centro (cheio no meio, metade na borda)
export function blastDamage(base, dist, radius = CANNON.radius) {
  if (dist > radius) return 0;
  return Math.round(base * (1 - 0.5 * (dist / radius)));
}

// abalroar: dano para cada lado pela velocidade relativa e pela massa do outro
export function ramDamage(relSpeed, otherMass = 1) {
  if (relSpeed < NAVAL.ramMin) return 0;
  return Math.round((relSpeed - NAVAL.ramMin + 2) * 5 * otherMass);
}

export const repairCost = (hull, max) => Math.max(0, Math.ceil((max - hull) * NAVAL.repairPerHp));

// ===== Balística =====
// ângulo de elevação (rad) do arco baixo para acertar um alvo a `dist` na horizontal e `dy`
// acima; null se estiver fora do alcance
export function aimPitch(dist, dy = 0, v = CANNON.speed, g = CANNON.gravity) {
  if (dist < 0.01) return 0;
  const v2 = v * v;
  const disc = v2 * v2 - g * (g * dist * dist + 2 * dy * v2);
  if (disc < 0) return null;
  return Math.atan((v2 - Math.sqrt(disc)) / (g * dist));
}

// tempo de voo até a distância horizontal `dist` com a elevação `pitch`
export const flightTime = (dist, pitch, v = CANNON.speed) => dist / Math.max(0.01, v * Math.cos(pitch));

// alcance no plano para uma elevação
export const rangeAt = (pitch, v = CANNON.speed, g = CANNON.gravity) => (v * v * Math.sin(2 * pitch)) / g;

// bala: { x, y, z, vx, vy, vz }
export function launch(origin, yaw, pitch, v = CANNON.speed) {
  const h = Math.cos(pitch) * v;
  return { x: origin.x, y: origin.y, z: origin.z, vx: Math.sin(yaw) * h, vy: Math.sin(pitch) * v, vz: Math.cos(yaw) * h, t: 0 };
}

export function stepBall(b, dt, g = CANNON.gravity) {
  b.vy -= g * dt;
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  b.z += b.vz * dt;
  b.t += dt;
  return b;
}

// pontos do arco previsto (para a linha de mira)
export function arcPoints(origin, yaw, pitch, { step = 0.08, max = 40, floor = -1, v = CANNON.speed } = {}) {
  const b = launch(origin, yaw, pitch, v);
  const pts = [];
  for (let i = 0; i < max; i++) {
    pts.push({ x: b.x, y: b.y, z: b.z });
    if (b.y < floor) break;
    stepBall(b, step);
  }
  return pts;
}

// Mira com previsão: onde o alvo vai estar quando a bala chegar (duas iterações bastam)
export function leadAim(from, target, vel = { x: 0, z: 0 }) {
  let tx = target.x;
  let tz = target.z;
  let pitch = 0;
  for (let k = 0; k < 3; k++) {
    const d = Math.hypot(tx - from.x, tz - from.z);
    pitch = aimPitch(d, (target.y ?? 0) - from.y);
    if (pitch === null) return null;
    const t = flightTime(d, pitch);
    tx = target.x + vel.x * t;
    tz = target.z + vel.z * t;
  }
  return { yaw: Math.atan2(tx - from.x, tz - from.z), pitch, dist: Math.hypot(tx - from.x, tz - from.z) };
}

// ===== IA dos navios inimigos =====
// ship: { x, z, yaw, speed, mode, wp, home:{x,z}, route:[{x,z}] }
// target: { x, z, vx, vz } (o bote do jogador com alguém a bordo) ou null
// Devolve a entrada do leme { wx, wz, mag, fast } e se quer atirar (fire: true com mira pronta).
export function shipAI(ship, target) {
  const route = ship.route;
  const here = { x: ship.x, z: ship.z };
  const fromHome = Math.hypot(ship.x - ship.home.x, ship.z - ship.home.z);
  const dist = target ? Math.hypot(target.x - ship.x, target.z - ship.z) : Infinity;
  if (ship.mode !== 'ataque' && dist < NAVAL.aggro) ship.mode = 'ataque';
  if (ship.mode === 'ataque' && (dist > NAVAL.aggro * 1.6 || fromHome > NAVAL.leash)) ship.mode = 'volta';
  if (ship.mode === 'volta' && fromHome < 30) ship.mode = 'patrulha';
  ship.mode ??= 'patrulha';

  let goal;
  let fast = false;
  if (ship.mode === 'ataque') {
    // vai para um ponto de lado do alvo, a `keep` de distância (circula e mostra o costado)
    const ang = Math.atan2(ship.x - target.x, ship.z - target.z);
    const side = ship.side ?? 1;
    const a = ang + side * 0.55;
    goal = { x: target.x + Math.sin(a) * NAVAL.keep, z: target.z + Math.cos(a) * NAVAL.keep };
    fast = dist > NAVAL.fireMax;
  } else if (ship.mode === 'volta') {
    goal = route[ship.wp ?? 0];
    fast = true;
  } else {
    ship.wp ??= 0;
    goal = route[ship.wp];
    if (Math.hypot(goal.x - here.x, goal.z - here.z) < 12) {
      ship.wp = (ship.wp + 1) % route.length;
      goal = route[ship.wp];
    }
  }
  const dx = goal.x - here.x;
  const dz = goal.z - here.z;
  const len = Math.hypot(dx, dz) || 1;
  const mag = ship.mode === 'ataque' ? clamp(len / 20, 0.35, 1) : 0.7;
  const fire = ship.mode === 'ataque' && dist >= NAVAL.fireMin && dist <= NAVAL.fireMax;
  return { wx: dx / len, wz: dz / len, mag, fast, fire, dist };
}

// erro de mira dos inimigos: maior de longe e contra alvo rápido (o jogador pode desviar)
export function enemySpread(dist, targetSpeed, rand = Math.random) {
  const s = 0.012 * dist + 0.09 * targetSpeed;
  return { yaw: (rand() - 0.5) * s * 0.05, dist: (rand() - 0.5) * s };
}

// ===== Recompensas =====
const xpToNext = (L) => Math.round(100 + 30 * Math.pow(L, 1.4));
export function shipLoot(level, rand = Math.random) {
  const L = Math.max(1, level);
  const mats = [['tabua', 2 + Math.floor(rand() * 3)]];
  if (rand() < 0.6) mats.push(['polvora', 1 + Math.floor(rand() * 2)]);
  if (rand() < 0.2) mats.push(['perola', 1]);
  return { coins: Math.round(30 + 3 * L), xp: Math.round(xpToNext(L) / 6), mats, item: rand() < 0.25 };
}

// ===== Rotas de patrulha =====
// anel de `n` pontos em volta de um centro (água funda: fora do campo da ilha)
export function ringRoute(cx, cz, r, n = 6, phase = 0) {
  return Array.from({ length: n }, (_, k) => {
    const a = phase + (k / n) * Math.PI * 2;
    return { x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r };
  });
}

export function normalizeHull(v, max) {
  const n = Number(v);
  return Number.isFinite(n) ? clamp(n, 0, max) : max;
}

export const angleTo = (from, to) => wrapAngle(Math.atan2(to.x - from.x, to.z - from.z));
