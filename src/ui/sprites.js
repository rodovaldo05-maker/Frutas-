// Ícones desenhados (folhas geradas fora e recortadas em src/assets/icons): materiais,
// equipamentos e frutas. Substituem os emojis (que mudam de desenho em cada Android) e os
// quadrados de cor. Vite gera URLs com hash, que funcionam no navegador e no APK.

const files = import.meta.glob('../assets/icons/*.webp', { eager: true, query: '?url', import: 'default' });
const url = (name) => files[`../assets/icons/${name}.webp`] ?? null;

export const materialUrl = (id) => url(`mat-${id}`);
export const itemUrl = (id) => url(`item-${id}`);
export const fruitUrl = (id) => url(`fruta-${id}`);

// <img> pronto para o HTML das janelas (cai no texto/emoji se o ícone não existir)
export function materialIcon(id, fallback = '') {
  const u = materialUrl(id);
  return u ? `<img class="spr" src="${u}" alt="" draggable="false">` : fallback;
}
export function itemIcon(id) {
  const u = itemUrl(id);
  return u ? `<img class="spr" src="${u}" alt="" draggable="false">` : '';
}
