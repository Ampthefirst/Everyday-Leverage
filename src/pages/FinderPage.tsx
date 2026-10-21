import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Page } from '../components/Card';
import { Button, LinkButton } from '../components/Button';
import { FamilyIcon } from '../components/FamilyIcon';
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
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold outline-none">
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
        <p className="text-muted" aria-live="polite">
          Question {step + 1} of {QUESTIONS.length}
        </p>
        <div className="mt-1 h-2 rounded-full bg-surface-2" aria-hidden="true">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
        <h1 ref={headingRef} tabIndex={-1} className="mt-6 text-3xl font-bold outline-none">
          {other ? q.textOther : q.text}
        </h1>
        <div
          className="mt-6 grid gap-3 sm:grid-cols-2"
          role="group"
          aria-label={other ? q.textOther : q.text}
        >
          {opts.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => answer(q.id, o.value)}
              aria-pressed={answers[q.id] === o.value}
              className={`tap min-h-16 rounded-2xl border-2 p-4 text-left text-lg ${answers[q.id] === o.value ? 'border-primary bg-surface-2' : 'border-border bg-surface hover:border-primary'}`}
            >
              <span className="block font-semibold">{o.label}</span>
              {o.hint && <span className="block text-base text-muted">{o.hint}</span>}
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
      <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold outline-none">
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
                <h2 className="mb-2 text-xl font-bold">Also worth a look</h2>
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
                <h2 className="mb-2 text-xl font-bold">Also worth a look</h2>
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
    setUse({ level: use.level, location: use.location, loadOverride: undefined });
    navigate(`/design/${fam.id}`);
  };
  return (
    <article
      className={`rounded-2xl border-2 bg-surface p-5 ${primary ? 'border-primary' : 'border-border'}`}
    >
      <div className="flex gap-4">
        <span className="text-primary">
          <FamilyIcon id={fam.id} className={primary ? 'h-16 w-16' : 'h-12 w-12'} />
        </span>
        <div>
          <h2 className={`${primary ? 'text-2xl' : 'text-lg'} font-bold`}>
            <span className="text-muted">{fam.id}</span> {fam.name}
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
