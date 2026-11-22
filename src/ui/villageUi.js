// Janelas da vila (atualização 11): conversa com os moradores (falas pela hora e pela
// atividade, ações de cada serviço), Loja de Frutas do dia e Mestre de Missões (ofertas do
// dia, aceitar, redistribuir pontos pago). As missões ativas aparecem na aba Secundárias da
// janela de Missões e no rastreador.

import { activityAt } from '../world/villageLife.js';
import { hourOf, fmtClock, minutesUntil } from '../world/clock.js';
import { storeStock, buyFromStore, boughtToday, stockDay, STORE_TABLE, STORE_RESTOCK_HOUR } from '../economy/fruitStore.js';
import { questOffers, acceptQuest, abandonQuest, offerState, questEvent, questStep, normalizeQuests, respecCost, QUEST_LIMIT } from '../quests/village.js';
import { chances, RANKS, fruitName } from '../fruits/catalog.js';
import { resetStatus } from '../progression/status.js';
import { applyIcons } from './icons.js';

const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString('pt-BR');
const MEAL = 40;

const WORK_LINES = {
  missoes: 'O quadro está cheio de pedidos. Quer ajudar a vila?',
  mercado: 'Troco fragmentos por chaves, e sempre tenho encomenda para entregar.',
  taverna: 'Uma refeição quente recupera qualquer marinheiro.',
  ferreiro: 'Armaduras, acessórios e espadas. E conserto o que estiver gasto.',
  frutas: 'As frutas de hoje chegaram de manhã. Quer ver?',
  Pescador: 'O mar está calmo hoje. Bom dia para pescar perto do cais.',
  Florista: 'Flores frescas para a praça! O chafariz fica lindo no fim da tarde.',
  Carpinteiro: 'Conserto portas e cercas. Toda casa daqui tem um pouco do meu trabalho.',
  Costureira: 'Vela rasgada? Roupa furada? Eu costuro.',
  Marinheiro: 'Já naveguei de bote até a Ilha de Treino. Fica a oeste, depois do cais.',
};

export class VillageUi {
  constructor({ save, villagers, seed, getClock, thumbOf, openModal, closeModal, toast, onQuestDone, onQuestChange, onStatus, onBag, heal }) {
    Object.assign(this, { save, villagers, seed, getClock, thumbOf, openModal, closeModal, toast, onQuestDone, onQuestChange, onStatus, onBag, heal });
    this.names = Object.fromEntries(villagers.list.map((m) => [m.id, m]));
    this.names['barqueiro-treino'] = { nome: 'Barqueiro (Ilha de Treino)' };
    $('dlg-actions').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-i]');
      if (b && this.actions?.[b.dataset.i]) this.actions[b.dataset.i].run();
    });
    $('fs-list').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-slot]');
      if (b) this.buy(Number(b.dataset.slot));
    });
    $('qm-list').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-key]');
      if (b) this.accept(b.dataset.key);
    });
    $('btn-qm-respec').addEventListener('click', () => this.respec());
  }

  get day() {
    return stockDay(this.getClock());
  }

  // ===== Conversa =====
  talk(m) {
    const h = hourOf(this.getClock());
    const greet = h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    const act = activityAt(h, m);
    let line = act === 'trabalho' ? WORK_LINES[m.papel] ?? WORK_LINES[m.titulo] : act === 'lazer' ? 'Dia cheio. Agora é hora de descansar um pouco.' : 'Já estou em casa. Amanhã cedo volto ao trabalho.';
    if (act !== 'trabalho' && m.papel !== 'morador') line += ' Mas posso atender você mesmo assim.';
    const notes = this.questTalk(m.id, true);
    const actions = [];
    const add = (label, run, icon = '') => actions.push({ label, run, icon });
    if (m.papel === 'missoes') add('Missões da vila', () => this.openQuests(), 'scroll');
    if (m.papel === 'mercado') add('Trocar fragmentos', () => this.swap('trader'), 'gem');
    if (m.papel === 'ferreiro') add('Armaduras e espadas', () => this.swap('armory'), 'shield');
    if (m.papel === 'frutas') add('Frutas do dia', () => this.openStore(), 'fruit');
    if (m.papel === 'taverna') {
      add(`Refeição · ${MEAL} moedas`, () => {
        if (this.save.coins < MEAL) return this.toast(`A refeição custa ${MEAL} moedas.`, 'bad');
        this.save.coins -= MEAL;
        this.heal();
        this.toast('Refeição quente: vida e fôlego cheios.', 'good');
        this.closeModal('npc-dialog');
      }, 'heart');
    }
    for (const a of this.serviceActions?.(m) ?? []) add(a.label, a.run, a.icon);
    add('Até logo', () => this.closeModal('npc-dialog'));
    this.openDialog(`${m.nome} · ${m.titulo}`, `${greet}! ${line}${notes.length ? `\n\n${notes.join('\n')}` : ''}`, actions);
  }

  openDialog(title, text, actions) {
    this.actions = actions;
    $('dlg-title').lastChild.textContent = title;
    $('dlg-text').textContent = text;
    $('dlg-actions').innerHTML = actions.map((a, i) => `<button class="btn ${i === 0 && actions.length > 1 ? 'gold' : ''}" data-i="${i}" ${a.icon ? `data-icon="${a.icon}"` : ''}>${a.label}</button>`).join('');
    applyIcons($('dlg-actions'));
    this.openModal('npc-dialog');
  }

  swap(id) {
    this.closeModal('npc-dialog');
    this.openModal(id);
  }

  // Falar com alguém avança as missões; devolve as falas sobre isso
  questTalk(npcId, villager) {
    const r = questEvent(this.save, { kind: 'talk', npc: npcId, villager });
    const notes = [];
    for (const q of r.progressed) {
      if (q.tipo === 'entrega' && q.progresso === 1) notes.push(`(Missão "${q.titulo}": pegou a encomenda. Leve até ${this.names[q.alvo]?.nome}.)`);
      else if (q.tipo === 'conversa') notes.push(`(Missão "${q.titulo}": ${q.progresso}/${q.total} moradores.)`);
    }
    for (const q of r.completed) {
      notes.push(`(Missão "${q.titulo}" concluída!)`);
      this.onQuestDone(q);
    }
    if (r.progressed.length || r.completed.length) this.onQuestChange();
    return notes;
  }

  // Coleta (pesca e mineração) conta para as missões de coleta
  gather(what, n = 1) {
    const r = questEvent(this.save, { kind: 'gather', what, n });
    for (const q of r.progressed) this.toast(`${q.titulo}: ${questStep(q, this.names)}`);
    for (const q of r.completed) this.onQuestDone(q);
    if (r.progressed.length || r.completed.length) this.onQuestChange();
  }

  defeat(foe) {
    const r = questEvent(this.save, { kind: 'defeat', nome: foe.nome, element: foe.element });
    for (const q of r.progressed) this.toast(`${q.titulo}: ${questStep(q, this.names)}`);
    for (const q of r.completed) this.onQuestDone(q);
    if (r.progressed.length || r.completed.length) this.onQuestChange();
  }

  // ===== Loja de Frutas =====
  openStore() {
    this.closeModal('npc-dialog');
    this.openModal('fruitstore');
    this.renderStore();
  }

  renderStore() {
    const day = this.day;
    const stock = storeStock(day, this.seed);
    const sold = boughtToday(this.save, day);
    $('fs-coins').textContent = fmt(this.save.coins);
    const left = minutesUntil(this.getClock(), STORE_RESTOCK_HOUR);
    $('fs-restock').textContent = `Agora ${fmtClock(this.getClock())} · estoque novo às 06:00 (faltam ${Math.floor(left / 60)} h ${Math.floor(left % 60)} min)`;
    $('fs-list').innerHTML = stock.map((o) => {
      const out = sold.includes(o.slot);
      return `<div class="store-card ${out ? 'sold' : ''}" style="--rc:${o.rank.cor}">
        <img src="${this.thumbOf(o.fruit)}" alt="" />
        <b>${fruitName(o.fruit)}</b><small>${o.rank.nome}</small>
        ${out ? '<button class="btn" disabled>Esgotada hoje</button>' : `<button class="btn gold" data-slot="${o.slot}" data-icon="coin">${fmt(o.price)}</button>`}
      </div>`;
    }).join('');
    const c = chances(STORE_TABLE).porRank;
    $('fs-chances').textContent = `Chances do estoque (tabela da loja): ${RANKS.map((r) => `${r.nome} ${Math.round((c[r.id] || 0) * 100)}%`).join(' · ')}`;
    applyIcons($('fs-list'));
  }

  buy(slot) {
    const r = buyFromStore(this.save, this.day, slot, { seed: this.seed });
    if (!r.ok) this.toast(r.reason, 'bad');
    else {
      this.toast(`${fruitName(r.offer.fruit)} comprada! Está na mochila.`, 'gold');
      this.onBag();
    }
    this.renderStore();
  }

  // ===== Mestre de Missões =====
  offers() {
    return questOffers(this.day, this.villagers.list, this.seed);
  }

  openQuests() {
    this.closeModal('npc-dialog');
    this.openModal('questmaster');
    this.renderQuests();
  }

  renderQuests() {
    const q = (this.save.quests = normalizeQuests(this.save.quests));
    $('qm-count').textContent = `Missões ativas: ${q.active.length}/${QUEST_LIMIT} · concluídas: ${q.done}`;
    const left = minutesUntil(this.getClock(), STORE_RESTOCK_HOUR);
    $('qm-renew').textContent = `Novos pedidos às 06:00 (faltam ${Math.floor(left / 60)} h ${Math.floor(left % 60)} min)`;
    $('qm-list').innerHTML = this.offers().map((o) => {
      const st = offerState(this.save, this.day, o);
      const btn = st === 'aceita' ? '<button class="btn" disabled>Aceita</button>' : st === 'cheio' ? '<button class="btn" disabled>Limite</button>' : `<button class="btn gold" data-key="${o.key}">Aceitar</button>`;
      return `<div class="quest-offer"><div><h3>${o.titulo}</h3><p>${o.descricao}</p></div>${btn}<div class="rewards">+${fmt(o.coins)} moedas · +${fmt(o.xp)} exp</div></div>`;
    }).join('');
    const free = this.save.freeRespec;
    $('btn-qm-respec').lastChild.textContent = free ? 'Redistribuir pontos (grátis 1×)' : `Redistribuir pontos · ${fmt(respecCost(this.save.level))} moedas`;
    $('qm-respec-note').textContent = 'Devolve todos os pontos de status distribuídos para distribuir de novo.';
  }

  accept(key) {
    const offer = this.offers().find((o) => o.key === key);
    if (!offer) return;
    const r = acceptQuest(this.save, this.day, offer);
    if (!r.ok) this.toast(r.reason, 'bad');
    else this.toast(`Missão aceita: ${offer.titulo}`, 'good');
    this.onQuestChange();
    this.renderQuests();
  }

  respec() {
    const s = this.save;
    const cost = s.freeRespec ? 0 : respecCost(s.level);
    if (s.coins < cost) return this.toast(`Redistribuir custa ${fmt(cost)} moedas.`, 'bad');
    const n = resetStatus(s);
    if (n <= 0) return this.toast('Nenhum ponto distribuído para devolver.');
    if (cost) s.coins -= cost;
    else s.freeRespec = false;
    this.toast(`${n} pontos devolvidos${cost ? ` por ${fmt(cost)} moedas` : ''}. Distribua em Personagem › Status.`, 'gold');
    this.onStatus();
    this.renderQuests();
  }

  // ===== Missões ativas (janela de Missões e rastreador) =====
  activeHtml() {
    const q = (this.save.quests = normalizeQuests(this.save.quests));
    if (!q.active.length) return '<div class="empty">Nenhuma missão da vila. Fale com o Mestre de Missões na Prefeitura do Porto das Origens.</div>';
    return q.active.map((m) => `<div class="mission village"><div>
        <h3>${m.titulo}</h3><p class="sub">${m.descricao}</p>
        <p class="sub"><b>Agora:</b> ${questStep(m, this.names)}</p>
        <div class="rewards"><span>+${fmt(m.coins)} moedas</span><span>+${fmt(m.xp)} exp</span></div>
        <div class="actions"><button class="btn ${q.tracked === m.uid ? '' : 'gold'}" data-qtrack="${m.uid}">${q.tracked === m.uid ? 'Rastreando' : 'Rastrear'}</button><button class="btn" data-qdrop="${m.uid}">Abandonar</button></div>
      </div></div>`).join('');
  }

  bindActive(root) {
    for (const b of root.querySelectorAll('[data-qtrack]')) {
      b.addEventListener('click', () => {
        this.save.quests.tracked = Number(b.dataset.qtrack);
        this.onQuestChange();
      });
    }
    for (const b of root.querySelectorAll('[data-qdrop]')) {
      b.addEventListener('click', () => {
        abandonQuest(this.save, Number(b.dataset.qdrop));
        this.onQuestChange();
      });
    }
  }

  tracked() {
    const q = (this.save.quests = normalizeQuests(this.save.quests));
    const m = q.active.find((x) => x.uid === q.tracked);
    if (!m) return null;
    return { title: m.titulo, step: questStep(m, this.names), reward: `+${fmt(m.coins)} moedas · +${fmt(m.xp)} exp` };
  }
}
