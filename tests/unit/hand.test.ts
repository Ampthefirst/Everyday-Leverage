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
  wrapAngles,
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
    const thin = wrapAngles(spec.fingers[1].lengths, gripCylinder(spec, 20).wrapR);
    const thick = wrapAngles(spec.fingers[1].lengths, gripCylinder(spec, 50).wrapR);
    for (let k = 0; k < 3; k++) expect(thin[k]).toBeGreaterThan(thick[k]);
    expect(thin[0]).toBeLessThanOrEqual(95);
    expect(thin[1]).toBeLessThanOrEqual(110);
    expect(thin[2]).toBeLessThanOrEqual(85);
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
