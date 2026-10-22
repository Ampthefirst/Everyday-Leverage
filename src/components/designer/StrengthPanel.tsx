import { useState } from 'react';
import { useDesign } from '../../state/design';
import { useDesigner } from './context';
import { Meter } from '../Meter';
import { StrengthBadge } from '../StrengthBadge';
import { Choice, NumberSlider, Select } from '../Field';
import { Note } from '../Card';
import { displayLoad, TASK_LOADS, type TaskLoad } from '../../strength/loads';
import { fmt } from '../../types/units';
import { heatWarnings } from '../../print/settings';
import { LEVEL_LABEL } from '../../strength/evaluate';
import type { UseLocation } from '../../families/types';
import type { MaterialId } from '../../strength/materials';
import { ExplainBox } from '../../llm/ExplainBox';
import { factsFrom } from '../../llm/facts';
import { MATERIALS } from '../../strength/materials';
import { disclaimer } from '../../content/disclaimers';

export const LOCATIONS: { value: UseLocation; label: string }[] = [
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'desk', label: 'Desk / living room' },
  { value: 'outdoors', label: 'Outdoors' },
  { value: 'car', label: 'Car' },
  { value: 'other', label: 'Somewhere else' },
];

export function StrengthPanel() {
  const { analysis } = useDesigner();
  const { verdict, verdicts, print, calibration } = analysis;
  const use = useDesign((s) => s.use);
  const setUse = useDesign((s) => s.setUse);
  const sf = useDesign((s) => s.safetyFactor);
  const setSF = useDesign((s) => s.setSafetyFactor);
  const setPrint = useDesign((s) => s.setPrint);
  const [math, setMath] = useState(false);
  const primary = analysis.loadCases[0];
  const disp = displayLoad({ ...primary, value: primary.base });
  const task = TASK_LOADS[primary.id as TaskLoad];
  const warnings = heatWarnings(print.material, use.location);

  return (
    <div className="space-y-6">
      <section aria-labelledby="verdict-h" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="verdict-h" className="text-lg font-bold">
            Will it hold?
          </h3>
          <StrengthBadge calibration={calibration} />
        </div>
        <Meter u={verdict.utilization} level={verdict.level} />
        <ExplainBox facts={factsFrom(analysis.family.name, verdict, print.material)} />
        <p className="text-sm text-muted">{verdict.reason}</p>
        {verdicts.length > 1 && (
          <ul className="text-sm text-muted">
            {verdicts.map((v) => (
              <li key={v.loadCase.id}>
                {v.loadCase.label}: {LEVEL_LABEL[v.level]} ({Math.round(v.utilization * 100)}%)
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold">Load</h3>
        <Choice
          label="How hard is the task?"
          value={use.level}
          options={[
            { value: 'light', label: 'Light (×0.6)' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'heavy', label: 'Heavy (×1.6)' },
          ]}
          onChange={(level) => setUse({ level })}
        />
        <NumberSlider
          label={`${primary.label} (before scaling)`}
          value={use.loadOverrides?.[primary.id] ?? disp.value}
          min={disp.unit === 'N·m' ? 0.1 : 2}
          max={disp.unit === 'N·m' ? Math.max(15, task?.value ?? 0) : 200}
          step={disp.unit === 'N·m' ? 0.1 : 1}
          unit={disp.unit}
          help={
            use.loadOverrides?.[primary.id] === undefined
              ? 'Assumed typical value — change it if you know better.'
              : 'Your value.'
          }
          onChange={(v) => setUse({ loadOverrides: { ...use.loadOverrides, [primary.id]: v } })}
        />
        {use.loadOverrides?.[primary.id] !== undefined && (
          <button
            type="button"
            className="tap text-sm font-semibold text-primary underline"
            onClick={() => setUse({ loadOverrides: { ...use.loadOverrides, [primary.id]: undefined } })}
          >
            Use the typical value again
          </button>
        )}
        <NumberSlider
          label="Safety factor"
          value={sf}
          min={1.2}
          max={4}
          step={0.1}
          help="How much stronger than needed it should be. 2 is a sensible default."
          onChange={setSF}
        />
        <Select
          label="Where will it be used?"
          value={use.location}
          options={LOCATIONS}
          onChange={(location) => setUse({ location })}
        />
        <Choice
          label="Material"
          value={print.material}
          options={(Object.keys(MATERIALS) as MaterialId[]).map((m) => ({
            value: m,
            label: m,
            hint: MATERIALS[m].summary,
          }))}
          onChange={(material) => setPrint({ ...print, material })}
          help={MATERIALS[print.material].summary}
        />
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-bold">Heat and care</h3>
        {warnings.map((w) => (
          <Note key={w.text} tone={w.tone}>
            {w.text}
          </Note>
        ))}
        {disclaimer('foodSafe') && <Note tone="info">{disclaimer('foodSafe')}</Note>}
      </section>

      <section>
        <button
          type="button"
          className="tap flex w-full items-center justify-between rounded-xl border border-border px-3 font-semibold"
          aria-expanded={math}
          onClick={() => setMath((v) => !v)}
        >
          Show the math
          <span aria-hidden="true">{math ? '▲' : '▼'}</span>
        </button>
        {math && (
          <div className="mt-3 space-y-5 text-sm">
            <p>
              Load case: {verdict.loadCase.label} = {fmt(displayLoad(verdict.loadCase).value, 2)}{' '}
              {displayLoad(verdict.loadCase).unit}
              {verdict.loadCase.assumed ? ' (assumed)' : ''}. Material {print.material}: σ_xy{' '}
              {fmt(MATERIALS[print.material].sigmaXY.value)} MPa
              {calibration ? ` (calibrated: ${fmt(calibration.sigmaXY)} MPa)` : ' (assumed)'}. Shell{' '}
              {fmt(print.walls * print.lineWidth, 2)} mm, infill {Math.round(print.infill * 100)}%. Printed{' '}
              {analysis.orientation.candidate.label.toLowerCase()}.
            </p>
            {verdict.sections.map((s) => (
              <div
                key={s.id}
                className={`rounded-xl border p-3 ${s.id === verdict.governing.id ? 'border-primary' : 'border-border'}`}
              >
                <p className="font-semibold">
                  {s.id === verdict.governing.id ? 'Governing: ' : ''}
                  {s.check} {s.label} — {Math.round(s.utilization * 100)}%
                  {s.acrossLayers ? ' (across layers)' : ''}
                </p>
                <table className="mt-2 w-full">
                  <tbody>
                    {s.math.map((m, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="py-1 pr-2">{m.label}</td>
                        <td className="py-1 pr-2 font-mono text-xs">{m.expr}</td>
                        <td className="py-1 text-right font-mono">
                          {fmt(m.value, Math.abs(m.value) < 10 ? 3 : 1)} {m.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            <p className="text-muted">
              Model: the part is treated as a hollow shell (walls × line width) with the infill adding 30% of
              its density in stiffness. Stress concentrations (Kt) and layer direction are included.{' '}
              {disclaimer('modelNote')}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
