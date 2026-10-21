# Everyday Leverage — conventions for Claude Code

`PLAN.md` is authoritative for v1; `docs/everyday-leverage-guide.md` is the product spec.
Log every judgment call in `DECISIONS.md` (one line: decision + reason). Keep `STATUS.md` current.

## Commands
- `npm run dev` — local dev server
- `npm run check` — typecheck + lint + unit tests + build. Must be green before every push.
- `npm run e2e` — Playwright smoke tests (builds and serves on :4173)

## Hard rules
- **Units:** mm, N, N·mm, MPa internally. Display torque in N·m. Conversions live in `src/types/units.ts`.
- **Badge rule:** every strength verdict, the heat-map, and the print sheet show the
  "Uncalibrated estimate" badge (or "Calibrated to [printer]" when calibration is active). Never hide it.
- **Heat-map is computed** from the same strength model as the verdicts (`src/strength/field.ts`).
- **Validation lives on parameters**, not mesh analysis. Family schemas enforce cross-parameter
  constraints with zod `superRefine` and return plain-language fixes.
- **All outputs come from parameters** (drawings, templates, sheets), never from projecting the mesh.
- **Not a medical device.** Never collect conditions or diagnoses. Task-finder answers are never persisted.
- **Local-first.** Everything but `/api` (Gemini, opt-in) works offline. Secrets only in Vercel env
  (`GEMINI_API_KEY`, `GEMINI_MODEL`), never `VITE_`-prefixed.

## Family contract
Each sub-family (A1…C3) is one object implementing `Family<P>` in `src/families/types.ts`, with its
geometry builder in `src/geometry/families/` (runs in the manifold worker) and its strength model in
`src/strength/families/`. The Designer, outputs, and print tools only talk to the contract.

## Layout
See PLAN.md §2. `src/families/` holds the contract objects (schema, presets, variants, specs) — added
alongside the plan's layout so the UI can import a family without pulling in geometry.
