# Everyday Leverage — v1 Build Plan

Build plan for Claude Code. The product spec is `docs/everyday-leverage-guide.md` (the original development guide — add it to the repo). This file decides **how** to build it. Where the two conflict, this file wins for v1.

## 0. Ground rules for v1

- **Goal:** a deployed, feature-complete v1 on Vercel. All 9 sub-families and all capabilities from the guide, with polished UI/UX.
- **Strength numbers are uncalibrated in v1.** Compute them from published material data with standard FDM reductions (§5). Every strength verdict, the heat-map, and the print sheet carry a visible **"Uncalibrated estimate"** badge until the user enters calibration data (§5.7). Never remove or hide this badge in v1.
- **The heat-map is computed, not painted.** It comes from the same strength model as the verdicts (§5.6), so the colors and the numbers always agree.
- **The app is not a medical device.** Keep the "is / is not" limits and the out-of-scope routing from the guide. Never collect conditions or diagnoses.
- **Local-first.** Everything except the optional Gemini features runs in the browser and works offline. Profiles live in `localStorage` only.
- **Units:** mm, N, N·mm, MPa internally. Display N·m for torque.
- Every stage ends deployable: build passes, tests pass, preview deploy works.

## 1. Stack

| Concern | Choice |
| --- | --- |
| App | React 19 + Vite + TypeScript (strict) |
| Styling | Tailwind CSS, design tokens in `src/styles/tokens.css`, light/dark |
| State | Zustand (one store per domain: design, settings, profile, calibration) |
| Routing | React Router |
| 3D view | three.js via @react-three/fiber (v9+, React 19) + @react-three/drei |
| Geometry kernel | `manifold-3d` (WASM), run in a Web Worker |
| Validation | zod schemas per family (params, ranges, defaults) |
| 2D output | SVG generated from parameters; PDF via `jspdf` + `svg2pdf.js`; DXF via a small in-house writer |
| Mesh export | Binary STL (in-house writer); 3MF via `fflate` zip + XML |
| LLM | Gemini through Vercel serverless functions in `/api` using `@google/genai`; model name from env `GEMINI_MODEL` |
| Tests | Vitest (unit), Playwright (e2e smoke) |
| Deploy | Vercel (Vite preset + `/api` Node functions) |

**Export decision (settled):** STL + 3MF. No STEP in v1. 2D drawings and templates come from the **parameters**, not from projecting the mesh.

## 2. Repo layout

```
/api
  describe.ts        # free text -> task-finder answers (Gemini, JSON schema)
  explain.ts         # computed facts -> friendlier wording (Gemini)
/docs
  everyday-leverage-guide.md
/public
/src
  app/               # routes, layout, providers
  pages/             # Home, TaskFinder, Designer, Calibrate, Learn, About/Limits
  components/        # UI kit: Button, Slider, NumberField, Stepper, Badge, Meter, Sheet...
  viewer/            # R3F scene, ghosts, cross-section, heat-map, animations
  geometry/
    worker.ts        # manifold-3d worker entry; message protocol
    primitives/      # shaftSleeve, leverArm, socketCup, loop, clip + helpers
    families/        # a1-buildup-grip.ts ... c3-door-reach.ts
    split.ts         # auto-split + joint for oversize parts
  strength/
    materials.ts     # PLA/PETG constants with source notes
    sections.ts      # section properties (hollow round, rect, thin-walled closed)
    checks.ts        # bending, torsion, bearing, tear-out, buckling, hoop
    families/        # per-family load cases + critical sections
    field.ts         # stress field for heat-map
    calibration.ts
  print/
    bedfit.ts orientation.ts validator.ts settings.ts estimates.ts
  outputs/
    svg/ drawing.ts template.ts net.ts gauges.ts mounting.ts
    pdf/ printSheet.ts requestSheet.ts package.ts
    stl.ts threemf.ts dxf.ts
  finder/
    tree.json router.ts
  llm/               # client wrappers, opt-in state, offline fallback
  learn/             # lever explainer, failure guide, material comparison
  profiles/          # local profiles, share links (URL hash)
  styles/
  types/
/tests (unit + e2e)
CLAUDE.md
vercel.json
```

## 3. Core architecture

**Family contract.** Every sub-family exports one object:

```ts
interface Family<P> {
  id: 'A1'|'A2'|'A3'|'B1'|'B2'|'B3'|'C1'|'C2'|'C3';
  name: string; blurb: string;            // plain language
  schema: ZodSchema<P>;                   // ranges, defaults, units
  presets: Preset<P>[];                   // task presets (no raw params needed)
  variants: VariantDef[];                 // style variants -> param patches
  build(p: P): GeometryRequest;           // runs in worker via primitives
  loadCases(p: P, use: UseContext): LoadCase[];
  criticalSections(p: P): CriticalSection[];   // strength + heat-map anchors
  stressField(p: P, lc: LoadCase): StressFieldFn;
  drawing(p: P): DrawingSpec;             // views + dimensions from params
  template(p: P): TemplateSpec;           // 1:1 fit-check outline(s)
  net?(p: P): NetSpec;                    // foldable mock-up
  ghost(p: P): GhostSpec;                 // object shown around the part
  animation(p: P): AnimationSpec;         // "how to use"
  orientation(p: P): OrientationAdvice;
  measureGuide: MeasureStep[];            // illustrated measurement steps
  rules(p: P): ValidationIssue[];         // family-specific printability rules
}
```

**Pipeline:** params (store) → zod validate → worker builds the Manifold → returns mesh + bbox + volume → the viewer renders it; at the same time, strength, print-readiness, and outputs compute from **params only**. Debounce rebuilds at 120 ms and show a subtle "updating" state. Cancel stale worker jobs by request id.

**Validation lives on parameters**, not on mesh analysis. Example: wall at groove = gripOD/2 − shaft/2 − grooveDepth ≥ minWall.

**Cross-parameter constraints.** The per-parameter ranges in §4.2 are independent bounds; not every combination of them is buildable (e.g. A1 allows a 25 mm shaft and a 20 mm grip OD, but the grip must enclose the shaft). Each family schema enforces its dependencies with zod `.superRefine` (e.g. A1 gripOD ≥ shaftMax + 2·(clearance + minWall + grooveDepth)) and returns a plain-language fix. Where a dependent range can be derived, the UI clamps the slider to it instead of letting the user reach an invalid value.

## 4. Geometry

### 4.1 Primitives (`geometry/primitives`)
Build these five once, then compose them:

1. **shaftSleeve** — extruded tube. Outer profile: round, oval, or rounded-rect. Inner pocket matches the target shaft (round/rect/oval) + clearance. Options: crush ribs (3–6 ribs, 0.3 mm interference) for slip-fit; a split-clamp variant with a slot and an M3 bolt boss plus nut trap.
2. **leverArm** — rounded-rect cross-section, linear taper root→tip, end grip pad, optional finger scallops. Rounded edges via `CrossSection.offset(round)` before extrusion. Approximate fillets with rounded 2D profiles; manifold has no 3D fillet.
3. **socketCup** — pocket of a given profile (round, hex, star-n, cross, D, key-slot, stepped multi-diameter) in a boss; optional teeth (serrated ring) or a groove for a rubber band.
4. **loop** — stadium ring (finger loop / whole-hand loop) or T-bar; minimum bend radius enforced.
5. **clip** — C-clip with snap opening angle, lip, and wall; or strap-on band with strap slots.

**Helpers:** knurl/texture ridges, finger grooves, thumb rest, strap slot, screw holes (countersunk), alignment pins, text emboss (family ID + size, e.g. `B1-68`).

### 4.2 Families: parameters, variants, critical point

All ranges are zod-enforced, plus the cross-parameter constraints from §3. Defaults are sensible for an average adult and documented in each schema.

| ID | Key parameters (mm unless noted) | Variants | Critical check(s) |
| --- | --- | --- | --- |
| A1 Build-up grip | shaft profile (round/rect/oval), shaft dims 3–25, grip OD 20–50, length 60–160, clearance 0.15–0.5, hand L/R | finger grooves (count, depth), thumb rest, texture, slip-fit vs split clamp | min wall at grooves; slip torque (clamp/rib friction) vs use torque |
| A2 Universal cuff | palm width 60–110, palm circumference, band width 25–45, band thickness 2.5–4, utensil slot w×t, slot angle 0–45° | open C vs closed, strap slots | strap-slot tear-out; band bending at the opening |
| A3 Tool handle adapter | shank shape (hex/round/flat), shank size, depth, grip Ø 25–45, length, angle | T, pistol, mushroom; set-screw/nut trap | bearing stress on socket flats; neck torsion |
| B1 Lid & jar opener | lid Ø min–max 20–110, steps 1–5, cup depth, lever 80–250, tooth profile | stepped vs single, 1- or 2-hand, wall-mount (V-wedge + screw holes) | lever-root bending; cup wall hoop/bearing |
| B2 Key & knob turner | blade t 1.5–4, width 15–35, insert depth, knob Ø, lever 50–120 | single vs multi-key (fan), flat vs angled; retention bolt | slot-to-lever junction bending; slot side bearing |
| B3 Cap & tap turner | socket profile (star/cross/D/round), Ø, depth, lever length | star, cross, D sockets | socket wall bearing; **fatigue** (repeated twist → reduced allowable) |
| C1 Pull handles | target hole/slot size, loop width, pull length, attachment (ring/hook/screw) | finger loop, whole-hand loop, T-pull | loop tension (curved-beam factor); layer splitting → orientation |
| C2 Press & touch aids | target size, press depth, reach 20–200, tip shape | lever vs plunger; stylus tip (note: needs conductive tip/filament) | Euler buckling at long reach; tip bearing/wear note |
| C3 Door & reach aids | lever Ø, extension 50–330, hook radius | clip-on vs strap-on | bending at long lengths; split joint when oversize |

### 4.3 Ghost objects (`viewer/ghosts`)
Procedural, translucent: jar + lid (sized from lid Ø), utensil/pen/toothbrush (sized from shaft), key (blade dims), round knob, faucet cross/lever, stove knob (D), drawer + pull, zipper pull, can tab, button/switch plate, door lever. A **stylized hand** built from capsules, scaled by hand breadth, with L/R mirroring.

### 4.4 Auto-split (`geometry/split.ts`)
Only triggers when the part exceeds the bed after the best rotation (mainly C3). Cut perpendicular to the long axis at the lowest-moment location that makes both halves fit. Add a dovetail key + 2 alignment-pin holes. Apply joint strength factor **0.5** in the strength model, and show "printed in 2 parts" in the outputs.

## 5. Strength model (uncalibrated v1)

### 5.1 Materials (`strength/materials.ts`)
Each constant carries a `source` note and an `assumed: true` flag.

| | PLA | PETG |
| --- | --- | --- |
| Tensile strength, in-plane printed (σ_xy) | 45 MPa | 40 MPa |
| Interlayer (Z) strength fraction | 0.55 | 0.70 |
| Young's modulus | 3.3 GPa | 2.0 GPa |
| Shear strength ≈ | 0.6·σ | 0.6·σ |
| Softening temp | 55–60 °C | 70–80 °C |
| Creep under sustained load | high (warn) | moderate |
| Fatigue allowable fraction (repeated use) | 0.35 | 0.45 |

### 5.2 Section model
- Shell thickness `t = walls × lineWidth`. Treat the part as a hollow section with that shell.
- The core contributes `infill × k_infill` of its solid stiffness/strength (`k_infill = 0.3`, assumed).
- Section properties: hollow round (I, J), hollow rounded-rect (I; torsion via Bredt thin-walled closed section `τ = T / (2·A_m·t)`), solid fallback when the part is thinner than 2t.

### 5.3 Checks (`strength/checks.ts`)
Bending `σ = M·c/I`; torsion (round `τ = T·r/J`, closed thin-wall Bredt); bearing on socket flats `σ_b = T / (n·r_eff·A_flat)`; strap/slot tear-out `τ = F / (2·e·t)`; Euler buckling `F_cr = π²EI/(K·L)²`, K = 2 (cantilever); curved-beam loop tension with a factor of 1.3. Combine stresses with von Mises where both are present.

**Stress concentration Kt** (assumed): sockets/slots 2.0, groove roots 1.6, junctions without fillet 2.2, with fillet ≥ 2 mm 1.5.

### 5.4 Orientation
Each critical section declares its principal stress direction. If that direction crosses layers for the chosen orientation, the allowable is `σ_xy × Z-fraction`. The orientation advisor (§7) picks the placement that maximizes the minimum margin.

### 5.5 Loads and verdict
Default loads per task (assumed; editable, shown with the "assumed" tag):

| Task | Default |
| --- | --- |
| Jar lid | 4 N·m (heavy preset 8 N·m) |
| Key | 0.6 N·m |
| Knob/tap/cap | 1.5 N·m |
| Tool socket (A3) | 2 N·m |
| Drawer/door pull | 40 N |
| Zipper/tab | 20 N |
| Button press | 15 N |
| Utensil grip (A1/A2) | 30 N grip, 0.3 N·m twist |
| Reach/door lever (C3) | 30 N at tip |

The task finder's light/moderate/heavy answer scales loads by ×0.6/×1/×1.6. Safety factor default **2.0**, adjustable 1.2–4. Utilization `u = σ·SF / σ_allow`.

Verdict: **comfortable** u < 0.6 · **marginal** 0.6–1.0 · **likely to fail** > 1.0, plus a one-line reason naming the governing section and check. The "Show the math" panel lists the inputs, formulas, values, and governing case. Heat warnings (dishwasher, hot car, stove proximity) come from the use location.

### 5.6 Heat-map (`strength/field.ts`)
Each family returns `stressField(point) → utilization`, built from its load case: the moment distribution along levers (`M(x) = F·(L−x)`), torsion along shafts, bearing around sockets, plus a Kt bump with a smooth falloff (radius ≈ 3·t) near features. The viewer evaluates it per vertex and colors on a blue→green→amber→red scale with a legend and the **"Uncalibrated estimate — not FEA"** badge. Toggling it off restores normal material.

### 5.7 Calibration (built in v1, data later)
- Standard test bar: 80 × 10 × 4 mm cantilever, clamp 20 mm, hang the load at 50 mm; print flat (XY) and upright (Z). Downloadable STL + an instruction sheet.
- The user enters break loads (≥ 3 per orientation per material). The app computes `σ = 6·F·a/(b·h²)`, fits σ_xy and the Z-fraction, and stores a calibration profile (local + export/import JSON).
- When calibration is active, the badge changes to **"Calibrated to [printer name]"**. The print-request sheet notes that calibration applies only to that printer.

## 6. Task finder (`finder/`)
- `tree.json` holds the 7 questions from the guide, one per screen, with big targets, back, and a visible skip.
- The router returns the best match + 2 alternates and a preset.
- **Known overlap:** bottle caps fit both B1 (open, lid or bottle) and B3 (turn, cap). Route "open + bottle" and "turn + cap" as ambiguous between B1 and B3 (side-by-side preview), ordered by the motion answer; small caps (< 40 mm, if a size is given) favor B3, jar lids favor B1. Cover this in the routing tests. Ambiguous answers route to the top 2 with a side-by-side preview. Out-of-scope answers (pain, injury, body load-bearing, medical device) show the plain OT/doctor note and produce no design. No match → manual family picker.
- Answers are never persisted. The "for someone else" answer switches copy to the second person.
- Unit tests cover every path in the routing table from the guide.

## 7. Print-readiness (`print/`)
- **Bed fit** against 256³ mm. Try axis-aligned and 45° diagonal placements; the diagonal limit is ≈ 330 mm with margins. If nothing fits → auto-split.
- **Validator** on params: min wall ≥ 2 × line width (and ≥ 1.2 mm), overhang ≤ 50° or flagged for supports, fillet ≥ 1 mm at stress corners, clearance 0.15–0.5 mm, min feature ≥ 0.8 mm. Issues use the severities error/warn/info, each with a plain fix ("Increase grip diameter to at least 26 mm").
- **Orientation advisor:** a recommended placement, support needs, and the strength reason.
- **Settings sheet:** walls, infill, layer height, material, with a reason for each; filament estimate from volume (shell + infill model; PLA 1.24, PETG 1.27 g/cm³) and time estimate (volumetric rate assumption 8 mm³/s, labeled rough).
- **Fit-test mini-print:** a thin slice of the critical fit feature (socket, sleeve bore, slot) as a separate STL.

## 8. Outputs (`outputs/`)
All outputs are generated from params, so they never drift from the 3D part.

- **3D:** binary STL, 3MF (unit = mm, metadata: family, params, settings), fit-test STL, and STL per piece when split.
- **Dimensioned drawing (SVG + PDF):** front/side/top + section view, key dimensions, tolerances, parameter table, title block.
- **1:1 fit-check template (PDF + SVG):** full-scale outline/cross-section, **25 mm scale square**, a "print at 100% / Actual size" instruction, US Letter and A4, and tiling with alignment marks + a page map when oversize. PDF units: 1 mm = 72/25.4 pt; unit-test this.
- **Print sheet PDF:** material, settings, orientation, strength verdict + badge, the user's measurements, heat warnings, not-food-safe note.
- **Request-a-print sheet PDF:** plain language for a librarian or print service; includes the file list, settings, the calibration caveat, and an editable "where to print" field (default text: "many schools, libraries and makerspaces").
- **Foldable size mock-up (net):** for A1, A3, B1, C1, labeled "size mock-up — not a functional part".
- **Mounting template:** for wall-mount B1 (screw positions).
- **Measuring gauges:** lid-diameter and shaft-size gauges with a scale check.
- **DXF:** of the template and drawing outlines.
- **Package download:** one zip with everything (`fflate`).

## 9. UI / UX

**Routes:** `/` (Home: what it is/isn't, two entry points: "Help me find a design" and "Pick a design"), `/find` (task finder), `/design/:familyId` (Designer), `/calibrate`, `/learn`, `/limits` (about, limits, sources, safety), `/print-help`.

**Designer layout:** desktop = viewer left, a panel right with tabs **Fit · Style · Strength · Print · Get files**; mobile = viewer on top with a bottom sheet. Presets are the first thing in the panel; raw parameters sit under "Fine-tune". Measurement fields open the illustrated guide (SVG illustrations per `measureGuide` step).

**Viewer controls:** orbit/zoom/reset, ghost on/off, cross-section slider (clipping plane with capped section; show the shell ring and a hatched infill fill), heat-map toggle, play "how to use" animation, L/R mirror.

**Strength tab:** traffic-light meter, one-line reason, sliders for safety factor and load, material switch, "Show the math", badge.

**Accessibility (hard requirements):** WCAG 2.2 AA, tap targets ≥ 48 px, **large-text mode** (root scale 125%/150%), high-contrast theme, full keyboard operation, visible focus, `prefers-reduced-motion` honored (animations become step images), and screen-reader labels on every control and on the meter.

**Profiles & sharing:** named local profiles (measurements + preferred hand + material); share links put the family + params in the URL hash, never measurements tied to a name.

**Learn:** a mechanical-advantage explainer (lever-length slider → force readout + live diagram); a "Why did it fail?" guide (pick where it cracked → cause + fix, linked to the strength concept); a material comparison page (defaults, or the user's calibration data when present).

**Tone:** plain language, no jargon without a tooltip, every limit stated where it applies.

## 10. Gemini features (`/api`, `src/llm`)
- **Opt-in toggle** with a notice: "Your text is sent to Google's Gemini to interpret it. Nothing else leaves your browser." Off by default.
- `POST /api/describe` — `{ text ≤ 500 chars }` → structured task-finder answers (Gemini JSON schema → zod validated). **The decision tree still makes the routing decision.** Out-of-scope language → the same OT note.
- `POST /api/explain` — `{ facts: ComputedFacts }` → friendlier wording. The client verifies every number in the reply matches `facts`; on any mismatch or error, show the template text instead. Verification is unit-aware: extract number + unit pairs, normalize to internal units (mm, N, N·mm, MPa; N·m ↔ N·mm, cm ↔ mm, %↔ fraction), and compare with a relative tolerance of 1% to allow rounding. Unitless numbers must match a fact value directly. The prompt also asks Gemini to keep the units given in `facts`.
- **Server hygiene:** key only in `GEMINI_API_KEY` (Vercel env, never `VITE_`-prefixed), same-origin check, body size cap, max 1 request in flight per client (client-side), short timeout, no logging of user text.
- With no network or no key, the features hide gracefully and everything else works.

## 11. Stages (parallelizable)

Each stage lists tracks that can run in parallel (separate worktrees/sessions), then merge. Every stage ends with green tests and a Vercel preview.

**Stage 0 — Scaffold (single track)**
Prerequisite (done by the owner, not by Claude Code): import the GitHub repo into Vercel and set `GEMINI_API_KEY` and `GEMINI_MODEL` as Vercel environment variables. Vercel then builds a preview for every pushed branch and production from the default branch. If this is not done yet, build and commit everything anyway and log the deploy step in STATUS.md.
Vite + React + TS + Tailwind, router, Zustand, Vitest, Playwright, ESLint/Prettier, `CLAUDE.md` with conventions (units, family contract, badge rule), `vercel.json` (SPA rewrite excluding `/api`), CI script `npm run check` = typecheck + lint + test + build. Deploy an empty shell to Vercel.

**Stage 1 — Cores (3 tracks)**
- 1a Geometry: manifold worker, message protocol, 5 primitives + helpers, unit tests (non-empty, manifold, positive volume, bbox matches params ± 0.1 mm).
- 1b Strength: materials, sections, checks, verdict, show-the-math data, tests against hand-calculated cases (≥ 2 per check).
- 1c UI shell: design system components, Designer layout, viewer scene with orbit/ghost/cross-section/heat-map plumbing (heat-map fed by a dummy field), large-text and contrast modes.

**Stage 2 — Families (3 tracks: A, B, C)**
Implement all three families per track against the contract: schema, presets, variants, build, loads, critical sections, stress field, drawing/template/net specs, ghost, animation, orientation, measure guide, rules. Test: every preset builds a valid manifold that fits the bed (or splits, for C3). For each param, its min and max — with the other params at defaults, adjusted only as needed to satisfy the cross-parameter constraints (§3) — also build. Separately, test that invalid combinations are rejected by the schema with a fix message.

**Stage 3 — Outputs & print-readiness (2 tracks)**
- 3a: STL, 3MF, fit-test, split, bed fit, validator, orientation, settings and estimates.
- 3b: SVG drawing, template + tiling, nets, gauges, mounting, DXF, all PDFs, zip package. Test: the 25 mm square measures exactly 70.866 pt in the PDF.

**Stage 4 — Guidance layers (3 tracks)**
- 4a: task finder + routing tests + out-of-scope handling.
- 4b: Gemini functions + client + opt-in + fallback + number verification.
- 4c: Calibration page, Learn pages, profiles/share links, Limits/About page with sources.

**Stage 5 — Polish & release (single track)**
Accessibility audit (axe in Playwright), mobile pass, performance (geometry rebuild < 300 ms for typical params on a mid laptop; code-split the viewer/manifold), copy review against the claims table in the guide, Playwright e2e: finder → design → download package for one family per letter group. Production deploy.

## 12. Definition of done (v1)
- All 9 families buildable from presets and fine-tune, with ghost, cross-section, heat-map, and animation.
- Strength verdict + show-the-math + badge on every design; calibration flow works end-to-end with sample data.
- Every output in §8 downloads and opens correctly; the template prints true to scale on Letter and A4.
- Task finder covers all routing rows + edge cases; Gemini features work when enabled and degrade cleanly when not.
- WCAG 2.2 AA checks pass; works on a phone.
- The `/limits` page states the is/is-not table, the uncalibrated status, not-food-safe, heat limits, and the OT referral.
- Deployed on Vercel production with `GEMINI_API_KEY` and `GEMINI_MODEL` set.

## 13. Known v1 limitations (state these in the app)
- Strength numbers and the heat-map are uncalibrated analytic estimates, not FEA and not test-verified.
- Fillets are approximated by rounded profiles.
- Time and filament estimates are rough.
- Calibration applies only to the printer that printed the test bars.
