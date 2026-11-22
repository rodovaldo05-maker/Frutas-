// Despertar das frutas (atualização 13; doc 08): slot 4 (tecla V). Libera no domínio 59 da
// fruta depois da Prova do Despertar (acertar 30 habilidades da fruta em inimigos). Ligado,
// exige 45 de energia, custa 15 para começar e 4 por segundo; desliga sozinho sem energia.
// Enquanto ativo: +30% de dano da fruta (habilidades e combo), recargas 50% mais rápidas e
// uma aura na cor da fruta — o corpo não muda de forma.

export const AWAKEN = { level: 59, minEnergy: 45, start: 15, drain: 4, damage: 1.3, cdSpeed: 1.5, trialHits: 30 };

export function normalizeAwaken(save) {
  const a = save.awakened && typeof save.awakened === 'object' ? save.awakened : {};
  save.awakened = Object.fromEntries(Object.entries(a).filter(([k, v]) => typeof k === 'string' && v === true));
  const t = save.awakenTrial;
  save.awakenTrial = t && typeof t.fruit === 'string' && Number.isFinite(t.hits) ? { fruit: t.fruit, hits: Math.max(0, Math.floor(t.hits)) } : null;
  return save;
}

// 'bloqueado' (domínio baixo), 'prova' (fazendo a prova) ou 'liberado'
export function awakenState(save, fruitId, domainLevel) {
  if (!fruitId) return 'bloqueado';
  if (save.awakened?.[fruitId]) return 'liberado';
  return domainLevel >= AWAKEN.level ? 'prova' : 'bloqueado';
}

// Um acerto de habilidade da fruta em inimigo conta para a prova; devolve true ao completar
export function trialHit(save, fruitId, domainLevel) {
  if (awakenState(save, fruitId, domainLevel) !== 'prova') return false;
  if (save.awakenTrial?.fruit !== fruitId) save.awakenTrial = { fruit: fruitId, hits: 0 };
  save.awakenTrial.hits += 1;
  if (save.awakenTrial.hits >= AWAKEN.trialHits) {
    save.awakened = { ...(save.awakened ?? {}), [fruitId]: true };
    save.awakenTrial = null;
    return true;
  }
  return false;
}

export const trialProgress = (save, fruitId) => (save.awakenTrial?.fruit === fruitId ? save.awakenTrial.hits : 0);
