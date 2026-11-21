// Malha do terreno: relevo suave com cores por vértice (bioma, altura, inclinação) e um
// detalhe de ruído no shader (manchas de grama, grãos de areia), sem linhas de grade.
// Dividida em chunks para culling; cada chunk gera o seu colisor com os mesmos triângulos
// (a, c, b) e (b, c, d) usados pelo campo de alturas.

import * as THREE from 'three';
import { smooth } from '../core/math.js';

const CHUNK = 32; // células por chunk

// Ruído de valor no shader + variação de tom em manchas grandes
function detailMaterial() {
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94, metalness: 0.0 });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vWPos;
float tHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float tNoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(tHash(i), tHash(i + vec2(1.0, 0.0)), u.x), mix(tHash(i + vec2(0.0, 1.0)), tHash(i + vec2(1.0, 1.0)), u.x), u.y);
}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  vec2 p = vWPos.xz;
  float dist = length(cameraPosition - vWPos);
  float fine = 1.0 - smoothstep(18.0, 70.0, dist);
  float n1 = tNoise(p * 0.16);
  float n2 = tNoise(p * 0.85 + 17.0);
  float n3 = tNoise(p * 4.2 + 41.0);
  float shade = 0.88 + 0.2 * n1 + 0.1 * n2 + 0.12 * (n3 - 0.5) * fine;
  diffuseColor.rgb *= shade;
  // camadas de rocha nos barrancos
  vec3 wn = inverseTransformDirection(normalize(vNormal), viewMatrix);
  float steep = smoothstep(0.22, 0.45, 1.0 - wn.y);
  float strata = 0.5 + 0.5 * sin(vWPos.y * 3.2 + n2 * 2.5);
  diffuseColor.rgb *= 1.0 - steep * (0.16 * strata + 0.06 * n3);
  // manchas maiores: um pouco mais secas (amareladas) ou mais verdes
  float patchy = smoothstep(0.35, 0.8, tNoise(p * 0.055 + 3.0));
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.08, 1.05, 0.82), patchy * 0.55);
  // pontinhos claros (flores miúdas, grãos de areia) só de perto
  float speck = step(0.93, tNoise(p * 9.0 + 7.0)) * fine;
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.18, speck * 0.6);
}`);
  };
  material.customProgramCacheKey = () => 'terreno-detalhe-v2';
  return material;
}

export function buildTerrain({ field, physics, colorAt }) {
  const group = new THREE.Group();
  group.name = 'Terreno';
  const material = detailMaterial();
  const color = new THREE.Color();
  const n = field.count;
  const s = field.spacing;
  const h = (i, j) => field.at(Math.max(0, Math.min(n, i)), Math.max(0, Math.min(n, j)));
  let triangles = 0;

  for (let cj = 0; cj < n; cj += CHUNK) {
    for (let ci = 0; ci < n; ci += CHUNK) {
      const iEnd = Math.min(n, ci + CHUNK);
      const jEnd = Math.min(n, cj + CHUNK);
      const w = iEnd - ci + 1;
      const positions = [];
      const normals = [];
      const colors = [];
      const index = [];
      for (let j = cj; j <= jEnd; j++) {
        for (let i = ci; i <= iEnd; i++) {
          const [x, y, z] = field.point(i, j);
          positions.push(x, y, z);
          // normal suave por diferenças centrais (igual dos dois lados da borda do chunk)
          const nx = -(h(i + 1, j) - h(i - 1, j)) / (2 * s);
          const nz = -(h(i, j + 1) - h(i, j - 1)) / (2 * s);
          const len = Math.hypot(nx, 1, nz);
          normals.push(nx / len, 1 / len, nz / len);
          colorAt(x, y, z, 1 / len, color);
          colors.push(color.r, color.g, color.b);
        }
      }
      for (let j = 0; j < jEnd - cj; j++) {
        for (let i = 0; i < iEnd - ci; i++) {
          const a = j * w + i;
          const b = a + 1;
          const c = a + w;
          const d = c + 1;
          index.push(a, c, b, b, c, d);
          triangles += 2;
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geo.setIndex(index);
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, material);
      mesh.receiveShadow = true;
      mesh.name = `chunk_${ci}_${cj}`;
      group.add(mesh);
      physics.addTrimesh(new Float32Array(positions), new Uint32Array(index), { material: 'terreno', climbable: true, terrain: true });
    }
  }
  return { group, triangles };
}

// Paleta do terreno (tons do laboratório com biomas da ilha tropical), com transições suaves
const PAL = {
  seabedDeep: new THREE.Color('#3c6669'),
  seabed: new THREE.Color('#76a291'),
  sand: new THREE.Color('#e2cf98'),
  sandWet: new THREE.Color('#bfae7d'),
  grassLow: new THREE.Color('#5b9150'),
  grassHigh: new THREE.Color('#8bb06c'),
  rock: new THREE.Color('#767d72'),
  rockLight: new THREE.Color('#959b8d'),
};
const tmp = new THREE.Color();

export function tropicalColor(sandBand) {
  return (x, y, z, up, out) => {
    if (y < -0.4) {
      out.copy(PAL.seabedDeep).lerp(PAL.seabed, smooth(-10, -0.4, y));
      return out;
    }
    const sandy = sandBand(x, z, y);
    out.copy(PAL.grassLow).lerp(PAL.grassHigh, smooth(1, 16, y));
    if (sandy > 0) out.lerp(y < 0.6 ? PAL.sandWet : PAL.sand, sandy);
    if (y < 0.2) out.lerp(PAL.seabed, smooth(0.2, -0.4, y));
    // barrancos viram pedra aos poucos
    const rocky = smooth(0.82, 0.6, up);
    if (rocky > 0) out.lerp(tmp.copy(PAL.rock).lerp(PAL.rockLight, smooth(2, 16, y)), rocky);
    return out;
  };
}
