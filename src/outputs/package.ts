import { zipSync, strToU8 } from 'fflate';
import { disclaimers } from '../content/disclaimers';
import type { OutputContext } from './context';
import { baseName } from './names';
import { orientMesh, toBinarySTL } from './stl';
import { toThreeMF } from './threemf';
import { toSvgDocument } from './svg/render';
import { toDXF } from './dxf';
import {
  drawingPdf,
  gaugesPdf,
  mountingPdf,
  netPdf,
  printSheetPdf,
  requestSheetPdf,
  templatePdf,
} from './pdf/sheets';
import type { MeshData } from '../geometry/kernel';
import { translateShapes, shapeBounds, type Shape } from './svg/ir';
import { flatten } from './svg/render';

export interface OutputFile {
  name: string;
  /** Short label for the UI. */
  label: string;
  kind: '3d' | 'drawing' | 'template' | 'sheet' | 'extra';
  mime: string;
  make: () => Uint8Array<ArrayBuffer> | string | null;
}

/** All views of a drawing laid out side by side for SVG/DXF (true scale). */
export function drawingShapes(ctx: OutputContext): Shape[] {
  const out: Shape[] = [];
  let x = 0;
  for (const v of ctx.family.drawing(ctx.params).views) {
    const flat = flatten(v.shapes);
    const b = shapeBounds(flat);
    out.push(...translateShapes(flat, x - b.minX, -b.maxY), {
      kind: 'text',
      at: [x, 8],
      text: v.name,
      size: 4,
      anchor: 'start',
      bold: true,
    });
    x += b.maxX - b.minX + 25;
  }
  return out;
}

export function templateShapes(ctx: OutputContext): Shape[] {
  const out: Shape[] = [];
  let y = 0;
  for (const item of ctx.family.template(ctx.params).items) {
    const flat = flatten(item.shapes);
    const b = shapeBounds(flat);
    out.push(
      { kind: 'text', at: [0, y + 6], text: item.title, size: 4, anchor: 'start', bold: true },
      ...translateShapes(flat, -b.minX, y - b.maxY),
    );
    y -= b.maxY - b.minY + 20;
  }
  return out;
}

/** Every file the "Get files" tab offers, generated from parameters (+ the built mesh for 3D files). */
export function outputFiles(ctx: OutputContext, fitTest: MeshData | null): OutputFile[] {
  const name = baseName(ctx.family, ctx.params);
  const rot = ctx.analysis.orientation.candidate.rotation;
  const meshes = ctx.build ? (ctx.build.pieces.length ? ctx.build.pieces : [ctx.build.mesh]) : [];
  const meta = {
    Title: `${ctx.family.id} ${ctx.family.name}`,
    Designer: 'Everyday Leverage',
    Description: ctx.family.blurb,
    'everyday-leverage:family': ctx.family.id,
    'everyday-leverage:params': JSON.stringify(ctx.params),
    'everyday-leverage:settings': JSON.stringify(ctx.analysis.print),
    'everyday-leverage:orientation': ctx.analysis.orientation.candidate.label,
    CreationDate: ctx.date,
  };
  const files: OutputFile[] = [];
  meshes.forEach((m, i) =>
    files.push({
      name: `${name}${meshes.length > 1 ? `-part${i + 1}` : ''}.stl`,
      label: meshes.length > 1 ? `STL, part ${i + 1}` : 'STL',
      kind: '3d',
      mime: 'model/stl',
      make: () => toBinarySTL(orientMesh(m, rot), `${ctx.family.id} ${m.name}`),
    }),
  );
  if (meshes.length)
    files.push({
      name: `${name}.3mf`,
      label: '3MF (with settings)',
      kind: '3d',
      mime: 'model/3mf',
      make: () =>
        toThreeMF(
          meshes.map((m) => orientMesh(m, rot)),
          meta,
        ),
    });
  if (fitTest)
    files.push({
      name: `${name}-fit-test.stl`,
      label: 'Fit-test mini-print',
      kind: '3d',
      mime: 'model/stl',
      make: () => toBinarySTL(orientMesh(fitTest, [0, 0, 0]), 'fit test'),
    });
  files.push(
    {
      name: `${name}-drawing.pdf`,
      label: 'Dimensioned drawing (PDF)',
      kind: 'drawing',
      mime: 'application/pdf',
      make: () => drawingPdf(ctx),
    },
    {
      name: `${name}-drawing.svg`,
      label: 'Drawing (SVG)',
      kind: 'drawing',
      mime: 'image/svg+xml',
      make: () =>
        toSvgDocument(drawingShapes(ctx), { title: `${ctx.family.id} ${ctx.family.name} — mm, 1:1` }),
    },
    {
      name: `${name}-template-${ctx.paper}.pdf`,
      label: '1:1 fit-check template (PDF)',
      kind: 'template',
      mime: 'application/pdf',
      make: () => templatePdf(ctx),
    },
    {
      name: `${name}-template.svg`,
      label: 'Template (SVG)',
      kind: 'template',
      mime: 'image/svg+xml',
      make: () =>
        toSvgDocument(templateShapes(ctx), { title: 'Fit-check template (1:1)', scaleSquare: true }),
    },
    {
      name: `${name}-print-sheet.pdf`,
      label: 'Print sheet (PDF)',
      kind: 'sheet',
      mime: 'application/pdf',
      make: () => printSheetPdf(ctx),
    },
    {
      name: `${name}-request-a-print.pdf`,
      label: 'Request-a-print sheet (PDF)',
      kind: 'sheet',
      mime: 'application/pdf',
      make: () => requestSheetPdf(ctx),
    },
    {
      name: `${name}-outlines.dxf`,
      label: 'Outlines for CAD / laser (DXF)',
      kind: 'extra',
      mime: 'application/dxf',
      make: () => toDXF([...drawingShapes(ctx), ...translateShapes(templateShapes(ctx), 0, -400)]),
    },
  );
  if (ctx.family.net)
    files.push({
      name: `${name}-size-mockup.pdf`,
      label: 'Foldable size mock-up (PDF)',
      kind: 'extra',
      mime: 'application/pdf',
      make: () => netPdf(ctx),
    });
  if (ctx.family.id === 'B1' && ctx.params.mount === 'wall')
    files.push({
      name: `${name}-mounting-template.pdf`,
      label: 'Mounting template (PDF)',
      kind: 'extra',
      mime: 'application/pdf',
      make: () => mountingPdf(ctx),
    });
  files.push({
    name: `measuring-gauges-${ctx.paper}.pdf`,
    label: 'Measuring gauges (PDF)',
    kind: 'extra',
    mime: 'application/pdf',
    make: () => gaugesPdf(ctx.paper),
  });
  return files;
}

/** One zip with everything plus a README. */
export function packageZip(ctx: OutputContext, files: OutputFile[]): Uint8Array<ArrayBuffer> {
  const entries: Record<string, Uint8Array> = {};
  for (const f of files) {
    const data = f.make();
    if (data === null) continue;
    entries[f.name] = typeof data === 'string' ? strToU8(data) : data;
  }
  const readme = [
    `Everyday Leverage — ${ctx.family.id} ${ctx.family.name}`,
    `Made ${ctx.date}. Part mark: ${ctx.family.stamp(ctx.params)}.`,
    '',
    'Files:',
    ...files.map((f) => `  ${f.name} — ${f.label}`),
    '',
    'Print the fit test first if you can. Print templates at 100% ("Actual size") and check the 25 mm square.',
    ...(ctx.analysis.calibration
      ? [`Strength: calibrated to ${ctx.analysis.calibration.printerName}.`]
      : disclaimers('readmeUncalibrated')),
    ...disclaimers('readme'),
  ].join('\n');
  entries['README.txt'] = strToU8(readme);
  return zipSync(entries, { level: 6 }) as Uint8Array<ArrayBuffer>;
}
