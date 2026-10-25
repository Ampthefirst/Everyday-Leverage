import { flushSync } from 'react-dom';
import { prefersReducedMotion } from '../state/settings';

/**
 * Runs a state change inside a View Transition, so elements with a `view-transition-name` glide to
 * their new place (the tab underline, dashboard rows). Browsers without View Transitions, and reduced
 * motion, get the change instantly.
 */
export function withTransition(change: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!doc.startViewTransition || prefersReducedMotion()) return change();
  doc.startViewTransition(() => flushSync(change));
}
