import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePref = 'system' | 'light' | 'dark';
export type TextScale = '100' | '125' | '150';

interface SettingsState {
  theme: ThemePref;
  highContrast: boolean;
  textScale: TextScale;
  /** User override; when false we still honor the OS prefers-reduced-motion. */
  reduceMotion: boolean;
  /** Gemini features are off until the user opts in. */
  llmOptIn: boolean;
  /** Free text shown on the request-a-print sheet. */
  wherePrint: string;
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void;
}

export const DEFAULT_WHERE_PRINT = 'many schools, libraries and makerspaces';

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      highContrast: false,
      textScale: '100',
      reduceMotion: false,
      llmOptIn: false,
      wherePrint: DEFAULT_WHERE_PRINT,
      set: (patch) => set(patch),
    }),
    { name: 'el-settings', version: 1 },
  ),
);

export function prefersReducedMotion(): boolean {
  if (useSettings.getState().reduceMotion) return true;
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
