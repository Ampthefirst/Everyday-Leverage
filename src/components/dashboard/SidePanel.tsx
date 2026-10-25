import { Link } from 'react-router-dom';
import { useCalibration } from '../../state/calibration';
import { useProfiles } from '../../state/profiles';
import { MATERIALS } from '../../strength/materials';
import { showPrinterPanel } from '../../content/features';
import { signOut } from '../../accounts/sync';
import type { Project } from '../../state/projects';
import { downloadAll } from './downloadAll';

const linkRow =
  'tap flex items-center justify-between border-b border-rule font-semibold last:border-b-0 hover:text-primary';

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-base">
      <dt className="whitespace-nowrap text-muted">{k}</dt>
      <dd className="text-right font-semibold">{v}</dd>
    </div>
  );
}

/** The dashboard's side column: start something new, the printer (optional), the hand profile, the account. */
export function SidePanel({ email, projects }: { email: string; projects: Project[] }) {
  const calibrations = useCalibration((s) => s.profiles);
  const active = useCalibration((s) => s.active);
  const profile = useProfiles((s) => s.current());
  const activeNames = Object.entries(active)
    .map(([m, key]) => {
      const c = calibrations.find((x) => `${x.printerName}::${x.material}` === key);
      return c ? `${c.printerName} · ${MATERIALS[m as keyof typeof MATERIALS].name}` : null;
    })
    .filter((x): x is string => !!x);
  const section = 'border-t border-rule px-5 py-5 first:border-t-0';
  return (
    <aside aria-label="Your account and tools" className="self-start rounded-md border border-border">
      <section className={section} aria-labelledby="side-new">
        <h2 id="side-new" className="text-[1.375rem]">
          Start something new
        </h2>
        <nav className="mt-2" aria-label="Start something new">
          <Link to="/find" className={linkRow}>
            Find a design for a task <span aria-hidden="true">→</span>
          </Link>
          <Link to="/design" className={linkRow}>
            Pick from all nine <span aria-hidden="true">→</span>
          </Link>
        </nav>
      </section>
      {showPrinterPanel() && (
        <section className={section} aria-labelledby="side-printer">
          <h2 id="side-printer" className="text-[1.375rem]">
            Your printer
          </h2>
          <dl className="mt-2">
            <Row k="Strength numbers" v={activeNames.length ? 'Calibrated' : 'Published estimates'} />
            {activeNames.map((n) => (
              <Row key={n} k="Calibrated to" v={n} />
            ))}
          </dl>
          {!activeNames.length && (
            <p className="mt-1 text-base text-muted">
              Break three test bars to tune the numbers to your printer.
            </p>
          )}
          <Link to="/calibrate" className={`${linkRow} mt-1`}>
            Calibrate <span aria-hidden="true">→</span>
          </Link>
        </section>
      )}
      <section className={section} aria-labelledby="side-hand">
        <h2 id="side-hand" className="text-[1.375rem]">
          Your hand
        </h2>
        <dl className="mt-2">
          <Row k="Width across the knuckles" v={`${profile.handBreadth} mm`} />
          <Row k="Preferred hand" v={profile.hand === 'left' ? 'Left' : 'Right'} />
        </dl>
        <Link to="/settings" className={`${linkRow} mt-1`}>
          Change in Settings <span aria-hidden="true">→</span>
        </Link>
      </section>
      <section className={section} aria-labelledby="side-account">
        <h2 id="side-account" className="text-[1.375rem]">
          Your account
        </h2>
        <dl className="mt-2">
          <Row k="Signed in as" v={email} />
        </dl>
        <button
          type="button"
          disabled={!projects.length}
          onClick={() => void downloadAll(projects)}
          className={`${linkRow} mt-1 w-full text-left disabled:text-faint`}
        >
          Download all designs (.zip) <span aria-hidden="true">↓</span>
        </button>
        <button
          type="button"
          onClick={() => void signOut()}
          className="tap flex w-full items-center text-left font-semibold text-muted hover:text-text"
        >
          Sign out
        </button>
      </section>
    </aside>
  );
}
