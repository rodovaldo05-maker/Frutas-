// Sombras mais leves para NPCs, moradores e inimigos (revisão de desempenho): cada corpo tem
// ~37 peças e cada peça que projeta sombra é desenhada de novo no mapa de sombras. Só as
// peças grandes (tronco, cintura, cabeça e coxas) projetam; o rosto, mãos e pés não.
const BIG = ['tronco', 'cintura', 'cabeca', 'coxa_E', 'coxa_D'];
// Distâncias do nível de detalhe dos personagens: além de LOD_FAR o corpo não é desenhado; além
// de LOD_FACE o rosto fica só com o cabelo
export const LOD_FAR = 80;
export const LOD_FACE = 24;

export function trimShadows(body) {
  body.root.traverse((o) => {
    if (o.isMesh) o.castShadow = false;
  });
  for (const id of BIG) if (body.meshes[id]) body.meshes[id].castShadow = true;
}
