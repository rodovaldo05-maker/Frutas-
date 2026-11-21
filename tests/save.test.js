import { describe, it, expect } from 'vitest';
import { migrate, newSave, SAVE_VERSION } from '../src/saves/saveSystem.js';

describe('salvamento', () => {
  it('sem salvo começa um novo', () => {
    expect(migrate(null)).toEqual(newSave());
  });

  it('migra salvo antigo (versão 0) mantendo a posição', () => {
    const old = { player: { x: 1, y: 2, z: 3, yaw: 0 }, visited: 'x' };
    const s = migrate(old);
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.player).toEqual(old.player);
    expect(Array.isArray(s.visited)).toBe(true);
    expect(s.unlocks.glide).toBe(true);
  });

  it('completa desbloqueios que faltam', () => {
    const s = migrate({ version: 1, unlocks: { glide: false } });
    expect(s.unlocks.glide).toBe(false);
    expect(s.unlocks.doubleJump).toBe(true);
  });
});
