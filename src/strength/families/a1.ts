import type { A1P } from '../../families/a1';
import { a1GrooveZ, a1ShaftSpan, a1MinOuter, a1GrooveDepth } from '../../families/a1';
import type { UseContext } from '../../families/types';
import { makeLoadCase } from '../loads';
import { rectSection, roundSection } from '../sections';
import { bending, torsion, KT, type MathLine } from '../checks';
import type { CriticalSection, LoadCase, PrintSettings } from '../types';
import { shellThickness } from '../types';

/** Assumed crush-rib normal force per mm of engaged length (N/mm). */
export const RIB_FORCE_PER_MM = 1.2;
/** Assumed friction coefficient, printed plastic on metal/plastic handles. */
export const MU = 0.3;
/** Assumed M3 screw clamp preload, hand-tight (N). */
export const CLAMP_PRELOAD = 500;
/** Finger contact width used for the ring-bending check (mm). */
const CONTACT_W = 20;

export function a1LoadCases(_p: A1P, use: UseContext): LoadCase[] {
  return [
    makeLoadCase({ task: 'utensilTwist', level: use.level, override: use.loadOverride }),
    makeLoadCase({ task: 'utensilGrip', level: use.level }),
  ];
}

export function a1Sections(p: A1P, lc: LoadCase, print: PrintSettings): CriticalSection[] {
  const t = shellThickness(print);
  const shell = { t, infill: print.infill };
  const R = a1MinOuter(p) / 2;
  const span = a1ShaftSpan(p) + 2 * p.clearance;
  const gd = a1GrooveDepth(p);
  const zs = a1GrooveZ(p);
  const zG = zs.length ? zs[zs.length - 1] : p.length / 2;
  const out: CriticalSection[] = [];

  // Grip squeeze: the wall under the grooves bends like a ring pressed from two sides, M ≈ F·R/π.
  const grip = lc.id === 'utensilGrip' ? lc.value : 30 * (lc.value / lc.base || 1);
  const wall = Math.max(0.6, R - span / 2 - gd);
  const ring = rectSection(CONTACT_W, wall, { t: Math.min(t, wall / 2), infill: print.infill });
  const Mring = (grip * (R - gd)) / Math.PI;
  const ringStress = bending(Mring, ring);
  ringStress.math.unshift(
    { label: 'Squeeze force F', expr: 'F', value: grip, unit: 'N' },
    { label: 'Wall under groove', expr: 'R − pocket/2 − groove', value: wall, unit: 'mm' },
    { label: 'Ring moment', expr: 'M ≈ F·R/π', value: Mring, unit: 'N·mm' },
  );
  out.push({
    id: 'groove-wall',
    label: gd > 0 ? 'in the thin wall under the finger grooves' : 'in the grip wall',
    check: 'bending',
    at: [0, R - gd, zG],
    direction: [1, 0, 0],
    Kt: gd > 0 ? KT.groove : KT.none,
    ktReason: gd > 0 ? 'groove root' : undefined,
    stress: ringStress,
    zone: {
      type: 'segment',
      from: [0, 0, Math.max(0, zG - 25)],
      to: [0, 0, Math.min(p.length, zG + 25)],
      radius: R,
    },
    fix: 'Use a bigger grip size or shallower grooves.',
  });

  // Twisting the utensil: torsion through the reduced section at the deepest groove.
  const torque = lc.kind === 'torque' ? lc.value : 300;
  const sec = roundSection(2 * (R - gd), span, shell);
  const tor = torsion(torque, sec);
  out.push({
    id: 'groove-torsion',
    label: 'around the grip at the grooves',
    check: 'torsion',
    at: [R - gd, 0, zG],
    direction: [0.7071, 0, 0.7071],
    Kt: gd > 0 ? KT.groove : KT.none,
    ktReason: gd > 0 ? 'groove root' : undefined,
    stress: tor,
    zone: { type: 'segment', from: [0, 0, 0], to: [0, 0, p.length], radius: R },
    fix: 'Use a bigger grip size or shallower grooves.',
  });

  // Slip on round handles: friction from crush ribs or the clamp screw.
  if (p.shaftShape === 'round') {
    const r = p.shaftW / 2;
    const engaged = p.closedEnd ? p.length - 4 : p.length;
    let capacity: number;
    const math: MathLine[] = [];
    if (p.attach === 'clamp') {
      capacity = 2 * MU * CLAMP_PRELOAD * r;
      math.push(
        { label: 'Screw preload (assumed)', expr: 'F_b', value: CLAMP_PRELOAD, unit: 'N' },
        { label: 'Slip torque', expr: 'T_slip = 2·μ·F_b·r', value: capacity, unit: 'N·mm' },
      );
    } else {
      const N = RIB_FORCE_PER_MM * engaged;
      capacity = p.ribs * N * MU * r;
      math.push(
        { label: 'Rib force per rib (assumed 1.2 N/mm)', expr: 'N = 1.2·L', value: N, unit: 'N' },
        { label: 'Slip torque', expr: 'T_slip = n·N·μ·r', value: capacity, unit: 'N·mm' },
      );
    }
    math.unshift({ label: 'Twisting torque', expr: 'T', value: torque, unit: 'N·mm' });
    out.push({
      id: 'slip',
      label: 'between the grip and the handle (slipping)',
      check: 'slip',
      at: [r, 0, p.length * 0.5],
      direction: null,
      Kt: 1,
      capacity: { demand: torque, capacity, unit: '', math },
      zone: { type: 'segment', from: [0, 0, 0], to: [0, 0, p.length], radius: span / 2 + 1 },
      fix:
        p.attach === 'clamp'
          ? 'Tighten the clamp screw or add a rubber sleeve.'
          : 'Switch to the clamp version, add ribs, or tighten the fit clearance.',
    });
  }
  return out;
}
