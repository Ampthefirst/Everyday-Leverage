import type { Params } from '../../families/types';
import { useState } from 'react';
import { useDesign } from '../../state/design';
import { ParamControl } from './ParamControl';
import { useDesigner } from './context';
import { Button } from '../Button';
import { useProfiles } from '../../state/profiles';

export function PresetCards() {
  const { family } = useDesigner();
  const presetId = useDesign((s) => s.presetId[family.id]);
  const setParams = useDesign((s) => s.setParams);
  return (
    <fieldset>
      <legend className="mb-2 text-lg font-bold">Start from a task</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {family.presets.map((p) => {
          const active = presetId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() =>
                setParams(family.id, { ...family.defaults, ...p.params } as Params, { preset: p.id })
              }
              className={`tap rounded-xl border-2 p-3 text-left ${active ? 'border-primary bg-surface-2' : 'border-border bg-surface hover:border-primary'}`}
            >
              <span className="block font-semibold">{p.label}</span>
              <span className="block text-sm text-muted">{p.description}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function FitPanel() {
  const { family, params, setParam, openMeasure } = useDesigner();
  const reset = useDesign((s) => s.reset);
  const [fine, setFine] = useState(false);
  const fit = family.fields.filter((f) => f.group === 'fit');
  const fineFields = family.fields.filter((f) => f.group === 'fine');
  return (
    <div className="space-y-6">
      <PresetCards />
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Your measurements</h3>
          {family.measureGuide.length > 0 && (
            <Button variant="ghost" onClick={() => openMeasure(family.measureGuide[0].id)}>
              Measuring guide
            </Button>
          )}
        </div>
        {fit.map((f) => (
          <ParamControl key={f.key} field={f} params={params} onChange={setParam} onMeasure={openMeasure} />
        ))}
      </section>
      <section>
        <button
          type="button"
          className="tap flex w-full items-center justify-between rounded-xl border border-border px-3 font-semibold"
          aria-expanded={fine}
          onClick={() => setFine((v) => !v)}
        >
          Fine-tune
          <span aria-hidden="true">{fine ? '▲' : '▼'}</span>
        </button>
        {fine && (
          <div className="mt-4 space-y-4">
            {fineFields.map((f) => (
              <ParamControl
                key={f.key}
                field={f}
                params={params}
                onChange={setParam}
                onMeasure={openMeasure}
              />
            ))}
            <Button variant="secondary" onClick={() => reset(family.id)}>
              Reset all to defaults
            </Button>
            <ProfileSave />
          </div>
        )}
      </section>
    </div>
  );
}

export function StylePanel() {
  const { family, params, setParam } = useDesigner();
  const setParams = useDesign((s) => s.setParams);
  const variantId = useDesign((s) => s.variantId[family.id]);
  const style = family.fields.filter((f) => f.group === 'style');
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-lg font-bold">Style</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {family.variants.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={variantId === v.id}
              onClick={() => setParams(family.id, { ...params, ...v.patch } as Params, { variant: v.id })}
              className={`tap rounded-xl border-2 p-3 text-left ${variantId === v.id ? 'border-primary bg-surface-2' : 'border-border bg-surface hover:border-primary'}`}
            >
              <span className="block font-semibold">{v.label}</span>
              <span className="block text-sm text-muted">{v.description}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <section className="space-y-4">
        <h3 className="text-lg font-bold">Details</h3>
        {style.map((f) => (
          <ParamControl key={f.key} field={f} params={params} onChange={setParam} />
        ))}
      </section>
    </div>
  );
}

function ProfileSave() {
  const { family, params } = useDesigner();
  const currentId = useProfiles((s) => s.currentId);
  const current = useProfiles((s) => s.current());
  const update = useProfiles((s) => s.update);
  const setParams = useDesign((s) => s.setParams);
  const [done, setDone] = useState(false);
  if (!currentId)
    return (
      <p className="text-sm text-muted">
        Tip: create a profile in Display settings to keep these sizes for next time.
      </p>
    );
  const saved = current.designs[family.id];
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="ghost"
        onClick={() => {
          update(current.id, { designs: { ...current.designs, [family.id]: params } });
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        }}
      >
        {done ? 'Saved' : `Save sizes to “${current.name}”`}
      </Button>
      {saved && (
        <Button variant="ghost" onClick={() => setParams(family.id, saved)}>
          Load sizes from “{current.name}”
        </Button>
      )}
    </div>
  );
}
