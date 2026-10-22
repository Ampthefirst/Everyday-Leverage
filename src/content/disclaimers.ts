/**
 * Every standing disclaimer the site shows, in one place. A temporary presentation build
 * (VITE_PRESENTATION_MODE=1, deployed separately) switches them off; the normal site always shows them.
 * Strength badges ("Uncalibrated estimate") are a separate engineering rule and are not routed here.
 */
export const SHOW_DISCLAIMERS = import.meta.env.VITE_PRESENTATION_MODE !== '1';

export const DISCLAIMERS = {
  footer: [
    'Everyday Leverage makes convenience aids. It is not a medical device and does not replace an occupational therapist or doctor.',
    'Printed plastic is not food-safe.',
    'Strength numbers are estimates.',
  ],
} as const;
