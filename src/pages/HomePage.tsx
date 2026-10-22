import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { IsIsNotTable } from '../components/IsIsNot';
import { showDisclaimers } from '../content/disclaimers';
import { BlockTitle } from '../components/home/BlockTitle';
import { Board } from '../components/home/Board';
import { getFamily } from '../families';
import { useSettings } from '../state/settings';
import type { LiveState } from '../components/home/LivePart';

const LivePart = lazy(() => import('../components/home/LivePart'));
const LIVE_ID = 'A1';

const STEPS = [
  { t: 'Brief', d: 'Say what is hard: a jar, a key, a spoon. Or pick a design yourself.' },
  { t: 'Measure', d: 'A few numbers from a ruler or the printable gauges, with a guide for each.' },
  {
    t: 'Check',
    d: 'See it in 3D around the real object, print a 1:1 paper template, read the strength verdict.',
  },
  { t: 'Print', d: 'Download the files, or a one-page sheet for a library, school or print service.' },
];

/** The live part's picture window: a still render first, then the real part turning in place. */
function LiveWindow() {
  const [state, setState] = useState<LiveState | null>(null);
  const [ready, setReady] = useState(false);
  const fam = getFamily(LIVE_ID)!;
  return (
    <figure className="border border-border bg-surface shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)]">
      <div className="font-display flex items-center justify-between gap-3 bg-primary px-3 text-2xl text-on-primary">
        <span>
          {fam.id} {fam.name}
        </span>
        <span className="live-badge blink px-2 text-xl">LIVE</span>
      </div>
      <div className="relative aspect-square bg-viewer-bg">
        <img
          src={`/renders/${LIVE_ID}.webp`}
          alt=""
          width={1024}
          height={1024}
          className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${ready ? 'opacity-0' : 'opacity-100'}`}
        />
        <Suspense fallback={null}>
          <LivePart onState={setState} onReady={() => setReady(true)} />
        </Suspense>
      </div>
      <figcaption className="grid gap-1 border-t border-border px-3 py-2 text-sm sm:grid-cols-[auto_1fr] sm:gap-4">
        <span className="font-display text-xl text-primary tabular-nums">
          Grip {state?.grip ?? 32} mm{' '}
          <span className="text-muted">
            {state ? `· built in ${Math.max(1, Math.round(state.ms))} ms` : '· loading'}
          </span>
        </span>
        <span className="text-muted sm:text-right">
          Built from parameters as you watch. The hand re-wraps as the grip grows.
        </span>
      </figcaption>
    </figure>
  );
}

function Choice({
  to,
  k,
  title,
  d,
  primary,
}: {
  to: string;
  k: string;
  title: string;
  d: string;
  primary?: boolean;
}) {
  const hotkeys = useSettings((s) => s.hotkeys);
  return (
    <Link
      to={to}
      aria-keyshortcuts={hotkeys ? k.toLowerCase() : undefined}
      className={`group grid min-h-20 grid-cols-[auto_1fr] items-center gap-x-4 border-2 px-4 py-3 ${
        primary
          ? 'border-primary bg-primary text-on-primary hover:border-primary-strong hover:bg-primary-strong'
          : 'border-primary text-text hover:bg-surface-2'
      }`}
    >
      <span aria-hidden="true" className="font-display row-span-2 text-5xl leading-none">
        <span className={primary ? '' : 'text-accent'}>[</span>
        <span className={primary ? '' : 'text-primary'}>{k}</span>
        <span className={primary ? '' : 'text-accent'}>]</span>
      </span>
      <span className="font-display text-[2rem] leading-none">{title}</span>
      <span className={`text-sm ${primary ? '' : 'text-muted'}`}>{d}</span>
    </Link>
  );
}

export function HomePage() {
  return (
    <>
      <section className="border-b-[3px] border-double border-rule">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:py-14">
          <div>
            <h1 className="max-w-[40rem]">
              <span className="sr-only">Everyday Leverage</span>
              <BlockTitle className="block w-full" />
            </h1>
            <p
              className="pour mt-8 max-w-[36ch] text-xl leading-snug sm:text-2xl"
              style={{ animationDelay: '900ms' }}
            >
              Describe a task that’s hard. Get a printable aid sized to your hand, checked for strength before
              you print it.
            </p>
            <div className="pour mt-8 grid max-w-xl gap-3" style={{ animationDelay: '1050ms' }}>
              <Choice
                to="/find"
                k="F"
                title="Help me find a design"
                d="Answer a few questions about the task."
                primary
              />
              <Choice to="/design" k="P" title="Pick a design" d="Browse all nine and their presets." />
            </div>
            <p className="pour mt-5 text-sm text-muted" style={{ animationDelay: '1150ms' }}>
              No account. Works offline. Nothing you enter leaves this device.
            </p>
          </div>
          <LiveWindow />
        </div>
      </section>

      <section aria-labelledby="board-title" className="mx-auto max-w-5xl px-4 py-14">
        <h2 id="board-title" className="text-5xl text-text sm:text-6xl">
          Nine designs. <span className="text-primary">One idea: leverage.</span>
        </h2>
        <p className="mt-3 max-w-[60ch] text-lg text-muted">
          A longer lever, a thicker grip or a better angle. Each one lowers the force a task needs.
        </p>
        <div className="mt-10">
          <Board />
        </div>
      </section>

      <section aria-labelledby="how" className="border-y-[3px] border-double border-rule bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h2 id="how" className="text-5xl">
            How it works
          </h2>
          <ol className="mt-8 grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.t} className="bg-surface p-5 pr-6">
                <p className="font-display flex items-baseline gap-2 text-4xl">
                  <span aria-hidden="true">
                    <span className="text-accent">[</span>
                    <span className="text-primary">{i + 1}</span>
                    <span className="text-accent">]</span>
                  </span>
                  <span>{s.t}</span>
                </p>
                <p className="mt-2 text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {showDisclaimers() && (
        <section aria-labelledby="isnot" className="mx-auto max-w-7xl px-4 py-14">
          <h2 id="isnot" className="text-5xl">
            What it is, and isn’t
          </h2>
          <div className="mt-6 overflow-x-auto border border-border bg-surface">
            <IsIsNotTable />
          </div>
          <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/limits" className="font-semibold text-primary underline">
              Read the limits and safety notes
            </Link>
            <Link to="/print-help" className="font-semibold text-primary underline">
              No printer? Here’s how to get it printed
            </Link>
          </p>
        </section>
      )}
    </>
  );
}
