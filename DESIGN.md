---
name: Everyday Leverage
description: Describe a hard task, get a printable aid sized to you and checked for strength, drawn like a patent figure in ink on white paper.
colors:
  bg: '#ffffff'
  surface: '#ffffff'
  surface-2: '#f7f8fa'
  viewer-bg: '#ffffff'
  grid: '#e7e9ec'
  border: '#cdd1d7'
  rule: '#e2e4e8'
  text: '#16181d'
  muted: '#4a4f59'
  faint: '#6b707b'
  primary: '#1d3fa6'
  primary-strong: '#16328a'
  on-primary: '#ffffff'
  focus: '#1d3fa6'
  ok: '#1f7a45'
  warn: '#8a5100'
  bad: '#b3261e'
  info: '#1d3fa6'
  ok-bg: '#e9f4ed'
  warn-bg: '#fbf4e6'
  bad-bg: '#fdf1ef'
  info-bg: '#eef1fb'
  part: '#1d3fa6'
  filament-a: '#0fa3b6'
  filament-b: '#b8268f'
  filament-c: '#e09a12'
typography:
  display:
    fontFamily: 'Spectral, Georgia, Times New Roman, serif'
    fontSize: '3.4rem'
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: '-0.012em'
  headline:
    fontFamily: 'Spectral, Georgia, Times New Roman, serif'
    fontSize: '2.5rem'
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: '-0.012em'
  title:
    fontFamily: 'Spectral, Georgia, Times New Roman, serif'
    fontSize: '1.375rem'
    fontWeight: 400
    lineHeight: 1.375
  figure-caption:
    fontFamily: 'Spectral, Georgia, Times New Roman, serif'
    fontSize: '1.125rem'
    fontWeight: 400
    lineHeight: 1.55
  body-lead:
    fontFamily: 'Public Sans, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.1875rem'
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: 'Public Sans, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: 'tnum'
  body-small:
    fontFamily: 'Public Sans, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.55
  caption:
    fontFamily: 'Public Sans, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: 'Public Sans, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1rem'
    fontWeight: 600
    lineHeight: 1
  field-label:
    fontFamily: 'Public Sans, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 600
    lineHeight: 1.55
rounded:
  hairline: '2px'
  sm: '4px'
  md: '6px'
  full: '9999px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '12px'
  lg: '16px'
  xl: '24px'
  2xl: '32px'
  3xl: '48px'
  section: '64px'
  section-lg: '88px'
  edge-lg: '96px'
  container: '90rem'
  tap: '48px'
  tap-main: '56px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.label}'
    rounded: '{rounded.md}'
    padding: '0 20px'
    height: '48px'
  button-primary-hover:
    backgroundColor: '{colors.primary-strong}'
    textColor: '{colors.on-primary}'
  button-main:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.label}'
    rounded: '{rounded.md}'
    padding: '0 24px'
    height: '56px'
  button-secondary:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    typography: '{typography.label}'
    rounded: '{rounded.md}'
    padding: '0 20px'
    height: '48px'
  button-ghost:
    textColor: '{colors.muted}'
    typography: '{typography.label}'
    rounded: '{rounded.md}'
    padding: '0 20px'
    height: '48px'
  button-ghost-hover:
    backgroundColor: '{colors.surface-2}'
    textColor: '{colors.text}'
  button-danger:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.bad}'
    typography: '{typography.label}'
    rounded: '{rounded.md}'
    padding: '0 20px'
    height: '48px'
  button-danger-hover:
    backgroundColor: '{colors.bad-bg}'
    textColor: '{colors.bad}'
  nav-item:
    textColor: '{colors.muted}'
    padding: '0 14px'
    height: '48px'
  nav-item-active:
    textColor: '{colors.text}'
  tab:
    textColor: '{colors.muted}'
    typography: '{typography.label}'
    padding: '0 12px'
    height: '48px'
  tab-active:
    textColor: '{colors.text}'
  input-number:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    padding: '0 12px'
    width: '96px'
    height: '48px'
  choice:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    padding: '4px 16px'
    height: '48px'
  toggle-button-pressed:
    backgroundColor: '{colors.info-bg}'
    textColor: '{colors.primary}'
    rounded: '{rounded.md}'
    padding: '0 12px'
    height: '48px'
  kbd:
    textColor: '{colors.faint}'
    typography: '{typography.caption}'
    rounded: '{rounded.sm}'
    padding: '0 6px'
  card:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    padding: '24px'
  note-info:
    backgroundColor: '{colors.info-bg}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    padding: '16px'
  badge-warn:
    backgroundColor: '{colors.warn-bg}'
    textColor: '{colors.warn}'
    typography: '{typography.caption}'
    rounded: '{rounded.sm}'
    padding: '4px 8px'
  badge-ok:
    backgroundColor: '{colors.ok-bg}'
    textColor: '{colors.ok}'
    typography: '{typography.caption}'
    rounded: '{rounded.sm}'
    padding: '4px 8px'
  figure-cell:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    padding: '20px 24px 24px'
  figure-cell-hover:
    backgroundColor: '{colors.surface-2}'
  shelf-item:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    padding: '20px 20px 16px'
  designer-stage:
    backgroundColor: '{colors.viewer-bg}'
---

# Design System: Everyday Leverage

## Overview

**Creative North Star: "Patent figure"**

Every screen is a sheet of drawing paper. The ground is white, the type is ink, and the pictures are the app's own measured drawings: true-scale views generated from the same parameters that build the 3D model and the print files, drawn in hairline ink and labelled with italic serif callouts, the way a patent or an old engineering manual labels its figures. Home's Fig. 1 is the jar opener's top view, and it redraws itself as the lid size changes. The nine designs are a figure sheet, Fig. 1 to Fig. 9, in a hairline grid.

The system is quiet so the figures and the numbers can carry the page. There is one accent, an ink blue, for actions and callouts. Green, amber and red appear only where they report strength. Structure comes from hairline rules, a light grey tint and space, not from boxes, shadows or colour. Type is a serif for headings, captions and callouts and a plain sans for everything you operate, set large (18px body) for older readers. The world is light on purpose: people read and print these sheets in daylight. High contrast is the accessibility alternative, not a dark theme.

Motion is rare and functional. The live figure steps through three sizes; the side menu slides in. Everything else changes in place. The Designer puts the 3D part on graph paper whose grid fades where the part sits and follows it as the view turns.

**Key Characteristics:**

- White paper (`bg` #ffffff), ink text (`text` #16181d) and two secondary greys from the same hue.
- One accent, ink blue (`primary` #1d3fa6), for actions, figure callouts, links and the focus ring.
- Strength colours (`ok`, `warn`, `bad`) only where they carry data: the meter, the verdict, the stress map.
- Spectral at weight 400 for headings, captions and callouts; Public Sans for the interface; 18px body, 1.55 line height.
- Figures drawn from parameters, in ink, on hairline-ruled sheets and graph paper.
- 6px radius, 48px targets, 56px for the main actions.
- One shared left edge per breakpoint, inside a 90rem container.

## Colors

Paper and ink: white grounds, a near-black ink with two greys from the same hue, hairline rules in two greys, one ink-blue accent, and three strength colours kept for data.

### Primary

- **Ink Blue** (`primary`, #1d3fa6): primary and main buttons, the active step dot, link text, the italic callouts on Fig. 1, the "Start" cue on preset rows, the pressed state of viewer toggles, the selected preset bar in quick mode, the lever mark's fulcrum, the caret and form accent colour. Also the value of `focus`, `info` and the unused `accent` alias.
- **Deep Ink Blue** (`primary-strong`, #16328a): hover state of primary buttons only.
- **White on blue** (`on-primary`, #ffffff): text on a primary button.

### Tertiary

- **Filament Cyan / Magenta / Amber** (`filament-a` #0fa3b6, `filament-b` #b8268f, `filament-c` #e09a12): the PETG colours of the 3D part in the Designer and the studio renders, for groups A (Hold), B (Turn and open) and C (Pull, push, reach). They live in the 3D scene and the "As printed" render, never in UI chrome.
- **Part Ink** (`part`, #1d3fa6): the part colour when high contrast is on, which replaces the filament colours.

### Neutral

- **Paper** (`bg`, `surface`, `viewer-bg`, all #ffffff): page ground, header, side menu, cards, figure sheets, fields and the Designer stage.
- **Tint** (`surface-2`, #f7f8fa): group heading rows on the figure sheet, hover fill on figure cells, menu rows, preset rows and ghost buttons, the current menu row and the selected preset.
- **Graph Line** (`grid`, #e7e9ec): the 24px drafting grid behind figures and in the Designer.
- **Hairline** (`border`, #cdd1d7): control borders, cards, the figure-sheet and shelf grids, figure sheets, key chips.
- **Rule** (`rule`, #e2e4e8): section dividers, the header and footer rules, tab underlines, panel dividers in the Designer.
- **Ink** (`text`, #16181d): headings and body text, the active tab and nav underline, reached quick-mode progress segments.
- **Secondary Grey** (`muted`, #4a4f59): leads, descriptions, units, help text, nav at rest, ghost buttons at rest, drawing labels inside figures.
- **Tertiary Grey** (`faint`, #6b707b): "Fig. n" labels, preset numbers, key chips, the footer, the second clause of the home headline, steps not yet reached.

### Status

- **Comfortable Green / Marginal Amber / Fail Red** (`ok` #1f7a45, `warn` #8a5100, `bad` #b3261e), each with a pale ground (`ok-bg` #e9f4ed, `warn-bg` #fbf4e6, `bad-bg` #fdf1ef): the meter fill and verdict word, notes, badges and errors. The "Uncalibrated estimate" badge is `warn`; "Calibrated to [printer]" is `ok`. `info-bg` (#eef1fb) is the pale blue ground for info notes and pressed toggles.

### High contrast set

`data-contrast="high"` keeps the white ground and switches to pure black text, greys, borders and rules; a stronger blue (#0000c8, hover #00007a) for primary; a red focus ring (#c80000) so focus never looks like an action; darker status colours (#005a00, #6b3a00, #9a0000) on white grounds; and turns the graph paper off (`grid` becomes transparent and the Designer grid is hidden). The 3D part switches from its filament colour to `part`.

### Named Rules

**The One Accent Rule.** Ink blue is the only accent. It marks what you can act on and the figure callouts. A new surface does not add a second accent hue.

**The Strength Colours Are Data Rule.** Green, amber and red appear only where they report a strength result: the meter, the verdict word, the stress map, strength badges and error notes. Never as decoration, section colour or icon colour, and always next to a word.

**The Three Inks Rule.** Text uses `text`, `muted` and `faint` from one hue. The darkest is near-black, never pure black outside high contrast.

## Typography

**Display Font:** Spectral (with Georgia, Times New Roman, serif)
**Body Font:** Public Sans (with ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif)

**Character:** A bookish serif, used the way a technical plate uses it for titles and figure captions, over a plain public-service sans that does the work. Numbers are tabular everywhere.

`h1`, `h2` and anything set in the serif use weight 400 with `font-synthesis: none`, letter spacing −0.012em, line height 1.12 and balanced wrapping. That rule sits outside Tailwind's layers, so a `font-medium` class on a serif element still renders at 400. Italic Spectral (`.figcaption`) is used only for figure captions, "Fig. n" labels, callouts and list numbers.

### Hierarchy

- **Display** (Spectral 400, 2.6rem rising to 3.4rem from 640px, 1.08): the home headline only. Page `h1`s use 2.6rem to 3.2rem at 1.12; the design screen 2.4rem to 2.9rem; the Designer title 1.6rem to 1.875rem.
- **Headline** (Spectral 400, 2.1rem rising to 2.5rem, 1.12): section headings (`h2`). Quick-mode questions are 2rem; "Start from a task" is 1.75rem.
- **Title** (Spectral 400, 1.375rem, 1.375): figure names on the sheet, shelf item names (1.3rem), worked-example values, card and panel headings (1.25rem to 1.6rem), the large meter percentage (3.75rem).
- **Figure caption** (Spectral italic 400, 1.125rem; callouts and "Fig. n" labels at 1rem): "Fig. 1 — Lid and jar opener, top view." Callouts on a figure are `primary`; labels are `faint`.
- **Body Lead** (Public Sans 400, 1.1875rem, 1.55): the lead paragraph under a hero or page title, capped at 31 to 36em.
- **Body** (Public Sans 400, 1.125rem, 1.55, tabular numerals): running text, 60 to 72 characters.
- **Body Small** (Public Sans 400, 1rem, 1.55): descriptions under options, secondary lines, nav and crumbs.
- **Caption** (Public Sans 400 or 500, 0.875rem): help text, badges, key chips, the step strip, the footer. The smallest reading size; never lighter than `faint`.
- **Label** (Public Sans 600, 1rem, line height 1): button and tab labels. Main actions are 1.0625rem.
- **Field Label** (Public Sans 600, 1.125rem): form labels and legends, option titles, the current step name on the shelf.

### Named Rules

**The Regular Serif Rule.** The serif is always weight 400. Hierarchy in serif text comes from size and from italic for captions, never from bold.

**The Two Faces Rule.** Spectral for headings, figure captions and callouts; Public Sans for everything you read in a sentence or operate. No mono for running text.

**The Sentence Case Rule.** Headings, labels, buttons and tabs are sentence case. No all-caps labels and no eyebrow line above a heading.

## Layout

Every page sits in one centred container, 90rem wide, with a side gutter of 16px, 24px from 640px and 96px from 1024px (`px-4 sm:px-6 lg:px-24`). The header, every section, the footer and the design-screen crumbs use the same container and gutter, so headings, paragraphs and figures share one left edge at each breakpoint. Narrow pages keep that edge and cap the measure at 48rem.

Sections are separated by a full-width `rule` line and 64px of vertical padding (88px from 1024px on Home). Spacing follows a 4px scale: 4 and 8px inside a group, 12 to 16px between a heading and its text, 24 to 48px between groups. There is more space above a heading than below it.

Recurring structures:

- **Header:** sticky, 64px tall, white at 95% with a `rule` line beneath. Wordmark (lever mark and "Everyday Leverage" in Spectral) at the left edge; Find a design, Pick a design and Learn from 768px; Menu and the account entry pushed right.
- **Side menu:** a native dialog from the right, `min(26rem, 100vw)` wide, white with a hairline left edge. Rows are separated by rules; the current page has the tint and a 3px ink bar on its left. On phones the main links lead the menu.
- **Home hero:** two columns from 1024px (5fr / 6fr). The text column carries the left edge; the figure column is graph paper with Fig. 1 on a white sheet. Stacks below 1024px.
- **Figure sheet:** a hairline grid of figure cells, one group heading row per group, 1 column, 2 from 640px, 3 from 1024px.
- **Shelf:** the same hairline grid, 1 column, 2 from 768px, 3 from 1280px.
- **Design screen:** figure on graph paper beside the name, blurb and numbered presets (1.05fr / 1fr from 1024px).
- **Designer:** below the header, the stage and its toolbar fill the remaining height; the settings aside is 29rem from 1024px with a `rule` left edge. On phones the stage is 38vh, sticky under the header (not when the window is shorter than 700px).
- **Footer:** one line from 1024px: the disclaimer sentence and four links, 14px `faint`. Hidden in the Designer.

Responsive: key chips and the header nav appear from 768px; the step strip shows in the Designer header from 1280px; the 125% and 150% text settings scale the root, and at 150% the meter overlay on the stage is hidden (the Strength tab carries it).

## Elevation & Depth

Flat. Depth comes from paper on paper: a white sheet with a hairline border lying on graph paper, the light tint for grouped rows, and rules. Shadows are kept to three soft ink-tinted drops; inset lines mark selection instead of fills.

### Shadow Vocabulary

- **Print on the sheet** (`box-shadow: 0 12px 30px -18px rgb(22 24 29 / 0.35)`): the small "As printed, in PETG" render card beside Fig. 1 on Home.
- **Sticky stage** (`box-shadow: 0 8px 16px -12px rgb(22 24 29 / 0.3)`): the Designer stage while it is sticky on phones; removed from 1024px.
- **Menu backdrop** (`rgb(22 24 29 / 0.32)`): behind the side menu.
- **Selection lines** (inset, not elevation): `inset 0 -2px 0 text` under the active tab and nav item; `inset 3px 0 0` in `text` on the current menu row and in `primary` on the selected preset; `inset 0 0 0 1px` doubling the border on a selected choice, a pressed toggle or the measuring guide in use.

### Named Rules

**The Paper Rule.** Surfaces are flat. A shadow means a printed object or a sheet lifted above the page, never a card or a control at rest.

**The No Glow Rule.** No gradients, glows or glass. The only gradients are data: the meter's three zones and the stress-map legend.

## Shapes

Gently rounded controls on square-cornered paper. Controls, fields, cards, notes and overlays use a 6px radius (`md`). Key chips and badges use 4px (`sm`), as does the focus ring. The figure sheet, shelf grid and figure sheets have square corners, because they are paper; the small figure frame on a shelf item is 2px. Round shapes are reserved for small marks: step dots, the meter track, quick-mode progress segments, the toggle, the "Saved" pill and the account initial.

Lines are hairlines: 1px `border` around controls and the figure grid, 1px `rule` between sections and panels, 1.5px rings on step dots. Toggles use a 2px track border. Figures are drawn in ink strokes from the drawing code, with labels in `muted`.

### Named Rules

**The Hairline Rule.** Group with space first; add a 1px rule or the tint only where space is not enough. No nested cards and no coloured side or top borders on cards.

## Components

### Buttons

Plain, confident controls with one blue.

- **Shape:** 6px radius, 1px border, 48px minimum height and width, 20px side padding, Public Sans 600 at 1rem, line height 1.
- **Primary:** `primary` fill and border, `on-primary` text; hover deepens to `primary-strong`.
- **Main action:** the primary button at 56px with 24px padding and 1.0625rem text (home hero, "Open the designer"). Home pairs it with a 56px secondary.
- **Secondary:** white, `border` hairline, `text`; hover darkens the border to `text`.
- **Ghost:** no border, `muted`; hover fills `surface-2` and turns the text `text`.
- **Danger:** white, `bad` border and text; hover fills `bad-bg`. Used for the second step of a two-step delete.
- **Focus / Disabled:** the global 3px `focus` outline at 3px offset with a 4px radius; disabled is 45% opacity with a not-allowed cursor. Colour transitions use Tailwind's default.

### Key chips

Shortcut hints stay out of the controls. The only visible keys are the numbers: a small rounded chip (4px radius, 1px `border`, 14px Public Sans 500, `faint`) on each Pick cell, and the italic serif number on preset rows. Every other shortcut (H, F, P, M, ← →, A, Q, Esc, Enter) is announced through `aria-keyshortcuts` and listed once, in the side menu. Hidden below 768px and when shortcuts are off in Settings.

### Navigation

- **Header items:** 48px, Public Sans 500 at 1rem, `muted` at rest, `text` on hover. The active item is `text` with a 2px ink underline drawn inside the item. "Pick a design" stays active on a design screen and in the Designer.
- **Menu button:** a ghost-style 48px button; hover tint.
- **Side menu rows:** label in 600 and a one-line `muted` description; hover tint; current row tint plus 3px ink bar. Number keys 1 to 5 jump; Esc closes.

### Tabs

A row of 48px Public Sans 600 tabs over a `rule` line. The active tab is `text` with a 2px ink underline; the others are `muted` and darken on hover. Arrow, Home and End keys move between them.

### Inputs / Fields

- **Number box:** white, 1px `border`, 6px radius, 96px wide, 48px tall, 1.125rem Public Sans 500 right-aligned with tabular numerals, unit in 14px `muted` beside it. Paired with a native range slider in `text`, 48px tall. Accepts typed values and clamps them.
- **Segmented choice:** 48px options with a hairline border on white; hover darkens the border; selected doubles it in `text` (inset 1px) and sets the label in 600. The focus ring is drawn on the option.
- **Toggle:** a 48×28px rounded track (2px `border`, `surface-2`) with a 20px `text` knob; on, the track and border turn `primary` and the knob white.
- **Select and text input:** white, 1px `border`, 6px radius, 48px tall, 12px side padding.

### Cards / Containers

- **Card:** white, 1px `border`, 6px radius, 24px padding. Used sparingly; never nested.
- **Note:** 6px radius, 16px padding, a pale status ground (`info-bg`, `warn-bg`, `bad-bg`, `ok-bg`) with a matching light border.
- **Figure sheet:** white with a 1px `border`, square, lying on graph paper (`.figure-sheet`). Holds a figure with its callouts.

### Badges

4px radius, 1px border, 4px 8px padding, 14px Public Sans 500, status colour on its pale ground. The strength badge ("Uncalibrated estimate" in `warn`, "Uncalibrated estimate — not FEA" on the stress map, or "Calibrated to [printer]" in `ok`) sits beside every verdict, under Fig. 1, on the meter overlay and on the stress-map legend. Only the presentation build (`VITE_PRESENTATION_MODE=1`) hides it, through `src/content/disclaimers.ts`.

### Meter

The strength readout. A 10px rounded track split into three pale zones by hard stops (green to 40% of the track, amber to 66.6%, red after; the scale runs to 150%, so 60% and 100% fall at those stops), with a rounded fill in the zone's status colour. Scale marks 0%, 60%, 100%, 150%+ in 12px `faint` beneath. Above it: "Strength" in the serif at 1.25rem and the verdict word and percentage in 600 and the status colour; the large version (quick-mode result) shows the percentage in Spectral at 3.75rem beside the verdict word. It is an ARIA `meter` whose value text gives the verdict in words. Colour always comes with the word.

### Step strip

Brief, Measure, Check, Print as a row of 14px Public Sans 500 labels, 20px apart, each with an 8px dot (1.5px ring). The current step has a filled `primary` dot and `text` label; done steps have a filled `muted` dot and `muted` label; later steps are `faint` rings. A saved project adds "· you stopped here". It is the app's real progress indicator, not decoration.

### Figure sheet (signature)

The nine designs as Fig. 1 to Fig. 9 in a square hairline grid. Each group starts with a full-width heading row on `surface-2` (group title in 600, lead in `muted`). Each cell is at least 288px tall with 24px side padding: an italic "Fig. n" label in `faint` (and a number key chip on Pick), the design's own measured drawing at 144px high, its name in Spectral at 1.375rem, and one plain sentence in `muted`. Hover tints the cell and underlines the name.

**Fig. 1 (live):** on Home, the jar opener's true-scale top view on a white sheet on graph paper, with three italic `primary` callouts (cup steps, lever length, lid range). Its caption is italic Spectral, followed by the strength share in words and the strength badge. A small "As printed, in PETG" render card sits beside the caption from 640px.

### Shelf items

Saved designs in the same hairline grid. Each item has a 96px figure of the saved design in a 2px-radius `rule` frame, the name in Spectral at 1.3rem, the design name and date in `muted`, and "You stopped at" with the step in 600. Below: Open (primary), then Rename, Duplicate and Delete as ghost buttons; Delete becomes a danger "Yes, delete" before it acts. The empty state is a single bordered row with a short explanation and a link to Find a design. A "Continue where you stopped" row on Home shows the latest item with its small figure and a secondary Continue button.

### Designer stage

The 3D part on graph paper. The canvas is transparent over a 24px `grid`; the grid fades to about 18% strength in an ellipse over the part's on-screen bounds (about 1.5 times the part, at least 14% and at most 70% of the stage on each axis) and is full strength at the edges. The viewer projects the part's bounding box every frame and moves the clear area with it as the view turns or zooms. High contrast hides the grid. Overlays on the stage are white at 95% with a hairline and 6px radius: "Updating…" at the top, how-to-use captions, build errors on `bad-bg`, the meter overlay (19rem, bottom left, with the strength badge and a Details link) and the stress-map legend (bottom right).

### Viewer toolbar

A wrapping row above the stage with a `rule` underneath. Toggle buttons (Object, Cut open, Stress map, Mirror, How to use) are 48px secondary-style buttons; pressed, they take a `primary` border doubled inset, `info-bg` fill and `primary` text. On the right, six 48px camera buttons with 20px stroke glyphs (1.75 stroke, round caps) in `muted`, hover tint, from 640px, and a ghost Reset. With Cut open on, a cut-position slider row appears beneath. The stress-map legend is a 192px data gradient (blue, green, yellow, red) with low, 60% and "at limit" marks and the badge.

### Quick panel

One decision per screen in the Designer aside. A thin top bar shows "Step n of N", a row of 4px rounded segments (`text` when reached, `rule` when not) and a ghost "All settings" button with its A key chip. The question is a 2rem Spectral heading that takes focus on each screen. The task screen is a numbered list of presets (italic serif numbers in `faint`, label in 600, description in `muted`); the chosen one has the tint and a 3px `primary` bar. Measurement screens show the measuring illustration in a `rule` frame above the field. The result screen shows the large meter, the reason, the badge and "Show the math", then "Get your files". The bottom bar holds a secondary Back and a primary Next (or "See the result").

### Motion

- **Fig. 1 redraw:** every 3.2s the live figure steps through lids of 85, 100 and 70 mm, redrawn from the drawing code. It pauses while the tab is hidden and stays still under reduced motion.
- **Side menu:** slides in from the right over 180ms on `cubic-bezier(0.16, 1, 0.3, 1)`.
- **In place:** colour changes on hover, the toggle knob slide, and the "Updating…" fade use short default transitions.
- **Reduced motion:** the device setting and the in-app "Reduce motion" setting cut every animation and transition to 0.01ms. The how-to-use animation becomes a "next step" button.

## Do's and Don'ts

### Do:

- **Do** keep every heading, paragraph and figure on the shared left edge: a 90rem container with 16px, 24px and 96px (`lg:px-24`) gutters.
- **Do** set headings, figure captions and callouts in Spectral at weight 400, and the interface in Public Sans with an 18px body at 1.55 line height.
- **Do** draw pictures from the app's parameters: measured figures in ink on white sheets, with italic `primary` callouts.
- **Do** use ink blue (`primary` #1d3fa6) as the only accent, for actions, links and callouts.
- **Do** keep every target at least 48px and the main action of a screen at 56px, with the 3px focus ring at 3px offset.
- **Do** use a 6px radius on controls and cards, and hairlines (`border`, `rule`) instead of boxes where space is not enough.
- **Do** keep the strength badge beside every verdict, the meter, Fig. 1's caption and the stress map, in every build except the presentation build.
- **Do** write sentence case, and keep the footer to one line: the disclaimer and four links.

### Don't:

- **Don't** use green, amber or red for anything other than strength data, and never without the word.
- **Don't** add gradients, glows, glass or coloured shadows; the meter zones and the stress-map legend are the only gradients because they are data.
- **Don't** bold the serif or set it at 500; hierarchy comes from size and italic.
- **Don't** put an eyebrow, kicker or badge above a heading, or use all-caps labels.
- **Don't** nest cards or give a card a coloured side or top border.
- **Don't** use pure black text or a dark theme; contrast needs go through the high-contrast set.
- **Don't** add motion beyond the live figure and the side menu, and never motion that ignores reduced motion.
