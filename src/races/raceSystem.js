// Habilidade ativa da raça (tecla F, botão da raça ou Back no controle) e experiência de
// maestria racial por prática válida de cada raça (documento mestre 4.0, seções 17–21).

import * as THREE from 'three';
import { RACES, raceMods, addRaceXp, raceXpToNext, RACE_TRIAL, RACE_MAX } from './races.js';
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
    return raceMods(this.save.race, this.save.raceMastery?.level ?? 1, this.save.raceSpec, this.save.raceAwakened);
  }

  update(dt) {
    this.time += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.adapt = Math.max(0, this.adapt - dt);
    // prova racial (maestria 100): tempo limite
    const tr = this.trial;
    if (tr) {
      tr.t += dt;
      if (tr.t >= RACE_TRIAL.tempo) this.failTrial('O tempo da prova acabou.');
    }
  }

  // ===== Prova racial (despertar na maestria 100) =====
  startTrial() {
    if (!this.def) return false;
    if ((this.save.raceMastery?.level ?? 1) < RACE_MAX) return this.onEvent('denied', { message: 'A prova racial abre na maestria 100.' }), false;
    if (this.save.raceAwakened) return false;
    this.trial = { t: 0, kills: new Set() };
    this.onEvent('trial', { started: true, texto: RACE_TRIAL.texto });
    return true;
  }

  failTrial(message) {
    if (!this.trial) return;
    this.trial = null;
    this.onEvent('trial', { failed: true, message });
  }

  // Recruta elemental derrotado durante a prova
  onTrialKill(def) {
    const tr = this.trial;
    if (!tr || !def.element) return;
    tr.kills.add(def.element);
    this.onEvent('trial', { progress: tr.kills.size, total: RACE_TRIAL.alvo });
    if (tr.kills.size >= RACE_TRIAL.alvo) {
      this.trial = null;
      this.save.raceAwakened = true;
      this.onEvent('trial', { done: true });
    }
  }

  onFaint() {
    this.failTrial('Você desmaiou durante a prova.');
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
        this.adapt = this.mods.adaptTime;
        break;
      case 'aquatico': {
        const inWater = c.state === 'swim' || c.state === 'dive' || c.state === 'sink';
        if (inWater) {
          if (!c.stamina.spend(15)) return this.onEvent('denied', { message: 'Sem fôlego para o Impulso Abissal.' });
          const pw = this.mods.activePower;
          c.vel.x += dir.x * 13 * pw;
          c.vel.z += dir.z * 13 * pw;
          if (c.state === 'dive') c.vel.y += Math.sin(-(c.pitch ?? 0)) * 4;
        } else if (c.state === 'ground') c.shove(dir.x * 11 * this.mods.activePower, dir.z * 11 * this.mods.activePower, 0.2);
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
        const m = this.mods;
        const gain = Math.round(18 * m.siphonMult);
        if (hit?.target.hostile && ctx.powers) ctx.powers.energy = Math.min(ctx.powers.energyMax, ctx.powers.energy + gain);
        if (hit?.target.hostile && m.siphonHeal) c.health = Math.min(c.maxHealth, c.health + m.siphonHeal);
        this.onEvent('siphon', { hit, gained: hit?.target.hostile ? gain : 0 });
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
    this.cooldown = d.ativa.recarga * (this.cdMult ?? 1) * this.mods.activeCd;
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
