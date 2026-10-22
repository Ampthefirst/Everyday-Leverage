# v2 UI brief — Everyday Leverage as a 2 a.m. bulletin board

Confirmed with the owner on 2026-10-22 through Impeccable `shape`. Product truth lives in
`PRODUCT.md`; this brief covers the v2 redesign only. Shape stops here: the direction contract,
build and `DESIGN.md` come with the build.

- **Direction:** "Bulletin board at 2 a.m." (Impeccable catalog world `medium-native-ansi-bbs-nightboard`),
  chosen after two re-rolls steered toward techy / bold dark mode.
- **Seed reference:** `seed:f8c97f488698f3a3`.

## 1. Job and audience

- **Primary:** hackathon judges. They watch a presentation, then try the site for a couple of minutes
  on their own laptops. Desktop first; mobile must still work.
- **Mode:** the home page is **Persuade** (sell the idea instantly). The Designer and other tool
  screens are **Operate** (clarity first, the world shows in precise details).
- **Still served:** the people the product exists for (older adults, weak or unsteady grip), so the
  world must never make the task harder.

## 2. Outcome and proof

- **Within a minute** judges understand: describe a hard task → get a printable aid sized to you and
  checked for strength.
- **Then they see a real part change live** in 3D.
- **Proof is real:** the 3D parts, the strength verdict and the downloadable files.
- **Never invented:** users, tests, testimonials or results (see `PRODUCT.md` → Evidence on Hand).

## 3. Selected direction

### World

A dial-up bulletin board at night:

- **Ground:** terminal black.
- **Palette:** a 16-colour ANSI set.
  - Cyan and magenta carry structure and chrome.
  - White carries text.
  - Blinking white-on-blue is reserved for live or new things.
- **Frames:** box-drawing rules and block-character art.

### Type

- A pixel-terminal face for headings, menus and labels.
- A readable monospaced face for longer text.
- Exact faces are open (§7) and must be free to use and self-hosted.

### Images

The realistic parts are studio renders of the app's own 3D models. They sit inside framed
"viewer" windows, like a picture loaded on a bulletin board. This is the stated translation that
lets photo-like images live in a text-mode world.

### Navigation

- Numbered choices throughout, e.g. `[1] Open something`.
- Every design has a code (A1–C3) that can be typed to jump straight to it.

### Signature moment

- The home title screen pours in line by line, as if arriving over a modem.
- After that, every screen change is instant.

### Raises kept from earlier rounds

- **Quick mode beside the full designer.** One decision per screen, with all settings one key away.
- **Step strip** (Brief → Measure → Check → Print) with a persistent "you stopped here" marker.
- **Saved-project shelf** as the future dashboard.
- **Every number on screen traceable** to its calculation ("show the math").
- **Instrument-style readouts** for measurements and the strength percentage.

## 4. Scope and boundaries

**Changes:**
- the look of the whole site;
- the navigation restructure;
- the Designer's quick mode.

**Unchanged:**
- features and content;
- the family contract, geometry and strength model;
- all outputs, offline support and the Gemini features.

**New assets:** nine studio renders, one per design, made from the app's own 3D models. They need
to be produced, not drawn as stand-ins.

**Anti-goals:**
- The text-mode look is not a costume that gets in the way of the task.
- No long paragraphs in pixel type.
- No neon-glow "hacker" cliché (no glow, scanline soup or matrix rain).

## 5. Owner's six points, mapped

### 1. Home button

The top bar always reads `[H]ome · [F]ind a design · [P]ick a design · ≡ Menu`, and the logo also
goes home.

### 2. Home page

- The animated title screen in block art, with a live part turning beside it.
- The two primary actions, Find and Pick, are right there.
- Below: a 3×3 board of the nine designs as framed render windows. Hover enlarges a window, shows
  its name and turns the part to face the cursor.

### 3. Pick a design

- Opens on the 3×3 board, rows labelled Hold / Turn & open / Pull & reach.
- Choosing one opens that design's sub-screen with its presets as a numbered list.
- Parts react to the cursor; number keys work too.

### 4. Side menu

- Only Home, Find and Pick stay on the top bar.
- The ≡ "sysop menu" slides out holding Learn, Calibrate, Get it printed, Limits & safety and
  Settings.
- Settings becomes its own page: display, text size, contrast, motion, Gemini, profiles. It replaces
  "Display".

### 5. Animations

- title pour-in;
- blinking input cursor;
- window enlarge on hover;
- cursor-following parts;
- instant screen swaps;
- the existing how-to-use animations.

Under reduced motion, every one of these becomes a still frame.

### 6. Bold, confident, user-oriented

- A strong black-and-cyan identity.
- Big numbered choices.
- Quick mode by default for newcomers.

## 6. States and ranges

- **Content:** 9 designs, 3–5 presets each, and 7 finder questions with up to 17 options.
- **Pages:** 3–6 tabs of settings, long Limits/Learn pages, PDFs and downloads.
- **States to design:**
  - title loading / pour-in;
  - building geometry ("updating");
  - geometry error;
  - blocking validation error with "Fix it for me";
  - Gemini unavailable / offline;
  - empty profile / project shelf;
  - calibrated vs. uncalibrated badge;
  - large text at 150%.

## 7. Constraints and open decisions

### Disclaimers and presentation mode

- All disclaimers route through one place, so a temporary presentation build can switch them off with
  a flag (`PRODUCT.md`).
- On the normal site the "Uncalibrated estimate" badge stays, as a fixed status line.

### Accessibility (`CLAUDE.md` rules still apply)

- all text is real text;
- text contrast meets WCAG 2.2 AA;
- large-text and high-contrast modes work;
- 48 px targets;
- full keyboard operation, which this world suits;
- reduced motion honoured.

### Platform

- Existing stack (React 19, Vite, Tailwind, three.js / R3F).
- Fonts self-hosted for offline use.

### Open decisions for the owner

- Whether a light theme exists at all, or the site is dark-only.
- The exact pixel and monospaced faces (free licences, self-hosted).
