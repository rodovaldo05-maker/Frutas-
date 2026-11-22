// Mapa da Ilha em pergaminho: aproximar/afastar, arrastar para mover, nomes das áreas
// (as placas) e a posição do jogador. Mostra a ilha onde o jogador está (cada ilha tem o seu
// campo de alturas local e a origem no mundo).

import { renderIslandImage } from './islandMap.js';

export class MapScreen {
  constructor({ canvas, field, islands, signs, zoomIn, zoomOut, title }) {
    this.canvas = canvas;
    this.islands = islands ?? [{ name: 'Ilha de Treino', field, origin: { x: 0, z: 0 } }];
    this.island = this.islands[0];
    this.signs = signs;
    this.title = title;
    this.images = new Map();
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

  clampCenter() {
    const lim = this.field.half * (1 - 1 / this.zoom);
    const o = this.island.origin;
    this.center.x = Math.max(o.x - lim, Math.min(o.x + lim, this.center.x));
    this.center.z = Math.max(o.z - lim, Math.min(o.z + lim, this.center.z));
  }

  // pixels por unidade do mundo
  scale() {
    const c = this.canvas;
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
    this.island = this.islandAt(player.x, player.z);
    if (!this.images.has(this.island)) this.images.set(this.island, renderIslandImage(this.field, this.island.plan ? 1024 : 768, 'parchment', this.island.plan));
    this.image = this.images.get(this.island);
    if (this.title) this.title.lastChild.textContent = `Mapa · ${this.island.name}`;
    this.player = player;
    this.center = { x: player.x, z: player.z };
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
    // jogador
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
