import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSettings } from '../state/settings';
import { DISCLAIMERS, showDisclaimers } from '../content/disclaimers';
import { AccountEntry } from '../accounts/AccountEntry';
import { useAccount } from '../accounts/sync';
import { isTyping } from './hotkeys';

/** The header keeps the ways in; everything else lives in the side menu. The wordmark goes home. */
const TOP = [
  { to: '/find', key: 'F', label: 'Find a design' },
  { to: '/design', key: 'P', label: 'Pick a design' },
  { to: '/learn', key: '', label: 'Learn' },
];

const MENU = [
  { to: '/learn', label: 'Learn', d: 'How leverage, grip size and strength work.' },
  { to: '/calibrate', label: 'Calibrate', d: 'Tune the strength numbers to your printer.' },
  { to: '/print-help', label: 'Get it printed', d: 'No printer? Where to take your files.' },
  { to: '/limits', label: 'Limits & safety', d: 'What these aids can and can’t do.' },
  { to: '/settings', label: 'Settings', d: 'Text size, contrast, motion, Gemini, profile.' },
];

const FOOTER_LINKS = [
  { to: '/learn', label: 'Learn' },
  { to: '/limits', label: 'Limits & safety' },
  { to: '/print-help', label: 'Get it printed' },
  { to: '/settings', label: 'Settings' },
];

/** The lever-on-a-fulcrum mark, in ink with an ink-blue fulcrum. */
export function LeverMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M3 22 L29 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M12 28 L16 19.5 L20 28 Z" fill="var(--color-primary)" />
    </svg>
  );
}

function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  // The presentation build keeps the Limits page reachable by link but does not promote it.
  const user = useAccount((s) => s.user);
  const base = showDisclaimers() ? MENU : MENU.filter((m) => m.to !== '/limits');
  const menu = user
    ? [
        { to: '/designs', label: 'Your designs', d: 'Everything you’ve saved, with sizes and strength.' },
        ...base,
      ]
    : base;
  const navigate = useNavigate();
  const hotkeys = useSettings((s) => s.hotkeys);
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
      className="side-menu fixed inset-y-0 right-0 left-auto m-0 h-full max-h-none w-[min(26rem,100vw)] max-w-none border-0 border-l border-border bg-surface p-0 text-text"
      onKeyDown={(e) => {
        if (e.ctrlKey || e.metaKey || e.altKey || !hotkeys) return;
        const n = Number(e.key);
        if (n >= 1 && n <= menu.length) {
          e.preventDefault();
          onClose();
          navigate(menu[n - 1].to);
        }
      }}
      onClick={(e) => {
        // A click on the backdrop (outside the panel) closes the menu.
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between border-b border-rule px-6">
          <h2 id="menu-title" className="text-2xl">
            Menu
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="tap rounded-md border border-border px-4 font-semibold hover:border-text"
          >
            Close
          </button>
        </div>
        <nav aria-label="More" className="flex-1 overflow-y-auto">
          {/* On phones the header has no room for the main links, so they lead the menu. */}
          <ul className="md:hidden">
            {[{ to: '/', label: 'Home' }, ...TOP.slice(0, 2)].map((m) => (
              <li key={m.to}>
                <NavLink
                  to={m.to}
                  end={m.to === '/'}
                  onClick={onClose}
                  className="block border-b border-rule px-6 py-4 font-semibold hover:bg-surface-2"
                >
                  {m.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <ol>
            {menu.map((m, i) => (
              <li key={m.to}>
                <NavLink
                  to={m.to}
                  onClick={onClose}
                  aria-keyshortcuts={hotkeys ? String(i + 1) : undefined}
                  className={({ isActive }) =>
                    `block border-b border-rule px-6 py-4 hover:bg-surface-2 ${isActive ? 'bg-surface-2 shadow-[inset_3px_0_0_var(--color-text)]' : ''}`
                  }
                >
                  <span className="block font-semibold">{m.label}</span>
                  <span className="block text-base text-muted">{m.d}</span>
                </NavLink>
              </li>
            ))}
          </ol>
        </nav>
        {hotkeys && (
          <p className="px-6 py-4 text-sm text-faint">
            Shortcuts: H home · F find · P pick · M menu · numbers in this menu. In the designer: ← → steps, A
            all settings, Q quick mode. Turn them off in Settings.
          </p>
        )}
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
  const onPick = location.pathname.startsWith('/pick/') || isDesigner;

  return (
    <div className="flex min-h-full flex-col">
      <a href="#main" className="sr-only-focusable z-50 bg-primary p-3 text-on-primary">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 h-16 border-b border-rule bg-surface">
        <div className="mx-auto flex h-full max-w-[90rem] items-center gap-2 px-4 sm:px-6 lg:px-24">
          <Link
            to="/"
            aria-keyshortcuts={hotkeys ? 'h' : undefined}
            className="tap -ml-1 flex shrink-0 items-center gap-2.5 rounded-md px-1 text-text"
          >
            <LeverMark />
            <span className="font-serif text-lg font-medium tracking-tight whitespace-nowrap sm:text-[1.4rem]">
              Everyday Leverage
            </span>
          </Link>
          <nav aria-label="Main" className="ml-6 hidden items-stretch md:flex">
            {TOP.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                aria-keyshortcuts={hotkeys && n.key ? n.key.toLowerCase() : undefined}
                className={({ isActive }) =>
                  `tap flex items-center px-3.5 text-base font-medium ${isActive || (n.to === '/design' && onPick) ? 'text-text shadow-[inset_0_-2px_0_var(--color-text)]' : 'text-muted hover:text-text'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className="tap rounded-md px-3 text-base font-medium text-muted hover:bg-surface-2 hover:text-text"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-keyshortcuts={hotkeys ? 'm' : undefined}
              onClick={() => setMenuOpen(true)}
            >
              Menu
            </button>
            <AccountEntry />
          </div>
        </div>
      </header>
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      {!isDesigner && (
        <footer className="border-t border-rule">
          <div className="mx-auto flex max-w-[90rem] flex-col gap-3 px-4 py-6 text-sm text-faint sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-24">
            {showDisclaimers() && <p>{DISCLAIMERS.footer.join(' ')}</p>}
            <nav aria-label="Footer" className="-mx-2 flex shrink-0 flex-wrap lg:flex-nowrap">
              {FOOTER_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="tap inline-flex items-center px-2 text-muted hover:text-text"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </footer>
      )}
    </div>
  );
}
