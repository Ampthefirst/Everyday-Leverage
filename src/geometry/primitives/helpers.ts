import type { CrossSection, Kernel, Manifold } from '../kernel';
import type { Vec3 } from '../../types/geom';

/** Rounded rectangle cross-section centred on the origin. */
export function roundedRect(K: Kernel, w: number, h: number, r: number): CrossSection {
  const rr = Math.max(0.01, Math.min(r, w / 2 - 0.01, h / 2 - 0.01));
  return K.CrossSection.square([w - 2 * rr, h - 2 * rr], true).offset(rr, 'Round');
}

/** Stadium (obround) of overall length L and width W, long axis on X. */
export function stadium(K: Kernel, L: number, W: number): CrossSection {
  const r = W / 2;
  return K.CrossSection.hull([
    K.CrossSection.circle(r).translate([-(L / 2 - r), 0]),
    K.CrossSection.circle(r).translate([L / 2 - r, 0]),
  ]);
}

/** Cylinder from a to b (any direction). */
export function rod(K: Kernel, a: Vec3, b: Vec3, r: number, r2 = r): Manifold {
  const d: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const L = Math.hypot(...d);
  const c = K.Manifold.cylinder(L, r, r2);
  const yaw = (Math.atan2(d[1], d[0]) * 180) / Math.PI;
  const pitch = (Math.acos(Math.max(-1, Math.min(1, d[2] / (L || 1)))) * 180) / Math.PI;
  return c.rotate([0, pitch, 0]).rotate([0, 0, yaw]).translate(a);
}

/** Capsule (rod with spherical ends). */
export function capsule(K: Kernel, a: Vec3, b: Vec3, r: number): Manifold {
  return K.Manifold.hull([K.Manifold.sphere(r).translate(a), K.Manifold.sphere(r).translate(b)]);
}

/** Ring of `count` grooves (tori approximated by revolved circles) around the Z axis. */
export function ringGroove(K: Kernel, R: number, depth: number, width: number, z: number): Manifold {
  const r = width / 2;
  const prof = K.CrossSection.circle(r, 16).translate([R + r - depth, 0]);
  return prof.revolve(48).translate([0, 0, z]);
}

/** Axial ridges (knurl/texture) on a cylinder of radius R about Z: returns ridges to union. */
export function axialRidges(
  K: Kernel,
  R: number,
  count: number,
  height: number,
  z0: number,
  length: number,
): Manifold {
  const ridges: Manifold[] = [];
  for (let i = 0; i < count; i++) {
    const a = (360 * i) / count;
    ridges.push(
      K.Manifold.cylinder(length, height, height, 8)
        .scale([1, 0.6, 1])
        .translate([R - height * 0.35, 0, z0])
        .rotate([0, 0, a]),
    );
  }
  return K.Manifold.union(ridges);
}

/** Countersunk screw hole along Z (head at top z = zTop). */
export function countersunkHole(K: Kernel, d: number, head: number, depth: number, zTop: number): Manifold {
  const shaft = K.Manifold.cylinder(depth + 2, d / 2, d / 2, 24).translate([0, 0, zTop - depth - 1]);
  const csk = K.Manifold.cylinder(head / 2, d / 2, head / 2 + 0.01, 32).translate([
    0,
    0,
    zTop - head / 2 + 0.01,
  ]);
  const relief = K.Manifold.cylinder(2, head / 2, head / 2, 32).translate([0, 0, zTop]);
  return K.Manifold.union([shaft, csk, relief]);
}

/** Slot for a hook-and-loop strap through a band (cutter along Y). */
export function strapSlot(K: Kernel, w: number, t: number, through: number): Manifold {
  return roundedRect(K, w, t, Math.min(1, t / 2))
    .extrude(through, 0, 0, [1, 1], true)
    .rotate([90, 0, 0]);
}

// ---------- stamp text: a tiny stroke font made of boxes ----------

const SEG: Record<string, string> = {
  // 7-segment: a b c d e f g
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abged',
  '3': 'abgcd',
  '4': 'fgbc',
  '5': 'afgcd',
  '6': 'afgedc',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
  A: 'abcefg',
  B: 'cdefg',
  C: 'adef',
  '-': 'g',
  L: 'def',
  R: 'eg',
};

/** Text stamp of height h in the XY plane (centred), extruded `depth` along Z from z=0. */
export function stampText(K: Kernel, text: string, h: number, depth: number): Manifold | null {
  const w = h * 0.55;
  // Strokes at least 0.8 mm wide (minimum printable feature).
  const s = Math.max(0.8, h * 0.18);
  const gap = h * 0.3;
  const boxes: CrossSection[] = [];
  const chars = text.toUpperCase().split('');
  const total = chars.length * w + (chars.length - 1) * gap;
  let x = -total / 2;
  for (const ch of chars) {
    const segs = SEG[ch] ?? '';
    const seg = (cx: number, cy: number, sw: number, sh: number) =>
      boxes.push(K.CrossSection.square([sw, sh], true).translate([x + cx, cy]));
    for (const c of segs) {
      if (c === 'a') seg(w / 2, h / 2 - s / 2, w, s);
      if (c === 'g') seg(w / 2, 0, w, s);
      if (c === 'd') seg(w / 2, -h / 2 + s / 2, w, s);
      if (c === 'b') seg(w - s / 2, h / 4, s, h / 2);
      if (c === 'c') seg(w - s / 2, -h / 4, s, h / 2);
      if (c === 'f') seg(s / 2, h / 4, s, h / 2);
      if (c === 'e') seg(s / 2, -h / 4, s, h / 2);
    }
    x += w + gap;
  }
  if (!boxes.length) return null;
  return K.CrossSection.union(boxes).extrude(depth);
}
