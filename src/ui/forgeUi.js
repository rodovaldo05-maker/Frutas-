// Janelas da atualização 12: Forja da Rosa (Forjar com prévia das estrelas possíveis e
// Melhorar com prévia do antes/depois), Vender materiais (Mercadora) e a aba Profissões em
// Personagem (maestrias de Mineração, Pesca e Forja, ferramentas e materiais guardados).

import { materialIcon, itemIcon } from './sprites.js';
import { RECIPES, recipeName, craft, craftBlock, upgrade, upgradeBlock, upgradeCost, previewAttrs, MAX_UP } from '../crafting/forge.js';
import { MATERIALS, MATERIAL_IDS, TOOLS, countOf, sellMaterial } from '../crafting/materials.js';
import { ITEMS, QUALITY, SLOT_NAMES, itemLabel } from '../items/items.js';
import { WEAPONS } from '../weapons/weapons.js';
import { profOf, profXpToNext } from '../progression/proficiency.js';

const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString('pt-BR');
const ATTR_NAMES = { defesa: 'defesa', vida: 'vida', folego: 'fôlego', energia: 'energia', elemental: 'elemental' };
const fmtAttr = (k, v) => (k === 'elemental' ? `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : (Math.round(v * 10) / 10).toLocaleString('pt-BR'));
const matsHtml = (save, mats) => Object.entries(mats).map(([id, n]) => {
  const have = countOf(save, id);
  return `<span class="${have >= n ? 'ok' : 'no'}">${materialIcon(id, MATERIALS[id].icone)} ${MATERIALS[id].nome} ${have}/${n}</span>`;
}).join('');

export const PROFESSIONS = [
  { key: 'mineracao', nome: 'Mineração', dica: 'Minere veios com a Picareta: mais rápido, mais minério e cristal' },
  { key: 'pesca', nome: 'Pesca', dica: 'Pesque com a Vara: mordida mais rápida, janela maior, peixes raros' },
  { key: 'forja', nome: 'Forja', dica: 'Forje e melhore na Rosa: mais chance de estrelas nas peças' },
];

export class ForgeUi {
  constructor({ save, toast, onChange }) {
    Object.assign(this, { save, toast, onChange });
    this.tab = 'forjar';
    $('forge-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-ftab]');
      if (!b) return;
      this.tab = b.dataset.ftab;
      for (const o of $('forge-tabs').querySelectorAll('[data-ftab]')) o.classList.toggle('active', o === b);
      this.render();
    });
    $('fg-list').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-craft], button[data-up]');
      if (!b) return;
      if (b.dataset.craft) this.doCraft(b.dataset.craft);
      else this.doUpgrade(Number(b.dataset.up));
    });
    $('sm-list').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-sell]');
      if (!b) return;
      const coins = sellMaterial(this.save, b.dataset.sell, b.dataset.n === 'all' ? Infinity : 1);
      if (coins) this.toast(`Vendeu por ${fmt(coins)} moedas.`, 'good');
      this.onChange();
      this.renderSell();
    });
  }

  render() {
    const s = this.save;
    $('fg-coins').textContent = fmt(s.coins);
    const p = profOf(s, 'forja');
    $('fg-prof').textContent = `Maestria de Forja Nv. ${p.level} · mais estrelas nas peças forjadas`;
    $('fg-list').innerHTML = this.tab === 'forjar' ? this.recipesHtml() : this.upgradesHtml();
  }

  recipesHtml() {
    const s = this.save;
    return RECIPES.map((r) => {
      const why = craftBlock(s, r);
      const d = r.item ? ITEMS[r.item] : null;
      const w = r.arma ? WEAPONS[r.arma] : null;
      const qc = d ? QUALITY[d.qualidade] : w.corRaridade;
      const attrs = d ? Object.entries(d.attrs).map(([k, v]) => `+${fmtAttr(k, v)} ${ATTR_NAMES[k]}`).join(' · ') : `Espada · combo ${w.dano.join(' · ')}`;
      return `<div class="forge-card" style="--qc:${qc}">
        <header><b>${recipeName(r)}</b><small>${d ? `${SLOT_NAMES[d.slot]} · ${d.qualidade}` : w.raridade}</small></header>
        <div class="attrs">${attrs}${d ? ' · <i>pode sair com até ★★★ (+6% cada)</i>' : ''}</div>
        <div class="mats">${matsHtml(s, r.mats)}<span class="${s.coins >= r.moedas ? 'ok' : 'no'}">🪙 ${fmt(r.moedas)}</span></div>
        ${why ? `<div class="why">${why}</div>` : ''}
        <button class="btn ${why ? '' : 'gold'}" data-craft="${r.id}" ${why ? 'disabled' : ''}>Forjar</button>
      </div>`;
    }).join('');
  }

  upgradesHtml() {
    const s = this.save;
    if (!s.items.length) return '<p class="muted">Você não tem armaduras nem acessórios. Forje, compre no Mestre de Armas ou derrote Recrutas.</p>';
    const eq = new Set(Object.values(s.gear));
    const list = [...s.items].sort((a, b) => (eq.has(b.uid) ? 1 : 0) - (eq.has(a.uid) ? 1 : 0));
    return list.map((it) => {
      const d = ITEMS[it.id];
      const max = (it.up ?? 0) >= MAX_UP;
      const why = upgradeBlock(s, it);
      const c = max ? null : upgradeCost(it);
      const rows = previewAttrs(it, { up: (it.up ?? 0) + 1 }).map((a) => `${ATTR_NAMES[a.k]} ${fmtAttr(a.k, a.now)}${max ? '' : ` → <i>${fmtAttr(a.k, a.next)}</i>`}`).join(' · ');
      return `<div class="forge-card" style="--qc:${QUALITY[d.qualidade]}">
        <header>${itemIcon(it.id)}<b>${itemLabel(it)}</b><small>${SLOT_NAMES[d.slot]}${eq.has(it.uid) ? ' · equipado' : ''}</small></header>
        <div class="attrs">${rows}</div>
        ${max ? '<div class="why">Melhoria máxima (+10)</div>' : `<div class="mats">${matsHtml(s, c.mats)}<span class="${s.coins >= c.moedas ? 'ok' : 'no'}">🪙 ${fmt(c.moedas)}</span></div>`}
        ${why && !max ? `<div class="why">${why}</div>` : ''}
        <button class="btn ${why ? '' : 'gold'}" data-up="${it.uid}" ${why ? 'disabled' : ''}>${max ? 'Máximo' : `Melhorar para +${(it.up ?? 0) + 1}`}</button>
      </div>`;
    }).join('');
  }

  doCraft(id) {
    const r = craft(this.save, id);
    if (!r.ok) return this.toast(r.reason, 'bad');
    if (r.weapon) this.toast(`Forjou ${WEAPONS[r.weapon].nome}! Equipe no slot 2 pelo Mestre de Armas.`, 'gold');
    else this.toast(`Forjou ${itemLabel(r.item)}${r.item.estrelas ? '' : ' (sem estrelas)'} · veja em Personagem › Equipamento`, 'gold');
    if (r.levels) this.toast(`Maestria de Forja Nv. ${profOf(this.save, 'forja').level}!`, 'good');
    this.onChange(r);
    this.render();
  }

  doUpgrade(uid) {
    const r = upgrade(this.save, uid);
    if (!r.ok) return this.toast(r.reason, 'bad');
    this.toast(`${itemLabel(r.item)}: atributos +8%.`, 'gold');
    if (r.levels) this.toast(`Maestria de Forja Nv. ${profOf(this.save, 'forja').level}!`, 'good');
    this.onChange(r);
    this.render();
  }

  renderSell() {
    const s = this.save;
    $('sm-coins').textContent = fmt(s.coins);
    const have = MATERIAL_IDS.filter((id) => countOf(s, id) > 0);
    $('sm-list').innerHTML = have.length
      ? have.map((id) => {
        const m = MATERIALS[id];
        const n = countOf(s, id);
        return `<div class="mat-row"><span class="ic">${materialIcon(id, m.icone)}</span><b>${m.nome} ×${n}</b><small>${m.raridade} · ${fmt(m.valor)} cada · tudo: ${fmt(m.valor * n)}</small>
          <div class="row-btns"><button class="btn" data-sell="${id}" data-n="1">Vender 1</button><button class="btn gold" data-sell="${id}" data-n="all">Vender tudo</button></div></div>`;
      }).join('')
      : '<p class="muted">Sem materiais. Minere, pesque ou derrote Recrutas.</p>';
  }

  // Aba Profissões (Personagem)
  profHtml() {
    const s = this.save;
    const profs = PROFESSIONS.map((p) => {
      const pr = profOf(s, p.key);
      const k = pr.level >= 100 ? 1 : pr.xp / profXpToNext(pr.level);
      return `<div class="prof-row"><b>${p.nome} · Nv. ${pr.level}</b><div><div class="bar xp"><i style="transform:scaleX(${k})"></i><em><span>${Math.floor(k * 100)}%</span></em></div><small class="muted">${p.dica}</small></div></div>`;
    }).join('');
    const tools = Object.entries(TOOLS).map(([id, t]) => `<span class="chip ${s.tools.includes(id) ? 'comum' : ''}">${t.nome}: <b>${s.tools.includes(id) ? 'tem' : 'não tem'}</b></span>`).join(' ');
    const mats = MATERIAL_IDS.filter((id) => countOf(s, id) > 0);
    return `<h4>Maestrias</h4>${profs}
      <h4>Ferramentas</h4><div class="row-btns">${tools}</div>
      <p class="muted">Picareta com a Rosa (Ferreira) e Vara de Pesca com a Joana (Mercadora), no Porto das Origens.</p>
      <h4>Materiais</h4><div class="mat-list">${mats.length ? mats.map((id) => `<div class="mat-row"><span class="ic">${materialIcon(id, MATERIALS[id].icone)}</span><b>${MATERIALS[id].nome} ×${countOf(s, id)}</b><small>${MATERIALS[id].raridade}</small></div>`).join('') : '<p class="muted">Nenhum material ainda.</p>'}</div>`;
  }
}
