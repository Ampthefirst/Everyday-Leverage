import { Link } from 'react-router-dom';
import { familyList } from '../../families';
import { GROUPS } from '../../families/groups';
import { showcaseParams } from '../../families/describe';
import { Figure } from '../Figure';

/**
 * Home's index of the nine designs: one quiet row per group, small drawings and names only. Choosing and
 * comparing happen on Pick, which has the full catalogue.
 */
export function DesignIndex() {
  const fams = familyList();
  return (
    <>
      <div className="border-t border-text">
        {GROUPS.map((g) => (
          <section
            key={g.id}
            aria-labelledby={`idx-${g.id}`}
            className="grid gap-4 border-b border-rule py-6 md:grid-cols-[13rem_1fr] md:gap-6"
          >
            <div>
              <h3 id={`idx-${g.id}`} className="font-semibold">
                {g.title}
              </h3>
              <p className="text-base text-muted">{g.lead}</p>
            </div>
            <ul className="grid grid-cols-3 gap-3 sm:gap-6">
              {fams
                .filter((f) => f.group === g.id)
                .map((f) => (
                  <li key={f.id}>
                    <Link to={`/pick/${f.id}`} className="group block rounded-sm">
                      <Figure
                        familyId={f.id}
                        params={showcaseParams(f)}
                        className="flex h-16 items-center sm:h-24 [&_svg]:max-h-16 sm:[&_svg]:max-h-24"
                      />
                      <span className="mt-2.5 block font-serif text-base leading-snug group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4 sm:text-[1.2rem]">
                        {f.name}
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-6">
        <Link to="/design" className="font-semibold text-primary underline-offset-4 hover:underline">
          Compare all nine on the Pick page <span aria-hidden="true">→</span>
        </Link>
      </p>
    </>
  );
}
