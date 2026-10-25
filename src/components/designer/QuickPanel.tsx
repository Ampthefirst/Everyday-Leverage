import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Params } from '../../families/types';
import { useDesign } from '../../state/design';
import { useSettings } from '../../state/settings';
import { usePageKeys } from '../../app/hotkeys';
import { useDesigner } from './context';
import { ParamControl } from './ParamControl';
import { Button } from '../Button';
import { Illustration } from '../Illustration';
import { Meter } from '../Meter';
import { StrengthBadge } from '../StrengthBadge';

const FilesPanel = lazy(() => import('./FilesPanel'));

type Step = { kind: 'task' } | { kind: 'field'; key: string } | { kind: 'result' };

/**
 * Quick mode: one decision per screen (task → each fit measurement → result and files). It edits the same
 * stored parameters as the full designer, so switching modes never loses a value.
 */
export type QuickStepKind = Step['kind'];

export function QuickPanel({
  startAt,
  banner,
  onAllSettings,
  onShowMath,
  onStep,
}: {
  /** Where to open: the task list, the first measurement, or the result. */
  startAt: 'task' | 'measure' | 'result';
  banner: ReactNode;
  onAllSettings: () => void;
  onShowMath: () => void;
  onStep?: (kind: QuickStepKind) => void;
}) {
  const { family, params, analysis, setParam, openMeasure } = useDesigner();
  const presetId = useDesign((s) => s.presetId[family.id]);
  const setParams = useDesign((s) => s.setParams);
  const hotkeys = useSettings((s) => s.hotkeys);

  const steps: Step[] = [
    { kind: 'task' },
    ...family.fields
      .filter((f) => f.group === 'fit' && (!f.showIf || f.showIf(params)))
      .map((f) => ({ kind: 'field' as const, key: f.key })),
    { kind: 'result' },
  ];
  const [index, setIndex] = useState(startAt === 'task' ? 0 : startAt === 'measure' ? 1 : steps.length - 1);
  const i = Math.min(index, steps.length - 1);
  const step = steps[i];
  useEffect(() => onStep?.(step.kind), [step.kind, onStep]);
  const go = (n: number) => setIndex(Math.max(0, Math.min(steps.length - 1, n)));

  // Each new screen moves focus to its heading, so screen readers announce the question.
  const body = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    body.current?.scrollTo(0, 0);
    body.current?.querySelector<HTMLElement>('h2')?.focus();
  }, [i]);

  usePageKeys((k) => {
    if (k === 'a' || k === 'A') return (onAllSettings(), true);
    if (k === 'ArrowRight') return (go(i + 1), true);
    if (k === 'ArrowLeft') return (go(i - 1), true);
    if (step.kind === 'task') {
      const n = Number(k);
      if (n >= 1 && n <= family.presets.length) {
        choosePreset(n - 1);
        return true;
      }
    }
  });

  function choosePreset(n: number) {
    const p = family.presets[n];
    setParams(family.id, { ...family.defaults, ...p.params } as Params, { preset: p.id });
    go(1);
  }

  const v = analysis.verdict;
  const field = step.kind === 'field' ? family.fields.find((f) => f.key === step.key)! : null;
  const guide = field?.measure ? family.measureGuide.find((g) => g.id === field.measure) : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-4 border-b border-rule px-4 py-1.5 sm:px-6">
        <p className="text-base text-muted">
          Step {i + 1} of {steps.length}
        </p>
        <div aria-hidden="true" className="flex flex-1 gap-1">
          {steps.map((_, n) => (
            <span key={n} className={`h-1 flex-1 rounded-full ${n <= i ? 'bg-text' : 'bg-rule'}`} />
          ))}
        </div>
        <Button variant="ghost" onClick={onAllSettings} aria-keyshortcuts={hotkeys ? 'a' : undefined}>
          All settings
        </Button>
      </div>
      {banner}
      <div ref={body} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {/* Each new question fades in with a small rise. */}
        <div key={i} className="step-in">
          {step.kind === 'task' && (
            <section aria-labelledby="q-task">
              <h2 id="q-task" tabIndex={-1} className="text-[2rem] focus-visible:outline-none">
                What is it for?
              </h2>
              <p className="mt-2 text-muted">
                Pick the closest task. Every size can change on the next screens.
              </p>
              <ol className="mt-5 border-t border-border">
                {family.presets.map((p, n) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      aria-pressed={presetId === p.id}
                      aria-keyshortcuts={hotkeys ? String(n + 1) : undefined}
                      onClick={() => choosePreset(n)}
                      className={`grid min-h-14 w-full grid-cols-[2.25rem_1fr] items-center gap-x-2 border-b border-border px-1 py-3 text-left hover:bg-surface-2 ${presetId === p.id ? 'bg-surface-2 shadow-[inset_3px_0_0_var(--color-primary)]' : ''}`}
                    >
                      <span aria-hidden="true" className="figcaption row-span-2 pl-1.5 text-xl text-faint">
                        {n + 1}
                      </span>
                      <span className="font-semibold">{p.label}</span>
                      <span className="text-base text-muted">{p.description}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {field && (
            <section aria-labelledby="q-field" className="space-y-4">
              <h2 id="q-field" tabIndex={-1} className="text-[2rem] focus-visible:outline-none">
                {field.label}
              </h2>
              {guide && (
                <div className="rounded-md border border-rule p-4">
                  <Illustration id={guide.illustration} />
                  <p className="mt-2 text-base">{guide.text}</p>
                  {guide.tip && <p className="mt-1 text-base text-muted">Tip: {guide.tip}</p>}
                </div>
              )}
              <ParamControl field={field} params={params} onChange={setParam} onMeasure={openMeasure} />
            </section>
          )}

          {step.kind === 'result' && (
            <section aria-labelledby="q-result" className="space-y-5">
              <h2 id="q-result" tabIndex={-1} className="text-[2rem] focus-visible:outline-none">
                Your {family.name.toLowerCase()}
              </h2>
              <div className="rounded-md border border-border p-4">
                <Meter u={v.utilization} level={v.level} large />
                <p className="mt-3">{v.reason}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <StrengthBadge calibration={analysis.calibration} />
                  <Button variant="ghost" onClick={onShowMath}>
                    Show the math
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="font-serif text-[1.6rem]">Get your files</h3>
                <Suspense fallback={<p role="status">Loading file tools…</p>}>
                  <FilesPanel />
                </Suspense>
              </div>
            </section>
          )}
        </div>
      </div>
      <div className="flex gap-2 border-t border-rule px-4 py-3 sm:px-6">
        <Button variant="secondary" className="min-h-14" onClick={() => go(i - 1)} disabled={i === 0}>
          Back
        </Button>
        {step.kind !== 'result' && (
          <Button className="ml-auto min-h-14 px-6" onClick={() => go(i + 1)}>
            {i === steps.length - 2 ? 'See the result' : 'Next'}
          </Button>
        )}
      </div>
    </div>
  );
}
