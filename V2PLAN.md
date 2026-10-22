# Everyday Leverage — v2 plan

Confirmed with the owner on 2026-10-22. Built unattended overnight on `claude/jolly-davinci-6wipnd`,
with each green commit also pushed to `main` (production), the same workflow as v1.

- Visual direction and page-by-page intent: `docs/v2-ui-brief.md` (authoritative for look and behaviour).
- Product truth: `PRODUCT.md`.
- Home direction contract: `.impeccable/surfaces/`.

## Scope

**In v2:**
1. Finish the redesign of the whole site in the "Bulletin board at 2 a.m." world.
2. Saved projects on this device, shown as a shelf on Home.
3. A Brief → Measure → Check → Print step strip with a persistent "you stopped here" marker.
4. A presentation-mode switch that hides every disclaimer.

**Not in v2:**
- New user-facing features (force-saved readout, on-screen ruler, compare sizes). These are deferred to
  a later version.
- Accounts and an online dashboard.
- Calibration data from real break tests.

**Already done:**
- Articulated hand.
- Studio renders.
- New tokens and fonts.
- Top bar with the side menu.
- Settings page.
- Home page.

## Rules for the overnight run

- `npm run check` is green before every push. Run `npm run e2e` at least at the end of each milestone.
  - Update tests when copy or structure changes on purpose.
  - Never skip or delete a test to get green.
- Push to the branch, then `git push origin claude/jolly-davinci-6wipnd:main`.
- No new services, secrets or network dependencies. Everything except `/api` works offline.
- `CLAUDE.md` hard rules hold. The one change is the badge exception in presentation mode (milestone 5).
- Never invent users, test results, testimonials or strength claims.
- Log every judgment call in `DECISIONS.md`. Keep `STATUS.md` current after each milestone.
- Impeccable is used for UI work.
  - Design questions it would normally ask are answered from the confirmed brief and logged instead of
    waiting for the owner.
  - Its detector runs on changed UI before each milestone commit.
- Accessibility stays at WCAG 2.2 AA:
  - axe tests pass;
  - 48 px targets;
  - full keyboard use;
  - reduced motion turns every animation into a still frame;
  - text works at 125 % and 150 %.
- Desktop first; check every changed page at 1440 px and 390 px wide before committing.
- If a milestone cannot be finished:
  - commit what is solid;
  - record the gap in `STATUS.md`;
  - move to the next milestone rather than stopping.

## Milestones (in order)

### 1. Pick a design

- Opens on the 3×3 board (shared with Home), with rows labelled by group.
  - Parts face the cursor.
  - Number keys 1–9 open a design.
- Each design gets a sub-screen (`/design/:id` stays the Designer). Picking a tile first shows the design's
  screen:
  - its render;
  - a one-line description;
  - its presets as a numbered list (1–5 keys work);
  - "Open the designer" as the main action.
  - Choosing a preset opens the Designer with it applied.
- Done when the page works by mouse, touch and keyboard, existing links to `/design/:id` still work, and
  e2e passes.

### 2. Designer in the new world, with quick mode

- Restyle the Designer in the new world:
  - viewer background and ghost materials tuned for the dark ground;
  - the group's filament colour for the part;
  - window-frame panels;
  - inverse-video tabs;
  - instrument-style readouts for measurements and the strength percentage.
- Quick mode, the default for first-time visitors:
  - one decision per screen (task preset → each fit measurement → result with verdict and downloads);
  - the 3D view stays visible;
  - "All settings" is one key away (`A`), switching to the full tab layout without losing values.
- Remember the user's last mode on this device.
- "Show the math" stays reachable from every number that has a calculation.
- Done when both modes produce identical parameters and files, the badge rule holds, and the existing
  designer e2e flows pass in full mode and in quick mode.

### 3. The remaining pages

- Restyle Finder, Learn, Calibrate, Get it printed, Limits & safety, Settings and 404:
  - numbered choices;
  - box rules;
  - VT323 headings.
- Finder: one question per screen with numbered options and number keys.
- Shared components (Button, Card, Field, Tabs, Badge, Meter, Dialog) are rebuilt in the world's
  vocabulary rather than recoloured.
- Done when no page still looks like v1 and axe passes on every route.

### 4. How-to-use animation with the articulated hand

- Animation steps drive hand joint angles (for example open hand → grip, turn) instead of sliding shapes.
- Under reduced motion they become step-by-step still frames.

### 5. Presentation mode

- One build variable, `VITE_PRESENTATION_MODE=1`, set only on a separate Vercel deployment, switches off
  all of these:
  - the footer;
  - not-a-medical-device and food-safe notes;
  - estimate notes;
  - Limits callouts;
  - PDF/print-sheet disclaimer lines;
  - **the "Uncalibrated estimate" / "Calibrated to …" badge** (owner decision, 2026-10-22).
- Every disclaimer string and badge goes through `src/content/disclaimers.ts`.
- The normal site is unchanged.
- The Finder's out-of-scope routing ("this one needs a person") is product behaviour, not a disclaimer,
  and stays.
- The Limits page stays reachable but is not promoted.
- `CLAUDE.md` badge rule gains this one exception.
- A unit test checks every route and output with the flag on and off.
- README documents how to create the presentation deployment.

### 6. Saved projects and the step strip

- Projects are stored on this device only (localStorage, same pattern as profiles):
  - fields: name, family, parameters, mode, last step, updated time;
  - saved from the Designer ("Save to shelf", auto-named, renamable);
  - listed on Home as a shelf of framed windows using the family render;
  - open, rename, duplicate, delete;
  - an empty state that points to Find and Pick.
- Never stores task-finder answers or anything about health.
- The step strip (Brief → Measure → Check → Print):
  - shows across the Finder and Designer;
  - marks the current step;
  - keeps a "you stopped here" marker per project.
  - Home offers "Continue where you stopped" when one exists.
- Share links and outputs are unaffected.
- Done when projects survive reloads, work offline, and have unit and e2e coverage.

### 7. Finish

- Impeccable's finish review, run by a fresh subagent with screenshots at 1440 and 390 px; apply its
  fixes (at most two rounds).
- Write `DESIGN.md` and `.impeccable/design.json` from the built world.
- Final full `npm run check` and `npm run e2e`.
- Update `STATUS.md` and `README.md`.
- Push.
