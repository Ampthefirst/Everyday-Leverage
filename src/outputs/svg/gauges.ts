import { circle, rect, text, type Shape } from './ir';

/** Lid gauge: half-circles from 20 to 110 mm, each labelled, in rows. */
export function lidGauge(): Shape[] {
  const out: Shape[] = [];
  let x = 0;
  let y = 0;
  let rowH = 0;
  const maxW = 180;
  for (let d = 20; d <= 110; d += 10) {
    const r = d / 2;
    if (x + d > maxW) {
      x = 0;
      y -= rowH + 12;
      rowH = 0;
    }
    out.push(circle(x + r, y - r, r), text(x + r, y - r, `${d}`, 4, 'middle', true));
    x += d + 6;
    rowH = Math.max(rowH, d);
  }
  out.push(
    text(
      0,
      8,
      'Lid gauge: set the lid on the circles — the one it exactly covers is its size (mm).',
      3.5,
      'start',
    ),
  );
  return out;
}

/** Shaft gauge: slots from 3 to 25 mm wide cut into a strip; a handle fits the narrowest slot it enters. */
export function shaftGauge(): Shape[] {
  const out: Shape[] = [];
  let x = 0;
  for (let w = 3; w <= 25; w += 1) {
    const depth = 18;
    out.push(rect(x, 0, w, depth), text(x + w / 2, -4, `${w}`, w < 6 ? 2.6 : 3.2));
    x += w + 3;
    if (x > 170) break;
  }
  out.push(
    text(
      0,
      26,
      'Shaft gauge: cut along the slot outlines. The narrowest slot the handle slides into is its size (mm).',
      3.5,
      'start',
    ),
  );
  return out;
}
