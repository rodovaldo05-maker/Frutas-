// Parâmetros do movimento. Unidades do mundo = unidades do laboratório FRUTO
// (o corpo base mede cerca de 4,1 unidades de altura). Doc 04.

export const GRAVITY = 19.6; // mesma gravidade do laboratório

export const MOVE = {
  // Cápsula do personagem
  radius: 0.62,
  halfHeight: 1.38, // parte reta; altura total = 2 × (halfHeight + radius) ≈ 4,0
  crouchHalfHeight: 0.62, // agachado/deslizando: altura ≈ 2,5
  skin: 0.03,

  // Velocidades (unidades/s)
  walk: 2.3,
  run: 3.8, // velocidade base do laboratório
  sprint: 7.6, // botão Correr (alterna): +100% sobre os 3,8 de andar (antes era 6,0, +58%)
  crouch: 2.0,
  swim: 3.0,
  swimSprint: 5.4, // Correr nadando: +80%
  diveSprint: 1.6, // Correr mergulhando: ×1,6
  dive: 2.6,
  glideForward: 8.0, // planar não freia quem vem correndo
  glideFall: 2.6,

  // Resposta (como no laboratório: aproximação exponencial)
  drive: 12,
  brake: 16,
  turnRate: 15,
  airControl: 4.7,
  waterResponse: 5.5,

  // Salto
  jumpVelocity: 8.6, // altura ≈ 1,9
  doubleJumpVelocity: 7.6,
  jumpPrep: 0.05, // agachamento curto antes de sair do chão (do laboratório)
  fallGravityScale: 1.35,
  terminalVelocity: 40,
  coyoteTime: 0.12,
  jumpBuffer: 0.15,

  // Esquiva / dash (revisão: o dobro do alcance, ≈ 4 m)
  dashDistance: 10,
  dashTime: 0.28,
  dashCooldown: 0.8,
  dashInvulnerable: 0.2,

  // Deslize (revisão: sai mais rápido que a corrida e freia aos poucos)
  slideMinSpeed: 4.4,
  slideBoost: 1.6,
  slideStart: 11, // velocidade mínima ao começar a deslizar
  slideMax: 16,
  slideTime: 0.85,
  slideFriction: 4.2,
  slopeSlideAngle: 50, // acima disso o personagem escorrega

  // Rampas e degraus
  maxClimbAngle: 46,
  stepHeight: 0.55,
  snapDistance: 0.6,

  // Escalada e bordas
  climbSpeed: 3.0,
  climbReach: 1.0, // distância máxima da parede para agarrar
  hangReachMin: 3.0, // altura da borda (acima dos pés) que permite agarrar
  hangReachMax: 4.7,
  hangOffset: 4.15, // dos pés até a borda, pendurado
  shimmySpeed: 2.2,
  vaultMax: 2.6, // obstáculos até esta altura são escalados direto (sem pendurar)
  mantleTime: 0.55,
  wallJumpOut: 6.2,
  wallJumpUp: 8.4,
  wallRunTime: 1.2,
  wallRunMinSpeed: 4.2,
  wallRunGravity: 0.18,

  // Queda
  safeFall: 12, // sem dano até esta altura
  rollFall: 26, // rolando, sem dano até esta altura
  fallDamagePerUnit: 6,
  freeFallTime: 1.1,
  rollTime: 0.55,
  hardLandingLock: 0.25,

  // Água
  swimDepth: 2.3, // profundidade que faz o personagem nadar
  floatDraft: 3.28, // pés abaixo da superfície boiando parado (valor do laboratório)
  floatDraftMoving: 1.94, // nadando o corpo deita e sobe (valor do laboratório)
  swimExitLedge: 2.8, // sai da água sozinho por bordas até esta altura acima da superfície
  breathDamage: 8, // dano por segundo sem ar
  breath: 30,
};

export const STAMINA = {
  max: 100, // base; cada ponto de Força soma 1 e de Vitalidade soma 4 (src/progression/status.js)
  regen: 25,
  regenDelay: 1,
  sprint: 12, // por segundo
  climb: 9,
  climbMoving: 13,
  hang: 3,
  wallJump: 18,
  doubleJump: 15,
  swimSprint: 10,
  wallRun: 20,
  exhaustedRecover: 30, // % do máximo que precisa voltar depois de zerar
};

// Habilidades de mobilidade desbloqueáveis (doc 04). Na ilha de teste vêm liberadas.
export const UNLOCKS_DEFAULT = {
  doubleJump: true,
  airDash: true,
  wallRun: true,
  glide: true,
};
