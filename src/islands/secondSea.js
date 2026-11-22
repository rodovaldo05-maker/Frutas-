// Segundo Mar (atualização 17; doc 02): ao norte do Primeiro Mar, depois do Portão das
// Correntes. A travessia só abre depois de derrotar a Guardiã da Fenda Celeste e passa por
// uma tempestade (src/world/storm.js). As três primeiras ilhas: Cais das Correntes (porto e
// estaleiro, o "hub" do mar), Arquipélago Esmeralda (selva com cachoeira e templo) e Cidadela
// de Granito (fortaleza em camadas). Usam o mesmo gerador das ilhas do Primeiro Mar.

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
];

// Portões da travessia: no Primeiro Mar (ao norte da Fenda Celeste) e no Segundo Mar (ao sul
// do Cais das Correntes). Entrar com o bote no portão começa a tempestade.
export const GATES = {
  norte: { id: 'norte', nome: 'Portão das Correntes', x: -40, z: -960, r: 22, to: 'sul', dir: Math.PI }, // vai para o norte (−z)
  sul: { id: 'sul', nome: 'Portão do Sul', x: 0, z: -2290, r: 22, to: 'norte', dir: 0 }, // volta para o sul (+z)
};
// onde o bote aparece depois da tempestade (já fora do portão, apontando para longe dele)
export const ARRIVALS = {
  sul: { x: 0, z: -2330, yaw: Math.PI, mar: 2 },
  norte: { x: -40, z: -915, yaw: 0, mar: 1 },
};
export const CROSSING = { time: 22, back: 12, strikeEvery: [1.2, 2.2], strikeRadius: 3.6, strikeDamage: 0.07, telegraph: 1.0, xp: 500, unlockBoss: 'fenda-celeste-chefe' };

export const seaOf = (z) => (z < -1700 ? 2 : 1);
export const crossingUnlocked = (save) => (save.bosses?.[CROSSING.unlockBoss] ?? 0) > 0;
