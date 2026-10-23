/**
 * Accounts: the storage-agnostic contract between the /api handlers and a database.
 * Stored per user: an email and their saved designs. Never task-finder answers or anything about health.
 */

export interface AccountUser {
  id: string;
  email: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  /** Seconds until the access token expires. */
  expiresIn: number;
  user: AccountUser;
}

/** A saved design as stored in an account: the same fields as the browser shelf, nothing more. */
export interface StoredProject {
  id: string;
  name: string;
  familyId: string;
  params: Record<string, number | string | boolean>;
  presetId?: string;
  step: 'brief' | 'measure' | 'check' | 'print';
  updatedAt: string;
}

export type AuthResult =
  | { ok: true; session: Session }
  /** The account exists but the email address must be confirmed before signing in. */
  | { ok: true; session: null; confirmEmail: true }
  | { ok: false; error: 'invalid' | 'taken' | 'weak' | 'unavailable' };

/** What a database must provide. One adapter per provider (Supabase now; Postgres later). */
export interface AccountsBackend {
  signUp(email: string, password: string): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  refresh(refreshToken: string): Promise<Session | null>;
  signOut(accessToken: string): Promise<void>;
  /** The user an access token belongs to, or null when it is invalid or expired. */
  getUser(accessToken: string): Promise<AccountUser | null>;
  listProjects(accessToken: string): Promise<StoredProject[]>;
  /** Insert or replace; keeps whichever copy has the newer updatedAt. */
  putProject(accessToken: string, p: StoredProject): Promise<void>;
  deleteProject(accessToken: string, id: string): Promise<void>;
}
