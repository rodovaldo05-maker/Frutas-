// Clima (atualização 19; doc 02, seção 6): cada mar sorteia o tempo a cada poucas horas do
// jogo (1 hora = 60 s reais): Primeiro Mar tropical (70% sol, 25% chuva, 5% tempestade);
// Segundo Mar mais agitado (55/30/15). Efeitos: chuva enfraquece frutas de fogo em 15%;
// tempestade escurece o céu, aumenta as ondas e solta raios marcados perto do jogador.
// Depois de uma tempestade no mar podem aparecer destroços à deriva com saque.

export const WEATHER = {
  sol: { nome: 'Sol', icone: '☀', storm: 0 },
  chuva: { nome: 'Chuva', icone: '🌧', storm: 0.45 },
  tempestade: { nome: 'Tempestade', icone: '⛈', storm: 0.85 },
};

export const CLIMATE = {
  1: { sol: 0.7, chuva: 0.25, tempestade: 0.05 },
  2: { sol: 0.55, chuva: 0.3, tempestade: 0.15 },
};

// duração em minutos do jogo (2 a 5 horas)
export const SPELL = { min: 120, max: 300 };
export const FIRE_FRUITS = new Set(['brasa', 'fenix', 'ocidental']);
export const RAIN_FIRE = 0.85;
export const STRIKE = { every: [5, 9], radius: 3.2, telegraph: 1.1, damage: 0.08, hull: 0.05 };

export function rollWeather(sea = 1, rand = Math.random) {
  const table = CLIMATE[sea] ?? CLIMATE[1];
  let r = rand();
  for (const [state, p] of Object.entries(table)) {
    if (r < p) return state;
    r -= p;
  }
  return 'sol';
}

export const spellLength = (rand = Math.random) => Math.round(SPELL.min + rand() * (SPELL.max - SPELL.min));

// multiplicador de dano das frutas pelo tempo
export const weatherDamage = (state, fruitId) => (state !== 'sol' && FIRE_FRUITS.has(fruitId) ? RAIN_FIRE : 1);

// passo do clima: troca quando passa do fim; devolve true se mudou
export function stepWeather(w, clock, sea, rand = Math.random) {
  if (w.state && clock < w.until && w.sea === sea) return false;
  const prev = w.state;
  w.state = rollWeather(sea, rand);
  w.until = clock + spellLength(rand);
  w.sea = sea;
  w.prev = prev ?? null;
  return w.state !== prev;
}

export function normalizeWeather(w) {
  const ok = w && typeof w === 'object' && WEATHER[w.state] && Number.isFinite(w.until);
  return ok ? { state: w.state, until: w.until, sea: [1, 2, 3].includes(w.sea) ? w.sea : 1 } : { state: 'sol', until: 0, sea: 1 };
}
