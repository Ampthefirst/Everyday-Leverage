import { z } from 'zod';
import type { Answers } from '../finder/router';
import { verifyNumbers } from './verify';
import type { ComputedFacts } from './facts';

export const LLM_NOTICE =
  "Your text is sent to Google's Gemini to interpret it. Nothing else leaves your browser.";
const TIMEOUT_MS = 30000;

/** Session-level availability: once the server says "unavailable" (no key) or the network fails, hide the features. */
let available: boolean | null = null;
let inFlight = false;
const listeners = new Set<() => void>();
export const llmAvailable = () =>
  available !== false && (typeof navigator === 'undefined' || navigator.onLine !== false);
export const onAvailabilityChange = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const setAvailable = (v: boolean) => {
  available = v;
  listeners.forEach((f) => f());
};

async function post<T>(path: string, body: unknown): Promise<T | null> {
  if (!llmAvailable() || inFlight) return null;
  inFlight = true;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (r.status === 503 || r.status === 404 || r.status === 405) {
      setAvailable(false);
      return null;
    }
    if (!r.ok) return null;
    setAvailable(true);
    return (await r.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
    inFlight = false;
  }
}

const DescribeResponse = z.object({ answers: z.record(z.string(), z.string()), outOfScope: z.boolean() });

/** Free text → task-finder answers. Returns null when unavailable or on any error. */
export async function describe(text: string): Promise<{ answers: Answers; outOfScope: boolean } | null> {
  const r = await post<unknown>('/api/describe', { text: text.slice(0, 500) });
  const parsed = DescribeResponse.safeParse(r);
  if (!parsed.success) return null;
  const answers = parsed.data.answers as Answers;
  if (parsed.data.outOfScope && !answers.problem && answers.task !== 'body') answers.problem = 'pain';
  return { answers, outOfScope: parsed.data.outOfScope };
}

/** Facts → friendlier wording, only if every number in the reply checks out. */
export async function explain(facts: ComputedFacts): Promise<string | null> {
  const r = await post<{ text?: unknown }>('/api/explain', { facts });
  if (!r || typeof r.text !== 'string') return null;
  return verifyNumbers(r.text, facts).ok ? r.text : null;
}
