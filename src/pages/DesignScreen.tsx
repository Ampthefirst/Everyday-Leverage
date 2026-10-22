import { Link, useNavigate, useParams } from 'react-router-dom';
import { familyList, getFamily } from '../families';
import { GROUPS } from '../families/groups';
import type { Params } from '../families/types';
import { useDesign } from '../state/design';
import { usePageKeys } from '../app/hotkeys';
import { useSettings } from '../state/settings';

function Bracket({ children, inverse = false }: { children: string; inverse?: boolean }) {
  // Key hints are for keyboards: hidden on small (touch-first) screens.
  return (
    <span aria-hidden="true" className="font-display hidden md:inline">
      <span className={inverse ? '' : 'text-accent'}>[</span>
      <span className={inverse ? '' : 'text-primary'}>{children}</span>
      <span className={inverse ? '' : 'text-accent'}>]</span>
    </span>
  );
}

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
    navigate(`/design/${family.id}`);
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
      <div className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="text-5xl">Design not found</h1>
        <p className="mt-3 text-muted">There is no design called “{familyId}”.</p>
        <Link to="/design" className="mt-6 inline-block font-semibold text-primary underline">
          See all designs
        </Link>
      </div>
    );
  }
  const group = GROUPS.find((g) => g.id === family.group)!;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Designs" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-lg">
        <Link
          to="/design"
          className="tap font-display inline-flex items-center gap-2 text-2xl hover:text-primary"
        >
          {hotkeys && <Bracket>Esc</Bracket>} All designs
        </Link>
        <span className="ml-auto flex gap-2">
          {prev && (
            <Link
              to={`/pick/${prev}`}
              className="tap font-display inline-flex items-center gap-2 px-2 text-2xl hover:text-primary"
            >
              {hotkeys && <Bracket>←</Bracket>} {prev}
              <span className="sr-only">, previous design</span>
            </Link>
          )}
          {next && (
            <Link
              to={`/pick/${next}`}
              className="tap font-display inline-flex items-center gap-2 px-2 text-2xl hover:text-primary"
            >
              {next} {hotkeys && <Bracket>→</Bracket>}
              <span className="sr-only">, next design</span>
            </Link>
          )}
        </span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
        <figure className="self-start border border-border bg-surface">
          <div className="font-display flex items-center justify-between border-b border-border px-3 text-2xl">
            <span>{family.id}</span>
            <span className="text-muted">
              {group.id} · {group.title}
            </span>
          </div>
          <img
            src={`/renders/${family.id}.webp`}
            alt={`${family.name}, shown in use.`}
            width={1024}
            height={1024}
            className="block aspect-square w-full bg-viewer-bg"
          />
        </figure>

        <div>
          <h1 className="text-5xl sm:text-6xl">
            <span className="text-accent">{family.id}</span> {family.name}
          </h1>
          <p className="mt-4 max-w-[60ch] text-lg">{family.blurb}</p>
          <p className="mt-3 max-w-[60ch] text-muted">
            <span className="font-display text-xl text-primary">Leverage: </span>
            {family.leverage}
          </p>

          <h2 className="mt-10 text-4xl">Start from a task</h2>
          <p className="mt-1 text-sm text-muted">
            {hotkeys ? 'Press a number, or choose:' : 'Choose one:'} you can change every size in the
            designer.
          </p>
          <ol className="mt-4 grid gap-2">
            {family.presets.map((p, n) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => applyPreset(n)}
                  aria-keyshortcuts={hotkeys ? String(n + 1) : undefined}
                  className="group grid min-h-16 w-full grid-cols-[3.5rem_1fr] items-center gap-x-3 border border-border bg-surface px-3 py-2 text-left hover:border-primary hover:bg-primary hover:text-on-primary focus-visible:bg-primary focus-visible:text-on-primary"
                >
                  <span aria-hidden="true" className="font-display row-span-2 text-4xl">
                    <span className="text-accent group-hover:text-on-primary group-focus-visible:text-on-primary">
                      [
                    </span>
                    {n + 1}
                    <span className="text-accent group-hover:text-on-primary group-focus-visible:text-on-primary">
                      ]
                    </span>
                  </span>
                  <span className="font-display text-3xl leading-none">{p.label}</span>
                  <span className="text-sm text-muted group-hover:text-on-primary group-focus-visible:text-on-primary">
                    {p.description}
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <Link
            to={`/design/${family.id}`}
            className="font-display mt-6 flex min-h-16 items-center gap-4 border-2 border-primary bg-primary px-4 text-3xl text-on-primary hover:border-primary-strong hover:bg-primary-strong"
          >
            {hotkeys && <Bracket inverse>Enter</Bracket>}
            {hasStored ? 'Open the designer with my last sizes' : 'Open the designer'}
          </Link>
        </div>
      </div>
    </div>
  );
}
