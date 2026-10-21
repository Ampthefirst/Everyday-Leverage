import type { Vec2 } from '../types/geom';
import { fmt } from '../types/units';
import type { Shape } from '../outputs/svg/ir';
import { circle, line, rect, text } from '../outputs/svg/ir';
import type { MeasureStep, OrientationCandidate, ValidationIssue } from './types';

/** Minimum printable wall: ≥ 2 × line width and ≥ 1.2 mm; we design to 2 mm. */
export const MIN_WALL = 2;
export const MIN_FEATURE = 0.8;

export const err = (message: string, fix?: string, param?: string): ValidationIssue => ({
  severity: 'error',
  message,
  fix,
  param,
});
export const warn = (message: string, fix?: string, param?: string): ValidationIssue => ({
  severity: 'warn',
  message,
  fix,
  param,
});
export const info = (message: string, fix?: string, param?: string): ValidationIssue => ({
  severity: 'info',
  message,
  fix,
  param,
});

export const ceilTo = (v: number, step = 0.5) => Math.ceil(v / step - 1e-9) * step;
export const mm = (v: number, d = 1) => `${fmt(v, d)} mm`;

// ---------- orientation presets ----------

export const UPRIGHT: OrientationCandidate = {
  id: 'upright',
  label: 'Standing on its end',
  rotation: [0, 0, 0],
  buildDir: [0, 0, 1],
  supports: 'none',
  note: 'Layers stack along the length.',
};

export const FLAT: OrientationCandidate = {
  id: 'flat',
  label: 'Lying flat',
  rotation: [0, 0, 0],
  buildDir: [0, 0, 1],
  supports: 'none',
  note: 'Largest face on the bed; long features run along the layers.',
};

// ---------- shared measurement steps ----------

export const MEASURE: Record<string, MeasureStep> = {
  shaftCaliper: {
    id: 'shaftCaliper',
    title: 'Measure the handle',
    text: 'Measure across the handle where your hand will hold it. Use a ruler or calipers. For a flat handle, measure the width and the thickness.',
    illustration: 'shaftCaliper',
    tip: 'No calipers? Print the shaft-size gauge from "Get files" and find the slot it fits.',
  },
  shaftWrap: {
    id: 'shaftWrap',
    title: 'Or wrap a strip of paper',
    text: 'Wrap a thin strip of paper once around the handle, mark where it overlaps, and measure the length. Divide by 3.14 to get the diameter.',
    illustration: 'shaftWrap',
  },
  handBreadth: {
    id: 'handBreadth',
    title: 'Measure your hand',
    text: 'Measure straight across your palm at the knuckles, not counting the thumb. This sets a comfortable grip size.',
    illustration: 'handBreadth',
  },
  palmCircumference: {
    id: 'palmCircumference',
    title: 'Measure around your palm',
    text: 'Wrap a soft tape (or a strip of paper) around your palm just below the knuckles, not around the thumb.',
    illustration: 'palmCircumference',
  },
  lidDiameter: {
    id: 'lidDiameter',
    title: 'Measure the lids',
    text: 'Measure across the smallest and the largest lids you want to open. Measure the outside of the lid, including its ridges.',
    illustration: 'lidDiameter',
    tip: 'The lid-size gauge in "Get files" lets you check lids without a ruler.',
  },
  keyBlade: {
    id: 'keyBlade',
    title: 'Measure the key head',
    text: 'Measure the width of the flat part of the key you hold (the head) and its thickness.',
    illustration: 'keyBlade',
  },
  knobDiameter: {
    id: 'knobDiameter',
    title: 'Measure the knob',
    text: 'Measure across the knob at its widest point, and how far it sticks out from the surface.',
    illustration: 'knobDiameter',
  },
  capProfile: {
    id: 'capProfile',
    title: 'Measure the cap or tap',
    text: 'Pick the shape that matches the top of the cap, tap or knob. Measure across it at the widest point.',
    illustration: 'capProfile',
  },
  holeSize: {
    id: 'holeSize',
    title: 'Measure the hole or tab',
    text: 'Measure the hole, slot or tab the pull will hook through: its width and its thickness.',
    illustration: 'holeSize',
  },
  buttonSize: {
    id: 'buttonSize',
    title: 'Measure the button',
    text: 'Measure across the button and how far down it needs to go to click.',
    illustration: 'buttonSize',
  },
  reachDistance: {
    id: 'reachDistance',
    title: 'Measure the reach',
    text: 'Measure how far the aid needs to reach from where your hand will be.',
    illustration: 'reachDistance',
  },
  leverDiameter: {
    id: 'leverDiameter',
    title: 'Measure the door lever',
    text: 'Measure the thickness of the door lever handle where the aid will clip on.',
    illustration: 'leverDiameter',
  },
  toolShank: {
    id: 'toolShank',
    title: 'Measure the tool shank',
    text: 'Measure across the flat sides of the bit or shank (hex), or its diameter (round).',
    illustration: 'toolShank',
  },
};

// ---------- 2D helpers ----------

/** Flat pattern of a cylinder: wrap panel with glue tab plus two end discs with tabs. */
export function cylinderNet(D: number, L: number): Shape[] {
  const C = Math.PI * D;
  const tab = 8;
  const shapes: Shape[] = [
    rect(0, 0, C, L, 'cutline'),
    {
      kind: 'poly',
      pts: [
        [C, 0],
        [C + tab, 3],
        [C + tab, L - 3],
        [C, L],
      ],
      style: 'cutline',
    },
    line([C, 0], [C, L], 'fold'),
    circle(D / 2, L + 10 + D / 2, D / 2, 'cutline'),
    circle(D / 2 + D + 10, L + 10 + D / 2, D / 2, 'cutline'),
    text(C / 2, L / 2, 'roll into a tube, glue the tab', 4),
    text(D / 2, L + 10 + D / 2, 'end', 3.5),
    text(D / 2 + D + 10, L + 10 + D / 2, 'end', 3.5),
  ];
  return shapes;
}

/** Flat pattern of a box w × h × L (cross-section w × h, length L). */
export function boxNet(w: number, h: number, L: number): Shape[] {
  const faces = [w, h, w, h];
  const shapes: Shape[] = [];
  let x = 0;
  for (let i = 0; i < 4; i++) {
    shapes.push(rect(x, 0, faces[i], L, 'cutline'));
    if (i > 0) shapes.push(line([x, 0], [x, L], 'fold'));
    x += faces[i];
  }
  shapes.push(
    {
      kind: 'poly',
      pts: [
        [x, 0],
        [x + 8, 3],
        [x + 8, L - 3],
        [x, L],
      ],
      style: 'cutline',
    },
    line([x, 0], [x, L], 'fold'),
  );
  // end caps
  shapes.push(rect(0, L, w, h, 'cutline'), line([0, L], [w, L], 'fold'));
  shapes.push(rect(0, -h, w, h, 'cutline'), line([0, 0], [w, 0], 'fold'));
  shapes.push(text(x / 2, L / 2, 'fold along dashed lines, glue the tab', 4));
  return shapes;
}

export const pts = (...p: Vec2[]): Vec2[] => p;

/** Common note for every template. */
export const TEMPLATE_SCALE_NOTE =
  'Print at 100% ("Actual size"). Check that the 25 mm square measures 25 mm before using.';
