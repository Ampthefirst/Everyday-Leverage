import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Page } from '../components/Card';
import { Button, LinkButton } from '../components/Button';
import { useSettings } from '../state/settings';
import { usePageKeys } from '../app/hotkeys';
import { StepStrip } from '../components/StepStrip';
import { OutOfScope } from '../components/OutOfScope';
import {
  optionsFor,
  QUESTIONS,
  route,
  contextFromAnswers,
  type Answers,
  type Suggestion,
} from '../finder/router';
import { getFamily } from '../families';
import type { Params } from '../families/types';
import { useDesign } from '../state/design';
import { DescribeBox } from '../llm/DescribeBox';

export default function FinderPage() {
  // Answers live only in this component's memory — never persisted.
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(-1); // -1 = intro
  const headingRef = useRef<HTMLHeadingElement>(null);
  const other = answers.who === 'other';
  const done = step >= QUESTIONS.length;
  const result = useMemo(() => (done ? route(answers) : null), [done, answers]);

  useEffect(() => headingRef.current?.focus(), [step]);
  const hotkeys = useSettings((st) => st.hotkeys);
  // Number keys answer the current question; ← goes back.
  usePageKeys((k) => {
    if (step < 0 || step >= QUESTIONS.length) return;
    const q = QUESTIONS[step];
    const opts = optionsFor(q, answers);
    const n = Number(k);
    if (n >= 1 && n <= Math.min(9, opts.length)) return (answer(q.id, opts[n - 1].value), true);
    if (k === 'ArrowLeft') return (setStep((s) => s - 1), true);
  });

  // Out-of-scope answers end the questionnaire at once.
  const answer = (qid: string, value: string) => {
    const next = { ...answers, [qid]: value };
    setAnswers(next);
    const r = route(next);
    if (r.kind === 'out-of-scope') setStep(QUESTIONS.length);
    else setStep((s) => s + 1);
  };

  if (step === -1) {
    return (
      <Page narrow>
        <StepStrip current="brief" compact className="mb-6" />
        <h1 ref={headingRef} tabIndex={-1} className="text-5xl outline-none sm:text-6xl">
          Help me find a design
        </h1>
        <p className="mt-3 text-lg">
          A few quick questions about the task — not about health. One question per screen; you can go back or
          skip any of them.
        </p>
        <p className="mt-2 text-muted">Your answers stay on this device and are not saved.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => setStep(0)}>Start</Button>
          <LinkButton to="/design" variant="secondary">
            I'd rather pick from the list
          </LinkButton>
        </div>
        <DescribeBox
          onAnswers={(a) => {
            setAnswers(a);
            const r = route(a);
            setStep(
              r.kind === 'out-of-scope'
                ? QUESTIONS.length
                : QUESTIONS.findIndex((q) => !a[q.id]) === -1
                  ? QUESTIONS.length
                  : QUESTIONS.findIndex((q) => !a[q.id]),
            );
          }}
        />
      </Page>
    );
  }

  if (!done) {
    const q = QUESTIONS[step];
    const opts = optionsFor(q, answers);
    return (
      <Page narrow>
        <StepStrip current="brief" compact className="mb-6" />
        <div className="flex items-center gap-3">
          <p className="font-display text-2xl" aria-live="polite">
            Question {step + 1} <span className="text-muted">of {QUESTIONS.length}</span>
          </p>
          <div aria-hidden="true" className="flex flex-1 gap-[3px]">
            {QUESTIONS.map((_, n) => (
              <span key={n} className={`h-3 flex-1 ${n <= step ? 'bg-primary' : 'bg-surface-2'}`} />
            ))}
          </div>
        </div>
        <h1 ref={headingRef} tabIndex={-1} className="mt-6 text-4xl outline-none sm:text-5xl">
          {other ? q.textOther : q.text}
        </h1>
        {hotkeys && opts.length <= 9 && (
          <p className="mt-2 hidden text-sm text-muted md:block">Press a number, or choose:</p>
        )}
        <div
          className="mt-4 grid gap-2 sm:grid-cols-2"
          role="group"
          aria-label={other ? q.textOther : q.text}
        >
          {opts.map((o, n) => (
            <button
              key={o.value}
              type="button"
              onClick={() => answer(q.id, o.value)}
              aria-pressed={answers[q.id] === o.value}
              aria-keyshortcuts={hotkeys && n < 9 ? String(n + 1) : undefined}
              className={`group tap grid min-h-16 grid-cols-[auto_1fr] items-center gap-x-3 border-2 px-3 py-2 text-left hover:bg-primary hover:text-on-primary focus-visible:bg-primary focus-visible:text-on-primary ${answers[q.id] === o.value ? 'border-primary bg-surface-2' : 'border-border bg-surface'}`}
            >
              {n < 9 && (
                <span aria-hidden="true" className="font-display row-span-2 text-3xl">
                  <span className="text-accent group-hover:text-on-primary group-focus-visible:text-on-primary">
                    [
                  </span>
                  {n + 1}
                  <span className="text-accent group-hover:text-on-primary group-focus-visible:text-on-primary">
                    ]
                  </span>
                </span>
              )}
              <span className="font-display text-2xl leading-tight">{o.label}</span>
              {o.hint && (
                <span className="text-sm text-muted group-hover:text-on-primary group-focus-visible:text-on-primary">
                  {o.hint}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
          <Button variant="ghost" onClick={() => setStep((s) => s + 1)}>
            Skip this question
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page narrow>
      <h1 ref={headingRef} tabIndex={-1} className="text-5xl outline-none sm:text-6xl">
        {result?.kind === 'out-of-scope'
          ? 'Thank you'
          : result?.kind === 'none'
            ? 'No clear match'
            : 'Suggested design'}
      </h1>
      <div className="mt-4">
        {result?.kind === 'out-of-scope' && <OutOfScope reason={result.reason} other={other} />}
        {result?.kind === 'none' && (
          <div className="space-y-3">
            <p className="text-lg">
              None of the nine designs is a clear fit for those answers. You can look through them yourself —
              each one can be adjusted.
            </p>
            <LinkButton to="/design">Pick a design</LinkButton>
          </div>
        )}
        {result?.kind === 'match' && (
          <div className="space-y-6">
            <ResultCard s={result.best} answers={answers} primary />
            {result.alternates.length > 0 && (
              <section>
                <h2 className="mb-3 text-3xl">Also worth a look</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {result.alternates.map((a) => (
                    <ResultCard key={a.family} s={a} answers={answers} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
        {result?.kind === 'ambiguous' && (
          <div className="space-y-6">
            <p className="text-lg">Two designs fit equally well. Compare them side by side:</p>
            <div className="grid gap-4 md:grid-cols-2">
              <ResultCard s={result.best} answers={answers} primary />
              <ResultCard s={result.second} answers={answers} primary />
            </div>
            {result.alternates.length > 0 && (
              <section>
                <h2 className="mb-3 text-3xl">Also worth a look</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {result.alternates.map((a) => (
                    <ResultCard key={a.family} s={a} answers={answers} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setStep(QUESTIONS.length - 1)}>
          Back
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setAnswers({});
            setStep(-1);
          }}
        >
          Start again
        </Button>
        <Link to="/design" className="tap inline-flex items-center px-2 text-primary underline">
          See all designs
        </Link>
      </div>
    </Page>
  );
}

function ResultCard({ s, answers, primary = false }: { s: Suggestion; answers: Answers; primary?: boolean }) {
  const fam = getFamily(s.family)!;
  const navigate = useNavigate();
  const setParams = useDesign((st) => st.setParams);
  const setUse = useDesign((st) => st.setUse);
  const preset = fam.presets.find((p) => p.id === s.preset);
  const open = () => {
    const use = contextFromAnswers(answers);
    const p: Params = { ...fam.defaults, ...(preset?.params ?? {}) } as Params;
    if (use.hand && fam.fields.some((f) => f.key === 'hand')) p.hand = use.hand;
    setParams(fam.id, p, preset ? { preset: preset.id } : undefined);
    setUse({ level: use.level, location: use.location });
    navigate(`/design/${fam.id}`, { state: { fromPreset: !!preset } });
  };
  return (
    <article className={`border-2 bg-surface p-4 ${primary ? 'border-primary' : 'border-border'}`}>
      <div className="flex gap-4">
        <img
          src={`/renders/${fam.id}.webp`}
          alt=""
          width={1024}
          height={1024}
          className={`shrink-0 border border-border bg-viewer-bg ${primary ? 'h-32 w-32' : 'h-20 w-20'}`}
        />
        <div>
          <h2 className={primary ? 'text-4xl' : 'text-2xl'}>
            <span className="text-accent">{fam.id}</span> {fam.name}
          </h2>
          <p className="mt-1">{s.why}</p>
          {primary && <p className="mt-2 text-muted">{fam.leverage}</p>}
          {preset && <p className="mt-2 text-sm">Starts from: {preset.label}</p>}
        </div>
      </div>
      <Button className="mt-4" variant={primary ? 'primary' : 'secondary'} onClick={open}>
        Use this design
      </Button>
    </article>
  );
}
