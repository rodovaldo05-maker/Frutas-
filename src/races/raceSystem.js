// Habilidade ativa da raça (tecla F, botão da raça ou Back no controle) e experiência de
// maestria racial por prática válida de cada raça (documento mestre 4.0, seções 17–21).

import * as THREE from 'three';
import { RACES, raceMods, addRaceXp, raceXpToNext } from './races.js';
import { wrapAngle } from '../core/math.js';

export class RaceSystem {
  constructor({ ctl, save, onEvent = () => {} }) {
    this.ctl = ctl;
    this.save = save;
    this.onEvent = onEvent;
    this.cooldown = 0;
    this.adapt = 0; // Adaptação Tática (Humano)
    this.time = 0;
    this.air = null; // saltos extras do Homem do Céu nesta subida { y, x, z, extra }
    this.lastKind = null; // Humano: último tipo de golpe que acertou
    this.lastKindAt = -99;
    this.lastSkill = -1; // Ghoul: última habilidade de fruta que acertou
  }

  get def() {
    return RACES[this.save.race] ?? null;
  }

  get mods() {
    return raceMods(this.save.race, this.save.raceMastery?.level ?? 1);
  }

  update(dt) {
    this.time += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.adapt = Math.max(0, this.adapt - dt);
  }

  // Usa a ativa; ctx: { targets, powers, fx, input }
  activate(ctx) {
    const d = this.def;
    const c = this.ctl;
    if (!d) return this.onEvent('denied', { message: 'Escolha uma raça primeiro.' });
    if (this.cooldown > 0 || c.faint > 0 || c.busyT > 0) return null;
    const fwd = new THREE.Vector3(Math.sin(c.yaw), 0, Math.cos(c.yaw));
    const w = c.wish;
    const dir = w && w.mag > 0.2 ? new THREE.Vector3(w.x, 0, w.z) : fwd;
    switch (d.id) {
      case 'humano':
        this.adapt = 10;
        break;
      case 'aquatico': {
        const inWater = c.state === 'swim' || c.state === 'dive' || c.state === 'sink';
        if (inWater) {
          if (!c.stamina.spend(15)) return this.onEvent('denied', { message: 'Sem fôlego para o Impulso Abissal.' });
          c.vel.x += dir.x * 13;
          c.vel.z += dir.z * 13;
          if (c.state === 'dive') c.vel.y += Math.sin(-(c.pitch ?? 0)) * 4;
        } else if (c.state === 'ground') c.shove(dir.x * 11, dir.z * 11, 0.2);
        else return null;
        break;
      }
      case 'ghoul': {
        let hit = null;
        for (const t of ctx.targets) {
          if (!t.alive) continue;
          const dx = t.pos.x - c.pos.x;
          const dz = t.pos.z - c.pos.z;
          const dist = Math.hypot(dx, dz);
          if (dist > 4.2 || Math.abs(t.pos.y - c.pos.y) > 3) continue;
          if (Math.abs(wrapAngle(Math.atan2(dx, dz) - c.yaw)) > 1.1 && dist > 1.5) continue;
          const r = t.receiveHit({ attacker: { x: c.pos.x, y: c.pos.y, z: c.pos.z, yaw: c.yaw }, attack: { id: 'sifao', posture: 8, knock: 1.4, reaction: 'leve', hitstop: 0.05 }, damage: 12 });
          if (r) {
            hit = { target: t, damage: r.damage };
            break;
          }
        }
        if (hit?.target.hostile && ctx.powers) ctx.powers.energy = Math.min(ctx.powers.energyMax, ctx.powers.energy + 18);
        this.onEvent('siphon', { hit, gained: hit?.target.hostile ? 18 : 0 });
        if (hit?.target.hostile) this.grant(3, 'sifão');
        break;
      }
      case 'ceu': {
        if (c.state !== 'air' && c.state !== 'glide') return this.onEvent('denied', { message: 'Passo Celeste: só no ar.' });
        c.vel.x = dir.x * 15;
        c.vel.z = dir.z * 15;
        c.vel.y = Math.max(c.vel.y, 3);
        this.air ??= { y: c.pos.y, x: c.pos.x, z: c.pos.z, extra: 0 };
        this.air.extra += 1;
        break;
      }
      default:
    }
    this.cooldown = d.ativa.recarga;
    this.onEvent('active', { race: d.id, nome: d.ativa.nome });
    return true;
  }

  // ===== Maestria racial =====
  grant(amount, reason) {
    if (!this.def || !(amount > 0)) return;
    const reached = addRaceXp(this.save, amount);
    const r = this.save.raceMastery;
    this.onEvent('mastery', { xp: amount, reason, progress: r.level >= 100 ? 1 : r.xp / raceXpToNext(r.level), level: r.level, reached });
  }

  // Humano: acertar inimigos alternando fruta, espada e combate (sem alternância vazia)
  onHostileHit(kind) {
    if (this.save.race !== 'humano') return;
    if (this.lastKind && kind !== this.lastKind && this.time - this.lastKindAt < 20) this.grant(2, 'variedade');
    this.lastKind = kind;
    this.lastKindAt = this.time;
  }

  onDefend() {
    if (this.save.race === 'humano') this.grant(1, 'defesa');
  }

  onDiscover() {
    if (this.save.race === 'humano') this.grant(5, 'exploração');
  }

  // Aquático: acompanha a experiência de Natação (só deslocamento real conta)
  onSwimXp(xp) {
    if (this.save.race === 'aquatico') this.grant(xp * 1.2, 'nado');
  }

  // Ghoul: habilidades de fruta que acertam inimigos (variar rende mais)
  onFruitHit(slot) {
    if (this.save.race !== 'ghoul') return;
    this.grant(slot !== this.lastSkill ? 3 : 2, 'técnica');
    this.lastSkill = slot;
  }

  // Homem do Céu: saltos extras que levam mais alto ou mais longe
  onExtraJump(n) {
    if (this.save.race !== 'ceu' || n < 2) return;
    const c = this.ctl;
    this.air ??= { y: c.pos.y, x: c.pos.x, z: c.pos.z, extra: 0 };
    this.air.extra += 1;
  }

  onLand() {
    const a = this.air;
    this.air = null;
    if (this.save.race !== 'ceu' || !a || !a.extra) return;
    const c = this.ctl;
    const up = c.pos.y - a.y;
    const far = Math.hypot(c.pos.x - a.x, c.pos.z - a.z);
    if (up >= 2.2 || far >= 8) this.grant(Math.min(6, 2 + a.extra), 'acrobacia');
  }

  onJumpStart() {
    if (this.save.race === 'ceu') this.air = null;
  }
}
