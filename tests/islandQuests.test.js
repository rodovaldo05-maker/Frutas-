import { describe, it, expect } from 'vitest';
import { SEA } from '../src/islands/firstSea.js';
import { SEA2 } from '../src/islands/secondSea.js';
import { SEA3 } from '../src/islands/thirdSea.js';
import { QUEST_NPCS, questsFor, questStatus, acceptIslandQuest, islandQuestEvent, turnInIslandQuest, normalizeIslandQuests } from '../src/quests/islandQuests.js';

const ALL = [...SEA, ...SEA2, ...SEA3];
const byId = (id) => ALL.find((d) => d.id === id);

describe('missões das ilhas (atualização 29)', () => {
  it('todas as 24 ilhas dos três mares têm NPC e uma corrente de 3 missões', () => {
    expect(ALL.length).toBe(24);
    for (const d of ALL) {
      expect(QUEST_NPCS[d.id], d.id).toBeDefined();
      const q = questsFor(d);
      expect(q.map((x) => x.tipo)[0]).toBe('caca');
      expect(q[2].tipo).toBe('chefe');
      expect(q[2].recompensa.keys).toBe(1);
      expect(q[2].recompensa.coins).toBeGreaterThan(q[0].recompensa.coins);
    }
  });

  it('a segunda missão usa a mecânica da ilha, núcleos elementais ou exploração', () => {
    expect(questsFor(byId('ruinas-sol-poente'))[1]).toMatchObject({ tipo: 'mecanica', alvo: 'espelhos' });
    expect(questsFor(byId('caldeira-rubra'))[1]).toMatchObject({ tipo: 'material', alvo: 'nucleo-brasa' });
    expect(questsFor(byId('praia-saqueadores'))[1].tipo).toBe('explorar');
  });

  it('fluxo completo: aceitar, caçar, receber, desafio, chefe e fim', () => {
    const st = normalizeIslandQuests(null);
    const d = byId('praia-saqueadores');
    expect(questStatus(st, d)).toBe('disponivel');
    acceptIslandQuest(st, d);
    expect(st.tracked).toBe(d.id);
    expect(questStatus(st, d)).toBe('ativa');
    // inimigo de outra ilha e o chefe não contam para a caça
    islandQuestEvent(st, ALL, { kind: 'defeat', id: 'bosque-sussurrante-1' });
    islandQuestEvent(st, ALL, { kind: 'defeat', id: 'praia-saqueadores-chefe' });
    expect(st.by[d.id].progress).toBe(0);
    for (let i = 1; i <= 4; i++) islandQuestEvent(st, ALL, { kind: 'defeat', id: `praia-saqueadores-${i}` });
    expect(questStatus(st, d)).toBe('pronta');
    expect(turnInIslandQuest(st, d).reward.coins).toBeGreaterThan(0);
    acceptIslandQuest(st, d);
    const alvo = questsFor(d)[1].alvo;
    islandQuestEvent(st, ALL, { kind: 'visit', pos: { x: alvo.x + 100, z: alvo.z } });
    expect(questStatus(st, d)).toBe('ativa');
    islandQuestEvent(st, ALL, { kind: 'visit', pos: { x: alvo.x, z: alvo.z } });
    expect(questStatus(st, d)).toBe('pronta');
    turnInIslandQuest(st, d);
    acceptIslandQuest(st, d);
    islandQuestEvent(st, ALL, { kind: 'defeat', id: 'praia-saqueadores-chefe' });
    const r = turnInIslandQuest(st, d);
    expect(r.last).toBe(true);
    expect(r.reward.item).toBe(true);
    expect(questStatus(st, d)).toBe('concluida');
    expect(acceptIslandQuest(st, d)).toBeNull();
  });

  it('material conta a partir do que tinha ao aceitar; desafios já feitos contam na hora', () => {
    const st = normalizeIslandQuests(null);
    const c = byId('caldeira-rubra');
    st.by[c.id] = { step: 1, accepted: false, progress: 0, base: 0 };
    acceptIslandQuest(st, c, { materials: { 'nucleo-brasa': 5 } });
    islandQuestEvent(st, ALL, { kind: 'material', counts: { 'nucleo-brasa': 7 } });
    expect(st.by[c.id].progress).toBe(2);
    const r = byId('ruinas-sol-poente');
    st.by[r.id] = { step: 1, accepted: false, progress: 0, base: 0 };
    acceptIslandQuest(st, r, { islands: { ruinas: { solved: true } } });
    expect(questStatus(st, r)).toBe('pronta');
  });

  it('salvo: valores inválidos são corrigidos e ilhas desconhecidas somem', () => {
    const st = normalizeIslandQuests({ tracked: 'x', by: { 'praia-saqueadores': { step: 9, accepted: true, progress: -2 }, nada: { step: 1 } } });
    expect(st.by['praia-saqueadores']).toEqual({ step: 3, accepted: false, progress: 0, base: 0 });
    expect(st.by.nada).toBeUndefined();
    expect(st.tracked).toBeNull();
  });
});
