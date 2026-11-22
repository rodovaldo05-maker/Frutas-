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
    this.held = { jump: false, crouch: false, block: false };
    this.pressed = { jump: false, crouch: false, dash: false, attack: false, skill: -1, equip: -1, race: false, armor: false, sense: false, form: false };
    this.blockSources = new Set(); // teclado, mouse, botão de toque e controle
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
      if (c === 'ControlLeft' || c === 'ControlRight') this.press('crouch');
      if (c === 'KeyR') this.toggleSprint();
      if (c === 'Escape') this.onPause();
      if (c === 'KeyU') this.onToggleGlider();
      if (c === 'KeyJ') this.pressed.attack = true;
      if (c === 'KeyF') this.pressed.race = true;
      if (c === 'KeyH') this.pressed.form = true; // forma híbrida (frutas de fera)
      if (c === 'KeyG') this.pressed.armor = true;
      if (c === 'KeyH') this.pressed.sense = true;
      if (/^Digit[1-4]$/.test(c)) this.pressed.equip = Number(c.slice(-1)) - 1;
      const skill = { KeyZ: 0, KeyX: 1, KeyC: 2, KeyV: 3 }[c];
      if (skill !== undefined) this.pressed.skill = skill;
      if (c === 'KeyK' || c === 'KeyQ') this.setBlock('key', true);
      if (c === 'F3') {
        e.preventDefault();
        this.onToggleDebug();
      }
    });
    window.addEventListener('keyup', (e) => {
      const c = code(e);
      this.keys.delete(c);
      if (c === 'Space') this.held.jump = false;
      if (c === 'ControlLeft' || c === 'ControlRight') this.held.crouch = false;
      if (c === 'KeyK' || c === 'KeyQ') this.setBlock('key', false);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.held.jump = this.held.crouch = false;
      this.blockSources.clear();
      this.held.block = false;
    });
  }

  // Defender fica segurado enquanto qualquer fonte segura
  setBlock(source, on) {
    if (on && this.enabled) this.blockSources.add(source);
    else this.blockSources.delete(source);
    this.held.block = this.blockSources.size > 0;
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
      // mouse: botão direito defende; clique esquerdo sem arrastar ataca
      if (e.pointerType === 'mouse' && e.button === 2) {
        pointers.set(e.pointerId, { kind: 'block' });
        this.setBlock('mouse', true);
        return;
      }
      // segundo dedo logo depois do primeiro, sem o joystick ter andado: vira pinça (zoom)
      let pinchStart = false;
      if (e.pointerType !== 'mouse') {
        const stickP = [...pointers.entries()].find(([, p]) => p.kind === 'stick');
        if (stickP && performance.now() - stickP[1].at < 300 && Math.hypot(this.touchMove.x, this.touchMove.y) < 0.05) {
          const [id, p] = stickP;
          pointers.set(id, { kind: 'look', x: p.ox, y: p.oy, sx: p.ox, sy: p.oy, at: p.at, mouse: false });
          this.touchMove.x = this.touchMove.y = 0;
          this.touchMove.active = false;
          stick.base.classList.remove('on');
          pinchStart = true;
        }
      }
      if (e.pointerType !== 'mouse' && leftSide && !pinchStart && ![...pointers.values()].some((p) => p.kind === 'stick')) {
        pointers.set(e.pointerId, { kind: 'stick', ox: e.clientX, oy: e.clientY, at: performance.now() });
        showStick(e.clientX, e.clientY);
        this.touchMove.active = true;
        this.usingTouch = true;
      } else {
        pointers.set(e.pointerId, { kind: 'look', x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, at: performance.now(), mouse: e.pointerType === 'mouse' });
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
        // dois dedos girando a câmera = pinça: afastar aproxima, juntar afasta (zoom)
        const looks = [...pointers.values()].filter((q) => q.kind === 'look' && !q.mouse);
        if (looks.length >= 2) {
          const [a, b] = looks;
          const before = Math.hypot(a.x - b.x, a.y - b.y);
          p.x = e.clientX;
          p.y = e.clientY;
          const after = Math.hypot(a.x - b.x, a.y - b.y);
          this.zoomDelta += (before - after) * 0.0045;
          for (const q of looks) q.pinch = true; // não vira ataque ao soltar
          return;
        }
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
      if (p.kind === 'block') this.setBlock('mouse', false);
      // toque rápido na tela (ou clique sem arrastar) = Atacar; arrastar só gira a câmera
      if (p.kind === 'look' && !p.pinch && e.type === 'pointerup' && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < (p.mouse ? 6 : 12) && performance.now() - p.at < (p.mouse ? 350 : 280)) {
        this.pressed.attack = true;
      }
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
    if (buttons.attack) hold(buttons.attack, () => (this.pressed.attack = true));
    if (buttons.race) hold(buttons.race, () => (this.pressed.race = true));
    if (buttons.armor) hold(buttons.armor, () => (this.pressed.armor = true));
    if (buttons.form) hold(buttons.form, () => (this.pressed.form = true));
    if (buttons.sense) hold(buttons.sense, () => (this.pressed.sense = true));
    (buttons.equip || []).forEach((el, i) => el && hold(el, () => (this.pressed.equip = i)));
    // linhas de habilidade mudam com o item equipado: escuta no contêiner
    if (buttons.skillRows) {
      buttons.skillRows.addEventListener('pointerdown', (e) => {
        const row = e.target.closest('[data-skill]');
        if (!row || !this.enabled) return;
        e.preventDefault();
        row.classList.add('down');
        setTimeout(() => row.classList.remove('down'), 160);
        this.pressed.skill = Number(row.dataset.skill);
      });
    }
    if (buttons.block) hold(buttons.block, () => this.setBlock('touch', true), () => this.setBlock('touch', false));
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
      if (edge(2) || edge(7)) this.pressed.attack = true;
      if (edge(14)) this.pressed.skill = 0;
      if (edge(12)) this.pressed.skill = 1;
      if (edge(15)) this.pressed.skill = 2;
      if (edge(13)) this.pressed.skill = 3;
      if (edge(4)) this.pressed.equip = 9; // LB: próximo item
      if (edge(8)) this.pressed.race = true; // Back: habilidade da raça
    }
    this.setBlock('pad', this.enabled && (btn(5) || btn(6)));
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
      attackPressed: this.pressed.attack,
      skill: this.pressed.skill,
      equip: this.pressed.equip,
      racePressed: this.pressed.race,
      formPressed: this.pressed.form,
      armorPressed: this.pressed.armor,
      sensePressed: this.pressed.sense,
      block: this.held.block,
      sprint: this.sprint,
    };
    this.pressed.jump = this.pressed.crouch = this.pressed.dash = this.pressed.attack = false;
    this.pressed.skill = -1;
    this.pressed.equip = -1;
    this.pressed.race = false;
    this.pressed.form = false;
    this.pressed.armor = this.pressed.sense = false;
    return out;
  }

  releaseAll() {
    this.keys.clear();
    this.held.jump = this.held.crouch = false;
    this.pressed.jump = this.pressed.crouch = this.pressed.dash = this.pressed.attack = false;
    this.blockSources.clear();
    this.held.block = false;
    this.touchMove.x = this.touchMove.y = 0;
  }
}
