import { expect, test } from '@playwright/test';

test('home page loads with both entry points', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Everyday Leverage' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Help me find a design' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Pick a design' }).first()).toBeVisible();
});
