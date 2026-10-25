import type { Family, FieldDef, ValidationIssue } from './types';
import { buildSchema, defaultsOf } from './schema';
import { MEASURE, boxNet, cylinderNet, err, info, mm, warn } from './common';
import {
  circle,
  dia,
  dim,
  line,
  rect,
  roundRect,
  text,
  translateShapes,
  polygonPts,
  type Shape,
} from '../outputs/svg/ir';
import { a3LoadCases, a3Sections } from '../strength/families/a3';
import type { Profile2D } from '../geometry/primitives/profiles';

export type A3P = {
  shankShape: 'hex' | 'round' | 'flat';
  shankSize: number;
  shankT: number;
  depth: number;
  gripD: number;
  length: number;
  angle: number;
  style: 'T' | 'pistol' | 'mushroom';
  retention: 'setscrew' | 'none';
  clearance: number;
};

export const A3_WALL = 4;
export function a3Profile(p: A3P): Profile2D {
  if (p.shankShape === 'hex') return { shape: 'hex', af: p.shankSize };
  if (p.shankShape === 'round')
    return { shape: 'D', d: p.shankSize, flat: Math.max(0.5, p.shankSize * 0.12) };
  return { shape: 'slot', w: p.shankSize, t: p.shankT };
}
/** Widest extent of the shank (hex across corners). */
export function a3ShankSpan(p: A3P): number {
  if (p.shankShape === 'hex') return (2 * p.shankSize) / Math.sqrt(3);
  if (p.shankShape === 'round') return p.shankSize;
  return Math.hypot(p.shankSize, p.shankT);
}
export const a3BossD = (p: A3P) => Math.max(16, Math.ceil(a3ShankSpan(p) + 2 * p.clearance + 2 * A3_WALL));
export const a3BossH = (p: A3P) => p.depth + 6;

const fields: FieldDef<A3P>[] = [
  {
    key: 'shankShape',
    kind: 'choice',
    label: 'Shank shape',
    group: 'fit',
    default: 'hex',
    options: [
      { value: 'hex', label: 'Hex', hint: 'Screwdriver bits, hex keys' },
      { value: 'round', label: 'Round', hint: 'Round shank with a flat' },
      { value: 'flat', label: 'Flat', hint: 'Flat tang or blade' },
    ],
    measure: 'toolShank',
  },
  {
    key: 'shankSize',
    kind: 'number',
    label: 'Shank size',
    unit: 'mm',
    min: 3,
    max: 14,
    step: 0.05,
    default: 6.35,
    group: 'fit',
    measure: 'toolShank',
    help: 'Across the flats for hex (1/4" bits are 6.35 mm), the diameter for round, the width for flat.',
  },
  {
    key: 'shankT',
    kind: 'number',
    label: 'Tang thickness',
    unit: 'mm',
    min: 1,
    max: 6,
    step: 0.1,
    default: 2,
    group: 'fit',
    showIf: (p) => p.shankShape === 'flat',
  },
  {
    key: 'depth',
    kind: 'number',
    label: 'Socket depth',
    unit: 'mm',
    min: 10,
    max: 40,
    step: 1,
    default: 22,
    group: 'fit',
  },
  {
    key: 'gripD',
    kind: 'number',
    label: 'Grip size',
    unit: 'mm',
    min: 25,
    max: 45,
    step: 1,
    default: 32,
    group: 'fit',
    measure: 'handBreadth',
  },
  {
    key: 'length',
    kind: 'number',
    label: 'Handle length',
    unit: 'mm',
    min: 60,
    max: 140,
    step: 5,
    default: 100,
    group: 'fit',
    showIf: (p) => p.style !== 'mushroom',
  },
  {
    key: 'style',
    kind: 'choice',
    label: 'Handle style',
    group: 'style',
    default: 'T',
    options: [
      { value: 'T', label: 'T-handle', hint: 'Two hands or a strong twist' },
      { value: 'pistol', label: 'Pistol grip', hint: 'Wrist stays straight' },
      { value: 'mushroom', label: 'Mushroom knob', hint: 'Palm pushes and turns' },
    ],
  },
  {
    key: 'angle',
    kind: 'number',
    label: 'Grip angle',
    unit: '°',
    min: 60,
    max: 110,
    step: 5,
    default: 80,
    group: 'style',
    showIf: (p) => p.style === 'pistol',
  },
  {
    key: 'retention',
    kind: 'choice',
    label: 'Hold the tool in',
    group: 'style',
    default: 'setscrew',
    options: [
      { value: 'setscrew', label: 'M3 set screw', hint: 'Screw with a nut trap' },
      { value: 'none', label: 'Press fit only' },
    ],
  },
  {
    key: 'clearance',
    kind: 'number',
    label: 'Socket clearance',
    unit: 'mm',
    min: 0.1,
    max: 0.4,
    step: 0.05,
    default: 0.2,
    group: 'fine',
  },
];

function constraints(p: A3P): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  if (p.shankShape === 'flat' && p.shankT > p.shankSize - 1)
    out.push(
      err(
        'A flat tang must be thinner than it is wide.',
        `Set the thickness below ${p.shankSize - 1} mm.`,
        'shankT',
      ),
    );
  if (p.gripD < a3BossD(p) + 4 && p.style === 'mushroom')
    out.push(
      err(
        'The knob must be wider than the socket boss.',
        `Use a grip of at least ${a3BossD(p) + 4} mm.`,
        'gripD',
      ),
    );
  if (p.style !== 'mushroom' && p.gripD < a3BossD(p) - 2)
    out.push(
      err(
        'The grip is narrower than the socket boss.',
        `Use a grip of at least ${a3BossD(p) - 2} mm.`,
        'gripD',
      ),
    );
  return out;
}

function rules(p: A3P): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  if (p.depth < p.shankSize * 1.8)
    out.push(
      warn(
        'A shallow socket lets the tool wobble.',
        `Use a depth of at least ${Math.ceil(p.shankSize * 1.8)} mm.`,
        'depth',
      ),
    );
  if (p.retention === 'none')
    out.push(info('Without a set screw, the tool can pull out. Print the fit test to check the press fit.'));
  return out;
}

function socketShapes(p: A3P, cx: number, cy: number): Shape[] {
  const c = p.clearance;
  if (p.shankShape === 'hex')
    return [
      {
        kind: 'poly',
        pts: polygonPts(6, (p.shankSize / 2 + c) / Math.cos(Math.PI / 6), cx, cy),
        closed: true,
        style: 'outline',
      },
    ];
  if (p.shankShape === 'round') return [circle(cx, cy, p.shankSize / 2 + c)];
  return [roundRect(cx, cy, p.shankSize + 2 * c, p.shankT + 2 * c, 0.5)];
}

function drawing(p: A3P) {
  const B = a3BossD(p);
  const H = a3BossH(p);
  const front: Shape[] = [
    rect(-B / 2, 0, B, H),
    line([-a3ShankSpan(p) / 2, 0], [-a3ShankSpan(p) / 2, p.depth], 'hidden'),
    line([a3ShankSpan(p) / 2, 0], [a3ShankSpan(p) / 2, p.depth], 'hidden'),
  ];
  if (p.style === 'T')
    front.push(
      roundRect(0, H + p.gripD * 0.4, p.length, p.gripD * 0.8, p.gripD * 0.3),
      dim([-p.length / 2, H + p.gripD * 0.8], [p.length / 2, H + p.gripD * 0.8], -8, mm(p.length, 0)),
    );
  if (p.style === 'mushroom')
    front.push(
      roundRect(0, H + p.gripD * 0.3, p.gripD, p.gripD * 0.6, p.gripD * 0.3),
      dim([-p.gripD / 2, H + p.gripD * 0.6], [p.gripD / 2, H + p.gripD * 0.6], -8, mm(p.gripD, 0)),
    );
  if (p.style === 'pistol') front.push(text(0, H + 10, `grip ${mm(p.length, 0)} at ${p.angle}°`, 3.5));
  front.push(dim([B / 2, 0], [B / 2, H], -10, mm(H, 0)));
  const bottom: Shape[] = [circle(0, 0, B / 2), ...socketShapes(p, 0, 0), dia(0, 0, B / 2, `Ø${mm(B, 0)}`)];
  return {
    views: [
      { name: 'Front', shapes: front },
      { name: 'Socket end', shapes: bottom },
      {
        name: 'Section A–A',
        caption: 'Across the socket',
        shapes: [
          circle(0, 0, a3BossD(p) / 2, 'outline', 'hatch'),
          ...socketShapes(p, 0, 0).map((s) => ({ ...s, fill: 'solid' as const })),
        ],
      },
    ],
    keyDims: [
      {
        label: 'Socket',
        value:
          p.shankShape === 'hex'
            ? `${mm(p.shankSize + 2 * p.clearance, 2)} across flats`
            : p.shankShape === 'round'
              ? `Ø${mm(p.shankSize + 2 * p.clearance, 2)}`
              : `${mm(p.shankSize + 2 * p.clearance, 2)} × ${mm(p.shankT + 2 * p.clearance, 2)}`,
        tol: '+0.1/−0',
      },
      { label: 'Socket depth', value: mm(p.depth, 0), tol: '±0.5' },
      { label: 'Boss', value: `Ø${mm(B, 0)}`, tol: '±0.3' },
      { label: 'Grip', value: `Ø${mm(p.gripD, 0)}`, tol: '±0.5' },
    ],
    notes: [
      p.retention === 'setscrew'
        ? 'M3 × 8 set screw (or grub screw) and M3 nut in the side trap.'
        : 'Press fit — check with the fit test.',
    ],
  };
}

export const A3: Family<A3P> = {
  id: 'A3',
  group: 'A',
  name: 'Tool handle adapter',
  blurb: 'A big T-handle, pistol grip or knob for small tools like screwdriver bits and hex keys.',
  leverage:
    'A wider handle turns the same hand force into more twist, and a T or pistol grip lets the arm do the work instead of the fingers.',
  fields,
  schema: buildSchema(fields, constraints),
  defaults: defaultsOf(fields),
  presets: [
    {
      id: 'bit',
      label: 'Screwdriver bits (1/4")',
      description: 'Standard 6.35 mm hex bits.',
      params: { shankShape: 'hex', shankSize: 6.35, depth: 22, style: 'T' },
    },
    {
      id: 'hexkey',
      label: 'Hex key (4 mm)',
      description: 'Short arm of a 4 mm Allen key.',
      params: { shankShape: 'hex', shankSize: 4, depth: 18, style: 'T', length: 90 },
    },
    {
      id: 'screwdriver',
      label: 'Small screwdriver',
      description: 'Round 5 mm shaft.',
      params: { shankShape: 'round', shankSize: 5, depth: 25, style: 'pistol' },
    },
    {
      id: 'knob',
      label: 'Palm knob',
      description: 'Mushroom knob for pushing and turning.',
      params: { style: 'mushroom', gripD: 42 },
    },
  ],
  variants: [
    { id: 'T', label: 'T-handle', description: 'A bar across the top.', patch: { style: 'T' } },
    {
      id: 'pistol',
      label: 'Pistol grip',
      description: 'Angled grip, wrist straight.',
      patch: { style: 'pistol', angle: 80 },
    },
    {
      id: 'mushroom',
      label: 'Mushroom',
      description: 'Round knob for the palm.',
      patch: { style: 'mushroom', gripD: 42 },
    },
  ],
  loadCases: a3LoadCases,
  criticalSections: a3Sections,
  drawing,
  template(p) {
    return {
      items: [
        {
          title: 'Socket shape (1:1)',
          shapes: [
            ...socketShapes(p, 0, 0),
            circle(0, 0, a3BossD(p) / 2, 'thin'),
            text(0, -a3BossD(p) / 2 - 6, 'tool end should fit inside', 3.5),
          ],
          instruction: 'Stand the tool end on the inner shape — it should just fit inside.',
        },
        {
          title: 'Grip size (1:1)',
          shapes: [circle(0, 0, p.gripD / 2), text(0, 0, `Ø${mm(p.gripD, 0)}`, 4)],
          instruction: 'Pinch the circle between finger and thumb to feel the grip size.',
        },
      ],
    };
  },
  net(p) {
    const B = a3BossD(p);
    const H = a3BossH(p);
    const boss = cylinderNet(B, H);
    const grip =
      p.style === 'mushroom'
        ? cylinderNet(p.gripD, p.gripD * 0.6)
        : boxNet(p.gripD * 0.8, p.gripD * 0.8, p.length);
    return {
      title: 'Handle size mock-up',
      shapes: [...boss, ...translateShapes(grip, 0, H + B + 30)],
      instruction: 'Size mock-up — not a functional part. Tape the parts together to feel the handle.',
    };
  },
  ghost(p) {
    const H = a3BossH(p);
    // The handle bar is g × g (rounded); the hand wraps its corners, not just its width.
    const g = p.gripD * 0.8;
    const tool = {
      kind: 'tool' as const,
      size: { af: p.shankShape === 'hex' ? p.shankSize : p.shankSize * 0.87, length: 50 + p.depth },
      position: [0, 0, -50] as [number, number, number],
    };
    if (p.style === 'mushroom') {
      // Palm cupped over the dome, fingers draping down its sides. The palm pose puts the palmar
      // surface 23 mm (scaled) below its origin, at the knuckle line, so centre the palm over the dome.
      const top = H - 2 + p.gripD * 0.3;
      return {
        objects: [
          tool,
          {
            kind: 'hand',
            size: { breadth: 0 },
            position: [0, 40, top + 23],
            hand: 'right',
            pose: 'palm',
            rotation: [0, 0, 0],
          },
        ],
      };
    }
    if (p.style === 'pistol') {
      // Around the angled grip, part-way along it.
      const th = 90 - p.angle;
      const along = p.length * 0.55;
      const r = (th * Math.PI) / 180;
      return {
        objects: [
          tool,
          {
            kind: 'hand',
            size: { breadth: 0, grip: g * 1.12 },
            position: [along * Math.cos(r), 0, H - 4 + along * Math.sin(r)],
            hand: 'right',
            pose: 'grip',
            rotation: [0, 90 - th, 0],
          },
        ],
      };
    }
    return {
      objects: [
        tool,
        {
          kind: 'hand',
          // The stem rises under the middle of the bar, so the fingers close round its sides, not under it.
          size: { breadth: 0, grip: g * 1.12, wrapMax: 150 },
          position: [0, 0, H + g / 2 - 2],
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
        { caption: 'Push the tool into the socket.', hand: 0, part: { translate: [0, 0, 40] } },
        { caption: 'Tighten the set screw (if fitted).', hand: 0, part: {} },
        {
          caption: 'Turn the handle — the bigger grip does the work.',
          part: { rotate: { axis: [0, 0, 1], pivot: [0, 0, 0], deg: 90 } },
          ghosts: [0, 1],
        },
      ],
    };
  },
  orientation(p) {
    return {
      candidates: [
        {
          id: 'handle-down',
          label: 'Handle on the bed, socket up',
          rotation: [180, 0, 0],
          buildDir: [0, 0, -1],
          supports: p.style === 'mushroom' ? 'minimal' : 'none',
          note: 'The socket prints cleanly facing up. Twisting crosses the layers in the neck, so use enough walls.',
        },
        {
          id: 'side',
          label: 'On its side',
          rotation: [90, 0, 0],
          buildDir: [0, 1, 0],
          supports: 'needed',
          note: 'Neck twist runs along the layers, but the socket and grip need supports.',
        },
      ],
    };
  },
  measureGuide: [MEASURE.toolShank, MEASURE.handBreadth],
  invalidExample: { style: 'mushroom', shankSize: 14, gripD: 25 },
  repair(p, keep) {
    const q = { ...p };
    if (q.shankShape === 'flat' && q.shankT > q.shankSize - 1) {
      if (keep === 'shankT') q.shankSize = Math.min(14, q.shankT + 1);
      if (q.shankT > q.shankSize - 1) q.shankT = Math.max(1, q.shankSize - 1);
    }
    const need = q.style === 'mushroom' ? a3BossD(q) + 4 : a3BossD(q) - 2;
    if (q.gripD < need) {
      if (keep !== 'gripD') q.gripD = Math.min(45, need);
      if (q.gripD < (q.style === 'mushroom' ? a3BossD(q) + 4 : a3BossD(q) - 2) && keep !== 'shankSize') {
        while (q.shankSize > 3 && q.gripD < (q.style === 'mushroom' ? a3BossD(q) + 4 : a3BossD(q) - 2))
          q.shankSize = Math.round((q.shankSize - 0.5) * 100) / 100;
      }
    }
    return q;
  },
  rules,
  sectionAxis: 'z',
  stamp: (p) => `A3-${Math.round(p.gripD)}`,
  sizeTag: (p) => `${p.shankShape}${p.shankSize}`,
};
