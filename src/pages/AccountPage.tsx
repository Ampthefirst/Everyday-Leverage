import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Note } from '../components/Card';
import { signIn, useAccount } from '../accounts/sync';

type Mode = 'signin' | 'signup';

/** Sign in or create an account (email and password). Only reachable when accounts are switched on. */
export default function AccountPage() {
  const configured = useAccount((s) => s.configured);
  const user = useAccount((s) => s.user);
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);

  const shell = (children: React.ReactNode) => (
    <div className="mx-auto max-w-[90rem] px-4 py-12 sm:px-6 lg:px-24 lg:py-16">
      <div className="max-w-md">{children}</div>
    </div>
  );

  if (!configured)
    return shell(
      <>
        <h1 className="text-[2.6rem]">Accounts are off</h1>
        <p className="mt-4 text-muted">
          This site saves designs on this device only. Everything else works without an account.
        </p>
        <Link to="/" className="mt-6 inline-block font-semibold text-primary underline">
          Back to the start
        </Link>
      </>,
    );

  if (user)
    return shell(
      <>
        <h1 className="text-[2.6rem]">You’re signed in</h1>
        <p className="mt-4 text-muted">As {user.email}. Your saved designs sync to your account.</p>
        <Link to="/#shelf" className="mt-6 inline-block font-semibold text-primary underline">
          See your saved designs
        </Link>
      </>,
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const r = await signIn(mode, email, password);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    if (r.confirmEmail) return setConfirm(true);
    navigate('/#shelf');
  };

  const switchTo = (m: Mode) => {
    setMode(m);
    setError('');
    setConfirm(false);
  };

  return shell(
    <>
      <h1 className="text-[2.6rem]">{mode === 'signin' ? 'Sign in' : 'Create an account'}</h1>
      <p className="mt-3 text-muted">
        {mode === 'signin'
          ? 'Your saved designs follow you to any device.'
          : 'An account keeps your saved designs: their names, sizes and where you stopped. Nothing else.'}
      </p>
      {confirm ? (
        <div className="mt-8">
          <Note tone="info">
            <p className="font-semibold">Check your email</p>
            <p className="mt-1">We sent a link to {email}. Open it, then come back and sign in.</p>
          </Note>
          <Button variant="secondary" className="mt-4" onClick={() => switchTo('signin')}>
            Sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
          <label className="block">
            <span className="font-semibold">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="tap mt-1.5 block w-full rounded-md border border-border bg-surface px-3 hover:border-text"
            />
          </label>
          <div>
            <label htmlFor="password" className="font-semibold">
              Password
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="password"
                type={show ? 'text' : 'password'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={8}
                aria-describedby="password-help"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="tap block w-full min-w-0 rounded-md border border-border bg-surface px-3 hover:border-text"
              />
              <Button
                type="button"
                variant="secondary"
                aria-pressed={show}
                onClick={() => setShow((s) => !s)}
              >
                {show ? 'Hide' : 'Show'}
              </Button>
            </div>
            <p id="password-help" className="mt-1.5 text-base text-muted">
              At least 8 characters.
            </p>
          </div>
          {error && (
            <p role="alert" className="rounded-md border border-bad bg-bad-bg p-3">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy} className="min-h-14 w-full">
            {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
      )}
      <p className="mt-8 border-t border-rule pt-5 text-muted">
        {mode === 'signin' ? 'New here? ' : 'Already have an account? '}
        <button
          type="button"
          onClick={() => switchTo(mode === 'signin' ? 'signup' : 'signin')}
          className="font-semibold text-primary underline"
        >
          {mode === 'signin' ? 'Create an account' : 'Sign in'}
        </button>
      </p>
      <p className="mt-3 text-base text-faint">
        No account needed to use the app. Without one, designs stay on this device.
      </p>
    </>,
  );
}
