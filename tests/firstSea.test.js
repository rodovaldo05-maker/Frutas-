import { describe, it, expect } from 'vitest';
import { SEA, PORTO_CAMP, seaHeight, seaSpots, levelsFor } from '../src/islands/firstSea.js';
import { scaledDef, bossDef, RECRUTA } from '../src/combat/enemies.js';
import { ISLAND } from '../src/islands/trainingIsland.js';
import { VILLAGE, villageHeight } from '../src/islands/villageIsland.js';

// caixa ocupada por cada ilha no mundo (o campo de altura vai até R + 32)
const box = (x, z, half) => ({ x0: x - half, x1: x + half, z0: z - half, z1: z + half });
const overlap = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1;

describe('Primeiro Mar: mapa', () => {
  it('nove ilhas com nomes e faixas seguidas de 25 a 700', () => {
    expect(SEA).toHaveLength(9);
    expect(new Set(SEA.map((d) => d.id)).size).toBe(9);
    expect(SEA[0].faixa[0]).toBe(25);
    expect(SEA.at(-1).faixa[1]).toBe(700);
    for (let i = 1; i < SEA.length; i++) expect(SEA[i].faixa[0]).toBe(SEA[i - 1].faixa[1]);
  });

  it('as ilhas não se sobrepõem nem encostam na Ilha de Treino ou no Porto das Origens', () => {
    const boxes = SEA.map((d) => box(d.x, d.z, d.R + 32));
    const home = [box(0, 0, ISLAND.half), box(VILLAGE.offset.x, VILLAGE.offset.z, VILLAGE.half)];
    for (let i = 0; i < boxes.length; i++) {
      for (const h of home) expect(overlap(boxes[i], h)).toBe(false);
      for (let j = i + 1; j < boxes.length; j++) expect(overlap(boxes[i], boxes[j])).toBe(false);
    }
  });
});

describe('Primeiro Mar: relevo e lugares', () => {
  it('acampamento, inimigos, chefe e praia de chegada ficam em terra', () => {
    for (const d of SEA) {
      const h = seaHeight(d);
      const s = seaSpots(d);
      for (const p of [s.camp, s.boss, ...s.enemies]) expect(h(p.x, p.z), `${d.id} ${p.x},${p.z}`).toBeGreaterThan(1.4);
      expect(h(s.landing.x, s.landing.z), `${d.id} chegada`).toBeGreaterThan(0.6);
    }
  });

  it('a borda é íngreme: fundo logo depois da praia (o bote encosta perto)', () => {
    for (const d of SEA) {
      const h = seaHeight(d);
      const s = seaSpots(d);
      const a = Math.atan2(s.landing.z, s.landing.x);
      // anda da praia para o mar até achar água e mede a queda em 12 unidades
      let r = Math.hypot(s.landing.x, s.landing.z);
      while (h(Math.cos(a) * r, Math.sin(a) * r) > 0 && r < d.R * 2) r += 0.5;
      expect(r).toBeLessThan(d.R * 1.4);
      expect(h(Math.cos(a) * (r + 12), Math.sin(a) * (r + 12))).toBeLessThan(-6);
    }
  });

  it('as bordas do campo são mar aberto', () => {
    for (const d of SEA) {
      const h = seaHeight(d);
      const e = d.R + 30;
      for (const [x, z] of [[e, 0], [-e, 0], [0, e], [0, -e], [e, e]]) expect(h(x, z)).toBeLessThan(-8);
    }
  });

  it('a Caldeira Rubra tem cratera e o Pico Gélido um pico alto', () => {
    const vulcao = seaHeight(SEA.find((d) => d.biome === 'vulcao'));
    expect(vulcao(9, 0)).toBeGreaterThan(vulcao(0, 0));
    const neve = seaHeight(SEA.find((d) => d.biome === 'neve'));
    expect(neve(0, 0)).toBeGreaterThan(25);
  });

  it('o acampamento do Porto das Origens fica em terra', () => {
    for (const [x, z] of Object.values(PORTO_CAMP.local)) expect(villageHeight(x, z)).toBeGreaterThan(1.5);
  });
});

describe('inimigos por nível', () => {
  it('os níveis do acampamento ficam dentro da faixa da ilha e crescem', () => {
    for (const d of SEA) {
      const lv = levelsFor(d);
      expect(lv).toHaveLength(4);
      for (let k = 0; k < 4; k++) {
        expect(lv[k]).toBeGreaterThanOrEqual(d.faixa[0]);
        expect(lv[k]).toBeLessThanOrEqual(d.faixa[1]);
        if (k) expect(lv[k]).toBeGreaterThan(lv[k - 1]);
      }
    }
  });

  it('vida, dano, defesa, experiência e moedas crescem com o nível', () => {
    let prev = null;
    for (const L of [1, 25, 75, 150, 300, 500, 700]) {
      const d = scaledDef(RECRUTA, L);
      expect(d.level).toBe(L);
      if (prev) for (const k of ['hp', 'damageMult', 'xp', 'coins']) expect(d[k]).toBeGreaterThan(prev[k]);
      if (prev) expect(d.defense).toBeGreaterThanOrEqual(prev.defense);
      prev = d;
    }
    expect(scaledDef(RECRUTA, 9999).defense).toBe(40);
  });

  it('o chefe vale dez inimigos e bate mais forte', () => {
    const base = SEA[0].boss;
    const foe = scaledDef(SEA[0].enemy, 60);
    const boss = bossDef(base, 60);
    expect(boss.boss).toBe(true);
    expect(boss.hp).toBe(foe.hp * 10);
    expect(boss.xp).toBe(foe.xp * 10);
    expect(boss.coins).toBe(foe.coins * 10);
    expect(boss.damageMult).toBeCloseTo(foe.damageMult * 1.4);
    expect(boss.scale).toBeGreaterThan(1);
    expect(boss.special.radius).toBeCloseTo(base.special.radius * 1.4);
    // o golpe marcado da base não é alterado
    expect(base.special.radius).toBe(3.4);
    // chefe sem golpe próprio ganha o golpe padrão
    expect(bossDef(PORTO_CAMP.enemy, 10).special.nome).toBe('Golpe do Chefe');
  });
});
