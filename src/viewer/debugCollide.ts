/**
 * Diagnostics for the context objects (only with ?debug in the URL): how much of the hand, or another
 * object, sits inside the printed part. Exposed as window.__elDebug.measure() for the ghost-placement
 * checks in tests/e2e/ghosts.spec.ts. A small share of contact points is a hand touching the part; a
 * large share, or deep points, is the hand passing through it.
 */
import * as THREE from 'three';

const ray = new THREE.Raycaster();
const DIRS = [
  new THREE.Vector3(1, 0.013, 0.007).normalize(),
  new THREE.Vector3(-0.011, 1, 0.017).normalize(),
];

function worldTriangles(meshes: THREE.Mesh[]): THREE.Mesh {
  const geoms = meshes.map((m) => {
    const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).deleteAttribute('color');
    for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k);
    return g.applyMatrix4(m.matrixWorld);
  });
  const total = geoms.reduce((n, g) => n + g.attributes.position.count, 0);
  const pos = new Float32Array(total * 3);
  let o = 0;
  for (const g of geoms) {
    pos.set(g.attributes.position.array as Float32Array, o);
    o += g.attributes.position.count * 3;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.computeBoundingSphere();
  geo.computeBoundingBox();
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
}

/** Inside a closed mesh when rays in two directions both cross its surface an odd number of times. */
function inside(solid: THREE.Mesh, p: THREE.Vector3): boolean {
  if (!solid.geometry.boundingBox!.containsPoint(p)) return false;
  return DIRS.every((d) => {
    ray.set(p, d);
    return ray.intersectObject(solid, false).length % 2 === 1;
  });
}

/** Distance from p to the nearest surface of the solid (by ray, in 6 directions; an upper bound). */
function depth(solid: THREE.Mesh, p: THREE.Vector3): number {
  let best = Infinity;
  for (const d of [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ]) {
    ray.set(p, new THREE.Vector3(...(d as [number, number, number])));
    const hit = ray.intersectObject(solid, false)[0];
    if (hit) best = Math.min(best, hit.distance);
  }
  return best;
}

const SEGMENTS = new Set(['palm', 'wrist', 'thumb', 'index', 'middle', 'ring', 'little']);
/** The named hand segment a mesh belongs to (palm, thumb, index…), or "" for other objects. */
function segmentOf(o: THREE.Object3D): string {
  for (let x: THREE.Object3D | null = o; x; x = x.parent) if (SEGMENTS.has(x.name)) return x.name;
  return '';
}

type Sample = { p: THREE.Vector3; seg: string };

function samplePoints(root: THREE.Object3D, max: number): Sample[] {
  const pts: Sample[] = [];
  root.updateWorldMatrix(true, true);
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.visible) return;
    // The see-through hand draws a depth-only copy first; measure only the visible one.
    if ((m.material as THREE.Material & { colorWrite?: boolean }).colorWrite === false) return;
    const a = m.geometry.attributes.position;
    const seg = segmentOf(m);
    for (let i = 0; i < a.count; i++)
      pts.push({ p: new THREE.Vector3().fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld), seg });
  });
  if (pts.length <= max) return pts;
  const step = pts.length / max;
  return Array.from({ length: max }, (_, i) => pts[Math.floor(i * step)]);
}

export interface CollideReport {
  object: string;
  samples: number;
  /** Share of sampled surface points inside the part (0–1). */
  insideShare: number;
  /** Deepest sampled point inside the part, mm. */
  maxDepth: number;
  /** Deepest point inside the part for each hand segment that goes in (mm). */
  segments: Record<string, number>;
}

export function measure(scene: THREE.Scene, max = 1500): CollideReport[] {
  scene.updateMatrixWorld(true);
  const parts: THREE.Mesh[] = [];
  scene.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && o.name === 'part') parts.push(o as THREE.Mesh);
  });
  if (!parts.length) return [];
  const solid = worldTriangles(parts);
  const out: CollideReport[] = [];
  scene.traverse((o) => {
    if (!o.name.startsWith('ghost-')) return;
    const pts = samplePoints(o, max);
    let n = 0;
    let deepest = 0;
    const segments: Record<string, number> = {};
    for (const { p, seg } of pts)
      if (inside(solid, p)) {
        n++;
        const d = depth(solid, p);
        deepest = Math.max(deepest, d);
        if (seg) segments[seg] = Math.max(segments[seg] ?? 0, d);
      }
    out.push({
      object: o.name.slice(6),
      samples: pts.length,
      insideShare: pts.length ? n / pts.length : 0,
      maxDepth: deepest,
      segments,
    });
  });
  return out;
}
