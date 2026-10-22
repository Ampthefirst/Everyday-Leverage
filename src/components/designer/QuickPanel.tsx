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

function Hint({ k, inverse = false }: { k: string; inverse?: boolean }) {
  return (
    <span aria-hidden="true" className="font-display hidden md:inline">
      <span className={inverse ? '' : 'text-accent'}>[</span>
      <span className={inverse ? '' : 'text-primary'}>{k}</span>
      <span className={inverse ? '' : 'text-accent'}>]</span>
    </span>
  );
}

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
      <div className="flex items-center gap-3 border-b-[3px] border-double border-rule px-4 py-2">
        <p className="font-display text-2xl">
          Step {i + 1} <span className="text-muted">of {steps.length}</span>
        </p>
        <div aria-hidden="true" className="flex flex-1 gap-[3px]">
          {steps.map((_, n) => (
            <span key={n} className={`h-3 flex-1 ${n <= i ? 'bg-primary' : 'bg-surface-2'}`} />
          ))}
        </div>
        <Button variant="ghost" onClick={onAllSettings} aria-keyshortcuts={hotkeys ? 'a' : undefined}>
          {hotkeys && <Hint k="A" />} All settings
        </Button>
      </div>
      {banner}
      <div ref={body} className="min-h-0 flex-1 overflow-y-auto p-4">
        {step.kind === 'task' && (
          <section aria-labelledby="q-task">
            <h2 id="q-task" tabIndex={-1} className="text-4xl focus-visible:outline-none">
              What is it for?
            </h2>
            <p className="mt-1 text-sm text-muted">
              Pick the closest task. Every size can change on the next screens.
            </p>
            <ol className="mt-4 grid gap-2">
              {family.presets.map((p, n) => (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-pressed={presetId === p.id}
                    onClick={() => choosePreset(n)}
                    className={`group grid min-h-14 w-full grid-cols-[3rem_1fr] items-center gap-x-3 border px-3 py-2 text-left hover:bg-primary hover:text-on-primary focus-visible:bg-primary focus-visible:text-on-primary ${presetId === p.id ? 'border-primary bg-surface-2' : 'border-border bg-surface'}`}
                  >
                    <span aria-hidden="true" className="font-display row-span-2 text-3xl">
                      <span className="text-accent group-hover:text-on-primary group-focus-visible:text-on-primary">
                        [
                      </span>
                      {n + 1}
                      <span className="text-accent group-hover:text-on-primary group-focus-visible:text-on-primary">
                        ]
                      </span>
                    </span>
                    <span className="font-display text-2xl leading-none">{p.label}</span>
                    <span className="text-sm text-muted group-hover:text-on-primary group-focus-visible:text-on-primary">
                      {p.description}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        )}

        {field && (
          <section aria-labelledby="q-field" className="space-y-4">
            <h2 id="q-field" tabIndex={-1} className="text-4xl focus-visible:outline-none">
              {field.label}
            </h2>
            {guide && (
              <div className="border border-border bg-bg p-3">
                <Illustration id={guide.illustration} />
                <p className="mt-2 text-sm">{guide.text}</p>
                {guide.tip && <p className="mt-1 text-sm text-muted">Tip: {guide.tip}</p>}
              </div>
            )}
            <ParamControl field={field} params={params} onChange={setParam} onMeasure={openMeasure} />
          </section>
        )}

        {step.kind === 'result' && (
          <section aria-labelledby="q-result" className="space-y-5">
            <h2 id="q-result" tabIndex={-1} className="text-4xl focus-visible:outline-none">
              Your {family.name.toLowerCase()}
            </h2>
            <div className="border border-border bg-bg p-3">
              <Meter u={v.utilization} level={v.level} />
              <p className="mt-3">{v.reason}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StrengthBadge calibration={analysis.calibration} />
                <Button variant="ghost" onClick={onShowMath}>
                  Show the math
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-display text-3xl">Get your files</h3>
              <Suspense fallback={<p role="status">Loading file tools…</p>}>
                <FilesPanel />
              </Suspense>
            </div>
          </section>
        )}
      </div>
      <div className="flex gap-2 border-t border-rule p-3">
        <Button variant="secondary" onClick={() => go(i - 1)} disabled={i === 0}>
          {hotkeys && <Hint k="←" />} Back
        </Button>
        {step.kind !== 'result' && (
          <Button className="ml-auto" onClick={() => go(i + 1)}>
            {i === steps.length - 2 ? 'See the result' : 'Next'} {hotkeys && <Hint k="→" inverse />}
          </Button>
        )}
      </div>
    </div>
  );
}
