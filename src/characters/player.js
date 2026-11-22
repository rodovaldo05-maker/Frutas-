// Personagem jogável: corpo base do laboratório (FRUTOModels) com roupa base, rosto,
// planador dobrável nas costas e sombra simples para o perfil Leve (sem sombras reais).

import * as THREE from 'three';
import { FRUTOModels } from './fruto-models.js';
import { Face } from './face.js';
import { makeFruit } from '../fruits/fruitArt.js';

export const BASE_LOOK = {
  skin: '#e2b48e',
  hair: '#3a2a22',
  shirt: '#3f7fb4',
  shorts: '#2f3b45',
  shoes: '#ece6d8',
};

const SEGMENT_PART = {
  cabeca: 'skin',
  tronco: 'shirt',
  ombro_E: 'shirt', ombro_D: 'shirt',
  braco_E: 'shirt', braco_D: 'shirt',
  antebraco_E: 'skin', antebraco_D: 'skin',
  mao_E: 'skin', mao_D: 'skin',
  cintura: 'shorts',
  coxa_E: 'shorts', coxa_D: 'shorts',
  canela_E: 'skin', canela_D: 'skin',
  pe_E: 'shoes', pe_D: 'shoes',
};

export function createPlayer(scene, data, { profile = 0, look = BASE_LOOK } = {}) {
  const body = FRUTOModels.body(THREE, data, '#ffffff', 1, profile);
  body.root.name = 'Jogador';
  for (const [id, mesh] of Object.entries(body.meshes)) {
    mesh.material.color.set(look[SEGMENT_PART[id] || 'skin']);
  }
  const face = new Face(body.joints.cabeca, { hair: look.hair, skin: look.skin });

  // Asa-delta: vela listrada em triângulo, tubos e barra de controle. Fica presa ao corpo
  // (nível com o chão, não gira com o tronco) e abre a partir da mochila nas costas.
  const glider = buildGlider();
  body.root.add(glider.group);
  const pack = new THREE.Group();
  const packMat = new THREE.MeshStandardMaterial({ color: '#2a2f33', roughness: 0.7 });
  const packBag = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.95, 0.24), new THREE.MeshStandardMaterial({ color: '#5b2a86', roughness: 0.8 }));
  const packTube = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.25, 0.14), packMat);
  packTube.position.set(0.18, 0.12, -0.08);
  const packStripe = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.12, 0.26), new THREE.MeshStandardMaterial({ color: '#e0a83a', roughness: 0.6 }));
  packStripe.position.y = 0.18;
  pack.add(packBag, packTube, packStripe);
  pack.position.set(0, 0.55, -0.45);
  pack.traverse((o) => (o.castShadow = !!o.isMesh));
  body.joints.tronco.add(pack);

  // Sombra simples
  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 20).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }),
  );
  blob.renderOrder = 1;
  scene.add(blob);

  scene.add(body.root);
  let held = null;
  let weapon = null;
  return {
    // fruta viva na mão (modelo do laboratório, com rosto)
    setHeldFruit(index) {
      if (held) held.removeFromParent();
      held = null;
      if (index === null || index === undefined || index < 0) return null;
      held = makeFruit(index, profile);
      held.scale.setScalar(0.72);
      held.userData.baseScale = 0.72;
      body.sockets.pegada.add(held);
      return held;
    },
    get heldFruit() {
      return held;
    },
    // espada na mão direita (atualização 4); null guarda a arma
    setWeapon(sword) {
      if (weapon) weapon.removeFromParent();
      weapon = sword || null;
      if (!weapon) return;
      weapon.position.set(0, -0.3, 0.05);
      weapon.rotation.set(0, 0, 0);
      weapon.scale.setScalar(1.25);
      body.joints.mao_D.add(weapon);
    },
    get weapon() {
      return weapon;
    },
    body,
    face,
    glider: { group: glider.group, open: 0 },
    pack,
    blob,
    // open: 0 fechada (na mochila) .. 1 aberta; enabled: asa-delta ligada
    setGlider(open, enabled = true) {
      this.glider.open = open;
      const g = glider.group;
      g.visible = open > 0.02;
      if (g.visible) {
        const e = open * open * (3 - 2 * open);
        g.scale.setScalar(0.2 + 0.8 * e);
        g.position.set(0, 2.9 + 1.45 * e, -0.35 + 0.8 * e);
        glider.left.rotation.z = (1 - e) * 1.2;
        glider.right.rotation.z = -(1 - e) * 1.2;
      }
      pack.visible = enabled && open < 0.6;
    },
  };
}

// Modelo da asa-delta (espaço do corpo: +z para a frente, +y para cima)
function buildGlider() {
  const group = new THREE.Group();
  group.name = 'AsaDelta';
  const sailMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, side: THREE.DoubleSide, flatShading: true });
  const tubeMat = new THREE.MeshStandardMaterial({ color: '#2b3034', roughness: 0.45, metalness: 0.45 });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const nose = V(0, 0.06, 1.95);
  const root = V(0, 0.12, -0.75);
  const bands = ['#ff9b79', '#ffd36b', '#5b2a86', '#e0a83a', '#5b2a86'];
  const half = (sign) => {
    const tip = V(3.05 * sign, -0.32, -1.15);
    const pos = [];
    const col = [];
    const c = new THREE.Color();
    for (let k = 0; k < bands.length; k++) {
      const f0 = k / bands.length;
      const f1 = (k + 1) / bands.length;
      const a0 = nose.clone().lerp(tip, f0);
      const a1 = nose.clone().lerp(tip, f1);
      const b0 = root.clone().lerp(tip, f0);
      const b1 = root.clone().lerp(tip, f1);
      // leve barriga da vela no meio de cada faixa
      for (const p of [a0, a1, b0, b1]) p.y += 0.12 * Math.sin(Math.PI * Math.min(1, Math.abs(p.x) / 3.05)) * 0.5;
      const quad = sign > 0 ? [a0, b0, b1, a0, b1, a1] : [a0, b1, b0, a0, a1, b1];
      c.set(bands[k]);
      for (const p of quad) {
        pos.push(p.x, p.y, p.z);
        col.push(c.r, c.g, c.b);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const sail = new THREE.Mesh(geo, sailMat);
    sail.castShadow = true;
    const wing = new THREE.Group();
    wing.add(sail, tube(nose, tip, 0.07, tubeMat));
    return wing;
  };
  const left = half(1);
  const right = half(-1);
  group.add(left, right);
  // quilha, travessa, A da barra de controle e mastro
  const keelA = V(0, 0.08, 1.7);
  const keelB = V(0, 0.1, -0.6);
  const hub = V(0, 0.06, 0.3);
  const barL = V(0.75, -1.45, 0.75);
  const barR = V(-0.75, -1.45, 0.75);
  const king = V(0, 0.62, 0.3);
  group.add(
    tube(keelA, keelB, 0.08, tubeMat),
    tube(V(1.45, -0.1, 0.45), V(-1.45, -0.1, 0.45), 0.06, tubeMat),
    tube(hub, barL, 0.06, tubeMat),
    tube(hub, barR, 0.06, tubeMat),
    tube(barL, barR, 0.07, tubeMat),
    tube(hub, king, 0.05, tubeMat),
  );
  // cabos finos do mastro às pontas e à barra
  const wires = new THREE.BufferGeometry().setFromPoints([king, V(3.05, -0.32, -1.15), king, V(-3.05, -0.32, -1.15), king, keelA, barL, V(3.05, -0.32, -1.15), barR, V(-3.05, -0.32, -1.15)]);
  group.add(new THREE.LineSegments(wires, new THREE.LineBasicMaterial({ color: '#1b1f22', transparent: true, opacity: 0.7 })));
  group.rotation.x = -0.08; // nariz levemente para cima
  group.visible = false;
  return { group, left, right };
}

function tube(a, b, r, material) {
  const len = a.distanceTo(b);
  const m = new THREE.Mesh(new THREE.BoxGeometry(r, r, len), material);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.lookAt(b);
  m.castShadow = true;
  return m;
}
