/**
 * Articulated mannequin hand: proportions and poses as joint angles (forward kinematics).
 *
 * Canonical frame (right hand): wrist at the origin, fingers extend along +Y, the palmar side faces −Z,
 * the thumb is on the −X side. Flexion curls a finger toward −Z (the palm). All sizes in mm.
 */
export type HandPose = 'grip' | 'hook' | 'palm' | 'pinch' | 'point';
export type FingerName = 'index' | 'middle' | 'ring' | 'little';

export interface FingerSpec {
  name: FingerName;
  /** Knuckle (MCP) position on the palm, canonical frame. */
  base: [number, number, number];
  /** Proximal, middle, distal phalanx lengths. */
  lengths: [number, number, number];
  /** Phalanx width at the knuckle; segments taper toward the tip. */
  width: number;
  /** Sideways spread of the finger at rest (deg, + toward the little-finger side). */
  splay: number;
}

export interface HandSpec {
  scale: number;
  palm: { width: number; length: number; thickness: number };
  fingers: FingerSpec[];
  thumb: { base: [number, number, number]; lengths: [number, number, number]; width: number };
  wrist: { radius: number; length: number };
}

/** Typical adult hand with 85 mm breadth across the knuckles, scaled to `breadth`. */
export function handSpec(breadth = 85): HandSpec {
  const s = breadth / 85;
  const L = 96 * s; // wrist to middle knuckle
  const pitch = 19.5 * s;
  const T = 26 * s;
  const mk = (
    name: FingerName,
    i: number,
    drop: number,
    lengths: [number, number, number],
    width: number,
    splay: number,
  ): FingerSpec => ({
    name,
    base: [(-1.5 + i) * pitch, L - drop * s, 0],
    lengths: lengths.map((l) => l * s) as [number, number, number],
    width: width * s,
    splay,
  });
  return {
    scale: s,
    palm: { width: 4 * pitch + 6 * s, length: L, thickness: T },
    fingers: [
      mk('index', 0, 4, [41, 25, 20], 17.5, -4),
      mk('middle', 1, 0, [45, 28, 22], 18, 0),
      mk('ring', 2, 4, [42, 27, 21], 17, 4),
      mk('little', 3, 14, [33, 20, 18], 15, 9),
    ],
    thumb: { base: [-1.9 * pitch, 26 * s, -T * 0.15], lengths: [44 * s, 31 * s, 25 * s], width: 20 * s },
    wrist: { radius: T * 0.62, length: 34 * s },
  };
}

export interface FingerAngles {
  /** MCP, PIP, DIP flexion (deg). */
  flex: [number, number, number];
  /** Extra sideways spread (deg). */
  splay: number;
}

export interface ThumbAngles {
  /** Rotation of the thumb base: opposition across the palm, abduction away from it, axial roll (deg). */
  oppose: number;
  abduct: number;
  roll: number;
  /** CMC/MCP, IP flexion and the base segment flexion (deg). */
  flex: [number, number, number];
}

export interface PoseAngles {
  fingers: FingerAngles[];
  thumb: ThumbAngles;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Clearance kept between a wrapped finger or thumb and the handle, mm. */
const WRAP_GAP = 0.8;

/** Shortest distance from point c to segment ab, in the (y, z) plane. */
function segDist(c: [number, number], a: [number, number], b: [number, number]): number {
  const [dy, dz] = [b[0] - a[0], b[1] - a[1]];
  const len2 = dy * dy + dz * dz || 1;
  const t = clamp(((c[0] - a[0]) * dy + (c[1] - a[1]) * dz) / len2, 0, 1);
  return Math.hypot(a[0] + dy * t - c[0], a[1] + dz * t - c[1]);
}

/**
 * Flexion that wraps a finger round a handle (the grip cylinder, axis along canonical X) as closely as
 * it can without passing into it: each phalanx, from the knuckle out, bends as far as it can while its
 * inner surface stays just outside the handle. `mcpMax` caps the knuckle (a hook grip keeps it low).
 */
export function wrapFinger(
  f: FingerSpec,
  cyl: { y: number; z: number; r: number },
  mcpMax = 95,
  wrapMax = 360,
): [number, number, number] {
  const limits = [mcpMax, 110, 85];
  // Half-thickness of each phalanx in its bending plane (segments taper and are flattened to 0.86).
  const half = [1, 0.9, 0.82].map((k) => (f.width * k * 0.86) / 2);
  const c: [number, number] = [cyl.y, cyl.z];
  let p: [number, number] = [f.base[1], f.base[2]];
  let th = 0;
  const out: number[] = [];
  f.lengths.forEach((l, k) => {
    const clear = cyl.r + half[k] + WRAP_GAP;
    let bend = 0;
    for (let b = 1; b <= limits[k] && th + b <= wrapMax; b++) {
      const t = rd(th + b);
      const q: [number, number] = [p[0] + l * Math.cos(t), p[1] - l * Math.sin(t)];
      if (segDist(c, p, q) < clear) break;
      bend = b;
    }
    th += bend;
    p = [p[0] + l * Math.cos(rd(th)), p[1] - l * Math.sin(rd(th))];
    out.push(bend);
  });
  return out as [number, number, number];
}

/** Joint centres along the thumb (base, and the end of each phalanx), canonical frame. */
function thumbJoints(spec: HandSpec, t: ThumbAngles): V3[] {
  const pts: V3[] = [spec.thumb.base];
  let th = 0;
  let y = 0;
  let z = 0;
  spec.thumb.lengths.forEach((l, k) => {
    th += rd(t.flex[k]);
    y += l * Math.cos(th);
    z -= l * Math.sin(th);
    const q = thumbRotate(t, [0, y, z]);
    pts.push([q[0] + spec.thumb.base[0], q[1] + spec.thumb.base[1], q[2] + spec.thumb.base[2]]);
  });
  return pts;
}

const thumbCache = new Map<string, ThumbAngles>();
/**
 * The thumb for a power grip: it closes over the handle from the side opposite the fingers and rests on
 * it, never passing into it. Searched once per hand size and handle size.
 */
export function wrapThumb(spec: HandSpec, cyl: { y: number; z: number; r: number }): ThumbAngles {
  const key = `${spec.scale.toFixed(3)}:${cyl.r.toFixed(2)}`;
  const hit = thumbCache.get(key);
  if (hit) return hit;
  const c: [number, number] = [cyl.y, cyl.z];
  const half = [1, 0.9, 0.82].map((k) => (spec.thumb.width * k * 0.86) / 2);
  let best: { cost: number; t: ThumbAngles } = { cost: Infinity, t: OPEN_ANGLES.thumb };
  for (let oppose = 30; oppose <= 100; oppose += 5)
    for (let abduct = -60; abduct <= 10; abduct += 5)
      for (const roll of [-170, -150, -130, -110])
        for (let f = 0; f <= 50; f += 5) {
          const t: ThumbAngles = { oppose, abduct, roll, flex: [f * 0.6, f, f * 0.9] };
          const j = thumbJoints(spec, t);
          let ok = true;
          for (let k = 0; k < 3 && ok; k++) {
            // Each phalanx stays outside the handle, including its rounded ends.
            if (segDist(c, [j[k][1], j[k][2]], [j[k + 1][1], j[k + 1][2]]) < cyl.r + half[k] + WRAP_GAP)
              ok = false;
          }
          if (!ok) continue;
          // Rest the thumb tip on the handle, ahead of the palm (toward the fingers' side), with little flex.
          const tip = j[3];
          const gap = Math.hypot(tip[1] - c[0], tip[2] - c[1]) - (cyl.r + half[2] + WRAP_GAP);
          const cost = gap + Math.max(0, tip[2] - cyl.z) * 0.5 + f * 0.01;
          if (cost < best.cost) best = { cost, t };
        }
  thumbCache.set(key, best.t);
  return best.t;
}

/** Grip cylinder for a handle of diameter d: axis along canonical X, under the proximal phalanges. */
export function gripCylinder(spec: HandSpec, d: number) {
  const r = d / 2;
  const fingerT = spec.fingers[1].width * 0.82;
  return {
    r,
    /** Radius of the finger mid-lines wrapped around the handle. */
    wrapR: r + fingerT / 2,
    /** Axis position (canonical y, z). */
    y: spec.palm.length - spec.fingers[1].lengths[0] * 0.15,
    z: -(spec.palm.thickness / 2 + r + 1),
  };
}

type V3 = [number, number, number];
const rd = (d: number) => (d * Math.PI) / 180;

/** Tip centre of a planar 3-segment chain from its base along +Y, curling toward −Z; plus the pad normal. */
function chainTip(
  lengths: [number, number, number],
  flex: [number, number, number],
): { tip: V3; normal: V3 } {
  let th = 0;
  let y = 0;
  let z = 0;
  lengths.forEach((l, k) => {
    th += rd(flex[k]);
    y += l * Math.cos(th);
    z -= l * Math.sin(th);
  });
  return { tip: [0, y, z], normal: [0, -Math.sin(th), -Math.cos(th)] };
}

/** Thumb base rotation (same Euler order as the renderer: 'ZXY', i.e. Rz·Rx·Ry) applied to a vector. */
function thumbRotate(t: ThumbAngles, [x0, y0, z0]: V3): V3 {
  const r = rd(t.roll);
  const o = rd(t.oppose);
  const a = rd(t.abduct);
  const x1 = x0 * Math.cos(r) + z0 * Math.sin(r);
  const z1 = -x0 * Math.sin(r) + z0 * Math.cos(r);
  const y2 = y0 * Math.cos(o) + z1 * Math.sin(o);
  const z2 = -y0 * Math.sin(o) + z1 * Math.cos(o);
  return [x1 * Math.cos(a) - y2 * Math.sin(a), x1 * Math.sin(a) + y2 * Math.cos(a), z2];
}

/** Thumb tip centre in the canonical frame. */
export function thumbTip(spec: HandSpec, t: ThumbAngles): V3 {
  const p = thumbRotate(t, chainTip(spec.thumb.lengths, t.flex).tip);
  return [p[0] + spec.thumb.base[0], p[1] + spec.thumb.base[1], p[2] + spec.thumb.base[2]];
}

/**
 * Pinch: aims the thumb so its pad meets the index pad across an object `gap` mm thick. Returns the
 * thumb angles and the pinch point (midway between the pads) in the canonical frame.
 */
function solvePinch(spec: HandSpec, index: FingerAngles, gap: number): { thumb: ThumbAngles; point: V3 } {
  const f = spec.fingers[0];
  const fi = chainTip(f.lengths, index.flex);
  const wi = f.width * 0.72 * 0.43;
  const wt = spec.thumb.width * 0.72 * 0.43;
  const iPad: V3 = [
    f.base[0] + fi.tip[0],
    f.base[1] + fi.tip[1] + fi.normal[1] * wi,
    f.base[2] + fi.tip[2] + fi.normal[2] * wi,
  ];
  const target: V3 = [iPad[0], iPad[1] + fi.normal[1] * (gap + wt), iPad[2] + fi.normal[2] * (gap + wt)];
  let best = { cost: Infinity, thumb: undefined as unknown as ThumbAngles };
  for (let oppose = 0; oppose <= 90; oppose += 3)
    for (let abduct = -45; abduct <= 45; abduct += 3)
      for (let roll = -120; roll <= 0; roll += 15)
        for (let t = 0; t <= 40; t += 4) {
          const thumb: ThumbAngles = { oppose, abduct, roll, flex: [t * 0.5, t, t * 0.8] };
          const p = thumbTip(spec, thumb);
          const cost = Math.hypot(p[0] - target[0], p[1] - target[1], p[2] - target[2]) + 0.02 * t;
          if (cost < best.cost) best = { cost, thumb };
        }
  const h = gap / 2;
  return { thumb: best.thumb, point: [iPad[0], iPad[1] + fi.normal[1] * h, iPad[2] + fi.normal[2] * h] };
}

const PINCH_INDEX: FingerAngles = { flex: [45, 40, 15], splay: 0 };
const pinchCache = new Map<number, ReturnType<typeof solvePinch>>();
/** Pinch solution for this hand, holding an object about 8 mm thick (a key head or turner wing). */
export function pinchSolution(spec: HandSpec) {
  let s = pinchCache.get(spec.scale);
  if (!s) pinchCache.set(spec.scale, (s = solvePinch(spec, PINCH_INDEX, 8 * spec.scale)));
  return s;
}

/**
 * Index fingertip pad position in the canonical frame for a pose (forward kinematics along the chain,
 * pulled back from the very tip by a quarter of the last segment's width so it sits on the pad).
 */
export function indexTip(spec: HandSpec, a: PoseAngles): [number, number, number] {
  const f = spec.fingers[0];
  let th = 0;
  let y = f.base[1];
  let z = f.base[2];
  f.lengths.forEach((l, k) => {
    th += (a.fingers[0].flex[k] * Math.PI) / 180;
    y += l * Math.cos(th);
    z -= l * Math.sin(th);
  });
  const s = (-(f.splay + a.fingers[0].splay) * Math.PI) / 180;
  const dy = y - f.base[1];
  return [f.base[0] - dy * Math.sin(s), f.base[1] + dy * Math.cos(s), z - f.width * 0.25];
}

/** A relaxed, open hand: the start of every "how to use" grasp. */
export const OPEN_ANGLES: PoseAngles = {
  fingers: [0, 1, 2, 3].map(() => ({ flex: [6, 8, 4] as [number, number, number], splay: 0 })),
  thumb: { oppose: 12, abduct: 35, roll: -20, flex: [4, 8, 6] },
};

/** Joint angles part-way from an open hand (t = 0) to a pose (t = 1). */
export function blendAngles(open: PoseAngles, pose: PoseAngles, t: number): PoseAngles {
  const k = clamp(t, 0, 1);
  const mix = (a: number, b: number) => a + (b - a) * k;
  const tri = (a: [number, number, number], b: [number, number, number]) =>
    [mix(a[0], b[0]), mix(a[1], b[1]), mix(a[2], b[2])] as [number, number, number];
  return {
    fingers: pose.fingers.map((f, i) => ({
      flex: tri(open.fingers[i].flex, f.flex),
      splay: mix(open.fingers[i].splay, f.splay),
    })),
    thumb: {
      oppose: mix(open.thumb.oppose, pose.thumb.oppose),
      abduct: mix(open.thumb.abduct, pose.thumb.abduct),
      roll: mix(open.thumb.roll, pose.thumb.roll),
      flex: tri(open.thumb.flex, pose.thumb.flex),
    },
  };
}

export function poseAngles(pose: HandPose, spec: HandSpec, gripD = 32, wrapMax = 360): PoseAngles {
  if (pose === 'grip' || pose === 'hook') {
    const cyl = gripCylinder(spec, gripD);
    const fingers = spec.fingers.map((f) => ({
      // A hook grip keeps the knuckles nearly straight and curls only the finger ends.
      flex: wrapFinger(f, cyl, pose === 'hook' ? 25 : 95, wrapMax),
      splay: -f.splay * 0.8,
    }));
    return { fingers, thumb: wrapThumb(spec, cyl) };
  }
  if (pose === 'palm') {
    return {
      fingers: spec.fingers.map(() => ({ flex: [6, 6, 4], splay: 0 })),
      thumb: { oppose: 10, abduct: 30, roll: -20, flex: [5, 8, 6] },
    };
  }
  if (pose === 'point') {
    return {
      fingers: spec.fingers.map((f) =>
        f.name === 'index' ? { flex: [4, 4, 2], splay: 0 } : { flex: [85, 100, 70], splay: 0 },
      ),
      thumb: { oppose: 45, abduct: 20, roll: -40, flex: [20, 35, 30] },
    };
  }
  // pinch: the thumb pad meets the index pad across the held object; the other fingers curl loosely.
  return {
    fingers: spec.fingers.map((f) =>
      f.name === 'index' ? PINCH_INDEX : { flex: [55 + (f.name === 'little' ? 15 : 0), 70, 45], splay: 0 },
    ),
    thumb: pinchSolution(spec).thumb,
  };
}
