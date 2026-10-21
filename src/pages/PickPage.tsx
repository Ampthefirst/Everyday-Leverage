import { Link } from 'react-router-dom';
import { familyList } from '../families';
import { Page, PageHeader } from '../components/Card';
import { FamilyIcon } from '../components/FamilyIcon';
import type { FamilyGroup } from '../families/types';

export const GROUPS: { id: FamilyGroup; title: string; lead: string }[] = [
  { id: 'A', title: 'Hold', lead: 'Easier gripping of thin or small handles.' },
  { id: 'B', title: 'Turn and open', lead: 'Twisting lids, keys, knobs, caps and taps with less force.' },
  { id: 'C', title: 'Pull, push and reach', lead: 'Pulling, pressing and reaching without a pinch grip.' },
];

export default function PickPage() {
  const fams = familyList();
  return (
    <Page>
      <PageHeader
        title="Pick a design"
        lead="Nine designs in three groups. Each one adds leverage — a longer lever, a thicker grip, or a better angle."
      />
      <div className="space-y-10">
        {GROUPS.map((g) => (
          <section key={g.id} aria-labelledby={`g-${g.id}`}>
            <h2 id={`g-${g.id}`} className="text-2xl font-bold">
              {g.id}. {g.title}
            </h2>
            <p className="mb-4 text-muted">{g.lead}</p>
            <ul className="grid gap-4 md:grid-cols-3">
              {fams
                .filter((f) => f.group === g.id)
                .map((f) => (
                  <li key={f.id}>
                    <Link
                      to={`/design/${f.id}`}
                      className="tap flex h-full gap-4 rounded-2xl border-2 border-border bg-surface p-4 hover:border-primary focus-visible:border-primary"
                    >
                      <span className="text-primary">
                        <FamilyIcon id={f.id} />
                      </span>
                      <span>
                        <span className="block text-lg font-bold">
                          <span className="text-muted">{f.id}</span> {f.name}
                        </span>
                        <span className="block text-muted">{f.blurb}</span>
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </Page>
  );
}
