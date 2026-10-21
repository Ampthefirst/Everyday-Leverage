import type { B2P } from '../../families/b2';
import { b2Holder } from '../../families/b2';
import type { UseContext } from '../../families/types';
import { makeLoadCase } from '../loads';
import { rectSection } from '../sections';
import { bearing, bending, KT } from '../checks';
import type { CriticalSection, LoadCase, PrintSettings } from '../types';
import { shellThickness } from '../types';

export function b2LoadCases(p: B2P, use: UseContext): LoadCase[] {
  return [
    makeLoadCase({ task: p.mode === 'key' ? 'key' : 'knob', level: use.level, overrides: use.loadOverrides }),
  ];
}

/** Part frame: wings along ±X in the XZ plane (height on Z), thickness on Y; key axis along −Z. */
export function b2Sections(p: B2P, lc: LoadCase, print: PrintSettings): CriticalSection[] {
  const t = shellThickness(print);
  const T = lc.value;
  const h = b2Holder(p);
  const out: CriticalSection[] = [];
  // The hand pushes one wing at ~70% of its length; the wing bends through its thickness (Y).
  const rRoot = h.w / 2;
  const handR = Math.max(rRoot + 5, 0.7 * p.lever);
  const F = T / handR;
  const sec = rectSection(p.leverW, p.leverT, { t, infill: print.infill });
  const s = bending(F * (handR - rRoot), sec);
  s.math.unshift(
    { label: 'Torque T', expr: 'T', value: T, unit: 'N·mm' },
    { label: 'Push on the wing', expr: 'F = T / r_hand', value: F, unit: 'N' },
  );
  out.push({
    id: 'junction',
    label: 'where the wing meets the key holder',
    check: 'bending',
    at: [rRoot, 0, p.leverW / 2],
    direction: [1, 0, 0],
    Kt: KT.junctionSharp,
    ktReason: 'slot-to-wing corner',
    stress: s,
    zone: {
      type: 'lever',
      from: [rRoot, 0, p.leverW / 2],
      to: [p.lever, 0, p.leverW / 2],
      radius: p.leverW / 2,
    },
    fix: 'Make the wings thicker.',
  });
  if (p.mode === 'key') {
    // The key head presses on the two slot sides near its edges.
    const area = p.insert * 0.8 * (p.bladeW * 0.25);
    const b = bearing(T, 2, p.bladeW / 3, area);
    out.push({
      id: 'slot',
      label: 'on the sides of the key slot',
      check: 'bearing',
      at: [p.bladeW / 2, 0, p.leverW - h.h / 2],
      direction: null,
      Kt: KT.socket,
      ktReason: 'slot corners',
      stress: b,
      zone: { type: 'point', at: [p.bladeW / 2, 0, p.leverW - h.h / 2], radius: 8 },
      fix: 'Let the key go in further.',
    });
    // Thin slot walls bend outward.
    const wall = rectSection(p.insert, 3, { t: Math.min(t, 1.5), infill: print.infill });
    const pw = bending((T / (p.bladeW / 3)) * 1.5, wall);
    out.push({
      id: 'slot-wall',
      label: 'in the thin walls beside the key',
      check: 'bending',
      at: [0, (p.bladeT + 2 * p.clearance) / 2 + 1.5, p.leverW - h.h / 2],
      direction: [0, 0, 1],
      Kt: KT.socket,
      ktReason: 'slot corner',
      stress: pw,
      zone: { type: 'point', at: [0, h.d / 2, p.leverW - h.h / 2], radius: 10 },
      fix: 'Let the key go in further.',
    });
  } else {
    const b = bearing(T, 6, p.knobD / 2, 1.5 * p.knobH * 0.6);
    out.push({
      id: 'grip',
      label: 'on the grip ribs around the knob',
      check: 'bearing',
      at: [p.knobD / 2, 0, p.leverW - h.h / 2],
      direction: null,
      Kt: KT.none,
      stress: b,
      zone: { type: 'point', at: [p.knobD / 2, 0, p.leverW - h.h / 2], radius: 10 },
      fix: 'Make the socket deeper.',
    });
  }
  return out;
}
