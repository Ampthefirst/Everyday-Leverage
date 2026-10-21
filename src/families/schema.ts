import { z } from 'zod';
import type { FieldDef, Params, ValidationIssue } from './types';

/**
 * Builds the zod schema for a family from its field list (independent ranges) plus a cross-parameter
 * constraint function (dependencies such as "the grip must enclose the shaft").
 */
export function buildSchema<P extends Params>(
  fields: FieldDef<P>[],
  constraints: (p: P) => ValidationIssue[],
): z.ZodType<P> {
  const shape: Record<string, z.ZodType> = {};
  for (const f of fields) {
    if (f.kind === 'number') {
      shape[f.key] = z
        .number({ error: `${f.label} must be a number` })
        .min(f.min, { error: `${f.label} must be at least ${f.min}${f.unit ? ' ' + f.unit : ''}` })
        .max(f.max, { error: `${f.label} must be at most ${f.max}${f.unit ? ' ' + f.unit : ''}` });
    } else if (f.kind === 'choice') {
      shape[f.key] = z.enum(f.options.map((o) => o.value) as [string, ...string[]]);
    } else {
      shape[f.key] = z.boolean();
    }
  }
  return z.object(shape).superRefine((val, ctx) => {
    for (const issue of constraints(val as P)) {
      if (issue.severity !== 'error') continue;
      ctx.addIssue({
        code: 'custom',
        message: issue.fix ? `${issue.message} ${issue.fix}` : issue.message,
        path: issue.param ? [issue.param] : [],
      });
    }
  }) as unknown as z.ZodType<P>;
}

export function defaultsOf<P extends Params>(fields: FieldDef<P>[]): P {
  const out: Params = {};
  for (const f of fields) out[f.key] = f.default;
  return out as P;
}

/** Coerce arbitrary input (e.g. from a share link) onto the field list: fill defaults, clamp numbers. */
export function coerceParams<P extends Params>(
  fields: FieldDef<P>[],
  raw: Partial<Record<string, unknown>>,
): P {
  const out: Params = {};
  for (const f of fields) {
    const v = raw[f.key];
    if (f.kind === 'number') {
      const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
      out[f.key] = Number.isFinite(n) ? Math.min(f.max, Math.max(f.min, n)) : f.default;
    } else if (f.kind === 'choice') {
      out[f.key] = typeof v === 'string' && f.options.some((o) => o.value === v) ? v : f.default;
    } else {
      out[f.key] = typeof v === 'boolean' ? v : v === 'true' ? true : v === 'false' ? false : f.default;
    }
  }
  return out as P;
}

/** Turn zod errors into plain issues. */
export function schemaIssues<P extends Params>(schema: z.ZodType<P>, p: P): ValidationIssue[] {
  const r = schema.safeParse(p);
  if (r.success) return [];
  return r.error.issues.map((i) => ({
    severity: 'error' as const,
    message: i.message,
    param: i.path.length ? String(i.path[0]) : undefined,
  }));
}
