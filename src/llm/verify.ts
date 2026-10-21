import type { ComputedFacts } from './facts';

/** Unit families and their conversion to the internal base (mm, N, N·mm, MPa, fraction). */
const UNIT: Record<string, { base: string; k: number }> = {
  mm: { base: 'mm', k: 1 },
  cm: { base: 'mm', k: 10 },
  m: { base: 'mm', k: 1000 },
  n: { base: 'N', k: 1 },
  newton: { base: 'N', k: 1 },
  newtons: { base: 'N', k: 1 },
  kn: { base: 'N', k: 1000 },
  'n·m': { base: 'Nmm', k: 1000 },
  'n·mm': { base: 'Nmm', k: 1 },
  nm: { base: 'Nmm', k: 1000 },
  nmm: { base: 'Nmm', k: 1 },
  'newton-metres': { base: 'Nmm', k: 1000 },
  'newton-meters': { base: 'Nmm', k: 1000 },
  'newton metres': { base: 'Nmm', k: 1000 },
  'newton meters': { base: 'Nmm', k: 1000 },
  mpa: { base: 'MPa', k: 1 },
  '%': { base: 'frac', k: 0.01 },
  percent: { base: 'frac', k: 0.01 },
  '°c': { base: 'C', k: 1 },
};

export interface Quantity {
  value: number;
  base: string | null;
}

const NUM =
  /(-?\d+(?:[.,]\d+)?)\s*(n·mm|nmm|n·m|n\.m|n-m|newton[- ]?met(?:er|re)s?|newtons?|nm|kn|mpa|mm|cm|m\b|n\b|%|percent|°c)?/gi;

/** Pull numbers (with units, when given) out of free text. Words like "two" are ignored. */
export function extractQuantities(text: string): Quantity[] {
  const out: Quantity[] = [];
  for (const m of text.matchAll(NUM)) {
    const value = Number(m[1].replace(',', '.'));
    if (!Number.isFinite(value)) continue;
    const raw = (m[2] ?? '')
      .toLowerCase()
      .replace('n.m', 'n·m')
      .replace('n-m', 'n·m')
      .replace(/newton[- ]?met(er|re)s?/, 'newton metres');
    const u = raw ? UNIT[raw] : undefined;
    out.push({ value: Math.round((u ? value * u.k : value) * 1e9) / 1e9, base: u ? u.base : null });
  }
  return out;
}

/** The facts as base-unit quantities, plus their plain values (for unitless mentions). */
export function factQuantities(f: ComputedFacts): Quantity[] {
  const loadUnit = UNIT[f.load.unit.toLowerCase()];
  return [
    { value: f.utilizationPercent / 100, base: 'frac' },
    { value: f.utilizationPercent, base: null },
    { value: f.load.value * (loadUnit?.k ?? 1), base: loadUnit?.base ?? null },
    { value: f.load.value, base: null },
    { value: f.safetyFactor, base: null },
  ];
}

const close = (a: number, b: number) =>
  a === 0 || b === 0 ? Math.abs(a - b) < 1e-9 : Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b)) <= 0.01;

/**
 * Every number in the reply must match a fact: unit-aware (N·m ↔ N·mm, cm ↔ mm, % ↔ fraction) with a
 * 1% relative tolerance for rounding. Unitless numbers must equal a fact's value directly.
 */
export function verifyNumbers(reply: string, f: ComputedFacts): { ok: boolean; bad: number[] } {
  const facts = factQuantities(f);
  const bad: number[] = [];
  for (const q of extractQuantities(reply)) {
    const ok = q.base
      ? facts.some((x) => x.base === q.base && close(x.value, q.value))
      : facts.some((x) => close(x.value, q.value));
    if (!ok) bad.push(q.value);
  }
  return { ok: bad.length === 0, bad };
}
