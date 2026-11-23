// Frota inimiga e canhões (atualização 16): navios corsários patrulham em volta das ilhas do
// Primeiro Mar (e um perto de casa), atacam o bote do jogador quando ele navega por perto,
// atiram balas com arco real e afundam quando o casco chega a zero (com saque). O bote do
// jogador tem um canhão giratório na proa: atira para onde a câmera aponta, com mira
// automática no navio mais perto do centro e o arco previsto desenhado na água.
// Regras puras em naval.js; aqui fica o que se vê e o encaixe com o jogo.

import * as THREE from 'three';
import { Boat } from './boat.js';
import { BOAT } from './boatRules.js';
import { CANNON, NAVAL, shipAI, launch, stepBall, aimPitch, leadAim, arcPoints, blastDamage, ramDamage, enemySpread, shipHull, enemyCannonDamage, playerCannonDamage, playerHull, ringRoute } from './naval.js';
import { clamp, wrapAngle } from '../core/math.js';

const SHIP_SCALE = 1.5;
const LOOKS = [
  { dark: '#2a1f1a', wood: '#4a3424', sail: '#3a3030', stripe: '#c0392b', flag: '#101010' },
  { dark: '#1f2a24', wood: '#3f4a32', sail: '#6a8a5a', stripe: '#d8c040', flag: '#2a5a2a' },
  { dark: '#3a2a1a', wood: '#7a5a3a', sail: '#d8c090', stripe: '#a8321e', flag: '#c09040' },
  { dark: '#1a2238', wood: '#34405a', sail: '#e8e8f0', stripe: '#4a8aff', flag: '#1f3f7a' },
  { dark: '#2a3440', wood: '#5a6a7a', sail: '#bfe0f0', stripe: '#ffffff', flag: '#7fd6ff' },
  { dark: '#1a1a22', wood: '#3a3a44', sail: '#5a2a6a', stripe: '#c084fc', flag: '#101010' },
  { dark: '#2a1410', wood: '#4a2a1a', sail: '#7a2a1a', stripe: '#ff8a2a', flag: '#ff6a1a' },
  { dark: '#3a2a10', wood: '#6a4a20', sail: '#e8c040', stripe: '#8a1a1a', flag: '#ffd040' },
  { dark: '#e8e8f0', wood: '#9fb8d0', sail: '#ffffff', stripe: '#ffe45a', flag: '#ffe45a' },
];
const NAMES = ['Garra de Coral', 'Sombra do Bosque', 'Vela de Areia', 'Lâmina da Maré', 'Casco de Gelo', 'Lanterna Negra', 'Brasa Errante', 'Estandarte Partido', 'Asa do Vento', 'Maré Traiçoeira', 'Cipó Negro', 'Punho de Granito', 'Presa do Inverno', 'Vela do Poente', 'Mortalha Noturna', 'Brasa de Obsidiana', 'Grilhão do Abismo'];

// Um navio por ilha do Primeiro Mar (nível no primeiro terço da faixa) e a Chalupa Ferrugem
// entre a Ilha de Treino e o Porto das Origens (nível 12)
export function fleetPlan(sea) {
  const plan = [{ id: 'navio-casa', nome: 'Chalupa Ferrugem', level: 12, look: LOOKS[0], route: ringRoute(175, 215, 45, 6) }];
  sea.forEach((def, i) => {
    const [a, b] = def.faixa;
    plan.push({ id: `navio-${def.id}`, nome: NAMES[i] ?? `Corsário ${i + 1}`, level: Math.round(a + (b - a) * 0.3), look: LOOKS[i % LOOKS.length], route: ringRoute(def.x, def.z, def.R + 58, 6, i * 0.7) });
  });
  return plan;
}

function makeTag() {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true }));
  sprite.scale.set(6.4, 1.6, 1);
  sprite.renderOrder = 6;
  let last = '';
  return {
    sprite,
    draw(name, ratio) {
      const key = `${name}|${ratio.toFixed(3)}`;
      if (key === last) return;
      last = key;
      ctx.clearRect(0, 0, 384, 96);
      ctx.font = '700 32px Cinzel, Georgia, serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(15, 10, 30, 0.9)';
      ctx.fillStyle = '#ffd0a0';
      ctx.strokeText(name, 192, 36);
      ctx.fillText(name, 192, 36);
      ctx.fillStyle = 'rgba(15, 10, 30, 0.85)';
      ctx.fillRect(42, 52, 300, 24);
      ctx.fillStyle = '#c8a060';
      ctx.fillRect(46, 56, 292 * clamp(ratio, 0, 1), 16);
      tex.needsUpdate = true;
    },
  };
}

export class EnemyShip extends Boat {
  constructor({ scene, physics, ocean, ground, def }) {
    super({ scene, physics, ocean, ground, look: { name: 'Navio_' + def.id, ...def.look, cannons: 2, bowCannon: false }, scale: SHIP_SCALE });
    this.def = def;
    this.id = def.id;
    this.level = def.level;
    this.maxHull = shipHull(def.level);
    this.hull = this.maxHull;
    this.state = 'ativo'; // 'ativo', 'afundando', 'ausente'
    this.sinkT = 0;
    this.respawnT = 0;
    this.cd = 2 + Math.random() * 2;
    this.ai = { mode: 'patrulha', wp: 0, route: def.route, home: def.route[0], side: Math.random() < 0.5 ? 1 : -1 };
    this.tag = makeTag();
    scene.add(this.tag.sprite);
    this.pos = new THREE.Vector3();
    this.life = 1;
    this.aboard = true; // o leme é da IA
    this.place(def.route[0].x, def.route[0].z, Math.atan2(def.route[1].x - def.route[0].x, def.route[1].z - def.route[0].z));
    this.syncPos();
  }

  get name() {
    return `${this.def.nome} Nv. ${this.level}`;
  }

  get alive() {
    return this.state === 'ativo';
  }

  syncPos() {
    this.pos.set(this.s.x, this.y, this.s.z);
  }

  // dentro do casco (caixa do navio em volta do ponto)
  hits(p, pad = 0.6) {
    const dx = p.x - this.s.x;
    const dz = p.z - this.s.z;
    const fx = Math.sin(this.s.yaw);
    const fz = Math.cos(this.s.yaw);
    const along = dx * fx + dz * fz;
    const across = dx * fz - dz * fx;
    return Math.abs(along) < (BOAT.length * SHIP_SCALE) / 2 + pad && Math.abs(across) < (BOAT.beam * SHIP_SCALE) / 2 + pad && p.y > this.y - 1.5 && p.y < this.y + 3.5 * SHIP_SCALE;
  }

  // bocas dos canhões do lado virado para o alvo
  muzzle(target) {
    const fx = Math.sin(this.s.yaw);
    const fz = Math.cos(this.s.yaw);
    const side = Math.sign((target.x - this.s.x) * fz - (target.z - this.s.z) * fx) || 1;
    const across = side * (BOAT.beam * SHIP_SCALE) / 2;
    const along = (Math.random() - 0.5) * 2.4;
    return { x: this.s.x + fx * along + fz * across, y: this.y + BOAT.deck * SHIP_SCALE + CANNON.height, z: this.s.z + fz * along - fx * across };
  }

  render(alpha, dt = 0) {
    super.render(alpha, dt);
    const g = this.model.group;
    if (this.state === 'afundando') {
      const k = 1 - this.sinkT / NAVAL.sinkTime;
      g.position.y -= k * 7;
      g.rotation.z += k * 0.6;
      g.rotation.x += k * 0.25;
    }
    g.visible = this.state !== 'ausente';
    this.tag.sprite.visible = this.state === 'ativo' && this.tagVisible;
    if (this.tag.sprite.visible) {
      this.tag.sprite.position.set(g.position.x, g.position.y + 11, g.position.z);
      this.tag.draw(this.name, this.hull / this.maxHull);
    }
  }
}

// ===== Frota, balas e canhão do jogador =====
export class Fleet {
  constructor({ scene, physics, ocean, ground, sea, fx, audio, onEvent = () => {} }) {
    this.scene = scene;
    this.ground = ground;
    this.ocean = ocean;
    this.fx = fx;
    this.audio = audio;
    this.onEvent = onEvent;
    this.ships = fleetPlan(sea).map((def) => new EnemyShip({ scene, physics, ocean, ground, def }));
    // balas (conjunto fixo de malhas, sem criar objetos no combate)
    const ballGeo = new THREE.SphereGeometry(0.32, 10, 8);
    const ballMat = new THREE.MeshStandardMaterial({ color: '#1a1a1e', roughness: 0.4, metalness: 0.6 });
    this.balls = Array.from({ length: 32 }, () => {
      const mesh = new THREE.Mesh(ballGeo, ballMat);
      mesh.visible = false;
      mesh.castShadow = true;
      scene.add(mesh);
      return { mesh, live: false, b: null, owner: null, damage: 0 };
    });
    // arco de mira do canhão do bote
    this.arcGeo = new THREE.BufferGeometry();
    this.arcGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(60 * 3), 3));
    this.arc = new THREE.Line(this.arcGeo, new THREE.LineDashedMaterial({ color: '#ffd36b', dashSize: 0.9, gapSize: 0.6, transparent: true, opacity: 0.85, depthWrite: false }));
    this.arc.frustumCulled = false;
    this.arc.visible = false;
    this.arc.renderOrder = 4;
    scene.add(this.arc);
    this.aimRing = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.1, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd36b', transparent: true, opacity: 0.7, depthWrite: false }));
    this.aimRing.visible = false;
    scene.add(this.aimRing);
    this.cooldown = 0;
    this.level = 1;
    this.maxHull = playerHull(1);
    this.hull = this.maxHull;
    this.sunk = 0; // segundos do bote afundando
    this.target = null; // navio mirado
    // outros alvos do canhão (bestas marinhas; atualização 19): { alive, s, y, hits, velocity, takeHit }
    this.extraTargets = () => [];
  }

  allTargets() {
    return [...this.ships, ...this.extraTargets()];
  }

  setLevel(level, hull = null) {
    const ratio = this.hull / this.maxHull;
    this.level = level;
    this.maxHull = playerHull(level);
    this.hull = hull ?? Math.round(this.maxHull * ratio);
  }

  get nearestActive() {
    return this.ships.filter((s) => s.alive);
  }

  // navio de frente para a câmera (cone de 25°) e ao alcance
  pickTarget(from, yaw) {
    let best = null;
    let bestScore = Infinity;
    for (const s of this.allTargets()) {
      if (!s.alive) continue;
      const d = Math.hypot(s.s.x - from.x, s.s.z - from.z);
      if (d > CANNON.range) continue;
      const off = Math.abs(wrapAngle(Math.atan2(s.s.x - from.x, s.s.z - from.z) - yaw));
      if (off > 0.45) continue;
      const score = off * 40 + d * 0.2;
      if (score < bestScore) {
        bestScore = score;
        best = s;
      }
    }
    return best;
  }

  // mira do canhão do bote: { origin, yaw, pitch, target }
  aim(boat, camYaw) {
    const fx = Math.sin(boat.s.yaw);
    const fz = Math.cos(boat.s.yaw);
    const along = BOAT.length / 2 - 2.3;
    const origin = { x: boat.s.x + fx * along, y: boat.y + BOAT.deck + CANNON.height, z: boat.s.z + fz * along };
    const target = this.pickTarget(origin, camYaw);
    this.target = target;
    if (target) {
      const a = leadAim(origin, { x: target.s.x, y: target.y + 1, z: target.s.z }, target.velocity);
      if (a) return { origin, yaw: a.yaw, pitch: a.pitch, target };
    }
    return { origin, yaw: camYaw, pitch: aimPitch(50, -origin.y) ?? 0.2, target: null };
  }

  playerFire(boat, camYaw) {
    if (this.cooldown > 0 || this.sunk > 0) return false;
    const a = this.aim(boat, camYaw);
    this.cooldown = CANNON.cooldown;
    this.spawnBall(launch(a.origin, a.yaw, a.pitch), 'player', playerCannonDamage(this.level));
    this.fx?.burst(a.origin, '#ffb040', { count: 10, speed: 4, up: 1.5, life: 0.35 });
    this.fx?.burst(a.origin, '#8a8a8a', { count: 8, speed: 2, up: 2, life: 0.8, gravity: 2 });
    this.audio?.play('impacto', 'acerto', 0.9);
    return true;
  }

  spawnBall(b, owner, damage, ship = null) {
    const slot = this.balls.find((x) => !x.live) ?? this.balls[0];
    Object.assign(slot, { live: true, b, owner, damage, ship });
    slot.mesh.visible = true;
    slot.mesh.position.set(b.x, b.y, b.z);
  }

  explode(at, owner, damage, ship, ctx) {
    const inWater = at.y < this.ocean.heightAt(at.x, at.z) + 0.6 && this.ground(at.x, at.z) < -0.5;
    this.fx?.burst(at, inWater ? '#dff6ff' : '#ffb040', { count: inWater ? 18 : 22, speed: inWater ? 4 : 6, up: inWater ? 8 : 4, life: 0.7 });
    if (!inWater) this.fx?.ring(at, '#ff8a2a', CANNON.radius, 0.35);
    this.audio?.play(inWater ? 'mare' : 'impacto', 'acerto', 0.6);
    if (owner === 'player') {
      for (const s of this.allTargets()) {
        // só alvos dentro do raio da explosão (distância até o costado)
        if (!s.alive || !s.hits(at, CANNON.radius)) continue;
        const d = Math.max(0, Math.hypot(at.x - s.s.x, at.z - s.s.z) - (s.isBeast ? s.def.radius : (BOAT.beam * SHIP_SCALE) / 2));
        const dmg = blastDamage(damage, Math.min(d, CANNON.radius));
        if (dmg > 0) {
          if (s.isBeast) s.takeHit(dmg, at);
          else this.damageShip(s, dmg, at);
        }
      }
    } else {
      // bala inimiga: casco do bote (com o jogador a bordo) ou o próprio jogador na água/terra
      const boat = ctx.boat;
      if (ctx.aboard && this.sunk <= 0) {
        const d = Math.hypot(at.x - boat.s.x, at.z - boat.s.z) - BOAT.beam / 2;
        const dmg = blastDamage(damage, clamp(d, 0, CANNON.radius + 1));
        if (dmg > 0) this.damageHull(dmg, at);
      } else {
        const p = ctx.player;
        const d = Math.hypot(at.x - p.x, at.z - p.z);
        const dmg = Math.abs(at.y - p.y) < 3 ? blastDamage(damage * 0.5, d) : 0;
        if (dmg > 0) this.onEvent('playerBlast', { at, damage: dmg, ship });
      }
    }
  }

  damageShip(s, dmg, at) {
    s.hull = Math.max(0, s.hull - dmg);
    this.onEvent('shipHit', { ship: s, damage: dmg, at });
    if (s.ai.mode !== 'ataque') s.ai.mode = 'ataque';
    if (s.hull <= 0) {
      s.state = 'afundando';
      s.sinkT = NAVAL.sinkTime;
      s.s.speed = 0;
      this.onEvent('shipSunk', { ship: s });
    }
  }

  damageHull(dmg, at) {
    if (this.sunk > 0) return;
    this.hull = Math.max(0, this.hull - dmg);
    this.onEvent('hullHit', { damage: dmg, at, hull: this.hull, max: this.maxHull });
    if (this.hull <= 0) {
      this.sunk = 4;
      this.onEvent('boatSunk', {});
    }
  }

  repair(amount = Infinity) {
    this.hull = Math.min(this.maxHull, this.hull + amount);
  }

  // passo fixo: ctx = { boat, aboard, player: {x,y,z} }
  step(dt, ctx) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    const boat = ctx.boat;
    const target = ctx.aboard && this.sunk <= 0 ? { x: boat.s.x, z: boat.s.z } : null;
    for (const s of this.ships) {
      if (s.state === 'ausente') {
        s.respawnT -= dt;
        if (s.respawnT <= 0) {
          s.state = 'ativo';
          s.hull = s.maxHull;
          s.ai.mode = 'patrulha';
          s.ai.wp = 0;
          const r = s.ai.route;
          s.place(r[0].x, r[0].z, Math.atan2(r[1].x - r[0].x, r[1].z - r[0].z));
        }
        continue;
      }
      if (s.state === 'afundando') {
        s.sinkT -= dt;
        s.step(dt, null);
        if (s.sinkT <= 0) {
          s.state = 'ausente';
          s.respawnT = NAVAL.respawn;
        }
        s.syncPos();
        continue;
      }
      // navios longe do jogador ficam parados (não gastam nada)
      const far = Math.hypot(s.s.x - ctx.player.x, s.s.z - ctx.player.z) > 400;
      if (far) continue;
      s.ai.x = s.s.x;
      s.ai.z = s.s.z;
      const cmd = shipAI(s.ai, target);
      s.step(dt, cmd);
      s.syncPos();
      s.cd -= dt;
      if (cmd.fire && s.cd <= 0 && target) {
        s.cd = CANNON.enemyCooldown[0] + Math.random() * (CANNON.enemyCooldown[1] - CANNON.enemyCooldown[0]);
        const from = s.muzzle(target);
        const spread = enemySpread(cmd.dist, Math.abs(boat.s.speed));
        const a = leadAim(from, { x: target.x, y: boat.y + 0.5, z: target.z }, boat.velocity);
        if (a) {
          const pitch = aimPitch(Math.max(4, a.dist + spread.dist), boat.y - from.y) ?? a.pitch;
          this.spawnBall(launch(from, a.yaw + spread.yaw, pitch), 'enemy', enemyCannonDamage(s.level), s);
          this.fx?.burst(from, '#ffb040', { count: 8, speed: 4, up: 1.5, life: 0.3 });
          this.fx?.burst(from, '#9a9a9a', { count: 6, speed: 2, up: 2, life: 0.8, gravity: 2 });
          this.audio?.play('impacto', 'acerto', 0.5);
        }
      }
      // abalroar: navio e bote se tocando
      if (ctx.aboard && this.sunk <= 0) {
        const d = Math.hypot(s.s.x - boat.s.x, s.s.z - boat.s.z);
        const touch = (BOAT.length * (SHIP_SCALE + 1)) / 2 * 0.55;
        if (d < touch) {
          const bv = boat.velocity;
          const sv = s.velocity;
          const rel = Math.hypot(bv.x - sv.x, bv.z - sv.z);
          const nx = (boat.s.x - s.s.x) / (d || 1);
          const nz = (boat.s.z - s.s.z) / (d || 1);
          const push = touch - d;
          boat.s.x += nx * push * 0.7;
          boat.s.z += nz * push * 0.7;
          s.s.x -= nx * push * 0.3;
          s.s.z -= nz * push * 0.3;
          if (rel >= NAVAL.ramMin && !s.ramT) {
            s.ramT = 1;
            this.damageHull(ramDamage(rel, 1.5), boat.s);
            this.damageShip(s, ramDamage(rel, 0.8), s.pos);
            boat.s.speed *= -0.3;
            this.onEvent('ram', { ship: s, rel });
          }
        }
      }
      if (s.ramT) s.ramT = Math.max(0, s.ramT - dt);
    }
    // balas
    for (const slot of this.balls) {
      if (!slot.live) continue;
      const b = stepBall(slot.b, dt);
      let hit = false;
      if (slot.owner === 'player') {
        for (const s of this.allTargets()) if (s.alive && s.hits(b)) hit = true;
      } else if (ctx.aboard && this.sunk <= 0) {
        const dx = b.x - boat.s.x;
        const dz = b.z - boat.s.z;
        if (Math.hypot(dx, dz) < BOAT.length / 2 && b.y < boat.y + 2.2) hit = true;
      }
      const floor = Math.max(this.ocean.heightAt(b.x, b.z), this.ground(b.x, b.z));
      if (hit || b.y <= floor || b.t > 6) {
        slot.live = false;
        slot.mesh.visible = false;
        if (b.t <= 6) this.explode({ x: b.x, y: Math.max(b.y, floor), z: b.z }, slot.owner, slot.damage, slot.ship, ctx);
      }
    }
    if (this.sunk > 0) {
      this.sunk -= dt;
      if (this.sunk <= 0) this.onEvent('boatRestored', {});
    }
  }

  render(alpha, dt, { aboard, boat, camYaw, playerPos }) {
    for (const s of this.ships) {
      const d = Math.hypot(s.s.x - playerPos.x, s.s.z - playerPos.z);
      s.model.group.visible = d < 420;
      if (!s.model.group.visible) {
        s.tag.sprite.visible = false;
        continue;
      }
      s.tagVisible = d < 90;
      s.render(alpha, dt);
    }
    for (const slot of this.balls) if (slot.live) slot.mesh.position.set(slot.b.x, slot.b.y, slot.b.z);
    // arco previsto do canhão do bote
    this.arc.visible = aboard && this.sunk <= 0;
    this.aimRing.visible = this.arc.visible;
    if (this.arc.visible) {
      const a = this.aim(boat, camYaw);
      const pts = arcPoints(a.origin, a.yaw, a.pitch, { step: 0.07, max: 60, floor: -0.5 });
      const attr = this.arcGeo.attributes.position;
      for (let i = 0; i < 60; i++) {
        const p = pts[Math.min(i, pts.length - 1)];
        attr.setXYZ(i, p.x, p.y, p.z);
      }
      attr.needsUpdate = true;
      this.arcGeo.setDrawRange(0, pts.length);
      this.arc.computeLineDistances();
      const end = pts[pts.length - 1];
      this.aimRing.position.set(end.x, Math.max(0.1, this.ocean.heightAt(end.x, end.z) + 0.1), end.z);
      this.arc.material.color.set(a.target ? '#ff6a4a' : '#ffd36b');
      this.aimRing.material.color.copy(this.arc.material.color);
      this.arc.material.opacity = this.cooldown > 0 ? 0.35 : 0.85;
    }
  }

  // navio mais perto ativo e em combate (para a barra no topo)
  engaged(playerPos, range = 70) {
    // besta marinha em encontro tem prioridade na barra do topo
    const beast = this.encounter?.();
    if (beast && beast.state !== 'aviso' && Math.hypot(beast.s.x - playerPos.x, beast.s.z - playerPos.z) < range * 1.5) return beast;
    let best = null;
    let bestD = range;
    for (const s of this.ships) {
      if (!s.alive) continue;
      const d = Math.hypot(s.s.x - playerPos.x, s.s.z - playerPos.z);
      if (d < bestD && (s.ai.mode === 'ataque' || s.hull < s.maxHull)) {
        best = s;
        bestD = d;
      }
    }
    return best;
  }

  snapshot() {
    return { hull: Math.round(this.hull) };
  }
}
