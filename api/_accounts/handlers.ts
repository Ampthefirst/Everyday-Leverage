/**
 * The account endpoints as plain Request → Response functions, so they run the same on Vercel and in unit
 * tests (with the in-memory backend). api/auth.ts and api/projects.ts only pick the backend and call these.
 */
import type { AccountsBackend, AccountUser } from './types.js';
import {
  ACCESS,
  REFRESH,
  clearCookies,
  clientIp,
  json,
  readCookie,
  readJson,
  sameOrigin,
  sessionCookies,
} from './http.js';
import { RateLimiter } from './rateLimit.js';
import { MAX_PROJECTS, cleanProject, normEmail, okPassword } from './validate.js';

export interface Deps {
  /** null when the database is not configured: the app then hides accounts entirely. */
  backend: AccountsBackend | null;
  ipLimit: RateLimiter;
  emailLimit: RateLimiter;
}

const MIN = 60_000;
/** Shared across requests in one warm instance: 30 attempts per IP and 8 per email in 15 minutes. */
export const defaultLimits = () => ({
  ipLimit: new RateLimiter(30, 15 * MIN),
  emailLimit: new RateLimiter(8, 15 * MIN),
});

const MAX_AUTH_BODY = 2048;
const MAX_PROJECT_BODY = 64 * 1024;

const ERRORS = {
  invalid: [401, 'That email and password don’t match an account.'],
  taken: [409, 'There is already an account with that email. Try signing in.'],
  weak: [400, 'Choose a longer password: at least 8 characters.'],
  unavailable: [503, 'Accounts are not available right now. Your designs are still saved on this device.'],
} as const;

/** The signed-in user from the cookies, refreshing an expired access token when a refresh token is there. */
async function resolve(
  req: Request,
  backend: AccountsBackend,
): Promise<{ token: string; user: AccountUser; cookies: [string, string][] } | null> {
  const at = readCookie(req, ACCESS);
  if (at) {
    const user = await backend.getUser(at);
    if (user) return { token: at, user, cookies: [] };
  }
  const rt = readCookie(req, REFRESH);
  if (!rt) return null;
  const s = await backend.refresh(rt);
  return s ? { token: s.accessToken, user: s.user, cookies: sessionCookies(s) } : null;
}

/** GET /api/auth → { configured, user }. POST /api/auth { action: signup | signin | signout, email, password }. */
export async function handleAuth(req: Request, deps: Deps): Promise<Response> {
  const { backend } = deps;
  if (req.method === 'GET') {
    if (!backend) return json(200, { configured: false, user: null });
    try {
      const r = await resolve(req, backend);
      return json(200, { configured: true, user: r ? { email: r.user.email } : null }, r?.cookies ?? []);
    } catch {
      return json(200, { configured: true, user: null });
    }
  }
  if (req.method !== 'POST') return json(405, { error: 'method' });
  if (!backend) return json(503, { error: ERRORS.unavailable[1] });
  if (!sameOrigin(req)) return json(403, { error: 'forbidden' });
  const body = await readJson(req, MAX_AUTH_BODY);
  if (!body) return json(400, { error: 'bad request' });

  if (body.action === 'signout') {
    const at = readCookie(req, ACCESS);
    if (at) await backend.signOut(at).catch(() => undefined);
    return json(200, { user: null }, clearCookies());
  }
  if (body.action !== 'signup' && body.action !== 'signin') return json(400, { error: 'bad request' });

  const email = normEmail(body.email);
  if (!email) return json(400, { error: 'Enter an email address, like name@example.com.' });
  if (!okPassword(body.password)) return json(400, { error: ERRORS.weak[1] });
  if (!deps.ipLimit.take(clientIp(req)) || !deps.emailLimit.take(email))
    return json(429, { error: 'Too many tries. Wait 15 minutes, then try again.' });

  try {
    const r =
      body.action === 'signup'
        ? await backend.signUp(email, body.password as string)
        : await backend.signIn(email, body.password as string);
    if (!r.ok) {
      const [status, message] = ERRORS[r.error];
      return json(status, { error: message });
    }
    if (!r.session) return json(200, { user: null, confirmEmail: true });
    return json(200, { user: { email: r.session.user.email } }, sessionCookies(r.session));
  } catch {
    return json(503, { error: ERRORS.unavailable[1] });
  }
}

/** GET /api/projects → { projects }. PUT { project } saves one. DELETE ?id= removes one. Signed in only. */
export async function handleProjects(req: Request, deps: Deps): Promise<Response> {
  const { backend } = deps;
  if (!backend) return json(503, { error: 'unavailable' });
  if (!sameOrigin(req)) return json(403, { error: 'forbidden' });
  try {
    const who = await resolve(req, backend);
    if (!who) return json(401, { error: 'signed out' }, clearCookies());
    const { token, cookies } = who;

    if (req.method === 'GET') return json(200, { projects: await backend.listProjects(token) }, cookies);

    if (req.method === 'PUT') {
      const body = await readJson(req, MAX_PROJECT_BODY);
      const p = cleanProject(body?.project);
      if (!p) return json(400, { error: 'bad project' }, cookies);
      const existing = await backend.listProjects(token);
      if (existing.length >= MAX_PROJECTS && !existing.some((x) => x.id === p.id))
        return json(409, { error: `An account holds up to ${MAX_PROJECTS} designs.` }, cookies);
      await backend.putProject(token, p);
      return json(200, { ok: true }, cookies);
    }

    if (req.method === 'DELETE') {
      const id = new URL(req.url).searchParams.get('id') ?? '';
      if (!/^[a-z0-9_-]{1,40}$/i.test(id)) return json(400, { error: 'bad id' }, cookies);
      await backend.deleteProject(token, id);
      return json(200, { ok: true }, cookies);
    }
    return json(405, { error: 'method' }, cookies);
  } catch {
    return json(503, { error: 'unavailable' });
  }
}
