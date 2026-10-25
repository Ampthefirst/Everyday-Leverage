/**
 * Plain-words views of a design's parameters, for the Pick catalogue and the dashboard. Everything comes
 * from the family's own field definitions (labels, units, limits), never from the mesh.
 */
import type { Family, Params } from './types';

/** A design at its first task's sizes: what "Start from a task" opens with. */
export function showcaseParams(f: Family): Params {
  const p = f.presets[0];
  return f.repair({ ...f.defaults, ...(p?.params ?? {}) } as Params);
}

const num = (v: number) => (Math.round(v * 10) / 10).toString();

/** The fit measurements that apply to these sizes, as label and value: "Largest lid" · "40 mm". */
export function fitSizes(
  f: Family,
  params: Params,
  group: 'fit' | 'all' = 'fit',
): { label: string; value: string }[] {
  return f.fields
    .filter((x) => (group === 'all' || x.group === 'fit') && (!x.showIf || x.showIf(params)))
    .map((x) => {
      const v = params[x.key];
      const value =
        x.kind === 'choice'
          ? (x.options.find((o) => o.value === v)?.label ?? String(v))
          : x.kind === 'bool'
            ? v
              ? 'Yes'
              : 'No'
            : `${num(v as number)}${x.unit ? ` ${x.unit}` : ''}`;
      return { label: x.label, value };
    });
}

/** The range each millimetre fit measurement can take: "Largest lid 24–110 mm". */
export function sizeRanges(f: Family): string[] {
  return f.fields.flatMap((x) =>
    x.group === 'fit' && x.kind === 'number' && x.unit === 'mm' ? [`${x.label} ${x.min}–${x.max} mm`] : [],
  );
}
