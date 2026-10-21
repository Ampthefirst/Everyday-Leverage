import { describe, expect, it } from 'vitest';
import { extractQuantities, verifyNumbers } from '../../src/llm/verify';
import { templateExplanation, type ComputedFacts } from '../../src/llm/facts';
import { QUESTIONS } from '../../src/finder/router';
import { ALLOWED, POST as describePost } from '../../api/describe';
import { POST as explainPost } from '../../api/explain';

const facts: ComputedFacts = {
  design: 'Lid and jar opener',
  verdict: 'Comfortable',
  utilizationPercent: 35,
  where: 'where the lever meets the cup',
  check: 'bending',
  load: { label: 'Twisting a jar lid', value: 4, unit: 'N·m', assumed: true },
  safetyFactor: 2,
  material: 'PETG',
  calibrated: false,
  fix: 'Make the lever thicker.',
  acrossLayers: false,
};

describe('number verification', () => {
  it('extracts numbers with units', () => {
    const q = extractQuantities('It uses 35% at 4 N·m, or 4000 N·mm, about 12 cm.');
    expect(q).toEqual([
      { value: 0.35, base: 'frac' },
      { value: 4000, base: 'Nmm' },
      { value: 4000, base: 'Nmm' },
      { value: 120, base: 'mm' },
    ]);
  });
  it('accepts the same facts in other units and with rounding', () => {
    expect(
      verifyNumbers('About 35% of its budget when twisting at 4 N·m (4000 N·mm), safety factor 2.', facts).ok,
    ).toBe(true);
    expect(verifyNumbers('Roughly 35 percent, with a 4 Nm twist.', facts).ok).toBe(true);
  });
  it('rejects numbers that are not in the facts', () => {
    const r = verifyNumbers('It uses 50% of its strength at 4 N·m.', facts);
    expect(r.ok).toBe(false);
    expect(r.bad).toEqual([0.5]);
    expect(verifyNumbers('It can take 10 N·m.', facts).ok).toBe(false);
    expect(verifyNumbers('It is 3 times stronger than needed.', facts).ok).toBe(false);
  });
  it('the template explanation always passes its own check', () => {
    for (const verdict of ['Comfortable', 'Marginal', 'Likely to fail']) {
      const f = { ...facts, verdict };
      expect(verifyNumbers(templateExplanation(f), f).ok).toBe(true);
    }
  });
});

describe('/api/describe allowed values match the decision tree', () => {
  it('every question and value is the same', () => {
    for (const q of QUESTIONS) {
      expect(ALLOWED[q.id as keyof typeof ALLOWED], q.id).toEqual(q.options.map((o) => o.value));
    }
  });
});

describe('/api functions (no network paths)', () => {
  const req = (body: string, headers: Record<string, string> = {}) =>
    new Request('https://app.example/api/describe', {
      method: 'POST',
      body,
      headers: {
        host: 'app.example',
        origin: 'https://app.example',
        'content-type': 'application/json',
        ...headers,
      },
    });

  it('503 when no key is configured (features hide gracefully)', async () => {
    delete process.env.GEMINI_API_KEY;
    expect((await describePost(req('{"text":"jars"}'))).status).toBe(503);
    expect((await explainPost(req('{"facts":{}}'))).status).toBe(503);
  });
  it('rejects cross-origin, oversize and bad bodies', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.GEMINI_MODEL = 'test-model';
    expect((await describePost(req('{"text":"jars"}', { origin: 'https://evil.example' }))).status).toBe(403);
    expect((await describePost(req(JSON.stringify({ text: 'x'.repeat(3000) })))).status).toBe(413);
    expect((await describePost(req(JSON.stringify({ text: 'x'.repeat(600) })))).status).toBe(400);
    expect((await describePost(req('not json'))).status).toBe(400);
    expect((await explainPost(req('{"nope":1}'))).status).toBe(400);
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
  });
});

import { normalizeModel } from '../../api/describe';
describe('model name normalisation', () => {
  it('accepts friendly forms', () => {
    expect(normalizeModel('Gemini 2.5 Flash')).toBe('gemini-2.5-flash');
    expect(normalizeModel(' "models/gemini-2.5-flash" ')).toBe('gemini-2.5-flash');
    expect(normalizeModel('gemini-2.5-flash')).toBe('gemini-2.5-flash');
    expect(normalizeModel('')).toBeUndefined();
  });
});
