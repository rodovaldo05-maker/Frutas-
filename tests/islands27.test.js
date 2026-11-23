import { describe, it, expect } from 'vitest';
import { SEA2, GATES, ARRIVALS, seaOf, crossingUnlocked } from '../src/islands/secondSea.js';
import { seaHeight, seaSpots, dungeonLayout } from '../src/islands/firstSea.js';
import {
  BLIZZARD, blizzardPhase, stepCold, frozen, newLightPuzzle, litCount, rotateMirror, MIRRORS,
  hitEcho, ECHOES, eruptionPhase, eruptionTargets, ERUPTION, DUNGEON, doorOpen, takeKey, spikeState, normalizeIslands,
} from '../src/islands/islandRules.js';
import { envImmune, THRESHOLDS } from '../src/progression/mastery.js';
import { migrate, newSave } from '../src/saves/saveSystem.js';

const byId = (id) => SEA2.find((d) => d.id === id);

describe('Segundo Mar completo (atualização 27)', () => {
  it('as cinco ilhas novas com chefe, bioma próprio e faixa do doc 02', () => {
    const want = {
      'geleira-silente': ['Rainha do Inverno Eterno', 'geleira'],
      'ruinas-sol-poente': ['Sentinela Dourado', 'ruinas'],
      'bosque-noturno': ['Senhora das Sombras', 'noturno'],
      'bastiao-vulcanico': ['Titã de Obsidiana', 'bastiao'],
      'masmorra-abismo': ['Carcereiro Sem-Rosto', 'masmorra'],
    };
    for (const [id, [boss, biome]] of Object.entries(want)) {
      const d = byId(id);
      expect(d.boss.nome).toBe(boss);
      expect(d.biome).toBe(biome);
      expect(seaOf(d.z)).toBe(2);
    }
    expect(byId('masmorra-abismo').faixa[1]).toBe(1500);
  });

  it('Portão do Abismo leva ao Terceiro Mar só depois do Carcereiro; a volta sempre abre', () => {
    expect(GATES.abismo.to).toBe('horizonte');
    expect(GATES.horizonte.to).toBe('abismo');
    expect(seaOf(GATES.abismo.z)).toBe(2);
    expect(seaOf(GATES.horizonte.z)).toBe(3);
    expect(ARRIVALS.horizonte.mar).toBe(3);
    expect(seaOf(ARRIVALS.horizonte.z)).toBe(3);
    expect(ARRIVALS.abismo.mar).toBe(2);
    expect(crossingUnlocked({}, GATES.abismo)).toBe(false);
    expect(crossingUnlocked({ bosses: { 'fenda-celeste-chefe': 1 } }, GATES.abismo)).toBe(false);
    expect(crossingUnlocked({ bosses: { 'masmorra-abismo-chefe': 1 } }, GATES.abismo)).toBe(true);
    expect(crossingUnlocked({}, GATES.horizonte)).toBe(true);
    expect(crossingUnlocked({}, GATES.sul)).toBe(true);
  });
});

describe('Geleira Silente: nevasca e fogueiras', () => {
  it('a nevasca vem em ciclo, com aviso antes', () => {
    const start = BLIZZARD.cycle - BLIZZARD.duration;
    expect(blizzardPhase(1).on).toBe(false);
    expect(blizzardPhase(start - 1).warn).toBe(true);
    expect(blizzardPhase(start + 1).on).toBe(true);
    expect(blizzardPhase(BLIZZARD.cycle + 1).on).toBe(false);
  });

  it('o frio sobe na nevasca, cai na fogueira; geada com imunidade não sente', () => {
    let c = 0;
    for (let i = 0; i < 20 * 10; i++) c = stepCold(c, 0.1, { on: true, nearFire: false, immune: false });
    expect(frozen(c)).toBe(true);
    for (let i = 0; i < 40; i++) c = stepCold(c, 0.1, { on: true, nearFire: true, immune: false });
    expect(c).toBe(0);
    expect(stepCold(50, 1, { on: true, nearFire: false, immune: true })).toBe(0);
    expect(envImmune('geada', THRESHOLDS.immunity, 'frio')).toBe(true);
    expect(envImmune('geada', THRESHOLDS.immunity - 1, 'frio')).toBe(false);
    expect(envImmune('brasa', THRESHOLDS.immunity, 'frio')).toBe(false);
    expect(envImmune('brasa', THRESHOLDS.immunity, 'lava')).toBe(true);
  });
});

describe('Ruínas do Sol Poente: quebra-cabeça de luz', () => {
  it('começa sem nenhum espelho certo e só gira o que a luz alcança', () => {
    const p = newLightPuzzle(139);
    expect(litCount(p)).toBe(0);
    expect(rotateMirror(p, 2)).toBe(false); // sem luz chegando
    expect(rotateMirror(p, 0)).toBe(true);
  });

  it('girando no máximo 3 vezes cada espelho, em ordem, resolve', () => {
    for (const seed of [1, 7, 139, 999]) {
      const p = newLightPuzzle(seed);
      let turns = 0;
      for (let i = 0; i < MIRRORS; i++) {
        while (litCount(p) <= i) {
          rotateMirror(p, i);
          turns++;
        }
      }
      expect(p.solved).toBe(true);
      expect(turns).toBeLessThanOrEqual(3 * MIRRORS);
      expect(rotateMirror(p, 0)).toBe(false); // resolvido fica resolvido
    }
  });
});

describe('Bosque Noturno: ecos ilusórios', () => {
  it('com Percepção desfaz e rende XP com limite; sem ela engana', () => {
    expect(hitEcho(false, 0)).toMatchObject({ kind: 'engano', xp: 0 });
    expect(hitEcho(true, 0).xp).toBe(ECHOES.xp);
    expect(hitEcho(true, ECHOES.sessionCap).xp).toBe(0);
  });
});

describe('Bastião Vulcânico: erupções', () => {
  it('erupção programada com aviso e rochas marcadas antes de cair', () => {
    const start = ERUPTION.cycle - ERUPTION.duration;
    expect(eruptionPhase(start - 1).warn).toBe(true);
    expect(eruptionPhase(start + 1).on).toBe(true);
    let s = 1;
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const rocks = eruptionTargets(rand);
    expect(rocks.length).toBe(ERUPTION.rocks);
    for (const r of rocks) {
      const d = Math.hypot(r.x, r.z);
      expect(d).toBeGreaterThanOrEqual(ERUPTION.spread[0]);
      expect(d).toBeLessThanOrEqual(ERUPTION.spread[1]);
      expect(r.at + ERUPTION.telegraph).toBeLessThanOrEqual(ERUPTION.duration); // cai dentro da erupção
    }
    // as rochas caem em terra da ilha
    const def = byId('bastiao-vulcanico');
    const h = seaHeight(def);
    for (const r of rocks) expect(h(r.x, r.z)).toBeGreaterThan(1);
  });
});

describe('Masmorra do Abismo: andares, chaves e espinhos', () => {
  const def = byId('masmorra-abismo');
  const spots = seaSpots(def);
  const lay = spots.dungeon;

  it('portas em lados alternados, chaves uma por andar, em ordem', () => {
    expect(lay.doors.length).toBe(DUNGEON.rings.length);
    for (let k = 1; k < lay.doors.length; k++) expect(lay.doors[k].side).not.toBe(lay.doors[k - 1].side);
    const st = { keys: 0 };
    expect(doorOpen(0, 0)).toBe(true);
    expect(doorOpen(1, 0)).toBe(false);
    expect(takeKey(st, 1)).toBe(false); // fora de ordem
    expect(takeKey(st, 0)).toBe(true);
    expect(doorOpen(1, st.keys)).toBe(true);
    expect(doorOpen(2, st.keys)).toBe(false);
    expect(takeKey(st, 1) && takeKey(st, 2)).toBe(true);
    expect(doorOpen(3, st.keys)).toBe(true);
    expect(takeKey(st, 3)).toBe(false);
  });

  it('a entrada olha para a praia; chefe no meio; guardas e altares dentro dos andares', () => {
    const l = spots.landing;
    const d0 = lay.doors[0];
    expect(Math.hypot(d0.x - l.x, d0.z - l.z)).toBeLessThan(Math.hypot(-d0.x - l.x, -d0.z - l.z));
    expect(spots.boss).toEqual({ x: 0, z: 0 });
    const rings = DUNGEON.rings;
    const inRing = (p) => Math.max(Math.abs(p.x), Math.abs(p.z));
    for (const g of spots.enemies) expect(inRing(g)).toBeLessThan(rings[0] - 1);
    lay.altars.forEach((a, k) => {
      expect(inRing(a)).toBeLessThan(rings[k] - 1);
      expect(inRing(a)).toBeGreaterThan(rings[k + 1] + 1);
    });
    for (const s of lay.spikes) expect(inRing(s)).toBeLessThan(rings[0]);
  });

  it('espinhos sobem, avisam antes e descem', () => {
    const { period, up, warn } = DUNGEON.spikes;
    expect(spikeState(0)).toBe('cima');
    expect(spikeState(up + 0.1)).toBe('baixo');
    expect(spikeState(period - warn / 2)).toBe('aviso');
    expect(spikeState(-0.1)).toBe('aviso');
  });

  it('o layout depende só da praia (mesmo resultado no construtor e nas posições)', () => {
    expect(dungeonLayout(spots.landing)).toEqual(lay);
  });
});

describe('salvo', () => {
  it('espelhos resolvidos, baú e chaves persistem; valores inválidos viram padrão', () => {
    const s = migrate({ ...newSave(), islands: { ruinas: { solved: true, chest: true }, masmorra: { keys: 2 } }, seas: { segundo: true, terceiro: true } });
    expect(s.islands).toEqual({ ruinas: { solved: true, chest: true }, masmorra: { keys: 2 } });
    expect(s.seas.terceiro).toBe(true);
    expect(normalizeIslands({ masmorra: { keys: 99 } }).masmorra.keys).toBe(DUNGEON.keys.length);
    expect(normalizeIslands('x')).toEqual({ ruinas: { solved: false, chest: false }, masmorra: { keys: 0 } });
  });
});
