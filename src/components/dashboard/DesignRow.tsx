import { useState } from 'react';
import { getFamily } from '../../families';
import { fitSizes } from '../../families/describe';
import { savedParams, useProjects, type Project } from '../../state/projects';
import { shareUrl } from '../../profiles/share';
import { LEVEL_LABEL } from '../../strength/evaluate';
import type { VerdictLevel } from '../../strength/types';
import type { CalibrationProfile } from '../../strength/calibration';
import { Figure } from '../Figure';
import { Button } from '../Button';
import { StepStrip } from '../StepStrip';
import { StrengthBadge } from '../StrengthBadge';
import { useOpenProject } from '../home/Shelf';

const LEVEL_COLOR: Record<VerdictLevel, string> = {
  comfortable: 'text-ok',
  marginal: 'text-warn',
  fail: 'text-bad',
};
const date = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/** One saved design on the dashboard: drawing, sizes, where it stopped, strength, and what you can do with it. */
export function DesignRow({
  p,
  verdict,
}: {
  p: Project;
  verdict: {
    verdict: { utilization: number; level: VerdictLevel };
    calibration: CalibrationProfile | null;
  } | null;
}) {
  const open = useOpenProject();
  const { rename, duplicate, remove } = useProjects();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(p.name);
  const [confirm, setConfirm] = useState(false);
  const [note, setNote] = useState('');
  const fam = getFamily(p.familyId);
  if (!fam) return null;
  const preset = fam.presets.find((x) => x.id === p.presetId);
  const params = savedParams(p);
  const sizes = fitSizes(fam, params);
  const all = fitSizes(fam, params, 'all');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl(p.familyId, params));
      setNote('Link copied.');
    } catch {
      setNote('Could not copy here. Open the design and use its share link.');
    }
  };
  return (
    <li
      aria-labelledby={`row-${p.id}`}
      className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 gap-y-4 border-t border-rule py-6 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:gap-x-6"
    >
      <Figure
        familyId={p.familyId}
        params={params}
        className="flex h-16 items-center justify-center rounded-sm border border-rule p-2 sm:h-24 [&_svg]:max-h-12 sm:[&_svg]:max-h-20"
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
          <h3 id={`row-${p.id}`} className="font-serif text-[1.45rem] leading-tight font-medium break-words">
            {p.name}
          </h3>
        )}
        <p className="mt-1 text-base text-muted">
          {fam.name}
          {preset ? ` · from “${preset.label}”` : ''}
        </p>
        <dl className="mt-3 grid gap-x-7 gap-y-1 text-base sm:grid-cols-[repeat(2,max-content)]">
          {sizes.slice(0, 4).map((s) => (
            <div key={s.label} className="flex gap-2">
              <dt className="text-muted">{s.label}</dt>
              <dd className="font-semibold">{s.value}</dd>
            </div>
          ))}
        </dl>
        {all.length > 4 && (
          <details className="mt-1 text-base">
            <summary className="tap inline-flex cursor-pointer items-center font-semibold text-primary">
              Show all sizes<span className="sr-only"> of {p.name}</span>
            </summary>
            <dl className="mt-1 mb-2 grid gap-x-7 gap-y-1 sm:grid-cols-[repeat(2,max-content)]">
              {all.map((s) => (
                <div key={s.label} className="flex gap-2">
                  <dt className="text-muted">{s.label}</dt>
                  <dd className="font-semibold">{s.value}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
        <StepStrip current={p.step} stopped={p.step} className="mt-3" />
        <p className="mt-1.5 text-sm text-faint">Changed {date(p.updatedAt)}</p>
      </div>
      {verdict && (
        <div className="col-span-full flex flex-wrap items-baseline gap-x-3 gap-y-2 sm:col-span-1 sm:block sm:text-right">
          <span className="font-serif text-[2.1rem] leading-none sm:block">
            {Math.round(verdict.verdict.utilization * 100)}%
          </span>
          <span className={`font-semibold sm:mt-1 sm:block ${LEVEL_COLOR[verdict.verdict.level]}`}>
            {LEVEL_LABEL[verdict.verdict.level]}
          </span>
          <span className="sm:mt-2 sm:block">
            <StrengthBadge calibration={verdict.calibration} />
          </span>
        </div>
      )}
      <div className="col-span-full flex flex-wrap gap-1 sm:col-start-2 sm:-ml-3">
        <Button onClick={() => open(p)} className="w-full sm:mr-2 sm:ml-3 sm:w-auto">
          Open<span className="sr-only"> {p.name}</span>
        </Button>
        <Button variant="ghost" onClick={() => open(p, { files: true })}>
          Get files<span className="sr-only"> for {p.name}</span>
        </Button>
        {!editing && (
          <Button variant="ghost" onClick={() => setEditing(true)}>
            Rename<span className="sr-only"> {p.name}</span>
          </Button>
        )}
        <Button variant="ghost" onClick={() => duplicate(p.id)}>
          Duplicate<span className="sr-only"> {p.name}</span>
        </Button>
        <Button variant="ghost" onClick={copy}>
          Copy share link<span className="sr-only"> for {p.name}</span>
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
        <span role="status" className="self-center text-sm text-muted">
          {note}
        </span>
      </div>
    </li>
  );
}
