import type { AnyFamily, FamilyId } from './types';
import { A1 } from './a1';
import { B1 } from './b1';
import { A2 } from './a2';
import { A3 } from './a3';
import { B3 } from './b3';
import { B2 } from './b2';
import { C1 } from './c1';
import { C2 } from './c2';
import { C3 } from './c3';

export const FAMILIES: Partial<Record<FamilyId, AnyFamily>> = {
  A1: A1 as unknown as AnyFamily,
  A2: A2 as unknown as AnyFamily,
  A3: A3 as unknown as AnyFamily,
  B1: B1 as unknown as AnyFamily,
  B2: B2 as unknown as AnyFamily,
  B3: B3 as unknown as AnyFamily,
  C1: C1 as unknown as AnyFamily,
  C2: C2 as unknown as AnyFamily,
  C3: C3 as unknown as AnyFamily,
};

export function getFamily(id: string): AnyFamily | undefined {
  return FAMILIES[id.toUpperCase() as FamilyId];
}

export const familyList = (): AnyFamily[] => Object.values(FAMILIES) as AnyFamily[];
