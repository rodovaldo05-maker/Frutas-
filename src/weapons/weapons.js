// Armas (atualização 4): espadas vendidas pelo Mestre de Armas. Cada espada tem combo próprio
// (três cortes), dano, alcance e três habilidades que abrem com a proficiência em espadas.
// A proficiência é do TIPO de arma (espada), não do item: trocar de espada não perde nada
// (documento mestre 4.0, teste 12). Dano: dano × (1 + 3% por ponto de Espada) × proficiência.

import { FRUTOMotion } from '../animation/fruto-motion.js';

// Golpes do combo de espada: gestos do laboratório com a mão direita (varrida, rasgo e
// meia-lua), mais alcance e arco que o soco
const SWORD_CLIPS = ['mare0', 'lobo0', 'duna_j2'];
const SWORD_REACH = [2.0 * 2.2, 2.0 * 2.2, 2.2 * 2.2];

export const WEAPON_UNLOCK_LABEL = 'Prof.';

export const WEAPONS = {
  'lamina-treino': {
    id: 'lamina-treino', nome: 'Lâmina de Treino', tipo: 'espada', raridade: 'Comum', corRaridade: '#A5ADB5', preco: 500,
    descricao: 'Espada simples de ferro para aprender os cortes. Leve e rápida.',
    cores: { lamina: '#d7dee6', fio: '#ffffff', guarda: '#8a6a3a', punho: '#4a2e1a', pomo: '#c9a25a' },
    dano: [13, 15, 21], cor: '#c9d2dc',
    habilidades: [
      { nome: 'Corte Cruzado', detalhe: 'Avança cortando tudo no caminho.', kind: 'investida', params: { distance: 8, push: 3 }, dano: 22, recarga: 3, unlock: 1 },
      { nome: 'Giro da Lâmina', detalhe: 'Gira a espada em volta do corpo.', kind: 'area', params: { radius: 4.6, push: 3 }, dano: 26, recarga: 6, unlock: 5 },
      { nome: 'Lua Cortante', detalhe: 'Um corte em meia-lua viaja em linha reta.', kind: 'faixa', params: { length: 12, halfWidth: 1.4, travel: true }, dano: 32, recarga: 9, unlock: 12 },
    ],
  },
  'sabre-rubro': {
    id: 'sabre-rubro', nome: 'Sabre Rubro', tipo: 'espada', raridade: 'Rara', corRaridade: '#3E9EFF', preco: 4000,
    descricao: 'Sabre de lâmina avermelhada. Os cortes deixam brasas no alvo.',
    cores: { lamina: '#c84a4a', fio: '#ffb0a0', guarda: '#2a2a33', punho: '#5a1a1a', pomo: '#e0b040' },
    dano: [16, 19, 25], cor: '#ff6a5a',
    habilidades: [
      { nome: 'Rasgo Rubro', detalhe: 'Investida que deixa o alvo queimando.', kind: 'investida', params: { distance: 10, burn: 2 }, dano: 28, recarga: 3.5, unlock: 1 },
      { nome: 'Lua Rubra', detalhe: 'Lança um corte de energia que explode.', kind: 'projetil', params: { speed: 26, range: 16, explode: 2.2 }, dano: 30, recarga: 5, unlock: 5 },
      { nome: 'Tempestade de Cortes', detalhe: 'Vários cortes caem no ponto marcado.', kind: 'alvo', params: { range: 10, radius: 3.5, pulses: 4, interval: 0.25 }, dano: 42, recarga: 10, unlock: 12 },
    ],
  },
  'lamina-mares': {
    id: 'lamina-mares', nome: 'Lâmina das Marés', tipo: 'espada', raridade: 'Épica', corRaridade: '#B56BFF', preco: 15000,
    descricao: 'Espada curva de aço azul. Os cortes arrastam como correnteza.',
    cores: { lamina: '#5ab4e6', fio: '#d8f6ff', guarda: '#d8b04a', punho: '#173a5a', pomo: '#ffe08a' },
    dano: [19, 22, 29], cor: '#5ad0ff',
    habilidades: [
      { nome: 'Corte da Corrente', detalhe: 'Um corte largo empurra quem estiver à frente.', kind: 'faixa', params: { length: 12, halfWidth: 2, push: 4, travel: true }, dano: 30, recarga: 3.5, unlock: 1 },
      { nome: 'Redemoinho de Aço', detalhe: 'Gira e puxa os inimigos para perto.', kind: 'area', params: { radius: 5.5, pull: true }, dano: 34, recarga: 6, unlock: 8 },
      { nome: 'Maré Cortante', detalhe: 'Leque de cortes que joga os alvos para o alto.', kind: 'cone', params: { range: 10, angle: 80, launch: 0.6 }, dano: 46, recarga: 9, unlock: 16 },
    ],
  },
};
export const WEAPON_IDS = Object.keys(WEAPONS);

const SKILL_CLIP = { investida: 'tormenta1', area: 'ima1', faixa: 'mare0', projetil: 'duna_j2', alvo: 'cristal1', cone: 'mare0' };

// Habilidades no formato do sistema de poderes (mesma liberação, recarga e efeitos)
export function weaponPowers(w) {
  if (!w) return [];
  return w.habilidades.map((h, slot) => ({
    slot, index: slot, kind: h.kind, params: h.params, clip: SKILL_CLIP[h.kind] || 'mare0', fruit: w.id, color: w.cor,
    nome: h.nome, curto: h.nome, detalhe: h.detalhe, custo: 0, recarga: h.recarga, dano: h.dano, unlock: h.unlock, weapon: true,
  }));
}

// Combo de três cortes da espada (formato das regras de combate)
export function weaponStyle(w) {
  const attacks = {};
  const combo = [];
  SWORD_CLIPS.forEach((clip, i) => {
    const id = `${w.id}_c${i + 1}`;
    attacks[id] = {
      clip: FRUTOMotion.clips[clip] ? clip : 'direto', nome: `Corte ${i + 1}`, damage: w.dano[i], posture: 10 + i * 4, range: SWORD_REACH[i],
      knock: (0.7 + i * 0.4) * 2.2, reaction: i === 2 ? 'media' : 'leve', hitstop: 0.06 + i * 0.02, lunge: 0.5 * 2.2, heavy: i === 2, weapon: w.id, arc: 0.2,
    };
    combo.push(id);
  });
  return { attacks, combo, nome: w.nome };
}
