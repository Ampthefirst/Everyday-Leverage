import type { OutputContext } from '../context';
import { disclaimer, disclaimers, showDisclaimers } from '../../content/disclaimers';
import { PT_PER_MM, fmt } from '../../types/units';
import { flatten } from '../svg/render';
import { shapeBounds } from '../svg/ir';
import { Sheet, PAPER_LABEL } from './base';
import { drawOneToOne } from './tiling';
import { LEVEL_LABEL } from '../../strength/evaluate';
import { badgeText } from '../../strength/calibration';
import { displayLoad } from '../../strength/loads';
import { heatWarnings } from '../../print/settings';
import { formatDuration } from '../../print/estimates';
import { lidGauge, shaftGauge } from '../svg/gauges';
import { mountingTemplate } from '../svg/mounting';
import type { B1P } from '../../families/b1';
import type { FieldDef, Params } from '../../families/types';

const SUPPORT_TEXT = {
  none: 'No supports needed',
  minimal: 'A few supports (touching build plate only)',
  needed: 'Supports needed',
} as const;

function fieldValue(f: FieldDef<Params>, p: Params): string {
  const v = p[f.key];
  if (f.kind === 'number') return `${fmt(v as number, 2)}${f.unit ? ' ' + f.unit : ''}`;
  if (f.kind === 'choice') return f.options.find((o) => o.value === v)?.label ?? String(v);
  return v ? 'Yes' : 'No';
}

export function paramRows(
  ctx: OutputContext,
  groups: ('fit' | 'style' | 'fine')[] = ['fit', 'style', 'fine'],
): [string, string][] {
  return ctx.family.fields
    .filter((f) => groups.includes(f.group) && (!f.showIf || f.showIf(ctx.params)))
    .map((f) => [f.label, fieldValue(f, ctx.params)]);
}

function verdictTone(level: string) {
  return level === 'comfortable' ? 'ok' : level === 'marginal' ? 'warn' : 'bad';
}

function settingsRows(ctx: OutputContext): [string, string][] {
  const { print, orientation, advice } = ctx.analysis;
  return [
    [
      'Material',
      print.material === advice.settings.material
        ? advice.reasons.material
        : `${print.material} (your choice).`,
    ],
    ['Walls', `${print.walls} (${fmt(print.walls * print.lineWidth, 2)} mm shell)`],
    ['Infill', `${Math.round(print.infill * 100)}% (any pattern; gyroid or grid)`],
    ['Layer height', `${fmt(print.layerHeight, 2)} mm`],
    ['Line width', `${fmt(print.lineWidth, 2)} mm (0.4 mm nozzle)`],
    ['Placement', `${orientation.candidate.label}. ${orientation.candidate.note}`],
    ['Supports', SUPPORT_TEXT[orientation.candidate.supports]],
  ];
}

// ---------------- drawing ----------------

const SCALES = [1, 1 / 1.5, 1 / 2, 1 / 2.5, 1 / 3, 1 / 4, 1 / 5];
const scaleLabel = (s: number) => (s === 1 ? '1:1' : `1:${fmt(1 / s, 1)}`);

export function drawingPdf(ctx: OutputContext): Uint8Array<ArrayBuffer> {
  const { family, params } = ctx;
  const spec = family.drawing(params);
  const sheet = new Sheet(ctx.paper, `${family.id} ${family.name} — drawing`, 'landscape');
  const doc = sheet.doc;
  // Layout: views on the left 2/3, tables on the right 1/3.
  const areaW = sheet.contentW * 0.64;
  const areaH = sheet.h - 2 * sheet.margin - 40;
  const views = spec.views.map((v) => ({ ...v, flat: flatten(v.shapes) }));
  const bounds = views.map((v) => shapeBounds(v.flat));
  const cols = views.length > 2 ? 2 : views.length;
  const rows = Math.ceil(views.length / cols);
  const cellW = areaW / cols;
  const cellH = areaH / rows;
  // Each view gets the largest standard scale that fits its cell (noted under the view name).
  const scaleFor = (b: (typeof bounds)[number]) => {
    const fit = (s: number) =>
      (b.maxX - b.minX + 12) * s * PT_PER_MM <= cellW - 10 &&
      (b.maxY - b.minY + 12) * s * PT_PER_MM <= cellH - 30;
    return (
      SCALES.find(fit) ??
      Math.min(
        (cellW - 10) / ((b.maxX - b.minX + 12) * PT_PER_MM),
        (cellH - 30) / ((b.maxY - b.minY + 12) * PT_PER_MM),
      )
    );
  };
  sheet.heading(`${family.id} ${family.name}`, 16);
  views.forEach((v, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x0 = sheet.margin + c * cellW;
    const y0 = sheet.y + r * cellH;
    const b = bounds[i];
    const scale = scaleFor(b);
    const wPt = (b.maxX - b.minX) * scale * PT_PER_MM;
    const hPt = (b.maxY - b.minY) * scale * PT_PER_MM;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(v.name, x0 + 4, y0 + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Scale ${scaleLabel(scale)}${v.caption ? ` · ${v.caption}` : ''}`, x0 + 4, y0 + 20);
    sheet.shapes(v.flat, x0 + (cellW - wPt) / 2, y0 + 28 + (cellH - 28 - hPt) / 2, scale * PT_PER_MM, b);
  });
  // Right column: tables and title block.
  const tx = sheet.margin + areaW + 10;
  const tw = sheet.contentW - areaW - 10;
  sheet.y = sheet.margin + 26;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Key dimensions', tx, sheet.y);
  sheet.y += 6;
  sheet.table(
    spec.keyDims.map((d) => [d.label, `${d.value}${d.tol ? `  (${d.tol})` : ''}`]),
    { x: tx, width: tw, size: 8.5, col1: tw * 0.45 },
  );
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Parameters', tx, sheet.y + 4);
  sheet.y += 10;
  sheet.table(paramRows(ctx), { x: tx, width: tw, size: 8, col1: tw * 0.55 });
  // Title block (bottom right).
  const bh = 64;
  const by = sheet.h - sheet.margin - bh - 14;
  doc.setLineWidth(1);
  doc.setLineDashPattern([], 0);
  doc.rect(tx, by, tw, bh);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`${family.id} ${family.name}`, tx + 6, by + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const lines = [
    `Part mark ${family.stamp(params)} · ${PAPER_LABEL[ctx.paper]} · scales per view`,
    'Units mm · general tolerance ±0.5 mm',
    `From the design parameters · ${ctx.date}`,
    ...spec.notes.slice(0, 1),
  ];
  let ly = by + 27;
  for (const l of lines) {
    const wrapped = doc.splitTextToSize(l, tw - 12) as string[];
    for (const w of wrapped.slice(0, 2)) {
      if (ly < by + bh - 4) doc.text(w, tx + 6, ly);
      ly += 9.5;
    }
  }
  sheet.footer();
  return sheet.bytes();
}

// ---------------- 1:1 template ----------------

export function templatePdf(ctx: OutputContext): Uint8Array<ArrayBuffer> {
  const { family, params } = ctx;
  const spec = family.template(params);
  const sheet = new Sheet(ctx.paper, `${family.id} ${family.name} — fit-check template`);
  sheet.heading('Fit-check template (1:1)');
  sheet.para(
    `For the ${family.name}. Print on ${PAPER_LABEL[ctx.paper]} at 100% ("Actual size"), then check the square below with a ruler before using any shape.`,
  );
  sheet.scaleSquare();
  for (const item of spec.items) {
    sheet.ensure(60);
    sheet.para(item.title, 12, { bold: true });
    sheet.para(item.instruction, 10);
    drawOneToOne(sheet, item.shapes, item.title);
  }
  sheet.footer(
    'Everyday Leverage fit-check template — paper only, not a functional part. Check the 25 mm square first.',
  );
  return sheet.bytes();
}

// ---------------- foldable net ----------------

export function netPdf(ctx: OutputContext): Uint8Array<ArrayBuffer> | null {
  const net = ctx.family.net?.(ctx.params);
  if (!net) return null;
  const sheet = new Sheet(ctx.paper, `${ctx.family.id} size mock-up`);
  sheet.heading('Size mock-up — not a functional part');
  sheet.para(net.instruction);
  sheet.para('Solid lines: cut. Blue dashed lines: fold. Print at 100%.', 10);
  sheet.scaleSquare();
  drawOneToOne(sheet, net.shapes, net.title);
  sheet.footer('Size mock-up only — paper cannot carry load. Not a functional part.');
  return sheet.bytes();
}

// ---------------- gauges ----------------

export function gaugesPdf(paper: OutputContext['paper']): Uint8Array<ArrayBuffer> {
  const sheet = new Sheet(paper, 'Measuring gauges');
  sheet.heading('Measuring gauges (1:1)');
  sheet.para('Print at 100% and check the square. Glue to card for a stiffer gauge.');
  sheet.scaleSquare();
  sheet.para('Lid-diameter gauge', 12, { bold: true });
  drawOneToOne(sheet, lidGauge(), 'Lid gauge');
  sheet.para('Shaft-size gauge', 12, { bold: true });
  drawOneToOne(sheet, shaftGauge(), 'Shaft gauge');
  sheet.footer('Everyday Leverage measuring gauges — check the 25 mm square first.');
  return sheet.bytes();
}

// ---------------- mounting template (B1 wall) ----------------

export function mountingPdf(ctx: OutputContext): Uint8Array<ArrayBuffer> | null {
  if (ctx.family.id !== 'B1' || ctx.params.mount !== 'wall') return null;
  const sheet = new Sheet(ctx.paper, 'B1 mounting template');
  sheet.heading('Mounting template (1:1)');
  sheet.para(
    'Tape this under the shelf or cupboard with the V opening facing you. Mark the two screw positions, then drill 3 mm pilot holes. Use 4 mm countersunk wood screws into solid wood.',
  );
  sheet.scaleSquare();
  drawOneToOne(sheet, mountingTemplate(ctx.params as unknown as B1P), 'Mounting template');
  sheet.footer();
  return sheet.bytes();
}

// ---------------- print sheet ----------------

export function printSheetPdf(ctx: OutputContext): Uint8Array<ArrayBuffer> {
  const { family, params, analysis } = ctx;
  const v = analysis.verdict;
  const sheet = new Sheet(ctx.paper, `${family.id} ${family.name} — print sheet`);
  sheet.heading(`${family.id} ${family.name}: print sheet`);
  sheet.para(`${family.blurb} Part mark: ${family.stamp(params)}. Made ${ctx.date}.`, 10);
  sheet.para('Strength estimate', 13, { bold: true });
  sheet.badge(
    `${LEVEL_LABEL[v.level]} — ${Math.round(v.utilization * 100)}% of strength budget`,
    verdictTone(v.level),
  );
  if (showDisclaimers())
    sheet.badge(
      badgeText(analysis.calibration, analysis.print.material),
      analysis.calibration ? 'ok' : 'warn',
    );
  const lc = displayLoad(v.loadCase);
  sheet.para(
    `${v.reason} Load: ${v.loadCase.label.toLowerCase()} = ${fmt(lc.value, 2)} ${lc.unit}${v.loadCase.assumed ? ' (assumed typical value)' : ''}, safety factor ${fmt(v.safetyFactor)}.`,
    10,
  );
  const est = disclaimer('sheetEstimate');
  if (!analysis.calibration && est) sheet.para(est, 9, { color: [120, 60, 0] });
  sheet.para('Printer settings', 13, { bold: true });
  sheet.table(settingsRows(ctx));
  if (analysis.estimate) {
    sheet.table([
      [
        'Filament (rough)',
        `${fmt(analysis.estimate.grams, 0)} g, ${fmt(analysis.estimate.metres, 1)} m of 1.75 mm`,
      ],
      ['Print time (rough)', formatDuration(analysis.estimate.minutes)],
      ...(analysis.split
        ? ([['Pieces', 'Printed in 2 parts — glue the dovetail joint (CA or epoxy).']] as [string, string][])
        : []),
    ]);
  }
  sheet.para('Your measurements and choices', 13, { bold: true });
  sheet.table(paramRows(ctx));
  sheet.para('Care and limits', 13, { bold: true });
  sheet.bullet([
    ...heatWarnings(analysis.print.material, ctx.location).map((w) => w.text),
    ...disclaimers('foodSafe'),
    'Check it for cracks or whitening now and then. Reprint if it looks damaged.',
    ...disclaimers('notMedical'),
  ]);
  sheet.footer();
  return sheet.bytes();
}

// ---------------- request-a-print sheet ----------------

export function requestSheetPdf(ctx: OutputContext): Uint8Array<ArrayBuffer> {
  const { family, params, analysis } = ctx;
  const sheet = new Sheet(ctx.paper, 'Request a 3D print');
  sheet.heading('Request a 3D print');
  sheet.para(
    `Hello! I would like to have a small part 3D printed. It is a ${family.name.toLowerCase()} — ${family.blurb.charAt(0).toLowerCase()}${family.blurb.slice(1)}`,
    11,
  );
  sheet.para(
    `Many schools, libraries and makerspaces offer 3D printing. Where I hope to print: ${ctx.wherePrint}.`,
    11,
  );
  sheet.para('What to print', 13, { bold: true });
  sheet.bullet([
    ...ctx.files
      .filter((f) => /\.(stl|3mf)$/i.test(f))
      .map(
        (f) => `${f}${/fit-test/.test(f) ? ' — a quick test piece; please print this first if you can' : ''}`,
      ),
    'The files are in millimetres and already turned to the recommended placement on the bed.',
  ]);
  sheet.para('Recommended settings', 13, { bold: true });
  sheet.table(settingsRows(ctx));
  if (analysis.estimate)
    sheet.table([
      [
        'Approximate size',
        ctx.build
          ? `${ctx.build.mesh.bbox.max.map((x, i) => Math.round(x - ctx.build!.mesh.bbox.min[i])).join(' × ')} mm`
          : '—',
      ],
      ['Approximate filament', `${fmt(analysis.estimate.grams, 0)} g`],
      ['Approximate time', formatDuration(analysis.estimate.minutes)],
      [
        'Fits a 256 × 256 mm bed',
        analysis.bed?.fits
          ? analysis.bed.placement === 'diagonal'
            ? 'Yes, placed diagonally'
            : 'Yes'
          : analysis.split
            ? 'Printed in 2 parts'
            : 'Check',
      ],
    ]);
  const about = analysis.calibration
    ? `The strength estimate was calibrated with test bars printed on "${analysis.calibration.printerName}". The calibration applies only to that printer; on another printer the result is an estimate.`
    : disclaimer('requestUncalibrated');
  if (about) {
    sheet.para('About the strength numbers', 13, { bold: true });
    sheet.para(about, 10);
  }
  sheet.para('Contact', 13, { bold: true });
  sheet.blank('Name');
  sheet.blank('How to reach me');
  sheet.blank('Where to print', ctx.wherePrint);
  sheet.blank('Date needed');
  sheet.para(`Part mark on the print: ${family.stamp(params)}. Thank you!`, 10);
  sheet.footer();
  return sheet.bytes();
}
