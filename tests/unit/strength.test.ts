import { describe, expect, it } from 'vitest';
import { roundSection, rectSection, K_INFILL } from '../../src/strength/sections';
import {
  bending,
  torsion,
  bearing,
  tearOut,
  eulerCritical,
  loopTension,
  vonMises,
} from '../../src/strength/checks';
import { evaluate, levelFor } from '../../src/strength/evaluate';
import { makeLoadCase } from '../../src/strength/loads';
import { baseStrength } from '../../src/strength/materials';
import { barStress, fitCalibration, effectiveStrength, badgeText } from '../../src/strength/calibration';
import { buildField } from '../../src/strength/field';
import type { CriticalSection, StrengthContext } from '../../src/strength/types';
import { DEFAULT_PRINT } from '../../src/strength/types';

const solidShell = { t: 100, infill: 0 }; // shell thicker than the part → solid section

describe('sections', () => {
  it('solid round matches πD⁴/64', () => {
    const s = roundSection(20, 0, solidShell);
    expect(s.solid).toBe(true);
    expect(s.I).toBeCloseTo((Math.PI * 20 ** 4) / 64, 6);
    expect(s.J).toBeCloseTo((Math.PI * 20 ** 4) / 32, 6);
  });
  it('hollow round: shell + infill core', () => {
    // D=20, t=2, no bore, infill 0 → pure tube 20/16
    const s = roundSection(20, 0, { t: 2, infill: 0 });
    expect(s.I).toBeCloseTo((Math.PI / 64) * (20 ** 4 - 16 ** 4), 6);
    // with 100% infill the core adds K_INFILL of solid
    const s2 = roundSection(20, 0, { t: 2, infill: 1 });
    expect(s2.I).toBeCloseTo((Math.PI / 64) * (20 ** 4 - 16 ** 4 + K_INFILL * 16 ** 4), 6);
  });
  it('bored tube prints a shell on both faces', () => {
    const s = roundSection(30, 10, { t: 2, infill: 0 });
    const expected = (Math.PI / 64) * (30 ** 4 - 26 ** 4 + 14 ** 4 - 10 ** 4);
    expect(s.I).toBeCloseTo(expected, 6);
  });
  it('rect hollow and solid fallback', () => {
    const s = rectSection(20, 10, { t: 2, infill: 0 });
    expect(s.I).toBeCloseTo((20 * 1000) / 12 - (16 * 6 ** 3) / 12, 6);
    expect(s.torsion).toBe('bredt');
    expect(s.Am).toBeCloseTo(18 * 8, 6);
    const thin = rectSection(20, 3, { t: 2, infill: 0 });
    expect(thin.solid).toBe(true);
    expect(thin.torsion).toBe('solid-rect');
  });
});

describe('checks (hand calculations)', () => {
  it('bending: 10 N at 100 mm on a solid 10×10 bar → 60 MPa', () => {
    const s = rectSection(10, 10, solidShell);
    // M = 1000 N·mm, I = 833.33, c = 5 → σ = 6.0 MPa ... check: 1000·5/833.33 = 6
    expect(bending(1000, s).sigma).toBeCloseTo(6, 6);
    expect(bending(10000, s).sigma).toBeCloseTo(60, 6);
  });
  it('bending: solid Ø20 rod, M = 7854 N·mm → 10 MPa', () => {
    const s = roundSection(20, 0, solidShell);
    // σ = 32M/(πD³) = 32·7853.98/(π·8000) = 10
    expect(bending(7853.98, s).sigma).toBeCloseTo(10, 3);
  });
  it('torsion round: τ = 16T/(πD³)', () => {
    const s = roundSection(20, 0, solidShell);
    expect(torsion(1000, s).tau).toBeCloseTo((16 * 1000) / (Math.PI * 8000), 6);
  });
  it('torsion Bredt: T = 1000 on 20×10 tube t=2 → 1000/(2·144·2)', () => {
    const s = rectSection(20, 10, { t: 2, infill: 0 });
    expect(torsion(1000, s).tau).toBeCloseTo(1000 / (2 * 144 * 2), 6);
  });
  it('torsion solid rect (square α = 1/4.8)', () => {
    const s = rectSection(10, 10, solidShell);
    expect(torsion(1000, s).tau).toBeCloseTo(1000 / ((1 / 4.8) * 1000), 6);
  });
  it('bearing: σ = T/(n·r·A)', () => {
    expect(bearing(4000, 4, 20, 50).sigma).toBeCloseTo(1, 6);
    expect(bearing(1500, 2, 5, 30).sigma).toBeCloseTo(5, 6);
  });
  it('tear-out: τ = F/(2et)', () => {
    expect(tearOut(100, 5, 2).tau).toBeCloseTo(5, 6);
    expect(tearOut(40, 4, 3).tau).toBeCloseTo(40 / 24, 6);
  });
  it('Euler buckling (cantilever K=2)', () => {
    // E=2000, I=100, L=100 → π²·2e5/(200²) = 49.348
    expect(eulerCritical(2000, 100, 100)).toBeCloseTo(49.348, 2);
    expect(eulerCritical(3300, 50, 50, 1)).toBeCloseTo((Math.PI ** 2 * 3300 * 50) / 2500, 6);
  });
  it('loop tension includes the 1.3 curved-beam factor', () => {
    const s = roundSection(6, 0, solidShell);
    const F = 40;
    const R = 15;
    const exp = 1.3 * (F / 2 / s.A + (0.182 * F * R * s.c) / s.I);
    expect(loopTension(F, R, s).sigma).toBeCloseTo(exp, 6);
  });
  it('von Mises', () => {
    expect(vonMises(3, 0)).toBe(3);
    expect(vonMises(0, 1)).toBeCloseTo(Math.sqrt(3), 9);
    expect(vonMises(4, 1)).toBeCloseTo(Math.sqrt(19), 9);
  });
});

describe('verdict', () => {
  const ctx: StrengthContext = {
    print: DEFAULT_PRINT,
    strength: baseStrength('PLA'),
    safetyFactor: 2,
    buildDir: [0, 0, 1],
    split: false,
  };
  const section = (
    sigma: number,
    dir: [number, number, number] | null = [1, 0, 0],
    Kt = 1,
  ): CriticalSection => ({
    id: 's',
    label: 'at the root',
    check: 'bending',
    at: [0, 0, 0],
    direction: dir,
    Kt,
    stress: { sigma, tau: 0, math: [] },
    zone: { type: 'point', at: [0, 0, 0], radius: 5 },
    fix: 'Make it thicker.',
  });
  const lc = makeLoadCase({ task: 'jarLid', level: 'moderate' });

  it('thresholds', () => {
    expect(levelFor(0.59)).toBe('comfortable');
    expect(levelFor(0.6)).toBe('marginal');
    expect(levelFor(1)).toBe('marginal');
    expect(levelFor(1.01)).toBe('fail');
  });
  it('u = σ·SF/σ_allow, in-plane', () => {
    const v = evaluate([section(9)], ctx, lc);
    expect(v.utilization).toBeCloseTo((9 * 2) / 45, 9);
    expect(v.level).toBe('comfortable');
  });
  it('across layers uses the Z-fraction', () => {
    const v = evaluate([section(9, [0, 0, 1])], ctx, lc);
    expect(v.governing.acrossLayers).toBe(true);
    expect(v.utilization).toBeCloseTo((9 * 2) / (45 * 0.55), 9);
  });
  it('Kt and fatigue reduce the margin', () => {
    const rep = { ...lc, repeated: true };
    const v = evaluate([section(5, [1, 0, 0], 2)], ctx, rep);
    expect(v.utilization).toBeCloseTo((10 * 2) / (45 * 0.35), 9);
    expect(v.level).toBe('fail');
  });
  it('governing is the highest utilization and the reason names it', () => {
    const a = { ...section(5), id: 'a', label: 'at the tip' };
    const b = { ...section(20), id: 'b', label: 'where the lever meets the cup' };
    const v = evaluate([a, b], ctx, lc);
    expect(v.governing.id).toBe('b');
    expect(v.reason).toContain('where the lever meets the cup');
  });
  it('load levels scale ×0.6/×1/×1.6 and torque converts to N·mm', () => {
    expect(makeLoadCase({ task: 'jarLid', level: 'light' }).value).toBeCloseTo(2400, 6);
    expect(makeLoadCase({ task: 'jarLid', level: 'heavy' }).value).toBeCloseTo(6400, 6);
    expect(makeLoadCase({ task: 'drawerPull', level: 'moderate', override: 50 }).value).toBe(50);
  });
});

describe('calibration', () => {
  it('bar stress σ = 6Fa/(bh²)', () => {
    // F = 10 N → 6·10·50/(10·16) = 18.75 MPa
    expect(barStress(10)).toBeCloseTo(18.75, 9);
  });
  it('needs 3 breaks per orientation', () => {
    const r = fitCalibration([{ orientation: 'xy', loadN: 20 }]);
    expect(r.ok).toBe(false);
    expect(r.problems.length).toBe(2);
  });
  it('fits σ_xy and the Z-fraction', () => {
    const r = fitCalibration([
      { orientation: 'xy', loadN: 20 },
      { orientation: 'xy', loadN: 22 },
      { orientation: 'xy', loadN: 24 },
      { orientation: 'z', loadN: 11 },
      { orientation: 'z', loadN: 11 },
      { orientation: 'z', loadN: 11 },
    ]);
    expect(r.ok).toBe(true);
    expect(r.sigmaXY).toBeCloseTo(barStress(22), 9);
    expect(r.zFraction).toBeCloseTo(0.5, 9);
  });
  it('calibration changes strength and badge', () => {
    const profile = {
      printerName: 'Library MK4',
      material: 'PLA' as const,
      createdAt: '',
      entries: [],
      sigmaXY: 50,
      zFraction: 0.6,
    };
    expect(effectiveStrength('PLA', profile).sigmaXY).toBe(50);
    expect(effectiveStrength('PETG', profile).calibrated).toBe(false);
    expect(badgeText(profile, 'PLA')).toBe('Calibrated to Library MK4');
    expect(badgeText(null)).toBe('Uncalibrated estimate');
  });
});

describe('heat-map field', () => {
  it('peaks at the anchor with the section utilization and falls off', () => {
    const ctx: StrengthContext = {
      print: DEFAULT_PRINT,
      strength: baseStrength('PLA'),
      safetyFactor: 2,
      buildDir: [0, 0, 1],
      split: false,
    };
    const cs: CriticalSection = {
      id: 'root',
      label: 'root',
      check: 'bending',
      at: [0, 0, 0],
      direction: [1, 0, 0],
      Kt: 2,
      stress: { sigma: 10, tau: 0, math: [] },
      zone: { type: 'lever', from: [0, 0, 0], to: [100, 0, 0], radius: 5 },
      fix: '',
    };
    const v = evaluate([cs], ctx, makeLoadCase({ task: 'jarLid', level: 'moderate' }));
    const f = buildField(v.sections, 1.8);
    expect(f([0, 0, 0])).toBeCloseTo(v.utilization, 9);
    expect(f([50, 0, 0])).toBeCloseTo(v.utilization / 2 / 2, 2);
    expect(f([100, 0, 0])).toBeLessThan(0.01);
  });
});
