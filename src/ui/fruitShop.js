// Janelas da roleta de frutas, da mochila e do Trocador de Fragmentos.
// Regras em fruits/roulette.js e fruits/catalog.js; aqui só apresentação e toques.
// A raridade é da fruta (6 ranks, cores do catálogo). A obtenção revela primeiro a
// silhueta, depois o rank e por fim a fruta, com opção de pular (especificação, Parte A §8).

import {
  BAG_SIZE, FRAGMENTS_PER_KEY, spin, spinBlock, trade, tradeValue, makeKeys, bulkCandidates, pityLeft,
  toggleFav, discard, hold, sortBag, findItem, ensureBag, rarityOf,
} from '../fruits/roulette.js';
import { RANK, RANKS, FRUITS, FRUIT, TABLES, chances, fruitLabel } from '../fruits/catalog.js';

const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString('pt-BR');
const pct = (x) => `${(x * 100).toLocaleString('pt-BR', { maximumFractionDigits: x < 0.01 ? 2 : 1 })}%`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export class FruitShop {
  constructor({ save, thumbs, audio, toast, openModal, closeModal, onChange, onHold, onEat, onDetail, reducedFx }) {
    Object.assign(this, { save, thumbs, audio, toast, openModal, closeModal, onChange, onHold, onEat, onDetail, reducedFx });
    this.filter = 'todas';
    this.sort = 'nivel';
    this.selected = null;
    this.spinning = false;
    this.skip = false;
    this.lastWin = null;
    this.confirmResolve = null;
    ensureBag(save);

    $('spin-1').addEventListener('click', () => this.doSpin(1, false));
    $('spin-10').addEventListener('click', () => this.doSpin(10, false));
    $('spin-key-1').addEventListener('click', () => this.doSpin(1, true));
    $('spin-key-10').addEventListener('click', () => this.doSpin(10, true));
    $('r-skip').addEventListener('click', () => (this.skip = true));
    $('r-hold').addEventListener('click', () => {
      if (this.lastWin) this.setHeld(this.lastWin.uid);
      this.renderRoulette();
    });
    $('r-bag').addEventListener('click', () => {
      this.closeModal('roulette');
      this.openModal('bag');
    });
    $('r-catalog').addEventListener('click', () => this.openModal('catalog'));
    $('bag-catalog').addEventListener('click', () => this.openModal('catalog'));
    $('r-pool').addEventListener('click', (e) => {
      const img = e.target.closest('[data-fruit]');
      if (img) this.onDetail(img.dataset.fruit);
    });

    for (const b of document.querySelectorAll('[data-filter]')) {
      b.addEventListener('click', () => {
        this.filter = b.dataset.filter;
        for (const o of document.querySelectorAll('[data-filter]')) o.classList.toggle('active', o === b);
        this.renderBag();
      });
    }
    for (const b of document.querySelectorAll('#bag-sort [data-sort]')) {
      b.addEventListener('click', () => {
        this.sort = b.dataset.sort;
        for (const o of document.querySelectorAll('#bag-sort [data-sort]')) o.classList.toggle('active', o === b);
        this.renderBag();
      });
    }
    $('bag-grid').addEventListener('click', (e) => {
      const card = e.target.closest('[data-uid]');
      if (!card) return;
      const uid = Number(card.dataset.uid);
      if (this.selected === uid) this.onDetail(findItem(this.save, uid)?.fruit); // segundo toque abre a ficha
      this.selected = uid;
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
      const now = this.save.eaten ? `Sua fruta atual (${fruitLabel(this.save.eaten.fruit)}) será substituída.` : 'Você só pode ter uma fruta por vez.';
      const water = ['mare', 'geada'].includes(it.fruit) ? '' : ' Usuários desta fruta afundam na água funda.';
      if (!(await this.confirm(`Comer a fruta ${fruitLabel(it.fruit)}? ${now}${water}`))) return;
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
      if (!(await this.confirm(`Jogar fora a fruta ${fruitLabel(it.fruit)}? Ela some para sempre.`))) return;
      discard(this.save, it.uid);
      if (this.save.held === null) this.onHold(null);
      this.selected = null;
      this.changed();
      this.renderBag();
    });

    $('t-key1').addEventListener('click', () => this.keys(1));
    $('t-keyall').addEventListener('click', () => this.keys(Infinity));
    for (const r of ['comum', 'incomum', 'rara']) $(`t-all-${r}`).addEventListener('click', () => this.tradeBulk(r));
    $('t-grid').addEventListener('click', (e) => {
      const card = e.target.closest('[data-uid]');
      if (card) this.tradeOne(findItem(this.save, Number(card.dataset.uid)));
    });

    $('confirm-yes').addEventListener('click', () => this.answer(true));
    $('confirm-no').addEventListener('click', () => this.answer(false));
  }

  // ===== utilidades =====
  thumb(id) {
    return this.thumbs()[FRUITS.findIndex((f) => f.id === id)];
  }

  sel() {
    return this.selected !== null ? findItem(this.save, this.selected) : null;
  }

  // Cartão de fruta com moldura do rank; opções: sil (silhueta), hide (esconde o rank)
  card(it, { extra = '', sil = false, hide = false, cls = '' } = {}) {
    const f = FRUIT[it.fruit];
    const r = RANK[it.rarity ?? rarityOf(it)];
    return `<div class="fcard r-${r.id}${sil ? ' sil' : ''}${hide ? ' hidden-rank' : ''} ${cls}" style="--r:${r.cor}" data-uid="${it.uid ?? ''}" data-fruit="${it.fruit}">
      ${it.uid !== undefined && it.uid === this.save.held ? '<span class="tag">Na mão</span>' : ''}${it.fav ? '<span class="fav">★</span>' : ''}
      <img src="${this.thumb(it.fruit)}" alt="" /><b><span class="real">${f?.nome ?? it.fruit}</span><span class="mask">???</span></b><small>${r.nome}</small>${extra}</div>`;
  }

  changed() {
    this.onChange();
  }

  setHeld(uid) {
    hold(this.save, uid);
    this.onHold(this.save.held);
    this.changed();
  }

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

  onModalClosed(id) {
    if (id === 'confirm' && this.confirmResolve) {
      const r = this.confirmResolve;
      this.confirmResolve = null;
      r(false);
    }
    if (id === 'roulette') this.skip = true;
  }

  // ===== Roleta =====
  renderRoulette() {
    const s = this.save;
    $('r-coins').textContent = fmt(s.coins);
    $('r-keys').textContent = fmt(s.keys);
    $('r-mine').innerHTML = s.eaten
      ? `<img src="${this.thumb(s.eaten.fruit)}" alt="" /> Sua fruta: <b style="color:${RANK[rarityOf(s.eaten)].cor}">${fruitLabel(s.eaten.fruit)}</b>`
      : 'Sua fruta: nenhuma';
    for (const [id, n, keys] of [['spin-1', 1, false], ['spin-10', 10, false], ['spin-key-1', 1, true], ['spin-key-10', 10, true]]) {
      const b = $(id);
      b.disabled = this.spinning;
      b.classList.toggle('blocked', !!spinBlock(s, n, keys)); // continua tocável para mostrar o motivo
    }
    if (!this.spinning) $('spin-reason').textContent = '';
    // chances reais da tabela ativa
    const c = chances('roleta');
    $('r-chips').innerHTML = RANKS.map((r) => `<span class="chip r-${r.id}" style="--r:${r.cor}"><b>${r.nome}</b> ${pct(c.porRank[r.id])}</span>`).join('');
    const g = TABLES.roleta.garantia;
    const left = pityLeft(s);
    $('r-pity').textContent = g?.ativa ? `Garantia: ${RANK[g.minimo].nome} ou melhor em até ${left} giro(s).` : '';
    $('r-pool').innerHTML = [...FRUITS].sort((a, b) => RANK[b.raridade].ordem - RANK[a.raridade].ordem)
      .map((f) => `<img src="${this.thumb(f.id)}" data-fruit="${f.id}" style="--r:${RANK[f.raridade].cor}" title="${f.nome} · ${RANK[f.raridade].nome} · ${pct(c.porFruta[f.id] || 0)}" alt="${f.nome}" />`).join('');
    $('r-actions').classList.toggle('hidden', !this.lastWin || this.spinning || !findItem(s, this.lastWin.uid));
    $('r-hold').lastChild.textContent = this.lastWin && s.held === this.lastWin.uid ? 'Na mão' : 'Segurar na mão';
  }

  async doSpin(count, useKeys) {
    if (this.spinning) return;
    const reason = spinBlock(this.save, count, useKeys);
    $('spin-reason').textContent = reason || '';
    if (reason) return;
    const res = spin(this.save, count, { useKeys });
    if (!res.ok) return;
    this.spinning = true;
    this.skip = false;
    this.lastWin = null;
    $('r-skip').classList.remove('hidden');
    this.renderRoulette();
    this.changed();
    if (count === 1) await this.revealOne(res.results[0]);
    else await this.revealMany(res.results);
    $('r-skip').classList.add('hidden');
    this.spinning = false;
    this.lastWin = count === 1 ? res.results[0] : null;
    this.renderRoulette();
  }

  // espera respeitando o "Pular"
  async pause(ms) {
    const step = 40;
    for (let t = 0; t < ms && !this.skip; t += step) await wait(step);
  }

  // ×1: faixa de silhuetas desliza e para; revela o rank e depois a fruta
  async revealOne(win) {
    const stage = $('roulette-stage');
    const fast = this.reducedFx();
    const filler = () => {
      const f = FRUITS[Math.floor(Math.random() * FRUITS.length)];
      return { fruit: f.id, rarity: f.raridade };
    };
    const items = Array.from({ length: 34 }, filler);
    const winAt = 28;
    items[winAt] = win;
    stage.innerHTML = `<div class="pointer"></div><div class="strip" id="strip">${items.map((it) => this.card(it, { sil: true, hide: true })).join('')}</div>`;
    const strip = $('strip');
    const cards = strip.children;
    const cw = cards[0].offsetWidth;
    const step = cards[1].offsetLeft - cards[0].offsetLeft;
    const end = -(winAt * step + cw / 2 - stage.clientWidth / 2);
    const duration = fast ? 1100 : 2600;
    const t0 = performance.now();
    let lastIndex = -1;
    await new Promise((resolve) => {
      const tick = (now) => {
        const u = this.skip ? 1 : Math.min(1, (now - t0) / duration);
        const x = end * (1 - Math.pow(1 - u, 3.4));
        strip.style.transform = `translateX(${x}px)`;
        const idx = Math.floor((-x + stage.clientWidth / 2) / step);
        if (idx !== lastIndex && !this.skip) {
          lastIndex = idx;
          this.audio.tone(520 + (idx % 3) * 60, 0.04);
        }
        if (u < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    const card = cards[winAt];
    // 1) rank
    card.classList.remove('hidden-rank');
    card.classList.add('rank-in');
    this.audio.tone(440 + RANK[win.rarity].ordem * 110, 0.12);
    await this.pause(fast ? 200 : 700);
    // 2) fruta
    card.classList.remove('sil');
    card.classList.add('win');
    this.celebrate(win);
    await this.pause(300);
  }

  // ×10: cartões em silhueta mostram o rank um a um; depois as frutas aparecem
  async revealMany(results) {
    const stage = $('roulette-stage');
    const fast = this.reducedFx();
    stage.innerHTML = `<div class="result-grid" id="rgrid">${results.map((it) => this.card(it, { sil: true, hide: true, cls: 'pending' })).join('')}</div><div class="summary" id="rsum"></div>`;
    const cards = [...$('rgrid').children];
    for (let k = 0; k < cards.length; k++) {
      cards[k].classList.remove('pending', 'hidden-rank');
      cards[k].classList.add('flip');
      if (!this.skip) this.audio.tone(460 + RANK[results[k].rarity].ordem * 90, 0.05);
      await this.pause(fast ? 40 : 160);
    }
    await this.pause(fast ? 100 : 450);
    for (let k = 0; k < cards.length; k++) {
      cards[k].classList.remove('sil');
      cards[k].classList.add('win');
      await this.pause(fast ? 20 : 90);
    }
    const counts = RANKS.map((r) => [r, results.filter((x) => x.rarity === r.id).length]).filter(([, n]) => n);
    $('rsum').textContent = counts.map(([r, n]) => `${n} ${r.nome}`).join(' · ');
    const best = [...results].sort((a, b) => RANK[b.rarity].ordem - RANK[a.rarity].ordem)[0];
    this.celebrate(best, results.length);
  }

  celebrate(it, count = 1) {
    const r = RANK[it.rarity];
    if (r.ordem >= 4) {
      this.audio.play('base', 'wing', 1);
      [660, 880, 1100, r.ordem === 5 ? 1320 : 0].filter(Boolean).forEach((hz, k) => setTimeout(() => this.audio.tone(hz, 0.18), k * 110));
    } else this.audio.tone(560 + r.ordem * 70, 0.16);
    const text = count > 1 ? `${count} frutas novas · a melhor: ${fruitLabel(it.fruit)}` : `Nova fruta: ${fruitLabel(it.fruit)}`;
    this.toast(text, r.ordem >= 4 ? 'gold' : 'good');
  }

  // ===== Mochila =====
  renderBag() {
    const s = this.save;
    $('bag-title').textContent = `Mochila de frutas · ${s.bag.length}/${BAG_SIZE}`;
    $('bag-frags').textContent = fmt(s.fragments);
    $('bag-keys').textContent = fmt(s.keys);
    let list = sortBag(s.bag, this.sort);
    if (this.filter === 'fav') list = list.filter((it) => it.fav);
    else if (this.filter !== 'todas') list = list.filter((it) => rarityOf(it) === this.filter);
    $('bag-grid').innerHTML = list.length
      ? list.map((it) => this.card(it, { cls: it.uid === this.selected ? 'sel' : '' })).join('')
      : `<div class="empty-grid">${s.bag.length ? 'Nenhuma fruta neste filtro.' : 'A mochila está vazia. Gire a roleta com o Mercador de Frutas, na praia.'}</div>`;
    const it = this.sel();
    if (!it) this.selected = null;
    $('bag-selected').innerHTML = it
      ? `Selecionada: <b style="color:${RANK[rarityOf(it)].cor}">${fruitLabel(it.fruit)}</b> <span class="muted">(toque de novo para ver a ficha)</span>`
      : 'Toque numa fruta para ver as ações.';
    for (const id of ['bag-hold', 'bag-eat', 'bag-trade', 'bag-fav', 'bag-drop']) $(id).disabled = !it;
    $('bag-hold').lastChild.textContent = it && s.held === it.uid ? 'Guardar' : 'Segurar';
    $('bag-fav').lastChild.textContent = it?.fav ? 'Desfavoritar' : 'Favoritar';
    $('bag-trade').lastChild.textContent = it ? `Trocar (+${tradeValue(it)})` : 'Trocar';
  }

  async tradeOne(it) {
    if (!it) return;
    const careful = RANK[rarityOf(it)].ordem >= 2 || it.fav || it.uid === this.save.held;
    if (careful && !(await this.confirm(`Trocar ${fruitLabel(it.fruit)} por ${tradeValue(it)} fragmento(s)?`))) return;
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
    const name = RANK[rarity].nome;
    if (!list.length) {
      this.toast(`Nenhuma fruta ${name} para trocar (favoritas e a da mão ficam de fora)`);
      return;
    }
    const total = list.reduce((sum, it) => sum + tradeValue(it), 0);
    if (RANK[rarity].ordem >= 1 && !(await this.confirm(`Trocar ${list.length} fruta(s) ${name} por ${total} fragmentos?`))) return;
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
    $('t-values').innerHTML = RANKS.map((r) => `<span class="chip r-${r.id}" style="--r:${r.cor}"><b>${r.nome}</b> vale ${r.valorTroca}</span>`).join('');
    for (const r of ['comum', 'incomum', 'rara']) {
      const list = bulkCandidates(s, r);
      const total = list.reduce((sum, it) => sum + tradeValue(it), 0);
      const b = $(`t-all-${r}`);
      b.textContent = `Trocar todas as ${{ comum: 'Comuns', incomum: 'Incomuns', rara: 'Raras' }[r]} (+${total})`;
      b.disabled = !list.length;
    }
    const list = sortBag(s.bag, 'nivel');
    $('t-grid').innerHTML = list.length
      ? list.map((it) => this.card(it, { extra: `<span class="value">+${tradeValue(it)}</span>` })).join('')
      : '<div class="empty-grid">Sem frutas para trocar. Gire a roleta com o Mercador de Frutas.</div>';
  }
}
