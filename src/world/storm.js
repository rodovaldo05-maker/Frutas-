// Tempestade da travessia (atualização 17): chuva caindo em volta da câmera, céu escurecendo,
// ondas maiores (Ocean.setStorm) e relâmpagos (clarão rápido na luz do céu). A intensidade
// sobe e desce suave; com "Atenuar clarões" o clarão é bem mais fraco.

import * as THREE from 'three';

const DROPS = 700;

export class Storm {
  constructor(scene) {
    this.k = 0; // intensidade atual 0..1
    this.target = 0;
    this.flashT = 0;
    this.flashK = 1;
    const pos = new Float32Array(DROPS * 6);
    this.seeds = new Float32Array(DROPS * 3);
    for (let i = 0; i < DROPS; i++) {
      this.seeds[i * 3] = (Math.random() - 0.5) * 60;
      this.seeds[i * 3 + 1] = Math.random() * 30;
      this.seeds[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.rain = new THREE.LineSegments(this.geo, new THREE.LineBasicMaterial({ color: '#b8c8d8', transparent: true, opacity: 0, depthWrite: false }));
    this.rain.frustumCulled = false;
    this.rain.visible = false;
    this.rain.renderOrder = 5;
    scene.add(this.rain);
    this.time = 0;
  }

  // true/false ou intensidade 0..1 (clima: chuva 0,45, tempestade 0,85; travessia 1)
  set(on) {
    this.target = typeof on === 'number' ? Math.max(0, Math.min(1, on)) : on ? 1 : 0;
  }

  // relâmpago: clarão que some em 0,25 s
  flash(strength = 1) {
    this.flashT = 0.25;
    this.flashK = strength;
  }

  // brilho extra do céu agora (0 sem clarão)
  get flashLight() {
    return this.flashT > 0 ? (this.flashT / 0.25) * this.flashK : 0;
  }

  update(dt, camera) {
    this.time += dt;
    this.k += Math.sign(this.target - this.k) * Math.min(Math.abs(this.target - this.k), dt * 0.4);
    this.flashT = Math.max(0, this.flashT - dt);
    this.rain.visible = this.k > 0.02;
    if (!this.rain.visible) return;
    this.rain.material.opacity = 0.55 * this.k;
    const p = this.geo.attributes.position.array;
    const cx = camera.position.x;
    const cy = camera.position.y;
    const cz = camera.position.z;
    const fall = 38;
    const n = Math.floor(DROPS * (0.3 + 0.7 * this.k));
    for (let i = 0; i < DROPS; i++) {
      const o = i * 6;
      if (i >= n) {
        p[o] = p[o + 3] = cx;
        p[o + 1] = p[o + 4] = -999;
        p[o + 2] = p[o + 5] = cz;
        continue;
      }
      // cada gota cai em ciclo (posição relativa à câmera, sem criar objetos)
      const sx = this.seeds[i * 3];
      const sz = this.seeds[i * 3 + 2];
      const y = 18 - ((this.seeds[i * 3 + 1] + this.time * fall) % 30);
      const x = cx + sx;
      const z = cz + sz;
      p[o] = x;
      p[o + 1] = cy + y;
      p[o + 2] = z;
      p[o + 3] = x - 0.25;
      p[o + 4] = cy + y - 1.4;
      p[o + 5] = z - 0.1;
    }
    this.geo.attributes.position.needsUpdate = true;
  }
}
