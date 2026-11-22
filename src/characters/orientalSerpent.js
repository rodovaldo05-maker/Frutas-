// Dragão Oriental — forma completa nova (pedido do jogador; Prompt Mestre, seção 7: "corpo
// serpenteante articulado"). No laboratório a forma completa era um quadrúpede; aqui ela vira
// um dragão celestial que paira (refeito na atualização 23 pela imagem de referência do
// jogador): corpo longo e fino em S, dorso carmim com listras escuras, ventre creme largo em
// placas, espinhos dourados nas bordas do ventre e no dorso, juba quase preta e farta, pescoço
// erguido, patas escuras finas com garras laranja e o fim da cauda escuro com folhas e ponta de
// flecha douradas. Cabeça, mandíbula, galhada e bigodes são do laboratório (FRUTOMythEast), com
// a juba e os bigodes escurecidos.
// Mesma interface dos módulos do laboratório: create(T, models, data, form, level) e
// animate(T, motion, data, rig, state). Os golpes M1 da forma completa entram por registerActions.

import { FRUTOMythEast } from './fruto-animals.js';

const tau = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (x) => {
  const u = clamp(x);
  return u * u * (3 - 2 * u);
};
// envelope suave: sobe até `at` (em `before` s) e desce depois (em `after` s)
const event = (t, at, before, after) => smooth(t < at ? (t - at + before) / before : (at + after - t) / after);

export const SEGMENTS = 14;
const SEG_LEN = 0.56;
// corpo longo e fino: um pouco mais cheio no meio, afinando até a ponta da cauda
const radius = (i) => {
  const k = i / SEGMENTS;
  return 0.31 + 0.05 * Math.sin(Math.PI * Math.min(1, k * 1.6)) - 0.2 * k * k;
};
// fim da cauda escuro (como na referência)
const DARK_FROM = SEGMENTS - 3;
const pigments = {
  crimson: '#8f1a2e', crimsonLit: '#b3263a', stripe: '#5a0f22', dark: '#2a0f1c', darkLit: '#3d1a2a',
  cream: '#f4dfb2', creamShade: '#d8b98b', gold: '#f2a33a', goldLit: '#ffd27a', goldDeep: '#b86a1c',
  mane: '#26121c', maneLit: '#3b1d2b', maneDeep: '#140a10', claw: '#f0a23a', leg: '#341522', legLit: '#4a2030',
};

const geoCache = new Map();
const donorCache = new Map();

// cabeça, mandíbula, galhada e bigodes esculpidos pelo laboratório (FRUTOMythEast), com a juba
// e os bigodes escurecidos para o visual da referência
const RECOLOR = {
  cabeca: { '#240818': '#140a10', '#96163c': '#3b1d2b', '#4c0c26': '#26121c' },
  bigode: { '#f5a824': '#4a2433', '#a8501c': '#2b1622', '#ffde66': '#5a3040' },
};
function recolored(T, geo, map) {
  const g = geo.clone();
  const c = g.attributes.color;
  const tmp = new T.Color();
  const table = Object.entries(map).map(([a, b]) => [new T.Color(a), new T.Color(b)]);
  for (let i = 0; i < c.count; i++) {
    tmp.setRGB(c.getX(i), c.getY(i), c.getZ(i));
    for (const [a, b] of table) {
      if (Math.abs(a.r - tmp.r) + Math.abs(a.g - tmp.g) + Math.abs(a.b - tmp.b) < 0.03) {
        c.setXYZ(i, b.r, b.g, b.b);
        break;
      }
    }
  }
  c.needsUpdate = true;
  return g;
}
function donor(T, models, data, level) {
  if (!donorCache.has(level)) {
    const d = FRUTOMythEast.create(T, models, data, 'completa', level);
    d.dark = {
      cabeca: recolored(T, d.meshes.cabeca.geometry, RECOLOR.cabeca),
      bigode_E: recolored(T, d.meshes.bigode_E.geometry, RECOLOR.bigode),
      bigode_D: recolored(T, d.meshes.bigode_D.geometry, RECOLOR.bigode),
    };
    donorCache.set(level, d);
  }
  return donorCache.get(level);
}
const palette = (T) => Object.fromEntries(Object.entries(pigments).map(([k, c]) => [k, new T.Color(c).toArray()]));

// tubo de anéis (mesma técnica do laboratório); colorFn(anel, fatia, altura relativa) → pigmento
function tube(T, models, s, rows, rgb, slices, colorFn) {
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const centers = rows.map((r) => V(r[0], r[1], r[2]));
  const rings = rows.map(([x, y, z, w, h], i) => {
    const tg = centers[Math.min(rows.length - 1, i + 1)].clone().sub(centers[Math.max(0, i - 1)]).normalize();
    const u = V(1, 0, 0).addScaledVector(tg, -tg.x).normalize();
    const v = V(0, 0, 0).crossVectors(tg, u).normalize();
    if (v.y < 0) v.negate();
    return Array.from({ length: slices }, (_, k) => {
      const a = ((k + 0.5) * tau) / slices;
      return V(x, y, z).addScaledVector(u, w * Math.cos(a)).addScaledVector(v, h * Math.sin(a)).toArray();
    });
  });
  const face = (pts, n, c) => s.polygon(models.oriented(pts, n), rgb[c]);
  face(rings[0].slice(), centers[0].clone().sub(centers[1]).toArray(), colorFn(0, 0, 0));
  for (let i = 1; i < rows.length; i++) {
    for (let k = 0; k < slices; k++) {
      const next = (k + 1) % slices;
      const a = rings[i - 1];
      const b = rings[i];
      const n = V(...a[k]).add(V(...a[next])).multiplyScalar(0.5).sub(centers[i - 1]);
      const up = Math.sin(((k + 1) * tau) / slices);
      face([a[k], a[next], b[next], b[k]], n.toArray(), colorFn(i, k, up));
    }
  }
  face(rings.at(-1).slice(), centers.at(-1).clone().sub(centers.at(-2)).toArray(), colorFn(rows.length, 0, 0));
}

// espinho (cone de 4 faces) da base para a ponta
function spike(T, models, s, rgb, base, tip, w, colors) {
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const b = V(...base);
  const t = V(...tip);
  const axis = t.clone().sub(b).normalize();
  const u = Math.abs(axis.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const s1 = V(0, 0, 0).crossVectors(axis, u).normalize().multiplyScalar(w);
  const s2 = V(0, 0, 0).crossVectors(axis, s1).normalize().multiplyScalar(w * 0.7);
  const ring = [b.clone().add(s1), b.clone().add(s2), b.clone().sub(s1), b.clone().sub(s2)];
  for (let i = 0; i < 4; i++) {
    const a = ring[i];
    const c = ring[(i + 1) % 4];
    const n = a.clone().add(c).multiplyScalar(0.5).sub(b).normalize();
    s.polygon(models.oriented([a.toArray(), c.toArray(), t.toArray()], n.toArray()), rgb[colors[i % 2]]);
  }
}
// tufo de juba / folha
function vane(T, models, s, rgb, base, height, len, w, colors, lean = 0) {
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const [x, y, z] = base;
  const start = V(x, y, z);
  const mid = V(x + lean * 0.46, y + height * 0.58, z - len * 0.39);
  const tip = V(x + lean, y + height, z - len);
  const axis = tip.clone().sub(start).normalize();
  const side = Math.abs(axis.x) > 0.8 ? V(0, w, 0) : V(w, 0, 0);
  const normal = V(0, 0, 0).crossVectors(axis, side).normalize();
  const depth = Math.min(w * 0.8, 0.1);
  const c0 = start.toArray();
  const c1 = mid.clone().add(side).toArray();
  const c2 = tip.toArray();
  const c3 = mid.clone().sub(side).toArray();
  const ridge = mid.clone().addScaledVector(normal, depth).toArray();
  const bottom = mid.clone().addScaledVector(normal, -depth * 0.58).toArray();
  const face = (pts, n, c) => s.polygon(models.oriented(pts, n), rgb[c]);
  for (const [v, k] of [[[c0, c1, ridge], 0], [[c1, c2, ridge], 1], [[c2, c3, ridge], 1], [[c3, c0, ridge], 0]]) face(v, normal.toArray(), colors[k]);
  for (const [u0, u1] of [[c0, c1], [c1, c2], [c2, c3], [c3, c0]]) face([u0, u1, bottom], normal.clone().negate().toArray(), colors[2]);
}

// dorso carmim com listras escuras, ventre creme largo em placas
const bodyColor = (dark) => (ring, k, up) => {
  if (up < 0.02) return ring % 2 ? 'cream' : 'creamShade';
  if (dark) return up > 0.6 ? 'dark' : (ring + k) % 3 ? 'darkLit' : 'dark';
  if (up > 0.75) return ring % 2 ? 'stripe' : 'crimson';
  return (ring + k) % 4 === 0 ? 'stripe' : ring % 2 ? 'crimsonLit' : 'crimson';
};

function segmentGeometry(T, models, i, level) {
  const key = `seg/${i}/${level}`;
  if (geoCache.has(key)) return geoCache.get(key);
  const s = new models.Surface(T);
  const rgb = palette(T);
  const r0 = radius(i);
  const r1 = radius(i + 1);
  const dark = i >= DARK_FROM;
  const slices = level === 2 ? 6 : 10;
  const rows = [];
  for (const z of [0.06, -0.14, -0.28, -0.42, -SEG_LEN - 0.02]) {
    const u = Math.max(0, Math.min(1, -z / SEG_LEN));
    const r = r0 + (r1 - r0) * u;
    rows.push([0, 0, z, r, r * 1.05]);
  }
  tube(T, models, s, rows, rgb, slices, bodyColor(dark));
  if (level < 2) {
    // espinhos dourados nas duas bordas do ventre e espinhos curtos no dorso
    for (const [z, k] of [[-0.12, 1], [-0.4, 0.85]]) {
      for (const sg of [-1, 1]) {
        const base = [sg * r0 * 0.92, -r0 * 0.38, z];
        spike(T, models, s, rgb, base, [sg * (r0 + 0.2 * k), -r0 * 0.62, z - 0.2], 0.04, ['gold', 'goldDeep']);
      }
      if (!dark) spike(T, models, s, rgb, [0, r0 * 0.98, z], [0, r0 + 0.16 * k, z - 0.16], 0.035, ['goldLit', 'gold']);
    }
    // juba que desce pelo começo do corpo
    if (i < 2) for (const sg of [-1, 0, 1]) vane(T, models, s, rgb, [sg * r0 * 0.6, r0 * 0.8, -0.05], 0.32, 0.55, 0.1, ['maneLit', 'mane', 'maneDeep'], sg * 0.3);
  }
  const g = s.geometry();
  geoCache.set(key, g);
  return g;
}

// pescoço erguido (curva em S para cima, como na referência) e juba farta
function neckGeometry(T, models, level) {
  const key = `neck/${level}`;
  if (geoCache.has(key)) return geoCache.get(key);
  const s = new models.Surface(T);
  const rgb = palette(T);
  const r = radius(0);
  tube(T, models, s, [[0, -0.02, -0.1, r, r * 1.05], [0, 0.22, 0.12, r * 0.97, r * 1.02], [0, 0.55, 0.22, r * 0.94, r], [0, 0.9, 0.24, r * 0.92, r * 0.98], [0, 1.18, 0.34, r * 0.9, r * 0.95]], rgb, level === 2 ? 6 : 10, bodyColor(false));
  if (level < 2) {
    for (let k = 0; k < 5; k++) {
      const y = 0.25 + k * 0.22;
      const z = 0.12 + k * 0.04;
      vane(T, models, s, rgb, [0, y, z - 0.1], 0.42 + 0.06 * k, 0.6, 0.13, ['maneLit', 'mane', 'maneDeep']);
      for (const sg of [-1, 1]) vane(T, models, s, rgb, [sg * 0.22, y, z], 0.3 + 0.05 * k, 0.55, 0.11, ['maneLit', 'mane', 'maneDeep'], sg * 0.45);
    }
  }
  const g = s.geometry();
  geoCache.set(key, g);
  return g;
}

// pata fina e escura, com garras laranja
function legGeometry(T, models, level) {
  const key = `leg/${level}`;
  if (geoCache.has(key)) return geoCache.get(key);
  const s = new models.Surface(T);
  const rgb = palette(T);
  const slices = level === 2 ? 5 : 8;
  tube(T, models, s, [[0, 0.04, 0, 0.13, 0.14], [0, -0.2, 0.06, 0.1, 0.11], [0, -0.42, 0.02, 0.08, 0.085]], rgb, slices, (ring, k) => ((ring + k) % 2 ? 'leg' : 'legLit'));
  const g = s.geometry();
  geoCache.set(key, g);
  return g;
}
function clawGeometry(T, models, level) {
  const key = `claw/${level}`;
  if (geoCache.has(key)) return geoCache.get(key);
  const s = new models.Surface(T);
  const rgb = palette(T);
  models.bevel(s, [0, -0.02, 0.06], [0.18, 0.08, 0.22], level === 0 ? 0.015 : 0, rgb.leg);
  for (let d = 0; d < 4; d++) {
    const x = (d - 1.5) * 0.05;
    spike(T, models, s, rgb, [x, -0.04, 0.16], [x * 1.3, -0.12, 0.3], 0.022, ['claw', 'goldDeep']);
  }
  const g = s.geometry();
  geoCache.set(key, g);
  return g;
}
// ponta da cauda: escura, com folhas douradas dos dois lados e ponta de flecha dourada
function tailTipGeometry(T, models, level) {
  const key = `tail/${level}`;
  if (geoCache.has(key)) return geoCache.get(key);
  const s = new models.Surface(T);
  const rgb = palette(T);
  const r = radius(SEGMENTS);
  tube(T, models, s, [[0, 0, 0.04, r, r], [0, 0, -0.5, r * 0.8, r * 0.8], [0, 0, -0.95, r * 0.55, r * 0.55]], rgb, level === 2 ? 5 : 8, () => 'dark');
  for (const [z, l] of [[-0.25, 0.3], [-0.6, 0.26], [-0.85, 0.2]]) {
    for (const sg of [-1, 1]) spike(T, models, s, rgb, [sg * r * 0.7, 0, z], [sg * (r + l), 0.02, z - l * 0.9], 0.07, ['gold', 'goldDeep']);
  }
  // ponta de flecha
  spike(T, models, s, rgb, [0, 0, -0.95], [0, 0, -1.4], 0.16, ['goldLit', 'gold']);
  const g = s.geometry();
  geoCache.set(key, g);
  return g;
}

export function create(T, models, data, form = 'completa', level = 0) {
  const d = donor(T, models, data, level);
  const mat = d.meshes.cabeca.material;
  const root = new T.Group();
  root.name = 'Dragao_Oriental_Celestial';
  root.scale.setScalar(1.25);
  const joints = {};
  const meshes = {};
  const parts = [];
  const add = (id, parent, pivot, geometry, meshScale = 1, material = mat) => {
    const j = new T.Group();
    j.name = id;
    j.position.fromArray(pivot);
    (parent ? joints[parent] : root).add(j);
    joints[id] = j;
    parts.push({ id, parent, pivot: [...pivot], rotation: [0, 0, 0] });
    if (geometry) {
      const m = new T.Mesh(geometry, material);
      m.name = `${id}_escamas`;
      m.castShadow = m.receiveShadow = true;
      if (meshScale !== 1) m.scale.setScalar(meshScale);
      j.add(m);
      meshes[id] = m;
    }
    return j;
  };
  add('peitoral', null, [0, 1.9, 0], segmentGeometry(T, models, 0, level));
  add('pescoco', 'peitoral', [0, 0.05, 0.12], neckGeometry(T, models, level));
  add('cabeca', 'pescoco', [0, 1.2, 0.42], d.dark.cabeca, 0.8);
  for (const id of ['mandibula', 'orelha_E', 'orelha_D', 'bigode_E', 'bigode_D']) {
    const p = d.parts.find((q) => q.id === id).pivot.map((v) => v * 0.8);
    add(id, 'cabeca', p, d.dark[id] ?? d.meshes[id].geometry, 0.8);
  }
  let prev = 'peitoral';
  for (let i = 1; i <= SEGMENTS; i++) {
    const id = `corpo_${i}`;
    add(id, prev, [0, 0, -SEG_LEN], segmentGeometry(T, models, i, level));
    prev = id;
  }
  add('cauda_ponta', prev, [0, 0, -SEG_LEN], tailTipGeometry(T, models, level));
  // patas: dianteiras logo atrás do pescoço, traseiras no meio do corpo
  for (const [side, x] of [['E', 1], ['D', -1]]) {
    for (const [front, seg] of [[true, 'corpo_1'], [false, 'corpo_7']]) {
      const leg = (front ? 'dianteira_' : 'traseira_') + side;
      const r = radius(front ? 1 : 7);
      add(`perna_${leg}`, seg, [x * r * 0.9, -r * 0.35, -0.2], legGeometry(T, models, level));
      add(`pata_${leg}`, `perna_${leg}`, [0, -0.44, 0.04], clawGeometry(T, models, level));
    }
  }
  const points = {
    peito: ['peitoral', [0, 0.2, 0.3]], boca: ['cabeca', [0, 0.14, 0.82]], pegada: ['mandibula', [0, 0, 0.4]],
    palma_E: ['pata_dianteira_E', [0, -0.08, 0.25]], punho_E: ['pata_dianteira_E', [0, -0.08, 0.25]], apoio_E: ['pata_traseira_E', [0, -0.08, 0.2]],
    palma_D: ['pata_dianteira_D', [0, -0.08, 0.25]], punho_D: ['pata_dianteira_D', [0, -0.08, 0.25]], apoio_D: ['pata_traseira_D', [0, -0.08, 0.2]],
    cauda: ['cauda_ponta', [0, 0, -1.2]],
  };
  const sockets = {};
  for (const [name, [parent, p]] of Object.entries(points)) {
    const o = new T.Object3D();
    o.name = name;
    o.position.fromArray(p);
    joints[parent].add(o);
    sockets[name] = o;
  }
  const rig = { form: 'completa', species: 'oriental', serpent: true, root, joints, meshes, sockets, points, parts, contacts: {} };
  rig.setLOD = (next) => {
    const dn = donor(T, models, data, next);
    for (const p of parts) {
      const m = meshes[p.id];
      if (!m) continue;
      if (p.id === 'peitoral' || p.id.startsWith('corpo_')) m.geometry = segmentGeometry(T, models, p.id === 'peitoral' ? 0 : Number(p.id.split('_')[1]), next);
      else if (p.id === 'pescoco') m.geometry = neckGeometry(T, models, next);
      else if (p.id.startsWith('perna_')) m.geometry = legGeometry(T, models, next);
      else if (p.id.startsWith('pata_')) m.geometry = clawGeometry(T, models, next);
      else if (p.id === 'cauda_ponta') m.geometry = tailTipGeometry(T, models, next);
      else m.geometry = dn.dark[p.id] ?? dn.meshes[p.id].geometry;
    }
  };
  return rig;
}

// ===== Golpes (M1 da forma completa) =====
// Cada golpe: release e duration (s) e o tipo do movimento; a pose é montada por envelopes.
const actions = {};
export function registerActions(defs) {
  Object.assign(actions, defs);
}
export const hasAction = (id) => !!actions[id];

export const strideRate = (form, drive) => tau * (0.7 + 1.1 * clamp(drive));

export function animate(T, motion, data, rig, state) {
  const j = rig.joints;
  const id = state.id || 'idle';
  const t = state.t || 0;
  const clock = state.clock ?? t;
  const dead = id === 'death';
  const wet = id === 'swim' || id === 'tread';
  const drive = clamp(state.gait ?? (id === 'walk' ? 0.5 : id === 'run' ? 1 : 0));
  const flying = !!state.flying || ['flight', 'glide', 'takeoff', 'forwardFlight'].includes(id);
  const wave = state.phase ?? clock * (2.2 + 4 * drive);
  const act = actions[id];
  const rel = act?.release ?? 0.2;
  const dur = act?.duration ?? 0.5;
  const ready = act ? event(t, rel * 0.55, rel * 0.55, rel * 0.5) : 0;
  const strike = act ? event(t, rel, rel * 0.45, (dur - rel) * 0.65) : 0;
  const fall = dead ? smooth(t / 1.1) : 0;
  // pairar: o corpo flutua acima do chão, mais alto no voo, rente à água nadando
  const hover = (wet ? 0.9 : flying ? 2.4 : 1.9) + 0.12 * Math.sin(clock * 1.7) * (1 - fall);
  const base = j.peitoral;
  base.position.set(0, hover * (1 - fall) + 0.6 * fall, 0);
  base.rotation.set(-0.06 * Math.sin(clock * 1.7 + 0.8) * (1 - fall) + 0.1 * fall, 0.09 * Math.sin(wave + 0.7) * (1 - fall), 0.05 * Math.sin(wave) * (1 - fall));
  // onda que percorre o corpo da cabeça para a cauda
  const amp = (0.12 + 0.12 * drive + (flying ? 0.05 : 0)) * (1 - 0.85 * fall);
  let coil = 0;
  let straight = 0;
  let whip = 0;
  if (act?.kind === 'investida') {
    coil = ready;
    straight = strike;
  }
  for (let i = 1; i <= SEGMENTS; i++) {
    const seg = j[`corpo_${i}`];
    const k = i / SEGMENTS;
    let ry = (amp * Math.sin(wave - i * 0.55) + 0.07 * Math.sin(i * 0.45 + 1)) * (0.7 + 0.6 * k);
    // curva em S de dragão celestial: o corpo sobe e desce em laços mesmo parado
    let rx = (0.24 * Math.sin(i * 0.55 + 0.6) + 0.06 * Math.sin(wave * 0.5 - i * 0.45)) * (1 - fall) + (dead ? 0.02 * Math.sin(i) * fall : 0);
    // investida: enrola em S e depois estica
    ry += coil * 0.28 * Math.sin(i * 1.05) * (1 - straight);
    ry *= 1 - 0.7 * straight;
    // chicote de cauda: a curva parte da base e chega à ponta com atraso
    if (act?.kind === 'cauda') {
      const lag = i * 0.018;
      const wind = event(t - lag, rel * 0.55, rel * 0.55, rel * 0.5);
      const crack = event(t - lag, rel, rel * 0.45, (dur - rel) * 0.6);
      ry += (0.16 * wind - 0.26 * crack) * (0.6 + 0.8 * k);
      whip = Math.max(whip, crack);
    }
    // rugido: o corpo se ergue atrás do peito
    if (act?.kind === 'rugido') rx += 0.05 * ready * (1 - k);
    seg.rotation.set(rx, ry, 0.03 * Math.sin(wave - i * 0.5) * (1 - fall));
  }
  j.cauda_ponta.rotation.set(-0.1, 0.3 * Math.sin(wave - 9) * (1 - fall) - 0.35 * whip, 0);
  // pescoço e cabeça compensam a onda e olham à frente
  const neck = j.pescoco;
  const head = j.cabeca;
  neck.rotation.set(0.05 * Math.sin(clock * 1.7) + 0.35 * fall, -base.rotation.y * 0.8, 0);
  head.rotation.set(-0.04 * Math.sin(clock * 1.7 + 0.5) + 0.25 * fall, -base.rotation.y * 0.4 + 0.06 * Math.sin(clock * 0.8) * (1 - drive), 0);
  head.position.set(0, 1.2, 0.42);
  j.mandibula.rotation.x = 0.04 + 0.03 * Math.sin(clock * 2.1);
  for (const [side, sign] of [['E', 1], ['D', -1]]) {
    j[`bigode_${side}`].rotation.set(0.05 * Math.sin(clock * 2 + sign), sign * 0.12 * Math.sin(clock * 1.4 + sign), 0);
    // patas: encolhidas sob o corpo, remando devagar no ar
    for (const [front, off] of [[true, 0], [false, 1.7]]) {
      const leg = (front ? 'dianteira_' : 'traseira_') + side;
      const paddle = Math.sin(wave * 0.7 + off + (sign > 0 ? 0 : Math.PI));
      j[`perna_${leg}`].rotation.set((front ? -0.25 : 0.45) + 0.28 * paddle * (1 - fall), 0, sign * (0.35 + 0.1 * fall));
      j[`pata_${leg}`].rotation.set(0.55 + 0.2 * paddle, 0, 0);
    }
  }
  if (!act) return;
  // ===== golpes =====
  const side = act.side ?? 'E';
  const sign = side === 'E' ? 1 : -1;
  if (act.kind === 'garra') {
    // garra anterior: a pata sobe à frente e corta para baixo, o peito acompanha
    const leg = j[`perna_dianteira_${side}`];
    leg.rotation.x += -1.5 * ready + 1.25 * strike;
    leg.rotation.z += sign * (0.25 * ready - 0.35 * strike);
    j[`pata_dianteira_${side}`].rotation.x += -0.7 * ready + 0.6 * strike;
    base.rotation.x += -0.12 * ready + 0.2 * strike;
    base.rotation.y += sign * (0.18 * ready - 0.22 * strike);
    base.position.z += 0.35 * strike;
    head.rotation.y += sign * 0.12 * strike;
  } else if (act.kind === 'cauda') {
    // chicote: o peito gira primeiro e a cauda chega por último
    base.rotation.y += 0.4 * ready - 0.5 * strike;
    neck.rotation.y -= 0.25 * ready - 0.3 * strike;
  } else if (act.kind === 'investida') {
    // ondulação e avanço: recua enrolado e dispara à frente, mandíbula aberta
    base.position.z += -0.4 * coil + 1.1 * straight;
    base.position.y -= 0.15 * coil;
    neck.rotation.x += -0.2 * coil + 0.35 * straight;
    head.rotation.x += 0.15 * straight;
    j.mandibula.rotation.x += 0.45 * straight;
    for (const s of ['E', 'D']) {
      j[`perna_dianteira_${s}`].rotation.x += 0.6 * straight;
      j[`perna_traseira_${s}`].rotation.x += 0.5 * straight;
    }
  } else if (act.kind === 'rugido') {
    // rugido: pescoço arqueia para trás, a cabeça projeta e a mandíbula abre bem
    base.position.y += 0.3 * ready;
    base.rotation.x -= 0.28 * ready - 0.12 * strike;
    neck.rotation.x += -0.6 * ready + 0.45 * strike;
    head.rotation.x += -0.25 * ready + 0.2 * strike;
    j.mandibula.rotation.x += 0.3 * ready + 0.75 * strike;
    for (const s of ['E', 'D']) {
      const sg = s === 'E' ? 1 : -1;
      j[`bigode_${s}`].rotation.y += sg * 0.45 * strike;
      j[`perna_dianteira_${s}`].rotation.z += sg * 0.5 * strike;
    }
  }
}

export const OrientalSerpent = { create, animate, strideRate, registerActions, hasAction, fileNames: { completa: 'Oriental_Serpente.glb' } };
