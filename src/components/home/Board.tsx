import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { familyList } from '../../families';
import { GROUPS } from '../../pages/PickPage';
import { prefersReducedMotion } from '../../state/settings';

/**
 * The nine designs as framed picture windows, three rows by group. Every part turns a little to face
 * the cursor; the one under it comes forward, turns further and shows its name.
 */
export function Board() {
  const fams = familyList();
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const aim = (x: number | null, y: number | null) => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      root.current?.querySelectorAll<HTMLElement>('[data-tile]').forEach((t) => {
        if (x === null || y === null) {
          t.style.setProperty('--rx', '0deg');
          t.style.setProperty('--ry', '0deg');
          return;
        }
        const r = t.getBoundingClientRect();
        const dx = Math.max(-1, Math.min(1, (x - (r.left + r.width / 2)) / 520));
        const dy = Math.max(-1, Math.min(1, (y - (r.top + r.height / 2)) / 520));
        t.style.setProperty('--ry', `${(dx * 16).toFixed(2)}deg`);
        t.style.setProperty('--rx', `${(-dy * 12).toFixed(2)}deg`);
      });
    });
  };

  return (
    <div
      ref={root}
      className="board space-y-8"
      onPointerMove={(e) => {
        if (e.pointerType === 'mouse' && !prefersReducedMotion()) aim(e.clientX, e.clientY);
      }}
      onPointerLeave={() => aim(null, null)}
    >
      {GROUPS.map((g) => (
        <section key={g.id} aria-labelledby={`row-${g.id}`}>
          <h3 id={`row-${g.id}`} className="font-display mb-3 flex items-center gap-3 text-3xl">
            <span className="text-accent">{g.id}</span>
            <span className="text-text">{g.title}</span>
            <span aria-hidden="true" className="h-0 flex-1 border-t-[3px] border-double border-rule" />
          </h3>
          <ul className="grid grid-cols-3 gap-2 sm:gap-4">
            {fams
              .filter((f) => f.group === g.id)
              .map((f) => (
                <li key={f.id} className="flex">
                  <Link to={`/design/${f.id}`} data-tile className="tile group flex w-full">
                    <span className="tile-frame flex w-full flex-col border border-border bg-surface">
                      <span className="tile-bar font-display flex items-center justify-between gap-2 border-b border-border px-2 text-xl">
                        <span>{f.id}</span>
                        <span className="tile-open text-base">Open</span>
                      </span>
                      <span className="block overflow-hidden bg-viewer-bg [perspective:700px]">
                        <img
                          src={`/renders/${f.id}.webp`}
                          alt=""
                          width={1024}
                          height={1024}
                          loading="lazy"
                          decoding="async"
                          className="tile-img block aspect-square w-full"
                        />
                      </span>
                      <span className="tile-name mt-auto block min-h-[2.6em] border-t border-border px-2 py-1.5 text-sm leading-tight sm:min-h-0 sm:text-base">
                        {f.name}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
