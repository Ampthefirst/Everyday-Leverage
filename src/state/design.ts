import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FamilyId, Params, UseContext } from '../families/types';
import { getFamily } from '../families';
import { coerceParams } from '../families/schema';
import { useProfiles } from './profiles';
import type { PrintSettings } from '../strength/types';

export interface ViewState {
  ghost: boolean;
  heat: boolean;
  section: boolean;
  /** 0–1 along the section axis. */
  sectionPos: number;
  mirror: boolean;
}

interface DesignState {
  params: Partial<Record<FamilyId, Params>>;
  use: UseContext;
  /** null = follow the recommended settings for the family and location. */
  print: PrintSettings | null;
  safetyFactor: number;
  orientation: string; // 'auto' or a candidate id
  view: ViewState;
  /** Which preset/variant was last applied, per family (for highlighting). */
  presetId: Partial<Record<FamilyId, string>>;
  variantId: Partial<Record<FamilyId, string>>;

  getParams(id: FamilyId): Params;
  setParam(id: FamilyId, key: string, value: number | string | boolean): void;
  setParams(id: FamilyId, params: Params, source?: { preset?: string; variant?: string }): void;
  reset(id: FamilyId): void;
  setUse(patch: Partial<UseContext>): void;
  setPrint(p: PrintSettings | null): void;
  setSafetyFactor(sf: number): void;
  setOrientation(o: string): void;
  setView(patch: Partial<ViewState>): void;
}

export const useDesign = create<DesignState>()(
  persist(
    (set, get) => ({
      params: {},
      use: { level: 'moderate', location: 'kitchen' },
      print: null,
      safetyFactor: 2,
      orientation: 'auto',
      view: { ghost: true, heat: false, section: false, sectionPos: 0.5, mirror: false },
      presetId: {},
      variantId: {},

      getParams(id) {
        const fam = getFamily(id)!;
        const stored = get().params[id];
        if (stored) return coerceParams(fam.fields, stored);
        // First visit: start from the profile's saved sizes or preferred hand, if any.
        const prof = useProfiles.getState().current();
        const saved = prof.designs[id];
        if (saved) return coerceParams(fam.fields, saved);
        if (fam.fields.some((f) => f.key === 'hand')) return { ...fam.defaults, hand: prof.hand };
        return fam.defaults;
      },
      setParam(id, key, value) {
        const fam = getFamily(id)!;
        const next = fam.repair({ ...get().getParams(id), [key]: value }, key);
        set((s) => ({ params: { ...s.params, [id]: next }, presetId: { ...s.presetId, [id]: undefined } }));
      },
      setParams(id, params, source) {
        const fam = getFamily(id)!;
        const next = fam.repair(coerceParams(fam.fields, params));
        set((s) => ({
          params: { ...s.params, [id]: next },
          presetId: { ...s.presetId, [id]: source?.preset },
          variantId: source?.variant ? { ...s.variantId, [id]: source.variant } : s.variantId,
        }));
      },
      reset(id) {
        set((s) => ({
          params: { ...s.params, [id]: undefined },
          presetId: { ...s.presetId, [id]: undefined },
          variantId: { ...s.variantId, [id]: undefined },
        }));
      },
      setUse: (patch) => set((s) => ({ use: { ...s.use, ...patch } })),
      setPrint: (print) => set({ print }),
      setSafetyFactor: (safetyFactor) => set({ safetyFactor: Math.min(4, Math.max(1.2, safetyFactor)) }),
      setOrientation: (orientation) => set({ orientation }),
      setView: (patch) => set((s) => ({ view: { ...s.view, ...patch } })),
    }),
    {
      name: 'el-design',
      version: 1,
      partialize: (s) => ({
        params: s.params,
        use: { level: s.use.level, location: s.use.location },
        print: s.print,
        safetyFactor: s.safetyFactor,
        view: s.view,
      }),
    },
  ),
);
