import type { z } from 'zod';
import type { Vec3 } from '../types/geom';
import type { View, Shape } from '../outputs/svg/ir';
import type { LoadLevel } from '../strength/loads';
import type { CriticalSection, LoadCase, PrintSettings } from '../strength/types';
import type { StressFieldFn } from '../strength/field';

export type FamilyId = 'A1' | 'A2' | 'A3' | 'B1' | 'B2' | 'B3' | 'C1' | 'C2' | 'C3';
export type FamilyGroup = 'A' | 'B' | 'C';

export const FAMILY_IDS: FamilyId[] = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];

export type Params = Record<string, number | string | boolean>;

// ---------- parameters ----------

export type FieldGroup = 'fit' | 'style' | 'fine';

interface FieldBase<P> {
  key: keyof P & string;
  label: string;
  help?: string;
  group: FieldGroup;
  /** Measurement guide step that explains how to measure this value. */
  measure?: string;
  /** Hide the control when it does not apply. */
  showIf?: (p: P) => boolean;
}

export interface NumberField<P> extends FieldBase<P> {
  kind: 'number';
  min: number;
  max: number;
  step: number;
  unit?: string;
  default: number;
  /** Narrower live range derived from other parameters (UI clamps the slider to this). */
  range?: (p: P) => [number, number];
}

export interface ChoiceField<P> extends FieldBase<P> {
  kind: 'choice';
  options: { value: string; label: string; hint?: string }[];
  default: string;
}

export interface BoolField<P> extends FieldBase<P> {
  kind: 'bool';
  default: boolean;
}

export type FieldDef<P> = NumberField<P> | ChoiceField<P> | BoolField<P>;

// ---------- validation ----------

export type Severity = 'error' | 'warn' | 'info';

export interface ValidationIssue {
  severity: Severity;
  message: string;
  /** Plain fix, e.g. "Increase grip diameter to at least 26 mm". */
  fix?: string;
  param?: string;
}

// ---------- presets / variants ----------

export interface Preset<P> {
  id: string;
  label: string;
  description: string;
  params: Partial<P>;
}

export interface VariantDef<P> {
  id: string;
  label: string;
  description: string;
  patch: Partial<P>;
}

// ---------- use / loads ----------

export type UseLocation = 'kitchen' | 'bathroom' | 'desk' | 'outdoors' | 'car' | 'other';

export interface UseContext {
  level: LoadLevel;
  location: UseLocation;
  /** Override of the primary load in display units (N·m or N). */
  loadOverride?: number;
}

// ---------- 2D outputs ----------

export interface DrawingSpec {
  views: View[];
  /** Key dimensions with tolerances for the table. */
  keyDims: { label: string; value: string; tol?: string }[];
  notes: string[];
}

export interface TemplateItem {
  title: string;
  /** Shapes at 1:1 in mm. */
  shapes: Shape[];
  instruction: string;
}

export interface TemplateSpec {
  items: TemplateItem[];
}

export interface NetSpec {
  title: string;
  shapes: Shape[];
  instruction: string;
}

// ---------- 3D context ----------

export type GhostKind =
  | 'jar'
  | 'bottle'
  | 'utensil'
  | 'pen'
  | 'toothbrush'
  | 'key'
  | 'knob'
  | 'faucetCross'
  | 'faucetLever'
  | 'stoveKnob'
  | 'drawer'
  | 'zipper'
  | 'canTab'
  | 'button'
  | 'doorLever'
  | 'tool'
  | 'hand';

export interface GhostObject {
  kind: GhostKind;
  /** Sizes in mm; meaning depends on kind. */
  size: Partial<Record<string, number>>;
  position: Vec3;
  /** Euler XYZ in degrees. */
  rotation?: Vec3;
  /** Hand only. */
  hand?: 'left' | 'right';
  pose?: 'grip' | 'pinch' | 'palm' | 'hook' | 'point';
}

export interface GhostSpec {
  objects: GhostObject[];
}

export interface Pose {
  /** Rotation in degrees about `axis` through `pivot`. */
  rotate?: { axis: Vec3; pivot: Vec3; deg: number };
  translate?: Vec3;
}

export interface AnimationStep {
  caption: string;
  part: Pose;
  /** Ghost indices that move with the part in this step. */
  ghosts?: number[];
}

export interface AnimationSpec {
  steps: AnimationStep[];
}

export interface OrientationCandidate {
  id: string;
  label: string;
  /** Rotation (Euler XYZ deg) taking the part frame to the print frame (Z up). */
  rotation: Vec3;
  /** Part-frame direction pointing up when printed. */
  buildDir: Vec3;
  supports: 'none' | 'minimal' | 'needed';
  note: string;
}

export interface OrientationAdvice {
  candidates: OrientationCandidate[];
}

export type IllustrationId =
  | 'shaftCaliper'
  | 'shaftWrap'
  | 'handBreadth'
  | 'palmCircumference'
  | 'lidDiameter'
  | 'keyBlade'
  | 'knobDiameter'
  | 'capProfile'
  | 'holeSize'
  | 'buttonSize'
  | 'reachDistance'
  | 'leverDiameter'
  | 'toolShank';

export interface MeasureStep {
  id: string;
  title: string;
  text: string;
  illustration: IllustrationId;
  tip?: string;
}

// ---------- the contract ----------

export interface Family<P extends Params = Params> {
  id: FamilyId;
  group: FamilyGroup;
  name: string;
  /** One-sentence plain-language description. */
  blurb: string;
  /** One-sentence physics: how it adds leverage. */
  leverage: string;
  fields: FieldDef<P>[];
  schema: z.ZodType<P>;
  defaults: P;
  presets: Preset<P>[];
  variants: VariantDef<P>[];
  /** Load cases; the first is the primary one shown on the meter. */
  loadCases(p: P, use: UseContext): LoadCase[];
  criticalSections(p: P, lc: LoadCase, print: PrintSettings): CriticalSection[];
  /** Optional override; the default builds the field from the evaluated sections. */
  stressField?(p: P, lc: LoadCase): StressFieldFn;
  drawing(p: P): DrawingSpec;
  template(p: P): TemplateSpec;
  net?(p: P): NetSpec;
  ghost(p: P): GhostSpec;
  animation(p: P): AnimationSpec;
  orientation(p: P): OrientationAdvice;
  measureGuide: MeasureStep[];
  /**
   * Adjust dependent parameters so the cross-parameter constraints hold, never changing `keep`
   * (the parameter the user just changed). Returns the repaired params.
   */
  repair(p: P, keep?: keyof P & string): P;
  /** A known-invalid parameter combination (used by tests to prove the constraints bite). */
  invalidExample?: Partial<P>;
  /** Family-specific printability and fit rules (beyond the schema). */
  rules(p: P): ValidationIssue[];
  /** Axis to slice along for the cross-section view (part frame). */
  sectionAxis: 'x' | 'y' | 'z';
  /** Text stamped on the part, e.g. "B1-68". */
  stamp(p: P): string;
  /** Short size tag used in file names. */
  sizeTag(p: P): string;
  /** Rotation (Euler XYZ deg) applied to part and ghosts in the viewer so the part shows in its use pose. */
  displayRotation?: Vec3;
  /** Can be split when it does not fit the bed. */
  splittable?: boolean;
  /** Where to cut when the part is too long for the bed; null when it fits in one piece. */
  splitPlan?(p: P): { axis: 'x' | 'y' | 'z'; at: number } | null;
}

export type AnyFamily = Family<Params>;
