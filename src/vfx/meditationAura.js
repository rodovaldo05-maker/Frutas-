// Aura da meditação da fruta: uma casca de energia na cor da fruta envolvendo o corpo sentado
// (pulsa com a respiração), uma flor de lótus de energia aberta no chão e faíscas subindo em
// volta. A explosão da subida de nível sai daqui também (anel, coluna e estilhaços na cor).

import * as THREE from 'three';

const additive = (color, opacity, side = THREE.FrontSide) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side });

export class MeditationAura {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'aura_meditacao';
    this.group.visible = false;
    scene.add(this.group);
    this.color = new THREE.Color('#ffffff');
    // casca: duas camadas (por fora e por dentro) para parecer energia em volta do corpo
    const shellGeo = new THREE.SphereGeometry(1, 20, 14);
    this.outer = new THREE.Mesh(shellGeo, additive('#ffffff', 0.16, THREE.BackSide));
    this.inner = new THREE.Mesh(shellGeo, additive('#ffffff', 0.08));
    for (const m of [this.outer, this.inner]) {
      m.position.y = 1.05;
      m.renderOrder = 5;
      this.group.add(m);
    }
    // chamas de energia subindo pela casca
    this.tongues = [];
    const cone = new THREE.ConeGeometry(0.16, 1, 5);
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(cone, additive('#ffffff', 0.6));
      this.group.add(m);
      this.tongues.push({ m, a: (i / 10) * Math.PI * 2, k: Math.random() });
    }
    // flor de lótus de energia no chão
    this.petals = [];
    const petal = new THREE.SphereGeometry(1, 8, 6);
    this.lotus = new THREE.Group();
    for (let ring = 0; ring < 2; ring++) {
      for (let i = 0; i < 8; i++) {
        const m = new THREE.Mesh(petal, additive('#ffffff', ring ? 0.32 : 0.22));
        const a = (i / 8) * Math.PI * 2 + ring * 0.39;
        m.userData = { a, ring };
        this.lotus.add(m);
        this.petals.push(m);
      }
    }
    this.group.add(this.lotus);
    // faíscas subindo
    this.motes = [];
    const box = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(box, additive('#ffffff', 0.9));
      this.group.add(m);
      this.motes.push({ m, a: Math.random() * Math.PI * 2, r: 0.7 + Math.random() * 0.6, y: Math.random() * 2.4, v: 0.5 + Math.random() * 0.7 });
    }
    this.mats = [this.outer.material, this.inner.material, ...this.tongues.map((t) => t.m.material), ...this.petals.map((p) => p.material), ...this.motes.map((p) => p.m.material)];
    this.t = 0;
  }

  setColor(color) {
    this.color.set(color);
    for (const m of this.mats) m.color.copy(this.color);
  }

  // root: posição do corpo; enter 0..1 (sentando); breath 0..1; lift 0..1 (levitação)
  update(dt, { on, root, enter = 1, breath = 0, lift = 0, height = 1.3 }) {
    this.group.visible = !!on;
    if (!on) return;
    this.t += dt;
    const t = this.t;
    const inhale = Math.sin(Math.PI * breath);
    const k = enter * enter * (3 - 2 * enter);
    this.group.position.copy(root);
    const up = lift * height;
    const s = (0.95 + 0.08 * inhale + 0.25 * lift) * k;
    for (const m of [this.outer, this.inner]) {
      m.position.y = 1.05 + up;
      m.scale.set(s, s * 1.3, s);
    }
    this.outer.material.opacity = (0.3 + 0.12 * inhale + 0.15 * lift) * k;
    this.inner.material.opacity = (0.14 + 0.08 * inhale) * k;
    for (const tg of this.tongues) {
      const a = tg.a + t * 0.8;
      const h = 0.6 + 0.4 * Math.sin(t * 5 + tg.k * 9) + 0.5 * lift;
      tg.m.position.set(Math.cos(a) * 0.9 * s, 0.3 + up + h * 0.5, Math.sin(a) * 0.9 * s);
      tg.m.scale.set(1, h * k, 1);
    }
    // a lótus abre ao sentar e gira devagar
    this.lotus.rotation.y = t * 0.25;
    this.lotus.position.y = 0.05;
    for (const p of this.petals) {
      const { a, ring } = p.userData;
      const open = (0.35 + 0.65 * k) * (ring ? 0.75 : 1);
      const r = (ring ? 0.7 : 1.05) * open + 0.05 * inhale;
      p.position.set(Math.cos(a) * r, 0.12 + ring * 0.08, Math.sin(a) * r);
      p.rotation.set(0, -a, 0);
      p.scale.set(0.55 * open, 0.07, 0.22 * open);
      p.rotateZ(0.35 * open);
    }
    for (const mo of this.motes) {
      mo.y += mo.v * dt * (1 + 2 * lift);
      if (mo.y > 2.6 + up) mo.y = 0;
      const a = mo.a + t * 0.6;
      mo.m.position.set(Math.cos(a) * mo.r, mo.y, Math.sin(a) * mo.r);
      mo.m.material.opacity = 0.9 * k * (1 - mo.y / (2.8 + up));
    }
  }
}
