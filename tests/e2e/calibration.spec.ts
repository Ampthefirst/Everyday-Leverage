import { openFullDesigner } from './helpers';
import { expect, test } from '@playwright/test';

test('calibration end to end with example numbers switches the badge', async ({ page }) => {
  await page.goto('/calibrate');
  await page.getByRole('button', { name: 'Fill with example numbers' }).click();
  await page.getByLabel('Printer name').fill('Test MK4');
  await page.getByText('PETG', { exact: true }).click();
  await expect(page.getByText(/In-plane strength/)).toBeVisible();
  await page.getByRole('button', { name: 'Save and use this calibration' }).click();
  await expect(page.getByText(/Saved and switched on/)).toBeVisible();

  await page.goto('/design/B1');
  await openFullDesigner(page);
  await expect(page.getByText('Calibrated to Test MK4').first()).toBeVisible();
  // Switching to PLA (not calibrated) brings the uncalibrated badge back.
  await page.getByRole('tab', { name: 'Strength' }).click();
  await page.getByRole('group', { name: 'Material' }).getByText('PLA', { exact: true }).click();
  await expect(page.getByText('Uncalibrated estimate').first()).toBeVisible();
});

test('a long C3 prints in two parts with two STL files', async ({ page }) => {
  await page.goto('/design/C3');
  await openFullDesigner(page);
  const ext = page.getByRole('spinbutton', { name: 'Extension length' });
  await ext.fill('300');
  await ext.press('Enter');
  await page.getByRole('tab', { name: 'Print' }).click();
  await expect(page.getByText('Printed in 2 parts').first()).toBeVisible({ timeout: 30_000 });
  await page.getByRole('tab', { name: 'Get files' }).click();
  await expect(page.getByRole('button', { name: 'Download STL, part 1' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download STL, part 2' })).toBeVisible();
});
