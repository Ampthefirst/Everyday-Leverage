import type { B1P } from '../../families/b1';
import { b1PlateL, b1PlateW, b1ScrewHoles, b1VPoints } from '../../families/b1';
import { circle, dim, line, text, type Shape } from './ir';

/** 1:1 mounting template for the wall-mount opener: plate outline and screw positions. */
export function mountingTemplate(p: B1P): Shape[] {
  const w = b1PlateW(p);
  const L = b1PlateL(p);
  const v = b1VPoints(p);
  const out: Shape[] = [
    {
      kind: 'poly',
      closed: true,
      style: 'thin',
      pts: [[-w / 2, 0], v[0], v[1], v[2], v[3], [w / 2, 0], [w / 2, L], [-w / 2, L]],
    },
    text(0, -6, 'front edge (V opening) — this side faces you', 3.5),
  ];
  for (const [x, y] of b1ScrewHoles(p)) {
    out.push(circle(x, y, 2.1), line([x - 6, y], [x + 6, y], 'thin'), line([x, y - 6], [x, y + 6], 'thin'));
  }
  const [a, b] = b1ScrewHoles(p);
  out.push(dim(a, b, 10, `${Math.round(b[0] - a[0])} mm`));
  out.push(text(0, L + 8, 'Tape under the shelf, prick through the + marks, drill 3 mm pilot holes.', 3.5));
  return out;
}
