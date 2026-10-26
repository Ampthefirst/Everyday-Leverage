import type { CrossSection, Kernel } from '../kernel';
import { starPts } from '../../outputs/svg/ir';

/** 2D profile descriptions shared by sockets, sleeves and drawings. Dimensions in mm. */
export type Profile2D =
  | { shape: 'round'; d: number }
  | { shape: 'rect'; w: number; h: number; r?: number }
  | { shape: 'oval'; w: number; h: number }
  | { shape: 'hex'; af: number }
  | { shape: 'star'; n: number; outer: number; inner: number }
  | { shape: 'cross'; span: number; arm: number }
  | { shape: 'D'; d: number; flat: number }
  | { shape: 'slot'; w: number; t: number };

export function profileCS(K: Kernel, p: Profile2D, grow = 0): CrossSection {
  const { CrossSection } = K;
  let cs: CrossSection;
  switch (p.shape) {
    case 'round':
      return CrossSection.circle(p.d / 2 + grow);
    case 'rect': {
      const r = Math.min(p.r ?? 0.5, p.w / 2 - 0.01, p.h / 2 - 0.01);
      cs = CrossSection.square([p.w - 2 * r, p.h - 2 * r], true);
      return cs.offset(r + grow, 'Round');
    }
    case 'oval':
      return CrossSection.circle(0.5).scale([p.w + 2 * grow, p.h + 2 * grow]);
    case 'hex':
      return CrossSection.circle(p.af / Math.sqrt(3), 6).offset(grow, 'Miter');
    case 'star':
      cs = CrossSection.ofPolygons([starPts(p.n, p.outer / 2, p.inner / 2)]);
      return grow ? cs.offset(grow, 'Round') : cs;
    case 'cross':
      cs = CrossSection.union([
        CrossSection.square([p.span, p.arm], true),
        CrossSection.square([p.arm, p.span], true),
      ]);
      return grow ? cs.offset(grow, 'Miter') : cs;
    case 'D': {
      // Circle with one flat: the flat sits `flat` mm in from the edge on +Y.
      const r = p.d / 2 + grow;
      const keep = CrossSection.square([2 * r + 2, 2 * r + 1 - p.flat], false).translate([-r - 1, -r - 1]);
      return CrossSection.circle(r).intersect(keep);
    }
    case 'slot': {
      const r = Math.min(p.t / 2, 0.6);
      return CrossSection.square([p.w - 2 * r, p.t - 2 * r], true).offset(r + grow, 'Round');
    }
  }
}

/** Effective size used for strength: radius at which torque is transferred. */
export function profileRadius(p: Profile2D): number {
  switch (p.shape) {
    case 'round':
    case 'D':
      return p.d / 2;
    case 'rect':
    case 'oval':
      return Math.max(p.w, p.h) / 2;
    case 'hex':
      return p.af / 2;
    case 'star':
      return (p.outer + p.inner) / 4;
    case 'cross':
      return p.span / 2;
    case 'slot':
      return p.w / 2;
  }
}

/** Bounding width/height of a profile. */
export function profileExtent(p: Profile2D): [number, number] {
  switch (p.shape) {
    case 'round':
      return [p.d, p.d];
    case 'D':
      return [p.d, p.d];
    case 'rect':
    case 'oval':
      return [p.w, p.h];
    case 'hex':
      return [(p.af * 2) / Math.sqrt(3), p.af];
    case 'star':
      return [p.outer, p.outer];
    case 'cross':
      return [p.span, p.span];
    case 'slot':
      return [p.w, p.t];
  }
}

/** Number of faces that carry torque and the contact lever arm, for the bearing check. */
export function profileBearing(p: Profile2D): { n: number; rEff: number; faceW: number } {
  switch (p.shape) {
    case 'hex':
      return { n: 6, rEff: (p.af / 2) * 0.8, faceW: (p.af / Math.sqrt(3)) * 0.5 };
    case 'star':
      return { n: p.n, rEff: (p.outer + p.inner) / 4, faceW: (p.outer - p.inner) / 2 };
    case 'cross':
      return { n: 4, rEff: p.span / 4 + p.arm / 4, faceW: (p.span - p.arm) / 2 };
    case 'D':
      return {
        n: 1,
        rEff: p.d / 4,
        faceW: 2 * Math.sqrt(Math.max(0, (p.d / 2) ** 2 - (p.d / 2 - p.flat) ** 2)) * 0.5,
      };
    case 'rect':
      return { n: 2, rEff: p.w / 3, faceW: p.h * 0.5 };
    case 'slot':
      return { n: 2, rEff: p.w / 3, faceW: p.w * 0.25 };
    case 'oval':
      return { n: 2, rEff: p.w / 3, faceW: p.h * 0.4 };
    case 'round':
      return { n: 6, rEff: p.d / 2, faceW: 1.5 };
  }
}
