import { STEPS, type StepId } from '../state/projects';

/**
 * Brief → Measure → Check → Print. Done steps are filled dots, the current step is an ink-blue dot and
 * full-strength text. `stopped` adds a "you stopped here" note (saved projects).
 */
export function StepStrip({
  current,
  stopped,
  className = '',
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
      className={`flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium ${className}`}
    >
      {STEPS.map((s, i) => {
        const here = i === at;
        const done = i < at;
        return (
          <li
            key={s.id}
            aria-current={here ? 'step' : undefined}
            className={`flex items-center gap-2 ${here ? 'text-text' : done ? 'text-muted' : 'text-faint'}`}
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full border-[1.5px] ${here ? 'border-primary bg-primary' : done ? 'border-muted bg-muted' : 'border-current'}`}
            />
            {s.label}
            {done && <span className="sr-only"> (done)</span>}
            {stopped === s.id && <span className="text-faint">· you stopped here</span>}
          </li>
        );
      })}
    </ol>
  );
}
