/**
 * The home page's Fig. 1: the jar opener's own drawing, morphing between its handheld presets.
 * Pure helpers (no React) so the frames can be tested against `drawing()` at each preset.
 */
import type { Family, Params } from '../families/types';
import { flatten } from '../outputs/svg/render';
import { shapeBounds, type Bounds } from '../outputs/svg/ir';

/** The presets Fig. 1 cycles through, in order. */
export const HERO_PRESETS = ['jam', 'bottle', 'single'] as const;

export interface HeroStop {
  id: string;
  label: string;
  /** The preset exactly as the app opens it: what the figure shows at rest. */
  params: Params;
  /** The same sizes with a fixed step count, so neighbouring stops blend smoothly (rings slide, never pop). */
  blendable: Params;
}

export function heroStops(fam: Family): HeroStop[] {
  const raw = HERO_PRESETS.map((id) => fam.presets.find((p) => p.id === id)!);
  const params = raw.map((p) => fam.repair({ ...fam.defaults, ...p.params } as Params));
  const maxSteps = Math.max(...params.map((p) => p.steps as number));
  return raw.map((p, i) => {
    const q = params[i];
    // One step is the same drawing as several steps that all have the largest lid's size.
    const blendable = (q.steps as number) === 1 ? { ...q, steps: maxSteps, lidMin: q.lidMax } : q;
    return { id: p.id, label: p.label, params: q, blendable };
  });
}

/** Smooth start and end. */
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * Sizes part-way from a to b: numbers blend, anything else switches at the half-way point. Frames in
 * between are not presets, so they are drawn as they are, without `repair()`.
 */
export function blendParams(a: Params, b: Params, t: number): Params {
  const out: Params = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[k];
    const y = b[k];
    out[k] = typeof x === 'number' && typeof y === 'number' ? x + (y - x) * t : t < 0.5 ? (x ?? y) : (y ?? x);
  }
  return out;
}

/** One frame that holds every stop's top view, so the whole cycle keeps a single scale. */
export function heroBounds(fam: Family, stops: HeroStop[]): Bounds {
  return shapeBounds(stops.flatMap((s) => flatten(fam.drawing(s.params).views[0].shapes)));
}
