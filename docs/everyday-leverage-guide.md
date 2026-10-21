# Everyday Leverage: Development Guide

Oct 20, 2026 · @Adway

## Context and story

Everyday Leverage is a web app that turns a described task and a few measurements into a custom-fit, strength-checked aid that lowers the force a daily task needs. This section holds the reasoning behind it; the rest of the document is the toolbox. Read it before building and again before writing anything about the app.

### The problem

Many everyday tasks quietly demand more grip strength, wrist rotation, or finger dexterity than some people have: opening a jar, turning a key, holding a spoon, pulling a drawer. People who struggle with them include older adults, people with arthritis or a hand injury, people recovering from surgery, and anyone with a weak or unsteady grip.

Fixes exist, but each has a gap:

- **Store-bought aids** come in fixed sizes and fit some people poorly.
- **Custom aids** traditionally need a designer and a manufacturer, which most people don't have.
- **3D-printable designs** exist online, but choosing one, sizing it, and knowing whether it will break all take skills most people lack.

The gap this app targets: getting from "I can't do this task" to "here is a part sized for me, checked for strength, ready to produce," without needing CAD or engineering knowledge.

### Why a leverage theme

Every design in the app does one thing: it lowers the force or dexterity a task needs by adding mechanical advantage (a longer lever, a thicker grip, a better angle). That gives the app one clear idea instead of a pile of unrelated gadgets, and it means each design can explain its physics in a sentence.

### What the app is, and is not

| The app is | The app is not |
| --- | --- |
| A tool that turns a described task and a few measurements into a fitted, strength-checked design | A medical device, a treatment, or a substitute for an occupational therapist or doctor |
| A set of usable files: a 3D model, dimensioned drawings, a 1:1 fit-check template, and a print sheet | A guarantee of strength (the numbers are estimates, backed by whatever gets tested) |
| A way to make a first print more likely to work | Food-safe (printed plastic is porous) |

Stating these limits plainly inside the app keeps its claims accurate and its users safe.

### Printer access

Not everyone has a 3D printer, and the app shouldn't imply otherwise. The honest position: the hard part is designing a part that fits and won't break, and the app does that. Printing can be done by a university, library, makerspace, or print service.

The app supports this directly:

- A "request a print" sheet that explains the file, material, and settings to a non-expert.
- A fit-test mini-print, so one print slot goes further.
- 2D drawings and templates that are useful with only a paper printer.

Say "many schools and libraries" instead of "every school." Name one real local place where a part could be printed, confirmed in advance.

### Claims the app can support

| Safe to claim | Avoid |
| --- | --- |
| Designed from published ergonomic guidelines, with sources cited | "Clinically proven" or "treats arthritis" |
| Tested with [N] people, informal feedback | "Works for everyone" |
| Strength estimate compared against [N] real tests | "Guaranteed not to break" |
| Convenience aid | Anything resembling a medical device |
| Works with many printers and print services | "Everyone has access to 3D printing" |

### What the app must be able to show

These are the points where the app needs real evidence behind it, so build proof for each:

- **How it differs from existing customizers:** strength checking, the task finder, fit-check templates, and a narrow focus, not just "it makes handles."
- **Why its strength numbers can be trusted:** calibration to a real printer, with at least one measured result beside the prediction.
- **That someone used it:** at least one named real user, even informally.
- **What it offers without a printer:** the print-request path and the 2D outputs.
- **That the logic is understood:** every major piece of logic explainable in two sentences. Keep personal notes and commit history as the build goes.

By the end of development, the app should be able to show one real person's problem, one part designed through it, one printed and tested prototype, one measured result, and a clear path from input to output. Everything else is bonus.

## The framework: 3 large families, 9 sub-families

The theme is aids that reduce the force or dexterity a daily task requires, by adding mechanical advantage. Each sub-family is one parametric template with its own geometry, parameters, validator rules, and tests. Different parameter values on the same template are free; a different structure or different strength equations makes a new sub-family.

**Print constraints used throughout:** 256 × 256 × 256 mm bed (realistic maximum part length about 330 mm along the diagonal, allowing for brims and margins), PLA and PETG only.

### A. Hold (gripping)

| Sub-family | What it does | Key parameters | Style variants | Strength-critical point |
| --- | --- | --- | --- | --- |
| A1. Build-up grip | Thickens thin handles (utensils, pens, toothbrushes) | Shaft size and cross-section, hand breadth, length | Finger grooves, thumb rest, texture, left/right, slip-fit vs. split clamp | Slipping on the shaft; thin wall at grooves |
| A2. Universal cuff | Holds a utensil against the palm | Palm width and circumference, slot size and angle | Open vs. closed, strap slots | Strap slot tear-out |
| A3. Tool handle adapter | T-handle or pistol grip for small tools | Shank shape and size, grip diameter, angle | T, pistol, mushroom; hex or round socket | Torque at the socket |

### B. Turn and open (twisting)

| Sub-family | What it does | Key parameters | Style variants | Strength-critical point |
| --- | --- | --- | --- | --- |
| B1. Lid and jar opener | Lever with a gripping cup | Lid diameter range and height, lever length, tooth profile | Stepped multi-size vs. single, one- or two-hand, wall-mount | Lever root |
| B2. Key and knob turner | Slotted lever for keys and knobs | Blade thickness and width, knob diameter, lever length | Single vs. multi-key, flat vs. angled | Key slot to lever junction |
| B3. Cap and tap turner | Fits caps, faucet handles, stove knobs | Profile, diameter, lever length | Star, cross, D-shaped sockets | Socket wall; fatigue from repeated twisting |

### C. Pull, push and reach (linear force)

| Sub-family | What it does | Key parameters | Style variants | Strength-critical point |
| --- | --- | --- | --- | --- |
| C1. Pull handles | Loops and handles for drawers, zippers, can tabs | Hole or slot size, loop width, pull length | Finger loop, whole-hand loop, T-pull | Layer splitting; print orientation decides |
| C2. Press and touch aids | Button pushers, switch extenders, stylus grips | Target size, press depth, reach | Lever vs. plunger | Tip wear; bending at long lengths |
| C3. Door and reach aids | Lever extenders, hooks, pull loops | Lever diameter, extension length, hook radius | Clip-on vs. strap-on | Bending at long lengths |

### Shared geometry core

Most sub-families reduce to about five primitives: a shaft sleeve, a lever arm, a socket or cup, a loop, and a clip. Building these once and composing them turns nine sub-families into variations on a small set of parts instead of nine separate projects.

## Capability: task finder (optional questionnaire)

The task finder is a fixed, pre-written decision tree that routes a person to the most likely family. The routing is deterministic, so it works offline and every branch can be explained.

### Design principles

- **Ask about tasks and motions, never conditions.** "What are you trying to do?" and "What goes wrong?", not "What diagnosis do you have?" The app can't diagnose anything and shouldn't collect health data.
- **Keep it short.** 5-7 questions, one per screen, large tap targets, a back button, and a visible skip.
- **Always end in an editable result.** The output is a best match plus two alternates. The person lands in the normal parameter view and can change anything, so a wrong route costs one click.
- **Local only.** Answers stay in the browser and aren't stored.

### Example question flow

1. What are you trying to do? (open, hold, turn, pull, push or press, reach)
2. What object? (jar or bottle, utensil or pen, key or knob, drawer or door, button or switch, other)
3. What goes wrong? (can't grip it, can't turn it, can't pull it, can't reach it, hand slips off)
4. Which hand, and does it need to work for either?
5. How much force does the task seem to need? (light, moderate, heavy)
6. Where will it be used? (kitchen, bathroom, desk, outdoors). This feeds material and heat warnings.
7. Is this for you or someone else? (changes the wording of later screens)

### Example routing logic

| Task and failure | Routes to |
| --- | --- |
| Hold, thin handle is hard to grip | A1 Build-up grip |
| Hold, grip can't be maintained at all | A2 Universal cuff |
| Hold, small tool, needs torque | A3 Tool handle adapter |
| Open, lid or bottle | B1 Lid and jar opener |
| Turn, key or round knob | B2 Key and knob turner |
| Turn, cap, faucet, stove knob | B3 Cap and tap turner |
| Pull, drawer, zipper, tab | C1 Pull handles |
| Press, small button or switch | C2 Press and touch aids |
| Reach, or door lever | C3 Door and reach aids |

### Edge cases to handle

- **Ambiguous answers** route to the top two families with a side-by-side preview, not a forced single guess.
- **Out-of-scope answers** (pain, injury, medical devices, anything load-bearing for the body) show a plain note: this app makes convenience aids, and an occupational therapist or doctor is the right person for this. No design is produced.
- **No match** says so honestly and offers the manual family picker.

### Optional layer

An LLM could turn a free-text description ("I can't open pickle jars") into the same structured answers, with the decision tree still making the routing decision. It should never be required or sit on the critical path.

## Capability: design and visualization

Every family gets a live 3D view, and the view is where a non-technical user decides whether a design fits their need.

- **3D viewer for every family** with orbit, zoom, and live parameter updates. This is the baseline.
- **Ghost objects:** the aid shown around a translucent jar, utensil, key, or hand, so fit is visible before printing.
- **Cross-section view:** the part sliced open to show walls and infill, which also makes the strength features understandable.
- **Simplified stress heat-map:** a color overlay showing where the part is most likely to fail. This is an estimate, not real finite-element analysis, and should be labeled that way.
- **"How to use" animations** for non-technical users.
- **Large-text mode and big tap targets,** because users may have limited hand function.

## Capability: strength estimation

The strength estimator takes print settings, material, and an expected load, and returns a plain-language answer. It is the technical differentiator of the app.

- **Inputs:** wall count, line width, infill density, layer height, material (PLA or PETG), and expected force or torque.
- **Core model:** outer walls carry most bending and torsion load, so shell thickness (walls × line width) usually matters more than infill. The app treats the part as a hollow section, which is simple and explainable.
- **Orientation check:** printed parts are weakest across layer lines. The app warns when the main load runs across layers and recommends a different orientation.
- **Material notes:** PLA is stiff but brittle and creeps under sustained load. PETG is tougher with better layer adhesion. PLA softens around 55-60°C and PETG around 70-80°C, so the app attaches heat warnings (dishwasher, hot car).
- **Output:** a traffic-light meter (comfortable, marginal, likely to fail) with a one-line reason, plus a "show the math" panel for technical users.
- **Safety factor:** visible and adjustable.
- **Calibration to the printer in use:** print standard test bars, break them with a spring scale or hanging weights, and enter the results so the app adjusts its material constants. This is probably the strongest feature in the list. Without it, the strength numbers are rough guides, not guarantees.

## Capability: print-readiness

These features make sure what the app produces can actually be printed on the target printer.

- **Bed-fit checker** against 256 × 256 × 256 mm, with diagonal placement suggestions for long parts.
- **Auto-split with a joint** for oversize parts. Joints add weak points, so the strength model must account for them.
- **Printability validator:** minimum wall thickness, overhang limits, fillets on stress corners, and clearance offsets for fit.
- **Orientation advisor** with a recommended placement and support needs.
- **Recommended settings sheet:** wall count, infill, layer height, material, and why, plus filament and time estimates.
- **Fit-test mini-print:** a small, quick print that checks one key dimension before committing to the full part.
- **"Request a print" sheet:** a plain-language page for a librarian, teacher, or print service explaining the file, material, and settings.

## Required: 2D outputs alongside the 3D file

Every design exports a 2D package generated from the same parametric model as the 3D file, so the drawings never drift from the part. The package is deliberately simple but must be reliable.

### Required outputs

- **Dimensioned drawing:** front, side, and top views (plus a section view where useful) with key dimensions, tolerances, and parameter values labeled. It doubles as documentation for a print service or teacher.
- **1:1 fit-check template:** a full-scale outline or cross-section the person holds against the real jar lid, utensil handle, or knob to check size before printing. This is the most useful 2D item and connects directly to the measurement feature.
- **Settings and print sheet (PDF):** material, wall count, infill, orientation, strength rating, and the person's own measurements on one page.

### Optional additions

- **Foldable size mock-up:** a paper or card net of the grip or handle volume, so someone can feel the size and shape before committing. Label it plainly as a size mock-up, not a functional part, since paper can't carry load.
- **Mounting or hole template** for wall-mounted designs, so the person can mark screw positions.
- **Measuring gauges:** lid-diameter and shaft-size gauges with a scale-check square.

### Cautions

- Paper printouts get scaled by default print settings. Include a scale bar and a "this square should measure 25 mm" check, and design for both US Letter and A4.
- Large parts won't fit on one page, so the template needs tiling with alignment marks, or a reduced-scale view labeled as such.
- Vector output (SVG or PDF) stays accurate at any scale. Raster images can scale incorrectly. DXF is an option for anyone with a laser cutter or CAD tool.
- A foldable mock-up is an aid to choosing a size, not a substitute for the printed part.

## Open decision: export formats (STL, STEP, or 3MF)

STL is the cheapest to ship and enough for printing; STEP is the better choice if the 2D drawings should come from real CAD geometry. The decision follows from the architecture, so settle the two together.

| Format | Strengths | Costs |
| --- | --- | --- |
| STL | Simple, universal, accepted by every slicer, easy to generate in a browser | Triangle mesh only: no editable geometry, no units, large at high resolution |
| STEP | Real CAD geometry with units, editable in CAD, drawing views come directly from the solid | Needs a CAD kernel (OpenCascade compiled to WASM, or a Python CadQuery backend); more complexity and file size; not what most slicers expect |
| 3MF | Middle option with units and metadata, accepted by most modern slicers | Less universal than STL; still a mesh |

If the geometry is built as meshes in the browser, 2D drawings can still be produced by projecting the mesh, but dimensions would need to come from the parameters instead of the geometry.

## Capability: personalization, optional intelligence, and education

### Personalization and ease of use

- **Guided, illustrated measurement,** a natural place for drawing and visual design skills.
- **Task presets** so non-technical users never see raw parameters. The task finder can set these automatically.
- **Comfort options:** left/right hand, texture, rounded edges.
- **Local saved profiles** and shareable settings links.

### Optional intelligence layers

- An LLM maps plain-language descriptions to presets and starting values, with all limits enforced in code.
- An LLM rewrites the app's own calculations in friendlier words. The facts come from the calculation, not the model.
- Everything must work offline, without an API call.

### Educational features

- **Mechanical-advantage explainer:** a lever slider showing force versus lever length.
- **"Why did it fail?" guide** tied to where a test part actually cracked.
- **Material comparison page** based on real test results from the printer in use.

## Architecture options

None of these are prescribed; the choice interacts with the export format decision above.

- **Browser-only (JavaScript with three.js)** keeps data local, is simple to host, and is privacy-friendly.
- **Geometry sources:** a CSG library, a WASM build of OpenSCAD or Manifold, or hand-built parametric meshes. CSG is faster to build with; hand-built meshes give cleaner STL control.
- **Python backend (CadQuery)** gives stronger geometry and native STEP and drawing output, but adds hosting and complexity.
- **2D package generation:** PDF and SVG generation in the browser is well supported by common libraries, so the 2D outputs don't force a backend.
- **LLM API:** Gemini API has a free tier. The API key can be provided but it must be managed accordingly.
