import type { Family, FieldDef, ValidationIssue } from './types';
import { buildSchema, defaultsOf } from './schema';
import { MEASURE, err, info, mm, warn, FLAT } from './common';
import { circle, dim, rect, roundRect, text, type Shape } from '../outputs/svg/ir';
import { c1LoadCases, c1Sections } from '../strength/families/c1';

export type C1P = {
  style: 'finger' | 'hand' | 'tbar';
  attach: 'ring' | 'hook' | 'screw';
  holeW: number;
  holeT: number;
  loopW: number;
  pullLen: number;
  band: number;
  thick: number;
  screwSpacing: number;
};

/** Opening the fingers go through: length (X) and width (Y). */
export function c1Opening(p: C1P): { L: number; W: number } {
  if (p.style === 'finger') return { L: Math.max(25, p.loopW), W: Math.max(22, p.pullLen) };
  if (p.style === 'hand') return { L: Math.max(80, p.loopW), W: Math.max(35, p.pullLen) };
  return { L: p.loopW, W: p.pullLen };
}
export const C1_TAB = 14;
/** Hook gap (for the target's material thickness) and hook width (must pass through the hole). */
export const c1HookGap = (p: C1P) => p.holeT + 0.6;
export const c1HookW = (p: C1P) => Math.max(3, p.holeW - 1);

const fields: FieldDef<C1P>[] = [
  {
    key: 'attach',
    kind: 'choice',
    label: 'Attaches by',
    group: 'fit',
    default: 'ring',
    options: [
      { value: 'ring', label: 'Split ring / cord', hint: 'Zipper pulls, bag tabs' },
      { value: 'hook', label: 'Hook', hint: 'Hooks through a hole or slot' },
      { value: 'screw', label: 'Screws', hint: 'Drawer or cupboard front' },
    ],
  },
  {
    key: 'holeW',
    kind: 'number',
    label: 'Hole or slot width',
    unit: 'mm',
    min: 3,
    max: 30,
    step: 0.5,
    default: 8,
    group: 'fit',
    measure: 'holeSize',
    showIf: (p) => p.attach === 'hook',
  },
  {
    key: 'holeT',
    kind: 'number',
    label: 'Material thickness at the hole',
    unit: 'mm',
    min: 0.5,
    max: 20,
    step: 0.5,
    default: 2,
    group: 'fit',
    measure: 'holeSize',
    showIf: (p) => p.attach === 'hook',
  },
  {
    key: 'screwSpacing',
    kind: 'number',
    label: 'Screw spacing',
    unit: 'mm',
    min: 32,
    max: 128,
    step: 1,
    default: 96,
    group: 'fit',
    showIf: (p) => p.attach === 'screw',
    help: 'Centre to centre. Reuse the old handle holes: 64, 96 and 128 mm are common.',
  },
  {
    key: 'style',
    kind: 'choice',
    label: 'Shape',
    group: 'style',
    default: 'hand',
    options: [
      { value: 'finger', label: 'Finger loop' },
      { value: 'hand', label: 'Whole-hand loop' },
      { value: 'tbar', label: 'T-pull' },
    ],
  },
  {
    key: 'loopW',
    kind: 'number',
    label: 'Loop opening length',
    unit: 'mm',
    min: 20,
    max: 140,
    step: 1,
    default: 90,
    group: 'fit',
    help: 'Across the fingers: about 25 mm per finger.',
  },
  {
    key: 'pullLen',
    kind: 'number',
    label: 'Loop opening depth',
    unit: 'mm',
    min: 15,
    max: 80,
    step: 1,
    default: 40,
    group: 'fit',
    help: 'Room for the fingers to hook in.',
  },
  {
    key: 'band',
    kind: 'number',
    label: 'Band width',
    unit: 'mm',
    min: 5,
    max: 14,
    step: 0.5,
    default: 8,
    group: 'fine',
  },
  {
    key: 'thick',
    kind: 'number',
    label: 'Thickness',
    unit: 'mm',
    min: 5,
    max: 15,
    step: 0.5,
    default: 9,
    group: 'fine',
  },
];

function constraints(p: C1P): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  const { L } = c1Opening(p);
  if (p.attach === 'screw' && p.screwSpacing > L + 2 * p.band - 10)
    out.push(
      err(
        'The screws must sit under the ends of the handle.',
        `Make the opening at least ${p.screwSpacing - 2 * p.band + 10} mm long, or use closer screw holes.`,
        'loopW',
      ),
    );
  if (p.attach === 'hook' && p.holeW < 4)
    out.push(
      err(
        'The hole is too small for a printed hook.',
        'Use the split-ring option for holes under 4 mm.',
        'holeW',
      ),
    );
  return out;
}

function rules(p: C1P): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  if (p.band < 7 && p.style === 'hand')
    out.push(warn('A thin band can dig into the hand.', 'Use a band of 7 mm or more.', 'band'));
  out.push(
    info('Print it lying flat: pulling then runs along the layers, which is much stronger than across them.'),
  );
  return out;
}

function outline(p: C1P): Shape[] {
  const { L, W } = c1Opening(p);
  const b = p.band;
  if (p.style === 'tbar')
    return [roundRect(0, 0, L + 2 * b, b * 1.6, b * 0.6), rect(-b / 2, -b * 0.8 - C1_TAB, b, C1_TAB)];
  return [roundRect(0, 0, L + 2 * b, W + 2 * b, (W + 2 * b) / 2), roundRect(0, 0, L, W, W / 2)];
}

function drawing(p: C1P) {
  const { L, W } = c1Opening(p);
  const b = p.band;
  const top: Shape[] = [
    ...outline(p),
    dim([-L / 2 - b, W / 2 + b], [L / 2 + b, W / 2 + b], -8, mm(L + 2 * b, 0)),
  ];
  if (p.style !== 'tbar') top.push(dim([-L / 2, 0], [L / 2, 0], 0, `opening ${mm(L, 0)}`));
  const side: Shape[] = [
    rect(-L / 2 - b, 0, L + 2 * b, p.thick),
    dim([L / 2 + b, 0], [L / 2 + b, p.thick], -8, mm(p.thick, 1)),
  ];
  return {
    views: [
      { name: 'Top', shapes: top },
      { name: 'Side', shapes: side },
      {
        name: 'Section A–A',
        caption: 'Through the band',
        shapes: [
          rect(0, 0, p.band, p.thick, 'outline', 'hatch'),
          dim([0, p.thick], [p.band, p.thick], -5, mm(p.band, 1)),
          dim([p.band, 0], [p.band, p.thick], -6, mm(p.thick, 1)),
        ],
      },
    ],
    keyDims: [
      {
        label: 'Opening',
        value: p.style === 'tbar' ? `bar ${mm(L, 0)}` : `${mm(L, 0)} × ${mm(W, 0)}`,
        tol: '±0.5',
      },
      { label: 'Band × thickness', value: `${mm(b, 1)} × ${mm(p.thick, 1)}`, tol: '±0.3' },
      p.attach === 'hook'
        ? {
            label: 'Hook gap / width',
            value: `${mm(c1HookGap(p), 1)} / ${mm(c1HookW(p), 1)}`,
            tol: '+0.3/−0',
          }
        : p.attach === 'screw'
          ? { label: 'Screw spacing', value: mm(p.screwSpacing, 0), tol: '±0.3' }
          : { label: 'Ring hole', value: 'Ø5 mm', tol: '±0.2' },
    ],
    notes: [
      p.attach === 'screw'
        ? 'Screw in from inside the drawer: two 4 mm wood screws, 8–10 mm longer than the drawer front is thick (3.4 mm pilot holes, 12 mm deep).'
        : p.attach === 'ring'
          ? 'Attach with a split ring or a loop of strong cord.'
          : 'Hook through the hole, then pull.',
    ],
  };
}

export const C1: Family<C1P> = {
  id: 'C1',
  group: 'C',
  name: 'Pull handles',
  blurb:
    'Loops and T-pulls for drawers, zippers, bag tabs and can tabs, so you can pull with the whole hand instead of a pinch.',
  leverage:
    'A loop lets you hook a finger or the whole hand and pull with the arm, instead of pinching a tiny tab between finger and thumb.',
  fields,
  schema: buildSchema(fields, constraints),
  defaults: defaultsOf(fields),
  presets: [
    {
      id: 'zipper',
      label: 'Zipper pull',
      description: 'Finger loop on a split ring.',
      params: { attach: 'ring', style: 'finger', loopW: 30, pullLen: 24, band: 6, thick: 6 },
    },
    {
      id: 'drawer',
      label: 'Drawer handle',
      description: 'Whole-hand loop, screws 96 mm apart.',
      params: { attach: 'screw', style: 'hand', loopW: 100, pullLen: 40, screwSpacing: 96 },
    },
    {
      id: 'can',
      label: 'Can tab opener',
      description: 'Hook that slides under a ring-pull.',
      params: {
        attach: 'hook',
        style: 'finger',
        holeW: 9,
        holeT: 1,
        loopW: 30,
        pullLen: 25,
        band: 7,
        thick: 6,
      },
    },
    {
      id: 'tbar',
      label: 'T-pull for a cord',
      description: 'Bar to grip with the whole hand.',
      params: { attach: 'ring', style: 'tbar', loopW: 90, pullLen: 20, band: 12, thick: 12 },
    },
  ],
  variants: [
    {
      id: 'finger',
      label: 'Finger loop',
      description: 'One or two fingers.',
      patch: { style: 'finger', loopW: 30, pullLen: 24 },
    },
    {
      id: 'hand',
      label: 'Whole-hand loop',
      description: 'All four fingers.',
      patch: { style: 'hand', loopW: 90, pullLen: 40 },
    },
    {
      id: 'tbar',
      label: 'T-pull',
      description: 'A bar to wrap the hand around.',
      patch: { style: 'tbar', band: 12, thick: 12 },
    },
  ],
  loadCases: c1LoadCases,
  criticalSections: c1Sections,
  drawing,
  template(p) {
    const items = [
      {
        title: 'Handle outline (1:1)',
        shapes: [
          ...outline(p),
          text(0, -c1Opening(p).W / 2 - p.band - 6, 'fingers go through the inner shape', 3.5),
        ],
        instruction: 'Cut out the inner shape and try your fingers through it.',
      },
    ];
    if (p.attach === 'screw') {
      items.push({
        title: 'Screw positions (1:1)',
        shapes: [
          circle(-p.screwSpacing / 2, 0, 2),
          circle(p.screwSpacing / 2, 0, 2),
          dim([-p.screwSpacing / 2, 0], [p.screwSpacing / 2, 0], 8, mm(p.screwSpacing, 0)),
        ],
        instruction: 'Hold against the old handle holes: the circles should line up.',
      });
    }
    if (p.attach === 'hook') {
      items.push({
        title: 'Hook width (1:1)',
        shapes: [rect(0, 0, c1HookW(p), 12), text(c1HookW(p) / 2, 16, 'must pass the hole', 3.5)],
        instruction: 'This strip should slide through the hole or slot.',
      });
    }
    return { items };
  },
  net(p) {
    return {
      title: 'Loop mock-up',
      shapes: outline(p),
      instruction: 'Size mock-up — not a functional part. Cut from card and try it with your fingers.',
    };
  },
  ghost(p) {
    const { W } = c1Opening(p);
    const target =
      p.attach === 'screw'
        ? { kind: 'drawer' as const, size: {}, position: [0, 0, 0] as [number, number, number] }
        : p.attach === 'hook'
          ? {
              kind: 'canTab' as const,
              size: {},
              position: [0, -W / 2 - p.band - 14, 0] as [number, number, number],
            }
          : {
              kind: 'zipper' as const,
              size: { w: 8, l: 20, t: 2 },
              position: [0, -W / 2 - p.band - 16, p.thick / 2] as [number, number, number],
            };
    return {
      objects: [
        target,
        {
          kind: 'hand',
          size: { breadth: 0, grip: p.band },
          position: [0, W / 2, p.thick / 2],
          hand: 'right',
          pose: 'hook',
          rotation: [0, 90, 0],
        },
      ],
    };
  },
  animation(p) {
    return {
      steps: [
        {
          caption:
            p.attach === 'screw'
              ? 'Screw it on where the old handle was.'
              : p.attach === 'hook'
                ? 'Hook it through the hole or under the tab.'
                : 'Thread a split ring through the zipper pull.',
          part: { translate: [0, 0, 30] },
        },
        { caption: 'Hook your fingers through the loop.', part: {} },
        { caption: 'Pull with your arm — no pinching.', part: { translate: [0, 25, 0] }, ghosts: [0] },
      ],
    };
  },
  orientation() {
    return {
      candidates: [
        { ...FLAT, note: 'Lying flat, the pull runs along the layers: much stronger, and no supports.' },
        {
          id: 'edge',
          label: 'Standing on edge',
          rotation: [90, 0, 0],
          buildDir: [0, 1, 0],
          supports: 'none',
          note: 'Pulling would split the layers apart.',
        },
      ],
    };
  },
  measureGuide: [MEASURE.holeSize],
  invalidExample: { attach: 'screw', style: 'finger', loopW: 25, screwSpacing: 128 },
  repair(p, keep) {
    const q = { ...p };
    const { L } = c1Opening(q);
    if (q.attach === 'screw' && q.screwSpacing > L + 2 * q.band - 10) {
      if (keep === 'screwSpacing' || keep === 'attach') {
        if (q.style === 'finger') q.style = 'hand';
        q.loopW = Math.min(140, Math.max(q.loopW, q.screwSpacing - 2 * q.band + 10));
      } else q.screwSpacing = Math.max(32, Math.floor(c1Opening(q).L + 2 * q.band - 10));
      if (q.screwSpacing > c1Opening(q).L + 2 * q.band - 10 && keep !== 'band')
        q.band = Math.min(14, (q.screwSpacing - c1Opening(q).L + 10) / 2);
    }
    if (q.attach === 'hook' && q.holeW < 4) {
      if (keep === 'holeW') q.attach = 'ring';
      else q.holeW = 4;
    }
    return q;
  },
  rules,
  sectionAxis: 'x',
  stamp: (p) => `C1-${Math.round(c1Opening(p).L)}`,
  sizeTag: (p) => `${p.style}-${p.attach}`,
};
