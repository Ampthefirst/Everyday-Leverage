import type { C1P } from '../../families/c1';
import { c1Opening, c1HookGap, C1_TAB } from '../../families/c1';
import type { UseContext } from '../../families/types';
import { makeLoadCase } from '../loads';
import { rectSection } from '../sections';
import { bending, loopTension, tearOut, KT } from '../checks';
import type { CriticalSection, LoadCase, PrintSettings } from '../types';
import { shellThickness } from '../types';

export function c1LoadCases(p: C1P, use: UseContext): LoadCase[] {
  const task = p.attach === 'screw' ? 'drawerPull' : 'zipperTab';
  return [makeLoadCase({ task, level: use.level, override: use.loadOverride })];
}

/** Part frame: loop in XY (pull along +Y), thickness on Z; attachment on −Y. */
export function c1Sections(p: C1P, lc: LoadCase, print: PrintSettings): CriticalSection[] {
  const t = shellThickness(print);
  const shell = { t, infill: print.infill };
  const F = lc.value;
  const { L, W } = c1Opening(p);
  const b = p.band;
  const out: CriticalSection[] = [];
  const sec = rectSection(p.thick, b, shell);
  if (p.attach === 'screw') {
    // D-handle: grip bar between two posts, load at mid-span (M = F·L/4); posts in bending.
    const span = p.screwSpacing;
    const s = bending((F * span) / 4, sec);
    s.math.unshift(
      { label: 'Pull F', expr: 'F', value: F, unit: 'N' },
      { label: 'Moment at mid-bar', expr: 'M = F·L/4', value: (F * span) / 4, unit: 'N·mm' },
    );
    out.push({
      id: 'bar',
      label: 'in the middle of the grip bar',
      check: 'bending',
      at: [0, W / 2 + b / 2, p.thick / 2],
      direction: [1, 0, 0],
      Kt: KT.none,
      stress: s,
      zone: {
        type: 'segment',
        from: [-span / 2, W / 2 + b / 2, p.thick / 2],
        to: [span / 2, W / 2 + b / 2, p.thick / 2],
        radius: b,
      },
      fix: 'Use a thicker or wider band.',
    });
    const post = bending((F / 2) * (W + b) * 0.5, sec);
    out.push({
      id: 'post',
      label: 'where the handle meets its screw feet',
      check: 'bending',
      at: [span / 2, -W / 2 - b / 2, p.thick / 2],
      direction: [0, 1, 0],
      Kt: KT.junctionFillet,
      ktReason: 'rounded corner',
      stress: post,
      zone: { type: 'point', at: [span / 2, -W / 2 - b / 2, p.thick / 2], radius: 12 },
      fix: 'Use a thicker band.',
    });
    return out;
  }
  if (p.style === 'tbar') {
    const s = bending((F * L) / 8, sec);
    out.push({
      id: 'tbar',
      label: 'in the T-bar beside the stem',
      check: 'bending',
      at: [0, 0, p.thick / 2],
      direction: [1, 0, 0],
      Kt: KT.junctionFillet,
      ktReason: 'stem junction',
      stress: s,
      zone: { type: 'lever', from: [0, 0, p.thick / 2], to: [L / 2 + b, 0, p.thick / 2], radius: b },
      fix: 'Use a thicker bar.',
    });
  } else {
    const R = (W + b) / 2;
    const s = loopTension(F, R, sec);
    out.push({
      id: 'loop',
      label: 'in the loop where the fingers pull',
      check: 'loop',
      at: [0, W / 2 + b / 2, p.thick / 2],
      direction: [1, 0, 0],
      Kt: KT.none,
      stress: s,
      zone: { type: 'point', at: [0, W / 2 + b / 2, p.thick / 2], radius: Math.max(15, L / 3) },
      fix: 'Use a thicker or wider band.',
    });
  }
  const yTab = p.style === 'tbar' ? -b * 0.8 - C1_TAB / 2 : -W / 2 - b - C1_TAB / 2;
  if (p.attach === 'ring') {
    const tear = tearOut(F, 4, p.thick);
    out.push({
      id: 'ring-hole',
      label: 'at the ring hole (tear-out)',
      check: 'tear-out',
      at: [0, yTab - 2.5, p.thick / 2],
      direction: [0, 1, 0],
      Kt: KT.socket,
      ktReason: 'hole edge',
      stress: tear,
      zone: { type: 'point', at: [0, yTab - 2.5, p.thick / 2], radius: 8 },
      fix: 'Use a thicker pull.',
    });
  } else {
    const hookSec = rectSection(p.thick, 4, shell);
    const s = bending(F * (c1HookGap(p) / 2 + 2), hookSec);
    out.push({
      id: 'hook',
      label: 'at the bend of the hook',
      check: 'bending',
      at: [0, yTab - C1_TAB / 2, p.thick / 2],
      direction: [0, 1, 0],
      Kt: KT.junctionFillet,
      ktReason: 'hook bend',
      stress: s,
      zone: { type: 'point', at: [0, yTab - C1_TAB / 2, p.thick / 2], radius: 8 },
      fix: 'Use a thicker pull.',
    });
  }
  return out;
}
