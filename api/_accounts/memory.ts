/** In-memory backend for unit tests and local experiments. Passwords are scrypt-hashed even here. */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { AccountsBackend, AccountUser, AuthResult, Session, StoredProject } from './types.js';

export function memoryBackend(opts: { confirmEmail?: boolean; ttl?: number } = {}): AccountsBackend & {
  /** Test hook: what is stored, to check nothing extra was kept. */
  dump(): { users: AccountUser[]; projects: Record<string, StoredProject[]> };
} {
  const ttl = opts.ttl ?? 3600;
  const users = new Map<string, AccountUser & { salt: string; hash: string }>();
  const access = new Map<string, { userId: string; exp: number }>();
  const refresh = new Map<string, string>();
  const projects = new Map<string, Map<string, StoredProject>>();
  const token = () => randomBytes(18).toString('base64url');
  const hash = (pw: string, salt: string) => scryptSync(pw, salt, 32).toString('hex');

  function issue(u: AccountUser): Session {
    const accessToken = token();
    const refreshToken = token();
    access.set(accessToken, { userId: u.id, exp: Date.now() + ttl * 1000 });
    refresh.set(refreshToken, u.id);
    return { accessToken, refreshToken, expiresIn: ttl, user: { id: u.id, email: u.email } };
  }
  function userOf(at: string) {
    const a = access.get(at);
    if (!a || a.exp <= Date.now()) return null;
    return [...users.values()].find((u) => u.id === a.userId) ?? null;
  }
  function mine(at: string) {
    const u = userOf(at);
    if (!u) throw new Error('signed out');
    if (!projects.has(u.id)) projects.set(u.id, new Map());
    return projects.get(u.id)!;
  }

  return {
    async signUp(email, password): Promise<AuthResult> {
      if (users.has(email)) return { ok: false, error: 'taken' };
      const salt = token();
      const u = { id: token(), email, salt, hash: hash(password, salt) };
      users.set(email, u);
      return opts.confirmEmail
        ? { ok: true, session: null, confirmEmail: true }
        : { ok: true, session: issue(u) };
    },
    async signIn(email, password): Promise<AuthResult> {
      const u = users.get(email);
      const ok =
        !!u && timingSafeEqual(Buffer.from(hash(password, u.salt), 'hex'), Buffer.from(u.hash, 'hex'));
      return ok ? { ok: true, session: issue(u!) } : { ok: false, error: 'invalid' };
    },
    async refresh(rt) {
      const id = refresh.get(rt);
      refresh.delete(rt);
      const u = [...users.values()].find((x) => x.id === id);
      return u ? issue(u) : null;
    },
    async signOut(at) {
      access.delete(at);
    },
    async getUser(at) {
      const u = userOf(at);
      return u ? { id: u.id, email: u.email } : null;
    },
    async listProjects(at) {
      return [...mine(at).values()];
    },
    async putProject(at, p) {
      const m = mine(at);
      const old = m.get(p.id);
      if (!old || old.updatedAt <= p.updatedAt) m.set(p.id, p);
    },
    async deleteProject(at, id) {
      mine(at).delete(id);
    },
    dump() {
      return {
        users: [...users.values()].map((u) => ({ id: u.id, email: u.email })),
        projects: Object.fromEntries([...projects].map(([k, v]) => [k, [...v.values()]])),
      };
    },
  };
}
