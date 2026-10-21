import type { VerdictLevel } from '../strength/types';
import { LEVEL_LABEL } from '../strength/evaluate';

const MAX = 1.5;

/** Traffic-light meter: comfortable < 0.6 ≤ marginal ≤ 1.0 < likely to fail. */
export function Meter({ u, level }: { u: number; level: VerdictLevel }) {
  const pct = Math.round(u * 100);
  const pos = Math.min(1, u / MAX) * 100;
  const color = level === 'comfortable' ? 'text-ok' : level === 'marginal' ? 'text-warn' : 'text-bad';
  const icon = level === 'comfortable' ? '✓' : level === 'marginal' ? '!' : '✕';
  return (
    <div>
      <div className={`flex items-center gap-2 text-2xl font-bold ${color}`}>
        <span
          aria-hidden="true"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border-4 border-current text-xl"
        >
          {icon}
        </span>
        {LEVEL_LABEL[level]}
      </div>
      <div
        role="meter"
        aria-label="Strength"
        aria-valuemin={0}
        aria-valuemax={MAX * 100}
        aria-valuenow={pct}
        aria-valuetext={`${LEVEL_LABEL[level]}: uses ${pct}% of the strength budget`}
        className="relative mt-3 h-6 overflow-hidden rounded-full border border-border"
      >
        <div className="absolute inset-y-0 left-0 bg-ok" style={{ width: `${(0.6 / MAX) * 100}%` }} />
        <div
          className="absolute inset-y-0 bg-warn"
          style={{ left: `${(0.6 / MAX) * 100}%`, width: `${(0.4 / MAX) * 100}%` }}
        />
        <div className="absolute inset-y-0 right-0 bg-bad" style={{ width: `${(0.5 / MAX) * 100}%` }} />
        <div
          className="absolute inset-y-[-2px] w-1.5 rounded bg-text ring-2 ring-surface"
          style={{ left: `calc(${pos}% - 3px)` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted" aria-hidden="true">
        <span>0%</span>
        <span style={{ marginLeft: '20%' }}>60%</span>
        <span>100%</span>
        <span>150%+</span>
      </div>
    </div>
  );
}
