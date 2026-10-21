import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Answers } from '../finder/router';
import { useSettings } from '../state/settings';
import { Button } from '../components/Button';
import { Note } from '../components/Card';
import { describe, llmAvailable, LLM_NOTICE, onAvailabilityChange } from './client';

/** Optional: describe the task in your own words; Gemini fills in the finder answers (opt-in, online only). */
export function DescribeBox({ onAnswers }: { onAnswers: (a: Answers) => void }) {
  const optIn = useSettings((s) => s.llmOptIn);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [, force] = useState(0);
  useEffect(() => {
    const off = onAvailabilityChange(() => force((n) => n + 1));
    const on = () => force((n) => n + 1);
    window.addEventListener('online', on);
    window.addEventListener('offline', on);
    return () => {
      off();
      window.removeEventListener('online', on);
      window.removeEventListener('offline', on);
    };
  }, []);
  if (!llmAvailable()) return null;
  if (!optIn) {
    return (
      <p className="mt-8 text-sm text-muted">
        Prefer to describe it in your own words? Turn on the optional Gemini feature in{' '}
        <Link to="/settings" className="text-primary underline">
          Display settings
        </Link>
        .
      </p>
    );
  }
  return (
    <section
      className="mt-8 space-y-2 rounded-2xl border border-border bg-surface p-4"
      aria-labelledby="describe-h"
    >
      <h2 id="describe-h" className="text-lg font-bold">
        Or describe it in your own words
      </h2>
      <label htmlFor="describe" className="block text-muted">
        For example: “I can't open pickle jars any more” — about the task, not about health.
      </label>
      <textarea
        id="describe"
        maxLength={500}
        rows={3}
        className="w-full rounded-lg border border-border bg-surface p-3"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <p className="text-xs text-muted">{LLM_NOTICE}</p>
      <Button
        disabled={busy || !text.trim()}
        onClick={async () => {
          setBusy(true);
          setMsg(null);
          const r = await describe(text);
          setBusy(false);
          if (!r) {
            setMsg("That didn't work — please use the questions instead.");
            return;
          }
          onAnswers(r.answers);
        }}
      >
        {busy ? 'Reading…' : 'Fill in the answers'}
      </Button>
      {msg && <Note tone="warn">{msg}</Note>}
    </section>
  );
}
