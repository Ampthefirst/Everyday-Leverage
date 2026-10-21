import type { AnyFamily, Params, ValidationIssue } from '../families/types';
import { schemaIssues } from '../families/schema';
import type { PrintSettings } from '../strength/types';
import { shellThickness } from '../strength/types';
import type { BedFit } from './bedfit';

export const SEVERITY_ORDER = { error: 0, warn: 1, info: 2 } as const;

/** All issues for a design: schema (ranges + cross-parameter), family rules, print settings, bed fit. */
export function validateDesign(
  family: AnyFamily,
  p: Params,
  print: PrintSettings,
  bed: BedFit | null,
  split: boolean,
): ValidationIssue[] {
  const out: ValidationIssue[] = [...schemaIssues(family.schema, p), ...family.rules(p)];
  const t = shellThickness(print);
  if (print.lineWidth * 2 < 0.8)
    out.push({
      severity: 'warn',
      message: 'Very thin lines make weak walls.',
      fix: 'Use a line width of at least 0.4 mm.',
    });
  if (print.walls < 3)
    out.push({
      severity: 'warn',
      message: `Only ${print.walls} walls (${t.toFixed(1)} mm shell).`,
      fix: 'Use at least 3 walls; the shell carries most of the load.',
    });
  if (print.infill < 0.15)
    out.push({
      severity: 'warn',
      message: 'Very low infill lets the walls buckle.',
      fix: 'Use at least 15% infill.',
    });
  if (print.layerHeight > 0.28)
    out.push({ severity: 'warn', message: 'Thick layers bond less well.', fix: 'Use 0.2–0.28 mm layers.' });
  if (bed && !bed.fits) {
    out.push(
      split
        ? {
            severity: 'info',
            message:
              'Too long for the bed in one piece — it will be printed in 2 parts with a dovetail joint.',
          }
        : { severity: 'error', message: bed.note, fix: 'Make it shorter.' },
    );
  } else if (bed?.placement === 'diagonal') out.push({ severity: 'info', message: bed.note });
  return out.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
