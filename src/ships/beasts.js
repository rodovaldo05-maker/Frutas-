// Bestas marinhas no mar (atualização 19): modelo em blocos de cada besta, o encontro
// (aviso → circular → mordida/onda/mergulho → fúria) e o encaixe com o canhão do bote.
// Regras puras em beastRules.js. Uma besta por vez; ela caça o bote (ou o nadador, no caso
// do tubarão). Visual da onda com o efeito do laboratório (lab.fx.wave).

import * as THREE from 'three';
import { BEASTS, ENCOUNTER, PHASE, phaseOf, nextAttack, beastHp, beastBite, beastWave } from './beastRules.js';
import { clamp, damp, lerp, lerpAngle, wrapAngle } from '../core/math.js';

const mat = (c, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0.05, ...extra });
function box(parent, size, pos, material, rot) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  m.castShadow = true;
  parent.add(m);
  return m;
}

// ===== Modelos =====
function serpentModel(def) {
  const root = new THREE.Group();
  const body = mat(def.cor);
  const stripe = mat(def.detalhe);
  const eye = mat('#ffe45a', { emissive: '#ffb020', emissiveIntensity: 0.8 });
  const head = new THREE.Group();
  box(head, [1.7, 1.3, 2.4], [0, 0, 0.4], body);
  box(head, [1.5, 0.45, 1.8], [0, -0.75, 0.6], stripe); // mandíbula
  for (const s of [-1, 1]) {
    box(head, [0.3, 0.3, 0.3], [s * 0.7, 0.35, 1.4], eye);
    box(head, [0.2, 0.9, 0.7], [s * 0.6, 0.9, -0.4], stripe, [0.4, 0, s * 0.3]); // barbatanas da cabeça
  }
  for (let k = -1; k <= 1; k++) box(head, [0.12, 0.35, 0.12], [k * 0.4, -0.45, 1.55], mat('#f4f0e0')); // presas
  root.add(head);
  const segments = [];
  for (let i = 0; i < 9; i++) {
    const g = new THREE.Group();
    const s = 1.35 - i * 0.09;
    box(g, [s, s * 0.9, 1.5], [0, 0, 0], body);
    box(g, [s * 1.02, s * 0.25, 0.5], [0, 0, 0], stripe);
    box(g, [0.15, 0.6, 0.5], [0, s * 0.55, 0], stripe, [0.3, 0, 0]); // crista
    root.add(g);
    segments.push(g);
  }
  return { root, head, segments, scale: 1.3 };
}

function sharkModel(def) {
  const root = new THREE.Group();
  const head = new THREE.Group();
  const grey = mat(def.cor);
  const belly = mat(def.detalhe);
  box(head, [2.2, 1.7, 6.2], [0, 0, 0], grey);
  box(head, [2.0, 0.6, 5.6], [0, -0.75, 0.1], belly);
  box(head, [1.6, 1.2, 1.4], [0, 0.05, 3.6], grey); // focinho
  box(head, [1.5, 0.35, 1.2], [0, -0.7, 3.2], belly); // mandíbula
  for (let k = -2; k <= 2; k++) box(head, [0.14, 0.3, 0.14], [k * 0.3, -0.45, 3.85], mat('#ffffff'));
  box(head, [0.25, 2.2, 1.6], [0, 1.7, -0.3], grey, [-0.45, 0, 0]); // barbatana dorsal
  for (const s of [-1, 1]) {
    box(head, [1.6, 0.18, 1.0], [s * 1.5, -0.6, 1.0], grey, [0, 0, s * -0.4]); // peitorais
    box(head, [0.22, 0.22, 0.22], [s * 0.75, 0.3, 3.4], mat('#101010'));
  }
  const tail = new THREE.Group();
  tail.position.set(0, 0, -3.3);
  box(tail, [0.3, 2.6, 1.2], [0, 0.5, -0.6], grey, [0.5, 0, 0]);
  head.add(tail);
  root.add(head);
  return { root, head, tail, segments: [], scale: 1.25 };
}

function lanternModel(def) {
  const root = new THREE.Group();
  const head = new THREE.Group();
  const skin = mat(def.cor);
  const dark = mat('#0e1620');
  const glow = mat(def.detalhe, { emissive: def.detalhe, emissiveIntensity: 2.2 });
  box(head, [3.4, 2.8, 3.6], [0, 0, 0], skin);
  box(head, [3.6, 1.1, 2.6], [0, -1.4, 1.0], dark); // mandíbula enorme
  for (let k = -3; k <= 3; k++) {
    box(head, [0.16, 0.6, 0.16], [k * 0.45, -0.7, 2.25], mat('#e8f0e0'));
    box(head, [0.16, 0.5, 0.16], [k * 0.45 + 0.2, -1.0, 2.2], mat('#e8f0e0'));
  }
  for (const s of [-1, 1]) box(head, [0.35, 0.35, 0.2], [s * 1.0, 0.8, 1.82], glow); // olhos
  const stalk = new THREE.Group();
  stalk.position.set(0, 1.4, 0.8);
  box(stalk, [0.14, 2.2, 0.14], [0, 1.0, 0.4], skin, [0.5, 0, 0]);
  const lure = box(stalk, [0.6, 0.6, 0.6], [0, 1.9, 1.3], glow);
  head.add(stalk);
  box(head, [0.3, 1.4, 1.6], [0, 1.6, -1.0], skin, [-0.5, 0, 0]);
  const tail = new THREE.Group();
  tail.position.set(0, 0, -1.9);
  box(tail, [0.3, 2.0, 1.4], [0, 0, -0.6], skin);
  head.add(tail);
  root.add(head);
  return { root, head, tail, lure, segments: [], scale: 1.2 };
}

const MODELS = { serpente: serpentModel, tubarao: sharkModel, lanterna: lanternModel };

// ===== Besta =====
export class SeaBeast {
  constructor({ scene, id, level, x, z }) {
    this.def = { ...BEASTS[id], id };
    this.kind = id;
    this.id = `besta-${id}`;
    this.isBeast = true;
    this.level = level;
    this.maxHull = beastHp(level);
    this.hull = this.maxHull;
    this.s = { x, z, yaw: 0 };
    this.y = -4;
    this.depth = -4; // altura alvo em relação à água
    this.state = 'aviso';
    this.t = 0;
    this.cd = 3;
    this.ang = Math.random() * Math.PI * 2;
    this.ai = { mode: 'ataque' };
    this.pos = new THREE.Vector3(x, -4, z);
    this.vel = { x: 0, z: 0 };
    this.trail = [];
    const m = MODELS[id](this.def);
    this.model = m;
    m.root.scale.setScalar(m.scale);
    scene.add(m.root);
    this.scene = scene;
  }

  get name() {
    return `${this.def.nome} Nv. ${this.level}`;
  }

  // alvo do canhão só com o corpo fora da água
  get alive() {
    return ['circula', 'mordida', 'onda'].includes(this.state) && this.y > -1.6;
  }

  get velocity() {
    return this.vel;
  }

  hits(p, pad = 0.6) {
    const r = this.def.radius * this.model.scale + pad;
    return Math.hypot(p.x - this.s.x, p.z - this.s.z) < r && p.y > this.y - 2 && p.y < this.y + 3.5;
  }

  dispose() {
    this.model.root.removeFromParent();
    this.model.root.traverse((o) => {
      o.geometry?.dispose?.();
      o.material?.dispose?.();
    });
  }
}

export class BeastManager {
  constructor({ scene, ocean, fx, lab, onEvent = () => {} }) {
    this.scene = scene;
    this.ocean = ocean;
    this.fx = fx;
    this.lab = lab;
    this.onEvent = onEvent;
    this.beast = null;
    this.since = ENCOUNTER.cooldown * 0.5; // o primeiro encontro pode vir mais cedo
    this.pending = []; // ataques marcados { at, t, kind, dmg, r }
  }

  get active() {
    return this.beast && this.beast.state !== 'morta' ? this.beast : null;
  }

  targets() {
    return this.beast?.alive ? [this.beast] : [];
  }

  spawn(id, level, target) {
    const a = Math.random() * Math.PI * 2;
    const b = new SeaBeast({ scene: this.scene, id, level, x: target.x + Math.cos(a) * 30, z: target.z + Math.sin(a) * 30 });
    b.ang = a;
    b.takeHit = (dmg, at) => this.takeHit(b, dmg, at); // o canhão do bote chama por aqui
    this.beast = b;
    this.pending.length = 0;
    this.onEvent('warning', { beast: b });
    return b;
  }

  // dano do canhão (fase 3 leva mais: ponto fraco exposto)
  takeHit(b, dmg, at) {
    if (!b.alive) return 0;
    const phase = phaseOf(b.hull / b.maxHull);
    const real = Math.round(dmg * PHASE[phase].taken);
    b.hull = Math.max(0, b.hull - real);
    const after = phaseOf(b.hull / b.maxHull);
    this.onEvent('hit', { beast: b, damage: real, at });
    if (after !== phase && b.hull > 0) this.onEvent('phase', { beast: b, phase: after });
    if (b.hull <= 0) {
      b.state = 'morta';
      b.t = 0;
      this.onEvent('down', { beast: b });
    }
    return real;
  }

  leave(reason = 'longe') {
    const b = this.beast;
    if (!b || b.state === 'morta' || b.state === 'foge') return;
    b.state = 'foge';
    b.t = 0;
    this.onEvent('left', { beast: b, reason });
  }

  // ctx: { target:{x,z,y,vx,vz}|null, aboard, onHull(dmg, at), onPlayer(dmg, at), push(dx, dz) }
  update(dt, ctx) {
    this.since += dt;
    const b = this.beast;
    if (!b) return;
    b.t += dt;
    const tgt = ctx.target;
    const water = (x, z) => this.ocean.heightAt(x, z);
    // terminou?
    if (b.state === 'morta' || b.state === 'foge') {
      b.depth = -6;
      if (b.t > 3.2) {
        b.dispose();
        this.beast = null;
        this.since = 0;
        return;
      }
    } else if (!tgt || Math.hypot(tgt.x - b.s.x, tgt.z - b.s.z) > ENCOUNTER.leave) {
      this.leave(tgt ? 'longe' : 'sumiu');
    } else {
      const phase = phaseOf(b.hull / b.maxHull);
      const ph = PHASE[phase];
      const speed = b.def.speed * ph.speed;
      if (b.state === 'aviso') {
        // água borbulhando onde a besta vai surgir
        if (Math.random() < dt * 8) this.fx?.burst({ x: b.s.x + (Math.random() - 0.5) * 4, y: water(b.s.x, b.s.z), z: b.s.z + (Math.random() - 0.5) * 4 }, '#dff6ff', { count: 3, speed: 1.2, up: 2.5, life: 0.6 });
        b.depth = -3;
        if (b.t >= ENCOUNTER.warning) {
          b.state = 'circula';
          b.t = 0;
          b.cd = 2;
          this.fx?.burst({ x: b.s.x, y: water(b.s.x, b.s.z), z: b.s.z }, '#dff6ff', { count: 24, speed: 5, up: 6 });
          this.onEvent('emerge', { beast: b });
        }
      } else if (b.state === 'circula') {
        // circula o alvo; a cada recarga escolhe um ataque
        b.ang += (speed / b.def.orbit) * dt;
        const gx = tgt.x + Math.cos(b.ang) * b.def.orbit;
        const gz = tgt.z + Math.sin(b.ang) * b.def.orbit;
        this.steer(b, gx, gz, speed, dt);
        b.depth = -0.5;
        b.cd -= dt;
        if (b.cd <= 0) this.startAttack(b, nextAttack(b.kind, phase), tgt, phase);
      } else if (b.state === 'mordida') {
        // avança até o ponto marcado; morde quando o aviso termina
        const m = b.attack;
        this.steer(b, m.x, m.z, speed * 1.6, dt);
        b.depth = b.t > m.time - 0.3 ? 1.6 : -0.4;
        if (b.t >= m.time) this.resolveBite(b, m, tgt, ctx);
      } else if (b.state === 'onda') {
        const m = b.attack;
        b.depth = 1.2;
        this.steer(b, b.s.x, b.s.z, 0, dt);
        if (!m.sent && b.t > 0.6) {
          m.sent = true;
          const len = Math.hypot(m.tx - b.s.x, m.tz - b.s.z) + 6;
          const dir = new THREE.Vector3(m.tx - b.s.x, 0, m.tz - b.s.z).normalize();
          m.dir = dir;
          m.len = len;
          m.hitAt = b.t + len / ENCOUNTER.waveSpeed;
          this.lab?.fx.wave(new THREE.Vector3(b.s.x, water(b.s.x, b.s.z), b.s.z), dir, len, 4.6, len / ENCOUNTER.waveSpeed + 0.3);
          this.fx?.burst({ x: b.s.x, y: water(b.s.x, b.s.z) + 0.5, z: b.s.z }, '#dff6ff', { count: 20, speed: 5, up: 6 });
        }
        if (m.sent && !m.done && b.t >= m.hitAt) {
          m.done = true;
          // atinge quem estiver na faixa da onda quando ela passa
          const rx = tgt.x - b.s.x;
          const rz = tgt.z - b.s.z;
          const along = rx * m.dir.x + rz * m.dir.z;
          const side = Math.abs(rx * m.dir.z - rz * m.dir.x);
          if (along > 0 && along < m.len + 2 && side < 3.2) {
            const at = { x: tgt.x, y: water(tgt.x, tgt.z), z: tgt.z };
            if (ctx.aboard) ctx.onHull(m.dmg, at);
            else ctx.onPlayer(m.dmg * 0.6, at);
            ctx.push?.(m.dir.x * 5, m.dir.z * 5);
          } else this.onEvent('dodged', { beast: b });
        }
        if (b.t > 1.6 && (!m.sent || m.done)) this.backToCircle(b, phase, tgt);
      } else if (b.state === 'mergulho') {
        // some embaixo d'água e surge por baixo do alvo
        const m = b.attack;
        b.depth = -4.5;
        this.steer(b, tgt.x, tgt.z, speed * 1.4, dt);
        if (!m.marked && b.t >= ENCOUNTER.dive) {
          m.marked = true;
          m.x = tgt.x + (tgt.vx ?? 0) * ENCOUNTER.telegraph;
          m.z = tgt.z + (tgt.vz ?? 0) * ENCOUNTER.telegraph;
          m.time = b.t + ENCOUNTER.telegraph;
          this.fx?.mark({ x: m.x, y: water(m.x, m.z), z: m.z }, b.def.cor, m.r, ENCOUNTER.telegraph);
        }
        if (m.marked) {
          b.s.x = lerp(b.s.x, m.x, damp(6, dt));
          b.s.z = lerp(b.s.z, m.z, damp(6, dt));
          if (b.t >= m.time) this.resolveBite(b, m, tgt, ctx);
        }
      }
    }
    // posição e animação
    const wy = water(b.s.x, b.s.z);
    b.y = lerp(b.y, wy + b.depth, damp(b.state === 'mordida' || b.state === 'mergulho' ? 7 : 3, dt));
    b.pos.set(b.s.x, b.y, b.s.z);
    this.render(b, dt);
  }

  steer(b, gx, gz, speed, dt) {
    const dx = gx - b.s.x;
    const dz = gz - b.s.z;
    const d = Math.hypot(dx, dz);
    const v = d > 0.3 ? Math.min(speed, d / Math.max(dt, 1e-3)) : 0;
    const want = Math.atan2(dx, dz);
    if (d > 0.3) b.s.yaw = lerpAngle(b.s.yaw, want, damp(4, dt));
    b.vel = { x: d > 0 ? (dx / d) * v : 0, z: d > 0 ? (dz / d) * v : 0 };
    b.s.x += b.vel.x * dt;
    b.s.z += b.vel.z * dt;
  }

  startAttack(b, kind, tgt, phase) {
    const lvl = b.level;
    b.t = 0;
    if (kind === 'mordida') {
      const x = tgt.x + (tgt.vx ?? 0) * ENCOUNTER.telegraph;
      const z = tgt.z + (tgt.vz ?? 0) * ENCOUNTER.telegraph;
      b.attack = { kind, x, z, r: 3.2, time: ENCOUNTER.telegraph + 0.2, dmg: beastBite(lvl) };
      b.state = 'mordida';
      this.fx?.mark({ x, y: this.ocean.heightAt(x, z), z }, b.def.cor, 3.2, ENCOUNTER.telegraph + 0.2);
    } else if (kind === 'onda') {
      b.attack = { kind, tx: tgt.x, tz: tgt.z, dmg: beastWave(lvl) };
      b.state = 'onda';
    } else {
      b.attack = { kind, r: 3.6, dmg: Math.round(beastBite(lvl) * 1.4) };
      b.state = 'mergulho';
      this.fx?.burst({ x: b.s.x, y: this.ocean.heightAt(b.s.x, b.s.z), z: b.s.z }, '#dff6ff', { count: 16, speed: 3, up: 4 });
    }
    this.onEvent('attack', { beast: b, kind, phase });
  }

  resolveBite(b, m, tgt, ctx) {
    const at = { x: m.x, y: this.ocean.heightAt(m.x, m.z), z: m.z };
    this.fx?.burst({ ...at, y: at.y + 0.5 }, '#dff6ff', { count: 26, speed: 6, up: 7 });
    this.fx?.flash?.({ ...at, y: at.y + 1 }, b.def.cor, 3.4, 0.3);
    if (Math.hypot(tgt.x - m.x, tgt.z - m.z) < m.r + 1.2) {
      if (ctx.aboard) ctx.onHull(m.dmg, at);
      else ctx.onPlayer(m.dmg * 0.6, at);
    } else this.onEvent('dodged', { beast: b });
    this.backToCircle(b, phaseOf(b.hull / b.maxHull), tgt);
  }

  backToCircle(b, phase, tgt) {
    b.state = 'circula';
    b.t = 0;
    b.cd = PHASE[phase].cd * (0.8 + Math.random() * 0.4);
    if (tgt) b.ang = Math.atan2(b.s.z - tgt.z, b.s.x - tgt.x); // retoma o círculo de onde está
  }

  render(b, dt) {
    const m = b.model;
    const time = performance.now() / 1000;
    m.root.position.set(b.s.x, b.y, b.s.z);
    m.head.rotation.y = b.s.yaw;
    const rising = b.state === 'mordida' || (b.state === 'mergulho' && b.attack?.marked && b.t > b.attack.time - 0.4);
    m.head.rotation.x = lerp(m.head.rotation.x, rising ? -0.5 : b.state === 'morta' ? 0.9 : 0, damp(5, dt));
    if (b.state === 'morta') m.head.rotation.z += dt * 1.2;
    if (m.tail) m.tail.rotation.y = Math.sin(time * 6) * 0.35;
    if (m.lure) m.lure.scale.setScalar(1 + Math.sin(time * 5) * 0.15);
    // corpo da serpente segue o caminho da cabeça
    if (m.segments.length) {
      b.trail.unshift({ x: b.s.x, y: b.y, z: b.s.z });
      if (b.trail.length > 120) b.trail.length = 120;
      const inv = 1 / m.scale;
      m.segments.forEach((seg, i) => {
        const p = b.trail[Math.min(b.trail.length - 1, (i + 1) * 5)];
        const q = b.trail[Math.min(b.trail.length - 1, (i + 1) * 5 + 2)];
        seg.position.set((p.x - b.s.x) * inv, (p.y - b.y) * inv - 0.3 + Math.sin(time * 4 - i * 0.7) * 0.25, (p.z - b.s.z) * inv);
        seg.rotation.y = Math.atan2(p.x - q.x, p.z - q.z) || 0;
      });
    }
  }

  clear() {
    this.beast?.dispose();
    this.beast = null;
  }
}

export { clamp, wrapAngle };
