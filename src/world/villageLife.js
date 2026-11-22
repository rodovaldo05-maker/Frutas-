// Vida da vila (atualização 11, doc 11 fases B3–B4): grafo das ruas, rotas de porta a porta
// sem atravessar casas, pontos dentro das casas (balcão, cama, mesas) e a rotina de cada
// morador (casa → trabalho → lazer → casa). Tudo puro e em coordenadas locais da vila, para
// os testes; villagers.js anima os corpos no mundo.

import { mulberry32 } from '../core/math.js';

export const SERVICE_ROLES = {
  prefeitura: { papel: 'missoes', nome: 'Inês', titulo: 'Mestre de Missões' },
  mercado: { papel: 'mercado', nome: 'Joana', titulo: 'Mercadora' },
  taverna: { papel: 'taverna', nome: 'Bento', titulo: 'Taverneiro' },
  ferreiro: { papel: 'ferreiro', nome: 'Rosa', titulo: 'Ferreira' },
  'loja-frutas': { papel: 'frutas', nome: 'Caio', titulo: 'Fruteiro' },
};
// moradores com trabalho ao ar livre
const OUTDOOR = [
  { nome: 'Tomé', titulo: 'Pescador', spot: 'cais' },
  { nome: 'Lia', titulo: 'Florista', spot: 'praca' },
  { nome: 'Davi', titulo: 'Carpinteiro', spot: 'feira' },
  { nome: 'Marta', titulo: 'Costureira', spot: 'praca' },
  { nome: 'Otávio', titulo: 'Marinheiro', spot: 'cais' },
];
const LOOKS = [
  { skin: '#c98d62', hair: '#2a1a12', shirt: '#3f7f5a', shorts: '#3b2a1c', shoes: '#4a3424' },
  { skin: '#e8c0a0', hair: '#8a4a1a', shirt: '#b8443a', shorts: '#2a3a55', shoes: '#3b2a1c' },
  { skin: '#8a5a3c', hair: '#1a1410', shirt: '#e0c060', shorts: '#4a3a2a', shoes: '#2a1f18' },
  { skin: '#d8a880', hair: '#5a3a1a', shirt: '#5a6ab8', shorts: '#2a2a33', shoes: '#4a3424' },
  { skin: '#a8714c', hair: '#c8c8c8', shirt: '#f2efe6', shorts: '#3a2a20', shoes: '#2a1f18' },
  { skin: '#f0cfb0', hair: '#e0b060', shirt: '#8a3a8a', shorts: '#2a3040', shoes: '#3b2a1c' },
];

// ===== Geometria das casas =====
export function toWorldOfBuilding(b, lx, lz) {
  const r = b.rotY;
  return { x: b.x + Math.cos(r) * lx + Math.sin(r) * lz, z: b.z - Math.sin(r) * lx + Math.cos(r) * lz };
}

export function toBuildingLocal(b, x, z) {
  const r = b.rotY;
  const dx = x - b.x;
  const dz = z - b.z;
  return { x: Math.cos(r) * dx - Math.sin(r) * dz, z: Math.sin(r) * dx + Math.cos(r) * dz };
}

export const isService = (b) => !!SERVICE_ROLES[b.tipo];

// Planta de dentro (coordenadas da casa; a porta fica em z = +d/2): balcão, pontos e móveis
export function interiorOf(b) {
  const { w, d } = b;
  if (isService(b)) {
    const counter = { x: -0.75, z: -d / 2 + 2.1, w: w - 3.3, d: 1.0 };
    const gapX = w / 2 - 1.45; // passagem à direita do balcão
    return {
      counter,
      worker: { x: 0, z: -d / 2 + 1.2 }, // atrás do balcão, olhando a porta
      customer: { x: -0.4, z: -d / 2 + 3.35 }, // onde o jogador fala com quem atende
      workerPath: [{ x: gapX, z: -d / 2 + 3.2 }, { x: gapX, z: -d / 2 + 1.2 }],
      // lazer (taverna): em volta da mesa do canto esquerdo e perto da janela
      seats: [{ x: -w / 2 + 1.4, z: d / 2 - 1.9 }, { x: -w / 2 + 1.4, z: d / 2 - 3.9 }, { x: -w / 2 + 2.6, z: d / 2 - 2.9 }, { x: 0.9, z: d / 2 - 3.4 }],
      table: { x: -w / 2 + 1.4, z: d / 2 - 2.9, w: 1.0, d: 1.0 },
    };
  }
  return {
    bed: { x: -w / 2 + 1.7, z: -d / 2 + 2.4, w: 2.2, d: 3.6 },
    table: { x: w / 2 - 1.5, z: 0.4, w: 1.5, d: 1.5 },
    shelf: { x: w / 2 - 1.4, z: -d / 2 + 0.85, w: 1.6, d: 0.5 },
    rest: [{ x: w / 2 - 1.4, z: -d / 2 + 1.5 }, { x: 0.3, z: d / 2 - 1.9 }], // onde os moradores ficam em casa
  };
}

export function doorPoints(b) {
  return {
    inside: toWorldOfBuilding(b, 0, b.d / 2 - 1.1),
    door: toWorldOfBuilding(b, 0, b.d / 2),
    outside: toWorldOfBuilding(b, 0, b.d / 2 + 1.7),
  };
}

// ===== Grafo das ruas =====
export function buildStreetGraph(v) {
  const nodes = [];
  const edges = [];
  const add = (x, z) => nodes.push({ x, z }) - 1;
  const link = (a, b) => edges.push([a, b, Math.hypot(nodes[a].x - nodes[b].x, nodes[a].z - nodes[b].z)]);
  const avenues = v.streets.filter((s) => s.tipo === 'avenida');
  const ring = v.streets.filter((s) => s.tipo === 'anel');
  const ringR = Math.hypot(...ring[0].a);
  // anel: vértices + cruzamentos com as avenidas, em ordem de ângulo
  const ringPts = ring.map((s) => ({ ang: Math.atan2(s.a[1], s.a[0]), i: add(s.a[0], s.a[1]) }));
  const starts = [];
  for (const s of avenues) {
    const a = s.angle;
    const start = add(s.a[0], s.a[1]);
    const cross = add(Math.cos(a) * ringR, Math.sin(a) * ringR);
    const end = add(s.b[0], s.b[1]);
    link(start, cross);
    link(cross, end);
    ringPts.push({ ang: Math.atan2(Math.sin(a), Math.cos(a)), i: cross });
    starts.push({ ang: Math.atan2(Math.sin(a), Math.cos(a)), i: start });
  }
  ringPts.sort((p, q) => p.ang - q.ang);
  for (let k = 0; k < ringPts.length; k++) link(ringPts[k].i, ringPts[(k + 1) % ringPts.length].i);
  // praça: as avenidas se ligam por arcos em volta do chafariz (raio 7,5)
  starts.sort((p, q) => p.ang - q.ang);
  for (let k = 0; k < starts.length; k++) {
    const p = starts[k];
    const q = starts[(k + 1) % starts.length];
    let mid = (p.ang + q.ang) / 2;
    if (q.ang < p.ang) mid += Math.PI;
    const m = add(Math.cos(mid) * 7.5, Math.sin(mid) * 7.5);
    link(p.i, m);
    link(m, q.i);
  }
  const adj = nodes.map(() => []);
  for (const [a, b, w] of edges) {
    adj[a].push([b, w]);
    adj[b].push([a, w]);
  }
  return { nodes, edges, adj };
}

// Ponto da rua mais perto (na aresta do grafo)
export function streetAccess(g, x, z) {
  let best = null;
  for (const [a, b] of g.edges) {
    const A = g.nodes[a];
    const B = g.nodes[b];
    const vx = B.x - A.x;
    const vz = B.z - A.z;
    const l2 = vx * vx + vz * vz || 1;
    const t = Math.max(0, Math.min(1, ((x - A.x) * vx + (z - A.z) * vz) / l2));
    const px = A.x + vx * t;
    const pz = A.z + vz * t;
    const d = Math.hypot(x - px, z - pz);
    if (!best || d < best.d) best = { x: px, z: pz, a, b, d };
  }
  return best;
}

// Caminho pela rua entre dois pontos (cada um entra na rua pelo ponto mais perto)
export function streetPath(g, from, to) {
  const P = streetAccess(g, from.x, from.z);
  const Q = streetAccess(g, to.x, to.z);
  if ((P.a === Q.a && P.b === Q.b) || (P.a === Q.b && P.b === Q.a)) return [{ x: P.x, z: P.z }, { x: Q.x, z: Q.z }];
  const n = g.nodes.length;
  const dist = new Float64Array(n).fill(Infinity);
  const prev = new Int32Array(n).fill(-1);
  const done = new Uint8Array(n);
  dist[P.a] = Math.hypot(P.x - g.nodes[P.a].x, P.z - g.nodes[P.a].z);
  dist[P.b] = Math.min(dist[P.b], Math.hypot(P.x - g.nodes[P.b].x, P.z - g.nodes[P.b].z));
  for (;;) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0) break;
    done[u] = 1;
    for (const [v, w] of g.adj[u]) {
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        prev[v] = u;
      }
    }
  }
  const endCost = (i) => dist[i] + Math.hypot(Q.x - g.nodes[i].x, Q.z - g.nodes[i].z);
  let last = endCost(Q.a) <= endCost(Q.b) ? Q.a : Q.b;
  const chain = [];
  while (last >= 0) {
    chain.unshift(g.nodes[last]);
    last = prev[last];
  }
  return [{ x: P.x, z: P.z }, ...chain.map((p) => ({ x: p.x, z: p.z })), { x: Q.x, z: Q.z }];
}

// ===== Lugares e moradores =====
// Lugares da rotina: { kind: 'casa'|'servico'|'fora', building?, point, inner: [...] }
export function outdoorSpot(v, spot, idx) {
  if (spot === 'praca') {
    const a = idx * 2.1 + 0.4;
    return { x: Math.cos(a) * 5.6, z: Math.sin(a) * 5.6 };
  }
  if (spot === 'cais') return { x: -76 + (idx % 2) * 1.6, z: idx % 2 ? -3.4 : 3.4 };
  const m = v.buildings.find((b) => b.tipo === 'mercado');
  const p = toWorldOfBuilding(m, (idx % 2 ? 1 : -1) * 2.6, m.d / 2 + 2.2);
  return p;
}

export function makeVillagers(v, seed = v.seed) {
  const rnd = mulberry32(seed * 31 + 7);
  const homes = v.buildings.filter((b) => !isService(b)).sort((p, q) => Math.hypot(p.x, p.z) - Math.hypot(q.x, q.z));
  const taverna = v.buildings.find((b) => b.tipo === 'taverna');
  const list = [];
  let i = 0;
  for (const b of v.buildings.filter(isService)) {
    const r = SERVICE_ROLES[b.tipo];
    list.push({ id: `morador-${r.papel}`, nome: r.nome, titulo: r.titulo, papel: r.papel, work: { building: b.id } });
  }
  OUTDOOR.forEach((o, k) => list.push({ id: `morador-${o.nome.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}`, nome: o.nome, titulo: o.titulo, papel: 'morador', work: { spot: o.spot, idx: k } }));
  for (const m of list) {
    m.home = homes[i % homes.length].id;
    m.homeSlot = Math.floor(i / homes.length);
    m.leisure = i % 2 === 0 && taverna ? { building: taverna.id, seat: i % 4 } : { spot: 'praca', idx: i + 3 };
    m.offset = Math.round((rnd() - 0.5) * 60); // minutos: cada um sai num horário um pouco diferente
    m.look = LOOKS[i % LOOKS.length];
    i += 1;
  }
  return list;
}

// Rotina pela hora (0–24): casa → trabalho (6h30–17h30) → lazer (até 21h) → casa
export function activityAt(hour, m) {
  const t = (((hour - m.offset / 60) % 24) + 24) % 24;
  if (t >= 6.5 && t < 17.5) return 'trabalho';
  if (t >= 17.5 && t < 21) return 'lazer';
  return 'casa';
}

// Dormindo (em casa tarde da noite): o corpo não aparece
export function sleepingAt(hour, m) {
  const t = (((hour - m.offset / 60) % 24) + 24) % 24;
  return t >= 22 || t < 6;
}

const byId = (v, id) => v.buildings.find((b) => b.id === id);

// Ponto final de uma atividade e os pontos dentro da construção (da porta até o lugar)
export function placeOf(v, m, act) {
  if (act === 'casa') {
    const b = byId(v, m.home);
    const rest = interiorOf(b).rest[m.homeSlot % 2];
    return { building: b, inner: [toWorldOfBuilding(b, rest.x, rest.z)], yaw: b.rotY + Math.PI };
  }
  const t = act === 'trabalho' ? m.work : m.leisure;
  if (t.building) {
    const b = byId(v, t.building);
    const it = interiorOf(b);
    if (act === 'trabalho') {
      return { building: b, inner: [...it.workerPath, it.worker].map((p) => toWorldOfBuilding(b, p.x, p.z)), yaw: b.rotY };
    }
    const s = it.seats[t.seat % it.seats.length];
    return { building: b, inner: [toWorldOfBuilding(b, s.x, s.z)], yaw: b.rotY + Math.PI };
  }
  const p = outdoorSpot(v, t.spot, t.idx);
  return { building: null, inner: [p], yaw: t.spot === 'cais' ? -Math.PI / 2 : Math.atan2(-p.x, -p.z) };
}

// Rota completa de um lugar a outro: sai pela porta, segue a rua, entra pela outra porta
export function route(v, g, fromPlace, toPlace) {
  const pts = [];
  if (fromPlace.building) {
    const d = doorPoints(fromPlace.building);
    pts.push(...[...fromPlace.inner].reverse(), d.inside, d.door, d.outside); // do lugar atual até a porta
  } else pts.push(fromPlace.inner[0]);
  const start = pts[pts.length - 1];
  const endDoor = toPlace.building ? doorPoints(toPlace.building) : null;
  const goal = endDoor ? endDoor.outside : toPlace.inner[0];
  pts.push(...streetPath(g, start, goal));
  if (endDoor) pts.push(endDoor.outside, endDoor.door, endDoor.inside, ...toPlace.inner);
  else pts.push(toPlace.inner[0]);
  // tira pontos repetidos
  return pts.filter((p, i) => i === 0 || Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z) > 0.05);
}

// Uma linha passa por dentro de alguma casa (fora as casas de origem e destino)?
export function crossesBuilding(v, a, b, skip = []) {
  const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.25);
  for (const bd of v.buildings) {
    if (skip.includes(bd)) continue;
    for (let i = 0; i <= n; i++) {
      const t = i / Math.max(1, n);
      const p = toBuildingLocal(bd, a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t);
      if (Math.abs(p.x) < bd.w / 2 - 0.15 && Math.abs(p.z) < bd.d / 2 - 0.15) return bd;
    }
  }
  return null;
}
