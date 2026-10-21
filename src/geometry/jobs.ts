/**
 * Pure job runners shared by the web worker and unit tests.
 */
import type { Kernel, Manifold } from './kernel';
import { scope, toMeshData, type MeshData } from './kernel';
import { BUILDERS } from './families';
import type { FamilyId, Params } from '../families/types';
import type { BuildResult, SectionResult, SplitRequest } from './protocol';
import { splitPart } from './split';
import { TEST_BAR } from '../strength/calibration';

export function buildManifold(K: Kernel, familyId: FamilyId, params: Params): Manifold {
  const b = BUILDERS[familyId];
  if (!b) throw new Error(`No geometry for ${familyId}`);
  return b.build(K, params);
}

export function runBuild(
  K: Kernel,
  familyId: FamilyId,
  params: Params,
  split?: SplitRequest | null,
): BuildResult {
  const t0 = performance.now();
  return scope(() => {
    const m = buildManifold(K, familyId, params);
    if (m.status() !== 'NoError') throw new Error(`Geometry error: ${m.status()}`);
    const mesh = toMeshData(m, 'part');
    const pieces: MeshData[] = [];
    if (split) {
      const [a, b] = splitPart(K, m, split);
      pieces.push(toMeshData(a, 'piece-1'), toMeshData(b, 'piece-2'));
    }
    return { mesh, pieces, volume: m.volume(), surfaceArea: m.surfaceArea(), ms: performance.now() - t0 };
  });
}

export function runFitTest(K: Kernel, familyId: FamilyId, params: Params): MeshData {
  return scope(() => toMeshData(BUILDERS[familyId]!.fitTest(K, params), 'fit-test'));
}

/** Slice perpendicular to `axis` at `offset` and split the section into shell and infill regions. */
export function runSection(
  K: Kernel,
  familyId: FamilyId,
  params: Params,
  axis: 'x' | 'y' | 'z',
  offset: number,
  shellT: number,
): SectionResult {
  return scope(() => {
    let m = buildManifold(K, familyId, params);
    // Rotate so the slicing axis becomes Z; keep in-plane axes consistent with the viewer.
    if (axis === 'x') m = m.rotate([0, 90, 0]);
    if (axis === 'y') m = m.rotate([-90, 0, 0]);
    const z = axis === 'x' ? -offset : offset;
    const cs = m.slice(z);
    const inner = cs.offset(-shellT, 'Miter');
    return {
      outer: cs.toPolygons() as [number, number][][],
      inner: inner.toPolygons() as [number, number][][],
      area: cs.area(),
    };
  });
}

/** Calibration test bar: 80 × 10 × 4 mm with an engraved clamp line and a hanging hole. */
export function runBar(K: Kernel): MeshData {
  return scope(() => {
    const { Manifold } = K;
    let bar = Manifold.cube([TEST_BAR.length, TEST_BAR.width, TEST_BAR.thickness]);
    const groove = Manifold.cube([0.6, TEST_BAR.width + 2, 0.4]).translate([
      TEST_BAR.clamp - 0.3,
      -1,
      TEST_BAR.thickness - 0.4,
    ]);
    const hole = Manifold.cylinder(TEST_BAR.thickness + 2, 1.6, 1.6, 24).translate([
      TEST_BAR.clamp + TEST_BAR.arm,
      TEST_BAR.width / 2,
      -1,
    ]);
    bar = bar.subtract(groove).subtract(hole);
    return toMeshData(bar, 'test-bar');
  });
}
