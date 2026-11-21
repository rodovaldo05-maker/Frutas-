// Personagem › Treinamento (documento mestre 4.0, seção 32): atributos treinados pela
// prática com nível, barra de progresso em %, bônus atuais, próximo marco, como treinar e
// histórico de ganhos. Atributos que dependem de combate ou voo aparecem como "em breve".

import { ATTRS, ATTR_KEYS, progress, nextMilestone, xpToNext as attrXpToNext } from '../progression/training.js';
import { xpToNext, MAX_LEVEL } from '../progression/level.js';
import { maxHealth, maxStamina } from '../progression/status.js';
import { ICONS } from './icons.js';

const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString('pt-BR');

export class StatusScreen {
  constructor({ save }) {
    this.save = save;
    this.tab = 'atributos';
    $('train-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-ttab]');
      if (!b) return;
      this.tab = b.dataset.ttab;
      for (const o of $('train-tabs').querySelectorAll('button')) o.classList.toggle('active', o === b);
      this.render();
    });
  }

  setFigure(url) {
    $('status-figure').src = url;
  }

  render() {
    const s = this.save;
    const t = s.training;
    const need = xpToNext(s.level);
    $('status-name').textContent = s.title || 'Aprendiz';
    $('status-level').textContent = s.level >= MAX_LEVEL ? `Nível ${s.level} (Máx)` : `Nível de aventureiro ${s.level}`;
    $('status-xp-bar').style.transform = `scaleX(${s.level >= MAX_LEVEL ? 1 : Math.min(1, (s.xp || 0) / need)})`;
    $('status-xp-text').textContent = s.level >= MAX_LEVEL ? 'Nível máximo' : `${fmt(Math.floor(s.xp || 0))} / ${fmt(need)} exp`;
    $('status-summary').innerHTML = `<span>Vida máxima <b>${fmt(maxHealth())}</b></span><span>Fôlego máximo <b>${fmt(maxStamina(t))}</b></span><span>Tipo corporal <b>Humano</b></span>`;
    $('train-rows').classList.toggle('hidden', this.tab !== 'atributos');
    $('train-history').classList.toggle('hidden', this.tab !== 'historico');
    if (this.tab === 'atributos') {
      const order = [...ATTR_KEYS].sort((a, b) => Number(ATTRS[b].ativo) - Number(ATTRS[a].ativo));
      $('train-rows').innerHTML = order.map((k) => {
        const d = ATTRS[k];
        const a = t.attrs[k];
        const p = progress(a);
        const next = nextMilestone(k, a.level);
        return `<div class="train-row ${d.ativo ? '' : 'off'}">
          ${ICONS[d.icone] || ICONS.flag}
          <div class="head"><b>${d.nome}</b><span class="lvl">Nv. ${a.level}</span></div>
          <div class="meter"><div class="bar"><i style="transform:scaleX(${p})"></i><em><span>${Math.floor(p * 100)}% · ${fmt(Math.floor(a.xp))}/${fmt(attrXpToNext(a.level))}</span></em></div></div>
          <div class="info">${d.ativo ? `Bônus: <b>${d.bonus(a.level)}</b>` : '<b>Em breve</b>'}${next ? ` · Próximo marco: <b>Nv. ${next.level} ${next.nome}</b>` : ''}<br />${d.treino}</div>
        </div>`;
      }).join('');
    } else {
      const list = [...t.history].reverse();
      $('train-history').innerHTML = list.length
        ? list.map((h) => `<div><span>${ATTRS[h.attr]?.nome ?? h.attr} · ${this.reason(h.key)}</span><i>+${String(h.xp).replace('.', ',')} exp</i></div>`).join('')
        : '<p class="muted">Ainda não há ganhos. Ande, nade, escale e salte pela ilha.</p>';
    }
  }

  reason(key) {
    const k = String(key || '');
    if (k.endsWith(':distancia')) return k.startsWith('natacao') ? 'distância nadada' : k.startsWith('folego') ? 'caminho percorrido' : 'escalada';
    if (k.startsWith('desafio:')) return 'desafio da missão';
    return { subirBorda: 'subir borda', transpor: 'transpor obstáculo', saltoParede: 'salto na parede', corridaParede: 'corrida na parede', deslize: 'deslize', rolamento: 'rolamento', aterrissagem: 'aterrissagem' }[k] || k;
  }
}
