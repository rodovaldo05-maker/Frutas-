// Treinamento físico com pesos (atualização 24; Prompt Mestre, seções 8 e 9).
// Flexões e agachamentos em séries de exatamente 10 repetições, com carga escolhida entre as
// liberadas, descanso entre séries, fadiga e XP por repetição válida. Uma repetição só conta
// quando o jogador pede (toque/tecla) e a animação completa desce e sobe; toques durante a
// repetição são ignorados. Nada disso mexe na maestria da fruta.
// Cargas: Iniciante 5 kg … Transcendente 2.560 kg — regras de jogo, não biomecânica real.

export const REPS_PER_SET = 10;
export const SET_CHOICES = [1, 2, 3, 5, 10];
export const REST_TIME = 8; // segundos de descanso entre séries
export const LOADS = [
  { kg: 5, nome: 'Iniciante', req: 1 },
  { kg: 10, nome: 'Aprendiz', req: 5 },
  { kg: 20, nome: 'Intermediário', req: 10 },
  { kg: 40, nome: 'Avançado', req: 20 },
  { kg: 80, nome: 'Especialista', req: 30 },
  { kg: 160, nome: 'Mestre', req: 45 },
  { kg: 320, nome: 'Lendário', req: 60 },
  { kg: 640, nome: 'Sobre-humano', req: 75 },
  { kg: 1280, nome: 'Titânico', req: 90 },
  { kg: 2560, nome: 'Transcendente', req: 100 },
];

export const EXERCISES = {
  flexao: {
    nome: 'Flexões', curto: 'Flexão',
    // constituição, força (braços e peitoral), resistência muscular, defesa física, vigor e fôlego
    attrs: { constituicao: 1, forca: 1, resistencia: 0.4, defesa: 0.3, folego: 0.3 },
    base: 1.0, // segundos por repetição com carga leve
  },
  agachamento: {
    nome: 'Agachamentos', curto: 'Agachamento',
    // constituição, pernas (impulsão), resistência, equilíbrio (agilidade), fôlego e salto
    attrs: { constituicao: 1, impulsao: 1, agilidade: 0.4, resistencia: 0.3, folego: 0.3 },
    base: 1.1,
  },
};

// nível de força física usado para liberar e sustentar cargas (força + constituição)
export const strengthIndex = (training) => {
  const f = training?.attrs?.forca?.level ?? 1;
  const c = training?.attrs?.constituicao?.level ?? 1;
  return Math.round((f + c) / 2);
};
// desbloqueio: o índice alcança o requisito da carga (liberar não garante sustentar)
export const unlockedLoads = (training) => LOADS.filter((l) => strengthIndex(training) >= l.req);
// capacidade sustentável (kg): cresce com força e constituição
export const capacity = (training) => 6 * Math.pow(2, strengthIndex(training) / 11);
// carga relativa: acima de 1,5× a capacidade é impossível (não deixa começar)
export const relativeLoad = (kg, training) => kg / capacity(training);
export const canLift = (kg, training) => relativeLoad(kg, training) <= 1.5;

// duração de uma repetição: carga pesada e fadiga deixam mais lenta
export function repDuration(exercise, kg, training, fatigue) {
  const rel = Math.min(1.5, relativeLoad(kg, training));
  return EXERCISES[exercise].base * (1 + 0.6 * rel) * (1 + 0.8 * fatigue);
}

// ===== Sessão =====
export function newSession(exercise, kg, sets) {
  return {
    exercise, kg, sets: Math.max(1, Math.min(50, Math.floor(sets) || 1)), set: 1, reps: 0, total: 0,
    phase: 'pronto', // pronto | repeticao | descanso | pausa | fim
    t: 0, dur: 0, fatigue: 0, rest: 0, xp: 0, sessionXp: 0,
  };
}

// pedido de repetição (toque): só vale parado na posição; durante a repetição é ignorado
export function requestRep(s, training) {
  if (s.phase !== 'pronto' || s.fatigue >= 1) return false;
  s.phase = 'repeticao';
  s.t = 0;
  s.dur = repDuration(s.exercise, s.kg, training, s.fatigue);
  return true;
}

// posição da repetição: 0 em cima, 1 embaixo (desce na primeira metade, sobe na segunda)
export const repDepth = (s) => (s.phase === 'repeticao' ? Math.sin(Math.PI * Math.min(1, s.t / s.dur)) : 0);

// XP de uma repetição válida: carga relativa, fadiga e limite por sessão (retorno decrescente)
export const SESSION_SOFT_CAP = 600;
export function repXp(s, training) {
  const rel = Math.max(0.15, Math.min(1.5, relativeLoad(s.kg, training)));
  const tired = 1 - 0.5 * s.fatigue;
  const cap = s.sessionXp < SESSION_SOFT_CAP ? 1 : SESSION_SOFT_CAP / s.sessionXp;
  return 6 * rel * tired * cap;
}

// Avança a sessão; devolve { rep: true, xp } quando uma repetição termina
export function stepSession(s, dt, training) {
  const out = { rep: false, xp: 0, setDone: false, done: false };
  if (s.phase === 'pausa' || s.phase === 'fim') return out;
  if (s.phase === 'repeticao') {
    s.t += dt;
    if (s.t >= s.dur) {
      s.reps += 1;
      s.total += 1;
      const rel = Math.min(1.5, relativeLoad(s.kg, training));
      s.fatigue = Math.min(1, s.fatigue + 0.02 + 0.05 * rel);
      const xp = repXp(s, training);
      s.sessionXp += xp;
      out.rep = true;
      out.xp = xp;
      s.phase = 'pronto';
      if (s.reps >= REPS_PER_SET) {
        out.setDone = true;
        if (s.set >= s.sets) {
          s.phase = 'fim';
          out.done = true;
        } else {
          s.phase = 'descanso';
          s.rest = REST_TIME;
        }
      }
    }
  } else if (s.phase === 'descanso') {
    s.rest -= dt;
    s.fatigue = Math.max(0, s.fatigue - 0.06 * dt);
    if (s.rest <= 0) {
      s.set += 1;
      s.reps = 0;
      s.phase = 'pronto';
    }
  } else if (s.phase === 'pronto') {
    s.fatigue = Math.max(0, s.fatigue - 0.01 * dt);
  }
  return out;
}

export function pauseSession(s, on) {
  if (s.phase === 'fim') return;
  if (on && s.phase !== 'pausa') {
    s.resume = s.phase === 'repeticao' ? 'pronto' : s.phase;
    s.phase = 'pausa'; // repetição interrompida não conta
  } else if (!on && s.phase === 'pausa') s.phase = s.resume ?? 'pronto';
}

// reduzir carga no meio da sessão (para a carga liberada anterior)
export function lowerLoad(s, training) {
  const list = unlockedLoads(training).map((l) => l.kg).filter((kg) => kg < s.kg);
  if (!list.length) return false;
  s.kg = list[list.length - 1];
  return true;
}

// XP de cada atributo por uma repetição
export const repAttrs = (exercise, xp) => Object.entries(EXERCISES[exercise].attrs).map(([k, w]) => [k, xp * w]);

// Salvo: cargas liberadas e recordes
export function normalizeWorkout(w) {
  const o = w && typeof w === 'object' ? w : {};
  return {
    lastKg: LOADS.some((l) => l.kg === o.lastKg) ? o.lastKg : 5,
    lastSets: SET_CHOICES.includes(o.lastSets) || (Number.isInteger(o.lastSets) && o.lastSets > 0 && o.lastSets <= 50) ? o.lastSets : 1,
    reps: { flexao: Math.max(0, Math.floor(o.reps?.flexao) || 0), agachamento: Math.max(0, Math.floor(o.reps?.agachamento) || 0) },
  };
}
