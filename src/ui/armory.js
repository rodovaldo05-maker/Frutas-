// Janela do Mestre de Armas: espadas à venda com preço, dano do combo, habilidades (com a
// proficiência que libera cada uma) e botões Comprar / Equipar. Compradas ficam em
// save.weapons; a equipada em save.weapon (slot 2 da barra de baixo).

import { WEAPONS, WEAPON_IDS } from '../weapons/weapons.js';
import { profOf, profXpToNext } from '../progression/proficiency.js';

const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString('pt-BR');

export class Armory {
  constructor({ save, onBuy, onEquip, toast }) {
    this.save = save;
    this.onBuy = onBuy;
    this.onEquip = onEquip;
    this.toast = toast;
    $('armory-list').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-act]');
      if (!b) return;
      const w = WEAPONS[b.dataset.id];
      if (b.dataset.act === 'buy') this.buy(w);
      else this.onEquip(w.id);
      this.render();
    });
  }

  buy(w) {
    const s = this.save;
    s.weapons ??= [];
    if (s.weapons.includes(w.id)) return;
    if (s.coins < w.preco) {
      this.toast(`Faltam ${fmt(w.preco - s.coins)} moedas para a ${w.nome}.`, 'bad');
      return;
    }
    s.coins -= w.preco;
    s.weapons.push(w.id);
    this.toast(`${w.nome} comprada! Equipada no slot 2.`, 'gold');
    this.onBuy(w.id);
  }

  render() {
    const s = this.save;
    const prof = profOf(s, 'espada');
    $('a-coins').textContent = fmt(s.coins);
    $('a-prof').textContent = `Nv. ${prof.level}`;
    const p = prof.level >= 100 ? 1 : prof.xp / profXpToNext(prof.level);
    $('a-prof-bar').style.transform = `scaleX(${p})`;
    $('a-prof-text').textContent = `${Math.floor(p * 100)}% · acerte inimigos com a espada`;
    $('armory-list').innerHTML = WEAPON_IDS.map((id) => {
      const w = WEAPONS[id];
      const owned = (s.weapons || []).includes(id);
      const equipped = owned && s.weapon === id;
      const skills = w.habilidades.map((h) => `<li class="${prof.level >= h.unlock ? '' : 'off'}"><span>${h.nome}</span><i>${prof.level >= h.unlock ? `${h.dano} dano` : `Prof. ${h.unlock}`}</i></li>`).join('');
      const btn = !owned
        ? `<button class="btn gold" data-act="buy" data-id="${id}" data-icon="coin">Comprar · ${fmt(w.preco)}</button>`
        : equipped ? '<button class="btn" disabled>Equipada</button>' : `<button class="btn gold" data-act="equip" data-id="${id}">Equipar</button>`;
      return `<div class="weapon-card" style="--rc:${w.corRaridade}">
        <header><b>${w.nome}</b><span>${w.raridade}</span></header>
        <p>${w.descricao}</p>
        <div class="dmg">Combo: ${w.dano.join(' · ')} de dano</div>
        <ul>${skills}</ul>
        ${btn}
      </div>`;
    }).join('');
  }
}
