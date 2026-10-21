import { describe, expect, it } from 'vitest';
import { fmt, mmToPt, nmToNmm, nmmToNm } from '../../src/types/units';

describe('units', () => {
  it('converts torque between N·m and N·mm', () => {
    expect(nmToNmm(4)).toBe(4000);
    expect(nmmToNm(1500)).toBe(1.5);
  });
  it('converts mm to PDF points (25 mm = 70.866 pt)', () => {
    expect(mmToPt(25)).toBeCloseTo(70.866, 3);
  });
  it('formats without trailing zeros', () => {
    expect(fmt(2.0)).toBe('2');
    expect(fmt(2.25, 2)).toBe('2.25');
    expect(fmt(NaN)).toBe('—');
  });
});
