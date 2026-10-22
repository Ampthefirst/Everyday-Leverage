import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { familyList } from '../../families';
import { GROUPS } from '../../families/groups';
import { prefersReducedMotion } from '../../state/settings';

/** Turn strips (scripts/render-parts.mjs --turn): seven studio renders per part, camera yaw −30°…+30°. */
const TURN_FRAMES = 7;
const turnSrc = (id: string, k: number) => `/renders/turn/${id}-${k}.webp`;

/**
 * The nine designs as framed picture windows, three rows by group. Every part turns to face the cursor
 * (real renders from seven camera angles, swapped by the cursor's position); the one under it comes
 * forward and shows its name.
 */
export function Board({ numbered = false }: { numbered?: boolean }) {
  const fams = familyList();
  const order = fams.map((f) => f.id);
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const preloaded = useRef(false);
  const preload = () => {
    if (preloaded.current) return;
    preloaded.current = true;
    for (const id of order) for (let k = 0; k < TURN_FRAMES; k++) new Image().src = turnSrc(id, k);
  };

  const aim = (x: number | null, y: number | null) => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      root.current?.querySelectorAll<HTMLElement>('[data-tile]').forEach((t) => {
        const img = t.querySelector<HTMLImageElement>('img')!;
        const id = t.dataset.tile!;
        if (x === null || y === null) {
          t.style.setProperty('--rx', '0deg');
          img.src = `/renders/${id}.webp`;
          return;
        }
        const r = t.getBoundingClientRect();
        const dx = Math.max(-1, Math.min(1, (x - (r.left + r.width / 2)) / 520));
        const dy = Math.max(-1, Math.min(1, (y - (r.top + r.height / 2)) / 520));
        // The part turns toward the cursor: a different camera angle, not a tilted picture.
        const k = Math.round(((1 - dx) / 2) * (TURN_FRAMES - 1));
        const src = turnSrc(id, k);
        if (!img.src.endsWith(src)) img.src = src;
        t.style.setProperty('--rx', `${(-dy * 6).toFixed(2)}deg`);
      });
    });
  };

  return (
    <div
      ref={root}
      className="board space-y-8"
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || prefersReducedMotion()) return;
        preload();
        aim(e.clientX, e.clientY);
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
                  <Link
                    to={`/pick/${f.id}`}
                    data-tile={f.id}
                    aria-keyshortcuts={numbered ? String(order.indexOf(f.id) + 1) : undefined}
                    className="tile group flex w-full"
                  >
                    <span className="tile-frame flex w-full flex-col border-[3px] border-double border-border bg-surface">
                      <span className="tile-bar font-display flex items-center justify-between gap-2 border-b border-border px-2 text-xl">
                        <span>
                          {numbered && (
                            <span className="tile-num mr-1.5 text-muted">
                              <span className="text-accent">[</span>
                              {order.indexOf(f.id) + 1}
                              <span className="text-accent">]</span>
                            </span>
                          )}
                          {f.id}
                        </span>
                        <span className="tile-open text-base">Open</span>
                      </span>
                      <span className="relative block overflow-hidden bg-viewer-bg [perspective:700px]">
                        <img
                          src={`/renders/${f.id}.webp`}
                          alt=""
                          width={1024}
                          height={1024}
                          loading="lazy"
                          decoding="async"
                          className="tile-img block aspect-square w-full"
                        />
                        {!numbered && (
                          <span className="tile-name font-display absolute inset-x-0 bottom-0 bg-primary px-2 py-1 text-lg leading-tight text-on-primary sm:text-xl">
                            {f.name}
                          </span>
                        )}
                      </span>
                      {numbered && (
                        <span className="mt-auto block border-t border-border px-2 py-1.5 text-sm leading-tight sm:text-base">
                          {f.name}
                        </span>
                      )}
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
