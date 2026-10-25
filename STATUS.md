# Status — Everyday Leverage

## v3.1 (2026-10-25) — live, merged to `main`

`V3_1PLAN.md` is the spec, with the owner's decisions at the end. Vercel's production branch had been set to `claude/jolly-davinci-6wipnd`, so each v3.1 push went live as it landed. The owner kept v3.1 live, and `main` was fast-forwarded to match. The production branch should be set back to `main`.

- **Tab icon:** returning visitors get the current icon (service-worker cache bumped to `el-v4`, versioned icon URLs, PNG fallbacks).
- **Fig. 1:** morphs between the jar opener's three real presets at one fixed scale. It pauses on hover, on focus and with its Pause button; reduced motion holds still with "Next size".
- **Home and Pick:** Home lists the nine as a minimal index. Pick is a catalogue: what each design helps with (preset links), the sizes it fits, why it works, and an Open button.
- **Dashboard:** "Your designs" at `/designs`, signed in only. It shows sizes, steps, strength with badge, actions, summary, sort and filter, a side panel (printer behind `VITE_DASHBOARD_PRINTER`) and a zip download. Signed-in Home shows recent designs.
- **Transitions:** figures glide from Home and Pick to a design's screen; the tab underline and dashboard rows glide; the meter slides; quick-mode questions fade in. Reduced motion turns all of it off.
- **Finish review:** one round returned "fix" with eight findings, all applied (pause control, Pick Open button and larger renders, delete cancel and notice, phone dashboard rows, side panel wrap, index alignment, DESIGN.md). The fixes were not re-scored.
- **Results:** `npm run check` passes 202 unit tests. `npm run e2e` passes 36 tests; 1 is skipped because it needs a Gemini key.

---

## v3 (2026-10-23) — live, merged to `main`

`V3PLAN.md` is the spec. The owner approved the merge to `main` after reviewing the live deployment. Accounts are switched on: Supabase is connected through Vercel's environment.

- **Gates 1–4 done:**
  - references (`docs/v3/gate1-references.md`);
  - UI/UX checklist (`docs/v3/gate2-checklist.md`);
  - direction A, "Patent figure" (`docs/v3/gate3/`);
  - detailed mockups (`docs/v3-mockups/`).
- **Gate 5 built:**
  - white paper, ink and one ink-blue accent, Spectral headings with Public Sans;
  - a figure sheet drawn from each design's own drawing code, and a live Fig. 1 on Home;
  - the shelf, Pick and design screens restyled;
  - Designer graph paper that fades to about 18% wherever the part sits on screen, following it as the view turns;
  - every panel and page restyled.
- **Accounts (DB-ready, hidden):**
  - `/api/auth` and `/api/projects` sit over a database adapter (Supabase, plus in-memory for tests);
  - sessions use HttpOnly cookies;
  - client sync merges by id, and the newer copy wins;
  - the Sign in button appears only once `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in Vercel. Owner steps are in `docs/accounts-setup.md`.
- **Results:** `npm run check` passes 182 unit tests. `npm run e2e` passes 27 tests.
- **Finish review:** one round returned "fix" with eight findings. Seven are applied and one was declined; reasons are in `DECISIONS.md`. The fixes were not re-scored.
- **Docs:** `DESIGN.md` and `.impeccable/design.json` now document direction A.
- **Accounts verified live by the owner:** sign-up, saving, renaming, and the same designs showing in a second browser.

---

## v2 (overnight build, 2026-10-22) — complete

`V2PLAN.md` is the spec; every judgment call is in `DECISIONS.md`. All seven milestones are pushed to `main`:

1. **Pick a design:** a 3×3 board (number keys 1–9) leads to a screen per design with its presets as a numbered list.
2. **Designer:** in the new world, with **quick mode** as the default: one decision per screen, and all settings one key away (A/Q).
3. **Every other page:** restyled in the new world, with the shared components rebuilt in its vocabulary.
4. **How-to-use animation:** the articulated hand opens while the part is lined up and closes onto it.
5. **Presentation mode:** `VITE_PRESENTATION_MODE=1` hides every disclaimer, including the strength badge. See the README.
6. **Saved projects:** a shelf on Home with a "Continue where you stopped" choice, plus the Brief → Measure → Check → Print step strip.
7. **Impeccable finish review:**
   - Round 1 returned *fix* with seven findings.
   - Round 2 scored six resolved and one partial (the phone toolbar), and found one regression (the 512 px turn frames looked soft on high-density screens).
   - Both remaining items are fixed (the toolbar wraps; turn frames are 1024 px) but were not re-scored, because the run's two-round budget was used.
   - `DESIGN.md` and `.impeccable/design.json` document the built world.

Results:
- `npm run check`: 167 unit tests.
- `npm run e2e`: 27 tests, all passing.

Deferred to a later version (owner decision):
- new user-facing features;
- accounts and an online dashboard;
- calibration data from real break tests.

---

# v1 status

Last updated by the v1 overnight build. `PLAN.md` is the v1 spec.

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
- Ghost objects are simple stylised shapes; the hand is a procedural articulated mannequin hand (`src/viewer/Hand.tsx`, `handModel.ts`) posed by joint angles. In the how-to-use animation the hand opens while the part is lined up and closes onto it (per-step `hand` closure, eased; instant under reduced motion).
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
