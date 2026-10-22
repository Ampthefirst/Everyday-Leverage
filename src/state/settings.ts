import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Kept for stored-settings compatibility; the site is dark-only since v2. */
export type ThemePref = 'system' | 'light' | 'dark';
export type TextScale = '100' | '125' | '150';

interface SettingsState {
  theme: ThemePref;
  highContrast: boolean;
  textScale: TextScale;
  /** User override; when false we still honor the OS prefers-reduced-motion. */
  reduceMotion: boolean;
  /** Single-letter shortcuts (H, F, P, M). WCAG 2.1.4: users can turn them off. */
  hotkeys: boolean;
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
      hotkeys: true,
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
