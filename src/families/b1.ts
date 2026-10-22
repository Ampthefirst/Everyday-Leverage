import type { Family, FieldDef, ValidationIssue } from './types';
import { buildSchema, defaultsOf } from './schema';
import { MEASURE, boxNet, cylinderNet, err, info, mm, warn, FLAT } from './common';
import { circle, dia, dim, line, rect, text, translateShapes, type Shape } from '../outputs/svg/ir';
import { b1LoadCases, b1Sections } from '../strength/families/b1';
import { maxPartLength } from '../print/bedfit';

export type B1P = {
  lidMin: number;
  lidMax: number;
  steps: number;
  stepDepth: number;
  lever: number;
  teeth: 'serrated' | 'band' | 'none';
  hands: 'one' | 'two';
  mount: 'handheld' | 'wall';
  leverW: number;
  leverH: number;
  wall: number;
  clearance: number;
  fillet: number;
};

/** Step diameters from the mouth (largest) down to the smallest. */
export function b1Diameters(p: B1P): number[] {
  if (p.steps <= 1) return [p.lidMax];
  return Array.from({ length: p.steps }, (_, i) => p.lidMax - (i * (p.lidMax - p.lidMin)) / (p.steps - 1));
}
export const b1BossOD = (p: B1P) => p.lidMax + 2 * p.clearance + 2 * p.wall;
export const b1CupHeight = (p: B1P) => p.steps * p.stepDepth + 4;
/** Overall length of the handheld opener (the end pad adds about 0.29 × lever width per lever). */
export const b1Overall = (p: B1P) => {
  const perLever = p.lever + 0.2875 * p.leverW;
  return p.hands === 'two' ? 2 * perLever + b1BossOD(p) : perLever + b1BossOD(p);
};
export const b1MaxOverall = (p: B1P) => maxPartLength(b1BossOD(p) + 2);
const b1MaxLever = (p: B1P) =>
  Math.floor((b1MaxOverall(p) - b1BossOD(p)) / (p.hands === 'two' ? 2 : 1) - 0.2875 * p.leverW);
/** Wall-mount V: half angle and length. */
export const B1_V_HALF_DEG = 16;
export const b1VLength = (p: B1P) =>
  (p.lidMax - p.lidMin) / 2 / Math.tan((B1_V_HALF_DEG * Math.PI) / 180) + 20;
export const b1PlateW = (p: B1P) => p.lidMax + 50;
export const b1PlateL = (p: B1P) => b1VLength(p) + 35;
/** Screw positions on the wall plate (x along the plate width, y along its length). */
export function b1ScrewHoles(p: B1P): [number, number][] {
  const w = b1PlateW(p);
  const L = b1PlateL(p);
  return [
    [-w / 2 + 12, L - 14],
    [w / 2 - 12, L - 14],
  ];
}
const TOOTH_MIN_STEP = 4;

const fields: FieldDef<B1P>[] = [
  {
    key: 'lidMin',
    kind: 'number',
    label: 'Smallest lid',
    unit: 'mm',
    min: 20,
    max: 106,
    step: 1,
    default: 45,
    group: 'fit',
    measure: 'lidDiameter',
    showIf: (p) => p.steps > 1 || p.mount === 'wall',
  },
  {
    key: 'lidMax',
    kind: 'number',
    label: 'Largest lid',
    unit: 'mm',
    min: 24,
    max: 110,
    step: 1,
    default: 85,
    group: 'fit',
    measure: 'lidDiameter',
    help: 'Outside diameter of the lid, including ridges.',
  },
  {
    key: 'steps',
    kind: 'number',
    label: 'Lid sizes (steps)',
    min: 1,
    max: 5,
    step: 1,
    default: 3,
    group: 'fit',
    help: 'Each step fits a range of lids around its size.',
    showIf: (p) => p.mount === 'handheld',
  },
  {
    key: 'lever',
    kind: 'number',
    label: 'Lever length',
    unit: 'mm',
    min: 80,
    max: 250,
    step: 5,
    default: 150,
    group: 'fit',
    help: 'Longer lever = less force needed.',
    showIf: (p) => p.mount === 'handheld',
  },
  {
    key: 'teeth',
    kind: 'choice',
    label: 'Grip inside the cup',
    group: 'style',
    default: 'serrated',
    options: [
      { value: 'serrated', label: 'Teeth', hint: 'Bite into the lid ridges' },
      { value: 'band', label: 'Rubber band', hint: 'Groove for a rubber band — gentle on lids' },
      { value: 'none', label: 'Smooth' },
    ],
  },
  {
    key: 'hands',
    kind: 'choice',
    label: 'Hands',
    group: 'style',
    default: 'one',
    options: [
      { value: 'one', label: 'One-hand lever' },
      { value: 'two', label: 'Two-hand bar' },
    ],
    showIf: (p) => p.mount === 'handheld',
  },
  {
    key: 'mount',
    kind: 'choice',
    label: 'Type',
    group: 'style',
    default: 'handheld',
    options: [
      { value: 'handheld', label: 'Handheld' },
      {
        value: 'wall',
        label: 'Under-cabinet',
        hint: 'Screw it up; push the lid into the V and turn the jar',
      },
    ],
  },
  {
    key: 'stepDepth',
    kind: 'number',
    label: 'Cup depth per step',
    unit: 'mm',
    min: 6,
    max: 20,
    step: 1,
    default: 10,
    group: 'fine',
  },
  {
    key: 'leverW',
    kind: 'number',
    label: 'Lever width',
    unit: 'mm',
    min: 18,
    max: 35,
    step: 1,
    default: 26,
    group: 'fine',
    showIf: (p) => p.mount === 'handheld',
  },
  {
    key: 'leverH',
    kind: 'number',
    label: 'Lever thickness',
    unit: 'mm',
    min: 10,
    max: 25,
    step: 1,
    default: 14,
    group: 'fine',
    showIf: (p) => p.mount === 'handheld',
  },
  {
    key: 'wall',
    kind: 'number',
    label: 'Cup wall',
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
    label: 'Lid clearance',
    unit: 'mm',
    min: 0.3,
    max: 1.5,
    step: 0.1,
    default: 0.8,
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
    help: '2 mm or more lowers the stress concentration.',
    showIf: (p) => p.mount === 'handheld',
  },
];

function constraints(p: B1P): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  const needsMin = p.steps > 1 || p.mount === 'wall';
  if (needsMin && p.lidMin > p.lidMax - 4)
    out.push(
      err(
        'The smallest lid must be at least 4 mm smaller than the largest.',
        `Set the smallest lid to ${p.lidMax - 4} mm or less.`,
        'lidMin',
      ),
    );
  if (p.mount === 'handheld' && p.steps > 1 && (p.lidMax - p.lidMin) / (p.steps - 1) < TOOTH_MIN_STEP) {
    const maxSteps = Math.max(1, Math.floor((p.lidMax - p.lidMin) / TOOTH_MIN_STEP) + 1);
    out.push(
      err(
        'Too many steps for this range of lids — each step needs at least 4 mm to seat the lid.',
        `Use ${maxSteps} steps or fewer.`,
        'steps',
      ),
    );
  }
  if (p.mount === 'handheld' && b1Overall(p) > b1MaxOverall(p)) {
    out.push(
      err(
        `At ${mm(b1Overall(p), 0)} long the opener will not fit the printer bed.`,
        `Shorten the lever to ${Math.floor(b1MaxLever(p) / 5) * 5} mm or less.`,
        'lever',
      ),
    );
  }
  return out;
}

function rules(p: B1P): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  if (p.mount === 'handheld' && p.fillet < 2)
    out.push(
      warn(
        'A small fillet at the lever root concentrates stress.',
        'Use a fillet of 2 mm or more.',
        'fillet',
      ),
    );
  if (p.teeth === 'serrated' && p.lidMax < 30)
    out.push(info('Small lids have little to bite on — a rubber band can grip better.', undefined, 'teeth'));
  out.push(info('Turn the lid anticlockwise to open ("lefty loosey").'));
  return out;
}

function stepShapes(p: B1P, cx: number, cy: number): Shape[] {
  return b1Diameters(p).map((d) => circle(cx, cy, d / 2 + p.clearance, 'hidden'));
}

function drawing(p: B1P) {
  if (p.mount === 'wall') {
    const w = b1PlateW(p);
    const L = b1PlateL(p);
    const top: Shape[] = [
      ...wallOutline(p),
      ...b1ScrewHoles(p).map(([x, y]) => circle(x, y, 2.2)),
      dim([-w / 2, 0], [w / 2, 0], -10, mm(w, 0)),
      dim([w / 2, 0], [w / 2, L], -10, mm(L, 0)),
    ];
    const front: Shape[] = [rect(-w / 2, 0, w, 14), dim([-w / 2, 14], [-w / 2, 0], 8, '14 mm')];
    return {
      views: [
        { name: 'Top', shapes: top },
        { name: 'Front', shapes: front },
      ],
      keyDims: [
        { label: 'V mouth (largest lid)', value: mm(p.lidMax, 0), tol: '±0.5' },
        { label: 'V apex (smallest lid)', value: mm(p.lidMin, 0), tol: '±0.5' },
        { label: 'Plate', value: `${mm(w, 0)} × ${mm(L, 0)}`, tol: '±0.5' },
      ],
      notes: ['Fix with two 4 mm countersunk wood screws into solid wood, not chipboard edges.'],
    };
  }
  const B = b1BossOD(p);
  const H = b1CupHeight(p);
  const top: Shape[] = [
    circle(0, 0, B / 2),
    ...stepShapes(p, 0, 0),
    ...leverTop(p),
    dia(0, 0, B / 2, `Ø${mm(B, 0)}`),
    dim([B / 2, -p.leverW / 2], [B / 2 + p.lever, -p.leverW / 2], 10, mm(p.lever, 0)),
  ];
  const front: Shape[] = [
    rect(-B / 2, 0, B, H),
    rect(B / 2, 0, p.lever, p.leverH),
    dim([-B / 2, 0], [-B / 2, H], 10, mm(H, 0)),
    dim([B / 2 + p.lever, 0], [B / 2 + p.lever, p.leverH], -10, mm(p.leverH, 0)),
  ];
  if (p.hands === 'two') front.push(rect(-B / 2 - p.lever, 0, p.lever, p.leverH));
  let z = H;
  for (const d of b1Diameters(p)) {
    const r = d / 2 + p.clearance;
    front.push(
      line([-r, z], [-r, z - p.stepDepth], 'hidden'),
      line([r, z], [r, z - p.stepDepth], 'hidden'),
      line([-r, z - p.stepDepth], [r, z - p.stepDepth], 'hidden'),
    );
    z -= p.stepDepth;
  }
  const section: Shape[] = [
    rect(B / 2 - 0.01, 0, 0.01, 0.01, 'thin'),
    rect(-p.leverW / 2, 0, p.leverW, p.leverH, 'outline', 'hatch'),
    dim([-p.leverW / 2, p.leverH], [p.leverW / 2, p.leverH], -6, mm(p.leverW, 0)),
  ];
  return {
    views: [
      { name: 'Top', shapes: top },
      { name: 'Front', shapes: front },
      { name: 'Section at lever root', shapes: section, caption: 'Where the lever meets the cup' },
    ],
    keyDims: [
      ...b1Diameters(p).map((d, i) => ({
        label: `Step ${i + 1} (lid)`,
        value: `Ø${mm(d + 2 * p.clearance, 1)}`,
        tol: '±0.3',
      })),
      { label: 'Lever length', value: mm(p.lever, 0), tol: '±1' },
      { label: 'Lever section', value: `${mm(p.leverW, 0)} × ${mm(p.leverH, 0)}`, tol: '±0.3' },
      { label: 'Root fillet', value: mm(p.fillet), tol: 'min' },
    ],
    notes: [
      p.teeth === 'band'
        ? 'Fit a wide rubber band into the groove of each step.'
        : p.teeth === 'serrated'
          ? 'Teeth bite into lid ridges.'
          : 'Smooth cup.',
    ],
  };
}

function leverTop(p: B1P): Shape[] {
  const B = b1BossOD(p);
  const s: Shape[] = [rect(B / 2 - 2, -p.leverW / 2, p.lever + 2, p.leverW)];
  if (p.hands === 'two') s.push(rect(-B / 2 - p.lever, -p.leverW / 2, p.lever + 2, p.leverW));
  return s;
}

export function b1VPoints(p: B1P): [number, number][] {
  const half = (B1_V_HALF_DEG * Math.PI) / 180;
  const VL = b1VLength(p);
  const mouth = p.lidMax / 2 + 6;
  const apex = Math.max(2, mouth - VL * Math.tan(half));
  return [
    [-mouth, 0],
    [-apex, VL],
    [apex, VL],
    [mouth, 0],
  ];
}

function wallOutline(p: B1P): Shape[] {
  const w = b1PlateW(p);
  const L = b1PlateL(p);
  const v = b1VPoints(p);
  return [
    {
      kind: 'poly',
      closed: true,
      style: 'outline',
      pts: [[-w / 2, 0], v[0], v[1], v[2], v[3], [w / 2, 0], [w / 2, L], [-w / 2, L]],
    },
  ];
}

export const B1: Family<B1P> = {
  id: 'B1',
  group: 'B',
  name: 'Lid and jar opener',
  blurb: 'A cup that grips the lid with a long lever, so twisting a tight lid takes much less hand strength.',
  leverage:
    'The lever turns a small push at its end into a big twist at the lid: a 150 mm lever needs about a quarter of the hand force of gripping the lid itself.',
  fields,
  schema: buildSchema(fields, constraints),
  defaults: defaultsOf(fields),
  presets: [
    {
      id: 'jam',
      label: 'Jam and pickle jars',
      description: 'Lids from 45 to 85 mm, three steps.',
      params: { lidMin: 45, lidMax: 85, steps: 3, lever: 150, mount: 'handheld' },
    },
    {
      id: 'bottle',
      label: 'Bottle caps',
      description: 'Caps from 26 to 40 mm.',
      params: {
        lidMin: 26,
        lidMax: 40,
        steps: 3,
        stepDepth: 8,
        lever: 110,
        leverW: 22,
        leverH: 12,
        mount: 'handheld',
      },
    },
    {
      id: 'single',
      label: 'One favourite jar',
      description: 'A single cup sized for one lid (70 mm).',
      params: { lidMax: 70, steps: 1, lever: 160 },
    },
    {
      id: 'stuck',
      label: 'Very tight lids',
      description: 'Two-hand bar for stuck lids (heavy load).',
      params: { lidMin: 50, lidMax: 85, steps: 2, hands: 'two', lever: 95, leverW: 28, leverH: 16 },
    },
    {
      id: 'wall',
      label: 'Under-cabinet opener',
      description: 'Screw it under a shelf and turn the jar with both hands.',
      params: { mount: 'wall', lidMin: 30, lidMax: 100 },
    },
  ],
  variants: [
    {
      id: 'stepped',
      label: 'Stepped',
      description: 'Several lid sizes in one cup.',
      patch: { steps: 3, mount: 'handheld' },
    },
    {
      id: 'single',
      label: 'Single size',
      description: 'One snug cup.',
      patch: { steps: 1, mount: 'handheld' },
    },
    {
      id: 'two-hand',
      label: 'Two-hand bar',
      description: 'Levers on both sides.',
      patch: { hands: 'two', lever: 95, mount: 'handheld' },
    },
    { id: 'wall', label: 'Wall-mount V', description: 'Fixed under a cabinet.', patch: { mount: 'wall' } },
  ],
  loadCases: b1LoadCases,
  criticalSections: b1Sections,
  drawing,
  template(p) {
    const items = [];
    const ds = p.mount === 'wall' ? [p.lidMax, p.lidMin] : b1Diameters(p);
    // Flow the circles into rows that fit a portrait page (about 180 mm wide).
    let x = 0;
    let y = 0;
    let rowH = 0;
    const circles: Shape[] = [];
    for (const d of ds) {
      const r = d / 2 + (p.mount === 'wall' ? 0 : p.clearance);
      if (x > 0 && x + 2 * r > 180) {
        x = 0;
        y -= rowH + 8;
        rowH = 0;
      }
      circles.push(circle(x + r, y - r, r), text(x + r, y - r, `${mm(d, 0)}`, 4));
      x += 2 * r + 6;
      rowH = Math.max(rowH, 2 * r);
    }
    items.push({
      title: 'Lid circles (1:1)',
      shapes: circles,
      instruction:
        'Set each lid on its circle. A lid that covers the circle edge exactly (or up to 2 mm smaller) will fit that step.',
    });
    if (p.mount === 'handheld') {
      items.push({
        title: 'Lever length (1:1)',
        shapes: [
          rect(0, 0, p.lever, p.leverW),
          text(p.lever / 2, p.leverW / 2, `lever ${mm(p.lever, 0)}`, 4),
        ],
        instruction: 'Check the lever will fit your hand and your kitchen drawer.',
      });
    }
    return { items };
  },
  net(p) {
    if (p.mount === 'wall') {
      return {
        title: 'Plate mock-up',
        shapes: wallOutline(p),
        instruction: 'Size mock-up — not a functional part. Hold it under the shelf to check the space.',
      };
    }
    const B = b1BossOD(p);
    const H = b1CupHeight(p);
    const cup = cylinderNet(B, H);
    const lever = translateShapes(boxNet(p.leverW, p.leverH, p.lever), 0, H + B + 30);
    return {
      title: 'Opener size mock-up',
      shapes: [...cup, ...lever],
      instruction:
        'Size mock-up — not a functional part. Make the cup and the lever, tape them together, and try them on a jar.',
    };
  },
  ghost(p) {
    if (p.mount === 'wall') {
      const VL = b1VLength(p);
      const d = (p.lidMin + p.lidMax) / 2;
      return {
        objects: [
          {
            kind: 'jar',
            size: { lid: d, height: d * 1.4, lidH: 12 },
            position: [0, VL * 0.45, -d * 1.4 + 6],
            rotation: [0, 0, 0],
          },
          {
            kind: 'hand',
            size: { breadth: 0 },
            position: [0, VL * 0.45, -d * 0.7],
            hand: 'right',
            pose: 'palm',
            rotation: [0, 0, 0],
          },
        ],
      };
    }
    const d = b1Diameters(p)[0];
    const H = b1CupHeight(p);
    const B = b1BossOD(p);
    return {
      objects: [
        {
          kind: 'jar',
          size: { lid: d, height: d * 1.3, lidH: 12 },
          position: [0, 0, H + d * 1.3 - p.stepDepth + 1],
          rotation: [180, 0, 0],
        },
        {
          kind: 'hand',
          size: { breadth: 0, grip: p.leverW },
          position: [B / 2 + p.lever * 0.7, 0, p.leverH / 2],
          hand: 'right',
          pose: 'grip',
          // Overhand: the palm rests on the lever's top face (−Z here; the part is shown flipped), wrist toward −Y.
          rotation: [0, 90, 180],
        },
      ],
    };
  },
  animation(p) {
    if (p.mount === 'wall') {
      return {
        steps: [
          { caption: 'Push the lid into the V until it wedges.', part: {}, ghosts: [] },
          { caption: 'Hold the jar with both hands and turn it.', part: {}, ghosts: [] },
        ],
      };
    }
    return {
      steps: [
        {
          caption: 'Hold the opener with the cup facing the lid.',
          hand: 0,
          part: { translate: [0, 0, -40] },
        },
        { caption: 'Press the cup down over the lid.', part: {} },
        {
          caption: 'Push the lever end to turn the lid anticlockwise.',
          part: { rotate: { axis: [0, 0, 1], pivot: [0, 0, 0], deg: 40 } },
        },
      ],
    };
  },
  orientation(p) {
    if (p.mount === 'wall') {
      return {
        candidates: [
          {
            ...FLAT,
            note: 'Prints flat; the V edges run along the layers so the lid force does not peel layers apart.',
          },
        ],
      };
    }
    return {
      candidates: [
        {
          ...FLAT,
          label: 'Cup opening up',
          note: 'Flat bottom on the bed, no supports. The lever bends along the layers — the strong way.',
        },
        {
          id: 'side',
          label: 'On its side',
          rotation: [90, 0, 0],
          buildDir: [0, 1, 0],
          supports: 'needed',
          note: 'Needs supports inside the cup and is weaker at the lever root.',
        },
      ],
    };
  },
  measureGuide: [MEASURE.lidDiameter],
  invalidExample: { lidMin: 80, lidMax: 82, steps: 3 },
  repair(p, keep) {
    const q = { ...p };
    for (let pass = 0; pass < 3; pass++) {
      // 1. Bed fit for the handheld opener: shorten the lever, then shrink the cup, then drop to one lever.
      if (q.mount === 'handheld') {
        if (b1Overall(q) > b1MaxOverall(q) && keep !== 'lever')
          q.lever = Math.max(80, Math.floor(b1MaxLever(q) / 5) * 5);
        if (b1Overall(q) > b1MaxOverall(q) && keep !== 'hands') q.hands = 'one';
        if (b1Overall(q) > b1MaxOverall(q) && keep !== 'leverW') q.leverW = 18;
        while (b1Overall(q) > b1MaxOverall(q) && q.lidMax > 24 && keep !== 'lidMax') {
          q.lidMax -= 1;
          if (keep !== 'lidMin') q.lidMin = Math.min(q.lidMin, q.lidMax - 4);
        }
      }
      // 2. Smallest lid below the largest.
      const needsMin = q.steps > 1 || q.mount === 'wall';
      if (needsMin && q.lidMin > q.lidMax - 4) {
        if (keep === 'lidMin') q.lidMax = Math.min(110, q.lidMin + 4);
        else q.lidMin = Math.max(20, q.lidMax - 4);
      }
      // 3. Enough size range per step.
      if (q.mount === 'handheld' && q.steps > 1) {
        const fits = () => (q.lidMax - q.lidMin) / (q.steps - 1) >= TOOTH_MIN_STEP;
        if (!fits() && keep === 'steps' && keep !== ('lidMin' as string))
          q.lidMin = Math.max(20, q.lidMax - (q.steps - 1) * TOOTH_MIN_STEP);
        if (!fits() && keep !== 'steps')
          q.steps = Math.max(1, Math.floor((q.lidMax - q.lidMin) / TOOTH_MIN_STEP) + 1);
      }
    }
    return q;
  },
  rules,
  sectionAxis: 'z',
  displayRotation: [180, 0, 0],
  stamp: (p) => `B1-${Math.round(p.lidMax)}`,
  sizeTag: (p) =>
    p.mount === 'wall'
      ? `wall-${Math.round(p.lidMin)}-${Math.round(p.lidMax)}`
      : `${Math.round(p.lidMin)}-${Math.round(p.lidMax)}mm`,
};
