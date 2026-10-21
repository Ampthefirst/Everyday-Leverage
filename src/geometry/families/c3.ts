import type { Kernel, Manifold } from '../kernel';
import type { C3P } from '../../families/c3';
import { c3ClipOD } from '../../families/c3';
import { capsule, clipShape, leverArm, roundedRect, stampText } from '../primitives';

/** Lever axis along X (clip from x = 0 to clipW, mouth facing −Z); bar along +X; hook curls up (+Z). */
export function buildC3(K: Kernel, p: C3P): Manifold {
  const { Manifold } = K;
  const D = c3ClipOD(p);
  // clipShape is built around Z with the mouth on −Y: turn Z → X, then −Y → −Z.
  const clip = clipShape(K, {
    kind: p.attach === 'clip' ? 'cclip' : 'strap',
    innerD: p.leverD,
    wall: p.wall,
    opening: 105,
    width: p.clipW,
    lip: 1.5,
    strap: { w: Math.min(25, p.clipW - 6), t: 3 },
  })
    .rotate([0, 90, 0])
    .rotate([90, 0, 0]);
  // Clip back wall: close the far end so the clip stops against the lever tip.
  const stop = Manifold.cylinder(3, D / 2, D / 2, 64)
    .rotate([0, 90, 0])
    .translate([p.clipW - 3, 0, 0]);
  const keepOpen = Manifold.cube([p.clipW + 2, D, D / 2 + 1]).translate([-1, -D / 2, -D / 2 - 1]);
  let part = clip.add(
    p.attach === 'clip'
      ? stop.subtract(keepOpen.translate([0, 0, 0])).subtract(
          Manifold.cylinder(4, p.leverD / 2 - 3, p.leverD / 2 - 3, 32)
            .rotate([0, 90, 0])
            .translate([p.clipW - 3.5, 0, 0]),
        )
      : stop,
  );
  const bar = leverArm(K, {
    length: p.extension + 6,
    rootW: p.barW,
    rootH: p.barH,
    tipW: p.barW * 0.95,
    tipH: p.barH * 0.85,
    round: Math.min(5, p.barH / 3),
  }).translate([p.clipW - 6, 0, 0]);
  // Fillet: hull from the clip's back face into the bar.
  const fil = Manifold.hull([
    roundedRect(K, Math.min(D, p.barW + 8), Math.min(D, p.barH + 6), 4)
      .extrude(0.5)
      .rotate([0, 90, 0])
      .translate([p.clipW - 3, 0, 0]),
    roundedRect(K, p.barW, p.barH, 3)
      .extrude(0.5)
      .rotate([0, 90, 0])
      .translate([p.clipW + 10, 0, 0]),
  ]);
  part = part.add(bar).add(fil);
  if (p.hook) {
    // Semicircular hook curling up and back from the tip.
    const tipX = p.clipW + p.extension;
    const r = p.barH * 0.42;
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * Math.PI;
      pts.push([tipX + p.hookR * Math.cos(a), 0, p.hookR + p.hookR * Math.sin(a)]);
    }
    const segs: Manifold[] = [];
    for (let i = 0; i < pts.length - 1; i++)
      segs.push(capsule(K, pts[i], pts[i + 1], r).scale([1, p.barW / (2 * r) / 1.6, 1]));
    part = part
      .add(Manifold.union(segs))
      .add(capsule(K, [tipX - 4, 0, 0], pts[0], r).scale([1, p.barW / (2 * r) / 1.6, 1]));
  }
  const stamp = stampText(K, `C3-${Math.round(p.extension)}`, Math.min(6, p.barW * 0.35), 1.2);
  if (stamp && p.extension >= 90) {
    // The bar tapers, so find its top surface where the stamp sits.
    const xs = p.extension * 0.45 + 6;
    const hAt = p.barH + (p.barH * 0.85 - p.barH) * (xs / (p.extension + 6));
    part = part.subtract(stamp.translate([p.clipW + p.extension * 0.45, 0, hAt / 2 - 0.6]));
  }
  return part;
}

/** Fit test: an 8 mm slice of the clip. */
export function fitTestC3(K: Kernel, p: C3P): Manifold {
  return clipShape(K, {
    kind: p.attach === 'clip' ? 'cclip' : 'strap',
    innerD: p.leverD,
    wall: p.wall,
    opening: 105,
    width: 8,
    lip: 1.5,
    strap: { w: 4, t: 3 },
  });
}
