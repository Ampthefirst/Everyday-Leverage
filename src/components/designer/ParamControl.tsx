import type { FieldDef, Params } from '../../families/types';
import { Choice, NumberSlider, Toggle } from '../Field';

export function ParamControl({
  field,
  params,
  onChange,
  onMeasure,
}: {
  field: FieldDef<Params>;
  params: Params;
  onChange: (key: string, v: number | string | boolean) => void;
  onMeasure?: (stepId: string) => void;
}) {
  if (field.showIf && !field.showIf(params)) return null;
  const aside =
    field.measure && onMeasure ? (
      <button
        type="button"
        className="tap text-sm font-semibold text-primary underline"
        onClick={() => onMeasure(field.measure!)}
      >
        How to measure
      </button>
    ) : undefined;
  if (field.kind === 'number') {
    const [lo, hi] = field.range ? field.range(params) : [field.min, field.max];
    return (
      <NumberSlider
        label={field.label}
        value={params[field.key] as number}
        min={Math.max(field.min, lo)}
        max={Math.min(field.max, hi)}
        step={field.step}
        unit={field.unit}
        help={field.help}
        aside={aside}
        onChange={(v) => onChange(field.key, v)}
      />
    );
  }
  if (field.kind === 'choice') {
    return (
      <div>
        <Choice
          label={field.label}
          value={params[field.key] as string}
          options={field.options}
          onChange={(v) => onChange(field.key, v)}
          help={field.help}
        />
        {aside}
      </div>
    );
  }
  return (
    <Toggle
      label={field.label}
      checked={params[field.key] as boolean}
      onChange={(v) => onChange(field.key, v)}
      help={field.help}
    />
  );
}
