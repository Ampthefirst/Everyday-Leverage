import { Link } from 'react-router-dom';
import { Card, Note, Page, PageHeader } from '../components/Card';
import { IsIsNotTable } from '../components/IsIsNot';
import { StrengthBadge } from '../components/StrengthBadge';
import { MATERIALS } from '../strength/materials';
import { useCalibration } from '../state/calibration';

export default function LimitsPage() {
  const active = useCalibration((s) => s.activeFor('PETG') ?? s.activeFor('PLA'));
  return (
    <Page narrow>
      <PageHeader
        title="Limits and safety"
        lead="What Everyday Leverage can and cannot promise — stated plainly, so a first print is more likely to work and nobody is misled."
      />
      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-2xl font-bold">What it is — and isn't</h2>
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <IsIsNotTable />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Strength numbers are estimates</h2>
          <p>
            <StrengthBadge calibration={active} />
          </p>
          <p>
            The strength check uses published material data with standard reductions for 3D-printed parts,
            treats each part as a hollow shell, and adds stress concentrations and the weaker direction across
            layers. It is an analytic estimate —{' '}
            <strong>not finite-element analysis and not tested on your printer</strong>. The stress map is
            computed from the same model as the verdict, so they always agree, but it is a guide, not a
            measurement.
          </p>
          <p>
            You can calibrate to your own printer by breaking a few printed test bars. Calibration only
            applies to the printer that printed the bars.{' '}
            <Link to="/calibrate" className="font-semibold text-primary underline">
              Calibrate
            </Link>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Not food-safe</h2>
          <p>
            Printed plastic has tiny gaps between layers that trap food and bacteria and cannot be fully
            cleaned. Keep printed parts from touching food — a jar opener touches the lid, not the food; a
            utensil grip sits on the handle, not the bowl.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Heat</h2>
          <ul className="list-disc space-y-1 pl-6">
            {Object.values(MATERIALS).map((m) => (
              <li key={m.id}>
                <strong>{m.name}</strong> softens around {m.softeningC.value[0]}–{m.softeningC.value[1]} °C.{' '}
                {m.summary}
              </li>
            ))}
            <li>
              Never put printed parts in the dishwasher. Keep them out of hot cars and away from the stove and
              kettle.
            </li>
          </ul>
        </section>

        <Note tone="warn">
          <h2 className="text-xl font-bold">When to see an occupational therapist or doctor</h2>
          <p className="mt-2">
            If a task causes pain, follows an injury or surgery, or involves supporting body weight (standing,
            walking, transfers), please talk to an occupational therapist (OT) or a doctor. This app makes
            convenience aids for everyday tasks and never asks about health conditions.
          </p>
        </Note>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Known limits of this version</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              Strength numbers and the stress map are uncalibrated analytic estimates, not FEA and not
              test-verified.
            </li>
            <li>Fillets are approximated by rounded profiles.</li>
            <li>Print time and filament estimates are rough.</li>
            <li>Calibration applies only to the printer that printed the test bars.</li>
            <li>
              The target printer is a 256 × 256 × 256 mm bed; long parts may be split into two glued pieces.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Sources</h2>
          <Card>
            <ul className="list-disc space-y-2 pl-6 text-sm">
              <li>
                Material constants (PLA, PETG): typical values from manufacturers' technical data sheets for
                printed specimens, rounded down. Each value is marked "assumed" in the app until you
                calibrate.
              </li>
              <li>
                Layer (Z-direction) strength: published tensile tests of FDM parts commonly report 40–80% of
                in-plane strength; the app assumes 55% (PLA) and 70% (PETG).
              </li>
              <li>
                Section, bending, torsion (including Bredt's thin-walled formula), bearing and Euler buckling
                formulas: standard mechanics references such as Roark's Formulas for Stress and Strain and
                Shigley's Mechanical Engineering Design.
              </li>
              <li>
                Grip sizes: ergonomics references commonly recommend power-grip handle diameters of roughly
                30–50 mm (for example Eastman Kodak Company, Ergonomic Design for People at Work; Kroemer
                &amp; Grandjean, Fitting the Task to the Human).
              </li>
              <li>
                Default task loads (jar lids, keys, drawers, buttons) are assumed typical values and are shown
                as "assumed" wherever they are used; you can change them.
              </li>
            </ul>
          </Card>
        </section>
      </div>
    </Page>
  );
}
