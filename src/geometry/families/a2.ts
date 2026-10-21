import type { Kernel, Manifold } from '../kernel';
import type { A2P } from '../../families/a2';
import { a2Gap, a2HolderDepth, a2HolderLen, a2Inner, A2_WALL } from '../../families/a2';
import { roundedRect, stampText, strapSlot } from '../primitives';
import { A2_SLOT_EDGE } from '../../strength/families/a2';

/** Band around Z (the arm axis), palm pocket on −Y. */
export function buildA2(K: Kernel, p: A2P): Manifold {
  const { Manifold, CrossSection } = K;
  const { a, b } = a2Inner(p);
  const T = p.bandT;
  const ring = CrossSection.circle(1, 96)
    .scale([a + T, b + T])
    .subtract(CrossSection.circle(1, 96).scale([a, b]));
  let band = ring.extrude(p.bandWidth);
  if (p.style === 'open') {
    const gap = Manifold.cube([a2Gap(p), 2 * T + 10, p.bandWidth + 2]).translate([-a2Gap(p) / 2, b - 5, -1]);
    band = band.subtract(gap);
  }
  // Utensil holder block on the palm side, with the tilted slot through it along X.
  const hl = a2HolderLen(p);
  const hd = a2HolderDepth(p);
  const yIn = -b - T + 1.2;
  const holder = roundedRect(K, hl, p.bandWidth, 3)
    .extrude(hd)
    .rotate([90, 0, 0])
    .translate([0, yIn, p.bandWidth / 2]);
  // Keep the holder outside the palm opening.
  const inside = CrossSection.circle(1, 96)
    .scale([a, b])
    .extrude(p.bandWidth + 2)
    .translate([0, 0, -1]);
  let part = band.add(holder.subtract(inside));
  const side = p.hand === 'right' ? 1 : -1;
  // slot cross-section: width along Z, thickness along Y; axis along X; then tilt about Y.
  const slotPlaced = roundedRect(
    K,
    p.slotT + 2 * p.clearance,
    p.slotW + 2 * p.clearance,
    Math.min(1, p.slotT / 2),
  )
    .extrude(hl + 20, 0, 0, [1, 1], true)
    .rotate([0, 90, 0])
    .rotate([0, side * p.slotAngle, 0])
    .translate([0, yIn - hd / 2, p.bandWidth / 2]);
  part = part.subtract(slotPlaced);
  if (p.style === 'open' && p.strapSlots) {
    const sw = Math.min(25, p.bandWidth - 8);
    for (const sx of [-1, 1]) {
      const x = sx * (a2Gap(p) / 2 + A2_SLOT_EDGE + 1.5);
      const y = Math.sqrt(Math.max(0, 1 - (x / (a + T / 2)) ** 2)) * (b + T / 2);
      const cut = strapSlot(K, 3, sw, T * 4)
        .rotate([0, 0, 90])
        .rotate([90, 0, 0])
        .translate([x, y, p.bandWidth / 2]);
      part = part.subtract(cut);
    }
  }
  const stamp = stampText(K, `A2-${Math.round(p.palmWidth)}`, Math.min(5, p.bandWidth / 6), 0.6);
  if (stamp && hl > 30)
    part = part.subtract(stamp.rotate([90, 0, 0]).translate([0, yIn - hd + 0.59, p.bandWidth * 0.82]));
  return part;
}

/** Fit test: a 10 mm slice of the utensil pocket. */
export function fitTestA2(K: Kernel, p: A2P): Manifold {
  const w = p.slotW + 2 * p.clearance + 2 * A2_WALL;
  const t = p.slotT + 2 * p.clearance + 2 * A2_WALL;
  const block = roundedRect(K, w, t, 2).extrude(10);
  const slot = roundedRect(K, p.slotW + 2 * p.clearance, p.slotT + 2 * p.clearance, Math.min(1, p.slotT / 2))
    .extrude(12)
    .translate([0, 0, -1]);
  return block.subtract(slot);
}
