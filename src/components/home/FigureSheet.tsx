import { Link } from 'react-router-dom';
import { familyList } from '../../families';
import { GROUPS } from '../../families/groups';
import type { Params } from '../../families/types';
import { Figure } from '../Figure';

/** Each design drawn at its first task's sizes (what "Start from a task" opens with). */
export function showcaseParams(f: ReturnType<typeof familyList>[number]): Params {
  const p = f.presets[0];
  return f.repair({ ...f.defaults, ...(p?.params ?? {}) } as Params);
}

/**
 * The nine designs as a sheet of figures in a hairline grid, grouped by what they help with. Each cell is
 * the design's own measured drawing, its name and one plain sentence. `numbered` shows the number keys.
 */
export function FigureSheet({ numbered = false }: { numbered?: boolean }) {
  const fams = familyList();
  return (
    <div className="border-t border-l border-border">
      {GROUPS.map((g) => (
        <section key={g.id} aria-labelledby={`grp-${g.id}`} className="grid sm:grid-cols-2 lg:grid-cols-3">
          <h3
            id={`grp-${g.id}`}
            className="col-span-full flex flex-wrap items-baseline gap-x-4 gap-y-1 border-r border-b border-border bg-surface-2 px-6 py-3.5"
          >
            <span className="font-semibold">{g.title}</span>
            <span className="text-base font-normal text-muted">{g.lead}</span>
          </h3>
          {fams
            .filter((f) => f.group === g.id)
            .map((f) => {
              const n = fams.indexOf(f) + 1;
              return (
                <Link
                  key={f.id}
                  to={`/pick/${f.id}`}
                  aria-keyshortcuts={numbered ? String(n) : undefined}
                  className="group flex min-h-72 flex-col border-r border-b border-border bg-surface px-6 pt-5 pb-6 hover:bg-surface-2 focus-visible:z-10"
                >
                  <span className="flex items-center justify-between">
                    <span className="figcaption text-base text-faint">Fig. {n}</span>
                    {numbered && (
                      <span
                        aria-hidden="true"
                        className="hidden rounded border border-border px-1.5 py-0.5 text-sm text-faint md:inline"
                      >
                        {n}
                      </span>
                    )}
                  </span>
                  <Figure
                    familyId={f.id}
                    params={showcaseParams(f)}
                    className="my-4 flex h-36 items-center justify-center [&_svg]:max-h-36"
                  />
                  <span className="font-serif text-[1.375rem] leading-snug font-medium group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                    {f.name}
                  </span>
                  <span className="mt-1.5 text-base text-muted">{f.blurb}</span>
                </Link>
              );
            })}
        </section>
      ))}
    </div>
  );
}
