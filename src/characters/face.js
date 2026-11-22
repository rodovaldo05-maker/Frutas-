// Rosto e cabelo do corpo base, em blocos como o resto do personagem.
// Fica preso na junta da cabeça: olhos piscam sozinhos, pupilas olham para onde o
// personagem vai, sobrancelhas e boca mudam com o esforço, o susto e a dor.

import * as THREE from 'three';
import { clamp, damp, lerp } from '../core/math.js';

const box = (w, h, d, material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);

// Expressões: abertura dos olhos, altura e inclinação das sobrancelhas, boca (largura, altura, y)
const EXPRESSIONS = {
  neutro: { open: 1, browY: 0, browTilt: 0, mouthW: 1, mouthH: 1, mouthY: 0 },
  feliz: { open: 0.82, browY: 0.02, browTilt: -0.08, mouthW: 1.25, mouthH: 1.6, mouthY: 0.01 },
  esforco: { open: 0.62, browY: -0.035, browTilt: 0.32, mouthW: 1.15, mouthH: 0.7, mouthY: 0 },
  susto: { open: 1.28, browY: 0.07, browTilt: -0.18, mouthW: 0.75, mouthH: 3.6, mouthY: -0.03 },
  dor: { open: 0.3, browY: -0.02, browTilt: 0.42, mouthW: 1.2, mouthH: 2.2, mouthY: -0.01 },
  folego: { open: 0.78, browY: 0.01, browTilt: 0.12, mouthW: 0.55, mouthH: 0.8, mouthY: 0 },
  fechado: { open: 0.06, browY: -0.01, browTilt: 0.05, mouthW: 0.9, mouthH: 0.8, mouthY: 0 },
};

export class Face {
  constructor(head, { hair = '#3a2a22', skin = '#e2b48e' } = {}) {
    this.group = new THREE.Group();
    this.group.name = 'Rosto';
    head.add(this.group);

    const white = new THREE.MeshStandardMaterial({ color: '#f6f3ea', roughness: 0.5 });
    const ink = new THREE.MeshStandardMaterial({ color: '#1e2224', roughness: 0.4 });
    const glint = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const hairMat = new THREE.MeshStandardMaterial({ color: hair, roughness: 0.85, flatShading: true });
    const lip = new THREE.MeshStandardMaterial({ color: '#7a3f38', roughness: 0.7 });
    const nose = new THREE.MeshStandardMaterial({ color: new THREE.Color(skin).multiplyScalar(0.86), roughness: 0.8 });
    const cheek = new THREE.MeshStandardMaterial({ color: '#e99a86', roughness: 0.9, transparent: true, opacity: 0.55 });

    // olhos (E = esquerda do personagem, +x)
    this.eyes = [];
    for (const side of [1, -1]) {
      const eye = new THREE.Group();
      eye.position.set(side * 0.2, 0.53, 0.472);
      const sclera = box(0.2, 0.22, 0.03, white);
      const pupil = box(0.105, 0.14, 0.03, ink);
      pupil.position.z = 0.012;
      const shine = box(0.038, 0.038, 0.02, glint);
      shine.position.set(0.024, 0.035, 0.03);
      pupil.add(shine);
      eye.add(sclera, pupil);
      this.group.add(eye);
      this.eyes.push({ eye, pupil, side });
    }
    // sobrancelhas
    this.brows = [1, -1].map((side) => {
      const b = box(0.23, 0.05, 0.035, hairMat);
      b.position.set(side * 0.2, 0.705, 0.475);
      this.group.add(b);
      return { mesh: b, side };
    });
    // nariz, boca e bochechas
    const n = box(0.085, 0.11, 0.05, nose);
    n.position.set(0, 0.41, 0.485);
    this.mouth = box(0.2, 0.048, 0.03, lip);
    this.mouth.position.set(0, 0.27, 0.472);
    this.group.add(n, this.mouth);
    for (const side of [1, -1]) {
      const c = box(0.12, 0.06, 0.02, cheek);
      c.position.set(side * 0.31, 0.38, 0.468);
      this.group.add(c);
    }
    // cabelo base em blocos
    const parts = [
      [1.07, 0.22, 1.0, 0, 0.99, -0.01],
      [1.07, 0.52, 0.2, 0, 0.73, -0.44],
      [0.11, 0.4, 0.82, 0.535, 0.77, -0.06],
      [0.11, 0.4, 0.82, -0.535, 0.77, -0.06],
      [0.42, 0.17, 0.1, -0.27, 0.86, 0.47],
      [0.34, 0.13, 0.1, 0.1, 0.88, 0.47],
      [0.26, 0.2, 0.1, 0.36, 0.84, 0.47],
    ];
    for (const [w, h, d, x, y, z] of parts) {
      const m = box(w, h, d, hairMat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.userData.hair = true;
      this.group.add(m);
    }

    // detalhes do rosto (olhos, sobrancelhas, nariz, boca, bochechas): somem de longe
    this.details = this.group.children.filter((o) => !o.userData.hair);
    this.detail = true;

    this.current = { ...EXPRESSIONS.neutro };
    this.blinkTimer = 2 + Math.random() * 2;
    this.blink = 0; // 0 aberto .. 1 fechado
    this.blinkPhase = -1;
    this.doubleBlink = false;
    this.look = { x: 0, y: 0 };
  }

  // Nível de detalhe (desempenho): de longe ficam só o cabelo e a cabeça
  setDetail(on) {
    if (on === this.detail) return;
    this.detail = on;
    for (const o of this.details) o.visible = on;
  }

  update(dt, { expression = 'neutro', look = { x: 0, y: 0 } } = {}) {
    const target = EXPRESSIONS[expression] || EXPRESSIONS.neutro;
    const k = damp(14, dt);
    for (const key of Object.keys(target)) this.current[key] = lerp(this.current[key], target[key], k);

    // piscar: fecha rápido, abre um pouco mais devagar; às vezes pisca duas vezes
    this.blinkTimer -= dt;
    if (this.blinkPhase < 0 && this.blinkTimer <= 0) {
      this.blinkPhase = 0;
      this.doubleBlink = Math.random() < 0.2;
    }
    if (this.blinkPhase >= 0) {
      this.blinkPhase += dt / 0.15;
      this.blink = this.blinkPhase < 0.4 ? this.blinkPhase / 0.4 : 1 - (this.blinkPhase - 0.4) / 0.6;
      if (this.blinkPhase >= 1) {
        this.blink = 0;
        if (this.doubleBlink) {
          this.doubleBlink = false;
          this.blinkPhase = -1;
          this.blinkTimer = 0.12;
        } else {
          this.blinkPhase = -1;
          this.blinkTimer = 2.2 + Math.random() * 3.6;
        }
      }
    }
    this.look.x = lerp(this.look.x, clamp(look.x, -1, 1), damp(9, dt));
    this.look.y = lerp(this.look.y, clamp(look.y, -1, 1), damp(9, dt));

    const c = this.current;
    const open = Math.max(0.05, c.open * (1 - clamp(this.blink)));
    for (const { eye, pupil } of this.eyes) {
      eye.scale.y = open;
      pupil.position.x = this.look.x * 0.042;
      pupil.position.y = this.look.y * 0.035;
    }
    for (const { mesh, side } of this.brows) {
      mesh.position.y = 0.705 + c.browY;
      mesh.rotation.z = side * c.browTilt; // positivo: pontas de dentro descem (esforço)
    }
    this.mouth.scale.set(c.mouthW, c.mouthH, 1);
    this.mouth.position.y = 0.27 + c.mouthY;
  }
}
