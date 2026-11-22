// Comprador de Itens: vende armaduras e acessórios que caíram dos inimigos, chefes e navios
// (ou que sobraram). Lista as peças da mochila com o valor de venda; equipadas aparecem
// marcadas e não são vendidas. "Vender todos" pede um segundo toque para confirmar.

import { ITEMS, QUALITY, SLOT_NAMES, itemLabel, itemMult, sellValue, sellItem, sellMany, isEquipped } from '../items/items.js';

const $ = (id) => document.getElementById(id);
const fmt = (n) => Math.round(n).toLocaleString('pt-BR');
const ATTR_NAMES = { defesa: 'defesa', vida: 'vida', folego: 'fôlego', energia: 'energia', elemental: 'elemental' };
const fmtAttr = (k, v) => (k === 'elemental' ? `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : (Math.round(v * 10) / 10).toLocaleString('pt-BR'));
const QUALITY_ORDER = ['Comum', 'Incomum', 'Rara', 'Épica', 'Lendária', 'Mítica'];

export class SellItemsUi {
  constructor({ save, onSold = () => {} }) {
    this.save = save;
    this.onSold = onSold;
    this.confirm = null; // botão de venda em massa esperando o segundo toque
    $('si-list').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-sell-item]');
      if (!b) return;
      const r = sellItem(this.save, Number(b.dataset.sellItem));
      if (r.ok) this.onSold(`${itemLabel(r.item)} vendido por ${fmt(r.coins)} moedas`, r.coins);
      else this.onSold(r.why, 0, true);
      this.render();
    });
    for (const b of document.querySelectorAll('#sellitems [data-sell-bulk]')) {
      b.addEventListener('click', () => {
        const kind = b.dataset.sellBulk;
        if (this.confirm !== kind) {
          this.confirm = kind;
          this.render();
          return;
        }
        this.confirm = null;
        const filter = kind === 'comuns' ? (it, d) => d.qualidade === 'Comum' && !it.up && !it.estrelas : () => true;
        const r = sellMany(this.save, filter);
        if (r.count) this.onSold(`${r.count} ${r.count === 1 ? 'item vendido' : 'itens vendidos'} por ${fmt(r.coins)} moedas`, r.coins);
        this.render();
      });
    }
  }

  render() {
    const s = this.save;
    $('si-coins').textContent = fmt(s.coins);
    const items = [...(s.items ?? [])].sort((a, b) => {
      const ea = isEquipped(s, a.uid) ? 1 : 0;
      const eb = isEquipped(s, b.uid) ? 1 : 0;
      if (ea !== eb) return ea - eb;
      return QUALITY_ORDER.indexOf(ITEMS[a.id].qualidade) - QUALITY_ORDER.indexOf(ITEMS[b.id].qualidade) || sellValue(a) - sellValue(b);
    });
    const loose = items.filter((it) => !isEquipped(s, it.uid));
    const commons = loose.filter((it) => ITEMS[it.id].qualidade === 'Comum' && !it.up && !it.estrelas);
    const total = (list) => list.reduce((n, it) => n + sellValue(it), 0);
    const bulk = (kind, list, label) => {
      const b = document.querySelector(`#sellitems [data-sell-bulk="${kind}"]`);
      b.disabled = !list.length;
      b.classList.toggle('gold', this.confirm === kind);
      b.textContent = this.confirm === kind ? `Confirmar: ${list.length} por ${fmt(total(list))}` : `${label} (${list.length} · ${fmt(total(list))})`;
    };
    bulk('comuns', commons, 'Vender Comuns');
    bulk('todos', loose, 'Vender todos os não equipados');
    $('si-list').innerHTML = items.length
      ? items.map((it) => {
        const d = ITEMS[it.id];
        const eq = isEquipped(s, it.uid);
        const m = itemMult(it);
        const attrs = Object.entries(d.attrs).map(([k, v]) => `+${fmtAttr(k, v * m)} ${ATTR_NAMES[k]}`).join(' · ');
        const wear = d.dur > 0 ? ` · durabilidade ${Math.round(it.dur ?? d.dur)}/${d.dur}` : '';
        return `<div class="mat-row item-sell" style="--qc:${QUALITY[d.qualidade]}"><span class="ic q"></span>
          <b>${itemLabel(it)}</b><small>${SLOT_NAMES[d.slot]} · ${d.qualidade} · Nv. ${d.nivel} · ${attrs}${wear}</small>
          <div class="row-btns">${eq ? '<span class="tag-eq">Equipado</span>' : `<button class="btn gold" data-sell-item="${it.uid}">Vender · ${fmt(sellValue(it))}</button>`}</div></div>`;
      }).join('')
      : '<p class="muted">Você não tem armaduras nem acessórios. Eles caem de Recrutas, chefes e navios corsários.</p>';
  }
}
