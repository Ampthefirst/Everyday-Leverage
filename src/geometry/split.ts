/**
 * Auto-split for oversize parts: cut perpendicular to the long axis and join the halves with a
 * dovetail key plus two alignment-pin holes. The strength model applies a joint factor of 0.5.
 */
import type { Kernel, Manifold } from './kernel';
import type { SplitRequest } from './protocol';

export const JOINT_CLEARANCE = 0.25;
export const PIN_D = 3;

export function splitPart(K: Kernel, m: Manifold, s: SplitRequest): [Manifold, Manifold] {
  const { Manifold, CrossSection } = K;
  // Work in a frame where the cut axis is X.
  const toX = s.axis === 'x' ? [0, 0, 0] : s.axis === 'y' ? [0, 0, -90] : [0, 90, 0];
  const back = s.axis === 'x' ? [0, 0, 0] : s.axis === 'y' ? [0, 0, 90] : [0, -90, 0];
  const atX = s.axis === 'z' ? -s.at : s.at;
  const r = m.rotate(toX as [number, number, number]);
  const bb = r.boundingBox();
  const cy = (bb.min[1] + bb.max[1]) / 2;
  const cz = (bb.min[2] + bb.max[2]) / 2;
  const h = bb.max[2] - bb.min[2];
  const w = bb.max[1] - bb.min[1];

  const [left, right] = r.splitByPlane([1, 0, 0], atX);
  // Dovetail key on the left piece sticking into +X; matching socket (with clearance) in the right piece.
  const keyLen = Math.min(12, Math.max(6, h * 0.8));
  const neck = Math.max(3, Math.min(w, h) * 0.3);
  const head = neck * 1.6;
  const depth = Math.min(h * 0.5, 10);
  const dove = (g: number) =>
    CrossSection.ofPolygons([
      [
        [0, -neck / 2 - g],
        [keyLen + g, -head / 2 - g],
        [keyLen + g, head / 2 + g],
        [0, neck / 2 + g],
      ],
    ])
      .extrude(depth + 2 * g)
      .translate([atX - 0.01, cy, cz - depth / 2 - g]);
  const keyed = left.add(dove(0).intersect(r));
  const socket = right.subtract(dove(JOINT_CLEARANCE));
  // Two alignment-pin holes either side of the key (print two 3 mm pins or use filament offcuts).
  const pins: Manifold[] = [];
  for (const sgn of [-1, 1]) {
    const y = cy + sgn * (head / 2 + PIN_D + 1);
    if (Math.abs(y - cy) + PIN_D / 2 < w / 2 - 1) {
      pins.push(
        Manifold.cylinder(16, PIN_D / 2 + 0.15, PIN_D / 2 + 0.15, 16)
          .rotate([0, 90, 0])
          .translate([atX - 8, y, cz]),
      );
    }
  }
  const pinCut = pins.length ? Manifold.union(pins) : null;
  const a = (pinCut ? keyed.subtract(pinCut) : keyed).rotate(back as [number, number, number]);
  const b = (pinCut ? socket.subtract(pinCut) : socket).rotate(back as [number, number, number]);
  return [a, b];
}
