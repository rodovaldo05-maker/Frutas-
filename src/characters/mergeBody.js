// Corpo em uma malha só (atualização 15): NPCs, moradores e inimigos tinham ~36 peças, cada
// uma desenhada à parte (e de novo no mapa de sombras). Aqui as peças rígidas do corpo — os 17
// segmentos, o cabelo e enfeites simples presos às juntas (faixa na cabeça) — viram uma única
// SkinnedMesh: cada vértice segue a junta da peça de onde veio (peso 1), então a animação
// continua exatamente a mesma. A cor de cada peça fica gravada nos vértices.
//
// Ficam de fora (continuam peças separadas): detalhes do rosto (olhos, boca, piscadas e
// expressões; somem de longe), peças com brilho próprio (emissive), transparentes ou com
// textura, e o que for preso ao corpo depois (armas, partes de forma).
//
// As peças originais ficam escondidas, mas usam o material da malha juntada: o código que
// muda o brilho (emissive) de body.meshes — gelo, fogo, dano — continua funcionando.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const BLACK = new THREE.Color(0, 0, 0);

function mergeable(mesh, jointSet, segmentSet) {
  if (!mesh.isMesh || mesh.isSkinnedMesh || mesh.isInstancedMesh) return false;
  if (segmentSet.has(mesh)) return true;
  const m = mesh.material;
  if (!m || Array.isArray(m) || !m.isMeshStandardMaterial) return false;
  if (m.transparent || m.map || (m.emissive && !m.emissive.equals(BLACK))) return false;
  if (mesh.userData.hair) return true;
  // enfeites rígidos presos direto numa junta (ex.: faixa dos inimigos)
  return jointSet.has(mesh.parent) && !mesh.userData.noMerge;
}

// keep(id): segmentos que continuam separados (ex.: braços do jogador, que brilham sozinhos
// com a Vontade de Armadura)
export function mergeBody(body, { keep = () => false } = {}) {
  if (body.merged) return body.merged;
  const root = body.root;
  const bones = Object.values(body.joints);
  const jointSet = new Set(bones);
  const segmentSet = new Set(Object.entries(body.meshes).filter(([id]) => !keep(id)).map(([, m]) => m));
  const kept = new Set(Object.entries(body.meshes).filter(([id]) => keep(id)).map(([, m]) => m));
  root.updateMatrixWorld(true);
  const rootInv = root.matrixWorld.clone().invert();
  const parts = [];
  root.traverse((o) => {
    if (!kept.has(o) && mergeable(o, jointSet, segmentSet)) parts.push(o);
  });
  const geos = [];
  const m = new THREE.Matrix4();
  const tint = new THREE.Color();
  for (const mesh of parts) {
    // junta que move a peça: o primeiro antepassado que é junta
    let joint = mesh.parent;
    while (joint && !jointSet.has(joint)) joint = joint.parent;
    if (!joint) continue;
    const boneIndex = bones.indexOf(joint);
    let g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(name)) g.deleteAttribute(name);
    g.morphAttributes = {};
    if (!g.attributes.normal) g.computeVertexNormals();
    // posição no espaço do corpo (raiz)
    m.multiplyMatrices(rootInv, mesh.matrixWorld);
    g.applyMatrix4(m);
    const n = g.attributes.position.count;
    tint.copy(mesh.material.color);
    const colors = new Float32Array(n * 3);
    const src = g.attributes.color;
    for (let i = 0; i < n; i++) {
      const r = src ? src.getX(i) : 1;
      const gg = src ? src.getY(i) : 1;
      const b = src ? src.getZ(i) : 1;
      colors[i * 3] = r * tint.r;
      colors[i * 3 + 1] = gg * tint.g;
      colors[i * 3 + 2] = b * tint.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const skinIndex = new Uint16Array(n * 4);
    const skinWeight = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      skinIndex[i * 4] = boneIndex;
      skinWeight[i * 4] = 1;
    }
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight, 4));
    geos.push(g);
  }
  if (!geos.length) return null;
  const geometry = mergeGeometries(geos, false);
  geos.forEach((g) => g.dispose());
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.045 });
  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.name = 'corpo_unico';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  root.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(bones), mesh.matrixWorld);
  // esfera de recorte fixa (pose de ligação com folga): calcular pela pose atual exigiria as
  // matrizes dos ossos já atualizadas pelo primeiro desenho
  geometry.computeBoundingSphere();
  mesh.boundingSphere = geometry.boundingSphere.clone();
  mesh.boundingSphere.radius *= 1.35;
  for (const p of parts) {
    p.visible = false;
    p.castShadow = false;
    if (segmentSet.has(p)) {
      p.material.dispose();
      p.material = material;
    }
  }
  body.merged = { mesh, material, parts };
  return body.merged;
}
