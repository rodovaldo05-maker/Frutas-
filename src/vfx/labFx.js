// Ponte entre o jogo e os efeitos do Laboratório Voxel (fruto-fx.js; atualização 18).
// O sistema de poderes (powers.js) continua decidindo quem é atingido, quanto dano e quando;
// aqui só se escolhe o efeito do laboratório para cada fruta e formato de golpe, seguindo a
// coreografia do próprio laboratório (releaseSpell/elementalSkill/mythSkill):
//   Impacto: pistão cinético, explosão cinética, faixa de ruptura
//   Brasa: cometa de fogo, rastro de chamas, pilares de fogo com rachaduras
//   Geada: espinhos de gelo em fila, muralha de gelo, anel de espinhos com neve
//   Tormenta: raios em cadeia, nuvem de tempestade com descargas
//   Maré: onda gigante, redemoinho, olho da maré
//   Cristal: lasca de cristal, anel de prismas, geodo
//   Eco: ondas de ressonância; Duna: pedra de areia, furacão; Ímã: linhas magnéticas
//   Eclipse: orbe sombrio, portais, vórtice; Lobo/Falcão: garras e penas
//   Fênix, Besta e Dragões: marcas míticas (FRUTOMythFX) com fogo, raios e pulsos
// Também: carga na mão durante o gesto, aura da fruta (forte no despertar), rastro da
// investida e o contato dos socos com a fruta equipada.

import * as THREE from 'three';
import { createFruitFX, FRUTOElements, FRUTOMythFX } from './fruto-fx.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const v3 = (p) => V(p.x, p.y, p.z);
// projétil de cada fruta (formas do laboratório)
const PROJECTILE = { impacto: 'impact', brasa: 'fire', cristal: 'crystal', falcao: 'feather', fenix: 'feather', duna: 'sand', eclipse: 'shadow' };
const MYTH = new Set(['fenix', 'besta', 'oriental', 'ocidental']);

export class LabFx {
  // glow: efeitos de brilho do jogo (PowerFx) usados como reforço onde o desenho do
  // laboratório fica fino demais na distância da câmera do jogo (raios, pistão, penas)
  constructor({ scene, ground, fruits, emit, glow = null, mobile = true, level = () => 1, calm = () => false, shake = () => {} }) {
    this.glow = glow;
    this.fruits = new Map(fruits.map((f) => [f.id, f]));
    this.scene = scene;
    this.ground = ground;
    this.time = 0;
    this.jobs = [];
    this.zones = [];
    this.fx = createFruitFX({ T: THREE, scene, V, mobile, soft: false, emit, now: () => this.time, shake, calm, ground, level });
  }

  fruit(id) {
    return this.fruits.get(id);
  }

  floor(p, off = 0.042) {
    return V(p.x, this.ground(p.x, p.z) + off, p.z);
  }

  later(delay, fn) {
    this.jobs.push({ at: this.time + delay, fn });
  }

  myth(f, event, point, dir, index = 0) {
    if (f && MYTH.has(f.id)) FRUTOMythFX.emit(this.fx, f, event, point, dir, 'humana', index);
  }

  // zona visual (fogueira, sombra, muralha) com vida e fechamento do laboratório
  zone(pos, r, life, kind, color, yaw = 0) {
    const root = this.fx.createZone(this.floor(pos, 0), r, kind, color);
    if (kind === 'wall') root.rotation.y = yaw;
    this.zones.push({ root, pos: this.floor(pos, 0), r, kind, color, life, age: 0 });
    return root;
  }

  update(dt) {
    this.time += dt;
    for (let i = this.jobs.length - 1; i >= 0; i--) {
      if (this.jobs[i].at > this.time) continue;
      const j = this.jobs.splice(i, 1)[0];
      j.fn();
    }
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      z.age += dt;
      z.root.userData.animate?.(Math.min(1, z.age / z.life), dt);
      if (z.age >= z.life) {
        this.fx.closeZone(z.pos, z.r, z.kind, z.color);
        this.fx.dispose(z.root);
        this.zones.splice(i, 1);
      }
    }
    this.fx.update(dt);
  }

  clear() {
    this.fx.clear();
    for (const z of this.zones) this.fx.dispose(z.root);
    this.zones.length = 0;
    this.jobs.length = 0;
  }

  // ===== Gesto =====
  // carga na mão durante o gesto (some na liberação)
  focus(fruitId, slot, hand) {
    const f = this.fruit(fruitId);
    return f ? this.fx.focus(f, slot, v3(hand)) : null;
  }

  // avisos antes do golpe (marca no chão, faixa cinética, nuvem da tempestade)
  cast(p, { pos, dir, dest, release }) {
    const f = this.fruit(p.fruit);
    if (!f) return;
    const q = p.params;
    const color = p.color;
    const at = this.floor(dest);
    if (p.kind === 'alvo') {
      const total = release + (q.delay ?? 0) + (q.pulses ?? 1) * (q.interval ?? 0) + 0.4;
      if (f.id === 'tormenta') {
        const spec = { ...(FRUTOElements.forMove('tormenta', 2, q.radius / 3.65) ?? { radius: q.radius, height: 6.1 }), life: total };
        spec.strikes = Array.from({ length: q.pulses ?? 1 }, (_, i) => ({ point: at.clone(), radius: q.radius, at: release + (q.delay ?? 0) + i * (q.interval ?? 0) }));
        this.fx.stormCanopy(at, spec);
      } else this.fx.groundMark(at, color, q.radius, release + (q.delay ?? 0) + 0.1);
    }
    if (p.kind === 'faixa' && f.id === 'impacto') this.fx.kineticLane(this.floor(pos), v3(dir), q.length, q.halfWidth, release, true);
  }

  // ===== Liberação por formato (só visual) =====
  release(p, ctx) {
    const f = this.fruit(p.fruit);
    if (!f) return false;
    const fn = this[`k_${p.kind}`];
    if (!fn) return false;
    fn.call(this, f, p, ctx);
    return true;
  }

  // projétil: devolve o visual que o sistema de poderes move
  projectile(p, hand, dir) {
    const f = this.fruit(p.fruit);
    const kind = PROJECTILE[f?.id];
    if (!f || !kind) return null;
    const h = v3(hand);
    const d = v3(dir).normalize();
    if (f.id === 'brasa') this.fx.flash(h, '#ffd08a', 0.95, 0.23);
    if (f.id === 'impacto') this.fx.kineticBurst(h, d, 0.68, 0.21, false);
    if (f.id === 'fenix') {
      this.fx.pulse(h, '#6cf7ff', 1.35, 0.28);
      this.fx.sparks(h, '#ffdf6b', 8, 2.8, { life: 0.34, size: 0.055, gravity: -0.5 });
    }
    this.myth(f, 'skill', h, d, p.slot);
    // como no laboratório (launch): o projétil fica na cena fora da lista de efeitos
    const root = this.fx.projectile(h, d, p.color, kind);
    this.scene.add(root);
    return { root, kind, color: p.color, dir: d, mesh: root, visualTimer: 0 };
  }

  travel(vis, pos, dt) {
    vis.root.position.set(pos.x, pos.y, pos.z);
    this.fx.travel(vis, dt);
    // reforço: halo e rastro brilhante (o projétil do laboratório é pequeno de longe)
    vis.glowT = (vis.glowT ?? 0) - dt;
    if (this.glow && vis.glowT <= 0) {
      vis.glowT = 0.05;
      this.glow.flash(pos, vis.color, 1.5, 0.16);
      this.glow.spark(pos, vis.color, { count: 1, speed: 0.6, size: 0.5, up: 0.4, life: 0.35, gravity: 0 });
    }
  }

  projectileEnd(vis, pos, explode = 0) {
    const at = v3(pos);
    this.fx.hit(at, vis.color, vis.kind, vis.dir);
    this.glow?.flash(at, vis.color, 2.6 + explode * 0.5, 0.28);
    if (explode) this.fx.pulse(this.floor(at), vis.color, explode, 0.4);
    this.fx.dispose(vis.root);
  }

  // investida: início, rastro a cada passo e fim
  dash(p, from, to, dir, phase) {
    const f = this.fruit(p.fruit);
    if (!f) return;
    const a = v3(from);
    const b = v3(to);
    const d = v3(dir).normalize();
    if (phase === 'start') {
      const g = this.floor(a);
      if (f.id === 'impacto') this.fx.kineticBurst(g, d, 1.05, 0.28);
      if (f.id === 'brasa') {
        this.fx.fire(g, 0.47, 1.2, 0.43);
        this.zone(g, 1.25, 2.4, 'fire', f.color);
      }
      if (f.id === 'duna') this.fx.sand(g, 0.85, 0.4);
      if (f.id === 'tormenta') this.fx.lightning(a.clone().add(V(0, 1.4, 0)), b.clone().add(V(0, 1.4, 0)), f.color, 0.29);
      if (f.id === 'lobo') this.fx.talons(a.clone().add(V(0, 1.6, 0)), a.clone().add(V(0, 1.6, 0)).addScaledVector(d, 1.6), 1, false);
      this.myth(f, 'dash', a.clone().add(V(0, 1.6, 0)), d);
    }
    this.fx.dashFX(f, a, b, d, phase, 'humana');
  }

  k_projetil() {} // o visual vem de projectile()/travel()/projectileEnd()
  k_investida() {} // o visual vem de dash()

  k_area(f, p, { pos, dir, targets = [] }) {
    const q = p.params;
    const g = this.floor(pos);
    const r = q.radius;
    const d = v3(dir);
    switch (f.id) {
      case 'geada':
        this.fx.groundMark(g, f.color, r, 1.15);
        this.fx.pulse(g, f.color, r, 0.52);
        this.fx.cracks(g, '#a3e5f4', r * 0.87, 1.05);
        this.fx.snow(g, r, 24);
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          this.later(i * 0.035, () => this.fx.ice(this.floor(V(g.x + Math.sin(a) * r * 0.68, 0, g.z + Math.cos(a) * r * 0.68)), 1.43, 1.15, 0.32, 1));
        }
        break;
      case 'cristal': {
        const n = 10;
        for (let i = 0; i < n; i++) {
          const a = (i * 2 * Math.PI) / n;
          this.later(i * 0.019, () => this.fx.prism(this.floor(V(g.x + Math.sin(a) * r * 0.73, 0, g.z + Math.cos(a) * r * 0.73)), 1.1 + (i % 3) * 0.32, 0.69));
        }
        this.fx.pulse(g, f.color, r, 0.32);
        break;
      }
      case 'eco':
        this.fx.resonance(g, r, 0.58);
        break;
      case 'ima': {
        this.fx.pulse(g, f.color, r, 0.42);
        const hand = g.clone().add(V(0, 1.6, 0));
        for (const t of targets) this.fx.magnet(hand, V(t.x, t.y + 1.5, t.z), 0.3, true);
        break;
      }
      case 'falcao':
        this.fx.feathers(g.clone().add(V(0, 1.2, 0)), d, 1.4);
        this.fx.pulse(g, f.color, r, 0.4);
        break;
      case 'fenix':
      case 'ocidental':
        this.myth(f, 'skill', g, d, p.slot);
        this.fx.pulse(g, f.color, r, 0.5);
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          this.later(i * 0.05, () => this.fx.fire(this.floor(V(g.x + Math.sin(a) * r * 0.6, 0, g.z + Math.cos(a) * r * 0.6)), 0.55, 1.8, 0.7, f.color));
        }
        break;
      case 'besta':
        this.myth(f, 'skill', g, d, p.slot);
        this.fx.cracks(g, f.color, r, 0.8);
        this.fx.pulse(g, f.color, r, 0.45);
        break;
      default:
        this.fx.pulse(g, f.color, r, 0.5);
        this.fx.impact(g, f.color, r * 0.6, 0.5);
    }
  }

  // um pulso do golpe em ponto marcado (first: primeiro pulso; total: duração de todos)
  alvoPulse(p, at0, i, total, dir) {
    const f = this.fruit(p.fruit);
    if (!f) return;
    const q = p.params;
    const at = this.floor(at0);
    if (f.id !== 'tormenta') this.glow?.flash(at.clone().add(V(0, 0.6, 0)), f.color, q.radius * 1.1, 0.26);
    const d = v3(dir);
    const r = q.radius;
    const first = i === 0;
    switch (f.id) {
      case 'mare':
        if (first) this.fx.tidalEye(at, { ...FRUTOElements.forMove('mare', 2, r / 4.2), life: total + 0.3 });
        break;
      case 'duna':
        if (first) this.fx.sandCyclone(at, { ...FRUTOElements.forMove('duna', 2, r / 4.45), life: total + 0.3 });
        break;
      case 'tormenta':
        this.fx.stormStrike(at, r, 6.1, i);
        this.glow?.bolt(at.clone().add(V(0, 6.1, 0)), at.clone().add(V(0, 0.2, 0)), '#fff4b0', 0.25);
        this.glow?.flash(at.clone().add(V(0, 0.6, 0)), '#ffe45a', r * 1.4, 0.3);
        break;
      case 'eclipse':
        if (first) this.zone(at, r, total + 0.6, 'shadow', f.color);
        this.fx.pulse(at, f.color, r, 0.5);
        break;
      case 'cristal':
        this.fx.prism(at, 2.4, 0.82);
        this.later(0.05, () => {
          this.fx.cracks(at, '#e7a9d1', r, 0.5);
          this.fx.pulse(at, f.color, r, 0.36);
          this.fx.sparks(at.clone().add(V(0, 0.9, 0)), '#ffe0ed', 16, 4, { gravity: 4 });
        });
        break;
      case 'ima': {
        const rr = r * (0.55 + 0.25 * i);
        this.fx.pulse(at, f.color, rr, 0.35);
        const hub = at.clone().add(V(0, 1, 0));
        for (let j = 0; j < 3; j++) {
          const th = (j * 2 * Math.PI) / 3 + i * 0.81;
          this.fx.magnet(hub, hub.clone().add(V(Math.sin(th) * rr, 0.28 * Math.sin(th), Math.cos(th) * rr)), 0.28, i >= 2);
        }
        break;
      }
      case 'oriental':
        this.myth(f, 'skill', at, d, p.slot);
        this.fx.lightning(at.clone().add(V(0, 9, 0)), at.clone().add(V(0, 0.2, 0)), '#ffbe33', 0.3);
        this.glow?.bolt(at.clone().add(V(0, 9, 0)), at.clone().add(V(0, 0.2, 0)), '#ffe08a', 0.3);
        this.fx.pulse(at, f.color, r, 0.45);
        break;
      case 'ocidental':
        this.myth(f, 'skill', at, d, p.slot);
        this.fx.fire(at, r * 0.45, 2.6, 0.9, '#ff931e');
        this.fx.pulse(at, f.color, r, 0.45);
        break;
      default:
        this.fx.impact(at, f.color, r, 0.6);
        this.fx.pulse(at, f.color, r, 0.5);
    }
  }

  faixaPulse(p, start0, dir0) {
    const f = this.fruit(p.fruit);
    if (!f) return;
    const q = p.params;
    const start = this.floor(start0);
    const dir = v3(dir0).normalize();
    const along = (t) => this.floor(start.clone().addScaledVector(dir, t));
    switch (f.id) {
      case 'mare': {
        const base = FRUTOElements.forMove('mare', 0, 1);
        this.fx.grandWave(start, dir, { ...base, range: q.length, width: q.halfWidth * 2 });
        break;
      }
      case 'impacto':
        this.fx.kineticLane(start, dir, q.length, q.halfWidth, 0.71, false);
        for (let i = 0; i < 5; i++) this.later(i * 0.05, () => this.glow?.flash(along((q.length * (i + 0.5)) / 5).add(V(0, 0.5, 0)), '#9fd0ff', q.halfWidth * 2.2, 0.22));
        break;
      case 'geada':
        for (let i = 0; i * 0.8 < q.length; i++) this.later(i * 0.065, () => this.fx.ice(along(0.78 + i * 0.8), 1.15 + (i % 3) * 0.34, 1.18, 0.42, 2));
        break;
      case 'eco':
        this.fx.resonance(start, q.length, 0.5, dir, q.halfWidth * 2);
        break;
      case 'falcao':
        for (let i = 1; i <= 3; i++) this.later(i * 0.08, () => this.fx.feathers(along((q.length * i) / 3.2).add(V(0, 1.2, 0)), dir, 1.1));
        break;
      case 'oriental':
        this.myth(f, 'skill', start.clone().add(V(0, 1.4, 0)), dir, p.slot);
        for (let i = 1; i <= 4; i++) this.later(i * 0.06, () => this.fx.fire(along((q.length * i) / 4.4), 0.5, 1.7, 0.6, '#ff6b4a'));
        break;
      default:
        this.fx.wave(start, dir, q.length, q.halfWidth * 2, 0.52);
    }
  }

  k_alvo() {} // por pulso: alvoPulse()
  k_faixa() {} // por pulso: faixaPulse()

  k_cone(f, p, { pos, dir, targets = [] }) {
    const q = p.params;
    const g = this.floor(pos);
    const d = v3(dir).normalize();
    const hand = g.clone().add(V(0, 1.6, 0)).addScaledVector(d, 0.6);
    switch (f.id) {
      case 'lobo':
        this.fx.talons(hand, hand.clone().addScaledVector(d, q.range * 0.6), 1, false);
        this.later(0.12, () => this.fx.talons(hand, hand.clone().addScaledVector(d, q.range * 0.6), -1, false));
        break;
      case 'mare':
        this.fx.whirlpool(this.floor(g.clone().addScaledVector(d, q.range * 0.45)), q.range * 0.45, 1.2);
        break;
      case 'eco':
        this.fx.resonance(g, q.range, 0.4, d, Math.max(1, Math.tan((q.angle * Math.PI) / 360) * q.range));
        break;
      case 'ima':
        if (targets.length) for (const t of targets) this.fx.magnet(hand, V(t.x, t.y + 1.5, t.z), 0.42, false);
        else this.fx.magnet(hand, hand.clone().addScaledVector(d, 3.3), 0.33, false);
        break;
      case 'besta':
        this.myth(f, 'skill', hand, d, p.slot);
        this.fx.talons(hand, hand.clone().addScaledVector(d, q.range * 0.7), 1, true);
        this.fx.cracks(this.floor(g.clone().addScaledVector(d, q.range * 0.5)), f.color, q.range * 0.4, 0.6);
        break;
      case 'fenix':
      case 'ocidental':
        this.myth(f, 'skill', hand, d, p.slot);
        for (let i = 1; i <= 4; i++) this.later(i * 0.05, () => this.fx.fire(this.floor(g.clone().addScaledVector(d, (q.range * i) / 4.5)), 0.35 + i * 0.12, 1.4, 0.55, f.id === 'fenix' ? '#6cf7ff' : '#ff931e'));
        break;
      default:
        this.fx.wave(g, d, q.range, Math.max(1.5, Math.tan((q.angle * Math.PI) / 360) * q.range * 2), 0.45);
    }
  }

  k_parede(f, p, { pos, dir, yaw }) {
    const at = this.floor(V(pos.x + dir.x * 2.4, 0, pos.z + dir.z * 2.4), 0);
    this.zone(at, 1.7, p.params.duration, 'wall', f.color, yaw);
    this.fx.snow(at, 1.7, 9);
  }

  k_teleporte(f, p, { pos, to, yaw }) {
    this.fx.portal(this.floor(pos), f.color, 1.18, 0.67, yaw);
    if (to) this.later(0.05, () => this.fx.portal(this.floor(to), f.color, 1.18, 0.67, yaw));
  }

  k_cadeia() {} // por salto: chainJump()

  chainJump(p, from, to) {
    const f = this.fruit(p.fruit);
    this.fx.lightning(v3(from), v3(to), f?.color ?? p.color, 0.29);
    this.glow?.bolt(from, to, '#fff4b0', 0.22);
  }

  k_pilares() {} // pilaresMark() e pilaresStrike()

  pilaresMark(p, spots, delay) {
    const f = this.fruit(p.fruit);
    for (const s of spots) {
      const at = this.floor(s);
      this.fx.groundMark(at, f.color, p.params.pillar, delay + 0.18);
      this.fx.cracks(at, '#ff9b48', p.params.pillar * 0.86, 0.72);
    }
  }

  pilaresStrike(p, spots) {
    for (const s of spots) {
      const at = this.floor(s, 0);
      this.fx.fire(at, 1.1, 3.5, 1.12);
      this.fx.impact(at, '#ffb65a', p.params.pillar, 0.54);
    }
  }

  // acerto num alvo (complementa o clarão do sistema de poderes)
  hitTarget(p, at, dir) {
    const f = this.fruit(p.fruit);
    if (!f) return;
    const pt = v3(at);
    if (f.id === 'impacto') this.fx.kineticBurst(pt, v3(dir).normalize(), 0.85, 0.33, false);
    else if (f.id === 'geada') this.fx.snow(pt, 1, 9);
    else if (f.id === 'brasa') this.fx.sparks(pt, '#ffa549', 4, 1.3, { gravity: -0.65 });
    else if (f.id === 'eco') this.fx.echoAnswer(pt, v3(dir), 0.67);
    this.myth(f, 'hit', pt, v3(dir), p.slot);
  }

  // socos com a fruta equipada (combo da fruta): contato no ponto do golpe
  punch(fruitId, at, dir, strike = 0) {
    const f = this.fruit(fruitId);
    if (!f) return;
    this.fx.basicContact({ point: v3(at), dir: v3(dir).normalize(), fruit: f, form: 'humana', strike });
    this.myth(f, 'hit', v3(at), v3(dir), strike);
  }

  // aura da fruta em volta do corpo (forte no despertar)
  aura(fruitId, body, awakened, dt) {
    this.fx.aura(fruitId ? this.fruit(fruitId) : null, body, awakened, dt, 'humana');
  }
}
