// Números de dano e avisos curtos ("Perfeita!", "Esquiva!") que sobem do ponto do golpe.
// Elementos de HTML projetados da posição 3D para a tela a cada quadro (poucos ao mesmo tempo).

import * as THREE from 'three';

const KINDS = { dano: '', forte: 'strong', jogador: 'player', bloqueio: 'block', perfeita: 'gold', esquiva: 'cyan', info: 'info' };

export class FloatText {
  constructor(layer) {
    this.layer = layer;
    this.items = [];
    this.v = new THREE.Vector3();
  }

  add(pos, text, kind = 'dano') {
    const el = document.createElement('span');
    el.className = `float-text ${KINDS[kind] ?? ''}`;
    el.textContent = text;
    this.layer.appendChild(el);
    this.items.push({ el, x: pos.x + (Math.random() - 0.5) * 0.8, y: pos.y, z: pos.z + (Math.random() - 0.5) * 0.8, t: 0 });
    if (this.items.length > 24) this.remove(0);
  }

  remove(i) {
    this.items[i].el.remove();
    this.items.splice(i, 1);
  }

  update(dt, camera, width, height) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.t += dt;
      if (it.t > 1.1) {
        this.remove(i);
        continue;
      }
      this.v.set(it.x, it.y + 1.2 + it.t * 2.2, it.z).project(camera);
      const visible = this.v.z < 1 && Math.abs(this.v.x) < 1.2 && Math.abs(this.v.y) < 1.2;
      it.el.style.opacity = visible ? String(Math.min(1, (1.1 - it.t) * 3)) : '0';
      const sx = (this.v.x * 0.5 + 0.5) * width;
      const sy = (-this.v.y * 0.5 + 0.5) * height;
      const pop = it.t < 0.12 ? 1.35 - it.t * 2.9 : 1;
      it.el.style.transform = `translate(-50%, -50%) translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) scale(${pop.toFixed(2)})`;
    }
  }

  clear() {
    while (this.items.length) this.remove(0);
  }
}
