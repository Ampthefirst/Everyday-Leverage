/**
 * A tiny 2D drawing model in millimetres. Drawings, templates, nets, gauges and mounting sheets are
 * built as lists of shapes from parameters, then rendered to SVG, PDF (jsPDF) or DXF — one source,
 * three outputs, so nothing drifts.
 */
import type { Vec2 } from '../../types/geom';

export type LineStyle = 'outline' | 'hidden' | 'center' | 'thin' | 'cut' | 'fold' | 'cutline';

export type Shape =
  | { kind: 'poly'; pts: Vec2[]; closed?: boolean; style?: LineStyle; fill?: 'hatch' | 'solid' | 'none' }
  | { kind: 'circle'; c: Vec2; r: number; style?: LineStyle; fill?: 'hatch' | 'solid' | 'none' }
  | { kind: 'arc'; c: Vec2; r: number; a0: number; a1: number; style?: LineStyle }
  | {
      kind: 'text';
      at: Vec2;
      text: string;
      size?: number;
      anchor?: 'start' | 'middle' | 'end';
      bold?: boolean;
    }
  /** Linear dimension between a and b, drawn offset to the left of a→b by `offset`. */
  | { kind: 'dim'; a: Vec2; b: Vec2; offset: number; label?: string }
  /** Diameter callout: leader at `angle` (deg) from centre. */
  | { kind: 'dia'; c: Vec2; r: number; angle?: number; label?: string };

export interface View {
  name: string;
  shapes: Shape[];
  /** Short note under the view. */
  caption?: string;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function shapeBounds(shapes: Shape[]): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const add = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  for (const s of shapes) {
    switch (s.kind) {
      case 'poly':
        s.pts.forEach(([x, y]) => add(x, y));
        break;
      case 'circle':
      case 'arc':
        add(s.c[0] - s.r, s.c[1] - s.r);
        add(s.c[0] + s.r, s.c[1] + s.r);
        break;
      case 'text':
        add(s.at[0], s.at[1]);
        break;
      case 'dim': {
        const [nx, ny] = dimNormal(s.a, s.b);
        add(s.a[0], s.a[1]);
        add(s.b[0], s.b[1]);
        add(
          s.a[0] + nx * (s.offset + 4 * Math.sign(s.offset || 1)),
          s.a[1] + ny * (s.offset + 4 * Math.sign(s.offset || 1)),
        );
        add(
          s.b[0] + nx * (s.offset + 4 * Math.sign(s.offset || 1)),
          s.b[1] + ny * (s.offset + 4 * Math.sign(s.offset || 1)),
        );
        break;
      }
      case 'dia':
        add(s.c[0] - s.r - 6, s.c[1] - s.r - 6);
        add(s.c[0] + s.r + 18, s.c[1] + s.r + 6);
        break;
    }
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX, minY, maxX, maxY };
}

/** Unit normal pointing left of a→b (y up). */
export function dimNormal(a: Vec2, b: Vec2): Vec2 {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  return [-dy / l, dx / l];
}

export function translateShapes(shapes: Shape[], dx: number, dy: number): Shape[] {
  const t = ([x, y]: Vec2): Vec2 => [x + dx, y + dy];
  return shapes.map((s) => {
    switch (s.kind) {
      case 'poly':
        return { ...s, pts: s.pts.map(t) };
      case 'circle':
      case 'arc':
      case 'dia':
        return { ...s, c: t(s.c) };
      case 'text':
        return { ...s, at: t(s.at) };
      case 'dim':
        return { ...s, a: t(s.a), b: t(s.b) };
    }
  });
}

// ---------- builders ----------

export const rect = (
  x: number,
  y: number,
  w: number,
  h: number,
  style: LineStyle = 'outline',
  fill?: 'hatch' | 'solid' | 'none',
): Shape => ({
  kind: 'poly',
  pts: [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ],
  closed: true,
  style,
  fill,
});

/** Rounded rectangle centred at (cx, cy). */
export function roundRect(
  cx: number,
  cy: number,
  w: number,
  h: number,
  r: number,
  style: LineStyle = 'outline',
  fill?: 'hatch' | 'solid' | 'none',
): Shape {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  const pts: Vec2[] = [];
  const corners: [number, number, number][] = [
    [cx + w / 2 - rr, cy + h / 2 - rr, 0],
    [cx - w / 2 + rr, cy + h / 2 - rr, 90],
    [cx - w / 2 + rr, cy - h / 2 + rr, 180],
    [cx + w / 2 - rr, cy - h / 2 + rr, 270],
  ];
  for (const [x, y, a0] of corners) {
    for (let i = 0; i <= 6; i++) {
      const a = ((a0 + (i * 90) / 6) * Math.PI) / 180;
      pts.push([x + rr * Math.cos(a), y + rr * Math.sin(a)]);
    }
  }
  return { kind: 'poly', pts, closed: true, style, fill };
}

export const line = (a: Vec2, b: Vec2, style: LineStyle = 'outline'): Shape => ({
  kind: 'poly',
  pts: [a, b],
  style,
});

export const circle = (
  cx: number,
  cy: number,
  r: number,
  style: LineStyle = 'outline',
  fill?: 'hatch' | 'solid' | 'none',
): Shape => ({
  kind: 'circle',
  c: [cx, cy],
  r,
  style,
  fill,
});

export const text = (
  x: number,
  y: number,
  s: string,
  size = 3.5,
  anchor: 'start' | 'middle' | 'end' = 'middle',
  bold = false,
): Shape => ({
  kind: 'text',
  at: [x, y],
  text: s,
  size,
  anchor,
  bold,
});

export const dim = (a: Vec2, b: Vec2, offset: number, label?: string): Shape => ({
  kind: 'dim',
  a,
  b,
  offset,
  label,
});

export const dia = (cx: number, cy: number, r: number, label?: string, angle = 45): Shape => ({
  kind: 'dia',
  c: [cx, cy],
  r,
  label,
  angle,
});

/** Regular polygon / star outline points. */
export function polygonPts(n: number, r: number, cx = 0, cy = 0, rot = 0): Vec2[] {
  return Array.from({ length: n }, (_, i) => {
    const a = rot + (i * 2 * Math.PI) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as Vec2;
  });
}

export function starPts(n: number, rOuter: number, rInner: number, cx = 0, cy = 0): Vec2[] {
  const pts: Vec2[] = [];
  for (let i = 0; i < 2 * n; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = Math.PI / 2 + (i * Math.PI) / n;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}
