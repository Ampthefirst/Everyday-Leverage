import type { Family, FieldDef, ValidationIssue } from './types';
import { buildSchema, defaultsOf } from './schema';
import { MEASURE, MIN_WALL, ceilTo, cylinderNet, err, info, mm, warn, UPRIGHT } from './common';
import { circle, dia, dim, line, rect, text, roundRect, type Shape } from '../outputs/svg/ir';
import { a1LoadCases, a1Sections } from '../strength/families/a1';

export type A1P = {
  shaftShape: 'round' | 'rect' | 'oval';
  shaftW: number;
  shaftH: number;
  gripShape: 'round' | 'oval' | 'rrect';
  gripOD: number;
  length: number;
  clearance: number;
  attach: 'slip' | 'clamp';
  ribs: number;
  grooves: number;
  grooveDepth: number;
  thumbRest: boolean;
  texture: boolean;
  hand: 'right' | 'left';
  closedEnd: boolean;
};

/** Largest dimension of the shaft as seen by a round bore (diagonal for rectangles). */
export function a1ShaftSpan(p: A1P): number {
  if (p.shaftShape === 'round') return p.shaftW;
  if (p.shaftShape === 'rect') return Math.hypot(p.shaftW, p.shaftH);
  return Math.max(p.shaftW, p.shaftH);
}

/** Smallest outer dimension (oval/rounded grips are 82% as deep as they are wide). */
export const a1MinOuter = (p: A1P) => (p.gripShape === 'round' ? p.gripOD : p.gripOD * 0.82);
export const a1GrooveDepth = (p: A1P) => (p.grooves > 0 ? p.grooveDepth : 0);
/** Wall left under the deepest groove. */
export const a1MinWall = (p: A1P) => a1MinOuter(p) / 2 - a1ShaftSpan(p) / 2 - p.clearance - a1GrooveDepth(p);
export const a1MinOD = (p: A1P) => {
  const need = a1ShaftSpan(p) + 2 * (p.clearance + MIN_WALL + a1GrooveDepth(p));
  return ceilTo(p.gripShape === 'round' ? need : need / 0.82, 1);
};

const notRound = (p: A1P) => p.shaftShape !== 'round';

const fields: FieldDef<A1P>[] = [
  {
    key: 'shaftShape',
    kind: 'choice',
    label: 'Handle shape',
    group: 'fit',
    default: 'round',
    options: [
      { value: 'round', label: 'Round' },
      { value: 'rect', label: 'Flat' },
      { value: 'oval', label: 'Oval' },
    ],
    measure: 'shaftCaliper',
  },
  {
    key: 'shaftW',
    kind: 'number',
    label: 'Handle width',
    unit: 'mm',
    min: 3,
    max: 25,
    step: 0.5,
    default: 9,
    group: 'fit',
    measure: 'shaftCaliper',
    help: 'Across the handle where you hold it (the diameter for a round handle).',
  },
  {
    key: 'shaftH',
    kind: 'number',
    label: 'Handle thickness',
    unit: 'mm',
    min: 2,
    max: 25,
    step: 0.5,
    default: 4,
    group: 'fit',
    measure: 'shaftCaliper',
    showIf: notRound,
  },
  {
    key: 'gripOD',
    kind: 'number',
    label: 'Grip size',
    unit: 'mm',
    min: 20,
    max: 50,
    step: 1,
    default: 32,
    group: 'fit',
    measure: 'handBreadth',
    help: 'Thicker is easier to hold for a weak grip. Most people like 30–40 mm.',
    range: (p) => [Math.min(50, Math.max(20, a1MinOD(p))), 50],
  },
  {
    key: 'length',
    kind: 'number',
    label: 'Grip length',
    unit: 'mm',
    min: 60,
    max: 160,
    step: 5,
    default: 110,
    group: 'fit',
    help: 'At least your palm width plus a little.',
  },
  {
    key: 'gripShape',
    kind: 'choice',
    label: 'Grip outline',
    group: 'style',
    default: 'round',
    options: [
      { value: 'round', label: 'Round' },
      { value: 'oval', label: 'Oval', hint: 'Resists rolling in the hand' },
      { value: 'rrect', label: 'Rounded square', hint: 'Easiest to orient by feel' },
    ],
  },
  {
    key: 'grooves',
    kind: 'number',
    label: 'Finger grooves',
    min: 0,
    max: 4,
    step: 1,
    default: 3,
    group: 'style',
  },
  {
    key: 'grooveDepth',
    kind: 'number',
    label: 'Groove depth',
    unit: 'mm',
    min: 0.5,
    max: 4,
    step: 0.5,
    default: 1.5,
    group: 'style',
    showIf: (p) => p.grooves > 0,
  },
  { key: 'thumbRest', kind: 'bool', label: 'Thumb rest', default: true, group: 'style' },
  {
    key: 'texture',
    kind: 'bool',
    label: 'Grip texture',
    default: false,
    group: 'style',
    help: 'Raised ridges below the fingers.',
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
    key: 'attach',
    kind: 'choice',
    label: 'How it holds on',
    group: 'style',
    default: 'slip',
    options: [
      { value: 'slip', label: 'Slide on', hint: 'Crush ribs grip the handle' },
      { value: 'clamp', label: 'Clamp', hint: 'Split sleeve with an M3 screw — holds tighter' },
    ],
  },
  {
    key: 'ribs',
    kind: 'number',
    label: 'Crush ribs',
    min: 3,
    max: 6,
    step: 1,
    default: 4,
    group: 'fine',
    showIf: (p) => p.attach === 'slip',
  },
  {
    key: 'clearance',
    kind: 'number',
    label: 'Fit clearance',
    unit: 'mm',
    min: 0.15,
    max: 0.5,
    step: 0.05,
    default: 0.3,
    group: 'fine',
    help: 'Gap around the handle. Smaller is tighter.',
  },
  {
    key: 'closedEnd',
    kind: 'bool',
    label: 'Closed end',
    default: false,
    group: 'fine',
    help: 'Blind pocket: the handle end sits inside the grip.',
  },
];

function constraints(p: A1P): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  if (a1MinWall(p) < MIN_WALL - 1e-6) {
    out.push(
      err(
        `The grip is too thin around this handle (wall ${mm(Math.max(0, a1MinWall(p)))}).`,
        `Increase grip size to at least ${a1MinOD(p)} mm, or use shallower grooves.`,
        'gripOD',
      ),
    );
  }
  if (p.attach === 'clamp' && p.length < 70)
    out.push(
      err('A clamp needs a grip at least 70 mm long.', 'Increase grip length to at least 70 mm.', 'length'),
    );
  return out;
}

function rules(p: A1P): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  const wall = a1MinWall(p);
  if (wall >= MIN_WALL && wall < 3)
    out.push(
      warn(
        `Wall under the grooves is only ${mm(wall)}.`,
        `For a sturdier grip, use ${a1MinOD(p) + 2} mm or more.`,
        'gripOD',
      ),
    );
  if (p.grooves * 22 > p.length * 0.7)
    out.push(warn('The finger grooves crowd the grip.', 'Use fewer grooves or a longer grip.', 'grooves'));
  if (p.shaftShape !== 'round' && p.attach === 'clamp')
    out.push(info('Flat and oval handles cannot spin in the grip, so a slide-on fit is usually enough.'));
  return out;
}

function drawing(p: A1P) {
  const L = p.length;
  const D = p.gripOD;
  const Dd = p.gripShape === 'round' ? D : D * 0.82;
  const span = a1ShaftSpan(p) + 2 * p.clearance;
  const front: Shape[] = [rect(-D / 2, 0, D, L)];
  // grooves as notches on the outline
  const zs = a1GrooveZ(p);
  for (const z of zs) {
    front.push(
      line([-D / 2, z], [-D / 2 + a1GrooveDepth(p), z], 'thin'),
      line([D / 2, z], [D / 2 - a1GrooveDepth(p), z], 'thin'),
    );
  }
  front.push(
    line([-span / 2, p.closedEnd ? 4 : 0], [-span / 2, L], 'hidden'),
    line([span / 2, p.closedEnd ? 4 : 0], [span / 2, L], 'hidden'),
  );
  front.push(line([0, -5], [0, L + 5], 'center'));
  front.push(
    dim([D / 2, 0], [D / 2, L], -10, `${mm(L, 0)}`),
    dim([-D / 2, L], [D / 2, L], -8, `${mm(D, 0)}`),
  );
  const top: Shape[] = [
    p.gripShape === 'round'
      ? circle(0, 0, D / 2)
      : roundRect(0, 0, D, Dd, p.gripShape === 'oval' ? Dd / 2 : Dd / 4),
    ...pocketShapes(p, 0, 0),
    dia(0, 0, D / 2, `Ø${mm(D, 0)}`),
  ];
  const section: Shape[] = [
    p.gripShape === 'round'
      ? circle(0, 0, D / 2, 'outline', 'hatch')
      : roundRect(0, 0, D, Dd, p.gripShape === 'oval' ? Dd / 2 : Dd / 4, 'outline', 'hatch'),
    ...pocketShapes(p, 0, 0).map((s) => ({ ...s, fill: 'solid' as const })),
  ];
  return {
    views: [
      { name: 'Front', shapes: front },
      { name: 'Top', shapes: top },
      { name: 'Section A–A', shapes: section, caption: 'Cut across the grip' },
    ],
    keyDims: [
      { label: 'Grip length', value: mm(L, 0), tol: '±0.5' },
      { label: 'Grip size', value: mm(D, 0), tol: '±0.3' },
      {
        label: 'Handle pocket',
        value:
          p.shaftShape === 'round'
            ? `Ø${mm(p.shaftW + 2 * p.clearance, 2)}`
            : `${mm(p.shaftW + 2 * p.clearance, 2)} × ${mm(p.shaftH + 2 * p.clearance, 2)}`,
        tol: '+0.2 / −0',
      },
      { label: 'Wall under grooves', value: mm(a1MinWall(p)), tol: 'min' },
    ],
    notes: [
      p.attach === 'clamp'
        ? 'Clamp: M3 × 16 screw and M3 nut.'
        : `${p.ribs} crush ribs, 0.3 mm interference.`,
    ],
  };
}

function pocketShapes(p: A1P, cx: number, cy: number): Shape[] {
  const c = p.clearance;
  if (p.shaftShape === 'round') return [circle(cx, cy, p.shaftW / 2 + c)];
  if (p.shaftShape === 'rect') return [roundRect(cx, cy, p.shaftW + 2 * c, p.shaftH + 2 * c, 0.5)];
  return [roundRect(cx, cy, p.shaftW + 2 * c, p.shaftH + 2 * c, Math.min(p.shaftW, p.shaftH) / 2 + c)];
}

export function a1GrooveZ(p: A1P): number[] {
  if (p.grooves <= 0) return [];
  const pitch = 22;
  const top = p.length - 18;
  return Array.from({ length: p.grooves }, (_, i) => top - i * pitch).filter((z) => z > 10);
}

export const A1: Family<A1P> = {
  id: 'A1',
  group: 'A',
  name: 'Build-up grip',
  blurb:
    'A thick sleeve that slides over a thin handle — spoons, forks, pens, toothbrushes — so it is easier to hold.',
  leverage:
    'A thicker handle spreads your grip over more of your hand, so each finger needs less force to hold and steer it.',
  fields,
  schema: buildSchema(fields, constraints),
  defaults: defaultsOf(fields),
  presets: [
    {
      id: 'spoon',
      label: 'Spoon or fork',
      description: 'Round metal handle about 9 mm across.',
      params: { shaftShape: 'round', shaftW: 9, gripOD: 32, length: 110 },
    },
    {
      id: 'flat-cutlery',
      label: 'Flat cutlery handle',
      description: 'Flat handle about 12 × 3 mm.',
      params: { shaftShape: 'rect', shaftW: 12, shaftH: 3, gripOD: 34, length: 110 },
    },
    {
      id: 'pen',
      label: 'Pen or pencil',
      description: 'Slim round pen about 8 mm across.',
      params: { shaftShape: 'round', shaftW: 8, gripOD: 28, length: 80, grooves: 2 },
    },
    {
      id: 'toothbrush',
      label: 'Toothbrush',
      description: 'Oval handle about 12 × 7 mm.',
      params: { shaftShape: 'oval', shaftW: 12, shaftH: 7, gripOD: 32, length: 100 },
    },
    {
      id: 'big',
      label: 'Extra-thick grip',
      description: 'For a very weak grip: 44 mm across.',
      params: { gripOD: 44, grooves: 0, texture: true },
    },
  ],
  variants: [
    {
      id: 'grooved',
      label: 'Finger grooves',
      description: 'Three shallow finger grooves and a thumb rest.',
      patch: { grooves: 3, grooveDepth: 1.5, thumbRest: true, texture: false },
    },
    {
      id: 'smooth',
      label: 'Smooth',
      description: 'No grooves — fits any hand position.',
      patch: { grooves: 0, thumbRest: false, texture: false },
    },
    {
      id: 'textured',
      label: 'Textured',
      description: 'Ridges for wet hands.',
      patch: { grooves: 0, thumbRest: true, texture: true },
    },
    {
      id: 'clamp',
      label: 'Clamp-on',
      description: 'Split sleeve with a screw for a firm hold.',
      patch: { attach: 'clamp' },
    },
  ],
  loadCases: a1LoadCases,
  criticalSections: a1Sections,
  drawing,
  template(p) {
    const D = p.gripOD;
    const Dd = p.gripShape === 'round' ? D : D * 0.82;
    const outline: Shape =
      p.gripShape === 'round'
        ? circle(0, 0, D / 2)
        : roundRect(0, 0, D, Dd, p.gripShape === 'oval' ? Dd / 2 : Dd / 4);
    return {
      items: [
        {
          title: 'Grip cross-section (1:1)',
          shapes: [outline, ...pocketShapes(p, 0, 0), text(0, -D / 2 - 6, `grip ${mm(D, 0)}`, 3.5)],
          instruction:
            'Stand the handle end on the inner shape — it should just fit inside. Pinch the outer shape between your fingers to feel the grip size.',
        },
        {
          title: 'Grip length (1:1)',
          shapes: [rect(0, 0, p.length, Dd), text(p.length / 2, Dd / 2, `${mm(p.length, 0)} long`, 4)],
          instruction: 'Lay your hand on this strip: it should be a little longer than your palm is wide.',
        },
      ],
    };
  },
  net(p) {
    return {
      title: 'Grip size mock-up',
      shapes: cylinderNet(p.gripOD, p.length),
      instruction:
        'Size mock-up — not a functional part. Cut out, roll into a tube and tape it to feel the grip size.',
    };
  },
  ghost(p) {
    const objects: ReturnType<Family<A1P>['ghost']>['objects'] = [
      {
        kind: p.length < 90 ? 'pen' : 'utensil',
        size: { w: p.shaftW, h: p.shaftShape === 'round' ? p.shaftW : p.shaftH, length: p.length + 70 },
        position: [0, 0, -20],
      },
      {
        kind: 'hand',
        size: { breadth: 0, grip: p.gripOD },
        position: [0, 0, p.length * 0.55],
        hand: p.hand,
        pose: 'grip',
        rotation: [0, 0, 0],
      },
    ];
    return { objects };
  },
  animation(p) {
    return {
      steps: [
        { caption: 'Slide the grip onto the handle.', part: { translate: [0, 0, p.length + 30] } },
        { caption: 'Push it all the way on.', part: {} },
        {
          caption: 'Hold it like a normal handle — less squeezing needed.',
          part: { rotate: { axis: [1, 0, 0], pivot: [0, 0, 0], deg: 25 } },
          ghosts: [0, 1],
        },
      ],
    };
  },
  orientation() {
    return {
      candidates: [
        {
          ...UPRIGHT,
          note: 'Stands on its end. Rings of layers wrap around the handle, so squeezing loads run along the layers.',
        },
        {
          id: 'lying',
          label: 'Lying on its side',
          rotation: [90, 0, 0],
          buildDir: [0, 1, 0],
          supports: 'minimal',
          note: 'The handle pocket bridges across layers; small supports may be needed inside it.',
        },
      ],
    };
  },
  measureGuide: [MEASURE.shaftCaliper, MEASURE.shaftWrap, MEASURE.handBreadth],
  invalidExample: { shaftW: 25, gripOD: 20 },
  repair(p, keep) {
    const q = { ...p };
    if (a1MinWall(q) < MIN_WALL) {
      if (keep !== 'gripOD' && a1MinOD(q) <= 50) q.gripOD = Math.max(q.gripOD, a1MinOD(q));
      else if (keep !== 'grooveDepth' && q.grooves > 0) q.grooves = 0;
      if (a1MinWall(q) < MIN_WALL && keep !== 'shaftW')
        q.shaftW = Math.max(3, q.shaftW - (MIN_WALL - a1MinWall(q)) * 2);
      if (a1MinWall(q) < MIN_WALL && keep !== 'shaftH' && q.shaftShape !== 'round')
        q.shaftH = Math.max(2, q.shaftH - (MIN_WALL - a1MinWall(q)) * 2);
    }
    if (q.attach === 'clamp' && q.length < 70) {
      if (keep === 'length') q.attach = 'slip';
      else q.length = 70;
    }
    return q;
  },
  rules,
  sectionAxis: 'z',
  stamp: (p) => `A1-${Math.round(p.gripOD)}`,
  sizeTag: (p) => `${Math.round(p.gripOD)}mm`,
};
