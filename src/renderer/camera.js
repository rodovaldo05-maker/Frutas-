// Câmera de exploração em terceira pessoa (doc 04, seção 2): segue com atraso suave,
// arrastar gira, aproxima em vez de atravessar paredes e se ajeita atrás do personagem
// quando ele anda por um tempo sem o jogador mexer na câmera.

import * as THREE from 'three';
import { clamp, damp, lerp, lerpAngle, wrapAngle } from '../core/math.js';

const DISTANCE = { sink: 8.4, ground: 8.6, air: 9.2, climb: 9.6, hang: 9, mantle: 9, swim: 8.4, dive: 8, glide: 11, wallrun: 9.6, slide: 8.4, slopeSlide: 8.6, roll: 8.6, faint: 9, boat: 14 };

export class FollowCamera {
  constructor(camera, physics) {
    this.camera = camera;
    this.physics = physics;
    this.yaw = Math.PI;
    this.pitch = 0.32;
    this.distance = 8.6;
    this.zoom = 1;
    this.target = new THREE.Vector3();
    this.smoothTarget = new THREE.Vector3();
    this.idleLook = 10;
    this.sensitivity = 1;
    this.invertY = false;
    this.reduceMotion = false;
    this.underwater = false;
    this.ready = false;
    this.fovKick = 0;
  }

  snap(pos, yaw) {
    this.yaw = yaw;
    this.smoothTarget.set(pos.x, pos.y + 2.9, pos.z);
    this.ready = true;
  }

  // dx, dy em pixels de arrasto (ou do analógico já escalado)
  look(dx, dy) {
    if (!dx && !dy) return;
    const k = 0.0042 * this.sensitivity;
    this.yaw -= dx * k;
    this.pitch = clamp(this.pitch + dy * k * (this.invertY ? -1 : 1), -0.42, 1.25);
    this.idleLook = 0;
  }

  zoomBy(delta) {
    this.zoom = clamp(this.zoom + delta, 0.6, 1.5);
  }

  update(dt, ctl, pos, water) {
    const state = ctl.state;
    this.idleLook += dt;
    const height = 2.9 - 1.05 * ctl.crouchBlend - (state === 'swim' ? 0.9 : 0) - (state === 'slide' ? 0.6 : 0);
    this.target.set(pos.x, pos.y + height, pos.z);
    if (!this.ready) this.snap(pos, this.yaw);
    // segue rápido no plano e mais devagar na altura (sem sacudir nos degraus)
    this.smoothTarget.x = lerp(this.smoothTarget.x, this.target.x, damp(16, dt));
    this.smoothTarget.z = lerp(this.smoothTarget.z, this.target.z, damp(16, dt));
    this.smoothTarget.y = lerp(this.smoothTarget.y, this.target.y, damp(state === 'ground' ? 9 : 14, dt));

    // volta para trás do personagem quando ele anda sozinho por um tempo
    const speed = Math.hypot(ctl.vel.x, ctl.vel.z);
    if (!this.reduceMotion && this.idleLook > 1.6 && speed > 1.5 && state !== 'climb' && state !== 'hang') {
      const behind = Math.atan2(ctl.vel.x, ctl.vel.z);
      const diff = Math.abs(wrapAngle(behind - this.yaw));
      if (diff < 2.2) this.yaw = lerpAngle(this.yaw, behind, damp(0.9 * clamp(speed / 6), dt));
    }

    const want = ((DISTANCE[state] ?? 8.6) + (state === 'ground' ? Math.max(0, speed - 4.5) * 0.25 : 0)) * this.zoom;
    this.distance = lerp(this.distance, want, damp(3, dt));
    const cp = Math.cos(this.pitch);
    const dir = new THREE.Vector3(Math.sin(this.yaw) * cp, -Math.sin(this.pitch), Math.cos(this.yaw) * cp);

    // colisão: aproxima em vez de atravessar
    let dist = this.distance;
    const from = this.smoothTarget;
    const hit = this.physics.raycast({ x: from.x, y: from.y, z: from.z }, { x: -dir.x, y: -dir.y, z: -dir.z }, dist + 0.4);
    if (hit && !hit.tags?.invisible) dist = Math.max(1.1, hit.distance - 0.45);
    this.collided = dist;
    this.currentDist = lerp(this.currentDist ?? dist, dist, damp(dist < (this.currentDist ?? dist) ? 30 : 5, dt));

    const cam = this.camera;
    cam.position.copy(from).addScaledVector(dir, -this.currentDist);
    // nunca abaixo do terreno de uma vez: a água decide se a vista está submersa
    const surface = water.heightAt(cam.position.x, cam.position.z);
    this.underwater = cam.position.y < surface - 0.05;
    cam.lookAt(from.x, from.y, from.z);

    // sensação de velocidade: o campo de visão abre conforme a corrida
    const rush = state === 'ground' || state === 'slide' || state === 'wallrun' ? Math.min(1, Math.max(0, (speed - 4.2) / 3.4)) : state === 'glide' ? 0.8 : 0;
    this.fovKick = lerp(this.fovKick, this.reduceMotion ? 0 : 8 * rush, damp(4, dt));
    const base = cam.aspect < 1.3 ? 66 : 58;
    if (Math.abs(cam.fov - (base + this.fovKick)) > 0.01) {
      cam.fov = base + this.fovKick;
      cam.updateProjectionMatrix();
    }
  }
}
