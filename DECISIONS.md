# Decisions log

One line each: decision — reason.

- React 19, Vite 8, Tailwind 4, Zustand 5, zod 4, React Router 7 — current stable releases; PLAN.md updated to React 19.
- TypeScript pinned to 5.9 — typescript-eslint does not yet support TS 6+/7.
- Playwright pinned to 1.56.1 — matches the preinstalled Chromium build (1194) in the build container.
- Dropped `@vercel/node` dev dependency; `/api` functions use the Web `Request`/`Response` signature — fewer deps, no audit warnings, easy to unit-test.
- Atkinson Hyperlegible self-hosted via @fontsource — legible for low-vision users and works offline.
