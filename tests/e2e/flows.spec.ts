import { openFullDesigner } from './helpers';
import { expect, test, type Page } from '@playwright/test';

async function answer(page: Page, label: string) {
  await page
    .getByRole('button', { name: new RegExp(`^${label}`) })
    .first()
    .click();
}

async function finishFinder(page: Page) {
  // hand, force, location, who
  await answer(page, 'Right');
  await answer(page, 'Moderate');
  await answer(page, 'Kitchen');
  await answer(page, 'For me');
}

async function downloadPackage(page: Page) {
  await openFullDesigner(page);
  await page.getByRole('tab', { name: 'Get files' }).click();
  const [dl] = await Promise.all([
    page.waitForEvent('download', { timeout: 60_000 }),
    page.getByRole('button', { name: 'Download everything (.zip)' }).click(),
  ]);
  expect(dl.suggestedFilename()).toMatch(/\.zip$/);
  const path = await dl.path();
  expect(path).toBeTruthy();
  const fs = await import('node:fs');
  expect(fs.statSync(path!).size).toBeGreaterThan(20_000);
}

test.describe('finder → design → download package', () => {
  test('A: holding a spoon → A1 build-up grip', async ({ page }) => {
    await page.goto('/find');
    await page.getByRole('button', { name: 'Start' }).click();
    await answer(page, 'Hold something');
    await answer(page, 'Spoon, fork or knife');
    await answer(page, "Can't grip it well");
    await finishFinder(page);
    await expect(page.getByRole('heading', { name: /Build-up grip/ })).toBeVisible();
    await page.getByRole('button', { name: 'Use this design' }).first().click();
    await expect(page).toHaveURL(/\/design\/A1/);
    await downloadPackage(page);
  });

  test('B: opening a jar → B1 lid and jar opener', async ({ page }) => {
    await page.goto('/find');
    await page.getByRole('button', { name: 'Start' }).click();
    await answer(page, 'Open something');
    await answer(page, 'Jar or lid');
    await answer(page, "Can't turn it");
    await finishFinder(page);
    await expect(page.getByRole('heading', { name: /Lid and jar opener/ })).toBeVisible();
    await page.getByRole('button', { name: 'Use this design' }).first().click();
    await expect(page).toHaveURL(/\/design\/B1/);
    await downloadPackage(page);
  });

  test('C: pulling a drawer → C1 pull handles', async ({ page }) => {
    await page.goto('/find');
    await page.getByRole('button', { name: 'Start' }).click();
    await answer(page, 'Pull something');
    await answer(page, 'Drawer or cupboard');
    await answer(page, "Can't pull it");
    await finishFinder(page);
    await expect(page.getByRole('heading', { name: /Pull handles/ })).toBeVisible();
    await page.getByRole('button', { name: 'Use this design' }).first().click();
    await expect(page).toHaveURL(/\/design\/C1/);
    await downloadPackage(page);
  });
});

test('out-of-scope answers show the OT note and no design', async ({ page }) => {
  await page.goto('/find');
  await page.getByRole('button', { name: 'Start' }).click();
  await answer(page, 'Hold something');
  await answer(page, 'Spoon, fork or knife');
  await answer(page, "It hurts or I'm injured");
  await expect(page.getByText('This one needs a person, not an app.')).toBeVisible();
  await expect(page.getByText(/occupational therapist/).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Use this design' })).toHaveCount(0);
});

test('strength verdict always shows the uncalibrated badge', async ({ page }) => {
  await page.goto('/design/B3');
  await openFullDesigner(page);
  await page.getByRole('tab', { name: 'Strength' }).click();
  await expect(page.getByRole('meter', { name: 'Strength' }).first()).toBeVisible();
  await expect(page.getByText('Uncalibrated estimate').first()).toBeVisible();
  await page.getByRole('button', { name: 'Stress map' }).click();
  await expect(page.getByText('Uncalibrated estimate — not FEA')).toBeVisible();
});

test('large-text mode scales the page', async ({ page }) => {
  await page.goto('/settings');
  await page.getByText('Extra large (150%)').click();
  await expect(page.locator('html')).toHaveAttribute('data-text', '150');
});

test('fit-check template downloads as a PDF', async ({ page }) => {
  await page.goto('/design/A1');
  await openFullDesigner(page);
  await page.getByRole('tab', { name: 'Get files' }).click();
  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download 1:1 fit-check template (PDF)' }).click(),
  ]);
  expect(dl.suggestedFilename()).toMatch(/template-(letter|a4)\.pdf$/);
});

test("Pick lists each design's tasks; one opens the designer at those sizes", async ({ page }) => {
  await page.goto('/design');
  const entry = page.getByRole('article', { name: 'Lid and jar opener' });
  await expect(entry.getByText(/Largest lid 24–110 mm/)).toBeVisible();
  await entry.getByRole('button', { name: /^Bottle caps/ }).click();
  await expect(page).toHaveURL(/\/design\/B1$/);
  await expect(page.getByText(/Step 2/)).toBeVisible();
  await page.getByRole('button', { name: /Back/ }).click();
  await expect(page.getByRole('button', { name: /Bottle caps/ })).toHaveAttribute('aria-pressed', 'true');
});

test('pick a design by number keys, then a preset opens the designer with it applied', async ({ page }) => {
  await page.goto('/design');
  await expect(page.getByRole('heading', { name: 'Pick a design' })).toBeVisible();
  await page.keyboard.press('4');
  await expect(page).toHaveURL(/\/pick\/B1$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Lid and jar opener' })).toBeVisible();
  await page.keyboard.press('2');
  await expect(page).toHaveURL(/\/design\/B1$/);
  // Quick mode starts at the first measurement because the task was already chosen.
  await expect(page.getByText(/Step 2/)).toBeVisible();
  await page.getByRole('button', { name: /Back/ }).click();
  await expect(page.getByRole('button', { name: /Bottle caps/ })).toHaveAttribute('aria-pressed', 'true');
});

test('quick mode: one decision per screen, then the files', async ({ page }) => {
  await page.goto('/design/A1');
  await expect(page.getByText(/Built in \d+ ms/)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'What is it for?' })).toBeVisible();
  await page.getByRole('button', { name: /Spoon or fork/ }).click();
  // Step through every measurement screen to the result.
  for (let i = 0; i < 8; i++) {
    const next = page.getByRole('button', { name: /^(Next|See the result)/ });
    if (!(await next.isVisible())) break;
    await next.click();
  }
  await expect(page.getByRole('meter', { name: 'Strength' }).last()).toBeVisible();
  await expect(page.getByText('Uncalibrated estimate').first()).toBeVisible();
  const [dl] = await Promise.all([
    page.waitForEvent('download', { timeout: 60_000 }),
    page.getByRole('button', { name: 'Download everything (.zip)' }).click(),
  ]);
  expect(dl.suggestedFilename()).toMatch(/\.zip$/);
});

test('save to the shelf, then continue where you stopped from Home', async ({ page }) => {
  await page.goto('/home-reset-not-a-route');
  await page.evaluate(() => localStorage.removeItem('el-projects'));
  await page.goto('/');
  await expect(page.getByText('Nothing saved yet')).toBeVisible();
  await page.goto('/design/B1');
  await expect(page.getByText(/Built in \d+ ms/)).toBeVisible({ timeout: 60_000 });
  await page.getByRole('button', { name: /Bottle caps/ }).click();
  await page.getByRole('button', { name: 'Save Design' }).click();
  await expect(page.getByRole('link', { name: /On your shelf/ })).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Lid and jar opener · Bottle caps/ })).toBeVisible();
  await expect(page.getByText(/You stopped at/)).toContainText('Measure');
  // Rename it, then continue from the hero.
  await page.getByRole('button', { name: /Rename/ }).click();
  await page.getByLabel('Name').fill('Kitchen caps');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Kitchen caps' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /^Continue/ }).click();
  await expect(page).toHaveURL(/\/design\/B1$/);
  await expect(page.getByText(/Step 2/)).toBeVisible();
  await expect(page.getByRole('link', { name: /On your shelf: Kitchen caps/ })).toBeVisible();
});
