---
version: 1
slug: "src-pages-homepage-tsx"
primary_target: "src/pages/HomePage.tsx"
related_targets: ["src/app/Layout.tsx"]
---

# Home surface brief

Scope: the home route (`/`) and the site chrome it introduces (top bar, side menu, footer). Mode: Persuade.
Audience and job: hackathon judges on their own laptops; within a minute they understand "describe a hard
task → printable aid sized to you, checked for strength" and see a real part change live. Full brief:
`docs/v2-ui-brief.md`. Code-led build (no image generation in this environment).

## Direction contract

THESIS: The home page is a bulletin-board title screen that arrives over a modem, then lays the nine real
parts out as picture windows on a 3×3 board. It refuses the SaaS split hero with a feature-card row.

OWN-WORLD: Terminal black ground; ANSI cyan (#33e0e0) and magenta (#ff5fd2) carry rules, brackets and
chrome; white text; white-on-blue only for LIVE. Double box rules, square corners, inverse-video selection
bars, [K]ey bracket hints. VT323 for display and menus, Atkinson Hyperlegible Mono for text.

STORY: Visitors read the promise, watch A1 rebuild at three grip sizes while the hand re-wraps it, then
choose Find or Pick, or open any of the nine windows.

FIRST VIEWPORT: Left, block-art EVERYDAY / LEVERAGE pouring in row by row, the one-line promise, then
two large numbered choices ([F] Help me find a design, filled; [P] Pick a design, outlined). Right, a
framed LIVE window of the turning part with a grip readout and real build time.

FORM: Catalog world medium-native-ansi-bbs-nightboard, chosen on the third round. seed:f8c97f488698f3a3
Signature interaction: board parts turn to face the cursor; the hovered window comes forward, its title
bar inverts and its name appears. Motion grammar: stepped reveals, no easing on text, eased transforms.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
