// Juntar peças paradas (atualização 15): enfeites montados com várias caixas (espadas no
// balcão, itens das bancas, o bote) viram uma malha por "tipo de material" (aspereza, metal,
// brilho próprio e lado), com a cor de cada peça gravada nos vértices. Fica igual na tela e
// custa uma chamada de desenho por tipo em vez de uma por peça.
//
// Ficam de fora: peças transparentes ou com textura, malhas instanciadas/animadas por osso,
// linhas, e o que estiver em `skip` (partes que se mexem sozinhas, como a bandeira do bote).

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const keyOf = (m) =>
  [
    Math.round((m.roughness ?? 1) * 10),
    Math.round((m.metalness ?? 0) * 10),
    m.emissive ? m.emissive.getHexString() : '000000',
    Math.round((m.emissiveIntensity ?? 1) * 10),
    m.side,
    m.flatShading ? 1 : 0,
  ].join('|');

function bakeable(o, skip) {
  if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || !o.visible) return false;
  for (let p = o; p; p = p.parent) if (skip.has(p)) return false;
  const m = o.material;
  return !!m && !Array.isArray(m) && m.isMeshStandardMaterial && !m.transparent && !m.map && !m.alphaMap && !m.normalMap;
}

// Junta as peças de `group` (no espaço do próprio grupo). Devolve quantas peças saíram.
export function bakeStatic(group, { skip = [] } = {}) {
  const skipSet = new Set(skip);
  group.updateMatrixWorld(true);
  const inv = group.matrixWorld.clone().invert();
  const buckets = new Map();
  group.traverse((o) => {
    if (o === group || !bakeable(o, skipSet)) return;
    const k = keyOf(o.material);
    if (!buckets.has(k)) buckets.set(k, { material: o.material, meshes: [] });
    buckets.get(k).meshes.push(o);
  });
  let removed = 0;
  const m = new THREE.Matrix4();
  for (const { material, meshes } of buckets.values()) {
    if (meshes.length < 2) continue;
    const geos = [];
    for (const mesh of meshes) {
      let g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(name)) g.deleteAttribute(name);
      g.morphAttributes = {};
      if (!g.attributes.normal) g.computeVertexNormals();
      g.applyMatrix4(m.multiplyMatrices(inv, mesh.matrixWorld));
      const n = g.attributes.position.count;
      const src = g.attributes.color;
      const c = mesh.material.color;
      const colors = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        colors[i * 3] = (src ? src.getX(i) : 1) * c.r;
        colors[i * 3 + 1] = (src ? src.getY(i) : 1) * c.g;
        colors[i * 3 + 2] = (src ? src.getZ(i) : 1) * c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geos.push(g);
    }
    const merged = new THREE.Mesh(
      mergeGeometries(geos, false),
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: material.roughness,
        metalness: material.metalness,
        emissive: material.emissive?.clone() ?? new THREE.Color(0),
        emissiveIntensity: material.emissiveIntensity ?? 1,
        side: material.side,
        flatShading: material.flatShading,
      }),
    );
    geos.forEach((g) => g.dispose());
    merged.name = 'pecas_juntas';
    merged.castShadow = meshes.some((x) => x.castShadow);
    merged.receiveShadow = meshes.some((x) => x.receiveShadow);
    group.add(merged);
    for (const mesh of meshes) {
      mesh.removeFromParent();
      removed++;
    }
  }
  return removed;
}
