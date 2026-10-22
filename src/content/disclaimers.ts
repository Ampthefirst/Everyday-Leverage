/**
 * Every standing disclaimer the site and its files show, in one place, including the strength badge.
 *
 * A temporary presentation build (VITE_PRESENTATION_MODE=1, deployed separately; see README) switches
 * all of them off. The normal site always shows them. Read the flag through showDisclaimers() so tests
 * can stub it.
 *
 * Not routed here on purpose: the task finder's out-of-scope screen ("this one needs a person") is product
 * behaviour, and the Gemini data notice is consent information.
 */
export function showDisclaimers(): boolean {
  return import.meta.env.VITE_PRESENTATION_MODE !== '1';
}

export const DISCLAIMERS = {
  footer: [
    'Everyday Leverage makes convenience aids. It is not a medical device and does not replace an occupational therapist or doctor.',
    'Printed plastic is not food-safe.',
    'Strength numbers are estimates.',
  ],
  foodSafe: 'Not food-safe: printed plastic is porous. Keep it from touching food.',
  notMedical: 'This is a convenience aid, not a medical device.',
  estimateCaveat: 'These are estimates from published material data, not tests on your printer.',
  modelNote: 'These are analytic estimates — not finite-element analysis and not test-verified.',
  sheetEstimate:
    'These numbers are analytic estimates from published material data — not tested on your printer and not finite-element analysis.',
  requestUncalibrated:
    'The strength estimate uses published material data, not tests on your printer. If you can, please use the material and number of walls listed above.',
  pdfFooter: 'Everyday Leverage — convenience aid, not a medical device. Not food-safe.',
  readme: 'Convenience aid — not a medical device. Not food-safe.',
  readmeUncalibrated: 'Strength: uncalibrated estimate from published material data.',
} as const;

export type DisclaimerKey = Exclude<keyof typeof DISCLAIMERS, 'footer'>;

/** A disclaimer's text, or null in presentation mode. */
export function disclaimer(key: DisclaimerKey): string | null {
  return showDisclaimers() ? DISCLAIMERS[key] : null;
}

/** The disclaimers among `keys` to show, in order (none in presentation mode). */
export function disclaimers(...keys: DisclaimerKey[]): string[] {
  return showDisclaimers() ? keys.map((k) => DISCLAIMERS[k]) : [];
}
