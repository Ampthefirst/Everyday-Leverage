import { dot3, norm3 } from '../types/geom';
import { fmt } from '../types/units';
import { vonMises, type MathLine } from './checks';
import type {
  CriticalSection,
  LoadCase,
  SectionResult,
  StrengthContext,
  Verdict,
  VerdictLevel,
} from './types';

export const JOINT_FACTOR = 0.5;
/** |cos| above this means the principal stress mostly crosses layer lines. */
const ACROSS_LAYERS_COS = 0.5;

export function levelFor(u: number): VerdictLevel {
  if (u < 0.6) return 'comfortable';
  if (u <= 1.0) return 'marginal';
  return 'fail';
}

export const LEVEL_LABEL: Record<VerdictLevel, string> = {
  comfortable: 'Comfortable',
  marginal: 'Marginal',
  fail: 'Likely to fail',
};

export function isAcrossLayers(
  direction: CriticalSection['direction'],
  buildDir: StrengthContext['buildDir'],
) {
  if (!direction) return false;
  return Math.abs(dot3(norm3(direction), norm3(buildDir))) > ACROSS_LAYERS_COS;
}

export function evaluateSection(cs: CriticalSection, ctx: StrengthContext, lc: LoadCase): SectionResult {
  const { strength, safetyFactor: SF } = ctx;
  const across = isAcrossLayers(cs.direction, ctx.buildDir);
  const layerF = across ? strength.zFraction : 1;
  const fatigueF = lc.repeated ? strength.fatigueFraction : 1;
  const jointF = ctx.split && cs.joint ? JOINT_FACTOR : 1;
  const allowable = strength.sigmaXY * layerF * fatigueF * jointF;

  const math: MathLine[] = [];
  let utilization: number;
  let equivalent = 0;

  if (cs.capacity) {
    const { demand, capacity, unit } = cs.capacity;
    utilization = (demand * SF) / capacity;
    math.push(...cs.capacity.math);
    math.push({
      label: 'Utilization u',
      expr: `u = demand·SF / capacity (SF = ${fmt(SF)})`,
      value: utilization,
      unit,
    });
  } else if (cs.stress) {
    const { sigma, tau } = cs.stress;
    math.push(...cs.stress.math);
    const vm = vonMises(sigma, tau);
    equivalent = cs.Kt * vm;
    if (sigma !== 0 && tau !== 0) {
      math.push({ label: 'Combined (von Mises)', expr: '√(σ² + 3τ²)', value: vm, unit: 'MPa' });
    } else if (tau !== 0) {
      math.push({ label: 'Equivalent stress', expr: '√3·τ (von Mises)', value: vm, unit: 'MPa' });
    }
    math.push({
      label: 'With stress concentration',
      expr: `Kt × ${fmt(vm, 2)} (Kt = ${fmt(cs.Kt)}${cs.ktReason ? `, ${cs.ktReason}` : ''})`,
      value: equivalent,
      unit: 'MPa',
    });
    const parts = [`σ_xy ${fmt(strength.sigmaXY)}`];
    if (across) parts.push(`× layer ${fmt(strength.zFraction, 2)}`);
    if (lc.repeated) parts.push(`× fatigue ${fmt(strength.fatigueFraction, 2)}`);
    if (jointF !== 1) parts.push(`× joint ${fmt(JOINT_FACTOR, 2)}`);
    math.push({ label: 'Allowable stress', expr: parts.join(' '), value: allowable, unit: 'MPa' });
    utilization = (equivalent * SF) / allowable;
    math.push({
      label: 'Utilization u',
      expr: `u = stress × SF / allowable (SF = ${fmt(SF)})`,
      value: utilization,
      unit: '',
    });
  } else {
    utilization = 0;
  }

  return {
    ...cs,
    acrossLayers: across,
    allowable,
    equivalent,
    utilization,
    level: levelFor(utilization),
    math,
  };
}

const CHECK_WORD: Record<CriticalSection['check'], string> = {
  bending: 'bending',
  torsion: 'twisting',
  combined: 'bending and twisting',
  bearing: 'crushing (bearing)',
  'tear-out': 'tear-out',
  buckling: 'buckling',
  loop: 'loop pulling',
  slip: 'slipping',
};

export function evaluate(sections: CriticalSection[], ctx: StrengthContext, lc: LoadCase): Verdict {
  if (sections.length === 0) throw new Error('No critical sections');
  const results = sections.map((s) => evaluateSection(s, ctx, lc));
  const governing = results.reduce((a, b) => (b.utilization > a.utilization ? b : a));
  const level = levelFor(governing.utilization);
  const pct = Math.round(governing.utilization * 100);
  const where = governing.label;
  const what = CHECK_WORD[governing.check];
  const layers = governing.acrossLayers ? ' The load runs across layer lines here.' : '';
  let reason: string;
  if (level === 'comfortable')
    reason = `Uses about ${pct}% of its strength budget; the busiest spot is ${what} ${where}.`;
  else if (level === 'marginal')
    reason = `Close to the limit (${pct}%) from ${what} ${where}.${layers} ${governing.fix}`;
  else reason = `Likely to fail from ${what} ${where} (${pct}% of the budget).${layers} ${governing.fix}`;
  return {
    level,
    utilization: governing.utilization,
    governing,
    sections: results,
    reason: reason.trim(),
    loadCase: lc,
    safetyFactor: ctx.safetyFactor,
    calibrated: ctx.strength.calibrated,
  };
}
