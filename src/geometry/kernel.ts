/**
 * Loads the manifold-3d WASM kernel and adds simple scoped garbage collection: every Manifold or
 * CrossSection created inside `scope()` is deleted when it ends, except the ones passed to `keep()`.
 */
import Module from 'manifold-3d';
import type { ManifoldToplevel, Manifold, CrossSection } from 'manifold-3d';

export type Kernel = ManifoldToplevel;
export type { Manifold, CrossSection };

let kernelPromise: Promise<Kernel> | null = null;

const registry: { delete(): void }[] = [];
const kept = new Set<object>();

function track<T>(v: T): T {
  if (Array.isArray(v)) v.forEach((x) => track(x));
  else if (v && typeof v === 'object' && 'delete' in v) registry.push(v as { delete(): void });
  return v;
}

function wrap(target: Record<string, unknown>, names: string[]) {
  for (const n of names) {
    const fn = target[n];
    if (typeof fn !== 'function') continue;
    target[n] = function (this: unknown, ...args: unknown[]) {
      return track((fn as (...a: unknown[]) => unknown).apply(this, args));
    };
  }
}

const M_STATIC = [
  'cube',
  'cylinder',
  'sphere',
  'tetrahedron',
  'extrude',
  'revolve',
  'compose',
  'union',
  'difference',
  'intersection',
  'levelSet',
  'smooth',
  'ofMesh',
  'hull',
];
const M_MEMBER = [
  'add',
  'subtract',
  'intersect',
  'decompose',
  'warp',
  'warpBatch',
  'transform',
  'translate',
  'rotate',
  'scale',
  'mirror',
  'calculateNormals',
  'smoothOut',
  'refine',
  'refineToLength',
  'setProperties',
  'setTolerance',
  'simplify',
  'asOriginal',
  'trimByPlane',
  'split',
  'splitByPlane',
  'slice',
  'project',
  'hull',
  'minkowskiSum',
];
const C_STATIC = ['square', 'circle', 'union', 'difference', 'intersection', 'compose', 'ofPolygons', 'hull'];
const C_MEMBER = [
  'add',
  'subtract',
  'intersect',
  'rectClip',
  'decompose',
  'transform',
  'translate',
  'rotate',
  'scale',
  'mirror',
  'simplify',
  'offset',
  'hull',
  'extrude',
  'revolve',
  'warp',
];

export function loadKernel(locateFile?: (path: string) => string): Promise<Kernel> {
  if (!kernelPromise) {
    kernelPromise = (async () => {
      const k = (await Module(
        locateFile ? { locateFile: () => locateFile('manifold.wasm') } : undefined,
      )) as Kernel;
      k.setup();
      wrap(k.Manifold as unknown as Record<string, unknown>, M_STATIC);
      wrap(k.Manifold.prototype as unknown as Record<string, unknown>, M_MEMBER);
      wrap(k.CrossSection as unknown as Record<string, unknown>, C_STATIC);
      wrap(k.CrossSection.prototype as unknown as Record<string, unknown>, C_MEMBER);
      k.setMinCircularAngle(6);
      k.setMinCircularEdgeLength(0.6);
      return k;
    })();
  }
  return kernelPromise;
}

/** Mark an object to survive the current scope. */
export function keep<T extends object>(o: T): T {
  kept.add(o);
  return o;
}

export function release(o: { delete(): void } | null | undefined) {
  if (!o) return;
  kept.delete(o);
  o.delete();
}

/** Run fn and free every kernel object it created (except kept ones). */
export function scope<T>(fn: () => T): T {
  const start = registry.length;
  try {
    return fn();
  } finally {
    const created = registry.splice(start);
    for (const o of created) {
      if (kept.has(o)) continue;
      try {
        o.delete();
      } catch {
        // already deleted
      }
    }
  }
}

export interface MeshData {
  name: string;
  positions: Float32Array;
  indices: Uint32Array;
  bbox: { min: [number, number, number]; max: [number, number, number] };
  volume: number;
}

export function toMeshData(m: Manifold, name = 'part'): MeshData {
  const mesh = m.getMesh();
  const np = mesh.numProp;
  const n = mesh.vertProperties.length / np;
  const positions = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    positions[i * 3] = mesh.vertProperties[i * np];
    positions[i * 3 + 1] = mesh.vertProperties[i * np + 1];
    positions[i * 3 + 2] = mesh.vertProperties[i * np + 2];
  }
  const bb = m.boundingBox();
  return {
    name,
    positions,
    indices: new Uint32Array(mesh.triVerts),
    bbox: { min: [bb.min[0], bb.min[1], bb.min[2]], max: [bb.max[0], bb.max[1], bb.max[2]] },
    volume: m.volume(),
  };
}
