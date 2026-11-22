// Moradores do Porto das Origens (atualização 11): corpo do laboratório com rosto, andando
// pelas ruas de porta a porta conforme a rotina (villageLife.js). Longe do jogador só a
// posição é calculada (sem animar nem desenhar); dormindo, o corpo some.

import * as THREE from 'three';
import { FRUTOMotion } from '../animation/fruto-motion.js';
import { makeNpcBody, label } from './npcs.js';
import { LOD_FACE } from '../characters/shadows.js';
import { buildStreetGraph, makeVillagers, activityAt, sleepingAt, placeOf, route } from './villageLife.js';
import { clamp, damp, lerp, lerpAngle, wrapAngle } from '../core/math.js';

const WALK = 2.4; // unidades/s (≈ 1,1 m/s)
const SHOW = 64; // distância para desenhar e animar

export class Villagers {
  constructor({ scene, data, village, offset, physics, baseY }) {
    this.v = village;
    this.o = offset;
    this.physics = physics;
    this.baseY = baseY;
    this.data = data;
    this.graph = buildStreetGraph(village);
    this.list = makeVillagers(village).map((m) => {
      const { body, face } = makeNpcBody(scene, data, m.look, m.id ?? m.nome);
      body.root.visible = false;
      const tag = label(`${m.nome} · ${m.titulo}`, 0.85);
      tag.visible = false;
      scene.add(tag);
      return { ...m, body, face, tag, x: 0, z: 0, y: baseY, yaw: 0, act: null, place: null, path: null, pi: 0, clock: Math.random() * 10, phase: 0, gait: 0, headYaw: 0, ground: baseY };
    });
    this.byId = Object.fromEntries(this.list.map((m) => [m.id, m]));
  }

  // posição no mundo
  world(m) {
    return { x: m.x + this.o.x, y: m.y, z: m.z + this.o.z };
  }

  // chão sob o morador (piso, rua ou terra) por raio para baixo; longe, a altura da vila
  groundAt(x, z) {
    const hit = this.physics.raycast({ x: x + this.o.x, y: this.baseY + 2.4, z: z + this.o.z }, { x: 0, y: -1, z: 0 }, 6);
    return hit ? hit.point.y : this.baseY;
  }

  // passo lógico: a rotina pela hora; quando a atividade muda, sai andando pela rota
  update(dt, hour, playerPos) {
    for (const m of this.list) {
      const act = activityAt(hour, m);
      if (act !== m.act) {
        const next = placeOf(this.v, m, act);
        if (!m.act) {
          const p = next.inner[next.inner.length - 1];
          m.x = p.x;
          m.z = p.z;
          m.yaw = next.yaw;
          m.path = null;
        } else {
          m.path = route(this.v, this.graph, m.place, next);
          m.pi = 1;
        }
        m.act = act;
        m.place = next;
      }
      let moving = false;
      if (m.path) {
        let step = WALK * dt;
        while (step > 0 && m.path) {
          const t = m.path[m.pi];
          const dx = t.x - m.x;
          const dz = t.z - m.z;
          const d = Math.hypot(dx, dz);
          if (d <= step) {
            m.x = t.x;
            m.z = t.z;
            step -= d;
            m.pi += 1;
            if (m.pi >= m.path.length) m.path = null;
          } else {
            m.x += (dx / d) * step;
            m.z += (dz / d) * step;
            m.yaw = lerpAngle(m.yaw, Math.atan2(dx, dz), damp(10, dt));
            step = 0;
            moving = true;
          }
        }
      } else m.yaw = lerpAngle(m.yaw, m.place.yaw, damp(4, dt));
      m.moving = moving;
      m.sleeping = !m.path && act === 'casa' && sleepingAt(hour, m);
      const wp = this.world(m);
      m.near = !m.sleeping && Math.abs(wp.x - playerPos.x) < SHOW && Math.abs(wp.z - playerPos.z) < SHOW;
      if (m.near) m.ground = lerp(m.ground, this.groundAt(m.x, m.z), damp(14, dt));
      else m.ground = this.baseY;
      m.y = m.ground;
    }
  }

  // desenho: anda (passo com o movimento), respira, olha para o jogador perto
  render(dt, playerPos) {
    for (const m of this.list) {
      const show = m.near;
      m.body.root.visible = show;
      if (!show) {
        m.tag.visible = false;
        continue;
      }
      m.clock += dt;
      m.face.setDetail(Math.hypot(playerPos.x - m.x - this.o.x, playerPos.z - m.z - this.o.z) < LOD_FACE);
      m.gait = lerp(m.gait, m.moving ? 1 : 0, damp(8, dt));
      if (m.moving) m.phase += dt * WALK * 2.9;
      const wp = this.world(m);
      m.body.root.position.set(wp.x, wp.y, wp.z);
      m.body.root.rotation.set(0, m.yaw, 0);
      FRUTOMotion.apply(THREE, m.body, this.data, { id: 'idle', t: m.clock, clock: m.clock, phase: m.phase, gait: m.gait, runBlend: 0, swimBlend: 0, air: 0, landing: 0 });
      const dx = playerPos.x - wp.x;
      const dz = playerPos.z - wp.z;
      const d = Math.hypot(dx, dz);
      const want = d < 8 && !m.moving ? clamp(wrapAngle(Math.atan2(dx, dz) - m.yaw), -0.9, 0.9) : 0;
      m.headYaw = lerp(m.headYaw, want, damp(4, dt));
      m.body.joints.cabeca.rotation.y += m.headYaw * 0.7;
      m.face.update(dt, { expression: d < 5 ? 'feliz' : 'neutro', look: { x: clamp(-m.headYaw, -1, 1) * 0.5, y: 0 } });
      m.tag.visible = d < 14;
      if (m.tag.visible) m.tag.position.set(wp.x, wp.y + 5.0, wp.z);
    }
  }

  // morador acordado mais perto para conversar
  nearest(p, radius = 4.2) {
    let best = null;
    let bd = radius;
    for (const m of this.list) {
      if (m.sleeping) continue;
      const wp = this.world(m);
      const d = Math.hypot(p.x - wp.x, p.z - wp.z);
      if (d < bd && Math.abs(p.y - wp.y) < 3) {
        bd = d;
        best = m;
      }
    }
    return best;
  }

  // posições (mundo) de quem está perto, para abrir portas
  people() {
    return this.list.filter((m) => m.near).map((m) => this.world(m));
  }
}
