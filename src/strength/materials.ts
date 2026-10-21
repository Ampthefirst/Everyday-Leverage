/**
 * Material constants for FDM-printed parts. All values are typical published figures with standard
 * FDM reductions; they are assumptions until the user calibrates (see calibration.ts).
 */
export type MaterialId = 'PLA' | 'PETG';

export interface Sourced<T> {
  value: T;
  source: string;
  assumed: true;
}

export interface Material {
  id: MaterialId;
  name: string;
  /** In-plane printed tensile strength σ_xy (MPa). */
  sigmaXY: Sourced<number>;
  /** Interlayer (Z) strength as a fraction of σ_xy. */
  zFraction: Sourced<number>;
  /** Young's modulus (MPa). */
  E: Sourced<number>;
  /** Shear strength ≈ shearFactor · σ. */
  shearFactor: Sourced<number>;
  /** Softening temperature range (°C). */
  softeningC: Sourced<[number, number]>;
  creep: Sourced<'high' | 'moderate'>;
  /** Fraction of σ allowed under repeated (fatigue) loading. */
  fatigueFraction: Sourced<number>;
  /** Density (g/cm³) for filament estimates. */
  density: Sourced<number>;
  summary: string;
}

const s = <T>(value: T, source: string): Sourced<T> => ({ value, source, assumed: true });

const DATASHEETS = 'Typical manufacturer datasheets (e.g. Prusament, Polymaker) for printed specimens';

export const MATERIALS: Record<MaterialId, Material> = {
  PLA: {
    id: 'PLA',
    name: 'PLA',
    sigmaXY: s(45, `${DATASHEETS}; in-plane printed tensile, rounded down`),
    zFraction: s(0.55, 'Published Z-direction tensile tests on FDM PLA typically report 40–70% of in-plane'),
    E: s(3300, 'Typical PLA tensile modulus 3.0–3.6 GPa'),
    shearFactor: s(0.6, 'Common approximation: shear strength ≈ 0.6 × tensile strength'),
    softeningC: s([55, 60], 'PLA glass transition ≈ 55–60 °C'),
    creep: s('high', 'PLA creeps noticeably under sustained load at room temperature'),
    fatigueFraction: s(0.35, 'Conservative endurance fraction for printed PLA under repeated loading'),
    density: s(1.24, 'PLA density ≈ 1.24 g/cm³'),
    summary: 'Stiff and easy to print, but brittle. Softens around 55–60 °C and creeps under steady load.',
  },
  PETG: {
    id: 'PETG',
    name: 'PETG',
    sigmaXY: s(40, `${DATASHEETS}; in-plane printed tensile, rounded down`),
    zFraction: s(0.7, 'PETG layer adhesion is better than PLA; published Z tests ≈ 60–80% of in-plane'),
    E: s(2000, 'Typical PETG tensile modulus 1.9–2.1 GPa'),
    shearFactor: s(0.6, 'Common approximation: shear strength ≈ 0.6 × tensile strength'),
    softeningC: s([70, 80], 'PETG glass transition ≈ 75–80 °C'),
    creep: s('moderate', 'PETG creeps less than PLA under steady load'),
    fatigueFraction: s(0.45, 'Conservative endurance fraction for printed PETG under repeated loading'),
    density: s(1.27, 'PETG density ≈ 1.27 g/cm³'),
    summary: 'Tougher, bends before it breaks, and has better layer adhesion. Softens around 70–80 °C.',
  },
};

/** Effective strength constants after calibration (if any) is applied. */
export interface Strength {
  sigmaXY: number;
  zFraction: number;
  E: number;
  shearFactor: number;
  fatigueFraction: number;
  calibrated: boolean;
}

export function baseStrength(id: MaterialId): Strength {
  const m = MATERIALS[id];
  return {
    sigmaXY: m.sigmaXY.value,
    zFraction: m.zFraction.value,
    E: m.E.value,
    shearFactor: m.shearFactor.value,
    fatigueFraction: m.fatigueFraction.value,
    calibrated: false,
  };
}
