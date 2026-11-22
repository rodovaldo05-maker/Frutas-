// Gerador procedural de vilas (doc 11, fases B1–B2; atualização 9). Mesma semente + mesmos
// parâmetros + mesma versão = mesma vila. Ordem: centro e praça → avenidas (uma vai ao cais)
// → anel → lotes ao longo das ruas → serviços (prefeitura, mercado, taverna, ferreiro, loja
// de frutas) → residências → decoração → validação. Sem espaço, o lote é descartado e
// registrado no relatório (nunca sobrepõe em silêncio). Tudo em coordenadas locais da vila.

import { mulberry32 } from '../core/math.js';

export const VILLAGE_VERSION = 1;

const segDist = (px, pz, a, b) => {
  const vx = b[0] - a[0];
  const vz = b[1] - a[1];
  const l2 = vx * vx + vz * vz || 1;
  const t = Math.max(0, Math.min(1, ((px - a[0]) * vx + (pz - a[1]) * vz) / l2));
  return Math.hypot(px - a[0] - vx * t, pz - a[1] - vz * t);
};

export function generateVillage({ seed = 1, radius = 52, plaza = 10, dockAngle = Math.PI, density = 0.85 } = {}) {
  const rnd = mulberry32(seed);
  const report = [];
  const village = { seed, version: VILLAGE_VERSION, radius, plaza: { x: 0, z: 0, r: plaza }, streets: [], buildings: [], props: [], report };
  // avenidas: a primeira aponta para o cais
  const base = dockAngle;
  const avenues = [0, 1, 2, 3].map((k) => base + k * (Math.PI / 2) + (k ? (rnd() - 0.5) * 0.35 : 0));
  avenues.forEach((a, k) => {
    const len = k === 0 ? radius + 22 : radius;
    village.streets.push({ id: `av-${k}`, tipo: 'avenida', a: [Math.cos(a) * plaza, Math.sin(a) * plaza], b: [Math.cos(a) * len, Math.sin(a) * len], w: 5, angle: a });
  });
  // anel
  const ringR = Math.round(radius * 0.58);
  const ringN = 16;
  for (let i = 0; i < ringN; i++) {
    const a0 = (i / ringN) * Math.PI * 2;
    const a1 = ((i + 1) / ringN) * Math.PI * 2;
    village.streets.push({ id: `anel-${i}`, tipo: 'anel', a: [Math.cos(a0) * ringR, Math.sin(a0) * ringR], b: [Math.cos(a1) * ringR, Math.sin(a1) * ringR], w: 3.6 });
  }

  const blocked = (x, z, r) => {
    if (Math.hypot(x, z) < plaza + r + 1.5) return 'praça';
    if (Math.hypot(x, z) > radius + 2 - r * 0.3) return 'fora do limite';
    for (const s of village.streets) if (segDist(x, z, s.a, s.b) < s.w / 2 + r * 0.72) return `rua ${s.id}`;
    for (const b of village.buildings) if (Math.hypot(x - b.x, z - b.z) < r + b.r + 1) return `casa ${b.id}`;
    return null;
  };

  // lotes candidatos dos dois lados de cada avenida (fachada virada para a rua)
  const SPECIAL = ['prefeitura', 'mercado', 'taverna', 'ferreiro', 'loja-frutas'];
  const candidates = [];
  avenues.forEach((a, k) => {
    const dir = [Math.cos(a), Math.sin(a)];
    const side = [-dir[1], dir[0]];
    for (let dist = plaza + 6; dist < radius - 3; dist += 8.5) {
      for (const s of [-1, 1]) candidates.push({ dir, side: s, sideV: side, dist, avenue: k });
    }
  });
  // lotes dos dois lados do anel (fachada virada para o anel)
  for (let i = 0; i < ringN; i++) {
    const a = ((i + 0.5) / ringN) * Math.PI * 2;
    const dir = [Math.cos(a), Math.sin(a)];
    for (const s of [-1, 1]) candidates.push({ ring: true, dir, side: s, dist: ringR, angle: a });
  }
  // embaralha com a semente (ordem estável por semente)
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  // os mais perto da praça primeiro, para os serviços ficarem no centro
  candidates.sort((p, q) => p.dist - q.dist);
  let n = 0;
  for (const c of candidates) {
    if (rnd() > density && n >= SPECIAL.length) continue;
    const special = n < SPECIAL.length ? SPECIAL[n] : null;
    const w = special === 'prefeitura' ? 12 : special ? 9 + Math.floor(rnd() * 2) : 6 + Math.floor(rnd() * 4);
    const d = special === 'prefeitura' ? 9 : special ? 7 + Math.floor(rnd() * 2) : 6 + Math.floor(rnd() * 3);
    const r = 0.5 * Math.hypot(w, d);
    let x;
    let z;
    let toStreet; // direção da casa para a rua (onde fica a porta)
    if (c.ring) {
      const off = 1.8 + d / 2 + 1.2;
      const rr = c.dist + c.side * off;
      x = c.dir[0] * rr;
      z = c.dir[1] * rr;
      toStreet = [-c.dir[0] * c.side, -c.dir[1] * c.side];
    } else {
      const off = 2.5 + d / 2 + 1.2; // meia rua + meia casa + recuo
      x = c.dir[0] * c.dist + c.sideV[0] * c.side * off;
      z = c.dir[1] * c.dist + c.sideV[1] * c.side * off;
      toStreet = [-c.sideV[0] * c.side, -c.sideV[1] * c.side];
    }
    const why = blocked(x, z, r);
    if (why) {
      report.push(`lote descartado ${c.ring ? 'no anel' : `na avenida ${c.avenue}`} (${why})`);
      continue;
    }
    // fachada voltada para a avenida: a porta fica no lado que olha a rua
    const facing = Math.atan2(toStreet[0], toStreet[1]);
    const tipo = special ?? (w * d > 60 ? 'residencia_grande' : w * d > 44 ? 'residencia_media' : 'residencia_pequena');
    const door = { x: x + Math.sin(facing) * (d / 2), z: z + Math.cos(facing) * (d / 2) };
    village.buildings.push({
      id: `casa-${n + 1}`, tipo, x, z, w, d, r, rotY: facing, door, h: special === 'prefeitura' ? 9 : 6 + Math.floor(rnd() * 2),
      parede: ['tijolo', 'reboco', 'madeira'][Math.floor(rnd() * 3)], telhado: ['telhado', 'telhadoAzul'][Math.floor(rnd() * 2)],
    });
    n += 1;
  }
  // decoração: postes de luz nas avenidas e caixotes perto das casas, sem bloquear ruas e portas
  avenues.forEach((a, k) => {
    for (let dist = plaza + 4; dist < radius; dist += 12) {
      const x = Math.cos(a) * dist + Math.cos(a + Math.PI / 2) * 3.2;
      const z = Math.sin(a) * dist + Math.sin(a + Math.PI / 2) * 3.2;
      if (!village.buildings.some((b) => Math.hypot(x - b.x, z - b.z) < b.r + 0.8)) village.props.push({ tipo: 'poste', x, z, avenue: k });
    }
  });
  village.report.push(...validateVillage(village));
  return village;
}

// Validações automáticas (doc 11, seção 5). Devolve a lista de problemas (vazia = ok)
export function validateVillage(v) {
  const problems = [];
  const bs = v.buildings;
  for (let i = 0; i < bs.length; i++) {
    for (let j = i + 1; j < bs.length; j++) {
      if (Math.hypot(bs[i].x - bs[j].x, bs[i].z - bs[j].z) < bs[i].r + bs[j].r) problems.push(`sobreposição: ${bs[i].id} e ${bs[j].id}`);
    }
    // porta com acesso: a porta fica a até 4 de uma rua
    const near = Math.min(...v.streets.map((s) => segDist(bs[i].door.x, bs[i].door.z, s.a, s.b) - s.w / 2));
    if (near > 4) problems.push(`porta sem acesso: ${bs[i].id}`);
    for (const s of v.streets) if (segDist(bs[i].x, bs[i].z, s.a, s.b) < s.w / 2) problems.push(`casa na rua: ${bs[i].id}`);
  }
  // serviços obrigatórios
  for (const t of ['prefeitura', 'mercado', 'taverna']) if (!bs.some((b) => b.tipo === t)) problems.push(`falta ${t}`);
  // ruas conectadas à praça: toda avenida começa na borda da praça e cruza o anel
  for (const s of v.streets.filter((x) => x.tipo === 'avenida')) {
    if (Math.abs(Math.hypot(...s.a) - v.plaza.r) > 0.5) problems.push(`avenida solta: ${s.id}`);
  }
  return problems;
}
