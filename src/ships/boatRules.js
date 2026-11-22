// Regras do bote do jogador (atualização 10, doc 03): navegação sem física de corpo rígido.
// O analógico aponta para onde o bote deve ir (em relação à câmera); o bote gira até lá com
// raio de curva, acelera e freia aos poucos e para no raso, na praia e nas estruturas
// (cais, pilares). Tudo aqui é puro (sem Three.js) para os testes.

import { clamp, wrapAngle } from '../core/math.js';

export const BOAT = {
  length: 7.6, // unidades do mundo (≈ 3,5 m)
  beam: 3.0,
  draft: 0.7, // calado: precisa de pelo menos isto de água embaixo
  deck: 0.32, // piso acima da linha d'água (onde o jogador fica em pé)
  seat: -2.1, // posição do jogador ao longo do bote (atrás do centro, no leme)
  speed: 13, // velocidade normal (≈ 6 m/s)
  fast: 19, // com Correr ligado
  accel: 7.5,
  brake: 8,
  turn: 1.3, // rad/s em velocidade de cruzeiro
  boardRange: 5.6, // distância para embarcar
  waterLevel: 0,
};

const approach = (v, target, step) => (v < target ? Math.min(target, v + step) : Math.max(target, v - step));

// Um passo da navegação. s = { x, z, yaw, speed }; input = { wx, wz, mag, fast }
// world = { ground(x, z) → altura do fundo, blocked(x, z, yaw, reach) → true se há estrutura }
// Devolve { bump } quando bateu (para som e tremor).
export function boatStep(s, input, world, dt) {
  const mag = clamp(input?.mag ?? 0);
  const steering = mag > 0.15;
  const want = steering ? Math.atan2(input.wx, input.wz) : s.yaw;
  const diff = wrapAngle(want - s.yaw);
  // gira mais devagar parado e mais rápido em movimento (como um leme)
  const rate = BOAT.turn * (0.45 + 0.55 * clamp(Math.abs(s.speed) / BOAT.speed));
  s.yaw = wrapAngle(s.yaw + clamp(diff, -rate * dt, rate * dt));
  s.turning = clamp(diff, -1, 1) * (steering ? 1 : 0);
  // velocidade: só para frente; a força cai quando o rumo está longe do desejado
  const align = Math.max(0, Math.cos(diff));
  const top = (input?.fast ? BOAT.fast : BOAT.speed) * mag * (0.3 + 0.7 * align);
  const target = steering ? top : 0;
  s.speed = approach(s.speed, target, (target > s.speed ? BOAT.accel : BOAT.brake) * dt);

  const step = s.speed * dt;
  if (Math.abs(step) < 1e-5) return { bump: false };
  const fx = Math.sin(s.yaw);
  const fz = Math.cos(s.yaw);
  const nx = s.x + fx * step;
  const nz = s.z + fz * step;
  // proa e os dois lados da frente: precisam de água funda (ou ficar mais funda que agora)
  const dir = Math.sign(step);
  const reach = BOAT.length / 2;
  const side = BOAT.beam * 0.35;
  const probes = [[0, reach], [side, reach - 1.2], [-side, reach - 1.2]];
  for (const [ox, oz] of probes) {
    const px = (x, z) => [x + fx * oz * dir + fz * ox, z + fz * oz * dir - fx * ox];
    const [ax, az] = px(nx, nz);
    const [bx, bz] = px(s.x, s.z);
    const gNew = world.ground(ax, az);
    const gNow = world.ground(bx, bz);
    const shallow = gNew > BOAT.waterLevel - BOAT.draft && gNew >= gNow - 1e-3;
    if (shallow) return stop(s);
  }
  if (world.blocked?.(s.x, s.z, dir > 0 ? s.yaw : s.yaw + Math.PI, reach + Math.abs(step) + 0.3)) return stop(s);
  s.x = nx;
  s.z = nz;
  return { bump: false };
}

function stop(s) {
  const hard = Math.abs(s.speed) > 4;
  s.speed = -s.speed * 0.2; // pequeno recuo
  return { bump: hard };
}

// Onde descer do bote: o ponto de chão firme mais perto (praia ou cais) ao redor do bote;
// sem chão por perto, desce na água ao lado. surfaceAt(x, z) → altura do chão/cais ou null.
export function landingSpot(s, surfaceAt) {
  const fx = Math.sin(s.yaw);
  const fz = Math.cos(s.yaw);
  const rx = fz;
  const rz = -fx;
  const tries = [];
  for (const d of [2.6, 3.6, 4.8]) {
    tries.push([rx * d, rz * d], [-rx * d, -rz * d]); // lados
  }
  tries.push([fx * 5, fz * 5], [fx * 6.5, fz * 6.5], [-fx * 5, -fz * 5]); // frente e trás
  let best = null;
  for (const [ox, oz] of tries) {
    const x = s.x + ox;
    const z = s.z + oz;
    const y = surfaceAt(x, z);
    if (y === null || y < BOAT.waterLevel + 0.25) continue;
    const d = Math.hypot(ox, oz);
    if (!best || d < best.d) best = { x, y, z, d, land: true };
  }
  if (best) return best;
  return { x: s.x + rx * 3, y: BOAT.waterLevel + 0.2, z: s.z + rz * 3, land: false };
}

// Salvo: bote só com números finitos; senão volta para o cais
export function normalizeBoat(b) {
  if (!b || typeof b !== 'object') return null;
  const { x, z, yaw } = b;
  if (![x, z, yaw].every(Number.isFinite)) return null;
  return { x, z, yaw: wrapAngle(yaw), aboard: !!b.aboard };
}
