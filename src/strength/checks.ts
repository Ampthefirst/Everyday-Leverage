import type { Section } from './sections';
import { bredtShear } from './sections';

/** One line in the "Show the math" panel. */
export interface MathLine {
  label: string;
  expr: string;
  value: number;
  unit: string;
}

export interface StressResult {
  /** Normal stress (MPa), before Kt. */
  sigma: number;
  /** Shear stress (MPa), before Kt. */
  tau: number;
  math: MathLine[];
}

/** Stress concentration factors (assumed). */
export const KT = {
  socket: 2.0,
  groove: 1.6,
  junctionSharp: 2.2,
  junctionFillet: 1.5,
  none: 1.0,
} as const;

export const junctionKt = (filletMm: number) => (filletMm >= 2 ? KT.junctionFillet : KT.junctionSharp);

/** Bending σ = M·c/I. */
export function bending(M: number, sec: Section): StressResult {
  const sigma = (M * sec.c) / sec.I;
  return {
    sigma,
    tau: 0,
    math: [
      { label: 'Bending moment M', expr: 'M', value: M, unit: 'N·mm' },
      { label: 'Second moment I', expr: 'I (shell + infill)', value: sec.I, unit: 'mm⁴' },
      { label: 'Bending stress σ', expr: 'σ = M·c / I', value: sigma, unit: 'MPa' },
    ],
  };
}

/** Torsion: round τ = T·r/J; thin-wall closed (Bredt) τ = T/(2·A_m·t); solid rect τ = T/(α·b·h²). */
export function torsion(T: number, sec: Section): StressResult {
  let tau: number;
  let expr: string;
  if (sec.torsion === 'round') {
    tau = (T * sec.c) / (sec.J ?? 2 * sec.I);
    expr = 'τ = T·r / J';
  } else if (sec.torsion === 'bredt') {
    tau = bredtShear(T, sec.Am!, sec.t);
    expr = 'τ = T / (2·A_m·t)';
  } else {
    const long = Math.max(sec.dims.b, sec.dims.h);
    const short = Math.min(sec.dims.b, sec.dims.h);
    tau = T / (sec.alpha! * long * short ** 2);
    expr = 'τ = T / (α·b·h²)';
  }
  return {
    sigma: 0,
    tau,
    math: [
      { label: 'Torque T', expr: 'T', value: T, unit: 'N·mm' },
      { label: 'Shear stress τ', expr, value: tau, unit: 'MPa' },
    ],
  };
}

/** Bearing on socket flats σ_b = T / (n·r_eff·A_flat). */
export function bearing(T: number, n: number, rEff: number, aFlat: number): StressResult {
  const sigma = T / (n * rEff * aFlat);
  return {
    sigma,
    tau: 0,
    math: [
      { label: 'Torque T', expr: 'T', value: T, unit: 'N·mm' },
      { label: 'Contact faces n', expr: 'n', value: n, unit: '' },
      { label: 'Effective radius r_eff', expr: 'r_eff', value: rEff, unit: 'mm' },
      { label: 'Contact area per face', expr: 'A_flat', value: aFlat, unit: 'mm²' },
      { label: 'Bearing stress σ_b', expr: 'σ_b = T / (n·r_eff·A_flat)', value: sigma, unit: 'MPa' },
    ],
  };
}

/** Strap/slot tear-out τ = F / (2·e·t), e = edge distance, t = thickness. */
export function tearOut(F: number, e: number, t: number): StressResult {
  const tau = F / (2 * e * t);
  return {
    sigma: 0,
    tau,
    math: [
      { label: 'Force F', expr: 'F', value: F, unit: 'N' },
      { label: 'Edge distance e', expr: 'e', value: e, unit: 'mm' },
      { label: 'Thickness t', expr: 't', value: t, unit: 'mm' },
      { label: 'Tear-out shear τ', expr: 'τ = F / (2·e·t)', value: tau, unit: 'MPa' },
    ],
  };
}

/** Euler buckling load F_cr = π²EI / (K·L)², K = 2 for a cantilever. */
export function eulerCritical(E: number, I: number, L: number, K = 2): number {
  return (Math.PI ** 2 * E * I) / (K * L) ** 2;
}

/** Curved-beam loop factor applied to loop stresses. */
export const LOOP_FACTOR = 1.3;

/**
 * Loop pulled at one point: each leg carries F/2 in tension, plus the ring bending moment at the
 * load point M ≈ 0.182·F·R (thin ring under diametral load), times the curved-beam factor 1.3.
 */
export function loopTension(F: number, R: number, sec: Section): StressResult {
  const axial = F / 2 / sec.A;
  const M = 0.182 * F * R;
  const bend = (M * sec.c) / sec.I;
  const sigma = LOOP_FACTOR * (axial + bend);
  return {
    sigma,
    tau: 0,
    math: [
      { label: 'Pull force F', expr: 'F', value: F, unit: 'N' },
      { label: 'Loop radius R', expr: 'R', value: R, unit: 'mm' },
      { label: 'Leg tension', expr: 'F / (2·A)', value: axial, unit: 'MPa' },
      { label: 'Ring moment M', expr: 'M ≈ 0.182·F·R', value: M, unit: 'N·mm' },
      { label: 'Loop stress σ', expr: 'σ = 1.3·(F/(2A) + M·c/I)', value: sigma, unit: 'MPa' },
    ],
  };
}

/** Von Mises combination of a normal and a shear stress. */
export const vonMises = (sigma: number, tau: number) => Math.sqrt(sigma ** 2 + 3 * tau ** 2);
