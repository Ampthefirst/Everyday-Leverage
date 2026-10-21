import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FamilyId, Params } from '../families/types';
import type { MaterialId } from '../strength/materials';

/** A named, local-only profile: measurements, preferred hand, preferred material. Never sent anywhere. */
export interface Profile {
  id: string;
  name: string;
  handBreadth: number;
  hand: 'right' | 'left';
  material: MaterialId | null;
  designs: Partial<Record<FamilyId, Params>>;
  updatedAt: string;
}

export const DEFAULT_PROFILE: Profile = {
  id: 'default',
  name: 'Me',
  handBreadth: 85,
  hand: 'right',
  material: null,
  designs: {},
  updatedAt: '',
};

interface ProfilesState {
  profiles: Profile[];
  currentId: string | null;
  current(): Profile;
  save(p: Omit<Profile, 'id' | 'updatedAt'> & { id?: string }): string;
  update(id: string, patch: Partial<Profile>): void;
  remove(id: string): void;
  select(id: string | null): void;
}

const newId = () => Math.random().toString(36).slice(2, 10);

export const useProfiles = create<ProfilesState>()(
  persist(
    (set, get) => ({
      profiles: [],
      currentId: null,
      current() {
        const { profiles, currentId } = get();
        return profiles.find((p) => p.id === currentId) ?? DEFAULT_PROFILE;
      },
      save(p) {
        const id = p.id ?? newId();
        const prof: Profile = { ...p, id, updatedAt: new Date().toISOString() };
        set((s) => ({ profiles: [...s.profiles.filter((x) => x.id !== id), prof], currentId: id }));
        return id;
      },
      update(id, patch) {
        set((s) => ({
          profiles: s.profiles.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
          ),
        }));
      },
      remove(id) {
        set((s) => ({
          profiles: s.profiles.filter((p) => p.id !== id),
          currentId: s.currentId === id ? null : s.currentId,
        }));
      },
      select(currentId) {
        set({ currentId });
      },
    }),
    { name: 'el-profiles', version: 1 },
  ),
);
