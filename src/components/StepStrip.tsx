import { STEPS, type StepId } from '../state/projects';

/**
 * Brief → Measure → Check → Print. The current step is an inverse-video block; steps before it are
 * done. `stopped` adds a "you stopped here" marker (used for saved projects).
 */
export function StepStrip({
  current,
  stopped,
  className = '',
  compact = false,
}: {
  current: StepId;
  stopped?: StepId;
  className?: string;
  compact?: boolean;
}) {
  const at = STEPS.findIndex((s) => s.id === current);
  return (
    <ol
      aria-label="Progress"
      className={`font-display flex items-stretch ${compact ? 'text-xl' : 'text-2xl'} ${className}`}
    >
      {STEPS.map((s, i) => {
        const here = i === at;
        const done = i < at;
        return (
          <li key={s.id} aria-current={here ? 'step' : undefined} className="flex items-center">
            {i > 0 && (
              <span
                aria-hidden="true"
                className={`h-0 w-3 border-t-2 sm:w-5 ${done || here ? 'border-primary' : 'border-rule'}`}
              />
            )}
            <span
              className={`flex flex-col px-2 leading-tight ${here ? 'bg-primary text-on-primary' : done ? 'text-primary' : 'text-muted'}`}
            >
              <span>
                <span aria-hidden="true">{i + 1} </span>
                {s.label}
                {done && <span className="sr-only"> (done)</span>}
              </span>
              {stopped === s.id && (
                <span className={`text-sm leading-none ${here ? '' : 'text-accent'}`}>you stopped here</span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
