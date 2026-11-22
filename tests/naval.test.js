import { describe, it, expect } from 'vitest';
import { CANNON, NAVAL, aimPitch, flightTime, launch, stepBall, leadAim, arcPoints, blastDamage, ramDamage, repairCost, shipAI, shipLoot, ringRoute, playerHull, shipHull, playerCannonDamage, enemyCannonDamage, normalizeHull } from '../src/ships/naval.js';
import { fleetPlan } from '../src/ships/fleet.js';
import { SEA } from '../src/islands/firstSea.js';
import { seaHeight } from '../src/islands/firstSea.js';
import { islandHeight, ISLAND } from '../src/islands/trainingIsland.js';
import { villageHeight, VILLAGE } from '../src/islands/villageIsland.js';
import { mulberry32 } from '../src/core/math.js';
import { migrate, newSave } from '../src/saves/saveSystem.js';

// simula a bala até cair no nível y e devolve a distância horizontal
function landDist(pitch, y0 = 0, yEnd = 0) {
  const b = launch({ x: 0, y: y0, z: 0 }, 0, pitch);
  let last = { ...b };
  for (let i = 0; i < 4000 && !(b.vy < 0 && b.y <= yEnd); i++) {
    last = { ...b };
    stepBall(b, 1 / 240);
  }
  return (last.z + b.z) / 2;
}

describe('canhão: balística', () => {
  it('a mira acha o ângulo que acerta a distância (arco baixo)', () => {
    for (const d of [15, 40, 70]) {
      const p = aimPitch(d, -1.5);
      expect(p).not.toBeNull();
      expect(p).toBeLessThan(Math.PI / 4);
      expect(landDist(p, 1.5, 0)).toBeCloseTo(d, 0);
    }
  });

  it('fora do alcance não mira', () => {
    const max = (CANNON.speed * CANNON.speed) / CANNON.gravity;
    expect(aimPitch(max * 1.05, 0)).toBeNull();
    expect(aimPitch(CANNON.range, -2)).not.toBeNull();
  });

  it('a previsão mira à frente de um alvo em movimento', () => {
    const still = leadAim({ x: 0, y: 1, z: 0 }, { x: 40, y: 0, z: 0 });
    const moving = leadAim({ x: 0, y: 1, z: 0 }, { x: 40, y: 0, z: 0 }, { x: 0, z: 10 });
    expect(still.yaw).toBeCloseTo(Math.PI / 2, 3);
    expect(moving.yaw).toBeLessThan(still.yaw); // vira para +z (à frente do alvo)
    const t = flightTime(moving.dist, moving.pitch);
    expect(moving.dist).toBeCloseTo(Math.hypot(40, 10 * t), 0);
  });

  it('o arco previsto começa no canhão e termina na água', () => {
    const pts = arcPoints({ x: 0, y: 2, z: 0 }, 0, aimPitch(50, -2), { step: 0.05, max: 200, floor: 0 });
    expect(pts[0]).toEqual({ x: 0, y: 2, z: 0 });
    expect(pts.at(-1).y).toBeLessThan(0.5);
    expect(pts.at(-1).z).toBeGreaterThan(45);
  });
});

describe('dano, casco e conserto', () => {
  it('explosão: cheio no centro, metade na borda, nada fora', () => {
    expect(blastDamage(100, 0)).toBe(100);
    expect(blastDamage(100, CANNON.radius)).toBe(50);
    expect(blastDamage(100, CANNON.radius + 0.1)).toBe(0);
  });

  it('abalroar só dói rápido e cresce com a velocidade', () => {
    expect(ramDamage(NAVAL.ramMin - 1)).toBe(0);
    expect(ramDamage(15)).toBeGreaterThan(ramDamage(9));
    expect(ramDamage(12, 1.5)).toBeGreaterThan(ramDamage(12, 0.8));
  });

  it('casco e canhões crescem com o nível', () => {
    expect(playerHull(1)).toBeGreaterThanOrEqual(300);
    expect(playerHull(100)).toBeGreaterThan(playerHull(10));
    expect(shipHull(300)).toBeGreaterThan(shipHull(25));
    expect(playerCannonDamage(200)).toBeGreaterThan(playerCannonDamage(1));
    expect(enemyCannonDamage(500)).toBeGreaterThan(enemyCannonDamage(12));
    // nível parecido: ~8 a 15 tiros para afundar um navio
    for (const L of [12, 100, 400]) {
      const shots = shipHull(L) / playerCannonDamage(L);
      expect(shots).toBeGreaterThan(5);
      expect(shots).toBeLessThan(16);
    }
  });

  it('conserto cobra pelo que falta; salvo estragado volta a valores válidos', () => {
    expect(repairCost(300, 300)).toBe(0);
    expect(repairCost(100, 300)).toBe(Math.ceil(200 * NAVAL.repairPerHp));
    expect(normalizeHull('x', 300)).toBe(300);
    expect(normalizeHull(-5, 300)).toBe(0);
    const out = migrate({ ...newSave(), boatHull: 'muito', ships: { a: 2, b: -1, c: 'x' } });
    expect(out.boatHull).toBeNull();
    expect(out.ships).toEqual({ a: 2 });
  });
});

describe('navios inimigos', () => {
  const ship = () => ({ x: 0, z: 0, mode: 'patrulha', wp: 0, route: ringRoute(0, 0, 40, 6), home: { x: 40, z: 0 }, side: 1 });

  it('patrulha de ponto em ponto', () => {
    const s = ship();
    s.x = 39;
    s.z = 1;
    shipAI(s, null);
    expect(s.wp).toBe(1);
    expect(s.mode).toBe('patrulha');
  });

  it('vê o bote, ataca de lado a distância de tiro e só atira no alcance', () => {
    const s = ship();
    const far = shipAI(s, { x: 0, z: NAVAL.aggro + 10 });
    expect(s.mode).toBe('patrulha');
    expect(far.fire).toBe(false);
    const near = shipAI(s, { x: 0, z: 40 });
    expect(s.mode).toBe('ataque');
    expect(near.fire).toBe(true);
    // rumo: para um ponto ao lado do bote, não em cima dele
    const toTarget = Math.atan2(0, 40);
    expect(Math.abs(Math.atan2(near.wx, near.wz) - toTarget)).toBeGreaterThan(0.1);
    expect(shipAI(s, { x: 0, z: 8 }).fire).toBe(false); // perto demais
  });

  it('longe demais da patrulha volta para casa', () => {
    const s = ship();
    s.mode = 'ataque';
    s.x = NAVAL.leash + 60;
    shipAI(s, { x: NAVAL.leash + 70, z: 0 });
    expect(s.mode).toBe('volta');
    s.x = 45;
    s.z = 0;
    shipAI(s, null);
    expect(s.mode).toBe('patrulha');
  });

  it('saque: moedas, experiência e tábuas sempre; mais com o nível', () => {
    const a = shipLoot(12, mulberry32(1));
    const b = shipLoot(400, mulberry32(1));
    expect(a.mats[0][0]).toBe('tabua');
    expect(b.coins).toBeGreaterThan(a.coins);
    expect(b.xp).toBeGreaterThan(a.xp);
  });

  it('as rotas de patrulha ficam em mar aberto e fora das ilhas', () => {
    const plan = fleetPlan(SEA);
    expect(plan).toHaveLength(SEA.length + 1);
    const depth = (x, z) => {
      if (Math.max(Math.abs(x), Math.abs(z)) < ISLAND.half) return islandHeight(x, z);
      const vx = x - VILLAGE.offset.x;
      const vz = z - VILLAGE.offset.z;
      if (Math.max(Math.abs(vx), Math.abs(vz)) < VILLAGE.half) return villageHeight(vx, vz);
      for (const d of SEA) if (Math.max(Math.abs(x - d.x), Math.abs(z - d.z)) < d.R + 32) return seaHeight(d)(x - d.x, z - d.z);
      return -20;
    };
    for (const p of plan) {
      for (let i = 0; i < p.route.length; i++) {
        const a = p.route[i];
        const b = p.route[(i + 1) % p.route.length];
        for (let t = 0; t <= 1; t += 0.1) expect(depth(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t), `${p.id} ${i}`).toBeLessThan(-2);
      }
      const island = SEA.find((d) => p.id === `navio-${d.id}`);
      if (island) {
        expect(p.level).toBeGreaterThanOrEqual(island.faixa[0]);
        expect(p.level).toBeLessThanOrEqual(island.faixa[1]);
      }
    }
  });
});
