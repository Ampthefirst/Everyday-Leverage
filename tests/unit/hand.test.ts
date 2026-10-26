import { describe, expect, it } from 'vitest';
import { familyList } from '../../src/families';
import {
  blendAngles,
  OPEN_ANGLES,
  gripCylinder,
  handSpec,
  indexTip,
  pinchSolution,
  poseAngles,
  thumbTip,
  wrapFinger,
  wrapThumb,
} from '../../src/viewer/handModel';

describe('articulated hand', () => {
  it('scales with hand breadth', () => {
    const a = handSpec(85);
    const b = handSpec(68);
    expect(b.palm.length / a.palm.length).toBeCloseTo(0.8, 5);
    expect(b.fingers[1].lengths[0] / a.fingers[1].lengths[0]).toBeCloseTo(0.8, 5);
  });

  it('wraps fingers more tightly around thinner handles, within joint limits', () => {
    const spec = handSpec();
    const thin = wrapFinger(spec.fingers[1], gripCylinder(spec, 20));
    const thick = wrapFinger(spec.fingers[1], gripCylinder(spec, 50));
    expect(thin.reduce((a, b) => a + b)).toBeGreaterThan(thick.reduce((a, b) => a + b));
    expect(thin[0]).toBeLessThanOrEqual(95);
    expect(thin[1]).toBeLessThanOrEqual(110);
    expect(thin[2]).toBeLessThanOrEqual(85);
  });

  it.each([15, 22, 32, 45, 55])(
    'a %d mm handle: no finger or thumb passes into it, and the grip closes round it',
    (d) => {
      for (const breadth of [70, 85, 100]) {
        const spec = handSpec(breadth);
        const cyl = gripCylinder(spec, d);
        for (const f of spec.fingers) {
          const flex = wrapFinger(f, cyl);
          // Walk the chain and check each phalanx's inner surface clears the handle.
          let th = 0;
          let [y, z] = [f.base[1], f.base[2]];
          let wrapped = 0;
          f.lengths.forEach((l, k) => {
            th += flex[k];
            const y2 = y + l * Math.cos((th * Math.PI) / 180);
            const z2 = z - l * Math.sin((th * Math.PI) / 180);
            for (let s = 0; s <= 10; s++) {
              const py = y + ((y2 - y) * s) / 10;
              const pz = z + ((z2 - z) * s) / 10;
              const half = (f.width * [1, 0.9, 0.82][k] * 0.86) / 2;
              expect(Math.hypot(py - cyl.y, pz - cyl.z) - half).toBeGreaterThan(cyl.r + 0.5);
            }
            [y, z] = [y2, z2];
            wrapped = th;
          });
          // The middle finger curls well round the handle (a grip, not a flat hand); thick handles less so.
          if (f.name === 'middle') expect(wrapped).toBeGreaterThan(d <= 22 ? 160 : d <= 32 ? 135 : 100);
        }
        const t = wrapThumb(spec, cyl);
        expect(t).not.toBe(OPEN_ANGLES.thumb);
      }
    },
  );

  it.each([9, 14, 20])('a %d mm bar in a hook grip: the bar sits in the fingers and none pass into it', (d) => {
    for (const breadth of [70, 85, 100]) {
      const spec = handSpec(breadth);
      const cyl = gripCylinder(spec, d, 'hook');
      // The bar is held under the proximal phalanges, clear of the palm (which ends at the knuckles).
      expect(cyl.y).toBeGreaterThan(spec.fingers[1].base[1]);
      const a = poseAngles('hook', spec, d);
      spec.fingers.forEach((f, i) => {
        let th = 0;
        let [y, z] = [f.base[1], f.base[2]];
        f.lengths.forEach((l, k) => {
          th += a.fingers[i].flex[k];
          const y2 = y + l * Math.cos((th * Math.PI) / 180);
          const z2 = z - l * Math.sin((th * Math.PI) / 180);
          for (let s = 0; s <= 10; s++) {
            const half = (f.width * [1, 0.9, 0.82][k] * 0.86) / 2;
            const dist = Math.hypot(y + ((y2 - y) * s) / 10 - cyl.y, z + ((z2 - z) * s) / 10 - cyl.z);
            expect(dist - half).toBeGreaterThan(cyl.r + 0.5);
          }
          [y, z] = [y2, z2];
        });
      });
      // The middle finger curls round the bar; with `oneFinger` the others curl in instead.
      expect(a.fingers[1].flex[1] + a.fingers[1].flex[2]).toBeGreaterThan(90);
      const one = poseAngles('hook', spec, d, 360, true);
      expect(one.fingers[1].flex).toEqual(a.fingers[1].flex);
      expect(one.fingers[0].flex[0]).toBeGreaterThan(60);
    }
  });

  it('closes the pinch: the thumb tip meets the index tip across a key-sized gap', () => {
    for (const breadth of [70, 85, 100]) {
      const spec = handSpec(breadth);
      const a = poseAngles('pinch', spec);
      const t = thumbTip(spec, a.thumb);
      const i = indexTip(spec, a);
      expect(Math.hypot(t[0] - i[0], t[1] - i[1], t[2] - i[2])).toBeLessThan(30 * spec.scale);
      expect(pinchSolution(spec).point.every(Number.isFinite)).toBe(true);
    }
  });

  it('blends from an open hand to the pose for the how-to-use animation', () => {
    const spec = handSpec();
    const grip = poseAngles('grip', spec, 32);
    const flat = (a: typeof grip) => [
      ...a.fingers.flatMap((f) => [...f.flex, f.splay]),
      ...a.thumb.flex,
      a.thumb.oppose,
      a.thumb.abduct,
      a.thumb.roll,
    ];
    flat(blendAngles(OPEN_ANGLES, grip, 0)).forEach((v, i) => expect(v).toBeCloseTo(flat(OPEN_ANGLES)[i], 9));
    flat(blendAngles(OPEN_ANGLES, grip, 1)).forEach((v, i) => expect(v).toBeCloseTo(flat(grip)[i], 9));
    const half = blendAngles(OPEN_ANGLES, grip, 0.5);
    expect(half.fingers[1].flex[1]).toBeCloseTo(
      (OPEN_ANGLES.fingers[1].flex[1] + grip.fingers[1].flex[1]) / 2,
      6,
    );
  });

  it('every design ends its how-to-use animation with the hand holding (closed)', () => {
    for (const f of familyList()) {
      const steps = f.animation(f.defaults).steps;
      expect(steps.at(-1)!.hand ?? 1, f.id).toBe(1);
    }
  });
});
