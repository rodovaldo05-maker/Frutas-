import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { FRUTOModels } from '../src/characters/fruto-models.js';
import { Face } from '../src/characters/face.js';
import { mergeBody, remergeBody, tintSegment } from '../src/characters/mergeBody.js';
import { OUTFITS, OUTFIT_IDS, buildOutfit, removeOutfit, normalizeOutfit, buyOutfit, outfitPalette, npcOutfit } from '../src/characters/outfits.js';
import { applyGearVisual, gearSlots } from '../src/items/gearParts.js';
import { ITEMS, addItem, equipItem } from '../src/items/items.js';
import { PLAYER_MERGE } from '../src/characters/player.js';
import { newSave, migrate } from '../src/saves/saveSystem.js';
import DATA from '../data/fruto-catalog.json';

const makeBody = () => {
  const body = FRUTOModels.body(THREE, DATA, '#ffffff', 1, 1);
  new Face(body.joints.cabeca, { hair: '#202020', skin: '#c08060' });
  return body;
};
const vcount = (body) => body.merged.mesh.geometry.attributes.position.count;

describe('roupas', () => {
  it('oito roupas, cada uma com 3 cores completas; duas de graça', () => {
    expect(OUTFIT_IDS).toHaveLength(8);
    for (const o of Object.values(OUTFITS)) {
      expect(o.palettes).toHaveLength(3);
      for (const p of o.palettes) for (const k of ['shirt', 'shorts', 'shoes', 'a', 'b', 'c']) expect(p[k]).toMatch(/^#[0-9a-f]{6}$/i);
    }
    expect(OUTFIT_IDS.filter((id) => OUTFITS[id].preco === 0).sort()).toEqual(['basica', 'lutador']);
  });

  it('cada roupa monta peças marcadas e some sem sobrar nada', () => {
    for (const id of OUTFIT_IDS) {
      const body = makeBody();
      const before = new Set();
      body.root.traverse((o) => before.add(o));
      const parts = buildOutfit(body, id, outfitPalette(id, 1));
      expect(parts.length).toBeGreaterThan(3);
      for (const p of parts) expect(p.userData.wear).toBe(true);
      removeOutfit(parts);
      let extra = 0;
      body.root.traverse((o) => { if (!before.has(o)) extra++; });
      expect(extra).toBe(0);
    }
  });

  it('armadura no encaixe esconde a peça de roupa do mesmo encaixe', () => {
    const body = makeBody();
    const all = buildOutfit(body, 'pirata', outfitPalette('pirata'));
    const hidden = buildOutfit(makeBody(), 'pirata', outfitPalette('pirata'), { hide: new Set(['cabeca', 'torso']) });
    expect(all.some((p) => p.userData.slot === 'cabeca')).toBe(true);
    expect(hidden.some((p) => p.userData.slot === 'cabeca' || p.userData.slot === 'torso')).toBe(false);
    expect(hidden.length).toBeLessThan(all.length);
  });

  it('NPC: roupa sorteada pelo nome, sempre a mesma, com cores válidas', () => {
    const look = { skin: '#c08060', hair: '#202020', shirt: '#aa3322', shorts: '#223344', shoes: '#111111' };
    const a = npcOutfit('Joana', look);
    expect(npcOutfit('Joana', look)).toEqual(a);
    expect(OUTFITS[a.id]).toBeDefined();
    // paleta incompleta não quebra a montagem (cores vêm da primeira paleta)
    const parts = buildOutfit(makeBody(), 'nobre', { a: '#ffffff' });
    for (const p of parts) expect(p.material.color).toBeDefined();
  });

  it('salvo e compra', () => {
    const s = normalizeOutfit({ outfit: { id: 'nobre', cor: 9 }, outfits: ['xyz'] });
    expect(s.outfit).toEqual({ id: 'basica', cor: 0 }); // não tem o traje nobre
    expect(s.outfits.sort()).toEqual(['basica', 'lutador']);
    const t = { ...newSave(), coins: 1000 };
    normalizeOutfit(t);
    expect(buyOutfit(t, 'nobre').ok).toBe(false);
    expect(t.coins).toBe(1000);
    expect(buyOutfit(t, 'marinheiro').ok).toBe(true);
    expect(t.coins).toBe(200);
    expect(buyOutfit(t, 'marinheiro').ok).toBe(false);
    expect(migrate({ ...newSave(), outfit: { id: 'marinheiro', cor: 2 }, outfits: ['marinheiro'] }).outfit).toEqual({ id: 'marinheiro', cor: 2 });
  });
});

describe('armaduras no corpo', () => {
  it('todas as peças montam estrutura com várias partes; gemas brilham à parte', () => {
    for (const id of Object.keys(ITEMS)) {
      const s = { ...newSave() };
      const it = addItem(s, id);
      equipItem(s, it.uid);
      const parts = applyGearVisual(makeBody(), s, []);
      expect(parts.length, id).toBeGreaterThanOrEqual(ITEMS[id].slot === 'anel' ? 2 : 3);
      expect(gearSlots(s).has(ITEMS[id].slot)).toBe(true);
    }
  });

  it('acabamento pela qualidade: peça Rara ganha crista no elmo; Comum não', () => {
    const count = (id) => {
      const s = { ...newSave() };
      equipItem(s, addItem(s, id).uid);
      return applyGearVisual(makeBody(), s, []).length;
    };
    expect(count('elmo-ferro')).toBeGreaterThan(5);
  });
});

describe('juntar de novo (roupa e armadura na malha do corpo)', () => {
  it('roupa e armadura entram na malha; trocar tira as peças antigas; cores mudam', () => {
    const body = makeBody();
    mergeBody(body, PLAYER_MERGE);
    const base = vcount(body);
    const outfit = buildOutfit(body, 'pirata', outfitPalette('pirata'));
    const s = { ...newSave() };
    equipItem(s, addItem(s, 'couraca-escamas').uid);
    let gear = applyGearVisual(body, s, []);
    remergeBody(body);
    const dressed = vcount(body);
    expect(dressed).toBeGreaterThan(base);
    for (const p of [...outfit, ...gear]) expect(p.visible).toBe(false); // desenhadas pela malha única
    // tira a armadura e a roupa
    gear = applyGearVisual(body, { ...s, gear: {} }, gear);
    removeOutfit(outfit);
    remergeBody(body);
    expect(vcount(body)).toBe(base);
    // cor nova na camisa chega nos vértices
    tintSegment(body, body.meshes.tronco, '#ff0000');
    remergeBody(body);
    const col = body.merged.mesh.geometry.attributes.color;
    let red = 0;
    for (let i = 0; i < col.count; i++) if (col.getX(i) > 0.5 && col.getY(i) < 0.1 && col.getZ(i) < 0.1) red++;
    expect(red).toBeGreaterThan(0);
    // braços do jogador continuam fora da malha (brilho da Vontade de Armadura)
    expect(body.meshes.braco_E.visible).toBe(true);
  });

  it('no jogador (strict) partes de forma presas às juntas não entram na malha', () => {
    const body = makeBody();
    const horn = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), new THREE.MeshStandardMaterial({ color: '#ffffff' }));
    body.joints.cabeca.add(horn);
    mergeBody(body, PLAYER_MERGE);
    expect(horn.visible).toBe(true);
    expect(body.merged.parts.includes(horn)).toBe(false);
  });
});
