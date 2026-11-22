// Condições no jogador (documento mestre 4.0, seção 27; atualização 6). Cada uma tem origem,
// duração, resistência (Resistência Elemental e raça), efeito visual, contrajogo e regra de
// acúmulo:
// - Queimando (fogo): 2/3/4 de dano a cada 0,5 s (1 a 3 acúmulos); a água apaga e rolar encurta.
// - Congelado (gelo forte): não anda nem ataca; esquivar/defender antes evita.
// - Lento (gelo): −40% de velocidade.
// - Choque (raio): cargas; com 3 cargas fica atordoado 0,8 s; molhado ganha carga extra.
// - Molhado (água): apaga queimando; deixa mais vulnerável a choque.

export const CONDITIONS = {
  queimando: { nome: 'Queimando', cor: '#ff7a2a', icone: '🔥', dica: 'Entre na água ou role para apagar' },
  congelado: { nome: 'Congelado', cor: '#7fd6ff', icone: '❄', dica: 'Defenda ou esquive dos golpes de gelo' },
  lento: { nome: 'Lento', cor: '#9fc8e8', icone: '🐢', dica: 'Passa sozinho' },
  choque: { nome: 'Choque', cor: '#ffe45a', icone: '⚡', dica: 'Com 3 cargas você fica atordoado' },
  molhado: { nome: 'Molhado', cor: '#5ab4ff', icone: '💧', dica: 'Apaga o fogo; o raio pega mais' },
};

export class Conditions {
  // resist(): { duration (multiplicador), }
  constructor({ resist = () => ({ duration: 1 }), onEvent = () => {} } = {}) {
    this.resist = resist;
    this.onEvent = onEvent;
    this.list = new Map(); // nome -> { t, stacks }
    this.tick = 0;
  }

  has(name) {
    return this.list.has(name);
  }

  get(name) {
    return this.list.get(name);
  }

  // Aplica uma condição vinda de um golpe ou do ambiente
  apply(name, { duration = 0, stacks = 1 } = {}) {
    const d = duration * this.resist().duration;
    const cur = this.list.get(name);
    switch (name) {
      case 'queimando':
        if (this.has('molhado')) return null; // molhado não pega fogo
        this.list.set(name, { t: Math.max(cur?.t ?? 0, d), stacks: Math.min(3, (cur?.stacks ?? 0) + stacks) });
        break;
      case 'choque': {
        const extra = this.has('molhado') ? 1 : 0;
        const total = (cur?.stacks ?? 0) + stacks + extra;
        if (total >= 3) {
          this.list.delete('choque');
          this.apply('atordoado', { duration: 0.8 });
          this.onEvent('stun', { from: 'choque' });
          return 'atordoado';
        }
        this.list.set(name, { t: 6, stacks: total });
        break;
      }
      case 'molhado':
        this.list.delete('queimando');
        this.list.set(name, { t: Math.max(cur?.t ?? 0, duration), stacks: 1 });
        break;
      default:
        this.list.set(name, { t: Math.max(cur?.t ?? 0, d), stacks: 1 });
    }
    this.onEvent('apply', { name });
    return name;
  }

  clear(name) {
    this.list.delete(name);
  }

  // Rolar no chão encurta a queimadura
  onRoll() {
    const b = this.list.get('queimando');
    if (b) b.t = Math.max(0, b.t - 1.5);
  }

  // Avança; aplica os efeitos no controlador (dano, travas e lentidão)
  update(dt, ctl) {
    const inWater = ctl.state === 'swim' || ctl.state === 'dive' || ctl.state === 'sink' || ctl.inWater;
    if (inWater) this.apply('molhado', { duration: 8 });
    this.tick += dt;
    const burn = this.list.get('queimando');
    if (burn && this.tick >= 0.5) {
      this.tick = 0;
      const dmg = burn.stacks + 1; // 2, 3 ou 4 a cada 0,5 s
      ctl.damage(dmg, 'queimadura');
      this.onEvent('burn', { damage: dmg });
    } else if (!burn) this.tick = Math.min(this.tick, 0.5);
    for (const [name, c] of this.list) {
      c.t -= dt;
      if (c.t <= 0) this.list.delete(name);
    }
    const frozen = this.list.get('congelado');
    const stunned = this.list.get('atordoado');
    const lock = Math.max(frozen?.t ?? 0, stunned?.t ?? 0);
    if (lock > 0) ctl.stunned = Math.max(ctl.stunned, lock);
    ctl.slowMult = this.has('lento') ? 0.6 : 1;
  }

  // Para o HUD: [{ nome, icone, cor, t, stacks }]
  view() {
    return [...this.list].filter(([n]) => CONDITIONS[n] || n === 'atordoado').map(([n, c]) => ({
      id: n, ...(CONDITIONS[n] ?? { nome: 'Atordoado', icone: '💫', cor: '#ffd45e' }), t: c.t, stacks: c.stacks,
    }));
  }

  reset() {
    this.list.clear();
  }
}
