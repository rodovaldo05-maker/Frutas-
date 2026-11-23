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
import { DUNGEON } from './islandRules.js';
import { ENIGMA } from './thirdSea.js';

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
  // Segundo Mar (atualização 17)
  selva: { low: '#2f7a3a', high: '#4a9a42', sand: '#e0d29a', rock: '#5a6a5a' },
  granito: { low: '#6a8a5a', high: '#7a9068', sand: '#d8cca0', rock: '#8a8a90' },
  // atualização 27
  geleira: { low: '#dce8f0', high: '#f2f8fc', sand: '#c8d8e2', rock: '#8aa8bc' },
  ruinas: { low: '#a8945a', high: '#bca86a', sand: '#e8d4a0', rock: '#c89a5a' },
  noturno: { low: '#1f3a34', high: '#29473c', sand: '#4a5a52', rock: '#343c44' },
  bastiao: { low: '#3a3236', high: '#2e282c', sand: '#4a3e3c', rock: '#241e22' },
  masmorra: { low: '#4e4e54', high: '#58585e', sand: '#7a7468', rock: '#3a3a40' },
  // Terceiro Mar (atualização 28)
  santuario: { low: '#5f7a5a', high: '#7a8a6a', sand: '#cfc29a', rock: '#6a6a70' },
  tempestade: { low: '#3e4a4e', high: '#4a565a', sand: '#8a8a80', rock: '#2e3438' },
  fortaleza: { low: '#6a7a5a', high: '#788a64', sand: '#d2c69a', rock: '#7a7a80' },
  ossos: { low: '#8a9a7a', high: '#a0a88a', sand: '#e8e0c8', rock: '#c8c0a8' },
  aurora: { low: '#d8ccaa', high: '#ece0c0', sand: '#f4ecd4', rock: '#e0c890' },
  oculta: { low: '#3a2a5a', high: '#4a3a6a', sand: '#8a7aa0', rock: '#2a2040' },
};
const PLATEAU = { praia: 2.2, floresta: 3, deserto: 2.8, forte: 3.6, neve: 3, cidade: 3.2, vulcao: 3, arena: 3, ceu: 3, selva: 3.4, granito: 4, geleira: 2.4, ruinas: 3.2, noturno: 3, bastiao: 3, masmorra: 4, santuario: 3, tempestade: 3, fortaleza: 4, ossos: 2.6, aurora: 3.4, oculta: 3.2 };

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
      // selva: morro no meio com penhasco da cachoeira
      case 'selva': return 9 * Math.pow(Math.max(0, 1 - r / (R * 0.55)), 1.4) + 2.5 * n1(x / 18, z / 18) + n2(x / 9, z / 9);
      case 'granito': return 0.4 * n2(x / 16, z / 16);
      case 'masmorra': return 0.15 * n2(x / 16, z / 16);
      // Terceiro Mar
      case 'fortaleza': return 0.3 * n2(x / 16, z / 16);
      case 'santuario': {
        // cinco agulhas de pedra (os ninhos ficam em volta delas)
        let h = 2 * n1(x / 20, z / 20);
        for (let k = 0; k < 5; k++) {
          const a = k * 1.256 + def.seed;
          const d = Math.hypot(x - Math.cos(a) * R * 0.45, z - Math.sin(a) * R * 0.45);
          h += 15 * Math.pow(Math.max(0, 1 - d / 7), 1.5);
        }
        return h;
      }
      case 'tempestade': return 1.6 * n1(x / 18, z / 18) + 0.6 * n2(x / 7, z / 7);
      case 'ossos': {
        // ilhotas: três canais de água cortam a ilha a partir do meio
        let cut = 0;
        if (r > 13) for (let k = 0; k < 3; k++) {
          const a = k * 2.094 + 1.2;
          const side = Math.abs(x * Math.sin(a) - z * Math.cos(a));
          const ahead = x * Math.cos(a) + z * Math.sin(a);
          if (ahead > 0) cut = Math.max(cut, 1 - smooth(2.5, 6, side));
        }
        return 0.8 * n2(x / 12, z / 12) - (P + 4) * cut;
      }
      case 'aurora': return 6 * Math.pow(Math.max(0, 1 - r / (R * 0.4)), 1.2) + 0.5 * n2(x / 14, z / 14);
      case 'oculta': return 12 * Math.pow(Math.max(0, 1 - r / (R * 0.5)), 1.4) + 2 * n1(x / 16, z / 16);
      // geleira: placa de gelo com cristas baixas
      case 'geleira': return 1.4 * Math.abs(n1(x / 22, z / 22)) + 0.4 * n2(x / 8, z / 8);
      case 'ruinas': return 0.9 * n2(x / 14, z / 14) + 0.6 * n1(x / 30, z / 30);
      case 'noturno': return 3 * n1(x / 24 + 5, z / 24) + n2(x / 10, z / 10);
      case 'bastiao': {
        const cone = 30 * Math.pow(Math.max(0, 1 - r / (R * 0.75)), 1.3);
        return cone - 14 * (1 - smooth(5, 9, r)) + n2(x / 9, z / 9) * 0.8;
      }
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
  const campR = def.biome === 'fortaleza' ? 0.4 : 0.45; // entre as duas muralhas
  const camp = { x: Math.cos(a) * R * campR, z: Math.sin(a) * R * campR };
  const central = def.biome === 'arena' || def.biome === 'forte' || def.biome === 'fortaleza';
  const boss = central ? { x: 0, z: 0 } : { x: Math.cos(a + Math.PI * 0.8) * R * 0.4, z: Math.sin(a + Math.PI * 0.8) * R * 0.4 };
  if (def.biome === 'neve') boss.x *= 1.2, boss.z *= 1.2;
  const spread = def.biome === 'fortaleza' ? 2.2 : 5;
  let enemies = [0, 1, 2, 3].map((k) => ({ x: camp.x + Math.cos(k * 1.6) * spread, z: camp.z + Math.sin(k * 1.6) * spread }));
  // praia de chegada: lado da ilha voltado para a Ilha de Treino
  // (vem do mar aberto até a areia e entra 4 unidades: a costa varia com o ângulo, e
  // andar de dentro para fora pararia em lagos e baixios do interior)
  const toHome = Math.atan2((def.home?.z ?? 0) - def.z, (def.home?.x ?? 0) - def.x);
  const h = seaHeight(def);
  let r = R * 1.5;
  while (r > 4 && h(Math.cos(toHome) * r, Math.sin(toHome) * r) < 0.8) r -= 0.5;
  r -= 4;
  const landing = { x: Math.cos(toHome) * r, z: Math.sin(toHome) * r, yaw: toHome + Math.PI };
  if (def.biome === 'masmorra') {
    // inimigos nos andares (longe das portas) e o chefe na cela do meio
    const dungeon = dungeonLayout(landing);
    enemies = dungeon.guards;
    return { camp: enemies[0], boss: { x: 0, z: 0 }, enemies, landing, dungeon };
  }
  return { camp, boss, enemies, landing };
}

// ===== Masmorra do Abismo: quatro muralhas quadradas, portas alternadas, altares e espinhos =====
const SIDES = ['x+', 'z+', 'x-', 'z-'];
const sidePoint = (side, d, t) => (side === 'x+' ? { x: d, z: t } : side === 'x-' ? { x: -d, z: t } : side === 'z+' ? { x: t, z: d } : { x: t, z: -d });
const sideOf = (p) => (Math.abs(p.x) > Math.abs(p.z) ? (p.x > 0 ? 'x+' : 'x-') : p.z > 0 ? 'z+' : 'z-');
export function dungeonLayout(landing) {
  const rings = DUNGEON.rings;
  const i0 = SIDES.indexOf(sideOf(landing));
  const side = (k) => SIDES[(((i0 + k) % 4) + 4) % 4];
  // a porta da muralha k fica num lado; a do andar seguinte, no lado oposto (anda em volta)
  const doors = rings.map((S, k) => {
    const sd = side(2 * k);
    return { ...sidePoint(sd, S, 0), side: sd, rotY: sd[0] === 'x' ? Math.PI / 2 : 0 };
  });
  const mids = rings.slice(0, -1).map((S, k) => (S + rings[k + 1]) / 2);
  const altars = mids.map((d, k) => sidePoint(side(2 * k + 1), d, 0));
  const spikes = [];
  mids.forEach((d, k) => {
    for (const sd of [side(2 * k + 1), side(2 * k + 3)]) for (const t of [-0.55 * d, 0.55 * d]) for (const o of [-1.4, 1.4]) {
      spikes.push({ ...sidePoint(sd, d + o, t), offset: spikes.length * 0.37 });
    }
  });
  const guards = [sidePoint(side(3), mids[0], 0), sidePoint(side(2), mids[0], mids[0] * 0.4), sidePoint(side(5), mids[1], 0), sidePoint(side(7), mids[2], 0)];
  return { rings, doors, altars, spikes, guards };
}

export const levelsFor = (def) => {
  const [a, b] = def.faixa;
  return [0, 1, 2, 3].map((k) => Math.round(a + ((b - a) * 0.8 * (k + 0.5)) / 4));
};

// junta duas geometrias simples (cogumelo: pé e chapéu) numa só
function mergeTwo(a, b) {
  const out = new THREE.BufferGeometry();
  const na = a.toNonIndexed();
  const nb = b.toNonIndexed();
  for (const k of ['position', 'normal']) {
    const x = na.getAttribute(k).array;
    const y = nb.getAttribute(k).array;
    const arr = new Float32Array(x.length + y.length);
    arr.set(x);
    arr.set(y, x.length);
    out.setAttribute(k, new THREE.BufferAttribute(arr, 3));
  }
  return out;
}

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
  const before = new Set(scene.children); // para esconder a ilha inteira (Ilha Oculta)
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
  const lavas = [];
  let extra = null; // dados dos acontecimentos da ilha (src/world/islandEvents.js)
  const lavaDisc = (lx, lz, r, y) => {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 24), new THREE.MeshStandardMaterial({ color: '#ff6a1a', emissive: '#ff4a10', emissiveIntensity: 1.4, roughness: 0.6 }));
    disc.rotation.x = -Math.PI / 2;
    const p = W(lx, lz);
    disc.position.set(p.x, y, p.z);
    disc.name = 'lava';
    scene.add(disc);
    lavas.push({ x: p.x, z: p.z, r, y });
  };
  switch (def.biome) {
    case 'geleira': {
      // placa de gelo: navios presos no gelo, espinhos de gelo, poucos pinheiros e fogueiras
      scatter(trees.pine, 12, 12, R - 10, 1.5, 8);
      const fires = [];
      for (let k = 0; k < 3; k++) {
        const a = def.campAngle + 1.3 + k * 1.5;
        const lx = Math.cos(a) * R * 0.55;
        const lz = Math.sin(a) * R * 0.55;
        if (!clear(lx, lz, 8)) continue;
        const p = W(lx, lz);
        const y = ground(lx, lz);
        // casco inclinado meio afundado no gelo, mastro quebrado e vela rasgada
        sb.block({ x: p.x, y: y - 1.2, z: p.z, w: 4.2, h: 3, d: 13, rotY: a, style: 'madeira' });
        sb.block({ x: p.x, y: y + 1.6, z: p.z, w: 0.5, h: 5 + k, d: 0.5, rotY: a, style: 'madeira' });
        sb.block({ x: p.x + Math.sin(a) * 0.4, y: y + 3.4, z: p.z + Math.cos(a) * 0.4, w: 3.2, h: 2, d: 0.12, rotY: a + 0.3, style: 'cobertor' });
        const fx = lx + Math.cos(a + Math.PI / 2) * 6;
        const fz = lz + Math.sin(a + Math.PI / 2) * 6;
        const fp = W(fx, fz);
        const fy = ground(fx, fz);
        for (let j = 0; j < 6; j++) sb.block({ x: fp.x + Math.cos(j) * 1.1, y: fy - 0.2, z: fp.z + Math.sin(j) * 1.1, w: 0.6, h: 0.5, d: 0.6, rotY: j, style: 'rochaEscura' });
        sb.block({ x: fp.x, y: fy - 0.1, z: fp.z, w: 1.4, h: 0.3, d: 0.4, rotY: 0.6, style: 'madeira' });
        fires.push({ x: fp.x, y: fy, z: fp.z });
      }
      // fogueira logo na praia de chegada
      const l = spots.landing;
      const li = { x: l.x * 0.82, z: l.z * 0.82 };
      const lp = W(li.x + Math.sin(l.yaw) * 4, li.z - Math.cos(l.yaw) * 4);
      fires.push({ x: lp.x, y: field.sample(lp.x, lp.z), z: lp.z });
      for (let k = 0; k < 14; k++) {
        const a = rand() * 6.3;
        const d = 12 + rand() * (R - 22);
        const lx = Math.cos(a) * d;
        const lz = Math.sin(a) * d;
        if (!clear(lx, lz, 7)) continue;
        const p = W(lx, lz);
        sb.block({ x: p.x, y: ground(lx, lz) - 0.3, z: p.z, w: 1 + rand(), h: 2 + rand() * 4, d: 1 + rand(), rotY: a, style: 'gelo' });
      }
      extra = { fires };
      break;
    }
    case 'ruinas': {
      // pilar do sol no meio, quatro espelhos em volta e a câmara secreta (porta fechada)
      const a0 = def.campAngle + Math.PI;
      const sun = { x: 0, z: 0 };
      const sp = W(0, 0);
      const sy = ground(0, 0);
      sb.block({ x: sp.x, y: sy - 0.3, z: sp.z, w: 2.4, h: 1.4, d: 2.4, style: 'arenito' });
      sb.block({ x: sp.x, y: sy + 1.1, z: sp.z, w: 1, h: 0.8, d: 1, style: 'lanterna' });
      for (let k = 0; k < 4; k++) sb.block({ x: sp.x + Math.cos(k * 1.57 + 0.78) * 3, y: sy - 0.3, z: sp.z + Math.sin(k * 1.57 + 0.78) * 3, w: 0.9, h: 6 - k, d: 0.9, style: 'pedraLisa' });
      const local = [];
      for (let i = 0; i < 4; i++) {
        const a = a0 + i * 1.2;
        const d = i % 2 ? 16 : 12;
        local.push({ x: Math.cos(a) * d, z: Math.sin(a) * d });
      }
      // câmara: sala de arenito virada para o último espelho
      const ca = a0 + 4.6;
      const C = { x: Math.cos(ca) * 26, z: Math.sin(ca) * 26 };
      const last = local[3];
      const fl = Math.hypot(last.x - C.x, last.z - C.z);
      const f = { x: (last.x - C.x) / fl, z: (last.z - C.z) / fl };
      const pp = { x: f.z, z: -f.x };
      const phi = Math.atan2(f.x, f.z);
      const cy = ground(C.x, C.z);
      const wall = (ox, oz, w, d) => {
        const p = W(C.x + ox, C.z + oz);
        sb.block({ x: p.x, y: cy - 0.4, z: p.z, w, h: 4.8, d, rotY: phi, style: 'arenito' });
      };
      wall(-f.x * 4, -f.z * 4, 9, 1); // fundo
      wall(pp.x * 4, pp.z * 4, 1, 9);
      wall(-pp.x * 4, -pp.z * 4, 1, 9);
      wall(f.x * 4 + pp.x * 3.25, f.z * 4 + pp.z * 3.25, 2.5, 1);
      wall(f.x * 4 - pp.x * 3.25, f.z * 4 - pp.z * 3.25, 2.5, 1);
      const roof = W(C.x, C.z);
      sb.block({ x: roof.x, y: cy + 4.4, z: roof.z, w: 9.6, h: 0.8, d: 9.6, rotY: phi, style: 'arenito' });
      // colunas quebradas espalhadas
      for (let k = 0; k < 12; k++) {
        const a = rand() * 6.3;
        const d = 20 + rand() * (R - 30);
        const lx = Math.cos(a) * d;
        const lz = Math.sin(a) * d;
        if (!clear(lx, lz, 7) || Math.hypot(lx - C.x, lz - C.z) < 9) continue;
        const p = W(lx, lz);
        sb.block({ x: p.x, y: ground(lx, lz) - 0.3, z: p.z, w: 1.2, h: 1.5 + rand() * 4.5, d: 1.2, style: 'pedraLisa' });
      }
      scatter(trees.palm, 10, R - 14, R - 6, 1.2, 6);
      scatter(trees.bush, 12, 30, R - 8, 1);
      const at = (p) => ({ ...W(p.x, p.z), y: ground(p.x, p.z) });
      const altar = at({ x: C.x - f.x * 1.5, z: C.z - f.z * 1.5 });
      const mirrors = local.map((m, i) => ({ ...at(m), next: i < 3 ? W(local[i + 1].x, local[i + 1].z) : { x: altar.x, z: altar.z } }));
      extra = {
        puzzle: {
          sun: at(sun), mirrors, altar,
          chamber: { door: { ...at({ x: C.x + f.x * 4, z: C.z + f.z * 4 }), y: cy - 0.4, rotY: phi }, chest: at({ x: C.x - f.x * 2.2, z: C.z - f.z * 2.2 }) },
        },
      };
      break;
    }
    case 'noturno': {
      // floresta escura, cogumelos que brilham e ecos ilusórios
      scatter(trees.broad, 40, 8, R - 10, 2.3, 6);
      scatter(trees.bush, 22, 6, R - 8, 1.2);
      const caps = [];
      scatter(caps, 46, 6, R - 8, 1, 3);
      const geo = new THREE.CylinderGeometry(0.5, 0.15, 0.7, 6).translate(0, 0.35, 0);
      const cap = new THREE.SphereGeometry(0.75, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 0.65, 0);
      const mushGeo = mergeTwo(geo, cap);
      const mesh = new THREE.InstancedMesh(mushGeo, new THREE.MeshStandardMaterial({ color: '#7fe0ff', emissive: '#3ab8ff', emissiveIntensity: 1.3, roughness: 0.5 }), caps.length);
      const m4 = new THREE.Matrix4();
      const tint = new THREE.Color();
      caps.forEach((c, i) => {
        m4.makeRotationY(c.rotY).scale(new THREE.Vector3(c.scale, c.scale, c.scale)).setPosition(c.x, c.y - 0.05, c.z);
        mesh.setMatrixAt(i, m4);
        mesh.setColorAt(i, tint.set(i % 3 ? '#7fe0ff' : '#d08aff'));
      });
      mesh.name = `${def.id}-cogumelos`;
      scene.add(mesh);
      const echoes = [];
      for (let k = 0; k < 5; k++) {
        const a = def.campAngle + 1 + k * 1.1;
        const d = 18 + (k % 2) * 10;
        const lx = Math.cos(a) * d;
        const lz = Math.sin(a) * d;
        echoes.push({ ...W(lx, lz), y: ground(lx, lz) });
      }
      extra = { echoes };
      break;
    }
    case 'bastiao': {
      // vulcão ativo: cratera de lava, duas cavernas de magma com poças e rochas
      const top = ground(0, 0);
      lavaDisc(0, 0, 8, top + 0.5);
      for (const k of [0, 1]) {
        const a = def.campAngle + 2 + k * 2.2;
        const lx = Math.cos(a) * R * 0.62;
        const lz = Math.sin(a) * R * 0.62;
        const y = ground(lx, lz);
        lavaDisc(lx, lz, 3.5, y + 0.15);
        // arco de rocha da caverna sobre a poça
        const p = W(lx, lz);
        const s = { x: Math.sin(a), z: Math.cos(a) };
        for (const o of [-1, 1]) sb.block({ x: p.x + s.z * o * 4.6, y: y - 0.3, z: p.z - s.x * o * 4.6, w: 2.2, h: 6, d: 4, rotY: a, style: 'rochaEscura' });
        sb.block({ x: p.x, y: y + 5.4, z: p.z, w: 11, h: 1.8, d: 5, rotY: Math.PI / 2 - a, style: 'rochaEscura' });
      }
      for (let k = 0; k < 16; k++) {
        const a = rand() * 6.3;
        const d = 16 + rand() * (R - 26);
        const lx = Math.cos(a) * d;
        const lz = Math.sin(a) * d;
        if (!clear(lx, lz, 7) || lavas.some((l) => Math.hypot(def.x + lx - l.x, def.z + lz - l.z) < l.r + 5)) continue;
        const p = W(lx, lz);
        sb.block({ x: p.x, y: ground(lx, lz) - 0.4, z: p.z, w: 1.8 + rand() * 2, h: 1.2 + rand() * 2.4, d: 1.8 + rand() * 2, rotY: a, style: 'rochaEscura' });
      }
      extra = { crater: { ...W(0, 0), y: top } };
      break;
    }
    case 'masmorra': {
      // quatro muralhas quadradas (paredes finas), pilares nos cantos; as portas com grade,
      // as chaves e os espinhos são montados em islandEvents.js
      const dg = spots.dungeon;
      const base = ground(0, 0);
      dg.rings.forEach((S, k) => {
        const h = 7 + k;
        for (const side of ['x+', 'x-', 'z+', 'z-']) {
          for (let t = -S; t <= S; t += 4) {
            if (side === dg.doors[k].side && Math.abs(t) < 5) continue;
            const q = sidePoint(side, S, t);
            const p = W(q.x, q.z);
            sb.block({ x: p.x, y: base - 0.5, z: p.z, w: 4.2, h, d: 2, rotY: side[0] === 'x' ? Math.PI / 2 : 0, style: 'rochaEscura' });
          }
        }
        for (const [cx, cz] of [[S, S], [S, -S], [-S, S], [-S, -S]]) {
          const p = W(cx, cz);
          sb.block({ x: p.x, y: base - 0.5, z: p.z, w: 3, h: h + 2, d: 3, style: 'pedra' });
        }
      });
      // chão de pedra dentro da muralha de fora e tochas nas portas
      const fl = W(0, 0);
      sb.block({ x: fl.x, y: base - 0.2, z: fl.z, w: dg.rings[0] * 2, h: 0.5, d: dg.rings[0] * 2, style: 'caminho' });
      for (const d of dg.doors) for (const o of [-4.6, 4.6]) {
        const q = d.side[0] === 'x' ? { x: d.x, z: d.z + o } : { x: d.x + o, z: d.z };
        const p = W(q.x, q.z);
        sb.block({ x: p.x, y: base + 4, z: p.z, w: 0.5, h: 0.5, d: 0.5, style: 'lanterna' });
      }
      scatter(trees.pine, 8, dg.rings[0] + 10, R - 6, 1.4, 6);
      const at = (p) => ({ ...W(p.x, p.z), y: base + 0.3 }); // em cima do chão de pedra
      extra = { dungeon: { doors: dg.doors.map((d) => ({ ...at(d), rotY: d.rotY })), altars: dg.altars.map(at), spikes: dg.spikes.map((s) => ({ ...at(s), offset: s.offset })) } };
      break;
    }
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
    case 'granito':
    case 'fortaleza':
    case 'forte': {
      // muralha quadrada com portão voltado para a praia de chegada, torres nos cantos
      // (a Cidadela de Granito tem muralhas em camadas: def.walls)
      const g = spots.landing;
      const gateSide = Math.abs(g.x) > Math.abs(g.z) ? (g.x > 0 ? 'x+' : 'x-') : g.z > 0 ? 'z+' : 'z-';
      const base = ground(0, 0);
      const style = def.biome === 'granito' ? 'pedraLisa' : def.biome === 'fortaleza' ? 'rochaEscura' : 'muro';
      const walls = def.walls ?? [22];
      for (const [wi, S] of walls.entries()) for (const side of ['x+', 'x-', 'z+', 'z-']) {
        for (let k = -S; k <= S; k += 4) {
          if (side === gateSide && Math.abs(k) < 5) continue;
          const lx = side === 'x+' ? S : side === 'x-' ? -S : k;
          const lz = side === 'z+' ? S : side === 'z-' ? -S : k;
          const p = W(lx, lz);
          sb.block({ x: p.x, y: base - 0.5, z: p.z, w: 4, h: 6 + wi * 3, d: 4, style });
        }
      }
      for (const [wi, S] of walls.entries()) for (const [lx, lz] of [[S, S], [S, -S], [-S, S], [-S, -S]]) {
        const p = W(lx, lz);
        sb.block({ x: p.x, y: base - 0.5, z: p.z, w: 6, h: 10 + wi * 4, d: 6, style });
      }
      const q = W(-8, -8);
      sb.block({ x: q.x, y: base, z: q.z, w: 8, h: 4.5, d: 5, style }); // quartel
      if (def.biome === 'fortaleza') {
        // canhões gigantes nas quinas da muralha de dentro, apontando para fora
        const S = walls[0];
        for (const [ox, oz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const p = W(ox * S, oz * S);
          const yaw = Math.atan2(ox, oz);
          sb.block({ x: p.x, y: base + 9.5, z: p.z, w: 3, h: 1.2, d: 3, style: 'madeira' });
          sb.block({ x: p.x + Math.sin(yaw) * 2, y: base + 10.7, z: p.z + Math.cos(yaw) * 2, w: 1.6, h: 1.6, d: 6, rotY: yaw, style: 'rochaEscura' });
        }
        extra = { barrage: 'fortaleza' };
      }
      if (def.biome === 'granito') {
        // torre de menagem no centro e catapultas nos cantos de dentro
        const k = W(0, 6);
        sb.block({ x: k.x, y: base - 0.5, z: k.z, w: 7, h: 16, d: 7, style });
        for (const [lx, lz] of [[12, 12], [-12, 12]]) {
          const p = W(lx, lz);
          sb.block({ x: p.x, y: base, z: p.z, w: 2.4, h: 0.8, d: 3.2, style: 'madeira' });
          sb.block({ x: p.x, y: base + 0.8, z: p.z, w: 0.3, h: 3, d: 0.3, rotY: 0.4, style: 'madeira' });
        }
      }
      scatter(trees.broad, 10, walls.at(-1) + 8, R - 8, 1.8, 6);
      break;
    }
    case 'selva': {
      // selva: árvores grandes e coqueiros, cachoeira descendo do morro e templo em ruínas
      scatter(trees.broad, 34, 10, R - 10, 2.1, 6);
      scatter(trees.palm, 12, R - 16, R - 6, 1.3, 6);
      scatter(trees.bush, 24, 6, R - 8, 1.3);
      const fa = (def.fallAngle ?? 1.2);
      for (let k = 0; k < 6; k++) {
        const d = 8 + k * 3.2;
        const lx = Math.cos(fa) * d;
        const lz = Math.sin(fa) * d;
        const p = W(lx, lz);
        const y = ground(lx, lz);
        sb.block({ x: p.x, y: y - 0.4, z: p.z, w: 2.6, h: 0.6, d: 3.4, rotY: Math.PI / 2 - fa, style: 'agua' });
      }
      const t = W(Math.cos(fa + 2.4) * 20, Math.sin(fa + 2.4) * 20);
      const ty = ground(Math.cos(fa + 2.4) * 20, Math.sin(fa + 2.4) * 20);
      for (let k = 0; k < 4; k++) sb.block({ x: t.x, y: ty - 0.3 + k * 1.4, z: t.z, w: 12 - k * 2.6, h: 1.4, d: 12 - k * 2.6, rotY: fa, style: k % 2 ? 'trepadeira' : 'pedra' });
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
      const v = generateVillage({ seed: def.seed, radius: def.villageR ?? 34, plaza: 8, dockAngle: Math.atan2(spots.landing.z, spots.landing.x) });
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
      if (def.castle) {
        // castelo da Capital, do lado oposto ao cais: muralha, quatro torres e torre de menagem
        const a = Math.atan2(spots.landing.z, spots.landing.x) + Math.PI;
        const cx = Math.cos(a) * R * 0.72;
        const cz = Math.sin(a) * R * 0.72;
        const cy = ground(cx, cz);
        const S = 9;
        for (const [ox, oz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          for (let k = -S; k <= S; k += 3) {
            if (ox === 0 && oz === 1 && Math.abs(k) < 3) continue; // portão
            const p = W(cx + (ox ? ox * S : k), cz + (oz ? oz * S : k));
            sb.block({ x: p.x, y: cy - 0.5, z: p.z, w: 3, h: 7, d: 3, style: 'muro' });
          }
        }
        for (const [ox, oz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const p = W(cx + ox * S, cz + oz * S);
          sb.block({ x: p.x, y: cy - 0.5, z: p.z, w: 4, h: 12, d: 4, style: 'muro' });
          sb.block({ x: p.x, y: cy + 11.5, z: p.z, w: 4.8, h: 2.2, d: 4.8, style: 'telhadoAzul' });
        }
        const k = W(cx, cz);
        sb.block({ x: k.x, y: cy - 0.5, z: k.z, w: 7, h: 18, d: 7, style: 'muro' });
        sb.block({ x: k.x, y: cy + 17.5, z: k.z, w: 8, h: 3, d: 8, style: 'telhadoAzul' });
        sb.block({ x: k.x, y: cy + 20.5, z: k.z, w: 0.3, h: 4, d: 0.3, style: 'madeira' });
        sb.block({ x: k.x + 0.9, y: cy + 23.5, z: k.z, w: 1.6, h: 1, d: 0.1, style: 'lonaOuro' });
      }
      if (def.docks) {
        // docas militares: três píeres compridos entrando no mar ao lado do cais de chegada
        const a = Math.atan2(spots.landing.z, spots.landing.x);
        for (const da of [-0.55, 0.55, 0.85]) {
          const b = a + da;
          for (let k = 0; k < 6; k++) {
            const d = R - 8 + k * 3.2;
            const p = W(Math.cos(b) * d, Math.sin(b) * d);
            sb.block({ x: p.x, y: 0.2, z: p.z, w: 3, h: 0.5, d: 3.3, rotY: Math.PI / 2 - b, style: 'madeira' });
            if (k % 2 === 0) sb.block({ x: p.x, y: -4, z: p.z, w: 0.5, h: 4.6, d: 0.5, style: 'madeira' });
          }
        }
      }
      if (def.enigmaHint) {
        // placa com a dica do enigma da Ilha Oculta
        const a = Math.atan2(spots.landing.z, spots.landing.x) - 0.25;
        const p = W(Math.cos(a) * (R - 22), Math.sin(a) * (R - 22));
        sb.sign({ x: p.x, y: ground(Math.cos(a) * (R - 22), Math.sin(a) * (R - 22)), z: p.z, rotY: a + Math.PI / 2, title: 'A Ilha Oculta', hint: ENIGMA.hint });
      }
      if (def.shipyard) {
        // estaleiro: cascos de caravela em construção sobre berços, perto da praia de chegada
        const a = Math.atan2(spots.landing.z, spots.landing.x) + 0.7;
        for (let k = 0; k < 2; k++) {
          const lx = Math.cos(a + k * 0.35) * (R - 18);
          const lz = Math.sin(a + k * 0.35) * (R - 18);
          const p = W(lx, lz);
          const y = ground(lx, lz);
          sb.block({ x: p.x, y: y + 0.6, z: p.z, w: 3.6, h: 2.2, d: 12, rotY: a, style: 'madeira' });
          for (let r = -4; r <= 4; r += 2) sb.block({ x: p.x + Math.sin(a) * r, y: y - 0.2, z: p.z + Math.cos(a) * r, w: 4.4, h: 0.8, d: 0.5, rotY: a, style: 'moveis' });
          sb.block({ x: p.x, y: y + 2.8, z: p.z, w: 0.4, h: 7, d: 0.4, style: 'madeira' });
        }
      }
      break;
    }
    case 'santuario': {
      // ninhos de dragão aos pés das agulhas de pedra, pontes de pedra entre elas
      const tops = [];
      for (let k = 0; k < 5; k++) {
        const a = k * 1.256 + def.seed;
        const lx = Math.cos(a) * R * 0.45;
        const lz = Math.sin(a) * R * 0.45;
        tops.push({ lx, lz, y: ground(lx, lz) });
        // ninho: anel de pedras escuras e três ovos que brilham
        const nx = lx * 0.72;
        const nz = lz * 0.72;
        const ny = ground(nx, nz);
        const n = W(nx, nz);
        for (let j = 0; j < 7; j++) sb.block({ x: n.x + Math.cos(j * 0.9) * 2.4, y: ny - 0.3, z: n.z + Math.sin(j * 0.9) * 2.4, w: 1.2, h: 0.8, d: 1.2, rotY: j, style: 'rochaEscura' });
        for (let j = 0; j < 3; j++) sb.block({ x: n.x + Math.cos(j * 2.1) * 0.8, y: ny, z: n.z + Math.sin(j * 2.1) * 0.8, w: 0.7, h: 1, d: 0.7, rotY: j, style: j === 1 ? 'lava' : 'reboco' });
      }
      for (let k = 0; k < 5; k++) {
        const a = tops[k];
        const b = tops[(k + 1) % 5];
        const mx = (a.lx + b.lx) / 2;
        const mz = (a.lz + b.lz) / 2;
        const p = W(mx, mz);
        const len = Math.hypot(b.lx - a.lx, b.lz - a.lz) - 6;
        sb.block({ x: p.x, y: Math.min(a.y, b.y) - 2.5, z: p.z, w: 2.4, h: 0.8, d: len, rotY: Math.atan2(b.lx - a.lx, b.lz - a.lz), style: 'pedraLisa' });
      }
      scatter(trees.pine, 14, 10, R - 8, 1.5, 7);
      extra = { breath: { ...W(0, 0), R } };
      break;
    }
    case 'tempestade': {
      // para-raios gigantes (o raio prefere eles) e árvores secas
      const rods = [];
      for (let k = 0; k < 6; k++) {
        const a = k * 1.047 + 0.3;
        const d = k % 2 ? R * 0.35 : R * 0.6;
        const lx = Math.cos(a) * d;
        const lz = Math.sin(a) * d;
        if (!clear(lx, lz, 6)) continue;
        const p = W(lx, lz);
        const y = ground(lx, lz);
        sb.block({ x: p.x, y: y - 0.3, z: p.z, w: 1.6, h: 1.2, d: 1.6, style: 'pedra' });
        sb.block({ x: p.x, y: y + 0.8, z: p.z, w: 0.5, h: 13, d: 0.5, style: 'rochaEscura' });
        sb.block({ x: p.x, y: y + 13.6, z: p.z, w: 0.9, h: 0.9, d: 0.9, style: 'lanterna' });
        rods.push({ x: p.x, y: y + 14, z: p.z, gy: y });
      }
      scatter(trees.pine, 12, 10, R - 8, 1.4, 7);
      extra = { rods };
      break;
    }
    case 'ossos': {
      // costelas gigantes em arco, um crânio e cascos de navios naufragados
      const a0 = def.campAngle + 1.6;
      for (let k = 0; k < 6; k++) {
        const t = -12 + k * 5;
        const cx = Math.cos(a0) * t;
        const cz = Math.sin(a0) * t;
        const side = { x: -Math.sin(a0), z: Math.cos(a0) };
        const h = 9 - Math.abs(k - 2.5) * 1.2;
        for (const s of [-1, 1]) {
          for (let j = 0; j < 4; j++) {
            const off = 4.5 - j * j * 0.28;
            const lx = cx + side.x * s * off;
            const lz = cz + side.z * s * off;
            const p = W(lx, lz);
            sb.block({ x: p.x, y: ground(cx, cz) - 0.4 + j * (h / 4), z: p.z, w: 1.1, h: h / 4 + 0.3, d: 1.1, rotY: a0, style: 'reboco' });
          }
        }
        const top = W(cx, cz);
        sb.block({ x: top.x, y: ground(cx, cz) - 0.2 + h, z: top.z, w: 1.2, h: 1, d: 3.6, rotY: Math.PI / 2 - a0, style: 'reboco' });
      }
      const sk = W(Math.cos(a0) * 20, Math.sin(a0) * 20);
      const sy = ground(Math.cos(a0) * 20, Math.sin(a0) * 20);
      sb.block({ x: sk.x, y: sy - 0.3, z: sk.z, w: 6, h: 4.5, d: 7, rotY: a0, style: 'reboco' });
      sb.block({ x: sk.x, y: sy + 1.5, z: sk.z, w: 6.2, h: 1.2, d: 2, rotY: a0, style: 'rochaEscura' });
      for (let k = 0; k < 3; k++) {
        const a = a0 + 2 + k * 1.3;
        const lx = Math.cos(a) * R * 0.62;
        const lz = Math.sin(a) * R * 0.62;
        const p = W(lx, lz);
        sb.block({ x: p.x, y: ground(lx, lz) - 1.2, z: p.z, w: 4, h: 3, d: 12, rotY: a, style: 'madeira' });
        sb.block({ x: p.x, y: ground(lx, lz) + 1.2, z: p.z, w: 0.5, h: 6, d: 0.5, rotY: a, style: 'madeira' });
      }
      scatter(trees.palm, 8, 8, R - 10, 1.1, 7);
      extra = { barrage: 'ossos' };
      break;
    }
    case 'aurora': {
      // colunas colossais em anel e uma escada de plataformas em espiral até o santuário no alto
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        const lx = Math.cos(a) * R * 0.55;
        const lz = Math.sin(a) * R * 0.55;
        if (!clear(lx, lz, 6)) continue;
        const p = W(lx, lz);
        const y = ground(lx, lz);
        sb.block({ x: p.x, y: y - 0.5, z: p.z, w: 3, h: 18 + (k % 3) * 3, d: 3, style: 'pedraLisa' });
        sb.block({ x: p.x, y: y + 17.5 + (k % 3) * 3, z: p.z, w: 3.8, h: 1, d: 3.8, style: 'lanterna' });
      }
      const base = ground(0, 0);
      let shrine = null;
      for (let k = 0; k < 14; k++) {
        const a = k * 0.62;
        const d = 9 - k * 0.3;
        const lx = Math.cos(a) * d;
        const lz = Math.sin(a) * d;
        const p = W(lx, lz);
        const y = base + 2.2 + k * 2.4;
        sb.block({ x: p.x, y, z: p.z, w: 3.4, h: 0.8, d: 3.4, rotY: a, style: k % 2 ? 'pedraLisa' : 'arenito' });
      }
      const top = base + 2.2 + 14 * 2.4 + 1;
      const c = W(0, 0);
      sb.block({ x: c.x, y: top, z: c.z, w: 6, h: 0.8, d: 6, style: 'pedraLisa' });
      sb.block({ x: c.x, y: top + 0.8, z: c.z, w: 1.4, h: 1.4, d: 1.4, style: 'lanterna' });
      for (const [ox, oz] of [[2.5, 2.5], [2.5, -2.5], [-2.5, 2.5], [-2.5, -2.5]]) sb.block({ x: c.x + ox, y: top + 0.8, z: c.z + oz, w: 0.5, h: 4, d: 0.5, style: 'arenito' });
      sb.block({ x: c.x, y: top + 4.8, z: c.z, w: 6.4, h: 0.5, d: 6.4, style: 'lonaOuro' });
      shrine = { x: c.x, y: top + 0.8, z: c.z };
      scatter(trees.palm, 10, R - 14, R - 6, 1.2, 6);
      extra = { shrine };
      break;
    }
    case 'oculta': {
      // monólitos de obsidiana com runas que brilham, em anel em volta do pico
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2;
        const lx = Math.cos(a) * R * 0.62;
        const lz = Math.sin(a) * R * 0.62;
        if (!clear(lx, lz, 6)) continue;
        const p = W(lx, lz);
        const y = ground(lx, lz);
        sb.block({ x: p.x, y: y - 0.5, z: p.z, w: 2.2, h: 9 + (k % 3) * 2, d: 1.4, rotY: a, style: 'rochaEscura' });
        sb.block({ x: p.x, y: y + 4, z: p.z, w: 2.3, h: 0.6, d: 1.5, rotY: a, style: 'lanterna' });
      }
      scatter(trees.pine, 10, 10, R - 10, 1.4, 7);
      extra = { hidden: true };
      break;
    }
    case 'vulcao': {
      // lago de lava na cratera (queima quem entra) e rochas escuras
      const top = ground(0, 0);
      lavaDisc(0, 0, 7.5, top + 0.5);
      lava = lavas[0];
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
  // pedra rúnica do enigma da Ilha Oculta (Terceiro Mar)
  if (def.runa !== undefined) {
    const l = spots.landing;
    const a = Math.atan2(l.z, l.x) + 0.35;
    const lx = Math.cos(a) * (R - 18);
    const lz = Math.sin(a) * (R - 18);
    const p = W(lx, lz);
    const y = ground(lx, lz);
    sb.block({ x: p.x, y: y - 0.3, z: p.z, w: 1.8, h: 3.2, d: 1.2, rotY: a, style: 'rochaEscura' });
    extra = { ...(extra ?? {}), rune: { x: p.x, y: y + 2.9, z: p.z, gy: y, runa: def.runa } };
  }
  // placa de chegada (nome, faixa de nível e chefe)
  // ao lado do caminho, para não ficar no lugar onde o jogador desce
  const g = spots.landing;
  const sx = g.x - Math.sin(g.yaw) * 3.5;
  const sz = g.z + Math.cos(g.yaw) * 3.5;
  const gp = W(sx, sz);
  sb.sign({ x: gp.x, y: ground(sx, sz), z: gp.z, rotY: g.yaw, title: def.nome, hint: `Nv. ${def.faixa[0]}–${def.faixa[1]} · Chefe: ${def.boss.nome}` });
  sb.finish();
  if (def.biome === 'vulcao' || def.biome === 'bastiao') {
    const lavaMesh = sb.group.getObjectByName('estruturas_lava');
    if (lavaMesh) {
      lavaMesh.material.emissive = new THREE.Color('#ff4a10');
      lavaMesh.material.emissiveIntensity = 1.2;
    }
  }
  placeInstances(scene, `${def.id}-arvores`, kit.broad[def.seed % 3], trees.broad, { tint: def.biome === 'noturno' ? '#3a4a6a' : null });
  placeInstances(scene, `${def.id}-pinheiros`, kit.pine, trees.pine, { tint: def.biome === 'neve' || def.biome === 'geleira' ? '#e8f0f4' : null });
  placeInstances(scene, `${def.id}-coqueiros`, kit.palm.geo, trees.palm);
  placeInstances(scene, `${def.id}-arbustos`, kit.bush[0], trees.bush, { shadow: false });
  for (const t of [...trees.broad, ...trees.pine]) physics.addCylinder({ x: t.x, y: t.y + 1.9 * t.scale, z: t.z }, 1.9 * t.scale, 0.3 * t.scale, { climbable: true, material: 'madeira' });
  for (const t of trees.palm) physics.addCylinder({ x: t.x, y: t.y + kit.palm.height * t.scale * 0.4, z: t.z }, kit.palm.height * t.scale * 0.4, 0.3, { climbable: true, material: 'madeira' });
  const toWorld = (p) => ({ ...W(p.x, p.z) });
  return {
    def, field, localField, signs: sb.signs, lava, lavas, extra,
    objects: scene.children.filter((o) => !before.has(o)),
    enemies: spots.enemies.map(toWorld), boss: toWorld(spots.boss), landing: { ...toWorld(spots.landing), yaw: spots.landing.yaw },
  };
}
