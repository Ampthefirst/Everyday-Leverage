/**
 * Internal units: mm, N, N·mm, MPa (= N/mm²). Torque is displayed in N·m.
 * Keep every conversion here so there is one place to check.
 */
export const NMM_PER_NM = 1000;
export const PT_PER_MM = 72 / 25.4;

export const nmToNmm = (nm: number) => nm * NMM_PER_NM;
export const nmmToNm = (nmm: number) => nmm / NMM_PER_NM;
export const mmToPt = (mm: number) => mm * PT_PER_MM;

/** Round for display without trailing zeros. */
export function fmt(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return '—';
  const s = n.toFixed(digits);
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}
