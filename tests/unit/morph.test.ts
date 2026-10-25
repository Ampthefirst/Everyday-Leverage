import { describe, expect, it } from 'vitest';
import { getFamily } from '../../src/families';
import { blendParams, easeInOut, heroBounds, heroStops } from '../../src/app/morph';
import { flatten } from '../../src/outputs/svg/render';
import { shapeBounds } from '../../src/outputs/svg/ir';

const fam = getFamily('B1')!;
const stops = heroStops(fam);
const top = (p: Record<string, unknown>) => fam.drawing(p as never).views[0].shapes;
const circles = (p: Record<string, unknown>) =>
  flatten(top(p))
    .filter((s) => s.kind === 'circle')
    .map((s) => (s as { r: number }).r.toFixed(3));

describe('Fig. 1 morph', () => {
  it('cycles the three real handheld presets', () => {
    expect(stops.map((s) => s.label)).toEqual(['Jam and pickle jars', 'Bottle caps', 'One favourite jar']);
    for (const s of stops) expect(s.params.mount).toBe('handheld');
  });

  it('starts and ends each morph exactly on the preset drawings', () => {
    for (let i = 0; i < stops.length; i++) {
      const a = stops[i];
      const b = stops[(i + 1) % stops.length];
      expect(circles(blendParams(a.blendable, b.blendable, 0))).toEqual(circles(a.blendable));
      expect(circles(blendParams(a.blendable, b.blendable, 1))).toEqual(circles(b.blendable));
    }
  });

  it('draws the one-lid preset the same way when blended, so nothing pops at the end of a morph', () => {
    const single = stops.find((s) => s.params.steps === 1)!;
    expect(new Set(circles(single.blendable))).toEqual(new Set(circles(single.params)));
  });

  it('keeps every frame inside the one fixed frame', () => {
    const fixed = heroBounds(fam, stops);
    for (let i = 0; i < stops.length; i++)
      for (const t of [0.1, 0.3, 0.5, 0.7, 0.9]) {
        const b = shapeBounds(flatten(top(blendParams(stops[i].blendable, stops[(i + 1) % 3].blendable, t))));
        expect(b.minX).toBeGreaterThanOrEqual(fixed.minX - 1e-6);
        expect(b.maxX).toBeLessThanOrEqual(fixed.maxX + 1e-6);
        expect(b.minY).toBeGreaterThanOrEqual(fixed.minY - 1e-6);
        expect(b.maxY).toBeLessThanOrEqual(fixed.maxY + 1e-6);
      }
  });

  it('eases from 0 to 1', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
  });
});
