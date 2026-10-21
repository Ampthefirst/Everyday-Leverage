import { expect, test } from '@playwright/test';

test('after one visit the app reloads and builds a part offline', async ({ page, context }) => {
  await page.goto('/design/A1');
  await expect(page.getByText(/Built in \d+ ms/)).toBeVisible({ timeout: 60_000 });
  // Wait for the service worker to take control and cache what was loaded.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByText(/Built in \d+ ms/)).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(1000);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Build-up grip/ })).toBeVisible();
  await expect(page.getByText(/Built in \d+ ms/)).toBeVisible({ timeout: 60_000 });
  await context.setOffline(false);
});

test('pages not visited yet also open offline (precached)', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(1500);
  await context.setOffline(true);
  await page.goto('/learn');
  await expect(page.getByRole('heading', { name: 'Learn' })).toBeVisible();
  await page.goto('/design/C1');
  await expect(page.getByText(/Built in \d+ ms/)).toBeVisible({ timeout: 60_000 });
  await context.setOffline(false);
});
