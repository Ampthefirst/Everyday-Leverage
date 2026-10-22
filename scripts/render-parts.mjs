/**
 * Renders a studio image of every design into public/renders/<ID>.webp using the dev-only render page.
 * Usage: npm run render:parts            (all nine)
 *        npm run render:parts -- B1 C3   (just these)
 *        npm run render:parts -- --turn  (also the turn strips: public/renders/turn/<ID>-<0..6>.webp,
 *                                         512 px, camera yaw −30°…+30°, for the board's cursor turning)
 */
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const IMPECCABLE = '.claude/skills/impeccable/scripts/impeccable';

const ALL = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];
const args = process.argv.slice(2);
const TURN = args.includes('--turn');
const named = args.filter((a) => !a.startsWith('--')).map((s) => s.toUpperCase());
const ids = named.length ? named : ALL;
export const TURN_YAWS = [-30, -20, -10, 0, 10, 20, 30];
const OUT = 'public/renders';
mkdirSync(OUT, { recursive: true });

const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
});
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1100 } });
  const shoot = async (id, out, { yaw = 0, size } = {}) => {
    const q = `id=${id}&yaw=${yaw}${size ? `&size=${size}` : ''}`;
    await page.goto(`http://localhost:5199/render.html?${q}`);
    await page.waitForFunction(() => window.__renderReady || window.__renderError, null, { timeout: 120_000 });
    const err = await page.evaluate(() => window.__renderError);
    if (err) throw new Error(`${id}: ${err}`);
    const url = await page.evaluate(() => window.__capture('image/webp', 0.9));
    const bytes = Buffer.from(url.split(',')[1], 'base64');
    writeFileSync(out, bytes);
    // Provenance: record inside the file that this is a render of the app's own geometry, not a generated image.
    if (existsSync(IMPECCABLE)) {
      const origin = `Origin: rendered by scripts/render-parts.mjs from Everyday Leverage's own ${id} parametric geometry (manifold-3d) with three.js studio lighting${yaw ? `, camera turned ${yaw}°` : ''}; not AI-generated.`;
      try {
        execFileSync(IMPECCABLE, ['embed-prompt', out, '--prompt', origin], { stdio: 'ignore' });
      } catch {
        console.warn(`${out}: could not embed provenance`);
      }
    }
    console.log(`${out}  ${(bytes.length / 1024).toFixed(0)} KB`);
  };
  for (const id of ids) {
    await shoot(id, `${OUT}/${id}.webp`);
    if (TURN) {
      mkdirSync(`${OUT}/turn`, { recursive: true });
      for (const [k, yaw] of TURN_YAWS.entries()) await shoot(id, `${OUT}/turn/${id}-${k}.webp`, { yaw, size: 512 });
    }
  }
} finally {
  await browser.close();
  await server.close();
}
