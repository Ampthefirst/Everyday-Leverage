import { expect, test } from '@playwright/test';

test('home page loads with both entry points', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Find a design for a task' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Pick a design' }).first()).toBeVisible();
});

test('with reduced motion, Fig. 1 holds still and steps through sizes on request', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const fig = page.getByRole('img', { name: /Top view of the lid and jar opener/ });
  await expect(fig).toHaveAccessibleName(/Jam and pickle jars/);
  await page.waitForTimeout(4000);
  await expect(fig).toHaveAccessibleName(/Jam and pickle jars/);
  await page.getByRole('button', { name: /Next size/ }).click();
  await expect(fig).toHaveAccessibleName(/Bottle caps/);
});

test('the tab icon is the current mark, served at a versioned address', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
    'href',
    '/favicon.svg?v=3',
  );
  const svg = await (await request.get('/favicon.svg?v=3')).text();
  expect(svg).toContain('#1d3fa6');
});

test('a figure on Pick glides into the design screen (View Transition)', async ({ page }) => {
  await page.goto('/design');
  await page.evaluate(() => {
    const d = document as Document & { startViewTransition?: (cb: () => void) => unknown; vtCount?: number };
    const orig = d.startViewTransition?.bind(d);
    d.vtCount = 0;
    if (orig)
      d.startViewTransition = (cb: () => void) => {
        d.vtCount! += 1;
        return orig(cb);
      };
  });
  await page.getByRole('link', { name: 'Lid and jar opener', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Lid and jar opener' })).toBeVisible();
  const n = await page.evaluate(() => (document as Document & { vtCount?: number }).vtCount);
  expect(n).toBeGreaterThan(0);
});

test('Fig. 1 can be paused, and then stepped by hand', async ({ page }) => {
  await page.goto('/');
  const fig = page.getByRole('img', { name: /Top view of the lid and jar opener/ });
  await page.getByRole('button', { name: /^Pause/ }).click();
  await expect(page.getByRole('button', { name: /^Play/ })).toHaveAttribute('aria-pressed', 'true');
  const before = await fig.getAttribute('aria-label');
  await page.mouse.move(0, 0);
  await page.waitForTimeout(4200);
  expect(await fig.getAttribute('aria-label')).toBe(before);
  await page.getByRole('button', { name: /^Next size/ }).click();
  await expect(fig).not.toHaveAttribute('aria-label', before!);
});
