/**
 * POST /api/explain — computed strength facts → friendlier wording (Gemini).
 * The client verifies every number in the reply against the facts and falls back to template text.
 * Self-contained on purpose (no imports from /src) so the Vercel function bundles cleanly.
 */
import { GoogleGenAI } from '@google/genai';

const MAX_BODY = 4096;
const TIMEOUT_MS = 9000;

const SYSTEM = `You rewrite a strength check for a 3D-printed everyday aid into 2–3 short, friendly sentences for a non-technical reader.
Rules:
- Use ONLY the facts given. Do not add any new numbers, comparisons, percentages or claims.
- When you mention a number, copy it exactly with the same unit as in the facts.
- Do not mention medical conditions. Do not promise it will not break.
- If calibrated is false, say briefly that it is an estimate.`;

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

/** Accept friendly forms of the model name: "Gemini 2.5 Flash", "models/gemini-2.5-flash", quoted values. */
export function normalizeModel(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const m = raw
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/^models\//, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
  return m || undefined;
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
  const model = normalizeModel(process.env.GEMINI_MODEL);
  if (!key || !model) return json(503, { error: 'unavailable' });
  if (!sameOrigin(req)) return json(403, { error: 'forbidden' });
  const len = Number(req.headers.get('content-length') ?? '0');
  if (len > MAX_BODY) return json(413, { error: 'too large' });
  let facts: unknown;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY) return json(413, { error: 'too large' });
    facts = (JSON.parse(raw) as { facts?: unknown }).facts;
  } catch {
    return json(400, { error: 'bad request' });
  }
  if (!facts || typeof facts !== 'object') return json(400, { error: 'facts required' });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const r = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: `Facts (JSON):\n${JSON.stringify(facts)}` }] }],
      config: { systemInstruction: SYSTEM, temperature: 0.3, abortSignal: ctrl.signal, maxOutputTokens: 220 },
    });
    const text = (r.text ?? '').trim();
    if (!text) return json(502, { error: 'empty' });
    return json(200, { text: text.slice(0, 1200) });
  } catch (e) {
    return json(502, { error: 'model error', model, detail: errorDetail(e, key) });
  } finally {
    clearTimeout(timer);
  }
}
