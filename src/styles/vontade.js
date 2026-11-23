// Vontade (doc 07; atualização 7): barra de 100 que volta 8/s fora de uso.
// - Armadura (alterna, 6/s): +15% de dano corpo a corpo e com armas, −10% de dano físico
//   recebido; braços escuros com brilho metálico.
// - Percepção (alterna, 4/s): esquiva automática dos primeiros golpes (3 + 1 a cada 20 níveis
//   de maestria), que só recarregam depois de 10 s desligada; aviso vermelho quando um inimigo
//   vai atacar e nomes visíveis de longe; tela levemente dessaturada.
// - Soberana: desbloqueio raro (missão especial, futuro).
// Maestria de cada uma (1 a 100) sobe usando em combate real.

import { armorCost, armorMitigation, FORESIGHT, REI } from '../haki/haki.js';

export const VONTADE = { max: 100, regen: 8, armorCost: 6, senseCost: 4, senseRecharge: 10 };
export const VONTADE_SKILLS = {
  armadura: { nome: 'Vontade de Armadura', preco: 5000, nivel: 4, desc: '+15% de dano corpo a corpo e com armas, −10% de dano físico recebido (6/s).' },
  percepcao: { nome: 'Vontade de Percepção', preco: 8000, nivel: 6, desc: 'Esquiva sozinha dos primeiros golpes, avisa ataques e mostra inimigos de longe (4/s).' },
  soberana: { nome: 'Haki do Rei (Vontade Soberana)', preco: 0, nivel: 30, desc: 'Pulso de Vontade: intimida inimigos fracos e abala os outros. Libera vencendo o Desafio da Vontade (Treinamento → Rei).', bloqueada: true },
};

export class Vontade {
  constructor({ save, onEvent = () => {} }) {
    this.save = save;
    this.onEvent = onEvent;
    this.value = VONTADE.max;
    this.armor = false;
    this.sense = false;
    this.senseOff = 99;
    this.dodgesUsed = 0;
    this.regenMult = 1; // Concentração (atualização 25)
    this.foresightCd = 0; // Observação 90+: previsão breve
    this.pulseCd = 0; // Haki do Rei
  }

  get learned() {
    return this.save.vontade ?? (this.save.vontade = { armadura: false, percepcao: false, soberana: false });
  }

  level(kind) {
    return this.save.proficiency?.[`vontade:${kind}`]?.level ?? 1;
  }

  get dodgesMax() {
    return 3 + Math.floor(this.level('percepcao') / 20);
  }

  get dodgesLeft() {
    return Math.max(0, this.dodgesMax - this.dodgesUsed);
  }

  toggle(kind) {
    if (!this.learned[kind === 'armor' ? 'armadura' : 'percepcao']) {
      this.onEvent('denied', { message: `Aprenda a ${kind === 'armor' ? 'Vontade de Armadura' : 'Vontade de Percepção'} com o Mestre de Luta.` });
      return false;
    }
    if (kind === 'armor') this.armor = !this.armor && this.value > 5;
    else {
      this.sense = !this.sense && this.value > 5;
      if (!this.sense) this.senseOff = 0;
    }
    this.onEvent('toggle', { kind, on: kind === 'armor' ? this.armor : this.sense });
    return true;
  }

  update(dt) {
    // Armamento: o revestimento fica mais barato com a maestria (6/s → 3/s)
    const cost = (this.armor ? armorCost(this.level('armadura')) : 0) + (this.sense ? VONTADE.senseCost : 0);
    this.foresightCd = Math.max(0, this.foresightCd - dt);
    this.pulseCd = Math.max(0, this.pulseCd - dt);
    if (cost > 0) {
      this.value = Math.max(0, this.value - cost * dt);
      if (this.value <= 0) {
        if (this.sense) this.senseOff = 0;
        this.armor = this.sense = false;
        this.onEvent('empty', {});
      }
    } else this.value = Math.min(VONTADE.max, this.value + VONTADE.regen * this.regenMult * dt);
    if (!this.sense) {
      this.senseOff += dt;
      if (this.senseOff >= VONTADE.senseRecharge) this.dodgesUsed = 0;
    }
  }

  // Multiplicadores atuais
  get damageMult() {
    return this.armor ? 1.15 + Math.min(0.1, 0.001 * (this.level('armadura') - 1)) : 1;
  }

  get mitigation() {
    return this.armor ? armorMitigation(this.level('armadura')) : 0; // Armamento 30+: defesa maior
  }

  // Percepção: tenta esquivar sozinha de um golpe
  autoDodge() {
    if (!this.sense) return false;
    if (this.dodgesLeft <= 0) {
      // Observação 90+: previsão breve — mais uma esquiva a cada 20 s (não é invulnerável)
      if (this.level('percepcao') >= FORESIGHT.from && this.foresightCd <= 0) {
        this.foresightCd = FORESIGHT.cooldown;
        return true;
      }
      return false;
    }
    this.dodgesUsed += 1;
    return true;
  }

  // Haki do Rei: Pulso de Vontade (custo e recarga); o efeito nos alvos fica no main.js
  pulse() {
    if (!this.learned.soberana) return 'Haki do Rei: vença o Desafio da Vontade (Treinamento → Rei).';
    if (this.pulseCd > 0) return `Pulso de Vontade em ${Math.ceil(this.pulseCd)} s.`;
    if (this.value < REI.cost) return `Pulso de Vontade: precisa de ${REI.cost} de Vontade.`;
    this.value -= REI.cost;
    this.pulseCd = REI.cooldown;
    return null;
  }

  off() {
    this.armor = this.sense = false;
  }
}
