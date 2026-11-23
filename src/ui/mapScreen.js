// Mapa da Ilha em pergaminho: aproximar/afastar, arrastar para mover, nomes das áreas
// (as placas) e a posição do jogador. Mostra a ilha onde o jogador está (cada ilha tem o seu
// campo de alturas local e a origem no mundo).

import { seaOf, SEA_NAMES } from '../islands/secondSea.js';
import { renderIslandImage } from './islandMap.js';

export class MapScreen {
  constructor({ canvas, field, islands, signs, zoomIn, zoomOut, title, seaButton }) {
    this.canvas = canvas;
    this.islands = islands ?? [{ name: 'Ilha de Treino', field, origin: { x: 0, z: 0 } }];
    this.island = this.islands[0];
    this.signs = signs;
    this.title = title;
    this.images = new Map();
    this.mode = 'ilha'; // 'ilha' (a ilha onde o jogador está) ou 'mar' (carta do Primeiro Mar)
    this.seaImages = new Map();
    this.seaButton = seaButton;
    seaButton?.addEventListener('click', () => {
      this.mode = this.mode === 'mar' ? 'ilha' : 'mar';
      this.zoom = 1;
      this.center = this.mode === 'mar' ? this.seaCenter() : { x: this.island.origin.x, z: this.island.origin.z };
      this.updateTitle();
      this.draw();
    });
    this.zoom = 1;
    this.center = { x: 0, z: 0 };
    this.player = { x: 0, z: 0, yaw: 0 };
    zoomIn.addEventListener('click', () => this.setZoom(this.zoom * 1.4));
    zoomOut.addEventListener('click', () => this.setZoom(this.zoom / 1.4));
    const pointers = new Map();
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture?.(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    });
    canvas.addEventListener('pointermove', (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const scale = this.scale();
      this.center.x -= (e.clientX - p.x) * (window.devicePixelRatio || 1) / scale;
      this.center.z -= (e.clientY - p.y) * (window.devicePixelRatio || 1) / scale;
      p.x = e.clientX;
      p.y = e.clientY;
      this.clampCenter();
      this.draw();
    });
    const up = (e) => pointers.delete(e.pointerId);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', (e) => this.setZoom(this.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15)), { passive: true });
  }

  setZoom(z) {
    this.zoom = Math.max(1, Math.min(4, z));
    this.clampCenter();
    this.draw();
  }

  get field() {
    return this.island.field;
  }

  // limites da carta do mar (todas as ilhas)
  seaBounds() {
    let x0 = Infinity;
    let x1 = -Infinity;
    let z0 = Infinity;
    let z1 = -Infinity;
    for (const i of this.seaIslands()) {
      x0 = Math.min(x0, i.origin.x - i.field.half * 0.7);
      x1 = Math.max(x1, i.origin.x + i.field.half * 0.7);
      z0 = Math.min(z0, i.origin.z - i.field.half * 0.7);
      z1 = Math.max(z1, i.origin.z + i.field.half * 0.7);
    }
    // sem ilhas: uma área em volta do jogador
    if (x0 === Infinity) {
      x0 = this.player.x - 200;
      x1 = this.player.x + 200;
      z0 = this.player.z - 200;
      z1 = this.player.z + 200;
    }
    // portões da travessia do mar mostrado entram na carta
    for (const m of this.markers ?? []) {
      if (!m.chart || seaOf(m.z) !== (this.seaNo ?? 1)) continue;
      x0 = Math.min(x0, m.x - 30);
      x1 = Math.max(x1, m.x + 30);
      z0 = Math.min(z0, m.z - 30);
      z1 = Math.max(z1, m.z + 30);
    }
    return { x0, x1, z0, z1 };
  }

  // ilhas do mar onde o jogador está (1: Primeiro Mar, 2: Segundo Mar)
  seaIslands() {
    // um mar ainda sem ilhas (Terceiro Mar até a atualização 28) mostra só portões e o jogador
    return this.islands.filter((i) => (i.mar ?? 1) === (this.seaNo ?? 1) && !i.hidden?.());
  }

  seaCenter() {
    const b = this.seaBounds();
    return { x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2 };
  }

  updateTitle() {
    if (this.title) this.title.lastChild.textContent = this.mode === 'mar' ? `Carta do ${SEA_NAMES[this.seaNo ?? 1]}` : `Mapa · ${this.island.name}`;
    if (this.seaButton) this.seaButton.textContent = this.mode === 'mar' ? 'Mapa da ilha' : 'Carta do mar';
  }

  clampCenter() {
    if (this.mode === 'mar') {
      const b = this.seaBounds();
      const c = this.seaCenter();
      const lx = ((b.x1 - b.x0) / 2) * (1 - 1 / this.zoom);
      const lz = ((b.z1 - b.z0) / 2) * (1 - 1 / this.zoom);
      this.center.x = Math.max(c.x - lx, Math.min(c.x + lx, this.center.x));
      this.center.z = Math.max(c.z - lz, Math.min(c.z + lz, this.center.z));
      return;
    }
    const lim = this.field.half * (1 - 1 / this.zoom);
    const o = this.island.origin;
    this.center.x = Math.max(o.x - lim, Math.min(o.x + lim, this.center.x));
    this.center.z = Math.max(o.z - lim, Math.min(o.z + lim, this.center.z));
  }

  // pixels por unidade do mundo
  scale() {
    const c = this.canvas;
    if (this.mode === 'mar') {
      // a carta ocupa a janela toda (largura e altura), com folga para os nomes
      const b = this.seaBounds();
      return Math.min(c.width / (b.x1 - b.x0 + 60), c.height / (b.z1 - b.z0 + 110)) * this.zoom;
    }
    return (Math.min(c.width, c.height) / (2 * this.field.half)) * this.zoom * 1.1;
  }

  // ilha que contém o ponto (ou a mais próxima)
  islandAt(x, z) {
    let best = this.islands[0];
    let bd = Infinity;
    for (const isl of this.islands) {
      const d = Math.max(Math.abs(x - isl.origin.x), Math.abs(z - isl.origin.z)) - isl.field.half;
      if (d < bd) {
        bd = d;
        best = isl;
      }
    }
    return best;
  }

  open(player) {
    this.seaNo = seaOf(player.z);
    this.island = this.islandAt(player.x, player.z);
    // no mar (fora de todas as ilhas) abre direto a carta do mar
    const i = this.island;
    const atSea = Math.max(Math.abs(player.x - i.origin.x), Math.abs(player.z - i.origin.z)) > i.field.half;
    this.mode = atSea ? 'mar' : 'ilha';
    this.zoom = 1;
    if (!this.images.has(this.island)) this.images.set(this.island, renderIslandImage(this.field, this.island.plan ? 1024 : 768, 'parchment', this.island.plan));
    this.image = this.images.get(this.island);
    this.player = player;
    this.updateTitle();
    this.center = this.mode === 'mar' ? this.seaCenter() : { x: player.x, z: player.z };
    this.clampCenter();
    requestAnimationFrame(() => this.draw());
  }

  draw() {
    const c = this.canvas;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(c.clientWidth * dpr);
    const h = Math.round(c.clientHeight * dpr);
    if (!w || !h) return;
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    const ctx = c.getContext('2d');
    const s = this.scale();
    const toScreen = (x, z) => [w / 2 + (x - this.center.x) * s, h / 2 + (z - this.center.z) * s];
    if (this.mode === 'mar') return this.drawSea(ctx, w, h, s, toScreen, dpr);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#9ccbcb';
    ctx.fillRect(0, 0, w, h);
    const o = this.island.origin;
    const [ox, oy] = toScreen(o.x - this.field.half, o.z - this.field.half);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.image, ox, oy, 2 * this.field.half * s, 2 * this.field.half * s);
    // moldura de pergaminho
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
    g.addColorStop(0, 'rgba(120, 80, 30, 0)');
    g.addColorStop(1, 'rgba(120, 80, 30, 0.45)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // áreas (placas)
    const font = Math.round(13 * dpr * Math.min(1.4, 0.8 + this.zoom * 0.2));
    ctx.font = `700 ${font}px Cinzel, Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    // nomes que se sobrepõem a outro já escrito ficam só com o ponto (aproxime para ver)
    const placed = [];
    // marcadores extras (o bote do jogador), só na ilha mostrada
    for (const m of this.markers ?? []) {
      if (Math.max(Math.abs(m.x - o.x), Math.abs(m.z - o.z)) > this.field.half) continue;
      const [x, y] = toScreen(m.x, m.z);
      ctx.fillStyle = '#8a5a32';
      ctx.strokeStyle = '#fff3d0';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.arc(x, y, 6 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      const tw = ctx.measureText(m.label).width;
      placed.push([x - tw / 2 - 2, y - 8 * dpr - font, x + tw / 2 + 2, y - 8 * dpr]);
      ctx.lineWidth = 4 * dpr;
      ctx.strokeStyle = 'rgba(255, 243, 208, 0.9)';
      ctx.strokeText(m.label, x, y - 8 * dpr);
      ctx.fillStyle = '#5a3a22';
      ctx.fillText(m.label, x, y - 8 * dpr);
    }
    for (const sign of [...this.signs].sort((a, b) => (b.major ? 1 : 0) - (a.major ? 1 : 0))) {
      if (Math.max(Math.abs(sign.x - o.x), Math.abs(sign.z - o.z)) > this.field.half) continue;
      const [x, y] = toScreen(sign.x, sign.z);
      const tw = ctx.measureText(sign.title).width;
      const box = [x - tw / 2 - 2, y - 6 * dpr - font, x + tw / 2 + 2, y - 6 * dpr];
      const free = !placed.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]);
      if (free) placed.push(box);
      ctx.fillStyle = '#7a2a20';
      ctx.strokeStyle = '#fff3d0';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.arc(x, y, 4 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (!free) continue;
      ctx.lineWidth = 4 * dpr;
      ctx.strokeStyle = 'rgba(255, 243, 208, 0.9)';
      ctx.strokeText(sign.title, x, y - 6 * dpr);
      ctx.fillStyle = '#4a2a10';
      ctx.fillText(sign.title, x, y - 6 * dpr);
    }
    this.drawPlayer(ctx, toScreen, dpr);
  }

  // Carta do Primeiro Mar: todas as ilhas com nome e faixa de nível, o bote e o jogador
  drawSea(ctx, w, h, s, toScreen, dpr) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#8fc2c8';
    ctx.fillRect(0, 0, w, h);
    // linhas da grade náutica
    ctx.strokeStyle = 'rgba(74, 42, 16, 0.18)';
    ctx.lineWidth = 1 * dpr;
    for (let g = -2000; g <= 2000; g += 200) {
      const [gx] = toScreen(g, 0);
      const [, gy] = toScreen(0, g);
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }
    ctx.imageSmoothingEnabled = true;
    const font = Math.round(10.5 * dpr * Math.min(1.5, 0.85 + this.zoom * 0.2));
    ctx.textAlign = 'center';
    for (const i of this.seaIslands()) {
      if (!this.seaImages.has(i)) this.seaImages.set(i, renderIslandImage(i.field, 192, 'carta', i.plan));
      const [ox, oy] = toScreen(i.origin.x - i.field.half, i.origin.z - i.field.half);
      const size = 2 * i.field.half * s;
      ctx.drawImage(this.seaImages.get(i), ox, oy, size, size);
    }
    // nomes: tenta embaixo, em cima, à direita e à esquerda da ilha, sem cobrir outro nome
    // nem o jogador; se nada couber, fica o lugar com menos sobreposição
    // (a seta do jogador é desenhada por cima e não empurra os nomes para longe da ilha)
    const placed = [];
    const small = Math.round(font * 0.8);
    const hits = (b) => placed.reduce((n, p) => n + Math.max(0, Math.min(b[2], p[2]) - Math.max(b[0], p[0])) * Math.max(0, Math.min(b[3], p[3]) - Math.max(b[1], p[1])), 0);
    ctx.textBaseline = 'top';
    for (const i of this.seaIslands()) {
      ctx.font = `700 ${font}px Cinzel, Georgia, serif`;
      const tw = Math.max(ctx.measureText(i.name).width, i.faixa ? (ctx.font = `800 ${small}px Inter, sans-serif`, ctx.measureText(i.faixa).width) : 0) + 6 * dpr;
      const th = font * 1.1 + (i.faixa ? small * 1.1 : 0);
      const land = i.field.half * 0.62 * s; // raio aproximado da terra na tela
      const [cx, cy] = toScreen(i.origin.x, i.origin.z);
      const options = [
        [cx, cy + land + 2 * dpr],
        [cx, cy - land - th - 2 * dpr],
        [cx + land + tw / 2 + 4 * dpr, cy - th / 2],
        [cx - land - tw / 2 - 4 * dpr, cy - th / 2],
        [cx + tw * 0.4, cy + land + 2 * dpr],
        [cx - tw * 0.4, cy + land + 2 * dpr],
        [cx + tw * 0.4, cy - land - th - 2 * dpr],
        [cx - tw * 0.4, cy - land - th - 2 * dpr],
      ];
      let best = null;
      for (const [x, y] of options) {
        const b = [x - tw / 2, y, x + tw / 2, y + th];
        const out = (b[0] < 0 || b[2] > w || b[1] < 0 || b[3] > h) ? 1e9 : 0;
        const cost = hits(b) + out;
        if (!best || cost < best.cost) best = { x, y, b, cost };
        if (cost === 0) break;
      }
      placed.push(best.b);
      const { x, y } = best;
      ctx.font = `700 ${font}px Cinzel, Georgia, serif`;
      ctx.lineWidth = 4 * dpr;
      ctx.strokeStyle = 'rgba(255, 243, 208, 0.92)';
      ctx.strokeText(i.name, x, y);
      ctx.fillStyle = '#4a2a10';
      ctx.fillText(i.name, x, y);
      if (i.faixa) {
        ctx.font = `800 ${small}px Inter, sans-serif`;
        ctx.strokeText(i.faixa, x, y + font * 1.1);
        ctx.fillStyle = '#7a2a20';
        ctx.fillText(i.faixa, x, y + font * 1.1);
      }
    }
    for (const m of this.markers ?? []) {
      const [x, y] = toScreen(m.x, m.z);
      ctx.fillStyle = m.color ?? '#8a5a32';
      ctx.strokeStyle = '#fff3d0';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.arc(x, y, 5 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (m.chart) {
        ctx.font = `800 ${Math.round(font * 0.8)}px Inter, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.lineWidth = 3 * dpr;
        ctx.strokeText(m.label, x, y + 7 * dpr);
        ctx.fillStyle = '#7a4a10';
        ctx.fillText(m.label, x, y + 7 * dpr);
      }
    }
    this.drawPlayer(ctx, toScreen, dpr);
  }

  drawPlayer(ctx, toScreen, dpr) {
    const [px, py] = toScreen(this.player.x, this.player.z);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.PI - this.player.yaw);
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ff9b79';
    ctx.strokeStyle = '#3b1209';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(9, 9);
    ctx.lineTo(0, 4);
    ctx.lineTo(-9, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.font = `800 ${Math.round(11 * dpr)}px Inter, sans-serif`;
    ctx.fillStyle = '#3b1209';
    ctx.textBaseline = 'top';
    ctx.fillText('Você', px, py + 12 * dpr);
  }
}
