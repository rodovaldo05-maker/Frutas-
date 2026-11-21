// Ilha de Treino: ilha de teste da Fase F1 (movimento). Cada área exercita uma mobilidade
// e tem uma placa com dica. Unidades do mundo = unidades do laboratório (corpo ≈ 4,1).

import * as THREE from 'three';
import { Heightfield } from '../terrain/heightfield.js';
import { buildTerrain, tropicalColor } from '../terrain/terrainMesh.js';
import { StructureBuilder } from '../world/structures.js';
import { smooth, valueNoise2D, mulberry32 } from '../core/math.js';

export const ISLAND = {
  id: 'ilha-de-treino',
  name: 'Ilha de Treino',
  half: 138,
  spacing: 1.5,
  waterLevel: 0,
  spawn: { x: 0, z: 71, yaw: Math.PI },
};

const noise = valueNoise2D(7);
const noise2 = valueNoise2D(19);

// Distância até a costa (positivo dentro da ilha)
function coastDistance(x, z) {
  const r = Math.hypot(x, z * 1.12) + noise(x / 26, z / 26) * 7 + noise2(x / 9, z / 9) * 1.6;
  return 90 - r;
}

export function islandHeight(x, z) {
  const t = coastDistance(x, z);
  let h;
  if (t > 16) h = 2.4 + noise(x / 34 + 3, z / 34) * 1.1 + noise2(x / 12, z / 12) * 0.25;
  else if (t > 0) h = 0.5 + 1.9 * smooth(0, 16, t) + noise2(x / 12, z / 12) * 0.2 * smooth(0, 16, t);
  else h = 0.5 - 14.5 * smooth(0, 42, -t);

  // Penhasco ao norte: face íngreme (escalável) e encosta suave a oeste (trilha)
  const plateau = smooth(-37, -43, z) * smooth(-62, -30, x) * smooth(46, 39, x) * smooth(5, 18, t);
  h += 14.5 * plateau;

  // Lagoa funda a oeste, ligada ao mar por um canal
  const lagoon = 1 - smooth(7, 17, Math.hypot(x + 50, (z - 16) * 1.1));
  const channel = (1 - smooth(3, 7, Math.abs(z - 16))) * smooth(-48, -60, x);
  h -= 9.5 * Math.max(lagoon, channel * 0.9);

  // Encosta de deslize: morro a sudoeste descendo até a lagoa
  const hill = 1 - smooth(4, 22, Math.hypot(x + 28, z - 44));
  h += 10 * hill * hill;

  // Vala com água no leste (atravessada correndo na parede, de sul para norte ou ao contrário)
  const trench = (1 - smooth(9, 13, Math.abs(x - 58))) * (1 - smooth(2.2, 3.9, Math.abs(z - 30)));
  h -= 8 * trench;
  return h;
}

export function buildTrainingIsland({ scene, physics }) {
  const field = new Heightfield({ half: ISLAND.half, spacing: ISLAND.spacing, height: islandHeight });
  const sandBand = (x, z, y) => {
    const t = coastDistance(x, z);
    return y < 1.8 && t < 18 ? 1 - smooth(10, 18, t) : 0;
  };
  const terrain = buildTerrain({ field, physics, colorAt: tropicalColor(sandBand), waterLevel: ISLAND.waterLevel });
  scene.add(terrain.group);

  const sb = new StructureBuilder(scene, physics);
  const ground = (x, z) => field.sample(x, z);

  // ===== Rampas: 15°, 30°, 45° (limite caminhável) e 55° (escorrega) =====
  [15, 30, 45, 55].forEach((angle, k) => {
    const x = -2 + k * 6.5;
    sb.ramp({ x, z: 20, baseY: ground(x, 20) - 0.05, width: 4.2, angleDeg: angle, rise: 4.2, rotY: Math.PI });
  });
  sb.sign({ x: -6, y: ground(-6, 24), z: 24, rotY: 0, title: 'Rampas', hint: 'Rampas de 15°, 30° e 45° dão para subir. A de 55° é íngreme demais: você escorrega.' });

  // ===== Penhasco (o relevo ao norte) =====
  sb.sign({ x: 10, y: ground(10, -30), z: -30, rotY: 0, title: 'Penhasco', hint: 'Corra contra a parede de pedra para escalar. Escalar gasta fôlego. Pule para se soltar da parede.' });
  sb.sign({ x: -46, y: ground(-46, -26), z: -26, rotY: Math.PI / 4, title: 'Trilha', hint: 'Trilha suave até o mirante. Lá de cima, pule e segure Pular para planar.' });

  // ===== Torre de escalada (pedra escalável) =====
  const tower = { x: 30, z: -12 };
  sb.block({ x: tower.x, y: ground(tower.x, tower.z) - 1, z: tower.z, w: 6, h: 17, d: 6, style: 'pedra' });
  sb.block({ x: tower.x, y: ground(tower.x, tower.z) + 16, z: tower.z, w: 6.2, h: 0.6, d: 6.2, style: 'madeira' });
  sb.sign({ x: tower.x - 6, y: ground(tower.x - 6, tower.z + 6), z: tower.z + 6, rotY: -Math.PI / 4, title: 'Torre', hint: 'Torre de pedra escalável. No topo, o personagem sobe a borda sozinho.' });

  // ===== Chaminé de salto na parede =====
  const ch = { x: 46, z: -6 };
  const chBase = ground(ch.x, ch.z) - 1;
  sb.block({ x: ch.x - 2.9, y: chBase, z: ch.z, w: 1.2, h: 14, d: 7, style: 'pedraLisa' });
  sb.block({ x: ch.x + 2.9, y: chBase, z: ch.z, w: 1.2, h: 14, d: 7, style: 'pedraLisa' });
  sb.block({ x: ch.x, y: chBase + 14, z: ch.z - 2, w: 7, h: 0.6, d: 3, style: 'madeira' });
  sb.sign({ x: ch.x, y: ground(ch.x, ch.z + 7), z: ch.z + 7, rotY: 0, title: 'Salto na parede', hint: 'Pule entre as duas paredes lisas: encostado numa parede no ar, aperte Pular de novo para saltar para a outra.' });

  // ===== Parede de bordas (pedra lisa com saliências) =====
  const lw = { x: 14, z: -20 };
  const lwBase = ground(lw.x, lw.z) - 1;
  sb.block({ x: lw.x, y: lwBase, z: lw.z, w: 9, h: 15, d: 2, style: 'pedraLisa' });
  for (let k = 0; k < 3; k++) {
    sb.block({ x: lw.x + (k % 2 ? 2 : -2), y: lwBase + 4.6 + k * 3.6, z: lw.z + 1.5, w: 3.4, h: 0.5, d: 1.2, style: 'madeira' });
  }
  sb.sign({ x: lw.x - 6.5, y: ground(lw.x - 6.5, lw.z + 4), z: lw.z + 4, rotY: 0, title: 'Bordas', hint: 'Pule perto de uma borda para se agarrar. Pular sobe, Agachar solta, o direcional anda de lado.' });

  // ===== Pedras de parkour (do prado até a vala) =====
  const stones = [
    [8, 34, 1.4], [12, 37, 2.2], [16, 34, 3.0], [20.5, 37, 3.8], [25, 34.5, 4.6],
    [30, 37, 4.6], [37.5, 36, 4.0], // vão longo: salto duplo ou corrida
    [41.5, 40, 3.2],
  ];
  for (const [x, z, h] of stones) sb.block({ x, y: ground(x, z) - 0.5, z, w: 2.6, h: h + 0.5, d: 2.6, style: 'pedraLisa' });
  sb.sign({ x: 5, y: ground(5, 30), z: 30, rotY: -Math.PI / 6, title: 'Parkour', hint: 'Pule de pedra em pedra. O vão maior pede corrida (botão Correr) ou salto duplo.' });

  // ===== Túnel baixo (agachar / deslizar) =====
  const tn = { x: -10, z: 36 };
  // o teto fica 2,75 acima do ponto mais alto do chão dentro do túnel (cabe agachado, não em pé)
  let tnTop = -Infinity;
  let tnLow = Infinity;
  for (let dz = -5.5; dz <= 5.5; dz += 0.5) {
    for (const dx of [-1.6, 0, 1.6]) {
      tnTop = Math.max(tnTop, ground(tn.x + dx, tn.z + dz));
      tnLow = Math.min(tnLow, ground(tn.x + dx, tn.z + dz));
    }
  }
  const tnCeil = tnTop + 2.75;
  sb.block({ x: tn.x - 2.2, y: tnLow - 0.6, z: tn.z, w: 1, h: tnCeil - tnLow + 0.75, d: 10, style: 'muro' });
  sb.block({ x: tn.x + 2.2, y: tnLow - 0.6, z: tn.z, w: 1, h: tnCeil - tnLow + 0.75, d: 10, style: 'muro' });
  sb.block({ x: tn.x, y: tnCeil, z: tn.z, w: 5.4, h: 0.6, d: 10, style: 'muro' });
  sb.sign({ x: tn.x - 4.5, y: ground(tn.x - 4.5, tn.z + 6.5), z: tn.z + 6.5, rotY: 0, title: 'Túnel', hint: 'Túnel baixo: segure Agachar para passar. Correndo, Agachar faz o personagem deslizar.' });

  // ===== Parede de corrida sobre a vala =====
  // parede atravessando a vala (de z 19 a 41), encostada nela pelo lado oeste
  sb.block({ x: 61, y: -6, z: 30, w: 1.2, h: 13, d: 22, style: 'pedraLisa' });
  sb.sign({ x: 56.5, y: ground(56.5, 16.5), z: 16.5, rotY: 0, title: 'Corrida na parede', hint: 'Corra (botão Correr) junto da parede e pule antes da água: o personagem corre pela parede e atravessa a vala.' });

  // ===== Encosta de deslize e lagoa =====
  sb.sign({ x: -24, y: ground(-24, 56), z: 56, rotY: Math.PI, title: 'Deslize', hint: 'Do alto do morro, corra e aperte Agachar para deslizar até a lagoa.' });
  sb.sign({ x: -34, y: ground(-34, 10), z: 10, rotY: Math.PI / 2, title: 'Lagoa', hint: 'Água funda: nade. Agachar mergulha, Pular sobe. O ar dura 30 segundos.' });
  // Píer de madeira na lagoa
  for (let k = 0; k < 6; k++) sb.block({ x: -38 - k * 2, y: 0.5, z: 16, w: 2, h: 0.4, d: 3.4, style: 'madeira' });
  for (const k of [0, 2.5, 5]) sb.block({ x: -38 - k * 2, y: -6, z: 14.6, w: 0.5, h: 6.6, d: 0.5, style: 'madeira' });
  // Pedras submersas
  for (const [x, z, h] of [[-54, 20, 3], [-48, 10, 2.2], [-58, 13, 4.2]]) sb.block({ x, y: ground(x, z) - 0.2, z, w: 3, h, d: 3, style: 'pedra' });

  // ===== Mirante no penhasco (ponto de salto para planar) =====
  sb.block({ x: -4, y: ground(-4, -58) - 0.3, z: -58, w: 5, h: 2.2, d: 5, style: 'madeira' });
  sb.block({ x: 2, y: ground(2, -46) - 0.5, z: -46, w: 3, h: 1.2, d: 6, style: 'madeira' });

  // ===== Praia: ponto de partida =====
  sb.sign({ x: 4.5, y: ground(4.5, 66), z: 66, rotY: Math.PI, title: 'Ilha de Treino', hint: 'Bem-vindo! Explore as placas para testar cada movimento.' });

  // ===== Árvores e pedras (decoração com tronco sólido) =====
  addVegetation({ scene, physics, field, sb });

  sb.finish();

  // Limites invisíveis do mundo (o mar continua visível além)
  const lim = ISLAND.half - 2;
  for (const [x, z, w, d] of [[0, lim, 2 * lim, 1], [0, -lim, 2 * lim, 1], [lim, 0, 1, 2 * lim], [-lim, 0, 1, 2 * lim]]) {
    physics.addBox({ x, y: 0, z }, { x: w / 2, y: 60, z: d / 2 }, 0, { climbable: false, material: 'limite', invisible: true });
  }

  return { field, signs: sb.signs, triangles: terrain.triangles };
}

function addVegetation({ scene, physics, field, sb }) {
  const rand = mulberry32(42);
  const keepClear = [
    [0, 64, 14], [10, 20, 16], [30, -12, 9], [46, -6, 9], [14, -20, 10], [25, 37, 18], [-10, 36, 9],
    [58, 28, 16], [-50, 16, 20], [-28, 44, 12], [0, -50, 12], [-46, -26, 6],
  ];
  const clear = (x, z) => !keepClear.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r);
  const trees = [];
  const palms = [];
  // bosques em lugares definidos + algumas árvores soltas
  const groves = [[-62, -10, 15, 9], [-22, -24, 10, 5], [58, -34, 13, 7], [-64, 44, 9, 4], [40, 60, 11, 5], [-30, 68, 8, 3], [66, 8, 8, 4]];
  const tryTree = (x, z) => {
    const y = field.sample(x, z);
    if (y < 1.4 || field.normal(x, z).y < 0.9 || !clear(x, z)) return;
    if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < 4.2)) return;
    trees.push({ x, y, z, h: 3.2 + rand() * 2.2, s: 2.4 + rand() * 1.1, r: rand() });
  };
  for (const [cx, cz, r, n] of groves) {
    for (let k = 0; k < n * 3 && trees.length < 90; k++) {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * r;
      tryTree(cx + Math.cos(a) * d, cz + Math.sin(a) * d);
    }
  }
  for (let k = 0; k < 30; k++) tryTree((rand() * 2 - 1) * 78, (rand() * 2 - 1) * 74);
  // coqueiros na faixa de areia
  for (let k = 0; k < 120 && palms.length < 22; k++) {
    const a = rand() * Math.PI * 2;
    const x = Math.cos(a) * 84;
    const z = Math.sin(a) * 84 / 1.12;
    let px = x, pz = z;
    // procura a areia andando para dentro
    for (let step = 0; step < 20; step++) {
      const y = field.sample(px, pz);
      if (y > 0.9 && y < 2.2) break;
      px *= 0.97;
      pz *= 0.97;
    }
    const y = field.sample(px, pz);
    if (y < 0.9 || y > 2.4 || !clear(px, pz) || palms.some((p) => Math.hypot(p.x - px, p.z - pz) < 7)) continue;
    palms.push({ x: px, y, z: pz, h: 5 + rand() * 1.8, lean: 0.12 + rand() * 0.16, dir: Math.atan2(-pz, -px) + Math.PI + (rand() - 0.5), r: rand() });
  }

  const box = new THREE.BoxGeometry(1, 1, 1);
  const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.88, flatShading: true });
  const make = (count, material) => {
    const mesh = new THREE.InstancedMesh(box, material, Math.max(1, count));
    mesh.count = count;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };
  const trunkMesh = make(trees.length + palms.length * 3, mat('#7a5233'));
  const leafMesh = make(trees.length * 2 + palms.length * 5, mat('#ffffff'));
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const c = new THREE.Color();
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  let ti = 0;
  let li = 0;
  const leafColors = ['#3f7a3e', '#4d8b45', '#5f9a4e', '#386b3a'];
  for (const t of trees) {
    q.setFromAxisAngle(v(0, 1, 0), t.r * Math.PI);
    trunkMesh.setMatrixAt(ti++, m.compose(v(t.x, t.y + t.h / 2, t.z), q, v(0.62, t.h, 0.62)));
    const col = leafColors[Math.floor(t.r * 4)];
    leafMesh.setMatrixAt(li, m.compose(v(t.x, t.y + t.h + t.s * 0.22, t.z), q, v(t.s, t.s * 0.72, t.s)));
    leafMesh.setColorAt(li++, c.set(col));
    leafMesh.setMatrixAt(li, m.compose(v(t.x + 0.15, t.y + t.h + t.s * 0.82, t.z - 0.1), q, v(t.s * 0.62, t.s * 0.5, t.s * 0.62)));
    leafMesh.setColorAt(li++, c.set(col).offsetHSL(0.01, 0, 0.06));
    physics.addCylinder({ x: t.x, y: t.y + t.h / 2, z: t.z }, t.h / 2, 0.34, { climbable: true, material: 'madeira' });
  }
  for (const p of palms) {
    // tronco inclinado em três gomos
    const dx = Math.cos(p.dir) * p.lean;
    const dz = Math.sin(p.dir) * p.lean;
    const seg = p.h / 3;
    for (let k = 0; k < 3; k++) {
      const bend = (k + 0.5) / 3;
      e.set(dz * (1 + k * 0.6), 0, -dx * (1 + k * 0.6));
      q.setFromEuler(e);
      trunkMesh.setMatrixAt(ti++, m.compose(v(p.x + dx * p.h * bend * bend * 1.6, p.y + seg * (k + 0.5), p.z + dz * p.h * bend * bend * 1.6), q, v(0.5 - k * 0.06, seg * 1.04, 0.5 - k * 0.06)));
    }
    const top = v(p.x + dx * p.h * 1.6, p.y + p.h, p.z + dz * p.h * 1.6);
    for (let k = 0; k < 5; k++) {
      const a = p.r * 6 + (k / 5) * Math.PI * 2;
      e.set(0, a, 0.42, 'YXZ');
      e.x = 0.38;
      q.setFromEuler(e);
      const off = v(Math.sin(a) * 1.25, -0.28, Math.cos(a) * 1.25);
      leafMesh.setMatrixAt(li, m.compose(top.clone().add(off), q, v(0.75, 0.12, 2.6)));
      leafMesh.setColorAt(li++, c.set(k % 2 ? '#5d9a4a' : '#4c8a3f'));
    }
    physics.addCylinder({ x: p.x + dx * p.h * 0.8, y: p.y + p.h / 2, z: p.z + dz * p.h * 0.8 }, p.h / 2, 0.3, { climbable: true, material: 'madeira' });
  }
  trunkMesh.count = ti;
  leafMesh.count = li;
  trunkMesh.instanceMatrix.needsUpdate = true;
  leafMesh.instanceMatrix.needsUpdate = true;
  if (leafMesh.instanceColor) leafMesh.instanceColor.needsUpdate = true;

  // pedras soltas (poucas)
  for (let k = 0; k < 18; k++) {
    const x = (rand() * 2 - 1) * 78;
    const z = (rand() * 2 - 1) * 72;
    const y = field.sample(x, z);
    if (y < 0.8 || !clear(x, z)) continue;
    const s = 0.7 + rand() * 1.2;
    sb.block({ x, y: y - 0.35, z, w: s * 1.4, h: s, d: s * 1.1, rotY: rand() * 3, style: 'pedra' });
  }
}
