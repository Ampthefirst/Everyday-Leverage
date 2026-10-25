import { Link, useNavigate, useParams } from 'react-router-dom';
import { familyList, getFamily } from '../families';
import { GROUPS } from '../families/groups';
import type { Params } from '../families/types';
import { useDesign } from '../state/design';
import { usePageKeys } from '../app/hotkeys';
import { useSettings } from '../state/settings';

/** A drawn arrow in the text colour, matching the viewer toolbar's stroke icons. */
function Arrow({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="18"
      height="18"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={dir === 'left' ? 'M16 10H4m5-5-5 5 5 5' : 'M4 10h12m-5-5 5 5-5 5'} />
    </svg>
  );
}
import { Figure } from '../components/Figure';
import { showcaseParams } from '../families/describe';

/** One design's screen between the board and the Designer: what it is, and its presets as a numbered list. */
export default function DesignScreen() {
  const { familyId = '' } = useParams();
  const navigate = useNavigate();
  const family = getFamily(familyId);
  const setParams = useDesign((s) => s.setParams);
  const hasStored = useDesign((s) => !!family && !!s.params[family.id]);
  const hotkeys = useSettings((s) => s.hotkeys);
  const ids = familyList().map((f) => f.id);
  const i = family ? ids.indexOf(family.id) : -1;
  const prev = i > 0 ? ids[i - 1] : null;
  const next = i >= 0 && i < ids.length - 1 ? ids[i + 1] : null;

  const applyPreset = (n: number) => {
    if (!family) return;
    const p = family.presets[n];
    setParams(family.id, { ...family.defaults, ...p.params } as Params, { preset: p.id });
    // Quick mode skips its own "what is it for?" screen: the task was just chosen here.
    navigate(`/design/${family.id}`, { state: { fromPreset: true } });
  };

  usePageKeys((k) => {
    if (!family) return;
    const n = Number(k);
    if (n >= 1 && n <= family.presets.length) return (applyPreset(n - 1), true);
    if (k === 'Escape' || k === 'Backspace') return (navigate('/design'), true);
    if (k === 'ArrowLeft' && prev) return (navigate(`/pick/${prev}`), true);
    if (k === 'ArrowRight' && next) return (navigate(`/pick/${next}`), true);
    // Enter opens the designer only when nothing else has focus (a focused control handles its own Enter).
    if (k === 'Enter' && (document.activeElement === document.body || document.activeElement?.id === 'main'))
      return (navigate(`/design/${family.id}`), true);
  });

  if (!family) {
    return (
      <div className="mx-auto max-w-[90rem] px-4 py-14 sm:px-6 lg:px-24">
        <h1 className="text-[2.6rem]">Design not found</h1>
        <p className="mt-3 text-muted">There is no design called “{familyId}”.</p>
        <Link to="/design" className="mt-6 inline-block font-semibold text-primary underline">
          See all designs
        </Link>
      </div>
    );
  }
  const group = GROUPS.find((g) => g.id === family.group)!;
  const prevName = prev ? getFamily(prev)!.name : '';
  const nextName = next ? getFamily(next)!.name : '';
  const preset = family.presets[0];
  const crumb = 'tap inline-flex items-center gap-2 text-base text-muted hover:text-text';

  return (
    <>
      <nav aria-label="Designs" className="border-b border-rule">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-x-6 px-4 sm:px-6 lg:px-24">
          <Link to="/design" className={crumb} aria-keyshortcuts={hotkeys ? 'Escape' : undefined}>
            <Arrow dir="left" /> All designs
          </Link>
          <span className="hidden text-base text-faint sm:inline">
            {group.title} · Fig. {i + 1}
          </span>
          <span className="flex flex-wrap gap-x-5 sm:ml-auto">
            {prev && (
              <Link
                to={`/pick/${prev}`}
                className={crumb}
                aria-keyshortcuts={hotkeys ? 'ArrowLeft' : undefined}
              >
                <Arrow dir="left" /> {prevName}
                <span className="sr-only">, previous design</span>
              </Link>
            )}
            {next && (
              <Link
                to={`/pick/${next}`}
                className={crumb}
                aria-keyshortcuts={hotkeys ? 'ArrowRight' : undefined}
              >
                {nextName} <Arrow dir="right" />
                <span className="sr-only">, next design</span>
              </Link>
            )}
          </span>
        </div>
      </nav>

      <div className="mx-auto grid max-w-[90rem] border-b border-rule lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <figure className="graph-paper flex flex-col justify-start px-4 py-10 sm:px-8 lg:border-r lg:border-rule lg:px-14 lg:py-14">
          <div className="figure-sheet px-6 py-10 sm:px-10 lg:py-14">
            <Figure
              familyId={family.id}
              params={showcaseParams(family)}
              className="mx-auto w-full [&_svg]:max-h-[30rem]"
            />
          </div>
          <figcaption className="mt-4 flex items-start justify-between gap-6 text-base text-muted">
            <span>
              <span className="figcaption text-lg text-text">
                Fig. {i + 1} — {family.name}.
              </span>{' '}
              {preset ? <>At the “{preset.label}” sizes.</> : 'At its standard sizes.'}
            </span>
            <span className="hidden w-32 shrink-0 rounded-md border border-border bg-surface p-2 sm:block">
              <img
                src={`/renders/${family.id}.webp`}
                alt={`${family.name}, as printed.`}
                width={1024}
                height={1024}
                className="block w-full"
              />
              <span className="mt-1 block text-sm">As printed</span>
            </span>
          </figcaption>
        </figure>

        <div className="px-4 py-10 sm:px-6 lg:px-14 lg:py-14">
          <h1 className="text-[2.4rem] sm:text-[2.9rem]">{family.name}</h1>
          <p className="mt-4 max-w-[34em] text-[1.1875rem]">{family.blurb}</p>
          <p className="mt-3 max-w-[34em] text-muted">
            <span className="figcaption text-text">Leverage.</span> {family.leverage}
          </p>

          <h2 className="mt-10 text-[1.75rem]">Start from a task</h2>
          <p className="mt-1 text-base text-muted">
            {hotkeys ? 'Press a number, or choose one.' : 'Choose one.'} You can change every size in the
            designer.
          </p>
          <ol className="mt-5 border-t border-border">
            {family.presets.map((p, n) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => applyPreset(n)}
                  aria-keyshortcuts={hotkeys ? String(n + 1) : undefined}
                  className="group grid min-h-16 w-full grid-cols-[2.5rem_1fr_auto] items-center gap-x-3 border-b border-border px-1 py-3.5 text-left hover:bg-surface-2"
                >
                  <span aria-hidden="true" className="figcaption text-xl text-faint">
                    {n + 1}
                  </span>
                  <span>
                    <span className="block font-semibold">{p.label}</span>
                    <span className="block text-base text-muted">{p.description}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-base font-semibold text-primary group-hover:underline"
                  >
                    Start
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <Link
            to={`/design/${family.id}`}
            className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-md bg-primary px-6 text-[1.0625rem] font-semibold text-on-primary hover:bg-primary-strong sm:w-auto"
          >
            {hasStored ? 'Open the designer with my last sizes' : 'Open the designer'}
          </Link>
        </div>
      </div>
    </>
  );
}
