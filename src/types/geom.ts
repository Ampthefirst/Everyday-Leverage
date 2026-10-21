export type Vec3 = [number, number, number];
export type Vec2 = [number, number];

export const dot3 = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const sub3 = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const len3 = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
export const norm3 = (a: Vec3): Vec3 => {
  const l = len3(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

export interface BBox {
  min: Vec3;
  max: Vec3;
}

export const bboxSize = (b: BBox): Vec3 => [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]];
