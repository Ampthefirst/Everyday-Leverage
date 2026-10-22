# Decisions log

One line each: decision — reason.

- React 19, Vite 8, Tailwind 4, Zustand 5, zod 4, React Router 7 — current stable releases; PLAN.md updated to React 19.
- TypeScript pinned to 5.9 — typescript-eslint does not yet support TS 6+/7.
- Playwright pinned to 1.56.1 — matches the preinstalled Chromium build (1194) in the build container.
- Dropped `@vercel/node` dev dependency; `/api` functions use the Web `Request`/`Response` signature — fewer deps, no audit warnings, easy to unit-test.
- Atkinson Hyperlegible self-hosted via @fontsource — legible for low-vision users and works offline.
- Added `src/families/` for the family contract objects (schema, presets, specs) next to PLAN's layout — the UI can import a family without the geometry kernel.
- 2D outputs use one small in-house drawing model (`src/outputs/svg/ir.ts`) rendered to SVG, jsPDF and DXF, instead of SVG → svg2pdf.js — one source for all three formats, testable in Node, exact mm→pt control for the 25 mm square.
- Family `repair(p, keep)` added to the contract: fixes dependent params after a change and powers both the "Fix it for me" button and the Stage 2 min/max tests.
- A1 slip model (assumed, labelled): crush ribs 1.2 N per mm of engagement, μ = 0.3, M3 clamp preload 500 N. Slip check only for round handles (flat/oval handles cannot spin).
- A2 band check uses a "peel" moment F × (pocket depth + band) because the hand supports the band; a free-cantilever model called every real cuff a failure.
- B2 multi-key holds keys in parallel slots (pick one) rather than a pivoting fan — simpler, stronger, no moving parts.
- C1 screw-on version is a D-handle with blind 3.4 mm pilot holes; screws go in from inside the drawer.
- C2 "plunger" = straight pusher with a self-centring cup; "lever" = bent pusher. No moving parts or springs in v1.
- Geometry results drop disconnected specks under 1 mm³ (boolean slivers); larger extra pieces still fail the tests.
- Cross-section view: manifold `slice()` at the cut, inner offset by the shell thickness → solid shell ring + hatched infill; the kept half is the one facing the default camera.
- `/api` functions are self-contained (no imports from `/src`) and use the Web `POST(request)` signature, so Vercel bundles them without ESM path/JSON-import surprises; a unit test keeps their allowed answer values identical to `src/finder/tree.json`.
- Gemini reply verification extracts number+unit pairs, normalises N·m↔N·mm, cm↔mm, %↔fraction, and allows 1% rounding; any unmatched number → template wording.
- If `/api/*` answers 503/404 (no key, or running on a static host) the Gemini features hide for the rest of the session.
- Task-finder ties within 1 point are shown side by side (bottle caps: B1 vs B3).
- Offline after first visit via a hand-written service worker (`public/sw.js`) plus a build-time `precache.json` of every asset — no extra plugin dependency; navigations are network-first so new deploys show up, hashed assets are cache-first.
- Calibrate shows predicted (published data) vs measured break loads side by side — the guide's "one measured result beside the prediction".
- No `maxOutputTokens` on Gemini calls: on thinking models the thinking tokens count against it and cut replies off; the prompts keep replies short and the server truncates text to 1200 characters.
- Impeccable design skill (v0.1.16, Apache-2.0) vendored into `.claude/skills/impeccable` from github.com/pbakaus/impeccable so every session has it; its engine binary downloads (checksum-verified) to ~/.impeccable on first use. Auto-check hooks not enabled yet.
- PRODUCT.md (Impeccable init): v2 redesign is tuned first for judges/evaluators at a presentation or competition; only the product name is a fixed brand commitment; presentation mode recorded as a planned capability.
- v2 visual direction: 'Bulletin board at 2 a.m.' (ANSI BBS world), chosen by the owner after two re-rolls steered to techy/bold dark; brief in docs/v2-ui-brief.md.
- v2 is dark-only (owner); fonts VT323 (display/menus) + Atkinson Hyperlegible Mono (text) — terminal character with a low-vision-designed reading face, both OFL and self-hostable via @fontsource.
- Part renders (public/renders/*.webp) come from a dev-only render page (render.html) driven by scripts/render-parts.mjs: the app's own geometry, three.js studio lighting, group filament colours (A cyan, B magenta, C amber), neutral tone mapping; provenance embedded in each file. Regenerate with npm run render:parts.
- Hand ghost to become a procedural articulated mannequin hand (palm + 3-segment fingers + opposable thumb, joint-angle poses fitted to the real grip size) rather than a downloaded rigged model — no licensing, light, exact grip fit.
