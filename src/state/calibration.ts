import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CalibrationProfile } from '../strength/calibration';
import type { MaterialId } from '../strength/materials';

interface CalibrationState {
  profiles: CalibrationProfile[];
  /** Active profile per material (index into profiles by printer+material key). */
  active: Partial<Record<MaterialId, string>>;
  add(p: CalibrationProfile): void;
  remove(key: string): void;
  activate(material: MaterialId, key: string | null): void;
  activeFor(material: MaterialId): CalibrationProfile | null;
}

export const profileKey = (p: Pick<CalibrationProfile, 'printerName' | 'material'>) =>
  `${p.printerName}::${p.material}`;

export const useCalibration = create<CalibrationState>()(
  persist(
    (set, get) => ({
      profiles: [],
      active: {},
      add(p) {
        const key = profileKey(p);
        set((s) => ({
          profiles: [...s.profiles.filter((x) => profileKey(x) !== key), p],
          active: { ...s.active, [p.material]: key },
        }));
      },
      remove(key) {
        set((s) => {
          const active = { ...s.active };
          for (const m of Object.keys(active) as MaterialId[]) if (active[m] === key) delete active[m];
          return { profiles: s.profiles.filter((x) => profileKey(x) !== key), active };
        });
      },
      activate(material, key) {
        set((s) => ({ active: { ...s.active, [material]: key ?? undefined } }));
      },
      activeFor(material) {
        const key = get().active[material];
        return get().profiles.find((p) => profileKey(p) === key) ?? null;
      },
    }),
    { name: 'el-calibration', version: 1 },
  ),
);
