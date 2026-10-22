import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../state/settings';
import { DISCLAIMERS, SHOW_DISCLAIMERS } from '../content/disclaimers';
import { isTyping } from './hotkeys';

/** The top bar keeps only the three ways in; everything else lives in the side menu. */
const TOP = [
  { to: '/', key: 'H', label: 'Home', short: 'Home' },
  { to: '/find', key: 'F', label: 'Find a design', short: 'Find' },
  { to: '/design', key: 'P', label: 'Pick a design', short: 'Pick' },
];

const MENU = [
  { to: '/learn', label: 'Learn', d: 'How leverage, grip size and strength work.' },
  { to: '/calibrate', label: 'Calibrate', d: 'Tune the strength numbers to your printer.' },
  { to: '/print-help', label: 'Get it printed', d: 'No printer? Where to take your files.' },
  { to: '/limits', label: 'Limits & safety', d: 'What these aids can and can’t do.' },
  { to: '/settings', label: 'Settings', d: 'Text size, contrast, motion, Gemini, profiles.' },
];

/** A hotkey hint in the bulletin-board style: magenta brackets, cyan letter. Part of the visible label. */
export function Key({ k, className = '' }: { k: string; className?: string }) {
  return (
    <span className={`font-display ${className}`}>
      <span className="text-accent">[</span>
      <span className="text-primary">{k}</span>
      <span className="text-accent">]</span>
    </span>
  );
}

/** Three stacked pixel bars, drawn on the same grid as the logo. */
function MenuGlyph() {
  return (
    <svg
      viewBox="0 0 8 7"
      width="20"
      height="18"
      aria-hidden="true"
      shapeRendering="crispEdges"
      fill="currentColor"
    >
      <rect y="0" width="8" height="1.4" />
      <rect y="2.8" width="8" height="1.4" />
      <rect y="5.6" width="8" height="1.4" />
    </svg>
  );
}

function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="menu-title"
      className="side-menu fixed inset-y-0 right-0 left-auto m-0 h-full max-h-none w-[min(27rem,100vw)] max-w-none border-0 border-l-[3px] border-double border-rule bg-surface p-0 text-text backdrop:bg-black/70"
      onKeyDown={(e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const n = Number(e.key);
        if (n >= 1 && n <= MENU.length) {
          e.preventDefault();
          onClose();
          navigate(MENU[n - 1].to);
        }
      }}
      onClick={(e) => {
        // A click on the backdrop (outside the panel) closes the menu.
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b-[3px] border-double border-rule px-5 py-3">
          <h2 id="menu-title" className="text-3xl text-primary">
            Menu
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="tap font-display px-3 text-2xl text-muted hover:bg-surface-2 hover:text-text"
          >
            Close <span className="text-accent">[</span>
            <span className="text-primary">Esc</span>
            <span className="text-accent">]</span>
          </button>
        </div>
        <p className="px-5 pt-4 text-sm text-muted">Press a number, or choose:</p>
        <nav aria-label="More" className="flex-1 overflow-y-auto px-2 py-2">
          <ol>
            {MENU.map((m, i) => (
              <li key={m.to}>
                <NavLink
                  to={m.to}
                  onClick={onClose}
                  aria-keyshortcuts={String(i + 1)}
                  className={({ isActive }) =>
                    `group grid min-h-16 grid-cols-[3.5rem_1fr] items-center gap-x-2 px-3 py-2 ${isActive ? 'bg-surface-2' : ''} hover:bg-primary hover:text-on-primary focus-visible:bg-primary focus-visible:text-on-primary`
                  }
                >
                  <span aria-hidden="true" className="font-display row-span-2 text-4xl">
                    <span className="text-accent group-hover:text-on-primary group-focus-visible:text-on-primary">
                      [
                    </span>
                    {i + 1}
                    <span className="text-accent group-hover:text-on-primary group-focus-visible:text-on-primary">
                      ]
                    </span>
                  </span>
                  <span className="font-display text-3xl leading-none">{m.label}</span>
                  <span className="text-sm text-muted group-hover:text-on-primary group-focus-visible:text-on-primary">
                    {m.d}
                  </span>
                </NavLink>
              </li>
            ))}
          </ol>
        </nav>
        <p className="border-t border-rule px-5 py-3 text-sm text-muted">
          Shortcuts: H home · F find · P pick · M menu. Turn them off in Settings.
        </p>
      </div>
    </dialog>
  );
}

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const hotkeys = useSettings((s) => s.hotkeys);

  // Move focus to the main region on navigation (not on first load) so screen readers announce the new page.
  const first = useRef(true);
  useEffect(() => {
    setMenuOpen(false);
    if (first.current) {
      first.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Single-key shortcuts, ignored while typing, with modifiers, or while a dialog is open.
  useEffect(() => {
    if (!hotkeys) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if (document.querySelector('dialog[open]')) return;
      const k = e.key.toLowerCase();
      const to = k === 'h' ? '/' : k === 'f' ? '/find' : k === 'p' ? '/design' : null;
      if (to) {
        e.preventDefault();
        navigate(to);
      } else if (k === 'm') {
        e.preventDefault();
        setMenuOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotkeys, navigate]);

  const isDesigner = location.pathname.startsWith('/design/');
  const onPick = location.pathname.startsWith('/pick/');
  const inMenu = MENU.some((m) => location.pathname.startsWith(m.to));

  return (
    <div className="flex min-h-full flex-col">
      <a href="#main" className="sr-only-focusable z-50 bg-primary p-3 text-on-primary">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b-[3px] border-double border-rule bg-surface">
        <div className="mx-auto flex max-w-7xl items-stretch gap-1 px-2 sm:px-4">
          <Link
            to="/"
            aria-label="Everyday Leverage, home"
            className="tap flex shrink-0 items-center gap-2 pr-2"
          >
            <img src="/favicon.svg" alt="" width={32} height={32} className="[image-rendering:pixelated]" />
            <span aria-hidden="true" className="font-display hidden text-[1.7rem] text-text lg:inline">
              Everyday Leverage
            </span>
          </Link>
          <nav aria-label="Main" className="flex min-w-0 items-stretch">
            {TOP.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                aria-keyshortcuts={hotkeys ? n.key.toLowerCase() : undefined}
                className={({ isActive }) =>
                  `tap font-display flex items-center gap-1.5 px-2 text-2xl sm:px-3 ${isActive || (n.to === '/design' && onPick) ? 'bg-primary text-on-primary' : 'text-text hover:bg-surface-2 hover:text-primary'}`
                }
              >
                {({ isActive: own }) => {
                  const isActive = own || (n.to === '/design' && onPick);
                  return (
                    <>
                      {hotkeys && (
                        <Key
                          k={n.key}
                          className={`hidden md:inline ${isActive ? '[&_span]:!text-on-primary' : ''}`}
                        />
                      )}
                      <span className="sm:hidden">{n.short}</span>
                      <span className="hidden sm:inline">{n.label}</span>
                    </>
                  );
                }}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            className={`tap font-display ml-auto flex items-center gap-2 px-2 text-2xl sm:px-3 ${inMenu ? 'bg-surface-2 text-primary' : 'text-text hover:bg-surface-2 hover:text-primary'}`}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-keyshortcuts={hotkeys ? 'm' : undefined}
            onClick={() => setMenuOpen(true)}
          >
            <MenuGlyph />
            Menu
          </button>
        </div>
      </header>
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      {!isDesigner && SHOW_DISCLAIMERS && (
        <footer className="border-t-[3px] border-double border-rule bg-surface px-4 py-6 text-sm text-muted">
          <div className="mx-auto max-w-7xl space-y-1">
            <p>{DISCLAIMERS.footer.slice(0, 2).join(' ')}</p>
            <p>
              {DISCLAIMERS.footer[2]}{' '}
              <NavLink className="text-primary underline" to="/limits">
                Read the limits
              </NavLink>
              .
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
