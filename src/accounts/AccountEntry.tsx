import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { initAccounts, signOut, useAccount } from './sync';

/** Signed in: the first letter of the email, with a small menu for the shelf and signing out. */
function AccountMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen((o) => !o)}
        className="tap flex items-center justify-center rounded-md hover:bg-surface-2"
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-text font-serif text-base uppercase"
        >
          {email[0]}
        </span>
        <span className="sr-only">Account: {email}</span>
      </button>
      {open && (
        <div
          id="account-menu"
          className="absolute top-full right-0 z-40 mt-2 w-72 rounded-md border border-border bg-surface py-2 shadow-[0_16px_40px_-20px_rgb(22_24_29/0.45)]"
        >
          <p className="border-b border-rule px-4 pt-1 pb-3 text-base text-muted">
            Signed in as <span className="block truncate font-semibold text-text">{email}</span>
          </p>
          <Link
            to="/designs"
            onClick={() => setOpen(false)}
            className="tap flex items-center px-4 font-medium hover:bg-surface-2"
          >
            Your designs
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className="tap flex w-full items-center px-4 text-left font-medium hover:bg-surface-2"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * The header's account slot. Hidden until the server reports that accounts are configured
 * (docs/accounts-setup.md); then it shows "Sign in", or the signed-in person's initial and menu.
 */
export function AccountEntry() {
  const configured = useAccount((s) => s.configured);
  const user = useAccount((s) => s.user);
  useEffect(() => {
    void initAccounts();
  }, []);
  if (!configured) return null;
  if (user) return <AccountMenu email={user.email} />;
  return (
    <Link
      to="/account"
      className="tap inline-flex items-center rounded-md border border-border px-3.5 text-base font-semibold whitespace-nowrap hover:border-text"
    >
      Sign in
    </Link>
  );
}
