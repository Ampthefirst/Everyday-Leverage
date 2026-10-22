import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFamily } from '../../families';
import { useDesign } from '../../state/design';
import { sortedProjects, STEPS, useProjects, type Project } from '../../state/projects';
import { Button } from '../Button';

/** Opens a saved project in the designer where it stopped. */
export function useOpenProject() {
  const navigate = useNavigate();
  const setParams = useDesign((s) => s.setParams);
  return (p: Project) => {
    setParams(p.familyId, p.params, p.presetId ? { preset: p.presetId } : undefined);
    navigate(`/design/${p.familyId}`, { state: { project: p.id } });
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
    <li className="flex flex-col border border-border bg-surface">
      <div className="font-display flex items-center justify-between gap-2 border-b border-border px-3 text-xl">
        <span>
          <span className="text-accent">{fam.id}</span> {fam.name}
        </span>
        <span className="text-muted">{new Date(p.updatedAt).toLocaleDateString()}</span>
      </div>
      <div className="flex gap-3 p-3">
        <img
          src={`/renders/${fam.id}.webp`}
          alt=""
          width={1024}
          height={1024}
          loading="lazy"
          className="h-24 w-24 shrink-0 border border-border bg-viewer-bg"
        />
        <div className="min-w-0 flex-1">
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
                className="tap min-w-0 flex-1 border border-border bg-bg px-2"
              />
              <Button type="submit" variant="secondary">
                Save
              </Button>
            </form>
          ) : (
            <h3 className="font-display break-words text-3xl leading-none">{p.name}</h3>
          )}
          <p className="mt-2 text-sm">
            You stopped at <span className="font-display text-xl text-accent">{stepLabel(p)}</span>
          </p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap gap-2 border-t border-rule p-2">
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

/** Saved designs on this device, newest first, with an empty state that points to Find and Pick. */
export function Shelf() {
  const projects = sortedProjects(useProjects((s) => s.projects));
  return (
    <section id="shelf" aria-labelledby="shelf-title" className="mx-auto max-w-7xl scroll-mt-16 px-4 py-14">
      <h2 id="shelf-title" className="text-5xl">
        Your shelf
      </h2>
      <p className="mt-2 max-w-[62ch] text-muted">
        Designs you save keep their sizes and where you stopped. They stay in this browser, on this device
        only.
      </p>
      {projects.length === 0 ? (
        <div className="mt-6 border border-dashed border-border p-6">
          <p className="font-display text-3xl">Nothing on the shelf yet.</p>
          <p className="mt-2 max-w-[60ch] text-muted">
            In the designer, choose <span className="text-text">Save to shelf</span> and the design waits here
            for next time.
          </p>
          <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/find" className="font-semibold text-primary underline">
              Find a design for a task
            </Link>
            <Link to="/design" className="font-semibold text-primary underline">
              Pick from all nine
            </Link>
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <ShelfItem key={p.id} p={p} />
          ))}
        </ul>
      )}
    </section>
  );
}
