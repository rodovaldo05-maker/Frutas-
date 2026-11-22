// Barra de equipar (1 Fruta · 2 Arma · 3 Estilo · 4 livre · Mochila) e lista de habilidades
// do item equipado, à direita: "Usar" · tecla (Z X C V) · nome, com custo de energia,
// recarga correndo por cima do nome e cadeado com o domínio necessário. Também cuida da
// barra de Energia do status.

import { AWAKEN_LEVEL } from '../fruits/powers.js';
import { ICONS } from './icons.js';

const $ = (id) => document.getElementById(id);
export const SKILL_KEYS = ['Z', 'X', 'C', 'V'];
export const EQUIP = ['fruta', 'arma', 'estilo', 'livre'];

export class SkillBar {
  constructor() {
    this.slots = [1, 2, 3, 4].map((n) => $(`eq-${n}`));
    this.title = $('skill-title');
    this.rows = $('skill-rows');
    this.list = $('skill-list');
    this.energyBox = $('box-energy');
    this.energyBar = $('bar-energy');
    this.energyText = $('txt-energy');
    this.powers = [];
    this.fruit = null;
    this.equipped = 'estilo';
  }

  // Ícones e nomes dos slots de equipar
  setSlots({ fruit, fruitThumb, fruitColor, styleName, weapon = null }) {
    const fill = (el, { img, icon, label, empty, color }) => {
      el.classList.toggle('empty', !!empty);
      el.style.borderColor = color || '';
      const n = el.querySelector('i').outerHTML;
      el.innerHTML = `${n}${img ? `<img src="${img}" alt="" />` : icon ? ICONS[icon] : ''}<span class="lbl">${label}</span>`;
    };
    fill(this.slots[0], fruit ? { img: fruitThumb, label: fruit.name, color: fruitColor } : { label: 'Fruta', empty: true });
    fill(this.slots[1], weapon ? { icon: 'sword', label: weapon.nome.split(' ').slice(-1)[0], color: weapon.corRaridade } : { label: 'Arma', empty: true });
    fill(this.slots[2], { icon: 'fist', label: styleName });
    fill(this.slots[3], { label: '', empty: true });
    this.highlight();
  }

  setEquipped(name) {
    this.equipped = name;
    this.highlight();
  }

  highlight() {
    this.slots.forEach((el, i) => el.classList.toggle('on', EQUIP[i] === this.equipped));
  }

  // Lista de habilidades do item equipado
  setSkills({ title, color, powers = [], domainLevel = 1, note = '', lockLabel = 'Dom.', awaken = true }) {
    this.powers = powers;
    this.domainLevel = domainLevel;
    this.title.textContent = title;
    this.list.style.setProperty('--fruit', color || '#6a4a2a');
    const rows = powers.map((p, i) => {
      const locked = domainLevel < p.unlock;
      return `<button data-btn class="skill-row${locked ? ' locked' : ''}" data-skill="${i}" title="${p.nome}: ${p.detalhe}">
        <span class="use">Usar</span><kbd>${SKILL_KEYS[i]}</kbd>
        <span class="name">${locked ? `<span class="req">[${lockLabel} ${p.unlock}]</span>` : `${p.curto.length > 18 ? p.nome.split(' ')[0] : p.nome}${p.custo ? `<small>${p.custo}</small>` : ''}<span class="cd"></span><span class="sec"></span>`}</span>
      </button>`;
    });
    if (powers.length && awaken) {
      rows.push(`<button data-btn class="skill-row locked" data-skill="3" title="Despertar: domínio ${AWAKEN_LEVEL}"><span class="use">Usar</span><kbd>V</kbd><span class="name"><span class="req">[Dom. ${AWAKEN_LEVEL}]</span></span></button>`);
    }
    if (note) rows.push(`<div class="skill-note">${note}</div>`);
    this.rows.innerHTML = rows.join('');
    this.rowEls = [...this.rows.querySelectorAll('.skill-row')];
  }

  setEnergyVisible(on) {
    this.energyBox.classList.toggle('hidden', !on);
    document.body.classList.toggle('has-energy', on);
  }

  // energy: sistema dos poderes (barra de Energia); powers: sistema do item equipado
  update(energy, active, powers = energy) {
    if (!this.energyBox.classList.contains('hidden')) {
      const e = energy.energy;
      this.energyBar.style.transform = `scaleX(${Math.max(0, e / energy.energyMax)})`;
      const text = `Energia ${Math.floor(e)} / ${energy.energyMax}`;
      if (this.energyText.textContent !== text) this.energyText.textContent = text;
    }
    if (!active || !this.rowEls) return;
    for (let i = 0; i < this.powers.length; i++) {
      const p = this.powers[i];
      const el = this.rowEls[i];
      if (!el || el.classList.contains('locked')) continue;
      const cd = powers.cooldown[i] || 0; // slot sem recarga registrada = pronto
      const ready = cd <= 0;
      el.style.setProperty('--cd', ready ? '0' : String(Math.min(1, cd / (p.recarga || 1))));
      const sec = el.querySelector('.sec');
      if (sec) sec.textContent = ready ? '' : cd >= 1 ? String(Math.ceil(cd)) : cd.toFixed(1).replace('.', ',');
      el.classList.toggle('low', ready && powers.energy < p.custo);
      el.classList.toggle('casting', powers.casting?.p === p);
    }
  }
}
