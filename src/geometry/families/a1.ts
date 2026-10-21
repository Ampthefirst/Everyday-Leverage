import type { Kernel, Manifold } from '../kernel';
import type { A1P } from '../../families/a1';
import { a1GrooveZ, a1MinOuter, a1ShaftSpan } from '../../families/a1';
import { shaftSleeve, ringGroove, axialRidges, stampText } from '../primitives';
import type { Profile2D } from '../primitives';

export function a1Pocket(p: A1P): Profile2D {
  if (p.shaftShape === 'round') return { shape: 'round', d: p.shaftW };
  if (p.shaftShape === 'rect') return { shape: 'rect', w: p.shaftW, h: p.shaftH, r: 0.5 };
  return { shape: 'oval', w: p.shaftW, h: p.shaftH };
}

export function buildA1(K: Kernel, p: A1P): Manifold {
  const { Manifold } = K;
  const D = p.gripOD;
  const H = p.gripShape === 'round' ? D : D * 0.82;
  let body = shaftSleeve(K, {
    outer: { shape: p.gripShape, w: D, h: H, r: H / 3 },
    length: p.length,
    pocket: a1Pocket(p),
    clearance: p.clearance,
    pocketDepth: p.closedEnd ? p.length - 4 : undefined,
    ribs: p.attach === 'slip' ? { count: p.ribs, interference: 0.3 } : undefined,
    clamp: p.attach === 'clamp',
  });
  // Soften the end edges with a chamfer ring.
  const cham = 1.2;
  const R = a1MinOuter(p) / 2;
  for (const z of [0, p.length]) {
    const ring = Manifold.cylinder(cham * 2, D, D, 64)
      .subtract(Manifold.cylinder(cham * 2, R - cham, R + cham, 64))
      .translate([0, 0, z - cham]);
    body = body.subtract(z === 0 ? ring : ring.mirror([0, 0, 1]).translate([0, 0, 2 * z]));
  }
  const grooves = a1GrooveZ(p).map((z) => ringGroove(K, Math.max(D, H) / 2 + 1, p.grooveDepth + 1, 14, z));
  if (grooves.length) {
    // Only cut the grip-front half (−Y) so the back stays full for the palm.
    const front = Manifold.cube([D * 2, D, p.length + 2]).translate([-D, -D, -1]);
    body = body.subtract(Manifold.union(grooves).intersect(front));
  }
  if (p.thumbRest) {
    const side = p.hand === 'right' ? 1 : -1;
    const scoop = Manifold.cylinder(40, 26, 26, 64)
      .rotate([90, 0, 0])
      .translate([side * (R + 26 - 1.6), 20, p.length - 34]);
    body = body.subtract(scoop);
  }
  if (p.texture) {
    const zTex0 = 6;
    const zTex1 = a1GrooveZ(p).length ? Math.min(...a1GrooveZ(p)) - 14 : p.length * 0.45;
    if (zTex1 - zTex0 > 10 && p.gripShape === 'round')
      body = body.add(axialRidges(K, R, 18, 1.1, zTex0, zTex1 - zTex0));
  }
  // Stamp on the bottom face, on the back side of the pocket.
  const stamp = stampText(K, `A1-${Math.round(D)}`, 4, 0.6);
  const ringW = R - (p.shaftW / 2 + p.clearance);
  if (stamp && ringW > 6.5 && !p.closedEnd) {
    body = body.subtract(
      stamp.rotate([0, 180, 0]).translate([0, p.shaftW / 2 + p.clearance + ringW / 2 + 0.3, 0.6]),
    );
  }
  return body;
}

/** Fit test: a 12 mm slice of the sleeve with the real pocket. */
export function fitTestA1(K: Kernel, p: A1P): Manifold {
  return shaftSleeve(K, {
    outer: {
      shape: 'round',
      w: Math.min(p.gripOD, a1ShaftSpan(p) + 8),
      h: Math.min(p.gripOD, a1ShaftSpan(p) + 8),
    },
    length: 12,
    pocket: a1Pocket(p),
    clearance: p.clearance,
    ribs: p.attach === 'slip' ? { count: p.ribs, interference: 0.3 } : undefined,
  });
}
