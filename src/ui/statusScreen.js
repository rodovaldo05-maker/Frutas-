// Tela de Status (doc 10, seção 5.1): nível, experiência, pontos livres e os 5 status
// com +1 / +10 / Máx e o efeito de cada um. Redistribuir é grátis uma vez.

import { STATUS_KEYS, STATUS_INFO, allocate, resetStatus, maxHealth, maxStamina, normalizeStatus } from '../progression/status.js';
import { xpToNext, MAX_LEVEL } from '../progression/level.js';
import { ICONS } from './icons.js';

const $ = (id) => document.getElementById(id);
const ICON = { forca: 'fist', defesa: 'shield', fruta: 'fruit', espada: 'sword', vitalidade: 'vital' };
const fmt = (n) => n.toLocaleString('pt-BR');

export class StatusScreen {
  constructor({ save, onChange }) {
    this.save = save;
    this.onChange = onChange;
    $('btn-respec').addEventListener('click', () => {
      if (!this.save.freeRespec) return;
      if (resetStatus(this.save) > 0) this.save.freeRespec = false;
      this.changed();
    });
    $('status-rows').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-key]');
      if (!b) return;
      const amount = b.dataset.amount === 'max' ? this.save.statusPoints : Number(b.dataset.amount);
      if (allocate(this.save, b.dataset.key, amount)) this.changed();
    });
  }

  setFigure(url) {
    $('status-figure').src = url;
  }

  changed() {
    this.render();
    this.onChange();
  }

  render() {
    const s = this.save;
    const status = normalizeStatus(s.status);
    const points = s.statusPoints || 0;
    const need = xpToNext(s.level);
    $('status-name').textContent = s.title || 'Aprendiz';
    $('status-level').textContent = s.level >= MAX_LEVEL ? `Nível ${s.level} (Máx)` : `Nível ${s.level}`;
    $('status-xp-bar').style.transform = `scaleX(${s.level >= MAX_LEVEL ? 1 : Math.min(1, (s.xp || 0) / need)})`;
    $('status-xp-text').textContent = s.level >= MAX_LEVEL ? 'Nível máximo' : `${fmt(s.xp || 0)} / ${fmt(need)} exp`;
    $('status-points').textContent = fmt(points);
    $('status-summary').innerHTML = `<span>Vida máxima <b>${fmt(maxHealth(status))}</b></span><span>Fôlego máximo <b>${fmt(maxStamina(status))}</b></span>`;
    $('status-rows').innerHTML = STATUS_KEYS.map((k) => {
      const info = STATUS_INFO[k];
      const v = status[k];
      const dis = points < 1 ? 'disabled' : '';
      const dis10 = points < 10 ? 'disabled' : '';
      return `<div class="stat-row ${k}">
        ${ICONS[ICON[k]]}
        <span class="name"><b>${info.name}</b><small>${info.effect(v)}</small></span>
        <span class="val">${fmt(v)}</span>
        <span class="plus">
          <button data-key="${k}" data-amount="1" ${dis} aria-label="Mais 1 em ${info.name}">+1</button>
          <button data-key="${k}" data-amount="10" ${dis10} aria-label="Mais 10 em ${info.name}">+10</button>
          <button data-key="${k}" data-amount="max" ${dis} aria-label="Todos os pontos em ${info.name}">Máx</button>
        </span>
      </div>`;
    }).join('');
    const total = STATUS_KEYS.reduce((sum, k) => sum + status[k], 0);
    const respec = $('btn-respec');
    respec.disabled = !s.freeRespec || total === 0;
    respec.lastChild.textContent = s.freeRespec ? 'Redistribuir (grátis uma vez)' : 'Redistribuir: no Mestre de Missões (em breve)';
  }
}
