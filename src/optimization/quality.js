// Qualidade automática: mede o tempo de quadro e ajusta perfil e resolução.
// Regra: média acima de 24 ms (≈ 42 qps) por 4 s desce; abaixo de 13 ms por 10 s sobe.

const ORDER = ['leve', 'media', 'alta'];

export class AutoQuality {
  constructor(renderer, initial = 'auto') {
    this.renderer = renderer;
    this.mode = initial; // 'auto' ou um perfil fixo
    this.samples = [];
    this.timer = 0;
    this.slowTime = 0;
    this.fastTime = 0;
    this.fps = 60;
    this.frameMs = 16.7;
    this.apply(initial);
  }

  apply(mode) {
    this.mode = mode;
    if (mode === 'auto') {
      const touch = window.matchMedia('(pointer: coarse)').matches;
      this.renderer.setQuality(touch ? 'media' : 'alta');
    } else {
      this.renderer.setQuality(mode);
      this.renderer.setResolutionScale(1);
    }
  }

  sample(dt) {
    if (dt <= 0) return;
    this.samples.push(dt * 1000);
    if (this.samples.length > 60) this.samples.shift();
    this.timer += dt;
    if (this.timer < 0.5) return;
    this.timer = 0;
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    this.frameMs = avg;
    this.fps = Math.round(1000 / avg);
    if (this.mode !== 'auto') return;

    if (avg > 24) {
      this.slowTime += 0.5;
      this.fastTime = 0;
    } else if (avg < 13) {
      this.fastTime += 0.5;
      this.slowTime = 0;
    } else {
      this.slowTime = 0;
      this.fastTime = 0;
    }
    const r = this.renderer;
    if (this.slowTime >= 4) {
      this.slowTime = 0;
      if (r.resolutionScale > 0.65) r.setResolutionScale(r.resolutionScale - 0.15);
      else {
        const i = ORDER.indexOf(r.qualityId);
        if (i > 0) {
          r.setQuality(ORDER[i - 1]);
          r.setResolutionScale(1);
        }
      }
    } else if (this.fastTime >= 10) {
      this.fastTime = 0;
      if (r.resolutionScale < 1) r.setResolutionScale(r.resolutionScale + 0.15);
      else {
        const i = ORDER.indexOf(r.qualityId);
        if (i < ORDER.length - 1) r.setQuality(ORDER[i + 1]);
      }
    }
  }
}
