import { LinkButton } from './Button';
import { Note } from './Card';

/** Shown instead of a design when the need is medical or load-bearing for the body. */
export function OutOfScope({ reason, other }: { reason: 'pain' | 'body'; other?: boolean }) {
  const who = other ? 'they' : 'you';
  return (
    <div className="space-y-4">
      <Note tone="warn">
        <p className="text-lg font-semibold">This one needs a person, not an app.</p>
        <p className="mt-2">
          Everyday Leverage makes convenience aids for everyday tasks.{' '}
          {reason === 'pain'
            ? `When ${who} feel pain or have an injury`
            : 'For anything that supports body weight — standing, walking, transfers, lifting'}
          , an occupational therapist (OT) or a doctor is the right person to help. They can check what is
          going on and suggest aids that are safe for {other ? 'them' : 'you'}.
        </p>
      </Note>
      <p>No design has been made, and nothing you answered has been saved.</p>
      <div className="flex flex-wrap gap-2">
        <LinkButton to="/" variant="secondary">
          Back to the start
        </LinkButton>
        <LinkButton to="/limits" variant="ghost">
          What this app is and is not
        </LinkButton>
      </div>
    </div>
  );
}
