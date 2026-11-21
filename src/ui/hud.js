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
    roll: 'Rolamento', faint: 'Desmaiado',
  }[s] || s;
}

export class Hud {
  constructor() {
    this.el = {
      health: $('bar-health'), healthText: $('txt-health'),
      stamina: $('bar-stamina'), staminaBox: $('box-stamina'),
      air: $('bar-air'), airBox: $('box-air'),
      state: $('state'), hint: $('hint'), hintTitle: $('hint-title'), hintText: $('hint-text'),
      toasts: $('toasts'), stats: $('stats'), sprint: $('btn-sprint'), water: $('water-overlay'),
      vignette: $('damage-overlay'),
    };
    this.timer = 0;
    this.lastHint = null;
    this.showStats = false;
    this.staminaVisible = 0;
    this.flash = 0;
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
    const st = ctl.stamina.value / 100;
    el.stamina.style.transform = `scaleX(${st})`;
    el.stamina.classList.toggle('tired', ctl.stamina.exhausted);
    this.staminaVisible = st < 0.995 ? 1 : Math.max(0, this.staminaVisible - dt * 0.8);
    el.staminaBox.style.opacity = this.staminaVisible.toFixed(2);
    const breath = ctl.breath / MOVE.breath;
    el.airBox.style.opacity = ctl.state === 'dive' || breath < 0.999 ? '1' : '0';
    el.air.style.transform = `scaleX(${breath})`;
    el.air.classList.toggle('low', breath < 0.3);
    el.water.classList.toggle('on', underwater);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    el.vignette.style.opacity = this.flash.toFixed(2);

    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = 0.1;
    el.healthText.textContent = `${Math.ceil(ctl.health)}/${ctl.maxHealth}`;
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
