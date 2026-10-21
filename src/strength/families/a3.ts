import type { A3P } from '../../families/a3';
import { a3BossD, a3BossH, a3Profile } from '../../families/a3';
import type { UseContext } from '../../families/types';
import { makeLoadCase } from '../loads';
import { rectSection, roundSection } from '../sections';
import { bearing, bending, torsion, KT } from '../checks';
import { profileBearing } from '../../geometry/primitives/profiles';
import type { CriticalSection, LoadCase, PrintSettings } from '../types';
import { shellThickness } from '../types';

export function a3LoadCases(_p: A3P, use: UseContext): LoadCase[] {
  return [makeLoadCase({ task: 'toolSocket', level: use.level, override: use.loadOverride })];
}

export function a3Sections(p: A3P, lc: LoadCase, print: PrintSettings): CriticalSection[] {
  const t = shellThickness(print);
  const shell = { t, infill: print.infill };
  const T = lc.value;
  const B = a3BossD(p);
  const H = a3BossH(p);
  const out: CriticalSection[] = [];
  const pr = profileBearing(a3Profile(p));
  const contactH = p.depth * 0.8;
  const b = bearing(T, pr.n, pr.rEff, pr.faceW * contactH);
  out.push({
    id: 'socket',
    label: 'on the flats inside the socket',
    check: 'bearing',
    at: [pr.rEff, 0, p.depth / 2],
    direction: null,
    Kt: KT.none,
    stress: b,
    zone: { type: 'point', at: [pr.rEff, 0, p.depth / 2], radius: 8 },
    fix: 'Make the socket deeper.',
  });
  // The boss around the socket twists like a tube.
  const tube = roundSection(B, (2 * pr.rEff) / 0.8 + 2 * p.clearance, shell);
  out.push({
    id: 'neck',
    label: 'in the neck around the socket',
    check: 'torsion',
    at: [B / 2, 0, H * 0.6],
    direction: [0.7071, 0, 0.7071],
    Kt: KT.socket,
    ktReason: 'socket corners',
    stress: torsion(T, tube),
    zone: { type: 'segment', from: [0, 0, 0], to: [0, 0, H], radius: B / 2 },
    fix: 'Use more walls, or a bigger grip so the boss is wider.',
  });
  if (p.style === 'T') {
    // Hands push on the bar ends: bending at the bar centre where it meets the boss.
    const arm = p.length / 2;
    const F = T / (2 * arm * 0.75);
    const sec = rectSection(p.gripD * 0.8, p.gripD * 0.8, shell);
    const s = bending(F * (arm * 0.75 - B / 2), sec);
    out.push({
      id: 'bar',
      label: 'where the T-bar meets the socket boss',
      check: 'bending',
      at: [B / 2, 0, H + p.gripD * 0.4],
      direction: [1, 0, 0],
      Kt: KT.junctionFillet,
      ktReason: 'rounded junction',
      stress: s,
      zone: {
        type: 'lever',
        from: [B / 2, 0, H + p.gripD * 0.4],
        to: [p.length / 2, 0, H + p.gripD * 0.4],
        radius: p.gripD * 0.4,
      },
      fix: 'Use a thicker bar.',
    });
  }
  return out;
}
