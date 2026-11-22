// Janela do Mestre de Luta: estilos de luta (comprar, equipar no slot 3, técnicas com a
// maestria que libera cada uma, passiva) e Vontade (Armadura e Percepção para aprender;
// Soberana bloqueada).

import { STYLES, STYLE_IDS, STYLE_UNLOCK } from '../styles/styles.js';
import { VONTADE_SKILLS } from '../styles/vontade.js';
import { profOf } from '../progression/proficiency.js';

const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString('pt-BR');

export class Dojo {
  constructor({ save, onStyle, onLearn, toast }) {
    this.save = save;
    this.onStyle = onStyle;
    this.onLearn = onLearn;
    this.toast = toast;
    this.tab = 'estilos';
    $('dojo-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-dtab]');
      if (!b) return;
      this.tab = b.dataset.dtab;
      for (const o of $('dojo-tabs').querySelectorAll('button')) o.classList.toggle('active', o === b);
      this.render();
    });
    $('dojo-list').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-act]');
      if (!b) return;
      if (b.dataset.act === 'buy-style') this.buyStyle(b.dataset.id);
      if (b.dataset.act === 'equip-style') this.onStyle(b.dataset.id);
      if (b.dataset.act === 'learn') this.learn(b.dataset.id);
      this.render();
    });
  }

  pay(preco, nivel, nome) {
    const s = this.save;
    if (s.level < nivel) {
      this.toast(`${nome}: precisa do nível de aventureiro ${nivel}.`, 'bad');
      return false;
    }
    if (s.coins < preco) {
      this.toast(`Faltam ${fmt(preco - s.coins)} moedas para ${nome}.`, 'bad');
      return false;
    }
    s.coins -= preco;
    return true;
  }

  buyStyle(id) {
    const st = STYLES[id];
    if (this.save.styles.includes(id) || !this.pay(st.preco, st.nivel, st.nome)) return;
    this.save.styles.push(id);
    this.toast(`${st.nome} aprendido! Equipado no slot 3.`, 'gold');
    this.onStyle(id, true);
  }

  learn(kind) {
    const v = VONTADE_SKILLS[kind];
    if (v.bloqueada || this.save.vontade[kind] || !this.pay(v.preco, v.nivel, v.nome)) return;
    this.save.vontade[kind] = true;
    this.toast(`${v.nome} aprendida! Liga e desliga com ${kind === 'armadura' ? 'G' : 'H'} ou o botão ${kind === 'armadura' ? '🛡' : '👁'}.`, 'gold');
    this.onLearn(kind);
  }

  render() {
    const s = this.save;
    $('d-coins').textContent = fmt(s.coins);
    if (this.tab === 'estilos') {
      $('dojo-list').innerHTML = STYLE_IDS.map((id) => {
        const st = STYLES[id];
        const owned = s.styles.includes(id);
        const lv = profOf(s, `estilo:${id}`).level;
        const tec = st.tecnicas.map((t, i) => `<li class="${lv >= STYLE_UNLOCK[i] ? '' : 'off'}"><span>${'ZXCV'[i]} · ${t.nome}</span><i>${lv >= STYLE_UNLOCK[i] ? `${t.dano} dano` : `Maest. ${STYLE_UNLOCK[i]}`}</i></li>`).join('');
        const btn = !owned
          ? `<button class="btn gold" data-act="buy-style" data-id="${id}">Aprender · ${fmt(st.preco)} (Nv. ${st.nivel})</button>`
          : s.style === id ? '<button class="btn" disabled>Equipado</button>' : `<button class="btn gold" data-act="equip-style" data-id="${id}">Equipar</button>`;
        return `<div class="weapon-card" style="--rc:${st.cor}">
          <header><b>${st.nome}</b><span>${owned ? `Maestria ${lv}` : 'Novo'}</span></header>
          <p>${st.descricao}</p>
          <div class="dmg">Combo: ${st.dano.join(' · ')} · <span class="tag">Passiva: ${st.passiva}</span></div>
          <ul>${tec}</ul>${btn}</div>`;
      }).join('');
    } else {
      $('dojo-list').innerHTML = Object.entries(VONTADE_SKILLS).map(([id, v]) => {
        const has = !!s.vontade[id];
        const lv = profOf(s, `vontade:${id}`).level;
        const btn = v.bloqueada ? '<button class="btn" disabled>Desbloqueio raro</button>'
          : has ? `<button class="btn" disabled>Aprendida · Maestria ${lv}</button>`
            : `<button class="btn gold" data-act="learn" data-id="${id}">Aprender · ${fmt(v.preco)} (Nv. ${v.nivel})</button>`;
        return `<div class="weapon-card" style="--rc:${id === 'armadura' ? '#8a6a3a' : id === 'percepcao' ? '#c8b0ff' : '#ff4a4a'}">
          <header><b>${v.nome}</b><span>${has ? 'Aprendida' : v.bloqueada ? 'Rara' : ''}</span></header>
          <p style="display:block">${v.desc}</p>${btn}</div>`;
      }).join('');
    }
  }
}
