import { describe, it, expect, beforeAll } from 'vitest';
import * as THREE from 'three';
import { LabFx } from '../src/vfx/labFx.js';
import { FruitPowers } from '../src/combat/powers.js';
import { powersOf } from '../src/fruits/powers.js';
import catalog from '../data/fruto-catalog.json';

// o laboratório desenha texturas em canvas: um canvas de mentira basta para os testes
beforeAll(() => {
  const ctx = new Proxy({}, { get: (t, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => {}) });
  globalThis.document ??= { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
});

const fakeCtl = () => ({ pos: new THREE.Vector3(), yaw: 0, state: 'ground', health: 100, maxHealth: 100, invulnerable: 0, attackLock: 0, action: null, shove() {} });
const dummy = (x, z) => ({ id: `t${x}${z}`, pos: new THREE.Vector3(x, 0, z), alive: true, hostile: true, radius: 0.8, defense: 0, hits: 0, receiveHit(h) { this.hits++; return { result: 'hit', damage: h.damage }; } });

function setup() {
  const scene = new THREE.Scene();
  const emitted = [];
  const lab = new LabFx({ scene, ground: () => 0, fruits: catalog.fruits, emit: (...a) => emitted.push(a), mobile: true });
  const generic = { calls: [] };
  for (const k of ['orb', 'burst', 'ring', 'pillar', 'mark', 'cone', 'lane', 'line', 'bolt', 'vortex', 'wall', 'kill', 'flash', 'spark']) generic[k] = (...a) => { generic.calls.push(k); return { position: new THREE.Vector3() }; };
  return { scene, lab, generic, emitted };
}

describe('efeitos do laboratório nos poderes', () => {
  it('as 16 frutas usam os 3 golpes com os efeitos do laboratório, sem erro, acertando os alvos', () => {
    for (const f of catalog.fruits) {
      const { scene, lab } = setup();
      const p = new FruitPowers({ ctl: fakeCtl(), fx: null, lab, stats: () => ({ fruit: 1, domain: 1 }) });
      p.setFruit(f, powersOf(f), 1000);
      const targets = [dummy(0, 4), dummy(1.5, 6), dummy(-1, 3)];
      let hits = 0;
      for (const slot of [0, 1, 2]) {
        p.energy = 100;
        p.cooldown.fill(0);
        expect(p.cast(slot, targets, true), `${f.id} ${slot}`).toBe(true);
        for (let i = 0; i < 240; i++) {
          p.update(1 / 60, targets, true);
          lab.update(1 / 60);
        }
      }
      for (const t of targets) hits += t.hits;
      expect(hits, f.id).toBeGreaterThan(0);
      // nada de efeito sobrando na cena muito depois
      for (let i = 0; i < 600; i++) lab.update(1 / 30);
      expect(lab.zones.length, f.id).toBe(0);
      expect(scene.children.length, f.id).toBeLessThan(6);
    }
  });

  it('com o laboratório os efeitos genéricos não são chamados nos golpes', () => {
    const { lab, generic } = setup();
    const p = new FruitPowers({ ctl: fakeCtl(), fx: generic, lab, stats: () => ({ fruit: 1, domain: 1 }) });
    const f = catalog.fruits.find((x) => x.id === 'brasa');
    p.setFruit(f, powersOf(f), 1000);
    const targets = [dummy(0, 4)];
    p.cast(0, targets, true);
    for (let i = 0; i < 120; i++) p.update(1 / 60, targets, true);
    const used = new Set(generic.calls ?? []);
    for (const k of ['orb', 'burst', 'ring', 'pillar', 'mark', 'cone']) expect(used.has(k), k).toBe(false);
  });

  it('carga na mão durante o gesto some na liberação; aura liga e desliga', () => {
    const { scene, lab } = setup();
    const p = new FruitPowers({ ctl: fakeCtl(), fx: null, lab, stats: () => ({ fruit: 1, domain: 1 }) });
    const f = catalog.fruits.find((x) => x.id === 'cristal');
    p.setFruit(f, powersOf(f), 1000);
    p.cast(0, [], true);
    expect(p.casting.focus).toBeTruthy();
    for (let i = 0; i < 120; i++) p.update(1 / 60, [], true);
    expect(p.casting?.focus ?? null).toBeNull();
    const body = { root: new THREE.Group() };
    lab.aura('cristal', body, true, 0.016);
    const auraRoot = scene.children.find((o) => o.isGroup && o.visible && o.children.length >= 9);
    expect(auraRoot).toBeTruthy();
    lab.aura(null, body, false, 0.016);
    expect(auraRoot.visible).toBe(false);
  });
});
