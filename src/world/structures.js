// Construções em blocos no estilo FRUTO: cada bloco tem colisor, etiqueta (escalável ou não)
// e é juntado por material numa malha só, com contornos, para poucas chamadas de desenho.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Cada estilo tem cores e um padrão de blocos (pedras, tijolos, tábuas) pintado por
// vértice: a malha continua uma caixa simples, só a superfície ganha desenho.
export const STYLES = {
  pedra: { color: '#7b8276', top: '#7f9a6a', climbable: true, material: 'rocha', tile: [1.15, 0.95], offset: true, jitter: 0.16, moss: 0.35 },
  pedraLisa: { color: '#c3bba5', top: '#d6cfba', climbable: false, material: 'pedra', tile: [1.7, 0.85], offset: true, jitter: 0.07 },
  madeira: { color: '#8f5f37', top: '#a8733f', climbable: false, material: 'madeira', tile: [9, 0.42], plank: true, jitter: 0.13 },
  muro: { color: '#dcd2b8', top: '#e9e1c9', climbable: false, material: 'pedra', tile: [0.95, 0.48], offset: true, jitter: 0.06 },
  rampa: { color: '#c9b78a', top: '#dbcb9c', climbable: false, material: 'pedra', tile: [1.1, 1.1], offset: false, jitter: 0.08 },
  trepadeira: { color: '#56804c', top: '#6f9a5f', climbable: true, material: 'planta', tile: [0.8, 0.8], offset: true, jitter: 0.2 },
  lonaRoxa: { color: '#5b2a86', top: '#6b3aa0', climbable: false, material: 'tecido', tile: [9, 9], offset: false, jitter: 0.02 },
  lonaOuro: { color: '#e0a83a', top: '#f2c14e', climbable: false, material: 'tecido', tile: [9, 9], offset: false, jitter: 0.02 },
  // vila (atualização 9)
  tijolo: { color: '#b5583a', top: '#c86a48', climbable: false, material: 'pedra', tile: [0.7, 0.32], offset: true, jitter: 0.08 },
  reboco: { color: '#efe4cc', top: '#f6eedb', climbable: false, material: 'pedra', tile: [3, 3], offset: false, jitter: 0.03 },
  telhado: { color: '#b84a2a', top: '#c85a34', climbable: false, material: 'pedra', tile: [0.6, 0.4], offset: true, jitter: 0.06 },
  telhadoAzul: { color: '#3a6a9c', top: '#4a7cb0', climbable: false, material: 'pedra', tile: [0.6, 0.4], offset: true, jitter: 0.06 },
  caminho: { color: '#b7ab92', top: '#c9bd9f', climbable: false, material: 'pedra', tile: [0.9, 0.9], offset: true, jitter: 0.1 },
  janela: { color: '#2a3a58', top: '#2a3a58', climbable: false, material: 'pedra', tile: [9, 9], offset: false, jitter: 0.02 },
  agua: { color: '#4fb6d8', top: '#7fd0ea', climbable: false, material: 'pedra', tile: [9, 9], offset: false, jitter: 0.03 },
  lanterna: { color: '#ffd45e', top: '#fff2a0', climbable: false, material: 'pedra', tile: [9, 9], offset: false, jitter: 0.02 },
};

const FACES = [
  // origem (em meias medidas), eixo U, eixo V, normal; U × V = normal
  { o: [1, -1, 1], u: [0, 0, -1], v: [0, 1, 0], n: [1, 0, 0], ul: 'z', vl: 'y' },
  { o: [-1, -1, -1], u: [0, 0, 1], v: [0, 1, 0], n: [-1, 0, 0], ul: 'z', vl: 'y' },
  { o: [-1, -1, 1], u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1], ul: 'x', vl: 'y' },
  { o: [1, -1, -1], u: [-1, 0, 0], v: [0, 1, 0], n: [0, 0, -1], ul: 'x', vl: 'y' },
  { o: [-1, 1, 1], u: [1, 0, 0], v: [0, 0, -1], n: [0, 1, 0], ul: 'x', vl: 'z' },
  { o: [-1, -1, -1], u: [1, 0, 0], v: [0, 0, 1], n: [0, -1, 0], ul: 'x', vl: 'z' },
];

// ruído determinístico por bloco
const hash = (a, b, c) => {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

function patternedBox(w, h, d, style, seed = 0) {
  const half = { x: w / 2, y: h / 2, z: d / 2 };
  const size = { x: w, y: h, z: d };
  const positions = [];
  const normals = [];
  const colors = [];
  const base = new THREE.Color(style.color);
  const top = new THREE.Color(style.top);
  const c = new THREE.Color();
  FACES.forEach((f, fi) => {
    const uLen = size[f.ul];
    const vLen = size[f.vl];
    const isTop = f.n[1] > 0.5;
    const isBottom = f.n[1] < -0.5;
    // tábuas correm no sentido mais comprido; nos outros estilos, fileiras de blocos
    let [tu, tv] = style.tile;
    if (style.plank && !isTop && !isBottom && uLen < vLen) [tu, tv] = [tv, tu];
    if (style.plank && (isTop || isBottom) && uLen < vLen) [tu, tv] = [tv, tu];
    const rowsV = Math.max(1, Math.round(vLen / tv));
    const stepV = vLen / rowsV;
    const o = new THREE.Vector3(f.o[0] * half.x, f.o[1] * half.y, f.o[2] * half.z);
    const U = new THREE.Vector3(...f.u);
    const V = new THREE.Vector3(...f.v);
    for (let j = 0; j < rowsV; j++) {
      const shift = style.offset && j % 2 ? tu / 2 : 0;
      const v0 = j * stepV;
      const v1 = (j + 1) * stepV;
      for (let u0 = -shift; u0 < uLen - 1e-4; u0 += tu) {
        const a = Math.max(0, u0);
        const b = Math.min(uLen, u0 + tu);
        if (b - a < 1e-4) continue;
        const r = hash(seed + fi * 31, j, Math.round(u0 * 10));
        c.copy(isTop ? top : base);
        const k = 1 + (r - 0.5) * 2 * style.jitter;
        c.multiplyScalar(isBottom ? 0.68 * k : k);
        // sombra suave na base das paredes altas
        if (!isTop && !isBottom) c.multiplyScalar(0.82 + 0.18 * Math.min(1, (v0 + v1) / 2 / Math.min(vLen, 3)));
        if (style.moss && !isBottom && r > 1 - style.moss * (isTop ? 1 : 0.35)) c.lerp(new THREE.Color('#6f8f55'), isTop ? 0.55 : 0.3);
        const p = (uu, vv) => o.clone().addScaledVector(U, uu).addScaledVector(V, vv);
        const q = [p(a, v0), p(b, v0), p(b, v1), p(a, v1)];
        for (const idx of [0, 1, 2, 0, 2, 3]) {
          positions.push(q[idx].x, q[idx].y, q[idx].z);
          normals.push(...f.n);
          colors.push(c.r, c.g, c.b);
        }
      }
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return geo;
}

export class StructureBuilder {
  constructor(scene, physics) {
    this.scene = scene;
    this.physics = physics;
    this.parts = new Map(); // estilo -> geometrias
    this.edges = [];
    this.signs = [];
    this.group = new THREE.Group();
    this.group.name = 'Estruturas';
    scene.add(this.group);
  }

  addGeometry(styleId, geo, outline) {
    if (!this.parts.has(styleId)) this.parts.set(styleId, []);
    this.parts.get(styleId).push(geo);
    this.edges.push(new THREE.EdgesGeometry(outline, 30));
    this.count = (this.count || 0) + 1;
  }

  // Bloco: (x, z) é o centro; y é a base
  block({ x, y, z, w, h, d, rotY = 0, style = 'pedra', climbable }) {
    const st = STYLES[style];
    const geo = patternedBox(w, h, d, st, (this.count || 0) * 7 + 1);
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(x, y + h / 2, z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY),
      new THREE.Vector3(1, 1, 1),
    );
    geo.applyMatrix4(m);
    this.addGeometry(style, geo, new THREE.BoxGeometry(w, h, d).applyMatrix4(m));
    this.physics.addBox({ x, y: y + h / 2, z }, { x: w / 2, y: h / 2, z: d / 2 }, rotY, {
      climbable: climbable ?? st.climbable,
      material: st.material,
    });
  }

  // Rampa: começa no chão em (x, baseY, z) e sobe `rise` ao longo da direção rotY
  ramp({ x, z, baseY, width, angleDeg, rise, rotY = 0, style = 'rampa', thickness = 0.6 }) {
    const angle = (angleDeg * Math.PI) / 180;
    const length = rise / Math.sin(angle);
    const run = rise / Math.tan(angle);
    const q = new THREE.Quaternion()
      .setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY)
      .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -angle));
    const forward = new THREE.Vector3(Math.sin(rotY), 0, Math.cos(rotY));
    // centro da superfície no meio da rampa, depois desce meia espessura pela normal
    const surfaceMid = new THREE.Vector3(x, baseY + rise / 2, z).addScaledVector(forward, run / 2);
    const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    const center = surfaceMid.clone().addScaledVector(normal, -thickness / 2);
    const st = STYLES[style];
    const geo = patternedBox(width, thickness, length, st, (this.count || 0) * 7 + 3);
    const m = new THREE.Matrix4().compose(center, q, new THREE.Vector3(1, 1, 1));
    geo.applyMatrix4(m);
    this.addGeometry(style, geo, new THREE.BoxGeometry(width, thickness, length).applyMatrix4(m));
    this.physics.addBoxRotated(center, { x: width / 2, y: thickness / 2, z: length / 2 }, q, { climbable: false, material: st.material, ramp: true });
    // apoio sólido embaixo da ponta alta
    this.block({ x: x + forward.x * (run + 0.6), y: baseY, z: z + forward.z * (run + 0.6), w: width, h: rise, d: 1.2, rotY, style: 'muro' });
  }

  // Placa com texto (indica cada desafio). `hint` aparece na tela quando o jogador chega perto.
  sign({ x, y, z, rotY = 0, title, hint }) {
    this.block({ x, y, z, w: 0.35, h: 2.4, d: 0.35, rotY, style: 'madeira' });
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 192);
    g.addColorStop(0, '#2b2142');
    g.addColorStop(1, '#171327');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 192);
    ctx.strokeStyle = '#d9a64a';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 502, 182);
    ctx.strokeStyle = '#6b4a1c';
    ctx.lineWidth = 3;
    ctx.strokeRect(16, 16, 480, 160);
    ctx.fillStyle = '#ffe9b3';
    ctx.font = 'bold 64px Cinzel, Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 256, 98, 470);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const frame = new THREE.MeshStandardMaterial({ color: '#b8862f', roughness: 0.5, metalness: 0.3 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.05, 0.12), [
      frame,
      frame,
      frame,
      frame,
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }),
    ]);
    board.position.set(x, y + 2.75, z);
    board.rotation.y = rotY;
    board.castShadow = true;
    this.group.add(board);
    this.signs.push({ x, y, z, title, hint });
  }

  finish() {
    for (const [styleId, geos] of this.parts) {
      const merged = mergeGeometries(geos, false);
      const mesh = new THREE.Mesh(merged, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0.02 }));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = `estruturas_${styleId}`;
      this.group.add(mesh);
      geos.forEach((g) => g.dispose());
    }
    if (this.edges.length) {
      const lines = new THREE.LineSegments(
        mergeGeometries(this.edges, false),
        new THREE.LineBasicMaterial({ color: 0x1d2526, transparent: true, opacity: 0.35 }),
      );
      this.group.add(lines);
      this.edges.forEach((g) => g.dispose());
    }
    this.parts.clear();
    this.edges = [];
  }
}
