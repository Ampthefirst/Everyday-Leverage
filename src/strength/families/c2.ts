import type { C2P } from '../../families/c2';
import { c2Overall, c2TipD, C2_GRIP_L } from '../../families/c2';
import type { UseContext } from '../../families/types';
import { makeLoadCase } from '../loads';
import { roundSection } from '../sections';
import { bending, eulerCritical, KT } from '../checks';
import type { CriticalSection, LoadCase, PrintSettings } from '../types';
import { shellThickness } from '../types';

export function c2LoadCases(_p: C2P, use: UseContext): LoadCase[] {
  return [
    makeLoadCase({ task: 'buttonPress', level: use.level, override: use.loadOverride, repeated: true }),
  ];
}

/** Part frame: axis along +X, grip from 0 to 70, shaft to the tip. */
export function c2Sections(p: C2P, lc: LoadCase, print: PrintSettings): CriticalSection[] {
  const t = shellThickness(print);
  const shell = { t, infill: print.infill };
  const F = lc.value;
  const sec = roundSection(p.shaftD, 0, shell);
  const out: CriticalSection[] = [];
  // Euler buckling of the shaft held at the handle (cantilever, K = 2). E scales with the shell model.
  const Eeff = print.material === 'PLA' ? 3300 : 2000;
  const Fcr = eulerCritical(Eeff, sec.I, p.reach, 2);
  out.push({
    id: 'buckle',
    label: 'along the shaft (buckling)',
    check: 'buckling',
    at: [C2_GRIP_L + p.reach / 2, 0, 0],
    direction: [1, 0, 0],
    Kt: 1,
    capacity: {
      demand: F,
      capacity: Fcr,
      unit: '',
      math: [
        { label: 'Push force F', expr: 'F', value: F, unit: 'N' },
        { label: 'Shaft I (shell + infill)', expr: 'I', value: sec.I, unit: 'mm⁴' },
        { label: 'Reach L', expr: 'L', value: p.reach, unit: 'mm' },
        { label: 'Critical load', expr: 'F_cr = π²EI / (2L)²', value: Fcr, unit: 'N' },
      ],
    },
    zone: { type: 'segment', from: [C2_GRIP_L, 0, 0], to: [C2_GRIP_L + p.reach, 0, 0], radius: p.shaftD / 2 },
    fix: 'Use a thicker shaft or a shorter reach.',
  });
  // Off-centre pushes (and the bend on the lever version) bend the shaft at the handle.
  const ecc = p.mode === 'lever' ? Math.sin((p.bend * Math.PI) / 180) * p.reach * 0.5 : p.reach * 0.1;
  const s = bending(F * ecc, sec);
  out.push({
    id: 'root',
    label: p.mode === 'lever' ? 'at the bend' : 'where the shaft leaves the handle',
    check: 'bending',
    at: [C2_GRIP_L, 0, 0],
    direction: [1, 0, 0],
    Kt: KT.junctionFillet,
    ktReason: 'handle junction',
    stress: s,
    zone: { type: 'lever', from: [C2_GRIP_L, 0, 0], to: [c2Overall(p), 0, 0], radius: p.shaftD / 2 },
    fix: 'Use a thicker shaft.',
  });
  // Tip contact stress (wear).
  const tipA =
    p.tip === 'cup'
      ? Math.PI * ((c2TipD(p) / 2) ** 2 - (p.targetD / 2 + 1.5) ** 2)
      : Math.PI * (c2TipD(p) / 2) ** 2 * 0.4;
  const sigma = F / Math.max(1, tipA);
  out.push({
    id: 'tip',
    label: 'at the tip (wear)',
    check: 'bearing',
    at: [c2Overall(p), 0, 0],
    direction: null,
    Kt: 1,
    stress: {
      sigma,
      tau: 0,
      math: [{ label: 'Tip contact stress', expr: 'σ = F / A_tip', value: sigma, unit: 'MPa' }],
    },
    zone: { type: 'point', at: [c2Overall(p), 0, 0], radius: 5 },
    fix: 'Use a bigger tip.',
  });
  return out;
}
