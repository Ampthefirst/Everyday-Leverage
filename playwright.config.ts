import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  use: {
    // E2E_BASE_URL=https://… runs the suite against a deployed site instead of a local build.
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4173',
    acceptDownloads: true,
    launchOptions: {
      // Software WebGL so the 3D viewer renders in headless CI.
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
      ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
    },
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run build && npm run preview -- --port 4173 --strictPort',
        port: 4173,
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
