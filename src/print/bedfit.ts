import type { Vec3 } from '../types/geom';

/** Target printer: 256 × 256 × 256 mm bed, with a margin for brims and skirts. */
export const BED = { x: 256, y: 256, z: 256, margin: 5 } as const;

export interface BedFit {
  fits: boolean;
  placement: 'axis' | 'diagonal' | 'none';
  /** Footprint after placement (mm). */
  footprint: [number, number];
  note: string;
}

/** Axis-aligned size of a box after rotating it by Euler XYZ degrees (exact for 90° steps). */
export function rotatedSize(size: Vec3, rotDeg: Vec3): Vec3 {
  const [rx, ry, rz] = rotDeg.map((d) => (d * Math.PI) / 180);
  const cx = Math.cos(rx),
    sx = Math.sin(rx),
    cy = Math.cos(ry),
    sy = Math.sin(ry),
    cz = Math.cos(rz),
    sz = Math.sin(rz);
  // R = Rz · Ry · Rx (three.js 'XYZ' order applies X first)
  const R = [
    [cy * cz, sx * sy * cz - cx * sz, cx * sy * cz + sx * sz],
    [cy * sz, sx * sy * sz + cx * cz, cx * sy * sz - sx * cz],
    [-sy, sx * cy, cx * cy],
  ];
  return [0, 1, 2].map(
    (i) => Math.abs(R[i][0]) * size[0] + Math.abs(R[i][1]) * size[1] + Math.abs(R[i][2]) * size[2],
  ) as Vec3;
}

export function checkBedFit(printSize: Vec3): BedFit {
  const lim = BED.x - 2 * BED.margin;
  const [a, b] = [Math.max(printSize[0], printSize[1]), Math.min(printSize[0], printSize[1])];
  if (printSize[2] > BED.z)
    return {
      fits: false,
      placement: 'none',
      footprint: [a, b],
      note: `Too tall: ${Math.round(printSize[2])} mm (max ${BED.z} mm).`,
    };
  if (a <= lim && b <= lim)
    return { fits: true, placement: 'axis', footprint: [a, b], note: 'Fits the bed square-on.' };
  const diag = (a + b) / Math.SQRT2;
  if (diag <= lim)
    return {
      fits: true,
      placement: 'diagonal',
      footprint: [a, b],
      note: 'Fits when placed diagonally (45°) on the bed.',
    };
  return {
    fits: false,
    placement: 'none',
    footprint: [a, b],
    note: `Too long for the bed: ${Math.round(a)} mm (about ${Math.round(lim * Math.SQRT2 - b)} mm fits diagonally).`,
  };
}

/** Longest part of width w (mm) that fits the bed, square-on or diagonally. */
export function maxPartLength(w: number): number {
  const lim = BED.x - 2 * BED.margin;
  if (w > lim) return 0;
  return Math.max(lim, Math.floor(lim * Math.SQRT2 - w));
}
