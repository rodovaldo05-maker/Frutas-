// Combate do jogador (doc 05): Atacar (combo Jab → Direto → Gancho), Defender (segurar),
// defesa perfeita, postura, esquiva que cancela a recuperação e golpes recebidos.
// Usa as regras de combat/rules.js e devolve eventos para HUD, sons e treino.

import { AttackRunner, Guard, ATTACKS, computeDamage, inReach, isFrontal, GUARD, reactionTime } from './rules.js';
import { clamp, wrapAngle } from '../core/math.js';

export class PlayerCombat {
  // stats(): { melee, defense, mitigation, perfectWindow, blockReduce, postureMult }
  constructor({ ctl, stats, onEvent = () => {} }) {
    this.ctl = ctl;
    this.stats = stats;
    this.onEvent = onEvent;
    this.runner = new AttackRunner();
    this.guard = new Guard();
    this.hitstop = 0;
    this.lastAttack = null;
  }

  get actor() {
    const c = this.ctl;
    return { x: c.pos.x, y: c.pos.y, z: c.pos.z, yaw: c.yaw };
  }

  canFight() {
    const c = this.ctl;
    return c.state === 'ground' && c.busyT <= 0 && c.stunned <= 0 && !c.dash;
  }

  // Antes do passo do controlador: lê Atacar/Defender e ajusta a entrada
  update(dt, input, targets) {
    const c = this.ctl;
    this.hitstop = Math.max(0, this.hitstop - dt);
    const slow = this.hitstop > 0 ? 0.08 : 1;
    const can = this.canFight() && !this.powers?.busy;
    // controle incapacitante, desmaio ou morte: a sequência do M1 volta ao M1-1
    if (c.stunned > 0 || c.faint > 0 || c.dead) {
      if (this.runner.busy || this.runner.comboStep) {
        this.runner.reset();
        c.action = null;
      }
    }
    if (input.attackPressed && (can || this.runner.busy)) this.runner.press();
    // esquiva só cancela depois do contato; antes disso o golpe vai até o fim
    if (this.runner.busy && !this.runner.recovering) input.dashPressed = false;
    if (input.dashPressed && this.runner.recovering) this.runner.cancel();
    if (!can && this.runner.busy && c.state !== 'ground') this.runner.cancel();

    this.guard.set(!!input.block && can && !this.runner.busy, dt);
    this.guard.update(dt);
    c.guarding = this.guard.holding;
    if (this.guard.holding) {
      input.sprint = false;
      // defendendo, vira de frente para o inimigo hostil mais perto
      let near = null;
      let nd = 7;
      for (const t of targets) {
        if (!t.alive || !t.hostile) continue;
        const d = Math.hypot(t.pos.x - c.pos.x, t.pos.z - c.pos.z);
        if (d < nd) {
          nd = d;
          near = t;
        }
      }
      if (near) c.yaw += wrapAngle(Math.atan2(near.pos.x - c.pos.x, near.pos.z - c.pos.z) - c.yaw) * Math.min(1, 14 * dt);
    }

    const before = this.runner.current;
    const strike = this.runner.update(dt * slow, can && !this.guard.holding);
    const cur = this.runner.current;
    if (cur && cur !== before) this.beginAttack(cur, input, targets);
    if (cur) {
      c.attackLock = Math.max(c.attackLock, 0.05);
      const a = this.runner.attacks[cur.id];
      // forma de fera: variante própria do golpe (mesmo tempo, mesmo quadro de impacto) —
      // híbrida `_h` (clipe humanoide), completa `_c` (golpe do corpo do animal)
      const shape = this.formShape?.() ?? null;
      const clip = shape === 'hibrida' && a.clipHybrid ? a.clipHybrid : shape === 'completa' && a.m1 && a.clipHybrid ? `${a.clip}_c` : a.clip;
      c.action = { clip, t: cur.t };
    } else if (!this.powers?.busy) c.action = null;
    if (strike) this.strike(strike, targets);
  }

  // Vira para o alvo mais próximo à frente (ou para onde o direcional aponta) e avança
  beginAttack(cur, input, targets) {
    const c = this.ctl;
    const a = this.runner.attacks[cur.id];
    let best = null;
    let bd = 9;
    for (const t of targets) {
      if (!t.alive) continue;
      const dx = t.pos.x - c.pos.x;
      const dz = t.pos.z - c.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > bd || Math.abs(t.pos.y - c.pos.y) > 3) continue;
      const ahead = Math.abs(wrapAngle(Math.atan2(dx, dz) - c.yaw));
      if (ahead > 1.6 && d > 3.5) continue;
      bd = d;
      best = t;
    }
    if (best) c.yaw = Math.atan2(best.pos.x - c.pos.x, best.pos.z - c.pos.z);
    else if (Math.hypot(input.moveX, input.moveY) > 0.3) {
      const f = { x: Math.sin(input.camYaw), z: Math.cos(input.camYaw) };
      const wx = f.x * input.moveY - f.z * input.moveX;
      const wz = f.z * input.moveY + f.x * input.moveX;
      c.yaw = Math.atan2(wx, wz);
    }
    // avança um pouco, sem passar do alvo
    const room = best ? clamp(bd - 2.4, 0, a.lunge) : a.lunge;
    const v = room / 0.16;
    c.shove(Math.sin(c.yaw) * v, Math.cos(c.yaw) * v, 0.16);
    this.onEvent('swing', { attack: cur.id, step: cur.step, total: this.runner.combo.length, m1: a.m1 ?? 0 });
  }

  strike(attack, targets) {
    const me = this.actor;
    this.onEvent('slash', { attack });
    const s = this.stats();
    let landed = 0;
    let first = null;
    for (const t of targets) {
      if (!t.alive) continue;
      // corpos maiores (formas de fera) alcançam mais longe
      const reach = this.formReach?.() ?? 1;
      const hitbox = reach === 1 ? attack : { ...attack, range: attack.range * reach };
      if (!inReach(me, { x: t.pos.x, y: t.pos.y, z: t.pos.z }, hitbox, { radius: t.radius ?? 0.9, arc: attack.arc ?? 0.45 })) continue;
      // espada: pontos de Espada × proficiência; soco e combo de fruta: pontos de Força
      const mult = (attack.weapon ? s.weapon * (s.prof ?? 1) : s.melee * (attack.styleMult ?? 1)) * (s.armor ?? 1);
      const damage = computeDamage(attack.damage, { mult, defense: t.defense ?? 0 });
      // reações do catálogo do M1: levantar um pouco (gancho, chifrada) ou puxar (atração)
      let effect = null;
      if (attack.effect?.hop) effect = { hop: attack.effect.hop };
      if (attack.effect?.pullIn) effect = { pull: { x: me.x + Math.sin(me.yaw) * 2.4, z: me.z + Math.cos(me.yaw) * 2.4 } };
      const r = t.receiveHit({ attacker: me, attack, damage, from: 'jogador', effect });
      if (!r) continue;
      landed += 1;
      first ??= t;
      this.hitstop = Math.max(this.hitstop, attack.hitstop);
      this.onEvent('hit', { target: t, attack, damage: r.damage, result: r.result });
    }
    if (!landed) this.onEvent('whiff', { attack });
    // evento de impacto da animação: efeito e som do golpe saem daqui, uma vez por golpe
    this.onEvent('impact', { attack, target: first, landed });
  }

  // Golpe de um inimigo chega ao jogador. Devolve o resultado (para o inimigo reagir).
  receive({ attacker, attack, damage, source, life }) {
    const c = this.ctl;
    if (c.faint > 0) return { result: 'none' };
    const me = this.actor;
    // esquiva no tempo certo: o golpe ia acertar, mas o jogador está invulnerável
    if (c.invulnerable > 0) {
      this.onEvent('dodge', { source, life });
      return { result: 'dodge' };
    }
    // Vontade de Percepção: esquiva sozinha dos primeiros golpes
    if (this.vontade?.autoDodge()) {
      this.onEvent('senseDodge', { source, life, left: this.vontade.dodgesLeft });
      return { result: 'dodge' };
    }
    // muralha de gelo ativa: segura golpes que vêm de frente
    if (this.powers?.wallBlocks(attacker)) {
      this.onEvent('wall', { source, life });
      return { result: 'block', damage: 0 };
    }
    const s = this.stats();
    // golpe elemental: a Resistência Elemental mitiga no lugar da física
    const dmg = computeDamage(damage, { defense: s.defense, mitigation: attack.element ? (s.elementalMit ?? 0) : s.mitigation });
    const r = this.guard.receive(dmg, attack.posture, {
      frontal: isFrontal(me, attacker), perfectWindow: s.perfectWindow, reduce: s.blockReduce, postureMult: s.postureMult,
    });
    const away = Math.atan2(me.x - attacker.x, me.z - attacker.z);
    if (r.result === 'perfect') {
      this.onEvent('perfect', { source, life });
      return r;
    }
    if (r.result === 'block') {
      c.shove(Math.sin(away) * 3, Math.cos(away) * 3, 0.12);
      this.onEvent('block', { source, life, damage: r.damage });
    }
    if (r.result === 'break') {
      c.stunned = GUARD.breakStun * (s.stunMult ?? 1);
      this.onEvent('guardBreak', { source, life });
    }
    if (r.damage > 0) {
      if (r.result === 'hit') {
        this.runner.cancel();
        c.action = null;
        c.attackLock = Math.max(c.attackLock, reactionTime(attack.reaction) * 0.6);
        const k = attack.knock / 0.2;
        c.shove(Math.sin(away) * k, Math.cos(away) * k, 0.2);
      }
      c.damage(r.damage, 'golpe');
      this.onEvent('hurt', { source, life, damage: r.damage, result: r.result });
    }
    return r;
  }
}
