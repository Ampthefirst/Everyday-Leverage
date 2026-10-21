import type { Vec2 } from '../types/geom';
import { flatten } from './svg/render';
import type { Shape } from './svg/ir';

/** Minimal ASCII DXF (R12) in millimetres: LINE, CIRCLE, ARC, TEXT on layers by line style. */
export function toDXF(shapes: Shape[]): string {
  const out: string[] = [
    '0',
    'SECTION',
    '2',
    'HEADER',
    '9',
    '$INSUNITS',
    '70',
    '4',
    '0',
    'ENDSEC',
    '0',
    'SECTION',
    '2',
    'ENTITIES',
  ];
  const n = (v: number) => (Math.round(v * 10000) / 10000).toString();
  const line = (a: Vec2, b: Vec2, layer: string) =>
    out.push(
      '0',
      'LINE',
      '8',
      layer,
      '10',
      n(a[0]),
      '20',
      n(a[1]),
      '30',
      '0',
      '11',
      n(b[0]),
      '21',
      n(b[1]),
      '31',
      '0',
    );
  for (const s of flatten(shapes)) {
    const layer =
      (s.kind === 'poly' || s.kind === 'circle' || s.kind === 'arc' ? s.style : 'NOTES') ?? 'outline';
    const L = String(layer).toUpperCase();
    if (s.kind === 'poly') {
      for (let i = 0; i < s.pts.length - 1; i++) line(s.pts[i], s.pts[i + 1], L);
      if (s.closed && s.pts.length > 2) line(s.pts[s.pts.length - 1], s.pts[0], L);
    } else if (s.kind === 'circle') {
      out.push('0', 'CIRCLE', '8', L, '10', n(s.c[0]), '20', n(s.c[1]), '30', '0', '40', n(s.r));
    } else if (s.kind === 'arc') {
      out.push(
        '0',
        'ARC',
        '8',
        L,
        '10',
        n(s.c[0]),
        '20',
        n(s.c[1]),
        '30',
        '0',
        '40',
        n(s.r),
        '50',
        n(s.a0),
        '51',
        n(s.a1),
      );
    } else if (s.kind === 'text') {
      out.push(
        '0',
        'TEXT',
        '8',
        'NOTES',
        '10',
        n(s.at[0]),
        '20',
        n(s.at[1]),
        '30',
        '0',
        '40',
        n(s.size ?? 3.5),
        '1',
        s.text.replace(/[\r\n]/g, ' '),
      );
    }
  }
  out.push('0', 'ENDSEC', '0', 'EOF');
  return out.join('\n');
}
