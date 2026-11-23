// Menu TREINAMENTO (slot 4 da barra; atualização 24) e painel da série em andamento.
// Abas: Físico (flexões e agachamentos com pesos), Meditação da fruta, Respiração e Haki,
// Estatísticas. Mostra tipo,
// carga, séries, repetições, fadiga, atributos beneficiados e o botão de interromper. O painel
// atualiza só os textos que mudam (sem recriar a árvore a cada quadro).

import { LOADS, EXERCISES, SET_CHOICES, unlockedLoads, capacity, canLift, REPS_PER_SET, strengthIndex } from '../progression/workout.js';
import { ATTRS } from '../progression/training.js';

const $ = (id) => document.getElementById(id);
const fmt = (n) => Math.round(n).toLocaleString('pt-BR');
const ATTR_NAME = (k) => ATTRS[k]?.nome ?? k;

export class TrainingUi {
  // handlers: { start(exercise, kg, sets), rep(), pause(), lower(), cancel(), extraTabs(), action(go) }
  constructor({ save, handlers }) {
    this.save = save;
    this.h = handlers;
    this.tab = 'fisico';
    this.exercise = 'flexao';
    this.kg = save.workout?.lastKg ?? 5;
    this.sets = save.workout?.lastSets ?? 1;
    $('treino-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-wtab]');
      if (!b) return;
      this.tab = b.dataset.wtab;
      this.render();
    });
    $('treino-body').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.ex) this.exercise = b.dataset.ex;
      if (b.dataset.kg) this.kg = Number(b.dataset.kg);
      if (b.dataset.sets) this.sets = Number(b.dataset.sets);
      if (b.dataset.go === 'start') return this.h.start(this.exercise, this.kg, this.sets);
      if (b.dataset.go) return this.h.action?.(b.dataset.go);
      this.render();
    });
    $('treino-body').addEventListener('change', (e) => {
      if (e.target.id === 'treino-custom') {
        const n = Math.max(1, Math.min(50, Math.floor(Number(e.target.value)) || 1));
        this.sets = n;
        this.render();
      }
    });
    const hud = $('treino-hud');
    hud.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-w]');
      if (!b) return;
      this.h[b.dataset.w]?.();
    });
  }

  render() {
    const s = this.save;
    for (const b of document.querySelectorAll('#treino-tabs button')) b.classList.toggle('active', b.dataset.wtab === this.tab);
    const t = s.training;
    let html = '';
    if (this.tab === 'fisico') {
      const loads = unlockedLoads(t).map((l) => l.kg);
      if (!loads.includes(this.kg)) this.kg = loads[loads.length - 1];
      const cap = capacity(t);
      const ex = Object.entries(EXERCISES).map(([id, e]) => `<button class="w-ex ${this.exercise === id ? 'on' : ''}" data-ex="${id}"><b>${e.nome}</b><small>${Object.keys(e.attrs).map(ATTR_NAME).join(' · ')}</small></button>`).join('');
      const lds = LOADS.map((l) => {
        const open = loads.includes(l.kg);
        const heavy = open && !canLift(l.kg, t);
        return `<button class="w-load ${this.kg === l.kg ? 'on' : ''} ${heavy ? 'heavy' : ''}" data-kg="${l.kg}" ${open && !heavy ? '' : 'disabled'} title="${open ? (heavy ? 'Pesado demais para sua capacidade agora' : l.nome) : `Libera com Força e Constituição na média ${l.req}`}"><b>${fmt(l.kg)} kg</b><small>${open ? l.nome : `🔒 ${l.req}`}</small></button>`;
      }).join('');
      const sets = SET_CHOICES.map((n) => `<button class="w-set ${this.sets === n ? 'on' : ''}" data-sets="${n}">${n}</button>`).join('');
      html = `<p class="muted small">Cada série tem ${REPS_PER_SET} repetições. Toque em <b>Repetir</b> (ou ataque/Espaço) para cada repetição; o corpo desce e sobe por inteiro. Descanso entre séries. Treino físico não muda a maestria da fruta.</p>
        <div class="w-row">${ex}</div>
        <h4>Carga <small class="muted">· capacidade agora ≈ ${fmt(cap)} kg · média Força/Constituição ${strengthIndex(t)}</small></h4>
        <div class="w-grid">${lds}</div>
        <h4>Séries</h4>
        <div class="w-row">${sets}<label class="w-custom">Outra <input id="treino-custom" type="number" min="1" max="50" value="${SET_CHOICES.includes(this.sets) ? '' : this.sets}" placeholder="nº"></label></div>
        <button class="btn gold w-start" data-go="start">Começar · ${EXERCISES[this.exercise].nome} · ${fmt(this.kg)} kg · ${this.sets} série${this.sets > 1 ? 's' : ''}</button>`;
    } else if (this.tab === 'stats') {
      const keys = ['constituicao', 'forca', 'impulsao', 'resistencia', 'defesa', 'folego', 'agilidade', 'velocidade', 'precisao', 'reflexos', 'recuperacao', 'natacao'];
      html = `<div class="w-stats">${keys.map((k) => `<div><span>${ATTR_NAME(k)}</span><b>Nv. ${t.attrs[k]?.level ?? 1}</b></div>`).join('')}</div>
        <p class="muted small">Repetições feitas: flexões <b>${fmt(s.workout?.reps?.flexao ?? 0)}</b> · agachamentos <b>${fmt(s.workout?.reps?.agachamento ?? 0)}</b></p>`;
    } else html = this.h.extraTabs?.(this.tab) ?? '';
    $('treino-body').innerHTML = html;
  }

  // ===== Painel da série =====
  showHud(on) {
    $('treino-hud').classList.toggle('hidden', !on);
    this.last = {};
  }

  // atualiza só o que mudou
  updateHud(s, attrs = []) {
    const set = (id, v) => {
      if (this.last[id] === v) return;
      this.last[id] = v;
      const el = $(id);
      if (el) el.textContent = v;
    };
    set('w-title', `${EXERCISES[s.exercise].nome} · ${fmt(s.kg)} kg`);
    set('w-set', `Série ${s.set}/${s.sets}`);
    set('w-reps', `${s.reps}/${REPS_PER_SET}`);
    set('w-state', s.phase === 'descanso' ? `Descanso ${Math.ceil(s.rest)} s` : s.phase === 'pausa' ? 'Pausado' : s.fatigue >= 1 ? 'Exausto: descanse' : s.phase === 'repeticao' ? 'Repetindo…' : 'Toque em Repetir');
    set('w-attrs', attrs.map(ATTR_NAME).join(' · '));
    const f = Math.round(s.fatigue * 100);
    if (this.last.fatigue !== f) {
      this.last.fatigue = f;
      $('w-fatigue').style.transform = `scaleX(${s.fatigue})`;
    }
    set('w-pause', s.phase === 'pausa' ? 'Continuar' : 'Pausar');
  }
}
