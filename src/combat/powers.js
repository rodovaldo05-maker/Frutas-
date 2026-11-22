// Sistema de poderes das frutas (atualização 3): energia, recargas, gesto do laboratório,
// liberação no quadro de contato do clipe e o efeito de cada formato (projétil, investida,
// área, ponto marcado, faixa, cone, muralha, teleporte, raio em cadeia, pilares).
// Dano = dano da habilidade × (1 + 3% por ponto de Fruta) × bônus de domínio × defesa do alvo.

import * as THREE from 'three';
import { clipTiming, computeDamage } from './rules.js';
import { wrapAngle } from '../core/math.js';
import { AWAKEN } from '../fruits/awakening.js';

export const ENERGY = { base: 100, perVitality: 4, regen: 7, delay: 1 };

const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

export class FruitPowers {
  // stats(): { fruit, domain }   onEvent(name, data)
  constructor({ ctl, fx = null, lab = null, stats, onEvent = () => {} }) {
    this.ctl = ctl;
    this.fx = fx;
    this.lab = lab; // efeitos do Laboratório Voxel por fruta (atualização 18); null = efeitos genéricos
    this.stats = stats;
    this.onEvent = onEvent;
    this.powers = [];
    this.fruit = null;
    this.energyMax = ENERGY.base;
    this.energy = ENERGY.base;
    this.idle = 9;
    this.cooldown = [0, 0, 0];
    this.casting = null;
    this.timers = []; // golpes agendados { at, fn }
    this.shots = []; // projéteis
    this.dashes = []; // investidas
    this.wallUntil = 0;
    this.marks = new Map(); // alvo -> tempo da marca (Eco)
    this.time = 0;
    this.domainLevel = 1;
    this.awakened = false; // despertar ligado (atualização 13; só nas frutas)
    this.dmgMult = 1; // forma híbrida e outros multiplicadores de fora
    this.cdMult = 1; // recarga (especialização Essência Pura)
  }

  // Liga/desliga o despertar; exige energia para começar
  toggleAwaken() {
    if (this.awakened) {
      this.awakened = false;
      this.onEvent('awaken', { on: false });
      return true;
    }
    if (!this.fruit) return false;
    if (this.energy < AWAKEN.minEnergy) {
      this.onEvent('denied', { message: `Despertar: precisa de ${AWAKEN.minEnergy} de energia.` });
      return false;
    }
    this.energy -= AWAKEN.start;
    this.idle = 0;
    this.awakened = true;
    this.onEvent('awaken', { on: true });
    return true;
  }

  // Atualiza fruta/espada/estilo. Recargas e golpe em andamento só zeram quando o item muda
  // de verdade (atualizar o equipamento ou subir de nível não pode zerar recarga nem cancelar)
  setFruit(fruit, powers, domainLevel = 1) {
    const changed = (fruit?.id ?? null) !== (this.fruit?.id ?? null);
    this.fruit = fruit;
    this.powers = powers;
    this.domainLevel = domainLevel;
    if (changed) {
      this.cooldown = powers.map(() => 0);
      this.endFocus();
      this.casting = null;
      if (this.awakened) {
        this.awakened = false;
        this.onEvent('awaken', { on: false });
      }
    }
    while (this.cooldown.length < Math.max(3, powers.length)) this.cooldown.push(0);
  }

  setEnergyMax(max) {
    const ratio = this.energyMax > 0 ? this.energy / this.energyMax : 1;
    this.energyMax = max;
    this.energy = Math.min(max, ratio * max);
  }

  unlocked(slot) {
    const p = this.powers[slot];
    return !!p && this.domainLevel >= p.unlock;
  }

  // Motivo de não poder usar agora (ou null)
  blocked(slot, canAct) {
    const p = this.powers[slot];
    if (!this.fruit || !p) return 'Coma uma fruta para liberar os poderes.';
    if (!this.unlocked(slot)) return p.weapon ? `${p.nome}: libera na proficiência ${p.unlock} com espadas.` : `${p.nome}: libera no domínio ${p.unlock} da fruta.`;
    if (!canAct) return 'agora não';
    if (this.casting) return 'agora não';
    if (this.cooldown[slot] > 0) return 'recarga';
    if (this.energy < p.custo) return 'Energia insuficiente. Espere recuperar.';
    return null;
  }

  cast(slot, targets, canAct) {
    const why = this.blocked(slot, canAct);
    if (why) {
      if (why !== 'agora não' && why !== 'recarga') this.onEvent('denied', { message: why });
      return false;
    }
    const p = this.powers[slot];
    const c = this.ctl;
    this.energy -= p.custo;
    this.idle = 0;
    this.cooldown[slot] = p.recarga * (this.cdMult ?? 1);
    // mira: alvo vivo mais perto à frente (ou para onde o personagem olha)
    const target = this.aim(targets, p.params.range ?? 14);
    if (target) c.yaw = Math.atan2(target.pos.x - c.pos.x, target.pos.z - c.pos.z);
    const dir = new THREE.Vector3(Math.sin(c.yaw), 0, Math.cos(c.yaw));
    const tm = clipTiming(p.clip);
    this.casting = { p, t: 0, tm, dir, target, released: false };
    // aviso no chão para golpes em ponto marcado e faixas
    const dest = this.destination(p, target, dir);
    this.casting.dest = dest;
    if (this.lab) {
      // laboratório: carga na mão durante o gesto, marca/nuvem/faixa cinética antes do golpe
      this.casting.focus = this.lab.focus(p.fruit, p.slot, this.handPos(dir));
      this.lab.cast(p, { pos: c.pos, dir, dest, release: tm.release });
      if (p.kind === 'faixa' && !p.params.travel && p.fruit !== 'impacto') this.fx?.lane(c.pos, dir, p.params.length, p.params.halfWidth, p.color, tm.release + 0.1);
    } else {
      if (p.kind === 'alvo') this.fx?.mark(dest, p.color, p.params.radius, tm.release + (p.params.delay ?? 0) + (p.params.pulses ?? 1) * (p.params.interval ?? 0));
      if (p.kind === 'faixa' && !p.params.travel) this.fx?.lane(c.pos, dir, p.params.length, p.params.halfWidth, p.color, tm.release + 0.1);
    }
    this.onEvent('cast', { power: p });
    return true;
  }

  handPos(dir) {
    const c = this.ctl.pos;
    return new THREE.Vector3(c.x + dir.x * 0.9, c.y + 2.4, c.z + dir.z * 0.9);
  }

  endFocus() {
    this.casting?.focus?.remove?.();
    if (this.casting) this.casting.focus = null;
  }

  aim(targets, range) {
    const c = this.ctl;
    let best = null;
    let bd = range;
    for (const t of targets) {
      if (!t.alive) continue;
      const d = flat(t.pos, c.pos);
      if (d > bd || Math.abs(t.pos.y - c.pos.y) > 4) continue;
      const ahead = Math.abs(wrapAngle(Math.atan2(t.pos.x - c.pos.x, t.pos.z - c.pos.z) - c.yaw));
      if (ahead > 1.4 && d > 4) continue;
      bd = d;
      best = t;
    }
    return best;
  }

  destination(p, target, dir) {
    const c = this.ctl.pos;
    const max = p.params.range ?? 10;
    if (target && flat(target.pos, c) <= max) return new THREE.Vector3(target.pos.x, target.pos.y, target.pos.z);
    const d = Math.min(max, 6);
    return new THREE.Vector3(c.x + dir.x * d, c.y, c.z + dir.z * d);
  }

  // ===== Passo =====
  update(dt, targets, canAct) {
    this.time += dt;
    const c = this.ctl;
    const cdk = this.awakened ? AWAKEN.cdSpeed : 1;
    for (let i = 0; i < this.cooldown.length; i++) this.cooldown[i] = Math.max(0, (this.cooldown[i] || 0) - dt * cdk); // todos os slots (estilos têm 4)
    // despertar: gasta energia por segundo e desliga sozinho sem energia
    if (this.awakened) {
      this.energy -= AWAKEN.drain * dt;
      this.idle = 0;
      if (this.energy <= 0) {
        this.energy = 0;
        this.awakened = false;
        this.onEvent('awaken', { on: false, empty: true });
      }
    }
    this.idle += dt;
    if (this.idle >= ENERGY.delay) this.energy = Math.min(this.energyMax, this.energy + ENERGY.regen * (this.regenMult ?? 1) * dt);

    const k = this.casting;
    if (k) {
      if (!canAct && c.state !== 'ground') {
        this.endFocus();
        this.casting = null;
      } else {
        k.t += dt;
        k.focus?.seek?.(this.handPos(k.dir), Math.min(1, k.t / k.tm.release));
        c.attackLock = Math.max(c.attackLock, 0.05);
        c.action = { clip: k.p.clip, t: k.t };
        if (!k.released && k.t >= k.tm.release) {
          k.released = true;
          this.endFocus();
          this.release(k, targets);
        }
        if (k.t >= k.tm.duration) {
          this.casting = null;
          c.action = null;
        }
      }
    }

    // golpes agendados (pulsos, raios em sequência, geodo)
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const tm = this.timers[i];
      tm.at -= dt;
      if (tm.at <= 0) {
        this.timers.splice(i, 1);
        tm.fn();
      }
    }
    this.updateShots(dt, targets);
    this.updateDashes(dt, targets);
    for (const [t, until] of this.marks) if (until < this.time || !t.alive) this.marks.delete(t);
  }

  // ===== Acerto =====
  hit(target, p, { mult = 1, origin = this.ctl.pos, effect = {} } = {}) {
    if (!target.alive) return null;
    const s = this.stats();
    const base = p.dano * mult;
    if (base <= 0 && !Object.keys(effect).length) return null;
    const wake = this.awakened ? AWAKEN.damage : 1;
    // clima (atualização 19): chuva e tempestade enfraquecem as frutas de fogo
    const weather = this.weatherMult?.(p.fruit) ?? 1;
    const damage = base > 0 ? computeDamage(base, { mult: s.fruit * s.domain * wake * (this.dmgMult ?? 1) * weather, defense: target.defense ?? 0 }) : 0;
    const c = this.ctl;
    const attack = {
      id: `poder:${p.fruit}:${p.slot}`, nome: p.nome, posture: 14, knock: effect.push ?? 1.2, reaction: p.slot === 2 ? 'media' : 'leve',
      hitstop: 0.05, heavy: p.slot === 2, fruit: p.fruit,
    };
    const eff = { ...effect };
    if (eff.pull && !(eff.pull instanceof THREE.Vector3)) eff.pull = new THREE.Vector3(origin.x, origin.y, origin.z);
    const r = target.receiveHit({ attacker: { x: origin.x, y: origin.y, z: origin.z, yaw: c.yaw }, attack, damage, effect: eff });
    if (r) {
      // clarão e faíscas no corpo de quem apanhou (revisão visual dos efeitos)
      const at = { x: target.pos.x, y: target.pos.y + 1.6, z: target.pos.z };
      this.fx?.flash?.(at, p.color, p.slot === 2 ? 4.2 : 3, 0.26);
      this.lab?.hitTarget(p, at, { x: target.pos.x - origin.x, y: 0, z: target.pos.z - origin.z });
      this.fx?.spark?.(at, p.color, { count: p.slot === 2 ? 10 : 6, speed: 5.5, size: 0.8, up: 3.5, life: 0.42 });
      this.onEvent('hit', { target, power: p, damage: r.damage, result: r.result });
    }
    return r;
  }

  effects(p) {
    const q = p.params;
    const e = {};
    if (q.freeze) e.freeze = q.freeze;
    if (q.burn) e.burn = q.burn;
    if (q.launch) e.launch = q.launch;
    if (q.push) e.push = q.push;
    return e;
  }

  inRadius(targets, center, radius) {
    return targets.filter((t) => t.alive && flat(t.pos, center) <= radius + (t.radius ?? 0.8) && Math.abs(t.pos.y - center.y) < 5);
  }

  // ===== Liberação por formato =====
  release(k, targets) {
    const { p, dir } = k;
    const q = p.params;
    const c = this.ctl;
    const hand = new THREE.Vector3(c.pos.x + dir.x * 0.9, c.pos.y + 2.4, c.pos.z + dir.z * 0.9);
    const L = this.lab;
    const fx = L ? null : this.fx; // com o laboratório, os efeitos genéricos ficam de fora
    const color = p.color;
    const near = (list) => list.map((t) => ({ x: t.pos.x, y: t.pos.y, z: t.pos.z }));
    this.onEvent('release', { power: p });
    switch (p.kind) {
      case 'projetil': {
        const vis = L?.projectile(p, hand, dir) ?? null;
        this.shots.push({ p, pos: hand.clone(), dir: dir.clone(), speed: q.speed, left: q.range, vis, obj: vis ? null : this.fx?.orb(color, 0.5) });
        if (!vis) this.fx?.burst(hand, color, { count: 8, speed: 3, up: 1.5 });
        break;
      }
      case 'investida': {
        const speed = q.distance / 0.3;
        c.shove(dir.x * speed, dir.z * speed, 0.3);
        c.invulnerable = Math.max(c.invulnerable, 0.32);
        this.dashes.push({ p, t: 0, hit: new Set(), last: c.pos.clone(), dir: dir.clone() });
        L?.dash(p, c.pos, c.pos.clone().addScaledVector(dir, 1), dir, 'start');
        fx?.burst(c.pos, color, { count: 12, speed: 4, up: 2 });
        break;
      }
      case 'area': {
        L?.release(p, { pos: c.pos, dir, targets: near(this.inRadius(targets, c.pos, q.radius)) });
        fx?.ring(c.pos, color, q.radius, 0.5);
        fx?.burst({ x: c.pos.x, y: c.pos.y + 0.5, z: c.pos.z }, color, { count: 26, speed: q.radius * 1.6, up: 4 });
        if (q.heal) {
          c.health = Math.min(c.maxHealth, c.health + q.heal);
          this.onEvent('heal', { amount: q.heal });
        }
        const eff = this.effects(p);
        if (q.push) eff.push = q.push;
        for (const t of this.inRadius(targets, c.pos, q.radius)) {
          const bonus = q.markBonus && this.marks.has(t) ? 1.5 : 1;
          if (bonus > 1) this.marks.delete(t);
          this.hit(t, p, { mult: bonus, effect: eff });
        }
        break;
      }
      case 'alvo': {
        const pulses = q.pulses ?? 1;
        const at = k.dest.clone();
        const total = (q.delay ?? 0) + pulses * (q.interval ?? 0);
        for (let i = 0; i < pulses; i++) {
          const last = i === pulses - 1;
          this.timers.push({
            at: (q.delay ?? 0) + i * (q.interval ?? 0),
            fn: () => {
              const r = q.radius * (last && pulses > 1 ? 1.15 : 1);
              L?.alvoPulse(p, at, i, total, dir);
              if (q.pull) fx?.vortex(at, color, r, 0.5);
              else fx?.pillar(at, color, r * 0.8, 9, 0.5);
              fx?.ring(at, color, r, 0.4);
              fx?.burst(at, color, { count: 16, speed: r * 1.5, up: 5 });
              const eff = this.effects(p);
              if (q.pull) eff.pull = at;
              if (last && q.launchLast) eff.launch = q.launchLast;
              for (const t of this.inRadius(targets, at, r)) this.hit(t, p, { mult: 1 / Math.sqrt(pulses), origin: at, effect: eff });
              this.onEvent('impact', { power: p, at });
            },
          });
        }
        break;
      }
      case 'faixa': {
        const start = c.pos.clone();
        const pulses = q.pulses ?? 1;
        const hitOnce = new Set();
        for (let i = 0; i < pulses; i++) {
          this.timers.push({
            at: i * (q.interval ?? 0),
            fn: () => {
              L?.faixaPulse(p, start, dir);
              fx?.lane(start, dir, q.length, q.halfWidth, color, 0.45);
              const end = start.clone().addScaledVector(dir, q.length);
              fx?.line({ x: start.x, y: start.y + 0.6, z: start.z }, { x: end.x, y: end.y + 0.6, z: end.z }, color, { count: 18, up: 4, speed: 2 });
              for (const t of targets) {
                if (!t.alive || (pulses === 1 && hitOnce.has(t))) continue;
                const rx = t.pos.x - start.x;
                const rz = t.pos.z - start.z;
                const along = rx * dir.x + rz * dir.z;
                const side = Math.abs(rx * dir.z - rz * dir.x);
                if (along < -0.5 || along > q.length || side > q.halfWidth + (t.radius ?? 0.8)) continue;
                hitOnce.add(t);
                const bonus = this.marks.has(t) ? 1.5 : 1;
                this.hit(t, p, { mult: bonus / Math.sqrt(pulses), origin: start, effect: this.effects(p) });
              }
            },
          });
        }
        break;
      }
      case 'cone': {
        fx?.cone(c.pos, c.yaw, color, q.range, q.angle, 0.4);
        const half = (q.angle * Math.PI) / 360;
        const eff = this.effects(p);
        if (q.pull) eff.pull = c.pos.clone();
        const inCone = [];
        for (const t of targets) {
          if (!t.alive) continue;
          const d = flat(t.pos, c.pos);
          if (d > q.range + (t.radius ?? 0.8) || Math.abs(t.pos.y - c.pos.y) > 4) continue;
          const off = Math.abs(wrapAngle(Math.atan2(t.pos.x - c.pos.x, t.pos.z - c.pos.z) - c.yaw));
          if (off > half && d > 1.5) continue;
          inCone.push(t);
        }
        L?.release(p, { pos: c.pos, dir, targets: near(inCone) });
        for (const t of inCone) {
          this.hit(t, p, { effect: eff });
          if (q.mark) this.marks.set(t, this.time + q.mark);
        }
        break;
      }
      case 'parede': {
        const at = c.pos.clone().addScaledVector(dir, 2.4);
        this.wallUntil = this.time + q.duration;
        this.wallYaw = c.yaw;
        L?.release(p, { pos: c.pos, dir, yaw: c.yaw });
        fx?.wall(at, c.yaw, color, q.duration);
        fx?.burst(at, color, { count: 18, speed: 3, up: 4 });
        break;
      }
      case 'teleporte': {
        const t = k.target ?? this.aim(targets, q.range);
        if (!t) {
          L?.release(p, { pos: c.pos, yaw: c.yaw });
          fx?.burst(c.pos, color, { count: 14, speed: 3, up: 3 });
          break;
        }
        const back = Math.atan2(t.pos.x - c.pos.x, t.pos.z - c.pos.z);
        const bx = t.pos.x + Math.sin(back) * 2.2;
        const bz = t.pos.z + Math.cos(back) * 2.2;
        L?.release(p, { pos: c.pos.clone(), to: { x: bx, y: t.pos.y, z: bz }, yaw: back + Math.PI });
        fx?.burst(c.pos, color, { count: 18, speed: 3, up: 3 });
        this.onEvent('teleport', { x: bx, z: bz, yaw: back + Math.PI });
        fx?.burst({ x: bx, y: t.pos.y, z: bz }, color, { count: 18, speed: 3, up: 3 });
        this.hit(t, p, { origin: { x: bx, y: t.pos.y, z: bz } });
        break;
      }
      case 'cadeia': {
        let from = hand.clone();
        let cur = k.target ?? this.aim(targets, q.range);
        const done = new Set();
        for (let n = 0; n < q.jumps && cur; n++) {
          const to = new THREE.Vector3(cur.pos.x, cur.pos.y + 2.2, cur.pos.z);
          L?.chainJump(p, from, to);
          fx?.bolt(from, to, color, 0.3);
          fx?.burst(to, color, { count: 8, speed: 3, up: 2 });
          this.hit(cur, p, { mult: n === 0 ? 1 : 0.7, origin: from });
          done.add(cur);
          from = to;
          let next = null;
          let nd = q.jumpRange;
          for (const t of targets) {
            if (!t.alive || done.has(t)) continue;
            const d = flat(t.pos, cur.pos);
            if (d < nd) {
              nd = d;
              next = t;
            }
          }
          cur = next;
        }
        if (!done.size) {
          L?.chainJump(p, hand, hand.clone().addScaledVector(dir, 3.2));
          fx?.bolt(hand, hand.clone().addScaledVector(dir, 8), color, 0.25);
        }
        break;
      }
      case 'pilares': {
        const near = this.inRadius(targets, c.pos, q.radius);
        const spots = near.length ? near.map((t) => t.pos.clone()) : [c.pos.clone().addScaledVector(dir, 4)];
        for (const at of spots) fx?.mark(at, color, q.pillar, q.delay);
        L?.pilaresMark(p, spots, q.delay);
        this.timers.push({
          at: q.delay,
          fn: () => {
            L?.pilaresStrike(p, spots);
            for (const at of spots) {
              fx?.pillar(at, color, q.pillar, 10, 0.7);
              fx?.burst(at, color, { count: 14, speed: 3, up: 8 });
            }
            for (const t of near) this.hit(t, p, { origin: t.pos, effect: this.effects(p) });
          },
        });
        break;
      }
      default:
    }
  }

  updateShots(dt, targets) {
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i];
      const step = s.speed * dt;
      s.pos.addScaledVector(s.dir, step);
      s.left -= step;
      if (s.obj) s.obj.position.copy(s.pos);
      if (s.vis) this.lab.travel(s.vis, s.pos, dt);
      let hitT = null;
      for (const t of targets) {
        if (!t.alive) continue;
        if (flat(t.pos, s.pos) < (t.radius ?? 0.8) + 0.7 && s.pos.y > t.pos.y - 0.5 && s.pos.y < t.pos.y + 4.5) {
          hitT = t;
          break;
        }
      }
      if (hitT || s.left <= 0) {
        const q = s.p.params;
        if (s.obj) this.fx?.kill(s.obj);
        if (s.vis) this.lab.projectileEnd(s.vis, s.pos, q.explode ?? 0);
        else this.fx?.burst(s.pos, s.p.color, { count: 16, speed: 5, up: 3 });
        if (q.explode) {
          if (!s.vis) this.fx?.ring(s.pos, s.p.color, q.explode, 0.4);
          const eff = this.effects(s.p);
          if (q.pull) eff.pull = s.pos.clone();
          for (const t of this.inRadius(targets, s.pos, q.explode)) this.hit(t, s.p, { mult: t === hitT ? 1 : 0.6, origin: s.pos, effect: eff });
        } else if (hitT) this.hit(hitT, s.p, { origin: s.pos, effect: this.effects(s.p) });
        this.shots.splice(i, 1);
      }
    }
  }

  updateDashes(dt, targets) {
    const c = this.ctl;
    for (let i = this.dashes.length - 1; i >= 0; i--) {
      const d = this.dashes[i];
      d.t += dt;
      if (this.lab) this.lab.dash(d.p, d.last, c.pos, d.dir, d.t > 0.36 ? 'end' : 'trail');
      else this.fx?.line({ x: d.last.x, y: d.last.y + 0.8, z: d.last.z }, { x: c.pos.x, y: c.pos.y + 0.8, z: c.pos.z }, d.p.color, { count: 2, up: 1.5 });
      d.last.copy(c.pos);
      for (const t of targets) {
        if (!t.alive || d.hit.has(t)) continue;
        if (flat(t.pos, c.pos) < (t.radius ?? 0.8) + 1.6) {
          d.hit.add(t);
          this.hit(t, d.p, { effect: { ...this.effects(d.p), push: d.p.params.push ?? 2.5 } });
        }
      }
      if (d.t > 0.36) this.dashes.splice(i, 1);
    }
  }

  // Muralha ativa bloqueia golpes vindos da frente dela
  wallBlocks(attacker) {
    if (this.time > this.wallUntil) return false;
    const c = this.ctl;
    const ang = Math.abs(wrapAngle(Math.atan2(attacker.x - c.pos.x, attacker.z - c.pos.z) - this.wallYaw));
    return ang < 1.2;
  }

  get busy() {
    return !!this.casting;
  }
}

