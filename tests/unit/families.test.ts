import { beforeAll, describe, expect, it } from 'vitest';
import { loadKernel, scope, type Kernel } from '../../src/geometry/kernel';
import { familyList } from '../../src/families';
import { BUILDERS } from '../../src/geometry/families';
import { schemaIssues } from '../../src/families/schema';
import { checkBedFit, rotatedSize } from '../../src/print/bedfit';
import type { AnyFamily, Params } from '../../src/families/types';
import type { Vec3 } from '../../src/types/geom';
import { DEFAULT_PRINT } from '../../src/strength/types';
import { evaluate } from '../../src/strength/evaluate';
import { baseStrength } from '../../src/strength/materials';

let K: Kernel;
beforeAll(async () => {
  K = await loadKernel();
});

function buildAndCheck(fam: AnyFamily, p: Params, label: string) {
  const issues = schemaIssues(fam.schema, p);
  expect(issues, `${fam.id} ${label}: ${JSON.stringify(issues)}`).toEqual([]);
  scope(() => {
    const m = BUILDERS[fam.id]!.build(K, p);
    expect(m.status(), `${fam.id} ${label} status`).toBe('NoError');
    expect(m.volume(), `${fam.id} ${label} volume`).toBeGreaterThan(0);
    expect(m.decompose().length, `${fam.id} ${label} one piece`).toBe(1);
    const bb = m.boundingBox();
    const size: Vec3 = [bb.max[0] - bb.min[0], bb.max[1] - bb.min[1], bb.max[2] - bb.min[2]];
    const fits = fam.orientation(p).candidates.some((c) => checkBedFit(rotatedSize(size, c.rotation)).fits);
    if (!fam.splittable)
      expect(fits, `${fam.id} ${label} fits bed (size ${size.map(Math.round)})`).toBe(true);
    const ft = BUILDERS[fam.id]!.fitTest(K, p);
    expect(ft.status()).toBe('NoError');
    expect(ft.volume()).toBeGreaterThan(0);
  });
  // strength runs and returns finite numbers
  for (const lc of fam.loadCases(p, { level: 'moderate', location: 'kitchen' })) {
    const v = evaluate(
      fam.criticalSections(p, lc, DEFAULT_PRINT),
      {
        print: DEFAULT_PRINT,
        strength: baseStrength('PETG'),
        safetyFactor: 2,
        buildDir: [0, 0, 1],
        split: false,
      },
      lc,
    );
    expect(Number.isFinite(v.utilization), `${fam.id} ${label} utilization`).toBe(true);
  }
  // specs render without throwing
  fam.drawing(p);
  fam.template(p);
  fam.net?.(p);
  fam.ghost(p);
  fam.animation(p);
}

describe.each(familyList().map((f) => [f.id, f] as const))('family %s', (_id, fam) => {
  it('defaults are valid and build', () => buildAndCheck(fam, fam.defaults, 'defaults'));

  it('every preset builds', () => {
    for (const pr of fam.presets)
      buildAndCheck(fam, fam.repair({ ...fam.defaults, ...pr.params } as Params), `preset ${pr.id}`);
  });

  it('every variant builds', () => {
    for (const v of fam.variants)
      buildAndCheck(fam, fam.repair({ ...fam.defaults, ...v.patch } as Params), `variant ${v.id}`);
  });

  it('min and max of every number param build (others repaired)', () => {
    for (const f of fam.fields) {
      if (f.kind !== 'number') continue;
      for (const v of [f.min, f.max]) {
        const p = fam.repair({ ...fam.defaults, [f.key]: v } as Params, f.key);
        expect(p[f.key], `${fam.id} repair kept ${f.key}`).toBe(v);
        buildAndCheck(fam, p, `${f.key}=${v}`);
      }
    }
  });

  it('every choice option builds', () => {
    for (const f of fam.fields) {
      if (f.kind !== 'choice') continue;
      for (const o of f.options)
        buildAndCheck(
          fam,
          fam.repair({ ...fam.defaults, [f.key]: o.value } as Params, f.key),
          `${f.key}=${o.value}`,
        );
    }
  });

  it('constraints reject invalid combinations with a fix message', () => {
    const bad = (fam.invalidExample ?? null) as Params | null;
    if (!bad) return;
    const issues = schemaIssues(fam.schema, { ...fam.defaults, ...bad });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message.length).toBeGreaterThan(10);
  });
});
