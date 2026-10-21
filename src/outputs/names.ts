import type { AnyFamily, Params } from '../families/types';

export const baseName = (family: AnyFamily, p: Params) =>
  `everyday-leverage-${family.id.toLowerCase()}-${family.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+$/, '')}-${family.sizeTag(p)}`;
