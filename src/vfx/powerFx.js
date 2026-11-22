// Efeitos dos poderes das frutas, no estilo voxel: partículas em cubos (uma InstancedMesh
// para todas), anéis de choque, marcas no chão (aviso antes do golpe), pilares, projéteis
// com rastro, ondas e muralhas. Tudo na cor da fruta, com limite de peças para o celular.

import * as THREE from 'three';

const MAX_PARTS = 420;
const MAX_GLOW = 280;

// textura redonda e macia para brilhos (um canvas pequeno, criado uma vez)
let glowTex = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.75)');
  grd.addColorStop(0.6, 'rgba(255,255,255,0.18)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  glowTex = new THREE.CanvasTexture(c);
  return glowTex;
}

// pontos brilhantes (aditivos) com tamanho e cor por ponto: faíscas e halos
const glowVertex = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
attribute vec3 aColor;
uniform float uViewH;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * projectionMatrix[1][1] * uViewH * 0.5 / max(0.5, -mv.z);
  vColor = aColor;
  vAlpha = aAlpha;
}`;
const glowFragment = /* glsl */ `
uniform sampler2D uMap;
varying vec3 vColor;
varying float vAlpha;
void main() {
  float a = texture2D(uMap, gl_PointCoord).a * vAlpha;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor * a, a);
}`;

export class PowerFx {
  constructor(scene, { ground = () => 0, light = false } = {}) {
    this.scene = scene;
    this.ground = ground;
    this.light = light;
    this.items = []; // malhas temporárias { obj, t, life, update }
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.95, depthWrite: false });
    this.parts = new THREE.InstancedMesh(geo, mat, MAX_PARTS);
    this.parts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.parts.frustumCulled = false;
    this.parts.count = 0;
    this.parts.renderOrder = 4;
    scene.add(this.parts);
    this.pool = [];
    this.m = new THREE.Matrix4();
    this.q = new THREE.Quaternion();
    this.c = new THREE.Color();
    this.ringGeo = new THREE.RingGeometry(0.86, 1, 40);
    this.discGeo = new THREE.CircleGeometry(1, 40);
    this.boxGeo = geo;
    this.orbGeo = new THREE.IcosahedronGeometry(1, 0);
    this.cylGeo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
    // brilhos: Points aditivos (uma chamada de desenho para todos)
    this.glow = [];
    const gGeo = new THREE.BufferGeometry();
    gGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_GLOW * 3), 3));
    gGeo.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(MAX_GLOW * 3), 3));
    gGeo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(MAX_GLOW), 1));
    gGeo.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(MAX_GLOW), 1));
    this.glowPoints = new THREE.Points(gGeo, new THREE.ShaderMaterial({
      vertexShader: glowVertex,
      fragmentShader: glowFragment,
      uniforms: { uMap: { value: glowTexture() }, uViewH: { value: 800 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    this.glowPoints.frustumCulled = false;
    this.glowPoints.renderOrder = 5;
    scene.add(this.glowPoints);
    this.viewH = () => 800; // altura da tela em pixels (main.js troca pela do renderizador)
  }

  // ===== Brilhos (faíscas e halos que somem) =====
  spark(pos, color, { count = 6, speed = 4, size = 0.9, life = 0.5, up = 2, gravity = -6, spread = 0.6 } = {}) {
    const n = this.light ? Math.ceil(count * 0.5) : count;
    for (let i = 0; i < n && this.glow.length < MAX_GLOW; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random() * 0.7);
      this.glow.push({
        x: pos.x + (Math.random() - 0.5) * spread, y: pos.y + Math.random() * 0.3, z: pos.z + (Math.random() - 0.5) * spread,
        vx: Math.cos(a) * s, vy: up * (0.4 + Math.random()), vz: Math.sin(a) * s,
        size: size * (0.6 + Math.random() * 0.8), life: life * (0.7 + Math.random() * 0.6), t: 0, gravity,
        color: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.25 * Math.random()), grow: 0,
      });
    }
  }

  // clarão de impacto: halo grande que cresce e some rápido (mais um miolo branco)
  flash(pos, color, size = 3.2, life = 0.3) {
    if (this.glow.length >= MAX_GLOW - 2) return;
    const base = { x: pos.x, y: pos.y, z: pos.z, vx: 0, vy: 0, vz: 0, t: 0, gravity: 0 };
    this.glow.push({ ...base, size, life, color: new THREE.Color(color), grow: 1.2 });
    this.glow.push({ ...base, size: size * 0.45, life: life * 0.7, color: new THREE.Color('#ffffff'), grow: 0.8 });
  }

  // ===== Partículas (cubos) =====
  burst(pos, color, { count = 14, speed = 6, size = 0.28, life = 0.6, up = 3, gravity = -14, spread = 1 } = {}) {
    const n = this.light ? Math.ceil(count * 0.5) : count;
    for (let i = 0; i < n && this.pool.length < MAX_PARTS; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.6);
      this.pool.push({
        x: pos.x + (Math.random() - 0.5) * spread, y: pos.y + Math.random() * 0.4, z: pos.z + (Math.random() - 0.5) * spread,
        vx: Math.cos(a) * s, vy: up * (0.5 + Math.random()), vz: Math.sin(a) * s,
        size: size * (0.6 + Math.random() * 0.8), life, t: 0, gravity, color: new THREE.Color(color).offsetHSL(0, 0, (Math.random() - 0.5) * 0.2), spin: Math.random() * 6,
      });
    }
    // faíscas brilhantes junto com os cubos
    this.spark(pos, color, { count: Math.max(1, Math.round(count / 2)), speed: speed * 0.8, size: size * 3.6, life: life * 0.9, up, gravity: gravity * 0.5, spread });
  }

  // linha de partículas (rastro de investida, faixa)
  line(from, to, color, { count = 16, ...opts } = {}) {
    for (let i = 0; i < count; i++) {
      const t = i / Math.max(1, count - 1);
      this.burst({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, z: from.z + (to.z - from.z) * t }, color, { count: 1, speed: 1.5, up: 2, ...opts });
    }
  }

  // ===== Malhas temporárias =====
  add(obj, life, update) {
    this.scene.add(obj);
    this.items.push({ obj, t: 0, life, update });
    return obj;
  }

  mat(color, opacity = 0.8, additive = true) {
    return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
  }

  // anel de choque que cresce no chão
  ring(pos, color, radius, life = 0.45) {
    const g = new THREE.Group();
    const m = new THREE.Mesh(this.ringGeo, this.mat(color, 0.9));
    const inner = new THREE.Mesh(this.ringGeo, this.mat('#ffffff', 0.7));
    const disc = new THREE.Mesh(this.discGeo, this.mat(color, 0.35));
    for (const o of [m, inner, disc]) o.rotation.x = -Math.PI / 2;
    inner.position.y = 0.02;
    g.add(disc, m, inner);
    const y = this.ground(pos.x, pos.z) + 0.08;
    g.position.set(pos.x, y, pos.z);
    this.flash({ x: pos.x, y: y + 0.4, z: pos.z }, color, radius * 0.9, life * 0.6);
    return this.add(g, life, (it, u) => {
      const e = 1 - (1 - u) ** 3;
      m.scale.setScalar(0.2 + radius * e);
      inner.scale.setScalar(0.1 + radius * 0.82 * Math.min(1, e * 1.25));
      disc.scale.setScalar(0.2 + radius * e * 0.95);
      m.material.opacity = 0.9 * (1 - u);
      inner.material.opacity = 0.7 * (1 - u) ** 2;
      disc.material.opacity = 0.35 * (1 - u) ** 2;
    });
  }

  // marca no chão (aviso) que pulsa até o golpe
  mark(pos, color, radius, life) {
    const g = new THREE.Group();
    const disc = new THREE.Mesh(this.discGeo, this.mat(color, 0.18));
    const edge = new THREE.Mesh(this.ringGeo, this.mat(color, 0.75));
    disc.rotation.x = edge.rotation.x = -Math.PI / 2;
    g.add(disc, edge);
    g.position.set(pos.x, this.ground(pos.x, pos.z) + 0.06, pos.z);
    g.scale.setScalar(radius);
    return this.add(g, life, (it, u) => {
      edge.material.opacity = 0.45 + 0.4 * Math.abs(Math.sin(u * 18));
      disc.material.opacity = 0.12 + 0.18 * u;
    });
  }

  // faixa retangular no chão (aviso ou golpe em linha)
  lane(start, dir, length, halfWidth, color, life = 0.5) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(halfWidth * 2, length), this.mat(color, 0.5));
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = -Math.atan2(dir.x, dir.z);
    const c = { x: start.x + dir.x * length * 0.5, z: start.z + dir.z * length * 0.5 };
    m.position.set(c.x, this.ground(c.x, c.z) + 0.1, c.z);
    return this.add(m, life, (it, u) => (m.material.opacity = 0.55 * (1 - u)), true);
  }

  // pilar (fogo, raio, geodo, cristal) que sobe e some
  pillar(pos, color, radius, height, life = 0.6) {
    // coluna translúcida por fora, miolo claro por dentro, clarão na base e faíscas subindo
    const g = new THREE.Group();
    const outer = new THREE.Mesh(this.cylGeo, this.mat(color, 0.6));
    const core = new THREE.Mesh(this.cylGeo, this.mat('#ffffff', 0.55));
    g.add(outer, core);
    const y = this.ground(pos.x, pos.z);
    g.position.set(pos.x, y, pos.z);
    this.flash({ x: pos.x, y: y + 0.5, z: pos.z }, color, radius * 2.2, life * 0.5);
    this.spark({ x: pos.x, y: y + 0.3, z: pos.z }, color, { count: 10, speed: radius * 1.6, size: 0.7, up: height * 1.1, gravity: -2, life: life * 1.1, spread: radius });
    return this.add(g, life, (it, u) => {
      const h = height * Math.min(1, u * 4);
      const r = radius * 0.5 * (1 - u * 0.6);
      outer.scale.set(r, h, r);
      outer.position.y = h / 2;
      core.scale.set(r * 0.45, h * 1.02, r * 0.45);
      core.position.y = h / 2;
      g.rotation.y = u * 3;
      outer.material.opacity = 0.6 * (1 - u);
      core.material.opacity = 0.55 * (1 - u) ** 2;
    });
  }

  // muralha (gelo) na frente do personagem
  wall(pos, yaw, color, life) {
    const m = new THREE.Mesh(this.boxGeo, new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.7, roughness: 0.2, metalness: 0.1, emissive: color, emissiveIntensity: 0.25 }));
    const y = this.ground(pos.x, pos.z);
    m.rotation.y = yaw;
    return this.add(m, life, (it, u) => {
      const grow = Math.min(1, it.t * 5);
      m.scale.set(4.6, 4.2 * grow, 0.7);
      m.position.set(pos.x, y + 2.1 * grow - 0.2, pos.z);
      m.material.opacity = u > 0.85 ? 0.7 * (1 - u) / 0.15 : 0.7;
    });
  }

  // projétil brilhante com rastro; quem move é o sistema de poderes
  orb(color, size = 0.55) {
    const m = new THREE.Mesh(this.orbGeo, this.mat(color, 0.95));
    m.scale.setScalar(size);
    return this.add(m, 99, (it) => {
      m.rotation.x += 0.3;
      m.rotation.y += 0.21;
      if (Math.random() < 0.7) this.burst(m.position, color, { count: 1, speed: 0.6, up: 0.6, size: size * 0.6, life: 0.35, gravity: 0 });
      // halo e rastro brilhante
      if (this.glow.length < MAX_GLOW) this.glow.push({ x: m.position.x, y: m.position.y, z: m.position.z, vx: 0, vy: 0, vz: 0, t: 0, gravity: 0, size: size * 3.2, life: 0.22, color: new THREE.Color(color), grow: -0.6 });
    });
  }

  // redemoinho (puxa) girando no chão
  vortex(pos, color, radius, life) {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(this.ringGeo, this.mat(color, 0.55));
      r.rotation.x = -Math.PI / 2;
      r.scale.setScalar(radius * (1 - i * 0.28));
      g.add(r);
    }
    g.position.set(pos.x, this.ground(pos.x, pos.z) + 0.12, pos.z);
    return this.add(g, life, (it, u) => {
      g.rotation.y += 0.12;
      g.children.forEach((r, i) => {
        r.position.y = i * 0.5 + Math.sin(it.t * 6 + i) * 0.15;
        r.material.opacity = 0.55 * (1 - u * u);
      });
      if (Math.random() < 0.5) {
        const a = Math.random() * Math.PI * 2;
        this.burst({ x: pos.x + Math.cos(a) * radius, y: g.position.y, z: pos.z + Math.sin(a) * radius }, color, { count: 1, speed: 0.5, up: 1.5, life: 0.5, gravity: 0 });
      }
    });
  }

  // cone (sopro, onda, rugido) à frente
  cone(pos, yaw, color, range, angle, life = 0.4) {
    const half = (angle * Math.PI) / 360;
    const geo = new THREE.CircleGeometry(1, 24, Math.PI / 2 - half, half * 2);
    const m = new THREE.Mesh(geo, this.mat(color, 0.55));
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = yaw;
    m.position.set(pos.x, this.ground(pos.x, pos.z) + 0.15, pos.z);
    for (let i = 0; i < 10; i++) {
      const a = yaw + (Math.random() * 2 - 1) * half;
      const d = range * (0.3 + Math.random() * 0.7);
      this.burst({ x: pos.x + Math.sin(a) * d, y: pos.y + 1.6, z: pos.z + Math.cos(a) * d }, color, { count: 1, speed: 2, up: 1, life: 0.5 });
    }
    return this.add(m, life, (it, u) => {
      m.scale.setScalar(range * (0.3 + 0.7 * (1 - (1 - u) ** 2)));
      m.material.opacity = 0.55 * (1 - u);
    });
  }

  // raio em zigue-zague entre dois pontos
  bolt(from, to, color, life = 0.25) {
    const pts = [];
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const j = i === 0 || i === n ? 0 : 0.6;
      pts.push(new THREE.Vector3(from.x + (to.x - from.x) * t + (Math.random() - 0.5) * j, from.y + (to.y - from.y) * t + (Math.random() - 0.5) * j, from.z + (to.z - from.z) * t + (Math.random() - 0.5) * j));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending }));
    // brilho ao longo do raio e clarão onde cai
    for (let i = 1; i < pts.length; i += 2) {
      if (this.glow.length >= MAX_GLOW) break;
      this.glow.push({ x: pts[i].x, y: pts[i].y, z: pts[i].z, vx: 0, vy: 0, vz: 0, t: 0, gravity: 0, size: 1.1, life: life * 0.9, color: new THREE.Color(color), grow: 0 });
    }
    this.flash(to, color, 2.2, life * 1.2);
    return this.add(line, life, (it, u) => (line.material.opacity = 1 - u), true);
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.t += dt;
      const u = Math.min(1, it.t / it.life);
      it.update?.(it, u);
      if (it.t >= it.life || it.dead) {
        this.scene.remove(it.obj);
        it.obj.traverse?.((o) => {
          if (o.material) o.material.dispose?.();
          if (o.geometry && o.geometry !== this.ringGeo && o.geometry !== this.discGeo && o.geometry !== this.boxGeo && o.geometry !== this.orbGeo && o.geometry !== this.cylGeo) o.geometry.dispose?.();
        });
        this.items.splice(i, 1);
      }
    }
    let k = 0;
    for (let i = this.pool.length - 1; i >= 0; i--) {
      const p = this.pool[i];
      p.t += dt;
      if (p.t >= p.life) {
        this.pool.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      const fy = this.ground(p.x, p.z);
      if (p.y < fy) {
        p.y = fy;
        p.vy *= -0.3;
        p.vx *= 0.6;
        p.vz *= 0.6;
      }
      const s = p.size * (1 - p.t / p.life);
      this.q.setFromAxisAngle({ x: 0.6, y: 0.8, z: 0 }, p.t * p.spin);
      this.m.compose({ x: p.x, y: p.y, z: p.z }, this.q, { x: s, y: s, z: s });
      this.parts.setMatrixAt(k, this.m);
      this.parts.setColorAt(k, p.color);
      k += 1;
    }
    this.parts.count = k;
    this.parts.instanceMatrix.needsUpdate = true;
    if (this.parts.instanceColor) this.parts.instanceColor.needsUpdate = true;
    // brilhos
    const ga = this.glowPoints.geometry.attributes;
    let n = 0;
    for (let i = this.glow.length - 1; i >= 0; i--) {
      const p = this.glow[i];
      p.t += dt;
      if (p.t >= p.life) {
        this.glow.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      const u = p.t / p.life;
      ga.position.setXYZ(n, p.x, p.y, p.z);
      ga.aColor.setXYZ(n, p.color.r, p.color.g, p.color.b);
      ga.aSize.setX(n, p.size * (1 + p.grow * u));
      ga.aAlpha.setX(n, (1 - u) * (u < 0.1 ? u * 10 : 1));
      n += 1;
    }
    this.glowPoints.geometry.setDrawRange(0, n);
    for (const k2 of ['position', 'aColor', 'aSize', 'aAlpha']) ga[k2].needsUpdate = true;
    this.glowPoints.visible = n > 0;
    this.glowPoints.material.uniforms.uViewH.value = this.viewH();
  }

  // remove tudo de um item (ex.: projétil que acertou)
  kill(obj) {
    const it = this.items.find((x) => x.obj === obj);
    if (it) it.dead = true;
  }
}
