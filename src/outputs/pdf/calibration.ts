import { TEST_BAR, MIN_BREAKS } from '../../strength/calibration';
import { circle, dim, line, rect, text, type Shape } from '../svg/ir';
import { Sheet, type Paper } from './base';
import { drawOneToOne } from './tiling';

/** Side view of the test set-up: clamp, bar, hanging load. */
export function testSetupShapes(): Shape[] {
  const { length: L, thickness: t, clamp, arm } = TEST_BAR;
  return [
    rect(-20, -25, 20 + clamp, 25, 'thin', 'hatch'),
    rect(-20, t, 20 + clamp, 20, 'thin', 'hatch'),
    text(-10, 30, 'clamp / vice', 3.5),
    rect(0, 0, L, t),
    line([clamp, -5], [clamp, t + 5], 'center'),
    circle(clamp + arm, t / 2, 1.6, 'thin'),
    line([clamp + arm, 0], [clamp + arm, -40], 'thin'),
    rect(clamp + arm - 10, -60, 20, 20),
    text(clamp + arm, -50, 'load', 3.5),
    dim([clamp, t], [clamp + arm, t], 12, `${arm} mm`),
    dim([0, -2], [clamp, -2], -10, `${clamp} mm clamped`),
  ];
}

export function calibrationSheetPdf(paper: Paper): Uint8Array<ArrayBuffer> {
  const sheet = new Sheet(paper, 'Calibration test bars');
  sheet.heading('Calibrate to your printer');
  sheet.para(
    `You will print a few small test bars, break them, and enter the loads. The app then replaces its assumed material strength with your printer's real numbers.`,
  );
  sheet.para('1. Print the bars', 13, { bold: true });
  sheet.bullet([
    `Print at least ${MIN_BREAKS} bars lying flat ("XY") and ${MIN_BREAKS} standing upright ("Z"), in the same material and settings you will use for parts.`,
    'Upright bars are tall and thin: add a brim so they do not fall over.',
    `Each bar is ${TEST_BAR.length} × ${TEST_BAR.width} × ${TEST_BAR.thickness} mm with a groove ${TEST_BAR.clamp} mm from one end and a hole ${TEST_BAR.arm} mm past the groove.`,
  ]);
  sheet.para('2. Break them', 13, { bold: true });
  sheet.bullet([
    'Clamp the bar flat in a vice up to the groove, with the 10 mm side facing up.',
    'Hang a bag from the hole with string, and add weight (water bottles, sand, coins) slowly until the bar breaks. Or pull down with a luggage or spring scale and note the reading.',
    'Weigh what was hanging when it broke (kg) — or note the scale reading in newtons. Wear eye protection: pieces can fly.',
  ]);
  sheet.para('Set-up (1:1 side view)', 12, { bold: true });
  drawOneToOne(sheet, testSetupShapes(), 'Set-up');
  sheet.para('3. Enter the results', 13, { bold: true });
  sheet.para(
    'On the Calibrate page, enter each break load and the bar orientation. The app works out the bending stress σ = 6·F·a / (b·h²) for each bar, averages them, and shows the result.',
  );
  sheet.para('Calibration only applies to the printer (and material) that printed the bars.', 10, {
    bold: true,
  });
  sheet.footer();
  return sheet.bytes();
}
