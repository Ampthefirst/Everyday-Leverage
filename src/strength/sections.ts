/**
 * Section properties for printed parts. A printed part is modelled as a hollow section whose shell
 * is t = walls × lineWidth thick, with the infilled core contributing infill × K_INFILL of its solid
 * stiffness. Perimeters are printed around holes too, so a bored tube gets a shell on both faces.
 */

/** Fraction of solid stiffness/strength an infilled core contributes per unit infill density (assumed). */
export const K_INFILL = 0.3;

export interface ShellSpec {
  /** Shell thickness t = walls × lineWidth (mm). */
  t: number;
  /** Infill density 0–1. */
  infill: number;
}

export type TorsionModel = 'round' | 'bredt' | 'solid-rect';

export interface Section {
  kind: 'round' | 'rect';
  /** Effective second moment about the bending axis (mm⁴). */
  I: number;
  /** Distance from neutral axis to extreme fibre (mm). */
  c: number;
  /** Effective polar moment (round only, mm⁴). */
  J?: number;
  /** Area of solid-equivalent material (mm²). */
  A: number;
  torsion: TorsionModel;
  /** Bredt: area enclosed by shell mid-line (mm²). */
  Am?: number;
  /** Shell thickness actually used (mm). */
  t: number;
  /** Solid rectangle torsion coefficient α (τ = T / (α b h²)). */
  alpha?: number;
  /** Dimensions for show-the-math. */
  dims: Record<string, number>;
  solid: boolean;
}

const Iann = (D: number, d: number) => (Math.PI / 64) * (D ** 4 - Math.max(0, d) ** 4);
const Aann = (D: number, d: number) => (Math.PI / 4) * (D ** 2 - Math.max(0, d) ** 2);

/**
 * Hollow round: outer diameter D with an optional bore d (empty space, e.g. where a shaft sits).
 */
export function roundSection(D: number, d: number, shell: ShellSpec): Section {
  const { t, infill } = shell;
  const kCore = infill * K_INFILL;
  const hasBore = d > 0;
  const coreOuter = D - 2 * t;
  const coreInner = hasBore ? d + 2 * t : 0;
  const solid = coreOuter <= coreInner;
  let I: number;
  let A: number;
  if (solid) {
    I = Iann(D, d);
    A = Aann(D, d);
  } else {
    I = Iann(D, coreOuter) + (hasBore ? Iann(coreInner, d) : 0) + kCore * Iann(coreOuter, coreInner);
    A = Aann(D, coreOuter) + (hasBore ? Aann(coreInner, d) : 0) + kCore * Aann(coreOuter, coreInner);
  }
  return {
    kind: 'round',
    I,
    c: D / 2,
    J: 2 * I,
    A,
    torsion: 'round',
    t,
    dims: { D, d },
    solid,
  };
}

/**
 * Rectangle b (width, along the bending axis) × h (depth, in the bending plane).
 * Rounded corners are ignored (slightly conservative).
 */
export function rectSection(b: number, h: number, shell: ShellSpec): Section {
  const { t, infill } = shell;
  const kCore = infill * K_INFILL;
  const solid = b <= 2 * t || h <= 2 * t;
  const Ifull = (b * h ** 3) / 12;
  if (solid) {
    const long = Math.max(b, h);
    const short = Math.min(b, h);
    const alpha = 1 / (3 + 1.8 * (short / long));
    return {
      kind: 'rect',
      I: Ifull,
      c: h / 2,
      A: b * h,
      torsion: 'solid-rect',
      t,
      alpha,
      dims: { b, h },
      solid,
    };
  }
  const bi = b - 2 * t;
  const hi = h - 2 * t;
  const Icore = (bi * hi ** 3) / 12;
  const I = Ifull - Icore + kCore * Icore;
  const A = b * h - bi * hi + kCore * bi * hi;
  return {
    kind: 'rect',
    I,
    c: h / 2,
    A,
    torsion: 'bredt',
    Am: (b - t) * (h - t),
    t,
    dims: { b, h },
    solid,
  };
}

/** Thin-walled closed tube of any outline: Bredt torsion only. */
export function bredtShear(T: number, Am: number, t: number): number {
  return T / (2 * Am * t);
}
