// Ilha do Porto das Origens (atualização 9): ilha costeira a leste da Ilha de Treino, com a
// primeira vila gerada pela semente (praça com chafariz, avenidas, anel, casas com porta,
// prefeitura, mercado, taverna, ferreiro, loja de frutas, postes e cais). Atualização 11:
// móveis por dentro (balcão, prateleiras, cama, mesa, forja, quadro de missões), portas que
// abrem quando alguém chega perto e lampiões que acendem à noite.

import { OffsetHeightfield } from '../terrain/offsetField.js';
import { Heightfield } from '../terrain/heightfield.js';
import { buildTerrain, tropicalColor } from '../terrain/terrainMesh.js';
import { StructureBuilder } from '../world/structures.js';
import * as THREE from 'three';
import { generateVillage } from '../world/village.js';
import { interiorOf, isService, toWorldOfBuilding } from '../world/villageLife.js';
import { makeFruit } from '../fruits/fruitArt.js';
import { smooth, valueNoise2D } from '../core/math.js';

export const VILLAGE = {
  id: 'porto-das-origens', name: 'Porto das Origens', seed: 2026,
  offset: { x: 340, z: 0 }, half: 130, spacing: 1.5, plateau: 3.2,
  deck: 1.35, // topo das tábuas dos dois cais
};

// Pontos de chegada da travessia (coordenadas do mundo) e os Barqueiros de cada cais
// mooring: onde o bote do jogador fica amarrado ao lado de cada cais (proa para o mar)
export const DOCKS = {
  treino: { x: 96, z: 9.2, yaw: -Math.PI / 2, island: 'Ilha de Treino', mooring: { x: 104, z: 14.6, yaw: Math.PI / 2 } },
  porto: { x: VILLAGE.offset.x - 86, z: -0.8, yaw: Math.PI / 2, island: VILLAGE.name, mooring: { x: VILLAGE.offset.x - 97, z: -4.6, yaw: -Math.PI / 2 } },
};
export const BOATMEN = [
  {
    id: 'barqueiro-treino', role: 'barqueiro', to: 'porto', name: 'Barqueiro', x: 101, z: 11.2, y: VILLAGE.deck, yaw: -Math.PI / 2, stall: false,
    look: { skin: '#b07850', hair: '#2a2018', shirt: '#2f6f8a', shorts: '#e8dcc0', shoes: '#4a3424' },
    hint: 'Viagem rápida ao Porto das Origens ou trazer o seu bote até este cais.',
  },
  {
    id: 'barqueiro-porto', role: 'barqueiro', to: 'treino', name: 'Barqueira', art: 'a', x: VILLAGE.offset.x - 92, z: 1.2, y: VILLAGE.deck, yaw: Math.PI / 2, stall: false,
    look: { skin: '#d8a880', hair: '#7a3a1a', shirt: '#a8402a', shorts: '#2a3a55', shoes: '#4a3424' },
    hint: 'Viagem rápida à Ilha de Treino ou trazer o seu bote até este cais.',
  },
];

const noise = valueNoise2D(31);
const noise2 = valueNoise2D(47);
const coast = (x, z) => 84 - (Math.hypot(x, z * 1.05) + noise(x / 22, z / 22) * 6 + noise2(x / 8, z / 8) * 1.2);

// Altura em coordenadas locais: área da vila plana, praia, morro a nordeste
export function villageHeight(x, z) {
  const r = Math.hypot(x, z);
  const t = coast(x, z);
  let h;
  if (t > 14) h = VILLAGE.plateau + (r > 62 ? noise(x / 30 + 5, z / 30) * 1.6 * smooth(62, 76, r) : 0);
  else if (t > 0) h = 0.6 + (VILLAGE.plateau - 0.6) * smooth(0, 14, t);
  else h = 0.6 - 14 * smooth(0, 40, -t);
  const hill = 1 - smooth(6, 22, Math.hypot(x - 46, z + 52));
  h += 10 * hill * hill * smooth(58, 66, r);
  return h;
}

export function buildVillageIsland({ scene, physics }) {
  const { offset: o } = VILLAGE;
  const field = new OffsetHeightfield({ half: VILLAGE.half, spacing: VILLAGE.spacing, height: villageHeight, ox: o.x, oz: o.z });
  const localField = new Heightfield({ half: VILLAGE.half, spacing: VILLAGE.spacing, height: villageHeight });
  const sandBand = (x, z, y) => {
    const t = coast(x - o.x, z - o.z);
    return y < 2.2 && t < 16 ? 1 - smooth(9, 16, t) : 0;
  };
  const terrain = buildTerrain({ field, physics, colorAt: tropicalColor(sandBand) });
  scene.add(terrain.group);

  const village = generateVillage({ seed: VILLAGE.seed, dockAngle: Math.PI });
  const sb = new StructureBuilder(scene, physics);
  const W = (lx, lz) => [lx + o.x, lz + o.z];
  const ground = (lx, lz) => field.sample(lx + o.x, lz + o.z);
  const base = VILLAGE.plateau;

  // ruas (lajes de pedra) e praça
  for (const s of village.streets) {
    const [ax, az] = s.a;
    const [bx, bz] = s.b;
    const len = Math.hypot(bx - ax, bz - az);
    const [cx, cz] = W((ax + bx) / 2, (az + bz) / 2);
    sb.block({ x: cx, y: ground((ax + bx) / 2, (az + bz) / 2) - 0.12, z: cz, w: s.w, h: 0.22, d: len + 1, rotY: Math.atan2(bx - ax, bz - az), style: 'caminho' });
  }
  const pr = village.plaza.r;
  for (const rot of [0, Math.PI / 4]) sb.block({ x: o.x, y: base - 0.1, z: o.z, w: pr * 1.9, h: 0.22, d: pr * 1.9, rotY: rot, style: 'caminho' });
  // chafariz
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    sb.block({ x: o.x + Math.cos(a) * 3, y: base, z: o.z + Math.sin(a) * 3, w: 2.4, h: 1, d: 0.6, rotY: Math.PI / 2 - a, style: 'pedraLisa' });
  }
  sb.block({ x: o.x, y: base, z: o.z, w: 4.6, h: 0.5, d: 4.6, style: 'agua' });
  sb.block({ x: o.x, y: base, z: o.z, w: 0.9, h: 3, d: 0.9, style: 'pedraLisa' });
  sb.block({ x: o.x, y: base + 3, z: o.z, w: 1.8, h: 0.4, d: 1.8, style: 'pedraLisa' });

  // casas: paredes com porta na fachada, piso, janelas e telhado em degraus
  const NAMES = { prefeitura: 'Prefeitura', mercado: 'Mercado', taverna: 'Taverna', ferreiro: 'Ferreiro', 'loja-frutas': 'Loja de Frutas' };
  const HINTS = {
    prefeitura: 'Mestre de Missões: missões da vila e redistribuir pontos de status.',
    mercado: 'Mercadora: troca de fragmentos e chaves; encomendas para entregar.',
    taverna: 'Taverneiro: refeição que recupera vida e fôlego. À noite os moradores vêm para cá.',
    ferreiro: 'Ferreira: armaduras, acessórios, espadas e conserto.',
    'loja-frutas': 'Fruteiro: frutas do dia pela tabela de raridade da loja (renova às 6h).',
  };
  const signs = [];
  const doors = [];
  const fruitsOnCounter = [];
  // móveis de cada construção (blocos com colisão; o chão de dentro fica em +0,25)
  const F = 0.25;
  function furnish(b, put, at) {
    const it = interiorOf(b);
    if (isService(b)) {
      const c = it.counter;
      put(c.x, c.z, c.w, 1.25, c.d, F, 'moveis'); // balcão
      put(c.x, c.z, c.w + 0.2, 0.12, c.d + 0.2, F + 1.25, 'madeira'); // tampo
      put(-0.6, -b.d / 2 + 0.85, b.w - 3, 2.6, 0.5, F, 'moveis'); // prateleira do fundo
      put(-0.6, -b.d / 2 + 0.85, b.w - 3.2, 0.12, 0.55, F + 1.3, 'madeira');
      if (b.tipo === 'taverna') {
        const tb = it.table;
        put(tb.x, tb.z, tb.w, 1.0, tb.d, F, 'madeira');
        for (const s of [-1, 1]) put(b.w / 2 - 1.1, b.d / 2 - 1.2 + s * 0.05 - (s > 0 ? 1.1 : 0), 0.9, 1.2, 0.9, F, 'moveis'); // barris
      } else if (b.tipo === 'ferreiro') {
        put(-b.w / 2 + 1.5, b.d / 2 - 2.2, 1.1, 0.9, 0.6, F, 'pedraLisa'); // bigorna
        put(b.w / 2 - 1.3, b.d / 2 - 2.0, 1.4, 1.3, 1.3, F, 'tijolo'); // forja
        put(b.w / 2 - 1.3, b.d / 2 - 2.0, 0.9, 0.25, 0.9, F + 1.3, 'lanterna'); // brasa
      } else if (b.tipo === 'mercado') {
        for (const [lx, lz, y] of [[-b.w / 2 + 1.2, b.d / 2 - 1.6, 0], [-b.w / 2 + 1.2, b.d / 2 - 2.6, 0], [-b.w / 2 + 1.2, b.d / 2 - 1.6, 0.9]]) put(lx, lz, 0.9, 0.9, 0.9, F + y, 'moveis');
      } else if (b.tipo === 'prefeitura') {
        put(-b.w / 2 + 0.7, 0.6, 0.15, 2.2, 3.2, F + 1.4, 'madeira'); // quadro de missões
        for (const [dz, dy] of [[-0.8, 2.6], [0.3, 2.9], [1.2, 2.3], [-0.1, 2.0]]) put(-b.w / 2 + 0.8, 0.6 + dz, 0.06, 0.6, 0.5, F + dy, 'reboco');
        put(b.w / 2 - 1.4, b.d / 2 - 2.4, 0.6, 0.5, 2.6, F, 'madeira'); // banco
      } else if (b.tipo === 'loja-frutas') {
        fruitsOnCounter.push(...[-1.6, -0.4, 0.8].map((lx, k) => ({ p: toWorldOfBuilding(b, c.x + lx, c.z), k })));
      }
    } else {
      const bed = it.bed;
      put(bed.x, bed.z, bed.w, 0.55, bed.d, F, 'moveis');
      put(bed.x, bed.z + 0.4, bed.w - 0.2, 0.22, bed.d - 1.0, F + 0.55, 'cobertor');
      put(bed.x, bed.z - bed.d / 2 + 0.5, bed.w - 0.5, 0.25, 0.6, F + 0.55, 'reboco'); // travesseiro
      put(it.table.x, it.table.z, it.table.w, 1.0, it.table.d, F, 'madeira');
      put(it.shelf.x, it.shelf.z, it.shelf.w, 2.4, it.shelf.d, F, 'moveis');
    }
  }
  for (const b of village.buildings) {
    const right = [Math.cos(b.rotY), -Math.sin(b.rotY)];
    const fwd = [Math.sin(b.rotY), Math.cos(b.rotY)];
    const at = (lx, lz) => W(b.x + right[0] * lx + fwd[0] * lz, b.z + right[1] * lx + fwd[1] * lz);
    const put = (lx, lz, w, h, d, y, style) => {
      const [x, z] = at(lx, lz);
      sb.block({ x, y: base + y, z, w, h, d, rotY: b.rotY, style });
    };
    const t = 0.6;
    const door = 3.2;
    put(0, 0, b.w, 0.3, b.d, -0.05, 'madeira');
    put(0, -b.d / 2 + t / 2, b.w, b.h, t, 0, b.parede);
    put(-b.w / 2 + t / 2, 0, t, b.h, b.d, 0, b.parede);
    put(b.w / 2 - t / 2, 0, t, b.h, b.d, 0, b.parede);
    const side = (b.w - door) / 2;
    put(-(door / 2 + side / 2), b.d / 2 - t / 2, side, b.h, t, 0, b.parede);
    put(door / 2 + side / 2, b.d / 2 - t / 2, side, b.h, t, 0, b.parede);
    put(0, b.d / 2 - t / 2, door, b.h - 5, t, 5, b.parede);
    // janelas nas laterais e atrás
    for (const s of [-1, 1]) put(s * (b.w / 2 + 0.03), 0, 0.1, 1.3, 1.6, 3, 'janela');
    put(0, -b.d / 2 - 0.03, 1.8, 1.3, 0.1, 3, 'janela');
    // telhado em degraus
    put(0, 0, b.w + 1.2, 0.8, b.d + 1.2, b.h, b.telhado);
    put(0, 0, b.w - 1, 0.8, b.d - 2.2, b.h + 0.8, b.telhado);
    if (b.d > 6.5) put(0, 0, b.w - 3, 0.7, b.d - 4.6, b.h + 1.6, b.telhado);
    if (NAMES[b.tipo]) {
      const [sx, sz] = at(b.w / 2 + 1.2, b.d / 2 + 1.5);
      sb.sign({ x: sx, y: ground(sx - o.x, sz - o.z), z: sz, rotY: b.rotY + Math.PI, title: NAMES[b.tipo], hint: HINTS[b.tipo] });
    }
    furnish(b, put, at);
    doors.push({ b, angle: 0, target: 0 });
  }
  // postes de luz
  for (const p of village.props) {
    const [x, z] = W(p.x, p.z);
    sb.block({ x, y: base, z, w: 0.3, h: 3.6, d: 0.3, style: 'madeira' });
    sb.block({ x, y: base + 3.6, z, w: 0.6, h: 0.6, d: 0.6, style: 'lanterna' });
  }
  // cais a oeste (na direção da Ilha de Treino): tábuas a partir da praia até o mar fundo
  for (let lx = -79; lx >= -103; lx -= 3) {
    sb.block({ x: o.x + lx, y: Math.max(ground(lx, 0) - 0.25, VILLAGE.deck - 0.35), z: o.z, w: 3.2, h: 0.35, d: 4.2, style: 'madeira' });
    if (lx % 6 === -1 && lx < -86) for (const s of [-1, 1]) sb.block({ x: o.x + lx, y: -8, z: o.z + s * 1.9, w: 0.4, h: 9.4, d: 0.4, style: 'madeira' });
  }
  sb.sign({ x: o.x + 4.5, y: base, z: o.z + village.plaza.r + 1.5, rotY: 0, title: VILLAGE.name, hint: 'Primeira vila do mar. Os moradores vão ao trabalho de manhã, à taverna no fim da tarde e voltam para casa à noite.' });
  sb.sign({ x: o.x - 72, y: ground(-72, 4.5), z: o.z + 4.5, rotY: -Math.PI / 2, title: 'Cais do Porto', hint: 'Embarque no seu bote para navegar até a Ilha de Treino (a oeste) ou fale com a Barqueira.' });
  sb.finish();
  for (const sg of sb.signs) if (sg.title === VILLAGE.name) sg.major = true; // nome da vila tem prioridade no mapa
  signs.push(...sb.signs);

  // frutas no balcão da Loja de Frutas
  for (const { p, k } of fruitsOnCounter) {
    const f = makeFruit([1, 6, 9][k], 1);
    f.scale.setScalar(0.5);
    f.position.set(p.x + o.x, base + F + 1.37 + 0.3, p.z + o.z);
    scene.add(f);
  }
  // portas: uma malha instanciada; giram para fora (dobradiça à esquerda) quando alguém chega perto
  const doorGeo = new THREE.BoxGeometry(3.1, 4.9, 0.16).translate(1.55, 2.45, 0);
  const doorMesh = new THREE.InstancedMesh(doorGeo, new THREE.MeshStandardMaterial({ color: '#6a4424', roughness: 0.8 }), doors.length);
  doorMesh.castShadow = true;
  doorMesh.name = 'portas';
  scene.add(doorMesh);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const one = new THREE.Vector3(1, 1, 1);
  for (const d of doors) {
    const h = toWorldOfBuilding(d.b, -1.6, d.b.d / 2 + 0.1);
    d.hinge = new THREE.Vector3(h.x + o.x, base + F - 0.2, h.z + o.z);
    d.center = toWorldOfBuilding(d.b, 0, d.b.d / 2);
    d.center = { x: d.center.x + o.x, z: d.center.z + o.z };
  }
  const setDoor = (i) => {
    const d = doors[i];
    q.setFromAxisAngle(up, d.b.rotY - d.angle);
    doorMesh.setMatrixAt(i, m4.compose(d.hinge, q, one));
  };
  doors.forEach((_, i) => setDoor(i));
  doorMesh.instanceMatrix.needsUpdate = true;
  const lanterns = sb.group.getObjectByName('estruturas_lanterna');
  if (lanterns) lanterns.material.emissive = new THREE.Color('#ffc65a');
  return {
    field, localField, village, signs, terrain, lanterns,
    // abre as portas com alguém a até 3,4 da porta (jogador e moradores, em coordenadas do mundo)
    updateDoors(dt, people) {
      let changed = false;
      doors.forEach((d, i) => {
        d.target = people.some((p) => Math.hypot(p.x - d.center.x, p.z - d.center.z) < 3.4) ? 1.75 : 0;
        if (Math.abs(d.angle - d.target) > 1e-3) {
          d.angle += Math.sign(d.target - d.angle) * Math.min(Math.abs(d.target - d.angle), dt * 4);
          setDoor(i);
          changed = true;
        }
      });
      if (changed) doorMesh.instanceMatrix.needsUpdate = true;
    },
    // à noite os lampiões brilham
    setNight(n) {
      if (lanterns) lanterns.material.emissiveIntensity = n * 1.3;
    },
  };
}

// Cais da Ilha de Treino (costa leste): o bote do jogador fica amarrado ao lado
export function buildTrainingDock({ scene, physics, field }) {
  const sb = new StructureBuilder(scene, physics);
  for (let x = 86; x <= 110; x += 3) {
    sb.block({ x, y: Math.max(field.sample(x, 10) - 0.25, VILLAGE.deck - 0.35), z: 10, w: 3.2, h: 0.35, d: 4.2, style: 'madeira' });
    if (x % 6 === 2 && x > 92) for (const s of [-1, 1]) sb.block({ x, y: -8, z: 10 + s * 1.9, w: 0.4, h: 9.4, d: 0.4, style: 'madeira' });
  }
  sb.sign({ x: 84, y: field.sample(84, 15), z: 15, rotY: -Math.PI / 2, title: 'Cais da Ilha de Treino', hint: 'Seu bote fica amarrado aqui. Navegue até o Porto das Origens (a leste) ou fale com o Barqueiro.' });
  sb.finish();
  return { signs: sb.signs };
}

