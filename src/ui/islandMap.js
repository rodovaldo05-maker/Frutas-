// Imagens da ilha tiradas do relevo: uma colorida para o minimapa e uma em pergaminho
// para o Mapa da Ilha. Norte (-z) fica para cima.

import { smooth } from '../core/math.js';

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

const MINI = {
  deep: hex('#1d5a78'), shallow: hex('#43b3b6'), sand: hex('#e6d39a'), grass: hex('#6c9a56'), high: hex('#93b678'), rock: hex('#8d9088'),
};
const PARCH = {
  deep: hex('#6aa7b7'), shallow: hex('#a8d4cf'), land: hex('#ecd9a6'), high: hex('#d8bd84'), rock: hex('#bfa16b'), line: hex('#7a5524'),
};

export function renderIslandImage(field, size, style = 'mini') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  const half = field.half;
  const step = (2 * half) / size;
  const heights = new Float32Array(size * size);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) heights[j * size + i] = field.sample(-half + (i + 0.5) * step, -half + (j + 0.5) * step);
  }
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const h = heights[j * size + i];
      const x = -half + (i + 0.5) * step;
      const z = -half + (j + 0.5) * step;
      const up = field.normal(x, z).y;
      let c;
      if (style === 'mini') {
        if (h < 0) c = mix(MINI.deep, MINI.shallow, smooth(-8, 0, h));
        else if (h < 1.7) c = mix(MINI.sand, MINI.grass, smooth(1.2, 1.7, h));
        else c = mix(MINI.grass, MINI.high, smooth(2, 16, h));
        if (h > 0 && up < 0.72) c = mix(c, MINI.rock, 0.75);
        // sombra de relevo vinda do noroeste
        const hl = heights[j * size + Math.max(0, i - 1)];
        const hu = heights[Math.max(0, j - 1) * size + i];
        const shade = Math.max(-0.25, Math.min(0.25, (hl + hu - 2 * h) * 0.12));
        if (h > 0) c = c.map((v) => v * (1 + shade));
      } else {
        if (h < 0) {
          c = mix(PARCH.deep, PARCH.shallow, smooth(-9, 0, h));
          // traços de onda
          if ((i + Math.floor(j / 7) * 5) % 23 < 5 && j % 7 === 0 && h < -2) c = mix(c, PARCH.line, 0.25);
        } else {
          c = mix(PARCH.land, PARCH.high, smooth(2, 16, h));
          if (up < 0.72) c = mix(c, PARCH.rock, 0.6);
          // curvas de nível
          const hl = heights[j * size + Math.max(0, i - 1)];
          const hu = heights[Math.max(0, j - 1) * size + i];
          if (Math.floor(hl / 2) !== Math.floor(h / 2) || Math.floor(hu / 2) !== Math.floor(h / 2)) c = mix(c, PARCH.line, 0.35);
        }
        // linha da costa
        const hl = heights[j * size + Math.max(0, i - 1)];
        const hu = heights[Math.max(0, j - 1) * size + i];
        if ((hl < 0) !== (h < 0) || (hu < 0) !== (h < 0)) c = PARCH.line;
      }
      const k = (j * size + i) * 4;
      img.data[k] = c[0];
      img.data[k + 1] = c[1];
      img.data[k + 2] = c[2];
      img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

// Minimapa: norte para cima, jogador no centro
export class Minimap {
  constructor(canvas, field, signs) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.field = field;
    this.signs = signs;
    this.image = renderIslandImage(field, 384, 'mini');
    this.range = 42; // raio visível em unidades do mundo
  }

  draw(pos, yaw) {
    const { ctx, canvas, field } = this;
    const w = canvas.width;
    const r = w / 2;
    const ppu = r / this.range; // pixels por unidade
    const ipu = this.image.width / (2 * field.half);
    ctx.save();
    ctx.clearRect(0, 0, w, w);
    ctx.beginPath();
    ctx.arc(r, r, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#1d5a78';
    ctx.fillRect(0, 0, w, w);
    ctx.imageSmoothingEnabled = true;
    const sx = (pos.x + field.half) * ipu;
    const sz = (pos.z + field.half) * ipu;
    ctx.translate(r, r);
    ctx.scale(ppu / ipu, ppu / ipu);
    ctx.drawImage(this.image, -sx, -sz);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // placas
    for (const s of this.signs) {
      const x = r + (s.x - pos.x) * ppu;
      const y = r + (s.z - pos.z) * ppu;
      if (Math.hypot(x - r, y - r) > r - 6) continue;
      ctx.fillStyle = '#ffd36b';
      ctx.strokeStyle = '#3b250b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x + 5, y);
      ctx.lineTo(x, y + 6);
      ctx.lineTo(x - 5, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // jogador: seta na direção em que olha
    ctx.translate(r, r);
    ctx.rotate(Math.PI - yaw); // (sen, cos) do rumo no plano x/z
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#7a2a20';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(10, 10);
    ctx.lineTo(0, 5);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  }
}
