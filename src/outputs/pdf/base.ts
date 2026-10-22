import { jsPDF } from 'jspdf';
import { disclaimer } from '../../content/disclaimers';
import type { Vec2 } from '../../types/geom';
import { PT_PER_MM } from '../../types/units';
import { flatten, STYLES } from '../svg/render';
import { shapeBounds, type Bounds, type Shape } from '../svg/ir';

export type Paper = 'letter' | 'a4';
export const PAPER_PT: Record<Paper, [number, number]> = { letter: [612, 792], a4: [595.28, 841.89] };
export const PAPER_LABEL: Record<Paper, string> = { letter: 'US Letter', a4: 'A4' };
/** 1 mm in PDF points. The 25 mm check square must be exactly 70.866 pt. */
export const mmPt = (mm: number) => mm * PT_PER_MM;

const MARGIN = 36; // 0.5 inch
let COMPRESS = true;
/** Tests turn compression off to read the content streams. */
export const setPdfCompression = (on: boolean) => {
  COMPRESS = on;
};

export class Sheet {
  doc: jsPDF;
  paper: Paper;
  w: number;
  h: number;
  y = MARGIN;
  margin = MARGIN;
  title: string;

  constructor(paper: Paper, title: string, orientation: 'portrait' | 'landscape' = 'portrait') {
    this.paper = paper;
    this.title = title;
    this.doc = new jsPDF({ unit: 'pt', format: paper, orientation, compress: COMPRESS });
    this.doc.setProperties({ title, creator: 'Everyday Leverage', subject: title });
    this.w = this.doc.internal.pageSize.getWidth();
    this.h = this.doc.internal.pageSize.getHeight();
    this.doc.setFont('helvetica', 'normal');
  }

  get contentW() {
    return this.w - 2 * this.margin;
  }
  get bottom() {
    return this.h - this.margin - 18;
  }

  newPage() {
    this.doc.addPage(this.paper, this.w > this.h ? 'landscape' : 'portrait');
    this.y = this.margin;
  }

  ensure(space: number) {
    if (this.y + space > this.bottom) this.newPage();
  }

  heading(text: string, size = 18) {
    this.ensure(size + 10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(size);
    this.doc.setTextColor(0);
    this.doc.text(text, this.margin, this.y + size);
    this.y += size + 8;
    this.doc.setFont('helvetica', 'normal');
  }

  para(
    text: string,
    size = 10.5,
    opts: { bold?: boolean; color?: [number, number, number]; indent?: number } = {},
  ) {
    this.doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    this.doc.setFontSize(size);
    this.doc.setTextColor(...(opts.color ?? [0, 0, 0]));
    const lines = this.doc.splitTextToSize(text, this.contentW - (opts.indent ?? 0)) as string[];
    for (const l of lines) {
      this.ensure(size * 1.35);
      this.doc.text(l, this.margin + (opts.indent ?? 0), this.y + size);
      this.y += size * 1.35;
    }
    this.y += 3;
    this.doc.setTextColor(0);
    this.doc.setFont('helvetica', 'normal');
  }

  bullet(items: string[], size = 10.5) {
    for (const it of items) {
      this.doc.setFontSize(size);
      const lines = this.doc.splitTextToSize(it, this.contentW - 14) as string[];
      lines.forEach((l, i) => {
        this.ensure(size * 1.35);
        if (i === 0) this.doc.text('•', this.margin + 2, this.y + size);
        this.doc.text(l, this.margin + 14, this.y + size);
        this.y += size * 1.35;
      });
    }
    this.y += 3;
  }

  /** Coloured label box, e.g. the strength badge. */
  badge(text: string, tone: 'ok' | 'warn' | 'bad' | 'info') {
    const colors = {
      ok: [21, 128, 61],
      warn: [180, 83, 9],
      bad: [185, 28, 28],
      info: [3, 105, 161],
    } as const;
    const [r, g, b] = colors[tone];
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    const tw = this.doc.getTextWidth(text) + 14;
    this.ensure(22);
    this.doc.setDrawColor(r, g, b);
    this.doc.setLineWidth(1.2);
    this.doc.setLineDashPattern([], 0);
    this.doc.roundedRect(this.margin, this.y, tw, 18, 9, 9, 'S');
    this.doc.setTextColor(r, g, b);
    this.doc.text(text, this.margin + 7, this.y + 12.5);
    this.doc.setTextColor(0);
    this.doc.setFont('helvetica', 'normal');
    this.y += 24;
  }

  table(rows: [string, string][], opts: { col1?: number; size?: number; x?: number; width?: number } = {}) {
    const size = opts.size ?? 10;
    const x = opts.x ?? this.margin;
    const width = opts.width ?? this.contentW;
    const col1 = opts.col1 ?? width * 0.38;
    this.doc.setFontSize(size);
    this.doc.setLineWidth(0.4);
    this.doc.setDrawColor(180);
    this.doc.setLineDashPattern([], 0);
    for (const [k, v] of rows) {
      const lines = this.doc.splitTextToSize(v, width - col1 - 8) as string[];
      const kl = this.doc.splitTextToSize(k, col1 - 8) as string[];
      const hRow = Math.max(lines.length, kl.length) * size * 1.3 + 6;
      this.ensure(hRow);
      this.doc.line(x, this.y, x + width, this.y);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(kl, x + 2, this.y + size + 2);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(lines, x + col1, this.y + size + 2);
      this.y += hRow;
    }
    this.doc.line(x, this.y, x + width, this.y);
    this.doc.setDrawColor(0);
    this.y += 8;
  }

  /** Editable-looking blank line for writing on. */
  blank(label: string, prefill = '') {
    this.ensure(30);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(label, this.margin, this.y + 10);
    this.doc.setFont('helvetica', 'normal');
    if (prefill) this.doc.text(prefill, this.margin + 150, this.y + 10);
    this.doc.setDrawColor(120);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin + 145, this.y + 13, this.w - this.margin, this.y + 13);
    this.doc.setDrawColor(0);
    this.y += 24;
  }

  /** The 25 mm scale-check square with its instruction, drawn at the current y. */
  scaleSquare() {
    const s = mmPt(25);
    this.ensure(s + 12);
    this.doc.setLineWidth(0.8);
    this.doc.setLineDashPattern([], 0);
    this.doc.setDrawColor(0);
    this.doc.rect(this.margin, this.y, s, s);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('This square must measure 25 mm (1 inch = 25.4 mm).', this.margin + s + 10, this.y + 22);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      'Print at 100% / "Actual size" — turn off "Fit to page". Measure before you use it.',
      this.margin + s + 10,
      this.y + 38,
    );
    this.y += s + 12;
  }

  /** Draw shapes (mm, y up) with their bounds' top-left at (x, y) points, at `ptPerMm`. */
  shapes(shapes: Shape[], x: number, y: number, ptPerMm: number, b?: Bounds) {
    const flat = flatten(shapes);
    const bb = b ?? shapeBounds(flat);
    const tx = ([mx, my]: Vec2): Vec2 => [x + (mx - bb.minX) * ptPerMm, y + (bb.maxY - my) * ptPerMm];
    drawShapes(this.doc, flat, tx, ptPerMm);
  }

  footer(note = disclaimer('pdfFooter') ?? 'Everyday Leverage') {
    const n = this.doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setTextColor(90);
      this.doc.text(note, this.margin, this.h - this.margin / 2 - 12);
      this.doc.text(`${this.title} · page ${i} of ${n}`, this.margin, this.h - this.margin / 2 - 2);
      this.doc.setTextColor(0);
    }
  }

  bytes(): Uint8Array<ArrayBuffer> {
    return new Uint8Array(this.doc.output('arraybuffer'));
  }
}

export function drawShapes(doc: jsPDF, shapes: Shape[], tx: (p: Vec2) => Vec2, ptPerMm: number) {
  for (const s of shapes) {
    if (s.kind === 'text') {
      const [x, y] = tx(s.at);
      const size = Math.max(5, (s.size ?? 3.5) * Math.min(PT_PER_MM, Math.max(ptPerMm, 1.6)));
      doc.setFontSize(size);
      doc.setFont('helvetica', s.bold ? 'bold' : 'normal');
      doc.setTextColor(0);
      doc.text(s.text, x, y + size * 0.35, {
        align: (s.anchor === 'start' ? 'left' : s.anchor === 'end' ? 'right' : 'center') as
          'left' | 'right' | 'center',
      });
      continue;
    }
    if (s.kind === 'dim' || s.kind === 'dia') continue;
    const st = STYLES[s.style ?? 'outline'];
    doc.setLineWidth(Math.max(0.35, st.width * PT_PER_MM));
    doc.setLineDashPattern(
      (st.dash ?? []).map((d) => d * PT_PER_MM),
      0,
    );
    const hex = st.color.replace('#', '');
    doc.setDrawColor(
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    );
    const fill = s.kind !== 'arc' ? s.fill : undefined;
    if (fill === 'hatch') doc.setFillColor(205, 205, 205);
    if (fill === 'solid') doc.setFillColor(255, 255, 255);
    const mode = fill === 'hatch' || fill === 'solid' ? 'FD' : 'S';
    if (s.kind === 'circle') {
      const [cx, cy] = tx(s.c);
      doc.circle(cx, cy, s.r * ptPerMm, mode);
    } else {
      let pts: Vec2[];
      let closed = false;
      if (s.kind === 'arc') {
        pts = [];
        const n = Math.max(8, Math.ceil(Math.abs(s.a1 - s.a0) / 6));
        for (let i = 0; i <= n; i++) {
          const a = ((s.a0 + ((s.a1 - s.a0) * i) / n) * Math.PI) / 180;
          pts.push([s.c[0] + s.r * Math.cos(a), s.c[1] + s.r * Math.sin(a)]);
        }
      } else {
        pts = s.pts;
        closed = !!s.closed;
      }
      if (pts.length < 2) continue;
      const P = pts.map(tx);
      const deltas = P.slice(1).map((p, i) => [p[0] - P[i][0], p[1] - P[i][1]] as [number, number]);
      doc.lines(deltas, P[0][0], P[0][1], [1, 1], closed ? mode : 'S', closed);
    }
  }
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(0);
}
