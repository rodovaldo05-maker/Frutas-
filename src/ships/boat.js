// Bote do jogador (atualização 10): modelo em blocos de madeira com vela, balanço pelas ondas
// do mar (arfagem e rolagem), inclinação nas curvas e esteira de espuma. A navegação em si
// fica em boatRules.js; aqui é o que se vê e o encaixe com o mundo (raso, cais, pilares).

import * as THREE from 'three';
import { bakeStatic } from '../optimization/bake.js';
import { BOAT, boatStep, landingSpot } from './boatRules.js';
import { damp, lerp, lerpAngle } from '../core/math.js';

const WOOD = '#8a5a32';
const WOOD_DARK = '#5a3a22';
const TRIM = '#efe4cc';

// look: cores do casco, da vela, da faixa e da bandeira (navios inimigos usam outras);
// cannons: canhões nas bordas (o bote tem um na proa, giratório)
export function buildModel({ name = 'Bote', wood: woodC = WOOD, dark: darkC = WOOD_DARK, trim: trimC = TRIM, sail: sailC = '#f4ead0', stripe: stripeC = '#b8321e', flag: flagC = '#c2492f', cannons = 0, bowCannon = true } = {}) {
  const g = new THREE.Group();
  g.name = name;
  const L = BOAT.length;
  const B = BOAT.beam;
  const mat = (c, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.82, metalness: 0.02, ...extra });
  const wood = mat(woodC);
  const dark = mat(darkC);
  const trim = mat(trimC);
  const bowStart = L / 2 - 1.9;
  // contorno do casco visto de cima (popa reta, proa em bico)
  const outline = [[-B / 2, -L / 2], [B / 2, -L / 2], [B / 2, bowStart], [0, L / 2], [-B / 2, bowStart]];
  const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, -z)));
  // fundo (abaixo da linha d'água, escuro) e piso de tábuas
  const hull = new THREE.ExtrudeGeometry(shape, { depth: 0.9, bevelEnabled: false });
  hull.rotateX(-Math.PI / 2);
  hull.translate(0, -0.62, 0);
  hull.scale(0.94, 1, 0.97);
  const hullMesh = new THREE.Mesh(hull, dark);
  g.add(hullMesh);
  const floor = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false });
  floor.rotateX(-Math.PI / 2);
  floor.translate(0, BOAT.deck - 0.08, 0);
  floor.scale(0.9, 1, 0.93);
  g.add(new THREE.Mesh(floor, wood));
  // bordas: uma parede por lado do contorno, com friso claro no topo
  for (let i = 0; i < outline.length; i++) {
    const [ax, az] = outline[i];
    const [bx, bz] = outline[(i + 1) % outline.length];
    const len = Math.hypot(bx - ax, bz - az);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.05, len + 0.2), wood);
    wall.position.set((ax + bx) / 2, 0.42, (az + bz) / 2);
    wall.rotation.y = Math.atan2(bx - ax, bz - az);
    g.add(wall);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, len + 0.24), trim);
    rail.position.set((ax + bx) / 2, 0.98, (az + bz) / 2);
    rail.rotation.y = wall.rotation.y;
    g.add(rail);
  }
  // faixa vermelha só por fora do casco (um lado de cada vez)
  const red = mat(stripeC);
  for (const side of [-1, 1]) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, L - 2.4), red);
    stripe.position.set(side * (B / 2 + 0.13), 0.62, -0.4);
    g.add(stripe);
  }
  // banco de remo, banco do leme e leme
  const bench = new THREE.Mesh(new THREE.BoxGeometry(B - 0.4, 0.18, 0.7), wood);
  bench.position.set(0, 0.62, 0.9);
  g.add(bench);
  const tiller = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.4), dark);
  tiller.position.set(0, 1.05, -L / 2 + 0.5);
  tiller.rotation.x = -0.25;
  g.add(tiller);
  const rudder = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.3, 0.7), dark);
  rudder.position.set(0, -0.05, -L / 2 - 0.25);
  g.add(rudder);
  // mastro, retranca, vela triangular e bandeirola
  const mastH = 6.2;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, mastH, 8), dark);
  mast.position.set(0, mastH / 2 + 0.2, 1.2);
  g.add(mast);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.6, 6), dark);
  boom.rotation.x = Math.PI / 2;
  boom.position.set(0, 2.0, -0.55);
  g.add(boom);
  const sailGeo = new THREE.BufferGeometry();
  sailGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, mastH + 0.05, 1.15, 0, 2.15, 1.15, 0, 2.15, -2.3], 3));
  sailGeo.computeVertexNormals();
  const sail = new THREE.Mesh(sailGeo, mat(sailC, { side: THREE.DoubleSide }));
  g.add(sail);
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.8), mat(flagC));
  flag.position.set(0, mastH + 0.1, 0.75);
  g.add(flag);
  // canhões (atualização 16): bronze escuro sobre um carrinho de madeira
  const iron = mat('#2b2f33', { metalness: 0.6, roughness: 0.45 });
  const cannon = (x, z, yaw) => {
    const c = new THREE.Group();
    const carriage = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.8), dark);
    carriage.position.y = 0.15;
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.3, 10), iron);
    barrel.rotation.x = Math.PI / 2 - 0.12;
    barrel.position.set(0, 0.42, 0.25);
    c.add(carriage, barrel);
    c.position.set(x, BOAT.deck, z);
    c.rotation.y = yaw;
    g.add(c);
    return c;
  };
  if (bowCannon) cannon(0, L / 2 - 2.3, 0);
  for (let k = 0; k < cannons; k++) {
    const z = -1.4 + k * 1.6;
    cannon(B / 2 - 0.45, z, Math.PI / 2);
    cannon(-B / 2 + 0.45, z, -Math.PI / 2);
  }
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  bakeStatic(g, { skip: [sail, flag] });
  return { group: g, sail, flag };
}

export class Boat {
  constructor({ scene, physics, ocean, ground, look = {}, scale = 1 }) {
    this.physics = physics;
    this.ocean = ocean;
    this.ground = ground;
    const m = buildModel(look);
    m.group.scale.setScalar(scale);
    this.scale = scale;
    this.model = m;
    scene.add(m.group);
    this.s = { x: 0, z: 0, yaw: 0, speed: 0, turning: 0 };
    this.prev = { x: 0, z: 0, yaw: 0 };
    this.y = 0;
    this.pitch = 0;
    this.roll = 0;
    this.lean = 0;
    this.aboard = false;
    this.time = 0;
    // esteira: discos de espuma que crescem e somem atrás do bote
    this.foam = [];
    const foamMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false });
    for (let i = 0; i < 28; i++) {
      const f = new THREE.Mesh(new THREE.CircleGeometry(0.6, 10), foamMat.clone());
      f.rotation.x = -Math.PI / 2;
      f.visible = false;
      f.renderOrder = 3;
      scene.add(f);
      this.foam.push({ mesh: f, t: 0, life: 0 });
    }
    this.foamTimer = 0;
    this.world = {
      ground: (x, z) => this.ground(x, z),
      // estruturas na frente (pilares e tábuas do cais): três raios na altura do casco
      blocked: (x, z, yaw, reach) => {
        const fx = Math.sin(yaw);
        const fz = Math.cos(yaw);
        for (const off of [0, BOAT.beam * 0.4, -BOAT.beam * 0.4]) {
          const o = { x: x + fz * off, y: BOAT.waterLevel + 0.45, z: z - fx * off };
          const hit = this.physics.raycast(o, { x: fx, y: 0, z: fz }, reach - (off ? 1.2 : 0));
          if (hit && !hit.tags?.terrain) return true;
        }
        return false;
      },
    };
  }

  place(x, z, yaw) {
    Object.assign(this.s, { x, z, yaw, speed: 0, turning: 0 });
    Object.assign(this.prev, { x, z, yaw });
    this.float(0);
    this.render(1);
  }

  near(p, range = BOAT.boardRange) {
    return Math.hypot(p.x - this.s.x, p.z - this.s.z) < range && p.y > this.y - 4 && p.y < this.y + 4.5;
  }

  // posição do jogador no bote (em pé no leme)
  seat() {
    const { x, z, yaw } = this.s;
    return { x: x + Math.sin(yaw) * BOAT.seat, y: this.y + BOAT.deck, z: z + Math.cos(yaw) * BOAT.seat, yaw };
  }

  get velocity() {
    return { x: Math.sin(this.s.yaw) * this.s.speed, z: Math.cos(this.s.yaw) * this.s.speed };
  }

  // um passo fixo: input = { wx, wz, mag, fast } quando alguém está no leme
  step(dt, input) {
    this.time += dt;
    this.prev.x = this.s.x;
    this.prev.z = this.s.z;
    this.prev.yaw = this.s.yaw;
    const r = boatStep(this.s, this.aboard ? input : null, this.world, dt);
    this.float(dt);
    return r;
  }

  // altura média das ondas sob o casco, arfagem e rolagem
  float(dt) {
    const { x, z, yaw } = this.s;
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    const h = (ox, oz) => this.ocean.heightAt(x + fx * oz + fz * ox, z + fz * oz - fx * ox);
    const bow = h(0, BOAT.length * 0.4);
    const stern = h(0, -BOAT.length * 0.4);
    const port = h(BOAT.beam * 0.45, 0);
    const star = h(-BOAT.beam * 0.45, 0);
    const y = (bow + stern + port + star) / 4 - 0.05;
    const k = dt > 0 ? damp(6, dt) : 1;
    this.y = lerp(this.y, y, k);
    this.pitch = lerp(this.pitch, -Math.atan2(bow - stern, BOAT.length * 0.8) * 0.8, k);
    this.roll = lerp(this.roll, Math.atan2(port - star, BOAT.beam * 0.9) * 0.8, k);
    this.lean = lerp(this.lean, -(this.s.turning ?? 0) * Math.min(1, Math.abs(this.s.speed) / BOAT.speed) * 0.16, dt > 0 ? damp(3, dt) : 1);
  }

  render(alpha, dt = 0) {
    const g = this.model.group;
    g.position.set(lerp(this.prev.x, this.s.x, alpha), this.y, lerp(this.prev.z, this.s.z, alpha));
    g.rotation.order = 'YXZ';
    g.rotation.set(this.pitch, lerpAngle(this.prev.yaw, this.s.yaw, alpha), this.roll + this.lean);
    // a bandeirola tremula mais rápido com o bote andando
    this.model.flag.rotation.y = Math.sin(this.time * (6 + Math.abs(this.s.speed) * 0.5)) * 0.25;
    this.updateFoam(dt);
  }

  updateFoam(dt) {
    if (dt <= 0) return;
    const speed = Math.abs(this.s.speed);
    this.foamTimer -= dt;
    if (speed > 1.5 && this.foamTimer <= 0) {
      this.foamTimer = 0.09 - Math.min(0.05, speed * 0.003);
      const f = this.foam.find((o) => o.life <= 0);
      if (f) {
        const { x, z, yaw } = this.s;
        const side = (Math.random() - 0.5) * BOAT.beam * 0.8;
        f.mesh.position.set(x - Math.sin(yaw) * BOAT.length * 0.48 + Math.cos(yaw) * side, this.y + 0.05, z - Math.cos(yaw) * BOAT.length * 0.48 - Math.sin(yaw) * side);
        f.life = f.t = 1.4;
        f.mesh.visible = true;
      }
    }
    for (const f of this.foam) {
      if (f.life <= 0) continue;
      f.life -= dt;
      const u = 1 - f.life / f.t;
      f.mesh.scale.setScalar(0.6 + u * 2.4);
      f.mesh.position.y = this.ocean.heightAt(f.mesh.position.x, f.mesh.position.z) + 0.04;
      f.mesh.material.opacity = 0.55 * (1 - u);
      if (f.life <= 0) f.mesh.visible = false;
    }
  }

  // onde descer: chão firme (praia ou cais) perto, ou água ao lado
  landing() {
    const surfaceAt = (x, z) => {
      const hit = this.physics.raycast({ x, y: this.y + 9, z }, { x: 0, y: -1, z: 0 }, 18);
      if (!hit || hit.normal.y < 0.6) return null;
      return hit.point.y;
    };
    return landingSpot(this.s, surfaceAt);
  }

  snapshot() {
    return { x: +this.s.x.toFixed(2), z: +this.s.z.toFixed(2), yaw: +this.s.yaw.toFixed(3), aboard: this.aboard };
  }
}
