import { useEffect, useRef } from 'react';
import { useSettings } from '../state/settings';

/** True when a key press belongs to a text field rather than to a shortcut. */
export function isTyping(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

/**
 * Page-level single-key shortcuts (for example number keys for a numbered list). Respects the
 * Settings switch, and ignores keys while typing, with modifiers, or while a dialog is open.
 */
export function usePageKeys(handler: (key: string) => boolean | void, enabled = true) {
  const on = useSettings((s) => s.hotkeys) && enabled;
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    if (!on) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if (document.querySelector('dialog[open]')) return;
      if (ref.current(e.key)) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [on]);
}
