// NPCs de missão das ilhas (atualização 29): conversa (aceitar, receber, rastrear), marcador
// sobre a cabeça ("!" dourado = missão para aceitar, "?" verde = voltar para receber, "…" cinza =
// em andamento) e a aba Ilhas da janela de Missões.

import * as THREE from 'three';
import { QUEST_NPCS, questsFor, questStatus, currentQuest, acceptIslandQuest, turnInIslandQuest, questStepText } from '../quests/islandQuests.js';

const fmt = (n) => Math.round(n).toLocaleString('pt-BR');

function markerTexture(text, color) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.font = '900 104px Cinzel, Georgia, serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = 12;
  g.strokeStyle = 'rgba(20, 10, 30, 0.95)';
  g.strokeText(text, 64, 70);
  g.fillStyle = color;
  g.fillText(text, 64, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class IslandQuestUi {
  // defs: ilhas (com NPC); npcs: NPCs do mercado com role 'missao' (npc.island = id da ilha)
  // hooks: { state(), islands(), materials(), dialog(title, text, actions), close(), toast, reward(def, r, q), changed(), level() }
  constructor({ scene, defs, npcs, hooks }) {
    this.h = hooks;
    this.defs = defs;
    this.byId = Object.fromEntries(defs.map((d) => [d.id, d]));
    this.tex = { '!': markerTexture('!', '#ffd040'), '?': markerTexture('?', '#7ee06a'), '…': markerTexture('…', '#c8c8d0') };
    this.markers = npcs.map((n) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex['!'], depthWrite: false, transparent: true }));
      sp.scale.set(1.6, 1.6, 1);
      sp.position.set(n.x, n.ground + 6.6, n.z);
      sp.renderOrder = 7;
      scene.add(sp);
      return { npc: n, sp, def: this.byId[n.island], mark: '!' };
    });
    this.t = 0;
    this.refresh();
  }

  mark(def) {
    const s = questStatus(this.h.state(), def);
    return s === 'disponivel' ? '!' : s === 'pronta' ? '?' : s === 'ativa' ? '…' : null;
  }

  refresh() {
    for (const m of this.markers) {
      const k = this.mark(m.def);
      m.mark = k;
      if (k) m.sp.material.map = this.tex[k];
      m.sp.material.needsUpdate = true;
    }
  }

  update(dt, playerPos) {
    this.t += dt;
    for (const m of this.markers) {
      const d = Math.hypot(playerPos.x - m.npc.x, playerPos.z - m.npc.z);
      m.sp.visible = !!m.mark && d < 70 && !m.npc.hidden?.();
      if (m.sp.visible) m.sp.position.y = m.npc.ground + 6.6 + 0.18 * Math.sin(this.t * 2.6);
    }
  }

  // ===== conversa =====
  talk(npc) {
    const def = this.byId[npc.island];
    const st = this.h.state();
    const [nome, titulo, fala] = QUEST_NPCS[def.id];
    const status = questStatus(st, def);
    const q = currentQuest(st, def);
    const e = st.by[def.id];
    const actions = [];
    let text = fala;
    const rec = (r) => `${fmt(r.coins)} moedas · ${fmt(r.xp)} exp${r.keys ? ` · ${r.keys} chave da roleta` : ''}${r.item ? ' · um equipamento' : ''}${r.material ? ' · materiais raros' : ''}`;
    if (status === 'concluida') text = `${fala}\n\nVocê já fez tudo o que eu pedi. ${def.nome} agradece!`;
    else if (status === 'disponivel') {
      const lv = this.h.level();
      text = `${fala}\n\nMissão ${q.passo + 1}/3 · ${q.titulo}\n${q.texto}\nNível recomendado: ${q.nivel}${lv < q.nivel - 50 ? ' (perigoso para o seu nível)' : ''}\nRecompensa: ${rec(q.recompensa)}`;
      actions.push({ label: 'Aceitar missão', icon: 'check', run: () => {
        acceptIslandQuest(st, def, { islands: this.h.islands(), materials: this.h.materials() });
        this.h.toast(`Missão aceita: ${q.titulo} (${def.nome})`, 'good');
        this.after();
      } });
    } else if (status === 'pronta') {
      text = `Conseguiu! "${q.titulo}" está feita. Aqui está o combinado.`;
      actions.push({ label: 'Receber recompensa', icon: 'coin', run: () => {
        const r = turnInIslandQuest(st, def);
        if (r) this.h.reward(def, r.reward, r.quest, r.last);
        this.after();
      } });
    } else {
      text = `${fala}\n\nMissão ${q.passo + 1}/3 · ${q.titulo}\n${q.texto}\nProgresso: ${e.progress}/${q.total}`;
      actions.push({ label: st.tracked === def.id ? 'Rastreando' : 'Rastrear', icon: 'flag', run: () => {
        st.tracked = def.id;
        this.after();
      } });
    }
    actions.push({ label: 'Até logo', run: () => this.h.close() });
    this.h.dialog(`${nome} · ${titulo}`, text, actions);
  }

  after() {
    this.h.close();
    this.refresh();
    this.h.changed();
  }

  // ===== aba Ilhas da janela de Missões =====
  listHtml() {
    const st = this.h.state();
    const rows = [];
    for (const seaNo of [1, 2, 3]) {
      const defs = this.defs.filter((d) => (d.mar ?? 1) === seaNo && !this.npcHidden(d));
      if (!defs.length) continue;
      rows.push(`<h4 class="iq-sea">${['Primeiro', 'Segundo', 'Terceiro'][seaNo - 1]} Mar</h4>`);
      for (const d of defs) {
        const status = questStatus(st, d);
        const e = st.by[d.id];
        const step = e?.step ?? 0;
        const q = currentQuest(st, d);
        const [nome] = QUEST_NPCS[d.id];
        const dots = [0, 1, 2].map((i) => `<i class="${i < step ? 'on' : i === step && status !== 'disponivel' ? 'now' : ''}"></i>`).join('');
        const label = { disponivel: `Fale com ${nome}`, ativa: questStepText(st, d), pronta: `Volte a ${nome} para receber`, concluida: 'Concluída' }[status];
        const track = status === 'ativa' || status === 'pronta' ? `<button class="btn ${st.tracked === d.id ? 'gold' : ''}" data-iq-track="${d.id}">${st.tracked === d.id ? 'Rastreando' : 'Rastrear'}</button>` : '';
        rows.push(`<div class="iq-row iq-${status}"><div><b>${d.nome}</b> <small>Nv. ${d.faixa[0]}–${d.faixa[1]}</small><span class="iq-dots">${dots}</span><small>${q ? `${q.titulo} · ` : ''}${label}</small></div>${track}</div>`);
      }
    }
    return `<div class="iq-list">${rows.join('')}</div>`;
  }

  bindList(el) {
    el.querySelectorAll('[data-iq-track]').forEach((b) => b.addEventListener('click', () => {
      const st = this.h.state();
      st.tracked = st.tracked === b.dataset.iqTrack ? null : b.dataset.iqTrack;
      this.h.changed();
    }));
  }

  npcHidden(def) {
    const m = this.markers.find((x) => x.def === def);
    return !!m?.npc.hidden?.();
  }

  // missão rastreada para o rastreador da tela: { title, step, reward, done, def, quest }
  tracked() {
    const st = this.h.state();
    const def = st.tracked ? this.byId[st.tracked] : null;
    if (!def) return null;
    const q = currentQuest(st, def);
    if (!q) return null;
    return { def, quest: q, title: `${q.titulo} · ${def.nome}`, step: questStepText(st, def), reward: `${fmt(q.recompensa.coins)} moedas · ${fmt(q.recompensa.xp)} exp`, done: questStatus(st, def) === 'pronta' };
  }

  // marcadores da carta: NPCs com "!" ou "?" e o alvo da missão de exploração rastreada
  mapMarkers() {
    const out = [];
    for (const m of this.markers) {
      if (!m.mark || m.mark === '…' || m.npc.hidden?.()) continue;
      out.push({ x: m.npc.x, z: m.npc.z, label: `${m.mark} ${QUEST_NPCS[m.def.id][0]}`, color: m.mark === '?' ? '#7ee06a' : '#ffd040', chart: true });
    }
    const t = this.tracked();
    if (t?.quest.tipo === 'explorar') out.push({ x: t.quest.alvo.x, z: t.quest.alvo.z, label: 'Coração da ilha', color: '#ff8a5a', chart: true });
    return out;
  }
}

export { questsFor };
