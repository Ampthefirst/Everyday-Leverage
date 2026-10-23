import { describe, expect, it } from 'vitest';
import { handleAuth, handleProjects, type Deps } from '../../api/_accounts/handlers';
import { memoryBackend } from '../../api/_accounts/memory';
import { RateLimiter } from '../../api/_accounts/rateLimit';
import { cleanProject } from '../../api/_accounts/validate';
import { backendFromEnv } from '../../api/_accounts/supabase';

const ORIGIN = 'https://el.example';

function deps(backend = memoryBackend()): Deps & { backend: ReturnType<typeof memoryBackend> } {
  return { backend, ipLimit: new RateLimiter(100, 60_000), emailLimit: new RateLimiter(100, 60_000) };
}

/** A tiny cookie jar so tests follow the session the way a browser would. */
function client(d: Deps) {
  const jar = new Map<string, string>();
  async function send(handler: typeof handleAuth, method: string, path: string, body?: unknown) {
    const headers: Record<string, string> = { origin: ORIGIN, host: 'el.example' };
    if (jar.size) headers.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
    if (body) headers['content-type'] = 'application/json';
    const res = await handler(
      new Request(`${ORIGIN}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined }),
      d,
    );
    for (const c of res.headers.getSetCookie()) {
      const [kv] = c.split(';');
      const [k, v] = kv.split('=');
      if (/Max-Age=0/.test(c)) jar.delete(k);
      else jar.set(k, v);
    }
    return {
      status: res.status,
      body: (await res.json()) as Record<string, unknown>,
      cookies: res.headers.getSetCookie(),
    };
  }
  return {
    jar,
    auth: (method: string, body?: unknown) => send(handleAuth, method, '/api/auth', body),
    projects: (method: string, body?: unknown, q = '') =>
      send(handleProjects, method, `/api/projects${q}`, body),
  };
}

const project = (over: Record<string, unknown> = {}) => ({
  id: 'p1',
  name: 'Lid and jar opener · Jam jars',
  familyId: 'B1',
  params: { lidMin: 45, lidMax: 85, steps: 3, lever: 150, hand: 'right', grip: true },
  presetId: 'jam',
  step: 'check',
  updatedAt: '2026-10-20T10:00:00.000Z',
  ...over,
});

describe('accounts: switched off', () => {
  it('reports not configured, so the app hides sign-in', async () => {
    const d = { ...deps(), backend: null };
    const r = await handleAuth(new Request(`${ORIGIN}/api/auth`), d);
    expect(await r.json()).toEqual({ configured: false, user: null });
    expect((await handleProjects(new Request(`${ORIGIN}/api/projects`), d)).status).toBe(503);
  });
  it('needs both Supabase variables', () => {
    expect(backendFromEnv({})).toBeNull();
    expect(backendFromEnv({ SUPABASE_URL: 'https://x.supabase.co' })).toBeNull();
    expect(backendFromEnv({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_ANON_KEY: 'k' })).not.toBeNull();
  });
});

describe('accounts: sign up, sign in, sign out', () => {
  it('creates an account and sets HttpOnly, Secure, SameSite session cookies', async () => {
    const c = client(deps());
    const r = await c.auth('POST', {
      action: 'signup',
      email: ' Jo@Example.com ',
      password: 'correct horse',
    });
    expect(r.status).toBe(200);
    expect(r.body.user).toEqual({ email: 'jo@example.com' });
    expect(r.cookies).toHaveLength(2);
    for (const ck of r.cookies) expect(ck).toMatch(/HttpOnly; Secure; SameSite=Lax/);
    expect((await c.auth('GET')).body).toEqual({ configured: true, user: { email: 'jo@example.com' } });
  });

  it('refuses a duplicate email, a short password and a wrong password in plain words', async () => {
    const d = deps();
    const c = client(d);
    await c.auth('POST', { action: 'signup', email: 'jo@example.com', password: 'correct horse' });
    expect(
      (await c.auth('POST', { action: 'signup', email: 'jo@example.com', password: 'another one' })).status,
    ).toBe(409);
    expect(
      (await c.auth('POST', { action: 'signup', email: 'al@example.com', password: 'short' })).status,
    ).toBe(400);
    const bad = await client(d).auth('POST', {
      action: 'signin',
      email: 'jo@example.com',
      password: 'wrong pass',
    });
    expect(bad.status).toBe(401);
    expect(bad.body.error).toMatch(/don’t match/);
  });

  it('signs in, then signs out and clears the cookies', async () => {
    const d = deps();
    await client(d).auth('POST', { action: 'signup', email: 'jo@example.com', password: 'correct horse' });
    const c = client(d);
    expect(
      (await c.auth('POST', { action: 'signin', email: 'jo@example.com', password: 'correct horse' })).status,
    ).toBe(200);
    expect(c.jar.size).toBe(2);
    await c.auth('POST', { action: 'signout' });
    expect(c.jar.size).toBe(0);
    expect((await c.auth('GET')).body.user).toBeNull();
  });

  it('asks to confirm the email when the database requires it', async () => {
    const c = client(deps(memoryBackend({ confirmEmail: true })));
    const r = await c.auth('POST', { action: 'signup', email: 'jo@example.com', password: 'correct horse' });
    expect(r.body).toEqual({ user: null, confirmEmail: true });
    expect(c.jar.size).toBe(0);
  });

  it('refreshes an expired access token from the refresh cookie', async () => {
    const c = client(deps(memoryBackend({ ttl: -1 })));
    await c.auth('POST', { action: 'signup', email: 'jo@example.com', password: 'correct horse' });
    const before = c.jar.get('el_rt');
    expect((await c.auth('GET')).body.user).toEqual({ email: 'jo@example.com' });
    expect(c.jar.get('el_rt')).not.toBe(before);
  });

  it('rejects cross-site posts and oversized bodies', async () => {
    const d = deps();
    const cross = await handleAuth(
      new Request(`${ORIGIN}/api/auth`, {
        method: 'POST',
        headers: { origin: 'https://evil.example', host: 'el.example' },
        body: JSON.stringify({ action: 'signin', email: 'a@b.co', password: 'xxxxxxxx' }),
      }),
      d,
    );
    expect(cross.status).toBe(403);
    const big = await client(d).auth('POST', {
      action: 'signin',
      email: 'a@b.co',
      password: 'x'.repeat(3000),
    });
    expect(big.status).toBe(400);
  });

  it('rate-limits repeated attempts on one email', async () => {
    const d = { ...deps(), emailLimit: new RateLimiter(3, 60_000) };
    const c = client(d);
    const tries = [];
    for (let i = 0; i < 5; i++)
      tries.push(
        (await c.auth('POST', { action: 'signin', email: 'jo@example.com', password: 'guessing ' + i }))
          .status,
      );
    expect(tries).toEqual([401, 401, 401, 429, 429]);
  });
});

describe('accounts: projects', () => {
  async function signedIn(d = deps()) {
    const c = client(d);
    await c.auth('POST', {
      action: 'signup',
      email: `u${Math.random()}@example.com`,
      password: 'correct horse',
    });
    return { c, d };
  }

  it('needs a session', async () => {
    expect((await client(deps()).projects('GET')).status).toBe(401);
  });

  it('saves, lists and deletes, and each account sees only its own designs', async () => {
    const d = deps();
    const { c: a } = await signedIn(d);
    const { c: b } = await signedIn(d);
    expect((await a.projects('PUT', { project: project() })).status).toBe(200);
    expect((await a.projects('GET')).body.projects).toHaveLength(1);
    expect((await b.projects('GET')).body.projects).toHaveLength(0);
    await a.projects('DELETE', undefined, '?id=p1');
    expect((await a.projects('GET')).body.projects).toHaveLength(0);
  });

  it('keeps the newer copy', async () => {
    const { c } = await signedIn();
    await c.projects('PUT', { project: project({ name: 'New', updatedAt: '2026-10-21T00:00:00Z' }) });
    await c.projects('PUT', { project: project({ name: 'Old', updatedAt: '2026-10-19T00:00:00Z' }) });
    const [p] = (await c.projects('GET')).body.projects as { name: string }[];
    expect(p.name).toBe('New');
  });

  it('stores only the shelf fields: never finder answers or anything else a client sends', async () => {
    const d = deps();
    const { c } = await signedIn(d);
    await c.projects('PUT', {
      project: { ...project(), answers: { task: 'turn', problem: 'pain' }, notes: 'arthritis' },
    });
    const stored = JSON.stringify(d.backend.dump());
    expect(stored).not.toMatch(/answers|problem|notes|arthritis/);
  });
});

describe('accounts: project validation', () => {
  it('accepts a shelf project and rejects malformed ones', () => {
    expect(cleanProject(project())).toMatchObject({ id: 'p1', familyId: 'B1', step: 'check' });
    expect(cleanProject(project({ familyId: 'Z9' }))).toBeNull();
    expect(cleanProject(project({ step: 'done' }))).toBeNull();
    expect(cleanProject(project({ name: '' }))).toBeNull();
    expect(cleanProject(project({ id: '../x' }))).toBeNull();
    expect(cleanProject(project({ params: { lever: Infinity } }))).toBeNull();
    expect(cleanProject(project({ params: { lever: { nested: 1 } } }))).toBeNull();
    expect(cleanProject(project({ updatedAt: 'yesterday' }))).toBeNull();
  });
});

describe('accounts: Supabase sign-up errors are named, not lumped together', () => {
  async function signUpWith(status: number, reply: Record<string, unknown>) {
    const { supabaseBackend } = await import('../../api/_accounts/supabase');
    const real = globalThis.fetch;
    globalThis.fetch = (async () => new Response(JSON.stringify(reply), { status })) as typeof fetch;
    try {
      return await supabaseBackend('https://x.supabase.co', 'k').signUp('jo@example.com', 'correct horse');
    } finally {
      globalThis.fetch = real;
    }
  }
  it('maps the common cases', async () => {
    expect(
      await signUpWith(429, { error_code: 'over_email_send_rate_limit', msg: 'email rate limit exceeded' }),
    ).toMatchObject({ error: 'emailLimit' });
    expect(
      await signUpWith(500, {
        code: 500,
        error_code: 'unexpected_failure',
        msg: 'Error sending confirmation email',
      }),
    ).toMatchObject({ error: 'emailSend' });
    expect(await signUpWith(422, { error_code: 'signup_disabled' })).toMatchObject({ error: 'signupOff' });
    expect(await signUpWith(400, { error_code: 'email_address_invalid' })).toMatchObject({
      error: 'badEmail',
    });
    expect(await signUpWith(422, { error_code: 'weak_password' })).toMatchObject({ error: 'weak' });
  });
  it('passes an unknown code through as a short detail', async () => {
    expect(await signUpWith(418, { error_code: 'teapot' })).toEqual({
      ok: false,
      error: 'unavailable',
      detail: '418 teapot',
    });
  });
});
