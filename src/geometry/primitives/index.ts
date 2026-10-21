/**
 * The five shared primitives. Every family composes these plus the helpers.
 * Conventions: mm; each primitive is built about the origin and documented below.
 */
import type { Kernel, Manifold } from '../kernel';
import { profileCS, type Profile2D } from './profiles';
import { roundedRect, stadium } from './helpers';

export * from './profiles';
export * from './helpers';

// ---------- 1. shaft sleeve ----------

export interface SleeveSpec {
  outer: { shape: 'round' | 'oval' | 'rrect'; w: number; h: number; r?: number };
  length: number;
  /** The target shaft; the pocket is this plus clearance. */
  pocket: Profile2D;
  clearance: number;
  /** Pocket depth from the top; default = through. */
  pocketDepth?: number;
  /** Crush ribs for a slip fit: count 3–6, interference 0.3 mm. */
  ribs?: { count: number; interference: number };
  /** Split clamp: a slot through one side plus a bolt boss with M3 nut trap. */
  clamp?: boolean;
}

/** Tube along +Z from z = 0 to length; the pocket opens at the top (z = length). */
export function shaftSleeve(K: Kernel, s: SleeveSpec): Manifold {
  const { Manifold, CrossSection } = K;
  const outerCS =
    s.outer.shape === 'round'
      ? CrossSection.circle(s.outer.w / 2)
      : s.outer.shape === 'oval'
        ? CrossSection.circle(0.5).scale([s.outer.w, s.outer.h])
        : roundedRect(K, s.outer.w, s.outer.h, s.outer.r ?? Math.min(s.outer.w, s.outer.h) / 4);
  let body = outerCS.extrude(s.length);
  const depth = Math.min(s.pocketDepth ?? s.length + 2, s.length + 2);
  const pocketZ0 = s.length - depth + (s.pocketDepth ? 0 : -1);
  let pocket = profileCS(K, s.pocket, s.clearance)
    .extrude(depth + 1)
    .translate([0, 0, pocketZ0]);

  if (s.ribs && s.ribs.count > 0) {
    // Ribs stand proud of the pocket wall by clearance + interference and crush on insertion.
    const ribH = s.clearance + s.ribs.interference;
    const rib = (x: number, y: number) =>
      Manifold.cylinder(depth + 1, ribH, ribH, 12).translate([x, y, pocketZ0]);
    const ribs: Manifold[] = [];
    if (s.pocket.shape === 'round') {
      const R = s.pocket.d / 2 + s.clearance;
      for (let i = 0; i < s.ribs.count; i++) {
        const a = (2 * Math.PI * i) / s.ribs.count;
        ribs.push(rib(R * Math.cos(a), R * Math.sin(a)));
      }
    } else {
      // Non-round pockets: one rib on the middle of each face.
      const [w, h] = extentOf(s.pocket);
      ribs.push(
        rib(w / 2 + s.clearance, 0),
        rib(-w / 2 - s.clearance, 0),
        rib(0, h / 2 + s.clearance),
        rib(0, -h / 2 - s.clearance),
      );
    }
    pocket = pocket.subtract(Manifold.union(ribs));
  }
  body = body.subtract(pocket);

  if (s.clamp) {
    const halfW = s.outer.w / 2;
    // Boss on +Y, slot through the wall on +Y, bolt along X through the boss.
    const bossW = 12;
    const bossL = Math.min(18, s.length * 0.4);
    const bossZ = s.length - bossL;
    const boss = roundedRect(K, bossW, 9, 2)
      .extrude(bossL)
      .translate([0, halfW + 2.5, bossZ]);
    body = body.add(boss);
    const slot = Manifold.cube([1.6, halfW + 12, bossL + 2]).translate([-0.8, 0, bossZ - 1]);
    body = body.subtract(slot);
    const bolt = Manifold.cylinder(bossW + 4, 1.7, 1.7, 20)
      .rotate([0, 90, 0])
      .translate([-(bossW + 4) / 2, halfW + 3.5, bossZ + bossL / 2]);
    const nut = Manifold.cylinder(3, 3.25, 3.25, 6)
      .rotate([0, 90, 0])
      .translate([bossW / 2 - 2.6, halfW + 3.5, bossZ + bossL / 2]);
    body = body.subtract(bolt).subtract(nut);
  }
  return body;
}

function extentOf(p: Profile2D): [number, number] {
  switch (p.shape) {
    case 'rect':
    case 'oval':
      return [p.w, p.h];
    case 'round':
    case 'D':
      return [p.d, p.d];
    case 'hex':
      return [p.af, p.af];
    case 'star':
      return [p.inner, p.inner];
    case 'cross':
      return [p.arm, p.arm];
    case 'slot':
      return [p.w, p.t];
  }
}

// ---------- 2. lever arm ----------

export interface LeverSpec {
  length: number;
  rootW: number;
  rootH: number;
  tipW: number;
  tipH: number;
  /** Edge rounding radius (applied to the 2D profile before extrusion). */
  round: number;
  /** Rounded end pad at the tip. */
  pad?: { d: number; h: number };
  /** Finger scallops along the top. */
  scallops?: { count: number; depth: number };
}

/** Tapered lever along +X from x = 0 (root) to length (tip), centred in Y and Z. Width on Y, height on Z. */
export function leverArm(K: Kernel, s: LeverSpec): Manifold {
  const { Manifold } = K;
  const prof = roundedRect(K, s.rootW, s.rootH, s.round);
  let arm = prof
    .extrude(s.length, 8, 0, [s.tipW / s.rootW, s.tipH / s.rootH])
    // extruded along Z: rotate so Z → X; profile x (width) → Y, profile y (height) → Z
    .rotate([0, 0, 90])
    .rotate([0, 90, 0]);
  // After rotations the profile width lies on Y and height on Z.
  if (s.pad) {
    const pad = Manifold.cylinder(s.pad.h, s.pad.d / 2, s.pad.d / 2, 48).translate([
      s.length - s.pad.d / 4,
      0,
      -s.pad.h / 2,
    ]);
    arm = arm.add(pad);
  }
  if (s.scallops && s.scallops.count > 0) {
    const cuts: Manifold[] = [];
    const n = s.scallops.count;
    const span = s.length * 0.5;
    const pitch = span / n;
    const R = pitch * 0.55;
    for (let i = 0; i < n; i++) {
      const x = s.length * 0.4 + pitch * (i + 0.5);
      const hAt = s.rootH + (s.tipH - s.rootH) * (x / s.length);
      cuts.push(
        Manifold.cylinder(s.rootW * 3, R, R, 32)
          .rotate([90, 0, 0])
          .translate([x, s.rootW * 1.5, hAt / 2 + R - s.scallops.depth]),
      );
    }
    arm = arm.subtract(Manifold.union(cuts));
  }
  return arm;
}

// ---------- 3. socket cup ----------

export interface SocketSpec {
  /** One profile, or several stacked (stepped multi-diameter: widest at the mouth). */
  steps: { profile: Profile2D; depth: number }[];
  bossOD: number;
  floor: number;
  clearance: number;
  /** Serrated ring: teeth projecting inward from the pocket wall. */
  teeth?: { count: number; height: number };
  /** Groove for a rubber band around the inside of each step. */
  bandGroove?: boolean;
}

/** Boss along +Z from z = 0; pocket opens at the top. Returns the cup and its total height. */
export function socketCup(K: Kernel, s: SocketSpec): { solid: Manifold; height: number } {
  const { Manifold, CrossSection } = K;
  const totalDepth = s.steps.reduce((a, b) => a + b.depth, 0);
  const height = totalDepth + s.floor;
  let cup = CrossSection.circle(s.bossOD / 2).extrude(height);
  // Steps: first step is the mouth (top). Deeper steps are smaller.
  let zTop = height;
  const cutters: Manifold[] = [];
  for (const st of s.steps) {
    const z0 = zTop - st.depth;
    let c = profileCS(K, st.profile, s.clearance)
      .extrude(st.depth + (zTop === height ? 1 : 0.01))
      .translate([0, 0, z0]);
    if (s.teeth && st.profile.shape === 'round') {
      const R = st.profile.d / 2 + s.clearance;
      const teeth: Manifold[] = [];
      for (let i = 0; i < s.teeth.count; i++) {
        teeth.push(
          CrossSection.ofPolygons([
            [
              [R + 0.5, 1.2],
              [R - s.teeth.height, 0],
              [R + 0.5, -1.2],
            ],
          ])
            .extrude(st.depth * 0.8)
            .translate([0, 0, z0 + st.depth * 0.1])
            .rotate([0, 0, (360 * i) / s.teeth.count]),
        );
      }
      c = c.subtract(Manifold.union(teeth));
    }
    if (s.bandGroove && st.profile.shape === 'round') {
      const R = st.profile.d / 2 + s.clearance;
      const g = CrossSection.circle(1.2, 12)
        .translate([R + 0.4, 0])
        .revolve(64)
        .translate([0, 0, z0 + st.depth / 2]);
      c = c.add(g);
    }
    cutters.push(c);
    zTop = z0;
  }
  cup = cup.subtract(Manifold.union(cutters));
  return { solid: cup, height };
}

// ---------- 4. loop ----------

export interface LoopSpec {
  kind: 'stadium' | 'tbar';
  /** Opening length (X) and width (Y) — the space the fingers go through. */
  innerL: number;
  innerW: number;
  /** Cross-section width of the ring band in the loop plane. */
  band: number;
  /** Thickness along Z. */
  thickness: number;
  /** Minimum inside bend radius. */
  minBend: number;
}

/** Loop lying in XY, centred on the origin, z from 0 to thickness. T-bar: a bar along X instead. */
export function loopShape(K: Kernel, s: LoopSpec): Manifold {
  if (s.kind === 'tbar') {
    return roundedRect(K, s.innerL + 2 * s.band, s.band * 1.6, s.band * 0.6).extrude(s.thickness);
  }
  const innerW = Math.max(s.innerW, 2 * s.minBend);
  const outer = stadium(K, s.innerL + 2 * s.band, innerW + 2 * s.band);
  const inner = stadium(K, s.innerL, innerW);
  return outer.subtract(inner).offset(-0.4, 'Round').offset(0.4, 'Round').extrude(s.thickness);
}

// ---------- 5. clip ----------

export interface ClipSpec {
  kind: 'cclip' | 'strap';
  /** Diameter of the thing being clipped onto. */
  innerD: number;
  wall: number;
  /** Mouth opening angle (deg) for the C-clip. */
  opening: number;
  /** Width along Z. */
  width: number;
  /** Lip that flares at the mouth (mm). */
  lip: number;
  /** Strap slot size for the strap variant. */
  strap?: { w: number; t: number };
}

/** C-clip around the Z axis, mouth facing −Y. Strap variant: closed-back saddle with two strap slots. */
export function clipShape(K: Kernel, s: ClipSpec): Manifold {
  const { CrossSection, Manifold } = K;
  const ri = s.innerD / 2;
  const ro = ri + s.wall;
  let ring = CrossSection.circle(ro).subtract(CrossSection.circle(ri));
  if (s.kind === 'cclip') {
    const half = (s.opening / 2) * (Math.PI / 180);
    // Wedge (pie slice) facing −Y; its arc lies well outside the ring.
    const R = 2 * ro + 10;
    const pie: [number, number][] = [[0, 0]];
    for (let i = 0; i <= 8; i++) {
      const a = -Math.PI / 2 - half + (i * 2 * half) / 8;
      pie.push([R * Math.cos(a), R * Math.sin(a)]);
    }
    const wedge = CrossSection.ofPolygons([pie]);
    ring = ring.subtract(wedge);
    if (s.lip > 0) {
      // Rounded lips at the mouth ends flare outward to guide the clip on.
      const rm = (ri + ro) / 2;
      for (const sgn of [-1, 1]) {
        const a = -Math.PI / 2 + sgn * half;
        const r = rm + s.lip * 0.5;
        ring = ring.add(CrossSection.circle(s.wall * 0.75).translate([r * Math.cos(a), r * Math.sin(a)]));
      }
    }
    return ring.offset(-0.3, 'Round').offset(0.3, 'Round').extrude(s.width);
  }
  // Strap: keep the top half (saddle) and add two ears with slots.
  const keep = CrossSection.square([2 * ro + 2, ro + 1]).translate([-ro - 1, 0]);
  ring = ring.intersect(keep);
  const st = s.strap ?? { w: 25, t: 3 };
  const earW = st.t + 2 * s.wall;
  const ear = CrossSection.square([earW, s.wall * 1.5]).translate([0, -s.wall * 0.75]);
  const ears = CrossSection.union([ear.translate([ri, 0]), ear.translate([-ri - earW, 0])]);
  let saddle = ring.add(ears).extrude(Math.max(s.width, st.w + 2 * s.wall));
  for (const sgn of [-1, 1]) {
    const slot = Manifold.cube([st.t, s.wall * 4, st.w], true).translate([
      sgn * (ri + earW / 2),
      0,
      Math.max(s.width, st.w + 2 * s.wall) / 2,
    ]);
    saddle = saddle.subtract(slot);
  }
  return saddle;
}
