import type { AnyFamily, OrientationCandidate, Params } from '../families/types';
import type { Vec3 } from '../types/geom';
import type { CriticalSection, LoadCase, StrengthContext } from '../strength/types';
import { evaluate } from '../strength/evaluate';
import { checkBedFit, rotatedSize, type BedFit } from './bedfit';

export interface RankedOrientation {
  candidate: OrientationCandidate;
  utilization: number;
  bed: BedFit | null;
  score: number;
  reason: string;
}

const SUPPORT_PENALTY = { none: 0, minimal: 0.05, needed: 0.15 } as const;

/** Pick the placement that maximises the minimum strength margin, prefers fewer supports, and fits the bed. */
export function rankOrientations(
  family: AnyFamily,
  p: Params,
  loadCases: LoadCase[],
  sections: (lc: LoadCase) => CriticalSection[],
  ctx: Omit<StrengthContext, 'buildDir'>,
  partSize: Vec3 | null,
): RankedOrientation[] {
  const ranked = family.orientation(p).candidates.map((c) => {
    const u = Math.max(
      ...loadCases.map((lc) => evaluate(sections(lc), { ...ctx, buildDir: c.buildDir }, lc).utilization),
    );
    const bed = partSize ? checkBedFit(rotatedSize(partSize, c.rotation)) : null;
    const score = 1 - Math.min(u, 2) - SUPPORT_PENALTY[c.supports] - (bed && !bed.fits ? 10 : 0);
    const reason =
      u < 0.6
        ? 'keeps the main load along the layers'
        : c.supports === 'none'
          ? 'needs no supports'
          : 'best strength of the options';
    return { candidate: c, utilization: u, bed, score, reason };
  });
  return ranked.sort((a, b) => b.score - a.score);
}
