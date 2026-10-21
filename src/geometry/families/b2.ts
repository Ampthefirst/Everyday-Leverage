import type { Kernel, Manifold } from '../kernel';
import type { B2P } from '../../families/b2';
import { b2Bottom, b2Holder, b2Pocket, B2_KEY_PITCH } from '../../families/b2';
import { roundedRect, stampText } from '../primitives';

/**
 * Wings in the XZ plane (span on X, height on Z from 0 to leverW), thickness on Y.
 * The holder hangs below the wings (z < leverW) with the key slot opening at its bottom.
 */
export function buildB2(K: Kernel, p: B2P): Manifold {
  const { Manifold } = K;
  const h = b2Holder(p);
  const top = p.leverW;
  const zBot = top - h.h;
  // Wing profile in XZ, extruded through Y.
  const wingCS = roundedRect(K, 2 * p.lever, p.leverW, Math.min(8, p.leverW / 2.5)).translate([
    0,
    p.leverW / 2,
  ]);
  let wings = wingCS.extrude(p.leverT, 0, 0, [1, 1], true).rotate([90, 0, 0]);
  if (p.angle === 'angled') {
    // Tilt each wing back by 20° about the vertical axis through the holder.
    const half = (sgn: number) =>
      wings
        .intersect(
          Manifold.cube([p.lever + 1, p.leverT * 4, p.leverW * 3]).translate([
            sgn > 0 ? 0 : -p.lever - 1,
            -p.leverT * 2,
            -p.leverW,
          ]),
        )
        .rotate([0, 0, sgn * 20]);
    wings = half(1).add(half(-1));
  }
  const holder = roundedRect(K, h.w, h.d, Math.min(4, h.d / 3))
    .extrude(h.h)
    .translate([0, 0, zBot]);
  let part = wings.add(holder);
  if (p.mode === 'key') {
    const sw = p.bladeW + 2 * p.clearance;
    const st = p.bladeT + 2 * p.clearance;
    for (let i = 0; i < p.keys; i++) {
      const y = -((p.keys - 1) * B2_KEY_PITCH(p)) / 2 + i * B2_KEY_PITCH(p);
      part = part.subtract(
        roundedRect(K, sw, st, 0.4)
          .extrude(b2Pocket(p) + 1 + zBot - b2Bottom(p))
          .translate([0, y, zBot - 1]),
      );
    }
    if (p.retention === 'bolt') {
      // M3 bolt across the slots through the key-ring hole (about 5 mm below the key head top).
      const z = zBot + b2Pocket(p) - 5;
      part = part.subtract(
        Manifold.cylinder(h.d + 2, 1.7, 1.7, 20)
          .rotate([90, 0, 0])
          .translate([-p.bladeW * 0.25, h.d / 2 + 1, z]),
      );
    }
  } else {
    const r = p.knobD / 2 + p.clearance;
    let socket = Manifold.cylinder(b2Pocket(p) + 1, r, r, 96).translate([0, 0, zBot - 1]);
    // Grip ribs inside the socket.
    const ribs: Manifold[] = [];
    for (let i = 0; i < 12; i++)
      ribs.push(
        Manifold.cylinder(p.knobH * 0.8, 0.9, 0.9, 10)
          .translate([r, 0, zBot])
          .rotate([0, 0, i * 30]),
      );
    socket = socket.subtract(Manifold.union(ribs));
    part = part.subtract(socket);
  }
  const stamp = stampText(K, `B2-${Math.round(p.mode === 'key' ? p.bladeW : p.knobD)}`, 5, 0.6);
  if (stamp && p.lever > 55)
    part = part.subtract(
      stamp.rotate([90, 0, 0]).translate([p.lever * 0.6, -p.leverT / 2 + 0.59, p.leverW * 0.4]),
    );
  return part;
}

/** Fit test: a short holder with the real slot. */
export function fitTestB2(K: Kernel, p: B2P): Manifold {
  const h = b2Holder(p);
  const block = roundedRect(K, h.w, h.d, 2).extrude(8);
  if (p.mode === 'key') {
    let out = block;
    for (let i = 0; i < p.keys; i++) {
      const y = -((p.keys - 1) * B2_KEY_PITCH(p)) / 2 + i * B2_KEY_PITCH(p);
      out = out.subtract(
        roundedRect(K, p.bladeW + 2 * p.clearance, p.bladeT + 2 * p.clearance, 0.4)
          .extrude(10)
          .translate([0, y, -1]),
      );
    }
    return out;
  }
  return block.subtract(
    K.Manifold.cylinder(10, p.knobD / 2 + p.clearance, p.knobD / 2 + p.clearance, 96).translate([0, 0, -1]),
  );
}
