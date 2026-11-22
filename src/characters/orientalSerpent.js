// Dragão Oriental — forma completa nova (pedido do jogador; Prompt Mestre, seção 7: "corpo
// serpenteante articulado"). No laboratório a forma completa era um quadrúpede; aqui ela vira
// um dragão celestial que paira (refeito na atualização 22): peito, pescoço e dez segmentos
// grossos em cadeia com escamas em fileiras e aro dourado, barbatana dorsal de chamas, juba
// farta, quatro patas com garras douradas, nuvens sob o corpo e a pérola flamejante; a cabeça,
// a mandíbula, a galhada, os bigodes e as folhas da cauda são do laboratório (FRUTOMythEast).
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

export const SEGMENTS = 10;
const SEG_LEN = 0.66;
// grosso no peito, cheio no meio, fino na cauda
const radius = (i) => {
  const k = i / SEGMENTS;
  return 0.56 * (1 - 0.72 * k * k) + 0.03 * Math.sin(Math.PI * k);
};
const pigments = {
  lacquer: '#8e0b24', ruby: '#d62038', ember: '#f2463f', wine: '#5e0a20', claret: '#3e0d24', mane: '#4c0c26', maneLight: '#b01e45',
  ivory: '#fff0c8', belly: '#f1c27c', gold: '#f5a824', light: '#ffe27a', ochre: '#b8641c', cloud: '#ffffff', cloudShade: '#e6ecff',
};

const geoCache = new Map();
const donorCache = new Map();

// peças esculpidas pelo laboratório (cabeça, chifres, bigodes, folhas da cauda)
function donor(T, models, data, level) {
  if (!donorCache.has(level)) donorCache.set(level, FRUTOMythEast.create(T, models, data, 'completa', level));
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

// folha (barbatana, tufo de juba, chama) com crista
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

// escamas: dorso laca, flancos em fileiras rubi/brasa alternadas, ventre de placas marfim,
// e um aro dourado na frente de cada segmento
function scaleColor(ring, k, up) {
  if (ring <= 1) return up < -0.5 ? 'belly' : 'gold';
  if (up > 0.8) return 'lacquer';
  if (up < -0.55) return ring % 2 ? 'ivory' : 'belly';
  if (up < -0.1) return (ring + k) % 2 ? 'wine' : 'ruby';
  return (ring + k) % 2 ? 'ruby' : 'ember';
}

function segmentGeometry(T, models, i, level) {
  const key = `seg/${i}/${level}`;
  if (geoCache.has(key)) return geoCache.get(key);
  const s = new models.Surface(T);
  const rgb = palette(T);
  const r0 = radius(i);
  const r1 = radius(i + 1);
  const slices = level === 2 ? 6 : 10;
  const rows = [];
  // aro dourado fino + quatro anéis de escamas
  const zs = [0.12, 0.06, -0.12, -0.3, -0.48, -SEG_LEN - 0.02];
  zs.forEach((z, n) => {
    const u = Math.max(0, Math.min(1, -z / SEG_LEN));
    const r = (r0 + (r1 - r0) * u) * (n === 0 ? 0.97 : n === 1 ? 1.04 : 1 + 0.05 * Math.sin(Math.PI * u));
    rows.push([0, 0, z, r, r * 1.06]);
  });
  tube(T, models, s, rows, rgb, slices, scaleColor);
  if (level < 2) {
    const maned = i < 3;
    // barbatana dorsal: chamas douradas (juba escura no começo do corpo)
    for (const [z, h] of [[-0.05, 1], [-0.36, 0.78]]) {
      const height = (maned ? 0.46 : 0.34 - i * 0.018) * h;
      vane(T, models, s, rgb, [0, r0 * 0.95, z], height, height * 1.25, maned ? 0.1 : 0.07, maned ? ['maneLight', 'mane', 'claret'] : ['light', 'gold', 'ochre']);
    }
    if (maned) for (const sg of [-1, 1]) vane(T, models, s, rgb, [sg * r0 * 0.75, r0 * 0.55, -0.1], 0.3, 0.5, 0.08, ['maneLight', 'mane', 'claret'], sg * 0.35);
  }
  const g = s.geometry();
  geoCache.set(key, g);
  return g;
}

function neckGeometry(T, models, level) {
  const key = `neck/${level}`;
  if (geoCache.has(key)) return geoCache.get(key);
  const s = new models.Surface(T);
  const rgb = palette(T);
  const r = radius(0);
  tube(T, models, s, [[0, -0.05, -0.12, r, r * 1.05], [0, 0.18, 0.16, r * 0.94, r * 0.98], [0, 0.42, 0.38, r * 0.86, r * 0.9], [0, 0.6, 0.52, r * 0.8, r * 0.84]], rgb, level === 2 ? 6 : 10, scaleColor);
  if (level < 2) {
    // juba farta: tufos para trás e para os lados
    for (let k = 0; k < 4; k++) {
      vane(T, models, s, rgb, [0, 0.35 + k * 0.12, 0.1 + k * 0.13], 0.5, 0.62, 0.12, ['maneLight', 'mane', 'claret']);
      for (const sg of [-1, 1]) vane(T, models, s, rgb, [sg * 0.32, 0.2 + k * 0.12, 0.08 + k * 0.13], 0.28, 0.55, 0.09, ['maneLight', 'mane', 'claret'], sg * 0.4);
    }
  }
  const g = s.geometry();
  geoCache.set(key, g);
  return g;
}

// pata: braço escamado, tufo de chama no cotovelo e quatro garras douradas
function legGeometry(T, models, level, front) {
  const key = `leg/${front}/${level}`;
  if (geoCache.has(key)) return geoCache.get(key);
  const s = new models.Surface(T);
  const rgb = palette(T);
  const slices = level === 2 ? 5 : 8;
  tube(T, models, s, [[0, 0.05, 0, 0.2, 0.2], [0, -0.22, 0.04, 0.16, 0.17], [0, -0.46, 0.1, 0.13, 0.13]], rgb, slices, (ring, k, up) => (ring === 0 ? 'ruby' : (ring + k) % 2 ? 'ruby' : 'ember'));
  if (level < 2) vane(T, models, s, rgb, [0, -0.2, -0.08], 0.16, 0.34, 0.06, ['light', 'gold', 'ochre']);
  const g = s.geometry();
  geoCache.set(key, g);
  return g;
}
function clawGeometry(T, models, level) {
  const key = `claw/${level}`;
  if (geoCache.has(key)) return geoCache.get(key);
  const s = new models.Surface(T);
  const rgb = palette(T);
  const b = level === 0 ? 0.02 : 0;
  models.bevel(s, [0, -0.04, 0.08], [0.26, 0.1, 0.3], b, rgb.ruby);
  for (let d = 0; d < 4; d++) {
    const x = (d - 1.5) * 0.065;
    models.bevel(s, [x, -0.07, 0.25], [0.05, 0.05, 0.1], 0, rgb.gold);
    models.bevel(s, [x, -0.1, 0.31], [0.035, 0.035, 0.07], 0, rgb.light);
  }
  const g = s.geometry();
  geoCache.set(key, g);
  return g;
}
// nuvens sob o corpo (o dragão celestial anda sobre elas)
function cloudGeometry(T, models, level) {
  const key = `cloud/${level}`;
  if (geoCache.has(key)) return geoCache.get(key);
  const s = new models.Surface(T);
  const rgb = palette(T);
  const b = level === 0 ? 0.06 : 0;
  for (const [x, y, z, w, h, d] of [[0, 0, 0, 0.9, 0.32, 0.6], [0.35, 0.12, 0.1, 0.5, 0.36, 0.46], [-0.38, 0.08, -0.08, 0.52, 0.3, 0.44], [0.05, 0.2, -0.12, 0.42, 0.3, 0.4]]) {
    models.bevel(s, [x, y, z], [w, h, d], b, y > 0.1 ? rgb.cloud : rgb.cloudShade);
  }
  const g = s.geometry();
  geoCache.set(key, g);
  return g;
}

const pearlMat = new Map();
const cloudMat = new Map();

export function create(T, models, data, form = 'completa', level = 0) {
  const d = donor(T, models, data, level);
  const mat = d.meshes.cabeca.material;
  const root = new T.Group();
  root.name = 'Dragao_Oriental_Celestial';
  root.scale.setScalar(1.15);
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
  add('peitoral', null, [0, 2.2, 0], segmentGeometry(T, models, 0, level));
  add('pescoco', 'peitoral', [0, 0.08, 0.2], neckGeometry(T, models, level));
  add('cabeca', 'pescoco', [0, 0.62, 0.62], d.meshes.cabeca.geometry, 0.98);
  for (const id of ['mandibula', 'orelha_E', 'orelha_D', 'bigode_E', 'bigode_D']) {
    const p = d.parts.find((q) => q.id === id).pivot.map((v) => v * 0.98);
    add(id, 'cabeca', p, d.meshes[id].geometry, 0.98);
  }
  let prev = 'peitoral';
  for (let i = 1; i <= SEGMENTS; i++) {
    const id = `corpo_${i}`;
    add(id, prev, [0, 0, -SEG_LEN], segmentGeometry(T, models, i, level));
    prev = id;
  }
  add('cauda_folha', prev, [0, 0, -SEG_LEN], d.meshes.cauda_folha.geometry, 1.1);
  add('cauda_lamina', 'cauda_folha', [0.1, 0.02, -0.62], d.meshes.cauda_lamina.geometry, 1.1);
  // patas: dianteiras no 1º segmento, traseiras no 6º
  for (const [side, x] of [['E', 1], ['D', -1]]) {
    for (const [front, seg] of [[true, 'corpo_1'], [false, 'corpo_6']]) {
      const leg = (front ? 'dianteira_' : 'traseira_') + side;
      const r = radius(front ? 1 : 6);
      add(`perna_${leg}`, seg, [x * r * 0.82, -r * 0.35, -0.22], legGeometry(T, models, level, front), front ? 1 : 0.85);
      add(`pata_${leg}`, `perna_${leg}`, [0, -0.5, 0.12], clawGeometry(T, models, level), front ? 1 : 0.85);
    }
  }
  // nuvens sob o corpo e a pérola flamejante que o dragão persegue
  if (!cloudMat.has(T)) cloudMat.set(T, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, emissive: '#dfe8ff', emissiveIntensity: 0.45 }));
  add('nuvem_1', 'corpo_2', [0, -radius(2) - 0.3, -0.3], cloudGeometry(T, models, level), 1.5, cloudMat.get(T));
  add('nuvem_2', 'corpo_7', [0, -radius(7) - 0.26, -0.3], cloudGeometry(T, models, level), 1.2, cloudMat.get(T));
  if (!pearlMat.has(T)) pearlMat.set(T, new T.MeshStandardMaterial({ color: '#fff3c4', emissive: '#ffb02e', emissiveIntensity: 1.6, roughness: 0.3 }));
  add('perola', 'peitoral', [0.55, 0.15, 1.25], new T.IcosahedronGeometry(0.2, level === 2 ? 0 : 1), 1, pearlMat.get(T));
  const points = {
    peito: ['peitoral', [0, 0.25, 0.4]], boca: ['cabeca', [0, 0.16, 0.98]], pegada: ['mandibula', [0, 0, 0.45]],
    palma_E: ['pata_dianteira_E', [0, -0.08, 0.3]], punho_E: ['pata_dianteira_E', [0, -0.08, 0.3]], apoio_E: ['pata_traseira_E', [0, -0.08, 0.2]],
    palma_D: ['pata_dianteira_D', [0, -0.08, 0.3]], punho_D: ['pata_dianteira_D', [0, -0.08, 0.3]], apoio_D: ['pata_traseira_D', [0, -0.08, 0.2]],
    cauda: ['cauda_lamina', [0, 0, -0.45]],
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
      else if (p.id.startsWith('perna_')) m.geometry = legGeometry(T, models, next, p.id.includes('dianteira'));
      else if (p.id.startsWith('pata_')) m.geometry = clawGeometry(T, models, next);
      else if (p.id.startsWith('nuvem')) m.geometry = cloudGeometry(T, models, next);
      else if (dn.meshes[p.id]) m.geometry = dn.meshes[p.id].geometry;
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
  const hover = (wet ? 0.95 : flying ? 2.7 : 2.2) + 0.12 * Math.sin(clock * 1.7) * (1 - fall);
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
    let ry = (amp * Math.sin(wave - i * 0.62) + 0.05 * Math.sin(i * 0.55 + 1)) * (0.7 + 0.6 * k);
    // curva em S de dragão celestial: o corpo sobe e desce em laços mesmo parado
    let rx = (0.2 * Math.sin(i * 0.8 + 0.5) + 0.06 * Math.sin(wave * 0.5 - i * 0.45)) * (1 - fall) + (dead ? 0.02 * Math.sin(i) * fall : 0);
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
  j.cauda_folha.rotation.set(0, 0.25 * Math.sin(wave - 8) * (1 - fall) - 0.3 * whip, 0);
  j.cauda_lamina.rotation.set(0, 0.3 * Math.sin(wave - 8.6) * (1 - fall) - 0.25 * whip, 0);
  // pescoço e cabeça compensam a onda e olham à frente
  const neck = j.pescoco;
  const head = j.cabeca;
  neck.rotation.set(0.05 * Math.sin(clock * 1.7) + 0.35 * fall, -base.rotation.y * 0.8, 0);
  head.rotation.set(-0.04 * Math.sin(clock * 1.7 + 0.5) + 0.25 * fall, -base.rotation.y * 0.4 + 0.06 * Math.sin(clock * 0.8) * (1 - drive), 0);
  head.position.set(0, 0.62, 0.62);
  // a pérola flamejante gira diante do dragão; as nuvens respiram sob o corpo
  if (j.perola) {
    const o = clock * 1.3;
    j.perola.position.set(0.6 * Math.cos(o), 0.2 + 0.12 * Math.sin(o * 1.7), 1.3 + 0.25 * Math.sin(o));
    j.perola.rotation.set(o, o * 0.7, 0);
  }
  for (const [n, ph] of [['nuvem_1', 0], ['nuvem_2', 1.9]]) if (j[n]) j[n].scale.setScalar(1 + 0.06 * Math.sin(clock * 2 + ph));
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
