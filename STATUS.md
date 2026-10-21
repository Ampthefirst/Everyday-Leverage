# Status — Everyday Leverage v1

Last updated by the overnight build. `PLAN.md` is the spec; choices made along the way are in `DECISIONS.md`.

## Summary

All nine sub-families (A1–C3) are buildable from presets and fine-tune, with a live 3D view, ghost
objects, cross-section, computed stress map, "how to use" animation, strength verdict + show-the-math
+ badge, print-readiness checks, and every output in PLAN §8. The task finder, calibration, Learn
pages, profiles/share links, offline support and the optional Gemini features are in.

- **Live:** https://everyday-leverage.vercel.app (Vercel production, deployed from `main`).
- `npm run check` is green: typecheck, lint, 150 unit tests, build.
- Playwright: 24 end-to-end tests (flows for A/B/C, out-of-scope, calibration, auto-split, offline,
  Gemini, axe WCAG 2.2 AA on every page) — all pass locally **and against the live site**.
- Gemini `/api/describe` and `/api/explain` verified on production (~3–4 s per request).

## Done

| Area | What works |
| --- | --- |
| Scaffold | Vite + React 19 + TS strict, Tailwind 4 tokens (light/dark/high-contrast, 100/125/150% text), Zustand, Router, Vitest, Playwright, ESLint/Prettier, `vercel.json` |
| Geometry | manifold-3d in a Web Worker (stale jobs dropped), 5 primitives + helpers (ribs, clamp, grooves, texture, stamps, countersinks, strap slots), cross-section slicing, auto-split with dovetail + pin holes |
| Families | A1 grip, A2 cuff, A3 tool handle, B1 jar opener (handheld + wall V), B2 key/knob turner, B3 cap/tap turner, C1 pull handles (ring/hook/screw D-handle), C2 press/touch aids, C3 door/reach aid (splits when long). Each has schema + cross-parameter constraints + repair, presets, variants, loads, critical sections, drawing, template, ghost, animation, orientation candidates, measuring guide, rules, fit test |
| Strength | Materials with sources (assumed), hollow-shell section model, bending/torsion (round + Bredt)/bearing/tear-out/buckling/loop checks, von Mises, Kt, layer direction, fatigue, joint factor, verdict + reason + show-the-math, heat field from the same sections, calibration fit |
| Print | Bed fit (square-on and diagonal), validator with plain fixes, orientation advisor (max min-margin, support penalty), settings with reasons, filament/time estimates, fit-test STL |
| Outputs | STL (oriented), 3MF (mm + metadata), STL per split piece, dimensioned drawing PDF/SVG, 1:1 template PDF/SVG (Letter/A4, 25 mm square = 70.866 pt, tiling + page map), print sheet, request-a-print sheet, foldable mock-up (A1, A3, B1, C1), measuring gauges, B1 mounting template, DXF, zip package |
| Guidance | Task finder (7 questions, routing table, ambiguous side-by-side, out-of-scope OT note, no-match picker, second-person copy, answers never stored), Learn (lever explainer, why-did-it-fail, PLA vs PETG), Calibrate (bars, sheet, entry, fit, profiles, JSON import/export, example data), Limits page, Get-it-printed page, Display settings, local profiles, share links (`#p=` hash) |
| Gemini | `/api/describe`, `/api/explain` (Web `POST` handlers), opt-in toggle with notice, number verification, graceful hiding without key/network |
| Accessibility | WCAG 2.2 AA axe checks pass on every page (incl. dark + high contrast), 48 px targets, keyboard camera controls, visible focus, reduced motion (animations become steps), labelled meter |
| Offline | Service worker: pages network-first with cached shell, hashed assets + WASM precached via `precache.json` |

## Partial / known gaps

- **Stress map and strength numbers are uncalibrated estimates** (by design, badge always shown).
- Ghost objects are simple stylised shapes (the hand is capsules + a rounded palm).
- Fillets are approximated with hull blends and rounded profiles (no true 3D fillets).
- The 3MF stores settings as metadata; slicers will not read them as slicer settings.
- `GEMINI_MODEL` in Vercel was not in the API's name format; the server now normalises friendly
  forms ("Gemini 3.8 Flash" → `gemini-3.8-flash`). Setting it to the exact id is still cleaner.
- Offline works after the first visit (service worker + precache); the very first load needs a network.

## How to test locally

```bash
npm install
npm run dev          # http://localhost:5173
npm run check        # typecheck + lint + unit tests + build
npm run e2e          # Playwright: flows + axe accessibility (builds and serves on :4173)
E2E_BASE_URL=https://everyday-leverage.vercel.app npm run e2e   # same suite against the live site
```

Manual checks:
1. **Finder** — `/find` → Start → answer → "Use this design". Try "It hurts or I'm injured" for the OT note; "Open something → Bottle cap" for the side-by-side result.
2. **Designer** — `/design/B1`: change presets/sliders; toolbar: Object, Cut open (slider), Stress map, Mirror, How to use, turn/zoom buttons. Strength tab: meter, badge, load, safety factor, Show the math. Print tab: issues ("Fix it for me"), placement, settings, estimates.
3. **Auto-split** — `/design/C3`, set Extension to 300 mm: the view shows two pieces; Print tab says "Printed in 2 parts"; Get files offers part 1 and part 2.
4. **Files** — Get files → "Download everything (.zip)". Print the template at 100% and measure the 25 mm square.
5. **Calibrate** — `/calibrate` → "Fill with example numbers" → enter a printer name → Save. The badge changes to "Calibrated to …" in the Designer.
6. **Gemini** — Display → turn on Gemini; `/find` shows "Describe it in your own words"; Strength tab shows "Say it more simply".

## On Vercel

1. Import the GitHub repo in Vercel (framework preset: Vite; `vercel.json` sets build + SPA rewrites; `/api/*.ts` become Node functions).
2. Set `GEMINI_API_KEY` and `GEMINI_MODEL` in Project → Settings → Environment Variables (never `VITE_`-prefixed).
3. Every pushed branch gets a preview; `main` deploys to production.
4. On the deploy: run the manual checks above; with the env vars set, the two Gemini features appear after opting in.
