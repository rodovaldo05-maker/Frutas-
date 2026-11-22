// Menu de pausa com configurações (doc 10): qualidade, câmera, movimento reduzido,
// desempenho, volume e layout dos botões de toque. Cada mudança vale na hora e é salva.

const $ = (id) => document.getElementById(id);

export class PauseMenu {
  constructor({ settings, onChange, onResume, onSave, onRestart, onTitle }) {
    this.settings = settings;
    this.onChange = onChange;
    this.root = $('pause');
    this.open = false;
    $('btn-resume').addEventListener('click', () => onResume());
    $('btn-save').addEventListener('click', () => onSave());
    $('btn-restart').addEventListener('click', () => onRestart());
    $('btn-title').addEventListener('click', () => onTitle());
    for (const tab of this.root.querySelectorAll('[data-tab]')) {
      tab.addEventListener('click', () => this.showTab(tab.dataset.tab));
    }
    // botões de escolha (qualidade, layout)
    for (const group of this.root.querySelectorAll('[data-choice]')) {
      const key = group.dataset.choice;
      const num = group.hasAttribute('data-num');
      for (const b of group.querySelectorAll('button')) {
        b.addEventListener('click', () => this.set(key, num ? Number(b.dataset.value) : b.dataset.value));
      }
    }
    for (const input of this.root.querySelectorAll('input[data-key]')) {
      const key = input.dataset.key;
      input.addEventListener('input', () => {
        const value = input.type === 'checkbox' ? input.checked : Number(input.value);
        this.set(key, value);
      });
    }
    this.sync();
  }

  set(key, value) {
    this.settings[key] = value;
    this.sync();
    this.onChange(key, value, this.settings);
  }

  sync() {
    const s = this.settings;
    for (const group of this.root.querySelectorAll('[data-choice]')) {
      for (const b of group.querySelectorAll('button')) b.classList.toggle('active', b.dataset.value === String(s[group.dataset.choice]));
    }
    for (const input of this.root.querySelectorAll('input[data-key]')) {
      if (input.type === 'checkbox') input.checked = !!s[input.dataset.key];
      else input.value = s[input.dataset.key];
      const out = this.root.querySelector(`[data-out="${input.dataset.key}"]`);
      if (out) out.textContent = input.dataset.format === 'pct' ? `${Math.round(Number(input.value) * 100)}%` : `${Number(input.value).toFixed(1)}×`;
    }
  }

  showTab(id) {
    for (const tab of this.root.querySelectorAll('[data-tab]')) tab.classList.toggle('active', tab.dataset.tab === id);
    for (const page of this.root.querySelectorAll('[data-page]')) page.classList.toggle('hidden', page.dataset.page !== id);
  }

  // fromTitle: aberto pelo menu inicial (só configurações e controles)
  setOpen(open, { fromTitle = false, tab = fromTitle ? 'config' : 'jogo' } = {}) {
    this.open = open;
    this.root.classList.toggle('hidden', !open);
    if (!open) return;
    this.root.querySelector('[data-tab="jogo"]').classList.toggle('hidden', fromTitle);
    $('pause-title').textContent = fromTitle ? 'Configurações' : 'Pausa';
    this.showTab(tab);
  }

  setInfo(text) {
    $('pause-info').textContent = text;
  }
}
