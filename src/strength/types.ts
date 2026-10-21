import type { Vec3 } from '../types/geom';
import type { MaterialId, Strength } from './materials';
import type { MathLine, StressResult } from './checks';

export interface PrintSettings {
  material: MaterialId;
  /** Perimeter (wall) count. */
  walls: number;
  /** Extrusion line width (mm). */
  lineWidth: number;
  /** Infill density 0–1. */
  infill: number;
  /** Layer height (mm). */
  layerHeight: number;
}

export const DEFAULT_PRINT: PrintSettings = {
  material: 'PETG',
  walls: 4,
  lineWidth: 0.45,
  infill: 0.3,
  layerHeight: 0.2,
};

export const shellThickness = (p: PrintSettings) => p.walls * p.lineWidth;

export type LoadKind = 'torque' | 'force';

export interface LoadCase {
  id: string;
  label: string;
  kind: LoadKind;
  /** N·mm for torque, N for force — already scaled by the load level. */
  value: number;
  /** Unscaled default (same units). */
  base: number;
  assumed: boolean;
  /** Repeated twisting/pulling: allowable is reduced by the fatigue fraction. */
  repeated?: boolean;
}

/** Spatial shape used by the heat-map. All points are in the part frame (mm). */
export type FieldZone =
  /** Moment distribution along a lever: full at `from` (root), zero at `to` (tip). */
  | { type: 'lever'; from: Vec3; to: Vec3; radius: number }
  /** Constant along a segment (e.g. torsion along a shaft). */
  | { type: 'segment'; from: Vec3; to: Vec3; radius: number }
  /** Local feature (socket, slot, groove): smooth falloff around a point. */
  | { type: 'point'; at: Vec3; radius: number };

export type CheckKind =
  'bending' | 'torsion' | 'combined' | 'bearing' | 'tear-out' | 'buckling' | 'loop' | 'slip';

/** What a family reports for one critical section under one load case. */
export interface CriticalSection {
  id: string;
  /** Plain-language place, e.g. "where the lever meets the cup". */
  label: string;
  check: CheckKind;
  /** Anchor point in the part frame (mm). */
  at: Vec3;
  /** Principal stress direction in the part frame; null when layer direction does not matter (bearing). */
  direction: Vec3 | null;
  Kt: number;
  ktReason?: string;
  /** Stress-based check. */
  stress?: StressResult;
  /** Capacity-based check (buckling, slip): u = demand·SF / capacity. */
  capacity?: { demand: number; capacity: number; unit: string; math: MathLine[] };
  zone: FieldZone;
  /** Plain fix when this section is the problem. */
  fix: string;
  /** Lies on an auto-split joint: joint strength factor applies. */
  joint?: boolean;
}

export interface StrengthContext {
  print: PrintSettings;
  strength: Strength;
  safetyFactor: number;
  /** Part-frame direction that points up (build Z) when printed. */
  buildDir: Vec3;
  /** Printed in pieces: joint strength factor applies to joint sections. */
  split: boolean;
}

export type VerdictLevel = 'comfortable' | 'marginal' | 'fail';

export interface SectionResult extends CriticalSection {
  acrossLayers: boolean;
  /** Allowable stress after layer, fatigue and joint reductions (MPa). */
  allowable: number;
  /** Equivalent stress incl. Kt (MPa) — stress checks only. */
  equivalent: number;
  utilization: number;
  level: VerdictLevel;
  math: MathLine[];
}

export interface Verdict {
  level: VerdictLevel;
  utilization: number;
  governing: SectionResult;
  sections: SectionResult[];
  reason: string;
  loadCase: LoadCase;
  safetyFactor: number;
  calibrated: boolean;
}
