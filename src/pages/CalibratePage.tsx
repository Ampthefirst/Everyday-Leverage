import { useMemo, useState } from 'react';
import { Card, Note, Page, PageHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Choice } from '../components/Field';
import { StrengthBadge } from '../components/StrengthBadge';
import {
  barStress,
  fitCalibration,
  G,
  MIN_BREAKS,
  stdev,
  TEST_BAR,
  type BarOrientation,
  type BreakEntry,
  type CalibrationProfile,
} from '../strength/calibration';
import { MATERIALS, type MaterialId } from '../strength/materials';
import { profileKey, useCalibration } from '../state/calibration';
import { geometry } from '../geometry/client';
import { downloadBlob, orientMesh, toBinarySTL } from '../outputs/stl';
import { fmt } from '../types/units';

interface Row {
  id: number;
  orientation: BarOrientation;
  value: string;
}

/** Example numbers so the flow can be tried end to end. Not real tests. */
const SAMPLE: { orientation: BarOrientation; kg: number }[] = [
  { orientation: 'xy', kg: 2.2 },
  { orientation: 'xy', kg: 2.35 },
  { orientation: 'xy', kg: 2.1 },
  { orientation: 'z', kg: 1.15 },
  { orientation: 'z', kg: 1.3 },
  { orientation: 'z', kg: 1.05 },
];

let nextId = 1;

/** Prediction (published data) beside the measurement — the evidence the strength numbers need. */
function PredictionTable({
  base,
  xy,
  z,
  unit,
}: {
  base: (typeof MATERIALS)[MaterialId];
  xy: number[];
  z: number[];
  unit: 'kg' | 'N';
}) {
  // Invert σ = 6·F·a / (b·h²) for the predicted break load.
  const loadFor = (sigma: number) => (sigma * TEST_BAR.width * TEST_BAR.thickness ** 2) / (6 * TEST_BAR.arm);
  const show = (n: number) => (unit === 'kg' ? `${fmt(n / G, 2)} kg` : `${fmt(n, 1)} N`);
  const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
  const rows: [string, number, number][] = [
    ['Flat (XY)', loadFor(base.sigmaXY.value), loadFor(mean(xy))],
    ['Upright (Z)', loadFor(base.sigmaXY.value * base.zFraction.value), loadFor(mean(z))],
  ];
  return (
    <table className="mt-2 w-full text-left text-sm">
      <caption className="sr-only">Predicted and measured break loads</caption>
      <thead>
        <tr>
          <th scope="col">Bar</th>
          <th scope="col">Predicted (published data)</th>
          <th scope="col">Measured (your average)</th>
          <th scope="col">Difference</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([name, pred, meas]) => (
          <tr key={name}>
            <th scope="row" className="font-normal">
              {name}
            </th>
            <td>{show(pred)}</td>
            <td>{show(meas)}</td>
            <td>
              {meas >= pred ? '+' : '−'}
              {Math.abs(Math.round(((meas - pred) / pred) * 100))}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function CalibratePage() {
  const { profiles, active, add, remove, activate } = useCalibration();
  const [printer, setPrinter] = useState('');
  const [material, setMaterial] = useState<MaterialId>('PETG');
  const [unit, setUnit] = useState<'kg' | 'N'>('kg');
  const [rows, setRows] = useState<Row[]>(() => [
    { id: nextId++, orientation: 'xy', value: '' },
    { id: nextId++, orientation: 'z', value: '' },
  ]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const entries: BreakEntry[] = useMemo(
    () =>
      rows
        .map((r) => ({ orientation: r.orientation, n: Number(r.value) }))
        .filter((r) => Number.isFinite(r.n) && r.n > 0)
        .map((r) => ({ orientation: r.orientation, loadN: unit === 'kg' ? r.n * G : r.n })),
    [rows, unit],
  );
  const fit = fitCalibration(entries);
  const base = MATERIALS[material];

  const bar = async (orient: 'flat' | 'upright') => {
    setBusy(true);
    try {
      const m = await geometry.bar();
      const mesh = orient === 'flat' ? m : orientMesh(m, [0, -90, 0]);
      downloadBlob(
        toBinarySTL(orient === 'flat' ? orientMesh(m, [0, 0, 0]) : mesh, `test bar ${orient}`),
        `calibration-bar-${orient === 'flat' ? 'XY-flat' : 'Z-upright'}.stl`,
        'model/stl',
      );
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!fit.ok || !printer.trim()) return;
    const p: CalibrationProfile = {
      printerName: printer.trim(),
      material,
      createdAt: new Date().toISOString(),
      entries,
      sigmaXY: fit.sigmaXY!,
      zFraction: fit.zFraction!,
    };
    add(p);
    setMsg(
      `Saved and switched on: ${material} on “${p.printerName}”. Strength checks now use these numbers.`,
    );
  };

  const exportJson = () =>
    downloadBlob(
      JSON.stringify({ format: 'everyday-leverage-calibration', version: 1, profiles }, null, 2),
      'everyday-leverage-calibration.json',
      'application/json',
    );
  const importJson = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      const list: CalibrationProfile[] = Array.isArray(data?.profiles) ? data.profiles : [];
      let n = 0;
      for (const p of list) {
        if (
          typeof p.printerName === 'string' &&
          (p.material === 'PLA' || p.material === 'PETG') &&
          p.sigmaXY > 5 &&
          p.sigmaXY < 120 &&
          p.zFraction > 0.05 &&
          p.zFraction <= 1
        ) {
          add(p);
          n++;
        }
      }
      setMsg(
        n
          ? `Imported ${n} calibration profile${n > 1 ? 's' : ''}.`
          : 'No valid calibration profiles found in that file.',
      );
    } catch {
      setMsg('That file could not be read as a calibration file.');
    }
  };

  return (
    <Page narrow>
      <PageHeader
        title="Calibrate to your printer"
        lead="Break a few printed test bars and the strength checks switch from published estimates to your printer's real numbers."
      />
      <div className="space-y-6">
        <Card className="space-y-3">
          <h2 className="text-3xl">
            <span aria-hidden="true" className="figcaption mr-2 text-faint">
              1
            </span>
            <span className="sr-only">Step 1: </span>
            Print the test bars
          </h2>
          <p>
            {TEST_BAR.length} × {TEST_BAR.width} × {TEST_BAR.thickness} mm. Print at least {MIN_BREAKS} lying
            flat and {MIN_BREAKS} standing upright, in the same material and settings you use for parts.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => bar('flat')}>
              Test bar — flat (XY)
            </Button>
            <Button disabled={busy} onClick={() => bar('upright')}>
              Test bar — upright (Z)
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                // jsPDF loads only when needed.
                const { calibrationSheetPdf } = await import('../outputs/pdf/calibration');
                downloadBlob(
                  calibrationSheetPdf(/^en-(US|CA)/.test(navigator.language) ? 'letter' : 'a4'),
                  'calibration-instructions.pdf',
                  'application/pdf',
                );
              }}
            >
              Instruction sheet (PDF)
            </Button>
          </div>
        </Card>
        <Card className="space-y-3">
          <h2 className="text-3xl">
            <span aria-hidden="true" className="figcaption mr-2 text-faint">
              2
            </span>
            <span className="sr-only">Step 2: </span>
            Break them
          </h2>
          <p>
            Clamp the bar up to the groove ({TEST_BAR.clamp} mm), hang weight from the hole ({TEST_BAR.arm} mm
            out) and add weight slowly until it breaks. Wear eye protection.
          </p>
        </Card>
        <Card className="space-y-4">
          <h2 className="text-3xl">
            <span aria-hidden="true" className="figcaption mr-2 text-faint">
              3
            </span>
            <span className="sr-only">Step 3: </span>
            Enter the results
          </h2>
          <label className="block">
            <span className="font-semibold">Printer name</span>
            <input
              className="tap mt-1 w-full rounded-lg border border-border bg-surface px-3"
              value={printer}
              onChange={(e) => setPrinter(e.target.value)}
              placeholder="e.g. Library MK4"
            />
          </label>
          <Choice
            label="Material"
            value={material}
            options={(['PLA', 'PETG'] as MaterialId[]).map((m) => ({ value: m, label: m }))}
            onChange={setMaterial}
          />
          <Choice
            label="Units"
            value={unit}
            options={[
              { value: 'kg', label: 'kg hanging' },
              { value: 'N', label: 'newtons (scale)' },
            ]}
            onChange={setUnit}
          />
          <table className="w-full text-left">
            <caption className="sr-only">Break loads</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-2">
                  Bar
                </th>
                <th scope="col" className="py-2">
                  Break load ({unit})
                </th>
                <th scope="col" className="py-2 text-right">
                  Stress
                </th>
                <th scope="col" className="sr-only">
                  Remove
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const n = Number(r.value);
                const F = unit === 'kg' ? n * G : n;
                return (
                  <tr key={r.id} className="border-b border-border">
                    <td className="py-2 pr-2">
                      <select
                        aria-label={`Bar ${i + 1} orientation`}
                        className="tap rounded-lg border border-border bg-surface px-2"
                        value={r.orientation}
                        onChange={(e) =>
                          setRows(
                            rows.map((x) =>
                              x.id === r.id ? { ...x, orientation: e.target.value as BarOrientation } : x,
                            ),
                          )
                        }
                      >
                        <option value="xy">Flat (XY)</option>
                        <option value="z">Upright (Z)</option>
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        aria-label={`Bar ${i + 1} break load in ${unit}`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        className="tap w-28 rounded-lg border border-border bg-surface px-2"
                        value={r.value}
                        onChange={(e) =>
                          setRows(rows.map((x) => (x.id === r.id ? { ...x, value: e.target.value } : x)))
                        }
                      />
                    </td>
                    <td className="py-2 text-right">{n > 0 ? `${fmt(barStress(F), 1)} MPa` : '—'}</td>
                    <td className="py-2 text-right">
                      <Button variant="ghost" onClick={() => setRows(rows.filter((x) => x.id !== r.id))}>
                        Remove<span className="sr-only"> bar {i + 1}</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setRows([...rows, { id: nextId++, orientation: 'xy', value: '' }])}
            >
              Add flat bar
            </Button>
            <Button
              variant="secondary"
              onClick={() => setRows([...rows, { id: nextId++, orientation: 'z', value: '' }])}
            >
              Add upright bar
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setUnit('kg');
                setRows(
                  SAMPLE.map((s) => ({ id: nextId++, orientation: s.orientation, value: String(s.kg) })),
                );
                if (!printer) setPrinter('Example printer');
              }}
            >
              Fill with example numbers
            </Button>
          </div>
          <p className="text-sm text-muted">
            The example numbers are made up to show how it works — they are not real test results.
          </p>
          <div aria-live="polite">
            {fit.ok ? (
              <Note tone="ok">
                <p className="font-semibold">Result</p>
                <p>
                  In-plane strength σ_xy = {fmt(fit.sigmaXY!, 1)} MPa (±{fmt(stdev(fit.xyStresses), 1)};
                  assumed {base.sigmaXY.value} MPa). Layer strength = {Math.round(fit.zFraction! * 100)}% of
                  that (assumed {Math.round(base.zFraction.value * 100)}%).
                </p>
                <PredictionTable base={base} xy={fit.xyStresses} z={fit.zStresses} unit={unit} />
                {fit.problems.map((p) => (
                  <p key={p} className="mt-1 text-warn">
                    {p}
                  </p>
                ))}
              </Note>
            ) : (
              <Note tone="info">{fit.problems.join(' ')}</Note>
            )}
          </div>
          <Button disabled={!fit.ok || !printer.trim()} onClick={save}>
            Save and use this calibration
          </Button>
          {msg && <Note tone="ok">{msg}</Note>}
        </Card>
        <Card className="space-y-3">
          <h2 className="text-3xl">Saved calibrations</h2>
          {profiles.length === 0 && (
            <p className="text-muted">
              None yet. Until you add one, every strength check shows <StrengthBadge calibration={null} />
            </p>
          )}
          <ul className="space-y-2">
            {profiles.map((p) => {
              const key = profileKey(p);
              const on = active[p.material] === key;
              return (
                <li
                  key={key}
                  className={`flex flex-wrap items-center gap-2 rounded-md border p-3 ${on ? 'border-primary shadow-[inset_0_0_0_1px_var(--color-primary)]' : 'border-border'}`}
                >
                  <span>
                    <span className="font-semibold">{p.printerName}</span> · {p.material} · σ_xy{' '}
                    {fmt(p.sigmaXY, 1)} MPa · layer {Math.round(p.zFraction * 100)}% · {p.entries.length} bars
                  </span>
                  <span className="ml-auto flex gap-2">
                    <Button
                      variant="secondary"
                      aria-pressed={on}
                      onClick={() => activate(p.material, on ? null : key)}
                    >
                      {on ? 'In use' : 'Use'}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => remove(key)}
                      aria-label={`Delete calibration ${p.printerName} ${p.material}`}
                    >
                      Delete
                    </Button>
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" disabled={!profiles.length} onClick={exportJson}>
              Export (JSON)
            </Button>
            <label className="tap inline-flex cursor-pointer items-center rounded-xl px-4 font-semibold hover:bg-surface-2">
              Import (JSON)
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
              />
            </label>
          </div>
        </Card>
      </div>
    </Page>
  );
}
