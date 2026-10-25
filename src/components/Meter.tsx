import type { VerdictLevel } from '../strength/types';
import { LEVEL_LABEL } from '../strength/evaluate';

const MAX = 1.5;

/**
 * Strength readout: the verdict and the share of the strength budget used, over a bar in three zones
 * (comfortable < 60 % ≤ marginal ≤ 100 % < likely to fail). Colour always comes with the word.
 */
export function Meter({ u, level, large = false }: { u: number; level: VerdictLevel; large?: boolean }) {
  const pct = Math.round(u * 100);
  const color = level === 'comfortable' ? 'text-ok' : level === 'marginal' ? 'text-warn' : 'text-bad';
  const fill = level === 'comfortable' ? 'bg-ok' : level === 'marginal' ? 'bg-warn' : 'bg-bad';
  const pos = Math.min(1, u / MAX) * 100;
  return (
    <div>
      {large ? (
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-6xl tracking-tight">{pct}%</span>
          <span className={`text-lg font-semibold ${color}`}>{LEVEL_LABEL[level]}</span>
        </div>
      ) : (
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-serif text-xl">Strength</span>
          <span className={`font-semibold ${color}`}>
            {LEVEL_LABEL[level]} · {pct}%
          </span>
        </div>
      )}
      <div
        role="meter"
        aria-label="Strength"
        aria-valuemin={0}
        aria-valuemax={MAX * 100}
        aria-valuenow={pct}
        aria-valuetext={`${LEVEL_LABEL[level]}: uses ${pct}% of the strength budget`}
        className="relative mt-3 h-2.5 overflow-hidden rounded-full"
        style={{ background: 'linear-gradient(90deg,#d8eadf 0 40%,#f3e3c4 40% 66.6%,#f2d4d1 66.6%)' }}
      >
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-[width,background-color] duration-200 ease-out ${fill}`}
          style={{ width: `${pos}%` }}
        />
      </div>
      <div className="mt-1.5 grid grid-cols-[40%_26.67%_1fr_auto] text-xs text-faint" aria-hidden="true">
        <span>0%</span>
        <span>60%</span>
        <span>100%</span>
        <span>150%+</span>
      </div>
    </div>
  );
}
