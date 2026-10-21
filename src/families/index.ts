import type { AnyFamily, FamilyId } from './types';
import { A1 } from './a1';
import { B1 } from './b1';

export const FAMILIES: Partial<Record<FamilyId, AnyFamily>> = {
  A1: A1 as unknown as AnyFamily,
  B1: B1 as unknown as AnyFamily,
};

export function getFamily(id: string): AnyFamily | undefined {
  return FAMILIES[id.toUpperCase() as FamilyId];
}

export const familyList = (): AnyFamily[] => Object.values(FAMILIES) as AnyFamily[];
