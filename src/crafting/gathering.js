// Mineração e pesca no mundo (atualização 12): veios de minério nas duas ilhas (rocha com
// colisão + pedaços de minério numa malha instanciada que somem quando o veio esvazia) e
// pontos de pesca (ondinhas na água). A ação em si (minerar 1,8 s; pescar: lançar, esperar a
// mordida e puxar na hora) e as ferramentas na mão do personagem ficam na classe Gathering.

import * as THREE from 'three';
import { StructureBuilder } from '../world/structures.js';
import { NODE_TYPES, NODE_RESPAWN, mineTime, mineYield, biteDelay, biteWindow, catchFish, FISH_XP } from './professions.js';
import { MATERIALS, addMaterial } from './materials.js';
import { profOf, addProfXp } from '../progression/proficiency.js';

// Veios (coordenadas do mundo). Os da Ilha de Treino ficam fora das áreas dos desafios.
export const NODES = [
  { id: 'veio-t1', type: 'pedra', x: -74, z: -21 },
  { id: 'veio-t2', type: 'pedra', x: -68, z: -13 },
  { id: 'veio-t3', type: 'cobre', x: -74, z: -29 },
  { id: 'veio-t4', type: 'cobre', x: 40, z: 63 },
  { id: 'veio-t5', type: 'ferro', x: 34, z: -51 },
  { id: 'veio-t6', type: 'ferro', x: -32, z: -55 },
  { id: 'veio-p1', type: 'pedra', x: 340 + 25, z: -60 },
  { id: 'veio-p2', type: 'cobre', x: 340 - 35, z: 60 },
  { id: 'veio-p3', type: 'ferro', x: 340 + 55, z: -30 },
  { id: 'veio-p4', type: 'ferro', x: 340 - 55, z: 30 },
  { id: 'veio-p5', type: 'cristal', x: 340 + 46, z: -52 },
];
// Pontos de pesca: a isca cai em (x, z); dá para pescar a até 11 de distância, em terra firme
export const SPOTS = [
  { id: 'pesca-cais-treino', nome: 'Pesca no cais', x: 115, z: 10, table: 'mar' },
  { id: 'pesca-cais-porto', nome: 'Pesca no cais', x: 340 - 108, z: 0, table: 'mar' },
  { id: 'pesca-lagoa', nome: 'Pesca na lagoa', x: -45, z: 16, table: 'lagoa' },
  { id: 'pesca-praia-porto', nome: 'Pesca na praia', x: 340, z: 88, table: 'mar' },
];
export const KEEP_NODES = NODES.filter((n) => Math.abs(n.x) < 200).map((n) => [n.x, n.z, 4]);

export function buildGathering({ scene, physics, ground }) {
  const sb = new StructureBuilder(scene, physics);
  const chunks = [];
  for (const n of NODES) {
    n.y = ground(n.x, n.z);
    const t = NODE_TYPES[n.type];
    // rocha: três blocos de pedra
    sb.block({ x: n.x, y: n.y - 0.3, z: n.z, w: 2.6, h: 1.7, d: 2.2, rotY: (n.x * 7 + n.z) % 3, style: 'pedraLisa' });
    sb.block({ x: n.x + 0.9, y: n.y - 0.3, z: n.z + 0.7, w: 1.4, h: 1.1, d: 1.3, rotY: 0.4, style: 'pedraLisa' });
    sb.block({ x: n.x - 0.7, y: n.y + 1.3, z: n.z - 0.2, w: 1.3, h: 0.8, d: 1.2, rotY: 0.9, style: 'pedraLisa' });
    n.chunks = [];
    for (const [dx, dy, dz, s] of [[0.5, 1.3, 1.05, 0.5], [-1.1, 0.8, 0.6, 0.42], [1.2, 0.6, -0.9, 0.45], [-0.3, 2.05, 0.3, 0.38]]) {
      n.chunks.push(chunks.length);
      chunks.push({ node: n, pos: new THREE.Vector3(n.x + dx, n.y + dy, n.z + dz), s, color: new THREE.Color(t.minerio) });
    }
    n.empty = 0;
  }
  sb.finish();
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.4, emissive: '#222222', emissiveIntensity: 0.4 });
  const ore = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, chunks.length);
  ore.name = 'minerios';
  ore.castShadow = true;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const setChunk = (i, visible) => {
    const c = chunks[i];
    q.setFromEuler(new THREE.Euler(0.4 * i, 0.7 * i, 0.2 * i));
    m4.compose(c.pos, q, new THREE.Vector3().setScalar(visible ? c.s : 0.0001));
    ore.setMatrixAt(i, m4);
  };
  chunks.forEach((c, i) => {
    ore.setColorAt(i, c.color);
    setChunk(i, true);
  });
  ore.instanceMatrix.needsUpdate = true;
  scene.add(ore);
  // ondinhas dos pontos de pesca
  const ripples = SPOTS.map((s) => {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.9, 24), new THREE.MeshBasicMaterial({ color: '#e8fbff', transparent: true, opacity: 0.6, depthWrite: false }));
    r.rotation.x = -Math.PI / 2;
    r.renderOrder = 3;
    scene.add(r);
    return { spot: s, mesh: r, t: Math.random() * 2 };
  });

  return {
    signs: [
      ...NODES.map((n) => ({ x: n.x, y: n.y, z: n.z, title: NODE_TYPES[n.type].nome, hint: 'Minere com a Picareta (Rosa, Ferreira do Porto das Origens).', mine: true })),
      ...SPOTS.map((s) => ({ x: s.x, y: 1, z: s.z, title: s.nome, hint: 'Pesque com a Vara de Pesca (Joana, Mercadora do Porto das Origens).', fish: true })),
    ],
    update(dt, ocean) {
      let changed = false;
      for (const n of NODES) {
        if (n.empty > 0) {
          n.empty -= dt;
          if (n.empty <= 0) {
            n.chunks.forEach((i) => setChunk(i, true));
            changed = true;
          }
        }
      }
      if (changed) ore.instanceMatrix.needsUpdate = true;
      for (const r of ripples) {
        r.t += dt;
        const k = (r.t % 2) / 2;
        r.mesh.position.set(r.spot.x, ocean.heightAt(r.spot.x, r.spot.z) + 0.05, r.spot.z);
        r.mesh.scale.setScalar(0.6 + k * 1.6);
        r.mesh.material.opacity = 0.6 * (1 - k);
      }
    },
    deplete(n) {
      n.empty = NODE_RESPAWN;
      n.chunks.forEach((i) => setChunk(i, false));
      ore.instanceMatrix.needsUpdate = true;
    },
    nearestNode(p, r = 3.8) {
      let best = null;
      let bd = r;
      for (const n of NODES) {
        const d = Math.hypot(p.x - n.x, p.z - n.z);
        if (d < bd && Math.abs(p.y - n.y) < 3) {
          bd = d;
          best = n;
        }
      }
      return best;
    },
    nearestSpot(p, r = 11) {
      let best = null;
      let bd = r;
      for (const s of SPOTS) {
        const d = Math.hypot(p.x - s.x, p.z - s.z);
        if (d < bd && p.y > 0.4) {
          bd = d;
          best = s;
        }
      }
      return best;
    },
  };
}

// Ferramentas na mão (picareta e vara) e a ação de minerar/pescar
export class Gathering {
  constructor({ save, ctl, player, world, ocean, fx, scene, onEvent }) {
    Object.assign(this, { save, ctl, player, world, ocean, fx, onEvent });
    this.job = null;
    const wood = new THREE.MeshStandardMaterial({ color: '#7a5233', roughness: 0.8 });
    const metal = new THREE.MeshStandardMaterial({ color: '#b8c0c8', roughness: 0.35, metalness: 0.6 });
    // As ferramentas ficam presas ao corpo (não à mão, que gira com a animação): a picareta
    // na altura da mão direita (lado −x do personagem) e balança no ritmo da mineração; a
    // vara aponta para a frente e para cima.
    // picareta: cabo para cima a partir da mão, cabeça atravessada no topo
    this.pick = new THREE.Group();
    this.pick.position.set(-0.55, 2.35, 0.55);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.1), wood);
    handle.position.y = 0.7;
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.16, 0.18), metal);
    head.position.y = 1.45;
    this.pick.add(handle, head);
    // vara: do quadril direito para a frente e para cima; a ponta segura a linha
    this.rod = new THREE.Group();
    this.rod.position.set(-0.6, 2.2, 0.5);
    this.rod.rotation.x = -0.62;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 3.4, 6), wood);
    pole.rotation.x = Math.PI / 2;
    pole.position.z = 1.5;
    this.rod.add(pole);
    this.tip = new THREE.Object3D();
    this.tip.position.set(0, 0, 3.2);
    this.rod.add(this.tip);
    for (const tool of [this.pick, this.rod]) {
      tool.visible = false;
      tool.traverse((o) => (o.castShadow = !!o.isMesh));
      player.body.root.add(tool);
    }
    this.bobber = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({ color: '#e0412b', roughness: 0.5 }));
    this.bobber.visible = false;
    this.line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: '#f4f4f0' }));
    this.line.visible = false;
    this.line.frustumCulled = false;
    scene.add(this.bobber, this.line);
  }

  get busy() {
    return !!this.job;
  }

  has(tool) {
    return (this.save.tools ?? []).includes(tool);
  }

  face(x, z) {
    this.ctl.yaw = Math.atan2(x - this.ctl.pos.x, z - this.ctl.pos.z);
  }

  startMine(n) {
    if (!this.has('picareta')) return this.onEvent('denied', { message: 'Precisa de uma Picareta: compre com a Rosa, Ferreira do Porto das Origens.' });
    if (n.empty > 0) return this.onEvent('denied', { message: `Veio vazio. Volta em ${Math.ceil(n.empty)} s.` });
    const level = profOf(this.save, 'mineracao').level;
    this.job = { kind: 'mine', node: n, t: 0, dur: mineTime(level) };
    this.face(n.x, n.z);
    this.pick.visible = true;
    this.onEvent('start', { kind: 'mine' });
  }

  startFish(s) {
    if (!this.has('vara')) return this.onEvent('denied', { message: 'Precisa de uma Vara de Pesca: compre com a Joana, Mercadora do Porto das Origens.' });
    const level = profOf(this.save, 'pesca').level;
    this.job = { kind: 'fish', spot: s, phase: 'cast', t: 0, wait: biteDelay(level), window: biteWindow(level) };
    this.face(s.x, s.z);
    this.rod.visible = true;
    this.onEvent('start', { kind: 'fish' });
  }

  // Botão de ação durante a pesca: puxar na hora da mordida
  pull() {
    const j = this.job;
    if (!j || j.kind !== 'fish') return;
    if (j.phase === 'bite') {
      j.phase = 'reel';
      j.t = 0;
      return;
    }
    this.stop('Recolheu a linha.');
  }

  stop(message) {
    this.job = null;
    this.pick.visible = false;
    this.rod.visible = false;
    this.bobber.visible = false;
    this.line.visible = false;
    this.ctl.action = null;
    if (message) this.onEvent('info', { message });
  }

  // moved: o jogador mexeu o analógico (cancela)
  update(dt, moved) {
    const j = this.job;
    if (!j) return;
    const c = this.ctl;
    if (moved || c.state !== 'ground' || c.faint > 0) return this.stop(j.kind === 'mine' ? 'Parou de minerar.' : 'Recolheu a linha.');
    j.t += dt;
    c.attackLock = Math.max(c.attackLock, 0.05);
    if (j.kind === 'mine') {
      c.action = { clip: 'gancho', t: (j.t % 0.55) * 0.9 };
      // levanta devagar e desce rápido
      const ph = (j.t % 0.55) / 0.55;
      this.pick.rotation.x = ph < 0.7 ? THREE.MathUtils.lerp(1.9, -0.7, ph / 0.7) : THREE.MathUtils.lerp(-0.7, 1.9, (ph - 0.7) / 0.3);
      if (Math.floor((j.t - dt) / 0.55) !== Math.floor(j.t / 0.55)) {
        this.fx?.burst({ x: j.node.x, y: j.node.y + 1.2, z: j.node.z }, NODE_TYPES[j.node.type].minerio, { count: 6, speed: 3, up: 2 });
        this.onEvent('hitRock', {});
      }
      if (j.t >= j.dur) this.finishMine(j.node);
      return;
    }
    // pesca
    c.action = { clip: 'jab', t: j.phase === 'cast' ? Math.min(j.t, 0.25) : 0.12 };
    const s = j.spot;
    const water = this.ocean.heightAt(s.x, s.z);
    if (j.phase === 'cast') {
      if (j.t >= 0.6) {
        j.phase = 'wait';
        j.t = 0;
        this.fx?.burst({ x: s.x, y: water, z: s.z }, '#e8fbff', { count: 6, speed: 1.5, up: 1.5 });
      }
    } else if (j.phase === 'wait' && j.t >= j.wait) {
      j.phase = 'bite';
      j.t = 0;
      this.onEvent('bite', {});
    } else if (j.phase === 'bite' && j.t >= j.window) {
      this.stop('O peixe escapou! Puxe logo depois da mordida.');
      return;
    } else if (j.phase === 'reel' && j.t >= 0.45) {
      this.finishFish(s);
      return;
    }
    // boia e linha
    const tip = new THREE.Vector3();
    this.tip.getWorldPosition(tip);
    const castK = j.phase === 'cast' ? Math.min(1, j.t / 0.6) : 1;
    const dip = j.phase === 'bite' ? -0.25 - Math.abs(Math.sin(j.t * 20)) * 0.2 : Math.sin(j.t * 3) * 0.05;
    const reelK = j.phase === 'reel' ? Math.min(1, j.t / 0.45) : 0;
    const bx = THREE.MathUtils.lerp(tip.x, s.x, castK * (1 - reelK));
    const bz = THREE.MathUtils.lerp(tip.z, s.z, castK * (1 - reelK));
    const by = THREE.MathUtils.lerp(tip.y, water + dip, castK * (1 - reelK)) + Math.sin(castK * Math.PI) * 2 * (j.phase === 'cast' ? 1 : 0);
    this.bobber.position.set(bx, by, bz);
    this.bobber.visible = true;
    const pos = this.line.geometry.attributes.position;
    pos.setXYZ(0, tip.x, tip.y, tip.z);
    pos.setXYZ(1, bx, by, bz);
    pos.needsUpdate = true;
    this.line.visible = true;
  }

  finishMine(n) {
    const level = profOf(this.save, 'mineracao').level;
    const got = mineYield(n.type, level);
    for (const [id, k] of Object.entries(got)) addMaterial(this.save, id, k);
    const xp = NODE_TYPES[n.type].xp;
    const levels = addProfXp(this.save, 'mineracao', xp);
    this.world.deplete(n);
    this.stop();
    this.onEvent('mined', { got, xp, levels, level: profOf(this.save, 'mineracao').level });
  }

  finishFish(s) {
    const level = profOf(this.save, 'pesca').level;
    const id = catchFish(s.table, level);
    addMaterial(this.save, id, 1);
    const xp = FISH_XP[id] ?? 5;
    const levels = addProfXp(this.save, 'pesca', xp);
    this.stop();
    this.onEvent('caught', { id, nome: MATERIALS[id].nome, xp, levels, level: profOf(this.save, 'pesca').level, peixe: MATERIALS[id].tipo === 'peixe' });
  }
}
