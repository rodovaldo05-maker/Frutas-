// Barra de habilidades (slots 1–4 da barra de baixo) e barra de Energia do HUD.
// Cada slot mostra o nome curto da habilidade na cor da fruta, o custo, a recarga girando,
// e o cadeado com o domínio necessário. O slot 4 é o despertar (bloqueado por enquanto).

import { AWAKEN_LEVEL } from '../fruits/powers.js';

const $ = (id) => document.getElementById(id);

export class SkillBar {
  constructor() {
    this.slots = [1, 2, 3, 4].map((n) => $(`slot-${n}`));
    this.energyBox = $('box-energy');
    this.energyBar = $('bar-energy');
    this.energyText = $('txt-energy');
    this.key = '';
  }

  // Monta os slots para a fruta comida (ou limpa sem fruta)
  setFruit(fruit, powers, domainLevel) {
    this.fruit = fruit;
    this.powers = powers;
    this.domainLevel = domainLevel;
    this.energyBox.classList.toggle('hidden', !fruit);
    document.body.classList.toggle('has-energy', !!fruit);
    this.slots.forEach((el, i) => {
      const p = powers[i];
      el.classList.toggle('skill', !!fruit);
      el.style.setProperty('--fruit', fruit?.color || 'transparent');
      if (!fruit) {
        el.innerHTML = `<i>${i + 1}</i>`;
        el.title = 'Coma uma fruta para liberar os poderes';
        return;
      }
      if (i === 3) {
        el.innerHTML = `<i>4</i><b>Despertar</b><span class="lock">Dom. ${AWAKEN_LEVEL}</span>`;
        el.classList.add('locked');
        el.title = `Despertar de ${fruit.name}: domínio ${AWAKEN_LEVEL} (próximas atualizações)`;
        return;
      }
      const locked = domainLevel < p.unlock;
      el.classList.toggle('locked', locked);
      el.innerHTML = `<i>${i + 1}</i><b>${p.curto}</b><small>${p.custo}</small>${locked ? `<span class="lock">Dom. ${p.unlock}</span>` : ''}<span class="cd"></span>`;
      el.title = `${p.nome}: ${p.detalhe} (energia ${p.custo}, recarga ${String(p.recarga).replace('.', ',')} s)`;
    });
  }

  update(powers) {
    if (!this.fruit) return;
    const e = powers.energy;
    this.energyBar.style.transform = `scaleX(${Math.max(0, e / powers.energyMax)})`;
    const text = `Energia: ${Math.floor(e)} / ${powers.energyMax}`;
    if (this.energyText.textContent !== text) this.energyText.textContent = text;
    for (let i = 0; i < 3; i++) {
      const p = this.powers[i];
      const el = this.slots[i];
      if (!p) continue;
      const cd = powers.cooldown[i];
      const ready = cd <= 0;
      el.style.setProperty('--cd', ready ? '0' : String(cd / p.recarga));
      const span = el.querySelector('.cd');
      if (span) span.textContent = ready ? '' : cd >= 1 ? String(Math.ceil(cd)) : cd.toFixed(1).replace('.', ',');
      el.classList.toggle('low', ready && e < p.custo);
      el.classList.toggle('cooling', !ready);
      el.classList.toggle('casting', powers.casting?.p === p);
    }
  }
}
