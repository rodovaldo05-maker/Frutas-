// Teste 14 (Prompt Mestre, fase H): salvar/carregar offline, migração de salvos antigos,
// cópia de segurança antes de migrar e recuperação de salvo corrompido.
import { describe, it, expect, beforeEach } from 'vitest';
import { SaveSystem, SAVE_VERSION, newSave, migrate } from '../src/saves/saveSystem.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear(), get size() { return m.size; }, _m: m };
}

describe('teste 14: salvar e carregar offline', () => {
  beforeEach(() => {
    globalThis.localStorage = memoryStorage();
    globalThis.indexedDB = undefined; // sem IndexedDB: usa o localStorage (como em alguns aparelhos)
  });

  it('salva e carrega de volta igual (sem rede)', async () => {
    const saves = new SaveSystem();
    const s = newSave();
    s.coins = 4321;
    s.domain = { brasa: { v: 2, level: 300, xp: 5 } };
    s.workout = { lastKg: 20, lastSets: 3, reps: { flexao: 10, agachamento: 0 } };
    expect(await saves.saveGame(s)).toBe(true);
    const back = await new SaveSystem().loadGame();
    expect(back.coins).toBe(4321);
    expect(back.domain.brasa.level).toBe(300);
    expect(back.workout.lastSets).toBe(3);
    expect(back.version).toBe(SAVE_VERSION);
  });

  it('salvo antigo migra sem perder progresso e deixa uma cópia intacta (reversível)', async () => {
    const old = { version: 5, coins: 999, level: 40, domain: { lobo: { level: 59, xp: 0 } }, vontade: { armadura: true, percepcao: false }, training: undefined };
    localStorage.setItem('fruto-legacy:slot1', JSON.stringify(old));
    const saves = new SaveSystem();
    const s = await saves.loadGame();
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.coins).toBe(999);
    expect(s.domain.lobo.level).toBe(581); // domínio 59 → maestria 581 (mesmo ponto do despertar)
    expect(s.vontade).toMatchObject({ armadura: true, percepcao: false, soberana: false });
    expect(s.workout).toBeTruthy();
    const backup = JSON.parse(localStorage.getItem('fruto-legacy:slot1-backup-v5'));
    expect(backup).toEqual(old); // a cópia é o salvo original
    expect((await saves.restoreBackup(5)).domain.lobo.level).toBe(59);
  });

  it('salvo principal corrompido: carrega a última cópia boa', async () => {
    const saves = new SaveSystem();
    const good = newSave();
    good.coins = 777;
    await saves.saveGame(good);
    await saves.loadGame(); // guarda a cópia boa (slot1-anterior)
    localStorage.setItem('fruto-legacy:slot1', '{quebrado');
    const s = await new SaveSystem().loadGame();
    expect(s.coins).toBe(777);
  });

  it('valores estragados são validados (sem NaN, sem negativos)', () => {
    const s = migrate({ ...newSave(), domain: { brasa: { level: 'x', xp: -5 } }, workout: { lastKg: 3, lastSets: 999 } });
    expect(s.domain.brasa.level).toBe(1);
    expect(s.domain.brasa.xp).toBe(0);
    expect(s.workout).toMatchObject({ lastKg: 5, lastSets: 1 });
  });
});
