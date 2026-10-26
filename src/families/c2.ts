import type { Family, FieldDef, ValidationIssue } from './types';
import { buildSchema, defaultsOf } from './schema';
import { MEASURE, err, info, mm, warn, FLAT } from './common';
import { circle, dia, dim, line, rect, text, type Shape } from '../outputs/svg/ir';
import { c2LoadCases, c2Sections } from '../strength/families/c2';
import { maxPartLength } from '../print/bedfit';

export type C2P = {
  mode: 'plunger' | 'lever';
  targetD: number;
  pressDepth: number;
  reach: number;
  tip: 'cup' | 'flat' | 'round' | 'stylus';
  shaftD: number;
  gripD: number;
  bend: number;
};

export const C2_GRIP_L = 70;
export const c2TipD = (p: C2P) =>
  p.tip === 'cup'
    ? p.targetD + 2 * 1.5 + 2 * 2
    : p.tip === 'stylus'
      ? 8
      : Math.max(6, Math.min(p.targetD - 1, 20));
export const c2Overall = (p: C2P) => C2_GRIP_L + p.reach + (p.tip === 'cup' ? p.pressDepth + 3 : 6);
const c2MaxLen = (p: C2P) => maxPartLength(Math.max(p.gripD, c2TipD(p)) + (p.mode === 'lever' ? 30 : 2));

const fields: FieldDef<C2P>[] = [
  {
    key: 'targetD',
    kind: 'number',
    label: 'Button size',
    unit: 'mm',
    min: 5,
    max: 40,
    step: 0.5,
    default: 12,
    group: 'fit',
    measure: 'buttonSize',
  },
  {
    key: 'pressDepth',
    kind: 'number',
    label: 'Press depth',
    unit: 'mm',
    min: 1,
    max: 10,
    step: 0.5,
    default: 3,
    group: 'fit',
    measure: 'buttonSize',
    help: 'How far the button moves.',
  },
  {
    key: 'reach',
    kind: 'number',
    label: 'Reach',
    unit: 'mm',
    min: 20,
    max: 200,
    step: 5,
    default: 80,
    group: 'fit',
    measure: 'reachDistance',
    help: 'Length beyond the handle.',
  },
  {
    key: 'mode',
    kind: 'choice',
    label: 'Type',
    group: 'style',
    default: 'plunger',
    options: [
      { value: 'plunger', label: 'Straight pusher', hint: 'Push straight in' },
      { value: 'lever', label: 'Angled lever', hint: 'Bent shaft for awkward spots' },
    ],
  },
  {
    key: 'bend',
    kind: 'number',
    label: 'Bend angle',
    unit: '°',
    min: 15,
    max: 60,
    step: 5,
    default: 30,
    group: 'style',
    showIf: (p) => p.mode === 'lever',
  },
  {
    key: 'tip',
    kind: 'choice',
    label: 'Tip',
    group: 'style',
    default: 'cup',
    options: [
      { value: 'cup', label: 'Centring cup', hint: 'Finds the button by itself' },
      { value: 'flat', label: 'Flat' },
      { value: 'round', label: 'Rounded' },
      { value: 'stylus', label: 'Touch-screen stylus', hint: 'Needs conductive filament for the tip' },
    ],
  },
  {
    key: 'shaftD',
    kind: 'number',
    label: 'Shaft thickness',
    unit: 'mm',
    min: 8,
    max: 20,
    step: 0.5,
    default: 12,
    group: 'fine',
  },
  {
    key: 'gripD',
    kind: 'number',
    label: 'Handle thickness',
    unit: 'mm',
    min: 18,
    max: 40,
    step: 1,
    default: 28,
    group: 'fine',
    measure: 'handBreadth',
  },
];

function constraints(p: C2P): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  if (p.gripD < p.shaftD + 4)
    out.push(
      err(
        'The handle must be thicker than the shaft.',
        `Use a handle of at least ${p.shaftD + 4} mm.`,
        'gripD',
      ),
    );
  if (c2Overall(p) > c2MaxLen(p))
    out.push(
      err(
        'Too long for the printer bed.',
        `Reduce the reach to ${Math.floor((c2MaxLen(p) - (c2Overall(p) - p.reach)) / 5) * 5} mm or less.`,
        'reach',
      ),
    );
  return out;
}

function rules(p: C2P): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  if (p.tip === 'stylus')
    out.push(
      warn(
        'Touch screens only respond to a conductive tip.',
        'Print the tip in conductive filament, or glue on a stylus nib.',
        'tip',
      ),
    );
  if (p.tip !== 'stylus')
    out.push(
      info('The tip wears with use — check it now and then; reprint when it gets flattened or rough.'),
    );
  if (p.reach > 150 && p.shaftD < 12)
    out.push(warn('A long thin shaft can buckle when you push.', 'Use a thicker shaft.', 'shaftD'));
  return out;
}

function drawing(p: C2P) {
  const L = c2Overall(p);
  const side: Shape[] = [
    rect(0, -p.gripD / 2, C2_GRIP_L, p.gripD),
    rect(C2_GRIP_L, -p.shaftD / 2, p.reach, p.shaftD),
    line([-5, 0], [L + 5, 0], 'center'),
    dim([0, p.gripD / 2], [L, p.gripD / 2], -8, mm(L, 0)),
    dim([C2_GRIP_L, -p.gripD / 2], [C2_GRIP_L + p.reach, -p.gripD / 2], 8, `reach ${mm(p.reach, 0)}`),
  ];
  if (p.mode === 'lever') side.push(text(C2_GRIP_L, p.gripD / 2 + 10, `bent ${p.bend}° here`, 3.5));
  const tip: Shape[] = [circle(0, 0, c2TipD(p) / 2)];
  if (p.tip === 'cup') tip.push(circle(0, 0, p.targetD / 2 + 1.5, 'hidden'));
  return {
    views: [
      { name: 'Side', shapes: side },
      { name: 'Tip end', shapes: tip },
      {
        name: 'Section A–A',
        caption: 'Through the shaft',
        shapes: [
          circle(0, 0, p.shaftD / 2, 'outline', 'hatch'),
          dia(0, 0, p.shaftD / 2, `Ø${mm(p.shaftD, 1)}`),
        ],
      },
    ],
    keyDims: [
      { label: 'Overall length', value: mm(L, 0), tol: '±1' },
      { label: 'Shaft', value: `Ø${mm(p.shaftD, 1)}`, tol: '±0.3' },
      {
        label: 'Tip',
        value:
          p.tip === 'cup'
            ? `cup Ø${mm(p.targetD + 3, 1)} × ${mm(p.pressDepth + 1, 1)} deep`
            : `Ø${mm(c2TipD(p), 1)} ${p.tip}`,
        tol: '±0.3',
      },
    ],
    notes: [
      p.tip === 'stylus'
        ? 'Stylus tip: conductive filament or a glued-on nib.'
        : 'Replace when the tip wears.',
    ],
  };
}

export const C2: Family<C2P> = {
  id: 'C2',
  group: 'C',
  name: 'Press and touch aids',
  blurb:
    'Pushers and stylus grips for small buttons, switches and touch screens — press with the hand or arm instead of a fingertip.',
  leverage:
    'A thick handle lets you push with the whole hand, and the narrow tip puts all of that push onto the small button.',
  fields,
  schema: buildSchema(fields, constraints),
  defaults: defaultsOf(fields),
  presets: [
    {
      id: 'lift',
      label: 'Lift or doorbell button',
      description: 'Round button 20 mm across.',
      params: { targetD: 20, pressDepth: 3, reach: 100, tip: 'cup' },
    },
    {
      id: 'remote',
      label: 'Remote control',
      description: 'Small 8 mm buttons.',
      params: { targetD: 8, pressDepth: 1.5, reach: 40, tip: 'round', shaftD: 9, gripD: 26 },
    },
    {
      id: 'switch',
      label: 'Light switch',
      description: 'Flat rocker, long reach.',
      params: { targetD: 25, pressDepth: 5, reach: 150, tip: 'flat', mode: 'lever', shaftD: 14 },
    },
    {
      id: 'stylus',
      label: 'Phone or tablet',
      description: 'Thick stylus grip.',
      params: { tip: 'stylus', reach: 40, shaftD: 10, gripD: 30 },
    },
  ],
  variants: [
    { id: 'plunger', label: 'Straight pusher', description: 'Push straight in.', patch: { mode: 'plunger' } },
    { id: 'lever', label: 'Angled lever', description: 'Bent shaft.', patch: { mode: 'lever', bend: 30 } },
    { id: 'stylus', label: 'Stylus', description: 'For touch screens.', patch: { tip: 'stylus' } },
  ],
  loadCases: c2LoadCases,
  criticalSections: c2Sections,
  drawing,
  template(p) {
    return {
      items: [
        {
          title: 'Tip (1:1)',
          shapes: [
            circle(0, 0, c2TipD(p) / 2),
            ...(p.tip === 'cup' ? [circle(0, 0, p.targetD / 2 + 1.5, 'hidden') as Shape] : []),
            text(0, -c2TipD(p) / 2 - 6, 'hold over the button', 3.5),
          ],
          instruction:
            p.tip === 'cup'
              ? 'The dashed circle should just fit around the button.'
              : 'The tip should be a little smaller than the button.',
        },
        {
          title: 'Length (1:1)',
          shapes: [
            rect(0, 0, Math.min(c2Overall(p), 240), 10),
            text(Math.min(c2Overall(p), 240) / 2, 15, `${mm(c2Overall(p), 0)} overall`, 4),
          ],
          instruction: 'Check the reach from where you sit or stand.',
        },
      ],
    };
  },
  ghost(p) {
    // A cup goes over the button: the button stands proud enough to reach 1 mm into it and the panel
    // stays 1 mm clear of the rim when pushed. Other tips just touch the button.
    const cup = p.tip === 'cup';
    const h = cup ? p.pressDepth + 2 : 3;
    const face = c2Overall(p) + (cup ? p.pressDepth + 1 : h);
    return {
      objects: [
        // Ghost 0 is the button (pushed in with the tip), ghost 2 the panel round it.
        {
          kind: 'button',
          size: { d: p.targetD, h, panel: 0 },
          position: [face, 0, 0],
          rotation: [0, -90, 0],
        },
        {
          kind: 'hand',
          size: { breadth: 0, grip: p.gripD },
          position: [C2_GRIP_L / 2, 0, 0],
          hand: 'right',
          pose: 'grip',
          rotation: [0, 90, 0],
        },
        { kind: 'button', size: { d: p.targetD, cap: 0 }, position: [face, 0, 0], rotation: [0, -90, 0] },
      ],
    };
  },
  animation(p) {
    return {
      steps: [
        { caption: 'Hold the handle in your fist.', part: { translate: [-30, 0, 0] } },
        {
          caption: p.tip === 'cup' ? 'Place the cup over the button.' : 'Put the tip on the button.',
          part: {},
        },
        // The button goes in with the tip; the panel stays.
        { caption: 'Push with your arm.', part: { translate: [p.pressDepth, 0, 0] }, ghosts: [0, 1] },
      ],
    };
  },
  orientation() {
    return {
      candidates: [
        {
          ...FLAT,
          note: 'Lying flat: pushing runs along the layers, so the shaft will not snap between layers.',
        },
        {
          id: 'upright',
          label: 'Standing up',
          rotation: [0, -90, 0],
          buildDir: [1, 0, 0],
          supports: 'none',
          note: 'Tall and thin — pushing loads cross every layer. Not recommended.',
        },
      ],
    };
  },
  measureGuide: [MEASURE.buttonSize, MEASURE.reachDistance],
  invalidExample: { shaftD: 20, gripD: 20 },
  repair(p, keep) {
    const q = { ...p };
    if (q.gripD < q.shaftD + 4) {
      if (keep === 'gripD') q.shaftD = Math.max(8, q.gripD - 4);
      else q.gripD = Math.min(40, q.shaftD + 4);
    }
    while (c2Overall(q) > c2MaxLen(q) && q.reach > 20 && keep !== 'reach') q.reach -= 5;
    if (c2Overall(q) > c2MaxLen(q) && keep !== 'mode') q.mode = 'plunger';
    if (c2Overall(q) > c2MaxLen(q) && keep !== 'tip') q.tip = 'round';
    return q;
  },
  rules,
  sectionAxis: 'x',
  stamp: (p) => `C2-${Math.round(p.reach)}`,
  sizeTag: (p) => `${p.mode}-${Math.round(p.reach)}mm`,
};
