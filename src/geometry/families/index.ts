import type { Kernel, Manifold } from '../kernel';
import type { FamilyId, Params } from '../../families/types';
import { buildA1, fitTestA1 } from './a1';
import { buildB1, fitTestB1 } from './b1';
import { buildA2, fitTestA2 } from './a2';
import { buildA3, fitTestA3 } from './a3';
import { buildB3, fitTestB3 } from './b3';
import { buildB2, fitTestB2 } from './b2';
import { buildC1, fitTestC1 } from './c1';
import { buildC2, fitTestC2 } from './c2';
import { buildC3, fitTestC3 } from './c3';

export interface GeometryBuilder {
  build(K: Kernel, p: Params): Manifold;
  fitTest(K: Kernel, p: Params): Manifold;
}

/**
 * Boolean unions of curved pieces can leave specks under 1 mm³ (numerical slivers). Drop them;
 * anything bigger is kept so real modelling errors still show up in the tests.
 */
export function dropSlivers(K: Kernel, m: Manifold): Manifold {
  const parts = m.decompose();
  if (parts.length <= 1) return m;
  const keep = parts.filter((x) => Math.abs(x.volume()) >= 1);
  return keep.length === parts.length ? m : K.Manifold.compose(keep);
}

const clean =
  (fn: (K: Kernel, p: Params) => Manifold) =>
  (K: Kernel, p: Params): Manifold =>
    dropSlivers(K, fn(K, p));

/* eslint-disable @typescript-eslint/no-explicit-any */
const RAW: Partial<Record<FamilyId, GeometryBuilder>> = {
  A1: { build: buildA1 as any, fitTest: fitTestA1 as any },
  A2: { build: buildA2 as any, fitTest: fitTestA2 as any },
  A3: { build: buildA3 as any, fitTest: fitTestA3 as any },
  B1: { build: buildB1 as any, fitTest: fitTestB1 as any },
  B2: { build: buildB2 as any, fitTest: fitTestB2 as any },
  B3: { build: buildB3 as any, fitTest: fitTestB3 as any },
  C1: { build: buildC1 as any, fitTest: fitTestC1 as any },
  C2: { build: buildC2 as any, fitTest: fitTestC2 as any },
  C3: { build: buildC3 as any, fitTest: fitTestC3 as any },
};

export const BUILDERS: Partial<Record<FamilyId, GeometryBuilder>> = Object.fromEntries(
  Object.entries(RAW).map(([id, b]) => [id, { build: clean(b!.build), fitTest: clean(b!.fitTest) }]),
);
