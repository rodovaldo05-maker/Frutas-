// Eventos raros do Terceiro Mar (atualização 28; doc 02):
//   Lua de Sangue — algumas noites a lua fica vermelha: inimigos do Terceiro Mar batem 25% mais
//     forte e dão 50% mais experiência e moedas, com chance de material raro extra.
//   Navio Fantasma — navio espectral que aparece no mar aberto (mais à noite), circula o bote e
//     dispara chamas fantasmas marcadas na água; afundá-lo com o canhão dá um tesouro.
//   Maré Celeste — de dia, às vezes, ilhotas flutuantes sobem do mar perto do jogador formando
//     uma escada até um baú no alto; somem depois de 2,5 minutos.

import * as THREE from 'three';
import { shipHull } from '../ships/naval.js';

export const EVENTS3 = {
  blood: { chance: 0.3, enemyDamage: 1.25, reward: 1.5, rareChance: 0.25 },
  ghost: { perSecond: 1 / 240, nightMult: 2, radius: 34, hpMult: 1.5, level: 2100, fireEvery: 5, shots: 3, telegraph: 1.3, hit: 0.05, life: 240 },
  tide: { perSecond: 1 / 360, steps: 7, rise: 2.4, spacing: 4.6, life: 150 },
};

// noite de Lua de Sangue: sorteio fixo por dia de jogo (o mesmo para todo mundo naquele dia)
export function bloodMoonOn(day) {
  let h = (Math.floor(day) * 2654435761) >>> 0;
  h ^= h >>> 15;
  return (h % 1000) / 1000 < EVENTS3.blood.chance;
}

const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...opts });
const box = new THREE.BoxGeometry(1, 1, 1);

export class SeaEvents {
  // hooks: { fx, ocean, physics, notice, toast, reward(kind), hullHit(frac, at), damageFloat(at, n),
  //          playerLevel() }
  constructor({ scene, hooks }) {
    this.scene = scene;
    this.h = hooks;
    this.fx = hooks.fx;
    this.rand = hooks.rand ?? Math.random;
    this.bloodMoon = false;
    this.ghost = null;
    this.tide = null;
    this.fog = null;
    this.chanceT = 1;
  }

  // alvos extras do canhão do bote (o navio fantasma)
  targets() {
    return this.ghost?.alive ? [this.ghost] : [];
  }

  nearest(p) {
    const c = this.tide?.chest;
    if (!c || c.opened) return null;
    const d = Math.hypot(p.x - c.x, p.z - c.z);
    if (d > 3 || Math.abs(p.y - c.y) > 2.5) return null;
    return { d, key: 'bau-celeste', text: 'Abrir o baú da Maré Celeste', run: () => this.openChest() };
  }

  // ctx: { sea, night, day, aboard, swimming, boat: { x, z, yaw, velocity }, player, openSea }
  step(dt, ctx) {
    // Lua de Sangue
    const blood = ctx.sea === 3 && ctx.night && bloodMoonOn(ctx.day);
    if (blood && !this.bloodMoon) this.h.notice('Lua de Sangue! Inimigos mais fortes e saque maior esta noite', 'bad', 'lua');
    this.bloodMoon = blood;
    this.fog = blood ? { near: 30, far: 170, color: '#4a0a18' } : null;
    // chances dos eventos (uma vez por segundo)
    this.chanceT -= dt;
    if (this.chanceT <= 0) {
      this.chanceT = 1;
      if (ctx.sea === 3 && ctx.aboard && ctx.openSea && !this.ghost) {
        const p = EVENTS3.ghost.perSecond * (ctx.night ? EVENTS3.ghost.nightMult : 1);
        if (this.rand() < p) this.spawnGhost(ctx.boat);
      }
      if (ctx.sea === 3 && !ctx.night && (ctx.aboard || ctx.swimming) && ctx.openSea && !this.tide && this.rand() < EVENTS3.tide.perSecond) this.spawnTide(ctx.boat);
    }
    this.stepGhost(dt, ctx);
    this.stepTide(dt, ctx);
  }

  // ===== Navio Fantasma =====
  spawnGhost(boat) {
    const g = new THREE.Group();
    const hull = mat('#2a4a40', { emissive: '#3aff9a', emissiveIntensity: 0.35, transparent: true, opacity: 0.72 });
    const sail = mat('#9affd0', { emissive: '#3aff9a', emissiveIntensity: 0.6, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
    const add = (size, pos, m) => {
      const b = new THREE.Mesh(box, m);
      b.scale.set(...size);
      b.position.set(...pos);
      g.add(b);
    };
    add([5, 2.4, 15], [0, 0.6, 0], hull);
    add([4, 1.6, 4], [0, 2.4, -5], hull);
    add([0.5, 12, 0.5], [0, 6, 1], hull);
    add([0.5, 9, 0.5], [0, 5, -4], hull);
    add([6.5, 5, 0.15], [0, 8, 1.4], sail);
    add([5, 4, 0.15], [0, 6, -3.6], sail);
    this.scene.add(g);
    const a = this.rand() * Math.PI * 2;
    const c = EVENTS3.ghost;
    const lv = Math.max(c.level, this.h.playerLevel?.() ?? c.level);
    const hp = Math.round(shipHull(lv) * c.hpMult);
    const ghost = {
      alive: true, isBeast: true, def: { radius: 3.4, nome: 'Navio Fantasma' }, g, ang: a, life: c.life, fireT: 3, marks: [], sink: 0,
      s: { x: boat.x + Math.cos(a) * 60, z: boat.z + Math.sin(a) * 60, yaw: 0 }, y: 0, vel: { x: 0, z: 0 },
      hull: hp, maxHull: hp,
      get velocity() { return this.vel; },
      hits(p, pad = 0.6) { return Math.hypot(p.x - this.s.x, p.z - this.s.z) < 4 + pad && p.y > this.y - 3 && p.y < this.y + 9; },
      takeHit: (dmg, at) => this.ghostHit(dmg, at),
    };
    this.ghost = ghost;
    this.h.notice('Um Navio Fantasma surgiu da névoa! Afunde-o com o canhão', 'bad', 'fantasma');
    this.fx.flash({ x: ghost.s.x, y: 4, z: ghost.s.z }, '#3aff9a', 8, 0.6);
  }

  ghostHit(dmg, at) {
    const g = this.ghost;
    if (!g?.alive) return 0;
    g.hull = Math.max(0, g.hull - dmg);
    this.h.damageFloat?.(at, dmg);
    this.fx.burst(at, '#9affd0', { count: 10, speed: 4, up: 3 });
    if (g.hull <= 0) {
      g.alive = false;
      g.sink = 3;
      this.fx.pillar({ x: g.s.x, y: 0, z: g.s.z }, '#3aff9a', 3, 14, 1.2);
      this.h.toast('O Navio Fantasma afundou! O tesouro dele boia até o seu bote.', 'gold');
      this.h.reward('fantasma');
    }
    return dmg;
  }

  stepGhost(dt, ctx) {
    const g = this.ghost;
    if (!g) return;
    const c = EVENTS3.ghost;
    if (g.sink > 0) {
      g.sink -= dt;
      g.g.position.y -= dt * 2;
      g.g.rotation.z += dt * 0.3;
      if (g.sink <= 0) this.removeGhost();
      return;
    }
    g.life -= dt;
    const b = ctx.boat;
    const far = Math.hypot(g.s.x - b.x, g.s.z - b.z) > 260;
    if (g.life <= 0 || far || ctx.sea !== 3) {
      this.h.notice('O Navio Fantasma sumiu na névoa', 'zone', 'fantasma');
      this.removeGhost();
      return;
    }
    // circula o bote
    g.ang += dt * 0.18;
    const tx = b.x + Math.cos(g.ang) * c.radius;
    const tz = b.z + Math.sin(g.ang) * c.radius;
    const k = Math.min(1, dt * 0.6);
    const px = g.s.x;
    const pz = g.s.z;
    g.s.x += (tx - g.s.x) * k;
    g.s.z += (tz - g.s.z) * k;
    g.vel.x = (g.s.x - px) / Math.max(dt, 1e-3);
    g.vel.z = (g.s.z - pz) / Math.max(dt, 1e-3);
    g.s.yaw = Math.atan2(g.vel.x, g.vel.z);
    g.y = this.h.ocean.heightAt(g.s.x, g.s.z);
    g.g.position.set(g.s.x, g.y - 0.6 + 0.3 * Math.sin(ctx.time * 1.3), g.s.z);
    g.g.rotation.set(0, g.s.yaw, 0.06 * Math.sin(ctx.time));
    // chamas fantasmas marcadas na água em volta do bote
    g.fireT -= dt;
    if (g.fireT <= 0 && ctx.aboard) {
      g.fireT = c.fireEvery;
      for (let i = 0; i < c.shots; i++) {
        const at = { x: b.x + b.velocity.x * c.telegraph + (this.rand() - 0.5) * 9, z: b.z + b.velocity.z * c.telegraph + (this.rand() - 0.5) * 9 };
        at.y = this.h.ocean.heightAt(at.x, at.z);
        g.marks.push({ ...at, t: c.telegraph + i * 0.25 });
        this.fx.mark(at, '#3aff9a', 3, c.telegraph + i * 0.25);
      }
    }
    for (let i = g.marks.length - 1; i >= 0; i--) {
      const m = g.marks[i];
      m.t -= dt;
      if (m.t > 0) continue;
      g.marks.splice(i, 1);
      this.fx.pillar(m, '#3aff9a', 2, 6, 0.5);
      if (ctx.aboard && Math.hypot(b.x - m.x, b.z - m.z) < 4) this.h.hullHit(c.hit, m);
    }
  }

  removeGhost() {
    this.ghost?.g.removeFromParent();
    this.ghost = null;
  }

  // ===== Maré Celeste =====
  spawnTide(boat) {
    const c = EVENTS3.tide;
    const a = this.rand() * Math.PI * 2;
    const cx = boat.x + Math.cos(a) * 26;
    const cz = boat.z + Math.sin(a) * 26;
    const group = new THREE.Group();
    const top = mat('#8ad070', { emissive: '#ffe8a0', emissiveIntensity: 0.12 });
    const rock = mat('#c8c0e0', { emissive: '#9fd0ff', emissiveIntensity: 0.15 });
    const colliders = [];
    let chest = null;
    for (let i = 0; i < c.steps; i++) {
      const ang = a + Math.PI + i * 0.75;
      const x = cx + Math.cos(ang) * (6 + i * 0.4);
      const z = cz + Math.sin(ang) * (6 + i * 0.4);
      const y = 1.4 + i * c.rise;
      const w = i === c.steps - 1 ? 6 : 4.2;
      const p = new THREE.Mesh(box, top);
      p.scale.set(w, 0.6, w);
      p.position.set(x, y, z);
      const under = new THREE.Mesh(box, rock);
      under.scale.set(w * 0.7, 1.6, w * 0.7);
      under.position.set(x, y - 1.1, z);
      group.add(p, under);
      colliders.push(this.h.physics.addBox({ x, y, z }, { x: w / 2, y: 0.3, z: w / 2 }, 0, { material: 'pedra' }));
      if (i === c.steps - 1) {
        const ch = new THREE.Mesh(box, mat('#c9a227', { emissive: '#8a6a10', emissiveIntensity: 0.5, metalness: 0.5 }));
        ch.scale.set(1.4, 1, 1);
        ch.position.set(x, y + 0.8, z);
        group.add(ch);
        chest = { x, y: y + 0.8, z, mesh: ch, opened: false };
      }
    }
    this.scene.add(group);
    this.tide = { group, colliders, chest, life: c.life, rise: 0 };
    this.h.notice('Maré Celeste! Ilhotas flutuantes subiram do mar — há um baú no alto', 'good', 'mare-celeste');
  }

  openChest() {
    const ch = this.tide.chest;
    ch.opened = true;
    ch.mesh.visible = false;
    this.fx.burst({ x: ch.x, y: ch.y + 0.5, z: ch.z }, '#ffe8a0', { count: 30, speed: 6, up: 6 });
    this.h.reward('mare-celeste');
  }

  stepTide(dt, ctx) {
    const t = this.tide;
    if (!t) return;
    t.life -= dt;
    // sobe do mar nos primeiros 2 s (só visual; os colisores já estão no lugar)
    t.rise = Math.min(1, t.rise + dt / 2);
    t.group.position.y = -6 * (1 - t.rise) + 0.2 * Math.sin(ctx.time * 0.8);
    if (t.chest && !t.chest.opened && Math.random() < dt * 3) this.fx.spark({ x: t.chest.x, y: t.chest.y + 0.6, z: t.chest.z }, '#ffe8a0', { count: 1, speed: 0.4, up: 1.2, size: 0.4, life: 0.6, gravity: 0 });
    if (t.life <= 0) {
      this.h.notice('A Maré Celeste baixou: as ilhotas voltaram ao mar', 'zone', 'mare-celeste');
      this.removeTide();
    }
  }

  removeTide() {
    const t = this.tide;
    if (!t) return;
    t.group.removeFromParent();
    for (const c of t.colliders) this.h.physics.world.removeCollider(c, false);
    this.tide = null;
  }
}
