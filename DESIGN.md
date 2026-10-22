---
name: Everyday Leverage
description: Describe a hard task, get a printable aid sized to you and checked for strength, on an ANSI bulletin board at 2 a.m.
colors:
  bg: '#07070c'
  surface: '#0f0f12'
  surface-2: '#1a1a20'
  viewer-bg: '#0b0b0e'
  border: '#3f7f8c'
  rule: '#24505a'
  text: '#ececec'
  muted: '#a9b0bf'
  primary: '#33e0e0'
  primary-strong: '#8ff5f5'
  on-primary: '#041014'
  accent: '#ff5fd2'
  shade: '#6e1d5f'
  focus: '#ffe14d'
  live: '#1f3fd8'
  on-live: '#ffffff'
  ok: '#5fe07a'
  warn: '#ffd75f'
  bad: '#ff6b6b'
  info: '#6cb6ff'
  ok-bg: '#0b2414'
  warn-bg: '#2a2208'
  bad-bg: '#2d0e0e'
  info-bg: '#0a1c33'
  filament-a: '#0fa3b6'
  filament-b: '#b8268f'
  filament-c: '#e09a12'
typography:
  display:
    fontFamily: 'VT323, Atkinson Hyperlegible Mono, ui-monospace, monospace'
    fontSize: '3.75rem'
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: '0.01em'
  headline:
    fontFamily: 'VT323, Atkinson Hyperlegible Mono, ui-monospace, monospace'
    fontSize: '3rem'
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: '0.01em'
  title:
    fontFamily: 'VT323, Atkinson Hyperlegible Mono, ui-monospace, monospace'
    fontSize: '2rem'
    fontWeight: 400
    lineHeight: 1
  label:
    fontFamily: 'VT323, Atkinson Hyperlegible Mono, ui-monospace, monospace'
    fontSize: '1.5rem'
    fontWeight: 400
    lineHeight: 1
  body-lead:
    fontFamily: 'Atkinson Hyperlegible Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    fontSize: '1.125rem'
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: 'Atkinson Hyperlegible Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: 'tnum'
  body-small:
    fontFamily: 'Atkinson Hyperlegible Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.55
  field-label:
    fontFamily: 'Atkinson Hyperlegible Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    fontSize: '1rem'
    fontWeight: 600
    lineHeight: 1.55
rounded:
  square: '0px'
  hairline: '2px'
spacing:
  cell: '2px'
  segment: '3px'
  xs: '4px'
  sm: '8px'
  md: '12px'
  lg: '16px'
  xl: '20px'
  2xl: '32px'
  3xl: '40px'
  section: '56px'
  tap: '48px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.label}'
    rounded: '{rounded.square}'
    padding: '4px 16px'
    height: '48px'
  button-primary-hover:
    backgroundColor: '{colors.primary-strong}'
    textColor: '{colors.on-primary}'
  button-secondary:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.primary}'
    typography: '{typography.label}'
    rounded: '{rounded.square}'
    padding: '4px 16px'
    height: '48px'
  button-secondary-hover:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
  button-ghost:
    textColor: '{colors.text}'
    typography: '{typography.label}'
    rounded: '{rounded.square}'
    padding: '4px 16px'
    height: '48px'
  button-ghost-hover:
    backgroundColor: '{colors.surface-2}'
    textColor: '{colors.primary}'
  button-danger:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.bad}'
    typography: '{typography.label}'
    rounded: '{rounded.square}'
    padding: '4px 16px'
    height: '48px'
  button-danger-hover:
    backgroundColor: '{colors.bad}'
    textColor: '{colors.bg}'
  nav-item:
    textColor: '{colors.text}'
    typography: '{typography.label}'
    padding: '0 12px'
    height: '48px'
  nav-item-active:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
  tab:
    textColor: '{colors.text}'
    typography: '{typography.label}'
    padding: '0 12px'
    height: '48px'
  tab-active:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
  input-number:
    backgroundColor: '{colors.bg}'
    textColor: '{colors.primary}'
    typography: '{typography.label}'
    rounded: '{rounded.square}'
    padding: '0 8px'
    width: '96px'
    height: '48px'
  card:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    rounded: '{rounded.square}'
    padding: '20px'
  badge-warn:
    backgroundColor: '{colors.warn-bg}'
    textColor: '{colors.warn}'
    typography: '{typography.body-small}'
    rounded: '{rounded.square}'
    padding: '2px 8px'
  badge-ok:
    backgroundColor: '{colors.ok-bg}'
    textColor: '{colors.ok}'
    typography: '{typography.body-small}'
    rounded: '{rounded.square}'
    padding: '2px 8px'
  live-badge:
    backgroundColor: '{colors.live}'
    textColor: '{colors.on-live}'
    typography: '{typography.label}'
    padding: '0 8px'
  window-title-bar:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.label}'
    padding: '0 12px'
---

# Design System: Everyday Leverage

## Overview

**Creative North Star: "Bulletin board at 2 a.m."**

The site is a dial-up bulletin board seen late at night: a terminal-black ground, ANSI cyan and magenta drawing the structure, plain white text, and one white-on-blue block reserved for whatever is live right now. Screens are built from double-ruled frames, square corners, inverse-video selection bars and numbered `[K]` key hints, so every choice reads like a menu option you could press a key for, and usually can. The world is dark-only by decision; high contrast (black, white and yellow) is its accessibility alternative, not a light theme.

Density is a terminal's density: big terminal-face labels for menus and headings, a calm monospaced reading face for everything the user actually reads, generous 48px targets, and a fixed palette with no gradients or glow. Depth comes from frames, rules and inverse video, not from shadows; only a window that comes forward casts one. Real 3D renders of the app's own parts sit inside the frames as picture windows, lit in a neutral studio and coloured in the three group filaments, which is where the world gets its warmth.

Motion is stepped where the world is text and eased where it is physical: rows pour in one at a time like a screen arriving over a modem, a block cursor and the LIVE badge blink a few times and then hold, while tiles and the side menu move on a soft expo-out curve. The text-mode look is never a costume in the way of the task: no long paragraphs in pixel type, no neon glow, scanlines or matrix rain.

**Key Characteristics:**

- Terminal-black ground (`bg` #07070c) with neutral near-black surfaces; dark-only.
- Cyan (`primary`) and magenta (`accent`) carry rules, brackets, chrome and selection; white carries text.
- White on blue (`live` / `on-live`) appears only on LIVE or new things.
- VT323 for display, menus, labels and readouts; Atkinson Hyperlegible Mono for running text and numbers.
- Square corners, 3px double-line frames on windows and major rules, inverse-video active states.
- `[K]` bracket key hints: magenta brackets, cyan key, part of the visible label.
- Stepped reveals for text, eased transforms for objects; every animation becomes a still frame under reduced motion.

## Colors

A fixed ANSI palette on black: two chrome colours, white text, one reserved blue, one yellow for focus, and a four-tone status set with dark backgrounds.

### Primary

- **Phosphor Cyan** (`primary`): the main chrome colour. Selection and active states (inverse-video bars), primary buttons, the key letter in `[K]` hints, numeric field values, the block-title glyphs, the progress blocks and the caret. Also the hover state of every board tile's frame and title bar.
- **Bright Phosphor** (`primary-strong`): hover state of the filled primary button and the primary home choice only.
- **Deep Ink** (`on-primary`): text on any cyan block; a near-black with a cyan cast so inverse video stays one family.

### Secondary

- **ANSI Magenta** (`accent`): brackets around key hints and step numbers, group letters (A, B, C) and family ids in headings, the "you stopped here" marker, the outline of the Continue choice, and the text selection colour (`::selection` is magenta on `bg`).
- **Magenta Shade** (`shade`): the drop shade one cell down and right under the block-art title. Not used for text.

### Tertiary

- **Modem Blue** (`live`) with **White** (`on-live`): the LIVE badge only. White-on-blue is the classic BBS "new" marker and is spent on nothing else.
- **Cursor Yellow** (`focus`): the 3px focus outline everywhere. Nothing else is yellow in the standard theme.
- **Filament Cyan / Magenta / Amber** (`filament-a`, `filament-b`, `filament-c`): the PETG colours the studio renders and the Designer's 3D part use for groups A (Hold), B (Turn & open) and C (Pull/push/reach). They live in the 3D scene, not in UI chrome.

### Neutral

- **Terminal Black** (`bg`): page ground, number-field and select fills, inset panels inside the Designer.
- **Panel Black** (`surface`): header, footer, side menu, cards, tiles, windows. Kept neutral, not tinted.
- **Raised Black** (`surface-2`): hover fill for ghost controls and menu rows, selected-but-not-focused list options, toggle track, unfilled progress blocks.
- **Viewer Black** (`viewer-bg`): behind every render and the 3D canvas.
- **Teal Rule** (`border`): frames, card borders, field borders, tile frames at rest.
- **Deep Teal Rule** (`rule`): double rules under the header and tabs, section dividers, footer rule, the hairline grid between "How it works" steps.
- **Screen White** (`text`): all body text and display headings.
- **Dim Grey** (`muted`): secondary lines, descriptions under menu items, units, "of N" counters, dates.

### Status

- **OK Green / Warn Amber / Bad Red / Info Blue** (`ok`, `warn`, `bad`, `info`) on their dark backgrounds (`ok-bg`, `warn-bg`, `bad-bg`, `info-bg`): verdicts, the meter's three zones, badges and notes. The "Uncalibrated estimate" strength badge is `warn`; "Calibrated to [printer]" is `ok`.

### High contrast set

`data-contrast="high"` swaps the palette to pure black surfaces, white text and borders, yellow (#ffff00) for both primary and accent, cyan (#00ffff) focus, a deeper blue (#0000c8) for LIVE, and black status backgrounds. Structure is unchanged; only values move.

### Named Rules

**The Two-Chrome Rule.** Cyan and magenta draw the board; white is for words. A new surface uses cyan for structure and selection, magenta for brackets and markers, and does not introduce a third chrome hue.

**The Blue Means Live Rule.** White on blue marks something live or new, nothing else. If it is not updating in front of the user, it is not blue.

**The Inverse Selection Rule.** Active and selected states are a solid cyan block with `on-primary` text (nav, tabs, menu rows on hover and focus, the current step, toggles). Never a tint, an underline bar or a coloured outline alone.

**The Yellow Is Focus Rule.** Yellow belongs to the keyboard focus ring. Status warnings use `warn`, which sits on its own dark background.

## Typography

**Display Font:** VT323 (with Atkinson Hyperlegible Mono, ui-monospace fallback)
**Body Font:** Atkinson Hyperlegible Mono (with ui-monospace, SFMono-Regular, Menlo, Consolas)

**Character:** A DEC VT320 terminal face for everything you would see on a BBS menu, paired with a monospaced face drawn for low vision for everything you have to read. The pairing keeps the whole screen on a character grid while the reading text stays genuinely legible.

VT323 has a small x-height, so `h1`, `h2` and `.font-display` set `font-size-adjust: 0.5` with `font-synthesis: none`; its sizes stay honest next to the body face. Display is always weight 400, with 0.01em tracking and 1.1 line height. Body text is 1.55 line height with tabular numerals everywhere.

### Hierarchy

- **Display** (VT323 400, 3rem rising to 3.75rem from 640px, 1.1): page titles (`h1`). The home title is the block-art SVG instead, with the real text given to assistive tech.
- **Headline** (VT323 400, 3rem; 2.25rem inside panels, 3.75rem for the home board title, 1.1): section headings (`h2`), quick-mode step headings.
- **Title** (VT323 400, 1.875rem to 2rem, line height 1): choice titles, menu items, group rows on the board, shelf item names, the strength verdict and its percentage.
- **Label** (VT323 400, 1.35rem buttons, 1.5rem nav, tabs, step strip and number fields, 1.25rem window title bars and compact step strip, line height 1): every control label and short readout.
- **Body Lead** (Atkinson Hyperlegible Mono 400, 1.125rem; the home promise is 1.25rem rising to 1.5rem, 1.55): lead paragraphs, capped at 36 to 62ch.
- **Body** (Atkinson Hyperlegible Mono 400, 1rem, 1.55, tabular numerals): running text, 60 to 75ch.
- **Body Small** (Atkinson Hyperlegible Mono 400, 0.875rem, 1.55): helper text, descriptions under options, footer, badges.
- **Field Label** (Atkinson Hyperlegible Mono 600, 1rem): form labels and legends; the only weight above 400 in the system, also used for inline text links.

### Named Rules

**The Big Pixels Rule.** VT323 is for headings, menus, labels, key hints and numeric readouts, set at 1.25rem or larger. Sentences and paragraphs are always Atkinson Hyperlegible Mono.

**The Tabular Rule.** Numbers line up: body text uses tabular numerals, and measurements, percentages and build times are readouts in the display face.

## Layout

The page is a centred column on black: `max-w-7xl` (80rem) for chrome and most sections, 64rem for the home board, 72rem for design screens, 48rem for narrow reading pages, with a 16px side gutter (8px for the header on phones). Sections are separated by 56px vertical padding and full-width 3px double rules in `rule`; alternating sections sit on `surface` between double rules top and bottom.

Spacing follows Tailwind's 4px grid as used: 8px and 12px gaps between controls and options, 16px and 20px panel padding, 32px between title, promise and choices, 40px to 56px between hero columns. Two sub-grid values belong to block bars: 2px between meter cells, 3px between progress segments. Every interactive target is at least 48px square.

Recurring structures:

- **Top bar:** sticky, `surface`, double rule beneath; logo, three ways in (Home, Find, Pick) as full-height inverse-video tabs, and Menu pushed right.
- **Side menu:** a native dialog sliding in from the right, `min(27rem, 100vw)` wide, double-ruled left edge, numbered rows.
- **Home hero:** two columns from 1024px (1.1fr / 1fr): block title, promise and stacked choices left; the LIVE window right. Stacks on smaller screens.
- **The board:** three rows by group, each a heading with a trailing double rule, and a fixed 3-column grid of square picture windows at every width (8px gap, 16px from 640px).
- **Numbered lists as menus:** options are a two-column grid, a large `[n]` on the left spanning two rows, title and description on the right.
- **Designer:** viewer fills the screen; the settings aside is 30rem from 1024px, with a double-ruled left edge.

Responsive: key hints hide below 768px (touch first); the step strip shows on the Designer from 1024px; text-size settings (125%, 150%) scale the root and, at 150%, hide the viewer's meter overlay. On touch screens (`hover: none`) tile names always show.

## Elevation & Depth

The board is flat. Depth is drawn, not lit: double-line frames, rules in two teal values, three near-black surface steps (`bg`, `surface`, `surface-2`) and inverse video. Shadows exist only on a picture window that has come forward, and they are soft black drops with no colour and no glow.

### Shadow Vocabulary

- **Window forward** (`box-shadow: 0 18px 40px -12px rgb(0 0 0 / 0.85)`): a board tile on hover or focus, together with its 1.1 scale and cyan frame.
- **Live window** (`box-shadow: 0 24px 60px -20px rgb(0 0 0 / 0.9)`): the home LIVE window, which always sits in front of the hero.
- **Dialog backdrop** (`rgb(0 0 0 / 0.7)`): behind the side menu.

### Named Rules

**The Flat Board Rule.** Surfaces are flat at rest. A shadow means "this window is in front", and only a framed picture window earns it.

**The No Glow Rule.** No outer glow, bloom, scanline overlays or CRT curvature. The terminal reading comes from type, frames and colour, not from simulated phosphor.

## Shapes

Square. The theme resolves every Tailwind rounded utility to a 2px hairline, and the components themselves set no radius, so edges render square; the focus outline forces `border-radius: 0`. Pixel shapes (the 16×16 lever logo, the 8×7 menu bars, the 7×7 camera arrows, the 5×7 block-art letters) are SVG rects with `shape-rendering: crispEdges`, drawn on one shared grid.

Border weights carry meaning:

- **3px double** in `border` or `rule`: windows (board tiles, the LIVE window, the home choices) and structural rules (header, footer, tabs, side menu edge, Designer aside, section dividers).
- **2px solid**: controls (buttons, segmented choices, toggle buttons, Finder options, toggles).
- **1px solid**: inner dividers (title bars, captions), cards, fields, badges, notes, inset panels.
- **1px dashed**: empty states only.

### Named Rules

**The Square Corner Rule.** Nothing is rounded. 2px is the ceiling any legacy utility can reach, not a style to apply.

**The Double Frame Rule.** A double line means a window or a boundary of the screen; a single line divides inside one. Do not double-rule a control or an inner divider.

## Components

### Buttons

Square, terminal-face labels; primary is a solid inverse-video block.

- **Shape:** square, 2px border, 48px minimum height, 4px 16px padding, VT323 at 1.35rem, line height 1.
- **Primary:** `primary` fill and border, `on-primary` text; hover brightens to `primary-strong`.
- **Secondary:** `surface` fill, `primary` border and text; hover inverts to a cyan block.
- **Ghost:** transparent border, `text`; hover fills `surface-2` and turns the text cyan.
- **Danger:** `surface` fill, `bad` border and text; hover inverts to `bad` with `bg` text. Used for the second step of a two-step delete.
- **Focus / Disabled:** the global 3px `focus` outline at 2px offset; disabled is 50% opacity with a not-allowed cursor.

### Key hints

`[K]` with magenta brackets and a cyan key in VT323, part of the visible label (nav, menu rows, home choices, presets, Finder options, step numbers). On an inverse-video block the brackets and key take `on-primary`. Hidden below 768px where they are hotkey hints; kept as numbering in lists and steps.

### Navigation

- **Top bar items:** full-height 48px VT323 at 1.5rem, `text` at rest, `surface-2` fill and cyan text on hover, solid cyan block with `on-primary` when active.
- **Side menu rows:** 64px minimum, `[n]` at 2.25rem beside a 1.875rem title and a small muted description; hover and focus invert the whole row to cyan; the current page sits on `surface-2`. Number keys jump; Esc closes.

### Tabs

A row of VT323 1.5rem tabs on a double `rule` underline; the active tab is an inverse cyan block, others hover to `surface-2` with cyan text. Arrow, Home and End keys move between them.

### Inputs / Fields

- **Number box:** `bg` fill, 1px `border`, square, 96px wide, VT323 1.5rem right-aligned in `primary` with tabular numerals, unit in small muted text beside it. Paired with a native range slider tinted `primary` and 48px tall.
- **Segmented choice:** square 2px options on `surface` with `border`; hover turns the border cyan; selected is a cyan block with semibold `on-primary` text; focus draws the yellow ring on the option.
- **Toggle:** a 48×28px square track (2px border on `surface-2`) with a square 20px knob in `text`; on, the track turns cyan and the knob `on-primary`.
- **Select and text input:** `bg` fill, 1px `border`, square, 48px tall.

### Cards / Containers

- **Card:** `surface`, 1px `border`, square, 20px padding.
- **Note:** 1px border and fill in one status pair (`info`, `warn`, `bad`, `ok` on their `-bg`), 12px padding.
- **Inset panel:** `bg` on `surface` with a 1px `border`, used inside the Designer for measuring guides and the verdict.

### Badges

Square, 1px border, 2px 8px padding, small semibold body text, status colour on its dark background. The strength badge ("Uncalibrated estimate" in `warn`, or "Calibrated to [printer]" in `ok`) sits beside every verdict.

### Picture windows (signature)

A framed render: 3px double `border` frame on `surface`, a VT323 title bar divided by a 1px rule, the image on `viewer-bg`, and an optional caption under a 1px rule. On the board, the part turns toward a mouse cursor by swapping seven real renders (camera yaw from −30° to +30°) with a pitch tilt of up to 6°; on hover or focus the window scales to 1.1, its frame turns cyan, its title bar inverts, "Open" appears and the name slides in as a cyan bar across the image foot. The LIVE window is the same frame with a permanent cyan title bar, a white-on-blue LIVE badge, and the real A1 part rebuilt by the geometry worker at 32, 42 and 26 mm grip every 3.6 s.

### Block bars

- **Meter:** 30 square cells, 2px apart, 20px tall, coloured by zone (`ok` below 60%, `warn` to 100%, `bad` above, scale to 150%); unfilled cells at 20% opacity. Above it, the verdict and percentage in VT323 1.875rem in the zone colour.
- **Progress:** one 12px segment per question or step, 3px apart, `primary` when reached and `surface-2` when not, beside a "Question n of N" readout.
- **Step strip:** Brief, Measure, Check, Print in VT323, joined by 2px connectors; the current step is a cyan block, done steps are cyan text, later steps are muted.

### Motion

Text arrives stepped and objects move eased. The block title pours in row by row (each row a 40ms stepped fade, 45ms apart from 120ms), then the promise, choices and note at 900, 1050 and 1150ms. The block cursor (0.55em wide) and the LIVE badge blink at 1s, four times, then hold. The side menu slides in over 180ms; tiles scale over 220ms and their renders turn over 260ms, all on `cubic-bezier(0.16, 1, 0.3, 1)`. The device setting and the in-app "Reduce motion" setting both cut every animation and transition to a still frame; the live part holds still, and tiles do not turn.

## Do's and Don'ts

### Do:

- **Do** draw selection and active state as a solid `primary` block with `on-primary` text.
- **Do** frame windows and screen boundaries with a 3px double line, and divide inside them with 1px.
- **Do** label choices with `[K]` bracket hints (magenta brackets, cyan key) and wire the key when it is a real shortcut.
- **Do** set headings, menus, labels and readouts in VT323 at 1.25rem or larger, and all sentences in Atkinson Hyperlegible Mono.
- **Do** keep every target at least 48px and show the 3px `focus` outline at 2px offset on everything focusable.
- **Do** show real renders of the app's own parts inside picture windows on `viewer-bg`.
- **Do** make text reveals stepped (`steps(1, end)`) and object motion eased (`cubic-bezier(0.16, 1, 0.3, 1)`), and stop every blink within four cycles.
- **Do** keep the strength badge beside every verdict, the meter and the print sheet.

### Don't:

- **Don't** round corners; 2px is the ceiling the theme allows, not a style.
- **Don't** use white on blue for anything that is not live or new.
- **Don't** add glow, bloom, scanlines, CRT curvature or matrix rain.
- **Don't** set paragraphs or long text in VT323.
- **Don't** add a light theme or tinted surfaces; contrast needs go through the high-contrast set.
- **Don't** add a shadow to a control or card; only a picture window that has come forward casts one.
- **Don't** use Unicode arrows or glyph-only controls; draw pixel glyphs on the logo grid or use a text label.
