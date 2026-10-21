import type { Kernel, Manifold } from '../kernel';
import type { FamilyId, Params } from '../../families/types';
import { buildA1, fitTestA1 } from './a1';
import { buildB1, fitTestB1 } from './b1';

export interface GeometryBuilder {
  build(K: Kernel, p: Params): Manifold;
  fitTest(K: Kernel, p: Params): Manifold;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const BUILDERS: Partial<Record<FamilyId, GeometryBuilder>> = {
  A1: { build: buildA1 as any, fitTest: fitTestA1 as any },
  B1: { build: buildB1 as any, fitTest: fitTestB1 as any },
};
