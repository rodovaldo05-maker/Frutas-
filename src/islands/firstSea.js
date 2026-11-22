// Primeiro Mar (atualização 14; doc 02): as ilhas 2 a 10 em volta da Ilha de Treino e do Porto
// das Origens (que faz o papel da ilha inicial). Cada ilha tem bioma próprio (relevo, cores,
// plantas e construções), uma faixa de nível, um acampamento de inimigos do nível e um chefe.
// O relevo é procedural por semente; a borda submersa é íngreme para o bote encostar perto da
// praia. Tudo em coordenadas locais da ilha; OffsetHeightfield põe a ilha no mundo.

import * as THREE from 'three';
import { OffsetHeightfield } from '../terrain/offsetField.js';
import { Heightfield } from '../terrain/heightfield.js';
import { buildTerrain } from '../terrain/terrainMesh.js';
import { StructureBuilder } from '../world/structures.js';
import { natureKit, placeInstances } from '../world/nature.js';
import { generateVillage } from '../world/village.js';
import { smooth, valueNoise2D, mulberry32 } from '../core/math.js';

// ===== Ilhas =====
// enemy/boss: aparência e golpe marcado (os números vêm de scaledDef/bossDef pelo nível)
const L = (skin, hair, shirt, shorts, shoes) => ({ skin, hair, shirt, shorts, shoes });
export const SEA = [
  {
    id: 'praia-saqueadores', nome: 'Praia dos Saqueadores', x: 700, z: -280, R: 60, biome: 'praia', seed: 11, faixa: [25, 75], campAngle: 0.6,
    enemy: { nome: 'Saqueador', look: L('#b9825c', '#1a1410', '#c83a3a', '#2a3a55', '#3a2a20'), faixa: '#e8e0d0' },
    boss: { nome: 'Rainha das Conchas', look: L('#d8a880', '#f0e0c0', '#3fa8b8', '#2a6070', '#e8d0b0'), faixa: '#f4e4c8', cor: '#5fd0e0', special: { nome: 'Chuva de Conchas', clip: 'mare2', cooldown: 6, telegraph: 0.9, radius: 3.4, damage: 16, effects: { molhado: { duration: 6 } } } },
  },
  {
    id: 'bosque-sussurrante', nome: 'Bosque Sussurrante', x: 1000, z: 120, R: 64, biome: 'floresta', seed: 23, faixa: [75, 150], campAngle: 2.2,
    enemy: { nome: 'Bandido do Bosque', look: L('#a8714c', '#3a2a1a', '#3f6a3a', '#3a3020', '#2a2018'), faixa: '#5a8a3a' },
    boss: { nome: 'Guardião de Musgo', look: L('#6a8a4a', '#3f6a2a', '#4a6a3a', '#3a4a2a', '#2a3a1a'), faixa: '#8ac060', cor: '#7ac050', special: { nome: 'Raízes', clip: 'impacto2', cooldown: 6, telegraph: 1.0, radius: 3.6, damage: 18, effects: { lento: { duration: 3 } } } },
  },
  {
    id: 'duna-partida', nome: 'Duna Partida', x: 760, z: 540, R: 66, biome: 'deserto', seed: 37, faixa: [150, 225], campAngle: 4.0,
    enemy: { nome: 'Nômade das Dunas', look: L('#9a6a48', '#2a1d14', '#e0c890', '#a88a5a', '#6a4a2a'), faixa: '#c8a060' },
    boss: { nome: 'Escorpião de Bronze', look: L('#8a5a3c', '#1a1410', '#b8803a', '#6a4a20', '#4a3010'), faixa: '#d8a040', cor: '#d8a040', special: { nome: 'Ferrão de Areia', clip: 'impacto2', cooldown: 5, telegraph: 0.9, radius: 3.2, damage: 20 } },
  },
  {
    id: 'forte-mare-alta', nome: 'Forte Maré-Alta', x: 320, z: 800, R: 58, biome: 'forte', seed: 41, faixa: [225, 300], campAngle: 1.2,
    enemy: { nome: 'Soldado da Maré-Alta', look: L('#c29a7c', '#2a2018', '#2f4f8a', '#e8e8e8', '#1a1a22'), faixa: '#e8e8f0' },
    boss: { nome: 'Comandante Lâmina-Azul', look: L('#c8a080', '#1a1a22', '#1f3f7a', '#e8e8e8', '#101018'), faixa: '#4a8aff', cor: '#4a8aff', element: 'gelo', meleeEffects: { lento: { duration: 1.5 } }, special: { nome: 'Corte Azul', clip: 'geada2', cooldown: 6, telegraph: 0.9, radius: 3.4, damage: 18, effects: { lento: { duration: 2.5 } } } },
  },
  {
    id: 'pico-gelido', nome: 'Pico Gélido', x: -180, z: 760, R: 64, biome: 'neve', seed: 53, faixa: [300, 400], campAngle: 0.3,
    enemy: { nome: 'Caçador Gélido', element: 'gelo', cor: '#7fd6ff', meleeEffects: { lento: { duration: 1.5 } }, look: L('#d8b090', '#e8f0f8', '#4a7aa8', '#2a3a55', '#e8f0f8'), faixa: '#bfeeff' },
    boss: { nome: 'Urso de Cristal', element: 'gelo', look: L('#e8f0f8', '#ffffff', '#bfe0f0', '#9fc8e0', '#e8f0f8'), faixa: '#7fd6ff', cor: '#7fd6ff', meleeEffects: { lento: { duration: 2 } }, special: { nome: 'Prisão de Cristal', clip: 'geada2', cooldown: 7, telegraph: 0.9, radius: 3.4, damage: 16, effects: { congelado: { duration: 1.4 }, lento: { duration: 3 } } } },
  },
  {
    id: 'porto-lanternas', nome: 'Porto das Lanternas', x: -600, z: 440, R: 62, biome: 'cidade', seed: 67, faixa: [400, 475], campAngle: 5.2,
    enemy: { nome: 'Capanga do Porto', look: L('#b9825c', '#2a1d14', '#3a3a44', '#2a2a33', '#1a1a20'), faixa: '#c84a3a' },
    boss: { nome: 'Duelista Mascarado', element: 'raio', look: L('#e8c0a0', '#101010', '#5a2a6a', '#1a1a22', '#101010'), faixa: '#101010', cor: '#c084fc', meleeEffects: { choque: { stacks: 1 } }, special: { nome: 'Estocada Relâmpago', clip: 'tormenta0', cooldown: 5, telegraph: 0.8, radius: 3, damage: 18, effects: { choque: { stacks: 2 } } } },
  },
  {
    id: 'caldeira-rubra', nome: 'Caldeira Rubra', x: -780, z: -60, R: 64, biome: 'vulcao', seed: 79, faixa: [475, 575], campAngle: 3.4,
    enemy: { nome: 'Forjador Rubro', element: 'fogo', cor: '#ff6a1a', meleeEffects: { queimando: { duration: 3, stacks: 1 } }, look: L('#8a5a3c', '#1a0c08', '#6a2a1a', '#2a1a14', '#1a100a'), faixa: '#ff8a2a' },
    boss: { nome: 'Ferreiro da Lava', element: 'fogo', look: L('#6a3a2a', '#ff6a1a', '#3a1a14', '#1a0c08', '#1a0c08'), faixa: '#ffb040', cor: '#ff6a1a', meleeEffects: { queimando: { duration: 4, stacks: 2 } }, special: { nome: 'Martelo de Lava', clip: 'brasa2', cooldown: 6, telegraph: 1.0, radius: 3.6, damage: 20, effects: { queimando: { duration: 5, stacks: 2 } } } },
  },
  {
    id: 'coliseu-partido', nome: 'Arena do Coliseu Partido', x: -520, z: -560, R: 56, biome: 'arena', seed: 83, faixa: [575, 650], campAngle: 1.9,
    enemy: { nome: 'Gladiador', look: L('#a8714c', '#3a2a1a', '#a8842a', '#6a2a1a', '#3a2a1a'), faixa: '#d8b040' },
    boss: { nome: 'Campeão Imbatível', look: L('#8a5a3c', '#e8c040', '#d8a020', '#8a1a1a', '#3a2a1a'), faixa: '#ffd040', cor: '#ffd040', special: { nome: 'Golpe do Campeão', clip: 'impacto2', cooldown: 5, telegraph: 0.9, radius: 4, damage: 22 } },
  },
  {
    id: 'fenda-celeste', nome: 'Fenda Celeste', x: -40, z: -780, R: 50, biome: 'ceu', seed: 97, faixa: [650, 700], campAngle: 0.9,
    enemy: { nome: 'Sentinela do Vento', element: 'raio', cor: '#ffe45a', meleeEffects: { choque: { stacks: 1 } }, look: L('#e8d0b0', '#f4f4f4', '#9fd0ff', '#e8e8f0', '#f4f4f4'), faixa: '#ffffff' },
    boss: { nome: 'Guardiã da Fenda Celeste', element: 'raio', look: L('#e8d0b0', '#ffe8a0', '#ffffff', '#9fd0ff', '#ffe8a0'), faixa: '#ffe45a', cor: '#ffe45a', meleeEffects: { choque: { stacks: 1 } }, special: { nome: 'Raio Celeste', clip: 'tormenta0', cooldown: 5, telegraph: 0.9, radius: 3.6, damage: 22, effects: { choque: { stacks: 2 } } } },
  },
];

// Acampamento e chefe do Porto das Origens (a ilha inicial do Primeiro Mar)
export const PORTO_CAMP = {
  enemy: { nome: 'Saqueador do Porto', look: L('#b9825c', '#2a1d14', '#a83a2a', '#2a3a55', '#3a2a20'), faixa: '#e8e0d0' },
  niveis: [8, 12, 16],
  boss: { nome: 'Capitão Ferrugem', nivel: 25, look: L('#a8714c', '#7a3a1a', '#8a4a2a', '#2a2a33', '#3a2a20'), faixa: '#b86a2a', cor: '#c87a3a', special: { nome: 'Âncora Enferrujada', clip: 'impacto2', cooldown: 6, telegraph: 1.0, radius: 3.4, damage: 14 } },
  local: { camp: [64, 26], boss: [68, 40] },
};

const PALETTES = {
  praia: { low: '#7aa058', high: '#93b678', sand: '#e6d39a', rock: '#9a9282' },
  floresta: { low: '#3f7a3e', high: '#5a8f4a', sand: '#d8c890', rock: '#6f746a' },
  deserto: { low: '#dcb878', high: '#e8c890', sand: '#ecd49c', rock: '#c48a52' },
  forte: { low: '#6c9a56', high: '#8bb06c', sand: '#e2cf98', rock: '#8d9088' },
  neve: { low: '#6c8a66', high: '#8a9a86', sand: '#d8d0b0', rock: '#7a808a', snow: '#f4f8fc' },
  cidade: { low: '#7aa85e', high: '#8bb06c', sand: '#e2cf98', rock: '#8d9088' },
  vulcao: { low: '#4a4040', high: '#3a3232', sand: '#5a4a44', rock: '#2e2828' },
  arena: { low: '#7a9a56', high: '#8bb06c', sand: '#d8c08a', rock: '#9a8a6a' },
  ceu: { low: '#8bc06a', high: '#a8d880', sand: '#f0e8c8', rock: '#e8e8f0' },
};
const PLATEAU = { praia: 2.2, floresta: 3, deserto: 2.8, forte: 3.6, neve: 3, cidade: 3.2, vulcao: 3, arena: 3, ceu: 3 };

// ===== Relevo =====
export function seaHeight(def) {
  const n1 = valueNoise2D(def.seed);
  const n2 = valueNoise2D(def.seed + 7);
  const R = def.R;
  const P = PLATEAU[def.biome];
  const coast = (x, z) => {
    const a = Math.atan2(z, x);
    return R * (1 + 0.1 * Math.sin(3 * a + def.seed) + 0.05 * Math.sin(5 * a + def.seed * 2)) + n1(x / 20, z / 20) * 5 - Math.hypot(x, z);
  };
  const feature = (x, z, r) => {
    switch (def.biome) {
      case 'praia': return 1.2 * n2(x / 14, z / 14);
      case 'floresta': return 3.5 * n1(x / 26 + 3, z / 26) + n2(x / 10, z / 10);
      case 'deserto': return 2.2 * Math.abs(Math.sin(x / 8 + n1(x / 30, z / 30) * 3)) + 1.2 * n2(x / 20, z / 20);
      case 'neve': return 34 * Math.pow(Math.max(0, 1 - r / (R * 0.68)), 1.6) + 1.5 * n1(x / 12, z / 12);
      case 'vulcao': {
        const cone = 26 * Math.pow(Math.max(0, 1 - r / (R * 0.82)), 1.3);
        return cone - 13 * (1 - smooth(5, 9, r)) + n2(x / 9, z / 9) * 0.8;
      }
      default: return 0.25 * n2(x / 16, z / 16);
    }
  };
  return (x, z) => {
    const t = coast(x, z);
    const r = Math.hypot(x, z);
    const base = t > 0 ? 0.6 + (P - 0.6) * smooth(0, 10, t) : 0.6 - 14 * smooth(0, 16, -t);
    return base + feature(x, z, r) * smooth(4, 16, t);
  };
}

// Lugares do acampamento e do chefe (coordenadas locais)
export function seaSpots(def) {
  const R = def.R;
  const a = def.campAngle;
  const camp = { x: Math.cos(a) * R * 0.45, z: Math.sin(a) * R * 0.45 };
  const central = def.biome === 'arena' || def.biome === 'forte';
  const boss = central ? { x: 0, z: 0 } : { x: Math.cos(a + Math.PI * 0.8) * R * 0.4, z: Math.sin(a + Math.PI * 0.8) * R * 0.4 };
  if (def.biome === 'neve') boss.x *= 1.2, boss.z *= 1.2;
  const enemies = [0, 1, 2, 3].map((k) => ({ x: camp.x + Math.cos(k * 1.6) * 5, z: camp.z + Math.sin(k * 1.6) * 5 }));
  // praia de chegada: lado da ilha voltado para a Ilha de Treino
  // (vem do mar aberto até a areia e entra 4 unidades: a costa varia com o ângulo, e
  // andar de dentro para fora pararia em lagos e baixios do interior)
  const toHome = Math.atan2(-def.z, -def.x);
  const h = seaHeight(def);
  let r = R * 1.5;
  while (r > 4 && h(Math.cos(toHome) * r, Math.sin(toHome) * r) < 0.8) r -= 0.5;
  r -= 4;
  const landing = { x: Math.cos(toHome) * r, z: Math.sin(toHome) * r, yaw: toHome + Math.PI };
  return { camp, boss, enemies, landing };
}

export const levelsFor = (def) => {
  const [a, b] = def.faixa;
  return [0, 1, 2, 3].map((k) => Math.round(a + ((b - a) * 0.8 * (k + 0.5)) / 4));
};

// ===== Construção =====
function colorFn(def, origin) {
  const pal = Object.fromEntries(Object.entries(PALETTES[def.biome]).map(([k, v]) => [k, new THREE.Color(v)]));
  const seabed = new THREE.Color('#76a291');
  const seabedDeep = new THREE.Color('#3c6669');
  const tmp = new THREE.Color();
  const R = def.R;
  return (x, y, z, up, out) => {
    if (y < -0.4) return out.copy(seabedDeep).lerp(seabed, smooth(-10, -0.4, y));
    const r = Math.hypot(x - origin.x, z - origin.z);
    out.copy(pal.low).lerp(pal.high, smooth(2, 14, y));
    const sandy = 1 - smooth(R - 14, R - 6, r);
    if (y < 3) out.lerp(pal.sand, Math.min(1, (1 - sandy) * 0.85 + (y < 1.2 ? 0.6 : 0)));
    if (pal.snow) out.lerp(pal.snow, smooth(9, 14, y));
    const rocky = smooth(0.8, 0.58, up);
    if (rocky > 0) out.lerp(tmp.copy(pal.rock), rocky);
    if (y < 0.2) out.lerp(seabed, smooth(0.2, -0.4, y));
    return out;
  };
}

export function buildSeaIsland({ scene, physics, def }) {
  const half = def.R + 32;
  const spacing = 2.4;
  const height = seaHeight(def);
  const field = new OffsetHeightfield({ half, spacing, height, ox: def.x, oz: def.z });
  const localField = new Heightfield({ half, spacing, height });
  const terrain = buildTerrain({ field, physics, colorAt: colorFn(def, def) });
  scene.add(terrain.group);
  const W = (lx, lz) => ({ x: def.x + lx, z: def.z + lz });
  const ground = (lx, lz) => field.sample(def.x + lx, def.z + lz);
  const sb = new StructureBuilder(scene, physics);
  const rand = mulberry32(def.seed * 101);
  const spots = seaSpots(def);
  const kit = natureKit();
  const trees = { broad: [], pine: [], palm: [], bush: [] };
  const keep = [spots.camp, spots.boss, spots.landing];
  const clear = (x, z, r) => keep.every((k) => Math.hypot(x - k.x, z - k.z) > r);
  const scatter = (list, n, rMin, rMax, scale, gap = 9) => {
    for (let k = 0; k < n * 3 && list.length < n; k++) {
      const a = rand() * Math.PI * 2;
      const d = rMin + rand() * (rMax - rMin);
      const lx = Math.cos(a) * d;
      const lz = Math.sin(a) * d;
      const y = ground(lx, lz);
      if (y < 1.6 || !clear(lx, lz, gap)) continue;
      const p = W(lx, lz);
      list.push({ x: p.x, y, z: p.z, rotY: rand() * 6.3, scale: scale * (0.9 + rand() * 0.25), tint: 0.9 + rand() * 0.2 });
    }
  };
  const R = def.R;
  let lava = null;
  switch (def.biome) {
    case 'praia': {
      scatter(trees.palm, 14, R - 14, R - 6, 1.25, 7);
      scatter(trees.bush, 12, 8, R - 16, 1);
      // acampamento pirata: tendas e caixotes; casco de navio encalhado
      const c = spots.camp;
      for (const [dx, dz] of [[-7, -4], [6, -6], [0, 8]]) {
        const p = W(c.x + dx, c.z + dz);
        sb.block({ x: p.x, y: ground(c.x + dx, c.z + dz), z: p.z, w: 4, h: 2.6, d: 3.4, rotY: dx, style: 'lonaRoxa' });
      }
      const s = W(-R * 0.5, R * 0.55);
      sb.block({ x: s.x, y: ground(-R * 0.5, R * 0.55) - 0.6, z: s.z, w: 4, h: 3, d: 12, rotY: 0.5, style: 'madeira' });
      sb.block({ x: s.x, y: ground(-R * 0.5, R * 0.55) + 2.4, z: s.z, w: 0.5, h: 6, d: 0.5, rotY: 0.5, style: 'madeira' });
      break;
    }
    case 'floresta': {
      scatter(trees.broad, 46, 8, R - 10, 2.2, 7);
      scatter(trees.bush, 20, 6, R - 8, 1.2);
      // ruínas de pedra
      for (let k = 0; k < 6; k++) {
        const a = k * 1.05;
        const p = W(Math.cos(a) * 18, Math.sin(a) * 18);
        sb.block({ x: p.x, y: ground(Math.cos(a) * 18, Math.sin(a) * 18) - 0.3, z: p.z, w: 1.6, h: 4 + (k % 3) * 1.5, d: 1.6, style: 'pedraLisa' });
      }
      break;
    }
    case 'deserto': {
      const cacti = [];
      scatter(cacti, 22, 8, R - 10, 1, 6);
      for (const c of cacti) {
        sb.block({ x: c.x, y: c.y - 0.2, z: c.z, w: 0.7, h: 3.2 * c.scale, d: 0.7, style: 'cacto' });
        sb.block({ x: c.x + 0.6, y: c.y + 1.2, z: c.z, w: 0.5, h: 1.3, d: 0.5, style: 'cacto' });
      }
      // cidade de arenito em ruínas
      for (let k = 0; k < 8; k++) {
        const a = k * 0.78 + 0.3;
        const lx = Math.cos(a) * 12;
        const lz = Math.sin(a) * 12;
        const p = W(lx, lz);
        sb.block({ x: p.x, y: ground(lx, lz) - 0.3, z: p.z, w: 5, h: 2 + (k % 3) * 1.8, d: 4, rotY: a, style: 'arenito' });
      }
      break;
    }
    case 'forte': {
      // muralha quadrada com portão voltado para a praia de chegada, torres nos cantos
      const S = 22;
      const g = spots.landing;
      const gateSide = Math.abs(g.x) > Math.abs(g.z) ? (g.x > 0 ? 'x+' : 'x-') : g.z > 0 ? 'z+' : 'z-';
      const base = ground(0, 0);
      for (const side of ['x+', 'x-', 'z+', 'z-']) {
        for (let k = -S; k <= S; k += 4) {
          if (side === gateSide && Math.abs(k) < 5) continue;
          const lx = side === 'x+' ? S : side === 'x-' ? -S : k;
          const lz = side === 'z+' ? S : side === 'z-' ? -S : k;
          const p = W(lx, lz);
          sb.block({ x: p.x, y: base - 0.5, z: p.z, w: 4, h: 6, d: 4, style: 'muro' });
        }
      }
      for (const [lx, lz] of [[S, S], [S, -S], [-S, S], [-S, -S]]) {
        const p = W(lx, lz);
        sb.block({ x: p.x, y: base - 0.5, z: p.z, w: 6, h: 10, d: 6, style: 'muro' });
      }
      const q = W(-8, -8);
      sb.block({ x: q.x, y: base, z: q.z, w: 8, h: 4.5, d: 5, style: 'muro' }); // quartel
      scatter(trees.broad, 10, S + 8, R - 8, 1.8, 6);
      break;
    }
    case 'neve': {
      scatter(trees.pine, 30, 10, R - 8, 1.7, 6);
      for (let k = 0; k < 10; k++) {
        const a = rand() * 6.3;
        const d = 14 + rand() * (R - 24);
        const lx = Math.cos(a) * d;
        const lz = Math.sin(a) * d;
        if (!clear(lx, lz, 7)) continue;
        const p = W(lx, lz);
        sb.block({ x: p.x, y: ground(lx, lz) - 0.3, z: p.z, w: 1.1, h: 2.5 + rand() * 3, d: 1.1, rotY: a, style: 'gelo' });
      }
      break;
    }
    case 'cidade': {
      // vila pequena gerada pela semente, só as fachadas (casas fechadas)
      const v = generateVillage({ seed: def.seed, radius: 34, plaza: 8, dockAngle: Math.atan2(spots.landing.z, spots.landing.x) });
      const base = PLATEAU.cidade;
      for (const s of v.streets) {
        const p = W((s.a[0] + s.b[0]) / 2, (s.a[1] + s.b[1]) / 2);
        sb.block({ x: p.x, y: base - 0.1, z: p.z, w: s.w, h: 0.2, d: Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]) + 1, rotY: Math.atan2(s.b[0] - s.a[0], s.b[1] - s.a[1]), style: 'caminho' });
      }
      for (const b of v.buildings) {
        const p = W(b.x, b.z);
        sb.block({ x: p.x, y: base, z: p.z, w: b.w, h: b.h, d: b.d, rotY: b.rotY, style: b.parede });
        sb.block({ x: p.x, y: base + b.h, z: p.z, w: b.w + 1, h: 0.8, d: b.d + 1, rotY: b.rotY, style: b.telhado });
        sb.block({ x: p.x, y: base + b.h + 0.8, z: p.z, w: b.w - 1.5, h: 0.7, d: b.d - 2, rotY: b.rotY, style: b.telhado });
      }
      for (const pr of v.props) {
        const p = W(pr.x, pr.z);
        sb.block({ x: p.x, y: base, z: p.z, w: 0.3, h: 3.6, d: 0.3, style: 'madeira' });
        sb.block({ x: p.x, y: base + 3.6, z: p.z, w: 0.6, h: 0.6, d: 0.6, style: 'lanterna' });
      }
      scatter(trees.palm, 10, R - 14, R - 6, 1.2, 6);
      break;
    }
    case 'vulcao': {
      // lago de lava na cratera (queima quem entra) e rochas escuras
      const top = ground(0, 0);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(7.5, 24), new THREE.MeshStandardMaterial({ color: '#ff6a1a', emissive: '#ff4a10', emissiveIntensity: 1.4, roughness: 0.6 }));
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(def.x, top + 0.5, def.z);
      disc.name = 'lava';
      scene.add(disc);
      lava = { x: def.x, z: def.z, r: 7.5, y: top + 0.5 };
      for (let k = 0; k < 14; k++) {
        const a = rand() * 6.3;
        const d = 16 + rand() * (R - 26);
        const lx = Math.cos(a) * d;
        const lz = Math.sin(a) * d;
        if (!clear(lx, lz, 7)) continue;
        const p = W(lx, lz);
        sb.block({ x: p.x, y: ground(lx, lz) - 0.4, z: p.z, w: 1.8 + rand() * 2, h: 1.2 + rand() * 2, d: 1.8 + rand() * 2, rotY: a, style: 'rochaEscura' });
      }
      // forjas do acampamento
      const c = spots.camp;
      for (const [dx, dz] of [[-6, 3], [5, -5]]) {
        const p = W(c.x + dx, c.z + dz);
        sb.block({ x: p.x, y: ground(c.x + dx, c.z + dz) - 0.2, z: p.z, w: 2, h: 1.6, d: 2, style: 'tijolo' });
        sb.block({ x: p.x, y: ground(c.x + dx, c.z + dz) + 1.4, z: p.z, w: 1.2, h: 0.3, d: 1.2, style: 'lava' });
      }
      break;
    }
    case 'arena': {
      // coliseu partido: anel de muralha com arquibancada e brechas
      const base = ground(0, 0);
      for (let k = 0; k < 36; k++) {
        if (k % 9 === 4 || k === 13) continue; // brechas (uma é a entrada)
        const a = (k / 36) * Math.PI * 2;
        const p = W(Math.cos(a) * 24, Math.sin(a) * 24);
        sb.block({ x: p.x, y: base - 0.5, z: p.z, w: 4.4, h: 7 - (k % 5 === 0 ? 3 : 0), d: 1.6, rotY: Math.PI / 2 - a, style: 'arenito' });
        const q = W(Math.cos(a) * 26.5, Math.sin(a) * 26.5);
        sb.block({ x: q.x, y: base - 0.5, z: q.z, w: 4.6, h: 4, d: 2.4, rotY: Math.PI / 2 - a, style: 'arenito' });
      }
      scatter(trees.palm, 8, R - 14, R - 6, 1.2, 6);
      break;
    }
    case 'ceu': {
      // plataformas flutuantes em espiral (desafio de saltos e planar)
      for (let k = 0; k < 8; k++) {
        const a = k * 0.9;
        const d = 10 + k * 1.6;
        const lx = Math.cos(a) * d;
        const lz = Math.sin(a) * d;
        const p = W(lx, lz);
        const y = ground(lx, lz) + 4 + k * 3.2;
        sb.block({ x: p.x, y, z: p.z, w: 5, h: 1.2, d: 5, rotY: a, style: 'pedraLisa' });
        sb.block({ x: p.x, y: y - 1.6, z: p.z, w: 3, h: 1.6, d: 3, rotY: a + 0.5, style: 'pedraLisa' });
      }
      scatter(trees.broad, 10, 8, R - 8, 1.7, 7);
      break;
    }
    default:
  }
  // placa de chegada (nome, faixa de nível e chefe)
  // ao lado do caminho, para não ficar no lugar onde o jogador desce
  const g = spots.landing;
  const sx = g.x - Math.sin(g.yaw) * 3.5;
  const sz = g.z + Math.cos(g.yaw) * 3.5;
  const gp = W(sx, sz);
  sb.sign({ x: gp.x, y: ground(sx, sz), z: gp.z, rotY: g.yaw, title: def.nome, hint: `Nv. ${def.faixa[0]}–${def.faixa[1]} · Chefe: ${def.boss.nome}` });
  sb.finish();
  if (def.biome === 'vulcao') {
    const lavaMesh = sb.group.getObjectByName('estruturas_lava');
    if (lavaMesh) {
      lavaMesh.material.emissive = new THREE.Color('#ff4a10');
      lavaMesh.material.emissiveIntensity = 1.2;
    }
  }
  placeInstances(scene, `${def.id}-arvores`, kit.broad[def.seed % 3], trees.broad);
  placeInstances(scene, `${def.id}-pinheiros`, kit.pine, trees.pine, { tint: def.biome === 'neve' ? '#e8f0f4' : null });
  placeInstances(scene, `${def.id}-coqueiros`, kit.palm.geo, trees.palm);
  placeInstances(scene, `${def.id}-arbustos`, kit.bush[0], trees.bush, { shadow: false });
  for (const t of [...trees.broad, ...trees.pine]) physics.addCylinder({ x: t.x, y: t.y + 1.9 * t.scale, z: t.z }, 1.9 * t.scale, 0.3 * t.scale, { climbable: true, material: 'madeira' });
  for (const t of trees.palm) physics.addCylinder({ x: t.x, y: t.y + kit.palm.height * t.scale * 0.4, z: t.z }, kit.palm.height * t.scale * 0.4, 0.3, { climbable: true, material: 'madeira' });
  const toWorld = (p) => ({ ...W(p.x, p.z) });
  return {
    def, field, localField, signs: sb.signs, lava,
    enemies: spots.enemies.map(toWorld), boss: toWorld(spots.boss), landing: { ...toWorld(spots.landing), yaw: spots.landing.yaw },
  };
}
