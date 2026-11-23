// Regras das ilhas 14 a 18 do Segundo Mar (atualização 27; doc 02). Só números e estados,
// sem Three.js: a cena e os efeitos ficam em src/world/islandEvents.js.
//
// - Geleira Silente: nevascas em ciclo; o frio sobe durante a nevasca e cai perto das fogueiras.
//   Frio cheio = lento e dano pequeno. Fruta da Geada com a maestria da imunidade não sente.
// - Ruínas do Sol Poente: quebra-cabeça de luz. Quatro espelhos em corrente; cada um gira em
//   90°. A luz só segue para o próximo se o espelho estiver na direção certa. Os quatro certos
//   abrem a câmara secreta (uma vez por salvo).
// - Bosque Noturno: névoa fechada e ecos ilusórios. Com a Percepção ligada o eco se desfaz e
//   rende XP de Observação; sem ela, golpear um eco deixa lento.
// - Bastião Vulcânico: erupção programada a cada ciclo, com aviso; as rochas caem em pontos
//   marcados no chão (dá para desviar).
// - Masmorra do Abismo: três andares trancados. Cada chave fica no altar do andar de fora e abre
//   a porta do próximo; espinhos sobem e descem nos corredores (marcados antes de subir).

// ===== Geleira Silente =====
export const BLIZZARD = { cycle: 45, duration: 18, warn: 4, rise: 7, fall: 5, fireFall: 30, fireR: 6, max: 100, tick: 2, damage: 0.02 };
// fase da nevasca pelo relógio da ilha (segundos)
export function blizzardPhase(t) {
  const k = t % BLIZZARD.cycle;
  const start = BLIZZARD.cycle - BLIZZARD.duration;
  if (k >= start) return { on: true, left: BLIZZARD.cycle - k };
  return { on: false, warn: k >= start - BLIZZARD.warn, in: start - k };
}
// avança o frio; devolve o novo valor
export function stepCold(cold, dt, { on, nearFire, immune }) {
  if (immune) return 0;
  if (nearFire) return Math.max(0, cold - BLIZZARD.fireFall * dt);
  if (on) return Math.min(BLIZZARD.max, cold + BLIZZARD.rise * dt);
  return Math.max(0, cold - BLIZZARD.fall * dt);
}
export const frozen = (cold) => cold >= BLIZZARD.max;

// ===== Ruínas do Sol Poente =====
export const MIRRORS = 4;
// direções certas (0..3) e as iniciais (nunca certas) a partir da semente
export function newLightPuzzle(seed) {
  let s = seed >>> 0;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const target = Array.from({ length: MIRRORS }, () => Math.floor(r() * 4));
  const dir = target.map((d) => (d + 1 + Math.floor(r() * 3)) % 4);
  return { target, dir, solved: false };
}
// quantos espelhos a luz alcança (em corrente a partir do pilar do sol)
export function litCount(p) {
  let n = 0;
  while (n < MIRRORS && p.dir[n] === p.target[n]) n++;
  return n;
}
// gira um espelho (só os que a luz já alcança ou o primeiro apagado); devolve true se mudou
export function rotateMirror(p, i) {
  if (p.solved || i < 0 || i >= MIRRORS) return false;
  if (i > litCount(p)) return false; // sem luz chegando, o espelho não mostra o caminho
  p.dir[i] = (p.dir[i] + 1) % 4;
  if (litCount(p) === MIRRORS) p.solved = true;
  return true;
}

// ===== Bosque Noturno =====
export const ECHOES = { count: 5, respawn: 60, xp: 3, slow: 2, sessionCap: 30 };
// golpe num eco: com Percepção ligada desfaz e rende XP (com limite); sem ela, engana
export function hitEcho(sense, gained) {
  if (!sense) return { kind: 'engano', xp: 0, slow: ECHOES.slow };
  const xp = Math.max(0, Math.min(ECHOES.xp, ECHOES.sessionCap - gained));
  return { kind: 'desfez', xp, slow: 0 };
}
export const FOG_NIGHT = { near: 6, far: 55 };

// ===== Bastião Vulcânico =====
export const ERUPTION = { cycle: 30, warn: 5, duration: 6, rocks: 12, telegraph: 1.3, radius: 3, damage: 0.08, spread: [10, 42] };
export function eruptionPhase(t) {
  const k = t % ERUPTION.cycle;
  const start = ERUPTION.cycle - ERUPTION.duration;
  if (k >= start) return { on: true, k: k - start };
  return { on: false, warn: k >= start - ERUPTION.warn };
}
// pontos das rochas de uma erupção (coordenadas locais), espalhados em volta da cratera
export function eruptionTargets(rand, n = ERUPTION.rocks) {
  const [a, b] = ERUPTION.spread;
  return Array.from({ length: n }, (_, i) => {
    const ang = rand() * Math.PI * 2;
    const d = a + rand() * (b - a);
    return { x: Math.cos(ang) * d, z: Math.sin(ang) * d, at: (i / n) * (ERUPTION.duration - ERUPTION.telegraph) };
  });
}

// ===== Masmorra do Abismo =====
// andares de fora para dentro: o raio da muralha de cada um e a chave que abre o de dentro
export const DUNGEON = {
  rings: [34, 26, 18, 10], // quatro muralhas: a de fora é a entrada; três andares e a cela no meio
  keys: [{ id: 'bronze', nome: 'Chave de Bronze', cor: '#c8803a' }, { id: 'prata', nome: 'Chave de Prata', cor: '#d8dce8' }, { id: 'ouro', nome: 'Chave de Ouro', cor: '#ffd040' }],
  spikes: { period: 3, up: 1.2, warn: 0.6, damage: 0.06, size: 2.6 },
};
// portas: a porta k (muralha k) abre com k chaves. A de fora (k = 0) é a entrada, sempre aberta.
export const doorOpen = (k, keys) => k === 0 || keys >= k;
export function takeKey(state, k) {
  if (k !== state.keys || k >= DUNGEON.keys.length) return false; // em ordem, uma por andar
  state.keys += 1;
  return true;
}
// espinhos: 'baixo', 'aviso' ou 'cima' pelo tempo (cada fileira tem uma defasagem)
export function spikeState(t, offset = 0) {
  const { period, up, warn } = DUNGEON.spikes;
  const k = (((t + offset) % period) + period) % period;
  if (k < up) return 'cima';
  if (k >= period - warn) return 'aviso';
  return 'baixo';
}
export function normalizeIslands(s) {
  const o = s && typeof s === 'object' ? s : {};
  const k = Number(o.masmorra?.keys);
  return {
    ruinas: { solved: !!o.ruinas?.solved, chest: !!o.ruinas?.chest },
    masmorra: { keys: Number.isFinite(k) ? Math.max(0, Math.min(DUNGEON.keys.length, Math.floor(k))) : 0 },
  };
}
