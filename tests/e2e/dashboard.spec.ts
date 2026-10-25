import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** A signed-in account, faked at the network edge (the real server needs a database). */
async function signedIn(page: Page, projects: unknown[] = []) {
  const saved: Record<string, unknown> = Object.fromEntries(
    projects.map((p) => [(p as { id: string }).id, p]),
  );
  await page.route('**/api/auth', (r) =>
    r.fulfill({ json: { configured: true, user: { email: 'jo@example.com' } } }),
  );
  await page.route('**/api/projects*', async (r) => {
    const req = r.request();
    if (req.method() === 'PUT') {
      const p = (req.postDataJSON() as { project: { id: string } }).project;
      saved[p.id] = p;
    }
    if (req.method() === 'DELETE') delete saved[new URL(req.url()).searchParams.get('id') ?? ''];
    await r.fulfill({ json: req.method() === 'GET' ? { projects: Object.values(saved) } : { ok: true } });
  });
  return saved;
}

const caps = {
  id: 'caps1',
  name: 'Kitchen caps',
  familyId: 'B1',
  params: {
    lidMin: 26,
    lidMax: 40,
    steps: 3,
    stepDepth: 8,
    lever: 110,
    leverW: 22,
    leverH: 12,
    mount: 'handheld',
  },
  presetId: 'bottle',
  step: 'check',
  updatedAt: '2026-10-24T10:00:00.000Z',
};

test('signed out, Your designs asks you to sign in', async ({ page }) => {
  await page.route('**/api/auth', (r) => r.fulfill({ json: { configured: true, user: null } }));
  await page.goto('/designs');
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

test('the dashboard lists account designs with sizes and strength, and its actions work', async ({
  page,
}) => {
  const saved = await signedIn(page, [caps]);
  await page.goto('/designs');
  const row = page.getByRole('listitem', { name: 'Kitchen caps' });
  await expect(row).toBeVisible();
  await expect(row.getByText('40 mm').first()).toBeVisible();
  await expect(row.getByText(/\d+%/)).toBeVisible();
  await expect(page.getByText('1 design', { exact: true })).toBeVisible();

  await row.getByRole('button', { name: /^Duplicate/ }).click();
  await expect(page.getByRole('listitem', { name: 'Kitchen caps (copy)' })).toBeVisible();
  await expect.poll(() => Object.keys(saved).length).toBe(2);

  const copy = page.getByRole('listitem', { name: 'Kitchen caps (copy)' });
  await copy.getByRole('button', { name: /^Delete/ }).click();
  await copy.getByRole('button', { name: 'Cancel' }).click();
  await expect(copy.getByRole('button', { name: /^Yes, delete/ })).toHaveCount(0);
  await copy.getByRole('button', { name: /^Delete/ }).click();
  await copy.getByRole('button', { name: /^Yes, delete/ }).click();
  await expect(copy).toHaveCount(0);
  await expect(page.getByText('Deleted Kitchen caps (copy).')).toBeVisible();
  await expect.poll(() => Object.keys(saved).length).toBe(1);

  await page.getByRole('button', { name: 'Turn and open' }).click();
  await expect(row).toBeVisible();
  await page.getByRole('button', { name: 'Hold', exact: true }).click();
  await expect(page.getByText('No saved designs in this group yet.')).toBeVisible();
  await page.getByRole('button', { name: 'All', exact: true }).click();

  await row.getByRole('button', { name: /^Open/ }).click();
  await expect(page).toHaveURL(/\/design\/B1$/);
});

test('Home shows recent designs and the way to the dashboard when signed in', async ({ page }) => {
  await signedIn(page, [caps]);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your recent designs' })).toBeVisible();
  await page.getByRole('link', { name: /See all your designs/ }).click();
  await expect(page).toHaveURL(/\/designs$/);
});

test('no serious accessibility violations on the dashboard', async ({ page }) => {
  await signedIn(page, [caps]);
  await page.goto('/designs');
  await expect(page.getByRole('listitem', { name: 'Kitchen caps' })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0]?.target}`)).toEqual([]);
});
