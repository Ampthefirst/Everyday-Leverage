/**
 * Build-time switches for optional parts of the interface, set per Vercel project (see README).
 * Read through functions so tests can stub them.
 */

/** The dashboard's "Your printer" panel (calibration status). On unless VITE_DASHBOARD_PRINTER=0. */
export function showPrinterPanel(): boolean {
  return import.meta.env.VITE_DASHBOARD_PRINTER !== '0';
}
