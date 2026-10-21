import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = [
  '/',
  '/find',
  '/design',
  '/design/B1',
  '/design/C3',
  '/calibrate',
  '/learn',
  '/limits',
  '/print-help',
  '/settings',
];

for (const path of PAGES) {
  test(`no serious accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    if (path.startsWith('/design/'))
      await expect(page.getByText(/Built in \d+ ms/)).toBeVisible({ timeout: 60_000 });
    else await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0]?.target}`)).toEqual(
      [],
    );
  });
}

test('high-contrast and dark themes pass colour contrast', async ({ page }) => {
  for (const theme of [
    { theme: 'dark', highContrast: false },
    { theme: 'light', highContrast: true },
    { theme: 'dark', highContrast: true },
  ]) {
    await page.goto('/');
    await page.evaluate(
      (t) =>
        localStorage.setItem(
          'el-settings',
          JSON.stringify({
            state: { ...t, textScale: '100', reduceMotion: false, llmOptIn: false, wherePrint: '' },
            version: 1,
          }),
        ),
      theme,
    );
    await page.goto('/limits');
    const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
    expect(
      results.violations.map((v) => `${JSON.stringify(theme)} ${v.nodes.length} ${v.nodes[0]?.target}`),
    ).toEqual([]);
  }
});
