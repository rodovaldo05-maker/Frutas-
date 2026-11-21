// Missão principal da Ilha de Treino: um objetivo por movimento. O progresso fica no
// salvamento; a recompensa é recebida na janela de Missões.

export const TRAINING = {
  id: 'treino',
  title: 'Treino de movimento',
  sub: 'Aprenda a se mover pela Ilha de Treino. Siga as placas.',
  reward: { coins: 1000, xp: 500 },
  objectiveXp: 60, // experiência por objetivo
  objectives: [
    { id: 'escalar', text: 'Escale uma parede de pedra' },
    { id: 'torre', text: 'Chegue ao topo da torre' },
    { id: 'borda', text: 'Agarre uma borda' },
    { id: 'saltoDuplo', text: 'Dê um salto duplo' },
    { id: 'saltoParede', text: 'Salte de uma parede' },
    { id: 'corridaParede', text: 'Corra pela parede' },
    { id: 'planar', text: 'Plane por 3 segundos' },
    { id: 'deslizar', text: 'Deslize correndo' },
    { id: 'rolar', text: 'Role numa queda alta' },
    { id: 'tunel', text: 'Atravesse o túnel agachado' },
    { id: 'mergulhar', text: 'Mergulhe na lagoa' },
  ],
};

export class TrainingMission {
  // state: objeto salvo { done: [], claimed, tracked }
  constructor(state, { onObjective = () => {}, onComplete = () => {} } = {}) {
    this.state = state;
    state.done = Array.isArray(state.done) ? state.done.filter((id) => TRAINING.objectives.some((o) => o.id === id)) : [];
    state.claimed = !!state.claimed;
    state.tracked = state.tracked !== false;
    this.onObjective = onObjective;
    this.onComplete = onComplete;
  }

  get total() {
    return TRAINING.objectives.length;
  }

  get count() {
    return this.state.done.length;
  }

  get complete() {
    return this.count >= this.total;
  }

  has(id) {
    return this.state.done.includes(id);
  }

  next() {
    return TRAINING.objectives.find((o) => !this.has(o.id)) || null;
  }

  mark(id) {
    if (this.has(id) || !TRAINING.objectives.some((o) => o.id === id)) return false;
    this.state.done.push(id);
    const obj = TRAINING.objectives.find((o) => o.id === id);
    this.onObjective(obj, this.count, this.total);
    if (this.complete) this.onComplete();
    return true;
  }

  // Confere o estado do personagem a cada passo. ctx: { towerTopY }
  check(ctl, ctx = {}) {
    const s = ctl.state;
    if (s === 'climb') this.mark('escalar');
    if (s === 'hang') this.mark('borda');
    if (s === 'wallrun') this.mark('corridaParede');
    if (s === 'slide') this.mark('deslizar');
    if (s === 'glide' && ctl.stateTime >= 3) this.mark('planar');
    if (s === 'dive' && ctl.submerged > 0.9) this.mark('mergulhar');
    if (s === 'ground' && ctx.towerTopY !== undefined && Math.abs(ctl.pos.x - 30) < 3.3 && Math.abs(ctl.pos.z + 12) < 3.3 && ctl.pos.y > ctx.towerTopY - 1) this.mark('torre');
    if (ctl.crouched && ctl.pos.x > -11.7 && ctl.pos.x < -8.3 && ctl.pos.z > 31.5 && ctl.pos.z < 40.5) this.mark('tunel');
  }

  event(name) {
    if (name === 'doubleJump') this.mark('saltoDuplo');
    if (name === 'wallJump') this.mark('saltoParede');
    if (name === 'roll') this.mark('rolar');
  }

  // Recebe a recompensa uma única vez
  claim() {
    if (!this.complete || this.state.claimed) return null;
    this.state.claimed = true;
    return { ...TRAINING.reward };
  }
}
