// Catálogo de frutas (filtros por raridade, tipo, posse, nome e domínio) e ficha da fruta
// com visualização 3D giratória (especificação, Parte A §8).

import * as THREE from 'three';
import { RANK, RANKS, FRUITS, FRUIT, TYPES, chances } from '../fruits/catalog.js';
import { rarityOf } from '../fruits/roulette.js';
import { makeFruit } from '../fruits/fruitArt.js';

const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString('pt-BR');
const pct = (x) => `${(x * 100).toLocaleString('pt-BR', { maximumFractionDigits: x < 0.01 ? 2 : 1 })}%`;
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export class CatalogScreen {
  constructor({ save, thumbs, openModal, reducedFx }) {
    Object.assign(this, { save, thumbs, openModal, reducedFx });
    this.filters = { busca: '', rank: 'todas', tipo: 'todas', posse: 'todas', ordem: 'raridade' };
    $('cat-rank').innerHTML = `<button data-rank="todas" class="active">Todas</button>` + RANKS.map((r) => `<button data-rank="${r.id}" style="--r:${r.cor}">${r.nome}</button>`).join('');
    $('cat-type').innerHTML = `<button data-type="todas" class="active">Todos os tipos</button>` + Object.values(TYPES).map((t) => `<button data-type="${t.id}" title="${esc(t.descricao)}">${t.nome}</button>`).join('');
    const group = (id, attr, key) => {
      $(id).addEventListener('click', (e) => {
        const b = e.target.closest(`[data-${attr}]`);
        if (!b) return;
        this.filters[key] = b.dataset[attr];
        for (const o of $(id).querySelectorAll('button')) o.classList.toggle('active', o === b);
        this.render();
      });
    };
    group('cat-rank', 'rank', 'rank');
    group('cat-type', 'type', 'tipo');
    group('cat-own', 'own', 'posse');
    group('cat-sort', 'sort', 'ordem');
    $('cat-search').addEventListener('input', (e) => {
      this.filters.busca = e.target.value.trim().toLowerCase();
      this.render();
    });
    $('cat-grid').addEventListener('click', (e) => {
      const card = e.target.closest('[data-fruit]');
      if (card) this.openDetail(card.dataset.fruit);
    });
    this.viewer = null;
  }

  owned(id) {
    return this.save.bag.filter((it) => it.fruit === id).length;
  }

  render() {
    const f = this.filters;
    const c = chances('roleta');
    let list = FRUITS.filter((fr) => {
      if (f.busca && !fr.nome.toLowerCase().includes(f.busca)) return false;
      if (f.rank !== 'todas' && fr.raridade !== f.rank) return false;
      if (f.tipo !== 'todas' && fr.tipo !== f.tipo) return false;
      const n = this.owned(fr.id);
      const eaten = this.save.eaten?.fruit === fr.id;
      if (f.posse === 'mochila' && !n) return false;
      if (f.posse === 'comida' && !eaten) return false;
      if (f.posse === 'nunca' && (n || eaten || this.everHad(fr.id))) return false;
      return true;
    });
    const by = {
      raridade: (a, b) => RANK[b.raridade].ordem - RANK[a.raridade].ordem || a.nome.localeCompare(b.nome, 'pt-BR'),
      nome: (a, b) => a.nome.localeCompare(b.nome, 'pt-BR'),
      dominio: (a, b) => (this.mastery(b.id) - this.mastery(a.id)) || a.nome.localeCompare(b.nome, 'pt-BR'),
    }[f.ordem];
    list = list.sort(by);
    const seen = FRUITS.filter((fr) => this.everHad(fr.id)).length;
    $('catalog-title').textContent = `Catálogo de frutas · ${seen}/${FRUITS.length} obtidas`;
    $('cat-grid').innerHTML = list.length
      ? list.map((fr) => {
        const r = RANK[fr.raridade];
        const n = this.owned(fr.id);
        const eaten = this.save.eaten?.fruit === fr.id;
        const had = this.everHad(fr.id);
        const state = eaten ? 'Comida' : n ? `Na mochila ×${n}` : had ? 'Já obtida' : 'Não obtida';
        return `<div class="fcard r-${r.id} cat${had ? '' : ' sil-soft'}" style="--r:${r.cor}" data-fruit="${fr.id}">
          <span class="tag ${eaten ? 'eaten' : n ? '' : 'none'}">${state}</span>
          <img src="${this.thumbs()[FRUITS.indexOf(fr)]}" alt="" /><b><span class="real">${fr.nome}</span></b>
          <small>${r.nome} · ${pct(c.porFruta[fr.id] || 0)}</small><em class="type">${TYPES[fr.tipo].nome} · ${esc(fr.subtipo)}</em></div>`;
      }).join('')
      : '<div class="empty-grid">Nenhuma fruta com esses filtros.</div>';
  }

  everHad(id) {
    return this.save.eaten?.fruit === id || this.save.bag.some((it) => it.fruit === id) || (this.save.history || []).some((h) => h.fruta === id);
  }

  mastery(id) {
    return this.save.mastery?.[id] ?? 0;
  }

  // ===== Ficha =====
  openDetail(id) {
    const fr = FRUIT[id];
    if (!fr) return;
    const r = RANK[fr.raridade];
    const c = chances('roleta');
    $('fd-title').textContent = fr.nome;
    const hab = fr.habilidades.map((h) => `<li><b>${esc(h.nome)}</b> — ${esc(h.descricao)} <span class="muted">${h.custoEnergia ? `${h.custoEnergia} energia · ` : ''}${h.recarga ? `${String(h.recarga).replace('.', ',')} s · ` : ''}${h.dano ? `${h.dano} dano` : ''}</span></li>`).join('');
    const forms = [fr.formaHibrida && `Híbrida (${String(fr.formaHibrida.velocidade).replace('.', ',')} de velocidade)`, fr.formaCompleta && `Completa (${String(fr.formaCompleta.velocidade).replace('.', ',')} de velocidade)`].filter(Boolean);
    const n = this.owned(id);
    $('fd-info').innerHTML = `
      <div class="seal-row">
        <span class="seal r-${r.id}" style="--r:${r.cor}">${r.nome}</span>
        <span class="type-tag">${TYPES[fr.tipo].nome} · ${esc(fr.subtipo)}</span>
      </div>
      <p>${esc(fr.descricao)}</p>
      <div class="facts">
        <span>Chance na roleta <b>${pct(c.porFruta[id] || 0)}</b></span>
        <span>Valor de troca <b>${fr.valorTroca} fragmento(s)</b></span>
        <span>Preço de referência <b>${fmt(fr.precoBase)} moedas</b></span>
        <span>Origem <b>Roleta da Ilha de Treino</b></span>
        <span>Domínio <b>${this.mastery(id)}/${fr.dominio.maximo}</b></span>
        <span>Posse <b>${this.save.eaten?.fruit === id ? 'comida' : n ? `${n} na mochila` : 'nenhuma'}</b></span>
      </div>
      <h4>Habilidades</h4><ul class="moves">${hab || '<li class="muted">A definir</li>'}</ul>
      <h4>Transformações</h4><p>${forms.length ? forms.join(' · ') : 'Não possui'}</p>
      <h4>Despertar</h4><p>${fr.despertar ? `<b>${esc(fr.despertar.nome)}</b>: ${esc(fr.despertar.descricao)}` : 'A definir'}</p>
      <h4>Efeitos e passivas</h4><p>${fr.efeitos.map(esc).join(' · ') || '—'}</p>
      <h4>Restrições</h4><p>${fr.restricoes.filter(Boolean).map(esc).join(' · ')}</p>
      <p class="muted small">Os poderes ficam ativos com o sistema de combate (próxima fase). A raridade não multiplica dano: o equilíbrio vem de alcance, recarga, custo, controle e mobilidade.</p>`;
    this.openModal('fruit-detail');
    this.startViewer(FRUITS.indexOf(fr), r.cor);
  }

  startViewer(index, color) {
    const canvas = $('fd-canvas');
    if (!this.viewer) {
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      const scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight('#fff7ea', '#4a3a6a', 1.6));
      const key = new THREE.DirectionalLight('#fff1dc', 2.3);
      key.position.set(2, 4, 5);
      scene.add(key);
      const rim = new THREE.PointLight('#ffffff', 2, 10);
      rim.position.set(-2, 1, -2);
      scene.add(rim);
      const cam = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
      const pivot = new THREE.Group();
      scene.add(pivot);
      this.viewer = { renderer, scene, cam, pivot, rim, yaw: 0, drag: null, running: false };
      canvas.addEventListener('pointerdown', (e) => {
        canvas.setPointerCapture?.(e.pointerId);
        this.viewer.drag = e.clientX;
      });
      canvas.addEventListener('pointermove', (e) => {
        if (this.viewer.drag === null) return;
        this.viewer.yaw += (e.clientX - this.viewer.drag) * 0.012;
        this.viewer.drag = e.clientX;
      });
      const up = () => (this.viewer.drag = null);
      canvas.addEventListener('pointerup', up);
      canvas.addEventListener('pointercancel', up);
    }
    const v = this.viewer;
    v.pivot.clear();
    const fruit = makeFruit(index, 0);
    const box = new THREE.Box3().setFromObject(fruit);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    fruit.position.sub(center);
    v.pivot.add(fruit);
    const r = Math.max(size.x, size.y, size.z) * 0.65;
    const dist = r / Math.tan((v.cam.fov * Math.PI) / 360) * 1.25;
    v.cam.position.set(0, r * 0.35, dist);
    v.cam.lookAt(0, 0, 0);
    v.rim.color.set(color);
    v.yaw = -0.4;
    if (v.running) return;
    v.running = true;
    let last = performance.now();
    const loop = (now) => {
      if (!v.running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w && h && (canvas.width !== Math.round(w * Math.min(2, devicePixelRatio)) || canvas.height !== Math.round(h * Math.min(2, devicePixelRatio)))) {
        v.renderer.setPixelRatio(Math.min(2, devicePixelRatio));
        v.renderer.setSize(w, h, false);
        v.cam.aspect = w / h;
        v.cam.updateProjectionMatrix();
      }
      if (v.drag === null && !this.reducedFx()) v.yaw += dt * 0.6;
      v.pivot.rotation.y = v.yaw;
      v.pivot.position.y = this.reducedFx() ? 0 : Math.sin(now / 600) * 0.02;
      v.renderer.render(v.scene, v.cam);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stopViewer() {
    if (this.viewer) this.viewer.running = false;
  }

  // nome legível do rank de um item da mochila
  static rankName(item) {
    return RANK[rarityOf(item)].nome;
  }
}
