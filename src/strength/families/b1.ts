import type { B1P } from '../../families/b1';
import { b1BossOD, b1CupHeight, b1Diameters, b1VLength } from '../../families/b1';
import type { UseContext } from '../../families/types';
import { makeLoadCase } from '../loads';
import { rectSection, roundSection } from '../sections';
import { bearing, bending, junctionKt, torsion, KT } from '../checks';
import type { CriticalSection, LoadCase, PrintSettings } from '../types';
import { shellThickness } from '../types';

export function b1LoadCases(p: B1P, use: UseContext): LoadCase[] {
  const task = p.hands === 'two' && p.mount === 'handheld' ? 'jarLidHeavy' : 'jarLid';
  return [makeLoadCase({ task, level: use.level, overrides: use.loadOverrides })];
}

export function b1Sections(p: B1P, lc: LoadCase, print: PrintSettings): CriticalSection[] {
  const t = shellThickness(print);
  const shell = { t, infill: print.infill };
  const T = lc.value;
  const out: CriticalSection[] = [];

  if (p.mount === 'wall') {
    // The lid wedges in the V: the plate edge near the apex carries bearing; the plate bends about its screws.
    const VL = b1VLength(p);
    const contact = Math.max(4, 14 * 0.6);
    const d = (p.lidMin + p.lidMax) / 2;
    const b = bearing(T, 2, d / 2, contact * 3);
    out.push({
      id: 'v-edge',
      label: 'on the V edges where the lid presses',
      check: 'bearing',
      at: [d / 2, VL * 0.5, 7],
      direction: null,
      Kt: KT.none,
      stress: b,
      zone: { type: 'point', at: [d / 2, VL * 0.5, 7], radius: 15 },
      fix: 'Use a thicker plate or fit a rubber strip in the V.',
    });
    const plate = rectSection(14, 30, shell);
    const M = (T / (d / 2)) * 25;
    out.push({
      id: 'plate-neck',
      label: 'in the plate beside the V',
      check: 'bending',
      at: [p.lidMax / 2 + 12, VL * 0.6, 7],
      direction: [0, 1, 0],
      Kt: KT.junctionSharp,
      ktReason: 'V corner',
      stress: bending(M, plate),
      zone: { type: 'point', at: [p.lidMax / 2 + 12, VL * 0.6, 7], radius: 20 },
      fix: 'Use a wider plate or PETG.',
    });
    return out;
  }

  const B = b1BossOD(p);
  const rRoot = B / 2;
  // Hand force at ~70% along the lever; moment at the root is that force times its distance to the root.
  const handR = rRoot + 0.7 * p.lever;
  const levers = p.hands === 'two' ? 2 : 1;
  const F = T / levers / handR;
  const M = F * (handR - rRoot);
  const sec = rectSection(p.leverH, p.leverW, shell);
  const bend = bending(M, sec);
  bend.math.unshift(
    { label: 'Lid torque T', expr: 'T', value: T, unit: 'N·mm' },
    { label: 'Hand force', expr: `F = T / (${levers}·r_hand)`, value: F, unit: 'N' },
  );
  out.push({
    id: 'lever-root',
    label: 'where the lever meets the cup',
    check: 'bending',
    at: [rRoot, 0, p.leverH / 2],
    direction: [1, 0, 0],
    Kt: junctionKt(p.fillet),
    ktReason: p.fillet >= 2 ? `fillet ${p.fillet} mm` : 'sharp corner',
    stress: bend,
    zone: {
      type: 'lever',
      from: [rRoot, 0, p.leverH / 2],
      to: [rRoot + p.lever, 0, p.leverH / 2],
      radius: p.leverW / 2,
    },
    fix: 'Make the lever wider or thicker, or use a bigger fillet.',
  });

  // Cup: the lid pushes on the teeth (bearing) and twists the cup wall (torsion).
  const d0 = b1Diameters(p)[0];
  const H = b1CupHeight(p);
  const zMouth = H - p.stepDepth / 2;
  if (p.teeth === 'serrated') {
    const n = Math.max(12, Math.round((Math.PI * d0) / 9));
    const b = bearing(T, n, d0 / 2, 1.2 * p.stepDepth * 0.8);
    out.push({
      id: 'teeth',
      label: 'on the teeth inside the cup',
      check: 'bearing',
      at: [d0 / 2, 0, zMouth],
      direction: null,
      Kt: KT.none,
      stress: b,
      zone: { type: 'point', at: [d0 / 2 + 1, 0, zMouth], radius: 10 },
      fix: 'Use a deeper cup step.',
    });
  }
  const cupSec = roundSection(B, d0 + 2 * p.clearance, shell);
  const tor = torsion(T, cupSec);
  out.push({
    id: 'cup-wall',
    label: 'in the cup wall',
    check: 'torsion',
    at: [B / 2, 0, H * 0.4],
    direction: [0.7071, 0, 0.7071],
    Kt: KT.socket,
    ktReason: 'step corners',
    stress: tor,
    zone: { type: 'segment', from: [0, 0, 0], to: [0, 0, H], radius: B / 2 },
    fix: 'Use a thicker cup wall.',
  });
  return out;
}
