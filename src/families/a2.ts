import type { Family, FieldDef, ValidationIssue } from './types';
import { buildSchema, defaultsOf } from './schema';
import { MEASURE, err, info, mm, warn, UPRIGHT } from './common';
import { dim, rect, roundRect, text, type Shape } from '../outputs/svg/ir';
import type { Vec2 } from '../types/geom';
import { a2LoadCases, a2Sections } from '../strength/families/a2';

export type A2P = {
  palmWidth: number;
  palmCirc: number;
  bandWidth: number;
  bandT: number;
  slotW: number;
  slotT: number;
  slotAngle: number;
  style: 'open' | 'closed';
  strapSlots: boolean;
  hand: 'right' | 'left';
  clearance: number;
};

export const A2_WALL = 2.5;
export const A2_COMFORT = 3;

/** Palm cross-section as an ellipse: semi-axes a (half width) and b solved from the circumference (Ramanujan). */
export function a2PalmAxes(p: A2P): { a: number; b: number } {
  const a = p.palmWidth / 2;
  const perim = (b: number) => Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
  let lo = 5;
  let hi = a;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (perim(mid) < p.palmCirc) lo = mid;
    else hi = mid;
  }
  return { a, b: (lo + hi) / 2 };
}
/** Inner band semi-axes (palm + comfort gap). */
export function a2Inner(p: A2P) {
  const { a, b } = a2PalmAxes(p);
  return { a: a + A2_COMFORT, b: b + A2_COMFORT };
}
export const a2HolderLen = (p: A2P) => Math.round(p.palmWidth * 0.5);
/** Height the tilted slot needs inside the band width. */
export const a2SlotSpan = (p: A2P) => {
  const ang = (p.slotAngle * Math.PI) / 180;
  return (p.slotW + 2 * p.clearance) * Math.cos(ang) + a2HolderLen(p) * Math.sin(ang) + 2 * A2_WALL;
};
export const a2HolderDepth = (p: A2P) => p.slotT + 2 * p.clearance + 2 * A2_WALL;
export const a2Gap = (p: A2P) => Math.round(p.palmWidth * 0.4);
/** Minimum and maximum palm circumference for a given width (thin to round hand). */
const circRange = (w: number): [number, number] => [Math.ceil(w * 2.1), Math.floor(w * 3.1)];

const fields: FieldDef<A2P>[] = [
  {
    key: 'palmWidth',
    kind: 'number',
    label: 'Palm width',
    unit: 'mm',
    min: 60,
    max: 110,
    step: 1,
    default: 85,
    group: 'fit',
    measure: 'handBreadth',
  },
  {
    key: 'palmCirc',
    kind: 'number',
    label: 'Palm circumference',
    unit: 'mm',
    min: 130,
    max: 300,
    step: 1,
    default: 210,
    group: 'fit',
    measure: 'palmCircumference',
    range: (p) => circRange(p.palmWidth),
  },
  {
    key: 'slotW',
    kind: 'number',
    label: 'Utensil handle width',
    unit: 'mm',
    min: 8,
    max: 25,
    step: 0.5,
    default: 14,
    group: 'fit',
    measure: 'shaftCaliper',
  },
  {
    key: 'slotT',
    kind: 'number',
    label: 'Utensil handle thickness',
    unit: 'mm',
    min: 2,
    max: 10,
    step: 0.5,
    default: 4,
    group: 'fit',
    measure: 'shaftCaliper',
  },
  {
    key: 'slotAngle',
    kind: 'number',
    label: 'Utensil angle',
    unit: '°',
    min: 0,
    max: 45,
    step: 5,
    default: 15,
    group: 'style',
    help: 'Tilts the utensil toward the mouth.',
  },
  {
    key: 'style',
    kind: 'choice',
    label: 'Band',
    group: 'style',
    default: 'open',
    options: [
      { value: 'open', label: 'Open C', hint: 'Slips on from the side — easiest to put on' },
      { value: 'closed', label: 'Closed loop', hint: 'Cannot slip off' },
    ],
  },
  {
    key: 'strapSlots',
    kind: 'bool',
    label: 'Strap slots',
    default: false,
    group: 'style',
    help: 'Thread a hook-and-loop strap to close the gap.',
    showIf: (p) => p.style === 'open',
  },
  {
    key: 'hand',
    kind: 'choice',
    label: 'Hand',
    group: 'style',
    default: 'right',
    options: [
      { value: 'right', label: 'Right' },
      { value: 'left', label: 'Left' },
    ],
  },
  {
    key: 'bandWidth',
    kind: 'number',
    label: 'Band width',
    unit: 'mm',
    min: 25,
    max: 45,
    step: 1,
    default: 35,
    group: 'fine',
  },
  {
    key: 'bandT',
    kind: 'number',
    label: 'Band thickness',
    unit: 'mm',
    min: 2.5,
    max: 4,
    step: 0.5,
    default: 3,
    group: 'fine',
  },
  {
    key: 'clearance',
    kind: 'number',
    label: 'Slot clearance',
    unit: 'mm',
    min: 0.2,
    max: 0.5,
    step: 0.05,
    default: 0.3,
    group: 'fine',
  },
];

function constraints(p: A2P): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  const [lo, hi] = circRange(p.palmWidth);
  if (p.palmCirc < lo || p.palmCirc > hi)
    out.push(
      err(
        `A ${p.palmWidth} mm wide palm usually measures ${lo}–${hi} mm around.`,
        'Re-measure the circumference around the palm, not including the thumb.',
        'palmCirc',
      ),
    );
  if (a2SlotSpan(p) > p.bandWidth) {
    out.push(
      err(
        `The tilted utensil slot needs ${mm(a2SlotSpan(p))} of band width.`,
        `Reduce the angle, or widen the band to ${Math.ceil(a2SlotSpan(p))} mm.`,
        'slotAngle',
      ),
    );
  }
  return out;
}

function rules(p: A2P): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  if (p.style === 'closed')
    out.push(info('A closed cuff must slide over the knuckles. Try the fit template first.'));
  if (p.bandT < 3 && p.style === 'open')
    out.push(
      warn('A thin open band may spring open under load.', 'Use 3 mm or more, or add strap slots.', 'bandT'),
    );
  return out;
}

/** Outline points of an ellipse. */
function ellipsePts(a: number, b: number, n = 72, cy = 0): Vec2[] {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * 2 * Math.PI;
    return [a * Math.cos(t), cy + b * Math.sin(t)] as Vec2;
  });
}

function drawing(p: A2P) {
  const { a, b } = a2Inner(p);
  const T = p.bandT;
  const hl = a2HolderLen(p);
  const hd = a2HolderDepth(p);
  const top: Shape[] = [
    { kind: 'poly', pts: ellipsePts(a + T, b + T), closed: true, style: 'outline' },
    { kind: 'poly', pts: ellipsePts(a, b), closed: true, style: 'outline' },
    rect(-hl / 2, -b - T - hd + 0.5, hl, hd),
    roundRect(0, -b - T - hd / 2 + 0.5, hl + 2, p.slotT + 2 * p.clearance, 0.5, 'hidden'),
    dim([-a, 0], [a, 0], 0, `${mm(2 * a, 0)} inside`),
  ];
  if (p.style === 'open') top.push(text(0, b + T + 6, `gap ${mm(a2Gap(p), 0)}`, 3.5));
  const side: Shape[] = [
    rect(-a - T, 0, 2 * (a + T), p.bandWidth),
    dim([a + T, 0], [a + T, p.bandWidth], -10, mm(p.bandWidth, 0)),
  ];
  return {
    views: [
      { name: 'Top (looking along the arm)', shapes: top },
      { name: 'Side', shapes: side },
      {
        name: 'Section B–B',
        caption: 'Through the band',
        shapes: [
          rect(0, 0, p.bandWidth, p.bandT, 'outline', 'hatch'),
          dim([0, p.bandT], [p.bandWidth, p.bandT], -5, mm(p.bandWidth, 0)),
          dim([p.bandWidth, 0], [p.bandWidth, p.bandT], -6, mm(p.bandT, 1)),
        ],
      },
    ],
    keyDims: [
      { label: 'Inside width', value: mm(2 * a, 0), tol: '±1' },
      { label: 'Inside depth', value: mm(2 * b, 0), tol: '±1' },
      {
        label: 'Utensil slot',
        value: `${mm(p.slotW + 2 * p.clearance, 1)} × ${mm(p.slotT + 2 * p.clearance, 1)}`,
        tol: '+0.2/−0',
      },
      { label: 'Slot angle', value: `${p.slotAngle}°`, tol: '±2°' },
    ],
    notes: [
      p.strapSlots && p.style === 'open'
        ? 'Strap: 20 mm hook-and-loop through both slots.'
        : 'Band springs open to slip on.',
    ],
  };
}

export const A2: Family<A2P> = {
  id: 'A2',
  group: 'A',
  name: 'Universal cuff',
  blurb:
    'A band around the palm with a pocket that holds a spoon, fork, pen or toothbrush — for when gripping is not possible at all.',
  leverage:
    'The cuff lets the whole hand and wrist steer the utensil, so the fingers do not need to grip at all.',
  fields,
  schema: buildSchema(fields, constraints),
  defaults: defaultsOf(fields),
  presets: [
    {
      id: 'spoon',
      label: 'Spoon or fork',
      description: 'Flat cutlery handle, slight tilt toward the mouth.',
      params: { slotW: 14, slotT: 4, slotAngle: 15 },
    },
    {
      id: 'pen',
      label: 'Pen or pencil',
      description: 'Round pen up to 10 mm, no tilt.',
      params: { slotW: 10, slotT: 10, slotAngle: 0 },
    },
    {
      id: 'toothbrush',
      label: 'Toothbrush',
      description: 'Oval handle about 12 × 7 mm.',
      params: { slotW: 12.5, slotT: 7.5, slotAngle: 10 },
    },
    {
      id: 'small-hand',
      label: 'Small hand',
      description: 'Palm about 70 mm wide.',
      params: { palmWidth: 70, palmCirc: 175, bandWidth: 30 },
    },
    {
      id: 'large-hand',
      label: 'Large hand',
      description: 'Palm about 100 mm wide.',
      params: { palmWidth: 100, palmCirc: 245, bandWidth: 40 },
    },
  ],
  variants: [
    {
      id: 'open',
      label: 'Open C',
      description: 'Slips on from the side.',
      patch: { style: 'open', strapSlots: false },
    },
    {
      id: 'strap',
      label: 'Open with strap',
      description: 'Strap slots to close it firmly.',
      patch: { style: 'open', strapSlots: true },
    },
    {
      id: 'closed',
      label: 'Closed loop',
      description: 'Slides over the hand.',
      patch: { style: 'closed', strapSlots: false },
    },
  ],
  loadCases: a2LoadCases,
  criticalSections: a2Sections,
  drawing,
  template(p) {
    const { a, b } = a2Inner(p);
    return {
      items: [
        {
          title: 'Inside of the cuff (1:1)',
          shapes: [
            { kind: 'poly', pts: ellipsePts(a, b), closed: true, style: 'outline' },
            { kind: 'poly', pts: ellipsePts(a + p.bandT, b + p.bandT), closed: true, style: 'thin' },
            text(0, 0, 'palm goes here', 4),
          ],
          instruction:
            'Cut out the inner shape. Your hand, held flat with the thumb tucked, should pass through with a little room.',
        },
        {
          title: 'Utensil slot (1:1)',
          shapes: [
            roundRect(0, 0, p.slotW + 2 * p.clearance, p.slotT + 2 * p.clearance, 0.5),
            text(0, -p.slotT - 6, 'utensil handle should fit inside', 3.5),
          ],
          instruction: 'Lay the utensil handle on this shape — it should just fit inside the outline.',
        },
      ],
    };
  },
  ghost(p) {
    const { b } = a2Inner(p);
    const hd = a2HolderDepth(p);
    const side = p.hand === 'right' ? 1 : -1;
    return {
      objects: [
        {
          kind: 'hand',
          size: { breadth: p.palmWidth },
          position: [0, 0, p.bandWidth / 2],
          hand: p.hand,
          pose: 'palm',
          rotation: [90, 0, 0],
        },
        {
          kind: 'utensil',
          size: { w: p.slotW, h: p.slotT, length: 160 },
          position: [side * -40, -b - p.bandT - hd / 2 + 0.5, p.bandWidth / 2],
          rotation: [0, side * (90 - p.slotAngle), 0],
        },
      ],
    };
  },
  animation(p) {
    return {
      steps: [
        {
          caption: 'Open the hand flat and slide the cuff over the palm.',
          part: { translate: [0, 0, -p.bandWidth * 2.5] },
        },
        { caption: 'The pocket sits on the palm side.', part: {} },
        { caption: 'Push the utensil handle into the pocket from the thumb side.', part: {}, ghosts: [1] },
      ],
    };
  },
  orientation() {
    return {
      candidates: [
        {
          ...UPRIGHT,
          label: 'Band standing on its edge',
          note: 'The band prints as rings of layers, so bending the band runs along the layers.',
        },
        {
          id: 'side',
          label: 'Lying on its side',
          rotation: [90, 0, 0],
          buildDir: [0, 1, 0],
          supports: 'needed',
          note: 'Needs supports; the band bends across layer lines.',
        },
      ],
    };
  },
  measureGuide: [MEASURE.handBreadth, MEASURE.palmCircumference, MEASURE.shaftCaliper],
  invalidExample: { slotAngle: 45, bandWidth: 25 },
  repair(p, keep) {
    const q = { ...p };
    const [lo, hi] = circRange(q.palmWidth);
    if (q.palmCirc < lo || q.palmCirc > hi) {
      if (keep === 'palmCirc') q.palmWidth = Math.min(110, Math.max(60, Math.round(q.palmCirc / 2.5)));
      const [lo2, hi2] = circRange(q.palmWidth);
      if (keep !== 'palmCirc') q.palmCirc = Math.min(hi2, Math.max(lo2, q.palmCirc));
    }
    for (let i = 0; i < 60 && a2SlotSpan(q) > q.bandWidth; i++) {
      if (keep !== 'bandWidth' && q.bandWidth < 45) q.bandWidth = Math.min(45, Math.ceil(a2SlotSpan(q)));
      else if (keep !== 'slotAngle' && q.slotAngle > 0) q.slotAngle -= 5;
      else if (keep !== 'slotW' && q.slotW > 8) q.slotW -= 0.5;
      else break;
    }
    return q;
  },
  rules,
  sectionAxis: 'z',
  stamp: (p) => `A2-${Math.round(p.palmWidth)}`,
  sizeTag: (p) => `${Math.round(p.palmWidth)}mm`,
};

export { ellipsePts as a2EllipsePts };
