import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FamilyId, Params } from '../families/types';
import { getFamily } from '../families';

/** Brief → Measure → Check → Print: where a design is in its journey. */
export type StepId = 'brief' | 'measure' | 'check' | 'print';
export const STEPS: { id: StepId; label: string }[] = [
  { id: 'brief', label: 'Brief' },
  { id: 'measure', label: 'Measure' },
  { id: 'check', label: 'Check' },
  { id: 'print', label: 'Print' },
];

/**
 * A saved design on this device's shelf. Holds only the design, its sizes and where the user stopped:
 * never task-finder answers or anything about health. Stored in this browser only.
 */
export interface Project {
  id: string;
  name: string;
  familyId: FamilyId;
  params: Params;
  presetId?: string;
  step: StepId;
  updatedAt: string;
}

interface ProjectsState {
  projects: Project[];
  /** The project open in the designer; its sizes and step save automatically. */
  activeId: string | null;
  save(p: { familyId: FamilyId; params: Params; presetId?: string; step: StepId }): string;
  update(id: string, patch: Partial<Omit<Project, 'id'>>): void;
  rename(id: string, name: string): void;
  duplicate(id: string): string | null;
  remove(id: string): void;
  setActive(id: string | null): void;
}

const newId = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

/** "Lid and jar opener · Bottle caps", numbered when that name is already on the shelf. */
export function autoName(familyId: FamilyId, presetId: string | undefined, taken: string[]): string {
  const fam = getFamily(familyId);
  const preset = fam?.presets.find((p) => p.id === presetId);
  const base = `${fam?.name ?? familyId}${preset ? ` · ${preset.label}` : ''}`;
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base} (${n})`)) n++;
  return `${base} (${n})`;
}

export const useProjects = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeId: null,
      save(p) {
        const id = newId();
        const name = autoName(
          p.familyId,
          p.presetId,
          get().projects.map((x) => x.name),
        );
        set((s) => ({ projects: [{ id, name, ...p, updatedAt: now() }, ...s.projects], activeId: id }));
        return id;
      },
      update(id, patch) {
        set((s) => ({
          projects: s.projects.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: now() } : x)),
        }));
      },
      rename(id, name) {
        const n = name.trim();
        if (n) get().update(id, { name: n.slice(0, 80) });
      },
      duplicate(id) {
        const src = get().projects.find((x) => x.id === id);
        if (!src) return null;
        const copy: Project = {
          ...src,
          id: newId(),
          name: `${src.name} (copy)`.slice(0, 80),
          updatedAt: now(),
        };
        set((s) => ({ projects: [copy, ...s.projects] }));
        return copy.id;
      },
      remove(id) {
        set((s) => ({
          projects: s.projects.filter((x) => x.id !== id),
          activeId: s.activeId === id ? null : s.activeId,
        }));
      },
      setActive(id) {
        set({ activeId: id });
      },
    }),
    { name: 'el-projects', version: 1 },
  ),
);

/**
 * A saved design's full sizes. Saved copies can lack sizes a newer version added, or come back from an
 * account partly filled, so readers fill gaps from the design's defaults and repair before using them.
 */
export function savedParams(p: Pick<Project, 'familyId' | 'params'>): Params {
  const f = getFamily(p.familyId);
  return f ? f.repair({ ...f.defaults, ...p.params } as Params) : p.params;
}

/** Most recently updated first. */
export const sortedProjects = (ps: Project[]) =>
  [...ps].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
