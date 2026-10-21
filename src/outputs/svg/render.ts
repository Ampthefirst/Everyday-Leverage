import type { Vec2 } from '../../types/geom';
import { dimNormal, shapeBounds, type Bounds, type LineStyle, type Shape } from './ir';

export interface StrokeStyle {
  width: number;
  dash?: number[];
  color: string;
}

/** Line styles in mm (stroke width) and mm dash patterns. */
export const STYLES: Record<LineStyle, StrokeStyle> = {
  outline: { width: 0.5, color: '#000000' },
  hidden: { width: 0.3, dash: [2, 1], color: '#000000' },
  center: { width: 0.25, dash: [6, 1.5, 1, 1.5], color: '#555555' },
  thin: { width: 0.25, color: '#333333' },
  cut: { width: 0.5, dash: [4, 2], color: '#c00000' },
  fold: { width: 0.3, dash: [3, 2], color: '#0050c8' },
  cutline: { width: 0.4, color: '#000000' },
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f = (n: number) => (Math.round(n * 1000) / 1000).toString();

/** Arrowheads + extension lines + text for a linear dimension, as primitive shapes. */
export function expandDim(a: Vec2, b: Vec2, offset: number, label: string): Shape[] {
  const [nx, ny] = dimNormal(a, b);
  const a2: Vec2 = [a[0] + nx * offset, a[1] + ny * offset];
  const b2: Vec2 = [b[0] + nx * offset, b[1] + ny * offset];
  const ext = Math.sign(offset || 1) * 1.5;
  const dx = b2[0] - a2[0];
  const dy = b2[1] - a2[1];
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L;
  const uy = dy / L;
  const ah = Math.min(2.5, L / 4);
  const arrow = (p: Vec2, s: number): Shape => ({
    kind: 'poly',
    pts: [
      [p[0] + s * ux * ah + nx * ah * 0.35, p[1] + s * uy * ah + ny * ah * 0.35],
      p,
      [p[0] + s * ux * ah - nx * ah * 0.35, p[1] + s * uy * ah - ny * ah * 0.35],
    ],
    style: 'thin',
  });
  const mid: Vec2 = [
    (a2[0] + b2[0]) / 2 + nx * 2.2 * Math.sign(offset || 1),
    (a2[1] + b2[1]) / 2 + ny * 2.2 * Math.sign(offset || 1),
  ];
  return [
    { kind: 'poly', pts: [a, [a2[0] + nx * ext, a2[1] + ny * ext]], style: 'thin' },
    { kind: 'poly', pts: [b, [b2[0] + nx * ext, b2[1] + ny * ext]], style: 'thin' },
    { kind: 'poly', pts: [a2, b2], style: 'thin' },
    arrow(a2, 1),
    arrow(b2, -1),
    { kind: 'text', at: mid, text: label, size: 3, anchor: 'middle' },
  ];
}

export function expandDia(c: Vec2, r: number, angle: number, label: string): Shape[] {
  const a = (angle * Math.PI) / 180;
  const p1: Vec2 = [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
  const p2: Vec2 = [c[0] + (r + 8) * Math.cos(a), c[1] + (r + 8) * Math.sin(a)];
  const p3: Vec2 = [p2[0] + 10, p2[1]];
  return [
    { kind: 'poly', pts: [p1, p2, p3], style: 'thin' },
    {
      kind: 'poly',
      pts: [
        [p1[0] + 2 * Math.cos(a + 0.35), p1[1] + 2 * Math.sin(a + 0.35)],
        p1,
        [p1[0] + 2 * Math.cos(a - 0.35), p1[1] + 2 * Math.sin(a - 0.35)],
      ],
      style: 'thin',
    },
    { kind: 'text', at: [p3[0] + 1, p3[1] + 1], text: label, size: 3, anchor: 'start' },
  ];
}

/** Replace dim/dia shapes with primitives (lines, arrows, text). */
export function flatten(shapes: Shape[]): Shape[] {
  const out: Shape[] = [];
  for (const s of shapes) {
    if (s.kind === 'dim') {
      const len = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]);
      out.push(...expandDim(s.a, s.b, s.offset, s.label ?? `${Math.round(len * 10) / 10} mm`));
    } else if (s.kind === 'dia')
      out.push(...expandDia(s.c, s.r, s.angle ?? 45, s.label ?? `Ø${Math.round(s.r * 20) / 10}`));
    else out.push(s);
  }
  return out;
}

/**
 * Render shapes (mm, y up) to SVG elements in a coordinate system with y down.
 * `tx` maps a model point to SVG user units (mm on the page).
 */
export function shapesToSvgElements(
  shapes: Shape[],
  tx: (p: Vec2) => Vec2,
  scale = 1,
  hatchId = 'hatch',
): string {
  const parts: string[] = [];
  for (const s of flatten(shapes)) {
    if (s.kind === 'text') {
      const [x, y] = tx(s.at);
      const size = (s.size ?? 3.5) * Math.max(0.6, Math.min(1, scale * 1.5));
      parts.push(
        `<text x="${f(x)}" y="${f(y + size * 0.35)}" font-size="${f(size)}" font-family="Helvetica, Arial, sans-serif" text-anchor="${s.anchor ?? 'middle'}"${s.bold ? ' font-weight="bold"' : ''} fill="#000">${esc(s.text)}</text>`,
      );
      continue;
    }
    const st =
      STYLES[
        (s.kind === 'poly' || s.kind === 'circle' || s.kind === 'arc' ? s.style : 'outline') ?? 'outline'
      ];
    const stroke = `stroke="${st.color}" stroke-width="${f(st.width)}"${st.dash ? ` stroke-dasharray="${st.dash.map(f).join(' ')}"` : ''} stroke-linejoin="round" stroke-linecap="round"`;
    const fillAttr = (fill?: 'hatch' | 'solid' | 'none') =>
      fill === 'hatch' ? `fill="url(#${hatchId})"` : fill === 'solid' ? 'fill="#ffffff"' : 'fill="none"';
    if (s.kind === 'poly') {
      const d =
        s.pts.map((p, i) => `${i ? 'L' : 'M'}${f(tx(p)[0])} ${f(tx(p)[1])}`).join(' ') +
        (s.closed ? ' Z' : '');
      parts.push(`<path d="${d}" ${fillAttr(s.fill)} ${stroke}/>`);
    } else if (s.kind === 'circle') {
      const [cx, cy] = tx(s.c);
      parts.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(s.r * scale)}" ${fillAttr(s.fill)} ${stroke}/>`);
    } else if (s.kind === 'arc') {
      const p0 = tx([
        s.c[0] + s.r * Math.cos((s.a0 * Math.PI) / 180),
        s.c[1] + s.r * Math.sin((s.a0 * Math.PI) / 180),
      ]);
      const p1 = tx([
        s.c[0] + s.r * Math.cos((s.a1 * Math.PI) / 180),
        s.c[1] + s.r * Math.sin((s.a1 * Math.PI) / 180),
      ]);
      const large = Math.abs(s.a1 - s.a0) > 180 ? 1 : 0;
      parts.push(
        `<path d="M${f(p0[0])} ${f(p0[1])} A${f(s.r * scale)} ${f(s.r * scale)} 0 ${large} 0 ${f(p1[0])} ${f(p1[1])}" fill="none" ${stroke}/>`,
      );
    }
  }
  return parts.join('\n');
}

export const HATCH_DEF = (id = 'hatch') =>
  `<pattern id="${id}" patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="2" stroke="#000" stroke-width="0.2"/></pattern>`;

/** A standalone SVG at true scale (1 user unit = 1 mm), with optional title and 25 mm check square. */
export function toSvgDocument(
  shapes: Shape[],
  opts: { title?: string; note?: string; scaleSquare?: boolean; margin?: number } = {},
): string {
  const m = opts.margin ?? 10;
  const b: Bounds = shapeBounds(flatten(shapes));
  const head = opts.title ? 10 : 0;
  const sq = opts.scaleSquare ? 35 : 0;
  const w = b.maxX - b.minX + 2 * m;
  const h = b.maxY - b.minY + 2 * m + head + sq + (opts.note ? 8 : 0);
  const tx = ([x, y]: Vec2): Vec2 => [x - b.minX + m, b.maxY - y + m + head];
  let body = shapesToSvgElements(shapes, tx);
  if (opts.title)
    body =
      `<text x="${m}" y="${m + 2}" font-size="5" font-family="Helvetica, Arial, sans-serif" font-weight="bold">${esc(opts.title)}</text>\n` +
      body;
  if (opts.scaleSquare) {
    const y0 = h - m - 25 - (opts.note ? 8 : 0);
    body += `\n<rect x="${m}" y="${f(y0)}" width="25" height="25" fill="none" stroke="#000" stroke-width="0.4"/><text x="${m + 28}" y="${f(y0 + 14)}" font-size="3.5" font-family="Helvetica, Arial, sans-serif">This square should measure 25 mm. Print at 100% / Actual size.</text>`;
  }
  if (opts.note)
    body += `\n<text x="${m}" y="${f(h - m + 2)}" font-size="3.2" font-family="Helvetica, Arial, sans-serif">${esc(opts.note)}</text>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}mm" height="${f(h)}mm" viewBox="0 0 ${f(w)} ${f(h)}">
<defs>${HATCH_DEF()}</defs>
<rect width="100%" height="100%" fill="#ffffff"/>
${body}
</svg>`;
}
