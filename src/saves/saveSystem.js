// Salvamento local (offline): IndexedDB com versão e migração; sem IndexedDB, usa localStorage.
// Salva sozinho a cada 2 minutos, ao pausar e quando o app vai para segundo plano.

export const SAVE_VERSION = 1;
const DB = 'fruto-legacy';
const STORE = 'saves';
const FALLBACK = 'fruto-legacy:';

export const DEFAULT_SETTINGS = {
  quality: 'auto',
  sensitivity: 1,
  invertY: false,
  reduceMotion: false,
  showStats: false,
  volume: 0.8,
  layout: 'padrao',
  buttonScale: 1,
};

export function newSave() {
  return {
    version: SAVE_VERSION,
    savedAt: 0,
    playTime: 0,
    island: 'ilha-de-treino',
    player: null,
    unlocks: { doubleJump: true, airDash: true, wallRun: true, glide: true },
    visited: [],
  };
}

// Migrações: cada versão sabe subir para a próxima
const MIGRATIONS = {
  0: (s) => ({ ...newSave(), ...s, version: 1, visited: Array.isArray(s.visited) ? s.visited : [] }),
};

export function migrate(save) {
  if (!save || typeof save !== 'object') return newSave();
  let s = { ...save };
  let v = Number.isInteger(s.version) ? s.version : 0;
  if (v > SAVE_VERSION) return { ...newSave(), ...s }; // salvo de uma versão mais nova: mantém o que der
  while (v < SAVE_VERSION) {
    const step = MIGRATIONS[v];
    s = step ? step(s) : { ...s, version: v + 1 };
    v = s.version;
  }
  const base = newSave();
  return { ...base, ...s, unlocks: { ...base.unlocks, ...(s.unlocks || {}) } };
}

function openDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) return reject(new Error('sem IndexedDB'));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export class SaveSystem {
  constructor() {
    this.db = null;
    this.ready = openDB().then((db) => (this.db = db)).catch(() => (this.db = null));
  }

  async read(key) {
    await this.ready;
    if (this.db) {
      try {
        return await new Promise((resolve, reject) => {
          const req = this.db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
          req.onsuccess = () => resolve(req.result ?? null);
          req.onerror = () => reject(req.error);
        });
      } catch { /* cai no localStorage */ }
    }
    try {
      const raw = localStorage.getItem(FALLBACK + key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async write(key, value) {
    await this.ready;
    const copy = JSON.parse(JSON.stringify(value));
    if (this.db) {
      try {
        await new Promise((resolve, reject) => {
          const tx = this.db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).put(copy, key);
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        });
        return true;
      } catch { /* tenta o localStorage */ }
    }
    try {
      localStorage.setItem(FALLBACK + key, JSON.stringify(copy));
      return true;
    } catch {
      return false;
    }
  }

  async loadGame() {
    return migrate(await this.read('slot1'));
  }

  async saveGame(save) {
    save.savedAt = Date.now();
    save.version = SAVE_VERSION;
    return this.write('slot1', save);
  }

  async loadSettings() {
    const s = await this.read('settings');
    return { ...DEFAULT_SETTINGS, ...(s && typeof s === 'object' ? s : {}) };
  }

  saveSettings(settings) {
    return this.write('settings', settings);
  }
}
