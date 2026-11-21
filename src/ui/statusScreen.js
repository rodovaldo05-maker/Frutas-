// Tela Personagem (doc 10, seção 5.1 e documento mestre 4.0, seção 32), com duas camadas
// que convivem:
// - Status: pontos de nível que o jogador distribui (+1 / +10 / Máx; redistribuir grátis
//   uma vez). Força e Defesa mostram junto o nível de treino do mesmo atributo.
// - Treinamento: atributos que sobem pela prática, com nível, barra em %, bônus, próximo
//   marco e como treinar; não são distribuíveis. Ganhos recentes mostra o histórico.

import { ATTRS, ATTR_KEYS, progress, nextMilestone, xpToNext as attrXpToNext } from '../progression/training.js';
import { xpToNext, MAX_LEVEL } from '../progression/level.js';
import { STATUS_KEYS, STATUS_INFO, TRAINED_TWIN, allocate, resetStatus, maxHealth, maxStamina, normalizeStatus } from '../progression/status.js';
import { ICONS } from './icons.js';

const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString('pt-BR');
const ICON = { forca: 'fist', defesa: 'shield', fruta: 'fruit', espada: 'sword', vitalidade: 'vital' };

export class StatusScreen {
  constructor({ save, onChange }) {
    this.save = save;
    this.onChange = onChange;
    this.tab = 'status';
    $('train-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-ttab]');
      if (!b) return;
      this.tab = b.dataset.ttab;
      for (const o of $('train-tabs').querySelectorAll('button')) o.classList.toggle('active', o === b);
      this.render();
    });
    $('status-rows').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-key]');
      if (!b) return;
      const amount = b.dataset.amount === 'max' ? this.save.statusPoints : Number(b.dataset.amount);
      if (allocate(this.save, b.dataset.key, amount)) this.changed();
    });
    $('btn-respec').addEventListener('click', () => {
      if (!this.save.freeRespec) return;
      if (resetStatus(this.save) > 0) this.save.freeRespec = false;
      this.changed();
    });
  }

  setFigure(url) {
    $('status-figure').src = url;
  }

  changed() {
    this.render();
    this.onChange?.();
  }

  render() {
    const s = this.save;
    const t = s.training;
    const status = normalizeStatus(s.status);
    const need = xpToNext(s.level);
    const points = s.statusPoints || 0;
    $('status-name').textContent = s.title || 'Aprendiz';
    $('status-level').textContent = s.level >= MAX_LEVEL ? `Nível ${s.level} (Máx)` : `Aventureiro Nv. ${s.level}`;
    $('status-xp-bar').style.transform = `scaleX(${s.level >= MAX_LEVEL ? 1 : Math.min(1, (s.xp || 0) / need)})`;
    $('status-xp-text').textContent = s.level >= MAX_LEVEL ? 'Nível máximo' : `${fmt(Math.floor(s.xp || 0))} / ${fmt(need)} exp`;
    $('status-summary').innerHTML = `<span>Vida máxima <b>${fmt(maxHealth(status))}</b></span><span>Fôlego máximo <b>${fmt(maxStamina(status, t))}</b></span><span>Tipo corporal <b>Humano</b></span>`;
    const badge = $('tab-points');
    badge.classList.toggle('hidden', points < 1);
    badge.textContent = points > 99 ? '99+' : String(points);

    $('pane-status').classList.toggle('hidden', this.tab !== 'status');
    $('pane-train').classList.toggle('hidden', this.tab === 'status');
    if (this.tab === 'status') this.renderStatus(status, points);
    else this.renderTraining(t);
  }

  renderStatus(status, points) {
    const t = this.save.training;
    $('status-points').textContent = fmt(points);
    $('status-rows').innerHTML = STATUS_KEYS.map((k) => {
      const info = STATUS_INFO[k];
      const v = status[k];
      const twin = TRAINED_TWIN[k];
      const trained = twin ? `<em class="twin${ATTRS[twin].ativo ? '' : ' off'}" title="Nível de treino pela prática (não distribuível)">treino Nv. ${t.attrs[twin].level}</em>` : '';
      const dis = points < 1 ? 'disabled' : '';
      const dis10 = points < 10 ? 'disabled' : '';
      return `<div class="stat-row ${k}">
        ${ICONS[ICON[k]]}
        <span class="name"><b>${info.name} ${trained}</b><small>${info.effect(v)}</small></span>
        <span class="val">${fmt(v)}</span>
        <span class="plus">
          <button data-key="${k}" data-amount="1" ${dis} aria-label="Mais 1 em ${info.name}">+1</button>
          <button data-key="${k}" data-amount="10" ${dis10} aria-label="Mais 10 em ${info.name}">+10</button>
          <button data-key="${k}" data-amount="max" ${dis} aria-label="Todos os pontos em ${info.name}">Máx</button>
        </span>
      </div>`;
    }).join('');
    const total = STATUS_KEYS.reduce((sum, k) => sum + status[k], 0);
    const respec = $('btn-respec');
    respec.disabled = !this.save.freeRespec || total === 0;
    respec.lastChild.textContent = this.save.freeRespec ? 'Redistribuir (grátis 1×)' : 'Redistribuir: Mestre de Missões (em breve)';
  }

  renderTraining(t) {
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
        : '<p class="muted">Ainda não há ganhos. Ande, nade, escale, salte e lute na arena.</p>';
    }
  }

  reason(key) {
    const k = String(key || '');
    if (k.endsWith(':distancia')) return k.startsWith('natacao') ? 'distância nadada' : k.startsWith('folego') ? 'caminho percorrido' : 'escalada';
    if (k.startsWith('desafio:')) return 'desafio da missão';
    if (k.startsWith('golpe:')) return k.includes('boneco') ? 'golpe no boneco' : 'golpe em inimigo';
    if (k.startsWith('apanhar:')) return 'golpe recebido';
    if (k.startsWith('defesa:')) return 'defesa';
    if (k.startsWith('perfeita:')) return 'defesa perfeita';
    if (k.startsWith('esquiva:')) return 'esquiva de golpe';
    return { subirBorda: 'subir borda', transpor: 'transpor obstáculo', saltoParede: 'salto na parede', corridaParede: 'corrida na parede', deslize: 'deslize', rolamento: 'rolamento', aterrissagem: 'aterrissagem' }[k] || k;
  }
}
