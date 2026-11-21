// Campo de alturas amostrado numa grade regular.
// A triangulação é a mesma do terreno do laboratório: cada célula vira os triângulos
// (a, c, b) e (b, c, d), com a diagonal de b=(i+1, j) até c=(i, j+1).
// A malha visual, o colisor e as consultas de altura usam exatamente estes triângulos.

export class Heightfield {
  constructor({ half, spacing, height }) {
    this.half = half;
    this.spacing = spacing;
    this.count = Math.round((2 * half) / spacing);
    this.row = this.count + 1;
    this.levels = new Float32Array(this.row * this.row);
    for (let j = 0; j < this.row; j++) {
      for (let i = 0; i < this.row; i++) {
        this.levels[j * this.row + i] = height(i * spacing - half, j * spacing - half);
      }
    }
  }

  at(i, j) {
    return this.levels[j * this.row + i];
  }

  point(i, j) {
    return [i * this.spacing - this.half, this.at(i, j), j * this.spacing - this.half];
  }

  // Altura exata no plano do triângulo; `out` recebe a inclinação (dy/dx, dy/dz)
  sample(x, z, out) {
    const { half, spacing, count, row, levels } = this;
    const gx = Math.max(0, Math.min(count, (x + half) / spacing));
    const gz = Math.max(0, Math.min(count, (z + half) / spacing));
    const i = Math.min(count - 1, Math.floor(gx));
    const j = Math.min(count - 1, Math.floor(gz));
    const u = gx - i;
    const v = gz - j;
    const k = j * row + i;
    const a = levels[k];
    const b = levels[k + 1];
    const c = levels[k + row];
    const d = levels[k + row + 1];
    const left = u + v <= 1;
    const dx = left ? b - a : d - c;
    const dz = left ? c - a : d - b;
    if (out) {
      out.x = dx / spacing;
      out.z = dz / spacing;
    }
    return left ? a + u * dx + v * dz : d + (u - 1) * dx + (v - 1) * dz;
  }

  // Normal da superfície (vetor unitário)
  normal(x, z) {
    const g = { x: 0, z: 0 };
    this.sample(x, z, g);
    const len = Math.hypot(g.x, 1, g.z);
    return { x: -g.x / len, y: 1 / len, z: -g.z / len };
  }

  inside(x, z) {
    return Math.abs(x) <= this.half && Math.abs(z) <= this.half;
  }
}
