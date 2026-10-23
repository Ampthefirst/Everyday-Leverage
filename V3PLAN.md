# Everyday Leverage — v3 plan

Confirmed with the owner on 2026-10-23.

- v3 replaces the v2 "bulletin board" look with **direction A, "Patent figure"**, chosen at gate 3 of a five-gate redesign:
  1. references;
  2. research checklist;
  3. three directions;
  4. detailed mockups;
  5. build.
- The structure built in v2 stays: Home / Find / Pick, quick mode, shelf, step strip, presentation mode.

## Where the inputs live

- **Reference measurements (gate 1):** `docs/v3/gate1-references.md`
- **Design checklist (gate 2):** `docs/v3/gate2-checklist.md`
- **Chosen direction (gate 3):** `docs/v3/gate3/` (sheets and scorecard)
- **Detailed mockups (gate 4):** `docs/v3-mockups/`

## Overnight rules (2026-10-23)

- **Nothing reaches the live site.**
  - Work is committed and pushed to `claude/jolly-davinci-6wipnd` only. No push to `main`.
  - Vercel's preview deployment of the branch (if previews are enabled) and the screenshots are the review surface.
  - The owner approves before anything is merged.
- `npm run check` must be green before every push.
- `npm run e2e` runs at milestones. Tests are updated on purpose and never skipped.
- Every judgment call goes in `DECISIONS.md`. `STATUS.md` stays current.
- `CLAUDE.md` hard rules hold:
  - units;
  - the badge rule (with the presentation-mode exception);
  - not a medical device;
  - local-first;
  - secrets server-side only.
- The gate 2 checklist is the quality bar. The target is zero signs of AI-generated design.

## Direction A, as approved

- **Paper and ink.**
  - White paper; ink #16181D.
  - Two secondary greys (#4A4F59, #6B707B).
  - Hairline rules #E2E4E8 / #CDD1D7.
  - One accent: ink blue #1D3FA6.
  - Strength colours (green, amber, red) only where they carry data.
- **Type.**
  - Spectral (serif) for headings, figure captions and callouts.
  - Public Sans for the interface.
  - Body 18 px, line height 1.55, 60–72 characters per line.
  - Sentence case; left-aligned.
- **Signature: figures drawn from the app's own measured drawings.**
  - Home's Fig. 1 is the jam-jar opener's true-scale top view, with italic callouts. It is **live**: it redraws as the lid size steps through values.
  - The nine designs are a figure sheet (Fig. 1–9) inside a hairline grid.
- **The Designer** sits on graph paper. The grid **fades around the part**: about 18% strength over the part's on-screen bounds, full strength at the edges. The clear area follows the part as the view changes. High contrast turns the grid off.
- **Footer:** one line (the disclaimer and four links). No company-site filler.
- **Controls:** 48 px minimum, 56 px for the main actions. 6 px radius.

## Gate 4: detailed mockups (static, for approval)

**Pages and states, at 1440 px and 390 px:**

1. **Home**, including the shelf with saved designs and the "continue where you stopped" choice.
2. **Pick a design:** the figure sheet with number keys.
3. **A design's screen:** its figure, its render and its presets.
4. **Designer:**
   - the measure step (balanced faded grid);
   - the check step (meter, the math);
   - the stress map;
   - files;
   - a blocking error with "Fix it for me";
   - all settings (tabs).
5. **Find:** a question, and a result.
6. **Learn**, **Settings**, and **Limits & safety** (a long-text page).
7. **Accounts:** sign in, create an account, the account menu, and "saved to your account" states.
8. **Menu** open.

## Gate 5: build on the branch

1. **Foundations:**
   - tokens and fonts (`@fontsource/spectral`, `@fontsource/public-sans`);
   - focus, selection and scrollbars;
   - the high-contrast set;
   - the presentation flag kept working.
2. **Shared components rebuilt:** button, field, choice, toggle, tabs, meter, badge, card, note, dialog, menu, step strip.
3. **Header and side menu:**
   - wordmark with the lever mark;
   - Find / Pick / Learn;
   - Menu;
   - account (hidden until accounts are on).
4. **Home:**
   - hero with the live Fig. 1 (from the B1 drawing code);
   - figure-sheet index;
   - worked example;
   - shelf;
   - one-line footer.
5. **Pick and the design screen** in the figure-sheet language.
6. **Designer:**
   - graph-paper stage with the part-following fade;
   - viewer lighting and renders tuned for white paper (re-render the tiles if needed);
   - panels;
   - quick mode and all settings.
7. **Find, Learn, Calibrate, Get it printed, Limits & safety, Settings, 404.**
8. **Finish:**
   - Impeccable finish review;
   - `DESIGN.md` and `.impeccable/design.json` rewritten;
   - screenshots;
   - `STATUS.md`.

## Accounts architecture (ready for the owner's database; hidden until connected)

- **Projects storage interface:**
  - **local** (the current browser shelf, also the offline fallback);
  - **account** (server).
  - When signed in, saving writes to both. The shelf merges them, and the newer copy wins.
- **Server:** `/api` endpoints for sign-up, sign-in, sign-out, session and projects.
  - Secrets only in Vercel environment variables, never `VITE_`.
  - Sessions as HttpOnly, Secure, SameSite cookies.
  - Same-origin checks, body size caps, rate limits per IP and per email.
- **Database adapter interface,** with:
  - an in-memory adapter (unit tests);
  - a Supabase adapter (recommended: email and password auth with reset emails).
  - A Postgres (Neon/Vercel) path is noted for later.
- **Stored per user:** email and projects (name, design, sizes, step, updated time). Never task-finder answers or anything about health.
- **Switch:** the sign-in UI appears only when the server reports accounts are configured.
- **Owner steps:** in `docs/accounts-setup.md`.

## Out of scope for v3

- New user-facing features (deferred since v2).
- Calibration data from real break tests.
