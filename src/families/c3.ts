import type { Family, FieldDef, ValidationIssue } from './types';
import { buildSchema, defaultsOf } from './schema';
import { MEASURE, barGripD, err, info, mm, warn } from './common';
import { circle, dim, line, rect, roundRect, text, type Shape } from '../outputs/svg/ir';
import { c3LoadCases, c3Sections } from '../strength/families/c3';
import { maxPartLength } from '../print/bedfit';

export type C3P = {
  leverD: number;
  extension: number;
  hook: boolean;
  hookR: number;
  attach: 'clip' | 'strap';
  clipW: number;
  barW: number;
  barH: number;
  wall: number;
};

export const c3ClipOD = (p: C3P) => p.leverD + 2 * p.wall;
export const c3HookExtra = (p: C3P) => (p.hook ? p.hookR + p.barH : 0);
/** Overall length along X. */
export const c3Length = (p: C3P) => p.clipW + p.extension + c3HookExtra(p);
/** Width of the footprint when printed on its side (lever axis along X, Y up). */
export const c3Width = (p: C3P) =>
  Math.max(
    c3ClipOD(p) + (p.attach === 'strap' ? 2 * (3 + 2 * p.wall) : 0),
    p.hook ? 2 * p.hookR + p.barH : p.barH,
  );
export const c3MaxOnePiece = (p: C3P) => maxPartLength(c3Width(p) + 2);
const SPLIT_MARGIN = 12;
/** Cut position along X when the part is too long for the bed (as near the tip as both halves allow). */
export function c3SplitAt(p: C3P): number | null {
  const L = c3Length(p);
  const lim = c3MaxOnePiece(p) - SPLIT_MARGIN;
  if (L <= c3MaxOnePiece(p)) return null;
  return Math.min(lim, p.clipW + p.extension - 25);
}

const fields: FieldDef<C3P>[] = [
  {
    key: 'leverD',
    kind: 'number',
    label: 'Door lever thickness',
    unit: 'mm',
    min: 12,
    max: 30,
    step: 0.5,
    default: 18,
    group: 'fit',
    measure: 'leverDiameter',
  },
  {
    key: 'extension',
    kind: 'number',
    label: 'Extension length',
    unit: 'mm',
    min: 50,
    max: 330,
    step: 5,
    default: 160,
    group: 'fit',
    measure: 'reachDistance',
    help: 'Longer = less force, but needs more room. Long ones print in two parts.',
  },
  {
    key: 'attach',
    kind: 'choice',
    label: 'Fixing',
    group: 'style',
    default: 'clip',
    options: [
      { value: 'clip', label: 'Clip-on', hint: 'Snaps over the lever' },
      { value: 'strap', label: 'Strap-on', hint: 'Hook-and-loop strap — fits odd shapes' },
    ],
  },
  {
    key: 'hook',
    kind: 'bool',
    label: 'Hook at the end',
    default: true,
    group: 'style',
    help: 'Pull the door closed or reach a cord.',
  },
  {
    key: 'hookR',
    kind: 'number',
    label: 'Hook radius',
    unit: 'mm',
    min: 10,
    max: 40,
    step: 1,
    default: 20,
    group: 'style',
    showIf: (p) => p.hook,
  },
  {
    key: 'clipW',
    kind: 'number',
    label: 'Clip length',
    unit: 'mm',
    min: 25,
    max: 60,
    step: 1,
    default: 40,
    group: 'fine',
    help: 'How much of the lever the clip covers.',
  },
  {
    key: 'barW',
    kind: 'number',
    label: 'Bar width',
    unit: 'mm',
    min: 14,
    max: 32,
    step: 1,
    default: 20,
    group: 'fine',
  },
  {
    key: 'barH',
    kind: 'number',
    label: 'Bar depth',
    unit: 'mm',
    min: 10,
    max: 24,
    step: 1,
    default: 16,
    group: 'fine',
    help: 'Depth in the direction you push; matters most for strength.',
  },
  {
    key: 'wall',
    kind: 'number',
    label: 'Clip wall',
    unit: 'mm',
    min: 3,
    max: 6,
    step: 0.5,
    default: 4,
    group: 'fine',
  },
];

function constraints(p: C3P): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  if (p.barH > c3ClipOD(p))
    out.push(
      err(
        'The bar is deeper than the clip.',
        `Use a bar depth of ${Math.floor(c3ClipOD(p))} mm or less.`,
        'barH',
      ),
    );
  if (p.hook && p.hookR < p.barH * 0.75)
    out.push(
      err(
        'The hook is too tight for the bar size.',
        `Use a hook radius of at least ${Math.ceil(p.barH * 0.75)} mm.`,
        'hookR',
      ),
    );
  const at = c3SplitAt(p);
  if (at !== null && c3Length(p) - at > c3MaxOnePiece(p) - SPLIT_MARGIN)
    out.push(err('Too long even in two parts.', 'Shorten the extension.', 'extension'));
  return out;
}

function rules(p: C3P): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  if (c3SplitAt(p) !== null)
    out.push(
      info(
        'This is longer than the bed, so it prints in 2 parts joined by a dovetail. Glue the joint (CA or epoxy).',
      ),
    );
  if (p.attach === 'clip')
    out.push(info('The clip needs a few supports inside it — enable "supports touching build plate".'));
  if (p.extension > 250 && p.barH < 16)
    out.push(warn('A long, shallow bar flexes a lot.', 'Use a bar depth of 16 mm or more.', 'barH'));
  return out;
}

function drawing(p: C3P) {
  const L = c3Length(p);
  const D = c3ClipOD(p);
  const side: Shape[] = [
    rect(0, -D / 2, p.clipW, D),
    rect(p.clipW, -p.barH / 2, p.extension, p.barH),
    line([-5, 0], [p.clipW + 5, 0], 'center'),
  ];
  if (p.hook)
    side.push({
      kind: 'arc',
      c: [p.clipW + p.extension, p.hookR],
      r: p.hookR,
      a0: -90,
      a1: 90,
      style: 'outline',
    });
  side.push(
    dim([0, -D / 2], [L, -D / 2], 10, mm(L, 0)),
    dim([p.clipW, p.barH / 2], [p.clipW + p.extension, p.barH / 2], -8, `extension ${mm(p.extension, 0)}`),
  );
  const at = c3SplitAt(p);
  if (at !== null) side.push(line([at, -p.barH], [at, p.barH], 'cut'), text(at, p.barH + 5, 'joint', 3.5));
  const end: Shape[] = [
    circle(0, 0, D / 2),
    circle(0, 0, p.leverD / 2, 'hidden'),
    roundRect(0, 0, p.barW, p.barH, 3, 'thin'),
  ];
  return {
    views: [
      { name: 'Side', shapes: side },
      { name: 'End (clip)', shapes: end },
      {
        name: 'Section A–A',
        caption: 'Through the bar at the clip',
        shapes: [
          roundRect(0, 0, p.barW, p.barH, 3, 'outline', 'hatch'),
          dim([-p.barW / 2, p.barH / 2], [p.barW / 2, p.barH / 2], -5, mm(p.barW, 0)),
          dim([p.barW / 2, -p.barH / 2], [p.barW / 2, p.barH / 2], -6, mm(p.barH, 0)),
        ],
      },
    ],
    keyDims: [
      { label: 'Clip inside', value: `Ø${mm(p.leverD, 1)}`, tol: '±0.3' },
      { label: 'Overall length', value: mm(L, 0), tol: '±1' },
      { label: 'Bar section', value: `${mm(p.barW, 0)} × ${mm(p.barH, 0)}`, tol: '±0.3' },
      ...(at !== null ? [{ label: 'Joint at', value: mm(at, 0), tol: '—' }] : []),
    ],
    notes: [
      at !== null ? 'Printed in 2 parts: dovetail joint, glue it.' : 'One piece.',
      p.attach === 'strap' ? 'Strap: 25 mm hook-and-loop through both slots.' : 'Snaps over the lever.',
    ],
  };
}

export const C3: Family<C3P> = {
  id: 'C3',
  group: 'C',
  name: 'Door and reach aids',
  blurb:
    'A long arm that clips onto a door lever (with a hook at the end), so the door opens with a light push from further away.',
  leverage:
    'Pushing at the end of a longer lever needs less force for the same turn — doubling the length halves the push.',
  fields,
  schema: buildSchema(fields, constraints),
  defaults: defaultsOf(fields),
  presets: [
    {
      id: 'door',
      label: 'Door lever extender',
      description: 'Clip-on, 160 mm, with a pull hook.',
      params: { leverD: 18, extension: 160, hook: true, attach: 'clip' },
    },
    {
      id: 'short',
      label: 'Short extender',
      description: 'Just a little more leverage, 80 mm.',
      params: { extension: 80, hook: false },
    },
    {
      id: 'long',
      label: 'Long reach',
      description: '300 mm extension — prints in two parts.',
      params: { extension: 300, barH: 18, hook: true },
    },
    {
      id: 'strap',
      label: 'Odd-shaped lever',
      description: 'Strap-on saddle for curved levers.',
      params: { attach: 'strap', extension: 140 },
    },
  ],
  variants: [
    { id: 'clip', label: 'Clip-on', description: 'Snaps over the lever.', patch: { attach: 'clip' } },
    { id: 'strap', label: 'Strap-on', description: 'Strapped to the lever.', patch: { attach: 'strap' } },
    { id: 'hook', label: 'With hook', description: 'Hook at the end.', patch: { hook: true } },
  ],
  loadCases: c3LoadCases,
  criticalSections: c3Sections,
  drawing,
  template(p) {
    return {
      items: [
        {
          title: 'Clip size (1:1)',
          shapes: [
            circle(0, 0, p.leverD / 2),
            circle(0, 0, c3ClipOD(p) / 2, 'thin'),
            text(0, -c3ClipOD(p) / 2 - 6, 'lever end should fit the inner circle', 3.5),
          ],
          instruction: 'Hold the circle against the end of the door lever.',
        },
        {
          title: 'Reach (shown in sections if long)',
          shapes: [
            rect(0, 0, c3Length(p), p.barH),
            text(c3Length(p) / 2, p.barH / 2, `${mm(c3Length(p), 0)} overall`, 4),
          ],
          instruction: 'Check there is room to swing it with the door.',
        },
      ],
    };
  },
  ghost(p) {
    return {
      objects: [
        // The bar's root reaches 6 mm into the clip, so the lever stops just short of it.
        { kind: 'doorLever', size: { d: p.leverD, length: 120 }, position: [p.clipW - 6.5 - 120, 0, 0] },
        {
          kind: 'hand',
          size: { breadth: 0, grip: barGripD(p.barW, p.barH, Math.min(5, p.barH / 3)) },
          // Overhand grip round the bar near its end (palm on top, wrist away from the door), clear of
          // the hook and of the clip's fillet; on a short bar the hand may run past the plain tip.
          position: [
            Math.max(p.clipW + 55, p.clipW + p.extension - 46 - (p.hook ? p.barH * 0.42 + 16 : 0)),
            0,
            0,
          ],
          hand: 'right',
          pose: 'grip',
          rotation: [0, 90, 0],
        },
      ],
    };
  },
  animation() {
    return {
      steps: [
        {
          caption: 'Line the clip up with the end of the door lever.',
          hand: 0,
          part: { translate: [0, 0, 40] },
        },
        { caption: 'Press it down until it snaps on.', hand: 0, part: {} },
        {
          caption: 'Push the end down to open the door.',
          part: { rotate: { axis: [0, 1, 0], pivot: [-120, 0, 0], deg: 25 } },
          // The door lever turns with the bar, pushed down by the hand.
          ghosts: [0, 1],
        },
      ],
    };
  },
  orientation() {
    return {
      candidates: [
        {
          id: 'side',
          label: 'On its side',
          rotation: [90, 0, 0],
          buildDir: [0, 1, 0],
          supports: 'minimal',
          note: 'Both the bar and the clip ring bend along the layers. A few supports inside the clip.',
        },
        {
          id: 'flat',
          label: 'Lying flat',
          rotation: [0, 0, 0],
          buildDir: [0, 0, 1],
          supports: 'minimal',
          note: 'The clip ring bends across layers at its top and bottom.',
        },
      ],
    };
  },
  measureGuide: [MEASURE.leverDiameter, MEASURE.reachDistance],
  invalidExample: { leverD: 12, wall: 3, barH: 24 },
  repair(p, keep) {
    const q = { ...p };
    if (q.barH > c3ClipOD(q)) {
      if (keep === 'barH') q.wall = Math.min(6, Math.max(q.wall, (q.barH - q.leverD) / 2));
      if (q.barH > c3ClipOD(q) && keep !== 'leverD' && keep !== 'barH') q.barH = Math.floor(c3ClipOD(q));
      if (q.barH > c3ClipOD(q) && keep === 'barH') q.leverD = Math.min(30, q.barH - 2 * q.wall);
      if (q.barH > c3ClipOD(q)) q.barH = Math.floor(c3ClipOD(q));
    }
    if (q.hook && q.hookR < q.barH * 0.75) {
      if (keep === 'hookR') q.barH = Math.max(10, Math.floor(q.hookR / 0.75));
      else q.hookR = Math.min(40, Math.ceil(q.barH * 0.75));
    }
    return q;
  },
  rules,
  sectionAxis: 'x',
  splittable: true,
  splitPlan: (p) => {
    const at = c3SplitAt(p);
    return at === null ? null : { axis: 'x', at };
  },
  stamp: (p) => `C3-${Math.round(p.extension)}`,
  sizeTag: (p) => `${Math.round(p.extension)}mm`,
};
