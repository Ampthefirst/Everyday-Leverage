import type { MaterialId, Strength } from './materials';
import { baseStrength } from './materials';

/** Standard test bar: 80 × 10 × 4 mm, clamped 20 mm, load hung 50 mm from the clamp edge. */
export const TEST_BAR = { length: 80, width: 10, thickness: 4, clamp: 20, arm: 50 } as const;
export const G = 9.81;
export const MIN_BREAKS = 3;

export type BarOrientation = 'xy' | 'z';

export interface BreakEntry {
  orientation: BarOrientation;
  /** Break load in N. */
  loadN: number;
}

export interface CalibrationProfile {
  printerName: string;
  material: MaterialId;
  createdAt: string;
  entries: BreakEntry[];
  sigmaXY: number;
  zFraction: number;
}

/** Bending stress at the clamp for a break load F: σ = 6·F·a / (b·h²). */
export function barStress(F: number, bar = TEST_BAR): number {
  return (6 * F * bar.arm) / (bar.width * bar.thickness ** 2);
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
export const stdev = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
};

export interface FitResult {
  ok: boolean;
  problems: string[];
  sigmaXY?: number;
  zFraction?: number;
  xyStresses: number[];
  zStresses: number[];
}

/** Fit σ_xy (mean of flat bars) and the Z-fraction (mean upright / σ_xy). Needs ≥ 3 breaks each. */
export function fitCalibration(entries: BreakEntry[]): FitResult {
  const xy = entries.filter((e) => e.orientation === 'xy' && e.loadN > 0).map((e) => barStress(e.loadN));
  const z = entries.filter((e) => e.orientation === 'z' && e.loadN > 0).map((e) => barStress(e.loadN));
  const problems: string[] = [];
  if (xy.length < MIN_BREAKS)
    problems.push(`Enter at least ${MIN_BREAKS} flat (XY) breaks — you have ${xy.length}.`);
  if (z.length < MIN_BREAKS)
    problems.push(`Enter at least ${MIN_BREAKS} upright (Z) breaks — you have ${z.length}.`);
  if (problems.length) return { ok: false, problems, xyStresses: xy, zStresses: z };
  const sigmaXY = mean(xy);
  const zFraction = Math.min(1, mean(z) / sigmaXY);
  if (mean(z) > sigmaXY * 1.05)
    problems.push('Upright bars came out stronger than flat ones — check the orientations were not swapped.');
  return { ok: true, problems, sigmaXY, zFraction, xyStresses: xy, zStresses: z };
}

/** Strength constants with an optional calibration applied. */
export function effectiveStrength(material: MaterialId, profile?: CalibrationProfile | null): Strength {
  const base = baseStrength(material);
  if (!profile || profile.material !== material) return base;
  return { ...base, sigmaXY: profile.sigmaXY, zFraction: profile.zFraction, calibrated: true };
}

export function badgeText(profile?: CalibrationProfile | null, material?: MaterialId): string {
  if (profile && (!material || profile.material === material)) return `Calibrated to ${profile.printerName}`;
  return 'Uncalibrated estimate';
}
