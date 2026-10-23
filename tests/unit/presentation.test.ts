import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { strFromU8, unzipSync } from 'fflate';
import { loadKernel, type Kernel } from '../../src/geometry/kernel';
import { runBuild } from '../../src/geometry/jobs';
import { getFamily } from '../../src/families';
import { analyse } from '../../src/app/analysis';
import type { OutputContext } from '../../src/outputs/context';
import { packageZip } from '../../src/outputs/package';
import { setPdfCompression } from '../../src/outputs/pdf/base';
import { printSheetPdf, requestSheetPdf } from '../../src/outputs/pdf/sheets';
import { DISCLAIMERS, disclaimer, showDisclaimers } from '../../src/content/disclaimers';
import { StrengthBadge } from '../../src/components/StrengthBadge';
import { Layout } from '../../src/app/Layout';
import { HomePage } from '../../src/pages/HomePage';

let K: Kernel;
beforeAll(async () => {
  K = await loadKernel();
  setPdfCompression(false);
});
afterEach(() => vi.unstubAllEnvs());

function ctx(): OutputContext {
  const fam = getFamily('B1')!;
  const params = fam.defaults;
  const build = runBuild(K, fam.id, params, null);
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
      split: false,
    },
  });
  return {
    family: fam,
    params,
    analysis,
    build,
    paper: 'letter',
    location: 'kitchen',
    wherePrint: 'the library',
    date: '2026-10-22',
    files: [],
  };
}

const pdfText = (bytes: Uint8Array) => new TextDecoder('latin1').decode(bytes);
const home = () =>
  renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/'] },
      createElement(
        Routes,
        null,
        createElement(
          Route,
          { element: createElement(Layout) },
          createElement(Route, { index: true, element: createElement(HomePage) }),
        ),
      ),
    ),
  );

describe.each([
  ['normal site', '0', true],
  ['presentation build', '1', false],
])('disclaimers on the %s', (_name, flag, shown) => {
  it('the switch and registry follow VITE_PRESENTATION_MODE', () => {
    vi.stubEnv('VITE_PRESENTATION_MODE', flag);
    expect(showDisclaimers()).toBe(shown);
    expect(disclaimer('foodSafe')).toBe(shown ? DISCLAIMERS.foodSafe : null);
  });

  it('the strength badge', () => {
    vi.stubEnv('VITE_PRESENTATION_MODE', flag);
    const html = renderToStaticMarkup(createElement(StrengthBadge, { calibration: null }));
    expect(html.includes('Uncalibrated estimate')).toBe(shown);
  });

  it('the footer and the home page', () => {
    vi.stubEnv('VITE_PRESENTATION_MODE', flag);
    const html = home();
    expect(html.includes('not a medical device')).toBe(shown);
    expect(html.includes('What it is, and isn')).toBe(shown);
    // The ways in stay either way.
    expect(html).toContain('Find a design for a task');
  });

  it('the print sheet, the request sheet and the zip README', () => {
    vi.stubEnv('VITE_PRESENTATION_MODE', flag);
    const c = ctx();
    const print = pdfText(printSheetPdf(c));
    expect(print.includes('porous')).toBe(shown);
    expect(print.includes('Uncalibrated estimate')).toBe(shown);
    expect(print.includes('not a medical device')).toBe(shown);
    const request = pdfText(requestSheetPdf(c));
    expect(request.includes('not tests on your printer')).toBe(shown);
    const readme = strFromU8(unzipSync(packageZip(c, []))['README.txt']);
    expect(readme.includes('not a medical device')).toBe(shown);
    expect(readme.includes('uncalibrated estimate')).toBe(shown);
  });
});
