// Barracas e NPCs da Ilha de Treino: o Mercador de Frutas (roleta) e o Trocador de
// Fragmentos, o Mestre de Armas e o Mestre de Luta. NPCs extras (como os Barqueiros dos cais)
// chegam por `extra`: podem ficar sem barraca (stall: false) e com altura própria (y).
// Os NPCs usam o corpo do laboratório com rosto, respiram, piscam e viram a
// cabeça para o jogador. Cada barraca tem colisão no balcão e nos postes.

import * as THREE from 'three';
import { FRUTOModels } from '../characters/fruto-models.js';
import { FRUTOMotion } from '../animation/fruto-motion.js';
import { Face } from '../characters/face.js';
import { StructureBuilder } from './structures.js';
import { makeFruit } from '../fruits/fruitArt.js';
import { makeSword } from '../weapons/swordModel.js';
import { WEAPONS } from '../weapons/weapons.js';
import { clamp, damp, lerp, wrapAngle } from '../core/math.js';
import { trimShadows, LOD_FAR, LOD_FACE } from '../characters/shadows.js';
import { bakeStatic } from '../optimization/bake.js';

const NPCS = [
  {
    id: 'mercador', name: 'Mercador de Frutas', x: -10.5, z: 64.5, yaw: Math.PI / 2,
    look: { skin: '#c98d62', hair: '#1f1a17', shirt: '#c2492f', shorts: '#3b2a1c', shoes: '#6b4a2c' },
    hint: 'Gire a roleta de frutas: 200 moedas ou 1 chave por giro. Fale com ele para abrir a roleta.',
    awning: ['lonaRoxa', 'lonaOuro'],
  },
  {
    id: 'trocador', name: 'Trocador de Fragmentos', x: -10.5, z: 55.5, yaw: Math.PI / 2,
    look: { skin: '#e8c0a0', hair: '#9a9a9a', shirt: '#2f5f8a', shorts: '#2a2f45', shoes: '#3b3f4a' },
    hint: 'Troque frutas por fragmentos (Comum 1, Épico 3, Lendário 5). 10 fragmentos viram 1 chave.',
    awning: ['lonaOuro', 'lonaRoxa'],
  },
  {
    id: 'armeiro', name: 'Mestre de Armas', x: -10.5, z: 46.5, yaw: Math.PI / 2,
    look: { skin: '#a8714c', hair: '#3a2a20', shirt: '#4a5560', shorts: '#2a2a30', shoes: '#3a2a1c' },
    hint: 'Espadas para comprar e equipar no slot 2. A proficiência com espadas libera as habilidades.',
    awning: ['lonaRoxa', 'lonaOuro'],
  },
  {
    id: 'comprador', name: 'Comprador de Itens', x: 12, z: 66, yaw: -Math.PI / 2,
    look: { skin: '#d8a880', hair: '#6a4a2a', shirt: '#2f6a4a', shorts: '#3a2f22', shoes: '#4a3424' },
    hint: 'Compra armaduras e acessórios que caem dos inimigos, chefes e navios: 35% do preço.',
    awning: ['lonaOuro', 'lonaRoxa'],
  },
  {
    id: 'mestre', name: 'Mestre de Luta', x: 12, z: 56, yaw: -Math.PI / 2,
    look: { skin: '#8a5a3c', hair: '#e8e8e8', shirt: '#f2efe6', shorts: '#2a2a33', shoes: '#2a1f18' },
    hint: 'Ensina estilos de luta (slot 3) e a Vontade de Armadura e de Percepção.',
    awning: ['lonaOuro', 'lonaRoxa'],
  },
];

export const PART = {
  cabeca: 'skin', tronco: 'shirt', ombro_E: 'shirt', ombro_D: 'shirt', braco_E: 'shirt', braco_D: 'shirt',
  antebraco_E: 'skin', antebraco_D: 'skin', mao_E: 'skin', mao_D: 'skin', cintura: 'shorts', coxa_E: 'shorts', coxa_D: 'shorts',
  canela_E: 'skin', canela_D: 'skin', pe_E: 'shoes', pe_D: 'shoes',
};

export function label(text, scale = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(21, 17, 42, 0.86)';
  ctx.strokeStyle = '#d9a64a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect?.(6, 6, 500, 84, 40);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffe9b3';
  ctx.font = '700 44px Cinzel, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 50, 470);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true }));
  sprite.scale.set(4.2 * scale, 0.79 * scale, 1);
  sprite.renderOrder = 5;
  return sprite;
}

// Corpo do laboratório com as cores de um NPC (pele, cabelo, roupa) e rosto
export function makeNpcBody(scene, data, look) {
  const body = FRUTOModels.body(THREE, data, '#ffffff', 1, 1);
  for (const [id, mesh] of Object.entries(body.meshes)) mesh.material.color.set(look[PART[id] || 'skin']);
  const face = new Face(body.joints.cabeca, { hair: look.hair, skin: look.skin });
  trimShadows(body);
  scene.add(body.root);
  return { body, face };
}

export function buildMarket({ scene, physics, field, data, extra = [] }) {
  const sb = new StructureBuilder(scene, physics);
  const npcs = [];
  for (const def of [...NPCS, ...extra]) {
    const ground = def.y ?? field.sample(def.x, def.z);
    const fx = Math.sin(def.yaw);
    const fz = Math.cos(def.yaw);
    const stall = def.stall !== false;
    const cx = def.x + fx * (stall ? 1.6 : 0.2) + (stall ? 0 : Math.cos(def.yaw) * 1.3); // balcão na frente do NPC
    const cz = def.z + fz * (stall ? 1.6 : 0.2) - (stall ? 0 : Math.sin(def.yaw) * 1.3);
    const rot = def.yaw;
    // balcão, postes e toldo listrado
    if (stall) sb.block({ x: cx, y: ground - 0.4, z: cz, w: 4.4, h: 1.9, d: 1.1, rotY: rot, style: 'madeira' });
    for (const side of stall ? [-1, 1] : []) {
      const px = def.x + Math.cos(rot) * side * 2.3 - fx * 0.6;
      const pz = def.z - Math.sin(rot) * side * 2.3 - fz * 0.6;
      sb.block({ x: px, y: ground - 0.3, z: pz, w: 0.3, h: 5.6, d: 0.3, rotY: rot, style: 'madeira' });
      const qx = cx + Math.cos(rot) * side * 2.3 + fx * 0.6;
      const qz = cz - Math.sin(rot) * side * 2.3 + fz * 0.6;
      sb.block({ x: qx, y: ground - 0.3, z: qz, w: 0.3, h: 4.8, d: 0.3, rotY: rot, style: 'madeira' });
    }
    for (let k = 0; k < (stall ? 6 : 0); k++) {
      const off = -2.1 + k * 0.84;
      const ax = def.x + fx * 1.0 + Math.cos(rot) * off;
      const az = def.z + fz * 1.0 - Math.sin(rot) * off;
      sb.block({ x: ax, y: ground + 4.5, z: az, w: 0.84, h: 0.22, d: 3.4, rotY: rot, style: def.awning[k % 2] });
    }

    // NPC
    const body = FRUTOModels.body(THREE, data, '#ffffff', 1, 1);
    for (const [id, mesh] of Object.entries(body.meshes)) mesh.material.color.set(def.look[PART[id] || 'skin']);
    const face = new Face(body.joints.cabeca, { hair: def.look.hair, skin: def.look.skin });
    trimShadows(body);
    body.root.position.set(def.x, ground, def.z);
    body.root.rotation.y = def.yaw;
    scene.add(body.root);
    const tag = label(def.name);
    tag.position.set(def.x, ground + 5.6, def.z);
    scene.add(tag);

    // mercadoria no balcão
    const props = new THREE.Group();
    props.position.set(cx, ground + (stall ? 1.5 : 0), cz);
    props.rotation.y = rot;
    if (def.role === 'barqueiro') {
      // remo encostado e rolo de corda no chão do cais
      const wood = new THREE.MeshStandardMaterial({ color: '#8a5a32', roughness: 0.8 });
      const rope = new THREE.MeshStandardMaterial({ color: '#d8c08a', roughness: 0.9 });
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.2, 6), wood);
      shaft.position.set(0, 1.5, -0.2);
      shaft.rotation.z = 0.18;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.9, 0.08), wood);
      blade.position.set(-0.25, 0.4, -0.2);
      blade.rotation.z = 0.18;
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.13, 6, 14), rope);
      coil.rotation.x = Math.PI / 2;
      coil.position.set(0.9, 0.12, 0.4);
      props.add(shaft, blade, coil);
    } else if (def.id === 'mestre') {
      // faixas de treino e um saco de pancada no balcão
      const belt = new THREE.MeshStandardMaterial({ color: '#2a2a33', roughness: 0.8 });
      const red = new THREE.MeshStandardMaterial({ color: '#b8321e', roughness: 0.8 });
      [belt, red, new THREE.MeshStandardMaterial({ color: '#e8c070', roughness: 0.8 })].forEach((m, k) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.5), m);
        b.position.set(-1.3 + k * 0.5, 0.06 + k * 0.12, 0);
        props.add(b);
      });
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.9, 0.55), red);
      bag.position.set(1.1, 0.45, 0);
      props.add(bag);
    } else if (def.id === 'armeiro') {
      // espadas expostas no balcão
      ['lamina-treino', 'sabre-rubro', 'lamina-mares'].forEach((id, k) => {
        const sw = makeSword(WEAPONS[id]);
        sw.rotation.set(0, Math.PI / 2, -0.25);
        sw.position.set(-1.4 + k * 1.4, 0.15, -0.1);
        sw.scale.setScalar(0.8);
        props.add(sw);
      });
    } else if (def.id === 'mercador') {
      [3, 1, 6].forEach((fruitIndex, k) => {
        const f = makeFruit(fruitIndex, 1);
        f.scale.setScalar(0.55);
        f.position.set(-1.3 + k * 1.3, 0.2, 0);
        props.add(f);
      });
    } else {
      const chest = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.7), new THREE.MeshStandardMaterial({ color: '#7a5233', roughness: 0.8 }));
      chest.position.set(-0.9, 0.3, 0);
      const gemMat = new THREE.MeshStandardMaterial({ color: '#c084fc', emissive: '#5b2a86', emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.2 });
      for (let k = 0; k < 5; k++) {
        const g = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), gemMat);
        g.position.set(-1.2 + k * 0.15, 0.72, (k % 2) * 0.12 - 0.05);
        props.add(g);
      }
      const keyMat = new THREE.MeshStandardMaterial({ color: '#f2c14e', roughness: 0.35, metalness: 0.6 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 6, 12), keyMat);
      ring.position.set(0.9, 0.35, 0);
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.1), keyMat);
      shaft.position.set(1.3, 0.35, 0);
      const bit = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.1), keyMat);
      bit.position.set(1.52, 0.25, 0);
      props.add(chest, ring, shaft, bit);
    }
    props.traverse((o) => (o.castShadow = !!o.isMesh));
    bakeStatic(props);
    scene.add(props);

    npcs.push({ ...def, ground, body, face, tag, props, headYaw: 0, clock: Math.random() * 10 });
  }
  sb.finish();

  return {
    npcs,
    // pseudo-placas (dica, minimapa, mapa e área descoberta)
    signs: npcs.map((n) => ({ x: n.x, y: n.ground, z: n.z, title: n.name, hint: n.hint, npc: n.id })),
    update(dt, playerPos, data2 = data) {
      for (const n of npcs) {
        n.clock += dt;
        // longe do jogador: não desenha nem anima (desempenho)
        const far = Math.abs(playerPos.x - n.x) > LOD_FAR || Math.abs(playerPos.z - n.z) > LOD_FAR;
        n.body.root.visible = !far;
        if (far) {
          n.tag.visible = false;
          continue;
        }
        n.face.setDetail(Math.hypot(playerPos.x - n.x, playerPos.z - n.z) < LOD_FACE);
        FRUTOMotion.apply(THREE, n.body, data2, { id: 'idle', t: n.clock, clock: n.clock, gait: 0, runBlend: 0, swimBlend: 0, air: 0, landing: 0 });
        // vira a cabeça para o jogador quando ele chega perto
        const dx = playerPos.x - n.x;
        const dz = playerPos.z - n.z;
        const d = Math.hypot(dx, dz);
        const want = d < 10 ? clamp(wrapAngle(Math.atan2(dx, dz) - n.yaw), -0.9, 0.9) : 0;
        n.headYaw = lerp(n.headYaw, want, damp(4, dt));
        n.body.joints.cabeca.rotation.y += n.headYaw * 0.7;
        n.body.joints.tronco.rotation.y += n.headYaw * 0.3;
        n.face.update(dt, { expression: d < 6 ? 'feliz' : 'neutro', look: { x: clamp(-n.headYaw, -1, 1) * 0.5, y: 0 } });
        n.tag.visible = d < 18;
        // frutas do balcão balançam
        n.props.children.forEach((c, k) => {
          if (c.userData.fruitIndex !== undefined) {
            c.rotation.y = Math.sin(n.clock * 1.3 + k) * 0.5;
            c.position.y = 0.2 + Math.abs(Math.sin(n.clock * 2.2 + k * 1.7)) * 0.08;
          }
        });
      }
    },
    nearest(playerPos, radius = 4.6) {
      let best = null;
      let bd = radius;
      for (const n of npcs) {
        const d = Math.hypot(playerPos.x - n.x, playerPos.z - n.z);
        if (d < bd && Math.abs(playerPos.y - n.ground) < 3) {
          bd = d;
          best = n;
        }
      }
      return best;
    },
  };
}
