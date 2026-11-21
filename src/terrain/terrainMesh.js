// Malha do terreno no estilo do FRUTO Laboratório: relevo facetado, cores por altura e
// bioma, linhas de grade e curvas de nível. Dividida em chunks para culling.
// Cada chunk também gera o seu colisor (trimesh com os mesmos triângulos).

import * as THREE from 'three';
import { smooth } from '../core/math.js';

const CHUNK = 32; // células por chunk

export function buildTerrain({ field, physics, colorAt, contourStep = 1.5, waterLevel = 0 }) {
  const group = new THREE.Group();
  group.name = 'Terreno';
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.02, flatShading: true });
  // Grade e curvas de nível numa só malha de linhas por chunk (cores por vértice)
  const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.22, depthWrite: false });
  const GRID = [0.84, 0.89, 0.78];
  const CONTOUR = [1.0, 0.95, 0.72];
  const color = new THREE.Color();
  const n = field.count;
  let triangles = 0;

  for (let cj = 0; cj < n; cj += CHUNK) {
    for (let ci = 0; ci < n; ci += CHUNK) {
      const positions = [];
      const colors = [];
      const grid = [];
      const contours = [];
      const collVerts = [];
      const collIdx = [];

      const face = (a, b, c) => {
        positions.push(...a, ...b, ...c);
        const cx = (a[0] + b[0] + c[0]) / 3;
        const cy = (a[1] + b[1] + c[1]) / 3;
        const cz = (a[2] + b[2] + c[2]) / 3;
        // inclinação do triângulo para pintar pedra nos barrancos
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
        const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        const up = Math.abs(ny) / Math.hypot(nx, ny, nz);
        colorAt(cx, cy, cz, up, color);
        for (let k = 0; k < 3; k++) colors.push(color.r, color.g, color.b);
        const base = collVerts.length / 3;
        collVerts.push(...a, ...b, ...c);
        collIdx.push(base, base + 1, base + 2);
        for (const level of contourLevels(a[1], b[1], c[1], contourStep)) {
          const p = [];
          for (const [u, v] of [[a, b], [b, c], [c, a]]) {
            if ((u[1] < level) === (v[1] < level)) continue;
            const t = (level - u[1]) / (v[1] - u[1]);
            p.push([u[0] + (v[0] - u[0]) * t, level + 0.02, u[2] + (v[2] - u[2]) * t]);
          }
          if (p.length === 2) contours.push(...p[0], ...p[1]);
        }
        triangles += 1;
      };

      const iEnd = Math.min(n, ci + CHUNK);
      const jEnd = Math.min(n, cj + CHUNK);
      for (let j = cj; j < jEnd; j++) {
        for (let i = ci; i < iEnd; i++) {
          const a = field.point(i, j);
          const b = field.point(i + 1, j);
          const c = field.point(i, j + 1);
          const d = field.point(i + 1, j + 1);
          face(a, c, b);
          face(b, c, d);
          // linhas da grade a cada 2 células (só acima da água, onde aparecem)
          if (i % 2 === 0 && Math.max(a[1], c[1]) > waterLevel - 0.5) grid.push(a[0], a[1] + 0.03, a[2], c[0], c[1] + 0.03, c[2]);
          if (j % 2 === 0 && Math.max(a[1], b[1]) > waterLevel - 0.5) grid.push(a[0], a[1] + 0.03, a[2], b[0], b[1] + 0.03, b[2]);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, material);
      mesh.receiveShadow = true;
      mesh.name = `chunk_${ci}_${cj}`;
      group.add(mesh);
      if (grid.length || contours.length) group.add(lines(grid, contours, lineMat, GRID, CONTOUR));
      physics.addTrimesh(new Float32Array(collVerts), new Uint32Array(collIdx), { material: 'terreno', climbable: true, terrain: true });
    }
  }
  return { group, triangles };
}

function lines(grid, contours, material, gridColor, contourColor) {
  const positions = grid.concat(contours);
  const colors = [];
  for (let i = 0; i < grid.length / 3; i++) colors.push(...gridColor);
  for (let i = 0; i < contours.length / 3; i++) colors.push(...contourColor);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.computeBoundingSphere();
  return new THREE.LineSegments(g, material);
}

function contourLevels(a, b, c, step) {
  const lo = Math.min(a, b, c);
  const hi = Math.max(a, b, c);
  const out = [];
  for (let level = Math.ceil(lo / step) * step; level <= hi; level += step) {
    if (level > 0.4) out.push(level); // sem curvas no fundo do mar
  }
  return out;
}

// Paleta do terreno (tons do laboratório com biomas da ilha tropical)
const PAL = {
  seabedDeep: new THREE.Color('#3f6a6c'),
  seabed: new THREE.Color('#6f9a8e'),
  sand: new THREE.Color('#d8c690'),
  sandWet: new THREE.Color('#b9a879'),
  grassLow: new THREE.Color('#5f8a58'),
  grassHigh: new THREE.Color('#86a273'),
  rock: new THREE.Color('#737a70'),
  rockLight: new THREE.Color('#8e9488'),
};

export function tropicalColor(sandBand) {
  return (x, y, z, up, out) => {
    if (y < -0.4) {
      out.copy(PAL.seabedDeep).lerp(PAL.seabed, smooth(-10, -0.4, y));
      return out;
    }
    const sandy = sandBand(x, z, y);
    if (up < 0.62) {
      out.copy(PAL.rock).lerp(PAL.rockLight, smooth(2, 16, y));
      return out;
    }
    out.copy(PAL.grassLow).lerp(PAL.grassHigh, smooth(1, 16, y));
    if (sandy > 0) out.lerp(y < 0.6 ? PAL.sandWet : PAL.sand, sandy);
    if (up < 0.8) out.lerp(PAL.rock, (0.8 - up) * 2.5);
    return out;
  };
}
