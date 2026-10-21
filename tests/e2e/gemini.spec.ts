import { expect, test } from '@playwright/test';

test('describe in your own words fills the finder (skips without a Gemini key)', async ({
  page,
  request,
}) => {
  const origin = new URL(test.info().project.use.baseURL as string).origin;
  const probe = await request.post('/api/describe', { data: { text: 'jars' }, headers: { origin } });
  test.skip(probe.status() !== 200, 'Gemini is not configured on this server');
  await page.goto('/');
  await page.evaluate(() =>
    localStorage.setItem(
      'el-settings',
      JSON.stringify({
        state: {
          theme: 'system',
          highContrast: false,
          textScale: '100',
          reduceMotion: false,
          llmOptIn: true,
          wherePrint: '',
        },
        version: 1,
      }),
    ),
  );
  await page.goto('/find');
  await page
    .getByLabel(/For example/)
    .fill("I can't open pickle jars any more. It's for me, in the kitchen, right hand, quite stiff.");
  await page.getByRole('button', { name: 'Fill in the answers' }).click();
  // Either straight to a result or to the first unanswered question — the tree still routes.
  await expect(page.getByRole('heading', { name: /Suggested design|\?/ })).toBeVisible({ timeout: 30_000 });
});
