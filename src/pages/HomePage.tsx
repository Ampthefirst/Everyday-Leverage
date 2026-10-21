import { Link } from 'react-router-dom';
import { LinkButton } from '../components/Button';
import { Card, Page } from '../components/Card';
import { FamilyIcon } from '../components/FamilyIcon';
import { IsIsNotTable } from '../components/IsIsNot';
import { familyList } from '../families';
import { GROUPS } from './PickPage';

const STEPS = [
  {
    t: 'Describe the task',
    d: 'Tell us what is hard — opening a jar, turning a key, holding a spoon. Or pick a design yourself.',
  },
  {
    t: 'Measure',
    d: 'A few measurements with a ruler or the printable gauges. An illustrated guide shows how.',
  },
  {
    t: 'Check fit and strength',
    d: 'See it in 3D around the real object, print a paper template to check the size, and get a plain strength verdict.',
  },
  {
    t: 'Print it',
    d: 'Download the files — or a one-page sheet to hand to a library, school or print service.',
  },
];

export function HomePage() {
  const fams = familyList();
  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-[3fr_2fr] md:items-center">
          <div>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">Everyday Leverage</h1>
            <p className="mt-4 max-w-2xl text-xl">
              Turn a hard daily task and a few measurements into a custom-fit, strength-checked aid that needs
              less force — ready to 3D print.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton to="/find" className="px-6 text-lg">
                Help me find a design
              </LinkButton>
              <LinkButton to="/design" variant="secondary" className="px-6 text-lg">
                Pick a design
              </LinkButton>
            </div>
            <p className="mt-4 text-muted">
              No account. Works offline. Nothing you enter leaves this device.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-primary" aria-hidden="true">
            {fams.map((f) => (
              <div
                key={f.id}
                className="flex aspect-square items-center justify-center rounded-2xl border border-border bg-surface-2"
              >
                <FamilyIcon id={f.id} className="h-16 w-16" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <Page>
        <section aria-labelledby="how">
          <h2 id="how" className="text-2xl font-bold">
            How it works
          </h2>
          <ol className="mt-4 grid gap-4 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.t}>
                <Card className="h-full">
                  <span className="text-3xl font-bold text-primary">{i + 1}</span>
                  <h3 className="mt-1 text-lg font-bold">{s.t}</h3>
                  <p className="mt-1 text-muted">{s.d}</p>
                </Card>
              </li>
            ))}
          </ol>
        </section>
        <section aria-labelledby="designs" className="mt-12">
          <h2 id="designs" className="text-2xl font-bold">
            Nine designs, one idea: leverage
          </h2>
          <p className="mt-2 max-w-3xl text-muted">
            Every design lowers the force or dexterity a task needs — a longer lever, a thicker grip, or a
            better angle.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {GROUPS.map((g) => (
              <Card key={g.id}>
                <h3 className="text-xl font-bold">
                  {g.id}. {g.title}
                </h3>
                <p className="text-muted">{g.lead}</p>
                <ul className="mt-3 space-y-1">
                  {fams
                    .filter((f) => f.group === g.id)
                    .map((f) => (
                      <li key={f.id}>
                        <Link
                          to={`/design/${f.id}`}
                          className="tap inline-flex items-center gap-2 font-semibold text-primary underline"
                        >
                          {f.id} {f.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>
        <section aria-labelledby="isnot" className="mt-12">
          <h2 id="isnot" className="text-2xl font-bold">
            What it is — and isn't
          </h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-surface">
            <IsIsNotTable />
          </div>
          <p className="mt-3">
            <Link to="/limits" className="font-semibold text-primary underline">
              Read the limits and safety notes
            </Link>{' '}
            ·{' '}
            <Link to="/print-help" className="font-semibold text-primary underline">
              No printer? Here's how to get it printed
            </Link>
          </p>
        </section>
      </Page>
    </>
  );
}
