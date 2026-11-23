// Janela do Mestre de Armas: espadas à venda com preço, dano do combo, habilidades (com a
// proficiência que libera cada uma) e botões Comprar / Equipar. Compradas ficam em
// save.weapons; a equipada em save.weapon (slot 2 da barra de baixo).

import { itemIcon } from './sprites.js';
import { WEAPONS, WEAPON_IDS } from '../weapons/weapons.js';
import { profOf, profXpToNext } from '../progression/proficiency.js';
import { ITEMS, ITEM_IDS, QUALITY, SLOT_NAMES, ARMOR_SLOTS, addItem, equipItem, repairCost, repairAll } from '../items/items.js';

const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString('pt-BR');

export class Armory {
  constructor({ save, onBuy, onEquip, onGear, toast }) {
    this.save = save;
    this.onBuy = onBuy;
    this.onEquip = onEquip;
    this.onGear = onGear;
    this.toast = toast;
    this.tab = 'espadas';
    $('armory-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-atab]');
      if (!b) return;
      this.tab = b.dataset.atab;
      for (const o of $('armory-tabs').querySelectorAll('[data-atab]')) o.classList.toggle('active', o === b);
      this.render();
    });
    $('btn-repair').addEventListener('click', () => {
      const cost = repairCost(this.save);
      if (!cost) return this.toast('Nada para consertar.');
      if (this.save.coins < cost) return this.toast(`Conserto custa ${fmt(cost)} moedas.`, 'bad');
      this.save.coins -= cost;
      repairAll(this.save);
      this.toast(`Equipamento consertado por ${fmt(cost)} moedas.`, 'good');
      this.onGear();
      this.render();
    });
    $('armory-list').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-act]');
      if (!b) return;
      if (b.dataset.act === 'buy-item') this.buyItem(b.dataset.id);
      else {
        const w = WEAPONS[b.dataset.id];
        if (b.dataset.act === 'buy') this.buy(w);
        else this.onEquip(w.id);
      }
      this.render();
    });
  }

  buyItem(id) {
    const d = ITEMS[id];
    const s = this.save;
    if (s.level < d.nivel) return this.toast(`${d.nome}: nível recomendado ${d.nivel}.`, 'bad');
    if (s.coins < d.preco) return this.toast(`Faltam ${fmt(d.preco - s.coins)} moedas para ${d.nome}.`, 'bad');
    s.coins -= d.preco;
    const it = addItem(s, id);
    if (!s.gear[d.slot]) equipItem(s, it.uid);
    this.toast(`${d.nome} comprado${s.gear[d.slot] === it.uid ? ' e equipado' : ' (veja em Personagem › Equipamento)'}.`, 'gold');
    this.onGear();
  }

  renderItems(armor) {
    const s = this.save;
    return ITEM_IDS.filter((id) => ARMOR_SLOTS.includes(ITEMS[id].slot) === armor).map((id) => {
      const d = ITEMS[id];
      const owned = s.items.filter((x) => x.id === id).length;
      const attrs = Object.entries(d.attrs).map(([k, v]) => `<li><span>${k === 'elemental' ? 'Resistência elemental' : k === 'folego' ? 'Fôlego' : k[0].toUpperCase() + k.slice(1)}</span><i>+${k === 'elemental' ? `${Math.round(v * 100)}%` : v}</i></li>`).join('');
      return `<div class="weapon-card" style="--rc:${QUALITY[d.qualidade]}">
        <header>${itemIcon(id)}<b>${d.nome}</b><span>${d.qualidade}</span></header>
        <div class="dmg">${SLOT_NAMES[d.slot]} · Nv. ${d.nivel} · peso ${d.peso}${d.dur ? ` · durab. ${d.dur}` : ''}${owned ? ` · tem ${owned}` : ''}</div>
        <ul>${attrs}${d.sinergia ? `<li><span>${d.sinergia.texto}</span></li>` : ''}</ul>
        <button class="btn gold" data-act="buy-item" data-id="${id}" data-icon="coin">Comprar · ${fmt(d.preco)}</button>
      </div>`;
    }).join('');
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
    const cost = repairCost(s);
    $('btn-repair').lastChild.textContent = cost ? `Consertar tudo · ${fmt(cost)}` : 'Nada para consertar';
    if (this.tab !== 'espadas') {
      $('armory-list').innerHTML = this.renderItems(this.tab === 'armaduras');
      return;
    }
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
