import type { A2P } from '../../families/a2';
import { a2Gap, a2HolderDepth, a2Inner } from '../../families/a2';
import type { UseContext } from '../../families/types';
import { makeLoadCase } from '../loads';
import { rectSection } from '../sections';
import { bending, tearOut, KT } from '../checks';
import type { CriticalSection, LoadCase, PrintSettings } from '../types';
import { shellThickness } from '../types';

/** Edge distance from a strap slot to the end of the band (mm). */
export const A2_SLOT_EDGE = 6;

export function a2LoadCases(_p: A2P, use: UseContext): LoadCase[] {
  return [makeLoadCase({ task: 'utensilGrip', level: use.level, override: use.loadOverride })];
}

export function a2Sections(p: A2P, lc: LoadCase, print: PrintSettings): CriticalSection[] {
  const t = shellThickness(print);
  const { a, b } = a2Inner(p);
  const F = lc.value;
  const out: CriticalSection[] = [];
  // The hand supports the band all round, so the utensil force mainly tries to peel the pocket off the
  // palm: the band ends carry a moment of about F × pocket depth (more for an open C, which is not tied).
  const hd0 = a2HolderDepth(p);
  const arm = p.style === 'open' ? hd0 + p.bandT : (hd0 + p.bandT) / 2;
  const M = F * arm;
  const sec = rectSection(p.bandWidth, p.bandT, { t: Math.min(t, p.bandT / 2), infill: print.infill });
  const s = bending(M, sec);
  s.math.unshift(
    { label: 'Utensil force F', expr: 'F', value: F, unit: 'N' },
    {
      label: 'Peel arm',
      expr: p.style === 'open' ? 'pocket depth + band' : '(pocket depth + band) / 2, closed ring',
      value: arm,
      unit: 'mm',
    },
  );
  const at: [number, number, number] =
    p.style === 'open'
      ? [a2Gap(p) / 2 + 4, b + p.bandT / 2, p.bandWidth / 2]
      : [a + p.bandT / 2, 0, p.bandWidth / 2];
  out.push({
    id: 'band',
    label: p.style === 'open' ? 'in the band next to the opening' : 'in the band at the sides',
    check: 'bending',
    at,
    direction: [1, 0, 0],
    Kt: p.style === 'open' ? KT.junctionFillet : KT.none,
    ktReason: p.style === 'open' ? 'end of the C' : undefined,
    stress: s,
    zone: { type: 'point', at, radius: 25 },
    fix: 'Use a thicker or wider band, or PETG.',
  });
  // Pocket: utensil levers against the pocket wall.
  const hd = a2HolderDepth(p);
  const wall = rectSection(p.bandWidth, 2.5, { t: Math.min(t, 1.25), infill: print.infill });
  const pw = bending(F * (p.slotT / 2 + 2), wall);
  out.push({
    id: 'pocket',
    label: 'in the utensil pocket wall',
    check: 'bending',
    at: [0, -b - p.bandT - hd + 1, p.bandWidth / 2],
    direction: [0, 0, 1],
    Kt: KT.socket,
    ktReason: 'slot corner',
    stress: pw,
    zone: { type: 'point', at: [0, -b - p.bandT - hd / 2, p.bandWidth / 2], radius: 15 },
    fix: 'Use a deeper pocket wall or a tighter clearance so the utensil does not rock.',
  });
  if (p.style === 'open' && p.strapSlots) {
    const strap = F * 1.5;
    const tear = tearOut(strap, A2_SLOT_EDGE, p.bandT);
    out.push({
      id: 'strap',
      label: 'at the strap slots (tear-out)',
      check: 'tear-out',
      at: [a2Gap(p) / 2 + A2_SLOT_EDGE, b + p.bandT / 2, p.bandWidth / 2],
      direction: [1, 0, 0],
      Kt: KT.socket,
      ktReason: 'slot corner',
      stress: tear,
      zone: {
        type: 'point',
        at: [a2Gap(p) / 2 + A2_SLOT_EDGE, b + p.bandT / 2, p.bandWidth / 2],
        radius: 10,
      },
      fix: 'Use a thicker band so the slots have more material around them.',
    });
  }
  return out;
}
