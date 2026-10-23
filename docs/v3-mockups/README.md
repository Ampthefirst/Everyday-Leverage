# Gate 4: detailed mockups of direction A, "Patent figure"

Static mockups made on 2026-10-23, before the build, for the owner to review. All content is real:
- copy;
- part renders;
- the measured drawings, from the app's own drawing code;
- strength numbers;
- the stress map, captured from the app.

| File | What it shows |
|---|---|
| 01-home | Signed-in home: the live Fig. 1 hero, "Continue where you stopped", saved designs, the figure sheet, the worked example, the one-line footer |
| 01b-home-new-visitor | The same page for a first visit: no continue choice, empty-shelf message |
| 02-pick | The figure sheet with number keys; hover state on Fig. 4 |
| 03-design-screen | A design's figure, render and presets (numbered rows; hover on preset 2) |
| 04-designer-measure | Quick mode, one measurement. The graph paper fades around the part (gate 3 approval, balanced here) |
| 05-designer-check | "Will it hold?": the large percentage, meter, plain reason, badge and the math |
| 06-designer-stress-map | Stress map with its legend and the "not FEA" badge |
| 07-designer-files | Every file, with what each is for |
| 08-designer-error | A blocking error with "Fix it for me"; field-level error text; Next disabled |
| 09-designer-all-settings | Tabs (Fit, Style, Strength, Print, Get files) with sliders and typed values |
| 10/11-find | One question per screen with numbered options; the suggested design with "why this one" |
| 12-learn, 13-limits | Long-text pages: contents column, figures, readable line length |
| 14-settings | Settings rows with switches; the hand profile |
| 15/16-sign-in, create | Account screens: plain help text, an inline error example, the privacy note |
| 17-account-menu | The signed-in account menu |
| 18-menu-open | The side menu (Learn, Calibrate, Get it printed, Limits & safety, Settings) |

## To fix during the build (from reviewing these at 390 px)

- **Header on phones:** smaller wordmark on one line; "Sign in" must not wrap.
- **Buttons:** label text centred vertically.
- **Main actions on phones:** full width.
- **Design screen at desktop:** less empty grid around the figure.

## Accounts

The account screens show the intended design. In the build they stay hidden until the owner's database is connected (`V3PLAN.md`, `docs/accounts-setup.md`).
