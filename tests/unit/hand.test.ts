import { describe, expect, it } from 'vitest';
import { gripCylinder, handSpec, indexTip, pinchSolution, poseAngles, thumbTip, wrapAngles } from '../../src/viewer/handModel';

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
});
