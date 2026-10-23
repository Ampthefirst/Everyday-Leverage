/**
 * Supabase backend over its REST APIs (Auth and PostgREST) with plain fetch: no SDK, nothing extra in the
 * bundle. Configured by SUPABASE_URL and SUPABASE_ANON_KEY in Vercel's environment (never VITE_-prefixed).
 * Every project request carries the user's own access token, so the table's row-level security policies
 * (docs/accounts-setup.md) are what keep each account's designs private.
 */
import type { AccountsBackend, AuthResult, Session, StoredProject } from './types.js';

const TIMEOUT_MS = 10_000;

interface TokenReply {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: { id: string; email?: string };
  error_code?: string;
  code?: string | number;
  error?: string;
  msg?: string;
}

interface Row {
  id: string;
  name: string;
  family_id: string;
  params: StoredProject['params'];
  preset_id: string | null;
  step: StoredProject['step'];
  updated_at: string;
}

const toRow = (p: StoredProject) => ({
  id: p.id,
  name: p.name,
  family_id: p.familyId,
  params: p.params,
  preset_id: p.presetId ?? null,
  step: p.step,
  updated_at: p.updatedAt,
});

const fromRow = (r: Row): StoredProject => ({
  id: r.id,
  name: r.name,
  familyId: r.family_id,
  params: r.params,
  ...(r.preset_id ? { presetId: r.preset_id } : {}),
  step: r.step,
  updatedAt: new Date(r.updated_at).toISOString(),
});

export function supabaseBackend(baseUrl: string, anonKey: string): AccountsBackend {
  const base = baseUrl.replace(/\/+$/, '');
  const call = (path: string, init: RequestInit & { token?: string } = {}) =>
    fetch(`${base}${path}`, {
      ...init,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        apikey: anonKey,
        'content-type': 'application/json',
        ...(init.token ? { authorization: `Bearer ${init.token}` } : {}),
        ...(init.headers as Record<string, string> | undefined),
      },
    });

  const session = (t: TokenReply): Session | null =>
    t.access_token && t.refresh_token && t.user
      ? {
          accessToken: t.access_token,
          refreshToken: t.refresh_token,
          expiresIn: t.expires_in ?? 3600,
          user: { id: t.user.id, email: t.user.email ?? '' },
        }
      : null;

  const code = (t: TokenReply) => String(t.error_code ?? t.code ?? t.error ?? '');

  async function auth(path: string, body: unknown): Promise<{ status: number; t: TokenReply }> {
    const r = await call(path, { method: 'POST', body: JSON.stringify(body) });
    return { status: r.status, t: (await r.json().catch(() => ({}))) as TokenReply };
  }

  return {
    async signUp(email, password): Promise<AuthResult> {
      const { status, t } = await auth('/auth/v1/signup', { email, password });
      if (status >= 200 && status < 300) {
        const s = session(t);
        return s ? { ok: true, session: s } : { ok: true, session: null, confirmEmail: true };
      }
      const c = code(t);
      if (c === 'user_already_exists' || c === 'email_exists') return { ok: false, error: 'taken' };
      if (c === 'weak_password') return { ok: false, error: 'weak' };
      return { ok: false, error: 'unavailable' };
    },
    async signIn(email, password): Promise<AuthResult> {
      const { status, t } = await auth('/auth/v1/token?grant_type=password', { email, password });
      const s = status === 200 ? session(t) : null;
      if (s) return { ok: true, session: s };
      if (code(t) === 'email_not_confirmed') return { ok: true, session: null, confirmEmail: true };
      return { ok: false, error: status >= 500 || status === 429 ? 'unavailable' : 'invalid' };
    },
    async refresh(refreshToken) {
      const { status, t } = await auth('/auth/v1/token?grant_type=refresh_token', {
        refresh_token: refreshToken,
      });
      return status === 200 ? session(t) : null;
    },
    async signOut(token) {
      await call('/auth/v1/logout', { method: 'POST', token });
    },
    async getUser(token) {
      const r = await call('/auth/v1/user', { token });
      if (r.status !== 200) return null;
      const u = (await r.json()) as { id: string; email?: string };
      return { id: u.id, email: u.email ?? '' };
    },
    async listProjects(token) {
      const r = await call('/rest/v1/projects?select=id,name,family_id,params,preset_id,step,updated_at', {
        token,
      });
      if (!r.ok) throw new Error(`list ${r.status}`);
      return ((await r.json()) as Row[]).map(fromRow);
    },
    async putProject(token, p) {
      // Newer copy wins: skip the write when the account already holds a newer one.
      const q = await call(`/rest/v1/projects?select=updated_at&id=eq.${encodeURIComponent(p.id)}`, {
        token,
      });
      if (!q.ok) throw new Error(`read ${q.status}`);
      const [old] = (await q.json()) as { updated_at: string }[];
      if (old && new Date(old.updated_at).toISOString() > p.updatedAt) return;
      const r = await call('/rest/v1/projects?on_conflict=user_id,id', {
        method: 'POST',
        token,
        headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(toRow(p)),
      });
      if (!r.ok) throw new Error(`put ${r.status}`);
    },
    async deleteProject(token, id) {
      const r = await call(`/rest/v1/projects?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', token });
      if (!r.ok) throw new Error(`delete ${r.status}`);
    },
  };
}

/** The configured backend, or null when the owner has not connected a database yet. */
export function backendFromEnv(
  env: Record<string, string | undefined> = process.env,
): AccountsBackend | null {
  const url = env.SUPABASE_URL?.trim();
  const key = env.SUPABASE_ANON_KEY?.trim();
  return url && key ? supabaseBackend(url, key) : null;
}
