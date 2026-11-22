// Estilos de luta (doc 06; atualização 7): independentes da fruta, ficam no slot 3. Cada um tem
// combo de três golpes (gestos do laboratório), quatro técnicas (Z X C V) liberadas pela
// maestria do estilo (1 a 100; equivalente a 0/50/100/200 de 600 no doc) e uma passiva.
// As técnicas usam o mesmo sistema dos poderes, sem energia (só recarga).

import { ATTACKS } from '../combat/rules.js';
import { FRUTOMotion } from '../animation/fruto-motion.js';

export const STYLE_UNLOCK = [1, 8, 17, 34];

export const STYLES = {
  basico: {
    id: 'basico', nome: 'Combate Básico', curto: 'Básico', cor: '#e8c070', preco: 0, nivel: 1,
    descricao: 'Estilo inicial equilibrado.',
    passiva: '+5% de dano corpo a corpo', dano: [10, 12, 16], clips: ['jab', 'direto', 'gancho'], meleeMult: 1.05,
    tecnicas: [
      { nome: 'Sequência de Punhos', detalhe: 'Três socos rápidos à frente.', kind: 'cone', params: { range: 4.5, angle: 60 }, dano: 18, recarga: 3, clip: 'impacto0' },
      { nome: 'Chute Ascendente', detalhe: 'Lança o alvo para o ar.', kind: 'cone', params: { range: 4, angle: 50, launch: 0.8 }, dano: 16, recarga: 5, clip: 'impacto_j3' },
      { nome: 'Investida Corporal', detalhe: 'Avanço com o ombro que empurra.', kind: 'investida', params: { distance: 7, push: 4 }, dano: 20, recarga: 6, clip: 'impacto1' },
      { nome: 'Impacto Concentrado', detalhe: 'Soco no chão com onda de choque curta.', kind: 'area', params: { radius: 4, push: 5 }, dano: 28, recarga: 10, clip: 'impacto2' },
    ],
  },
  voltaico: {
    id: 'voltaico', nome: 'Corpo Voltaico', curto: 'Voltaico', cor: '#ffe45a', preco: 8000, nivel: 5,
    descricao: 'Eletricidade no corpo: golpes paralisam e saltam entre inimigos.',
    passiva: 'O 3º golpe do combo solta um raio num segundo inimigo', dano: [12, 14, 19],
    clips: ['tormenta_j1', 'tormenta_j2', 'tormenta_j3'], chain: true,
    tecnicas: [
      { nome: 'Punho Elétrico', detalhe: 'Soco que paralisa por um instante.', kind: 'cone', params: { range: 4.5, angle: 50, freeze: 0.5 }, dano: 20, recarga: 3, clip: 'tormenta0' },
      { nome: 'Passo Voltaico', detalhe: 'Esquiva longa que eletrifica o caminho.', kind: 'investida', params: { distance: 10 }, dano: 18, recarga: 5, clip: 'tormenta1' },
      { nome: 'Garra Elétrica', detalhe: 'Arranhão que salta para outro alvo.', kind: 'cadeia', params: { range: 8, jumps: 2, jumpRange: 7 }, dano: 22, recarga: 6, clip: 'tormenta0' },
      { nome: 'Descarga Circular', detalhe: 'Pulso em volta do corpo que paralisa.', kind: 'area', params: { radius: 5, freeze: 0.8 }, dano: 26, recarga: 10, clip: 'ima1' },
    ],
  },
  mares: {
    id: 'mares', nome: 'Caratê das Marés', curto: 'Marés', cor: '#4fd2e0', preco: 12000, nivel: 8,
    descricao: 'Impactos que movem a água do ar: empurram, puxam e molham.',
    passiva: 'Os golpes do combo empurram 40% mais', dano: [13, 15, 20],
    clips: ['mare_j1', 'mare_j2', 'mare_j3'], knockMult: 1.4,
    tecnicas: [
      { nome: 'Punho de Pressão', detalhe: 'Onda de pressão que viaja pelo ar.', kind: 'projetil', params: { speed: 24, range: 12, push: 3 }, dano: 20, recarga: 3, clip: 'mare0' },
      { nome: 'Palma Aquática', detalhe: 'Palma que empurra em leque.', kind: 'cone', params: { range: 6, angle: 70, push: 5 }, dano: 18, recarga: 5, clip: 'mare1' },
      { nome: 'Corrente Circular', detalhe: 'Giro que puxa os inimigos próximos.', kind: 'area', params: { radius: 5, pull: true }, dano: 22, recarga: 7, clip: 'mare2' },
      { nome: 'Onda Devastadora', detalhe: 'Onda frontal grande que derruba.', kind: 'faixa', params: { length: 14, halfWidth: 3, push: 5, launch: 0.5, travel: true }, dano: 34, recarga: 11, clip: 'mare0' },
    ],
  },
};
export const STYLE_IDS = Object.keys(STYLES);

// Combo do estilo no formato das regras de combate
export function styleCombo(st) {
  const attacks = {};
  const combo = [];
  st.clips.forEach((clip, i) => {
    const base = ATTACKS[['jab', 'direto', 'gancho'][i]];
    const id = st.id === 'basico' ? ['jab', 'direto', 'gancho'][i] : `${st.id}_g${i + 1}`;
    attacks[id] = {
      ...base, clip: FRUTOMotion.clips[clip] ? clip : base.clip, damage: st.dano[i], knock: base.knock * (st.knockMult ?? 1),
      style: st.id, styleMult: st.meleeMult ?? 1, chain: st.chain && i === 2,
    };
    combo.push(id);
  });
  return { attacks, combo, nome: st.nome };
}

// Técnicas no formato do sistema de poderes
export function stylePowers(st) {
  return st.tecnicas.map((t, slot) => ({
    slot, index: slot, kind: t.kind, params: t.params, clip: FRUTOMotion.clips[t.clip] ? t.clip : 'impacto0', fruit: st.id, color: st.cor,
    nome: t.nome, curto: t.nome, detalhe: t.detalhe, custo: 0, recarga: t.recarga, dano: t.dano, unlock: STYLE_UNLOCK[slot], style: true,
  }));
}
