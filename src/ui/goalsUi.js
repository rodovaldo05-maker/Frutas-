// Abas Diárias e Conquistas da janela de Missões (atualização 30).

import { STREAK_WEEK, dailyReward, chestReward } from '../progression/dailies.js';
import { ACHIEVEMENTS, achievementProgress } from '../progression/achievements.js';

const fmt = (n) => Math.round(n).toLocaleString('pt-BR');

export function dailiesHtml(save) {
  const st = save.dailies;
  const r = dailyReward(save.level ?? 1);
  const week = (st.streak % STREAK_WEEK === 0 && st.streak > 0) || (!st.chest && (st.streak + 1) % STREAK_WEEK === 0);
  const chest = chestReward(save.level ?? 1, week);
  const rows = st.list.map((d) => {
    const pct = Math.round((d.progress / d.meta) * 100);
    const shown = d.kind === 'distance' ? `${fmt(d.progress)} / ${fmt(d.meta)} m` : `${fmt(d.progress)} / ${fmt(d.meta)}`;
    return `<div class="dq-row ${d.paid ? 'dq-done' : ''}"><div><b>${d.titulo}</b><small>${d.texto}</small><div class="dq-bar"><i style="width:${pct}%"></i></div></div><span class="dq-state">${d.paid ? '✓ Paga' : shown}</span></div>`;
  }).join('');
  const dots = Array.from({ length: STREAK_WEEK }, (_, i) => `<i class="${i < (st.streak % STREAK_WEEK || (st.streak && st.chest ? STREAK_WEEK : 0)) ? 'on' : ''}"></i>`).join('');
  return `<div class="dq">
    <p class="muted small">Três missões novas todo dia (pelo calendário do aparelho). Cada uma paga na hora: <b>${fmt(r.coins)} moedas</b> e <b>${fmt(r.xp)} exp</b>. Fechando as três, o <b>Baú Diário</b> abre (${fmt(chest.coins)} moedas e ${chest.keys} chave${chest.keys > 1 ? 's' : ''}${chest.fruitChance ? `, ${Math.round(chest.fruitChance * 100)}% de chance de fruta` : ''}).</p>
    ${rows}
    <div class="dq-streak"><span>Sequência: <b>${st.streak}</b> dia${st.streak === 1 ? '' : 's'} ${st.chest ? '· baú de hoje aberto' : ''}</span><span class="dq-dots">${dots}</span><small>A cada ${STREAK_WEEK} dias seguidos o baú vem dobrado. Pular um dia zera a sequência.</small></div>
  </div>`;
}

export function achievementsHtml(save) {
  const got = save.achievements?.got ?? [];
  const groups = [...new Set(ACHIEVEMENTS.map((a) => a.grupo))];
  const head = `<p class="muted small">Conquistas pagam uma vez e liberam um <b>título</b> para usar (aparece na janela do personagem). ${got.length}/${ACHIEVEMENTS.length} conquistadas.</p>`;
  const body = groups.map((g) => `<h4 class="iq-sea">${g}</h4>` + ACHIEVEMENTS.filter((a) => a.grupo === g).map((a) => {
    const done = got.includes(a.id);
    const p = achievementProgress(a, save);
    const using = save.achievements?.title === a.id;
    const btn = done ? `<button class="btn ${using ? 'gold' : ''}" data-title="${a.id}">${using ? 'Usando' : 'Usar título'}</button>` : `<span class="dq-state">${fmt(p)} / ${fmt(a.meta)}</span>`;
    return `<div class="dq-row ${done ? 'dq-done' : ''}"><div><b>${a.titulo}</b><small>${a.descricao} · ${fmt(a.reward.coins)} moedas${a.reward.keys ? ` · ${a.reward.keys} chave${a.reward.keys > 1 ? 's' : ''}` : ''}</small>${done ? '' : `<div class="dq-bar"><i style="width:${Math.round((p / a.meta) * 100)}%"></i></div>`}</div>${btn}</div>`;
  }).join('')).join('');
  return `<div class="dq">${head}${body}</div>`;
}
