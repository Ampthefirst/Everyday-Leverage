import { Link, useNavigate } from 'react-router-dom';
import { familyList } from '../../families';
import { GROUPS } from '../../families/groups';
import { showcaseParams, sizeRanges } from '../../families/describe';
import type { Family, Params } from '../../families/types';
import { useDesign } from '../../state/design';
import { useSettings } from '../../state/settings';
import { Figure } from '../Figure';

/** One design in the catalogue: its measured drawing beside what it helps with, the sizes it fits and why it works. */
function Entry({ f, n }: { f: Family; n: number }) {
  const navigate = useNavigate();
  const setParams = useDesign((s) => s.setParams);
  const hotkeys = useSettings((s) => s.hotkeys);
  const ranges = sizeRanges(f);
  const start = (i: number) => {
    const p = f.presets[i];
    setParams(f.id, { ...f.defaults, ...p.params } as Params, { preset: p.id });
    navigate(`/design/${f.id}`, { state: { fromPreset: true } });
  };
  return (
    <article
      aria-labelledby={`cat-${f.id}`}
      className="grid gap-5 border-b border-rule py-8 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:gap-10 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)]"
    >
      <div>
        <Link
          to={`/pick/${f.id}`}
          tabIndex={-1}
          aria-hidden="true"
          className="figure-sheet block px-5 pt-4 pb-3 hover:border-text"
        >
          <span className="flex items-center justify-between">
            <span className="figcaption text-base text-faint">Fig. {n}</span>
            {hotkeys && (
              <span className="hidden rounded border border-border px-1.5 text-sm text-faint md:inline">
                {n}
              </span>
            )}
          </span>
          <Figure
            familyId={f.id}
            params={showcaseParams(f)}
            className="my-3 flex h-40 items-center justify-center [&_svg]:max-h-40"
          />
        </Link>
        <p className="mt-3 flex items-center gap-3 text-sm text-muted">
          <img
            src={`/renders/${f.id}.webp`}
            alt=""
            width={1024}
            height={1024}
            loading="lazy"
            className="h-14 w-14 rounded-sm border border-rule"
          />
          As printed, in PETG
        </p>
      </div>
      <div>
        <h3 id={`cat-${f.id}`} className="font-serif text-[1.875rem] leading-tight">
          <Link
            to={`/pick/${f.id}`}
            aria-keyshortcuts={hotkeys ? String(n) : undefined}
            className="hover:underline hover:decoration-1 hover:underline-offset-4"
          >
            {f.name}
          </Link>
        </h3>
        <p className="mt-2 max-w-[38em] text-[1.125rem]">{f.blurb}</p>
        <dl className="mt-4 grid gap-x-5 gap-y-2 text-base sm:grid-cols-[7rem_1fr]">
          <dt className="figcaption text-lg text-faint">Helps with</dt>
          <dd>
            <ul className="flex flex-wrap gap-x-1">
              {f.presets.map((p, i) => (
                <li key={p.id} className="after:text-faint after:content-['·'] last:after:content-none">
                  <button
                    type="button"
                    onClick={() => start(i)}
                    className="mr-1 text-primary underline decoration-1 underline-offset-[0.2em] hover:decoration-2"
                  >
                    {p.label}
                    <span className="sr-only">: open the {f.name.toLowerCase()} with these sizes</span>
                  </button>
                </li>
              ))}
            </ul>
          </dd>
          {ranges.length > 0 && (
            <>
              <dt className="figcaption text-lg text-faint">Sizes</dt>
              <dd>{ranges.join('; ')}</dd>
            </>
          )}
          <dt className="figcaption text-lg text-faint">Leverage</dt>
          <dd className="max-w-[44em]">{f.leverage}</dd>
        </dl>
      </div>
    </article>
  );
}

/** Pick's catalogue: the nine designs in their three groups, each group introduced by how its help works. */
export function Catalogue() {
  const fams = familyList();
  return (
    <>
      <nav aria-label="Groups" className="mt-6 flex flex-wrap gap-x-6">
        {GROUPS.map((g) => (
          <a
            key={g.id}
            href={`#group-${g.id}`}
            className="tap inline-flex items-center font-semibold hover:underline"
          >
            {g.title}
          </a>
        ))}
      </nav>
      {GROUPS.map((g) => (
        <section
          key={g.id}
          id={`group-${g.id}`}
          aria-labelledby={`grp-${g.id}`}
          className="mt-14 scroll-mt-20"
        >
          <h2 id={`grp-${g.id}`} className="text-[2.1rem]">
            {g.title}
          </h2>
          <p className="mt-2 max-w-[40em] text-muted">{g.intro}</p>
          <div className="mt-6 border-t border-text">
            {fams
              .filter((f) => f.group === g.id)
              .map((f) => (
                <Entry key={f.id} f={f} n={fams.indexOf(f) + 1} />
              ))}
          </div>
        </section>
      ))}
    </>
  );
}
