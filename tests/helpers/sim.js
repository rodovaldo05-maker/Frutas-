// Mundo de teste sem gráficos: a mesma ilha e física do jogo, rodando no Node.
// Permite simular entradas passo a passo e conferir o movimento.

import * as THREE from 'three';

// as placas desenham texto num canvas; no Node basta um canvas de mentira
if (!globalThis.document) {
  // qualquer método devolve um objeto que também aceita qualquer método
  const any = new Proxy({}, { get: (t, k) => (k === 'width' ? 0 : () => any), set: () => true });
  const ctx = any;
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
}

const { Physics } = await import('../../src/physics/physics.js');
const { buildTrainingIsland, ISLAND } = await import('../../src/islands/trainingIsland.js');
const { waveHeight } = await import('../../src/ocean/ocean.js');
const { CharacterController } = await import('../../src/movement/characterController.js');
const { STEP } = await import('../../src/core/loop.js');

let shared = null;

export async function makeSim() {
  if (!shared) {
    const physics = await Physics.create();
    const island = buildTrainingIsland({ scene: new THREE.Scene(), physics });
    physics.world.updateSceneQueries?.();
    physics.step();
    shared = { physics, island };
  }
  const { physics, island } = shared;
  const sim = { physics, island, time: 0, events: [], states: [] };
  sim.water = { heightAt: (x, z) => waveHeight(x, z, sim.time, 0) };
  sim.ctl = new CharacterController({ physics, water: sim.water, onEvent: (name, data) => sim.events.push({ name, data, t: sim.time }) });
  sim.ground = (x, z) => island.field.sample(x, z);

  // coloca o personagem no chão em (x, z) olhando para `yaw`
  sim.place = (x, z, yaw = 0, lift = 0) => {
    sim.ctl.spawn(x, sim.ground(x, z) + 3, z, yaw);
    if (lift) {
      sim.ctl.pos.y += lift;
      sim.ctl.syncCollider();
      sim.ctl.setState('air');
      sim.ctl.peakY = sim.ctl.pos.y;
    }
    sim.events.length = 0;
    sim.states.length = 0;
  };

  // roda `seconds` segundos; `input(t, ctl)` devolve as entradas daquele passo
  sim.run = (seconds, input = () => ({}), until = null) => {
    const steps = Math.round(seconds / STEP);
    for (let i = 0; i < steps; i++) {
      const t = i * STEP;
      const inp = {
        moveX: 0, moveY: 0, camYaw: sim.ctl.yaw, jump: false, crouch: false,
        jumpPressed: false, crouchPressed: false, dashPressed: false, sprint: false,
        ...input(t, sim.ctl),
      };
      sim.ctl.step(STEP, inp);
      sim.time += STEP;
      if (sim.states[sim.states.length - 1] !== sim.ctl.state) sim.states.push(sim.ctl.state);
      if (until && until(sim.ctl)) return true;
    }
    return false;
  };
  return sim;
}

export { ISLAND };
