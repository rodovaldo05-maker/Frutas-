// Segundo Mar (atualização 17; doc 02): ao norte do Primeiro Mar, depois do Portão das
// Correntes. A travessia só abre depois de derrotar a Guardiã da Fenda Celeste e passa por
// uma tempestade (src/world/storm.js). As três primeiras ilhas: Cais das Correntes (porto e
// estaleiro, o "hub" do mar), Arquipélago Esmeralda (selva com cachoeira e templo) e Cidadela
// de Granito (fortaleza em camadas). Usam o mesmo gerador das ilhas do Primeiro Mar.
// Atualização 27: as ilhas 14 a 18 (Geleira Silente, Ruínas do Sol Poente, Ilha do Bosque
// Noturno, Bastião Vulcânico e Masmorra do Abismo), com os acontecimentos de cada uma
// (src/world/islandEvents.js), e o Portão do Abismo, que leva ao Terceiro Mar depois de
// derrotar o Carcereiro Sem-Rosto.

const L = (skin, hair, shirt, shorts, shoes) => ({ skin, hair, shirt, shorts, shoes });

// centro do Segundo Mar (as praias de chegada olham para o Cais das Correntes)
const HUB = { x: 0, z: -2450 };

export const SEA2 = [
  {
    id: 'cais-correntes', nome: 'Cais das Correntes', x: HUB.x, z: HUB.z, R: 72, biome: 'cidade', seed: 101, faixa: [700, 775], campAngle: 2.6, mar: 2,
    villageR: 40, shipyard: true, home: { x: 0, z: -2000 },
    enemy: { nome: 'Estivador Rebelde', look: L('#a8714c', '#2a1d14', '#4a5a6a', '#2a2a33', '#1a1a20'), faixa: '#4a8aff' },
    boss: { nome: 'Contramestre Corrente', element: 'raio', look: L('#c8a080', '#1a1a22', '#1f4f6a', '#e8e8e8', '#101018'), faixa: '#4fd2e0', cor: '#4fd2e0', meleeEffects: { molhado: { duration: 4 } }, special: { nome: 'Âncora das Correntes', clip: 'mare2', cooldown: 6, telegraph: 0.9, radius: 3.6, damage: 22, effects: { molhado: { duration: 6 }, lento: { duration: 2 } } } },
  },
  {
    id: 'arquipelago-esmeralda', nome: 'Arquipélago Esmeralda', x: 400, z: -2700, R: 66, biome: 'selva', seed: 113, faixa: [775, 875], campAngle: 4.2, mar: 2, fallAngle: 0.9, home: HUB,
    enemy: { nome: 'Guardião da Selva', look: L('#7a5a3c', '#2a3a1a', '#3f7a3a', '#5a4a2a', '#2a2018'), faixa: '#7ac050' },
    boss: { nome: 'Serpente-Raiz', look: L('#4a6a2a', '#2f5a1a', '#3a6a2a', '#2a4a1a', '#1a2a10'), faixa: '#8ac060', cor: '#5aa83a', meleeEffects: { lento: { duration: 1.5 } }, special: { nome: 'Abraço de Raízes', clip: 'impacto2', cooldown: 6, telegraph: 1.0, radius: 3.8, damage: 24, effects: { lento: { duration: 3 } } } },
  },
  {
    id: 'cidadela-granito', nome: 'Cidadela de Granito', x: -380, z: -2760, R: 66, biome: 'granito', seed: 127, faixa: [875, 975], campAngle: 1.0, mar: 2, walls: [20, 30], home: HUB,
    enemy: { nome: 'Soldado de Granito', look: L('#b9825c', '#3a3a3a', '#6a6a72', '#3a3a42', '#2a2a30'), faixa: '#c0c0c8' },
    boss: { nome: 'General Basalto', look: L('#5a5050', '#2a2a2a', '#3a3a40', '#2a2a30', '#1a1a20'), faixa: '#ff8a2a', cor: '#c0c0c8', special: { nome: 'Martelo de Basalto', clip: 'impacto2', cooldown: 5, telegraph: 0.9, radius: 4, damage: 26 } },
  },
  {
    id: 'geleira-silente', nome: 'Geleira Silente', x: -820, z: -2480, R: 70, biome: 'geleira', seed: 131, faixa: [975, 1075], campAngle: 5.4, mar: 2, home: HUB,
    enemy: { nome: 'Saqueador do Gelo', element: 'gelo', cor: '#9fe0ff', meleeEffects: { lento: { duration: 1.5 } }, look: L('#d8b090', '#e8f0f8', '#5a7a98', '#2a3a55', '#e8f0f8'), faixa: '#bfeeff' },
    boss: { nome: 'Rainha do Inverno Eterno', element: 'gelo', look: L('#e8eef8', '#ffffff', '#9fd0f0', '#e8f4ff', '#bfe0f0'), faixa: '#bfeeff', cor: '#9fe0ff', meleeEffects: { lento: { duration: 2 } }, special: { nome: 'Coroa de Geada', clip: 'geada2', cooldown: 6, telegraph: 0.9, radius: 4, damage: 28, effects: { congelado: { duration: 1.2 }, lento: { duration: 3 } } } },
  },
  {
    id: 'ruinas-sol-poente', nome: 'Ruínas do Sol Poente', x: 820, z: -2440, R: 64, biome: 'ruinas', seed: 139, faixa: [1075, 1175], campAngle: 2.0, mar: 2, home: HUB,
    enemy: { nome: 'Guardião das Ruínas', look: L('#a8714c', '#3a2a1a', '#c8a060', '#8a6a3a', '#4a3a2a'), faixa: '#ffd070' },
    boss: { nome: 'Sentinela Dourado', element: 'raio', look: L('#d8b040', '#ffe8a0', '#e0b040', '#b8902e', '#8a6a20'), faixa: '#ffd040', cor: '#ffe08a', meleeEffects: { choque: { stacks: 1 } }, special: { nome: 'Raio do Poente', clip: 'tormenta0', cooldown: 5, telegraph: 0.9, radius: 4, damage: 30, effects: { choque: { stacks: 2 } } } },
  },
  {
    id: 'bosque-noturno', nome: 'Ilha do Bosque Noturno', x: 780, z: -3020, R: 66, biome: 'noturno', seed: 149, faixa: [1175, 1275], campAngle: 3.6, mar: 2, home: HUB,
    enemy: { nome: 'Sombra Errante', look: L('#6a5a7a', '#1a1022', '#2a1a3a', '#1a1022', '#101018'), faixa: '#a07ae0' },
    boss: { nome: 'Senhora das Sombras', look: L('#8a7aa0', '#101018', '#3a1a5a', '#1a1022', '#101018'), faixa: '#c084fc', cor: '#8a5ad8', meleeEffects: { lento: { duration: 1.5 } }, special: { nome: 'Véu da Noite', clip: 'impacto2', cooldown: 6, telegraph: 1.0, radius: 4.2, damage: 32, effects: { lento: { duration: 3 } } } },
  },
  {
    id: 'bastiao-vulcanico', nome: 'Bastião Vulcânico', x: -780, z: -3040, R: 68, biome: 'bastiao', seed: 157, faixa: [1275, 1375], campAngle: 0.5, mar: 2, home: HUB,
    enemy: { nome: 'Guarda de Obsidiana', element: 'fogo', cor: '#ff6a1a', meleeEffects: { queimando: { duration: 3, stacks: 1 } }, look: L('#5a3a2a', '#1a0c08', '#2a1a1a', '#1a0c08', '#101010'), faixa: '#ff8a2a' },
    boss: { nome: 'Titã de Obsidiana', element: 'fogo', look: L('#2a2228', '#ff6a1a', '#1a1418', '#2a2228', '#101010'), faixa: '#ff6a1a', cor: '#ff6a1a', meleeEffects: { queimando: { duration: 4, stacks: 2 } }, special: { nome: 'Punho de Magma', clip: 'brasa2', cooldown: 6, telegraph: 1.0, radius: 4.4, damage: 34, effects: { queimando: { duration: 5, stacks: 2 } } } },
  },
  {
    id: 'masmorra-abismo', nome: 'Masmorra do Abismo', x: 0, z: -3220, R: 62, biome: 'masmorra', seed: 163, faixa: [1375, 1500], campAngle: 0, mar: 2, home: HUB,
    enemyExtra: { aggro: 7, camp: 7, leash: 9 }, bossExtra: { aggro: 9, camp: 9, leash: 10 },
    enemy: { nome: 'Carcereiro do Abismo', look: L('#8a6a5a', '#1a1a1a', '#3a3a44', '#2a2a30', '#1a1a20'), faixa: '#8a8a94' },
    boss: { nome: 'Carcereiro Sem-Rosto', look: L('#3a3a40', '#101010', '#2a2a30', '#1a1a20', '#101010'), faixa: '#e8e8f0', cor: '#c0c0c8', meleeEffects: { lento: { duration: 1.5 } }, special: { nome: 'Correntes do Abismo', clip: 'impacto2', cooldown: 5, telegraph: 0.9, radius: 4.2, damage: 36, effects: { lento: { duration: 3 } } } },
  },
];

// Portões da travessia: no Primeiro Mar (ao norte da Fenda Celeste) e no Segundo Mar (ao sul
// do Cais das Correntes). Entrar com o bote no portão começa a tempestade.
export const GATES = {
  norte: { id: 'norte', nome: 'Portão das Correntes', x: -40, z: -960, r: 22, to: 'sul', dir: Math.PI }, // vai para o norte (−z)
  sul: { id: 'sul', nome: 'Portão do Sul', x: 0, z: -2290, r: 22, to: 'norte', dir: 0, back: true }, // volta para o sul (+z)
  // atualização 27: Segundo Mar ↔ Terceiro Mar
  abismo: { id: 'abismo', nome: 'Portão do Abismo', x: 0, z: -3420, r: 22, to: 'horizonte', dir: Math.PI, unlockBoss: 'masmorra-abismo-chefe', lock: 'Derrote o Carcereiro Sem-Rosto na Masmorra do Abismo para atravessar.' },
  horizonte: { id: 'horizonte', nome: 'Portão do Horizonte', x: 0, z: -4260, r: 22, to: 'abismo', dir: 0, back: true },
};
// onde o bote aparece depois da tempestade (já fora do portão, apontando para longe dele)
export const ARRIVALS = {
  sul: { x: 0, z: -2330, yaw: Math.PI, mar: 2 },
  norte: { x: -40, z: -915, yaw: 0, mar: 1 },
  horizonte: { x: 0, z: -4310, yaw: Math.PI, mar: 3 },
  abismo: { x: 0, z: -3375, yaw: 0, mar: 2 },
};
export const CROSSING = { time: 22, back: 12, strikeEvery: [1.2, 2.2], strikeRadius: 3.6, strikeDamage: 0.07, telegraph: 1.0, xp: 500, unlockBoss: 'fenda-celeste-chefe' };

export const seaOf = (z) => (z < -3800 ? 3 : z < -1700 ? 2 : 1);
export const SEA_NAMES = { 1: 'Primeiro Mar', 2: 'Segundo Mar', 3: 'Terceiro Mar' };
// cada portão de ida abre ao derrotar um chefe (o da volta sempre abre)
export const crossingUnlocked = (save, gate = GATES.norte) => gate.back || (save.bosses?.[gate.unlockBoss ?? CROSSING.unlockBoss] ?? 0) > 0;
