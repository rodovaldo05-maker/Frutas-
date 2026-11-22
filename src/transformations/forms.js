// Formas das frutas de fera (atualizações 13 e 21; docs 04 e 08; Prompt Mestre, seção 7):
// Lobo, Falcão, Besta, Fênix, Dragão Oriental e Dragão Ocidental.
// Desde a atualização 21 os corpos são os do FRUTO Laboratório Voxel (HTML Edição 18), sem
// mudança de modelo: forma híbrida (corpo humanoide com cauda, asas, chifres, focinho) e forma
// completa (Lobo e Besta quadrúpedes, Falcão e Fênix aves, Dragão Ocidental com quatro patas e
// asas). Só o Dragão Oriental completo é novo: serpente celestial articulada (orientalSerpent.js).
// As animações de golpe das formas são novas (formM1.js); a locomoção é a do laboratório.
// Híbrida: maestria 191 da fruta. Completa: maestria 491. Tecla H ou botão Forma: humana → híbrida
// → completa → humana. Transformar leva 0,6 s, com invulnerabilidade; não gasta energia.

import * as THREE from 'three';
import DATA from '../../data/fruto-catalog.json';
import { FRUTOModels } from '../characters/fruto-models.js';
import { FRUTOWolf, FRUTOFalcon, FRUTOMythBeast, FRUTOMythPhoenix, FRUTOMythEast, FRUTOMythWest } from '../characters/fruto-animals.js';
import { OrientalSerpent } from '../characters/orientalSerpent.js';
import { FRUTOMotion } from '../animation/fruto-motion.js';
import { completeId, hybridOverlay } from './formM1.js';

export const FORM_UNLOCK = 191; // forma híbrida (maestria 1–1000; antes domínio 20)
export const COMPLETE_UNLOCK = 491; // forma completa (antes domínio 50)
export const FORM_TIME = 0.6;
export const SHAPES = ['hibrida', 'completa'];

// speed: velocidade no chão; melee/fruit: dano; mitigation: dano físico recebido; extraJumps
// e glide: voo das formas aladas (bater as asas = saltos extras); regen: vida por segundo
export const FORMS = {
  lobo: {
    nome: 'Lobo Híbrido', speed: 1.2, melee: 1.15, fruit: 1.15, desc: '+20% de velocidade, +15% de dano corpo a corpo e da fruta',
    completa: { nome: 'Lobo Completo', speed: 1.45, melee: 1.3, fruit: 1.2, mitigation: 0.05, desc: 'Quatro patas: +45% de velocidade, +30% de dano corpo a corpo' },
  },
  besta: {
    nome: 'Besta Híbrida', speed: 0.95, melee: 1.25, fruit: 1.15, mitigation: 0.1, desc: '+25% de dano corpo a corpo, −10% de dano físico recebido, um pouco mais lenta',
    completa: { nome: 'Besta Completa', speed: 1.2, melee: 1.45, fruit: 1.2, mitigation: 0.2, desc: 'Colosso de quatro patas: +45% de dano corpo a corpo, −20% de dano físico' },
  },
  falcao: {
    nome: 'Falcão Híbrido', fruit: 1.15, extraJumps: 2, glide: 1.3, fall: 0.5, desc: 'Asas: +2 batidas no ar, plana 30% mais rápido, metade do dano de queda',
    completa: { nome: 'Falcão Completo', speed: 1.05, fruit: 1.25, extraJumps: 4, glide: 1.6, fall: 0.2, desc: 'Ave: +4 batidas no ar, plana 60% mais rápido, quase sem dano de queda' },
  },
  fenix: {
    nome: 'Fênix Híbrida', fruit: 1.25, extraJumps: 2, glide: 1.2, regen: 2, desc: 'Asas de fogo azul: +2 batidas no ar, recupera 2 de vida por segundo',
    completa: { nome: 'Fênix Completa', fruit: 1.35, extraJumps: 4, glide: 1.5, fall: 0.3, regen: 4, desc: 'Ave de aurora: +4 batidas no ar, recupera 4 de vida por segundo' },
  },
  oriental: {
    nome: 'Dragão Oriental Híbrido', fruit: 1.25, extraJumps: 2, glide: 1.25, desc: 'Juba e chifres: +2 batidas no ar, +25% de dano da fruta',
    completa: { nome: 'Dragão Oriental Completo', speed: 1.15, fruit: 1.35, extraJumps: 4, glide: 1.5, fall: 0.2, desc: 'Serpente celestial que paira: +4 impulsos no ar, +35% de dano da fruta' },
  },
  ocidental: {
    nome: 'Dragão Ocidental Híbrido', fruit: 1.25, extraJumps: 2, glide: 1.2, mitigation: 0.05, desc: 'Asas de dragão: +2 batidas no ar, −5% de dano físico recebido',
    completa: { nome: 'Dragão Ocidental Completo', melee: 1.3, fruit: 1.3, extraJumps: 3, glide: 1.35, mitigation: 0.15, desc: 'Colosso alado: +3 batidas no ar, −15% de dano físico recebido' },
  },
};
export const FORM_IDS = Object.keys(FORMS);
export const hasForm = (fruitId) => !!FORMS[fruitId];
export const formInfo = (formId, shape = 'hibrida') => (shape === 'completa' ? FORMS[formId]?.completa : FORMS[formId]) ?? null;

const NEUTRAL = { speed: 1, melee: 1, fruit: 1, mitigation: 0, extraJumps: 0, glide: 1, fall: 1, regen: 0 };
export function formMods(formId, shape = 'hibrida') {
  const info = formInfo(formId, shape);
  if (!info) return { ...NEUTRAL };
  const { nome, desc, completa, ...mods } = info;
  return { ...NEUTRAL, ...mods };
}

// Pode assumir esta forma agora? (motivo ou null)
export function formBlock(fruitId, domainLevel, shape = 'hibrida') {
  if (!hasForm(fruitId)) return 'Só frutas de fera (Lobo, Falcão, Besta, Fênix e Dragões) têm forma híbrida.';
  if (domainLevel < FORM_UNLOCK) return `Forma híbrida: maestria ${FORM_UNLOCK} da fruta.`;
  if (shape === 'completa' && domainLevel < COMPLETE_UNLOCK) return `Forma completa: maestria ${COMPLETE_UNLOCK} da fruta.`;
  return null;
}

// Próxima forma do ciclo humana → híbrida → completa → humana (completa só se liberada)
export function nextShape(current, domainLevel) {
  if (!current) return 'hibrida';
  if (current === 'hibrida' && domainLevel >= COMPLETE_UNLOCK) return 'completa';
  return null;
}

// ===== Corpos do laboratório =====
const MODULES = { lobo: FRUTOWolf, falcao: FRUTOFalcon, besta: FRUTOMythBeast, fenix: FRUTOMythPhoenix, oriental: FRUTOMythEast, ocidental: FRUTOMythWest };
export const FAMILY = { lobo: 'lobo', besta: 'lobo', oriental: 'lobo', ocidental: 'lobo', falcao: 'falcao', fenix: 'falcao' };
export const WINGED = { falcao: true, fenix: true, ocidental: true, oriental: true };
export const moduleFor = (species, shape) => (species === 'oriental' && shape === 'completa' ? OrientalSerpent : MODULES[species]);

// Cria o corpo da forma (modelo do laboratório; Oriental completo: serpente nova)
export function createFormRig(species, shape, lod = 1) {
  const mod = moduleFor(species, shape);
  const rig = mod.create(THREE, FRUTOModels, DATA, shape, lod);
  rig.species = species;
  rig.shape = shape;
  rig.module = mod;
  rig.phase = 0;
  rig.root.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  return rig;
}

// tabela de ações que anima o corpo (Besta e Dragões usam a do Lobo; a Fênix, a do Falcão)
const actionTable = (rig) => (rig.serpent ? OrientalSerpent : FAMILY[rig.species] === 'falcao' ? FRUTOFalcon : FRUTOWolf);

// Id do golpe para o corpo da forma: M1 → variante híbrida (_h) ou completa (_c); técnicas
// da fruta → clipe de origem do laboratório (Besta, Dragões e Fênix usam os do Lobo/Falcão)
export function poseIdFor(rig, clip) {
  const m1 = /^([a-z]+_m1_\d)(?:_[hc])?$/.exec(clip ?? '');
  if (m1) {
    if (rig.shape === 'hibrida') return `${m1[1]}_h`;
    const id = completeId(m1[1]);
    return actionTable(rig).hasAction(id) ? id : 'idle';
  }
  const c = FRUTOMotion.clips[clip];
  if (!c) return 'idle';
  const id = c.sourceId ?? clip;
  if (rig.serpent) return rig.module.hasAction(id) ? id : 'idle';
  return id;
}

// Uma pose do corpo da forma por quadro. s: { dt, clock, state, speed, maxSpeed, action, dash,
// faint, air, landing, swimming, runBlend }
export function animateFormRig(rig, s) {
  const mod = rig.module;
  const drive = Math.max(0, Math.min(1, s.speed / Math.max(0.1, s.maxSpeed)));
  const winged = !!WINGED[rig.species];
  const flying = winged && (s.state === 'glide' || (s.state === 'air' && s.air > 0.15));
  if (!flying && !s.swimming) rig.phase += s.dt * mod.strideRate(rig.shape, drive) * Math.min(1, drive / 0.12);
  let id = 'idle';
  let t = s.clock;
  if (s.faint) {
    id = 'death';
    t = s.faint;
  } else if (s.swimming) id = drive > 0.2 ? 'swim' : 'tread';
  else if (s.action) {
    id = poseIdFor(rig, s.action.clip);
    t = s.action.t;
  } else if (s.dash) {
    id = poseIdFor(rig, s.dash.clip);
    t = s.dash.t;
    if (id === 'idle') t = s.clock;
  } else if (flying) id = s.state === 'glide' ? 'glide' : 'flight';
  const height = mod.animate(THREE, FRUTOMotion, DATA, rig, {
    id, t, clock: s.clock, phase: rig.phase, gait: s.action || s.dash ? 0 : drive, drive, runBlend: s.runBlend ?? 0,
    flying, grounded: s.state === 'ground', air: flying ? 0 : s.air, landing: s.landing ?? 0, glideMix: s.state === 'glide' ? 1 : 0,
  });
  if (rig.shape === 'hibrida' && s.action) {
    const m1 = /^([a-z]+_m1_\d)/.exec(s.action.clip ?? '');
    if (m1) hybridOverlay(rig, m1[1], s.action.t);
  }
  return { id, height };
}

// Mostra a forma e esconde o corpo humano (e o que vai preso nele), ou volta ao humano
export function showForm(body, rig) {
  for (const child of body.root.children) {
    if (child.userData.formKeep) continue;
    if (rig && child === rig.root) continue;
    if (child.userData.formHidden === undefined) child.userData.formHidden = !child.visible;
    child.visible = rig ? false : !child.userData.formHidden;
    if (!rig) delete child.userData.formHidden;
  }
  if (rig) {
    if (rig.root.parent !== body.root) body.root.add(rig.root);
    rig.root.visible = true;
  }
}

export function disposeFormRig(rig) {
  rig?.root.removeFromParent();
}

// ===== Corpo do personagem na forma híbrida (atualização 22) =====
// No laboratório a parte humana das híbridas é uma "pele" cinza-esverdeada. Aqui ela vira o
// corpo do personagem atual: peças quase todas cinza (tronco, cintura, cabeça, pernas do
// Oriental) são trocadas pelas peças do corpo do jogador, com a cor da roupa, o rosto, o
// cabelo, a roupa e a armadura; peças só em parte cinza recebem as cores do jogador no lugar
// do cinza. O resto (pelos, penas, escamas, chifres, cauda, asas) fica como no laboratório.
const isLabSkin = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b) < 0.075 && g > b + 0.004 && g >= r;
const humanCache = new Map();
function humanBody(lod) {
  if (!humanCache.has(lod)) humanCache.set(lod, FRUTOModels.body(THREE, DATA, '#ffffff', 1, lod));
  return humanCache.get(lod);
}
// fração cinza de cada segmento humanoide da híbrida (calculada uma vez por corpo)
export function greyMap(rig) {
  if (rig.greyMap) return rig.greyMap;
  // pela área das faces (faces grandes contam mais que detalhes pequenos)
  const out = {};
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (const s of DATA.segments) {
    const g = rig.meshes[s.id]?.geometry;
    const col = g?.attributes?.color;
    if (!col || !g.index) continue;
    const p = g.attributes.position;
    const idx = g.index.array;
    let total = 0;
    let grey = 0;
    for (let i = 0; i < idx.length; i += 3) {
      a.fromBufferAttribute(p, idx[i]);
      b.fromBufferAttribute(p, idx[i + 1]).sub(a);
      c.fromBufferAttribute(p, idx[i + 2]).sub(a);
      const area = b.cross(c).length() / 2;
      total += area;
      const k = idx[i];
      if (isLabSkin(col.getX(k), col.getY(k), col.getZ(k))) grey += area;
    }
    if (total > 0) out[s.id] = grey / total;
  }
  rig.greyMap = out;
  return out;
}

const boxOf = (geo) => {
  geo.computeBoundingBox();
  const b = geo.boundingBox;
  return { size: b.getSize(new THREE.Vector3()).toArray(), center: b.getCenter(new THREE.Vector3()).toArray() };
};

// look: { colorOf(segmentId) → cor, skin, hair, dress(joints) → peças de roupa/armadura, Face }
export function dressHybrid(rig, look, lod = 1) {
  undressHybrid(rig);
  if (rig.shape !== 'hibrida') return null;
  const grey = greyMap(rig);
  const human = humanBody(lod);
  const added = [];
  const hidden = [];
  const recolored = [];
  const replaced = new Set();
  const fits = {};
  for (const [id, frac] of Object.entries(grey)) {
    const mesh = rig.meshes[id];
    if (frac >= 0.95 && human.meshes[id]) {
      // troca pela peça do corpo do personagem, na medida da peça do laboratório (proporção
      // da forma híbrida mantida: tronco largo, cintura firme); roupa e armadura acompanham
      const src = human.meshes[id];
      const mat = src.material.clone();
      mat.color.set(look.colorOf(id));
      const fit = new THREE.Group();
      fit.name = `${id}_medida`;
      const lab = boxOf(mesh.geometry);
      const hum = boxOf(src.geometry);
      const k = [0, 1, 2].map((i) => Math.max(0.8, Math.min(1.6, lab.size[i] / Math.max(1e-3, hum.size[i]))));
      fit.scale.set(...k);
      fit.position.set(...[0, 1, 2].map((i) => lab.center[i] - hum.center[i] * k[i]));
      const m = new THREE.Mesh(src.geometry, mat);
      m.castShadow = m.receiveShadow = true;
      m.name = `${id}_personagem`;
      fit.add(m);
      rig.joints[id].add(fit);
      fits[id] = fit;
      added.push(fit);
      mesh.visible = false;
      hidden.push(mesh);
      replaced.add(id);
    } else if (frac >= 0.2) {
      // só o cinza muda de cor (cinto e detalhes do laboratório ficam)
      const geo = mesh.geometry.clone();
      const c = geo.attributes.color;
      const tint = new THREE.Color(look.colorOf(id));
      for (let i = 0; i < c.count; i++) {
        const r = c.getX(i);
        const g = c.getY(i);
        const b = c.getZ(i);
        if (!isLabSkin(r, g, b)) continue;
        const shade = Math.min(1.25, (r + g + b) / 3 / 0.79); // mantém o claro-escuro do laboratório
        c.setXYZ(i, tint.r * shade, tint.g * shade, tint.b * shade);
      }
      c.needsUpdate = true;
      recolored.push([mesh, mesh.geometry]);
      mesh.geometry = geo;
    }
  }
  // roupa, armadura, rosto e cabelo só nas peças trocadas
  const sink = new THREE.Group();
  const joints = new Proxy(rig.joints, { get: (o, k) => (replaced.has(k) ? fits[k] : sink) });
  if (look.dress) added.push(...(look.dress(joints) ?? []).filter((p) => p && p.parent && p.parent !== sink));
  let face = null;
  // cabeça humana (trocada ou com a pele recolorida): rosto e cabelo do personagem
  if ((grey.cabeca ?? 0) >= 0.6 && look.Face) {
    face = new look.Face(fits.cabeca ?? rig.joints.cabeca, { hair: look.hair, skin: look.skin });
    added.push(face.group);
  }
  rig.dressing = { added, hidden, recolored, face };
  rig.face = face;
  return rig.dressing;
}

export function undressHybrid(rig) {
  const d = rig?.dressing;
  if (!d) return;
  for (const o of d.added) o.removeFromParent();
  for (const m of d.hidden) m.visible = true;
  for (const [mesh, geo] of d.recolored) {
    mesh.geometry.dispose();
    mesh.geometry = geo;
  }
  rig.dressing = null;
  rig.face = null;
}
