// Mar com ondas Gerstner. A mesma soma de ondas roda na GPU (malha) e na CPU (nado, boia),
// então o personagem flutua exatamente na superfície que aparece na tela.
// A malha é radial e acompanha a câmera: densa perto, esparsa longe. A normal é calculada
// por pixel, então o brilho fica detalhado mesmo onde a malha é esparsa.
// A espuma da costa usa uma textura com a profundidade da água tirada do relevo.

import * as THREE from 'three';
import { GRAVITY } from '../movement/config.js';

// direção (x, z), comprimento de onda, amplitude, inclinação, velocidade relativa
const WAVES = [
  { dir: [0.92, 0.38], length: 19, amp: 0.3, steep: 0.55, speed: 0.62 },
  { dir: [-0.42, 0.9], length: 11.5, amp: 0.17, steep: 0.5, speed: 0.7 },
  { dir: [0.6, -0.8], length: 6.8, amp: 0.075, steep: 0.45, speed: 0.8 },
];
const prepared = WAVES.map((w) => {
  const len = Math.hypot(w.dir[0], w.dir[1]);
  const k = (2 * Math.PI) / w.length;
  return { dx: w.dir[0] / len, dz: w.dir[1] / len, k, amp: w.amp, q: w.steep / (k * w.amp * WAVES.length), c: Math.sqrt(GRAVITY / k) * w.speed };
});

// Perto da ilha (e na lagoa) o mar é mais calmo
export const calmAt = (x, z) => {
  const r = Math.hypot(x, z);
  const t = Math.min(1, Math.max(0, (r - 70) / 40));
  return 0.32 + 0.68 * t * t * (3 - 2 * t);
};

// storm: 0 (normal) … 1 (tempestade da travessia: ondas 2,6× maiores)
export function waveHeight(x, z, time, level = 0, storm = 0) {
  const calm = calmAt(x, z) * (1 + storm * 1.6);
  let y = 0;
  for (const w of prepared) y += w.amp * Math.sin(w.k * (w.dx * x + w.dz * z - w.c * time));
  return level + y * calm;
}

const glsl = (n) => n.toFixed(5);
const waveUniformBlock = prepared
  .map((w, i) => `const vec4 W${i} = vec4(${glsl(w.dx)}, ${glsl(w.dz)}, ${glsl(w.k)}, ${glsl(w.amp)}); const vec2 S${i} = vec2(${glsl(w.q)}, ${glsl(w.c)});`)
  .join('\n');

const common = /* glsl */ `
uniform float uTime;
uniform float uLevel;
uniform float uStorm;
${waveUniformBlock}
float calmAt(vec2 p) { float r = length(p); return 0.32 + 0.68 * smoothstep(70.0, 110.0, r); }
vec3 gerstner(vec4 w, vec2 s, vec2 p, float calm, inout vec3 n) {
  float f = w.z * (dot(w.xy, p) - s.y * uTime);
  float a = w.w * calm;
  float c = cos(f), sn = sin(f);
  n.x -= w.x * w.z * a * c;
  n.z -= w.y * w.z * a * c;
  n.y -= s.x * w.z * a * sn;
  return vec3(s.x * a * w.x * c, a * sn, s.x * a * w.y * c);
}
`;

const vertexShader = /* glsl */ `
${common}
#include <fog_pars_vertex>
varying vec3 vWorld;
varying float vLift;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vec2 p = world.xz;
  float calm = calmAt(p) * (1.0 + uStorm * 1.6);
  vec3 n = vec3(0.0, 1.0, 0.0);
  vec3 d = gerstner(W0, S0, p, calm, n) + gerstner(W1, S1, p, calm, n) + gerstner(W2, S2, p, calm, n);
  world.xyz += d;
  world.y += uLevel;
  vWorld = world.xyz;
  vLift = d.y;
  vec4 mvPosition = viewMatrix * world;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const fragmentShader = /* glsl */ `
${common}
#include <fog_pars_fragment>
uniform sampler2D uDepth;
uniform float uHalf;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uSkyTop;
uniform vec3 uSkyHorizon;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uDetail;
varying vec3 vWorld;
varying float vLift;
void main() {
  vec2 p = vWorld.xz;
  float calm = calmAt(p) * (1.0 + uStorm * 1.6);
  vec3 n = vec3(0.0, 1.0, 0.0);
  gerstner(W0, S0, p, calm, n); gerstner(W1, S1, p, calm, n); gerstner(W2, S2, p, calm, n);
  // marolas só para o brilho
  float r1 = sin(dot(p, vec2(1.7, 0.9)) * 1.3 - uTime * 2.1) * 0.5 + sin(dot(p, vec2(-1.1, 1.9)) * 1.1 - uTime * 1.7) * 0.5;
  n.xz += vec2(r1 * 0.035, r1 * 0.028) * uDetail;
  n = normalize(n);

  vec2 uv = (p + uHalf) / (2.0 * uHalf);
  float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  float depth = mix(14.0, texture2D(uDepth, clamp(uv, 0.0, 1.0)).r * 14.0 - 2.0, inside) + vLift;
  float shallow = 1.0 - smoothstep(0.0, 7.5, depth);

  vec3 view = normalize(cameraPosition - vWorld);
  float facing = max(dot(n, view), 0.0);
  float fresnel = 0.04 + 0.96 * pow(1.0 - facing, 5.0);
  vec3 refl = reflect(-view, n);
  vec3 sky = mix(uSkyHorizon, uSkyTop, pow(clamp(refl.y, 0.0, 1.0), 0.6));
  vec3 water = mix(uDeep, uShallow, shallow * 0.85);
  float sunLight = max(dot(n, uSunDir), 0.0);
  water *= 0.72 + 0.38 * sunLight;
  vec3 color = mix(water, sky, fresnel * 0.75);
  float spec = pow(max(dot(refl, uSunDir), 0.0), 220.0) * 2.2;
  color += uSunColor * spec;

  // espuma: faixa na beira (pulsando com as ondas) e nas cristas do mar aberto
  float shore = 1.0 - smoothstep(0.0, 0.9, depth);
  float band = smoothstep(0.35, 0.9, sin(depth * 5.5 - uTime * 1.6) * 0.5 + 0.5) * (1.0 - smoothstep(0.0, 2.4, depth));
  float near = 1.0 - smoothstep(25.0, 70.0, length(cameraPosition.xz - vWorld.xz));
  float crest = smoothstep(0.3, 0.5, vLift) * calm * near;
  float foam = clamp(shore * 0.85 + band * 0.45 + crest * 0.25, 0.0, 1.0);
  color = mix(color, vec3(0.94, 0.97, 0.95), foam);

  float alpha = mix(0.5, 0.93, smoothstep(0.0, 5.0, depth));
  alpha = clamp(alpha + fresnel * 0.25 + foam * 0.4, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

function radialGrid(rings, segments, firstRing, growth) {
  const positions = [0, 0, 0];
  const index = [];
  const a = firstRing / (Math.exp(growth) - 1);
  for (let r = 1; r <= rings; r++) {
    const radius = a * (Math.exp(growth * r) - 1);
    for (let s = 0; s < segments; s++) {
      const t = (s / segments) * Math.PI * 2;
      positions.push(Math.cos(t) * radius, 0, Math.sin(t) * radius);
    }
  }
  const at = (r, s) => 1 + (r - 1) * segments + (s % segments);
  for (let s = 0; s < segments; s++) index.push(0, at(1, s + 1), at(1, s));
  for (let r = 1; r < rings; r++) {
    for (let s = 0; s < segments; s++) {
      const a0 = at(r, s), a1 = at(r, s + 1), b0 = at(r + 1, s), b1 = at(r + 1, s + 1);
      index.push(a0, a1, b0, a1, b1, b0);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(index);
  geo.computeBoundingSphere();
  geo.boundingSphere.radius = 1e5; // a malha se move com a câmera: nunca recortar
  return geo;
}

// Profundidade da água (0..1 = -2..12 unidades) amostrada da grade do relevo
function depthTexture(field, level) {
  const n = field.row;
  const data = new Uint8Array(n * n);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const depth = level - field.at(i, j);
      data[j * n + i] = Math.round(Math.min(1, Math.max(0, (depth + 2) / 14)) * 255);
    }
  }
  const tex = new THREE.DataTexture(data, n, n, THREE.RedFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

const DETAIL = [
  { rings: 44, segments: 64, first: 1.6, growth: 0.085 },
  { rings: 60, segments: 96, first: 1.1, growth: 0.066 },
  { rings: 72, segments: 128, first: 0.8, growth: 0.058 },
];

export class Ocean {
  constructor({ scene, field, level = 0, sun, sky }) {
    this.level = level;
    this.time = 0;
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: true,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          uTime: { value: 0 },
          uLevel: { value: level },
          uStorm: { value: 0 },
          uDepth: { value: null },
          uHalf: { value: field.half },
          uDeep: { value: new THREE.Color('#1b5a74') },
          uShallow: { value: new THREE.Color('#47bcb3') },
          uSkyTop: { value: new THREE.Color('#5aa7d6') },
          uSkyHorizon: { value: new THREE.Color('#cfe7e4') },
          uSunDir: { value: new THREE.Vector3(0.45, 0.78, 0.32).normalize() },
          uSunColor: { value: new THREE.Color('#fff1dc') },
          uDetail: { value: 1 },
        },
      ]),
    });
    this.material.uniforms.uDepth.value = depthTexture(field, level);
    if (sun) this.material.uniforms.uSunDir.value.copy(sun).normalize();
    if (sky) {
      this.material.uniforms.uSkyTop.value.copy(sky.top);
      this.material.uniforms.uSkyHorizon.value.copy(sky.horizon);
    }
    this.detail = -1;
    this.mesh = new THREE.Mesh(radialGrid(4, 8, 1, 0.5), this.material);
    this.mesh.name = 'Mar';
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;
    scene.add(this.mesh);
  }

  setDetail(level) {
    if (level === this.detail) return;
    this.detail = level;
    const d = DETAIL[level] ?? DETAIL[1];
    this.mesh.geometry.dispose();
    this.mesh.geometry = radialGrid(d.rings, d.segments, d.first, d.growth);
    this.material.uniforms.uDetail.value = level === 0 ? 0.4 : 1;
  }

  update(dt, camera) {
    this.time += dt;
    this.material.uniforms.uTime.value = this.time;
    this.mesh.position.set(camera.position.x, 0, camera.position.z);
  }

  // tempestade (atualização 17): ondas maiores enquanto dura
  setStorm(k) {
    this.storm = k;
    this.material.uniforms.uStorm.value = k;
  }

  heightAt(x, z) {
    return waveHeight(x, z, this.time, this.level, this.storm ?? 0);
  }
}
