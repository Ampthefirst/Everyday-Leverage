import type { Verdict } from '../strength/types';
import { displayLoad } from '../strength/loads';
import { LEVEL_LABEL } from '../strength/evaluate';

/** Computed facts sent to /api/explain. Every number here is the only number the reply may use. */
export interface ComputedFacts {
  design: string;
  verdict: string;
  utilizationPercent: number;
  where: string;
  check: string;
  load: { label: string; value: number; unit: string; assumed: boolean };
  safetyFactor: number;
  material: string;
  calibrated: boolean;
  fix: string;
  acrossLayers: boolean;
}

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

export function factsFrom(design: string, v: Verdict, material: string): ComputedFacts {
  const lc = displayLoad(v.loadCase);
  return {
    design,
    verdict: LEVEL_LABEL[v.level],
    utilizationPercent: Math.round(v.utilization * 100),
    where: v.governing.label,
    check: v.governing.check,
    load: { label: v.loadCase.label, value: round(lc.value), unit: lc.unit, assumed: v.loadCase.assumed },
    safetyFactor: round(v.safetyFactor, 1),
    material,
    calibrated: v.calibrated,
    fix: v.governing.fix,
    acrossLayers: v.governing.acrossLayers,
  };
}

/** The offline / fallback wording, built only from the facts. */
export function templateExplanation(f: ComputedFacts): string {
  const load = `${f.load.label.toLowerCase()} (${f.load.value} ${f.load.unit}${f.load.assumed ? ', a typical value' : ''})`;
  const head =
    f.verdict === 'Comfortable'
      ? `This ${f.design.toLowerCase()} should cope well with ${load}: it uses about ${f.utilizationPercent}% of its strength budget.`
      : f.verdict === 'Marginal'
        ? `This ${f.design.toLowerCase()} is close to its limit for ${load}: about ${f.utilizationPercent}% of its strength budget.`
        : `This ${f.design.toLowerCase()} would likely break under ${load}: about ${f.utilizationPercent}% of its strength budget.`;
  const where = ` The busiest spot is ${f.where}.`;
  const layers = f.acrossLayers
    ? ' There the load runs across the printed layers, which are the weak direction.'
    : '';
  const sf = ` That already includes a safety factor of ${f.safetyFactor}.`;
  const fix = f.verdict === 'Comfortable' ? '' : ` ${f.fix}`;
  const cal = f.calibrated
    ? ''
    : ' These are estimates from published material data, not tests on your printer.';
  return head + where + layers + sf + fix + cal;
}
