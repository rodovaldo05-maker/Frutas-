// Laço principal: simulação em passo fixo (60 Hz) e renderização interpolada.
// Se um quadro demorar demais, no máximo MAX_STEPS passos são simulados
// (evita a "espiral da morte" em aparelhos lentos).

export const STEP = 1 / 60;
const MAX_STEPS = 3;

export class Loop {
  constructor({ update, render }) {
    this.update = update;
    this.render = render;
    this.accumulator = 0;
    this.last = 0;
    this.running = false;
    this.paused = false;
    this.frame = this.frame.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
  }

  frame(now) {
    if (!this.running) return;
    // Nunca negativo (o carimbo do primeiro quadro pode vir antes de "last")
    const dt = Math.min(0.25, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    if (!this.paused) {
      this.accumulator += dt;
      let steps = 0;
      while (this.accumulator >= STEP && steps < MAX_STEPS) {
        this.update(STEP);
        this.accumulator -= STEP;
        steps += 1;
      }
      if (steps === MAX_STEPS) this.accumulator = 0;
    }
    this.render(this.paused ? 0 : this.accumulator / STEP, dt);
    requestAnimationFrame(this.frame);
  }
}
