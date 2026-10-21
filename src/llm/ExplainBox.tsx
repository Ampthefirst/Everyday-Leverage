import { useEffect, useState } from 'react';
import { useSettings } from '../state/settings';
import { Button } from '../components/Button';
import { explain, llmAvailable } from './client';
import { templateExplanation, type ComputedFacts } from './facts';

/** Plain-words summary of the strength check. Uses Gemini only when opted in, and only if its numbers check out. */
export function ExplainBox({ facts }: { facts: ComputedFacts }) {
  const optIn = useSettings((s) => s.llmOptIn);
  const key = JSON.stringify(facts);
  const [friendly, setFriendly] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    setFriendly(null);
    setNote(null);
  }, [key]);
  const text = friendly ?? templateExplanation(facts);
  return (
    <div className="space-y-2">
      <p className="text-lg" aria-live="polite">
        {text}
      </p>
      {optIn && llmAvailable() && !friendly && (
        <Button
          variant="ghost"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const r = await explain(facts);
            setBusy(false);
            if (r) setFriendly(r);
            else setNote('Kept the standard wording (the friendlier version could not be checked).');
          }}
        >
          {busy ? 'Rewording…' : 'Say it more simply (Gemini)'}
        </Button>
      )}
      {friendly && (
        <p className="text-xs text-muted">
          Reworded by Gemini; every number was checked against the calculation.
        </p>
      )}
      {note && <p className="text-xs text-muted">{note}</p>}
    </div>
  );
}
