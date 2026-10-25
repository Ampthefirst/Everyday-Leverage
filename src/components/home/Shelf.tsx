import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFamily } from '../../families';
import { useDesign } from '../../state/design';
import { savedParams, sortedProjects, STEPS, useProjects, type Project } from '../../state/projects';
import { Button } from '../Button';
import { Figure } from '../Figure';
import { useAccount } from '../../accounts/sync';

/** Opens a saved project in the designer where it stopped. */
export function useOpenProject() {
  const navigate = useNavigate();
  const setParams = useDesign((s) => s.setParams);
  return (p: Project, opts: { files?: boolean } = {}) => {
    setParams(p.familyId, savedParams(p), p.presetId ? { preset: p.presetId } : undefined);
    navigate(`/design/${p.familyId}`, { state: { project: p.id, files: opts.files } });
  };
}

export const stepLabel = (p: Project) => STEPS.find((s) => s.id === p.step)?.label ?? p.step;

function ShelfItem({ p }: { p: Project }) {
  const open = useOpenProject();
  const { rename, duplicate, remove } = useProjects();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(p.name);
  const [confirm, setConfirm] = useState(false);
  const fam = getFamily(p.familyId);
  if (!fam) return null;
  return (
    <li className="grid grid-cols-[6rem_1fr] gap-4 border-r border-b border-border bg-surface px-5 pt-5 pb-4">
      <Figure
        familyId={p.familyId}
        params={savedParams(p)}
        className="flex h-24 w-24 items-center justify-center rounded-sm border border-rule p-1.5 [&_svg]:max-h-[5.25rem]"
      />
      <div className="min-w-0">
        {editing ? (
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              rename(p.id, name);
              setEditing(false);
            }}
          >
            <label className="sr-only" htmlFor={`name-${p.id}`}>
              Name
            </label>
            <input
              id={`name-${p.id}`}
              value={name}
              maxLength={80}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              className="tap min-w-0 flex-1 rounded-md border border-border bg-surface px-3"
            />
            <Button type="submit" variant="secondary">
              Save
            </Button>
          </form>
        ) : (
          <h3 className="font-serif text-[1.3rem] leading-tight font-medium break-words">{p.name}</h3>
        )}
        <p className="mt-1 text-base text-muted">
          {fam.name} · {new Date(p.updatedAt).toLocaleDateString()}
        </p>
        <p className="mt-1 text-base">
          You stopped at <span className="font-semibold">{stepLabel(p)}</span>
        </p>
      </div>
      <div className="col-span-full -ml-2 flex flex-wrap gap-1">
        <Button onClick={() => open(p)}>
          Open<span className="sr-only"> {p.name}</span>
        </Button>
        {!editing && (
          <Button variant="ghost" onClick={() => setEditing(true)}>
            Rename<span className="sr-only"> {p.name}</span>
          </Button>
        )}
        <Button variant="ghost" onClick={() => duplicate(p.id)}>
          Duplicate<span className="sr-only"> {p.name}</span>
        </Button>
        {confirm ? (
          <Button variant="danger" onClick={() => remove(p.id)}>
            Yes, delete<span className="sr-only"> {p.name}</span>
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => setConfirm(true)}>
            Delete<span className="sr-only"> {p.name}</span>
          </Button>
        )}
      </div>
    </li>
  );
}

/** Signed in: the three most recent designs, with the dashboard one link away. */
function RecentDesigns() {
  const projects = sortedProjects(useProjects((s) => s.projects)).slice(0, 3);
  const open = useOpenProject();
  return (
    <section id="shelf" aria-labelledby="shelf-title" className="scroll-mt-16 border-b border-rule">
      <div className="mx-auto max-w-[90rem] px-4 py-16 sm:px-6 lg:px-24">
        <h2 id="shelf-title" className="text-[2.1rem] sm:text-[2.5rem]">
          Your recent designs
        </h2>
        {projects.length > 0 && (
          <ul className="mt-8 grid border-t border-l border-border md:grid-cols-3">
            {projects.map((p) => {
              const fam = getFamily(p.familyId);
              return (
                <li key={p.id} className="border-r border-b border-border">
                  <button
                    type="button"
                    onClick={() => open(p)}
                    className="grid w-full grid-cols-[4.5rem_1fr] items-center gap-4 px-5 py-4 text-left hover:bg-surface-2"
                  >
                    <Figure
                      familyId={p.familyId}
                      params={savedParams(p)}
                      className="flex h-14 items-center justify-center [&_svg]:max-h-14"
                    />
                    <span className="min-w-0">
                      <span className="block font-serif text-[1.2rem] leading-tight font-medium break-words">
                        {p.name}
                      </span>
                      <span className="block text-sm text-muted">
                        {fam?.name} · at {stepLabel(p)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {projects.length === 0 && (
          <p className="mt-4 text-muted">Nothing saved yet. In the designer, choose “Save Design”.</p>
        )}
        <p className="mt-6">
          <Link to="/designs" className="font-semibold text-primary underline-offset-4 hover:underline">
            See all your designs <span aria-hidden="true">→</span>
          </Link>
        </p>
      </div>
    </section>
  );
}

/**
 * Saved designs on Home. Signed in, the three most recent with a link to the dashboard; otherwise the
 * device shelf, newest first, with an empty state that points to Find.
 */
export function Shelf() {
  const projects = sortedProjects(useProjects((s) => s.projects));
  const user = useAccount((s) => s.user);
  const syncError = useAccount((s) => s.syncError);
  if (user) return <RecentDesigns />;
  return (
    <section id="shelf" aria-labelledby="shelf-title" className="scroll-mt-16 border-b border-rule">
      <div className="mx-auto max-w-[90rem] px-4 py-16 sm:px-6 lg:px-24">
        <h2 id="shelf-title" className="text-[2.1rem] sm:text-[2.5rem]">
          Your saved designs
        </h2>
        {projects.length === 0 ? (
          <div className="mt-6 flex flex-col gap-4 rounded-md border border-border p-4 sm:flex-row sm:items-center">
            <p className="flex-1">
              <span className="block font-serif text-lg font-medium">Nothing saved yet</span>
              <span className="block text-base text-muted">
                In the designer, choose “Save Design”. Designs keep their sizes and where you stopped, in
                this browser on this device.
              </span>
            </p>
            <Link
              to="/find"
              className="tap inline-flex items-center justify-center rounded-md border border-border px-4 font-semibold hover:border-text"
            >
              Find a design
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-3 max-w-[36em] text-muted">
              Designs keep their sizes and where you stopped. They stay in this browser, on this device.
            </p>
            {syncError && (
              <p role="status" className="mt-3 text-base text-warn">
                Some changes haven’t reached your account yet. They are safe on this device.
              </p>
            )}
            <ul className="mt-9 grid border-t border-l border-border md:grid-cols-2 xl:grid-cols-3">
              {projects.map((p) => (
                <ShelfItem key={p.id} p={p} />
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
