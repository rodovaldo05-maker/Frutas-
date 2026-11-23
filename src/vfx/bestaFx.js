// Efeitos das habilidades da Besta (versão 0.27.5): bem mais fortes e detalhados, em marfim e
// carmesim, com poeira, pedras, rachaduras e choque de massa. Usa os efeitos do laboratório
// (fx: fendas, garras, pulsos, faíscas) e os do jogo (glow: colunas, cones, anéis, explosões
// de partículas). Só visual: quem é atingido e o dano continuam no sistema de poderes.

import * as THREE from 'three';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const C = {
  crimson: '#ff3348', blood: '#d91b34', dark: '#822a3e', ivory: '#fff1dc', core: '#ffd4c4',
  edge: '#ff6b72', dust: '#b89a78', earth: '#7a5a3e', white: '#ffffff',
};

export class BestaFx {
  // lab: LabFx (later, floor, myth, fx, glow, shake)
  constructor(lab) {
    this.lab = lab;
  }

  get fx() {
    return this.lab.fx;
  }

  get glow() {
    return this.lab.glow;
  }

  later(t, fn) {
    this.lab.later(t, fn);
  }

  floor(p, off) {
    return this.lab.floor(p, off);
  }

  // tremor de câmera (o jogo multiplica por 3; aqui o valor já é o tremor final)
  shake(a) {
    this.lab.shake?.(a / 3);
  }

  // ===== preparação (durante o gesto, antes do golpe) =====
  cast(slot, pos, dir) {
    const g = this.floor(pos);
    const d = V(dir.x, 0, dir.z).normalize();
    const head = g.clone().add(V(0, 2.3, 0)).addScaledVector(d, 0.3);
    const glow = this.glow;
    if (slot === 0) {
      // chifres carregando: brilho carmesim na cabeça e fagulhas sugadas para os chifres
      glow?.flash(head, C.crimson, 1.6, 0.3);
      this.fx.sparks(head, C.edge, 12, 2.2, { gravity: -0.4, life: 0.35, size: 0.05, stretch: 2 });
      glow?.ring(g, C.blood, 1.4, 0.35);
    } else if (slot === 1) {
      // inspiração do rugido: correntes de ar e brasas puxadas para a boca
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const from = head.clone().add(V(Math.cos(a) * 2.6, -0.6 + (i % 3) * 0.6, Math.sin(a) * 2.6));
        glow?.line(from, head, i % 2 ? C.edge : C.core, { count: 6, speed: 0.4, up: 0.2, size: 0.16, life: 0.32, gravity: 0 });
      }
      glow?.flash(head, C.blood, 1.2, 0.35);
    } else {
      // pisão: o chão já começa a tremer e a energia sobe pelas pernas
      this.fx.groundMark(g, C.blood, 5, 0.5);
      glow?.ring(g, C.crimson, 2.2, 0.45);
      for (let i = 0; i < 6; i++) this.later(i * 0.05, () => glow?.spark(g.clone().add(V(Math.cos(i) * 0.8, 0.2, Math.sin(i) * 0.8)), i % 2 ? C.crimson : C.ivory, { count: 3, speed: 1.2, up: 5, size: 0.22, life: 0.45, gravity: -2 }));
      this.shake(0.06);
    }
  }

  // ===== Presa de Marfim: chifrada que rasga para cima =====
  presa(f, p, pos, dir) {
    const q = p.params;
    const g = this.floor(pos);
    const d = V(dir.x, 0, dir.z).normalize();
    const side = V(d.z, 0, -d.x);
    const range = q.range ?? 5;
    const front = g.clone().addScaledVector(d, range * 0.55);
    const glow = this.glow;
    const fx = this.fx;
    // marca mítica (chifres gêmeos) grande, na altura dos chifres
    this.lab.myth(f, 'skill', g.clone().add(V(0, 1.2, 0)).addScaledVector(d, 0.8), d, 0);
    // dois rasgos cruzados de baixo para cima, marfim por cima e carmesim por baixo
    for (const s of [-1, 1]) {
      const a = g.clone().add(V(0, 0.3, 0)).addScaledVector(d, 0.6).addScaledVector(side, s * 0.9);
      const b = g.clone().add(V(0, 3.1, 0)).addScaledVector(d, range * 0.75).addScaledVector(side, -s * 0.5);
      fx.talons(a, b, s, true);
      this.later(0.06, () => fx.talons(a.clone().add(V(0, 0.25, 0)), b.clone().add(V(0, 0.4, 0)), -s, false));
    }
    // faixa e rachaduras pelo chão na direção da investida
    glow?.lane(g, d, range, 1.1, C.blood, 0.5);
    for (let k = 1; k <= 3; k++) this.later(k * 0.03, () => fx.cracks(this.floor(g.clone().addScaledVector(d, (range * k) / 3.2)), C.edge, 0.9 + k * 0.25, 0.9));
    // onda de choque em cone pelo chão e coluna de chifrada (o que joga o alvo para cima)
    glow?.cone(g, Math.atan2(d.x, d.z), C.blood, range * 1.1, 55, 0.4);
    glow?.pillar(front, C.blood, 1.9, 7.5, 0.65);
    glow?.pillar(front, C.crimson, 1.2, 6.5, 0.55);
    this.later(0.05, () => glow?.pillar(front, C.ivory, 0.6, 8, 0.5));
    glow?.burst(front.clone().add(V(0, 1.5, 0)), C.crimson, { count: 18, speed: 6, up: 7, size: 0.3, life: 0.6, gravity: -6 });
    glow?.flash(front.clone().add(V(0, 1.2, 0)), C.white, 3.4, 0.22);
    glow?.flash(front.clone().add(V(0, 1.4, 0)), C.crimson, 5, 0.35);
    // terra e pedras arrancadas, faíscas de marfim
    glow?.burst(front, C.dust, { count: 26, speed: 5, up: 9, size: 0.32, life: 0.9, gravity: -16, spread: 1.3 });
    glow?.burst(front, C.earth, { count: 12, speed: 3.5, up: 11, size: 0.45, life: 1.0, gravity: -18 });
    fx.sparks(front.clone().add(V(0, 1.4, 0)), C.ivory, 22, 5.5, { gravity: 3, life: 0.5, size: 0.06, stretch: 3 });
    glow?.ring(front, C.edge, 2.6, 0.45);
    this.later(0.12, () => glow?.ring(front, C.ivory, 3.6, 0.5));
    this.shake(0.28);
  }

  // ===== Rugido Carmesim: onda de som em cone que empurra =====
  rugido(f, p, pos, dir) {
    const q = p.params;
    const g = this.floor(pos);
    const d = V(dir.x, 0, dir.z).normalize();
    const yaw = Math.atan2(d.x, d.z);
    const range = q.range ?? 8;
    const angle = q.angle ?? 80;
    const head = g.clone().add(V(0, 2.2, 0)).addScaledVector(d, 0.6);
    const glow = this.glow;
    const fx = this.fx;
    this.lab.myth(f, 'skill', g.clone().add(V(0, 0.6, 0)).addScaledVector(d, 0.6), d, 3);
    // clarão na boca
    glow?.flash(head, C.white, 2.8, 0.2);
    glow?.flash(head, C.crimson, 4.4, 0.4);
    // cone do rugido em camadas (carmesim, depois marfim um pouco maior)
    glow?.cone(g, yaw, C.blood, range, angle, 0.5);
    this.later(0.08, () => glow?.cone(g, yaw, C.ivory, range * 1.08, angle * 0.9, 0.38));
    this.later(0.16, () => glow?.cone(g, yaw, C.crimson, range * 1.15, angle, 0.32));
    // anéis de som em pé, saindo da boca e crescendo
    for (let i = 0; i < 6; i++) {
      this.later(i * 0.06, () => {
        const at = head.clone().addScaledVector(d, 0.9 + i * 1.25).add(V(0, -0.15 * i, 0));
        fx.pulse(at, i % 2 ? C.ivory : C.crimson, 0.7 + i * 0.55, 0.42, true);
      });
    }
    // poeira e capim varridos pelo vento do rugido, rachaduras em leque
    const half = (angle * Math.PI) / 360;
    for (let i = 0; i < 7; i++) {
      const a = yaw - half + (i / 6) * half * 2;
      const at = this.floor(g.clone().add(V(Math.sin(a) * range * 0.7, 0, Math.cos(a) * range * 0.7)));
      this.later(0.05 + i * 0.02, () => glow?.burst(at, C.dust, { count: 6, speed: 7, up: 2, size: 0.3, life: 0.7, gravity: -6, spread: 0.6 }));
      if (i % 2 === 0) this.later(0.04, () => fx.cracks(at, C.edge, 1.1, 0.8));
    }
    fx.sparks(head, C.edge, 26, 6.5, { gravity: 0.5, life: 0.45, size: 0.05, stretch: 3.2 });
    // tremor que dura o rugido
    this.shake(0.3);
    this.later(0.2, () => this.shake(0.18));
    this.later(0.4, () => this.shake(0.12));
  }

  // ===== Pisão da Besta: o chão se rompe e joga tudo para cima =====
  pisao(f, p, pos, dir) {
    const r = p.params.radius ?? 5;
    const g = this.floor(pos);
    const d = V(dir.x, 0, dir.z).normalize();
    const glow = this.glow;
    const fx = this.fx;
    this.lab.myth(f, 'skill', g.clone().add(V(0, 0.1, 0)), d, 4);
    // clarão e coluna de energia no centro
    glow?.flash(g.clone().add(V(0, 1, 0)), C.white, 5.5, 0.22);
    glow?.flash(g.clone().add(V(0, 1.2, 0)), C.crimson, 8, 0.45);
    glow?.pillar(g, C.blood, 1.6, 7, 0.6);
    // fendas no chão e ondas de choque
    fx.cracks(g, C.crimson, r * 1.05, 1.4);
    fx.cracks(g, C.ivory, r * 0.6, 1.1);
    fx.pulse(g, C.crimson, r, 0.55);
    fx.impact(g, C.edge, r * 0.55, 0.5);
    glow?.ring(g, C.crimson, r * 0.6, 0.4);
    this.later(0.08, () => glow?.ring(g, C.ivory, r * 1.05, 0.5));
    this.later(0.18, () => glow?.ring(g, C.blood, r * 1.5, 0.6));
    // espinhos de terra e marfim brotando em anel
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r * (i % 2 ? 0.55 : 0.85);
      const at = this.floor(g.clone().add(V(Math.cos(a) * rr, 0, Math.sin(a) * rr)));
      this.later(0.03 + (i % 4) * 0.025, () => {
        glow?.pillar(at, i % 3 ? C.earth : C.ivory, 0.35 + (i % 2) * 0.15, 1.8 + (i % 3) * 0.7, 0.6);
        glow?.burst(at, C.dust, { count: 6, speed: 3, up: 8, size: 0.32, life: 0.8, gravity: -16 });
      });
    }
    // pedras e poeira subindo, faíscas carmesim
    glow?.burst(g, C.earth, { count: 24, speed: 6, up: 12, size: 0.5, life: 1.1, gravity: -18, spread: 1.5 });
    glow?.burst(g, C.dust, { count: 30, speed: 9, up: 3, size: 0.38, life: 0.9, gravity: -8, spread: 1.6 });
    fx.sparks(g.clone().add(V(0, 0.5, 0)), C.edge, 30, 6, { gravity: 4, life: 0.6, size: 0.06, stretch: 2.5 });
    this.later(0.1, () => fx.sparks(g.clone().add(V(0, 0.4, 0)), C.ivory, 18, 4.5, { gravity: 5, life: 0.55, size: 0.05 }));
    this.shake(0.45);
    this.later(0.15, () => this.shake(0.25));
  }

  // ===== acerto num alvo (todas as habilidades) =====
  hit(slot, at, dir) {
    const glow = this.glow;
    const g = this.floor(at);
    const top = V(at.x, at.y + 1.2, at.z);
    glow?.flash(top, C.crimson, 2.4, 0.22);
    this.fx.sparks(top, C.ivory, 12, 4.2, { gravity: 4, life: 0.4, size: 0.05, stretch: 2.4 });
    if (slot === 1) {
      // empurrado pelo rugido: rastro de poeira para trás
      glow?.burst(g, C.dust, { count: 8, speed: 5, up: 1.5, size: 0.3, life: 0.5, gravity: -6 });
      this.fx.pulse(top, C.edge, 0.9, 0.3, true);
    } else {
      // jogado para cima pela chifrada ou pelo pisão
      glow?.burst(g, C.earth, { count: 8, speed: 2.5, up: 8, size: 0.35, life: 0.7, gravity: -16 });
      glow?.ring(g, C.crimson, 1.6, 0.35);
    }
  }

  // ===== M1 da Besta: poeira, riscos e choque de massa, mais fortes =====
  m1(kind, P, D, step) {
    const fx = this.fx;
    const glow = this.glow;
    const g = this.floor(P, 0.05);
    const side = V(D.z, 0, -D.x);
    const s = step % 2 ? 1 : -1;
    switch (kind) {
      case 'poeira':
        // garra brutal: três riscos carmesim e marfim em arco
        fx.talons(P.clone().addScaledVector(side, -0.7 * s).add(V(0, 0.55, 0)), P.clone().addScaledVector(side, 0.6 * s).add(V(0, -0.45, 0)), s, true);
        glow?.flash(P, C.crimson, 1.6, 0.16);
        fx.sparks(P, C.ivory, 8, 3, { gravity: 3, life: 0.3, stretch: 2.2 });
        glow?.burst(g, C.dust, { count: 6, speed: 3, up: 3, size: 0.26, life: 0.5, gravity: -10 });
        break;
      case 'cauda':
        // golpe de cauda: arco largo de vento e poeira varrida
        fx.talons(P.clone().addScaledVector(side, 1.1).add(V(0, 0.1, 0)), P.clone().addScaledVector(side, -1.1).add(V(0, 0.2, 0)), -1, false);
        glow?.burst(g, C.dust, { count: 12, speed: 6, up: 1.5, size: 0.3, life: 0.55, gravity: -6 });
        fx.pulse(g, C.edge, 1.5, 0.35);
        break;
      case 'chifres':
        // chifrada ascendente: rasgo para cima e pedras
        fx.talons(P.clone().add(V(0, -0.6, 0)), P.clone().add(V(0, 1.1, 0)).addScaledVector(D, 0.6), 1, true);
        glow?.pillar(g.clone().addScaledVector(D, 0.6), C.crimson, 0.6, 2.6, 0.35);
        glow?.burst(g, C.earth, { count: 8, speed: 2.5, up: 7, size: 0.34, life: 0.7, gravity: -16 });
        fx.sparks(P, C.ivory, 12, 3.6, { gravity: 3, life: 0.4, stretch: 2.6 });
        break;
      case 'massa':
        // investida: choque de massa, rachaduras e anel
        fx.cracks(g, C.crimson, 1.6, 0.8);
        glow?.ring(g, C.crimson, 2.4, 0.4);
        glow?.flash(P, C.white, 2.2, 0.16);
        glow?.flash(P, C.crimson, 3, 0.3);
        glow?.burst(g, C.dust, { count: 18, speed: 6, up: 4, size: 0.32, life: 0.6, gravity: -10 });
        glow?.burst(g, C.earth, { count: 8, speed: 3, up: 8, size: 0.4, life: 0.8, gravity: -16 });
        this.shake(0.18);
        break;
      default:
    }
  }
}
