import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IsIsNotTable } from '../components/IsIsNot';
import { showDisclaimers } from '../content/disclaimers';
import { FigureSheet, showcaseParams } from '../components/home/FigureSheet';
import { Figure } from '../components/Figure';
import { StrengthBadge } from '../components/StrengthBadge';
import { LinkButton } from '../components/Button';
import { getFamily } from '../families';
import type { Params } from '../families/types';
import { analyse } from '../app/analysis';
import { prefersReducedMotion, useSettings } from '../state/settings';
import { sortedProjects, useProjects } from '../state/projects';
import { Shelf, stepLabel, useOpenProject } from '../components/home/Shelf';
import { usePageKeys } from '../app/hotkeys';

/** Fig. 1 is redrawn live through these largest-lid sizes, straight from the drawing code. */
const LID_STEPS = [85, 100, 70];
const STEP_MS = 3200;

/** The hero figure: the jar opener's true-scale top view, redrawn as the lid size changes. */
function LiveFigure() {
  const fam = getFamily('B1')!;
  const base = useMemo(() => showcaseParams(fam), [fam]);
  const [i, setI] = useState(0);
  const still = prefersReducedMotion();
  useEffect(() => {
    if (still) return;
    const t = setInterval(() => !document.hidden && setI((n) => (n + 1) % LID_STEPS.length), STEP_MS);
    return () => clearInterval(t);
  }, [still]);
  const params = useMemo(() => fam.repair({ ...base, lidMax: LID_STEPS[i] } as Params), [fam, base, i]);
  const verdict = useMemo(
    () =>
      analyse({
        family: fam,
        params,
        use: { level: 'moderate', location: 'kitchen' },
        print: null,
        safetyFactor: 2,
        orientationId: 'auto',
        calibrationFor: () => null,
        geometry: null,
      }).verdict,
    [fam, params],
  );
  const lidMin = params.lidMin as number;
  const lidMax = params.lidMax as number;
  return (
    <figure className="flex flex-col justify-center">
      <div className="figure-sheet relative px-6 pt-10 pb-8 sm:px-8">
        <Figure
          familyId="B1"
          params={params}
          label={`Top view of the lid and jar opener: a stepped cup for lids ${lidMin} to ${lidMax} mm and a ${params.lever} mm lever.`}
        />
        <span
          aria-hidden="true"
          className="figcaption absolute top-3 left-6 text-base text-primary sm:left-8"
        >
          cup, {params.steps as number} lid steps
        </span>
        <span
          aria-hidden="true"
          className="figcaption absolute top-3 right-6 text-base text-primary sm:right-8"
        >
          {params.lever as number} mm lever
        </span>
        <span
          aria-hidden="true"
          className="figcaption absolute bottom-2 left-6 text-base text-primary sm:left-8"
        >
          fits lids {lidMin}–{lidMax} mm
        </span>
      </div>
      <figcaption className="mt-4 flex items-start justify-between gap-6">
        <span className="text-base text-muted">
          <span className="figcaption text-lg text-text">Fig. 1 — Lid and jar opener, top view.</span> Drawn
          from its measurements at true scale, and redrawn as the lid size changes. Uses about{' '}
          {Math.round(verdict.utilization * 100)}% of its strength budget.{' '}
          <StrengthBadge calibration={null} />
        </span>
        <span className="hidden w-40 shrink-0 rounded-md border border-border bg-surface p-2 shadow-[0_12px_30px_-18px_rgb(22_24_29/0.35)] sm:block">
          <img src="/renders/B1.webp" alt="" width={1024} height={1024} className="block w-full" />
          <span className="mt-1 block text-sm text-muted">As printed, in PETG</span>
        </span>
      </figcaption>
    </figure>
  );
}

/** Shown when the shelf has something on it: reopens the most recent design where it stopped. */
function ContinueCard() {
  const latest = sortedProjects(useProjects((s) => s.projects))[0];
  const open = useOpenProject();
  const hotkeys = useSettings((s) => s.hotkeys);
  usePageKeys((k) => {
    if (latest && (k === 'c' || k === 'C')) return (open(latest), true);
  });
  if (!latest) {
    return (
      <p className="mt-6 text-base text-faint">
        No account needed. Works offline. Nothing you measure leaves this device.
      </p>
    );
  }
  return (
    <div className="mt-6 flex max-w-[31em] flex-wrap items-center gap-4 rounded-md border border-border p-3.5">
      <Figure familyId={latest.familyId} params={latest.params} className="h-14 w-16 [&_svg]:h-14" />
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-lg font-medium">Continue where you stopped</span>
        <span className="block text-base text-muted">
          {latest.name} · at {stepLabel(latest)}
        </span>
      </span>
      <button
        type="button"
        onClick={() => open(latest)}
        aria-keyshortcuts={hotkeys ? 'c' : undefined}
        className="tap rounded-md border border-border px-4 font-semibold hover:border-text"
      >
        Continue<span className="sr-only">: {latest.name}</span>
      </button>
    </div>
  );
}

const WORKED = [
  { t: 'Brief', d: 'Opening jam and pickle jars', s: 'Chosen from “Turn and open”.' },
  { t: 'Measure', d: 'Lids 45 to 85 mm', s: 'Three cup steps, 150 mm lever.' },
  {
    t: 'Check',
    d: 'Comfortable, about 20% of its budget',
    s: 'Busiest spot: where the lever meets the cup.',
  },
  { t: 'Print', d: 'STL, 3MF and a paper template', s: 'Plus a one-page sheet for a library or school.' },
];

export function HomePage() {
  return (
    <>
      <section className="border-b border-rule">
        <div className="mx-auto grid max-w-[90rem] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="px-4 pt-12 pb-10 sm:px-6 lg:border-r lg:border-rule lg:pt-20 lg:pr-14 lg:pb-16 lg:pl-24">
            <h1 className="max-w-[11em] text-[2.6rem] leading-[1.08] sm:text-[3.4rem]">
              A printable aid for the task your hands find hard.{' '}
              <span className="text-faint">Sized to you, checked for strength.</span>
            </h1>
            <p className="mt-7 max-w-[31em] text-[1.1875rem] text-muted">
              Describe the task and take a few measurements. You get a 3D model, a 1:1 paper template to check
              the fit, and a sheet to hand to any printer.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <LinkButton to="/find" className="min-h-14 px-6 text-[1.0625rem]">
                Find a design for a task
              </LinkButton>
              <LinkButton to="/design" variant="secondary" className="min-h-14 px-6 text-[1.0625rem]">
                Browse all nine
              </LinkButton>
            </div>
            <ContinueCard />
          </div>
          <div className="graph-paper flex px-4 py-10 sm:px-8 lg:px-14 lg:py-16">
            <LiveFigure />
          </div>
        </div>
      </section>

      <Shelf />

      <section aria-labelledby="designs" className="border-b border-rule">
        <div className="mx-auto max-w-[90rem] px-4 py-16 sm:px-6 lg:px-24 lg:py-22">
          <h2 id="designs" className="text-[2.1rem] sm:text-[2.5rem]">
            Nine designs, one idea: more leverage.
          </h2>
          <p className="mt-3 max-w-[36em] text-muted">
            A longer lever, a thicker grip or a better angle. Each design lowers the force or the pinch a task
            needs, and every size comes from your measurements.
          </p>
          <div className="mt-11">
            <FigureSheet />
          </div>
        </div>
      </section>

      <section aria-labelledby="example" className="border-b border-rule">
        <div className="mx-auto max-w-[90rem] px-4 py-16 sm:px-6 lg:px-24 lg:py-22">
          <h2 id="example" className="text-[2.1rem] sm:text-[2.5rem]">
            What a design looks like, start to finish
          </h2>
          <p className="mt-3 text-muted">The jam-jar opener above, as a real example.</p>
          <dl className="mt-11 grid gap-x-6 gap-y-8 border-t border-text sm:grid-cols-2 lg:grid-cols-4">
            {WORKED.map((w, i) => (
              <div key={w.t} className="pt-5">
                <dt className="flex items-center gap-2 text-base font-semibold text-muted">
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 rounded-full border-[1.5px] border-text ${i === 0 ? 'bg-text' : ''}`}
                  />
                  {w.t}
                </dt>
                <dd className="mt-3 font-serif text-[1.375rem] leading-snug">{w.d}</dd>
                <dd className="mt-1.5 text-base text-muted">{w.s}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {showDisclaimers() && (
        <section aria-labelledby="isnot">
          <div className="mx-auto max-w-[90rem] px-4 py-16 sm:px-6 lg:px-24 lg:py-22">
            <h2 id="isnot" className="text-[2.1rem] sm:text-[2.5rem]">
              What it is, and isn’t
            </h2>
            <div className="mt-8 overflow-x-auto">
              <IsIsNotTable />
            </div>
            <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
              <Link to="/limits" className="font-semibold text-primary underline">
                Read the limits and safety notes
              </Link>
              <Link to="/print-help" className="font-semibold text-primary underline">
                No printer? Here’s how to get it printed
              </Link>
            </p>
          </div>
        </section>
      )}
    </>
  );
}
