import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { FRUTOModels } from '../src/characters/fruto-models.js';
import { designFruit, DESIGN_COUNT } from '../src/characters/fruitDesigns.js';

describe('modelos das frutas (folha de referência)', () => {
  it('as 16 frutas têm desenho, paleta completa e partes que brilham', () => {
    expect(DESIGN_COUNT).toBe(16);
    for (let i = 0; i < 16; i++) {
      const d = designFruit(i);
      expect(d.palette.length).toBeGreaterThanOrEqual(16);
      expect(d.glow.has(12)).toBe(true); // olhos brilham em todas
      const used = new Set(d.solid);
      expect(used.has(9)).toBe(true); // tem olhos
      expect(Math.max(...used)).toBeLessThanOrEqual(d.palette.length);
    }
  });

  it('a malha tem casca e brilho, e as mordidas continuam funcionando', () => {
    for (const i of [0, 6, 13, 15]) {
      const f = FRUTOModels.fruit(THREE, i, 0);
      const mesh = f.children[0];
      expect(mesh.material.length).toBe(2);
      expect(mesh.geometry.groups.length).toBe(2);
      const whole = mesh.geometry.attributes.position.count;
      f.userData.setState(2);
      expect(f.userData.bites).toBe(2);
      expect(mesh.geometry.attributes.position.count).not.toBe(whole);
      f.userData.setState(3);
      expect(mesh.visible).toBe(false);
    }
  });
});
