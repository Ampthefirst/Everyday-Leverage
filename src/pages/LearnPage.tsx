import { useState } from 'react';
import { Card, Note, Page, PageHeader } from '../components/Card';
import { NumberSlider } from '../components/Field';
import { Tabs } from '../components/Tabs';
import { FAILURES } from '../learn/failures';
import { MATERIALS, type MaterialId } from '../strength/materials';
import { useCalibration } from '../state/calibration';
import { StrengthBadge } from '../components/StrengthBadge';
import { fmt } from '../types/units';

type T = 'lever' | 'fail' | 'materials';

export default function LearnPage() {
  const [tab, setTab] = useState<T>('lever');
  return (
    <Page>
      <PageHeader title="Learn" lead="The ideas behind the designs, in plain words." />
      <div className="rounded-2xl border border-border bg-surface">
        <Tabs
          label="Learn topics"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'lever', label: 'How leverage helps' },
            { id: 'fail', label: 'Why did it fail?' },
            { id: 'materials', label: 'PLA or PETG?' },
          ]}
        >
          {tab === 'lever' && <LeverExplainer />}
          {tab === 'fail' && <FailureGuide />}
          {tab === 'materials' && <Materials />}
        </Tabs>
      </div>
    </Page>
  );
}

function LeverExplainer() {
  const [torque, setTorque] = useState(4);
  const [lever, setLever] = useState(150);
  const lidR = 35;
  const bare = (torque * 1000) / lidR;
  const withLever = (torque * 1000) / (lidR + lever * 0.7);
  const kg = (n: number) => n / 9.81;
  const W = 520;
  const scale = 1.4;
  const cx = 70;
  const cy = 120;
  const tipX = cx + (lidR + lever) * scale;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <p className="text-lg">
          Twisting needs <strong>torque</strong>: force × distance from the centre. Hold a jar lid by its edge
          and your fingers are only {lidR} mm out. Push on the end of a lever and your hand is much further
          out — so the same twist needs less force.
        </p>
        <NumberSlider
          label="Lever length"
          value={lever}
          min={0}
          max={250}
          step={5}
          unit="mm"
          onChange={setLever}
        />
        <NumberSlider
          label="How tight the lid is"
          value={torque}
          min={1}
          max={10}
          step={0.5}
          unit="N·m"
          onChange={setTorque}
          help="About 4 N·m is a typical stiff jar."
        />
        <div className="grid grid-cols-2 gap-3" aria-live="polite">
          <Card>
            <p className="text-sm text-muted">Gripping the lid</p>
            <p className="font-serif text-4xl">{fmt(bare, 0)} N</p>
            <p className="text-sm">like lifting {fmt(kg(bare), 1)} kg with a pinch</p>
          </Card>
          <Card>
            <p className="text-sm text-muted">With a {lever} mm lever</p>
            <p className="font-serif text-4xl text-ok">{fmt(withLever, 0)} N</p>
            <p className="text-sm">
              {fmt(kg(withLever), 1)} kg — about {Math.max(1, Math.round(bare / withLever))}× easier
            </p>
          </Card>
        </div>
        <p className="text-sm text-muted">
          Hand force assumed at 70% of the lever length. Real numbers vary; this shows the idea.
        </p>
      </div>
      <svg
        viewBox={`0 0 ${W} 240`}
        className="w-full"
        role="img"
        aria-label={`Diagram: a ${lever} millimetre lever on a ${lidR * 2} millimetre lid. The hand pushes with about ${fmt(withLever, 0)} newtons.`}
      >
        <circle cx={cx} cy={cy} r={lidR * scale} fill="none" stroke="var(--color-text)" strokeWidth={3} />
        <rect
          x={cx + lidR * scale - 4}
          y={cy - 12}
          width={Math.max(0, lever * scale) + 4}
          height={24}
          rx={10}
          fill="var(--color-primary)"
          opacity={0.85}
        />
        <circle cx={cx} cy={cy} r={3} fill="var(--color-text)" />
        <line
          x1={cx}
          y1={cy + 60}
          x2={Math.min(W - 10, tipX)}
          y2={cy + 60}
          stroke="var(--color-muted)"
          strokeDasharray="4 4"
        />
        <text
          x={(cx + Math.min(W - 10, tipX)) / 2}
          y={cy + 80}
          textAnchor="middle"
          fontSize={14}
          fill="var(--color-text)"
        >
          {lidR + lever} mm from the centre
        </text>
        <g transform={`translate(${Math.min(W - 30, cx + (lidR + lever * 0.7) * scale)}, ${cy - 70})`}>
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={Math.max(14, 50 * Math.min(1.5, withLever / 100))}
            stroke="var(--color-ok)"
            strokeWidth={6}
          />
          <polygon
            points="-10,40 10,40 0,58"
            fill="var(--color-ok)"
            transform={`translate(0, ${Math.max(14, 50 * Math.min(1.5, withLever / 100)) - 40})`}
          />
          <text x={12} y={14} fontSize={14} fill="var(--color-text)">
            {fmt(withLever, 0)} N
          </text>
        </g>
      </svg>
    </div>
  );
}

function FailureGuide() {
  const [pick, setPick] = useState<string | null>(null);
  const f = FAILURES.find((x) => x.id === pick);
  return (
    <div className="space-y-4">
      <p className="text-lg">Where did your part crack or give way?</p>
      <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Where it failed">
        {FAILURES.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={pick === x.id}
            onClick={() => setPick(x.id)}
            className={`tap rounded-md border p-3 text-left ${pick === x.id ? 'border-primary bg-info-bg shadow-[inset_0_0_0_1px_var(--color-primary)]' : 'border-border hover:border-text'}`}
          >
            {x.where}
          </button>
        ))}
      </div>
      <div aria-live="polite">
        {f && (
          <Card className="space-y-2">
            <h3 className="font-serif text-2xl">{f.where}</h3>
            <p>
              <strong>Likely cause:</strong> {f.cause}
            </p>
            <p>
              <strong>Fix:</strong> {f.fix}
            </p>
            <p className="text-sm text-muted">
              Idea behind it: {f.concept}. The Strength tab's “Show the math” lists this check for every
              design.
            </p>
          </Card>
        )}
      </div>
      <Note tone="info">
        If you record where real parts broke and at what load, you can compare it with the estimate — that's
        how the app's numbers earn trust.
      </Note>
    </div>
  );
}

function Materials() {
  const activeFor = useCalibration((s) => s.activeFor);
  useCalibration((s) => s.active);
  const ids: MaterialId[] = ['PLA', 'PETG'];
  const rows = ids.map((id) => {
    const m = MATERIALS[id];
    const cal = activeFor(id);
    return { id, m, cal, sigma: cal?.sigmaXY ?? m.sigmaXY.value, z: cal?.zFraction ?? m.zFraction.value };
  });
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <caption className="sr-only">PLA and PETG compared</caption>
          <thead>
            <tr className="border-b-2 border-border">
              <th scope="col" className="p-2"></th>
              {rows.map((r) => (
                <th scope="col" key={r.id} className="p-2 text-lg">
                  {r.id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <th scope="row" className="p-2">
                Strength (along layers)
              </th>
              {rows.map((r) => (
                <td key={r.id} className="p-2">
                  {fmt(r.sigma, 1)} MPa
                </td>
              ))}
            </tr>
            <tr className="border-b border-border">
              <th scope="row" className="p-2">
                Across layers
              </th>
              {rows.map((r) => (
                <td key={r.id} className="p-2">
                  {Math.round(r.z * 100)}% ({fmt(r.sigma * r.z, 1)} MPa)
                </td>
              ))}
            </tr>
            <tr className="border-b border-border">
              <th scope="row" className="p-2">
                Stiffness
              </th>
              {rows.map((r) => (
                <td key={r.id} className="p-2">
                  {fmt(r.m.E.value / 1000, 1)} GPa
                </td>
              ))}
            </tr>
            <tr className="border-b border-border">
              <th scope="row" className="p-2">
                Softens at
              </th>
              {rows.map((r) => (
                <td key={r.id} className="p-2">
                  {r.m.softeningC.value[0]}–{r.m.softeningC.value[1]} °C
                </td>
              ))}
            </tr>
            <tr className="border-b border-border">
              <th scope="row" className="p-2">
                Creep under steady load
              </th>
              {rows.map((r) => (
                <td key={r.id} className="p-2">
                  {r.m.creep.value}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border">
              <th scope="row" className="p-2">
                Source
              </th>
              {rows.map((r) => (
                <td key={r.id} className="p-2">
                  <StrengthBadge calibration={r.cal} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <ul className="list-disc space-y-1 pl-6">
        {rows.map((r) => (
          <li key={r.id}>
            <strong>{r.id}:</strong> {r.m.summary}
          </li>
        ))}
      </ul>
      <p className="text-muted">
        Numbers are typical published values until you calibrate; then your printer's results appear here.
      </p>
    </div>
  );
}
