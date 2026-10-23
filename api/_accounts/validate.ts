import type { StoredProject } from './types.js';

export const MAX_PROJECTS = 200;
const FAMILIES = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];
const STEPS = ['brief', 'measure', 'check', 'print'];
const ID = /^[a-z0-9_-]{1,40}$/i;
const KEY = /^[a-z][a-z0-9_]{0,39}$/i;

export function normEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const e = raw.trim().toLowerCase();
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

/** 8 to 128 characters; anything else is the person's choice. */
export function okPassword(raw: unknown): raw is string {
  return typeof raw === 'string' && raw.length >= 8 && raw.length <= 128;
}

/**
 * Copies only the known shelf fields, checked, so nothing else (finder answers, notes, health) can be stored
 * through this endpoint even if a client sends it.
 */
export function cleanProject(raw: unknown): StoredProject | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !ID.test(r.id)) return null;
  if (typeof r.name !== 'string' || !r.name.trim() || r.name.length > 80) return null;
  if (typeof r.familyId !== 'string' || !FAMILIES.includes(r.familyId)) return null;
  if (typeof r.step !== 'string' || !STEPS.includes(r.step)) return null;
  if (typeof r.updatedAt !== 'string' || Number.isNaN(Date.parse(r.updatedAt))) return null;
  if (r.presetId !== undefined && (typeof r.presetId !== 'string' || !ID.test(r.presetId))) return null;
  if (!r.params || typeof r.params !== 'object' || Array.isArray(r.params)) return null;
  const entries = Object.entries(r.params as Record<string, unknown>);
  if (entries.length > 64) return null;
  const params: StoredProject['params'] = {};
  for (const [k, v] of entries) {
    if (!KEY.test(k)) return null;
    if (
      typeof v === 'number'
        ? !Number.isFinite(v)
        : typeof v === 'string'
          ? v.length > 40
          : typeof v !== 'boolean'
    )
      return null;
    params[k] = v as number | string | boolean;
  }
  return {
    id: r.id,
    name: r.name.trim(),
    familyId: r.familyId,
    params,
    ...(r.presetId ? { presetId: r.presetId as string } : {}),
    step: r.step as StoredProject['step'],
    updatedAt: new Date(r.updatedAt).toISOString(),
  };
}
