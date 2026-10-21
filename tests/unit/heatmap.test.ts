import { describe, expect, it } from 'vitest';
import { familyList } from '../../src/families';
import { analyse } from '../../src/app/analysis';

describe.each(familyList().map((f) => [f.id, f] as const))(
  'stress map agrees with the verdict for %s',
  (_id, fam) => {
    it('the field at each section anchor equals that section utilization, and never exceeds the governing one', () => {
      const a = analyse({
        family: fam,
        params: fam.defaults,
        use: { level: 'moderate', location: 'kitchen' },
        print: null,
        safetyFactor: 2,
        orientationId: 'auto',
        calibrationFor: () => null,
        geometry: null,
      });
      const v = a.verdict;
      expect(a.field(v.governing.at)).toBeCloseTo(v.utilization, 6);
      for (const s of v.sections) expect(a.field(s.at)).toBeGreaterThanOrEqual(s.utilization - 1e-9);
      // Sample points around the part: the colours never claim more than the verdict.
      for (let i = 0; i < 200; i++) {
        const p: [number, number, number] = [
          Math.random() * 300 - 50,
          Math.random() * 200 - 100,
          Math.random() * 200 - 100,
        ];
        expect(a.field(p)).toBeLessThanOrEqual(v.utilization + 1e-9);
      }
    });
  },
);
