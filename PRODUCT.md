# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary audience for the v2 redesign: judges and evaluators** assessing the project at a
presentation or competition. They meet the site cold, have minutes rather than hours, and need to
grasp what it does, why it is different, and that it really works.

The people the product exists to serve, and who the guide and v1 were written for, are people for
whom everyday tasks demand more grip strength, wrist rotation or finger dexterity than they have:
older adults, people with arthritis or a hand injury, people recovering from surgery, anyone with a
weak or unsteady grip. Helpers (family, carers, teachers) and occupational therapists or makers are
secondary audiences. For v2 these are the users the demo shows the product serving, not the people
the redesign is primarily tuned for.

## Product Purpose

Everyday Leverage turns a described task and a few measurements into a custom-fit, strength-checked
aid that lowers the force a daily task needs, ready to 3D print. It closes the gap between "I can't
do this task" and "here is a part sized for me, checked for strength, ready to produce" without CAD
or engineering knowledge.

Success for v2: in a presentation or competition, evaluators quickly understand the problem, see a
part designed live, and come away convinced it is real, distinct and well made.

## Positioning

Not a generic 3D customizer. One idea (every design adds mechanical advantage: a longer lever, a
thicker grip, a better angle) delivered through four things together:

- a task finder that routes from tasks and motions, never conditions;
- parametric designs with a strength check that names the weakest spot and shows its math;
- 1:1 paper fit-check templates and 2D outputs useful without a printer;
- a request-a-print path for people who don't own a printer.

## Operating Context

- Live demos on a laptop or projector; evaluators may also open the site on their own phones.
- Real-world use: measuring with a ruler or printable gauges, holding paper templates against real
  objects, taking files or a request sheet to a library, school or makerspace, printing in PLA/PETG
  on a 256 × 256 × 256 mm bed.
- Production site: https://everyday-leverage.vercel.app (Vercel, deployed from `main`).

## Capabilities and Constraints

- Nine sub-families in three groups: A Hold (A1 build-up grip, A2 universal cuff, A3 tool handle),
  B Turn & open (B1 lid/jar opener, B2 key/knob turner, B3 cap/tap turner), C Pull/push/reach (C1
  pull handles, C2 press aids, C3 door/reach aid).
- Designer with live 3D (manifold-3d in a worker), ghost objects, cut-open view, computed stress map,
  how-to-use animation; strength verdict; print readiness; STL/3MF/PDF/SVG/DXF outputs and a zip.
- Calibration to a real printer, Learn pages, local profiles, share links, offline after first visit,
  optional opt-in Gemini features.
- Existing stack (React 19, Vite, TypeScript, Tailwind, three.js/R3F) stays.
- **Presentation mode (planned):** a temporary, separately deployed build that hides disclaimers via a
  build flag (e.g. `VITE_PRESENTATION_MODE`). The redesign must route every disclaimer through one
  place so this flag can switch them off. The standard site is unaffected.
- Open for v2: projects and a user dashboard (local first; accounts optional and later), new
  user-oriented features, calibration data from real tests (deferred to a future version).

## Brand Commitments

- The product name **"Everyday Leverage"** is fixed.
- When asked, the owner did not mark the leverage-only framing, the WCAG 2.2 AA standard or the
  honest-limits copy as fixed design commitments. The repo's `CLAUDE.md` still sets accessibility and
  the strength-badge rule as engineering rules for the standard site; changing them is a separate,
  explicit decision, not something a redesign should do silently.

## Evidence on Hand

- A working, deployed product with 150 unit tests and 24 end-to-end tests, including automated
  accessibility checks.
- No named real user, printed and tested prototype, measured break-test result, or testimonial yet.
  The guide lists these as the evidence to collect. Future work must not fabricate any of them.
- Strength numbers are uncalibrated estimates from published material data until real test bars are
  broken.

## Product Principles

1. **Clear in a minute.** An evaluator who has never seen the site understands what it does and why it
   is different within the first screen or two.
2. **Show it working.** Prefer a live part changing in 3D, a real verdict and a real file over
   describing features.
3. **Simple first, depth on demand.** Inexperienced users see one decision at a time; full settings
   stay one step away.
4. **Truthful by default.** The standard site never overstates strength, clinical value or access to
   printing. Disclaimers are removable only in the separate presentation build.
5. **Tasks, never conditions.** The app asks what is hard to do, not what is wrong with anyone.

## Accessibility & Inclusion

The served users may have limited hand function or low vision, and the current site meets WCAG 2.2
AA with 48 px targets, large-text (125/150%) and high-contrast modes, and reduced motion. The owner
did not mark this as a fixed design commitment for v2; `CLAUDE.md` treats it as an engineering rule.
