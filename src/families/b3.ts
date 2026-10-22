import type { Family, FieldDef, ValidationIssue } from './types';
import { buildSchema, defaultsOf } from './schema';
import { MEASURE, err, info, mm, warn, FLAT } from './common';
import { circle, dia, dim, rect, roundRect, starPts, text, type Shape } from '../outputs/svg/ir';
import { b3LoadCases, b3Sections } from '../strength/families/b3';
import type { Profile2D } from '../geometry/primitives/profiles';
import { profileExtent } from '../geometry/primitives/profiles';
import { maxPartLength } from '../print/bedfit';

export type B3P = {
  profile: 'star' | 'cross' | 'D' | 'round';
  targetD: number;
  points: number;
  innerRatio: number;
  crossArm: number;
  dFlat: number;
  depth: number;
  lever: number;
  hands: 'one' | 'two';
  leverW: number;
  leverH: number;
  wall: number;
  clearance: number;
  fillet: number;
};

export function b3Profile(p: B3P): Profile2D {
  switch (p.profile) {
    case 'star':
      return { shape: 'star', n: p.points, outer: p.targetD, inner: p.targetD * p.innerRatio };
    case 'cross':
      return { shape: 'cross', span: p.targetD, arm: p.crossArm };
    case 'D':
      return { shape: 'D', d: p.targetD, flat: p.dFlat };
    case 'round':
      return { shape: 'round', d: p.targetD };
  }
}
export const b3BossD = (p: B3P) => Math.max(...profileExtent(b3Profile(p))) + 2 * p.clearance + 2 * p.wall;
export const b3Height = (p: B3P) => p.depth + 3;
export const b3Overall = (p: B3P) => b3BossD(p) + (p.hands === 'two' ? 2 : 1) * (p.lever + 0.2875 * p.leverW);
const b3MaxOverall = (p: B3P) => maxPartLength(b3BossD(p) + 2);

const fields: FieldDef<B3P>[] = [
  {
    key: 'profile',
    kind: 'choice',
    label: 'Shape of the top',
    group: 'fit',
    default: 'star',
    options: [
      { value: 'star', label: 'Star / fluted', hint: 'Bottle caps, fluted taps' },
      { value: 'cross', label: 'Cross', hint: 'Cross-head taps' },
      { value: 'D', label: 'D-shape', hint: 'Stove and oven knobs' },
      { value: 'round', label: 'Round', hint: 'Round caps with ridges' },
    ],
    measure: 'capProfile',
  },
  {
    key: 'targetD',
    kind: 'number',
    label: 'Size across',
    unit: 'mm',
    min: 15,
    max: 80,
    step: 0.5,
    default: 35,
    group: 'fit',
    measure: 'capProfile',
  },
  {
    key: 'points',
    kind: 'number',
    label: 'Number of points',
    min: 3,
    max: 8,
    step: 1,
    default: 5,
    group: 'fit',
    showIf: (p) => p.profile === 'star',
  },
  {
    key: 'innerRatio',
    kind: 'number',
    label: 'Point depth (inner/outer)',
    min: 0.5,
    max: 0.9,
    step: 0.05,
    default: 0.7,
    group: 'fine',
    showIf: (p) => p.profile === 'star',
  },
  {
    key: 'crossArm',
    kind: 'number',
    label: 'Cross arm width',
    unit: 'mm',
    min: 4,
    max: 15,
    step: 0.5,
    default: 8,
    group: 'fit',
    showIf: (p) => p.profile === 'cross',
  },
  {
    key: 'dFlat',
    kind: 'number',
    label: 'Flat depth',
    unit: 'mm',
    min: 1,
    max: 10,
    step: 0.5,
    default: 4,
    group: 'fit',
    showIf: (p) => p.profile === 'D',
    help: 'How far the flat side is cut in from the round.',
  },
  {
    key: 'depth',
    kind: 'number',
    label: 'How far it goes on',
    unit: 'mm',
    min: 6,
    max: 30,
    step: 1,
    default: 14,
    group: 'fit',
  },
  {
    key: 'lever',
    kind: 'number',
    label: 'Lever length',
    unit: 'mm',
    min: 40,
    max: 150,
    step: 5,
    default: 90,
    group: 'fit',
  },
  {
    key: 'hands',
    kind: 'choice',
    label: 'Levers',
    group: 'style',
    default: 'one',
    options: [
      { value: 'one', label: 'One lever' },
      { value: 'two', label: 'Two levers' },
    ],
  },
  {
    key: 'leverW',
    kind: 'number',
    label: 'Lever width',
    unit: 'mm',
    min: 16,
    max: 30,
    step: 1,
    default: 22,
    group: 'fine',
  },
  {
    key: 'leverH',
    kind: 'number',
    label: 'Lever thickness',
    unit: 'mm',
    min: 8,
    max: 18,
    step: 1,
    default: 12,
    group: 'fine',
  },
  {
    key: 'wall',
    kind: 'number',
    label: 'Socket wall',
    unit: 'mm',
    min: 2.5,
    max: 6,
    step: 0.5,
    default: 3.5,
    group: 'fine',
  },
  {
    key: 'clearance',
    kind: 'number',
    label: 'Socket clearance',
    unit: 'mm',
    min: 0.3,
    max: 1,
    step: 0.05,
    default: 0.5,
    group: 'fine',
  },
  {
    key: 'fillet',
    kind: 'number',
    label: 'Fillet at the lever root',
    unit: 'mm',
    min: 1,
    max: 6,
    step: 0.5,
    default: 3,
    group: 'fine',
  },
];

function constraints(p: B3P): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  if (p.profile === 'cross' && p.crossArm > p.targetD / 2)
    out.push(
      err(
        'The cross arms are too wide for its size.',
        `Use arms of ${Math.floor(p.targetD / 2)} mm or less.`,
        'crossArm',
      ),
    );
  if (p.profile === 'D' && p.dFlat > p.targetD * 0.35)
    out.push(
      err(
        'The flat is too deep for this knob.',
        `Use a flat of ${Math.floor(p.targetD * 0.35 * 2) / 2} mm or less.`,
        'dFlat',
      ),
    );
  if (b3Overall(p) > b3MaxOverall(p))
    out.push(
      err(
        `At ${mm(b3Overall(p), 0)} long it will not fit the printer bed.`,
        'Use a shorter lever or one lever.',
        'lever',
      ),
    );
  return out;
}

function rules(p: B3P): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  if (p.fillet < 2)
    out.push(
      warn(
        'A small fillet at the lever root concentrates stress.',
        'Use a fillet of 2 mm or more.',
        'fillet',
      ),
    );
  out.push(
    info('Caps and taps get turned many times: the strength check uses a reduced (fatigue) allowable.'),
  );
  if (p.profile === 'round')
    out.push(
      info('A round socket grips by friction only — add a rubber band or use the star shape if it slips.'),
    );
  return out;
}

function profileShapes(p: B3P, grow: number): Shape[] {
  const d = p.targetD + 2 * grow;
  switch (p.profile) {
    case 'star':
      return [
        {
          kind: 'poly',
          pts: starPts(p.points, d / 2, (p.targetD * p.innerRatio) / 2 + grow),
          closed: true,
          style: 'outline',
        },
      ];
    case 'cross':
      return [
        rect(-d / 2, -p.crossArm / 2 - grow, d, p.crossArm + 2 * grow),
        rect(-p.crossArm / 2 - grow, -d / 2, p.crossArm + 2 * grow, d),
      ];
    case 'D': {
      // Circle with a flat on +Y: arc the long way round from one end of the flat to the other.
      const r = d / 2;
      const yFlat = r - p.dFlat;
      const a0 = Math.asin(Math.max(-1, Math.min(1, yFlat / r)));
      const pts: [number, number][] = [];
      const from = Math.PI - a0;
      const to = 2 * Math.PI + a0;
      for (let i = 0; i <= 48; i++) {
        const a = from + ((to - from) * i) / 48;
        pts.push([r * Math.cos(a), r * Math.sin(a)]);
      }
      return [{ kind: 'poly', pts, closed: true, style: 'outline' }];
    }
    case 'round':
      return [circle(0, 0, d / 2)];
  }
}

function drawing(p: B3P) {
  const B = b3BossD(p);
  const H = b3Height(p);
  const top: Shape[] = [
    circle(0, 0, B / 2),
    ...profileShapes(p, p.clearance),
    roundRect(B / 2 + p.lever / 2, 0, p.lever, p.leverW, 4),
    dia(0, 0, B / 2, `Ø${mm(B, 0)}`),
  ];
  if (p.hands === 'two') top.push(roundRect(-B / 2 - p.lever / 2, 0, p.lever, p.leverW, 4));
  const front: Shape[] = [
    rect(-B / 2, 0, B, H),
    rect(B / 2, 0, p.lever, p.leverH),
    dim([-B / 2, 0], [-B / 2, H], 10, mm(H, 0)),
    dim([B / 2, p.leverH], [B / 2 + p.lever, p.leverH], -8, mm(p.lever, 0)),
  ];
  return {
    views: [
      { name: 'Top', shapes: top },
      { name: 'Front', shapes: front },
      {
        name: 'Section A–A',
        caption: 'Through the lever',
        shapes: [
          rect(0, 0, p.leverW, p.leverH, 'outline', 'hatch'),
          dim([0, p.leverH], [p.leverW, p.leverH], -5, mm(p.leverW, 0)),
          dim([p.leverW, 0], [p.leverW, p.leverH], -6, mm(p.leverH, 0)),
        ],
      },
    ],
    keyDims: [
      { label: 'Socket size', value: `${mm(p.targetD + 2 * p.clearance, 1)} across`, tol: '±0.3' },
      { label: 'Socket depth', value: mm(p.depth, 0), tol: '±0.5' },
      { label: 'Lever', value: `${mm(p.lever, 0)} × ${mm(p.leverW, 0)} × ${mm(p.leverH, 0)}`, tol: '±0.5' },
      { label: 'Root fillet', value: mm(p.fillet), tol: 'min' },
    ],
    notes: ['Socket opening faces down onto the cap or tap.'],
  };
}

export const B3: Family<B3P> = {
  id: 'B3',
  group: 'B',
  name: 'Cap and tap turner',
  blurb: 'A shaped socket with a lever that fits over bottle caps, cross-head taps and stove knobs.',
  leverage:
    'The socket holds the shape so your fingers do not have to pinch, and the lever multiplies your twist.',
  fields,
  schema: buildSchema(fields, constraints),
  defaults: defaultsOf(fields),
  presets: [
    {
      id: 'bottle',
      label: 'Bottle cap',
      description: 'Fluted soft-drink cap, 30 mm.',
      params: { profile: 'star', targetD: 30, points: 8, innerRatio: 0.85, depth: 10, lever: 70 },
    },
    {
      id: 'tap',
      label: 'Cross-head tap',
      description: 'Four-arm tap about 50 mm across.',
      params: { profile: 'cross', targetD: 50, crossArm: 10, depth: 16, lever: 100 },
    },
    {
      id: 'stove',
      label: 'Stove knob',
      description: 'D-shaped knob 38 mm across.',
      params: { profile: 'D', targetD: 38, dFlat: 5, depth: 18, lever: 80 },
    },
    {
      id: 'star-tap',
      label: 'Star tap',
      description: 'Five-point tap 45 mm across.',
      params: { profile: 'star', targetD: 45, points: 5, innerRatio: 0.65, depth: 16, lever: 100 },
    },
  ],
  variants: [
    {
      id: 'star',
      label: 'Star socket',
      description: 'Fluted caps and star taps.',
      patch: { profile: 'star' },
    },
    { id: 'cross', label: 'Cross socket', description: 'Cross-head taps.', patch: { profile: 'cross' } },
    { id: 'D', label: 'D socket', description: 'Stove and oven knobs.', patch: { profile: 'D' } },
  ],
  loadCases: b3LoadCases,
  criticalSections: b3Sections,
  drawing,
  template(p) {
    return {
      items: [
        {
          title: 'Socket shape (1:1)',
          shapes: [
            ...profileShapes(p, p.clearance),
            text(0, -p.targetD / 2 - 8, 'the cap or tap should fit inside', 3.5),
          ],
          instruction: 'Hold the sheet against the cap or tap: its top should fit just inside this outline.',
        },
      ],
    };
  },
  ghost(p) {
    const H = b3Height(p);
    const B = b3BossD(p);
    const kind =
      p.profile === 'cross'
        ? 'faucetCross'
        : p.profile === 'D'
          ? 'stoveKnob'
          : p.targetD < 40
            ? 'bottle'
            : 'knob';
    const size =
      kind === 'bottle'
        ? { cap: p.targetD, height: 120 }
        : kind === 'faucetCross'
          ? { span: p.targetD, h: p.depth }
          : { d: p.targetD, h: p.depth + 4 };
    // The object is flipped (top down) so its top sits 1 mm inside the bottom of the socket.
    const objH = kind === 'bottle' ? 120 + 14 : kind === 'faucetCross' ? p.depth : p.depth + 4;
    const z = H - p.depth + 1 + objH;
    return {
      objects: [
        { kind, size, position: [0, 0, z], rotation: [180, 0, 0] },
        {
          kind: 'hand',
          size: { breadth: 0, grip: p.leverW },
          position: [B / 2 + p.lever * 0.6, 0, p.leverH / 2],
          hand: 'right',
          pose: 'grip',
          rotation: [0, 90, 180],
        },
      ],
    };
  },
  animation() {
    return {
      steps: [
        { caption: 'Line up the socket with the cap or tap.', hand: 0, part: { translate: [0, 0, -30] } },
        { caption: 'Push it on.', hand: 0, part: {} },
        {
          caption: 'Push the lever to turn.',
          part: { rotate: { axis: [0, 0, 1], pivot: [0, 0, 0], deg: 45 } },
        },
      ],
    };
  },
  orientation() {
    return {
      candidates: [
        {
          ...FLAT,
          label: 'Socket opening up',
          note: 'Flat bottom, no supports; the lever bends along the layers.',
        },
        {
          id: 'side',
          label: 'On its side',
          rotation: [90, 0, 0],
          buildDir: [0, 1, 0],
          supports: 'needed',
          note: 'Needs supports and is weaker at the lever root.',
        },
      ],
    };
  },
  measureGuide: [MEASURE.capProfile, MEASURE.knobDiameter],
  invalidExample: { profile: 'cross', targetD: 20, crossArm: 15 },
  repair(p, keep) {
    const q = { ...p };
    if (q.profile === 'cross' && q.crossArm > q.targetD / 2) {
      if (keep === 'crossArm') q.targetD = Math.min(80, q.crossArm * 2);
      if (q.crossArm > q.targetD / 2) q.crossArm = Math.max(4, Math.floor(q.targetD)) / 2;
    }
    if (q.profile === 'D' && q.dFlat > q.targetD * 0.35) {
      if (keep === 'dFlat') q.targetD = Math.min(80, Math.ceil(q.dFlat / 0.35));
      if (q.dFlat > q.targetD * 0.35) q.dFlat = Math.max(1, Math.floor(q.targetD * 0.35 * 2) / 2);
    }
    if (b3Overall(q) > b3MaxOverall(q)) {
      if (keep !== 'hands') q.hands = 'one';
      while (b3Overall(q) > b3MaxOverall(q) && q.lever > 40 && keep !== 'lever') q.lever -= 5;
    }
    return q;
  },
  rules,
  sectionAxis: 'z',
  displayRotation: [180, 0, 0],
  stamp: (p) => `B3-${Math.round(p.targetD)}`,
  sizeTag: (p) => `${p.profile}-${Math.round(p.targetD)}mm`,
};
