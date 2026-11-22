// Testes de aceitação do M1 (atualização 20; Prompt Mestre, seção 18, testes 1 a 5 e 7).
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import catalog from '../data/fruto-catalog.json';
import { M1, M1_IDS, M1_BASE, M1_RULES, FRUITS, CATALOG, HYBRID, FPS, m1Of, sheet } from '../src/combat/m1Catalog.js';
import { fruitStyle, AttackRunner, timing } from '../src/combat/rules.js';
import { PlayerCombat } from '../src/combat/playerCombat.js';
import { FRUTOMotion } from '../src/animation/fruto-motion.js';
import { powersOf, SHAPE_IDS } from '../src/fruits/powers.js';

const fruit = (id) => catalog.fruits.find((f) => f.id === id);
const FRAME = 1 / 60;

// roda o M1 e devolve os golpes no quadro de impacto (id, tempo)
function drive(runner, seconds, dt, onFrame = () => {}, canStart = () => true) {
  const strikes = [];
  let t = 0;
  for (let i = 0; i < Math.round(seconds / dt); i++) {
    onFrame(t, runner);
    const s = runner.update(dt, canStart(t));
    if (s) strikes.push({ id: s.id, step: s.step, t });
    t += dt;
  }
  return strikes;
}
// clica uma vez em cada janela permitida (últimos 8 quadros) ou logo que estiver livre
const tapWhenAllowed = (t, r) => {
  const c = r.current;
  if (!c || c.tm.duration - c.t <= M1_RULES.bufferFrames / FPS) r.press();
};

describe('teste 1: exatamente 16 frutas', () => {
  it('o registro tem as 16 frutas oficiais, sem extras', () => {
    const ids = catalog.fruits.map((f) => f.id);
    expect(ids.length).toBe(16);
    expect([...ids].sort()).toEqual([...FRUITS].sort());
    expect(Object.keys(CATALOG).sort()).toEqual([...FRUITS].sort());
    expect(SHAPE_IDS.length).toBe(16);
  });
});

describe('teste 2: 4 M1 por fruta, 64 IDs exclusivos', () => {
  it('64 fichas, nomes do catálogo, IDs únicos', () => {
    expect(M1_IDS.length).toBe(64);
    expect(new Set(M1_IDS).size).toBe(64);
    for (const f of FRUITS) {
      const recs = m1Of(f);
      expect(recs.map((r) => r.passo)).toEqual([1, 2, 3, 4]);
      expect(recs.map((r) => r.nome)).toEqual(CATALOG[f].golpes.map((g) => g[0]));
    }
    expect(M1.impacto_m1_1.nome).toBe('Jab de Pressão');
    expect(M1.ocidental_m1_4.nome).toBe('Esmagamento Dracônico');
    expect(M1.lobo_m1_3.nome).toBe('Mordida Predatória');
  });

  it('cada ficha tem quadros, impacto, fases, hitbox, efeito, som e poses por articulação', () => {
    for (const id of M1_IDS) {
      const r = sheet(id);
      expect(r.quadros).toBeGreaterThanOrEqual(M1_BASE.frames[r.passo - 1] - 1);
      expect(r.impacto).toBeGreaterThan(r.fases.preparacao[1]);
      expect(r.impacto).toBeLessThan(r.quadros);
      expect(r.fases.colisao[0]).toBe(r.impacto);
      expect(r.fases.recuperacao[1]).toBe(r.quadros);
      expect(r.keyframes.length).toBe(6);
      expect(r.keyframes[0].quadro).toBe(0);
      expect(r.keyframes.at(-1).quadro).toBe(r.quadros);
      const contact = r.keyframes.find((k) => k.pose === 'contato');
      expect(contact.quadro).toBe(r.impacto);
      for (const k of r.keyframes) {
        for (const j of ['quadril', 'tronco', 'cabeca', 'ombro_E', 'braco_E', 'ombro_D', 'braco_D', 'pernas']) expect(k.articulacoes[j]).toBeTruthy();
        for (const v of Object.values(k.articulacoes.braco_E)) expect(Number.isFinite(v)).toBe(true);
      }
      expect(r.vfx).toBeTruthy();
      expect(r.sfx).toBeTruthy();
      expect(r.hitbox.alcance).toBeGreaterThan(1);
      expect(r.janelaProximo[1] - r.janelaProximo[0]).toBe(M1_RULES.bufferFrames);
      expect(r._poses).toBeUndefined(); // a ficha pública não leva campos internos
    }
  });

  it('dano escalonado 0,85/0,95/1,05/1,25 e hitstop crescente; M1-4 é o finalizador básico', () => {
    for (const f of FRUITS) {
      const st = fruitStyle(fruit(f));
      const dmg = st.combo.map((id) => st.attacks[id].damage);
      for (let i = 1; i < 4; i++) expect(dmg[i]).toBeGreaterThanOrEqual(dmg[i - 1]);
      expect(dmg[3]).toBeGreaterThan(dmg[0]);
      const hs = m1Of(f).map((r) => r.hitstop);
      expect(hs[0]).toBeLessThan(hs[3]);
      expect(st.attacks[st.combo[3]].heavy).toBe(true);
    }
    expect(M1_BASE.damage).toEqual([0.85, 0.95, 1.05, 1.25]);
    expect(m1Of('tormenta').map((r) => r.hitstop)).toEqual([3, 4, 5, 7]);
  });

  it('os 64 clipes (e as variantes híbridas das frutas de fera) existem na animação', () => {
    let hybrids = 0;
    for (const id of M1_IDS) {
      const r = M1[id];
      const c = FRUTOMotion.clips[id];
      expect(c).toBeTruthy();
      expect(c.release).toBeCloseTo(r.impacto / 60);
      expect(c.duration).toBeCloseTo(r.quadros / 60);
      // a pose de contato cai exatamente no quadro de impacto
      expect(c.keys.find(([, n]) => n.endsWith(':contato'))[0]).toBeCloseTo(c.release);
      for (const [, n] of c.keys) expect(FRUTOMotion.poses[n]).toBeTruthy();
      if (HYBRID[r.fruta]) {
        const h = FRUTOMotion.clips[`${id}_h`];
        expect(h.release).toBeCloseTo(c.release);
        expect(h.keys.map(([, n]) => n)).not.toEqual(c.keys.map(([, n]) => n));
        hybrids++;
      }
    }
    expect(hybrids).toBe(24);
    // golpes de perna guiam o tornozelo
    expect(FRUTOMotion.clips.brasa_m1_3.kick.side).toBe('D');
    expect(FRUTOMotion.clips.geada_m1_3.kick).toBeTruthy();
    expect(FRUTOMotion.clips.impacto_m1_1.kick).toBeUndefined();
  });
});

describe('teste 3: um golpe por clique, buffer e reset', () => {
  const st = () => fruitStyle(fruit('impacto'));

  it('um clique = um golpe; nada de quatro de uma vez', () => {
    const r = new AttackRunner(st());
    r.press();
    const s = drive(r, 3, FRAME);
    expect(s.map((x) => x.id)).toEqual(['impacto_m1_1']);
  });

  it('cliques cedo demais são ignorados; o clique nos últimos 8 quadros fica guardado', () => {
    const r = new AttackRunner(st());
    r.press();
    r.update(FRAME);
    expect(r.press()).toBe(false); // no começo do golpe: ignorado
    expect(r.press()).toBe(false);
    // avança até faltar 8 quadros
    const tm = timing('impacto_m1_1', r.attacks);
    const ids = [];
    while (tm.duration - r.current.t > M1_RULES.bufferFrames / FPS + 1e-6) {
      const st1 = r.update(FRAME);
      if (st1) ids.push(st1.id);
    }
    expect(r.press()).toBe(true);
    expect(r.press()).toBe(false); // sem clique duplicado
    ids.push(...drive(r, 3, FRAME).map((x) => x.id));
    expect(ids).toEqual(['impacto_m1_1', 'impacto_m1_2']);
  });

  it('o clique guardado expira em 0,35 s se não puder executar', () => {
    const r = new AttackRunner(st());
    r.press();
    let s = drive(r, 0.36, FRAME, () => {}, () => false);
    expect(s.length).toBe(0);
    s = drive(r, 0.2, FRAME, () => {}, () => true);
    expect(s.length).toBe(0); // expirou antes de poder atacar
    const r2 = new AttackRunner(st());
    r2.press();
    drive(r2, 0.2, FRAME, () => {}, () => false);
    expect(drive(r2, 1, FRAME).length).toBe(1); // dentro do prazo: executa
  });

  it('clicando no ritmo: M1-1 → M1-2 → M1-3 → M1-4 → M1-1, sem sobreposição', () => {
    const r = new AttackRunner(st());
    let overlap = false;
    const s = drive(r, 4, FRAME, (t, rr) => {
      tapWhenAllowed(t, rr);
    });
    expect(s.slice(0, 5).map((x) => x.step)).toEqual([0, 1, 2, 3, 0]);
    // golpes não se sobrepõem: cada impacto vem depois do fim do golpe anterior
    const recs = m1Of('impacto');
    for (let i = 1; i < 4; i++) {
      const gap = s[i].t - s[i - 1].t;
      const min = (recs[i - 1].quadros - recs[i - 1].impacto + recs[i].impacto) / 60 - 2 * FRAME;
      if (gap < min) overlap = true;
    }
    expect(overlap).toBe(false);
    expect(r.clicks).toBe(s.length + (r.current && !r.current.struck ? 1 : 0) + (r.buffer > 0 ? 1 : 0));
  });

  it('janela de continuação de 0,65 s depois da recuperação', () => {
    const go = (wait) => {
      const r = new AttackRunner(st());
      r.press();
      drive(r, timing('impacto_m1_1', r.attacks).duration + 0.001, FRAME); // M1-1 até o fim
      drive(r, wait, FRAME);
      r.press();
      return drive(r, 1, FRAME)[0].step;
    };
    expect(go(0.6)).toBe(1); // dentro da janela: M1-2
    expect(go(0.7)).toBe(0); // passou: volta ao M1-1
  });

  it('segurar o botão não repete (um aperto só entra uma vez no buffer)', () => {
    const r = new AttackRunner(st());
    for (let i = 0; i < 10; i++) r.press(); // o mesmo quadro de "segurar"
    expect(drive(r, 3, FRAME).length).toBe(1);
  });
});

describe('teste 4: cancelamentos, atordoamento, morte e troca de fruta', () => {
  function rig() {
    const ctl = {
      pos: new THREE.Vector3(), yaw: 0, state: 'ground', busyT: 0, stunned: 0, faint: 0, dash: null, attackLock: 0, action: null,
      shove() {}, damage() {},
    };
    const combat = new PlayerCombat({ ctl, stats: () => ({ melee: 1, weapon: 1, defense: 0, mitigation: 0, armor: 1 }) });
    combat.runner.setStyle(fruitStyle(fruit('lobo')));
    const input = (attack = false) => ({ attackPressed: attack, dashPressed: false, block: false, moveX: 0, moveY: 0, camYaw: 0 });
    // M1-1 inteiro e começo do M1-2
    const toStep2 = () => {
      combat.update(FRAME, input(true), []);
      for (let i = 0; i < 40; i++) combat.update(FRAME, input(), []);
      combat.update(FRAME, input(true), []);
      combat.update(FRAME, input(), []);
    };
    return { ctl, combat, input, toStep2 };
  }

  it('atordoado: a sequência volta ao M1-1', () => {
    const { ctl, combat, input, toStep2 } = rig();
    toStep2();
    expect(combat.runner.current.step).toBe(1);
    ctl.stunned = 0.5;
    combat.update(FRAME, input(), []);
    expect(combat.runner.busy).toBe(false);
    expect(combat.runner.nextStep).toBe(0);
  });

  it('desmaio (morte): reset', () => {
    const { ctl, combat, input, toStep2 } = rig();
    toStep2();
    ctl.faint = 3;
    combat.update(FRAME, input(), []);
    expect(combat.runner.busy).toBe(false);
    expect(combat.runner.nextStep).toBe(0);
  });

  it('troca de fruta: reset e combo da nova fruta', () => {
    const { combat, toStep2 } = rig();
    toStep2();
    combat.runner.setStyle(fruitStyle(fruit('geada')));
    expect(combat.runner.busy).toBe(false);
    expect(combat.runner.nextStep).toBe(0);
    expect(combat.runner.combo[0]).toBe('geada_m1_1');
  });

  it('esquiva só cancela depois da janela de colisão; forma híbrida usa a variante', () => {
    const { ctl, combat, input } = rig();
    combat.formShape = () => 'hibrida';
    combat.update(FRAME, input(true), []);
    expect(ctl.action.clip).toBe('lobo_m1_1_h');
    combat.formShape = () => 'completa';
    combat.update(FRAME, input(), []);
    expect(ctl.action.clip).toBe('lobo_m1_1_c');
    combat.formShape = () => 'hibrida';
    const blocked = { ...input(), dashPressed: true };
    combat.update(FRAME, blocked, []);
    expect(blocked.dashPressed).toBe(false); // antes do impacto o golpe vai até o fim
  });
});

describe('teste 5: impacto sincronizado em 30 e 60 FPS', () => {
  it('o impacto sai uma vez, no primeiro quadro depois do quadro de impacto, nos dois ritmos', () => {
    for (const f of FRUITS) {
      const st = fruitStyle(fruit(f));
      for (const dt of [1 / 60, 1 / 30]) {
        const r = new AttackRunner(st);
        let at = null;
        let count = 0;
        r.press();
        let t = 0;
        for (let i = 0; i < 2 / dt; i++) {
          const s = r.update(dt);
          t += dt;
          if (s) {
            count++;
            at = r.current.t; // tempo do golpe no quadro em que o impacto saiu
          }
        }
        expect(count).toBe(1);
        const rel = timing(st.combo[0], st.attacks).release;
        expect(at).toBeGreaterThanOrEqual(rel - 1e-9);
        expect(at - rel).toBeLessThan(dt + 1e-9);
      }
    }
  });

  it('o alvo só é atingido no impacto (hitbox ativa naquele quadro)', () => {
    const ctl = { pos: new THREE.Vector3(), yaw: 0, state: 'ground', busyT: 0, stunned: 0, faint: 0, attackLock: 0, action: null, shove() {} };
    const events = [];
    const combat = new PlayerCombat({ ctl, stats: () => ({ melee: 1, weapon: 1, armor: 1 }), onEvent: (n, d) => events.push([n, d]) });
    combat.runner.setStyle(fruitStyle(fruit('cristal')));
    const target = { id: 'alvo', pos: new THREE.Vector3(0, 0, 2.5), alive: true, radius: 0.8, hits: [], receiveHit(h) { this.hits.push(h); return { result: 'hit', damage: h.damage }; } };
    const inp = (a) => ({ attackPressed: a, dashPressed: false, block: false, moveX: 0, moveY: 0, camYaw: 0 });
    combat.update(FRAME, inp(true), [target]);
    const rel = combat.runner.current.tm.release;
    let t = FRAME;
    while (t < rel - FRAME) {
      combat.update(FRAME, inp(false), [target]);
      t += FRAME;
      expect(target.hits.length).toBe(0);
    }
    for (let i = 0; i < 40; i++) combat.update(FRAME, inp(false), [target]);
    expect(target.hits.length).toBe(1);
    expect(events.filter(([n]) => n === 'impact').length).toBe(1); // efeito e som: uma vez
    expect(events.find(([n]) => n === 'impact')[1].landed).toBe(1);
  });

  it('gancho e chifrada levantam um pouco; atração puxa', () => {
    const fx = (id) => fruitStyle(fruit(id.split('_')[0])).attacks[id].effect;
    expect(fx('impacto_m1_3').hop).toBeGreaterThan(0);
    expect(fx('besta_m1_3').hop).toBeGreaterThan(0);
    expect(fx('ima_m1_2').pullIn).toBe(true);
  });
});

describe('teste 7: habilidades especiais e controles preservados', () => {
  it('as 3 habilidades de cada fruta continuam com os próprios clipes, separadas do M1', () => {
    for (const f of catalog.fruits) {
      const ps = powersOf(f);
      expect(ps.length).toBe(3);
      for (const p of ps) {
        expect(FRUTOMotion.clips[p.clip]).toBeTruthy();
        expect(M1_IDS).not.toContain(p.clip);
      }
    }
    // os clipes antigos do laboratório continuam lá (inimigos e técnicas os usam)
    for (const id of ['impacto_j1', 'brasa_j3', 'jab', 'direto', 'gancho', 'impacto0', 'besta_j1']) expect(FRUTOMotion.clips[id]).toBeTruthy();
  });

  it('sem fruta, o Combate Básico continua com Jab → Direto → Gancho', () => {
    expect(fruitStyle(null).combo).toEqual(['jab', 'direto', 'gancho']);
    const r = new AttackRunner(fruitStyle(null));
    const s = drive(r, 3, FRAME, tapWhenAllowed);
    expect(s.slice(0, 4).map((x) => x.id)).toEqual(['jab', 'direto', 'gancho', 'jab']);
  });
});
