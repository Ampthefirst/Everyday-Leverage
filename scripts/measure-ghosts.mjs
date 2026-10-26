/**
 * Measures how far the hand and other context objects sit inside the printed part, for every design,
 * preset and how-to-use step (the ?debug collision measure in src/viewer/debugCollide.ts).
 *
 *   npm run build && npx vite preview --port 4173 &   # then:
 *   node scripts/measure-ghosts.mjs [A1,B1,...]        # PORT=4173, OUT=test-results/ghosts, PW_CHROMIUM_PATH
 *
 * Prints one line per object and step, and writes collide.json plus a stage screenshot per step to OUT.
 * A hand at 1.5 mm or less is touching the part; deeper is passing through it. A full run takes ~25 min.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const OUT = process.env.OUT ?? 'test-results/ghosts';
mkdirSync(OUT, { recursive: true });
// Every preset is measured: the loop stops at the first index past the family's preset list.
const PRESETS = Object.fromEntries(['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'].map((id) => [id, 9]));
const only = process.argv[2]?.split(',');
const b = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
});
const rows = [];
for (const [id, n] of Object.entries(PRESETS)) {
  if (only && !only.includes(id)) continue;
  for (let k = 1; k <= n; k++) {
    const p = await b.newPage({ viewport: { width: 1300, height: 820 } });
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await p.goto(`http://localhost:${process.env.PORT ?? 4173}/pick/${id}?debug`);
    const presets = p.locator('ol button');
    await presets.first().waitFor({ timeout: 20000 });
    if ((await presets.count()) < k) {
      await p.close();
      break;
    }
    const label = (
      await presets
        .nth(k - 1)
        .locator('span.font-semibold')
        .first()
        .textContent()
    )?.trim();
    await presets.nth(k - 1).click();
    await p.getByText(/Built in \d+ ms/).waitFor({ state: 'attached', timeout: 60000 });
    await p.waitForFunction(() => window.__elDebug, null, { timeout: 20000 });
    await p.waitForTimeout(600);
    const measure = async (step) => {
      const r = await p.evaluate(() => window.__elDebug.measure());
      for (const x of r) rows.push({ id, preset: label, step, ...x });
      await p
        .locator('section[aria-label="3D preview"] .stage-grid')
        .screenshot({ path: `${OUT}/${id}-${k}-${step}.png` });
    };
    await measure('rest');
    for (let s = 1; s <= 4; s++) {
      const btn = p.getByRole('button', { name: /How to use/ });
      if (!(await btn.count())) break;
      const before = await p.locator('[aria-live="polite"]').allTextContents();
      await btn.first().click();
      await p.waitForTimeout(900);
      const cap =
        (
          await p.locator('section[aria-label="3D preview"] div.absolute.inset-x-3.top-3').allTextContents()
        )[0] ?? '';
      if (!cap) break;
      await measure(`s${s}`);
    }
    await p.close();
    writeFileSync(`${OUT}/collide.json`, JSON.stringify(rows, null, 1));
  }
}
await b.close();
writeFileSync(`${OUT}/collide.json`, JSON.stringify(rows, null, 1));
for (const r of rows)
  console.log(
    `${r.id}\t${(r.preset ?? '').padEnd(24)}\t${r.step}\t${r.object.padEnd(12)}\tinside ${(r.insideShare * 100).toFixed(1)}%\tdepth ${r.maxDepth.toFixed(1)} mm\t${JSON.stringify(Object.fromEntries(Object.entries(r.segments ?? {}).map(([k, v]) => [k, +v.toFixed(1)])))}`,
  );
