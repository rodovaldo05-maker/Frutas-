// Arena de combate da Ilha de Treino (atualização 2): bonecos de treino (não revidam) e
// Recrutas (inimigos simples com o corpo e os golpes do laboratório). Os Recrutas avisam
// antes de bater (preparo de 0,5 s), atacam um de cada vez, reagem aos golpes, defendem às
// vezes, caem derrotados e voltam depois de um tempo. A lógica funciona sem gráficos (testes).

import * as THREE from 'three';
import { FRUTOModels } from '../characters/fruto-models.js';
import { FRUTOMotion } from '../animation/fruto-motion.js';
import { Face } from '../characters/face.js';
import { ATTACKS, Guard, computeDamage, inReach, isFrontal, reactionTime, timing } from './rules.js';
import { MOVE } from '../movement/config.js';
import { clamp, damp, lerp, lerpAngle, wrapAngle } from '../core/math.js';
import { trimShadows, LOD_FAR, LOD_FACE } from '../characters/shadows.js';

export const ARENA = { x: -16, z: -10, radius: 15 };

export const RECRUTA = {
  nome: 'Recruta', level: 2, hp: 90, defense: 0, speed: 3.4, aggro: 10, camp: 13, leash: 22, xp: 45, coins: 12,
  windup: 0.5, clipSpeed: 0.9, damageMult: 0.8, cooldown: [1.3, 2.3], respawn: 18,
  look: { skin: '#b9825c', hair: '#2a1d14', shirt: '#7a2a2a', shorts: '#2b2b36', shoes: '#3a2a20' },
};

// Recrutas elementais (atualização 6): golpes com elemento e um ataque marcado no chão
// (círculo de aviso de 0,9 s onde o jogador está; sair ou esquivar evita)
const ELEMENTAL = { level: 4, hp: 140, xp: 80, coins: 25, damageMult: 0.9, aggro: 11, camp: 14, leash: 24 };
export const RECRUTAS_ELEMENTAIS = {
  fogo: {
    ...RECRUTA, ...ELEMENTAL, nome: 'Recruta de Brasa', element: 'fogo', cor: '#ff6a1a', faixa: '#ff8a2a',
    look: { skin: '#a8714c', hair: '#2a120c', shirt: '#a8321c', shorts: '#3a1a14', shoes: '#2a1a10' },
    meleeEffects: { queimando: { duration: 3, stacks: 1 } },
    special: { nome: 'Chão em Brasa', clip: 'brasa2', cooldown: 7, telegraph: 0.9, radius: 3, damage: 14, effects: { queimando: { duration: 4, stacks: 2 } } },
  },
  gelo: {
    ...RECRUTA, ...ELEMENTAL, nome: 'Recruta de Geada', element: 'gelo', cor: '#7fd6ff', faixa: '#bfeeff',
    look: { skin: '#c29a7c', hair: '#dfe8ef', shirt: '#2f6f9c', shorts: '#1f2f45', shoes: '#2a3a4a' },
    meleeEffects: { lento: { duration: 2 } },
    special: { nome: 'Prisão de Gelo', clip: 'geada2', cooldown: 8, telegraph: 0.9, radius: 2.8, damage: 10, effects: { congelado: { duration: 1.2 }, lento: { duration: 2.5 } } },
  },
  raio: {
    ...RECRUTA, ...ELEMENTAL, nome: 'Recruta de Tormenta', element: 'raio', cor: '#ffe45a', faixa: '#fff2a0',
    look: { skin: '#9a6a48', hair: '#1a1a22', shirt: '#b8902a', shorts: '#2a2a33', shoes: '#22222a' },
    meleeEffects: { choque: { stacks: 1 } },
    special: { nome: 'Raio Marcado', clip: 'tormenta0', cooldown: 6, telegraph: 0.9, radius: 2.6, damage: 12, effects: { choque: { stacks: 2 } } },
  },
};
export const ELEMENT_CAMP = { x: 58, z: -30 };

const PART = {
  cabeca: 'skin', tronco: 'shirt', ombro_E: 'shirt', ombro_D: 'shirt', braco_E: 'shirt', braco_D: 'shirt',
  antebraco_E: 'skin', antebraco_D: 'skin', mao_E: 'skin', mao_D: 'skin', cintura: 'shorts', coxa_E: 'shorts', coxa_D: 'shorts',
  canela_E: 'skin', canela_D: 'skin', pe_E: 'shoes', pe_D: 'shoes',
};

// Placa com nome e barra de vida (canvas redesenhado só quando muda)
function makeTag(width = 4.2) {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true }));
  sprite.scale.set(width, width / 4, 1);
  sprite.renderOrder = 6;
  let last = '';
  return {
    sprite,
    draw(name, ratio = null, warn = false) {
      const key = `${name}|${ratio === null ? '' : ratio.toFixed(3)}|${warn}`;
      if (key === last) return;
      last = key;
      ctx.clearRect(0, 0, 384, 96);
      ctx.font = '700 34px Cinzel, Georgia, serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(15, 10, 30, 0.9)';
      ctx.fillStyle = warn ? '#ff9b7a' : '#ffe9b3';
      ctx.strokeText(name, 192, 38);
      ctx.fillText(name, 192, 38);
      if (ratio !== null) {
        ctx.fillStyle = 'rgba(15, 10, 30, 0.85)';
        ctx.fillRect(42, 54, 300, 26);
        ctx.fillStyle = '#d9a64a';
        ctx.fillRect(42, 54, 300, 3);
        const g = ctx.createLinearGradient(0, 58, 0, 78);
        g.addColorStop(0, ratio > 0.35 ? '#ff6b5a' : '#ffb03a');
        g.addColorStop(1, ratio > 0.35 ? '#a3201b' : '#b5641c');
        ctx.fillStyle = g;
        ctx.fillRect(46, 58, 292 * clamp(ratio), 18);
      }
      tex.needsUpdate = true;
    },
  };
}

// ===== Boneco de treino =====
export class Dummy {
  constructor({ id, x, z, field, scene, physics, visual = true }) {
    this.id = id;
    this.hostile = false;
    this.alive = true;
    this.radius = 0.8;
    this.defense = 0;
    const y = field.sample(x, z);
    this.pos = new THREE.Vector3(x, y, z);
    this.yaw = 0;
    this.wobble = 0;
    this.wobbleV = 0;
    this.wobbleDir = 0;
    this.hits = 0;
    if (!visual) return;
    const wood = new THREE.MeshStandardMaterial({ color: '#8a5a32', roughness: 0.85 });
    const straw = new THREE.MeshStandardMaterial({ color: '#d9b45a', roughness: 0.95 });
    const rope = new THREE.MeshStandardMaterial({ color: '#7a3b2a', roughness: 0.9 });
    this.group = new THREE.Group();
    this.group.position.copy(this.pos);
    const pivot = new THREE.Group(); // balança a partir da base
    this.group.add(pivot);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.34, 3.2, 0.34), wood);
    post.position.y = 1.6;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.6, 0.8), straw);
    torso.position.y = 2.6;
    const belt = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.18, 0.86), rope);
    belt.position.y = 2.1;
    const arms = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 0.3), wood);
    arms.position.y = 3.05;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), straw);
    head.position.y = 3.85;
    const target = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 12), rope);
    target.rotation.x = Math.PI / 2;
    target.position.set(0, 2.7, 0.42);
    pivot.add(post, torso, belt, arms, head, target);
    this.pivot = pivot;
    this.group.traverse((o) => {
      if (o.isMesh) o.castShadow = o.receiveShadow = true;
    });
    scene.add(this.group);
    physics?.addCylinder({ x, y: y + 1.6, z }, 1.6, 0.55, { material: 'madeira' });
    this.tag = makeTag(2.8);
    this.tag.draw('Boneco de treino');
    this.tag.sprite.position.set(x, y + 4.9, z);
    scene.add(this.tag.sprite);
  }

  receiveHit({ attacker, attack, damage }) {
    this.hits += 1;
    this.lastHit = attack.id;
    this.wobbleV += (attack.heavy ? 5.5 : 3.2);
    this.wobbleDir = Math.atan2(this.pos.x - attacker.x, this.pos.z - attacker.z);
    return { result: 'hit', damage };
  }

  update(dt, playerPos) {
    // mola amortecida: balança e volta ao lugar
    this.wobbleV += (-40 * this.wobble - 5 * this.wobbleV) * dt;
    this.wobble += this.wobbleV * dt;
    if (this.pivot) {
      this.pivot.rotation.set(Math.cos(this.wobbleDir) * this.wobble * 0.12, 0, -Math.sin(this.wobbleDir) * this.wobble * 0.12);
      this.tag.sprite.visible = playerPos.distanceTo(this.pos) < 14;
    }
  }
}

// ===== Recruta =====
export class Recruta {
  constructor({ id, x, z, field, scene, data, def = RECRUTA, visual = true }) {
    this.id = id;
    this.def = def;
    this.hostile = true;
    this.field = field;
    this.data = data;
    this.home = new THREE.Vector3(x, field.sample(x, z), z);
    this.pos = this.home.clone();
    this.vel = new THREE.Vector3();
    this.yaw = Math.PI;
    this.radius = 0.9;
    this.defense = def.defense;
    this.maxHealth = def.hp;
    this.health = def.hp;
    this.life = 1;
    this.alive = true;
    this.state = 'idle'; // idle, chase, windup, attack, hurt, stun, down, gone
    this.t = 0; // tempo no estado
    this.cooldown = 1;
    this.attack = null; // { id, t, struck, tm }
    this.chain = false;
    this.guard = new Guard({ postureMax: 60 });
    this.recentHits = 0;
    this.recentT = 0;
    this.knock = new THREE.Vector3();
    this.phase = 0;
    this.stride = 0;
    this.speed = 0; // definido antes do primeiro desenho (senão o passo vira NaN e o corpo some)
    this.clock = Math.random() * 10;
    this.hurtAmount = 0;
    this.strafe = Math.random() < 0.5 ? 1 : -1;
    // efeitos dos poderes das frutas
    this.frozen = 0;
    this.burn = 0;
    this.burnTick = 0;
    this.lift = 0; // altura do lançamento
    this.liftV = 0;
    if (!visual) return;
    const body = FRUTOModels.body(THREE, data, '#ffffff', 1, 1);
    for (const [part, mesh] of Object.entries(body.meshes)) mesh.material.color.set(def.look[PART[part] || 'skin']);
    // faixa na cabeça
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.16, 1.08), new THREE.MeshStandardMaterial({ color: def.faixa || '#c0392b', roughness: 0.7 }));
    if (def.element) {
      // punhos que brilham na cor do elemento
      const glow = new THREE.MeshStandardMaterial({ color: def.cor, emissive: def.cor, emissiveIntensity: 1.2 });
      for (const side of ['E', 'D']) {
        const g = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.42), glow);
        g.position.set(0, -0.28, 0.02);
        body.joints['mao_' + side].add(g);
      }
    }
    band.position.set(0, 0.62, 0);
    body.joints.cabeca.add(band);
    this.face = new Face(body.joints.cabeca, { hair: def.look.hair, skin: def.look.skin });
    trimShadows(body);
    this.body = body;
    scene.add(body.root);
    this.tag = makeTag();
    scene.add(this.tag.sprite);
    this.drawTag();
  }

  get name() {
    return `${this.def.nome} Nv. ${this.def.level}`;
  }

  drawTag() {
    this.tag?.draw(this.name, this.health / this.maxHealth, this.state === 'windup');
  }

  set(state) {
    this.state = state;
    this.t = 0;
  }

  // ===== Golpe recebido do jogador =====
  receiveHit({ attacker, attack, damage, effect = null }) {
    if (!this.alive) return null;
    if (effect) this.applyEffect(effect, attacker);
    this.recentHits += 1;
    this.recentT = 2;
    // às vezes levanta a guarda depois de apanhar seguido
    const r = this.guard.receive(damage, attack.posture, { frontal: isFrontal(this, attacker) });
    if (r.result === 'perfect' || r.result === 'block') {
      this.drawTag();
      return { result: 'block', damage: r.damage };
    }
    if (r.result === 'break') this.set('stun');
    this.health = Math.max(0, this.health - r.damage);
    const away = Math.atan2(this.pos.x - attacker.x, this.pos.z - attacker.z);
    const k = this.frozen > 0 ? 0 : attack.knock / 0.22;
    if (!effect?.pull) this.knock.set(Math.sin(away) * k, 0, Math.cos(away) * k);
    this.hurtAmount = 1;
    this.attack = null;
    this.specialDone = false;
    if (this.health <= 0) {
      this.alive = false;
      this.guard.holding = false;
      this.set('down');
      this.onDefeated?.(this);
    } else if (this.frozen > 0 || this.lift > 0 || this.liftV > 0) {
      this.set('stun');
      this.stunTime = Math.max(this.frozen, 0.9);
    } else if (r.result !== 'break') {
      this.set('hurt');
      this.hurtTime = reactionTime(attack.reaction);
    }
    this.drawTag();
    return { result: r.result === 'break' ? 'break' : 'hit', damage: r.damage };
  }

  // ===== Pensar e mover =====
  // player: { pos, yaw, alive, canBeTargeted }; arena: token de ataque; hit(): golpe no jogador
  update(dt, player, arena) {
    this.t += dt;
    this.clock += dt;
    this.arenaRef = arena;
    this.updateEffects(dt);
    this.recentT = Math.max(0, this.recentT - dt);
    if (this.recentT <= 0) this.recentHits = 0;
    this.guard.update(dt);
    this.hurtAmount = Math.max(0, this.hurtAmount - dt * 2.5);
    const toP = new THREE.Vector3(player.pos.x - this.pos.x, 0, player.pos.z - this.pos.z);
    const dist = toP.length();
    const fromHome = Math.hypot(player.pos.x - this.home.x, player.pos.z - this.home.z);
    // só percebe o jogador dentro do acampamento; persegue até a distância de coleira
    const engaged = player.alive && Math.abs(player.pos.y - this.pos.y) < 4 && fromHome < this.def.leash && (this.state !== 'idle' || (dist < this.def.aggro && fromHome < this.def.camp));
    let want = new THREE.Vector3();
    let speed = 0;
    const face = (yaw, rate = 10) => (this.yaw = lerpAngle(this.yaw, yaw, damp(rate, dt)));
    const yawTo = Math.atan2(toP.x, toP.z);

    switch (this.state) {
      case 'idle': {
        // volta para casa e se cura
        const back = new THREE.Vector3(this.home.x - this.pos.x, 0, this.home.z - this.pos.z);
        if (back.length() > 1) {
          want = back.normalize();
          speed = this.def.speed * 0.6;
          face(Math.atan2(want.x, want.z), 6);
        }
        this.health = Math.min(this.maxHealth, this.health + 15 * dt);
        this.guard.set(false, dt);
        if (engaged && dist < this.def.aggro) this.set('chase');
        break;
      }
      case 'chase': {
        if (!engaged) {
          this.set('idle');
          if (arena.token === this) arena.token = null;
          break;
        }
        this.cooldown -= dt;
        face(yawTo);
        // depois de apanhar seguido, às vezes levanta a guarda por um tempo
        this.guardDecide = (this.guardDecide ?? 0) - dt;
        this.guardT = (this.guardT ?? 0) - dt;
        if (this.recentHits >= 2 && dist < 3.6 && this.guardDecide <= 0) {
          this.guardT = Math.random() < 0.5 ? 1.1 : 0;
          this.guardDecide = 1.8;
        }
        this.guard.set(this.guardT > 0, dt);
        if (dist > 2.9) {
          want = toP.clone().normalize();
          speed = this.def.speed * (this.guard.holding ? 0.4 : 1);
        } else {
          // rodeia devagar esperando a vez
          want.set(toP.z, 0, -toP.x).normalize().multiplyScalar(this.strafe);
          speed = this.def.speed * 0.25;
          if (dist < 2.2) want.addScaledVector(toP.clone().normalize(), -1.5);
          if (this.cooldown <= 0 && (!arena.token || arena.token === this) && player.alive) {
            arena.token = this;
            this.guard.set(false, dt);
            this.startAttack(Math.random() < 0.5 ? 'jab' : 'direto');
            this.chain = Math.random() < 0.35;
          }
        }
        // ataque marcado (elementais): de média distância, também usa a vez de atacar
        this.specialCd = (this.specialCd ?? 3) - dt;
        if (this.def.special && this.state === 'chase' && this.specialCd <= 0 && dist < 13 && (!arena.token || arena.token === this) && player.alive) {
          arena.token = this;
          this.specialAt = player.pos.clone();
          this.specialCd = this.def.special.cooldown;
          this.set('special');
          arena.onSpecial?.(this, this.specialAt, this.def.special);
        }
        break;
      }
      case 'windup': {
        if (!this.attack) {
          this.set('chase');
          break;
        }
        face(yawTo, 14);
        if (this.t >= this.def.windup) this.set('attack');
        break;
      }
      case 'attack': {
        const a = this.attack;
        if (!a) {
          this.set('chase');
          break;
        }
        a.t += dt * this.def.clipSpeed;
        if (!a.struck && a.t >= a.tm.release) {
          a.struck = true;
          const atk = ATTACKS[a.id];
          // investida curta
          this.knock.set(Math.sin(this.yaw) * 4, 0, Math.cos(this.yaw) * 4);
          const me = { x: this.pos.x, y: this.pos.y, z: this.pos.z, yaw: this.yaw };
          if (player.alive && inReach(me, player.pos, atk, { radius: 0.9 })) {
            const res = arena.hitPlayer(this, this.def.element ? { ...atk, element: this.def.element, effects: this.def.meleeEffects } : atk, computeDamage(atk.damage * this.def.damageMult));
            if (res?.result === 'perfect') {
              this.attack = null;
              this.set('stun');
              this.stunTime = 0.6;
              this.guard.posture = Math.max(0, this.guard.posture - 25);
              break;
            }
          }
        }
        if (a.t >= a.tm.duration) {
          if (this.chain && a.id === 'jab') {
            this.chain = false;
            this.attack = { id: 'direto', t: 0, struck: false, tm: timing('direto') };
          } else {
            this.attack = null;
            this.cooldown = lerp(this.def.cooldown[0], this.def.cooldown[1], Math.random());
            if (arena.token === this) arena.token = null;
            this.strafe = Math.random() < 0.5 ? 1 : -1;
            this.set('chase');
          }
        }
        break;
      }
      case 'special': {
        face(yawTo, 8);
        const sp = this.def.special;
        if (this.t >= sp.telegraph && !this.specialDone) {
          this.specialDone = true;
          arena.resolveSpecial?.(this, this.specialAt, sp);
        }
        if (this.t >= sp.telegraph + 0.5) {
          this.specialDone = false;
          this.cooldown = Math.max(this.cooldown, 0.8);
          if (arena.token === this) arena.token = null;
          this.set('chase');
        }
        break;
      }
      case 'hurt':
        if (this.t >= this.hurtTime) {
          this.cooldown = Math.max(this.cooldown, 0.5);
          this.set('chase');
        }
        if (arena.token === this) arena.token = null;
        break;
      case 'stun':
        if (arena.token === this) arena.token = null;
        if (this.t >= (this.stunTime ?? 1.2) && this.frozen <= 0 && this.lift <= 0) {
          this.stunTime = null;
          this.set('chase');
        }
        break;
      case 'down':
        if (arena.token === this) arena.token = null;
        if (this.t >= 4) this.set('gone');
        break;
      case 'gone':
        if (this.t >= this.def.respawn) this.respawn();
        break;
      default:
    }

    // movimento: direção desejada + empurrões, no chão
    const target = want.multiplyScalar(speed);
    this.vel.x = lerp(this.vel.x, target.x, damp(8, dt));
    this.vel.z = lerp(this.vel.z, target.z, damp(8, dt));
    this.pos.x += (this.vel.x + this.knock.x) * dt;
    this.pos.z += (this.vel.z + this.knock.z) * dt;
    this.knock.multiplyScalar(Math.max(0, 1 - 9 * dt));
    // não entra no jogador nem nos outros
    if (this.alive) {
      const dx = this.pos.x - player.pos.x;
      const dz = this.pos.z - player.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 1.9 && d > 1e-3) {
        this.pos.x += (dx / d) * (1.9 - d);
        this.pos.z += (dz / d) * (1.9 - d);
      }
      for (const o of arena.recrutas) {
        if (o === this || !o.alive) continue;
        const ox = this.pos.x - o.pos.x;
        const oz = this.pos.z - o.pos.z;
        const od = Math.hypot(ox, oz);
        if (od < 2 && od > 1e-3) {
          this.pos.x += (ox / od) * (2 - od) * 0.5;
          this.pos.z += (oz / od) * (2 - od) * 0.5;
        }
      }
    }
    this.pos.y = this.field.sample(this.pos.x, this.pos.z) + this.lift;
    this.speed = Math.hypot(this.vel.x, this.vel.z);
    if (this.frozen > 0) {
      this.vel.set(0, 0, 0);
      this.speed = 0;
    }
    if (this.state === 'windup' || this.state === 'attack' || this.state === 'hurt') this.drawTag();
  }

  // Congelar, queimar, puxar, empurrar e lançar (poderes das frutas)
  applyEffect(e, attacker) {
    if (e.freeze) {
      this.frozen = Math.max(this.frozen, e.freeze);
      this.attack = null;
      this.guard.holding = false;
    }
    if (e.burn) this.burn = Math.max(this.burn, e.burn);
    if ((e.freeze || e.launch) && this.alive) {
      if (this.arenaRef?.token === this) this.arenaRef.token = null;
      this.set('stun');
      this.stunTime = Math.max(e.freeze ?? 0, 0.9);
    }
    if (e.launch && this.frozen <= 0) {
      this.liftV = 8 + 6 * e.launch;
      this.attack = null;
    }
    if (e.pull && this.frozen <= 0) {
      const dx = e.pull.x - this.pos.x;
      const dz = e.pull.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > 1.2) this.knock.set((dx / d) * Math.min(14, d * 3.2), 0, (dz / d) * Math.min(14, d * 3.2));
    }
    if (e.push && this.frozen <= 0) {
      const away = Math.atan2(this.pos.x - attacker.x, this.pos.z - attacker.z);
      const k = e.push / 0.22;
      this.knock.set(Math.sin(away) * k, 0, Math.cos(away) * k);
    }
  }

  // Queimadura (dano por segundo), gelo e lançamento: roda antes da IA
  updateEffects(dt) {
    if (this.frozen > 0) {
      this.frozen = Math.max(0, this.frozen - dt);
      this.knock.set(0, 0, 0);
    }
    if (this.burn > 0 && this.alive) {
      this.burn = Math.max(0, this.burn - dt);
      this.burnTick += dt;
      if (this.burnTick >= 0.5) {
        this.burnTick = 0;
        this.health = Math.max(1, this.health - 3);
        this.onBurn?.(this, 3);
        this.drawTag();
      }
    }
    if (this.liftV !== 0 || this.lift > 0) {
      this.liftV -= 30 * dt;
      this.lift = Math.max(0, this.lift + this.liftV * dt);
      if (this.lift <= 0 && this.liftV < 0) this.liftV = 0;
    }
  }

  startAttack(id) {
    this.attack = { id, t: 0, struck: false, tm: timing(id) };
    this.arenaRef?.onWindup?.(this);
    this.set('windup');
    this.drawTag();
  }

  respawn() {
    this.life += 1;
    this.pos.copy(this.home);
    this.vel.set(0, 0, 0);
    this.knock.set(0, 0, 0);
    this.health = this.maxHealth;
    this.alive = true;
    this.guard = new Guard({ postureMax: 60 });
    this.cooldown = 1.5;
    this.set('idle');
    if (this.body) this.body.root.visible = true;
    this.drawTag();
  }

  // ===== Animação (corpo do laboratório) =====
  render(dt, playerPos) {
    if (!this.body) return;
    if (this.frozen > 0) dt = 0; // congelado: a pose para
    const body = this.body;
    // longe do jogador não desenha nem anima (desempenho); de perto mostra o rosto inteiro
    const far = Math.abs(playerPos.x - this.pos.x) > LOD_FAR || Math.abs(playerPos.z - this.pos.z) > LOD_FAR;
    const visible = this.state !== 'gone' && !far;
    body.root.visible = visible;
    this.tag.sprite.visible = visible && this.alive && playerPos.distanceTo(this.pos) < (this.arenaRef?.tagRange ?? 26);
    if (!visible) return;
    this.face.setDetail(playerPos.distanceTo(this.pos) < LOD_FACE);
    const sink = this.state === 'down' ? Math.max(0, this.t - 3) * 1.4 : 0;
    body.root.position.set(this.pos.x, this.pos.y - sink, this.pos.z);
    body.root.rotation.set(0, this.yaw, 0);
    this.tag.sprite.position.set(this.pos.x, this.pos.y + 5.4, this.pos.z);
    const speed = Number.isFinite(this.speed) ? this.speed : 0;
    this.stride = lerp(Number.isFinite(this.stride) ? this.stride : 0, clamp(speed / MOVE.run, 0, 1.15), damp(12, dt));
    this.phase = (Number.isFinite(this.phase) ? this.phase : 0) + dt * speed * 2.9;
    const data = this.data;
    if (this.state === 'down') {
      FRUTOMotion.apply(THREE, body, data, { id: 'death', t: Math.min(this.t, 1.55) });
    } else if (this.state === 'windup' && this.attack) {
      // segura a pose de carga: aviso para defender ou esquivar
      const a = this.attack;
      const hold = a.tm.release * 0.55;
      FRUTOMotion.apply(THREE, body, data, { id: ATTACKS[a.id].clip, t: hold * clamp(this.t / 0.2) });
      body.joints.tronco.rotation.y += Math.sin(this.clock * 30) * 0.03;
    } else if (this.state === 'special') {
      // gesto do laboratório segurado durante o aviso
      const c = FRUTOMotion.clips[this.def.special.clip];
      FRUTOMotion.apply(THREE, body, data, { id: this.def.special.clip, t: Math.min(this.t, c ? c.release : 0.3) });
    } else if (this.state === 'attack' && this.attack) {
      FRUTOMotion.apply(THREE, body, data, { id: ATTACKS[this.attack.id].clip, t: this.attack.t });
    } else {
      FRUTOMotion.apply(THREE, body, data, { id: 'idle', t: this.clock, clock: this.clock, phase: this.phase, gait: this.stride, runBlend: 0, swimBlend: 0, air: 0, landing: 0 });
      if (this.guard.holding) {
        const j = body.joints;
        for (const [side, sign] of [['E', 1], ['D', -1]]) {
          j['braco_' + side].rotation.x = -1.25;
          j['braco_' + side].rotation.z = sign * -0.35;
          j['antebraco_' + side].rotation.x = -1.75;
        }
      }
    }
    // gelo (azul) e fogo (laranja) no corpo
    const tint = this.frozen > 0 ? 1 : this.burn > 0 ? 2 : 0;
    if (tint !== this.tint) {
      this.tint = tint;
      for (const mesh of Object.values(body.meshes)) {
        mesh.material.emissive?.set(tint === 1 ? '#3fa9ff' : tint === 2 ? '#ff5a1a' : '#000000');
        if (mesh.material.emissive) mesh.material.emissiveIntensity = tint ? 0.55 : 1;
      }
    }
    const hit = this.hurtAmount;
    if (hit > 0) {
      body.joints.tronco.rotation.x -= 0.4 * Math.sin(hit * Math.PI);
      body.joints.cabeca.rotation.x -= 0.3 * Math.sin(hit * Math.PI);
    }
    if (this.state === 'stun') {
      body.joints.tronco.rotation.z += Math.sin(this.clock * 7) * 0.14;
      body.joints.cabeca.rotation.x += 0.25;
    }
    const expression = this.state === 'down' ? 'fechado' : hit > 0.3 || this.state === 'stun' ? 'dor' : this.state === 'windup' || this.state === 'attack' ? 'esforco' : 'neutro';
    const look = clamp(wrapAngle(Math.atan2(playerPos.x - this.pos.x, playerPos.z - this.pos.z) - this.yaw), -1, 1) * 0.5;
    this.face.update(dt, { expression, look: { x: -look, y: 0 } });
  }
}

// ===== Arena =====
export function buildArena({ scene, physics, field, data, visual = true }) {
  const A = ARENA;
  const dummies = [
    [A.x + 10, A.z - 5], [A.x + 11, A.z], [A.x + 10, A.z + 5],
  ].map(([x, z], i) => new Dummy({ id: `boneco-${i + 1}`, x, z, field, scene, physics, visual }));
  const recrutas = [
    [A.x - 8, A.z - 5], [A.x - 11, A.z + 1], [A.x - 7, A.z + 6],
  ].map(([x, z], i) => new Recruta({ id: `recruta-${i + 1}`, x, z, field, scene, data, visual }));
  // acampamento elemental (nordeste da ilha)
  const E = ELEMENT_CAMP;
  [['fogo', E.x - 4, E.z - 4], ['gelo', E.x + 4, E.z], ['raio', E.x - 1, E.z + 5]].forEach(([el, x, z]) => {
    recrutas.push(new Recruta({ id: `elemental-${el}`, x, z, field, scene, data, def: RECRUTAS_ELEMENTAIS[el], visual }));
  });

  const arena = {
    dummies,
    recrutas,
    token: null, // quem pode atacar agora (um de cada vez)
    hitPlayer: () => null,
    get targets() {
      return [...dummies, ...recrutas];
    },
    update(dt, player) {
      for (const d of dummies) d.update(dt, player.pos);
      for (const r of recrutas) r.update(dt, player, arena);
    },
    render(dt, playerPos) {
      for (const r of recrutas) r.render(dt, playerPos);
    },
  };
  return arena;
}
