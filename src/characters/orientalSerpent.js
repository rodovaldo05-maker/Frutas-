// Dragão Oriental — forma completa nova (pedido do jogador; Prompt Mestre, seção 7: "corpo
// serpenteante articulado"). No laboratório a forma completa era um quadrúpede; aqui ela vira
// uma serpente celestial que paira: peito, pescoço e doze segmentos de corpo em cadeia, quatro
// patas curtas com garras, e a cabeça, a mandíbula, os chifres (orelhas), os bigodes e as folhas
// da ponta da cauda esculpidos pelo próprio laboratório (FRUTOMythEast), para manter a identidade.
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

export const SEGMENTS = 12;
const SEG_LEN = 0.6;
const radius = (i) => 0.42 - i * 0.026; // afina do peito até a cauda
const pigments = {
  lacquer: '#a80f2c', ruby: '#d62038', wine: '#680b24', claret: '#3e0d24', mane: '#4c0c26', maneLight: '#96163c',
  ivory: '#ffe3b0', belly: '#ebb178', gold: '#f5a824', light: '#ffde66', ochre: '#a8501c',
};

const geoCache = new Map();
const donorCache = new Map();

// peças esculpidas pelo laboratório (cabeça, chifres, bigodes, folhas da cauda e patas)
function donor(T, models, data, level) {
  if (!donorCache.has(level)) donorCache.set(level, FRUTOMythEast.create(T, models, data, 'completa', level));
  return donorCache.get(level);
}

// tubo de anéis octogonais (mesma técnica do laboratório): dorso laca, flancos rubi, ventre marfim
function tube(T, models, s, rows, rgb, slices = 8) {
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
  face(rings[0].slice(), centers[0].clone().sub(centers[1]).toArray(), 'ruby');
  for (let i = 1; i < rows.length; i++) {
    for (let k = 0; k < slices; k++) {
      const next = (k + 1) % slices;
      const a = rings[i - 1];
      const b = rings[i];
      const n = V(...a[k]).add(V(...a[next])).multiplyScalar(0.5).sub(centers[i - 1]);
      const h = rows[i - 1][4];
      const c = n.y > 0.55 * h ? 'lacquer' : n.y < -0.4 * h ? (k % 2 ? 'ivory' : 'belly') : 'ruby';
      face([a[k], a[next], b[next], b[k]], n.toArray(), c);
    }
  }
  face(rings.at(-1).slice(), centers.at(-1).clone().sub(centers.at(-2)).toArray(), 'wine');
}

// tufo de juba / espinho dorsal (folha com crista), na cor da juba ou do ouro
function vane(T, models, s, rgb, base, height, len, w, palette) {
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const [x, y, z] = base;
  const start = V(x, y, z);
  const mid = V(x, y + height * 0.58, z - len * 0.39);
  const tip = V(x, y + height, z - len);
  const axis = tip.clone().sub(start).normalize();
  const side = V(w, 0, 0);
  const normal = V(0, 0, 0).crossVectors(axis, side).normalize();
  const c0 = start.toArray();
  const c1 = mid.clone().add(side).toArray();
  const c2 = tip.toArray();
  const c3 = mid.clone().sub(side).toArray();
  const ridge = mid.clone().addScaledVector(normal, Math.min(w * 0.8, 0.1)).toArray();
  const bottom = mid.clone().addScaledVector(normal, -Math.min(w * 0.8, 0.1) * 0.58).toArray();
  const face = (pts, n, c) => s.polygon(models.oriented(pts, n), rgb[c]);
  for (const [v, k] of [[[c0, c1, ridge], 0], [[c1, c2, ridge], 1], [[c2, c3, ridge], 1], [[c3, c0, ridge], 0]]) face(v, normal.toArray(), palette[k]);
  for (const [u0, u1] of [[c0, c1], [c1, c2], [c2, c3], [c3, c0]]) face([u0, u1, bottom], normal.clone().negate().toArray(), palette[2]);
}

function segmentGeometry(T, models, i, level) {
  const key = `seg/${i}/${level}`;
  if (geoCache.has(key)) return geoCache.get(key);
  const s = new models.Surface(T);
  const rgb = Object.fromEntries(Object.entries(pigments).map(([k, c]) => [k, new T.Color(c).toArray()]));
  const r0 = radius(i);
  const r1 = radius(i + 1);
  const slices = level === 2 ? 6 : 8;
  // leve barriga: o anel do meio é um pouco mais cheio
  tube(T, models, s, [[0, 0, 0.08, r0 * 0.96, r0 * 1.02], [0, 0.01, -SEG_LEN * 0.5, (r0 + r1) * 0.52, (r0 + r1) * 0.55], [0, 0, -SEG_LEN - 0.02, r1, r1 * 1.04]], rgb, slices);
  if (level < 2) {
    // juba escura nos primeiros segmentos, espinhos dourados no resto
    const maned = i < 4;
    vane(T, models, s, rgb, [0, r0 * 0.92, -0.05], maned ? 0.32 : 0.2, maned ? 0.42 : 0.24, maned ? 0.09 : 0.05, maned ? ['maneLight', 'mane', 'claret'] : ['light', 'gold', 'ochre']);
    if (level === 0 && !maned) vane(T, models, s, rgb, [0, r0 * 0.9, -SEG_LEN * 0.55], 0.14, 0.16, 0.035, ['light', 'gold', 'ochre']);
    // placas do ventre
    models.bevel(s, [0, -r0 * 0.92, -SEG_LEN * 0.45], [r0 * 1.1, 0.05, SEG_LEN * 0.7], level === 0 ? 0.015 : 0, rgb.belly);
  }
  const g = s.geometry();
  geoCache.set(key, g);
  return g;
}

function neckGeometry(T, models, level) {
  const key = `neck/${level}`;
  if (geoCache.has(key)) return geoCache.get(key);
  const s = new models.Surface(T);
  const rgb = Object.fromEntries(Object.entries(pigments).map(([k, c]) => [k, new T.Color(c).toArray()]));
  tube(T, models, s, [[0, -0.05, -0.1, 0.4, 0.42], [0, 0.22, 0.18, 0.36, 0.37], [0, 0.48, 0.42, 0.33, 0.34]], rgb, level === 2 ? 6 : 8);
  if (level < 2) for (let k = 0; k < 3; k++) vane(T, models, s, rgb, [0, 0.28 + k * 0.18, 0.02 + k * 0.2], 0.36, 0.46, 0.1, ['maneLight', 'mane', 'claret']);
  const g = s.geometry();
  geoCache.set(key, g);
  return g;
}

const material = new Map();

export function create(T, models, data, form = 'completa', level = 0) {
  const d = donor(T, models, data, level);
  const mat = d.meshes.cabeca.material;
  material.set(T, mat);
  const root = new T.Group();
  root.name = 'Dragao_Oriental_Serpente';
  root.scale.setScalar(1.3);
  const joints = {};
  const meshes = {};
  const parts = [];
  const add = (id, parent, pivot, geometry, meshScale = 1) => {
    const j = new T.Group();
    j.name = id;
    j.position.fromArray(pivot);
    (parent ? joints[parent] : root).add(j);
    joints[id] = j;
    parts.push({ id, parent, pivot: [...pivot], rotation: [0, 0, 0] });
    if (geometry) {
      const m = new T.Mesh(geometry, mat);
      m.name = `${id}_escamas`;
      m.castShadow = m.receiveShadow = true;
      if (meshScale !== 1) m.scale.setScalar(meshScale);
      j.add(m);
      meshes[id] = m;
    }
    return j;
  };
  add('peitoral', null, [0, 1.7, 0], segmentGeometry(T, models, 0, level));
  add('pescoco', 'peitoral', [0, 0.1, 0.18], neckGeometry(T, models, level));
  add('cabeca', 'pescoco', [0, 0.42, 0.5], d.meshes.cabeca.geometry, 0.82);
  // peças presas à cabeça do laboratório (posições relativas escaladas com a cabeça)
  for (const id of ['mandibula', 'orelha_E', 'orelha_D', 'bigode_E', 'bigode_D']) {
    const p = d.parts.find((q) => q.id === id).pivot.map((v) => v * 0.82);
    add(id, 'cabeca', p, d.meshes[id].geometry, 0.82);
  }
  let prev = 'peitoral';
  for (let i = 1; i <= SEGMENTS; i++) {
    const id = `corpo_${i}`;
    add(id, prev, [0, 0, i === 1 ? -SEG_LEN + 0.02 : -SEG_LEN], segmentGeometry(T, models, i, level));
    prev = id;
  }
  add('cauda_folha', prev, [0, 0, -SEG_LEN], d.meshes.cauda_folha.geometry, 0.8);
  add('cauda_lamina', 'cauda_folha', [0, 0.02, -0.5], d.meshes.cauda_lamina.geometry, 0.8);
  // quatro patas curtas: dianteiras no 2º segmento, traseiras no 7º
  for (const [side, x] of [['E', 1], ['D', -1]]) {
    for (const [front, seg] of [[true, 'corpo_1'], [false, 'corpo_6']]) {
      const leg = (front ? 'dianteira_' : 'traseira_') + side;
      const r = radius(front ? 1 : 6);
      add(`perna_${leg}`, seg, [x * r * 0.85, -r * 0.45, -0.18], d.meshes[`perna_${leg}`].geometry, 0.62);
      add(`pata_${leg}`, `perna_${leg}`, [0, -0.36, 0.02], d.meshes[`pata_${leg}`].geometry, 0.62);
    }
  }
  const points = {
    peito: ['peitoral', [0, 0.2, 0.3]], boca: ['cabeca', [0, 0.14, 0.82]], pegada: ['mandibula', [0, 0, 0.4]],
    palma_E: ['pata_dianteira_E', [0, -0.1, 0.25]], punho_E: ['pata_dianteira_E', [0, -0.1, 0.25]], apoio_E: ['pata_traseira_E', [0, -0.1, 0.1]],
    palma_D: ['pata_dianteira_D', [0, -0.1, 0.25]], punho_D: ['pata_dianteira_D', [0, -0.1, 0.25]], apoio_D: ['pata_traseira_D', [0, -0.1, 0.1]],
    cauda: ['cauda_lamina', [0, 0, -0.4]],
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
  const hover = (wet ? 0.65 : flying ? 2.1 : 1.7) + 0.1 * Math.sin(clock * 1.7) * (1 - fall);
  const base = j.peitoral;
  base.position.set(0, hover * (1 - fall) + 0.45 * fall, 0);
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
    let ry = amp * Math.sin(wave - i * 0.62) * (0.7 + 0.6 * k);
    let rx = 0.05 * Math.sin(wave * 0.5 - i * 0.45) * (1 - fall) + (dead ? 0.02 * Math.sin(i) * fall : 0);
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
  head.position.set(0, 0.42, 0.5);
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
