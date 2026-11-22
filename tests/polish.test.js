import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { FRUTOModels } from '../src/characters/fruto-models.js';
import { Face } from '../src/characters/face.js';
import { mergeBody } from '../src/characters/mergeBody.js';
import { bakeStatic } from '../src/optimization/bake.js';
import { normalizeSettings, DEFAULT_SETTINGS } from '../src/saves/saveSystem.js';
import { Loop } from '../src/core/loop.js';
import { AutoQuality } from '../src/optimization/quality.js';
import DATA from '../data/fruto-catalog.json';

// posição de mundo de um vértice da malha juntada, aplicando os ossos como a GPU faz
function skinnedWorld(mesh, i) {
  mesh.skeleton.update();
  const v = new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position, i);
  mesh.applyBoneTransform(i, v);
  return v.applyMatrix4(mesh.matrixWorld);
}

function makeBody() {
  const body = FRUTOModels.body(THREE, DATA, '#ffffff', 1, 1);
  for (const m of Object.values(body.meshes)) m.material.color.set('#c08060');
  const face = new Face(body.joints.cabeca, { hair: '#202020', skin: '#c08060' });
  return { body, face };
}

describe('corpo numa malha só', () => {
  it('troca segmentos e cabelo por uma SkinnedMesh e esconde as peças', () => {
    const { body, face } = makeBody();
    const merged = mergeBody(body);
    expect(merged.mesh.isSkinnedMesh).toBe(true);
    expect(merged.mesh.skeleton.bones).toHaveLength(Object.keys(body.joints).length);
    for (const m of Object.values(body.meshes)) {
      expect(m.visible).toBe(false);
      expect(m.material).toBe(merged.material); // brilho (emissive) de body.meshes chega na malha juntada
    }
    const hair = face.group.children.filter((o) => o.userData.hair);
    expect(hair.length).toBeGreaterThan(0);
    for (const h of hair) expect(h.visible).toBe(false);
    for (const d of face.details) expect(d.visible).toBe(true); // olhos e boca continuam animando
    expect(mergeBody(body)).toBe(merged); // não junta duas vezes
  });

  it('os vértices seguem as juntas quando o corpo se mexe', () => {
    const { body } = makeBody();
    body.root.position.set(5, 1, -3);
    body.root.updateMatrixWorld(true);
    const hand = body.meshes.mao_D;
    // um vértice da mão antes de juntar
    const before = new THREE.Vector3().fromBufferAttribute(hand.geometry.attributes.position, 0).applyMatrix4(hand.matrixWorld);
    const { mesh } = mergeBody(body);
    // acha o vértice correspondente (mesma posição na pose de ligação)
    let idx = -1;
    for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
      if (skinnedWorld(mesh, i).distanceTo(before) < 1e-4) {
        idx = i;
        break;
      }
    }
    expect(idx).toBeGreaterThanOrEqual(0);
    // mexe braço e corpo; a peça original (escondida) ainda segue as juntas e serve de referência
    body.joints.braco_D.rotation.x = -1.2;
    body.joints.antebraco_D.rotation.x = -0.8;
    body.root.position.set(-2, 0, 7);
    body.root.rotation.y = 1.1;
    body.root.scale.setScalar(1.55);
    body.root.updateMatrixWorld(true);
    const expected = new THREE.Vector3().fromBufferAttribute(hand.geometry.attributes.position, 0).applyMatrix4(hand.matrixWorld);
    expect(skinnedWorld(mesh, idx).distanceTo(expected)).toBeLessThan(1e-3);
  });

  it('o jogador mantém os braços separados (brilho da Vontade de Armadura)', () => {
    const { body } = makeBody();
    const { material } = mergeBody(body, { keep: (id) => /^(braco|antebraco|mao)_/.test(id) });
    expect(body.meshes.braco_E.visible).toBe(true);
    expect(body.meshes.braco_E.material).not.toBe(material);
    expect(body.meshes.tronco.material).toBe(material);
  });
});

describe('peças paradas juntadas', () => {
  it('junta por tipo de material sem mudar o lugar das peças', () => {
    const g = new THREE.Group();
    g.position.set(10, 0, 0);
    g.rotation.y = 0.7;
    const wood = new THREE.MeshStandardMaterial({ color: '#8a5a32', roughness: 0.85 });
    const wood2 = new THREE.MeshStandardMaterial({ color: '#d9b45a', roughness: 0.85 });
    const metal = new THREE.MeshStandardMaterial({ color: '#cccccc', roughness: 0.3, metalness: 0.8 });
    const glow = new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.5 });
    const a = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), wood);
    a.position.set(0, 2, 0);
    const b = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), wood2);
    b.position.set(2, 0, 0);
    const c = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), metal);
    const d = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), metal);
    d.position.z = 3;
    const t = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), glow);
    const sub = new THREE.Group();
    sub.position.y = 5;
    sub.add(c, d);
    g.add(a, b, sub, t);
    g.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(g);
    expect(bakeStatic(g)).toBe(4);
    const meshes = [];
    g.traverse((o) => o.isMesh && meshes.push(o));
    expect(meshes).toHaveLength(3); // madeira, metal, transparente (fica igual)
    g.updateMatrixWorld(true);
    const after = new THREE.Box3().setFromObject(g);
    expect(after.min.distanceTo(box.min)).toBeLessThan(1e-4);
    expect(after.max.distanceTo(box.max)).toBeLessThan(1e-4);
    // cor de cada peça gravada nos vértices
    const woodMesh = meshes.find((m) => m.material.vertexColors && m.material.metalness < 0.5);
    const cols = woodMesh.geometry.attributes.color;
    const seen = new Set();
    for (let i = 0; i < cols.count; i++) seen.add(cols.getX(i).toFixed(3));
    expect(seen.size).toBe(2);
  });

  it('respeita as peças que se mexem (skip)', () => {
    const g = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({ color: '#ff0000' });
    const flag = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), m);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), m), new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), m), flag);
    bakeStatic(g, { skip: [flag] });
    expect(flag.parent).toBe(g);
  });
});

describe('ajustes', () => {
  it('salvo estragado volta ao padrão ou ao limite', () => {
    const s = normalizeSettings({ textScale: 9, fpsCap: 45, colorblind: 'rosa', resolution: '0.2', volume: 'alto', damageNumbers: 'sim', quality: 'ultra' });
    expect(s.textScale).toBe(1.4);
    expect(s.fpsCap).toBe(60);
    expect(s.colorblind).toBe('nenhum');
    expect(s.resolution).toBe('0.5');
    expect(s.volume).toBe(DEFAULT_SETTINGS.volume);
    expect(s.damageNumbers).toBe(true);
    expect(s.quality).toBe('auto');
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({ fpsCap: 30, resolution: 'auto' })).toMatchObject({ fpsCap: 30, resolution: 'auto' });
  });

  it('limite de 30 qps desenha metade dos quadros e a simulação segue em 60 Hz', () => {
    const raf = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = () => 0;
    let renders = 0;
    let steps = 0;
    const loop = new Loop({ update: () => steps++, render: () => renders++ });
    loop.setFpsCap(30);
    loop.running = true;
    loop.last = 0;
    for (let f = 1; f <= 120; f++) loop.frame(f * (1000 / 60));
    globalThis.requestAnimationFrame = raf;
    expect(renders).toBeGreaterThanOrEqual(58);
    expect(renders).toBeLessThanOrEqual(62);
    expect(steps).toBeGreaterThanOrEqual(118);
  });

  it('qualidade automática: com 30 qps não desce sem motivo e respeita a resolução fixa', () => {
    const r = { qualityId: 'media', resolutionScale: 1, setQuality(id) { this.qualityId = id; }, setResolutionScale(s) { this.resolutionScale = s; } };
    globalThis.window ??= { matchMedia: () => ({ matches: true }) };
    const q = new AutoQuality(r, 'auto');
    q.setTarget(30);
    for (let i = 0; i < 600; i++) q.sample(1 / 30);
    expect(r.qualityId).toBe('media');
    q.setFixedScale(0.75);
    for (let i = 0; i < 600; i++) q.sample(1 / 15); // muito lento
    expect(r.resolutionScale).toBe(0.75); // a escala fixa não muda
    expect(r.qualityId).toBe('leve'); // só o perfil desce
  });
});
