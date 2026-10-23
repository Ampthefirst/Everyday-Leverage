# Gate 3: three directions

Each direction has two pages (Home and the Designer), at 1440 px and 390 px wide.

## How these were made

- Static HTML pages rendered to PNG. Not in the repo, not deployed.
- All content is real: the copy, the part renders, the measured drawings (exported from the app's own drawing code), and the strength numbers. The jam-jar opener uses 20% of its strength budget; a 4.0 N·m lid needs 29 N on a 150 mm lever versus 114 N by hand.
- Fonts are free and self-hostable.
- Each `*-sheet.png` shows the home page (full), the Designer, and both phone screens.
- `Sign in` is shown in the header because accounts are planned. It isn't wired up yet.

## A: Patent figure

**References:** Tailwind's hairline grid, Stripe's single left edge, Elicit's serif with sans.

**Type, colour, layout**
- **Type:** Spectral (serif) for headings and captions; Public Sans for the interface.
- **Colour:** white paper, ink #16181D, one ink-blue accent #1D3FA6 (patent and blueprint ink).
- **Layout:** the hero's right half is a drafting sheet on a hairline grid.

**What makes it unique**
- The parts are shown as **numbered figures drawn from the app's own measured drawings**, with italic callouts such as "150 mm lever".
- The nine designs appear as a figure sheet (Fig. 1–9).
- The Designer sits on graph paper with dimension call-outs.

**Risks**
- The line drawings are less immediately "friendly" than renders. The render appears only as a small "As printed" inset.
- The callout positions in the Designer are illustrative. In the build they'd be tied to the real geometry.

**Contrast:** ink 17.8:1, secondary 8.2:1, tertiary 5.0:1, accent 9.1:1. All pass.

## B: Engineering report

**References:** Elicit's research-tool layout, Linear's three-level greys, Readwise's product under the hero.

**Type, colour, layout**
- **Type:**
  - Literata (serif) for headings;
  - Atkinson Hyperlegible Next for the interface, a typeface from the Braille Institute designed for low vision;
  - Atkinson Mono only for the numbers.
- **Colour:** cool off-white #F4F6F6 (deliberately not cream), white panels, ink #132024, deep teal accent #0F4C5C.
- **Strength colours** (green, amber, red) appear only on the meter.

**What makes it unique**
- The hero's "picture" is **a real strength check**: the part, the verdict, the meter, and the math in one sentence each.
- The nine designs are a scannable list with renders, plain descriptions and typical tasks.
- The Designer reads like an instrument panel.

**Risks**
- It's the most conventional of the three (closest to a good SaaS product page).
- One checklist fail: the logo's three dots use the strength colours as decoration (rule 20). That would change in gate 4.

**Contrast:** ink 15.4:1, secondary 7.2:1, tertiary 4.9:1 (raised from 4.4 during this round), white on teal 9.5:1. All pass.

## C: Studio, dark

**References:** Stripe Press's objects as the hero, Linear's layered near-blacks, Anthropic's serif statement.

**Type, colour, layout**
- **Type:** Libre Caslon Display and Text (serif); Hanken Grotesk for the interface.
- **Colour:** layered near-blacks #0D0E10, #141518 and #1B1D21; bone-white buttons; strength colours only on data.

**What makes it unique**
- **The printed part is the hero**, large and lit like a product photograph.
- The nine designs appear as a gallery of objects.
- The Designer is an immersive stage, with the strength percentage as a large readout.

**Risks**
- Dark mode works against the light-for-serif and daylight-printing reasoning in the gate 2 checklist (rule 24).
- The renders' bright plastics carry all the colour.
- It's the closest of the three to the previous (dark) site.

**Contrast:** ink 16.6:1, secondary 9.2:1, tertiary 5.3–5.7:1, strength colours 8.8:1 or higher. All pass.

## Scorecard (gate 2 checklist)

| Check | A | B | C |
|---|---|---|---|
| Type (1–10): body ≥ 17 px, 60–72 characters per line, two chosen faces, sentence case, left-aligned | pass | pass | pass |
| Layout (11–18): one left edge, spacing scale, product by the first scroll, no template sections | pass | pass | pass |
| Colour (19–24): one accent, strength colours only as data, three greys, no gradients | pass | **fail** (logo dots, rule 20) | pass on colour; dark mode goes against rule 24 |
| Controls (25–32): 48 px targets, 56 px main actions, visible labels, flexible input hint | pass | pass | pass |
| Content (33–36): plain copy, no invented claims, one-line footer | pass | pass | pass |
| Signs of AI-generated design (target 0) | 0 | 0 | 0 |
| Contrast ≥ 4.5:1 on every text pair measured | pass | pass | pass |

## Shared across all three (from gate 1)

- No logo walls, testimonials, stat strips, pricing or big footer.
- The footer is one line: the disclaimer, plus Learn · Limits & safety · Get it printed · Settings.
- The "How it works" section is a single worked example (the jam-jar opener) instead of generic numbered cards.

## For gate 4

Pick one direction, or mix parts. Some mixes that work:
- A's figure sheet for the nine designs, with B's strength-check hero.
- B's list, with C's large hero render.
