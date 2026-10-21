import type { Family, FieldDef, ValidationIssue } from './types';
import { buildSchema, defaultsOf } from './schema';
import { MEASURE, err, info, mm, warn } from './common';
import { circle, dim, rect, roundRect, text, type Shape } from '../outputs/svg/ir';
import { b2LoadCases, b2Sections } from '../strength/families/b2';
import { maxPartLength } from '../print/bedfit';

export type B2P = {
  mode: 'key' | 'knob';
  bladeW: number;
  bladeT: number;
  insert: number;
  keys: number;
  knobD: number;
  knobH: number;
  lever: number;
  angle: 'flat' | 'angled';
  retention: 'bolt' | 'none';
  leverW: number;
  leverT: number;
  clearance: number;
};

export const B2_WALL = 3;
export const B2_KEY_PITCH = (p: B2P) => p.bladeT + 2 * p.clearance + 3;
/** Holder block around the key slot(s): x = along the blade width, y = across the thickness. */
/** Depth of the key slot or knob socket. */
export const b2Pocket = (p: B2P) => (p.mode === 'knob' ? p.knobH * 0.8 : p.insert);
/** The pocket stops 4 mm below the top of the wings; the holder hangs below the wings if needed. */
export const b2Bottom = (p: B2P) => Math.min(0, p.leverW - 4 - b2Pocket(p));
export function b2Holder(p: B2P): { w: number; d: number; h: number } {
  const h = p.leverW - b2Bottom(p);
  if (p.mode === 'knob') {
    const D = p.knobD + 2 * p.clearance + 2 * B2_WALL;
    return { w: D, d: D, h };
  }
  const slots = p.keys;
  return {
    w: p.bladeW + 2 * p.clearance + 2 * B2_WALL,
    d: slots * (p.bladeT + 2 * p.clearance) + (slots - 1) * 3 + 2 * B2_WALL,
    h,
  };
}
export const b2Span = (p: B2P) => 2 * p.lever;
const b2MaxSpan = (p: B2P) => maxPartLength(Math.max(b2Holder(p).d, p.leverW) + 2);

const isKey = (p: B2P) => p.mode === 'key';
const fields: FieldDef<B2P>[] = [
  {
    key: 'mode',
    kind: 'choice',
    label: 'Turns a',
    group: 'fit',
    default: 'key',
    options: [
      { value: 'key', label: 'Key', hint: 'Holds the key head' },
      { value: 'knob', label: 'Round knob', hint: 'Fits over a knob' },
    ],
  },
  {
    key: 'bladeW',
    kind: 'number',
    label: 'Key head width',
    unit: 'mm',
    min: 15,
    max: 35,
    step: 0.5,
    default: 24,
    group: 'fit',
    measure: 'keyBlade',
    showIf: isKey,
  },
  {
    key: 'bladeT',
    kind: 'number',
    label: 'Key head thickness',
    unit: 'mm',
    min: 1.5,
    max: 4,
    step: 0.1,
    default: 2.5,
    group: 'fit',
    measure: 'keyBlade',
    showIf: isKey,
  },
  {
    key: 'insert',
    kind: 'number',
    label: 'How far the key goes in',
    unit: 'mm',
    min: 10,
    max: 30,
    step: 1,
    default: 18,
    group: 'fit',
    showIf: isKey,
    help: 'Most of the key head, but not the shoulder.',
  },
  {
    key: 'keys',
    kind: 'number',
    label: 'Number of keys',
    min: 1,
    max: 3,
    step: 1,
    default: 1,
    group: 'style',
    showIf: isKey,
  },
  {
    key: 'knobD',
    kind: 'number',
    label: 'Knob diameter',
    unit: 'mm',
    min: 20,
    max: 60,
    step: 0.5,
    default: 35,
    group: 'fit',
    measure: 'knobDiameter',
    showIf: (p) => p.mode === 'knob',
  },
  {
    key: 'knobH',
    kind: 'number',
    label: 'Knob height',
    unit: 'mm',
    min: 8,
    max: 30,
    step: 1,
    default: 15,
    group: 'fit',
    measure: 'knobDiameter',
    showIf: (p) => p.mode === 'knob',
  },
  {
    key: 'lever',
    kind: 'number',
    label: 'Lever length (each side)',
    unit: 'mm',
    min: 50,
    max: 120,
    step: 5,
    default: 70,
    group: 'fit',
  },
  {
    key: 'angle',
    kind: 'choice',
    label: 'Wings',
    group: 'style',
    default: 'flat',
    options: [
      { value: 'flat', label: 'Flat' },
      { value: 'angled', label: 'Angled', hint: 'Wings tilt back to clear the door' },
    ],
  },
  {
    key: 'retention',
    kind: 'choice',
    label: 'Hold the key in',
    group: 'style',
    default: 'bolt',
    options: [
      { value: 'bolt', label: 'M3 bolt', hint: 'Bolt through the key ring hole' },
      { value: 'none', label: 'Snug fit only' },
    ],
    showIf: isKey,
  },
  {
    key: 'leverW',
    kind: 'number',
    label: 'Wing height',
    unit: 'mm',
    min: 18,
    max: 30,
    step: 1,
    default: 24,
    group: 'fine',
  },
  {
    key: 'leverT',
    kind: 'number',
    label: 'Wing thickness',
    unit: 'mm',
    min: 8,
    max: 16,
    step: 1,
    default: 10,
    group: 'fine',
  },
  {
    key: 'clearance',
    kind: 'number',
    label: 'Clearance',
    unit: 'mm',
    min: 0.2,
    max: 0.5,
    step: 0.05,
    default: 0.3,
    group: 'fine',
  },
];

function constraints(p: B2P): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  if (b2Span(p) > b2MaxSpan(p))
    out.push(
      err(
        'The wings are too long for the printer bed.',
        `Use ${Math.floor(b2MaxSpan(p) / 2 / 5) * 5} mm or less per side.`,
        'lever',
      ),
    );
  if (p.mode === 'knob' && p.lever < p.knobD / 2 + 25)
    out.push(
      err(
        'The wings must reach past the knob.',
        `Use at least ${Math.ceil((p.knobD / 2 + 25) / 5) * 5} mm per side.`,
        'lever',
      ),
    );
  return out;
}

function rules(p: B2P): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  if (p.leverT < 10)
    out.push(warn('Thin wings flex when you push them.', 'Use wings 10 mm or thicker.', 'leverT'));
  if (p.mode === 'key' && p.keys > 1)
    out.push(info('Each slot holds one key; use the one you need and leave the others out.'));
  if (p.mode === 'key') out.push(info('Leave the key in the turner and use it like a bigger key head.'));
  return out;
}

function drawing(p: B2P) {
  const h = b2Holder(p);
  const front: Shape[] = [
    rect(-p.lever, 0, 2 * p.lever, p.leverW),
    rect(-h.w / 2, -h.h + p.leverW, h.w, h.h, 'hidden'),
    dim([-p.lever, p.leverW], [p.lever, p.leverW], -8, mm(2 * p.lever, 0)),
  ];
  const top: Shape[] = [roundRect(0, 0, 2 * p.lever, p.leverT, 3), roundRect(0, 0, h.w, h.d, 3)];
  if (p.mode === 'key') {
    for (let i = 0; i < p.keys; i++) {
      const y = -((p.keys - 1) * B2_KEY_PITCH(p)) / 2 + i * B2_KEY_PITCH(p);
      top.push(
        rect(
          -(p.bladeW + 2 * p.clearance) / 2,
          y - (p.bladeT + 2 * p.clearance) / 2,
          p.bladeW + 2 * p.clearance,
          p.bladeT + 2 * p.clearance,
          'hidden',
        ),
      );
    }
  } else top.push(circle(0, 0, p.knobD / 2 + p.clearance, 'hidden'));
  return {
    views: [
      { name: 'Front', shapes: front },
      { name: 'Top', shapes: top },
      {
        name: 'Section A–A',
        caption: 'Through a wing',
        shapes: [
          rect(0, 0, p.leverT, p.leverW, 'outline', 'hatch'),
          dim([0, p.leverW], [p.leverT, p.leverW], -5, mm(p.leverT, 0)),
          dim([p.leverT, 0], [p.leverT, p.leverW], -6, mm(p.leverW, 0)),
        ],
      },
    ],
    keyDims: [
      p.mode === 'key'
        ? {
            label: 'Key slot',
            value: `${mm(p.bladeW + 2 * p.clearance, 1)} × ${mm(p.bladeT + 2 * p.clearance, 1)}`,
            tol: '+0.2/−0',
          }
        : { label: 'Knob socket', value: `Ø${mm(p.knobD + 2 * p.clearance, 1)}`, tol: '±0.3' },
      { label: 'Wing span', value: mm(2 * p.lever, 0), tol: '±1' },
      { label: 'Wing section', value: `${mm(p.leverW, 0)} × ${mm(p.leverT, 0)}`, tol: '±0.3' },
    ],
    notes: [
      p.mode === 'key' && p.retention === 'bolt'
        ? 'M3 × 20 bolt and nut through the key-ring hole.'
        : 'Snug fit.',
    ],
  };
}

export const B2: Family<B2P> = {
  id: 'B2',
  group: 'B',
  name: 'Key and knob turner',
  blurb: 'Big wings that hold a key or fit over a round knob, so turning needs a push instead of a pinch.',
  leverage:
    'The wings move your hand much further from the turning axis than a key head does, so the same twist needs a fraction of the pinch force.',
  fields,
  schema: buildSchema(fields, constraints),
  defaults: defaultsOf(fields),
  presets: [
    {
      id: 'house-key',
      label: 'House key',
      description: 'Typical door key head 24 × 2.5 mm.',
      params: { mode: 'key', bladeW: 24, bladeT: 2.5, insert: 18, keys: 1 },
    },
    {
      id: 'car-key',
      label: 'Small key',
      description: 'Padlock or post-box key 18 × 2 mm.',
      params: { mode: 'key', bladeW: 18, bladeT: 2, insert: 14, lever: 55 },
    },
    {
      id: 'two-keys',
      label: 'Front and back door',
      description: 'Two keys side by side.',
      params: { mode: 'key', keys: 2 },
    },
    {
      id: 'knob',
      label: 'Round door or cupboard knob',
      description: 'Knob 35 mm across.',
      params: { mode: 'knob', knobD: 35, knobH: 15, lever: 70 },
    },
  ],
  variants: [
    { id: 'flat', label: 'Flat wings', description: 'Simple and strong.', patch: { angle: 'flat' } },
    {
      id: 'angled',
      label: 'Angled wings',
      description: 'Clear the door surface.',
      patch: { angle: 'angled' },
    },
    { id: 'multi', label: 'Multi-key', description: 'Holds two keys.', patch: { mode: 'key', keys: 2 } },
  ],
  loadCases: b2LoadCases,
  criticalSections: b2Sections,
  drawing,
  template(p) {
    const items =
      p.mode === 'key'
        ? [
            {
              title: 'Key slot (1:1)',
              shapes: [
                rect(0, 0, p.bladeW + 2 * p.clearance, p.insert),
                text((p.bladeW + 2 * p.clearance) / 2, p.insert + 5, 'lay the key head here', 3.5),
              ],
              instruction:
                'Lay the key on the outline: the head should fill the width, and this much of it goes into the turner.',
            },
          ]
        : [
            {
              title: 'Knob socket (1:1)',
              shapes: [circle(0, 0, p.knobD / 2 + p.clearance), text(0, 0, `Ø${mm(p.knobD, 0)}`, 4)],
              instruction: 'Hold the circle against the knob — the knob should just fit inside.',
            },
          ];
    items.push({
      title: 'Wing span (1:1)',
      shapes: [
        rect(0, 0, 2 * p.lever, p.leverW),
        text(p.lever, p.leverW / 2, `${mm(2 * p.lever, 0)} wide`, 4),
      ],
      instruction: 'Check the wings clear the door frame and nearby handles.',
    });
    return { items };
  },
  ghost(p) {
    const h = b2Holder(p);
    return {
      objects: [
        p.mode === 'key'
          ? {
              kind: 'key',
              size: { w: p.bladeW, t: p.bladeT },
              position: [0, 0, p.leverW - h.h + p.insert - p.bladeW * 0.45],
            }
          : {
              kind: 'knob',
              size: { d: p.knobD, h: p.knobH },
              // The knob sits in the socket: its top touches the socket roof.
              position: [0, 0, p.leverW - h.h + p.knobH * 0.8 - p.knobH],
            },
        {
          kind: 'hand',
          size: { breadth: 0 },
          position: [p.lever * 0.75, -20, p.leverW / 2],
          hand: 'right',
          pose: 'pinch',
          rotation: [0, 0, 0],
        },
      ],
    };
  },
  animation() {
    return {
      steps: [
        { caption: 'Slot the key (or knob) into the turner.', part: { translate: [0, 0, 25] } },
        { caption: 'Hold a wing — no pinching needed.', part: {} },
        {
          caption: 'Push the wing to turn.',
          part: { rotate: { axis: [0, 0, 1], pivot: [0, 0, 0], deg: 60 } },
          ghosts: [0],
        },
      ],
    };
  },
  orientation() {
    return {
      candidates: [
        {
          id: 'flat',
          label: 'Wings flat on the bed',
          rotation: [90, 0, 0],
          buildDir: [0, 1, 0],
          supports: 'none',
          note: 'The wing bends along the layers — the strong way. The key slot prints as a clean channel.',
        },
        {
          id: 'upright',
          label: 'Standing up',
          rotation: [0, 0, 0],
          buildDir: [0, 0, 1],
          supports: 'none',
          note: 'Pushing the wings bends them across the layers — weaker.',
        },
      ],
    };
  },
  measureGuide: [MEASURE.keyBlade, MEASURE.knobDiameter],
  invalidExample: { mode: 'knob', knobD: 60, lever: 50 },
  repair(p, keep) {
    const q = { ...p };
    if (q.mode === 'knob' && q.lever < q.knobD / 2 + 25) {
      if (keep === 'lever') q.knobD = Math.max(20, (q.lever - 25) * 2);
      else q.lever = Math.min(120, Math.ceil((q.knobD / 2 + 25) / 5) * 5);
    }
    if (b2Span(q) > b2MaxSpan(q) && keep !== 'lever') q.lever = Math.floor(b2MaxSpan(q) / 2 / 5) * 5;
    return q;
  },
  rules,
  sectionAxis: 'x',
  stamp: (p) => `B2-${Math.round(p.mode === 'key' ? p.bladeW : p.knobD)}`,
  sizeTag: (p) =>
    p.mode === 'key'
      ? `key${p.keys > 1 ? `x${p.keys}` : ''}-${Math.round(p.bladeW)}mm`
      : `knob-${Math.round(p.knobD)}mm`,
};
