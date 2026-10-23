import { useDesign } from '../../state/design';
import { useDesigner } from './context';
import { Badge } from '../Badge';
import { Note } from '../Card';
import { Button } from '../Button';
import { NumberSlider, Choice } from '../Field';
import { formatDuration, VOL_RATE } from '../../print/estimates';
import { fmt } from '../../types/units';
import type { MaterialId } from '../../strength/materials';

const SUPPORT_TEXT = {
  none: 'No supports',
  minimal: 'Small supports may help',
  needed: 'Needs supports',
} as const;

export function IssueList() {
  const { analysis, family, params } = useDesigner();
  const setParams = useDesign((s) => s.setParams);
  const issues = analysis.issues;
  if (!issues.length) return <Note tone="ok">No problems found. Ready to print.</Note>;
  const hasErrors = issues.some((i) => i.severity === 'error');
  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {issues.map((i, k) => (
          <li key={k}>
            <Note tone={i.severity === 'error' ? 'bad' : i.severity === 'warn' ? 'warn' : 'info'}>
              <span className="font-semibold">
                {i.severity === 'error' ? 'Must fix: ' : i.severity === 'warn' ? 'Check: ' : 'Note: '}
              </span>
              {i.message} {i.fix && <span className="block">{i.fix}</span>}
            </Note>
          </li>
        ))}
      </ul>
      {hasErrors && (
        <Button variant="secondary" onClick={() => setParams(family.id, family.repair(params))}>
          Fix it for me
        </Button>
      )}
    </div>
  );
}

export function PrintPanel() {
  const { analysis, build } = useDesigner();
  const { orientations, orientation, advice, print, bed, estimate } = analysis;
  const setOrientation = useDesign((s) => s.setOrientation);
  const chosen = useDesign((s) => s.orientation[analysis.family.id] ?? 'auto');
  const setPrint = useDesign((s) => s.setPrint);
  const custom = useDesign((s) => s.print);
  const upd = (patch: Partial<typeof print>) => setPrint({ ...print, ...patch });
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="font-serif text-xl">Ready to print?</h3>
        <IssueList />
      </section>

      <section className="space-y-2">
        <h3 className="font-serif text-xl">Placement on the bed</h3>
        {bed && (
          <p>
            <Badge tone={bed.fits ? 'ok' : analysis.split ? 'info' : 'bad'}>
              {bed.fits ? 'Fits 256 mm bed' : analysis.split ? 'Printed in 2 parts' : 'Too big'}
            </Badge>{' '}
            {bed.note}
          </p>
        )}
        <fieldset className="space-y-2">
          <legend className="sr-only">Print orientation</legend>
          {orientations.map((o, i) => {
            const active = o.candidate.id === orientation.candidate.id;
            return (
              <label
                key={o.candidate.id}
                className={`tap flex cursor-pointer gap-3 rounded-md border p-3 ${active ? 'border-primary bg-info-bg shadow-[inset_0_0_0_1px_var(--color-primary)]' : 'border-border'}`}
              >
                <input
                  type="radio"
                  name="orientation"
                  className="mt-1 h-5 w-5"
                  checked={active}
                  onChange={() => setOrientation(analysis.family.id, o.candidate.id)}
                />
                <span>
                  <span className="font-semibold">
                    {o.candidate.label} {i === 0 && <Badge tone="ok">Recommended</Badge>}
                  </span>
                  <span className="block text-sm">
                    {SUPPORT_TEXT[o.candidate.supports]} · strength use {Math.round(o.utilization * 100)}%
                    {i === 0 ? ` — ${o.reason}` : ''}
                  </span>
                  <span className="block text-sm text-muted">{o.candidate.note}</span>
                </span>
              </label>
            );
          })}
        </fieldset>
        {chosen !== 'auto' && (
          <Button variant="ghost" onClick={() => setOrientation(analysis.family.id, 'auto')}>
            Use the recommended placement
          </Button>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl">Slicer settings</h3>
          {custom && (
            <Button variant="ghost" onClick={() => setPrint(null)}>
              Use recommended
            </Button>
          )}
        </div>
        <Choice
          label="Material"
          value={print.material}
          options={[
            { value: 'PLA', label: 'PLA' },
            { value: 'PETG', label: 'PETG' },
          ]}
          onChange={(m) => upd({ material: m as MaterialId })}
          help={advice.reasons.material}
        />
        <NumberSlider
          label="Walls (perimeters)"
          value={print.walls}
          min={2}
          max={8}
          step={1}
          onChange={(walls) => upd({ walls })}
          help={advice.reasons.walls}
        />
        <NumberSlider
          label="Infill"
          value={Math.round(print.infill * 100)}
          min={10}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => upd({ infill: v / 100 })}
          help={advice.reasons.infill}
        />
        <NumberSlider
          label="Layer height"
          value={print.layerHeight}
          min={0.1}
          max={0.32}
          step={0.02}
          unit="mm"
          onChange={(layerHeight) => upd({ layerHeight })}
          help={advice.reasons.layerHeight}
        />
        <NumberSlider
          label="Line width"
          value={print.lineWidth}
          min={0.35}
          max={0.8}
          step={0.05}
          unit="mm"
          onChange={(lineWidth) => upd({ lineWidth })}
          help={advice.reasons.lineWidth}
        />
      </section>

      <section className="space-y-1">
        <h3 className="font-serif text-xl">Estimates (rough)</h3>
        {estimate && build ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
            <dt>Filament</dt>
            <dd>
              {fmt(estimate.grams, 0)} g ({fmt(estimate.metres, 1)} m)
            </dd>
            <dt>Print time</dt>
            <dd>{formatDuration(estimate.minutes)}</dd>
            <dt>Part size</dt>
            <dd>
              {build.mesh.bbox.max.map((v, i) => Math.round(v - build.mesh.bbox.min[i])).join(' × ')} mm
            </dd>
          </dl>
        ) : (
          <p className="text-muted">Building the part…</p>
        )}
        <p className="text-sm text-muted">
          Assumes about {VOL_RATE} mm³/s of plastic; your printer and slicer will differ.
        </p>
      </section>
    </div>
  );
}
