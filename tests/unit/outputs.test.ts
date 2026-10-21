import { beforeAll, describe, expect, it } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { loadKernel, type Kernel } from '../../src/geometry/kernel';
import { runBuild, runFitTest } from '../../src/geometry/jobs';
import { familyList, getFamily } from '../../src/families';
import { analyse } from '../../src/app/analysis';
import type { OutputContext } from '../../src/outputs/context';
import { outputFiles, packageZip } from '../../src/outputs/package';
import { setPdfCompression, mmPt, Sheet } from '../../src/outputs/pdf/base';
import { templatePdf } from '../../src/outputs/pdf/sheets';
import { drawOneToOne } from '../../src/outputs/pdf/tiling';
import { rect } from '../../src/outputs/svg/ir';
import { toSvgDocument } from '../../src/outputs/svg/render';
import { toDXF } from '../../src/outputs/dxf';
import type { AnyFamily, Params } from '../../src/families/types';
import type { Paper } from '../../src/outputs/pdf/base';

let K: Kernel;
beforeAll(async () => {
  K = await loadKernel();
});

function ctxFor(fam: AnyFamily, params: Params, paper: Paper = 'letter'): OutputContext {
  const build = runBuild(K, fam.id, params, fam.splitPlan?.(params) ?? null);
  const b = build.mesh.bbox;
  const analysis = analyse({
    family: fam,
    params,
    use: { level: 'moderate', location: 'kitchen' },
    print: null,
    safetyFactor: 2,
    orientationId: 'auto',
    calibrationFor: () => null,
    geometry: {
      size: [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]],
      volume: build.volume,
      surfaceArea: build.surfaceArea,
      split: build.pieces.length > 0,
    },
  });
  return {
    family: fam,
    params,
    analysis,
    build,
    paper,
    location: 'kitchen',
    wherePrint: 'the library',
    date: '2026-10-21',
    files: [],
  };
}

describe('PDF scale', () => {
  it('mm to points: 25 mm = 70.866 pt', () => {
    expect(mmPt(25)).toBeCloseTo(70.866, 3);
  });
  it('the template PDF contains a 25 mm square of exactly 70.866 pt (Letter and A4)', () => {
    setPdfCompression(false);
    for (const paper of ['letter', 'a4'] as const) {
      const fam = getFamily('A1')!;
      const pdf = new TextDecoder('latin1').decode(templatePdf(ctxFor(fam, fam.defaults, paper)));
      expect(pdf).toMatch(/70\.8661\d* -70\.8661\d* re/);
    }
    setPdfCompression(true);
  });
  it('tiles oversize content with a page map', () => {
    const sheet = new Sheet('letter', 'tile test');
    const tiles = drawOneToOne(sheet, [rect(0, 0, 400, 300)], 'Big');
    expect(tiles).toBeGreaterThan(2);
    expect(sheet.doc.getNumberOfPages()).toBe(tiles + 1);
  });
  it('small content stays on one page', () => {
    const sheet = new Sheet('a4', 'small');
    expect(drawOneToOne(sheet, [rect(0, 0, 50, 50)], 'Small')).toBe(1);
    expect(sheet.doc.getNumberOfPages()).toBe(1);
  });
});

describe('SVG and DXF', () => {
  it('SVG is in millimetres with a scale square', () => {
    const svg = toSvgDocument([rect(0, 0, 40, 20)], { scaleSquare: true, title: 'x' });
    expect(svg).toMatch(/width="[\d.]+mm"/);
    expect(svg).toContain('width="25" height="25"');
  });
  it('DXF has entities and ends with EOF', () => {
    const dxf = toDXF([rect(0, 0, 10, 10), { kind: 'circle', c: [0, 0], r: 5 }]);
    expect(dxf).toContain('LINE');
    expect(dxf).toContain('CIRCLE');
    expect(dxf.trim().endsWith('EOF')).toBe(true);
  });
});

describe.each(familyList().map((f) => [f.id, f] as const))('outputs for %s', (_id, fam) => {
  it('every file generates and the package zips them all', () => {
    const ctx = ctxFor(fam, fam.defaults);
    const files = outputFiles(ctx, runFitTest(K, fam.id, fam.defaults));
    ctx.files = files.map((f) => f.name);
    for (const f of files) {
      const data = f.make();
      expect(data, f.name).not.toBeNull();
      expect((data as Uint8Array | string).length, f.name).toBeGreaterThan(100);
    }
    const zip = unzipSync(packageZip(ctx, files));
    expect(Object.keys(zip)).toContain('README.txt');
    expect(Object.keys(zip).length).toBe(files.length + 1);
    const tmf = files.find((f) => f.name.endsWith('.3mf'))!;
    const inner = unzipSync(tmf.make() as Uint8Array);
    expect(strFromU8(inner['3D/3dmodel.model'])).toContain('unit="millimeter"');
    expect(strFromU8(inner['3D/3dmodel.model'])).toContain(`everyday-leverage:family">${fam.id}`);
  });
});
