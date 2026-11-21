// Desenho voxel das 16 frutas (folha de referência do FRUTO): cubo com rosto, olhos que
// brilham, folha no alto e as peças do tema de cada fruta. Grade de 41³ (−20..20), frente
// em +z, um voxel = 1/32 de unidade. A geometria (mordidas, polpa e sementes) continua no
// FRUTOModels; aqui só entram a grade, a paleta e quais cores brilham (sem sombra).
//
// Paleta (1..18): 1 sombra, 2 meio-tom, 3 luz, 4 destaque, 5 polpa, 6 semente, 7 cabinho,
// 8 folha, 9 olho escuro, 10 branco, 11 bochecha, 12 brilho dos olhos, 13 escuro, 14 folha
// clara, 15–18 cores do tema.

const N = 41;
const H = 20;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function api() {
  const s = new Uint8Array(N * N * N);
  const at = (x, y, z) => x + H + N * (y + H + N * (z + H));
  const ok = (x, y, z) => x >= -H && x <= H && y >= -H && y <= H && z >= -H && z <= H;
  const get = (x, y, z) => (ok(x, y, z) ? s[at(x, y, z)] : 0);
  const set = (x, y, z, c, onlyEmpty = false) => {
    x = Math.round(x);
    y = Math.round(y);
    z = Math.round(z);
    if (!ok(x, y, z)) return;
    if (onlyEmpty && s[at(x, y, z)]) return;
    s[at(x, y, z)] = c;
  };
  const box = (x0, x1, y0, y1, z0, z1, c, onlyEmpty) => {
    for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, z, c, onlyEmpty);
  };
  const ell = (cx, cy, cz, rx, ry, rz, c, onlyEmpty) => {
    for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++)
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const q = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2;
          if (q <= 1) set(x, y, z, typeof c === 'function' ? c(x, y, z) : c, onlyEmpty);
        }
  };
  // tubo entre dois pontos (raio pode afinar de r0 para r1)
  const seg = (a, b, r0, c, r1 = r0, onlyEmpty = false) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const steps = Math.max(1, Math.ceil(len * 2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const r = r0 + (r1 - r0) * t;
      const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      if (r < 0.75) set(p[0], p[1], p[2], typeof c === 'function' ? c(t) : c, onlyEmpty);
      else ell(p[0], p[1], p[2], r, r, r, typeof c === 'function' ? c(t) : c, onlyEmpty);
    }
  };
  const path = (pts, r0, c, r1 = r0, onlyEmpty = false) => {
    const total = pts.length - 1;
    for (let i = 0; i < total; i++) {
      const ra = r0 + (r1 - r0) * (i / total);
      const rb = r0 + (r1 - r0) * ((i + 1) / total);
      seg(pts[i], pts[i + 1], ra, typeof c === 'function' ? (t) => c((i + t) / total) : c, rb, onlyEmpty);
    }
  };
  // recolore voxels existentes que obedecem a um teste
  const recolor = (test, c) => {
    for (let z = -H; z <= H; z++)
      for (let y = -H; y <= H; y++)
        for (let x = -H; x <= H; x++) {
          const v = s[at(x, y, z)];
          if (v && test(x, y, z, v)) s[at(x, y, z)] = typeof c === 'function' ? c(x, y, z, v) : c;
        }
  };
  const surface = (x, y, z) => !get(x + 1, y, z) || !get(x - 1, y, z) || !get(x, y + 1, z) || !get(x, y - 1, z) || !get(x, y, z + 1) || !get(x, y, z - 1);
  return { s, get, set, box, ell, seg, path, recolor, surface };
}

// ===== Peças comuns =====
// Olhos: órbita escura, íris que brilha e ponto de luz; sobrancelhas inclinadas
function eyes(a, { y = 0, front = 8, gap = 5, style = 'bravo', iris = 12, brow = 13 } = {}) {
  for (const side of [-1, 1]) {
    const cx = side * gap;
    // órbita grande (7×4) com cantos arredondados no estilo fofo
    a.box(cx - 3, cx + 3, y - 1, y + 2, front, front, 9);
    if (style === 'fofo') for (const [dx, dy] of [[-3, -1], [3, -1], [-3, 2], [3, 2]]) a.set(cx + dx, y + dy, front, 2);
    // íris 3×3 que brilha, puxada um pouco para o centro, e ponto de luz
    const ix = cx - side;
    a.box(ix - 1, ix + 1, y - 1, y + 1, front, front, iris);
    a.set(ix - 1, y + 1, front, 10);
    if (style === 'fofo') {
      a.set(ix + 1, y - 1, front, 10);
      continue;
    }
    // sobrancelha: desce para o centro (bravo) ou reta (calmo), saltada para fora
    for (let k = 0; k <= 7; k++) {
      const bx = cx + side * 4 - side * k;
      const by = style === 'bravo' ? y + 4 - Math.floor(k / 3) : y + 3;
      a.set(bx, by, front, brow);
      a.set(bx, by, front + 1, brow);
    }
  }
}

function mouth(a, { y = -5, front = 8, kind = 'sorriso' } = {}) {
  if (kind === 'sorriso') {
    a.box(-1, 1, y, y, front, front, 9);
    a.set(-2, y + 1, front, 9);
    a.set(2, y + 1, front, 9);
  } else if (kind === 'presas') {
    a.box(-3, 3, y, y, front, front, 9);
    a.set(-2, y - 1, front, 10);
    a.set(2, y - 1, front, 10);
  } else if (kind === 'serio') {
    a.box(-2, 1, y, y, front, front, 9);
    a.set(2, y + 1, front, 9);
  } else if (kind === 'o') {
    a.box(-1, 1, y - 1, y, front, front, 9);
  }
}

function cheeks(a, { y = -3, front = 8, x = 7 } = {}) {
  for (const side of [-1, 1]) a.box(side * x - 1, side * x + 1, y, y, front, front, 11);
}

// Cabinho e folha no alto (como em todas as frutas da folha de referência)
function leaf(a, { top = 6, x = 2, z = -1, side = 1 } = {}) {
  a.box(x, x + 1, top + 1, top + 3, z, z + 1, 7);
  const lx = x + side * 4;
  a.ell(lx, top + 4, z, 3.6, 1.2, 2.2, 8);
  a.seg([x + side, top + 3.5, z], [lx + side * 3, top + 5, z], 0.5, 14);
  a.ell(x - side * 2, top + 3.5, z + 0.5, 1.8, 0.9, 1.4, 14);
}

// Espinho/cristal que afina (cone voxel)
function spike(a, base, dir, len, r0, c) {
  const l = Math.hypot(...dir);
  const tip = [base[0] + (dir[0] / l) * len, base[1] + (dir[1] / l) * len, base[2] + (dir[2] / l) * len];
  a.seg(base, tip, r0, c, 0.4);
  return tip;
}

// Asa em leque: penas em ângulos, cada uma com uma cor
function featherFan(a, side, { pivot, angles, lens, colors, tip, r = 1.3, z = -2 }) {
  angles.forEach((deg, i) => {
    const t = (deg * Math.PI) / 180;
    const len = lens[i % lens.length];
    const end = [pivot[0] + side * Math.cos(t) * len, pivot[1] + Math.sin(t) * len, z - i * 0.25];
    a.seg([pivot[0], pivot[1], z], end, r + 0.5, colors[i % colors.length], r * 0.55);
    if (tip) a.ell(end[0], end[1], end[2], 1, 1, 1, tip);
  });
}

// Anel inclinado (planeta) em volta do corpo
function ring(a, { r = 13, y = -2, tilt = 0.28, c = 15, under = 16, thick = 1.1, z = 0.9 }) {
  for (let i = 0; i < 160; i++) {
    const t = (i / 160) * Math.PI * 2;
    const x = Math.cos(t) * r;
    const zz = Math.sin(t) * r * z;
    const yy = y + Math.sin(t) * r * tilt;
    if (Math.abs(x) < 9.5 && Math.abs(zz) < 8.5) continue; // por dentro do corpo
    a.ell(x, yy, zz, thick, thick * 0.7, thick, c, true);
    a.set(x, yy - 1, zz, under, true);
  }
}

// ===== As 16 frutas =====
const DESIGNS = [
  // 0 Impacto — armadura azul, viseira dourada, manoplas nos lados, energia ciano
  {
    palette: ['#1d3a8a', '#3d6be0', '#7aa2ff', '#f5c542', '#ffecb4', '#816238', '#6b4a2c', '#5fae4a', '#0d1733', '#ffffff', '#e8a0a0', '#6ef2ff', '#152a63', '#9be07a', '#a8b8d8', '#3fd5ff', '#d99a2b', '#0f1d48'],
    glow: [12, 16],
    build(a) {
      const b = a.body({ hx: 9, y0: -10, y1: 5, hz: 8 });
      // capacete: placas escuras em cima e nos lados, viseira dourada
      a.recolor((x, y, z) => y >= 2 && a.surface(x, y, z), (x, y, z) => (y >= 4 ? 13 : 18));
      a.box(-7, 7, 3, 4, 8, 9, 4);
      a.box(-6, 6, 3, 3, 9, 9, 17);
      // ombreiras
      for (const s of [-1, 1]) {
        a.ell(s * 9, 2, 0, 3, 2.5, 6, 13);
        a.box(s * 9 - 1, s * 9 + 1, 4, 4, -5, 5, 15);
      }
      // manoplas (punhos fechados) dos dois lados
      for (const s of [-1, 1]) {
        const x0 = s > 0 ? 10 : -15;
        const x1 = s > 0 ? 15 : -10;
        a.box(x0, x1, -10, -2, -3, 7, 13); // manopla
        a.box(s > 0 ? 10 : -11, s > 0 ? 11 : -10, -10, -2, -3, 7, 4); // punho dourado
        for (const y of [-9, -6]) for (const k of [0, 3, 6]) a.box(x0 + 1, x1 - 1, y, y + 2, k + 6, k + 6 > 7 ? 7 : k + 6, 15);
        a.box(x0 + 1, x1 - 1, -9, -3, 8, 8, 15); // nós dos dedos na frente
        a.box(x0 + 1, x1 - 1, -6, -6, 8, 8, 13);
        // redemoinho de energia ciano subindo do punho
        a.path([[s * 13, -9, 4], [s * 16, -4, 2], [s * 15, 2, -2], [s * 12, 6, -4]], 0.6, 16, 0.4, true);
      }
      eyes(a, { y: -2, front: b.front, style: 'bravo', brow: 4 });
      a.box(-3, 2, -7, -7, 8, 8, 9);
      a.set(2, -6, 8, 9);
      leaf(a, { top: b.top, x: 3, z: -3 });
    },
  },
  // 1 Brasa — lava com rachaduras que brilham e chamas no alto
  {
    palette: ['#4a100c', '#a8281a', '#d84a24', '#ff8a1f', '#ffdc7c', '#a74f33', '#5a3a28', '#6fae3a', '#2a0c08', '#fff3c4', '#ff9a70', '#ffe14a', '#2e0a08', '#a5d65a', '#ff5a14', '#ffd23a', '#e8361c', '#ffb43a'],
    glow: [4, 12, 15, 16, 17, 18],
    build(a) {
      const b = a.body({ hx: 9, y0: -10, y1: 4, hz: 8 });
      // rachaduras de lava (Voronoi na superfície)
      const rnd = rng(11);
      const seeds = Array.from({ length: 22 }, () => [rnd() * 20 - 10, rnd() * 16 - 11, rnd() * 18 - 9]);
      a.recolor((x, y, z) => a.surface(x, y, z) && z < 8, (x, y, z, v) => {
        const d = seeds.map((p) => Math.hypot(x - p[0], y - p[1], z - p[2])).sort((m, n) => m - n);
        return d[1] - d[0] < 0.9 ? (y > -4 ? 4 : 15) : v === 3 ? 3 : y < -6 ? 13 : v;
      });
      // chamas: núcleo amarelo, meio laranja, borda vermelha, com línguas laterais
      for (let y = b.top + 1; y <= b.top + 15; y++) {
        const t = (y - b.top) / 15;
        const r = 7.5 * (1 - t) ** 0.8 + 0.4;
        const sway = Math.sin(t * 5) * 1.6 * t;
        a.ell(sway, y, -1, r, 0.6, r * 0.75, (x, yy, z) => {
          const d = Math.hypot(x - sway, (z + 1) / 0.75) / r;
          return d < 0.45 ? 16 : d < 0.78 ? 15 : 17;
        });
      }
      for (const [sx, h] of [[-6, 7], [6, 6], [-2, 9]]) spike(a, [sx, b.top, 2], [sx * 0.15, 1, 0.3], h, 1.6, 15);
      for (const s of [-1, 1]) spike(a, [s * 9, -2, 0], [s * 0.6, 1, 0], 5, 1.2, 17);
      eyes(a, { y: -1, front: b.front, style: 'bravo', iris: 12, brow: 13 });
      mouth(a, { y: -6, front: b.front, kind: 'presas' });
    },
  },
  // 2 Geada — gelo claro, capa de neve e cristais pontudos
  {
    palette: ['#3a7ea8', '#7cc6e6', '#c4ecfa', '#f4fdff', '#f0ffef', '#686e98', '#526f64', '#6fbf8a', '#163049', '#ffffff', '#e8a9ae', '#7ff7ff', '#2a5f86', '#a8e6b8', '#a6e8ff', '#5ec4f0', '#d8f6ff', '#2f8fc8'],
    glow: [12],
    build(a) {
      const b = a.body({ hx: 9, y0: -10, y1: 5, hz: 8 });
      // neve no topo escorrendo pelos lados
      const rnd = rng(23);
      a.recolor((x, y, z) => y >= b.top - 1 - Math.floor(((x * 7 + z * 13) & 7) / 3) && a.surface(x, y, z), 4);
      // cristais de gelo no alto e nos cantos de baixo
      const crystals = [[0, 1, -1, 12, 2.4], [-5, 0.9, 1, 9, 1.9], [5, 1, -3, 10, 2], [-2, 1, 3, 6, 1.4], [7, 0.8, 2, 6, 1.4], [-7, 0.7, -4, 7, 1.5]];
      for (const [x, up, z, len, r] of crystals) spike(a, [x, b.top, z], [x * 0.08, up, z * 0.05], len, r, (t) => (t > 0.7 ? 17 : rnd() < 0.5 ? 15 : 16));
      for (const s of [-1, 1]) {
        spike(a, [s * 9, -8, 6], [s, -0.2, 0.5], 6, 1.6, 15);
        spike(a, [s * 9, -6, 3], [s, 0.5, 0.2], 5, 1.2, 16);
        spike(a, [s * 8, -9, -5], [s, -0.3, -0.4], 5, 1.3, 17);
      }
      eyes(a, { y: -1, front: b.front, style: 'calmo', iris: 12, brow: 13 });
      mouth(a, { y: -6, front: b.front, kind: 'serio' });
      cheeks(a, { y: -4, front: b.front });
    },
  },
  // 3 Tormenta — chifres de raio e nuvens de tempestade na base
  {
    palette: ['#a06a14', '#e8b02a', '#ffd95a', '#fff3a0', '#fff1af', '#9a6e54', '#80603c', '#7fb04a', '#3a2410', '#fffbe6', '#ee987b', '#fff26a', '#6a4610', '#b4d870', '#8a8f9e', '#c3c7d2', '#5f6372', '#ffe600'],
    glow: [12, 18],
    build(a) {
      const b = a.body({ hx: 9, y0: -9, y1: 5, hz: 8 });
      // listras de carga
      a.recolor((x, y, z) => a.surface(x, y, z) && (y === -2 || y === 1) && Math.abs(x) > 7, 3);
      // chifres em zigue-zague
      for (const s of [-1, 1]) {
        a.path([[s * 6, b.top, 0], [s * 9, b.top + 4, 0], [s * 6, b.top + 6, 0], [s * 11, b.top + 12, -1]], 1.6, 18, 0.6);
        a.path([[s * 9, 0, 0], [s * 13, 2, 1], [s * 11, 4, 1], [s * 15, 7, 0]], 0.8, 18, 0.4);
      }
      // nuvens cinzas em volta da base
      const puffs = [[-9, -9, 5, 4.5], [-3, -10, 7, 4], [4, -10, 6, 4.5], [10, -8, 3, 4], [-11, -8, -3, 4], [10, -9, -5, 4], [0, -10, -7, 4.5], [-6, -10, -6, 3.5]];
      for (const [x, y, z, r] of puffs) a.ell(x, y, z, r, r * 0.75, r, (xx, yy) => (yy < y - 1 ? 17 : yy > y + 1 ? 16 : 15), true);
      eyes(a, { y: 0, front: b.front, style: 'bravo' });
      mouth(a, { y: -5, front: b.front, kind: 'presas' });
      leaf(a, { top: b.top, x: 1, z: -3 });
    },
  },
  // 4 Lobo — cabeça de lobo cinza, orelhas, focinho claro, pelos nas bochechas
  {
    palette: ['#3e4357', '#6e7690', '#a3abbf', '#eef1f5', '#ffe3ac', '#a66c4e', '#68554a', '#7fae5a', '#16171f', '#ffffff', '#d98a8a', '#ffb13a', '#272a38', '#b6d88a', '#e69aa8', '#101116', '#c9ced9', '#585f78'],
    glow: [12],
    build(a) {
      const b = a.body({ hx: 9, y0: -10, y1: 5, hz: 8 });
      // máscara escura na testa (V) e lateral
      a.recolor((x, y, z) => a.surface(x, y, z) && z > 4 && y > 1 && Math.abs(x) < 4 - (y - 2) * 0.2, 18);
      // orelhas
      for (const s of [-1, 1]) {
        for (let k = 0; k <= 8; k++) {
          const w = Math.max(0, 3.2 - k * 0.42);
          a.box(Math.round(s * 5.5 - w), Math.round(s * 5.5 + w), b.top + k, b.top + k, -2, 1, k > 5 ? 1 : 2);
          if (k < 6 && w > 1) a.box(Math.round(s * 5.5 - w + 1), Math.round(s * 5.5 + w - 1), b.top + k, b.top + k, 2, 2, 15);
        }
        // tufos de pelo nas bochechas
        for (const [y, len] of [[-3, 5], [-6, 4], [0, 3]]) spike(a, [s * 9, y, 3], [s, -0.35, 0.3], len, 1.5, y === -6 ? 4 : 17);
      }
      // tufo no alto da cabeça
      spike(a, [0, b.top, 2], [0, 1, 0.6], 4, 1.4, 17);
      // focinho claro com nariz e presas
      a.box(-4, 4, -8, -2, 8, 11, 4);
      a.box(-3, 3, -2, -1, 8, 11, 4);
      a.box(-1, 1, -2, -1, 12, 12, 16);
      a.box(-2, 2, -3, -3, 12, 12, 16);
      a.box(-3, 3, -6, -6, 12, 12, 9);
      a.set(-2, -7, 12, 10);
      a.set(2, -7, 12, 10);
      eyes(a, { y: 1, front: b.front, style: 'bravo', iris: 12, brow: 13 });
      leaf(a, { top: b.top, x: -1, z: -4, side: 1 });
    },
  },
  // 5 Eclipse — roxo do espaço com estrelas, lua crescente dourada e anel
  {
    palette: ['#1a0d30', '#382160', '#5e3e94', '#f5c24c', '#e9cdea', '#825579', '#5a4a3a', '#6fae6a', '#0a0514', '#ffffff', '#c07aa8', '#c38cff', '#241240', '#a5d68a', '#fff6c8', '#8a5cd6', '#4b2d86', '#ffdf7a'],
    glow: [12, 15],
    build(a) {
      const b = a.body({ hx: 9, y0: -9, y1: 5, hz: 8 });
      const rnd = rng(5);
      a.recolor((x, y, z) => a.surface(x, y, z) && rnd() < 0.05 && z < 8, 15);
      // lua crescente no alto
      for (let y = b.top + 1; y <= b.top + 14; y++)
        for (let x = -8; x <= 8; x++) {
          const outer = Math.hypot(x, y - (b.top + 8)) <= 6.5;
          const inner = Math.hypot(x - 3, y - (b.top + 9.5)) <= 5.2;
          if (outer && !inner) a.box(x, x, y, y, -2, 0, Math.hypot(x + 2, y - (b.top + 6)) < 3 ? 18 : 4);
        }
      a.seg([0, b.top, -1], [-1, b.top + 2, -1], 1, 4);
      // anel orbitando
      ring(a, { r: 14, y: -4, tilt: -0.26, c: 16, under: 17 });
      eyes(a, { y: -1, front: b.front, style: 'bravo', iris: 12, brow: 13 });
      mouth(a, { y: -5, front: b.front, kind: 'serio' });
      leaf(a, { top: b.top, x: -4, z: -4, side: -1 });
    },
  },
  // 6 Maré — onda curvada por cima, espuma e gotas
  {
    palette: ['#0c5f6c', '#1f9cab', '#5ed0d2', '#ecfffb', '#d5fadc', '#a06e5a', '#715443', '#7cc06a', '#082a31', '#ffffff', '#f6aa89', '#7affe9', '#0a4652', '#b6e88a', '#29bfd4', '#1281a3', '#bff6ff', '#0f6f8f'],
    glow: [12],
    build(a) {
      const b = a.body({ hx: 9, y0: -10, y1: 4, hz: 8 });
      // espiral de água na lateral
      a.recolor((x, y, z) => a.surface(x, y, z) && Math.abs(x) >= 8 && (() => {
        const r = Math.hypot(y + 3, z);
        const ang = Math.atan2(y + 3, z);
        return Math.abs(((r - ang * 1.1) % 3.4 + 3.4) % 3.4) < 1;
      })(), 3);
      // onda: sobe atrás e enrola para a frente
      const prof = [[-9, b.top - 2], [-8, b.top + 3], [-5, b.top + 7], [-1, b.top + 9], [3, b.top + 9], [5, b.top + 7], [5, b.top + 5], [2, b.top + 4]];
      for (let x = -10; x <= 10; x++) {
        const shift = x * 0.25;
        const scale = 1 - Math.abs(x) * 0.035;
        const pts = prof.map(([z, y]) => [x, b.top + (y - b.top) * scale, z + shift]);
        a.path(pts, 1.5, (t) => (t > 0.9 ? 4 : t > 0.78 ? 17 : t > 0.55 ? 15 : t < 0.3 ? 18 : 16), 1);
      }
      // gotas grudadas nos lados
      for (const [x, y, z] of [[-10, 0, 5], [10, -4, 4], [-10, -6, -3], [10, 2, -5]]) a.ell(x, y, z, 1.4, 1.4, 1.4, 17);
      eyes(a, { y: -2, front: b.front, style: 'fofo', iris: 12 });
      mouth(a, { y: -6, front: b.front, kind: 'sorriso' });
      cheeks(a, { y: -5, front: b.front });
    },
  },
  // 7 Cristal — rosa facetado com cristais saindo do alto e dos lados
  {
    palette: ['#7e2452', '#cf5a8e', '#f59cc0', '#ffd6e6', '#ffe5df', '#a2667d', '#705448', '#7cbf7a', '#3a1530', '#ffffff', '#ffbaa0', '#ff8ad8', '#5e1a3e', '#b5e08a', '#f08cc4', '#ffe0f2', '#b5427f', '#e06aa8'],
    glow: [12],
    build(a) {
      const b = a.body({ hx: 9, y0: -10, y1: 4, hz: 8 });
      // facetas: diagonais claras
      a.recolor((x, y, z) => a.surface(x, y, z) && ((x + y + 40) % 9 === 0) && y < b.top - 1 && z < 8, 3);
      const shard = (base, dir, len, r) => spike(a, base, dir, len, r, (t) => (t > 0.75 ? 16 : t > 0.4 ? 15 : 18));
      shard([0, b.top - 1, -1], [0.05, 1, -0.05], 15, 3.6);
      shard([-5, b.top - 1, 1], [-0.45, 1, 0.1], 11, 2.8);
      shard([5, b.top - 1, -2], [0.45, 1, -0.1], 12, 2.9);
      shard([2, b.top - 1, 4], [0.15, 1, 0.5], 7, 2);
      shard([-3, b.top - 1, -5], [-0.2, 1, -0.5], 8, 2.1);
      for (const s of [-1, 1]) {
        shard([s * 8, -7, 4], [s, 0.1, 0.4], 7, 2.2);
        shard([s * 8, -3, -3], [s, 0.6, -0.2], 6, 1.8);
      }
      eyes(a, { y: -2, front: b.front, style: 'bravo', iris: 12, brow: 13 });
      mouth(a, { y: -6, front: b.front, kind: 'serio' });
      leaf(a, { top: b.top, x: 6, z: 2 });
    },
  },
  // 8 Eco — verde com alto-falantes nos lados, equalizador na testa e ondas de som
  {
    palette: ['#24702a', '#4fb83a', '#92ea62', '#d8ffb0', '#f2fbc6', '#627947', '#527a4b', '#58b85a', '#0f2e14', '#f4fff1', '#78cfa1', '#c8ff5a', '#1a4720', '#c7f899', '#163319', '#7de04a', '#b6ff4a', '#356b2c'],
    glow: [12, 17],
    build(a) {
      const b = a.body({ hx: 9, y0: -10, y1: 5, hz: 8 });
      for (const s of [-1, 1]) {
        // alto-falante: anéis concêntricos
        for (let y = -10; y <= 4; y++)
          for (let z = -8; z <= 8; z++) {
            const r = Math.hypot(y + 3, z);
            if (r > 6.3) continue;
            const c = r > 5.2 ? 18 : r > 3.8 ? 15 : r > 2.2 ? 13 : 16;
            a.set(s * 10, y, z, c);
            if (r <= 5.2) a.set(s * 11, y, z, r < 2.2 ? 16 : 15);
          }
        // ondas de som
        for (const [rad, x] of [[5, 13], [7.5, 15], [10, 17]])
          for (let k = -55; k <= 55; k += 4) {
            const t = (k * Math.PI) / 180;
            a.set(s * x, -3 + Math.sin(t) * rad, Math.cos(t) * rad * 0.3, 17);
          }
      }
      // equalizador na testa
      a.box(-7, 7, 1, 4, b.front, b.front, 15);
      [2, 3, 1, 4, 2, 3, 1].forEach((h, i) => a.box(-6 + i * 2, -6 + i * 2, 1, 1 + h - 1, b.front, b.front, 17));
      eyes(a, { y: -4, front: b.front, style: 'fofo', iris: 12 });
      mouth(a, { y: -8, front: b.front, kind: 'o' });
      leaf(a, { top: b.top, x: 3, z: -2 });
    },
  },
  // 9 Falcão — creme com asas douradas abertas, bico e penacho
  {
    palette: ['#b39a76', '#e8dcc4', '#fff6e4', '#e8b24c', '#ffecb1', '#ac7146', '#705743', '#8eb062', '#1c222a', '#ffffff', '#ed9671', '#5ad8ff', '#6e4b28', '#c2d888', '#d89a3a', '#f5cf7a', '#9a6424', '#f2a23a'],
    glow: [12],
    build(a) {
      const b = a.body({ hx: 8, y0: -10, y1: 5, hz: 8 });
      // asas em leque dos dois lados
      for (const s of [-1, 1]) {
        featherFan(a, s, { pivot: [s * 7, 1, -1], angles: [5, 15, 25, 35, 45, 55, 65, 75], lens: [10, 13, 15, 16, 17, 17, 16, 14], colors: [17, 15, 16, 15, 16, 15, 16, 15], tip: 17, r: 1.3, z: -2 });
        featherFan(a, s, { pivot: [s * 7, 1, 0], angles: [0, 20, 40, 60], lens: [7, 9, 9, 8], colors: [16], r: 1.7, z: 0 });
      }
      // penacho e sobrancelhas marrons
      for (const [x, h] of [[-2, 4], [0, 6], [2, 4]]) spike(a, [x, b.top, 2], [x * 0.2, 1, -0.4], h, 1.2, 13);
      // bico
      a.box(-2, 2, -4, -1, 9, 10, 18);
      a.box(-1, 1, -5, -2, 11, 12, 18);
      a.box(-1, 1, -6, -5, 11, 11, 17);
      eyes(a, { y: 1, front: b.front, style: 'bravo', iris: 12, brow: 13 });
      leaf(a, { top: b.top, x: 4, z: -4 });
    },
  },
  // 10 Duna — areia em camadas, topo em degraus e anel de areia
  {
    palette: ['#9a6224', '#d39d52', '#f0cc86', '#ffe8b4', '#ffeab2', '#996944', '#74533b', '#94a84a', '#3e2a14', '#fff5d8', '#e89673', '#ffa12a', '#7a4e1e', '#c6d46a', '#e8b866', '#b88440', '#f5d89a', '#c48a44'],
    glow: [12],
    build(a) {
      const b = a.body({ hx: 9, y0: -10, y1: 3, hz: 8, tone: (x, y, z, c) => (c === 2 && (y === -6 || y === -2 || y === 1) ? 18 : c) });
      // topo em degraus (duna)
      a.ell(0, b.top, -1, 7, 3.5, 6, (x, y) => (y > b.top + 2 ? 4 : 3), true);
      a.box(-2, 2, b.top + 3, b.top + 4, -3, 1, 18, true);
      ring(a, { r: 14, y: -6, tilt: -0.22, c: 15, under: 16, thick: 1.2 });
      const rnd = rng(9);
      for (let i = 0; i < 22; i++) {
        const t = rnd() * Math.PI * 2;
        a.set(Math.cos(t) * 14, -6 - Math.sin(t) * 14 * 0.22 + 1, Math.sin(t) * 14 * 0.9, 17);
      }
      eyes(a, { y: -3, front: b.front, style: 'calmo', iris: 12, brow: 13 });
      mouth(a, { y: -7, front: b.front, kind: 'serio' });
      leaf(a, { top: b.top + 3, x: 1, z: -1 });
    },
  },
  // 11 Ímã — ímã em U: metade vermelha, metade azul, pontas prateadas e campo magnético
  {
    palette: ['#7a161c', '#d23434', '#ff6a5a', '#d2dae4', '#ffe2b7', '#997783', '#625749', '#7fae5a', '#1c1418', '#ffffff', '#f4a690', '#fff0a0', '#4a0e14', '#bfdc88', '#2f8fe0', '#6cc4ff', '#1a5490', '#8a96a6'],
    glow: [12],
    build(a) {
      const color = (x, y, z, c) => {
        const blue = x >= 0;
        return c === 1 ? (blue ? 17 : 1) : c === 3 ? (blue ? 16 : 3) : blue ? 15 : 2;
      };
      a.body({ hx: 10, y0: -10, y1: -1, hz: 7, tone: color });
      for (const s of [-1, 1]) {
        for (let z = -7; z <= 7; z++)
          for (let y = -3; y <= 9; y++)
            for (let x = 4; x <= 10; x++) {
              if (Math.abs(z) === 7 && (x === 4 || x === 10)) continue;
              const tip = y >= 6;
              a.set(s * x, y, z, tip ? (y === 9 || x === 10 ? 4 : 18) : color(s * x, y, z, y >= 4 && x < 6 ? 3 : 2));
            }
      }
      // campo magnético: arcos vermelhos à esquerda, azuis à direita
      for (const s of [-1, 1])
        for (const [rad, x] of [[4, 13], [6, 15], [8, 17]])
          for (let k = -50; k <= 50; k += 5) {
            const t = (k * Math.PI) / 180;
            a.set(s * x, 2 + Math.sin(t) * rad, Math.cos(t) * rad * 0.3, s < 0 ? 3 : 16);
          }
      eyes(a, { y: -4, front: 7, style: 'bravo', iris: 12, brow: 13 });
      mouth(a, { y: -8, front: 7, kind: 'serio' });
    },
  },
  // 12 Besta — máscara branca com marcas vermelhas e chifres grandes
  {
    palette: ['#6a0e1c', '#b81c36', '#e44658', '#f2ece4', '#ffbfa1', '#96535c', '#4a3946', '#78875e', '#1a0c10', '#ffffff', '#e05e67', '#ff3a3a', '#3e0812', '#adbd7b', '#e8b84c', '#a81a2a', '#e84a4a', '#cfc5b8'],
    glow: [12],
    build(a) {
      const b = a.body({ hx: 9, y0: -10, y1: 5, hz: 8 });
      // máscara branca na frente com marcas vermelhas
      a.recolor((x, y, z) => z >= 6 && Math.abs(x) <= 8 && y <= 4 && y >= -9, (x, y, z) => (Math.abs(x) >= 6 && y < -1 ? 18 : 4));
      for (const s of [-1, 1]) {
        a.box(s * 5, s * 5, -6, -2, 8, 8, 16);
        a.box(s * 6, s * 6, -8, -6, 8, 8, 16);
      }
      a.box(-1, 1, 2, 4, 8, 9, 15);
      a.box(-2, 2, 3, 3, 8, 9, 15);
      // chifres curvos
      for (const s of [-1, 1])
        a.path([[s * 6, b.top - 1, -1], [s * 11, b.top + 2, -1], [s * 14, b.top + 7, -2], [s * 13, b.top + 12, -3], [s * 10, b.top + 14, -3]], 2.4, (t) => (t > 0.75 ? 17 : 16), 0.7);
      // presas
      a.box(-4, 4, -7, -7, 8, 8, 9);
      for (const x of [-3, -1, 1, 3]) a.set(x, -8, 9, 10);
      eyes(a, { y: 0, front: b.front, style: 'bravo', iris: 12, brow: 13 });
    },
  },
  // 13 Fênix — corpo azul, asas de fogo em várias cores e crista dourada
  {
    palette: ['#16236a', '#2a52c8', '#5aa0ff', '#ffcf3a', '#fff3bd', '#a86438', '#615048', '#417f91', '#0c1234', '#ffffff', '#ee7762', '#ffe14a', '#121c52', '#81c6ae', '#ff3a3a', '#ff8a1a', '#3ae0ff', '#a04aff'],
    glow: [12, 15, 16, 17, 18],
    build(a) {
      const b = a.body({ hx: 8, y0: -10, y1: 5, hz: 8 });
      for (const s of [-1, 1]) {
        featherFan(a, s, { pivot: [s * 7, 1, -1], angles: [0, 10, 20, 30, 40, 50, 60, 70, 80], lens: [10, 12, 14, 16, 17, 17, 16, 14, 12], colors: [18, 17, 17, 4, 16, 15, 16, 4, 15], tip: 15, r: 1.3, z: -2 });
        featherFan(a, s, { pivot: [s * 7, 1, 0], angles: [-10, 15, 40], lens: [7, 8, 8], colors: [16, 4, 15], r: 1.6, z: 0 });
      }
      // crista dourada
      for (const [x, h, c] of [[-3, 6, 4], [0, 9, 16], [3, 6, 4]]) spike(a, [x, b.top, 0], [x * 0.25, 1, -0.3], h, 1.4, c);
      // máscara dourada em volta dos olhos e bico
      a.recolor((x, y, z) => z >= 7 && y >= -2 && y <= 3 && Math.abs(x) <= 8, 4);
      a.box(-1, 1, -5, -3, 9, 10, 4);
      a.set(0, -6, 10, 16);
      eyes(a, { y: 1, front: b.front, style: 'bravo', iris: 12, brow: 13 });
    },
  },
  // 14 Dragão Oriental — vermelho com escamas, chifres e bigodes dourados e nuvens
  {
    palette: ['#4a0a14', '#b01e2e', '#dc4646', '#f2b630', '#ffe4b8', '#9b553d', '#694532', '#827348', '#200a10', '#fffae3', '#edb48b', '#ffd23a', '#320810', '#acaa60', '#f2e6c8', '#d4bc8e', '#b88420', '#ffe08a'],
    glow: [12],
    build(a) {
      const b = a.body({ hx: 9, y0: -9, y1: 5, hz: 8, tone: (x, y, z, c) => (c === 2 && ((x + y * 2 + 40) % 4 === 0) ? 1 : c) });
      // placa dourada na testa
      a.box(-3, 3, 2, 4, 8, 8, 4);
      a.box(-1, 1, 3, 3, 8, 9, 13);
      // chifres em galhos
      for (const s of [-1, 1]) {
        a.path([[s * 4, b.top, -1], [s * 7, b.top + 6, -2], [s * 8, b.top + 11, -4]], 1.6, 4, 0.7);
        a.seg([s * 6.5, b.top + 5, -2], [s * 11, b.top + 8, -2], 1, 17, 0.5);
        a.seg([s * 7.5, b.top + 9, -3], [s * 4, b.top + 12, -4], 0.9, 18, 0.5);
        // bigodes longos
        a.path([[s * 4, -4, 9], [s * 9, -5, 10], [s * 14, -2, 9], [s * 17, 2, 7], [s * 18, 6, 6]], 0.8, 4, 0.5);
      }
      // focinho e narinas
      a.box(-4, 4, -7, -2, 8, 10, 3);
      a.set(-2, -3, 11, 9);
      a.set(2, -3, 11, 9);
      a.box(-3, 3, -6, -6, 11, 11, 9);
      for (const x of [-3, 3]) a.set(x, -7, 11, 10);
      // nuvens claras na base
      for (const [x, y, z, r] of [[-10, -9, 4, 3.6], [-5, -10, 7, 3], [6, -10, 6, 3.4], [11, -8, 1, 3.4], [-11, -8, -4, 3.2], [0, -10, -8, 3.4]]) a.ell(x, y, z, r, r * 0.75, r, (xx, yy) => (yy < y ? 16 : 15), true);
      eyes(a, { y: 1, front: b.front, style: 'bravo', iris: 12, brow: 13 });
    },
  },
  // 15 Dragão Ocidental — preto, chifres dourados, asas de morcego e boca de lava
  {
    palette: ['#101016', '#262632', '#40404f', '#e8a632', '#fbcd81', '#875638', '#584736', '#878956', '#08080c', '#fff3cd', '#c2875b', '#ffb020', '#060608', '#bcc07d', '#3a2836', '#5c4a5c', '#ff6a10', '#ffd26a'],
    glow: [12, 17],
    build(a) {
      const b = a.body({ hx: 9, y0: -10, y1: 5, hz: 8, tone: (x, y, z, c) => (c === 2 && (x * 3 + y * 5 + z * 7 + 99) % 9 === 0 ? 3 : c) });
      // asas de morcego: ossos e membrana
      for (const s of [-1, 1]) {
        const pivot = [s * 8, 3, -4];
        const tips = [[s * 20, 16, -8], [s * 20, 7, -8], [s * 18, -2, -8], [s * 13, -7, -7]];
        for (let i = 0; i < tips.length - 1; i++)
          for (let u = 0; u <= 1; u += 0.04)
            for (let v = 0; v <= 1 - u; v += 0.04) {
              const w = 1 - u - v;
              if (w < 0.12 && Math.abs(u - v) < 0.25) continue; // recorte entre os dedos
              const p = [0, 1, 2].map((k) => pivot[k] * w + tips[i][k] * u + tips[i + 1][k] * v);
              a.set(p[0], p[1], p[2], 15, true);
            }
        for (const t of tips) a.seg(pivot, t, 1, 16, 0.5);
        a.ell(tips[0][0], tips[0][1], tips[0][2], 1, 1, 1, 4);
        // chifres para trás
        a.path([[s * 5, b.top, 0], [s * 8, b.top + 5, -3], [s * 9, b.top + 8, -8], [s * 8, b.top + 9, -11]], 1.8, (t) => (t > 0.6 ? 18 : 4), 0.6);
      }
      // boca de lava com dentes
      a.box(-4, 4, -7, -5, 8, 8, 17);
      for (const x of [-3, -1, 1, 3]) a.set(x, -5, 9, 10);
      for (const x of [-2, 2]) a.set(x, -7, 9, 10);
      eyes(a, { y: 0, front: b.front, style: 'bravo', iris: 12, brow: 4 });
    },
  },
];

const cache = new Map();

// Grade, paleta e cores que brilham de uma fruta (cache por fruta)
export function designFruit(index) {
  if (cache.has(index)) return cache.get(index);
  const d = DESIGNS[index];
  const a = api();
  d.build({ ...a, body: (opts) => bodyOf(a, opts) });
  const out = { solid: a.s, palette: d.palette, glow: new Set(d.glow) };
  cache.set(index, out);
  return out;
}

// corpo arredondado (fica fora do api() para receber o "a" completo)
function bodyOf(a, { hx = 9, y0 = -10, y1 = 6, hz = 8, r = 3, tone } = {}) {
  const cy = (y0 + y1) / 2;
  const hy = (y1 - y0) / 2;
  for (let z = -hz; z <= hz; z++)
    for (let y = y0; y <= y1; y++)
      for (let x = -hx; x <= hx; x++) {
        const qx = Math.max(Math.abs(x) - (hx - r), 0);
        const qy = Math.max(Math.abs(y - cy) - (hy - r), 0);
        const qz = Math.max(Math.abs(z) - (hz - r), 0);
        if (Math.hypot(qx, qy, qz) > r + 0.35) continue;
        let c = y >= y1 - 1 ? 3 : y <= y0 + 1 ? 1 : 2;
        if (c === 2 && x < -hx + 2 && z < hz - 2) c = 1;
        if (tone) c = tone(x, y, z, c);
        a.set(x, y, z, c);
      }
  return { hx, y0, y1, hz, top: y1, front: hz };
}

export const DESIGN_COUNT = DESIGNS.length;
export const GRID = { N, H };
