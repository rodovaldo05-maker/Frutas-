// Física com Rapier (WASM embutido, funciona offline).
// Cada colisor estático guarda "etiquetas" (escalável, material) consultadas pelo movimento.

import RAPIER from '@dimforge/rapier3d-compat';
import { GRAVITY } from '../movement/config.js';

export const GROUP_WORLD = 0x0001;
export const GROUP_PLAYER = 0x0002;
// membros (16 bits altos) e filtro (16 bits baixos)
export const groups = (membership, filter) => (membership << 16) | filter;

export class Physics {
  static async create() {
    await RAPIER.init();
    return new Physics();
  }

  constructor() {
    this.RAPIER = RAPIER;
    this.world = new RAPIER.World({ x: 0, y: -GRAVITY, z: 0 });
    this.world.timestep = 1 / 60;
    this.tags = new Map(); // handle do colisor -> etiquetas
    this.fixedBody = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  }

  tag(collider, tags) {
    this.tags.set(collider.handle, { climbable: false, material: 'rocha', ...tags });
    return collider;
  }

  tagsOf(collider) {
    return collider ? this.tags.get(collider.handle) : null;
  }

  addTrimesh(vertices, indices, tags = {}) {
    const desc = RAPIER.ColliderDesc.trimesh(vertices, indices)
      .setCollisionGroups(groups(GROUP_WORLD, 0xffff));
    return this.tag(this.world.createCollider(desc, this.fixedBody), { material: 'terreno', ...tags });
  }

  addBox(center, half, rotationY = 0, tags = {}) {
    const q = { x: 0, y: Math.sin(rotationY / 2), z: 0, w: Math.cos(rotationY / 2) };
    const desc = RAPIER.ColliderDesc.cuboid(half.x, half.y, half.z)
      .setTranslation(center.x, center.y, center.z)
      .setRotation(q)
      .setCollisionGroups(groups(GROUP_WORLD, 0xffff));
    return this.tag(this.world.createCollider(desc, this.fixedBody), tags);
  }

  addBoxRotated(center, half, quaternion, tags = {}) {
    const desc = RAPIER.ColliderDesc.cuboid(half.x, half.y, half.z)
      .setTranslation(center.x, center.y, center.z)
      .setRotation({ x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w })
      .setCollisionGroups(groups(GROUP_WORLD, 0xffff));
    return this.tag(this.world.createCollider(desc, this.fixedBody), tags);
  }

  addCylinder(center, halfHeight, radius, tags = {}) {
    const desc = RAPIER.ColliderDesc.cylinder(halfHeight, radius)
      .setTranslation(center.x, center.y, center.z)
      .setCollisionGroups(groups(GROUP_WORLD, 0xffff));
    return this.tag(this.world.createCollider(desc, this.fixedBody), tags);
  }

  // Casca convexa (pedras irregulares); se não der para montar, vira uma caixa envolvente
  addConvexHull(points, tags = {}) {
    let desc = RAPIER.ColliderDesc.convexHull(points);
    if (!desc) {
      let min = [Infinity, Infinity, Infinity];
      let max = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < points.length; i += 3) {
        for (let k = 0; k < 3; k++) {
          min[k] = Math.min(min[k], points[i + k]);
          max[k] = Math.max(max[k], points[i + k]);
        }
      }
      desc = RAPIER.ColliderDesc.cuboid((max[0] - min[0]) / 2, (max[1] - min[1]) / 2, (max[2] - min[2]) / 2)
        .setTranslation((max[0] + min[0]) / 2, (max[1] + min[1]) / 2, (max[2] + min[2]) / 2);
    }
    desc.setCollisionGroups(groups(GROUP_WORLD, 0xffff));
    return this.tag(this.world.createCollider(desc, this.fixedBody), tags);
  }

  // Raio contra o mundo estático (ignora o jogador). Retorna ponto, normal, distância e etiquetas.
  raycast(origin, dir, maxDist) {
    const ray = new RAPIER.Ray(origin, dir);
    const hit = this.world.castRayAndGetNormal(ray, maxDist, true, undefined, groups(GROUP_PLAYER, GROUP_WORLD));
    if (!hit) return null;
    const t = hit.timeOfImpact ?? hit.toi;
    return {
      distance: t,
      point: { x: origin.x + dir.x * t, y: origin.y + dir.y * t, z: origin.z + dir.z * t },
      normal: hit.normal,
      collider: hit.collider,
      tags: this.tagsOf(hit.collider),
    };
  }

  step() {
    this.world.step();
  }
}
