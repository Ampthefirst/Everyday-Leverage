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

/**
 * Surface samples of an object: half its vertices and half points spread over its triangles by area
 * (vertices alone miss the middle of long faces, e.g. a utensil passing right through a sleeve).
 */
function samplePoints(root: THREE.Object3D, max: number): Sample[] {
  const verts: Sample[] = [];
  const tris: { a: THREE.Vector3; b: THREE.Vector3; c: THREE.Vector3; seg: string; area: number }[] = [];
  root.updateWorldMatrix(true, true);
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.visible) return;
    // The see-through hand draws a depth-only copy first; measure only the visible one.
    if ((m.material as THREE.Material & { colorWrite?: boolean }).colorWrite === false) return;
    const a = m.geometry.attributes.position;
    const seg = segmentOf(m);
    const v = (i: number) => new THREE.Vector3().fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld);
    for (let i = 0; i < a.count; i++) verts.push({ p: v(i), seg });
    const idx = m.geometry.index;
    const n = idx ? idx.count : a.count;
    for (let i = 0; i + 2 < n; i += 3) {
      const [ia, ib, ic] = idx ? [idx.getX(i), idx.getX(i + 1), idx.getX(i + 2)] : [i, i + 1, i + 2];
      const t = { a: v(ia), b: v(ib), c: v(ic), seg, area: 0 };
      t.area = new THREE.Triangle(t.a, t.b, t.c).getArea();
      if (t.area > 0) tris.push(t);
    }
  });
  const half = Math.floor(max / 2);
  const pts =
    verts.length <= half
      ? verts
      : Array.from({ length: half }, (_, i) => verts[Math.floor((i * verts.length) / half)]);
  const total = tris.reduce((s, t) => s + t.area, 0);
  if (!total) return pts;
  // Evenly spaced along the cumulative area, with fixed in-triangle positions (repeatable runs).
  let acc = 0;
  let k = 0;
  const need = max - pts.length;
  for (let i = 0; i < need; i++) {
    const target = ((i + 0.5) / need) * total;
    while (k < tris.length - 1 && acc + tris[k].area < target) acc += tris[k++].area;
    const t = tris[k];
    let u = ((i * 0.618034) % 1) * 0.98 + 0.01;
    let w = ((i * 0.754878) % 1) * 0.98 + 0.01;
    if (u + w > 1) [u, w] = [1 - u, 1 - w];
    const p = t.a
      .clone()
      .multiplyScalar(1 - u - w)
      .addScaledVector(t.b, u)
      .addScaledVector(t.c, w);
    pts.push({ p, seg: t.seg });
  }
  return pts;
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
  /** Where the deepest point is (scene frame), to find what it hits. */
  deepestAt?: [number, number, number];
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
    let deepestAt: [number, number, number] | undefined;
    const segments: Record<string, number> = {};
    for (const { p, seg } of pts)
      if (inside(solid, p)) {
        n++;
        const d = depth(solid, p);
        if (d > deepest) [deepest, deepestAt] = [d, [+p.x.toFixed(1), +p.y.toFixed(1), +p.z.toFixed(1)]];
        if (seg) segments[seg] = Math.max(segments[seg] ?? 0, d);
      }
    out.push({
      object: o.name.slice(6),
      samples: pts.length,
      insideShare: pts.length ? n / pts.length : 0,
      maxDepth: deepest,
      segments,
      deepestAt,
    });
  });
  return out;
}
