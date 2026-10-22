import { expect, type Page } from '@playwright/test';

/** Waits for the first build, then switches the Designer from quick mode to all settings (tabs). */
export async function openFullDesigner(page: Page) {
  await expect(page.getByText(/Built in \d+ ms/)).toBeVisible({ timeout: 60_000 });
  const all = page.getByRole('button', { name: /All settings/ });
  if (await all.isVisible()) await all.click();
  await expect(page.getByRole('tab', { name: 'Fit' })).toBeVisible();
}
