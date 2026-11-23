import { describe, it, expect } from 'vitest';
import DATA from '../data/fruto-catalog.json';
import { powersOf } from '../src/fruits/powers.js';
import { BESTA_CLIPS, sourceTime } from '../src/fruits/bestaMoves.js';
import { FRUTOMotion } from '../src/animation/fruto-motion.js';
import { poseIdFor } from '../src/transformations/forms.js';

const besta = DATA.fruits.find((f) => f.id === 'besta');

describe('habilidades da Besta (0.27.5)', () => {
  it('cada habilidade tem gesto próprio (não usa mais o da Maré nem o do Cristal)', () => {
    const p = powersOf(besta);
    expect(p.map((x) => x.clip)).toEqual(BESTA_CLIPS);
    for (const id of BESTA_CLIPS) expect(FRUTOMotion.clips[id]).toBeDefined();
    expect(FRUTOMotion.clips.besta_pisao.kick.side).toBe('D'); // a perna sobe antes do pisão
  });

  it('nas formas usa a animação do laboratório da Besta, com o impacto no mesmo instante', () => {
    const rig = { shape: 'completa', species: 'besta' };
    expect(BESTA_CLIPS.map((id) => poseIdFor(rig, id))).toEqual(['lobo0', 'lobo3', 'lobo4']);
    for (const id of BESTA_CLIPS) {
      const c = FRUTOMotion.clips[id];
      expect(sourceTime(c, c.release)).toBeCloseTo(c.source.release);
      expect(sourceTime(c, c.duration)).toBeCloseTo(c.source.duration);
      expect(sourceTime(c, 0)).toBe(0);
    }
  });

  it('as outras frutas continuam com os gestos de antes', () => {
    const mare = powersOf(DATA.fruits.find((f) => f.id === 'mare'));
    expect(mare[0].clip).toBe('mare0');
    expect(sourceTime(FRUTOMotion.clips.mare0, 0.3)).toBe(0.3);
  });
});
