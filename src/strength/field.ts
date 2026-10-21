import type { Vec3 } from '../types/geom';
import type { FieldZone, SectionResult } from './types';

export type StressFieldFn = (p: Vec3) => number;

function segParam(p: Vec3, a: Vec3, b: Vec3): { s: number; d: number } {
  const ab: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ap: Vec3 = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
  const L2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2 || 1;
  const s = Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / L2));
  const q: Vec3 = [a[0] + ab[0] * s, a[1] + ab[1] * s, a[2] + ab[2] * s];
  return { s, d: Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) };
}

/** 1 inside `radius`, smooth Gaussian decay outside it. */
function falloff(d: number, radius: number): number {
  if (d <= radius) return 1;
  const x = (d - radius) / Math.max(radius, 1);
  return Math.exp(-x * x);
}

/** Nominal (pre-Kt) distribution shape of a zone, 0–1. */
function zoneShape(zone: FieldZone, p: Vec3): number {
  switch (zone.type) {
    case 'lever': {
      const { s, d } = segParam(p, zone.from, zone.to);
      return (1 - s) * falloff(d, zone.radius);
    }
    case 'segment': {
      const { d } = segParam(p, zone.from, zone.to);
      return falloff(d, zone.radius);
    }
    case 'point': {
      const d = Math.hypot(p[0] - zone.at[0], p[1] - zone.at[1], p[2] - zone.at[2]);
      return Math.exp(-((d / zone.radius) ** 2));
    }
  }
}

/**
 * Builds the heat-map field from evaluated sections, so colours and verdict numbers agree:
 * each section contributes its nominal utilization (u/Kt) over its zone, plus a Kt bump with a smooth
 * falloff (radius ≈ 3·t) at its anchor. At the anchor the field equals the section's utilization.
 */
export function buildField(sections: SectionResult[], shellT: number): StressFieldFn {
  const bumpR = Math.max(3 * shellT, 3);
  return (p) => {
    let u = 0;
    for (const s of sections) {
      const nominal = s.utilization / Math.max(1, s.Kt);
      let v: number;
      if (s.zone.type === 'point') {
        v = s.utilization * zoneShape(s.zone, p);
      } else {
        const d = Math.hypot(p[0] - s.at[0], p[1] - s.at[1], p[2] - s.at[2]);
        v = nominal * zoneShape(s.zone, p) + (s.utilization - nominal) * Math.exp(-((d / bumpR) ** 2));
      }
      if (v > u) u = v;
    }
    return u;
  };
}

/** Blue → green → amber → red, with u = 1 at red. Returns linear RGB 0–1. */
export function heatColor(u: number): [number, number, number] {
  const stops: [number, [number, number, number]][] = [
    [0, [0.15, 0.35, 0.85]],
    [0.3, [0.1, 0.7, 0.45]],
    [0.6, [0.95, 0.75, 0.1]],
    [1.0, [0.85, 0.1, 0.1]],
  ];
  const x = Math.max(0, Math.min(1, u));
  for (let i = 1; i < stops.length; i++) {
    const [x1, c1] = stops[i];
    const [x0, c0] = stops[i - 1];
    if (x <= x1) {
      const t = (x - x0) / (x1 - x0);
      return [c0[0] + (c1[0] - c0[0]) * t, c0[1] + (c1[1] - c0[1]) * t, c0[2] + (c1[2] - c0[2]) * t];
    }
  }
  return stops[stops.length - 1][1];
}
