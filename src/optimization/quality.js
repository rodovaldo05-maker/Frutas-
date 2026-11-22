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
    this.fixedScale = null; // escala de resolução fixa (ajuste do jogador) ou null (automática)
    this.targetMs = 1000 / 60; // tempo de quadro alvo (60 ou 30 qps)
    this.apply(initial);
  }

  apply(mode) {
    this.mode = mode;
    if (mode === 'auto') {
      const touch = window.matchMedia('(pointer: coarse)').matches;
      this.renderer.setQuality(touch ? 'media' : 'alta');
    } else {
      this.renderer.setQuality(mode);
    }
    this.renderer.setResolutionScale(this.fixedScale ?? 1);
  }

  setFixedScale(scale) {
    this.fixedScale = scale;
    this.renderer.setResolutionScale(scale ?? 1);
  }

  setTarget(fps) {
    this.targetMs = 1000 / fps;
    this.slowTime = 0;
    this.fastTime = 0;
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

    // lento: 45% acima do alvo; folga: abaixo de 78% do alvo de 60 qps (com limite de 30 qps
    // o quadro sempre dura ~33 ms e a qualidade só desce)
    if (avg > this.targetMs * 1.45) {
      this.slowTime += 0.5;
      this.fastTime = 0;
    } else if (avg < 13 && this.targetMs < 20) {
      this.fastTime += 0.5;
      this.slowTime = 0;
    } else {
      this.slowTime = 0;
      this.fastTime = 0;
    }
    const r = this.renderer;
    if (this.slowTime >= 4) {
      this.slowTime = 0;
      if (this.fixedScale === null && r.resolutionScale > 0.65) r.setResolutionScale(r.resolutionScale - 0.15);
      else {
        const i = ORDER.indexOf(r.qualityId);
        if (i > 0) {
          r.setQuality(ORDER[i - 1]);
          r.setResolutionScale(this.fixedScale ?? 1);
        }
      }
    } else if (this.fastTime >= 10) {
      this.fastTime = 0;
      if (this.fixedScale === null && r.resolutionScale < 1) r.setResolutionScale(r.resolutionScale + 0.15);
      else {
        const i = ORDER.indexOf(r.qualityId);
        if (i < ORDER.length - 1) r.setQuality(ORDER[i + 1]);
      }
    }
  }
}
