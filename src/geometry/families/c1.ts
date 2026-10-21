import type { Kernel, Manifold } from '../kernel';
import type { C1P } from '../../families/c1';
import { c1HookGap, c1HookW, c1Opening, C1_TAB } from '../../families/c1';
import { loopShape, roundedRect, stampText } from '../primitives';

const C1_PILOT_DEPTH = 12;

/** Loop in XY (pull along +Y), z from 0 to thickness; attachment toward −Y. */
export function buildC1(K: Kernel, p: C1P): Manifold {
  const { Manifold } = K;
  const { L, W } = c1Opening(p);
  const b = p.band;
  if (p.attach === 'screw') return buildDHandle(K, p);
  let part = loopShape(K, {
    kind: p.style === 'tbar' ? 'tbar' : 'stadium',
    innerL: L,
    innerW: W,
    band: b,
    thickness: p.thick,
    minBend: 6,
  });
  const yEdge = p.style === 'tbar' ? -b * 0.8 : -W / 2 - b;
  if (p.attach === 'ring') {
    const tab = roundedRect(K, 12, C1_TAB + 2, 3)
      .extrude(p.thick)
      .translate([0, yEdge - C1_TAB / 2 + 1, 0]);
    const hole = Manifold.cylinder(p.thick + 2, 2.5, 2.5, 24).translate([0, yEdge - C1_TAB / 2 - 1, -1]);
    part = part.add(tab).subtract(hole);
  } else {
    // J-hook: a stem down from the loop, a gap for the material, and a return lip.
    const gap = c1HookGap(p);
    const hw = c1HookW(p);
    const stemL = C1_TAB;
    const stem = Manifold.cube([hw, stemL + 1, p.thick]).translate([-hw / 2, yEdge - stemL, 0]);
    const lip = Manifold.cube([hw, 4, p.thick + gap + 4]).translate([-hw / 2, yEdge - stemL - 4, 0]);
    const ret = Manifold.cube([hw, stemL * 0.6, 3]).translate([
      -hw / 2,
      yEdge - stemL - 4 + 0.01,
      p.thick + gap + 1,
    ]);
    part = part.add(stem).add(lip).add(ret);
  }
  const stamp = stampText(K, `C1-${Math.round(L)}`, Math.min(4.5, b * 0.6), 0.6);
  if (stamp && p.style !== 'tbar' && L >= 40)
    part = part.subtract(stamp.translate([0, W / 2 + b / 2, p.thick - 0.59]));
  return part;
}

/** Drawer D-handle: a grip bar standing off the drawer on two screw feet. */
function buildDHandle(K: Kernel, p: C1P): Manifold {
  const { Manifold } = K;
  const { L, W } = c1Opening(p);
  const b = p.band;
  // Outline of the D in XY: grip bar at +Y, feet at −Y with screw holes.
  const outer = roundedRect(K, L + 2 * b, W + 2 * b, Math.min((W + 2 * b) / 2, 14));
  const inner = roundedRect(K, L, W, Math.min(W / 2, 10)).translate([0, b / 2]);
  let part = outer.subtract(inner).extrude(p.thick);
  // Flat feet: widen the −Y side so screws have meat around them.
  const feet = Manifold.union(
    [-1, 1].map((s) =>
      roundedRect(K, 16, b + 6, 4)
        .extrude(p.thick)
        .translate([(s * p.screwSpacing) / 2, -W / 2 - b / 2 + 1, 0]),
    ),
  );
  part = part.add(feet);
  for (const s of [-1, 1]) {
    // Blind pilot holes from the drawer side: screws go in from inside the drawer.
    const hole = Manifold.cylinder(C1_PILOT_DEPTH + 1, 1.7, 1.7, 20)
      .rotate([-90, 0, 0])
      .translate([(s * p.screwSpacing) / 2, -W / 2 - b - 3, p.thick / 2]);
    part = part.subtract(hole);
  }
  return part;
}

/** Fit test: the attachment end only (ring tab, hook, or a screw-foot pair template). */
export function fitTestC1(K: Kernel, p: C1P): Manifold {
  const { Manifold } = K;
  if (p.attach === 'hook') {
    const gap = c1HookGap(p);
    const hw = c1HookW(p);
    return Manifold.union([
      Manifold.cube([hw, C1_TAB + 4, 4]),
      Manifold.cube([hw, 4, 4 + gap + 3]),
      Manifold.cube([hw, C1_TAB * 0.6, 3]).translate([0, 0.01, 4 + gap]),
    ]);
  }
  if (p.attach === 'screw') {
    const bar = Manifold.cube([p.screwSpacing + 16, 12, 3]).translate([-(p.screwSpacing + 16) / 2, -6, 0]);
    return bar
      .subtract(Manifold.cylinder(5, 2.1, 2.1, 20).translate([-p.screwSpacing / 2, 0, -1]))
      .subtract(Manifold.cylinder(5, 2.1, 2.1, 20).translate([p.screwSpacing / 2, 0, -1]));
  }
  const { L, W } = c1Opening(p);
  return loopShape(K, {
    kind: 'stadium',
    innerL: L,
    innerW: W,
    band: Math.min(p.band, 4),
    thickness: 2,
    minBend: 6,
  });
}
