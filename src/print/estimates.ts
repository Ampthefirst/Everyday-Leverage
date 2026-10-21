import { MATERIALS } from '../strength/materials';
import type { PrintSettings } from '../strength/types';
import { shellThickness } from '../strength/types';

/** Rough volumetric print rate assumption (mm³/s). */
export const VOL_RATE = 8;
const FILAMENT_D = 1.75;

export interface Estimate {
  /** Printed plastic volume (mm³). */
  printedVolume: number;
  grams: number;
  metres: number;
  minutes: number;
}

/**
 * Shell + infill model: the shell is the surface area times the shell thickness (capped at the part
 * volume); the rest of the volume is filled at the infill density. Time is a rough volumetric rate.
 */
export function estimate(volume: number, surfaceArea: number, s: PrintSettings): Estimate {
  const shell = Math.min(volume, surfaceArea * shellThickness(s));
  const printed = shell + Math.max(0, volume - shell) * s.infill;
  const grams = (printed / 1000) * MATERIALS[s.material].density.value;
  const metres = printed / (Math.PI * (FILAMENT_D / 2) ** 2) / 1000;
  const minutes = printed / VOL_RATE / 60 + 6; // + heat-up and first layer
  return { printedVolume: printed, grams, metres, minutes };
}

export function formatDuration(min: number): string {
  if (min < 60) return `about ${Math.round(min / 5) * 5 || 5} min`;
  const h = Math.floor(min / 60);
  const m = Math.round((min - h * 60) / 5) * 5;
  return `about ${h} h${m ? ` ${m} min` : ''}`;
}
