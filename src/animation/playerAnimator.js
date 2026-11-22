// Animação do jogador. A locomoção (andar, correr, salto, nado, esquiva) vem direto do
// FRUTOMotion do laboratório, com fase e passada ligadas à velocidade real (sem pé
// deslizando) e equilíbrio/pés no chão pelo FRUTOBalance. As poses novas (escalar,
// pendurar, subir borda, agachar, deslizar, rolar, planar, queda livre, corrida na parede,
// mergulho) são montadas por cima com IK de dois ossos do próprio laboratório.
// Trocas de estado misturam a pose anterior com a nova para não dar estalo.

import * as THREE from 'three';
import { FRUTOMotion } from './fruto-motion.js';
import { FRUTOBalance } from './fruto-balance.js';
import { MOVE } from '../movement/config.js';
import { clamp, damp, lerp, smooth, wrapAngle } from '../core/math.js';
import { animateFormRig } from '../transformations/forms.js';

const motion = FRUTOMotion;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SIDES = [['E', 1], ['D', -1]];
const BLEND = { sink: 0.3, ground: 0.16, air: 0.14, climb: 0.2, hang: 0.16, mantle: 0.12, swim: 0.3, dive: 0.25, glide: 0.22, wallrun: 0.14, slide: 0.12, slopeSlide: 0.18, roll: 0.08, faint: 0.2 };

export class PlayerAnimator {
  constructor({ player, data, groundAt, audio, dust = null }) {
    this.dust = dust;
    this.player = player;
    this.body = player.body;
    this.data = data;
    this.groundAt = groundAt;
    this.audio = audio;
    this.balance = FRUTOBalance.create(THREE);
    this.walkPhase = 0;
    this.swimPhase = 0;
    this.stride = 0;
    this.runBlend = 0;
    this.swimBlend = 0;
    this.glide = 0;
    this.category = 'ground';
    this.entry = null;
    this.entryT = 0;
    this.entryDur = 0.16;
    this.flip = -1;
    this.lastStep = 0;
    this.lastStroke = 0;
    this.prevPos = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();
    this.prevVel = new THREE.Vector3();
    this.v = new THREE.Vector3();
    this.q = new THREE.Quaternion();
    this.hurt = 0;
    this.time = 0;
  }

  onEvent(name) {
    if (name === 'doubleJump') this.flip = 0;
    if (name === 'damage') this.hurt = 0.5;
    if (name === 'respawn') {
      this.balance.reset();
      this.entry = null;
    }
  }

  capture() {
    return this.data.segments.map((s) => {
      const j = this.body.joints[s.id];
      return [j.position.clone(), j.quaternion.clone()];
    });
  }

  blendTo(pose, w) {
    this.data.segments.forEach((s, i) => {
      const j = this.body.joints[s.id];
      j.position.lerp(pose[i][0], w);
      j.quaternion.slerp(pose[i][1], w);
    });
  }

  // Gira o corpo inteiro em torno de um ponto (no espaço do personagem)
  rotateAbout(axis, angle, center) {
    if (Math.abs(angle) < 1e-4) return;
    const j = this.body.joints.cintura;
    this.q.setFromAxisAngle(axis, angle);
    j.position.sub(center).applyQuaternion(this.q).add(center);
    j.quaternion.premultiply(this.q);
  }

  legIK(side, ankle, roll = 0) {
    const j = this.body.joints;
    const sign = side === 'E' ? 1 : -1;
    motion.twoBone(THREE, this.body, j['coxa_' + side], j['canela_' + side], j['pe_' + side], ankle, V(sign * 0.35, 0.95, 1.75), 0.73, 0.72, roll);
  }

  armIK(side, wrist, pole, pitch = 0) {
    const j = this.body.joints;
    motion.twoBone(THREE, this.body, j['braco_' + side], j['antebraco_' + side], j['mao_' + side], wrist, pole, 0.62, 0.635, pitch);
  }

  // Abaixa o quadril mantendo os pés onde estavam (dobra os joelhos)
  lowerPelvis(amount) {
    if (amount < 0.002) return;
    const j = this.body.joints;
    this.body.root.updateMatrixWorld(true);
    const ankles = SIDES.map(([side]) => this.body.root.worldToLocal(j['pe_' + side].getWorldPosition(V(0, 0, 0))));
    j.cintura.position.y -= amount;
    j.cintura.updateMatrixWorld(true);
    SIDES.forEach(([side], i) => this.legIK(side, ankles[i], 0));
  }

  update(dt, ctl, root) {
    this.time += dt;
    const t = this.time;
    const body = this.body;
    const j = body.joints;
    const state = ctl.state;
    body.root.position.copy(root);
    body.root.rotation.set(0, ctl.yaw, 0);

    // velocidade e aceleração vistas pela animação
    const speed = Math.hypot(ctl.vel.x, ctl.vel.z);
    if (dt > 0) {
      this.acceleration.set((ctl.vel.x - this.prevVel.x) / dt, 0, (ctl.vel.z - this.prevVel.z) / dt);
      this.acceleration.clampLength(0, 30);
    }
    this.prevVel.copy(ctl.vel);

    const category = state;
    if (category !== this.category) {
      this.entry = this.capture();
      this.entryT = 0;
      this.entryDur = BLEND[category] ?? 0.16;
      this.category = category;
      if (category !== 'ground') this.balance.reset();
    }

    const inWater = state === 'swim' || state === 'dive' || state === 'sink';
    this.swimBlend = lerp(this.swimBlend, inWater ? 1 : 0, damp(inWater ? 6 : 12, dt));
    const maxSpeed = state === 'swim' ? MOVE.swim : ctl.input?.sprint ? MOVE.sprint : MOVE.run;
    const groundLike = state === 'ground' || state === 'air';
    this.stride = lerp(this.stride, clamp(speed / maxSpeed, 0, 1.15), damp(12, dt));
    this.runBlend = lerp(this.runBlend, groundLike && state === 'ground' ? clamp((speed / MOVE.run - 1) / 0.47) : 0, damp(10, dt));
    if (state === 'ground') this.walkPhase += dt * speed * lerp(2.9, 2.28, this.runBlend);
    if (state === 'wallrun') this.walkPhase += dt * speed * 2.28;
    if (inWater) this.swimPhase += dt * lerp(2.62, 5.24, clamp(this.stride));
    this.glide = lerp(this.glide, state === 'glide' ? 1 : 0, damp(state === 'glide' ? 6 : 9, dt));
    // inclinação nas curvas pela velocidade de giro
    const turn = dt > 0 ? wrapAngle(ctl.yaw - (this.prevYaw ?? ctl.yaw)) / dt : 0;
    this.prevYaw = ctl.yaw;
    this.bank = lerp(this.bank ?? 0, clamp(-turn * 0.3, -0.55, 0.55) * (state === 'glide' ? 1 : 0), damp(5, dt));
    this.hurt = Math.max(0, this.hurt - dt);
    // forma de fera (atualização 21): o corpo do laboratório substitui o humano
    if (this.form) {
      this.player.setGlider(0, false);
      const ground = this.groundAt(root.x, root.z, root.y);
      const res = animateFormRig(this.form, {
        dt, clock: t, state, speed, maxSpeed: (state === 'swim' ? MOVE.swim : MOVE.run) * (ctl.speedMult ?? 1),
        action: !ctl.dash ? ctl.action : null, dash: ctl.dash, faint: state === 'faint' ? clamp(2.2 - ctl.faint, 0, 1.55) : 0,
        air: clamp(Math.max(0, root.y - ground) / 1.08), landing: ctl.landing, swimming: inWater, runBlend: this.runBlend,
      });
      this.formPose = res.id;
      this.form.face?.update(dt, { expression: ctl.action ? 'esforco' : 'neutro', look: { x: 0, y: 0 } });
      this.updateSounds(ctl, speed);
      this.updateBlob(ctl, root);
      return;
    }
    this.player.setGlider(this.glide, !!ctl.unlocks?.glide);
    this.player.glider.group.rotation.z = this.bank;

    let grounded = false;
    switch (state) {
      case 'ground':
        this.poseGround(dt, ctl, t);
        grounded = true;
        break;
      case 'air':
        this.poseAir(dt, ctl, t, root);
        break;
      case 'climb':
        this.poseClimb(ctl, t);
        break;
      case 'hang':
        this.poseHang(ctl, t);
        break;
      case 'mantle':
        this.poseMantle(ctl, t);
        break;
      case 'swim':
      case 'dive':
        this.poseSwim(ctl, t, state === 'dive');
        break;
      case 'sink':
        this.poseSink(ctl, t);
        break;
      case 'glide':
        this.poseGlide(ctl, t);
        break;
      case 'wallrun':
        this.poseWallRun(ctl, t);
        break;
      case 'slide':
      case 'slopeSlide':
        this.poseSlide(ctl, t, state === 'slopeSlide');
        break;
      case 'roll':
        this.poseRoll(ctl);
        break;
      case 'faint':
        motion.apply(THREE, body, this.data, { id: 'death', t: clamp(2.2 - ctl.faint, 0, 1.55) });
        break;
      default:
        motion.apply(THREE, body, this.data, { id: 'idle', t, clock: t });
    }

    // mistura com a pose anterior logo após trocar de estado
    if (this.entry) {
      this.entryT += dt;
      const u = clamp(this.entryT / this.entryDur);
      if (u >= 1) this.entry = null;
      else this.blendTo(this.entry, 1 - u * u * (3 - 2 * u));
    }

    // equilíbrio e pés no chão (só com os pés apoiados)
    if (grounded && !ctl.dash) {
      this.balance.apply(body, {
        dt, ground: this.groundAt, root: body.root, grounded: true, velocity: ctl.vel, acceleration: this.acceleration,
        landing: ctl.landing, gait: this.stride, phase: this.walkPhase, gravity: 19.6, attacking: !!ctl.action, stance: 'humana', species: null, flying: false,
      });
    } else this.balance.reset();

    this.updateEat(dt);
    const fruit = this.player.heldFruit;
    if (fruit && !this.eat) {
      const base = fruit.userData.baseScale ?? 0.72;
      fruit.rotation.y = Math.sin(t * 1.6) * 0.45;
      fruit.rotation.z = Math.sin(t * 2.3) * 0.08;
      fruit.position.y = Math.abs(Math.sin(t * 3.1)) * 0.04;
      fruit.scale.set(base * (1 + 0.04 * Math.sin(t * 2.6)), base * (1 - 0.04 * Math.sin(t * 2.6)), base);
    }
    this.updateFace(dt, ctl);
    this.updateSounds(ctl, speed);
    this.updateBlob(ctl, root);
  }

  // ===== Poses =====
  poseGround(dt, ctl, t) {
    const body = this.body;
    const dash = ctl.dash;
    const eating = this.eat;
    const action = !eating && !dash ? ctl.action : null; // golpe do laboratório (Jab, Direto, Gancho)
    motion.apply(THREE, body, this.data, {
      id: eating ? 'comer' : action ? action.clip : dash ? dash.clip : 'idle', t: eating ? eating.t : action ? action.t : dash ? dash.t : t, clock: t, phase: this.walkPhase,
      gait: eating || dash || action ? 0 : this.stride, runBlend: this.runBlend, swimBlend: 0, air: 0, landing: ctl.landing, dashDirection: dash?.relative,
    });
    // defesa: antebraços na frente do rosto, tronco encolhido
    this.guardBlend = lerp(this.guardBlend ?? 0, ctl.guarding && !action ? 1 : 0, damp(16, dt));
    const gb = this.guardBlend;
    if (gb > 0.01) {
      const jj = body.joints;
      jj.tronco.rotation.x += 0.16 * gb;
      jj.cabeca.rotation.x -= 0.12 * gb;
      for (const [side, sign] of SIDES) {
        jj['braco_' + side].rotation.x = lerp(jj['braco_' + side].rotation.x, -1.25, gb);
        jj['braco_' + side].rotation.z = lerp(jj['braco_' + side].rotation.z, sign * -0.35, gb);
        jj['antebraco_' + side].rotation.x = lerp(jj['antebraco_' + side].rotation.x, -1.75, gb);
        jj['antebraco_' + side].rotation.y = lerp(jj['antebraco_' + side].rotation.y, sign * 0.5, gb);
      }
    }
    // apanhou: o tronco vai para trás; atordoado: cambaleia
    const hit = this.hurt > 0 ? Math.sin((this.hurt / 0.5) * Math.PI) : 0;
    if (hit > 0.01) {
      body.joints.tronco.rotation.x -= 0.35 * hit;
      body.joints.cabeca.rotation.x -= 0.25 * hit;
    }
    if (ctl.stunned > 0) {
      body.joints.tronco.rotation.z += Math.sin(t * 7) * 0.12;
      body.joints.cabeca.rotation.x += 0.2;
    }
    // segurando uma fruta parado: o antebraço sobe para mostrá-la
    if (this.player.heldFruit && !eating && !dash) {
      const show = clamp(1 - ctl.speed / 1.2) * (1 - ctl.crouchBlend);
      body.joints.antebraco_D.rotation.x -= 0.75 * show;
      body.joints.braco_D.rotation.x -= 0.25 * show;
    }
    // correndo rápido o corpo inclina mais e os braços trabalham mais
    const fast = dash ? 0 : clamp((ctl.speed - 5.4) / 2.2) * (1 - ctl.crouchBlend);
    if (fast > 0.01) {
      const jj = body.joints;
      jj.tronco.rotation.x += 0.13 * fast;
      jj.cabeca.rotation.x -= 0.08 * fast;
      for (const [side, sign] of SIDES) {
        jj['antebraco_' + side].rotation.x -= 0.25 * fast;
        jj['braco_' + side].rotation.z += sign * 0.06 * fast;
      }
    }
    const c = ctl.crouchBlend;
    if (c > 0.01) {
      const j = body.joints;
      j.tronco.rotation.x += 0.32 * c;
      j.cabeca.rotation.x -= 0.22 * c;
      for (const [side, sign] of SIDES) {
        j['braco_' + side].rotation.x -= 0.35 * c;
        j['antebraco_' + side].rotation.x -= 0.45 * c;
        j['braco_' + side].rotation.z += sign * 0.12 * c;
      }
    }
    this.lowerPelvis(0.92 * c + 0.55 * ctl.landingHard);
  }

  poseAir(dt, ctl, t, root) {
    const body = this.body;
    const j = body.joints;
    const ground = this.groundAt(root.x, root.z, root.y);
    const height = Math.max(0, root.y - ground);
    const air = clamp(height / 1.08);
    const dash = ctl.dash;
    motion.apply(THREE, body, this.data, {
      id: dash ? dash.clip : 'idle', t: dash ? dash.t : t, clock: t, phase: this.walkPhase,
      gait: this.stride * 0.4, runBlend: 0, swimBlend: 0, air, landing: 0, dashDirection: dash?.relative,
    });
    const fall = clamp(-ctl.vel.y / 14);
    const free = smooth(MOVE.freeFallTime * 0.6, MOVE.freeFallTime, ctl.fallTime);
    for (const [side, sign] of SIDES) {
      j['braco_' + side].rotation.z += sign * (0.35 * fall + free * (1.1 + 0.25 * Math.sin(t * 9 + sign)));
      j['braco_' + side].rotation.x -= free * 0.6 * Math.sin(t * 7 + sign * 1.3);
    }
    if (free > 0.01) {
      // queda livre: pernas pedalando, corpo inclinado para a frente
      for (const [side, sign] of SIDES) {
        const s = Math.sin(t * 8 + (sign > 0 ? 0 : Math.PI));
        const ankle = V(sign * 0.34, 0.25 + 0.35 + 0.3 * s, 0.25 * s - 0.1);
        const before = [j['coxa_' + side].quaternion.clone(), j['canela_' + side].quaternion.clone(), j['pe_' + side].quaternion.clone()];
        this.legIK(side, ankle, 0);
        j['coxa_' + side].quaternion.slerp(before[0], 1 - free);
        j['canela_' + side].quaternion.slerp(before[1], 1 - free);
        j['pe_' + side].quaternion.slerp(before[2], 1 - free);
      }
      this.rotateAbout(V(1, 0, 0), 0.35 * free, V(0, 2, 0));
    }
    // salto duplo: cambalhota para a frente
    if (this.flip >= 0) {
      this.flip += dt / 0.52;
      const u = clamp(this.flip);
      const tuck = Math.sin(Math.PI * u);
      this.lowerPelvis(0.25 * tuck);
      for (const [side, sign] of SIDES) {
        const before = [j['coxa_' + side].quaternion.clone(), j['canela_' + side].quaternion.clone()];
        this.legIK(side, V(sign * 0.3, 0.25 + 0.95 * tuck, 0.45 * tuck), 0.4 * tuck);
        j['coxa_' + side].quaternion.slerp(before[0], 1 - tuck);
        j['canela_' + side].quaternion.slerp(before[1], 1 - tuck);
        j['braco_' + side].rotation.x -= 0.9 * tuck;
      }
      this.rotateAbout(V(1, 0, 0), Math.PI * 2 * smooth(0, 1, u), V(0, 2.0, 0));
      if (this.flip >= 1) this.flip = -1;
    }
    // deslizando na parede: mãos e pés contra ela
    if (ctl.wallSliding) {
      for (const [side, sign] of SIDES) {
        this.armIK(side, V(sign * 0.48, 3.05, 0.55), V(sign * 1.6, 2.4, 0.1), -0.4);
      }
    }
  }

  poseClimb(ctl, t) {
    const body = this.body;
    const j = body.joints;
    motion.reset(body, this.data.segments);
    const phase = ctl.climbDistance * 2.3;
    const s = Math.sin(phase);
    const lateral = ctl.climbMove?.x ?? 0;
    const breath = Math.sin(t * 2.4) * 0.015;
    j.cintura.position.z += 0.06;
    j.cintura.position.x += lateral * 0.07;
    j.cintura.position.y += breath;
    j.tronco.rotation.x += 0.08;
    j.cabeca.rotation.x -= 0.32;
    j.cintura.rotation.z += 0.05 * s;
    for (const [side, sign] of SIDES) {
      const k = side === 'E' ? s : -s;
      this.armIK(side, V(sign * 0.48 + lateral * 0.12, 3.55 + 0.34 * k, 0.5), V(sign * 1.6, 2.3, 0.1), -0.55);
      this.legIK(side, V(sign * 0.31 + lateral * 0.08, Math.max(0.3, 0.72 - 0.34 * k), 0.16), -0.35);
    }
  }

  poseHang(ctl, t) {
    const body = this.body;
    const j = body.joints;
    motion.reset(body, this.data.segments);
    const sway = Math.sin(t * 1.7);
    const shimmy = ctl.shimmy ?? 0;
    const step = Math.sin(ctl.climbDistance * 4.2);
    j.tronco.rotation.x += 0.06;
    j.cabeca.rotation.x -= 0.28;
    j.cintura.rotation.z -= shimmy * 0.06;
    for (const [side, sign] of SIDES) {
      const reach = shimmy * step * 0.12 * (side === 'E' ? 1 : -1);
      this.armIK(side, V(sign * 0.5 + reach, MOVE.hangOffset - 0.3, 0.5), V(sign * 1.4, 3.0, -0.4), -0.8);
      this.legIK(side, V(sign * 0.29 + shimmy * 0.12, 0.42 + 0.06 * sway, 0.18 + 0.12 * sway), -0.3);
    }
  }

  poseMantle(ctl, t) {
    const body = this.body;
    const j = body.joints;
    const mt = ctl.mantle;
    if (!mt) return;
    const u = clamp(mt.t / mt.duration);
    motion.apply(THREE, body, this.data, { id: 'idle', t, clock: t, phase: this.walkPhase, gait: 0, runBlend: 0, swimBlend: 0, air: 0, landing: 0 });
    const stand = this.capture();
    motion.reset(body, this.data.segments);
    const push = Math.sin(Math.PI * u);
    const handY = clamp(mt.topY - ctl.pos.y - 0.1, 0.9, MOVE.hangOffset - 0.3);
    j.tronco.rotation.x += 0.55 * push;
    j.cabeca.rotation.x -= 0.15 * push;
    for (const [side, sign] of SIDES) {
      this.armIK(side, V(sign * 0.52, handY, 0.62 - 0.2 * u), V(sign * 1.5, 2.6, -0.6), -1.0);
      const knee = side === 'E' ? 1.15 : 0.55;
      this.legIK(side, V(sign * 0.3, 0.25 + knee * push * clamp(mt.rise / 2.5), 0.35 * push), -0.2);
    }
    this.blendTo(stand, smooth(0.62, 1, u));
  }

  poseSwim(ctl, t, diving) {
    const body = this.body;
    const moving = Math.hypot(ctl.vel.x, ctl.vel.z) > 0.35 || diving;
    motion.apply(THREE, body, this.data, {
      id: moving ? 'swim' : 'tread', t, clock: t, phase: this.swimPhase, gait: diving ? Math.max(0.6, this.stride) : this.stride, swimBlend: this.swimBlend,
    });
    if (diving) {
      const pitch = clamp(-ctl.vel.y / 2.6, -1, 1) * 0.75;
      this.rotateAbout(V(1, 0, 0), pitch, V(0, 1.9, 0));
    }
  }

  // Usuário de fruta afundando: bate os braços sem conseguir subir
  poseSink(ctl, t) {
    const body = this.body;
    const j = body.joints;
    motion.apply(THREE, body, this.data, { id: 'tread', t, clock: t, phase: this.swimPhase, gait: 0.2, swimBlend: this.swimBlend });
    const k = Math.sin(t * 9);
    for (const [side, sign] of SIDES) {
      j['braco_' + side].rotation.z += sign * (1.2 + 0.35 * k * sign);
      j['braco_' + side].rotation.x -= 0.6 + 0.3 * Math.sin(t * 7 + sign);
    }
    j.cabeca.rotation.x -= 0.4;
  }

  // Começa a animação de comer do laboratório; morde em 0,98 s, 1,4 s e 1,82 s
  startEat({ fruit, onDone }) {
    this.eat = { t: 0, fruit, onDone, bites: 0 };
  }

  updateEat(dt) {
    const e = this.eat;
    if (!e) return;
    e.t += dt;
    const bites = [0.98, 1.4, 1.82].filter((at) => e.t >= at).length;
    if (bites !== e.bites) {
      e.bites = bites;
      e.fruit?.userData.setState?.(bites);
      this.audio?.play('base', 'step', 0.3);
    }
    if (e.t >= 3.12) {
      this.eat = null;
      e.onDone?.();
    }
  }

  // Piloto deitado sob a asa-delta, segurando a barra de controle; inclina nas curvas
  poseGlide(ctl, t) {
    const body = this.body;
    const j = body.joints;
    motion.apply(THREE, body, this.data, { id: 'idle', t, clock: t, phase: this.walkPhase, gait: 0, air: 1, swimBlend: 0 });
    const g = this.glide;
    for (const [side, sign] of SIDES) {
      this.legIK(side, V(sign * 0.22, 0.32, -0.32 + 0.04 * Math.sin(t * 2.2 + sign)), 0.6);
    }
    j.cabeca.rotation.x -= 0.75 * g;
    j.tronco.rotation.x -= 0.1 * g;
    this.rotateAbout(V(1, 0, 0), 1.12 * g, V(0, 2.2, 0));
    this.rotateAbout(V(0, 0, 1), this.bank * 0.6 * g, V(0, 2.6, 0));
    body.root.updateMatrixWorld(true);
    // mãos na barra (a barra fica em y 2,9 e z 1,2 com a asa aberta)
    const e = g * g * (3 - 2 * g);
    for (const [side, sign] of SIDES) {
      const target = V(sign * 0.5, lerp(2.4, 3.0, e) - this.bank * sign * 0.25, lerp(0.7, 1.08, e));
      this.armIK(side, target, V(sign * 1.5, 2.2, 0.4), -0.9);
    }
  }

  poseWallRun(ctl, t) {
    const body = this.body;
    motion.apply(THREE, body, this.data, { id: 'idle', t, clock: t, phase: this.walkPhase, gait: 1, runBlend: 1, swimBlend: 0, air: 0, landing: 0 });
    const side = ctl.wallRun?.side ?? 1;
    const j = body.joints;
    const sideName = side > 0 ? 'D' : 'E';
    j['braco_' + sideName].rotation.z -= (side > 0 ? -1 : 1) * 0.6;
    this.rotateAbout(V(0, 0, 1), -side * 0.42, V(0, 0.2, 0));
  }

  poseSlide(ctl, t, slope) {
    const body = this.body;
    const j = body.joints;
    motion.reset(body, this.data.segments);
    const k = slope ? 0.75 : 1;
    j.cintura.rotation.x -= 0.22 * k;
    j.tronco.rotation.x -= 0.18 * k;
    j.cabeca.rotation.x += 0.12 * k;
    j.cintura.position.y -= 1.12 * k;
    j.cintura.updateMatrixWorld(true);
    this.legIK('E', V(0.3, 0.25, 1.22 * k), 0.6);
    this.legIK('D', V(-0.32, 0.25, 0.05), -0.2);
    j.braco_E.rotation.set(-0.7, 0, 0.45);
    j.antebraco_E.rotation.x = -0.4;
    j.braco_D.rotation.set(0.25, 0, -1.05 - 0.05 * Math.sin(t * 20));
  }

  poseRoll(ctl) {
    const body = this.body;
    const j = body.joints;
    motion.reset(body, this.data.segments);
    const u = clamp((ctl.roll?.t ?? 0) / MOVE.rollTime);
    const tuck = Math.sin(Math.PI * clamp(u * 1.15));
    j.cintura.position.y -= 0.85 * tuck;
    j.tronco.rotation.x += 0.7 * tuck;
    j.cabeca.rotation.x += 0.5 * tuck;
    j.cintura.updateMatrixWorld(true);
    for (const [side, sign] of SIDES) {
      this.legIK(side, V(sign * 0.28, 0.25 + 0.75 * tuck, 0.5 * tuck), 0.3);
      this.armIK(side, V(sign * 0.32, 1.9 - 0.4 * tuck, 0.85), V(sign * 1.4, 2.2, -0.3), -0.6);
    }
    this.rotateAbout(V(1, 0, 0), Math.PI * 2 * smooth(0.05, 0.92, u), V(0, 1.25, 0));
  }

  // ===== Rosto, sons e sombra =====
  updateFace(dt, ctl) {
    const s = ctl.state;
    let expression = 'neutro';
    if (s === 'faint') expression = 'fechado';
    else if (s === 'sink') expression = ctl.underwater ? 'dor' : 'susto';
    else if (this.eat) expression = this.eat.t > 0.9 && this.eat.t < 2.2 ? 'fechado' : 'feliz';
    else if (this.hurt > 0) expression = 'dor';
    else if (s === 'air' && ctl.fallTime > MOVE.freeFallTime * 0.7) expression = 'susto';
    else if (s === 'dive' && ctl.submerged > 0.9) expression = ctl.breath < 8 ? 'dor' : 'folego';
    else if (['climb', 'hang', 'mantle'].includes(s) || (ctl.stamina.value < ctl.stamina.max * 0.25 && ctl.speed > 1)) expression = 'esforco';
    else if (s === 'glide' || s === 'wallrun' || s === 'slide') expression = 'feliz';
    const look = { x: 0, y: 0 };
    if (s === 'climb' || s === 'hang') look.y = 0.8;
    else if (s === 'air') look.y = clamp(ctl.vel.y / 10, -1, 0.6);
    if (ctl.wish?.mag > 0.2) {
      const rel = Math.atan2(ctl.wish.x, ctl.wish.z) - ctl.yaw;
      look.x = clamp(Math.sin(rel) * 1.6, -1, 1);
    }
    this.player.face.update(dt, { expression, look });
  }

  updateSounds(ctl, speed) {
    if (!this.audio) return;
    if (ctl.state === 'ground' && speed > 0.6) {
      const step = Math.floor(this.walkPhase / Math.PI);
      if (step !== this.lastStep) {
        this.lastStep = step;
        this.audio.play('base', ctl.inWater ? 'splash' : 'step', ctl.inWater ? 0.18 : 0.35 + 0.4 * this.runBlend);
        if (this.dust && speed > 5 && !ctl.inWater) {
          const side = step % 2 ? 'E' : 'D';
          const foot = this.body.joints['pe_' + side].getWorldPosition(this.v);
          foot.y = this.body.root.position.y;
          this.dust.puff(foot, { x: ctl.vel.x / speed, z: ctl.vel.z / speed }, clamp((speed - 5) / 2.6));
        }
      }
    } else this.lastStep = Math.floor(this.walkPhase / Math.PI);
    if (ctl.state === 'swim' && speed > 0.4) {
      const stroke = Math.floor(this.swimPhase / Math.PI);
      if (stroke !== this.lastStroke) {
        this.lastStroke = stroke;
        this.audio.play('base', 'splash', 0.22);
      }
    }
    if (ctl.state === 'climb' && ctl.climbDistance - (this.lastClimb ?? 0) > 1.3) {
      this.lastClimb = ctl.climbDistance;
      this.audio.play('base', 'step', 0.22);
    }
  }

  updateBlob(ctl, root) {
    const blob = this.player.blob;
    const g = this.groundAt(root.x, root.z, root.y + 0.5);
    const h = root.y - g;
    blob.visible = h < 14 && !['swim', 'dive'].includes(ctl.state);
    blob.position.set(root.x, g + 0.05, root.z);
    const s = clamp(1 - h / 14, 0.25, 1);
    blob.scale.setScalar(s * (1 - 0.35 * ctl.crouchBlend * 0));
    blob.material.opacity = 0.3 * s;
  }
}
