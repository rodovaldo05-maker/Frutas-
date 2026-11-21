// Janelas da roleta de frutas, da mochila e do Trocador de Fragmentos (doc 10, 5.2, 6.2, 6.3).
// As regras ficam em fruits/roulette.js; aqui só a apresentação e os toques.

import {
  RARITIES, BAG_SIZE, SPIN_COST, FRAGMENTS_PER_KEY, spin, spinBlock, trade, tradeValue, makeKeys, bulkCandidates,
  toggleFav, discard, hold, sortBag, findItem, ensureBag,
} from '../fruits/roulette.js';
import { ICONS } from './icons.js';

const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString('pt-BR');

export class FruitShop {
  constructor({ save, fruits, thumbs, audio, toast, openModal, closeModal, onChange, onHold, onEat }) {
    Object.assign(this, { save, fruits, thumbs, audio, toast, openModal, closeModal, onChange, onHold, onEat });
    this.filter = 'todas';
    this.sort = 'nivel';
    this.selected = null;
    this.spinning = false;
    this.lastWin = null;
    this.confirmResolve = null;
    ensureBag(save);

    $('spin-1').addEventListener('click', () => this.doSpin(1, false));
    $('spin-10').addEventListener('click', () => this.doSpin(10, false));
    $('spin-key-1').addEventListener('click', () => this.doSpin(1, true));
    $('spin-key-10').addEventListener('click', () => this.doSpin(10, true));
    $('r-hold').addEventListener('click', () => {
      if (this.lastWin) this.setHeld(this.lastWin.uid);
      this.renderRoulette();
    });
    $('r-bag').addEventListener('click', () => {
      this.closeModal('roulette');
      this.openModal('bag');
    });

    for (const b of document.querySelectorAll('[data-filter]')) {
      b.addEventListener('click', () => {
        this.filter = b.dataset.filter;
        for (const o of document.querySelectorAll('[data-filter]')) o.classList.toggle('active', o === b);
        this.renderBag();
      });
    }
    for (const b of document.querySelectorAll('[data-sort]')) {
      b.addEventListener('click', () => {
        this.sort = b.dataset.sort;
        for (const o of document.querySelectorAll('[data-sort]')) o.classList.toggle('active', o === b);
        this.renderBag();
      });
    }
    $('bag-grid').addEventListener('click', (e) => {
      const card = e.target.closest('[data-uid]');
      if (!card) return;
      this.selected = Number(card.dataset.uid);
      this.renderBag();
    });
    $('bag-hold').addEventListener('click', () => {
      const it = this.sel();
      if (!it) return;
      this.setHeld(this.save.held === it.uid ? null : it.uid);
      this.renderBag();
    });
    $('bag-eat').addEventListener('click', async () => {
      const it = this.sel();
      if (!it) return;
      const now = this.save.eaten ? `Sua fruta atual (${this.label(this.save.eaten)}) será substituída.` : 'Você só pode ter uma fruta por vez.';
      if (!(await this.confirm(`Comer a fruta ${this.label(it)}? ${now} Usuários de fruta afundam na água funda (exceto Maré e Geada).`))) return;
      this.closeModal('bag');
      this.onEat(it);
    });
    $('bag-trade').addEventListener('click', () => this.tradeOne(this.sel()));
    $('bag-fav').addEventListener('click', () => {
      const it = this.sel();
      if (!it) return;
      toggleFav(this.save, it.uid);
      this.changed();
      this.renderBag();
    });
    $('bag-drop').addEventListener('click', async () => {
      const it = this.sel();
      if (!it) return;
      if (!(await this.confirm(`Jogar fora a fruta ${this.label(it)}? Ela some para sempre.`))) return;
      discard(this.save, it.uid);
      if (this.save.held === null) this.onHold(null);
      this.selected = null;
      this.changed();
      this.renderBag();
    });

    $('t-key1').addEventListener('click', () => this.keys(1));
    $('t-keyall').addEventListener('click', () => this.keys(Infinity));
    $('t-all-comum').addEventListener('click', () => this.tradeBulk('comum'));
    $('t-all-epico').addEventListener('click', () => this.tradeBulk('epico'));
    $('t-grid').addEventListener('click', (e) => {
      const card = e.target.closest('[data-uid]');
      if (card) this.tradeOne(findItem(this.save, Number(card.dataset.uid)));
    });

    $('confirm-yes').addEventListener('click', () => this.answer(true));
    $('confirm-no').addEventListener('click', () => this.answer(false));
  }

  // ===== utilidades =====
  index(id) {
    return this.fruits.findIndex((f) => f.id === id);
  }

  label(it) {
    return `${this.fruits[this.index(it.fruit)]?.name ?? it.fruit} · ${RARITIES[it.rarity].name}`;
  }

  thumb(id) {
    return this.thumbs()[this.index(id)];
  }

  sel() {
    return this.selected !== null ? findItem(this.save, this.selected) : null;
  }

  card(it, extra = '') {
    const f = this.fruits[this.index(it.fruit)];
    const r = RARITIES[it.rarity];
    return `<div class="fcard ${it.rarity}" style="--r:${r.color}" data-uid="${it.uid ?? ''}">
      ${it.uid === this.save.held ? '<span class="tag">Na mão</span>' : ''}${it.fav ? '<span class="fav">★</span>' : ''}
      <img src="${this.thumb(it.fruit)}" alt="" /><b>${f?.name ?? it.fruit}</b><small>${r.name}</small>${extra}</div>`;
  }

  changed() {
    this.onChange();
  }

  setHeld(uid) {
    hold(this.save, uid);
    this.onHold(this.save.held);
    this.changed();
  }

  // Caixa de confirmação (promessa)
  confirm(text) {
    $('confirm-text').textContent = text;
    this.openModal('confirm');
    return new Promise((resolve) => (this.confirmResolve = resolve));
  }

  answer(yes) {
    const r = this.confirmResolve;
    this.confirmResolve = null;
    this.closeModal('confirm');
    r?.(yes);
  }

  // chamado quando a confirmação é fechada por fora (Esc, voltar)
  onModalClosed(id) {
    if (id === 'confirm' && this.confirmResolve) {
      const r = this.confirmResolve;
      this.confirmResolve = null;
      r(false);
    }
  }

  // ===== Roleta =====
  renderRoulette() {
    const s = this.save;
    $('r-coins').textContent = fmt(s.coins);
    $('r-keys').textContent = fmt(s.keys);
    $('r-mine').innerHTML = s.eaten
      ? `<img src="${this.thumb(s.eaten.fruit)}" alt="" /> Sua fruta: <b style="color:${RARITIES[s.eaten.rarity].color}">${this.label(s.eaten)}</b>`
      : 'Sua fruta: nenhuma';
    const buttons = [['spin-1', 1, false], ['spin-10', 10, false], ['spin-key-1', 1, true], ['spin-key-10', 10, true]];
    for (const [id, n, keys] of buttons) {
      const reason = spinBlock(s, n, keys);
      const b = $(id);
      b.disabled = this.spinning;
      b.classList.toggle('blocked', !!reason); // continua tocável para mostrar o motivo
      b.dataset.reason = reason || '';
    }
    if (!this.spinning) $('spin-reason').textContent = '';
    $('r-pool').innerHTML = this.fruits.map((f) => `<img src="${this.thumb(f.id)}" title="${f.name}${f.category === 'Mítica' ? ' (Mítica: metade da chance)' : ''}" alt="${f.name}" />`).join('');
    $('r-actions').classList.toggle('hidden', !this.lastWin || this.spinning || !findItem(s, this.lastWin.uid));
    $('r-hold').lastChild.textContent = this.lastWin && s.held === this.lastWin.uid ? 'Na mão' : 'Segurar na mão';
  }

  async doSpin(count, useKeys) {
    if (this.spinning) return;
    const reason = spinBlock(this.save, count, useKeys);
    $('spin-reason').textContent = reason || '';
    if (reason) return;
    const res = spin(this.save, this.fruits, count, { useKeys });
    if (!res.ok) return;
    this.spinning = true;
    this.lastWin = null;
    this.renderRoulette();
    this.changed();
    if (count === 1) await this.animateStrip(res.results[0]);
    else await this.animateGrid(res.results);
    this.spinning = false;
    this.lastWin = res.results[res.results.length - 1];
    if (count > 1) this.lastWin = null;
    this.renderRoulette();
  }

  animateStrip(win) {
    const stage = $('roulette-stage');
    const filler = () => ({ fruit: this.fruits[Math.floor(Math.random() * this.fruits.length)].id, rarity: Math.random() < 0.06 ? 'lendario' : Math.random() < 0.3 ? 'epico' : 'comum' });
    const items = Array.from({ length: 38 }, filler);
    const winAt = 32;
    items[winAt] = win;
    stage.innerHTML = `<div class="pointer"></div><div class="strip" id="strip">${items.map((it) => this.card(it)).join('')}</div>`;
    const strip = $('strip');
    const cards = strip.children;
    const cw = cards[0].offsetWidth;
    const step = cards[1].offsetLeft - cards[0].offsetLeft;
    const jitter = (Math.random() - 0.5) * cw * 0.6;
    const end = -(winAt * step + cw / 2 - stage.clientWidth / 2) + jitter;
    const duration = 3200;
    const t0 = performance.now();
    let lastIndex = -1;
    return new Promise((resolve) => {
      const tick = (now) => {
        const u = Math.min(1, (now - t0) / duration);
        const e = 1 - Math.pow(1 - u, 3.6); // desacelera até parar
        const x = end * e;
        strip.style.transform = `translateX(${x}px)`;
        const idx = Math.floor((-x + stage.clientWidth / 2) / step);
        if (idx !== lastIndex) {
          lastIndex = idx;
          this.audio.tone(520 + (idx % 3) * 60, 0.05);
        }
        if (u < 1) requestAnimationFrame(tick);
        else {
          strip.style.transform = `translateX(${end - jitter}px)`;
          cards[winAt].classList.add('win');
          this.celebrate(win);
          setTimeout(resolve, 350);
        }
      };
      requestAnimationFrame(tick);
    });
  }

  animateGrid(results) {
    const stage = $('roulette-stage');
    stage.innerHTML = `<div class="result-grid" id="rgrid"></div><div class="summary" id="rsum"></div>`;
    const grid = $('rgrid');
    return new Promise((resolve) => {
      results.forEach((it, k) => {
        setTimeout(() => {
          grid.insertAdjacentHTML('beforeend', this.card(it).replace('class="fcard', 'class="fcard flip'));
          this.audio.tone(it.rarity === 'lendario' ? 880 : it.rarity === 'epico' ? 700 : 560, 0.07);
          if (k === results.length - 1) {
            const n = (r) => results.filter((x) => x.rarity === r).length;
            $('rsum').textContent = `${n('comum')} Comum · ${n('epico')} Épico · ${n('lendario')} Lendário`;
            if (n('lendario')) this.celebrate({ ...results.find((x) => x.rarity === 'lendario') });
            setTimeout(resolve, 300);
          }
        }, 160 * k);
      });
    });
  }

  celebrate(it) {
    if (it.rarity === 'lendario') {
      this.audio.play('base', 'wing', 1);
      [660, 880, 1100].forEach((hz, k) => setTimeout(() => this.audio.tone(hz, 0.18), k * 110));
    } else this.audio.tone(it.rarity === 'epico' ? 780 : 620, 0.16);
    this.toast(`Nova fruta: ${this.label(it)}`, it.rarity === 'lendario' ? 'gold' : 'good');
  }

  // ===== Mochila =====
  renderBag() {
    const s = this.save;
    $('bag-title').textContent = `Mochila de frutas · ${s.bag.length}/${BAG_SIZE}`;
    $('bag-frags').textContent = fmt(s.fragments);
    $('bag-keys').textContent = fmt(s.keys);
    let list = sortBag(s.bag, this.sort, this.fruits);
    if (this.filter === 'fav') list = list.filter((it) => it.fav);
    else if (this.filter !== 'todas') list = list.filter((it) => it.rarity === this.filter);
    $('bag-grid').innerHTML = list.length
      ? list.map((it) => this.card(it).replace('class="fcard', `class="fcard${it.uid === this.selected ? ' sel' : ''}`)).join('')
      : `<div class="empty-grid">${s.bag.length ? 'Nenhuma fruta neste filtro.' : 'A mochila está vazia. Gire a roleta com o Mercador de Frutas, na praia.'}</div>`;
    const it = this.sel();
    if (!it) this.selected = null;
    $('bag-selected').innerHTML = it ? `Selecionada: <b style="color:${RARITIES[it.rarity].color}">${this.label(it)}</b>` : 'Toque numa fruta para ver as ações.';
    for (const id of ['bag-hold', 'bag-eat', 'bag-trade', 'bag-fav', 'bag-drop']) $(id).disabled = !it;
    $('bag-hold').lastChild.textContent = it && s.held === it.uid ? 'Guardar' : 'Segurar';
    $('bag-fav').lastChild.textContent = it?.fav ? 'Desfavoritar' : 'Favoritar';
    $('bag-trade').lastChild.textContent = it ? `Trocar (+${tradeValue(it)})` : 'Trocar';
  }

  async tradeOne(it) {
    if (!it) return;
    const careful = it.rarity !== 'comum' || it.fav || it.uid === this.save.held;
    if (careful && !(await this.confirm(`Trocar ${this.label(it)} por ${tradeValue(it)} fragmento(s)?`))) return;
    const held = this.save.held === it.uid;
    const got = trade(this.save, [it.uid]);
    if (held) this.onHold(null);
    if (this.selected === it.uid) this.selected = null;
    this.toast(`+${got} fragmento(s)`, 'good');
    this.audio.tone(990, 0.08);
    this.changed();
    this.renderBag();
    this.renderTrader();
  }

  async tradeBulk(rarity) {
    const list = bulkCandidates(this.save, rarity);
    if (!list.length) {
      this.toast(`Nenhuma fruta ${RARITIES[rarity].name} para trocar (favoritas e a da mão ficam de fora)`);
      return;
    }
    const total = list.reduce((sum, it) => sum + tradeValue(it), 0);
    if (rarity !== 'comum' && !(await this.confirm(`Trocar ${list.length} fruta(s) ${RARITIES[rarity].name} por ${total} fragmentos?`))) return;
    trade(this.save, list.map((it) => it.uid));
    this.toast(`+${total} fragmentos`, 'good');
    this.audio.tone(990, 0.1);
    this.changed();
    this.renderTrader();
  }

  keys(n) {
    const made = makeKeys(this.save, n);
    if (!made) {
      this.toast(`Faltam ${FRAGMENTS_PER_KEY - (this.save.fragments % FRAGMENTS_PER_KEY)} fragmento(s) para uma chave`);
      return;
    }
    this.toast(`+${made} chave(s)`, 'gold');
    this.audio.play('base', 'wing', 0.7);
    this.changed();
    this.renderTrader();
  }

  // ===== Trocador =====
  renderTrader() {
    const s = this.save;
    $('t-frags').textContent = fmt(s.fragments);
    $('t-keys').textContent = fmt(s.keys);
    const part = s.fragments % FRAGMENTS_PER_KEY;
    const ready = Math.floor(s.fragments / FRAGMENTS_PER_KEY);
    $('t-bar').style.transform = `scaleX(${ready ? 1 : part / FRAGMENTS_PER_KEY})`;
    $('t-progress').textContent = ready ? `${ready} chave(s) prontas para criar` : `${part}/${FRAGMENTS_PER_KEY} para a próxima chave`;
    $('t-key1').disabled = ready < 1;
    $('t-keyall').disabled = ready < 2;
    $('t-keyall').lastChild.textContent = ready >= 2 ? `Criar ${ready} chaves` : 'Criar todas';
    for (const r of ['comum', 'epico']) {
      const list = bulkCandidates(s, r);
      const total = list.reduce((sum, it) => sum + tradeValue(it), 0);
      $(`t-all-${r}`).textContent = `Trocar todas as ${r === 'comum' ? 'Comuns' : 'Épicas'} (+${total})`;
      $(`t-all-${r}`).disabled = !list.length;
    }
    const list = sortBag(s.bag, 'nivel', this.fruits);
    $('t-grid').innerHTML = list.length
      ? list.map((it) => this.card(it, `<span class="value">+${tradeValue(it)}</span>`)).join('')
      : '<div class="empty-grid">Sem frutas para trocar. Gire a roleta com o Mercador de Frutas.</div>';
  }

  // custo para exibir
  static price(n) {
    return fmt(n * SPIN_COST);
  }

  icon(name) {
    return ICONS[name];
  }
}
