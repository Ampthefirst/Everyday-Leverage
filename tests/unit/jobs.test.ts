import { beforeAll, describe, expect, it } from 'vitest';
import { loadKernel, type Kernel } from '../../src/geometry/kernel';
import { runBar, runBuild, runFitTest, runSection } from '../../src/geometry/jobs';
import { getFamily } from '../../src/families';
import { splitPlanFor } from '../../src/geometry/splitPlan';
import { checkBedFit } from '../../src/print/bedfit';
import type { Params } from '../../src/families/types';
import { toBinarySTL, orientMesh } from '../../src/outputs/stl';
import { TEST_BAR } from '../../src/strength/calibration';

let K: Kernel;
beforeAll(async () => {
  K = await loadKernel();
});

describe('worker jobs', () => {
  it('builds a part and reports volume and area', () => {
    const fam = getFamily('B1')!;
    const r = runBuild(K, 'B1', fam.defaults);
    expect(r.volume).toBeGreaterThan(1000);
    expect(r.surfaceArea).toBeGreaterThan(100);
    expect(r.mesh.indices.length % 3).toBe(0);
    expect(r.pieces.length).toBe(0);
  });

  it('auto-splits an oversize C3 into two pieces that each fit the bed', () => {
    const fam = getFamily('C3')!;
    const p = fam.repair({ ...fam.defaults, extension: 330, hook: true } as Params);
    const plan = splitPlanFor(fam, p);
    expect(plan).not.toBeNull();
    const r = runBuild(K, 'C3', p, plan);
    expect(r.pieces.length).toBe(2);
    for (const piece of r.pieces) {
      const s = [0, 1, 2].map((i) => piece.bbox.max[i] - piece.bbox.min[i]);
      // printed on its side: X and Z on the bed, Y up
      expect(checkBedFit([s[0], s[2], s[1]]).fits).toBe(true);
    }
    expect(r.pieces[0].volume + r.pieces[1].volume).toBeGreaterThan(r.volume * 0.95);
  });

  it('short C3 does not split', () => {
    const fam = getFamily('C3')!;
    expect(splitPlanFor(fam, { ...fam.defaults, extension: 100 } as Params)).toBeNull();
  });

  it('cross-section returns shell and infill regions', () => {
    const fam = getFamily('A1')!;
    const s = runSection(K, 'A1', fam.defaults, 'z', 50, 1.8);
    expect(s.outer.length).toBeGreaterThan(0);
    expect(s.inner.length).toBeGreaterThan(0);
    expect(s.area).toBeGreaterThan(100);
  });

  it('fit test and calibration bar', () => {
    const fam = getFamily('B3')!;
    expect(runFitTest(K, 'B3', fam.defaults).volume).toBeGreaterThan(0);
    const bar = runBar(K);
    const size = [0, 1, 2].map((i) => bar.bbox.max[i] - bar.bbox.min[i]);
    expect(size[0]).toBeCloseTo(TEST_BAR.length, 1);
    expect(size[1]).toBeCloseTo(TEST_BAR.width, 1);
    expect(size[2]).toBeCloseTo(TEST_BAR.thickness, 1);
  });

  it('writes a valid binary STL in print orientation', () => {
    const fam = getFamily('A1')!;
    const r = runBuild(K, 'A1', fam.defaults);
    const m = orientMesh(r.mesh, [90, 0, 0]);
    expect(m.bbox.min[2]).toBeCloseTo(0, 5);
    const stl = toBinarySTL(m);
    const tris = r.mesh.indices.length / 3;
    expect(stl.byteLength).toBe(84 + tris * 50);
    expect(new DataView(stl.buffer).getUint32(80, true)).toBe(tris);
  });
});
