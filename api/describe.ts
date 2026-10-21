/**
 * POST /api/describe — free text → structured task-finder answers (Gemini, JSON schema).
 * The decision tree in the app still makes the routing decision; this only fills in answers.
 * Server hygiene: key only in GEMINI_API_KEY, same-origin check, body cap, short timeout, no logging of text.
 * Self-contained on purpose (no imports from /src) so the Vercel function bundles cleanly.
 */
import { GoogleGenAI } from '@google/genai';

export const ALLOWED = {
  task: ['open', 'hold', 'turn', 'pull', 'press', 'reach', 'body'],
  object: [
    'jar',
    'bottle',
    'utensil',
    'pen',
    'toothbrush',
    'tool',
    'key',
    'knob',
    'tap',
    'stove',
    'drawer',
    'door',
    'zipper',
    'can',
    'button',
    'screen',
    'other',
  ],
  problem: ['grip', 'noHold', 'turn', 'pull', 'reach', 'slip', 'press', 'pain'],
  hand: ['right', 'left', 'either'],
  force: ['light', 'moderate', 'heavy'],
  location: ['kitchen', 'bathroom', 'desk', 'outdoors', 'car', 'other'],
  who: ['me', 'other'],
} as const;

const MAX_TEXT = 500;
const MAX_BODY = 2048;
const TIMEOUT_MS = 9000;

const SYSTEM = `You map a short description of an everyday task that someone finds hard into structured answers for a task finder.
Rules:
- Use only the allowed enum values. Leave a field out if the text does not say or clearly imply it.
- Ask about tasks and motions only. Never infer, guess or mention any medical condition or diagnosis.
- If the text mentions pain, injury, surgery recovery, a medical device, or supporting body weight (standing up, walking, transfers), set outOfScope to true and problem to "pain" (or task to "body" for body support).
- "for my mum", "my dad", "a client" etc. means who = "other".`;

const SCHEMA = {
  type: 'object',
  properties: {
    ...Object.fromEntries(Object.entries(ALLOWED).map(([k, v]) => [k, { type: 'string', enum: [...v] }])),
    outOfScope: { type: 'boolean' },
  },
  required: ['outOfScope'],
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

/** Status and a short SDK message for diagnosis — never the user's text or the key. */
function errorDetail(e: unknown, key: string): string {
  const err = e as { status?: number; name?: string; message?: string };
  const msg = (err.message ?? String(e)).split(key).join('***').replace(/\s+/g, ' ').slice(0, 200);
  return `${err.status ?? err.name ?? 'error'}: ${msg}`;
}

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!origin || !host) return req.headers.get('sec-fetch-site') === 'same-origin';
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: Request): Promise<Response> {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!key || !model) return json(503, { error: 'unavailable' });
  if (!sameOrigin(req)) return json(403, { error: 'forbidden' });
  const len = Number(req.headers.get('content-length') ?? '0');
  if (len > MAX_BODY) return json(413, { error: 'too large' });
  let text: unknown;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY) return json(413, { error: 'too large' });
    text = (JSON.parse(raw) as { text?: unknown }).text;
  } catch {
    return json(400, { error: 'bad request' });
  }
  if (typeof text !== 'string' || !text.trim() || text.length > MAX_TEXT)
    return json(400, { error: `text must be 1–${MAX_TEXT} characters` });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const r = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text }] }],
      config: {
        systemInstruction: SYSTEM,
        responseMimeType: 'application/json',
        responseJsonSchema: SCHEMA,
        temperature: 0,
        abortSignal: ctrl.signal,
        maxOutputTokens: 300,
      },
    });
    const parsed = JSON.parse(r.text ?? '{}') as Record<string, unknown>;
    // Keep only allowed values.
    const answers: Record<string, string> = {};
    for (const [k, vals] of Object.entries(ALLOWED)) {
      const v = parsed[k];
      if (typeof v === 'string' && (vals as readonly string[]).includes(v)) answers[k] = v;
    }
    return json(200, { answers, outOfScope: parsed.outOfScope === true });
  } catch (e) {
    return json(502, { error: 'model error', detail: errorDetail(e, key) });
  } finally {
    clearTimeout(timer);
  }
}
