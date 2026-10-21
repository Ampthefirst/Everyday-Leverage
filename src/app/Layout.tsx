import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

const NAV = [
  { to: '/find', label: 'Find a design' },
  { to: '/design', label: 'Pick a design' },
  { to: '/calibrate', label: 'Calibrate' },
  { to: '/learn', label: 'Learn' },
  { to: '/print-help', label: 'Get it printed' },
  { to: '/limits', label: 'Limits & safety' },
  { to: '/settings', label: 'Display' },
];

export function Layout() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Move focus to the main region on navigation so screen readers announce the new page.
  useEffect(() => {
    setMenuOpen(false);
    mainRef.current?.focus();
  }, [location.pathname]);

  const isDesigner = location.pathname.startsWith('/design/');

  return (
    <div className="flex min-h-full flex-col">
      <a href="#main" className="sr-only-focusable z-50 bg-primary p-3 text-on-primary">
        Skip to content
      </a>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2">
          <NavLink to="/" className="tap flex items-center gap-2 text-lg font-bold">
            <img src="/favicon.svg" alt="" width={32} height={32} />
            Everyday Leverage
          </NavLink>
          <button
            type="button"
            className="tap ml-auto rounded-lg border border-border px-3 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            Menu
          </button>
          <nav
            id="main-nav"
            aria-label="Main"
            className={`${menuOpen ? 'flex' : 'hidden'} absolute left-0 right-0 top-16 z-40 flex-col border-b border-border bg-surface p-2 lg:static lg:ml-auto lg:flex lg:flex-row lg:border-0 lg:p-0`}
          >
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/design'}
                className={({ isActive }) =>
                  `tap flex items-center rounded-lg px-3 font-medium ${isActive ? 'bg-surface-2 text-primary underline underline-offset-4' : 'hover:bg-surface-2'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      {!isDesigner && (
        <footer className="border-t border-border bg-surface px-4 py-6 text-sm text-muted">
          <div className="mx-auto max-w-7xl space-y-1">
            <p>
              Everyday Leverage makes convenience aids. It is not a medical device and does not replace an
              occupational therapist or doctor. Printed plastic is not food-safe.
            </p>
            <p>
              Strength numbers are estimates. <NavLink className="underline" to="/limits">Read the limits</NavLink>.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
