// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DashboardPage from '../../src/pages/DashboardPage';
import { useAccount } from '../../src/accounts/sync';
import { useProjects } from '../../src/state/projects';
import { getFamily } from '../../src/families';
import { showPrinterPanel } from '../../src/content/features';
import { fitSizes, sizeRanges } from '../../src/families/describe';

const b1 = getFamily('B1')!;
const caps = { ...b1.defaults, ...b1.presets[1].params } as Record<string, number | string | boolean>;

function dashboard(signedIn = true) {
  useAccount.setState({
    ready: true,
    configured: true,
    user: signedIn ? { email: 'jo@example.com' } : null,
    syncError: false,
  });
  return (
    render(
      createElement(
        MemoryRouter,
        { initialEntries: ['/designs'] },
        createElement(
          Routes,
          null,
          createElement(Route, { path: '/designs', element: createElement(DashboardPage) }),
          createElement(Route, { path: '/account', element: 'Sign in page' }),
        ),
      ),
    ).container.textContent ?? ''
  );
}

beforeEach(() =>
  useProjects.setState({
    projects: [
      {
        id: 'p1',
        name: 'Kitchen caps',
        familyId: 'B1',
        params: caps,
        presetId: 'bottle',
        step: 'check',
        updatedAt: '2026-10-24T10:00:00.000Z',
      },
    ],
    activeId: null,
  }),
);
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('dashboard', () => {
  it('is for signed-in people only: signed out, it goes to sign in', () => {
    expect(dashboard(false)).toContain('Sign in page');
  });

  it('shows each design with its sizes, step and strength', () => {
    const text = dashboard();
    expect(text).toContain('Kitchen caps');
    expect(text).toContain('Lid and jar opener · from “Bottle caps”');
    expect(text).toContain('Largest lid40 mm');
    expect(text).toMatch(/\d+%/);
    expect(text).toContain('1 design');
  });

  it.each([
    ['normal site', '0', true],
    ['presentation build', '1', false],
  ])('on the %s, the badge and the estimates note follow presentation mode', (_n, flag, shown) => {
    vi.stubEnv('VITE_PRESENTATION_MODE', flag);
    const text = dashboard();
    expect(text.includes('Uncalibrated estimate')).toBe(shown);
    expect(text.includes('estimates until calibrated')).toBe(shown);
  });

  it.each([
    [undefined, true],
    ['1', true],
    ['0', false],
  ])('VITE_DASHBOARD_PRINTER=%s shows the printer panel: %s', (flag, shown) => {
    if (flag !== undefined) vi.stubEnv('VITE_DASHBOARD_PRINTER', flag);
    expect(showPrinterPanel()).toBe(shown);
    expect(dashboard().includes('Your printer')).toBe(shown);
  });
});

describe('plain-words sizes', () => {
  it('lists the fit sizes with units and choice labels', () => {
    expect(fitSizes(b1, caps)).toContainEqual({ label: 'Largest lid', value: '40 mm' });
    const a1 = getFamily('A1')!;
    expect(fitSizes(a1, a1.defaults).some((s) => /^(Round|Flat|Oval)$/.test(s.value))).toBe(true);
  });
  it('gives each millimetre fit measurement its range', () => {
    expect(sizeRanges(b1)).toContain('Largest lid 24–110 mm');
  });
});
