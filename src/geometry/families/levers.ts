import type { Kernel, Manifold } from '../kernel';
import { leverArm, roundedRect } from '../primitives';

export interface LeverOpts {
  /** Radius of the hub the lever grows out of. */
  hubR: number;
  lever: number;
  w: number;
  h: number;
  fillet: number;
  /** z of the lever's centre plane. */
  z: number;
  /** Tilt up from horizontal (deg). */
  tilt?: number;
  pad?: boolean;
  /** Region the fillet must not fill (e.g. the socket). */
  keepOut?: Manifold;
}

/** Lever(s) along ±X with a hull fillet onto the hub. */
export function levers(K: Kernel, o: LeverOpts, count: 1 | 2): Manifold {
  const { Manifold } = K;
  const r0 = o.hubR - 3;
  const one = () => {
    let arm = leverArm(K, {
      length: o.lever + 3,
      rootW: o.w,
      rootH: o.h,
      tipW: o.w * 0.9,
      tipH: o.h * 0.9,
      round: Math.min(4, o.h / 3),
      pad: o.pad ? { d: o.w * 1.15, h: o.h * 0.9 } : undefined,
    });
    if (o.tilt) arm = arm.rotate([0, -o.tilt, 0]);
    arm = arm.translate([r0, 0, o.z]);
    let root = Manifold.hull([
      roundedRect(K, o.w + 2 * o.fillet, o.h, 2)
        .extrude(0.5)
        .rotate([0, 90, 0])
        .translate([r0 - 2, 0, o.z]),
      roundedRect(K, o.w, o.h, 2)
        .extrude(0.5)
        .rotate([0, 90, 0])
        .translate([o.hubR + o.fillet * 1.5, 0, o.z]),
    ]);
    if (o.keepOut) root = root.subtract(o.keepOut);
    return arm.add(root);
  };
  const a = one();
  return count === 2 ? a.add(one().rotate([0, 0, 180])) : a;
}
