import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAccount } from '../accounts/sync';
import { familyList } from '../families';
import { GROUPS } from '../families/groups';
import type { FamilyGroup } from '../families/types';
import { STEPS, sortedProjects, useProjects, type Project } from '../state/projects';
import { useDesign } from '../state/design';
import { useCalibration } from '../state/calibration';
import { LEVEL_LABEL } from '../strength/evaluate';
import type { VerdictLevel } from '../strength/types';
import { disclaimer } from '../content/disclaimers';
import { LinkButton } from '../components/Button';
import { DesignRow } from '../components/dashboard/DesignRow';
import { SidePanel } from '../components/dashboard/SidePanel';
import { projectVerdict } from '../components/dashboard/verdicts';

type Sort = 'recent' | 'name' | 'step';
const DOT: Record<VerdictLevel, string> = { comfortable: 'bg-ok', marginal: 'bg-warn', fail: 'bg-bad' };
const GROUP_OF = Object.fromEntries(familyList().map((f) => [f.id, f.group])) as Record<string, FamilyGroup>;

function sortBy(ps: Project[], s: Sort) {
  if (s === 'name') return [...ps].sort((a, b) => a.name.localeCompare(b.name));
  if (s === 'step')
    return [...ps].sort(
      (a, b) => STEPS.findIndex((x) => x.id === b.step) - STEPS.findIndex((x) => x.id === a.step),
    );
  return sortedProjects(ps);
}

/** "Your designs": the signed-in dashboard. Signed out it sends you to sign in; with accounts off it says so. */
export default function DashboardPage() {
  const { ready, configured, user, syncError } = useAccount();
  const projects = useProjects((s) => s.projects);
  const use = useDesign((s) => s.use);
  const print = useDesign((s) => s.print);
  const safetyFactor = useDesign((s) => s.safetyFactor);
  useCalibration((s) => s.active);
  const calibrationFor = useCalibration((s) => s.activeFor);
  const [sort, setSort] = useState<Sort>('recent');
  const [group, setGroup] = useState<FamilyGroup | 'all'>('all');
  const [notice, setNotice] = useState('');

  const verdicts = useMemo(
    () =>
      new Map(projects.map((p) => [p.id, projectVerdict(p, { use, print, safetyFactor, calibrationFor })])),
    [projects, use, print, safetyFactor, calibrationFor],
  );

  const shell = (children: React.ReactNode) => (
    <div className="mx-auto max-w-[90rem] px-4 py-12 sm:px-6 lg:px-24 lg:py-14">{children}</div>
  );
  if (!ready)
    return shell(
      <p role="status" className="text-muted">
        Loading your designs…
      </p>,
    );
  if (!configured)
    return shell(
      <>
        <h1 className="text-[2.6rem]">Your designs</h1>
        <p className="mt-4 max-w-[36em] text-muted">
          Accounts are off on this site, so designs are saved on this device. They’re on the{' '}
          <Link to="/#shelf" className="font-semibold text-primary underline">
            home page
          </Link>
          .
        </p>
      </>,
    );
  if (!user) return <Navigate to="/account" replace state={{ next: '/designs' }} />;

  const shown = sortBy(
    group === 'all' ? projects : projects.filter((p) => GROUP_OF[p.familyId] === group),
    sort,
  );
  const counts = new Map<VerdictLevel, number>();
  for (const p of projects) {
    const v = verdicts.get(p.id);
    if (v) counts.set(v.verdict.level, (counts.get(v.verdict.level) ?? 0) + 1);
  }
  const estimates = disclaimer('dashboardEstimates');
  const chip = (on: boolean) =>
    `tap inline-flex shrink-0 items-center rounded-full border px-3.5 text-base whitespace-nowrap ${on ? 'border-text shadow-[inset_0_0_0_1px_var(--color-text)]' : 'border-border hover:border-text'}`;

  return shell(
    <>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-5">
        <div>
          <h1 className="text-[2.6rem] sm:text-[3rem]">Your designs</h1>
          <p className="mt-2 flex items-center gap-2 text-base text-muted">
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${syncError ? 'bg-warn' : 'bg-ok'}`}
            />
            Signed in as {user.email} ·{' '}
            {syncError ? 'Some changes haven’t reached your account yet' : 'Synced to your account'}
          </p>
        </div>
        <div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
          <LinkButton to="/find" variant="secondary" className="flex-1 sm:flex-none">
            Find a design
          </LinkButton>
          <LinkButton to="/design" className="flex-1 sm:flex-none">
            Pick a design
          </LinkButton>
        </div>
      </div>

      <div className="mt-9 grid grid-cols-[minmax(0,1fr)] items-start gap-10 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div>
          {projects.length === 0 ? (
            <div className="flex flex-col gap-5 rounded-md border border-border p-6 sm:flex-row sm:items-center">
              <p className="flex-1">
                <span className="block font-serif text-2xl">No saved designs yet</span>
                <span className="mt-1 block text-muted">
                  Open any design and choose “Save to shelf”. It lands here with its sizes and where you
                  stopped, on any device you sign in on.
                </span>
              </p>
              <LinkButton to="/find" className="min-h-14 px-6">
                Find a design for a task
              </LinkButton>
            </div>
          ) : (
            <>
              <p className="flex flex-wrap items-baseline gap-x-5 gap-y-1 border-y border-t-text border-b-rule py-3.5">
                <span className="font-serif text-[1.75rem]">
                  {projects.length} {projects.length === 1 ? 'design' : 'designs'}
                </span>
                {(['comfortable', 'marginal', 'fail'] as VerdictLevel[])
                  .filter((l) => counts.get(l))
                  .map((l) => (
                    <span key={l} className="inline-flex items-center gap-1.5 text-base">
                      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${DOT[l]}`} />
                      {counts.get(l)} {LEVEL_LABEL[l].toLowerCase()}
                    </span>
                  ))}
                {estimates && <span className="text-sm text-muted">{estimates}</span>}
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 py-4">
                <label className="flex items-center gap-2 text-base text-muted">
                  Sort
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                    className="tap rounded-md border border-border bg-surface px-2 text-text"
                  >
                    <option value="recent">Most recent</option>
                    <option value="name">Name</option>
                    <option value="step">Furthest along</option>
                  </select>
                </label>
                <div
                  role="group"
                  aria-label="Show designs that help with"
                  className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0"
                >
                  <button
                    type="button"
                    aria-pressed={group === 'all'}
                    onClick={() => setGroup('all')}
                    className={chip(group === 'all')}
                  >
                    All
                  </button>
                  {GROUPS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      aria-pressed={group === g.id}
                      onClick={() => setGroup(g.id)}
                      className={chip(group === g.id)}
                    >
                      {g.title}
                    </button>
                  ))}
                </div>
              </div>
              <p role="status" className="text-base text-muted">
                {notice}
              </p>
              {shown.length ? (
                <ul aria-label="Saved designs">
                  {shown.map((p) => (
                    <DesignRow
                      key={p.id}
                      p={p}
                      verdict={verdicts.get(p.id) ?? null}
                      onDeleted={(n) => setNotice(`Deleted ${n}.`)}
                    />
                  ))}
                </ul>
              ) : (
                <p className="border-t border-rule py-6 text-muted">No saved designs in this group yet.</p>
              )}
            </>
          )}
        </div>
        <SidePanel email={user.email} projects={projects} />
      </div>
    </>,
  );
}
