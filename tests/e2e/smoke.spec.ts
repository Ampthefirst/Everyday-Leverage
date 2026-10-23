import { expect, test } from '@playwright/test';

test('home page loads with both entry points', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Find a design for a task' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Pick a design' }).first()).toBeVisible();
});
