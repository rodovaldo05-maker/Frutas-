import { newTraining, normalizeTraining } from '../progression/training.js';
import { newStatus, normalizeStatus, pointsForLevel, STATUS_KEYS } from '../progression/status.js';
import { normalizeDomain } from '../progression/domain.js';
import { normalizeProficiency } from '../progression/proficiency.js';
import { WEAPON_IDS } from '../weapons/weapons.js';
import { normalizeRace } from '../races/races.js';
import { STYLE_IDS } from '../styles/styles.js';
import { normalizeGear } from '../items/items.js';
import { normalizeBoat } from '../ships/boatRules.js';

// Salvamento local (offline): IndexedDB com versão e migração; sem IndexedDB, usa localStorage.
// Salva sozinho a cada 2 minutos, ao pausar e quando o app vai para segundo plano.

export const SAVE_VERSION = 5;
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
  gliderOn: true, // asa-delta: segurar Pular caindo abre a asa
  reduceFx: false, // efeitos reduzidos (molduras, partículas e flashes)
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
    level: 1,
    title: 'Aprendiz',
    coins: 200, // jogador novo começa com um giro da roleta (doc 09)
    fragments: 0,
    xp: 0,
    statusPoints: 0, // pontos de nível livres para distribuir (3 por nível)
    freeRespec: true, // redistribuir é grátis uma vez (doc 09)
    status: newStatus(), // pontos distribuídos: Força, Defesa, Fruta, Espada, Vitalidade
    training: newTraining(), // atributos treinados pela prática, não distribuíveis (doc 12)
    race: null, // tipo corporal escolhido no começo (humano, aquatico, ghoul, ceu)
    raceMastery: { level: 1, xp: 0 }, // maestria racial (1 a 100)
    equipped: 'estilo', // item equipado na barra de baixo: fruta, arma ou estilo
    styles: ['basico'], // estilos de luta aprendidos
    style: 'basico', // estilo do slot 3
    vontade: { armadura: false, percepcao: false }, // Vontade aprendida
    items: [], // armaduras e acessórios { uid, id, dur }
    gear: { cabeca: null, torso: null, pernas: null, botas: null, anel: null, amuleto: null }, // encaixes
    nextItemUid: 1,
    weapons: [], // espadas compradas (ids)
    weapon: null, // espada do slot 2
    proficiency: {}, // proficiência por tipo de arma { espada: { level, xp } }
    boat: null, // bote { x, z, yaw, aboard } (atualização 10)
    domain: {}, // domínio de cada fruta já usada { id: { level, xp } } (doc 12, seção 14)
    bag: [], // mochila de frutas (doc 09, seção 4)
    keys: 0,
    pity: 0, // giros seguidos sem atingir a garantia da roleta
    history: [], // histórico de obtenção (últimos 200)
    nextUid: 1,
    held: null, // fruta na mão (uid)
    eaten: null, // fruta comida { fruit, rarity }

    missions: {},
  };
}

// Migrações: cada versão sabe subir para a próxima
const MIGRATIONS = {
  0: (s) => ({ ...newSave(), ...s, version: 1, visited: Array.isArray(s.visited) ? s.visited : [] }),
  1: (s) => ({ ...s, version: 2, level: 1, title: 'Aprendiz', coins: 200, fragments: 0, missions: {} }),
  // raridade passa a ser da fruta (catálogo), não da cópia; a garantia recomeça
  2: (s) => ({
    ...s,
    version: 3,
    bag: Array.isArray(s.bag) ? s.bag.map(({ rarity, ...it }) => it) : [],
    eaten: s.eaten ? { fruit: s.eaten.fruit, at: s.eaten.at } : null,
    pity: 0,
    history: [],
  }),
  // entra o treino pela prática (os pontos de status continuam)
  3: (s) => ({ ...s, version: 4, training: newTraining() }),
  // salvos da versão 4 perderam os pontos de status: devolve os pontos do nível para distribuir
  4: (s) => (s.status && typeof s.status === 'object'
    ? { ...s, version: 5 }
    : { ...s, version: 5, status: newStatus(), statusPoints: pointsForLevel(s.level || 1), freeRespec: true }),
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
  const out = { ...base, ...s, unlocks: { ...base.unlocks, ...(s.unlocks || {}) } };
  if (!out.missions || typeof out.missions !== 'object') out.missions = {};
  out.training = normalizeTraining(out.training);
  out.status = normalizeStatus(out.status);
  out.domain = normalizeDomain(out.domain);
  out.proficiency = normalizeProficiency(out.proficiency);
  normalizeRace(out);
  normalizeGear(out);
  out.styles = ['basico', ...(Array.isArray(out.styles) ? out.styles : [])].filter((id, i, a) => STYLE_IDS.includes(id) && a.indexOf(id) === i);
  if (!out.styles.includes(out.style)) out.style = 'basico';
  out.vontade = { armadura: !!out.vontade?.armadura, percepcao: !!out.vontade?.percepcao };
  out.weapons = Array.isArray(out.weapons) ? out.weapons.filter((id, i, a) => WEAPON_IDS.includes(id) && a.indexOf(id) === i) : [];
  if (!out.weapons.includes(out.weapon)) out.weapon = out.weapons[0] ?? null;
  for (const k of ['coins', 'fragments', 'level', 'statusPoints', 'xp']) if (!Number.isFinite(out[k])) out[k] = base[k];
  // pontos nunca somem: distribuídos + livres não podem ficar abaixo do que o nível dá
  const spent = STATUS_KEYS.reduce((n, k) => n + out.status[k], 0);
  out.statusPoints = Math.max(Math.floor(out.statusPoints), pointsForLevel(out.level) - spent, 0);
  if (!Array.isArray(out.visited)) out.visited = [];
  if (!Array.isArray(out.bag)) out.bag = [];
  for (const k of ['keys', 'pity']) if (!Number.isFinite(out[k])) out[k] = 0;
  if (!Number.isFinite(out.nextUid)) out.nextUid = 1 + out.bag.reduce((m, it) => Math.max(m, it.uid || 0), 0);
  if (out.held !== null && !out.bag.some((it) => it.uid === out.held)) out.held = null;
  out.boat = normalizeBoat(out.boat); // bote do jogador (null = amarrado no cais da Ilha de Treino)

  return out;
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
