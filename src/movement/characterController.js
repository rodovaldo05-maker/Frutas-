// Controlador do personagem: cápsula cinemática do Rapier com consultas de chão, parede e
// borda. Estados: chão, ar, escalada, pendurado, subir borda, nado, mergulho, planar,
// corrida na parede, deslize, escorregar, rolamento e desmaio. A esquiva é uma camada por cima.
// Doc 04. Os números ficam em config.js e as regras puras em rules.js.

import * as THREE from 'three';
import { MOVE, STAMINA, GRAVITY, UNLOCKS_DEFAULT } from './config.js';
import { JumpGate, Stamina, groundSpeed, fallDamage, dashClip } from './rules.js';
import { GROUP_PLAYER, GROUP_WORLD, groups } from '../physics/physics.js';
import { clamp, damp, lerp, lerpAngle, smooth } from '../core/math.js';

const DEG = Math.PI / 180;
const UP = new THREE.Vector3(0, 1, 0);
const COS_WALKABLE = Math.cos(MOVE.maxClimbAngle * DEG);
const COS_SLIDE = Math.cos(MOVE.slopeSlideAngle * DEG);
const horizontal = (v) => {
  const l = Math.hypot(v.x, v.z) || 1;
  return new THREE.Vector3(v.x / l, 0, v.z / l);
};
const yawOf = (x, z) => Math.atan2(x, z);

export class CharacterController {
  constructor({ physics, water, unlocks = UNLOCKS_DEFAULT, onEvent = () => {} }) {
    this.physics = physics;
    this.water = water; // { heightAt(x, z) }
    this.unlocks = { ...unlocks };
    this.onEvent = onEvent;
    const R = physics.RAPIER;
    this.R = R;
    this.filter = groups(GROUP_PLAYER, GROUP_WORLD);

    const kcc = physics.world.createCharacterController(0.03);
    kcc.setUp({ x: 0, y: 1, z: 0 });
    kcc.setMaxSlopeClimbAngle(MOVE.maxClimbAngle * DEG);
    kcc.setMinSlopeSlideAngle(MOVE.slopeSlideAngle * DEG);
    kcc.enableAutostep(MOVE.stepHeight, 0.22, false);
    kcc.enableSnapToGround(MOVE.snapDistance);
    kcc.setApplyImpulsesToDynamicBodies(false);
    kcc.setSlideEnabled(true);
    this.kcc = kcc;
    this.halfHeight = MOVE.halfHeight;
    this.collider = physics.world.createCollider(
      R.ColliderDesc.capsule(MOVE.halfHeight, MOVE.radius).setCollisionGroups(groups(GROUP_PLAYER, GROUP_WORLD)),
    );

    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.state = 'ground';
    this.stateTime = 0;
    this.gate = new JumpGate();
    this.stamina = new Stamina();
    this.health = 100;
    this.maxHealth = 100;
    this.breath = MOVE.breath;
    // bônus do treino (Agilidade, Natação), aplicados com teto pelo serviço de progressão
    this.mods = { response: 1, airControl: 1, swimSpeed: 1, breath: 1 };
    this.reset();
  }

  reset() {
    this.vel.set(0, 0, 0);
    this.state = 'ground';
    this.stateTime = 0;
    this.grounded = true;
    this.groundNormal = new THREE.Vector3(0, 1, 0);
    this.groundTags = null;
    this.crouched = false;
    this.crouchBlend = 0;
    this.airJumps = 0;
    this.airDashUsed = false;
    this.airTime = 0;
    this.fallTime = 0;
    this.peakY = this.pos.y;
    this.jumpCut = true;
    this.glideArmed = false;
    this.grabCooldown = 0;
    this.wallRunCooldown = 0;
    this.wallJumpLock = 0;
    this.dash = null;
    this.dashCooldown = 0;
    this.invulnerable = 0;
    this.lockT = 0;
    this.landing = 0;
    this.landingHard = 0;
    this.rollBuffer = 0;
    this.vaultTimer = 0;
    this.climbIntent = 0;
    this.wall = null; // { normal, point }
    this.ledge = null;
    this.mantle = null;
    this.roll = null;
    this.slide = null;
    this.wallRun = null;
    this.wallSliding = false;
    this.climbDistance = 0;
    this.climbMove = { x: 0, y: 0 };
    this.shimmy = 0;
    this.surface = -Infinity;
    this.submerged = 0; // 0..1: cabeça embaixo d'água
    this.underwater = false;
    this.inWater = false;
    this.waterDepth = 0;
    this.faint = 0;
    this.damageCooldown = 0;
    this.lastDamage = 99;
    this.safe = this.pos.clone();
    this.safeTimer = 0;
    this.hangHold = 0;
    this.speed = 0;
    this.busyT = 0; // ocupado (comendo): sem movimento
    // combate (atualização 2): golpe em andamento, defesa e empurrões
    this.attackLock = 0; // golpeando: sem andar nem pular (a esquiva pode cancelar)
    this.action = null; // { clip, t } para a animação
    this.guarding = false; // segurando Defender
    this.stunned = 0; // atordoado (guarda quebrada)
    this.shoveV = new THREE.Vector3();
    this.shoveT = 0;
    this.sinkTime = 0;
    this.sinkTick = 0;
  }

  spawn(x, y, z, yaw = 0) {
    this.pos.set(x, y, z);
    this.yaw = yaw;
    this.reset();
    this.health = this.maxHealth;
    this.breath = this.breathMax;
    this.setCrouched(false, true);
    this.syncCollider();
    // assenta no chão
    const g = this.probeGround(40);
    if (g) this.pos.y = g.y + 0.02;
    this.syncCollider();
    this.safe.copy(this.pos);
  }

  // ===== Física =====
  syncCollider() {
    this.collider.setTranslation({ x: this.pos.x, y: this.pos.y + this.halfHeight + MOVE.radius, z: this.pos.z });
  }

  move(dx, dy, dz) {
    this.syncCollider();
    this.kcc.computeColliderMovement(this.collider, { x: dx, y: dy, z: dz }, this.R.QueryFilterFlags.EXCLUDE_SENSORS, this.filter);
    const m = this.kcc.computedMovement();
    this.pos.x += m.x;
    this.pos.y += m.y;
    this.pos.z += m.z;
    this.syncCollider();
    this.kccGrounded = this.kcc.computedGrounded();
    return m;
  }

  ray(ox, oy, oz, dx, dy, dz, len) {
    return this.physics.raycast({ x: ox, y: oy, z: oz }, { x: dx, y: dy, z: dz }, len);
  }

  probeGround(maxDown = 1.6, origin = this.pos) {
    const hit = this.ray(origin.x, origin.y + 1.0, origin.z, 0, -1, 0, 1.0 + maxDown);
    if (!hit) return null;
    return { y: hit.point.y, normal: hit.normal, tags: hit.tags, gap: origin.y - hit.point.y };
  }

  probeWall(dir, height = 2.0, reach = MOVE.radius + 0.35, origin = this.pos) {
    const hit = this.ray(origin.x, origin.y + height, origin.z, dir.x, 0, dir.z, reach);
    if (!hit || Math.abs(hit.normal.y) > 0.55 || hit.tags?.invisible) return null;
    return hit;
  }

  // Parede mais próxima em volta (para salto na parede e deslizar na parede)
  nearestWall(reach = MOVE.radius + 0.3) {
    let best = null;
    for (let k = 0; k < 8; k++) {
      const a = this.yaw + (k * Math.PI) / 4;
      for (const h of [1.4, 2.6]) {
        const hit = this.probeWall({ x: Math.sin(a), z: Math.cos(a) }, h, reach);
        if (hit && (!best || hit.distance < best.distance)) best = hit;
      }
    }
    return best;
  }

  // Borda à frente: topo plano entre minRise e maxRise acima dos pés, com face íngreme embaixo
  probeLedge(dir, minRise, maxRise, origin = this.pos) {
    const R = MOVE.radius;
    for (const ahead of [0.42, 0.8]) {
      const px = origin.x + dir.x * (R + ahead);
      const pz = origin.z + dir.z * (R + ahead);
      const startY = origin.y + maxRise + 0.3;
      const down = this.ray(px, startY, pz, 0, -1, 0, maxRise + 0.35 - minRise);
      if (!down || down.distance < 0.02 || down.normal.y < 0.62 || down.tags?.invisible) continue;
      const topY = down.point.y;
      const rise = topY - origin.y;
      if (rise < minRise || rise > maxRise) continue;
      const face = this.ray(origin.x, topY - 0.22, origin.z, dir.x, 0, dir.z, R + ahead + 0.12);
      if (!face || Math.abs(face.normal.y) > 0.5) continue;
      const n = horizontal(face.normal);
      // espaço para ficar de pé em cima (e profundidade do topo)
      const back = this.ray(face.point.x - n.x * 0.05, topY + 1.2, face.point.z - n.z * 0.05, -n.x, 0, -n.z, 3);
      const room = back ? back.distance : 3;
      if (room - R < 0.28) continue;
      const depth = Math.min(R + 0.12, room - R - 0.04);
      const sx = face.point.x - n.x * depth;
      const sz = face.point.z - n.z * depth;
      const up = this.ray(sx, topY + 0.05, sz, 0, 1, 0, 4.2);
      const headroom = up ? up.distance : 4.2;
      return {
        topY, rise, point: face.point, normal: n, tags: face.tags, stand: new THREE.Vector3(sx, topY + 0.02, sz),
        clear: headroom > 2 * (MOVE.halfHeight + R) + 0.05,
        crouchClear: headroom > 2 * (MOVE.crouchHalfHeight + R) + 0.05,
      };
    }
    return null;
  }

  headClear(halfHeight = MOVE.halfHeight) {
    const from = this.pos.y + 2 * (this.halfHeight + MOVE.radius) - 0.1;
    const need = 2 * (halfHeight + MOVE.radius) - (from - this.pos.y) + 0.05;
    if (need <= 0) return true;
    for (const [ox, oz] of [[0, 0], [0.4, 0], [-0.4, 0], [0, 0.4], [0, -0.4]]) {
      if (this.ray(this.pos.x + ox, from, this.pos.z + oz, 0, 1, 0, need)) return false;
    }
    return true;
  }

  setCrouched(on, force = false) {
    if (on === this.crouched && !force) return true;
    if (!on && !force && !this.headClear()) return false;
    this.crouched = on;
    this.halfHeight = on ? MOVE.crouchHalfHeight : MOVE.halfHeight;
    this.collider.setHalfHeight(this.halfHeight);
    this.syncCollider();
    return true;
  }

  setState(state) {
    if (state === this.state) return;
    const prev = this.state;
    this.state = state;
    this.stateTime = 0;
    if (['air', 'glide', 'wallrun', 'climb', 'hang', 'mantle', 'swim', 'dive', 'sink', 'faint'].includes(state)) this.kcc.disableSnapToGround();
    else this.kcc.enableSnapToGround(MOVE.snapDistance);
    if (state === 'air' && prev !== 'glide') {
      this.airTime = 0;
      this.fallTime = 0;
    }
    if (['climb', 'hang', 'mantle', 'wallrun', 'glide', 'swim', 'dive', 'sink'].includes(state)) this.peakY = this.pos.y;
    if (state !== 'climb') this.wall = state === 'wallrun' ? this.wall : null;
  }

  emit(name, data = {}) {
    this.onEvent(name, data);
  }

  damage(amount, reason) {
    if (amount <= 0 || this.faint > 0) return;
    this.health = Math.max(0, this.health - amount);
    this.lastDamage = 0;
    this.emit('damage', { amount, reason });
    if (this.health <= 0) {
      this.faint = 2.2;
      this.setState('faint');
      this.emit('faint', {});
    }
  }

  // Empurrão horizontal (investida do golpe, recuo ao apanhar)
  shove(x, z, duration = 0.18) {
    this.shoveV.set(x, 0, z);
    this.shoveT = duration;
  }

  // ===== Passo =====
  step(dt, input) {
    if (this.busyT > 0) {
      this.busyT -= dt;
      input = { ...input, moveX: 0, moveY: 0, jump: false, jumpPressed: false, crouch: false, crouchPressed: false, dashPressed: false };
    }
    this.stunned = Math.max(0, this.stunned - dt);
    if (this.attackLock > 0 || this.stunned > 0) {
      this.attackLock = Math.max(0, this.attackLock - dt);
      input = { ...input, moveX: 0, moveY: 0, jump: false, jumpPressed: false, crouch: false, crouchPressed: false, sprint: false, dashPressed: this.stunned > 0 ? false : input.dashPressed };
    }
    const camF = { x: Math.sin(input.camYaw), z: Math.cos(input.camYaw) };
    const camR = { x: -camF.z, z: camF.x };
    let wx = camF.x * input.moveY + camR.x * input.moveX;
    let wz = camF.z * input.moveY + camR.z * input.moveX;
    const wishMag = clamp(Math.hypot(input.moveX, input.moveY));
    const wl = Math.hypot(wx, wz);
    if (wl > 1e-4) {
      wx /= wl;
      wz /= wl;
    }
    this.wish = { x: wx, z: wz, mag: wishMag };
    this.input = input;
    this.camRight = camR;

    this.stateTime += dt;
    this.grabCooldown = Math.max(0, this.grabCooldown - dt);
    this.wallRunCooldown = Math.max(0, this.wallRunCooldown - dt);
    this.wallJumpLock = Math.max(0, this.wallJumpLock - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.lockT = Math.max(0, this.lockT - dt);
    this.rollBuffer = input.crouchPressed ? 0.3 : Math.max(0, this.rollBuffer - dt);
    this.landing = Math.max(0, this.landing - dt * 4.4);
    this.landingHard = Math.max(0, this.landingHard - dt * 2.6);
    this.lastDamage += dt;
    this.gate.update(dt, { grounded: ['ground', 'slide', 'slopeSlide'].includes(this.state), pressed: input.jumpPressed });

    this.updateWater();

    switch (this.state) {
      case 'ground': this.groundStep(dt); break;
      case 'air': this.airStep(dt); break;
      case 'climb': this.climbStep(dt); break;
      case 'hang': this.hangStep(dt); break;
      case 'mantle': this.mantleStep(dt); break;
      case 'swim': this.swimStep(dt); break;
      case 'dive': this.diveStep(dt); break;
      case 'sink': this.sinkStep(dt); break;
      case 'glide': this.glideStep(dt); break;
      case 'wallrun': this.wallRunStep(dt); break;
      case 'slide': this.slideStep(dt); break;
      case 'slopeSlide': this.slopeSlideStep(dt); break;
      case 'roll': this.rollStep(dt); break;
      case 'faint': this.faintStep(dt); break;
      default: this.setState('air');
    }

    // fôlego
    const sprinting = this.state === 'ground' && input.sprint && this.speed > MOVE.run + 0.3 && !this.crouched;
    if (sprinting) this.stamina.drain(STAMINA.sprint, dt);
    this.stamina.update(dt);

    // ar embaixo d'água
    if (this.state === 'dive' && this.submerged > 0.9) {
      this.breath = Math.max(0, this.breath - dt);
      if (this.breath <= 0) {
        this.damageCooldown -= dt;
        if (this.damageCooldown <= 0) {
          this.damage(MOVE.breathDamage, 'afogamento');
          this.damageCooldown = 1;
        }
      }
    } else this.breath = Math.min(this.breathMax, this.breath + dt * 6);

    // vida volta devagar fora de perigo
    if (this.lastDamage > 5 && this.health < this.maxHealth && this.state !== 'faint') this.health = Math.min(this.maxHealth, this.health + 4 * dt);

    // posição segura para reaparecer
    if (this.state === 'ground' && !this.inWater && this.groundNormal.y > 0.86 && !this.groundTags?.ramp) {
      this.safeTimer += dt;
      if (this.safeTimer > 0.6) {
        this.safe.copy(this.pos);
        this.safeTimer = 0;
      }
    }
    if (this.pos.y < -45 || !Number.isFinite(this.pos.y)) this.respawn();

    const targetCrouch = this.crouched || this.state === 'slide' || this.state === 'roll' ? 1 : 0;
    this.crouchBlend = lerp(this.crouchBlend, targetCrouch, damp(12, dt));
    this.speed = Math.hypot(this.vel.x, this.vel.z);
    if (this.dash) this.updateDashAnim(dt);
  }

  get breathMax() {
    return MOVE.breath * (this.mods?.breath ?? 1);
  }

  respawn() {
    const yaw = this.yaw;
    const health = Math.max(this.health, this.maxHealth * 0.6);
    this.spawn(this.safe.x, this.safe.y + 0.5, this.safe.z, yaw);
    this.health = health;
    this.emit('respawn', {});
  }

  updateWater() {
    const s = this.water.heightAt(this.pos.x, this.pos.z);
    this.surface = s;
    if (this.pos.y > s + 0.5) {
      this.inWater = false;
      this.waterDepth = 0;
      this.submerged = 0;
      this.underwater = false;
      return;
    }
    const floor = this.ray(this.pos.x, this.pos.y + 1.0, this.pos.z, 0, -1, 0, 60);
    const floorY = floor ? floor.point.y : -60;
    this.waterDepth = s - floorY;
    this.feetDepth = s - this.pos.y;
    const head = this.pos.y + 2 * (this.halfHeight + MOVE.radius) - 0.35;
    this.submerged = clamp((s - head + 0.4) / 0.8);
    this.underwater = s > this.pos.y + 3.55;
    this.inWater = this.feetDepth > 0.15;
  }

  deepEnough() {
    return this.waterDepth > MOVE.swimDepth + 0.25 && this.feetDepth > MOVE.swimDepth - 0.4;
  }

  turnToward(x, z, rate, dt) {
    if (Math.hypot(x, z) < 1e-4) return;
    this.yaw = lerpAngle(this.yaw, yawOf(x, z), damp(rate, dt));
  }

  // ===== Esquiva =====
  tryDash() {
    if (!this.input.dashPressed || this.dashCooldown > 0 || this.dash) return false;
    const inAir = this.state === 'air';
    if (inAir && (!this.unlocks.airDash || this.airDashUsed)) return false;
    const w = this.wish;
    const dir = w.mag > 0.15 ? new THREE.Vector3(w.x, 0, w.z) : new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const clip = dashClip(dir, this.yaw);
    this.dash = { t: 0, dir, clip: clip.id, relative: clip.relative, speed: MOVE.dashDistance / MOVE.dashTime, air: inAir };
    this.dashCooldown = MOVE.dashCooldown;
    this.invulnerable = MOVE.dashInvulnerable * (this.mods.dodgeTime ?? 1); // Reflexos alongam a esquiva
    if (inAir) {
      this.airDashUsed = true;
      this.vel.y = Math.max(this.vel.y, 0);
    }
    this.emit('dash', { air: inAir });
    return true;
  }

  // durante a esquiva a velocidade horizontal é a da esquiva
  applyDash(dt) {
    const d = this.dash;
    if (!d || d.t >= MOVE.dashTime) return false;
    const k = 1 - smooth(MOVE.dashTime * 0.6, MOVE.dashTime, d.t);
    this.vel.x = d.dir.x * d.speed * (0.35 + 0.65 * k);
    this.vel.z = d.dir.z * d.speed * (0.35 + 0.65 * k);
    if (d.air) this.vel.y = Math.max(this.vel.y, -1);
    return true;
  }

  updateDashAnim(dt) {
    this.dash.t += dt;
    if (this.dash.t > 0.4) this.dash = null;
  }

  // ===== Chão =====
  groundStep(dt) {
    const input = this.input;
    const w = this.wish;

    // agachar (fica agachado se não houver espaço para levantar)
    if (input.crouch) this.setCrouched(true);
    else if (this.crouched) this.setCrouched(false);

    // deslize
    if (input.crouchPressed && this.speed > MOVE.slideMinSpeed && !this.dash) {
      this.startSlide();
      return;
    }

    // pular
    if (this.gate.ready() && this.lockT <= 0) {
      this.jump(MOVE.jumpVelocity);
      return;
    }

    if (this.tryDash()) {
      /* a esquiva começa já neste passo */
    }

    // subir obstáculos baixos andando contra eles
    if (w.mag > 0.5 && !this.crouched && !this.dash) {
      const dir = { x: w.x, z: w.z };
      const ledge = this.probeLedge(dir, MOVE.stepHeight + 0.12, MOVE.vaultMax);
      if (ledge && ledge.normal.x * -dir.x + ledge.normal.z * -dir.z > 0.6) {
        const faceDist = Math.hypot(ledge.point.x - this.pos.x, ledge.point.z - this.pos.z);
        if (faceDist < MOVE.radius + 0.35 && (ledge.clear || ledge.crouchClear)) {
          this.vaultTimer += dt;
          if (this.vaultTimer > 0.12) {
            this.startMantle(ledge);
            return;
          }
        }
      } else this.vaultTimer = 0;

      // escalar: ir contra parede escalável
      const wall = this.probeWall(dir, 2.0, MOVE.radius + 0.3);
      if (wall && wall.tags?.climbable && this.stamina.available && horizontal(wall.normal).dot(new THREE.Vector3(-dir.x, 0, -dir.z)) > 0.62) {
        this.climbIntent += dt;
        if (this.climbIntent > 0.18) {
          this.startClimb(wall);
          return;
        }
      } else this.climbIntent = 0;
    } else {
      this.vaultTimer = 0;
      this.climbIntent = 0;
    }

    // velocidade
    const sprinting = input.sprint && this.stamina.available && !this.crouched;
    let target = groundSpeed(w.mag, { sprinting, crouched: this.crouched });
    if (this.inWater) target *= clamp(1 - this.feetDepth * 0.12, 0.55, 1); // água rasa
    if (this.lockT > 0) target *= 0.25;
    if (this.guarding) target = Math.min(target, MOVE.walk * 0.45); // defendendo: passos curtos
    // subida íngreme cansa um pouco (até 30% mais devagar)
    const gn = this.groundNormal;
    const uphill = Math.max(0, -(gn.x * w.x + gn.z * w.z));
    target *= 1 - 0.3 * Math.min(1, uphill / 0.72);
    if (this.shoveT > 0) {
      // investida do golpe ou recuo de quem apanhou
      this.shoveT -= dt;
      this.vel.x = this.shoveV.x;
      this.vel.z = this.shoveV.z;
      this.shoveV.multiplyScalar(Math.max(0, 1 - 9 * dt));
    } else if (!this.applyDash(dt)) {
      const cur = Math.hypot(this.vel.x, this.vel.z);
      const rate = (target > cur ? MOVE.drive : MOVE.brake) * this.mods.response;
      this.vel.x = lerp(this.vel.x, w.x * target, damp(rate, dt));
      this.vel.z = lerp(this.vel.z, w.z * target, damp(rate, dt));
      if (w.mag > 0.1) this.turnToward(w.x, w.z, MOVE.turnRate, dt);
    }
    // sem gravidade no chão: o "grudar no chão" do Rapier desce rampas e degraus, e o
    // movimento horizontal puro sobe rampas sem perder velocidade
    // o deslocamento segue o plano do chão, subindo e descendo rampas sem perder a
    // velocidade horizontal; um leve empurrão para baixo mantém o contato
    const ny = Math.max(0.5, gn.y);
    this.vel.y = 0;
    const along = gn.y >= COS_WALKABLE ? -(gn.x * this.vel.x + gn.z * this.vel.z) / ny : 0;
    const climb = Math.max(0, along);
    const m = this.move(this.vel.x * dt, climb * dt, this.vel.z * dt);
    // descida ou plano: assenta no chão num segundo passo, só para baixo
    if (climb <= 0) this.move(0, (along - 0.9) * dt, 0);
    // velocidade real (parede barra o movimento)
    if (dt > 0 && !this.dash) {
      const real = Math.hypot(m.x, m.z) / dt;
      const want = Math.hypot(this.vel.x, this.vel.z);
      if (want > 0.01 && real < want * 0.6) {
        this.vel.x = m.x / dt;
        this.vel.z = m.z / dt;
      }
    }

    const g = this.probeGround(MOVE.snapDistance + 0.1);
    if (g) {
      this.groundNormal.set(g.normal.x, g.normal.y, g.normal.z);
      this.groundTags = g.tags;
    }
    if (!this.kccGrounded && !(g && g.gap < MOVE.snapDistance)) {
      this.leaveGround();
      return;
    }
    this.grounded = true;
    this.airJumps = 0;
    this.airDashUsed = false;
    this.peakY = this.pos.y;

    // água funda: nadar
    if (this.inWater && this.deepEnough()) {
      this.enterWater(0);
      return;
    }
    // inclinação forte: escorrega
    if (g && g.gap < 0.3 && this.groundNormal.y < COS_SLIDE && !g.tags?.climbable) {
      this.setState('slopeSlide');
    }
  }

  leaveGround() {
    this.grounded = false;
    this.airFromJump = false;
    this.setState('air');
    this.vel.y = Math.min(this.vel.y, 0) * 0.2;
    this.jumpCut = true;
    this.peakY = this.pos.y;
    this.airSpeed = Math.max(Math.hypot(this.vel.x, this.vel.z), MOVE.run);
  }

  jump(v) {
    this.gate.consume();
    if (this.crouched) this.setCrouched(false);
    this.vel.y = v;
    this.grounded = false;
    this.jumpCut = false;
    this.setState('air');
    this.peakY = this.pos.y;
    this.airSpeed = Math.max(Math.hypot(this.vel.x, this.vel.z), MOVE.run);
    this.glideArmed = !this.unlocks.doubleJump;
    this.airFromJump = true;
    this.emit('jump', {});
  }

  // ===== Ar =====
  airStep(dt) {
    const input = this.input;
    const w = this.wish;
    this.airTime += dt;
    this.grounded = false;
    this.peakY = Math.max(this.peakY, this.pos.y);
    this.wallSliding = false;

    // coyote time: pular logo depois de sair da borda
    if (this.gate.ready()) {
      this.jump(MOVE.jumpVelocity);
      return;
    }

    // pulo curto ao soltar o botão
    if (!this.jumpCut && !input.jump && this.vel.y > 0) {
      this.vel.y *= 0.55;
      this.jumpCut = true;
    }

    const wall = this.nearestWall(MOVE.radius + 0.32);

    if (input.jumpPressed) {
      if (wall && this.airTime > 0.08) {
        this.wallJump(horizontal(wall.normal), 0);
        return;
      }
      if (this.unlocks.doubleJump && this.airJumps < 1 && this.stamina.spend(STAMINA.doubleJump)) {
        this.airJumps += 1;
        this.vel.y = MOVE.doubleJumpVelocity;
        this.jumpCut = true;
        this.glideArmed = true;
        this.airSpeed = Math.max(this.airSpeed, Math.hypot(this.vel.x, this.vel.z));
        this.gate.buffer = 0;
        this.emit('doubleJump', {});
      } else {
        this.glideArmed = true;
      }
    }

    // planar: segurar Pular caindo
    if (this.unlocks.glide && this.glideArmed && input.jump && this.vel.y < -1.2) {
      this.setState('glide');
      this.emit('glideStart', {});
      return;
    }

    this.tryDash();

    // agarrar bordas (automático) e subir obstáculos ao alcance
    if (this.grabCooldown <= 0 && this.vel.y < 3.2) {
      const dir = w.mag > 0.3 ? { x: w.x, z: w.z } : { x: Math.sin(this.yaw), z: Math.cos(this.yaw) };
      const low = this.probeLedge(dir, 0.35, MOVE.hangReachMin);
      if (low && (low.clear || low.crouchClear) && w.mag > 0.3 && low.normal.x * -dir.x + low.normal.z * -dir.z > 0.55) {
        this.startMantle(low);
        return;
      }
      const high = this.probeLedge(dir, MOVE.hangReachMin, MOVE.hangReachMax);
      if (high && high.normal.x * -dir.x + high.normal.z * -dir.z > 0.45) {
        this.startHang(high);
        return;
      }
    }

    // escalar parede escalável ao encostar indo contra ela
    if (wall && wall.tags?.climbable && this.grabCooldown <= 0 && this.stamina.available && w.mag > 0.3) {
      const n = horizontal(wall.normal);
      if (n.x * -w.x + n.z * -w.z > 0.55) {
        this.startClimb(wall);
        return;
      }
    }

    // correr na parede
    if (this.unlocks.wallRun && input.sprint && this.airFromJump && this.wallRunCooldown <= 0 && this.airTime < 0.6 && this.stamina.available) {
      const hs = Math.hypot(this.vel.x, this.vel.z);
      if (hs >= MOVE.wallRunMinSpeed) {
        const vd = { x: this.vel.x / hs, z: this.vel.z / hs };
        for (const side of [1, -1]) {
          const sd = { x: -vd.z * side, z: vd.x * side };
          const hit = this.probeWall(sd, 2.0, MOVE.radius + 0.7);
          if (hit && Math.abs(hit.normal.x * vd.x + hit.normal.z * vd.z) < 0.5) {
            this.startWallRun(hit, vd);
            return;
          }
        }
      }
    }

    // gravidade (mais forte na descida)
    const g = GRAVITY * (this.vel.y < 0 ? MOVE.fallGravityScale : 1);
    this.vel.y = Math.max(-MOVE.terminalVelocity, this.vel.y - g * dt);

    // deslizar na parede: cai devagar encostado indo contra ela
    if (wall && this.vel.y < 0 && w.mag > 0.3) {
      const n = horizontal(wall.normal);
      if (n.x * -w.x + n.z * -w.z > 0.3) {
        this.vel.y = Math.max(this.vel.y, -4.5);
        this.wallSliding = true;
        this.wall = { normal: n, point: wall.point };
      }
    }

    // controle no ar
    if (!this.applyDash(dt)) {
      if (w.mag > 0.1 && this.wallJumpLock <= 0) {
        const top = Math.max(this.airSpeed ?? MOVE.run, w.mag * MOVE.run);
        const k = damp(MOVE.airControl * this.mods.airControl * w.mag, dt);
        this.vel.x = lerp(this.vel.x, w.x * top, k);
        this.vel.z = lerp(this.vel.z, w.z * top, k);
        this.turnToward(w.x, w.z, MOVE.turnRate * 0.6, dt);
      } else {
        this.vel.x *= Math.exp(-0.35 * dt);
        this.vel.z *= Math.exp(-0.35 * dt);
      }
    }

    if (this.vel.y < -6) this.fallTime += dt;
    else this.fallTime = Math.max(0, this.fallTime - dt * 2);

    const vyBefore = this.vel.y;
    const want = { x: this.vel.x * dt, y: this.vel.y * dt, z: this.vel.z * dt };
    const m = this.move(want.x, want.y, want.z);
    if (dt > 0) {
      if (Math.abs(m.x) < Math.abs(want.x) - 1e-4) this.vel.x = m.x / dt;
      if (Math.abs(m.z) < Math.abs(want.z) - 1e-4) this.vel.z = m.z / dt;
      if (this.vel.y > 0 && m.y < want.y - 1e-4) this.vel.y = 0; // bateu a cabeça
    }

    // água
    if (this.inWater && this.deepEnough() && this.feetDepth > 1.4) {
      this.enterWater(vyBefore);
      return;
    }

    if (this.kccGrounded && this.vel.y <= 0) this.land(vyBefore);
  }

  wallJump(n, tangentSpeed = 0, tangent = null) {
    if (!this.stamina.spend(STAMINA.wallJump)) {
      this.vel.x = n.x * 2;
      this.vel.z = n.z * 2;
      this.setState('air');
      this.grabCooldown = 0.4;
      return;
    }
    this.vel.set(n.x * MOVE.wallJumpOut, MOVE.wallJumpUp, n.z * MOVE.wallJumpOut);
    if (tangent) {
      this.vel.x += tangent.x * tangentSpeed;
      this.vel.z += tangent.z * tangentSpeed;
    }
    this.yaw = yawOf(this.vel.x, this.vel.z);
    this.airJumps = 0;
    this.airDashUsed = false;
    this.jumpCut = true;
    this.glideArmed = false;
    this.wallJumpLock = 0.2;
    this.grabCooldown = 0.25;
    this.setState('air');
    this.airTime = 0.1;
    this.peakY = this.pos.y;
    this.airSpeed = Math.hypot(this.vel.x, this.vel.z);
    this.emit('wallJump', {});
  }

  land(vy) {
    const fall = this.peakY - this.pos.y;
    const rolled = this.rollBuffer > 0 || this.input.crouch;
    const dmg = this.invulnerable > 0 ? 0 : fallDamage(fall, rolled);
    this.landing = Math.min(1, Math.abs(vy) / 8.5);
    this.grounded = true;
    this.vel.y = 0;
    this.fallTime = 0;
    this.glideArmed = false;
    this.setState('ground');
    if (fall > MOVE.safeFall * 0.55 && rolled) {
      this.startRoll();
    } else if (fall > MOVE.safeFall) {
      this.lockT = MOVE.hardLandingLock;
      this.landingHard = 1;
    }
    if (dmg > 0) this.damage(dmg, 'queda');
    this.emit('land', { strength: this.landing, fall, hard: fall > MOVE.safeFall && !rolled });
  }

  // ===== Escalada =====
  startClimb(wall) {
    this.wall = { normal: horizontal(wall.normal), full: new THREE.Vector3(wall.normal.x, wall.normal.y, wall.normal.z), point: wall.point };
    this.vel.set(0, 0, 0);
    this.setCrouched(false, true);
    this.setState('climb');
    this.climbDistance = 0;
    this.yaw = yawOf(-this.wall.normal.x, -this.wall.normal.z);
    this.emit('grab', { kind: 'climb' });
  }

  climbStep(dt) {
    const input = this.input;
    const n = this.wall.normal;
    const into = { x: -n.x, z: -n.z };
    const hit = this.probeWall(into, 2.2, MOVE.radius + 0.9) || this.probeWall(into, 1.0, MOVE.radius + 0.9);
    if (!hit || !hit.tags?.climbable) {
      // acabou a parede: tenta subir a borda
      const ledge = this.probeLedge(into, 0.5, MOVE.hangReachMax);
      if (ledge && (ledge.clear || ledge.crouchClear)) this.startMantle(ledge);
      else this.dropFromWall(0.3);
      return;
    }
    // a parede virou encosta caminhável: volta a andar
    if (hit.normal.y > COS_WALKABLE - 0.04) {
      this.setState('ground');
      this.grounded = true;
      return;
    }
    n.copy(horizontal(hit.normal));
    this.wall.full.set(hit.normal.x, hit.normal.y, hit.normal.z);
    this.wall.point = hit.point;
    this.yaw = lerpAngle(this.yaw, yawOf(-n.x, -n.z), damp(10, dt));

    if (input.crouchPressed) {
      this.dropFromWall(0.45);
      return;
    }
    if (input.jumpPressed) {
      if (input.moveY > 0.6 && this.stamina.spend(STAMINA.wallJump * 0.6)) {
        // impulso para cima, gruda de novo
        this.vel.set(n.x * 0.4, 7.4, n.z * 0.4);
        this.setState('air');
        this.airTime = 0.1;
        this.jumpCut = true;
        this.emit('jump', { climb: true });
      } else this.wallJump(n);
      return;
    }

    // direcional: cima/baixo e para os lados no plano da parede
    const right = { x: n.z, z: -n.x };
    const lateral = input.moveX * (this.camRight.x * right.x + this.camRight.z * right.z >= 0 ? 1 : -1);
    const upMove = input.moveY;
    this.climbMove = { x: lateral, y: upMove };
    const moving = Math.hypot(lateral, upMove) > 0.15;
    this.stamina.drain(moving ? STAMINA.climbMoving : STAMINA.climb, dt);
    if (!this.stamina.available) {
      this.dropFromWall(0.8);
      return;
    }

    // "para cima" acompanha a inclinação da parede
    const f = this.wall.full;
    const upAlong = new THREE.Vector3(-f.x * f.y, 1 - f.y * f.y, -f.z * f.y).normalize();
    const v = MOVE.climbSpeed;
    let dx = (upAlong.x * upMove + right.x * lateral) * v * dt;
    let dy = upAlong.y * upMove * v * dt;
    let dz = (upAlong.z * upMove + right.z * lateral) * v * dt;
    const gap = hit.distance - (MOVE.radius + 0.06);
    dx += into.x * gap * Math.min(1, 10 * dt);
    dz += into.z * gap * Math.min(1, 10 * dt);
    const m = this.move(dx, dy, dz);
    this.climbDistance += Math.hypot(m.x, m.y, m.z);
    this.peakY = this.pos.y;

    // topo: sobe a borda
    if (upMove > 0.2) {
      const ledge = this.probeLedge(into, 1.6, MOVE.hangReachMax);
      if (ledge && (ledge.clear || ledge.crouchClear)) {
        this.startMantle(ledge);
        return;
      }
    }
    // chão embaixo: volta a andar
    if (upMove < -0.2) {
      const g = this.probeGround(0.3);
      if (g && g.gap < 0.12 && g.normal.y > COS_WALKABLE) {
        this.setState('ground');
        this.grounded = true;
      }
    }
  }

  dropFromWall(cooldown) {
    const n = this.wall?.normal ?? horizontal({ x: -Math.sin(this.yaw), z: -Math.cos(this.yaw) });
    this.vel.set(n.x * 1.2, 0, n.z * 1.2);
    this.grabCooldown = cooldown;
    this.jumpCut = true;
    this.setState('air');
  }

  // ===== Pendurado na borda =====
  startHang(ledge) {
    this.ledge = ledge;
    this.vel.set(0, 0, 0);
    this.setCrouched(false, true);
    this.setState('hang');
    this.hangHold = 0;
    this.placeOnLedge(ledge);
    this.yaw = yawOf(-ledge.normal.x, -ledge.normal.z);
    this.emit('grab', { kind: 'hang' });
  }

  placeOnLedge(ledge) {
    const n = ledge.normal;
    this.pos.set(ledge.point.x + n.x * (MOVE.radius + 0.05), ledge.topY - MOVE.hangOffset, ledge.point.z + n.z * (MOVE.radius + 0.05));
    this.syncCollider();
  }

  hangStep(dt) {
    const input = this.input;
    const ledge = this.ledge;
    const n = ledge.normal;
    this.peakY = this.pos.y;
    this.stamina.drain(STAMINA.hang, dt);
    if (!this.stamina.available || input.crouchPressed) {
      this.dropFromWall(0.5);
      return;
    }
    if (input.jumpPressed) {
      if (input.moveY < -0.5) {
        this.wallJump(n);
      } else if (ledge.clear || ledge.crouchClear) {
        this.startMantle(ledge);
      }
      return;
    }
    if (input.moveY > 0.55) {
      this.hangHold += dt;
      if (this.hangHold > 0.3 && (ledge.clear || ledge.crouchClear)) {
        this.startMantle(ledge);
        return;
      }
    } else this.hangHold = 0;

    // andar de lado pela borda
    const right = { x: n.z, z: -n.x };
    const lateral = input.moveX * (this.camRight.x * right.x + this.camRight.z * right.z >= 0 ? 1 : -1);
    this.shimmy = lerp(this.shimmy, Math.abs(lateral) > 0.2 ? lateral : 0, damp(10, dt));
    if (Math.abs(lateral) > 0.2) {
      const step = lateral * MOVE.shimmySpeed * dt;
      const next = this.pos.clone().add(new THREE.Vector3(right.x * step, 0, right.z * step));
      const into = { x: -n.x, z: -n.z };
      const found = this.probeLedge(into, MOVE.hangOffset - 0.45, MOVE.hangOffset + 0.45, next);
      if (found) {
        this.ledge = found;
        this.placeOnLedge(found);
        this.climbDistance += Math.abs(step);
      }
    } else {
      // confirma a borda (pode ter sumido)
      const into = { x: -n.x, z: -n.z };
      const found = this.probeLedge(into, MOVE.hangOffset - 0.45, MOVE.hangOffset + 0.45);
      if (!found) this.dropFromWall(0.4);
    }
  }

  // ===== Subir borda =====
  startMantle(ledge) {
    const rise = ledge.topY - this.pos.y;
    this.mantle = {
      from: this.pos.clone(),
      to: ledge.stand.clone(),
      t: 0,
      duration: MOVE.mantleTime * (0.5 + 0.5 * clamp(rise / 4.2)),
      rise,
      crouch: !ledge.clear,
      normal: ledge.normal.clone(),
      topY: ledge.topY,
    };
    this.vel.set(0, 0, 0);
    this.yaw = yawOf(-ledge.normal.x, -ledge.normal.z);
    this.setState('mantle');
    this.emit('mantle', { rise });
  }

  mantleStep(dt) {
    const mt = this.mantle;
    mt.t += dt;
    const u = clamp(mt.t / mt.duration);
    const yu = smooth(0, 0.68, u);
    const hu = smooth(0.32, 1, u);
    this.pos.set(lerp(mt.from.x, mt.to.x, hu), lerp(mt.from.y, mt.to.y + 0.04, yu), lerp(mt.from.z, mt.to.z, hu));
    this.syncCollider();
    this.peakY = this.pos.y;
    if (u >= 1) {
      if (mt.crouch) this.setCrouched(true, true);
      this.setState('ground');
      this.grounded = true;
      this.vel.set(-mt.normal.x * 1.2, 0, -mt.normal.z * 1.2);
      this.mantle = null;
      this.move(0, -0.05, 0);
    }
  }

  // ===== Água =====
  enterWater(vy) {
    this.setCrouched(false, true);
    if (this.waterCursed) {
      // usuário de fruta: não boia, afunda devagar (doc 03, 2.2)
      this.setState('sink');
      this.vel.y = Math.max(vy * 0.3, -4);
      this.sinkTime = 0;
      this.emit('splash', { strength: clamp(Math.abs(vy) / 14, 0.25, 1) });
      this.emit('sinking', {});
      return;
    }
    if (vy < -10) {
      this.setState('dive');
      this.vel.y = vy * 0.25;
    } else {
      this.setState('swim');
      this.vel.y = vy * 0.3;
    }
    this.emit('splash', { strength: clamp(Math.abs(vy) / 14, 0.25, 1) });
  }

  swimStep(dt) {
    const input = this.input;
    const w = this.wish;
    this.grounded = false;
    this.peakY = this.pos.y;
    this.airJumps = 0;
    this.airDashUsed = false;
    if (!this.inWater || this.waterDepth < MOVE.swimDepth) {
      const g = this.probeGround(0.6);
      if (g && g.gap < 0.5) {
        this.setState('ground');
        return;
      }
    }
    if (!this.inWater) {
      this.setState('air');
      return;
    }
    // mergulhar
    if (input.crouchPressed || (input.crouch && this.stateTime > 0.2)) {
      this.setState('dive');
      this.vel.y = -MOVE.dive;
      return;
    }
    // sair da água por uma borda baixa
    if (w.mag > 0.4) {
      const ledge = this.probeLedge({ x: w.x, z: w.z }, 0.3, this.surface + MOVE.swimExitLedge - this.pos.y);
      if (ledge && (ledge.clear || ledge.crouchClear) && ledge.normal.x * -w.x + ledge.normal.z * -w.z > 0.5) {
        this.startMantle(ledge);
        return;
      }
    }
    // barranco escalável: sai da água escalando
    if (w.mag > 0.4 && this.stamina.available && this.stateTime > 0.3) {
      const wall = this.probeWall({ x: w.x, z: w.z }, 2.4, MOVE.radius + 0.35);
      if (wall && wall.tags?.climbable && horizontal(wall.normal).dot(new THREE.Vector3(-w.x, 0, -w.z)) > 0.6) {
        this.startClimb(wall);
        return;
      }
    }
    // pulo para fora d'água
    if (input.jumpPressed && this.stamina.spend(10)) {
      this.vel.y = 7.2;
      this.pos.y = Math.max(this.pos.y, this.surface - MOVE.floatDraftMoving);
      this.jumpCut = true;
      this.setState('air');
      this.glideArmed = false;
      this.emit('jump', { water: true });
      this.emit('splash', { strength: 0.4 });
      return;
    }

    const sprint = input.sprint && this.stamina.available;
    if (sprint && w.mag > 0.3) this.stamina.drain(STAMINA.swimSprint, dt);
    const top = (sprint ? MOVE.swimSprint : MOVE.swim) * this.mods.swimSpeed * w.mag;
    const k = damp(MOVE.waterResponse, dt);
    this.vel.x = lerp(this.vel.x, w.x * top, k);
    this.vel.z = lerp(this.vel.z, w.z * top, k);
    if (w.mag > 0.1) this.turnToward(w.x, w.z, MOVE.turnRate * 0.55, dt);
    const drive = clamp(Math.hypot(this.vel.x, this.vel.z) / MOVE.swim);
    const draft = lerp(MOVE.floatDraft, MOVE.floatDraftMoving, drive);
    const target = this.surface - draft;
    this.vel.y = clamp((target - this.pos.y) * 5, -5, 4) + this.vel.y * Math.exp(-6 * dt) * 0.3;
    this.move(this.vel.x * dt, this.vel.y * dt, this.vel.z * dt);
  }

  diveStep(dt) {
    const input = this.input;
    const w = this.wish;
    this.grounded = false;
    this.peakY = this.pos.y;
    if (!this.inWater) {
      this.setState('air');
      return;
    }
    const sprint = input.sprint && this.stamina.available;
    if (sprint && w.mag > 0.3) this.stamina.drain(STAMINA.swimSprint, dt);
    const top = MOVE.dive * (sprint ? MOVE.diveSprint : 1) * this.mods.swimSpeed * w.mag;
    const k = damp(MOVE.waterResponse * 0.8, dt);
    this.vel.x = lerp(this.vel.x, w.x * top, k);
    this.vel.z = lerp(this.vel.z, w.z * top, k);
    const vertical = (input.jump ? 1 : 0) - (input.crouch ? 1 : 0);
    const vy = vertical !== 0 ? vertical * MOVE.dive * (sprint ? 1.3 : 1) : 0.45;
    this.vel.y = lerp(this.vel.y, vy, damp(3.5, dt));
    if (w.mag > 0.1) this.turnToward(w.x, w.z, MOVE.turnRate * 0.45, dt);
    this.move(this.vel.x * dt, this.vel.y * dt, this.vel.z * dt);
    // chegou à superfície
    if (this.stateTime > 0.4 && this.pos.y > this.surface - MOVE.floatDraft - 0.05 && this.vel.y >= 0 && !input.crouch) {
      this.setState('swim');
      return;
    }
    // fundo raso: fica de pé
    if (this.waterDepth < MOVE.swimDepth && this.kccGrounded) this.setState('ground');
  }

  // ===== Afundando (usuário de fruta na água funda) =====
  sinkStep(dt) {
    const w = this.wish;
    this.grounded = false;
    this.peakY = this.pos.y;
    if (!this.inWater) {
      this.setState('air');
      return;
    }
    if (this.waterDepth < MOVE.swimDepth) {
      const g = this.probeGround(0.6);
      if (g && g.gap < 0.5) {
        this.setState('ground');
        return;
      }
    }
    // ainda dá para se agarrar numa borda ao alcance ou num barranco escalável
    if (w.mag > 0.4) {
      const ledge = this.probeLedge({ x: w.x, z: w.z }, 0.3, MOVE.hangReachMax);
      if (ledge && (ledge.clear || ledge.crouchClear) && ledge.normal.x * -w.x + ledge.normal.z * -w.z > 0.5) {
        this.startMantle(ledge);
        return;
      }
    }
    const top = MOVE.swim * 0.4 * w.mag;
    const k = damp(MOVE.waterResponse * 0.6, dt);
    this.vel.x = lerp(this.vel.x, w.x * top, k);
    this.vel.z = lerp(this.vel.z, w.z * top, k);
    this.vel.y = lerp(this.vel.y, -1.4, damp(2, dt));
    if (w.mag > 0.1) this.turnToward(w.x, w.z, MOVE.turnRate * 0.3, dt);
    this.move(this.vel.x * dt, this.vel.y * dt, this.vel.z * dt);
    if (this.kccGrounded) this.vel.y = 0;
    this.stamina.drain(10, dt);
    // dano: 7% da vida máxima a cada 0,5 s depois de 2 s submerso
    if (this.underwater) {
      this.sinkTime += dt;
      if (this.sinkTime > 2) {
        this.sinkTick -= dt;
        if (this.sinkTick <= 0) {
          this.sinkTick = 0.5;
          this.damage(this.maxHealth * 0.07, 'água');
        }
      }
    } else {
      this.sinkTime = Math.max(0, this.sinkTime - dt * 2);
      this.sinkTick = 0;
    }
  }

  // ===== Planar =====
  glideStep(dt) {
    const input = this.input;
    const w = this.wish;
    this.peakY = this.pos.y;
    if (!input.jump || input.crouchPressed) {
      this.setState('air');
      this.emit('glideEnd', {});
      return;
    }
    if (w.mag > 0.2) this.yaw = lerpAngle(this.yaw, yawOf(w.x, w.z), damp(2.4, dt));
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const k = damp(2.2, dt);
    this.vel.x = lerp(this.vel.x, fx * MOVE.glideForward, k);
    this.vel.z = lerp(this.vel.z, fz * MOVE.glideForward, k);
    this.vel.y = lerp(this.vel.y, -MOVE.glideFall, damp(3, dt));
    const want = { x: this.vel.x * dt, y: this.vel.y * dt, z: this.vel.z * dt };
    const m = this.move(want.x, want.y, want.z);
    if (this.inWater && this.deepEnough() && this.feetDepth > 1.2) {
      this.emit('glideEnd', {});
      this.enterWater(this.vel.y);
      return;
    }
    if (this.kccGrounded) {
      this.emit('glideEnd', {});
      this.land(this.vel.y);
      return;
    }
    // bateu de frente
    if (Math.hypot(m.x, m.z) < Math.hypot(want.x, want.z) * 0.4) {
      this.setState('air');
      this.emit('glideEnd', {});
    }
  }

  // ===== Correr na parede =====
  startWallRun(hit, vd) {
    const n = horizontal(hit.normal);
    const t = new THREE.Vector3(vd.x, 0, vd.z).addScaledVector(n, -(vd.x * n.x + vd.z * n.z)).normalize();
    this.wallRun = { normal: n, tangent: t, t: 0, speed: Math.max(MOVE.sprint * 1.15, Math.hypot(this.vel.x, this.vel.z)) };
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    this.wallRun.side = (-n.x) * -fz + (-n.z) * fx > 0 ? 1 : -1; // 1 = parede à direita
    this.vel.y = 3.6;
    this.setState('wallrun');
    this.emit('grab', { kind: 'wallrun' });
  }

  wallRunStep(dt) {
    const input = this.input;
    const wr = this.wallRun;
    wr.t += dt;
    this.peakY = this.pos.y;
    const into = { x: -wr.normal.x, z: -wr.normal.z };
    const hit = this.probeWall(into, 2.0, MOVE.radius + 0.9);
    this.stamina.drain(STAMINA.wallRun, dt);
    if (input.jumpPressed) {
      this.wallRunCooldown = 0.35;
      this.wallJump(wr.normal, wr.speed * 0.75, wr.tangent);
      return;
    }
    if (!hit || wr.t > MOVE.wallRunTime || !this.stamina.available || input.crouchPressed) {
      this.wallRunCooldown = 0.5;
      this.vel.set(wr.tangent.x * wr.speed * 0.9 + wr.normal.x * 1.2, Math.max(this.vel.y, 1.5), wr.tangent.z * wr.speed * 0.9 + wr.normal.z * 1.2);
      this.airSpeed = wr.speed * 0.9;
      this.setState('air');
      this.airTime = 1;
      return;
    }
    wr.normal.copy(horizontal(hit.normal));
    const gap = hit.distance - (MOVE.radius + 0.08);
    this.vel.y -= GRAVITY * MOVE.wallRunGravity * dt * (1 + wr.t);
    this.vel.x = wr.tangent.x * wr.speed;
    this.vel.z = wr.tangent.z * wr.speed;
    this.yaw = lerpAngle(this.yaw, yawOf(wr.tangent.x, wr.tangent.z), damp(12, dt));
    const m = this.move(this.vel.x * dt + into.x * gap * Math.min(1, 10 * dt), this.vel.y * dt, this.vel.z * dt + into.z * gap * Math.min(1, 10 * dt));
    if (this.kccGrounded && this.vel.y <= 0) {
      this.land(this.vel.y);
      return;
    }
    if (Math.hypot(m.x, m.z) < wr.speed * dt * 0.3) {
      this.setState('air');
      this.wallRunCooldown = 0.5;
    }
  }

  // ===== Deslize =====
  startSlide() {
    this.setCrouched(true, true);
    const hs = Math.hypot(this.vel.x, this.vel.z) || 1;
    this.slide = { dir: new THREE.Vector3(this.vel.x / hs, 0, this.vel.z / hs), speed: Math.min(hs * MOVE.slideBoost, 9), t: 0 };
    this.setState('slide');
    this.emit('slide', {});
  }

  slideStep(dt) {
    const input = this.input;
    const s = this.slide;
    s.t += dt;
    const g = this.probeGround(MOVE.snapDistance + 0.1);
    const n = g ? g.normal : { x: 0, y: 1, z: 0 };
    // descida acelera, subida freia
    const downhill = n.x * s.dir.x + n.z * s.dir.z; // sen da inclinação na direção do deslize
    s.speed += (GRAVITY * downhill * 0.85 - MOVE.slideFriction * (downhill > 0.08 ? 0.4 : 1)) * dt;
    s.speed = Math.min(s.speed, 14);
    if (this.wish.mag > 0.2) {
      const target = yawOf(this.wish.x, this.wish.z);
      const cur = yawOf(s.dir.x, s.dir.z);
      const yaw = lerpAngle(cur, target, damp(1.4, dt));
      s.dir.set(Math.sin(yaw), 0, Math.cos(yaw));
    }
    this.yaw = lerpAngle(this.yaw, yawOf(s.dir.x, s.dir.z), damp(10, dt));
    this.vel.set(s.dir.x * s.speed, 0, s.dir.z * s.speed);
    if (this.gate.ready()) {
      this.jump(MOVE.jumpVelocity);
      this.airSpeed = s.speed;
      return;
    }
    const m = this.move(this.vel.x * dt, this.vel.y * dt, this.vel.z * dt);
    if (Math.hypot(m.x, m.z) < s.speed * dt * 0.3) s.speed *= 0.5; // bateu
    if (!this.kccGrounded && !(g && g.gap < MOVE.snapDistance)) {
      this.leaveGround();
      return;
    }
    if (this.inWater && this.deepEnough()) {
      this.enterWater(0);
      return;
    }
    const done = s.speed < MOVE.crouch + 0.4 || (s.t > MOVE.slideTime && downhill < 0.08 && !input.crouch) || s.t > 4;
    if (done) {
      this.setState('ground');
      if (!input.crouch) this.setCrouched(false);
      this.vel.x = s.dir.x * Math.min(s.speed, MOVE.run);
      this.vel.z = s.dir.z * Math.min(s.speed, MOVE.run);
    }
  }

  // ===== Escorregar em rampa íngreme =====
  slopeSlideStep(dt) {
    const g = this.probeGround(MOVE.snapDistance + 0.2);
    if (!g || g.gap > MOVE.snapDistance) {
      this.leaveGround();
      return;
    }
    const n = g.normal;
    this.groundNormal.set(n.x, n.y, n.z);
    if (n.y > COS_WALKABLE) {
      this.setState('ground');
      return;
    }
    const down = horizontal(n);
    this.vel.x = lerp(this.vel.x, down.x * 6 + this.wish.x * 1.2, damp(3, dt));
    this.vel.z = lerp(this.vel.z, down.z * 6 + this.wish.z * 1.2, damp(3, dt));
    this.vel.y = -6;
    this.turnToward(down.x, down.z, 6, dt);
    if (this.gate.ready()) {
      this.jump(MOVE.jumpVelocity * 0.75);
      return;
    }
    this.move(this.vel.x * dt, this.vel.y * dt, this.vel.z * dt);
  }

  // ===== Rolamento =====
  startRoll() {
    this.setCrouched(true, true);
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    this.roll = { t: 0, speed: Math.max(Math.hypot(this.vel.x, this.vel.z), 4.2), dir: new THREE.Vector3(fx, 0, fz) };
    this.setState('roll');
    this.emit('roll', {});
  }

  rollStep(dt) {
    const r = this.roll;
    r.t += dt;
    const k = 1 - smooth(MOVE.rollTime * 0.5, MOVE.rollTime, r.t);
    this.vel.set(r.dir.x * r.speed * (0.45 + 0.55 * k), 0, r.dir.z * r.speed * (0.45 + 0.55 * k));
    this.move(this.vel.x * dt, this.vel.y * dt, this.vel.z * dt);
    if (r.t >= MOVE.rollTime) {
      this.setState('ground');
      if (!this.input.crouch) this.setCrouched(false);
    }
    if (!this.kccGrounded) {
      const g = this.probeGround(MOVE.snapDistance);
      if (!g) this.leaveGround();
    }
  }

  // ===== Desmaio =====
  faintStep(dt) {
    this.faint -= dt;
    this.vel.set(0, -4, 0);
    this.move(0, -4 * dt, 0);
    if (this.faint <= 0) {
      this.health = this.maxHealth;
      this.spawn(this.safe.x, this.safe.y + 0.5, this.safe.z, this.yaw);
      this.emit('respawn', {});
    }
  }

  // Resumo para o HUD e o salvamento
  snapshot() {
    return {
      x: +this.pos.x.toFixed(3), y: +this.pos.y.toFixed(3), z: +this.pos.z.toFixed(3), yaw: +this.yaw.toFixed(3),
      health: Math.round(this.health), stamina: Math.round(this.stamina.value), staminaMax: this.stamina.max,
      safe: { x: +this.safe.x.toFixed(3), y: +this.safe.y.toFixed(3), z: +this.safe.z.toFixed(3) },
    };
  }
}
