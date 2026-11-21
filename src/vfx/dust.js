// Poeira dos passos: blocos pequenos que sobem, abrem e somem. Um único InstancedMesh
// com um conjunto fixo de partículas reaproveitadas (sem criar objetos durante o jogo).

import * as THREE from 'three';

const COUNT = 48;

export class Dust {
  constructor(scene) {
    this.mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: '#e9dcc0', transparent: true, opacity: 0.55, depthWrite: false }),
      COUNT,
    );
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 3;
    this.items = Array.from({ length: COUNT }, () => ({ life: 0, max: 1, p: new THREE.Vector3(), v: new THREE.Vector3(), s: 0 }));
    this.next = 0;
    this.m = new THREE.Matrix4();
    this.q = new THREE.Quaternion();
    this.zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < COUNT; i++) this.mesh.setMatrixAt(i, this.zero);
    scene.add(this.mesh);
  }

  // nuvem num ponto do chão; dir = direção da corrida (a poeira vai para trás)
  puff(pos, dir, strength = 1, color) {
    const n = Math.round(3 + 3 * strength);
    if (color) this.mesh.material.color.set(color);
    for (let k = 0; k < n; k++) {
      const it = this.items[this.next];
      this.next = (this.next + 1) % COUNT;
      it.max = it.life = 0.35 + Math.random() * 0.3;
      it.p.set(pos.x + (Math.random() - 0.5) * 0.4, pos.y + 0.08, pos.z + (Math.random() - 0.5) * 0.4);
      it.v.set(-dir.x * (0.6 + Math.random()) + (Math.random() - 0.5) * 0.8, 0.5 + Math.random() * 0.8, -dir.z * (0.6 + Math.random()) + (Math.random() - 0.5) * 0.8);
      it.s = (0.12 + Math.random() * 0.12) * (0.7 + 0.5 * strength);
    }
  }

  update(dt) {
    for (let i = 0; i < COUNT; i++) {
      const it = this.items[i];
      if (it.life <= 0) continue;
      it.life -= dt;
      if (it.life <= 0) {
        this.mesh.setMatrixAt(i, this.zero);
        continue;
      }
      const u = 1 - it.life / it.max;
      it.p.addScaledVector(it.v, dt);
      it.v.multiplyScalar(Math.exp(-3 * dt));
      const s = it.s * (1 + 1.6 * u) * (1 - u * u);
      this.q.setFromAxisAngle(it.v, u * 2);
      this.m.compose(it.p, this.q, new THREE.Vector3(s, s, s));
      this.mesh.setMatrixAt(i, this.m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
