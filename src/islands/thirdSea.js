// Terceiro Mar (atualização 28; doc 02): ao norte do Segundo Mar, depois do Portão do Abismo.
// Sete ilhas de 1500 a 2400, com a Capital dos Mil Mastros como porto principal. A Ilha Oculta
// só aparece (no mundo e na carta) depois do enigma das três pedras rúnicas.
// Eventos raros (src/world/seaEvents.js): Lua de Sangue, Navio Fantasma e Maré Celeste.

const L = (skin, hair, shirt, shorts, shoes) => ({ skin, hair, shirt, shorts, shoes });
// centro do Terceiro Mar: as praias de chegada olham para a Capital
const HUB = { x: 0, z: -4620 };

export const SEA3 = [
  {
    id: 'capital-mil-mastros', nome: 'Capital dos Mil Mastros', x: HUB.x, z: HUB.z, R: 80, biome: 'cidade', seed: 211, faixa: [1500, 1600], campAngle: 4.4, mar: 3,
    villageR: 46, castle: true, docks: true, enigmaHint: true, home: { x: 0, z: -4300 },
    enemy: { nome: 'Fuzileiro Imperial', look: L('#c29a7c', '#2a2018', '#2a3a6a', '#e8e8e8', '#1a1a22'), faixa: '#e8e8f0' },
    boss: { nome: 'Almirante Mil-Velas', look: L('#d8b090', '#e8e8e8', '#1a2a5a', '#e8e8f0', '#101018'), faixa: '#ffd040', cor: '#4a8aff', special: { nome: 'Salva dos Mil Mastros', clip: 'impacto2', cooldown: 5, telegraph: 0.9, radius: 4.4, damage: 40 } },
  },
  {
    id: 'santuario-escamas', nome: 'Santuário das Escamas', x: -820, z: -4720, R: 72, biome: 'santuario', seed: 223, faixa: [1600, 1725], campAngle: 0.6, mar: 3, home: HUB, runa: 0,
    enemy: { nome: 'Guardião das Escamas', element: 'fogo', cor: '#ff8a2a', meleeEffects: { queimando: { duration: 3, stacks: 1 } }, look: L('#7a5a3c', '#2a1a10', '#4a6a3a', '#3a2a1a', '#2a1a10'), faixa: '#c8a040' },
    boss: { nome: 'Dragão Ancião', element: 'fogo', scale: 2.1, look: L('#5a6a3a', '#ffd040', '#3a5a2a', '#2a3a1a', '#1a2a10'), faixa: '#ffd040', cor: '#ff8a2a', meleeEffects: { queimando: { duration: 4, stacks: 2 } }, special: { nome: 'Sopro Ancestral', clip: 'brasa2', cooldown: 6, telegraph: 1.0, radius: 5, damage: 44, effects: { queimando: { duration: 5, stacks: 2 } } } },
  },
  {
    id: 'tempestade-eterna', nome: 'Ilha da Tempestade Eterna', x: 840, z: -4740, R: 68, biome: 'tempestade', seed: 229, faixa: [1725, 1850], campAngle: 3.0, mar: 3, home: HUB, runa: 1,
    enemy: { nome: 'Arauto do Trovão', element: 'raio', cor: '#ffe45a', meleeEffects: { choque: { stacks: 1 } }, look: L('#c8a080', '#e8e8f0', '#3a3a5a', '#2a2a3a', '#1a1a22'), faixa: '#ffe45a' },
    boss: { nome: 'Senhor dos Trovões', element: 'raio', look: L('#d8c0a0', '#ffffff', '#2a2a4a', '#ffe45a', '#101018'), faixa: '#ffe45a', cor: '#ffe45a', meleeEffects: { choque: { stacks: 2 } }, special: { nome: 'Coroa de Raios', clip: 'tormenta0', cooldown: 5, telegraph: 0.9, radius: 4.6, damage: 46, effects: { choque: { stacks: 3 } } } },
  },
  {
    id: 'fortaleza-horizonte', nome: 'Fortaleza do Horizonte', x: -780, z: -5320, R: 72, biome: 'fortaleza', seed: 233, faixa: [1850, 1975], campAngle: 1.1, mar: 3, home: HUB, walls: [24, 34],
    enemy: { nome: 'Artilheiro do Horizonte', look: L('#b9825c', '#3a3a3a', '#5a4a3a', '#3a3a42', '#2a2a30'), faixa: '#ff8a2a' },
    boss: { nome: 'Marechal do Horizonte', look: L('#a8714c', '#e8e8e8', '#6a2a1a', '#2a2a30', '#101018'), faixa: '#ff6a1a', cor: '#ff8a2a', special: { nome: 'Bombardeio do Horizonte', clip: 'impacto2', cooldown: 5, telegraph: 0.9, radius: 4.8, damage: 50 } },
  },
  {
    id: 'mar-dos-ossos', nome: 'Mar dos Ossos', x: 820, z: -5340, R: 78, biome: 'ossos', seed: 239, faixa: [1975, 2100], campAngle: 2.0, mar: 3, home: HUB,
    enemy: { nome: 'Saqueador Afogado', look: L('#8aa0a0', '#2a3a3a', '#3a4a4a', '#2a3a3a', '#1a2a2a'), faixa: '#bfeeff' },
    boss: { nome: 'Leviatã Ósseo', scale: 2.4, look: L('#e8e0c8', '#c8c0a8', '#d8d0b8', '#b8b098', '#a8a088'), faixa: '#e8e0c8', cor: '#9fe0ff', meleeEffects: { molhado: { duration: 4 } }, special: { nome: 'Maré de Ossos', clip: 'mare2', cooldown: 6, telegraph: 1.0, radius: 5.2, damage: 54, effects: { molhado: { duration: 6 }, lento: { duration: 2 } } } },
  },
  {
    id: 'templo-aurora', nome: 'Templo da Aurora', x: 0, z: -5560, R: 70, biome: 'aurora', seed: 241, faixa: [2100, 2250], campAngle: 0.2, mar: 3, home: HUB, runa: 2,
    enemy: { nome: 'Sentinela da Aurora', element: 'raio', cor: '#ffe8a0', meleeEffects: { choque: { stacks: 1 } }, look: L('#e8d0b0', '#ffe8a0', '#ffffff', '#ffd070', '#ffe8a0'), faixa: '#ffe8a0' },
    boss: { nome: 'Avatar da Aurora', element: 'raio', scale: 1.9, look: L('#ffe8c0', '#ffffff', '#ffd070', '#ffffff', '#ffd070'), faixa: '#ffd070', cor: '#ffe8a0', meleeEffects: { choque: { stacks: 2 } }, special: { nome: 'Alvorada', clip: 'tormenta2', cooldown: 6, telegraph: 1.0, radius: 5.2, damage: 58, effects: { choque: { stacks: 3 } } } },
  },
  {
    id: 'ilha-oculta', nome: 'Ilha Oculta', x: 0, z: -6180, R: 62, biome: 'oculta', seed: 251, faixa: [2250, 2400], campAngle: 3.6, mar: 3, home: HUB, hidden: true,
    enemy: { nome: 'Eco Esquecido', look: L('#6a5a8a', '#101018', '#2a1a4a', '#1a1028', '#101018'), faixa: '#c084fc' },
    // chefe mundial: corpo enorme e o triplo da vida de um chefe comum
    bossExtra: { hp: Math.round((80 + 16 * 2400) * 3), respawn: 900 },
    boss: { nome: 'Soberano Esquecido', scale: 2.6, look: L('#3a2a5a', '#ffd040', '#2a1a4a', '#ffd040', '#101018'), faixa: '#c084fc', cor: '#c084fc', meleeEffects: { lento: { duration: 2 } }, special: { nome: 'Coroa Esquecida', clip: 'eclipse2', cooldown: 5, telegraph: 1.0, radius: 6, damage: 66, effects: { lento: { duration: 3 } } } },
  },
];

// Enigma da Ilha Oculta: uma pedra rúnica em cada uma de três ilhas; tocar na ordem certa
// ("primeiro a escama, depois o trovão, por fim a aurora") revela a ilha. A dica fica numa
// placa na Capital.
export const ENIGMA = {
  order: ['santuario-escamas', 'tempestade-eterna', 'templo-aurora'],
  hint: 'Primeiro a escama, depois o trovão, por fim a aurora.',
  barrier: 110, // a névoa encantada empurra o bote para longe enquanto a ilha está oculta
};
export function touchRune(state, runa) {
  if (state.revealed) return 'revelada';
  if (runa === state.step) {
    state.step += 1;
    if (state.step >= ENIGMA.order.length) {
      state.revealed = true;
      return 'revelou';
    }
    return 'certa';
  }
  state.step = runa === 0 ? 1 : 0; // errou: recomeça (a primeira pedra já conta de novo)
  return 'errada';
}
