import type { Vec2 } from '../../types/geom';
import { PT_PER_MM } from '../../types/units';
import { flatten } from '../svg/render';
import { shapeBounds, type Shape } from '../svg/ir';
import { drawShapes, mmPt, type Sheet } from './base';

export const TILE_OVERLAP = 10; // mm
const HEADER_PT = 70;

/** Space left on the current page for 1:1 content, in mm. */
export function freeArea(sheet: Sheet): { w: number; h: number } {
  return { w: sheet.contentW / PT_PER_MM, h: (sheet.bottom - sheet.y) / PT_PER_MM };
}

export function fullPageArea(sheet: Sheet): { w: number; h: number } {
  return { w: sheet.contentW / PT_PER_MM, h: (sheet.bottom - sheet.margin - HEADER_PT) / PT_PER_MM };
}

/**
 * Draw shapes at exactly 1:1. If they do not fit on one page, split into overlapping tiles with
 * alignment crosses and a page map. Returns the number of tiles used.
 */
export function drawOneToOne(sheet: Sheet, shapes: Shape[], label: string): number {
  const flat = flatten(shapes);
  const b = shapeBounds(flat);
  const pad = 4;
  const W = b.maxX - b.minX + 2 * pad;
  const H = b.maxY - b.minY + 2 * pad;
  const here = freeArea(sheet);
  if (W <= here.w && H <= here.h) {
    sheet.shapes(flat, sheet.margin + mmPt(pad), sheet.y + mmPt(pad), PT_PER_MM, b);
    sheet.y += mmPt(H) + 6;
    return 1;
  }
  const page = fullPageArea(sheet);
  if (W <= page.w && H <= page.h) {
    sheet.newPage();
    sheet.para(`${label} (1:1)`, 11, { bold: true });
    sheet.shapes(flat, sheet.margin + mmPt(pad), sheet.y + mmPt(pad), PT_PER_MM, b);
    sheet.y += mmPt(H) + 6;
    return 1;
  }
  // Tiling.
  const stepX = page.w - TILE_OVERLAP;
  const stepY = page.h - TILE_OVERLAP;
  const cols = Math.ceil((W - TILE_OVERLAP) / stepX);
  const rows = Math.ceil((H - TILE_OVERLAP) / stepY);
  const colName = (c: number) => String.fromCharCode(65 + c);
  // Page map on the current page.
  sheet.ensure(140);
  sheet.para(
    `${label} is larger than one page. It is printed on ${cols * rows} pages (${rows} row${rows > 1 ? 's' : ''} × ${cols} column${cols > 1 ? 's' : ''}). Trim, overlap by ${TILE_OVERLAP} mm so the + marks line up, and tape together. Page map:`,
    10,
  );
  const mapScale = Math.min((sheet.contentW * 0.6) / W, 120 / H);
  const mx = sheet.margin;
  const my = sheet.y;
  drawShapes(
    sheet.doc,
    flat,
    ([x, y]: Vec2): Vec2 => [mx + (x - b.minX + pad) * mapScale, my + (b.maxY - y + pad) * mapScale],
    mapScale,
  );
  sheet.doc.setLineWidth(0.6);
  sheet.doc.setDrawColor(0, 80, 200);
  sheet.doc.setLineDashPattern([], 0);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = mx + c * stepX * mapScale;
      const y = my + r * stepY * mapScale;
      sheet.doc.rect(x, y, page.w * mapScale, page.h * mapScale);
      sheet.doc.setFontSize(9);
      sheet.doc.setTextColor(0, 80, 200);
      sheet.doc.text(`${colName(c)}${r + 1}`, x + 3, y + 10);
    }
  }
  sheet.doc.setTextColor(0);
  sheet.doc.setDrawColor(0);
  sheet.y = my + Math.max(H * mapScale, rows * stepY * mapScale + TILE_OVERLAP * mapScale) + 12;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      sheet.newPage();
      sheet.para(`${label} — tile ${colName(c)}${r + 1} of ${cols * rows} (1:1)`, 11, { bold: true });
      const ox = sheet.margin;
      const oy = sheet.y;
      const x0 = b.minX - pad + c * stepX; // model mm at the tile's left edge
      const y0 = b.maxY + pad - r * stepY; // model mm at the tile's top edge
      const tw = mmPt(page.w);
      const th = mmPt(Math.min(page.h, (sheet.bottom - oy) / PT_PER_MM));
      const doc = sheet.doc;
      doc.saveGraphicsState();
      doc.rect(ox, oy, tw, th, null);
      doc.clip();
      doc.discardPath();
      drawShapes(
        doc,
        flat,
        ([x, y]: Vec2): Vec2 => [ox + (x - x0) * PT_PER_MM, oy + (y0 - y) * PT_PER_MM],
        PT_PER_MM,
      );
      doc.restoreGraphicsState();
      // Tile border and alignment crosses at the overlap lines.
      doc.setLineWidth(0.4);
      doc.setDrawColor(150);
      doc.setLineDashPattern([3, 3], 0);
      doc.rect(ox, oy, tw, th);
      doc.setLineDashPattern([], 0);
      doc.setDrawColor(0, 80, 200);
      const ov = mmPt(TILE_OVERLAP);
      const cross = (x: number, y: number) => {
        doc.line(x - 8, y, x + 8, y);
        doc.line(x, y - 8, x, y + 8);
      };
      for (const x of [ox + ov / 2, ox + tw - ov / 2])
        for (const y of [oy + ov / 2, oy + th - ov / 2]) cross(x, y);
      doc.setDrawColor(0);
      sheet.y = oy + th + 6;
    }
  }
  return cols * rows;
}
