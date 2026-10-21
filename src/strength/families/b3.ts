import type { B3P } from '../../families/b3';
import { b3BossD, b3Height, b3Profile } from '../../families/b3';
import type { UseContext } from '../../families/types';
import { makeLoadCase } from '../loads';
import { rectSection } from '../sections';
import { bearing, bending, junctionKt, KT } from '../checks';
import { profileBearing } from '../../geometry/primitives/profiles';
import type { CriticalSection, LoadCase, PrintSettings } from '../types';
import { shellThickness } from '../types';

export function b3LoadCases(_p: B3P, use: UseContext): LoadCase[] {
  return [makeLoadCase({ task: 'knob', level: use.level, overrides: use.loadOverrides, repeated: true })];
}

export function b3Sections(p: B3P, lc: LoadCase, print: PrintSettings): CriticalSection[] {
  const t = shellThickness(print);
  const shell = { t, infill: print.infill };
  const T = lc.value;
  const B = b3BossD(p);
  const H = b3Height(p);
  const out: CriticalSection[] = [];
  const pr = profileBearing(b3Profile(p));
  const contact = pr.faceW * p.depth * 0.8;
  const b = bearing(T, pr.n, pr.rEff, contact);
  out.push({
    id: 'socket',
    label: 'on the socket wall where the shape pushes',
    check: 'bearing',
    at: [pr.rEff, 0, H - p.depth / 2],
    direction: null,
    Kt: KT.socket,
    ktReason: 'socket corners',
    stress: b,
    zone: { type: 'point', at: [pr.rEff + p.wall / 2, 0, H - p.depth / 2], radius: 8 },
    fix: 'Make the socket deeper or the wall thicker.',
  });
  const levers = p.hands === 'two' ? 2 : 1;
  const rRoot = B / 2;
  const handR = rRoot + 0.7 * p.lever;
  const F = T / levers / handR;
  const sec = rectSection(p.leverH, p.leverW, shell);
  const s = bending(F * (handR - rRoot), sec);
  s.math.unshift(
    { label: 'Torque T', expr: 'T', value: T, unit: 'N·mm' },
    { label: 'Hand force', expr: `F = T / (${levers}·r_hand)`, value: F, unit: 'N' },
  );
  out.push({
    id: 'lever-root',
    label: 'where the lever meets the socket',
    check: 'bending',
    at: [rRoot, 0, p.leverH / 2],
    direction: [1, 0, 0],
    Kt: junctionKt(p.fillet),
    ktReason: p.fillet >= 2 ? `fillet ${p.fillet} mm` : 'sharp corner',
    stress: s,
    zone: {
      type: 'lever',
      from: [rRoot, 0, p.leverH / 2],
      to: [rRoot + p.lever, 0, p.leverH / 2],
      radius: p.leverW / 2,
    },
    fix: 'Make the lever thicker or use a bigger fillet.',
  });
  return out;
}
