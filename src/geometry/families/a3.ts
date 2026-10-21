import type { Kernel, Manifold } from '../kernel';
import type { A3P } from '../../families/a3';
import { a3BossD, a3BossH, a3Profile } from '../../families/a3';
import { leverArm, profileCS, roundedRect, stampText } from '../primitives';

/** Socket boss along +Z with the socket opening at z = 0; the handle sits on top. */
export function buildA3(K: Kernel, p: A3P): Manifold {
  const { Manifold, CrossSection } = K;
  const B = a3BossD(p);
  const H = a3BossH(p);
  let boss = CrossSection.circle(B / 2).extrude(H);
  // Chamfered mouth so the tool finds the socket.
  boss = boss.subtract(
    Manifold.cylinder(1.5, B / 2 - 1.2 + 1.5, B / 2 - 1.2, 64)
      .translate([0, 0, -0.01])
      .subtract(Manifold.cylinder(1.6, B / 2 - 1.5, B / 2 - 1.5, 64)),
  );
  let handle: Manifold;
  const g = p.gripD * 0.8;
  if (p.style === 'T') {
    handle = leverArm(K, {
      length: p.length,
      rootW: g,
      rootH: g,
      tipW: g,
      tipH: g,
      round: g * 0.35,
    }).translate([-p.length / 2, 0, H + g / 2 - 2]);
  } else if (p.style === 'mushroom') {
    const dome = Manifold.sphere(p.gripD / 2, 96)
      .scale([1, 1, 0.6])
      .trimByPlane([0, 0, 1], 0)
      .translate([0, 0, H - 2]);
    const skirt = Manifold.cylinder(p.gripD * 0.18, p.gripD / 2, p.gripD / 2, 96).translate([
      0,
      0,
      H - 2 - p.gripD * 0.18 + 0.01,
    ]);
    handle = dome.add(skirt);
  } else {
    // Pistol: grip leaves the top of the boss at `angle` from the boss axis.
    const grip = leverArm(K, {
      length: p.length,
      rootW: g,
      rootH: g * 0.9,
      tipW: g * 1.05,
      tipH: g,
      round: g * 0.35,
    });
    handle = grip.rotate([0, -(90 - p.angle), 0]).translate([0, 0, H - 4]);
    handle = handle.add(Manifold.sphere(g / 2, 48).translate([0, 0, H - 2]));
  }
  let part = boss.add(handle);
  const socket = profileCS(K, a3Profile(p), p.clearance)
    .extrude(p.depth + 1)
    .translate([0, 0, -1]);
  part = part.subtract(socket);
  if (p.retention === 'setscrew') {
    const z = p.depth * 0.55;
    const screw = Manifold.cylinder(B, 1.6, 1.6, 20).rotate([0, 90, 0]).translate([0, 0, z]);
    const nut = CrossSection.circle(3.3, 6)
      .extrude(2.6)
      .rotate([0, 90, 0])
      .translate([B / 2 - 4.2, 0, z]);
    const nutSlot = Manifold.cube([2.6, 5.8, z + 1]).translate([B / 2 - 4.2, -2.9, -1]);
    part = part.subtract(screw).subtract(nut).subtract(nutSlot);
  }
  const stamp = stampText(K, `A3-${Math.round(p.gripD)}`, 4, 0.6);
  if (stamp && B >= 18)
    part = part.subtract(
      stamp
        .rotate([90, 0, 0])
        .rotate([0, 0, 180])
        .translate([0, B / 2 - 0.59 + 0.01, p.depth + 2.5])
        .rotate([0, 0, 90]),
    );
  return part;
}

/** Fit test: 10 mm of the socket in a thin collar. */
export function fitTestA3(K: Kernel, p: A3P): Manifold {
  const B = a3BossD(p) - 2;
  const collar = K.CrossSection.circle(B / 2).extrude(10);
  const socket = profileCS(K, a3Profile(p), p.clearance).extrude(12).translate([0, 0, -1]);
  return collar.subtract(socket).add(
    roundedRect(K, 6, 2, 0.5)
      .extrude(10)
      .translate([B / 2 + 2, 0, 0]),
  );
}
