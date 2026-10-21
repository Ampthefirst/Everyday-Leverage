import type { Kernel, Manifold } from '../kernel';
import type { B1P } from '../../families/b1';
import { b1BossOD, b1Diameters, b1PlateL, b1PlateW, b1ScrewHoles, b1VPoints } from '../../families/b1';
import { countersunkHole, leverArm, roundedRect, socketCup, stampText } from '../primitives';

const PLATE_T = 14;

export function buildB1(K: Kernel, p: B1P): Manifold {
  return p.mount === 'wall' ? buildWall(K, p) : buildHandheld(K, p);
}

function buildHandheld(K: Kernel, p: B1P): Manifold {
  const { Manifold } = K;
  const B = b1BossOD(p);
  const steps = b1Diameters(p).map((d) => ({ profile: { shape: 'round' as const, d }, depth: p.stepDepth }));
  const { solid: cup } = socketCup(K, {
    steps,
    bossOD: B,
    floor: 4,
    clearance: p.clearance,
    teeth:
      p.teeth === 'serrated'
        ? { count: Math.max(12, Math.round((Math.PI * steps[0].profile.d) / 9)), height: 1.2 }
        : undefined,
    bandGroove: p.teeth === 'band',
  });
  const r0 = B / 2 - 3;
  const lever = (sign: 1 | -1) => {
    const arm = leverArm(K, {
      length: p.lever + 3,
      rootW: p.leverW,
      rootH: p.leverH,
      tipW: p.leverW * 0.9,
      tipH: p.leverH * 0.9,
      round: Math.min(4, p.leverH / 3),
      pad: { d: p.leverW * 1.15, h: p.leverH * 0.9 },
    }).translate([r0, 0, p.leverH / 2]);
    // Fillet: a hull from the lever root onto the boss wall.
    const fil = p.fillet;
    const root = Manifold.hull([
      roundedRect(K, p.leverW + 2 * fil, p.leverH, 2)
        .extrude(0.5)
        .rotate([0, 90, 0])
        .translate([r0 - 2, 0, p.leverH / 2]),
      roundedRect(K, p.leverW, p.leverH, 2)
        .extrude(0.5)
        .rotate([0, 90, 0])
        .translate([B / 2 + fil * 1.5, 0, p.leverH / 2]),
    ]);
    // Keep the fillet off the inside of the cup.
    const inner = Manifold.cylinder(
      200,
      steps[0].profile.d / 2 + p.clearance,
      steps[0].profile.d / 2 + p.clearance,
      96,
    ).translate([0, 0, 4]);
    let l = arm.add(root.subtract(inner));
    if (sign < 0) l = l.rotate([0, 0, 180]);
    return l;
  };
  let part = cup.add(lever(1));
  if (p.hands === 'two') part = part.add(lever(-1));
  // Stamp on top of the lever near its tip.
  const stamp = stampText(K, `B1-${Math.round(p.lidMax)}`, 5, 0.6);
  if (stamp) part = part.subtract(stamp.translate([B / 2 + p.lever * 0.55, 0, p.leverH - 0.6 + 0.01]));
  return part;
}

function buildWall(K: Kernel, p: B1P): Manifold {
  const { Manifold, CrossSection } = K;
  const w = b1PlateW(p);
  const L = b1PlateL(p);
  const v = b1VPoints(p);
  const outline = CrossSection.ofPolygons([
    [[-w / 2, 0], v[0], v[1], v[2], v[3], [w / 2, 0], [w / 2, L], [-w / 2, L]],
  ]);
  let plate = outline.offset(-2, 'Round').offset(2, 'Round').extrude(PLATE_T);
  // Serrations along both V edges.
  if (p.teeth === 'serrated') {
    const teeth: Manifold[] = [];
    for (const [a, b] of [
      [v[0], v[1]],
      [v[3], v[2]],
    ] as const) {
      const n = Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / 5);
      for (let i = 1; i < n; i++) {
        const t = i / n;
        const x = a[0] + (b[0] - a[0]) * t;
        const y = a[1] + (b[1] - a[1]) * t;
        teeth.push(Manifold.cylinder(PLATE_T + 2, 0.9, 0.9, 6).translate([x, y, -1]));
      }
    }
    plate = plate.subtract(Manifold.union(teeth));
  }
  for (const [x, y] of b1ScrewHoles(p))
    plate = plate.subtract(countersunkHole(K, 4.2, 8.5, PLATE_T, PLATE_T).translate([x, y, 0]));
  const stamp = stampText(K, `B1-${Math.round(p.lidMax)}`, 6, 0.6);
  if (stamp) plate = plate.subtract(stamp.translate([0, L - 12, PLATE_T - 0.59]));
  return plate;
}

/** Fit test: a 6 mm ring of the largest step. */
export function fitTestB1(K: Kernel, p: B1P): Manifold {
  const d = p.mount === 'wall' ? p.lidMax : b1Diameters(p)[0];
  return socketCup(K, {
    steps: [{ profile: { shape: 'round', d }, depth: 6 }],
    bossOD: d + 2 * p.clearance + 6,
    floor: 0.0001,
    clearance: p.clearance,
    teeth:
      p.teeth === 'serrated'
        ? { count: Math.max(12, Math.round((Math.PI * d) / 9)), height: 1.2 }
        : undefined,
  }).solid;
}
