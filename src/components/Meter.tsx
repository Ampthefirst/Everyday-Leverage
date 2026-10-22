import type { VerdictLevel } from '../strength/types';
import { LEVEL_LABEL } from '../strength/evaluate';

const MAX = 1.5;
const CELLS = 30;

/**
 * Instrument-style strength readout: the verdict and the share of the strength budget used, over a
 * block bar in three zones (comfortable < 60 % ≤ marginal ≤ 100 % < likely to fail).
 */
export function Meter({ u, level }: { u: number; level: VerdictLevel }) {
  const pct = Math.round(u * 100);
  const color = level === 'comfortable' ? 'text-ok' : level === 'marginal' ? 'text-warn' : 'text-bad';
  const zone = (x: number) => (x < 0.6 ? 'bg-ok' : x <= 1 ? 'bg-warn' : 'bg-bad');
  return (
    <div>
      <div
        className={`font-display flex items-baseline justify-between gap-3 text-3xl leading-none ${color}`}
      >
        <span>{LEVEL_LABEL[level]}</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div
        role="meter"
        aria-label="Strength"
        aria-valuemin={0}
        aria-valuemax={MAX * 100}
        aria-valuenow={pct}
        aria-valuetext={`${LEVEL_LABEL[level]}: uses ${pct}% of the strength budget`}
        className="mt-2 grid h-5 gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${CELLS}, 1fr)` }}
      >
        {Array.from({ length: CELLS }, (_, i) => {
          const x = ((i + 0.5) / CELLS) * MAX;
          const on = (i / CELLS) * MAX < u;
          return <span key={i} className={`${zone(x)} ${on ? '' : 'opacity-20'}`} />;
        })}
      </div>
      <div className="mt-1 grid grid-cols-[40%_26.67%_1fr_auto] text-xs text-muted" aria-hidden="true">
        <span>0%</span>
        <span>60%</span>
        <span>100%</span>
        <span>150%+</span>
      </div>
    </div>
  );
}
