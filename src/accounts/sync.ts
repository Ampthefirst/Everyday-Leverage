/**
 * Projects storage: the browser shelf (`useProjects`, always there, also the offline copy) and, when
 * signed in, the account. Saving writes to both; on sign-in the two are merged and the newer copy wins.
 */
import { create } from 'zustand';
import { useProjects, type Project } from '../state/projects';
import { authAction, deleteRemote, fetchAuth, listRemote, putRemote, type AuthReply } from './api';

/** Union by id; where both hold a design, the one updated later wins. Newest first. */
export function mergeProjects(local: Project[], remote: Project[]): Project[] {
  const byId = new Map<string, Project>();
  for (const p of [...local, ...remote]) {
    const have = byId.get(p.id);
    if (!have || p.updatedAt > have.updatedAt) byId.set(p.id, p);
  }
  return [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Designs the account is missing or holds an older copy of. */
export function toUpload(local: Project[], remote: Project[]): Project[] {
  const r = new Map(remote.map((p) => [p.id, p.updatedAt]));
  return local.filter((p) => !r.has(p.id) || p.updatedAt > r.get(p.id)!);
}

interface AccountState {
  configured: boolean;
  user: { email: string } | null;
  /** Shown on the shelf when the last sync failed; designs stay safe on the device either way. */
  syncError: boolean;
}

export const useAccount = create<AccountState>(() => ({ configured: false, user: null, syncError: false }));

let applying = false;

async function pullAndMerge() {
  const remote = await listRemote();
  if (!remote) return useAccount.setState({ syncError: true });
  const local = useProjects.getState().projects;
  applying = true;
  useProjects.setState({ projects: mergeProjects(local, remote) });
  applying = false;
  const results = await Promise.all(toUpload(local, remote).map(putRemote));
  useAccount.setState({ syncError: results.includes(false) });
}

// Every shelf change while signed in goes to the account too (sizes save often: batched per design).
const pending = new Map<string, ReturnType<typeof setTimeout>>();
useProjects.subscribe((next, prev) => {
  if (applying || !useAccount.getState().user || next.projects === prev.projects) return;
  const before = new Map(prev.projects.map((p) => [p.id, p]));
  const now = new Set(next.projects.map((p) => p.id));
  for (const p of next.projects) {
    if (before.get(p.id) === p) continue;
    clearTimeout(pending.get(p.id));
    pending.set(
      p.id,
      setTimeout(async () => {
        pending.delete(p.id);
        const latest = useProjects.getState().projects.find((x) => x.id === p.id);
        if (latest && !(await putRemote(latest))) useAccount.setState({ syncError: true });
      }, 800),
    );
  }
  for (const id of before.keys()) {
    if (now.has(id)) continue;
    clearTimeout(pending.get(id));
    void deleteRemote(id).then((ok) => ok || useAccount.setState({ syncError: true }));
  }
});

let started = false;
/** Once per page load: asks the server whether accounts are on, and syncs if someone is signed in. */
export async function initAccounts() {
  if (started) return;
  started = true;
  const s = await fetchAuth();
  useAccount.setState({ configured: s.configured, user: s.user });
  if (s.user) await pullAndMerge();
}

export async function signIn(kind: 'signup' | 'signin', email: string, password: string): Promise<AuthReply> {
  const r = await authAction(kind, email, password);
  if (r.ok && r.user) {
    useAccount.setState({ user: r.user, syncError: false });
    await pullAndMerge();
  }
  return r;
}

/** Signs out; the designs stay on this device's shelf. */
export async function signOut() {
  await authAction('signout');
  useAccount.setState({ user: null, syncError: false });
}
