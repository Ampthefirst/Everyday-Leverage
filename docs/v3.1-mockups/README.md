# v3.1 mockups (step 0 of `V3_1PLAN.md`)

These mockups use the gate 4 direction A styles. Their content is real: the drawings, sizes, preset
names, size ranges and strength percentages come from the app's own code (`src/families`,
`analyse()`). The sample design names are invented.

| File | Shows |
|---|---|
| `20-dashboard-desktop`, `20-dashboard-mobile` | The signed-in dashboard: strength summary, sort and filter, one row per design (figure, sizes, step, verdict with badge, actions) and the side column (start new, printer, hand, account and the zip download). |
| `21-dashboard-empty-desktop` | The dashboard with no saved designs yet. |
| `22-home-signed-in-desktop`, `22-home-signed-in-mobile` | Home when signed in: the three most recent designs with "See all your designs", then the minimal nine-design index. |
| `23-home-signed-out-desktop` | Home when signed out: today's device shelf, then the same minimal index. |
| `24-pick-catalogue-desktop`, `24-pick-catalogue-mobile` | Pick as a catalogue: group intros and one wide entry per design (Fig., drawing, as printed, Helps with, Sizes, Leverage). Fig. 4 is shown hovered. |
| `25-hero-morph-frames-desktop` | Fig. 1 frame by frame: the morph from jam jars to bottle caps to one favourite jar, at one fixed scale. These are real drawing-code frames at the blended sizes. |

## Fix during the build
- **Phone dashboard:** the group filter chips wrap onto two lines. They'll become one row that scrolls
  sideways.
- **Phone dashboard:** the strength summary wraps; it'll sit on two short lines.
- **Phone Home:** the wordmark wraps onto two lines in this mockup only; the built header already keeps it
  on one line.
- **Home hero buttons:** the label alignment is a known flaw of the mockup kit (fixed in the build).
- **Very wide drawings** (the jar opener, the key turner) look small in square thumbnails. Dashboard
  thumbnails will be wider (about 3:2).
