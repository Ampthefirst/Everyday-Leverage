import type { AnyFamily, Params, UseContext, ValidationIssue } from '../families/types';
import type { CalibrationProfile } from '../strength/calibration';
import { effectiveStrength } from '../strength/calibration';
import { evaluate } from '../strength/evaluate';
import { buildField, type StressFieldFn } from '../strength/field';
import type { LoadCase, PrintSettings, StrengthContext, Verdict } from '../strength/types';
import { shellThickness } from '../strength/types';
import { recommendSettings, type SettingAdvice } from '../print/settings';
import { rankOrientations, type RankedOrientation } from '../print/orientation';
import { checkBedFit, rotatedSize, type BedFit } from '../print/bedfit';
import { validateDesign } from '../print/validator';
import { estimate, type Estimate } from '../print/estimates';
import type { Vec3 } from '../types/geom';

export interface GeometryInfo {
  size: Vec3;
  volume: number;
  surfaceArea: number;
  split: boolean;
}

export interface Analysis {
  family: AnyFamily;
  params: Params;
  print: PrintSettings;
  advice: SettingAdvice;
  loadCases: LoadCase[];
  verdicts: Verdict[];
  /** Worst verdict across load cases. */
  verdict: Verdict;
  field: StressFieldFn;
  orientations: RankedOrientation[];
  orientation: RankedOrientation;
  bed: BedFit | null;
  issues: ValidationIssue[];
  estimate: Estimate | null;
  calibration: CalibrationProfile | null;
  split: boolean;
}

export function analyse(args: {
  family: AnyFamily;
  params: Params;
  use: UseContext;
  print: PrintSettings | null;
  safetyFactor: number;
  orientationId: string;
  calibrationFor: (m: PrintSettings['material']) => CalibrationProfile | null;
  geometry: GeometryInfo | null;
}): Analysis {
  const { family, params: p, use, safetyFactor } = args;
  const advice = recommendSettings(family, use.location);
  const print = args.print ?? advice.settings;
  const calibration = args.calibrationFor(print.material);
  const strength = effectiveStrength(print.material, calibration);
  const split = !!args.geometry?.split;
  const base: Omit<StrengthContext, 'buildDir'> = { print, strength, safetyFactor, split };
  const loadCases = family.loadCases(p, use);
  const sectionsFor = (lc: LoadCase) => family.criticalSections(p, lc, print);
  const orientations = rankOrientations(family, p, loadCases, sectionsFor, base, args.geometry?.size ?? null);
  const orientation = orientations.find((o) => o.candidate.id === args.orientationId) ?? orientations[0];
  const ctx: StrengthContext = { ...base, buildDir: orientation.candidate.buildDir };
  const verdicts = loadCases.map((lc) => evaluate(sectionsFor(lc), ctx, lc));
  const verdict = verdicts.reduce((a, b) => (b.utilization > a.utilization ? b : a));
  const field =
    family.stressField?.(p, verdict.loadCase) ?? buildField(verdict.sections, shellThickness(print));
  const bed = args.geometry
    ? checkBedFit(rotatedSize(args.geometry.size, orientation.candidate.rotation))
    : null;
  const issues = validateDesign(family, p, print, bed, split);
  // Overhangs: the chosen placement says whether supports are needed.
  const sup = orientation.candidate.supports;
  if (sup !== 'none')
    issues.push({
      severity: sup === 'needed' ? 'warn' : 'info',
      message:
        sup === 'needed'
          ? `Placed ${orientation.candidate.label.toLowerCase()}, this part has overhangs that need supports.`
          : 'A few small supports may help with overhangs (supports touching the build plate only).',
      fix:
        sup === 'needed' ? 'Turn on supports in the slicer, or choose the recommended placement.' : undefined,
    });
  const est = args.geometry ? estimate(args.geometry.volume, args.geometry.surfaceArea, print) : null;
  return {
    family,
    params: p,
    print,
    advice,
    loadCases,
    verdicts,
    verdict,
    field,
    orientations,
    orientation,
    bed,
    issues,
    estimate: est,
    calibration,
    split,
  };
}
