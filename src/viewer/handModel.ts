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
const deg = (r: number) => (r * 180) / Math.PI;

/**
 * Flexion that wraps a 3-segment finger around a cylinder of radius R (finger mid-line radius):
 * each joint turns by the arc angle of the half-segments on either side of it.
 */
export function wrapAngles(lengths: [number, number, number], R: number): [number, number, number] {
  const arc = (a: number, b: number) => deg(2 * Math.asin(clamp((a + b) / 4 / R, 0, 1)));
  return [
    clamp(arc(0, lengths[0]) + 18, 10, 95),
    clamp(arc(lengths[0], lengths[1]), 0, 110),
    clamp(arc(lengths[1], lengths[2]), 0, 85),
  ];
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

export function poseAngles(pose: HandPose, spec: HandSpec, gripD = 32): PoseAngles {
  if (pose === 'grip' || pose === 'hook') {
    const { wrapR } = gripCylinder(spec, gripD);
    const fingers = spec.fingers.map((f) => {
      const a = wrapAngles(f.lengths, wrapR);
      // A hook grip keeps the knuckles straighter and curls only the finger ends.
      return {
        flex: (pose === 'hook' ? [a[0] * 0.25, a[1] * 1.1, a[2]] : a) as [number, number, number],
        splay: -f.splay * 0.8,
      };
    });
    // The thumb crosses in front of the handle toward the little-finger side and rests on the index finger.
    const t = clamp(48 - gripD * 0.4, 18, 40);
    return { fingers, thumb: { oppose: 70, abduct: -30, roll: -160, flex: [t * 0.6, t, t * 0.9] } };
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
