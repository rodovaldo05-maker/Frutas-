// Natureza da ilha em blocos, no estilo do laboratório: árvores de copa em vários cubos,
// pinheiros em camadas, coqueiros de tronco curvo, arbustos, capim, flores e pedras
// irregulares com musgo. Cada tipo é um modelo montado uma vez e repetido com
// InstancedMesh (uma chamada de desenho por tipo). Troncos e pedras têm colisão.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

// Cubo com cor por face: topo claro, laterais na cor, base escura
function cube(w, h, d, color, { pos = [0, 0, 0], rot = [0, 0, 0], top = 1.12, side = 1, bottom = 0.62 } = {}) {
  const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
  const base = new THREE.Color(color);
  const n = g.getAttribute('normal');
  const cols = [];
  for (let i = 0; i < n.count; i++) {
    const ny = n.getY(i);
    const k = ny > 0.5 ? top : ny < -0.5 ? bottom : side * (n.getX(i) > 0.5 || n.getZ(i) > 0.5 ? 1 : 0.9);
    cols.push(base.r * k, base.g * k, base.b * k);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.applyMatrix4(new THREE.Matrix4().compose(V(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), V(1, 1, 1)));
  return g;
}

function merge(parts) {
  const g = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  g.computeBoundingSphere();
  return g;
}

// ===== Modelos =====
function broadleaf(variant) {
  const trunk = '#77502f';
  const leaves = ['#3f7a3e', '#4b8a43', '#5a9a4c'][variant % 3];
  const parts = [
    cube(0.62, 3.6, 0.62, trunk, { pos: [0, 1.8, 0] }),
    // raízes
    cube(0.34, 0.42, 0.34, trunk, { pos: [0.42, 0.18, 0.1] }),
    cube(0.34, 0.36, 0.34, trunk, { pos: [-0.36, 0.16, -0.22] }),
    cube(0.3, 0.32, 0.3, trunk, { pos: [0.05, 0.14, -0.44] }),
    // galho
    cube(0.26, 1.3, 0.26, trunk, { pos: [0.55, 2.7, 0.1], rot: [0, 0, -0.75] }),
  ];
  const layouts = [
    [[0, 4.4, 0, 2.7], [1.1, 4.0, 0.4, 1.8], [-1.0, 4.1, -0.3, 1.9], [0.2, 4.0, 1.1, 1.7], [-0.3, 3.9, -1.1, 1.7], [0.1, 5.6, 0, 1.7]],
    [[0, 4.2, 0, 2.4], [0.9, 4.9, 0.2, 1.8], [-0.9, 4.6, 0.5, 1.6], [0.1, 3.8, -1.0, 1.6], [0.3, 5.7, -0.3, 1.4]],
    [[0, 4.6, 0, 3.0], [1.3, 4.1, -0.2, 1.6], [-1.2, 4.3, 0.3, 1.8], [0.2, 4.2, 1.3, 1.5], [0, 6.0, 0.2, 1.8], [-0.4, 6.8, -0.1, 1.1]],
  ][variant % 3];
  layouts.forEach(([x, y, z, s], i) => {
    const c = new THREE.Color(leaves).offsetHSL(0, 0, (i % 3) * 0.03 - 0.02);
    parts.push(cube(s, s * 0.85, s, c, { pos: [x, y, z], rot: [0, i * 0.4, 0], top: 1.22, bottom: 0.55 }));
  });
  return merge(parts);
}

function pine() {
  // tronco alto: a primeira camada de galhos fica acima da cabeça (revisão de escala)
  const parts = [cube(0.5, 3.8, 0.5, '#6b4628', { pos: [0, 1.9, 0] })];
  const tiers = [[3.2, 3.6], [2.6, 4.7], [2.0, 5.7], [1.4, 6.6], [0.8, 7.4]];
  tiers.forEach(([s, y], i) => {
    parts.push(cube(s, 1.0, s, i % 2 ? '#2f5f3c' : '#356b43', { pos: [0, y, 0], rot: [0, i % 2 ? Math.PI / 4 : 0, 0], top: 1.25, bottom: 0.5 }));
  });
  return merge(parts);
}

function palm() {
  const parts = [];
  // tronco curvo em gomos (inclina para +x)
  let p = V(0, 0, 0);
  let angle = 0;
  for (let i = 0; i < 7; i++) {
    angle += 0.045 + i * 0.012;
    const len = 0.95;
    const dir = V(Math.sin(angle), Math.cos(angle), 0);
    const mid = p.clone().addScaledVector(dir, len / 2);
    parts.push(cube(0.46 - i * 0.025, len + 0.05, 0.46 - i * 0.025, i % 2 ? '#a17a4f' : '#8a6440', { pos: mid.toArray(), rot: [0, 0, -angle] }));
    p.addScaledVector(dir, len);
  }
  const top = p.clone();
  // folhas que caem em três segmentos
  for (let k = 0; k < 7; k++) {
    const yaw = (k / 7) * Math.PI * 2;
    let q = top.clone().add(V(0, 0.15, 0));
    let droop = -0.25;
    for (let s = 0; s < 3; s++) {
      droop += 0.38;
      const dir = V(Math.cos(yaw) * Math.cos(droop), -Math.sin(droop) + 0.35, Math.sin(yaw) * Math.cos(droop)).normalize();
      const len = 1.05 - s * 0.12;
      const mid = q.clone().addScaledVector(dir, len / 2);
      const m = new THREE.Matrix4().lookAt(V(0, 0, 0), dir, UP);
      const e = new THREE.Euler().setFromRotationMatrix(m);
      parts.push(cube(0.62 - s * 0.14, 0.09, len, s === 2 ? '#6aa552' : '#4f8f42', { pos: mid.toArray(), rot: [e.x, e.y, e.z], top: 1.2, bottom: 0.7 }));
      q = q.addScaledVector(dir, len);
    }
  }
  // cocos
  for (const [x, z] of [[0.22, 0.1], [-0.15, 0.2], [0.05, -0.22]]) parts.push(cube(0.28, 0.28, 0.28, '#5a3d22', { pos: [top.x + x, top.y - 0.25, top.z + z] }));
  return { geo: merge(parts), lean: top.x, height: top.y };
}

function bush(variant) {
  const c = ['#4d8a45', '#5c9a4a'][variant % 2];
  const parts = [
    cube(1.3, 0.9, 1.2, c, { pos: [0, 0.4, 0], top: 1.25, bottom: 0.6 }),
    cube(0.9, 0.75, 0.9, new THREE.Color(c).offsetHSL(0, 0, 0.04), { pos: [0.55, 0.5, 0.3], rot: [0, 0.5, 0], top: 1.25 }),
    cube(0.8, 0.6, 0.8, new THREE.Color(c).offsetHSL(0, 0, -0.03), { pos: [-0.5, 0.35, -0.25], rot: [0, 0.3, 0], top: 1.2 }),
  ];
  if (variant === 1) for (const [x, y, z] of [[0.3, 0.92, 0.1], [-0.3, 0.8, -0.2], [0.7, 0.9, 0.35]]) parts.push(cube(0.14, 0.14, 0.14, '#e8564a', { pos: [x, y, z] }));
  return merge(parts);
}

function grass() {
  const parts = [];
  for (const [x, z, h, r] of [[0, 0, 0.55, 0.1], [0.12, 0.08, 0.42, -0.25], [-0.1, 0.05, 0.38, 0.3], [0.03, -0.12, 0.47, -0.1]]) {
    parts.push(cube(0.06, h, 0.06, '#6f9f50', { pos: [x, h / 2, z], rot: [r, 0, r * 0.7], top: 1.3, bottom: 0.7 }));
  }
  return merge(parts);
}

function flower() {
  return merge([
    cube(0.05, 0.4, 0.05, '#5b8d43', { pos: [0, 0.2, 0] }),
    cube(0.2, 0.08, 0.2, '#ffffff', { pos: [0, 0.42, 0], top: 1.05 }),
    cube(0.08, 0.06, 0.08, '#f5cf4f', { pos: [0, 0.47, 0] }),
  ]);
}

// Pedra irregular: blocos tortos juntos, musgo no topo
function boulder(rand, { mossy = true, wet = false } = {}) {
  const parts = [];
  const pts = [];
  const n = 3 + Math.floor(rand() * 3);
  const base = wet ? '#5f6863' : '#7d847a';
  for (let i = 0; i < n; i++) {
    const s = i === 0 ? 1 : 0.5 + rand() * 0.45;
    const w = (1.3 + rand() * 0.6) * s;
    const h = (0.9 + rand() * 0.6) * s;
    const d = (1.1 + rand() * 0.6) * s;
    const pos = i === 0 ? [0, h / 2 - 0.1, 0] : [(rand() - 0.5) * 1.3, h / 2 - 0.1 + rand() * 0.3, (rand() - 0.5) * 1.2];
    const rot = [(rand() - 0.5) * 0.5, rand() * 3, (rand() - 0.5) * 0.5];
    const color = new THREE.Color(base).offsetHSL(0, 0, (rand() - 0.5) * 0.06);
    const g = cube(w, h, d, color, { pos, rot, top: 1.15, bottom: 0.6 });
    // musgo nas faces de cima
    if (mossy) {
      const nrm = g.getAttribute('normal');
      const col = g.getAttribute('color');
      const moss = new THREE.Color('#6d8f4f');
      const c = new THREE.Color();
      for (let v = 0; v < nrm.count; v++) {
        if (nrm.getY(v) > 0.7) {
          c.fromBufferAttribute(col, v).lerp(moss, 0.6);
          col.setXYZ(v, c.r, c.g, c.b);
        }
      }
    }
    const p = g.getAttribute('position');
    for (let v = 0; v < p.count; v++) pts.push(p.getX(v), p.getY(v), p.getZ(v));
    parts.push(g);
  }
  return { geo: merge(parts), points: pts };
}

// ===== Distribuição na ilha =====
export function buildNature({ scene, physics, field, rand, keepClear = [] }) {
  const clear = (x, z, pad = 0) => !keepClear.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r + pad);
  const sample = (x, z) => field.sample(x, z);
  const flat = (x, z, min = 0.88) => field.normal(x, z).y > min;
  const used = [];
  const free = (x, z, r) => !used.some((u) => Math.hypot(u.x - x, u.z - z) < r + u.r);
  const take = (x, z, r) => used.push({ x, z, r });

  const kinds = {};
  const add = (key, geo, x, y, z, { rotY = rand() * Math.PI * 2, scale = 1, tint = 1, shadow = true } = {}) => {
    if (!kinds[key]) kinds[key] = { geo, items: [], shadow };
    kinds[key].items.push({ x, y, z, rotY, scale, tint });
  };

  // árvores em bosques. Escala grande (≈1,6–2,1): a copa mais baixa fica a ≥ 5 unidades do
  // chão e o personagem (≈ 4,1) passa embaixo. Mais espaço entre elas para as copas não se
  // fundirem.
  const TREE_SCALE = 1.8;
  const broad = [broadleaf(0), broadleaf(1), broadleaf(2)];
  const groves = [[-62, -10, 15, 10], [-22, -24, 10, 6], [58, -34, 13, 8], [-64, 44, 9, 5], [40, 60, 11, 6], [-30, 68, 8, 3], [66, 8, 8, 4], [-40, 30, 6, 3]];
  let trees = 0;
  const tryTree = (x, z) => {
    const y = sample(x, z);
    if (y < 1.5 || !flat(x, z) || !clear(x, z, 2) || !free(x, z, 2.9)) return;
    const scale = (0.9 + rand() * 0.25) * TREE_SCALE;
    const v = Math.floor(rand() * 3);
    // no platô alto, pinheiros
    if (y > 12) {
      add('pinheiro', null, x, y, z, { scale: scale * 0.95 });
      physics.addCylinder({ x, y: y + 1.9 * scale * 0.95, z }, 1.9 * scale * 0.95, 0.25 * scale, { climbable: true, material: 'madeira' });
    } else {
      add('arvore' + v, broad[v], x, y, z, { scale, tint: 0.92 + rand() * 0.16 });
      physics.addCylinder({ x, y: y + 1.9 * scale, z }, 1.9 * scale, 0.31 * scale, { climbable: true, material: 'madeira' });
    }
    take(x, z, 2.9);
    trees += 1;
  };
  for (const [cx, cz, r, n] of groves) {
    for (let k = 0; k < n * 6; k++) {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * r;
      tryTree(cx + Math.cos(a) * d, cz + Math.sin(a) * d);
    }
  }
  for (let k = 0; k < 90; k++) tryTree((rand() * 2 - 1) * 78, (rand() * 2 - 1) * 74);
  // pinheiros espalhados no platô
  for (let k = 0; k < 80; k++) tryTree(-60 + rand() * 105, -44 - rand() * 22);
  kinds.pinheiro && (kinds.pinheiro.geo = pine());

  // coqueiros na areia
  const palmModel = palm();
  for (let k = 0; k < 160; k++) {
    const a = rand() * Math.PI * 2;
    let px = Math.cos(a) * 86;
    let pz = (Math.sin(a) * 86) / 1.12;
    for (let s = 0; s < 24; s++) {
      const y = sample(px, pz);
      if (y > 0.9 && y < 2.2) break;
      px *= 0.975;
      pz *= 0.975;
    }
    const y = sample(px, pz);
    if (y < 0.9 || y > 2.4 || !clear(px, pz) || !free(px, pz, 3.2)) continue;
    // inclina para o mar
    const rotY = -Math.atan2(pz, px) + (rand() - 0.5) * 0.8;
    const scale = (0.9 + rand() * 0.35) * 1.3;
    add('coqueiro', palmModel.geo, px, y - 0.1, pz, { rotY, scale });
    const lean = palmModel.lean * scale * 0.35;
    physics.addCylinder({ x: px + Math.cos(-rotY) * lean, y: y + palmModel.height * scale * 0.4, z: pz + Math.sin(-rotY) * lean }, palmModel.height * scale * 0.4, 0.3, { climbable: true, material: 'madeira' });
    take(px, pz, 3);
    if (kinds.coqueiro.items.length >= 26) break;
  }

  // arbustos (sem colisão)
  const bushes = [bush(0), bush(1)];
  for (let k = 0; k < 110; k++) {
    const x = (rand() * 2 - 1) * 80;
    const z = (rand() * 2 - 1) * 74;
    const y = sample(x, z);
    if (y < 1.3 || !flat(x, z, 0.85) || !clear(x, z, -2) || !free(x, z, 1.2)) continue;
    const v = rand() < 0.3 ? 1 : 0;
    add('arbusto' + v, bushes[v], x, y - 0.05, z, { scale: 0.7 + rand() * 0.6, shadow: false });
  }

  // pedras: grandes nas encostas e na praia, médias espalhadas
  const rockModels = [boulder(rand), boulder(rand), boulder(rand), boulder(rand, { mossy: false, wet: true })];
  const placeRock = (x, z, scale, model, sink = 0.25) => {
    const y = sample(x, z) - sink * scale;
    const rotY = rand() * Math.PI * 2;
    add('pedra' + model, rockModels[model].geo, x, y, z, { rotY, scale, tint: 0.92 + rand() * 0.14 });
    // colisão no formato da pedra (casca convexa)
    const m = new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(UP, rotY), V(scale, scale, scale));
    const src = rockModels[model].points;
    const pts = new Float32Array(src.length);
    const v = V(0, 0, 0);
    for (let i = 0; i < src.length; i += 3) {
      v.set(src[i], src[i + 1], src[i + 2]).applyMatrix4(m);
      pts[i] = v.x;
      pts[i + 1] = v.y;
      pts[i + 2] = v.z;
    }
    physics.addConvexHull(pts, { climbable: true, material: 'rocha' });
    take(x, z, 1.2 * scale);
  };
  for (let k = 0; k < 70; k++) {
    const x = (rand() * 2 - 1) * 82;
    const z = (rand() * 2 - 1) * 76;
    const y = sample(x, z);
    if (y < -0.5 || !clear(x, z) || !free(x, z, 1.8)) continue;
    const shore = y < 1.2;
    const steep = field.normal(x, z).y < 0.8;
    if (!shore && !steep && rand() < 0.55) continue;
    placeRock(x, z, shore ? 0.8 + rand() * 0.9 : 0.6 + rand() * 1.3, shore ? 3 : Math.floor(rand() * 3), shore ? 0.35 : 0.25);
  }

  // capim e flores (pequenos, sem sombra)
  const grassGeo = grass();
  const flowerGeo = flower();
  for (let k = 0; k < 900; k++) {
    const x = (rand() * 2 - 1) * 82;
    const z = (rand() * 2 - 1) * 76;
    const y = sample(x, z);
    if (y < 1.6 || !flat(x, z, 0.9)) continue;
    if (rand() < 0.12) add('flor', flowerGeo, x, y, z, { scale: 0.8 + rand() * 0.6, shadow: false, tint: 1 });
    else add('capim', grassGeo, x, y - 0.03, z, { scale: 0.8 + rand() * 0.8, shadow: false, tint: 0.85 + rand() * 0.3 });
  }

  // monta as malhas instanciadas
  const flowerColors = ['#ffffff', '#ffd2e0', '#ffe28a', '#cfe0ff'];
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0.02, flatShading: true });
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const c = new THREE.Color();
  const group = new THREE.Group();
  group.name = 'Natureza';
  for (const [key, kind] of Object.entries(kinds)) {
    const mesh = new THREE.InstancedMesh(kind.geo, material, kind.items.length);
    kind.items.forEach((it, i) => {
      q.setFromAxisAngle(UP, it.rotY);
      m.compose(V(it.x, it.y, it.z), q, V(it.scale, it.scale, it.scale));
      mesh.setMatrixAt(i, m);
      if (key === 'flor') c.set(flowerColors[i % flowerColors.length]);
      else c.setScalar(it.tint);
      mesh.setColorAt(i, c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = kind.shadow;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    mesh.name = key;
    group.add(mesh);
  }
  scene.add(group);
  return { group, trees, kinds: Object.fromEntries(Object.entries(kinds).map(([k, v]) => [k, v.items.length])) };
}

// ===== Para as outras ilhas (atualização 14) =====
// Modelos prontos (montados uma vez) e um posicionador de instâncias com a mesma aparência
let kit = null;
export function natureKit() {
  kit ??= { broad: [broadleaf(0), broadleaf(1), broadleaf(2)], pine: pine(), palm: palm(), bush: [bush(0), bush(1)] };
  return kit;
}

const kitMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0.02, flatShading: true });

// items: [{ x, y, z, rotY, scale, tint }] → uma malha instanciada (uma chamada de desenho)
export function placeInstances(scene, name, geo, items, { shadow = true, tint = null } = {}) {
  if (!items.length) return null;
  const mesh = new THREE.InstancedMesh(geo, kitMaterial, items.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const c = new THREE.Color();
  items.forEach((it, i) => {
    q.setFromAxisAngle(UP, it.rotY ?? 0);
    m.compose(V(it.x, it.y, it.z), q, V(it.scale ?? 1, it.scale ?? 1, it.scale ?? 1));
    mesh.setMatrixAt(i, m);
    if (tint) c.set(tint).multiplyScalar(it.tint ?? 1);
    else c.setScalar(it.tint ?? 1);
    mesh.setColorAt(i, c);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  mesh.computeBoundingSphere();
  mesh.name = name;
  scene.add(mesh);
  return mesh;
}
