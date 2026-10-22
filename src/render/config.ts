import type { FamilyId } from '../families/types';
import type { Vec3 } from '../types/geom';

/**
 * Studio renders of each design, used on the home and picker tiles. One showcase preset per family,
 * printed in its group's filament colour. Regenerate with `npm run render:parts`.
 */
export interface RenderShot {
  preset?: string;
  /** Extra params on top of the preset. */
  params?: Record<string, number | string | boolean>;
  /** Camera direction from the subject (three.js world, Y up). */
  view?: Vec3;
  /** Skip these ghost kinds (e.g. a hand that would hide the part). */
  hideGhosts?: string[];
}

export const GROUP_FILAMENT: Record<'A' | 'B' | 'C', string> = {
  A: '#0fa3b6', // cyan PETG
  B: '#b8268f', // magenta PETG
  C: '#e09a12', // amber PETG
};

export const SHOTS: Record<FamilyId, RenderShot> = {
  A1: { preset: 'spoon' },
  A2: { preset: 'spoon' },
  A3: { preset: 'bit' },
  B1: { preset: 'jam', view: [300, 110, 300] },
  B2: { preset: 'house-key' },
  B3: { preset: 'tap', view: [300, 110, 300] },
  // The hook hand covers the small pull loop entirely, so this tile shows the pull on its zipper.
  C1: { preset: 'zipper', hideGhosts: ['hand'] },
  C2: { preset: 'lift' },
  C3: { preset: 'door' },
};

export const RENDER_SIZE = 1024;
