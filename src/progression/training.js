// Evolução por prática verificável (documento mestre 4.0, seções 02–12 e 35).
// Atributos treináveis vão do nível 1 ao 100. XP para passar do nível L ao L+1:
// arredondar(100 + 18·L + 1,5·L²). Cada ação válida concede XP (não um aumento direto do
// atributo); o progresso aparece em porcentagem da barra do nível.
// O antifarm reduz aos poucos o ganho de ações repetidas no mesmo lugar, de movimento sem
// sair da área e de ganhos acima do limite por minuto (retorno decrescente, nunca bloqueio).

export const MAX_LEVEL = 100;
export const xpToNext = (L) => Math.round(100 + 18 * L + 1.5 * L * L);
export const METER = 2.2; // unidades do jogo por metro (o corpo mede ~1,8 m)

const steps10 = (level) => Math.floor(level / 10);

// Definições (dados de design, versionados aqui e no doc 12)
export const ATTRS = {
  folego: {
    nome: 'Fôlego', icone: 'bolt', ativo: true,
    treino: 'Ande e corra por caminhos de verdade; subidas rendem mais.',
    marcos: { 10: 'Passo Constante', 25: 'Corrida Sustentada', 50: 'Segundo Fôlego', 75: 'Ritmo de Explorador', 100: 'Resistência de Jornada' },
    bonus: (L) => `+${Math.min(30, 3 * steps10(L))}% de fôlego máximo · +${Math.min(20, 2 * steps10(L))}% de recuperação`,
  },
  forca: {
    nome: 'Força', icone: 'fist', ativo: true,
    treino: 'Escale, suba bordas e conclua desafios físicos. Em combate: acerte golpes.',
    marcos: { 10: 'Pegada Firme', 25: 'Empurrão Forte', 50: 'Arremesso', 75: 'Quebra-obstáculos', 100: 'Golpe Carregado' },
    bonus: (L) => `+${L - 1} de fôlego máximo (1 por nível)`,
  },
  agilidade: {
    nome: 'Agilidade', icone: 'run', ativo: true,
    treino: 'Suba obstáculos, salte entre paredes, corra na parede, deslize e role nas quedas.',
    marcos: { 10: 'Passo Leve', 25: 'Arranque', 50: 'Corpo Ágil', 75: 'Transições Limpas', 100: 'Domínio do Corpo' },
    bonus: (L) => `+${Math.min(20, 2 * steps10(L))}% de aceleração e controle no ar`,
  },
  natacao: {
    nome: 'Natação', icone: 'bubble', ativo: true,
    treino: 'Nade e mergulhe se deslocando de verdade. Boiar parado não conta.',
    marcos: { 10: 'Braçada Estável', 25: 'Mergulho Eficiente', 50: 'Curva e Impulso', 75: 'Controle em Correnteza', 100: 'Mestre das Marés' },
    bonus: (L) => `+${Math.min(20, 2 * steps10(L))}% de velocidade na água · +${Math.min(20, 2 * steps10(L))}% de ar`,
  },
  resistencia: {
    nome: 'Resistência Física', icone: 'shield', ativo: false,
    treino: 'Receba golpes de inimigos de verdade (chega com o combate).',
    marcos: { 20: 'Postura Firme', 40: 'Recuperação Consistente', 60: 'Menos Empurrão', 80: 'Proteção contra Interrupções', 100: 'Corpo Temperado' },
    bonus: (L) => `+${Math.min(15, 1.5 * steps10(L)).toLocaleString('pt-BR')}% de mitigação física`,
  },
  reflexos: {
    nome: 'Reflexos', icone: 'dash', ativo: false,
    treino: 'Esquive de ataques que iam acertar (chega com o combate).',
    marcos: { 15: 'Leitura de Intenção', 35: 'Passo Responsivo', 55: 'Contra-ataque', 75: 'Cancelamento', 100: 'Instinto de Combate' },
    bonus: (L) => `+${Math.min(10, steps10(L))}% de eficiência de esquiva`,
  },
  defesa: {
    nome: 'Defesa', icone: 'shield', ativo: false,
    treino: 'Bloqueie e apare golpes (chega com o combate).',
    marcos: { 20: 'Guarda Firme', 50: 'Aparo', 100: 'Muralha' },
    bonus: () => 'Bônus modestos de bloqueio, com limite',
  },
  elemental: {
    nome: 'Resistência Elemental', icone: 'fruit', ativo: false,
    treino: 'Enfrente fogo, gelo, raio e corrosão (chega com o combate).',
    marcos: { 25: 'Pele Curtida', 50: 'Afinidades', 100: 'Corpo Elemental' },
    bonus: () => 'Bônus modestos por elemento, com limite',
  },
  voo: {
    nome: 'Voo', icone: 'glider', ativo: false,
    treino: 'Só com voo de raça, fruta, forma ou item. Pairar parado não conta.',
    marcos: { 25: 'Curvas Fechadas', 50: 'Pouso Preciso', 100: 'Senhor do Céu' },
    bonus: () => 'Controle aéreo',
  },
};
export const ATTR_KEYS = Object.keys(ATTRS);

export function newTraining() {
  return { attrs: Object.fromEntries(ATTR_KEYS.map((k) => [k, { level: 1, xp: 0 }])), history: [] };
}

export function normalizeTraining(t) {
  const base = newTraining();
  if (!t || typeof t !== 'object') return base;
  for (const k of ATTR_KEYS) {
    const a = t.attrs?.[k];
    const level = Math.max(1, Math.min(MAX_LEVEL, Math.floor(Number(a?.level)) || 1));
    const xp = Math.max(0, Number(a?.xp) || 0);
    base.attrs[k] = { level, xp: level >= MAX_LEVEL ? 0 : Math.min(xp, xpToNext(level) - 1e-6) };
  }
  base.history = Array.isArray(t.history) ? t.history.slice(-40) : [];
  return base;
}

export const progress = (a) => (a.level >= MAX_LEVEL ? 1 : Math.min(1, a.xp / xpToNext(a.level)));

export function nextMilestone(key, level) {
  const m = Object.keys(ATTRS[key].marcos).map(Number).sort((a, b) => a - b).find((l) => l > level);
  return m ? { level: m, nome: ATTRS[key].marcos[m] } : null;
}

// Bônus atuais (com tetos). Fôlego máximo = (base + 1 por nível de Força acima do 1) × bônus
// de Fôlego; a base é 100 mais os pontos de status distribuídos (status.js).
export function bonuses(t, staminaBase = 100) {
  const a = (k) => t.attrs[k].level;
  const s = (k) => steps10(a(k));
  return {
    staminaMax: (staminaBase + (a('forca') - 1)) * (1 + Math.min(0.3, 0.03 * s('folego'))),
    staminaRegen: 1 + Math.min(0.2, 0.02 * s('folego')),
    swimSpeed: 1 + Math.min(0.2, 0.02 * s('natacao')),
    breath: 1 + Math.min(0.2, 0.02 * s('natacao')),
    response: 1 + Math.min(0.2, 0.02 * s('agilidade')),
    airControl: 1 + Math.min(0.2, 0.02 * s('agilidade')),
  };
}

// Adiciona XP já validado; sobe níveis e devolve os marcos atingidos
export function addXp(t, key, amount) {
  const a = t.attrs[key];
  if (!a || a.level >= MAX_LEVEL || !(amount > 0)) return { levels: 0, marcos: [] };
  a.xp += amount;
  let levels = 0;
  const marcos = [];
  while (a.level < MAX_LEVEL && a.xp >= xpToNext(a.level)) {
    a.xp -= xpToNext(a.level);
    a.level += 1;
    levels += 1;
    if (ATTRS[key].marcos[a.level]) marcos.push({ level: a.level, nome: ATTRS[key].marcos[a.level] });
  }
  if (a.level >= MAX_LEVEL) a.xp = 0;
  return { levels, marcos };
}

// ===== Antifarm =====
export class AntiFarm {
  constructor() {
    this.repeats = new Map(); // chave da ação -> { count, t, x, z }
    this.minute = new Map(); // atributo -> [{ t, xp }]
  }

  // Ação igual no mesmo lugar em pouco tempo rende cada vez menos
  repetition(key, pos, now) {
    const r = this.repeats.get(key);
    if (r && now - r.t < 25 && Math.hypot(pos.x - r.x, pos.z - r.z) < 6 * METER) {
      r.count += 1;
      r.t = now;
      return Math.max(0.05, Math.pow(0.6, r.count));
    }
    this.repeats.set(key, { count: 0, t: now, x: pos.x, z: pos.z });
    return 1;
  }

  // Limite suave por minuto e por atributo (cresce um pouco com o nível)
  softCap(attr, level, xp, now) {
    const list = (this.minute.get(attr) || []).filter((g) => now - g.t < 60);
    const sum = list.reduce((s, g) => s + g.xp, 0);
    const cap = 40 + 2 * level;
    const factor = sum <= cap ? 1 : cap / (cap + (sum - cap));
    list.push({ t: now, xp: xp * factor });
    this.minute.set(attr, list);
    return Math.max(0.05, factor);
  }
}

// ===== Rastreador de prática (eventos do mundo -> XP) =====
// Recebe o controlador a cada passo (posição real, estado) e os eventos de movimento.
export class TrainingTracker {
  constructor(training, { onGain = () => {}, onLevel = () => {}, onDiminished = () => {} } = {}) {
    this.t = training;
    this.onGain = onGain;
    this.onLevel = onLevel;
    this.onDiminished = onDiminished;
    this.farm = new AntiFarm();
    this.now = 0;
    this.prev = null;
    this.acc = { folego: 0, natacao: 0, forca: 0, agilidade: 0 };
    this.trail = []; // posições a cada 1 s (área percorrida)
    this.trailTimer = 0;
  }

  // Quanto o jogador realmente saiu do lugar nos últimos 20 s (0..1); vaivém curto rende pouco
  spread() {
    if (this.trail.length < 5) return 1;
    const cx = this.trail.reduce((s, p) => s + p.x, 0) / this.trail.length;
    const cz = this.trail.reduce((s, p) => s + p.z, 0) / this.trail.length;
    const r = Math.max(...this.trail.map((p) => Math.hypot(p.x - cx, p.z - cz)));
    return Math.min(1, r / (10 * METER));
  }

  grant(attr, base, key, pos, { repeat = true } = {}) {
    if (!ATTRS[attr].ativo || !(base > 0)) return 0;
    const a = this.t.attrs[attr];
    const rep = repeat ? this.farm.repetition(key, pos, this.now) : 1;
    const cap = this.farm.softCap(attr, a.level, base * rep, this.now);
    const xp = base * rep * cap;
    if (rep * cap < 0.3) this.onDiminished(attr);
    const r = addXp(this.t, attr, xp);
    this.t.history.push({ attr, xp: Math.round(xp * 10) / 10, key, at: Date.now() });
    if (this.t.history.length > 40) this.t.history.shift();
    this.onGain(attr, xp, progress(a));
    if (r.levels) this.onLevel(attr, a.level, r.marcos);
    return xp;
  }

  // Deslocamento real por passo: Fôlego (andar/correr), Natação, Força e Agilidade (escalada)
  step(dt, ctl) {
    this.now += dt;
    const pos = ctl.pos;
    this.trailTimer += dt;
    if (this.trailTimer >= 1) {
      this.trailTimer = 0;
      this.trail.push({ x: pos.x, z: pos.z });
      if (this.trail.length > 20) this.trail.shift();
    }
    if (!this.prev) {
      this.prev = { x: pos.x, y: pos.y, z: pos.z };
      return;
    }
    const dx = pos.x - this.prev.x;
    const dy = pos.y - this.prev.y;
    const dz = pos.z - this.prev.z;
    this.prev = { x: pos.x, y: pos.y, z: pos.z };
    const horiz = Math.hypot(dx, dz);
    // teleporte (reaparecer, viagem) não conta
    if (horiz > 1.5 || Math.abs(dy) > 3) return;
    const m = horiz / METER;
    const s = ctl.state;
    const spread = this.spread();
    if (s === 'ground' && m > 0) {
      const running = ctl.speed > 4.3;
      const uphill = dy > 0 && horiz > 0 ? Math.min(1, dy / horiz / 0.5) : 0;
      this.acc.folego += m * (running ? 0.04 : 0.02) * (1 + 0.3 * uphill) * spread;
    } else if ((s === 'swim' || s === 'dive') && m > 0) {
      this.acc.natacao += m * 0.06 * (s === 'dive' ? 1.3 : 1) * spread;
    } else if (s === 'climb' && dy > 0) {
      this.acc.forca += (dy / METER) * 0.15;
      this.acc.agilidade += (dy / METER) * 0.08;
    }
    for (const attr of ['folego', 'natacao', 'forca', 'agilidade']) {
      if (this.acc[attr] >= 1) {
        const chunk = Math.floor(this.acc[attr]);
        this.acc[attr] -= chunk;
        this.grant(attr, chunk, `${attr}:distancia`, pos, { repeat: false });
      }
    }
  }

  // Eventos discretos do controlador (já validados pela física)
  event(name, data, ctl) {
    const p = ctl.pos;
    switch (name) {
      case 'mantle':
        if (data.rise >= 2.6) {
          this.grant('forca', 3, 'subirBorda', p);
          this.grant('agilidade', 1, 'subirBorda', p);
        } else this.grant('agilidade', 3, 'transpor', p);
        break;
      case 'wallJump': this.grant('agilidade', 2, 'saltoParede', p); break;
      case 'grab': if (data.kind === 'wallrun') this.grant('agilidade', 3, 'corridaParede', p); break;
      case 'slide': this.grant('agilidade', 1, 'deslize', p); break;
      case 'roll': this.grant('agilidade', 4, 'rolamento', p); break;
      case 'land':
        // aterrissagem correta de altura (sem dano e sem rolar)
        if (!data.hard && data.fall > 3 * METER) this.grant('agilidade', 2, 'aterrissagem', p);
        break;
      default:
    }
  }

  // Desafios físicos da missão de treino (uma vez cada)
  challenge(objectiveId, ctl) {
    const map = {
      escalar: 'forca', torre: 'forca', borda: 'forca',
      saltoParede: 'agilidade', corridaParede: 'agilidade', deslizar: 'agilidade', rolar: 'agilidade', planar: 'agilidade', tunel: 'agilidade', saltoDuplo: 'agilidade',
      mergulhar: 'natacao',
    };
    if (map[objectiveId]) this.grant(map[objectiveId], 15, `desafio:${objectiveId}`, ctl.pos, { repeat: false });
  }
}
