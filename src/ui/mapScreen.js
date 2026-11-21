// Mapa da Ilha em pergaminho: aproximar/afastar, arrastar para mover, nomes das áreas
// (as placas) e a posição do jogador.

import { renderIslandImage } from './islandMap.js';

export class MapScreen {
  constructor({ canvas, field, signs, zoomIn, zoomOut }) {
    this.canvas = canvas;
    this.field = field;
    this.signs = signs;
    this.image = null;
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

  clampCenter() {
    const lim = this.field.half * (1 - 1 / this.zoom);
    this.center.x = Math.max(-lim, Math.min(lim, this.center.x));
    this.center.z = Math.max(-lim, Math.min(lim, this.center.z));
  }

  // pixels por unidade do mundo
  scale() {
    const c = this.canvas;
    return (Math.min(c.width, c.height) / (2 * this.field.half)) * this.zoom * 1.1;
  }

  open(player) {
    if (!this.image) this.image = renderIslandImage(this.field, 768, 'parchment');
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
    const [ox, oy] = toScreen(-this.field.half, -this.field.half);
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
    for (const sign of this.signs) {
      const [x, y] = toScreen(sign.x, sign.z);
      ctx.fillStyle = '#7a2a20';
      ctx.strokeStyle = '#fff3d0';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.arc(x, y, 4 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
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
