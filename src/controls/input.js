// Entradas: toque (joystick flutuante, arrastar para girar a câmera, botões), teclado e
// mouse, e controle (Gamepad API). Tudo funciona ao mesmo tempo (doc 10, seção 8).
// Apertos de botão ficam guardados até o próximo passo da simulação usar.

const DEAD = 0.12;

export class Input {
  constructor({ canvas, touchRoot, buttons, stick }) {
    this.canvas = canvas;
    this.keys = new Set();
    this.move = { x: 0, y: 0 };
    this.lookDelta = { x: 0, y: 0 };
    this.zoomDelta = 0;
    this.held = { jump: false, crouch: false };
    this.pressed = { jump: false, crouch: false, dash: false };
    this.sprint = false;
    this.stillTime = 0;
    this.touchMove = { x: 0, y: 0, active: false };
    this.padMove = { x: 0, y: 0 };
    this.padPrev = [];
    this.enabled = true;
    this.onPause = () => {};
    this.onToggleDebug = () => {};
    this.onSprintChange = () => {};
    this.onToggleGlider = () => {};
    this.usingTouch = window.matchMedia('(pointer: coarse)').matches;
    this.stick = stick;
    this.buttons = buttons;
    this.bindKeyboard();
    this.bindPointer(touchRoot);
    this.bindButtons(buttons);
  }

  // ===== Teclado e mouse =====
  bindKeyboard() {
    const code = (e) => e.code;
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const c = code(e);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(c)) e.preventDefault();
      this.keys.add(c);
      if (!this.enabled && c !== 'Escape') return;
      if (c === 'Space') this.press('jump');
      if (c === 'ShiftLeft' || c === 'ShiftRight') this.pressed.dash = true;
      if (c === 'KeyC') this.press('crouch');
      if (c === 'ControlLeft' || c === 'ControlRight') this.toggleSprint();
      if (c === 'Escape') this.onPause();
      if (c === 'KeyU') this.onToggleGlider();
      if (c === 'F3') {
        e.preventDefault();
        this.onToggleDebug();
      }
    });
    window.addEventListener('keyup', (e) => {
      const c = code(e);
      this.keys.delete(c);
      if (c === 'Space') this.held.jump = false;
      if (c === 'KeyC') this.held.crouch = false;
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.held.jump = this.held.crouch = false;
    });
  }

  press(name) {
    this.held[name] = true;
    this.pressed[name] = true;
  }

  toggleSprint(on = !this.sprint) {
    this.sprint = on;
    this.onSprintChange(on);
  }

  // ===== Toque e arrasto =====
  bindPointer(root) {
    const pointers = new Map();
    const stick = this.stick;
    const radius = 62;
    const showStick = (x, y) => {
      stick.base.style.transform = `translate(${x - 70}px, ${y - 70}px)`;
      stick.base.classList.add('on');
      stick.knob.style.transform = 'translate(0px, 0px)';
    };
    root.addEventListener('pointerdown', (e) => {
      if (!this.enabled || e.target.closest('[data-btn]')) return;
      root.setPointerCapture?.(e.pointerId);
      const leftSide = e.clientX < window.innerWidth * 0.42;
      if (e.pointerType !== 'mouse' && leftSide && ![...pointers.values()].some((p) => p.kind === 'stick')) {
        pointers.set(e.pointerId, { kind: 'stick', ox: e.clientX, oy: e.clientY });
        showStick(e.clientX, e.clientY);
        this.touchMove.active = true;
        this.usingTouch = true;
      } else {
        pointers.set(e.pointerId, { kind: 'look', x: e.clientX, y: e.clientY });
      }
    });
    root.addEventListener('pointermove', (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      if (p.kind === 'stick') {
        let dx = e.clientX - p.ox;
        let dy = e.clientY - p.oy;
        const len = Math.hypot(dx, dy);
        if (len > radius) {
          // o joystick acompanha o dedo quando passa do limite
          p.ox += (dx / len) * (len - radius);
          p.oy += (dy / len) * (len - radius);
          dx = e.clientX - p.ox;
          dy = e.clientY - p.oy;
          stick.base.style.transform = `translate(${p.ox - 70}px, ${p.oy - 70}px)`;
        }
        stick.knob.style.transform = `translate(${dx}px, ${dy}px)`;
        const m = Math.min(1, Math.hypot(dx, dy) / radius);
        const a = Math.atan2(dy, dx);
        const mag = m < DEAD ? 0 : (m - DEAD) / (1 - DEAD);
        this.touchMove.x = Math.cos(a) * mag;
        this.touchMove.y = -Math.sin(a) * mag;
      } else {
        this.lookDelta.x += e.clientX - p.x;
        this.lookDelta.y += e.clientY - p.y;
        p.x = e.clientX;
        p.y = e.clientY;
      }
    });
    const end = (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      pointers.delete(e.pointerId);
      if (p.kind === 'stick') {
        this.touchMove.x = this.touchMove.y = 0;
        this.touchMove.active = false;
        stick.base.classList.remove('on');
      }
    };
    root.addEventListener('pointerup', end);
    root.addEventListener('pointercancel', end);
    root.addEventListener('lostpointercapture', end);
    root.addEventListener('wheel', (e) => {
      this.zoomDelta += Math.sign(e.deltaY) * 0.08;
    }, { passive: true });
    root.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  bindButtons(buttons) {
    const hold = (el, down, up) => {
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        el.setPointerCapture?.(e.pointerId);
        el.classList.add('down');
        if (this.enabled) down();
      });
      const release = () => {
        el.classList.remove('down');
        up?.();
      };
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
      el.addEventListener('lostpointercapture', release);
    };
    hold(buttons.jump, () => this.press('jump'), () => (this.held.jump = false));
    hold(buttons.dash, () => (this.pressed.dash = true));
    hold(buttons.crouch, () => this.press('crouch'), () => (this.held.crouch = false));
    hold(buttons.sprint, () => this.toggleSprint());
    hold(buttons.menu, () => this.onPause());
    if (buttons.glider) hold(buttons.glider, () => this.onToggleGlider());
  }

  // ===== Controle =====
  pollGamepad() {
    const pads = navigator.getGamepads?.() || [];
    const pad = [...pads].find((p) => p && p.connected);
    if (!pad) {
      this.padMove.x = this.padMove.y = 0;
      return;
    }
    const axis = (i) => {
      const v = pad.axes[i] || 0;
      return Math.abs(v) < 0.15 ? 0 : (v - Math.sign(v) * 0.15) / 0.85;
    };
    this.padMove.x = axis(0);
    this.padMove.y = -axis(1);
    this.lookDelta.x += axis(2) * 14;
    this.lookDelta.y += axis(3) * 10;
    const btn = (i) => !!pad.buttons[i]?.pressed;
    const edge = (i) => btn(i) && !this.padPrev[i];
    if (this.enabled) {
      if (edge(0)) this.press('jump');
      if (edge(1)) this.pressed.dash = true;
      if (edge(11)) this.press('crouch');
      if (edge(10)) this.toggleSprint();
    }
    if (edge(9)) this.onPause();
    if (!btn(0) && this.padPrev[0]) this.held.jump = false;
    if (!btn(11) && this.padPrev[11]) this.held.crouch = false;
    this.padPrev = pad.buttons.map((b) => b.pressed);
    this.hasPad = true;
  }

  // Lê o estado para um quadro (direção e câmera)
  frame(dt) {
    this.pollGamepad();
    let x = 0;
    let y = 0;
    const k = this.keys;
    if (this.enabled) {
      if (k.has('KeyW') || k.has('ArrowUp')) y += 1;
      if (k.has('KeyS') || k.has('ArrowDown')) y -= 1;
      if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
      if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
      // Alt anda devagar no teclado
      const slow = k.has('AltLeft') ? 0.5 : 1;
      const kl = Math.hypot(x, y);
      if (kl > 0) {
        x = (x / kl) * slow;
        y = (y / kl) * slow;
      }
      x += this.touchMove.x + this.padMove.x;
      y += this.touchMove.y + this.padMove.y;
    }
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    this.move.x = x;
    this.move.y = y;
    // o Correr desliga sozinho depois de parar um tempo
    if (len < 0.1) {
      this.stillTime += dt;
      if (this.sprint && this.stillTime > 0.9) this.toggleSprint(false);
    } else this.stillTime = 0;
    const look = { ...this.lookDelta };
    this.lookDelta.x = this.lookDelta.y = 0;
    const zoom = this.zoomDelta;
    this.zoomDelta = 0;
    return { look, zoom };
  }

  // Estado para um passo da simulação; os apertos são consumidos
  consume(camYaw) {
    const out = {
      moveX: this.move.x,
      moveY: this.move.y,
      camYaw,
      jump: this.held.jump,
      crouch: this.held.crouch,
      jumpPressed: this.pressed.jump,
      crouchPressed: this.pressed.crouch,
      dashPressed: this.pressed.dash,
      sprint: this.sprint,
    };
    this.pressed.jump = this.pressed.crouch = this.pressed.dash = false;
    return out;
  }

  releaseAll() {
    this.keys.clear();
    this.held.jump = this.held.crouch = false;
    this.pressed.jump = this.pressed.crouch = this.pressed.dash = false;
    this.touchMove.x = this.touchMove.y = 0;
  }
}
