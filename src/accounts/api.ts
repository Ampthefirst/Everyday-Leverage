/** Browser side of /api/auth and /api/projects. Cookies carry the session; scripts never see a token. */
import type { Project } from '../state/projects';

export interface AuthState {
  configured: boolean;
  user: { email: string } | null;
}

async function call<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: T }> {
  const r = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: init.body ? { 'content-type': 'application/json' } : undefined,
  });
  const data = (await r.json().catch(() => ({}))) as T;
  return { ok: r.ok, status: r.status, data };
}

/** Whether accounts are switched on, and who is signed in. Offline or no server: switched off. */
export async function fetchAuth(): Promise<AuthState> {
  try {
    const r = await call<Partial<AuthState>>('/api/auth');
    return r.ok
      ? { configured: !!r.data.configured, user: r.data.user ?? null }
      : { configured: false, user: null };
  } catch {
    return { configured: false, user: null };
  }
}

export type AuthReply =
  { ok: true; user: { email: string } | null; confirmEmail?: boolean } | { ok: false; error: string };

export async function authAction(
  action: 'signup' | 'signin' | 'signout',
  email = '',
  password = '',
): Promise<AuthReply> {
  try {
    const r = await call<{ user?: { email: string } | null; confirmEmail?: boolean; error?: string }>(
      '/api/auth',
      {
        method: 'POST',
        body: JSON.stringify({ action, email, password }),
      },
    );
    if (!r.ok) return { ok: false, error: r.data.error ?? 'Something went wrong. Try again.' };
    return { ok: true, user: r.data.user ?? null, confirmEmail: r.data.confirmEmail };
  } catch {
    return { ok: false, error: 'You seem to be offline. Your designs are still saved on this device.' };
  }
}

export async function listRemote(): Promise<Project[] | null> {
  const r = await call<{ projects?: Project[] }>('/api/projects');
  return r.ok ? (r.data.projects ?? []) : null;
}

export async function putRemote(p: Project): Promise<boolean> {
  const { id, name, familyId, params, presetId, step, updatedAt } = p;
  const r = await call('/api/projects', {
    method: 'PUT',
    body: JSON.stringify({ project: { id, name, familyId, params, presetId, step, updatedAt } }),
  });
  return r.ok;
}

export async function deleteRemote(id: string): Promise<boolean> {
  return (await call(`/api/projects?id=${encodeURIComponent(id)}`, { method: 'DELETE' })).ok;
}
