import { useEffect } from 'react';
import { useSettings } from '../state/settings';

/** Mirrors appearance settings onto <html> so CSS tokens can react. The site is dark-only. */
export function AppearanceSync() {
  const { highContrast, textScale, reduceMotion } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) root.dataset.contrast = 'high';
    else delete root.dataset.contrast;
    root.dataset.text = textScale;
    if (reduceMotion) root.dataset.motion = 'reduce';
    else delete root.dataset.motion;
  }, [highContrast, textScale, reduceMotion]);

  return null;
}
