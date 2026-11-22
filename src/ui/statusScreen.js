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
import { fruitName } from '../fruits/catalog.js';
import { domainProgress } from '../progression/domain.js';
import { RACES, raceXpToNext } from '../races/races.js';
import { ITEMS, SLOTS, SLOT_NAMES, QUALITY, gearTotals, equipItem, unequip, isBroken, itemMult, itemLabel } from '../items/items.js';

const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString('pt-BR');
const ICON = { forca: 'fist', defesa: 'shield', fruta: 'fruit', espada: 'sword', vitalidade: 'vital' };

export class StatusScreen {
  constructor({ save, onChange, profHtml = () => '' }) {
    this.save = save;
    this.onChange = onChange;
    this.profHtml = profHtml; // aba Profissões (atualização 12)
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
    $('pane-gear').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-gear]');
      if (!b) return;
      if (b.dataset.gear === 'equip') equipItem(this.save, Number(b.dataset.uid));
      else unequip(this.save, b.dataset.slot);
      this.changed();
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
    const eaten = s.eaten?.fruit;
    const dom = eaten ? s.domain?.[eaten] ?? { level: 1, xp: 0 } : null;
    const domLine = dom ? `<span>Domínio de ${fruitName(eaten)} <b>Nv. ${dom.level}</b> (${Math.floor(domainProgress(dom) * 100)}%)</span>` : '';
    const race = RACES[s.race];
    const g = gearTotals(s);
    $('status-summary').innerHTML = `<span>Vida máxima <b>${fmt(maxHealth(status) + g.vida)}</b></span><span>Fôlego máximo <b>${fmt(maxStamina(status, t) + g.folego)}</b></span>${domLine}<span>Tipo corporal <b>${race ? race.nome : 'a escolher'}</b></span>`;
    const badge = $('tab-points');
    badge.classList.toggle('hidden', points < 1);
    badge.textContent = points > 99 ? '99+' : String(points);

    $('pane-status').classList.toggle('hidden', this.tab !== 'status');
    $('pane-train').classList.toggle('hidden', this.tab !== 'atributos' && this.tab !== 'historico');
    $('pane-race').classList.toggle('hidden', this.tab !== 'raca');
    $('pane-gear').classList.toggle('hidden', this.tab !== 'equip');
    $('pane-prof').classList.toggle('hidden', this.tab !== 'prof');
    if (this.tab === 'status') this.renderStatus(status, points);
    else if (this.tab === 'raca') this.renderRace();
    else if (this.tab === 'equip') this.renderGear();
    else if (this.tab === 'prof') $('pane-prof').innerHTML = this.profHtml();
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
    respec.lastChild.textContent = this.save.freeRespec ? 'Redistribuir (grátis 1×)' : 'Redistribuir: Mestre de Missões (Prefeitura do Porto)';
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

  // Raça: maestria, marcos, passivas, ativa, como treinar e limitação
  renderRace() {
    const s = this.save;
    const r = RACES[s.race];
    if (!r) {
      $('pane-race').innerHTML = '<p class="muted">Você ainda não escolheu um tipo corporal.</p>';
      return;
    }
    const m = s.raceMastery;
    const p = m.level >= 100 ? 1 : m.xp / raceXpToNext(m.level);
    const marcos = Object.entries(r.marcos).map(([lv, nome]) => `<li class="${m.level >= lv ? 'on' : ''}"><i>Nv. ${lv}</i> ${nome}${lv === '100' ? ' <small>(despertar com prova racial)</small>' : ''}</li>`).join('');
    $('pane-race').innerHTML = `
      <div class="race-head" style="--rc:${r.cor}"><b>${r.nome}</b><span>${r.titulo}</span></div>
      <div class="race-mastery"><span>Maestria racial <b>Nv. ${m.level}</b></span><div class="bar xp"><i style="transform:scaleX(${p})"></i><em><span>${Math.floor(p * 100)}% · ${fmt(Math.floor(m.xp))}/${fmt(raceXpToNext(m.level))}</span></em></div></div>
      <div class="race-cols">
        <div><h4>Passivas</h4><ul>${r.passivas.map((x) => `<li>${x}</li>`).join('')}</ul>
          <h4>Ativa: ${r.ativa.nome} <small>(${r.ativa.recarga} s)</small></h4><p>${r.ativa.desc}</p></div>
        <div><h4>Marcos</h4><ul class="race-marcos">${marcos}</ul>
          <h4>Como treinar</h4><p>${r.treino}</p><p class="muted">${r.limitacao}</p></div>
      </div>`;
  }

  // Equipamento: encaixes, itens da mochila e totais (com tetos e peso)
  renderGear() {
    const s = this.save;
    const t = gearTotals(s);
    const dur = (it) => {
      const max = ITEMS[it.id].dur;
      return max ? `<span class="dur${isBroken(it) ? ' broken' : ''}">${isBroken(it) ? 'Quebrado' : `${it.dur}/${max}`}</span>` : '';
    };
    const attrs = (d, it) => Object.entries(d.attrs).map(([k, v]) => {
      const m = it ? itemMult(it) : 1;
      return k === 'elemental' ? `+${Math.round(v * m * 1000) / 10}% elemental` : `+${Math.round(v * m * 10) / 10} ${k === 'folego' ? 'fôlego' : k}`;
    }).join(' · ');
    const slots = SLOTS.map((slot) => {
      const it = s.items.find((x) => x.uid === s.gear[slot]);
      const d = it && ITEMS[it.id];
      return `<div class="gear-slot" style="--qc:${d ? QUALITY[d.qualidade] : '#4a4458'}"><small>${SLOT_NAMES[slot]}</small>${d ? `<b>${itemLabel(it)}</b><span>${attrs(d, it)}</span>${dur(it)}<button class="btn" data-gear="off" data-slot="${slot}">Tirar</button>` : '<span class="muted">vazio</span>'}</div>`;
    }).join('');
    const free = s.items.filter((it) => !Object.values(s.gear).includes(it.uid));
    const bag = free.length
      ? free.map((it) => {
        const d = ITEMS[it.id];
        return `<div class="gear-item" style="--qc:${QUALITY[d.qualidade]}"><b>${itemLabel(it)}</b><small>${SLOT_NAMES[d.slot]} · ${d.qualidade} · Nv. ${d.nivel} · peso ${d.peso}</small><span>${attrs(d, it)}${d.sinergia ? ` · <i>${d.sinergia.texto}</i>` : ''}</span>${dur(it)}<button class="btn gold" data-gear="equip" data-uid="${it.uid}">Equipar</button></div>`;
      }).join('')
      : '<p class="muted">Sem itens guardados. Compre com o Mestre de Armas ou derrote Recrutas.</p>';
    $('pane-gear').innerHTML = `
      <div class="gear-total">Defesa <b>+${t.defesa}</b> · Vida <b>+${t.vida}</b> · Fôlego <b>+${t.folego}</b> · Energia <b>+${t.energia}</b> · Elemental <b>+${Math.round(t.elemental * 100)}%</b> · Peso <b>${t.peso.toLocaleString('pt-BR')}</b>${t.pesoPenalty ? ` (−${Math.round(t.pesoPenalty * 100)}% de recuperação de fôlego)` : ''}${t.sinergias.length ? `<br><i>${t.sinergias.join(' · ')}</i>` : ''}</div>
      <div class="gear-slots">${slots}</div>
      <h4>Guardados</h4><div class="gear-bag">${bag}</div>`;
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
