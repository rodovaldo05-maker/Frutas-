// Campo de alturas deslocado no mundo (outras ilhas além da Ilha de Treino). A altura é
// definida em coordenadas locais; point/sample/normal/inside respondem em coordenadas do
// mundo, então o relevo, a física e quem amostra o chão funcionam sem saber do deslocamento.

import { Heightfield } from './heightfield.js';

export class OffsetHeightfield extends Heightfield {
  constructor({ half, spacing, height, ox = 0, oz = 0 }) {
    super({ half, spacing, height });
    this.ox = ox;
    this.oz = oz;
  }

  point(i, j) {
    const p = super.point(i, j);
    return [p[0] + this.ox, p[1], p[2] + this.oz];
  }

  sample(x, z, out) {
    return super.sample(x - this.ox, z - this.oz, out);
  }

  inside(x, z) {
    return super.inside(x - this.ox, z - this.oz);
  }

  // amostra em coordenadas locais (mapas e miniaturas)
  sampleLocal(x, z, out) {
    return super.sample(x, z, out);
  }
}

// Vários campos como um só: a altura vem da ilha que contém o ponto; fora de todas, fundo do mar
export class WorldField {
  constructor(fields, seabed = -14) {
    this.fields = fields;
    this.seabed = seabed;
  }

  fieldAt(x, z) {
    return this.fields.find((f) => f.inside(x, z)) ?? null;
  }

  sample(x, z, out) {
    const f = this.fieldAt(x, z);
    if (f) return f.sample(x, z, out);
    if (out) out.x = out.z = 0;
    return this.seabed;
  }

  normal(x, z) {
    const f = this.fieldAt(x, z);
    return f ? f.normal(x, z) : { x: 0, y: 1, z: 0 };
  }

  inside(x, z) {
    return !!this.fieldAt(x, z);
  }
}
