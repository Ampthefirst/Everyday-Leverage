import type { Kernel, Manifold } from '../kernel';
import type { C2P } from '../../families/c2';
import { c2TipD, C2_GRIP_L } from '../../families/c2';
import { stampText } from '../primitives';

/** Axis along +X; a flat on the bottom (z = −r + 1) so it prints lying down. */
export function buildC2(K: Kernel, p: C2P): Manifold {
  const { Manifold } = K;
  const gr = p.gripD / 2;
  const sr = p.shaftD / 2;
  const x = (m: Manifold) => m.rotate([0, 90, 0]);
  // Handle: a fat cylinder with rounded ends and finger rings.
  let grip = x(Manifold.cylinder(C2_GRIP_L - gr, gr, gr, 64)).translate([gr / 2, 0, 0]);
  grip = grip.add(
    Manifold.sphere(gr, 64)
      .scale([0.5, 1, 1])
      .translate([gr / 2, 0, 0]),
  );
  grip = grip.add(x(Manifold.cylinder(gr, gr, sr * 1.15, 64)).translate([C2_GRIP_L - gr / 2 - 0.5, 0, 0]));
  for (let i = 1; i <= 3; i++)
    grip = grip.subtract(
      Manifold.cylinder(6, gr + 2, gr + 2, 64)
        .subtract(Manifold.cylinder(6, gr - 1.2, gr - 1.2, 64))
        .rotate([0, 90, 0])
        .translate([gr / 2 + i * 13, 0, 0]),
    );
  // Shaft (+ optional bend).
  const tipLen = p.tip === 'cup' ? p.pressDepth + 3 : 6;
  let shaft: Manifold;
  if (p.mode === 'lever') {
    const a = p.bend;
    const L1 = p.reach * 0.35;
    const L2 = p.reach - L1;
    const s1 = x(Manifold.cylinder(L1 + 1, sr, sr, 48)).translate([C2_GRIP_L - 1, 0, 0]);
    const joint = Manifold.sphere(sr, 48).translate([C2_GRIP_L + L1, 0, 0]);
    const s2 = x(Manifold.cylinder(L2 + tipLen, sr, sr, 48))
      .rotate([0, -a, 0])
      .translate([C2_GRIP_L + L1, 0, 0]);
    shaft = Manifold.union([s1, joint, s2]);
    const tip = tipShape(K, p)
      .rotate([0, -a, 0])
      .translate([C2_GRIP_L + L1, 0, 0])
      .translate([
        Math.cos((a * Math.PI) / 180) * (L2 + tipLen),
        0,
        Math.sin((a * Math.PI) / 180) * (L2 + tipLen),
      ]);
    shaft = shaft.add(tip);
  } else {
    shaft = x(Manifold.cylinder(p.reach + 1, sr, sr, 48)).translate([C2_GRIP_L - 1, 0, 0]);
    shaft = shaft.add(tipShape(K, p).translate([C2_GRIP_L + p.reach, 0, 0]));
  }
  let part = grip.add(shaft);
  // Print flat: trim a 1 mm flat along the bottom of the handle.
  const zFlat = -Math.min(sr, gr) + 0.8;
  part = part.trimByPlane([0, 0, 1], zFlat);
  // Stamp engraved on the flat underside of the handle.
  const stamp = stampText(K, `C2-${Math.round(p.reach)}`, 4.5, 0.6);
  if (stamp && 2 * Math.sqrt(gr * gr - zFlat * zFlat) > 24)
    part = part.subtract(stamp.rotate([180, 0, 0]).translate([C2_GRIP_L * 0.45, 0, zFlat + 0.59]));
  return part;
}

/** Tip pointing along +X, starting at x = 0. */
function tipShape(K: Kernel, p: C2P): Manifold {
  const { Manifold } = K;
  const d = c2TipD(p);
  const x = (m: Manifold) => m.rotate([0, 90, 0]);
  if (p.tip === 'cup') {
    const L = p.pressDepth + 3;
    const cup = x(Manifold.cylinder(L, d / 2, d / 2, 64));
    const bore = x(
      Manifold.cylinder(p.pressDepth + 1.01, p.targetD / 2 + 1.5, p.targetD / 2 + 2.2, 64),
    ).translate([L - p.pressDepth - 1, 0, 0]);
    return cup.subtract(bore);
  }
  if (p.tip === 'flat') return x(Manifold.cylinder(6, p.shaftD / 2, d / 2, 48));
  // round and stylus: a domed end
  const r = d / 2;
  return x(Manifold.cylinder(6 - r * 0.5, p.shaftD / 2, r, 48)).add(
    Manifold.sphere(r, 48)
      .scale([0.6, 1, 1])
      .translate([6 - r * 0.5, 0, 0]),
  );
}

/** Fit test: just the tip and 10 mm of shaft. */
export function fitTestC2(K: Kernel, p: C2P): Manifold {
  const sr = p.shaftD / 2;
  const stub = K.Manifold.cylinder(10, sr, sr, 48).rotate([0, 90, 0]);
  return stub.add(tipShape(K, p).translate([10, 0, 0])).trimByPlane([0, 0, 1], -sr + 0.8);
}
