# Everyday Leverage

A web app that turns a described task and a few measurements into a custom-fit, strength-checked
aid that lowers the force a daily task needs — ready to 3D print, with drawings, a 1:1 fit-check
template and a sheet you can hand to a library or print service.

- Product spec: [`docs/everyday-leverage-guide.md`](docs/everyday-leverage-guide.md)
- v1 build plan: [`PLAN.md`](PLAN.md) · decisions: [`DECISIONS.md`](DECISIONS.md) · status: [`STATUS.md`](STATUS.md)

## What's inside

- **Nine designs** in three groups — Hold (A1 build-up grip, A2 universal cuff, A3 tool handle),
  Turn & open (B1 jar opener, B2 key/knob turner, B3 cap/tap turner), Pull/push/reach (C1 pull
  handles, C2 press aids, C3 door/reach aid).
- **Task finder**: seven quick questions → best match + two alternates (never asks about health).
- **Designer**: live 3D view with the real object shown around the part, cut-open view, computed
  stress map, "how to use" animation; strength verdict with "show the math"; print-readiness checks.
- **Files**: STL, 3MF, fit-test mini-print, dimensioned drawing, 1:1 template (Letter/A4), print
  sheet, request-a-print sheet, foldable mock-up, gauges, DXF — or everything in one zip.
- **Calibrate** strength to your own printer with printed test bars.
- Works offline; profiles stay in your browser. Optional Gemini features are off by default.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # typecheck, lint, unit tests, build
npm run e2e        # Playwright flows + axe accessibility checks
```

`npm run dev` does not serve `/api`; the Gemini features simply stay hidden. To try them locally use
`vercel dev` with `GEMINI_API_KEY` and `GEMINI_MODEL` in `.env.local` (see `.env.example`).

## Deploy (Vercel)

Import the repo in Vercel (Vite preset is detected; `vercel.json` adds the SPA rewrite). Set
`GEMINI_API_KEY` and `GEMINI_MODEL` as environment variables — server-side only, never `VITE_`.
Everything except the two Gemini features works without them.

## Tech

React 19 · Vite · TypeScript · Tailwind CSS · Zustand · three.js (@react-three/fiber, drei) ·
manifold-3d (WASM, in a Web Worker) · zod · jsPDF · fflate · Vitest · Playwright.

Not a medical device. Printed plastic is not food-safe. Strength numbers are estimates until
calibrated to your printer.
