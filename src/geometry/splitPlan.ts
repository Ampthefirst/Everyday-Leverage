import type { AnyFamily, Params } from '../families/types';
import type { SplitRequest } from './protocol';

/** Families that can be printed in two pieces decide where to cut from their parameters. */
export function splitPlanFor(family: AnyFamily, p: Params): SplitRequest | null {
  return family.splitPlan?.(p) ?? null;
}
