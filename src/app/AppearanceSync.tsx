import { useEffect } from 'react';
import { useSettings } from '../state/settings';

/** Mirrors appearance settings onto <html> so CSS tokens can react. */
export function AppearanceSync() {
  const { theme, highContrast, textScale } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      root.classList.toggle('dark', dark);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) root.dataset.contrast = 'high';
    else delete root.dataset.contrast;
    root.dataset.text = textScale;
  }, [highContrast, textScale]);

  return null;
}
