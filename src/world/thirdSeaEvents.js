// Acontecimentos das ilhas do Terceiro Mar (atualização 28): Sopro Ancestral no Santuário das
// Escamas, raios e para-raios na Tempestade Eterna, canhonada na Fortaleza do Horizonte,
// gêiseres no Mar dos Ossos, prova da Aurora no Templo e o enigma das pedras rúnicas que revela
// a Ilha Oculta. Regras em src/islands/islandRules.js e thirdSea.js; aqui a cena e os ganchos.

import * as THREE from 'three';
import { BREATH, breathLanes, inLane, ROD_STORM, rodNear, BARRAGE, barrageTargets, auroraReached } from '../islands/islandRules.js';
import { touchRune } from '../islands/thirdSea.js';

export class ThirdSeaEvents {
  // hooks: { fx, save(), persist(), ground(x,z), hit(frac, attack, at), lightning(at), notice, toast,
  //          reward(kind), shake(a), reveal() }
  constructor({ scene, islands, hooks }) {
    this.h = hooks;
    this.fx = hooks.fx;
    this.rand = hooks.rand ?? Math.random;
    this.t = 0;
    this.islands = islands.filter((s) => s.def.mar === 3);
    this.byId = Object.fromEntries(this.islands.map((s) => [s.def.id, s]));
    this.root = new THREE.Group();
    this.root.name = 'eventos_terceiro_mar';
    scene.add(this.root);
    this.lanes = [];
    this.strikes = [];
    this.shells = [];
    this.breathCycle = -1;
    this.barrageCycle = -1;
    this.strikeT = ROD_STORM.every;
    // pedras rúnicas: um cristal que gira em cima de cada pedra (acende quando tocada na ordem)
    this.runes = this.islands.filter((s) => s.extra?.rune).map((s) => {
      const r = s.extra.rune;
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.45), new THREE.MeshStandardMaterial({ color: '#8a7aa0', emissive: '#c084fc', emissiveIntensity: 0.25 }));
      m.position.set(r.x, r.y + 0.6, r.z);
      this.root.add(m);
      return { ...r, island: s.def.id, mesh: m };
    });
    // feixe de luz no santuário do Templo da Aurora (some depois da prova)
    const aurora = this.islands.find((s) => s.extra?.shrine);
    this.shrine = aurora ? aurora.extra.shrine : null;
    if (this.shrine) {
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 30, 10, 1, true), new THREE.MeshBasicMaterial({ color: '#ffe8a0', transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
      beam.position.set(this.shrine.x, this.shrine.y + 15, this.shrine.z);
      this.root.add(beam);
      this.beam = beam;
    }
    // Ilha Oculta: escondida até o enigma ser resolvido
    this.hidden = this.islands.find((s) => s.extra?.hidden) ?? null;
    this.refresh();
  }

  get state() {
    return this.h.save();
  }

  refresh() {
    const st = this.state;
    if (this.beam) this.beam.visible = !st.aurora.done;
    this.runes.forEach((r) => this.lightRune(r, st.oculta.revealed || r.runa < st.oculta.step));
    if (this.hidden) for (const o of this.hidden.objects ?? []) o.visible = st.oculta.revealed;
  }

  lightRune(r, on) {
    r.mesh.material.emissiveIntensity = on ? 1.6 : 0.25;
    r.mesh.material.color.set(on ? '#e8d0ff' : '#8a7aa0');
  }

  get revealed() {
    return this.state.oculta.revealed;
  }

  // ===== interação: pedras rúnicas =====
  nearest(p) {
    let best = null;
    for (const r of this.runes) {
      const d = Math.hypot(p.x - r.x, p.z - r.z);
      if (d < 3.2 && (!best || d < best.d)) best = { d, key: `runa-${r.runa}-${this.state.oculta.step}`, text: this.state.oculta.revealed ? 'Pedra rúnica (enigma resolvido)' : 'Tocar a pedra rúnica', run: () => this.touch(r) };
    }
    return best;
  }

  touch(r) {
    const st = this.state.oculta;
    const res = touchRune(st, r.runa);
    this.fx.flash({ x: r.x, y: r.y + 0.6, z: r.z }, '#c084fc', 2.4, 0.3);
    if (res === 'errada') {
      this.h.notice('A pedra se apaga. A ordem estava errada… (veja a placa na Capital)', 'bad', 'runa');
      this.fx.burst({ x: r.x, y: r.y, z: r.z }, '#5a4a6a', { count: 14, speed: 3, up: 3 });
    } else if (res === 'certa') {
      this.h.notice(`A pedra rúnica brilha (${st.step}/3)`, 'good', 'runa');
      this.fx.pillar({ x: r.x, y: r.gy, z: r.z }, '#c084fc', 0.8, 8, 0.8);
    } else if (res === 'revelou') {
      this.fx.pillar({ x: r.x, y: r.gy, z: r.z }, '#e8d0ff', 1.2, 14, 1.2);
      this.h.toast('As três pedras responderam: a névoa se abriu e a Ilha Oculta apareceu na carta, ao norte do Templo da Aurora!', 'gold');
      this.h.reveal?.();
    }
    this.refresh();
    this.h.persist();
  }

  // ===== quadro a quadro =====
  // ctx: { pos, alive, island (def.id ou null) }
  step(dt, ctx) {
    this.t += dt;
    for (const r of this.runes) r.mesh.rotation.y += dt * 1.2;
    if (this.beam?.visible) this.beam.material.opacity = 0.28 + 0.1 * Math.sin(this.t * 2);
    const s = ctx.island ? this.byId[ctx.island] : null;
    const biome = s?.def.biome;
    this.stepBreath(dt, ctx, biome === 'santuario' ? s : null);
    this.stepStorm(dt, ctx, biome === 'tempestade' ? s : null);
    this.stepBarrage(dt, ctx, biome === 'fortaleza' || biome === 'ossos' ? BARRAGE[biome] : null);
    if (biome === 'aurora' && this.shrine && !this.state.aurora.done && ctx.alive && auroraReached(this.shrine, ctx.pos)) {
      this.state.aurora.done = true;
      this.fx.pillar({ x: this.shrine.x, y: this.shrine.y, z: this.shrine.z }, '#ffe8a0', 2, 20, 1.4);
      this.fx.burst({ x: this.shrine.x, y: this.shrine.y + 1, z: this.shrine.z }, '#ffe8a0', { count: 40, speed: 7, up: 6 });
      this.h.reward('aurora');
      this.refresh();
      this.h.persist();
    }
    // tempestade: céu escuro e neblina cinza na Tempestade Eterna
    this.fog = biome === 'tempestade' ? { near: 10, far: 90, color: '#3a4048' } : biome === 'oculta' ? { near: 12, far: 110, color: '#2a2040' } : null;
  }

  // Sopro Ancestral: três faixas marcadas que pegam fogo depois do aviso
  stepBreath(dt, ctx, s) {
    for (let i = this.lanes.length - 1; i >= 0; i--) {
      const l = this.lanes[i];
      l.t -= dt;
      if (l.t > 0) continue;
      this.lanes.splice(i, 1);
      for (let k = 0; k <= 6; k++) {
        const at = { x: l.start.x + l.dir.x * (l.len * k) / 6, z: l.start.z + l.dir.z * (l.len * k) / 6 };
        at.y = this.h.ground(at.x, at.z);
        this.fx.pillar(at, '#ff8a2a', 1.8, 4.5, 0.5);
      }
      this.h.shake?.(0.15);
      if (ctx.alive && inLane(l, ctx.pos)) this.h.hit(BREATH.damage, { id: 'sopro', posture: 12, knock: 2, reaction: 'media', element: 'fogo', effects: { queimando: { duration: 4, stacks: 2 } } }, ctx.pos);
    }
    if (!s) return;
    const cyc = Math.floor(this.t / BREATH.cycle);
    const k = this.t % BREATH.cycle;
    if (k >= BREATH.cycle - BREATH.warn && this.warnedBreath !== cyc) {
      this.warnedBreath = cyc;
      this.h.notice('Um rugido ecoa nas agulhas… o Dragão Ancião vai soprar!', 'bad', 'sopro');
    }
    if (cyc !== this.breathCycle && k < 0.5) {
      this.breathCycle = cyc;
      for (const l of breathLanes(s.extra.breath, s.def.R, ctx.pos, this.rand)) {
        this.lanes.push({ ...l, t: BREATH.telegraph });
        const mid = { x: l.start.x + l.dir.x * l.len * 0.5, y: 0, z: l.start.z + l.dir.z * l.len * 0.5 };
        mid.y = this.h.ground(mid.x, mid.z) + 0.1;
        this.fx.lane({ x: l.start.x, y: mid.y, z: l.start.z }, l.dir, l.len, BREATH.halfWidth, '#ff6a1a', BREATH.telegraph);
      }
    }
  }

  // Tempestade Eterna: raio marcado no jogador; perto de um para-raios o raio cai no para-raios
  stepStorm(dt, ctx, s) {
    for (let i = this.strikes.length - 1; i >= 0; i--) {
      const m = this.strikes[i];
      m.t -= dt;
      if (m.t > 0) continue;
      this.strikes.splice(i, 1);
      this.fx.bolt({ x: m.x, y: m.y + 26, z: m.z }, { x: m.x, y: m.y + 0.2, z: m.z }, '#fff4b0', 0.28);
      this.fx.burst(m, '#fff4b0', { count: 14, speed: 6, up: 5 });
      if (ctx.alive && Math.hypot(ctx.pos.x - m.x, ctx.pos.z - m.z) < ROD_STORM.radius && Math.abs(ctx.pos.y - m.y) < 4) this.h.lightning(m);
    }
    if (!s) return;
    this.strikeT -= dt;
    if (this.strikeT > 0) return;
    this.strikeT = ROD_STORM.every * (0.7 + this.rand() * 0.6);
    const rod = rodNear(s.extra.rods, ctx.pos);
    if (rod) {
      // o para-raios atrai o raio: cai na ponta, sem dano
      this.fx.bolt({ x: rod.x, y: rod.y + 24, z: rod.z }, { x: rod.x, y: rod.y, z: rod.z }, '#fff4b0', 0.3);
      this.fx.flash({ x: rod.x, y: rod.y, z: rod.z }, '#ffe45a', 3, 0.3);
      this.fx.line({ x: rod.x, y: rod.y, z: rod.z }, { x: rod.x, y: rod.gy, z: rod.z }, '#ffe45a', { count: 8, speed: 0.5, up: 0.5, size: 0.3, life: 0.3, gravity: 0 });
      this.h.notice('O para-raios atraiu o raio', 'zone', 'para-raios');
      return;
    }
    const at = { x: ctx.pos.x + (this.rand() - 0.5) * 3, z: ctx.pos.z + (this.rand() - 0.5) * 3 };
    at.y = this.h.ground(at.x, at.z);
    this.strikes.push({ ...at, t: ROD_STORM.telegraph });
    this.fx.mark(at, '#ffe45a', ROD_STORM.radius, ROD_STORM.telegraph);
  }

  // canhonada / gêiseres: saraivada marcada em volta do jogador, em ciclo
  stepBarrage(dt, ctx, cfg) {
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const sh = this.shells[i];
      if (sh.delay > 0) {
        sh.delay -= dt;
        continue;
      }
      if (!sh.marked) {
        sh.marked = true;
        this.fx.mark(sh, sh.cfg.color === '#dff6ff' ? '#9fe0ff' : '#ff6a1a', sh.cfg.radius, sh.t);
      }
      sh.t -= dt;
      if (sh.t > 0) continue;
      this.shells.splice(i, 1);
      const c = sh.cfg;
      if (c.color === '#dff6ff') {
        this.fx.pillar(sh, '#dff6ff', c.radius * 0.7, 7, 0.6); // gêiser
        this.fx.burst(sh, '#ffffff', { count: 18, speed: 5, up: 10 });
      } else {
        this.fx.burst(sh, '#ffb040', { count: 20, speed: 6, up: 5 }); // bala de canhão
        this.fx.ring(sh, '#ff8a2a', c.radius, 0.35);
        this.fx.flash({ x: sh.x, y: sh.y + 1, z: sh.z }, '#ffd27a', 3, 0.2);
      }
      this.h.shake?.(0.1);
      if (ctx.alive && Math.hypot(ctx.pos.x - sh.x, ctx.pos.z - sh.z) <= c.radius + 0.4 && Math.abs(ctx.pos.y - sh.y) < 4) {
        this.h.hit(c.damage, { id: c === BARRAGE.ossos ? 'geiser' : 'canhonada', posture: 12, knock: 3, reaction: 'media', element: c === BARRAGE.ossos ? null : 'fogo', effects: c.effects }, sh);
      }
    }
    if (!cfg) return;
    const cyc = Math.floor(this.t / cfg.cycle);
    const k = this.t % cfg.cycle;
    if (k >= cfg.cycle - cfg.warn && this.warnedBarrage !== cyc) {
      this.warnedBarrage = cyc;
      this.h.notice(cfg.label, 'bad', 'saraivada');
    }
    if (cyc !== this.barrageCycle && k < 0.5) {
      this.barrageCycle = cyc;
      for (const q of barrageTargets(cfg, ctx.pos, this.rand)) {
        this.shells.push({ x: q.x, y: this.h.ground(q.x, q.z), z: q.z, delay: q.at, t: cfg.telegraph, marked: false, cfg });
      }
    }
  }
}

