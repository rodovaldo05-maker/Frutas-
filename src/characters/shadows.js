// Corpo leve para NPCs, moradores e inimigos: as peças rígidas viram uma malha só
// (mergeBody, atualização 15), que projeta sombra numa chamada de desenho.
import { mergeBody } from './mergeBody.js';

// Distâncias do nível de detalhe dos personagens: além de LOD_FAR o corpo não é desenhado; além
// de LOD_FACE o rosto fica só com o cabelo
export const LOD_FAR = 80;
export const LOD_FACE = 24;

export function trimShadows(body) {
  body.root.traverse((o) => {
    if (o.isMesh) o.castShadow = false;
  });
  mergeBody(body);
}
