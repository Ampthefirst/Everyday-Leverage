import { useEffect, useId, useState, type ReactNode } from 'react';

interface NumberSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  help?: ReactNode;
  onChange: (v: number) => void;
  /** Optional link/button rendered next to the label (e.g. "How to measure"). */
  aside?: ReactNode;
  disabled?: boolean;
}

function decimals(step: number) {
  const s = String(step);
  return s.includes('.') ? s.split('.')[1].length : 0;
}

/** Slider + number box pair. Both are labelled; the number box accepts typed values. */
export function NumberSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  help,
  onChange,
  aside,
  disabled,
}: NumberSliderProps) {
  const id = useId();
  const [text, setText] = useState(String(value));
  useEffect(() => setText(value.toFixed(decimals(step)).replace(/\.0+$/, '')), [value, step]);

  const commit = (raw: string) => {
    const v = Number(raw);
    if (!Number.isFinite(v)) {
      setText(String(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, v));
    onChange(clamped);
    setText(String(clamped));
  };

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={`${id}-n`} className="font-semibold">
          {label}
        </label>
        {aside}
      </div>
      <div className="flex items-center gap-3">
        <input
          id={`${id}-r`}
          type="range"
          aria-label={`${label} slider`}
          aria-describedby={help ? `${id}-h` : undefined}
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="min-w-0 flex-1"
        />
        <div className="flex items-center gap-1">
          <input
            id={`${id}-n`}
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={step}
            value={text}
            disabled={disabled}
            aria-describedby={help ? `${id}-h` : undefined}
            onChange={(e) => setText(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit((e.target as HTMLInputElement).value);
            }}
            className="tap w-24 rounded-lg border border-border bg-surface px-2 text-right"
          />
          {unit && <span className="w-10 text-sm text-muted">{unit}</span>}
        </div>
      </div>
      {help && (
        <p id={`${id}-h`} className="text-sm text-muted">
          {help}
        </p>
      )}
    </div>
  );
}

interface ChoiceProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
  help?: ReactNode;
}

/** Segmented radio group with big targets. */
export function Choice<T extends string>({ label, value, options, onChange, help }: ChoiceProps<T>) {
  const id = useId();
  return (
    <fieldset className="space-y-1">
      <legend className="font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={`tap flex cursor-pointer items-center rounded-xl border-2 px-3 py-1 ${value === o.value ? 'border-primary bg-surface-2 font-semibold text-primary' : 'border-border bg-surface'}`}
            title={o.hint}
          >
            <input
              type="radio"
              name={id}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
      {help && <p className="text-sm text-muted">{help}</p>}
    </fieldset>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  help,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  help?: ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="tap flex cursor-pointer items-center gap-3">
        <span className="relative inline-flex">
          <input
            id={id}
            type="checkbox"
            role="switch"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="peer sr-only"
          />
          <span className="block h-7 w-12 rounded-full border-2 border-border bg-surface-2 peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-focus)]" />
          <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-text transition-transform peer-checked:translate-x-5 peer-checked:bg-on-primary" />
        </span>
        <span className="font-semibold">{label}</span>
      </label>
      {help && <p className="ml-15 text-sm text-muted">{help}</p>}
    </div>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="tap block w-full rounded-lg border border-border bg-surface px-3"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
