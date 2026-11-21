// HUD da fase de movimento: vida, fôlego (só aparece quando gasta), ar embaixo d'água,
// estado do movimento, dica da placa mais próxima, avisos curtos e painel de desempenho.

import { MOVE } from '../movement/config.js';

const $ = (id) => document.getElementById(id);

export function stateLabel(ctl) {
  const s = ctl.state;
  if (s === 'ground') {
    if (ctl.crouched) return ctl.speed > 0.3 ? 'Agachado andando' : 'Agachado';
    if (ctl.speed < 0.3) return 'Parado';
    if (ctl.inWater) return 'Na água rasa';
    return ctl.speed > MOVE.run + 0.4 ? 'Correndo' : 'Andando';
  }
  if (s === 'air') {
    if (ctl.wallSliding) return 'Deslizando na parede';
    if (ctl.fallTime > MOVE.freeFallTime) return 'Queda livre';
    return ctl.vel.y > 0 ? 'Pulando' : 'Caindo';
  }
  return {
    climb: 'Escalando', hang: 'Pendurado na borda', mantle: 'Subindo', swim: ctl.speed > 0.4 ? 'Nadando' : 'Boiando',
    dive: 'Mergulhando', glide: 'Planando', wallrun: 'Correndo na parede', slide: 'Deslizando', slopeSlide: 'Escorregando',
    roll: 'Rolamento', faint: 'Desmaiado', sink: 'Afundando (usuário de fruta)',
  }[s] || s;
}

export class Hud {
  constructor() {
    this.el = {
      health: $('bar-health'), healthText: $('txt-health'),
      stamina: $('bar-stamina'), staminaText: $('txt-stamina'),
      air: $('bar-air'), airBox: $('box-air'),
      level: $('txt-level'), name: $('txt-name'), coins: $('txt-coins'), frags: $('txt-frags'), portrait: $('portrait'),
      xp: $('bar-xp'), xpText: $('txt-xp'), badge: $('status-badge'),
      state: $('state'), hint: $('hint'), hintTitle: $('hint-title'), hintText: $('hint-text'),
      toasts: $('toasts'), stats: $('stats'), sprint: $('btn-sprint'), water: $('water-overlay'),
      vignette: $('damage-overlay'), keys: $('keys'),
      tracker: $('tracker'), trackerTitle: $('tracker-title'), trackerStep: $('tracker-step'), trackerReward: $('tracker-reward'),
    };
    this.timer = 0;
    this.lastHint = null;
    this.showStats = false;
    this.flash = 0;
    this.keysTimer = 25;
  }

  setPortrait(url) {
    this.el.portrait.src = url;
  }

  setProfile({ level = 1, title = 'Aprendiz', coins = 0, fragments = 0, statusPoints = 0, xpRatio = 0, fruitLabel = '', fruitColor = '' }) {
    this.el.level.textContent = `Nv. ${level}`;
    this.el.xp.style.transform = `scaleX(${xpRatio})`;
    this.el.xpText.textContent = `Exp ${Math.floor(xpRatio * 100)}%`;
    this.el.badge.classList.toggle('hidden', statusPoints < 1);
    this.el.badge.textContent = statusPoints > 99 ? '99+' : String(statusPoints);
    this.el.name.textContent = title;
    const sub = $('txt-sub');
    sub.textContent = fruitLabel ? `Fruta ${fruitLabel}` : 'Ilha de Treino';
    sub.style.color = fruitColor || '';
    this.el.coins.textContent = coins.toLocaleString('pt-BR');
    this.el.frags.textContent = fragments.toLocaleString('pt-BR');
  }

  setTracker({ visible, title, step, reward, done }) {
    const t = this.el.tracker;
    t.classList.toggle('hidden', !visible);
    t.classList.toggle('done', !!done);
    if (!visible) return;
    this.el.trackerTitle.textContent = title;
    this.el.trackerStep.textContent = step;
    this.el.trackerReward.innerHTML = reward;
  }

  levelUp() {
    const p = this.el.portrait.parentElement;
    p.classList.remove('level-up');
    void p.offsetWidth; // reinicia a animação
    p.classList.add('level-up');
  }

  // fruta comida no retrato (com a cor do nível) e no título
  setFruit(info) {
    const badge = $('fruit-badge');
    badge.classList.toggle('hidden', !info);
    if (!info) return;
    $('fruit-badge-img').src = info.thumb;
    badge.style.setProperty('--r', info.color);
    badge.title = info.label;
  }

  setSprint(on) {
    this.el.sprint.classList.toggle('active', on);
  }

  toast(text, kind = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.textContent = text;
    this.el.toasts.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2200);
    setTimeout(() => t.remove(), 2700);
    while (this.el.toasts.children.length > 3) this.el.toasts.firstChild.remove();
  }

  damageFlash() {
    this.flash = 1;
  }

  update(dt, { ctl, signs, underwater, stats }) {
    const el = this.el;
    // barras (todo quadro: só transform/opacity)
    el.health.style.transform = `scaleX(${ctl.health / ctl.maxHealth})`;
    const st = ctl.stamina.value / ctl.stamina.max;
    el.stamina.style.transform = `scaleX(${st})`;
    el.stamina.classList.toggle('tired', ctl.stamina.exhausted);
    const breath = ctl.breath / MOVE.breath;
    el.airBox.style.opacity = ctl.state === 'dive' || breath < 0.999 ? '1' : '0';
    el.air.style.transform = `scaleX(${breath})`;
    el.air.classList.toggle('low', breath < 0.3);
    el.water.classList.toggle('on', underwater);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    el.vignette.style.opacity = this.flash.toFixed(2);
    if (this.keysTimer > 0) {
      this.keysTimer -= dt;
      if (this.keysTimer <= 0) el.keys.classList.add('fade');
    }

    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = 0.1;
    el.healthText.textContent = `Vida: ${Math.ceil(ctl.health)} / ${ctl.maxHealth}`;
    el.staminaText.textContent = `Fôlego: ${Math.round(ctl.stamina.value)} / ${Math.round(ctl.stamina.max)}`;
    el.state.textContent = stateLabel(ctl);

    // placa mais próxima
    let near = null;
    let best = 7.5;
    for (const s of signs) {
      const d = Math.abs(ctl.pos.y - (s.y ?? ctl.pos.y)) > 7 ? Infinity : Math.hypot(s.x - ctl.pos.x, s.z - ctl.pos.z);
      if (d < best) {
        best = d;
        near = s;
      }
    }
    if (near !== this.lastHint) {
      this.lastHint = near;
      el.hint.classList.toggle('on', !!near);
      if (near) {
        el.hintTitle.textContent = near.title;
        el.hintText.textContent = near.hint;
      }
    }

    if (this.showStats && stats) {
      el.stats.textContent = [
        `${stats.fps} qps · ${stats.frameMs.toFixed(1)} ms`,
        `qualidade ${stats.quality} · resolução ${(stats.scale * 100).toFixed(0)}%`,
        `chamadas ${stats.calls} · triângulos ${(stats.triangles / 1000).toFixed(0)} mil`,
        `estado ${ctl.state} · vel ${ctl.speed.toFixed(2)} · vy ${ctl.vel.y.toFixed(2)}`,
        `pos ${ctl.pos.x.toFixed(1)} ${ctl.pos.y.toFixed(1)} ${ctl.pos.z.toFixed(1)}`,
      ].join('\n');
    }
  }

  setStatsVisible(on) {
    this.showStats = on;
    this.el.stats.classList.toggle('on', on);
  }
}
