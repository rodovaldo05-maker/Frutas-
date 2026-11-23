// Acontecimentos das ilhas 14 a 18 do Segundo Mar (atualização 27): nevasca e fogueiras na
// Geleira Silente, espelhos de luz e câmara secreta nas Ruínas do Sol Poente, névoa e ecos
// ilusórios no Bosque Noturno, erupções no Bastião Vulcânico, portas, chaves e espinhos na
// Masmorra do Abismo. As regras ficam em src/islands/islandRules.js; aqui ficam a cena, os
// colisores das portas e a ligação com o jogo (por ganchos, sem depender do main.js).

import * as THREE from 'three';
import {
  BLIZZARD, blizzardPhase, stepCold, frozen,
  MIRRORS, newLightPuzzle, litCount, rotateMirror,
  ECHOES, hitEcho, FOG_NIGHT,
  ERUPTION, eruptionPhase, eruptionTargets,
  DUNGEON, doorOpen, takeKey, spikeState,
} from '../islands/islandRules.js';

const box = new THREE.BoxGeometry(1, 1, 1);
const cone = new THREE.ConeGeometry(1, 1, 5);
const std = (color, emissive, intensity = 1, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...(emissive ? { emissive, emissiveIntensity: intensity } : {}), ...extra });
const DIRS = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

export class IslandEvents {
  // islands: resultado de buildSeaIsland (só as que têm algo aqui são usadas)
  // hooks: { hit(frac, attack, at), condition(name, opts), notice(text, kind, key), toast(text, kind),
  //          reward(kind, data), obsXp(n, key), save: () => save.islands, fx, rand }
  constructor({ scene, physics, islands, hooks }) {
    this.scene = scene;
    this.physics = physics;
    this.h = hooks;
    this.fx = hooks.fx;
    this.rand = hooks.rand ?? Math.random;
    this.t = 0;
    this.cold = 0;
    this.coldTick = 0;
    this.fog = null; // { near, far, color } quando a ilha muda a neblina
    this.here = null;
    this.by = Object.fromEntries(islands.filter((s) => s.extra).map((s) => [s.def.biome, s]));
    this.root = new THREE.Group();
    this.root.name = 'eventos_ilhas';
    scene.add(this.root);
    this.buildFires();
    this.buildPuzzle();
    this.buildEchoes();
    this.buildDungeon();
    this.rocks = [];
  }

  // ===== Montagem =====
  buildFires() {
    const s = this.by.geleira;
    this.fires = [];
    if (!s) return;
    const flame = std('#ff8a2a', '#ff6a10', 1.6);
    const core = std('#ffe08a', '#ffd040', 1.8);
    for (const f of s.extra.fires) {
      const g = new THREE.Group();
      const a = new THREE.Mesh(cone, flame);
      a.scale.set(0.7, 1.4, 0.7);
      a.position.y = 0.7;
      const b = new THREE.Mesh(cone, core);
      b.scale.set(0.35, 0.8, 0.35);
      b.position.y = 0.5;
      g.add(a, b);
      g.position.set(f.x, f.y + 0.3, f.z);
      this.root.add(g);
      this.fires.push({ ...f, g, a, b });
    }
  }

  buildPuzzle() {
    const s = this.by.ruinas;
    this.puzzle = null;
    if (!s) return;
    const e = s.extra.puzzle;
    const p = newLightPuzzle(s.def.seed);
    const st = this.h.save().ruinas;
    if (st.solved) {
      p.dir = [...p.target];
      p.solved = true;
    }
    const glass = std('#e8f4ff', '#9fd0ff', 0.4, { metalness: 0.8, roughness: 0.15 });
    const frame = std('#b8902e');
    const mirrors = e.mirrors.map((m) => {
      const g = new THREE.Group();
      const plate = new THREE.Mesh(box, glass);
      plate.scale.set(1.8, 1.8, 0.2);
      plate.position.y = 1.2;
      const rim = new THREE.Mesh(box, frame);
      rim.scale.set(2.1, 0.25, 0.3);
      rim.position.y = 0.2;
      const arrow = new THREE.Mesh(cone, frame);
      arrow.rotation.x = Math.PI / 2;
      arrow.scale.set(0.3, 0.6, 0.3);
      arrow.position.set(0, 2.4, 0.4);
      g.add(plate, rim, arrow);
      g.position.set(m.x, m.y, m.z);
      this.root.add(g);
      return { ...m, g };
    });
    // feixes de luz (um por trecho: sol → espelho 1 → … → altar)
    const beamMat = new THREE.MeshBasicMaterial({ color: '#ffe8a0', transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending });
    const pts = [e.sun, ...e.mirrors, e.altar];
    const beams = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = new THREE.Vector3(pts[i].x, pts[i].y + 1.4, pts[i].z);
      const b = new THREE.Vector3(pts[i + 1].x, pts[i + 1].y + 1.4, pts[i + 1].z);
      const m = new THREE.Mesh(box, beamMat);
      m.position.copy(a).add(b).multiplyScalar(0.5);
      m.scale.set(0.35, 0.35, a.distanceTo(b));
      m.lookAt(b);
      m.visible = false;
      this.root.add(m);
      beams.push(m);
    }
    // porta da câmara secreta (some ao resolver) e o baú dentro
    const c = e.chamber;
    const door = new THREE.Mesh(box, std('#8a6a3a'));
    door.scale.set(4, 4.4, 0.8);
    door.position.set(c.door.x, c.door.y + 2.2, c.door.z);
    door.rotation.y = c.door.rotY;
    this.root.add(door);
    const collider = p.solved ? null : this.physics.addBox({ x: c.door.x, y: c.door.y + 2.2, z: c.door.z }, { x: 2, y: 2.2, z: 0.4 }, c.door.rotY, { material: 'madeira' });
    door.visible = !p.solved;
    const chest = new THREE.Mesh(box, std('#c9a227', '#8a6a10', 0.4));
    chest.scale.set(1.4, 1, 1);
    chest.position.set(c.chest.x, c.chest.y + 0.5, c.chest.z);
    this.root.add(chest);
    this.puzzle = { p, e, mirrors, beams, door, collider, chest, opened: st.solved && st.chest };
    chest.visible = !this.puzzle.opened;
    this.showPuzzle();
  }

  showPuzzle() {
    const z = this.puzzle;
    const lit = litCount(z.p);
    z.mirrors.forEach((m, i) => {
      // a frente do espelho aponta para o próximo ponto só quando a direção está certa
      const want = Math.atan2(m.next.x - m.x, m.next.z - m.z);
      m.g.rotation.y = want + DIRS[(z.p.dir[i] - z.p.target[i] + 4) % 4];
    });
    z.beams.forEach((b, i) => (b.visible = i <= lit));
  }

  buildEchoes() {
    const s = this.by.noturno;
    this.echoes = [];
    this.echoXp = 0;
    if (!s) return;
    const mat = new THREE.MeshStandardMaterial({ color: '#2a1a4a', emissive: '#6a3ad8', emissiveIntensity: 0.6, transparent: true, opacity: 0.55, depthWrite: false });
    for (const p of s.extra.echoes) {
      const g = new THREE.Group();
      for (const [w, h, y] of [[0.9, 1.4, 1.5], [0.6, 0.6, 2.6], [0.35, 1.1, 0.55]]) {
        const m = new THREE.Mesh(box, mat);
        m.scale.set(w, h, w * 0.7);
        m.position.y = y;
        g.add(m);
      }
      g.position.set(p.x, p.y, p.z);
      this.root.add(g);
      this.echoes.push({ home: p, g, dead: 0, phase: this.rand() * 6.3 });
    }
  }

  buildDungeon() {
    const s = this.by.masmorra;
    this.dungeon = null;
    if (!s) return;
    const e = s.extra.dungeon;
    const st = this.h.save().masmorra;
    const bars = std('#3a3a44', null, 1, { metalness: 0.7, roughness: 0.4 });
    const doors = e.doors.map((d, k) => {
      const g = new THREE.Group();
      for (let i = -3; i <= 3; i++) {
        const m = new THREE.Mesh(box, bars);
        m.scale.set(0.3, 6, 0.3);
        m.position.set(i * 1.1, 3, 0);
        g.add(m);
      }
      const top = new THREE.Mesh(box, std(DUNGEON.keys[Math.max(0, k - 1)].cor));
      top.scale.set(8, 0.5, 0.5);
      top.position.y = 6;
      g.add(top);
      g.position.set(d.x, d.y, d.z);
      g.rotation.y = d.rotY;
      this.root.add(g);
      const open = doorOpen(k, st.keys);
      g.visible = !open;
      const collider = open ? null : this.physics.addBox({ x: d.x, y: d.y + 3, z: d.z }, { x: 4, y: 3, z: 0.5 }, d.rotY, { material: 'pedra' });
      return { ...d, k, g, collider };
    });
    const altars = e.altars.map((a, k) => {
      const base = new THREE.Mesh(box, std('#5a5a62'));
      base.scale.set(1.6, 1.2, 1.6);
      base.position.set(a.x, a.y + 0.6, a.z);
      const key = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.12, 6, 12), std(DUNGEON.keys[k].cor, DUNGEON.keys[k].cor, 0.6, { metalness: 0.8 }));
      key.position.set(a.x, a.y + 1.8, a.z);
      this.root.add(base, key);
      key.visible = st.keys <= k;
      return { ...a, k, key };
    });
    // espinhos: um bloco por casa, sobe e desce
    const spikeMat = std('#9aa0a8', null, 1, { metalness: 0.8, roughness: 0.3 });
    const warnMat = new THREE.MeshBasicMaterial({ color: '#ff3a2a', transparent: true, opacity: 0.45, depthWrite: false });
    const size = DUNGEON.spikes.size;
    const spikes = e.spikes.map((p) => {
      const g = new THREE.Group();
      for (const [dx, dz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6], [0, 0]]) {
        const m = new THREE.Mesh(cone, spikeMat);
        m.scale.set(0.25, 1.2, 0.25);
        m.position.set(dx, 0.6, dz);
        g.add(m);
      }
      g.position.set(p.x, p.y - 1.3, p.z);
      const warn = new THREE.Mesh(box, warnMat);
      warn.scale.set(size, 0.05, size);
      warn.position.set(p.x, p.y + 0.06, p.z);
      warn.visible = false;
      this.root.add(g, warn);
      return { ...p, g, warn, state: 'baixo', hitT: 0 };
    });
    this.dungeon = { e, st, doors, altars, spikes };
  }

  // ===== Interação (botão de ação) =====
  // devolve a opção mais perto: { d, key, text, run }
  nearest(p) {
    const opts = [];
    const z = this.puzzle;
    if (z) {
      if (!z.p.solved) z.mirrors.forEach((m, i) => {
        const d = Math.hypot(p.x - m.x, p.z - m.z);
        if (d < 3.2) opts.push({ d, key: `espelho-${i}-${z.p.dir[i]}`, text: i > litCount(z.p) ? 'Espelho sem luz' : `Girar espelho ${i + 1}`, run: () => this.turnMirror(i) });
      });
      if (z.p.solved && !z.opened) {
        const c = z.e.chamber.chest;
        const d = Math.hypot(p.x - c.x, p.z - c.z);
        if (d < 3) opts.push({ d, key: 'bau-sol', text: 'Abrir o baú do Sol Poente', run: () => this.openChest() });
      }
    }
    const dg = this.dungeon;
    if (dg) for (const a of dg.altars) {
      const d = Math.hypot(p.x - a.x, p.z - a.z);
      if (d < 3 && a.key.visible) opts.push({ d, key: `altar-${a.k}-${dg.st.keys}`, text: a.k === dg.st.keys ? `Pegar a ${DUNGEON.keys[a.k].nome}` : 'Chave presa (pegue a anterior)', run: () => this.pickKey(a.k) });
    }
    return opts.sort((a, b) => a.d - b.d)[0] ?? null;
  }

  turnMirror(i) {
    const z = this.puzzle;
    if (!rotateMirror(z.p, i)) {
      this.h.notice('A luz ainda não chega neste espelho.', 'bad', 'espelho');
      return;
    }
    this.showPuzzle();
    const lit = litCount(z.p);
    this.h.sound?.('wing');
    if (z.p.solved) {
      const st = this.h.save().ruinas;
      st.solved = true;
      z.door.visible = false;
      if (z.collider) this.physics.world.removeCollider(z.collider, false);
      z.collider = null;
      this.fx.burst({ x: z.e.altar.x, y: z.e.altar.y + 2, z: z.e.altar.z }, '#ffe8a0', { count: 30, speed: 7, up: 6 });
      this.h.toast('A luz do Sol Poente abriu a câmara secreta!', 'gold');
      this.h.quest?.('espelhos');
      this.h.persist();
    } else this.h.notice(`Luz até o espelho ${Math.min(MIRRORS, lit + 1)}`, 'zone', 'espelho');
  }

  openChest() {
    const z = this.puzzle;
    z.opened = true;
    z.chest.visible = false;
    this.h.save().ruinas.chest = true;
    this.h.reward('camara', { at: z.e.chamber.chest });
    this.h.persist();
  }

  pickKey(k) {
    const dg = this.dungeon;
    if (!takeKey(dg.st, k)) {
      this.h.notice('A corrente só solta a chave do andar em ordem.', 'bad', 'chave');
      return;
    }
    dg.altars[k].key.visible = false;
    const door = dg.doors[k + 1];
    if (door) {
      door.g.visible = false;
      if (door.collider) this.physics.world.removeCollider(door.collider, false);
      door.collider = null;
      this.fx.burst({ x: door.x, y: door.y + 3, z: door.z }, DUNGEON.keys[k].cor, { count: 24, speed: 6, up: 5 });
    }
    this.h.toast(`${DUNGEON.keys[k].nome}: ${k + 1 < DUNGEON.keys.length ? `a porta do ${k + 2}º andar abriu` : 'a cela do Carcereiro abriu'}!`, 'gold');
    if (dg.st.keys >= DUNGEON.keys.length) this.h.quest?.('chaves');
    this.h.persist();
  }

  // golpe do jogador (impacto do M1) em algum ponto: ecos ilusórios
  strike(at, sense) {
    for (const e of this.echoes) {
      if (e.dead > 0 || Math.hypot(at.x - e.g.position.x, at.z - e.g.position.z) > 2.6) continue;
      const r = hitEcho(sense, this.echoXp);
      e.dead = ECHOES.respawn;
      e.g.visible = false;
      this.fx.burst({ x: e.g.position.x, y: e.g.position.y + 1.5, z: e.g.position.z }, '#8a5ad8', { count: 18, speed: 5, up: 3 });
      if (r.kind === 'desfez') {
        this.echoXp += r.xp;
        if (r.xp > 0) this.h.obsXp(r.xp);
        this.h.notice('Eco desfeito pela Percepção', 'good', 'eco');
        this.h.quest?.('eco');
      } else {
        this.h.condition('lento', { duration: r.slow });
        this.h.notice('Era uma ilusão! (ligue a Percepção para ver)', 'bad', 'eco');
      }
      return true;
    }
    return false;
  }

  // ===== Quadro a quadro =====
  // ctx: { pos, alive, sense, immune(source), island (def.id ou null) }
  step(dt, ctx) {
    this.t += dt;
    const where = ctx.island ? Object.values(this.by).find((s) => s.def.id === ctx.island) : null;
    const biome = where?.def.biome ?? null;
    if (biome !== this.here) {
      this.here = biome;
      if (biome !== 'noturno') this.echoXp = 0;
    }
    this.fog = null;
    this.stepFires(dt);
    this.stepBlizzard(dt, ctx, biome === 'geleira');
    this.stepEchoes(dt, biome === 'noturno');
    if (biome === 'noturno') this.fog = { ...FOG_NIGHT, color: '#1a2230' };
    this.stepEruption(dt, ctx, biome === 'bastiao' ? where : null);
    this.stepSpikes(dt, ctx, biome === 'masmorra');
  }

  stepFires() {
    for (const f of this.fires) {
      const k = 1 + 0.15 * Math.sin(this.t * 9 + f.x);
      f.a.scale.set(0.7, 1.4 * k, 0.7);
      f.b.scale.set(0.35, 0.8 * (2 - k), 0.35);
    }
  }

  stepBlizzard(dt, ctx, on) {
    if (!on) {
      this.cold = Math.max(0, this.cold - BLIZZARD.fall * dt * 2);
      this.blizzard = null;
      return;
    }
    const ph = blizzardPhase(this.t);
    const nearFire = this.fires.some((f) => Math.hypot(ctx.pos.x - f.x, ctx.pos.z - f.z) < BLIZZARD.fireR);
    const immune = ctx.immune('frio');
    const was = this.blizzard;
    this.blizzard = ph;
    if (ph.on && !was?.on) this.h.notice('Nevasca! Fique perto de uma fogueira', 'bad', 'nevasca');
    else if (ph.warn && !was?.warn) this.h.notice('O vento gela… uma nevasca vem aí', 'zone', 'nevasca');
    const before = this.cold;
    this.cold = stepCold(this.cold, dt, { on: ph.on, nearFire, immune });
    if (before < 60 && this.cold >= 60) this.h.notice('Muito frio… procure uma fogueira', 'bad', 'frio');
    if (nearFire && before > 0 && this.cold === 0) this.h.notice('Aquecido pela fogueira', 'good', 'frio');
    if (nearFire && ph.on) this.h.quest?.('fogueira');
    if (ph.on) this.fog = { near: 4, far: 45, color: '#dfe8f0' };
    if (frozen(this.cold) && ctx.alive) {
      this.coldTick -= dt;
      if (this.coldTick <= 0) {
        this.coldTick = BLIZZARD.tick;
        this.h.condition('lento', { duration: BLIZZARD.tick + 0.5 });
        this.h.hit(BLIZZARD.damage, { id: 'frio', posture: 0, knock: 0, reaction: 'leve', element: 'gelo', effects: {} }, ctx.pos);
        this.h.notice('Congelando! Procure uma fogueira', 'bad', 'frio');
      }
    } else this.coldTick = 0;
  }

  stepEchoes(dt, here) {
    for (const e of this.echoes) {
      if (e.dead > 0) {
        e.dead -= dt;
        if (e.dead <= 0) e.g.visible = true;
        continue;
      }
      if (!here) continue;
      e.phase += dt * 0.6;
      e.g.position.x = e.home.x + Math.cos(e.phase) * 3;
      e.g.position.z = e.home.z + Math.sin(e.phase * 0.8) * 3;
      e.g.position.y = e.home.y + 0.2 * Math.sin(this.t * 2 + e.phase);
      e.g.rotation.y = e.phase + Math.PI / 2;
    }
  }

  stepEruption(dt, ctx, s) {
    const ph = eruptionPhase(this.t);
    const was = this.eruption;
    this.eruption = ph;
    if (s) {
      if (ph.warn && !was?.warn) {
        this.h.notice('O vulcão treme… erupção em instantes!', 'bad', 'erupcao');
        this.h.shake?.(0.2);
      }
      if (ph.on && !was?.on) {
        const c = s.extra.crater;
        this.rocks = eruptionTargets(this.rand).map((r) => ({ x: s.def.x + r.x, z: s.def.z + r.z, at: r.at, state: 'espera' }));
        this.fx.burst({ x: c.x, y: c.y + 2, z: c.z }, '#ff6a1a', { count: 40, speed: 10, up: 12 });
        this.h.shake?.(0.35);
      }
    }
    if (!ph.on) {
      // fim de uma erupção com o jogador no Bastião, vivo: desafio da ilha
      if (was?.on && s && ctx.alive) this.h.quest?.('erupcao');
      this.rocks.length = 0;
      return;
    }
    for (const r of this.rocks) {
      if (r.state === 'espera' && ph.k >= r.at) {
        r.state = 'marcada';
        r.y = this.h.ground(r.x, r.z);
        this.fx.mark({ x: r.x, y: r.y, z: r.z }, '#ff6a1a', ERUPTION.radius, ERUPTION.telegraph);
      } else if (r.state === 'marcada' && ph.k >= r.at + ERUPTION.telegraph) {
        r.state = 'caiu';
        const at = { x: r.x, y: r.y, z: r.z };
        this.fx.pillar(at, '#ff6a1a', ERUPTION.radius * 0.8, 6, 0.5);
        this.fx.burst(at, '#3e3634', { count: 14, speed: 6, up: 6 });
        if (!ctx.alive) continue;
        const p = ctx.pos;
        if (Math.hypot(p.x - r.x, p.z - r.z) <= ERUPTION.radius + 0.5 && Math.abs(p.y - r.y) < 3.5) {
          this.h.hit(ERUPTION.damage, { id: 'erupcao', posture: 12, knock: 3, reaction: 'media', element: 'fogo', effects: ctx.immune('lava') ? {} : { queimando: { duration: 3, stacks: 1 } } }, at);
        }
      }
    }
  }

  stepSpikes(dt, ctx, here) {
    const dg = this.dungeon;
    if (!dg) return;
    const size = DUNGEON.spikes.size / 2;
    for (const s of dg.spikes) {
      const st = spikeState(this.t, s.offset);
      if (st !== s.state) {
        s.state = st;
        s.warn.visible = st === 'aviso';
        s.g.position.y = s.y - (st === 'cima' ? 0 : 1.3);
      }
      s.hitT = Math.max(0, s.hitT - dt);
      if (!here || st !== 'cima' || s.hitT > 0 || !ctx.alive) continue;
      const p = ctx.pos;
      if (Math.abs(p.x - s.x) < size && Math.abs(p.z - s.z) < size && p.y < s.y + 1.2) {
        s.hitT = 1;
        this.h.hit(DUNGEON.spikes.damage, { id: 'espinhos', posture: 10, knock: 2, reaction: 'media', effects: {} }, { x: s.x, y: s.y, z: s.z });
      }
    }
  }
}
