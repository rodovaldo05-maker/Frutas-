// Construções em blocos no estilo FRUTO: cada bloco tem colisor, etiqueta (escalável ou não)
// e é juntado por material numa malha só, com contornos, para poucas chamadas de desenho.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const STYLES = {
  pedra: { color: '#7c8377', top: '#9aa391', climbable: true, material: 'rocha' },
  pedraLisa: { color: '#bdb9aa', top: '#d4d0c1', climbable: false, material: 'pedra' },
  madeira: { color: '#94643a', top: '#b07c4a', climbable: false, material: 'madeira' },
  muro: { color: '#d8d0b9', top: '#e9e2cd', climbable: false, material: 'pedra' },
  rampa: { color: '#c7b688', top: '#ddcd9d', climbable: false, material: 'pedra' },
  trepadeira: { color: '#56804c', top: '#6f9a5f', climbable: true, material: 'planta' },
};

function shadedBox(w, h, d, style) {
  const geo = new THREE.BoxGeometry(w, h, d).toNonIndexed();
  const base = new THREE.Color(style.color);
  const top = new THREE.Color(style.top);
  const dark = base.clone().multiplyScalar(0.72);
  const normals = geo.getAttribute('normal');
  const colors = [];
  for (let i = 0; i < normals.count; i++) {
    const ny = normals.getY(i);
    const c = ny > 0.5 ? top : ny < -0.5 ? dark : base;
    colors.push(c.r, c.g, c.b);
  }
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

  addGeometry(styleId, geo) {
    if (!this.parts.has(styleId)) this.parts.set(styleId, []);
    this.parts.get(styleId).push(geo);
    this.edges.push(new THREE.EdgesGeometry(geo, 30).applyMatrix4(new THREE.Matrix4()));
  }

  // Bloco: (x, z) é o centro; y é a base
  block({ x, y, z, w, h, d, rotY = 0, style = 'pedra', climbable }) {
    const st = STYLES[style];
    const geo = shadedBox(w, h, d, st);
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(x, y + h / 2, z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY),
      new THREE.Vector3(1, 1, 1),
    );
    geo.applyMatrix4(m);
    this.addGeometry(style, geo);
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
    const geo = shadedBox(width, thickness, length, st);
    geo.applyMatrix4(new THREE.Matrix4().compose(center, q, new THREE.Vector3(1, 1, 1)));
    this.addGeometry(style, geo);
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
    ctx.fillStyle = '#191f20';
    ctx.fillRect(0, 0, 512, 192);
    ctx.strokeStyle = '#ff9b79';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 502, 182);
    ctx.fillStyle = '#edf0e9';
    ctx.font = 'bold 64px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 256, 98, 470);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.05, 0.12), [
      new THREE.MeshStandardMaterial({ color: '#2a2f30' }),
      new THREE.MeshStandardMaterial({ color: '#2a2f30' }),
      new THREE.MeshStandardMaterial({ color: '#2a2f30' }),
      new THREE.MeshStandardMaterial({ color: '#2a2f30' }),
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
