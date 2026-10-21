import type { Kernel, Manifold } from '../kernel';
import type { B3P } from '../../families/b3';
import { b3BossD, b3Height, b3Profile } from '../../families/b3';
import { profileCS, stampText } from '../primitives';
import { levers } from './levers';

/** Boss along +Z with the socket opening at the top (print orientation); levers at the bottom. */
export function buildB3(K: Kernel, p: B3P): Manifold {
  const { Manifold, CrossSection } = K;
  const B = b3BossD(p);
  const H = b3Height(p);
  const socket = profileCS(K, b3Profile(p), p.clearance)
    .extrude(p.depth + 1)
    .translate([0, 0, H - p.depth]);
  let part = CrossSection.circle(B / 2).extrude(H);
  part = part.add(
    levers(
      K,
      {
        hubR: B / 2,
        lever: p.lever,
        w: p.leverW,
        h: p.leverH,
        fillet: p.fillet,
        z: p.leverH / 2,
        pad: true,
        keepOut: Manifold.cylinder(H + 2, B / 2 - p.wall, B / 2 - p.wall, 64).translate([0, 0, H - p.depth]),
      },
      p.hands === 'two' ? 2 : 1,
    ),
  );
  part = part.subtract(socket);
  const stamp = stampText(K, `B3-${Math.round(p.targetD)}`, 5, 0.6);
  if (stamp) part = part.subtract(stamp.translate([B / 2 + p.lever * 0.55, 0, p.leverH - 0.59]));
  return part;
}

/** Fit test: a 6 mm deep ring of the socket. */
export function fitTestB3(K: Kernel, p: B3P): Manifold {
  const B = b3BossD(p) - 2;
  const ring = K.CrossSection.circle(B / 2).extrude(6);
  return ring.subtract(profileCS(K, b3Profile(p), p.clearance).extrude(8).translate([0, 0, -1]));
}
