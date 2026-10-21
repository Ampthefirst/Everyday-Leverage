import { beforeAll, describe, expect, it } from 'vitest';
import { loadKernel, scope, type Kernel, type Manifold } from '../../src/geometry/kernel';
import {
  shaftSleeve,
  leverArm,
  socketCup,
  loopShape,
  clipShape,
  stampText,
} from '../../src/geometry/primitives';

let K: Kernel;
beforeAll(async () => {
  K = await loadKernel();
});

function expectSolid(m: Manifold) {
  expect(m.status()).toBe('NoError');
  expect(m.isEmpty()).toBe(false);
  expect(m.volume()).toBeGreaterThan(0);
  expect(m.decompose().length).toBe(1);
}
const size = (m: Manifold) => {
  const b = m.boundingBox();
  return [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]];
};

describe('primitives', () => {
  it('shaft sleeve: round, ribs, clamp', () =>
    scope(() => {
      const m = shaftSleeve(K, {
        outer: { shape: 'round', w: 30, h: 30 },
        length: 100,
        pocket: { shape: 'round', d: 8 },
        clearance: 0.3,
      });
      expectSolid(m);
      const [x, y, z] = size(m);
      expect(x).toBeCloseTo(30, 0);
      expect(y).toBeCloseTo(30, 0);
      expect(z).toBeCloseTo(100, 1);
      const r = shaftSleeve(K, {
        outer: { shape: 'oval', w: 34, h: 28 },
        length: 90,
        pocket: { shape: 'rect', w: 10, h: 4 },
        clearance: 0.3,
        ribs: { count: 4, interference: 0.3 },
      });
      expectSolid(r);
      const c = shaftSleeve(K, {
        outer: { shape: 'rrect', w: 30, h: 26 },
        length: 90,
        pocket: { shape: 'round', d: 10 },
        clearance: 0.3,
        clamp: true,
      });
      expectSolid(c);
    }));
  it('lever arm matches length ± 0.1 mm', () =>
    scope(() => {
      const m = leverArm(K, { length: 120, rootW: 20, rootH: 12, tipW: 16, tipH: 10, round: 3 });
      expectSolid(m);
      const [x, y, z] = size(m);
      expect(x).toBeCloseTo(120, 1);
      expect(y).toBeCloseTo(20, 1);
      expect(z).toBeCloseTo(12, 1);
      const s = leverArm(K, {
        length: 120,
        rootW: 20,
        rootH: 12,
        tipW: 16,
        tipH: 10,
        round: 3,
        scallops: { count: 3, depth: 2 },
        pad: { d: 24, h: 10 },
      });
      expectSolid(s);
    }));
  it('socket cup: stepped with teeth', () =>
    scope(() => {
      const { solid, height } = socketCup(K, {
        steps: [
          { profile: { shape: 'round', d: 80 }, depth: 12 },
          { profile: { shape: 'round', d: 60 }, depth: 12 },
        ],
        bossOD: 90,
        floor: 4,
        clearance: 0.5,
        teeth: { count: 24, height: 1.2 },
      });
      expectSolid(solid);
      expect(height).toBe(28);
      expect(size(solid)[2]).toBeCloseTo(28, 1);
      for (const profile of [
        { shape: 'hex', af: 10 },
        { shape: 'star', n: 5, outer: 30, inner: 18 },
        { shape: 'cross', span: 30, arm: 8 },
        { shape: 'D', d: 25, flat: 4 },
        { shape: 'slot', w: 25, t: 3 },
      ] as const) {
        expectSolid(
          socketCup(K, { steps: [{ profile, depth: 15 }], bossOD: 45, floor: 3, clearance: 0.3 }).solid,
        );
      }
    }));
  it('loop and clip', () =>
    scope(() => {
      expectSolid(
        loopShape(K, { kind: 'stadium', innerL: 60, innerW: 25, band: 6, thickness: 8, minBend: 5 }),
      );
      expectSolid(loopShape(K, { kind: 'tbar', innerL: 60, innerW: 25, band: 8, thickness: 10, minBend: 5 }));
      expectSolid(clipShape(K, { kind: 'cclip', innerD: 20, wall: 4, opening: 100, width: 20, lip: 2 }));
      expectSolid(
        clipShape(K, {
          kind: 'strap',
          innerD: 20,
          wall: 4,
          opening: 0,
          width: 20,
          lip: 0,
          strap: { w: 20, t: 3 },
        }),
      );
    }));
  it('stamp text', () =>
    scope(() => {
      const t = stampText(K, 'B1-68', 6, 0.6)!;
      expect(t.status()).toBe('NoError');
      expect(t.volume()).toBeGreaterThan(0);
    }));
});
