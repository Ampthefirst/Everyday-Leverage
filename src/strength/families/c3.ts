import type { C3P } from '../../families/c3';
import { c3ClipOD, c3SplitAt } from '../../families/c3';
import type { UseContext } from '../../families/types';
import { makeLoadCase } from '../loads';
import { rectSection } from '../sections';
import { bending, tearOut, KT } from '../checks';
import type { CriticalSection, LoadCase, PrintSettings } from '../types';
import { shellThickness } from '../types';

export function c3LoadCases(_p: C3P, use: UseContext): LoadCase[] {
  return [makeLoadCase({ task: 'reachTip', level: use.level, overrides: use.loadOverrides })];
}

/** Part frame: lever axis on X; clip from x = 0 to clipW; bar continues to the tip; push is along −Z. */
export function c3Sections(p: C3P, lc: LoadCase, print: PrintSettings): CriticalSection[] {
  const t = shellThickness(print);
  const shell = { t, infill: print.infill };
  const F = lc.value;
  const tipX = p.clipW + p.extension;
  const bar = rectSection(p.barW, p.barH, shell);
  const out: CriticalSection[] = [];
  const M = F * p.extension;
  const s = bending(M, bar);
  s.math.unshift(
    { label: 'Push at the tip F', expr: 'F', value: F, unit: 'N' },
    { label: 'Moment at the clip', expr: 'M = F·L', value: M, unit: 'N·mm' },
  );
  out.push({
    id: 'root',
    label: 'where the bar leaves the clip',
    check: 'bending',
    at: [p.clipW, 0, p.barH / 2],
    direction: [1, 0, 0],
    Kt: KT.junctionFillet,
    ktReason: 'filleted junction',
    stress: s,
    zone: { type: 'lever', from: [p.clipW, 0, 0], to: [tipX, 0, 0], radius: Math.max(p.barW, p.barH) / 2 },
    fix: 'Use a deeper bar (bar depth matters most).',
  });
  // The clip reacts the moment as a couple across its length, bending the ring.
  const R = (p.leverD + p.wall) / 2;
  const couple = M / (p.clipW * 0.8);
  const ring = rectSection(p.clipW, p.wall, { t: Math.min(t, p.wall / 2), infill: print.infill });
  const rs = bending((couple * R) / Math.PI, ring);
  rs.math.unshift({ label: 'Clip end force', expr: 'M / (0.8·clip length)', value: couple, unit: 'N' });
  out.push({
    id: 'clip',
    label: 'in the clip ring',
    check: 'bending',
    at: [p.clipW / 2, 0, c3ClipOD(p) / 2 - p.wall / 2],
    direction: [0, 0, 1],
    Kt: p.attach === 'clip' ? KT.junctionFillet : KT.none,
    ktReason: p.attach === 'clip' ? 'clip mouth' : undefined,
    stress: rs,
    zone: { type: 'segment', from: [0, 0, 0], to: [p.clipW, 0, 0], radius: c3ClipOD(p) / 2 },
    fix: 'Use a thicker clip wall or a longer clip.',
  });
  if (p.attach === 'strap') {
    const tear = tearOut(couple, 5, p.clipW * 0.6);
    out.push({
      id: 'strap',
      label: 'at the strap slots (tear-out)',
      check: 'tear-out',
      at: [p.clipW / 2, c3ClipOD(p) / 2 + 3, 0],
      direction: [0, 1, 0],
      Kt: KT.socket,
      ktReason: 'slot corner',
      stress: tear,
      zone: { type: 'point', at: [p.clipW / 2, c3ClipOD(p) / 2 + 3, 0], radius: 10 },
      fix: 'Use a thicker clip wall.',
    });
  }
  const at = c3SplitAt(p);
  if (at !== null) {
    const js = bending(F * (tipX - at), bar);
    out.push({
      id: 'joint',
      label: 'at the dovetail joint',
      check: 'bending',
      at: [at, 0, p.barH / 2],
      direction: [1, 0, 0],
      Kt: KT.junctionSharp,
      ktReason: 'joint step',
      stress: js,
      zone: { type: 'point', at: [at, 0, 0], radius: 15 },
      fix: 'Use a deeper bar, or a shorter extension so it prints in one piece.',
      joint: true,
    });
  }
  return out;
}
