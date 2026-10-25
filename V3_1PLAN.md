# v3.1 plan: dashboard, motion, and two kinds of design index

Status: **draft for the owner's review.** Nothing here is built yet.
Rules that still hold: `V3PLAN.md` direction A ("Patent figure"), the gate 2 checklist, and `CLAUDE.md`.
Work happens on the branch, and nothing reaches `main` until the owner approves.

All three changes run in the browser with the code and data we already have. None needs a new
library, a new server endpoint or a database change.

---

## 1. "Your designs" dashboard

### Recommendation: one dashboard for everyone, with the account as a panel
- The dashboard lives at **`/designs`** and works without an account, because the shelf is already
  stored on the device.
- **Signed in:** the same page also shows the account (email, sync state, sign out).
- **Signed out:** a quiet panel offers "Sign in to keep these on any device", shown only when accounts
  are switched on.
- **Why:** no visitor gets an empty "please sign in" wall. Accounts stay optional, and the presentation
  can show the dashboard straight away.
- **Where it's linked from:** the account menu ("Your designs"), the side menu, and Home.
- **What happens to the Home shelf:** it shrinks to the three most recent designs, with a "See all your
  designs" link.
- **`/account`:** stays as the sign-in and create-account page. Once you sign in, it takes you to
  `/designs`.

### Layout (desktop; it stacks on phones)
```
Your designs                                   [Find a design] [Pick a design]
Signed in as jo@… · Synced                       (or: Saved on this device · Sign in to sync)

┌ Design list ─────────────────────────────────┐  ┌ Side column ─────────────────┐
│ Sort: Recent ▾   Show: All · Hold · Turn · … │  │ Start something new          │
│ ┌──────┬──────────────────────────┬────────┐ │  │  Find a design for a task →  │
│ │ fig  │ Kitchen caps             │ 20% ●  │ │  │  Pick from all nine →        │
│ │      │ Lid and jar opener       │Comfort.│ │  ├──────────────────────────────┤
│ │      │ Lids 26–40 mm · 3 steps ·│        │ │  │ Your printer                 │
│ │      │ 110 mm lever             │        │ │  │  Uncalibrated · Calibrate →  │
│ │      │ ●Brief ●Measure ○Check ○ │ Open … │ │  ├──────────────────────────────┤
│ └──────┴──────────────────────────┴────────┘ │  │ Your hand                    │
│ …                                            │  │  Breadth 85 mm · Right hand  │
└──────────────────────────────────────────────┘  │ Display: text size, contrast │
                                                  └──────────────────────────────┘
```

### Each design row (the core)
- The design's own measured drawing (the existing `Figure`), its name, and the design type.
- **Its sizes in plain words.** The main fit measurements come from the family's own field labels and
  units, for example "Lids 26–40 mm · 3 steps · 110 mm lever". There's a "Show all sizes" disclosure for
  the full list. Every value comes from the stored parameters.
- **Its strength verdict:** the percentage and the level word, with the "Uncalibrated estimate" badge
  (the badge rule applies here too). It is computed live with the same `analyse()` call the Designer
  uses, which is cheap because it needs no 3D model.
- The step strip with "you stopped here", and the date it was last changed.
- **Actions:** Open, Rename, Duplicate, Delete (with a confirm step), and **Copy share link** (it reuses
  the existing `shareUrl()` in `src/profiles/share.ts`). "Get files" opens the Designer straight at its files step.
  Building the 3D files right on the dashboard would load three.js and the geometry worker onto that
  page, so it isn't worth it.

### Adding a design
- "Start something new" goes to Find or Pick.
- Each row's **Duplicate** acts as "make a variant": for example, the same opener with a longer lever.
- There is no blank "new design" form on the dashboard. Every design starts from a task or a preset, and
  that's what keeps the sizes sensible.

### Ideas that suit a dashboard (each one is optional; strike any you don't want)
1. **Sort and filter:** by recent, name or step, and by group (Hold, Turn and open, Pull and reach). It
   only matters past about 8 designs, so it's cheap but low priority.
2. **Strength summary:** a one-line count across all designs, such as "6 comfortable · 1 marginal".
   Any design over its budget is marked, so a weak one gets noticed.
3. **Compare two versions:** pick two designs of the same type and see their sizes side by side, with
   the differences highlighted. Good for a presentation ("short lever vs long lever"). Medium effort.
4. **Download everything:** one zip of every design's sizes as share links and JSON. It's a backup and
   needs no account. Small effort.
5. **Not doing:** a free-text notes field. People would type health details into it, and the product
   rule is that we never collect those.

---

## 2. Motion

### 2a. Hero: the jar opener morphing between real presets (the main ask)
- **Today:** the drawing jumps between three `lidMax` values every 3.2 s.
- **New:** it **morphs smoothly** between the three handheld presets the family actually ships:

| Preset | Lids | Steps | Lever |
| --- | --- | --- | --- |
| Jam and pickle jars | 45–85 mm | 3 | 150 mm |
| Bottle caps | 26–40 mm | 3 | 110 mm |
| One favourite jar | 70 mm | 1 | 160 mm |

- **How it works:** each animation frame blends the numbers (`lidMin`, `lidMax`, `lever`) with an
  ease-in-out curve over about 0.9 s, then holds each preset for about 2.6 s. Every frame calls the
  family's own `drawing()`, so the cup, the step rings and the lever **really grow and shrink**. The
  dimension labels **count up and down** with them, because they are generated from those same numbers.
  It is the same code as the files, not a picture.
- **One fixed scale for the whole cycle:** the drawing is framed once, at the largest preset's size. The
  bottle-cap opener then really looks smaller next to the jam-jar one, instead of being zoomed to fill
  the frame.
- **Step count (3 to 1):** the three rings slide together into one as the smallest and largest lid sizes
  meet, so no ring pops in or out.
- **Also changing:** the caption names the preset ("Fig. 1 — at the 'Bottle caps' sizes"), and the
  strength percentage updates as each preset settles.
- **Stillness:**
  - **Reduced motion** (device setting or the Settings toggle): no morph. It holds one preset and offers
    a small "Next size" button.
  - **Hidden tab:** it pauses.
  - **Screen readers:** the figure's description names the current preset, but each frame is not
    announced.
- **Feasibility:** high. A drawing is about 15 shapes, so rebuilding its SVG 60 times a second is cheap.
  I'll measure it on a throttled phone profile, and if it's heavy, drop to about 30 fps.
  - **The one catch:** the in-between sizes aren't valid presets. The morph skips the family's `repair()`
    step while it blends, and only the presets themselves are checked.

### 2b. Other small transitions (all light, all honour reduced motion)
1. **Pick → design screen:** the figure moves with you. Clicking Fig. 4 on Pick slides that drawing into
   its place on the design screen, then on into the Designer. It uses the browser's View Transitions
   (React Router 7 supports them with `viewTransition` on links). Browsers without support just change
   page as they do today.
2. **Strength meter:** the fill slides to its new value as sizes change (about 200 ms, a width
   transition), instead of jumping.
3. **Quick-mode steps:** each new question fades in with a 6 px rise (about 150 ms).
4. **Tabs:** the underline slides to the chosen tab.
5. **Dashboard rows:** a deleted design collapses its row (about 180 ms). A duplicate appears with a
   brief tint that fades, so you can see where it landed.
6. **Not doing:** scroll-triggered reveals and parallax. They fight the "instant, calm" rule in the gate
   2 checklist.

---

## 3. Home vs Pick: two different indexes

Today both pages use the same 3×3 figure sheet. The proposal splits them by purpose.

### Home: a minimal index
- Its job: "here are the nine, at a glance".
- **Layout:** a quiet strip per group. The group name sits on the left, then three small figures (about
  96 px tall) with the design name under each.
- **Removed:** blurbs, "Fig. n" labels and cell borders. One hairline separates the groups.
- **Ends with:** "Compare all nine on the Pick page →".
- **Result:** roughly half the current height, so the worked example and the is/isn't table move up.

### Pick: a reference catalogue
- Its job: "help me choose".
- **Top of the page:** a short intro and jump links to the three groups.
- **Each group** opens with one or two sentences on what that kind of help does: the leverage idea in
  plain words.
- **Each design gets a wide entry** (two columns on desktop, stacked on phones). It contains:
  - its Fig. number and measured drawing, larger than today;
  - its name and the one-sentence blurb;
  - **"Helps with":** its preset tasks as a short list, such as "Jam and pickle jars · Bottle caps · One
    favourite jar". Each one links straight to that preset;
  - **"Sizes":** the range it covers, taken from its field limits, such as "Fits lids 20–110 mm";
  - **"Leverage":** its existing one-line explanation;
  - the small "As printed" render;
  - the number key, kept as today.
- **Behaviour:** clicking the entry still opens the design screen, and the number keys still work.
- **Feasibility:** high. Every piece of text already exists in the family objects (`presets`, `fields`
  limits, `leverage`, `blurb`). I'll only write the three group intros.

---

## How it gets built

| Step | What | Check |
|---|---|---|
| 0 | Mockups of the dashboard (desktop and phone, signed in and out) and the new Home strip / Pick entry, rendered from the real code where possible | **Owner approves before the build** |
| 1 | Hero morph (2a), with a small test that the morph frames match `drawing()` at each preset | Captured as a short screen recording or frame strip for review |
| 2 | Home strip and Pick catalogue (3) | e2e: number keys and preset links |
| 3 | Dashboard (1) and the smaller Home shelf | e2e: open / rename / duplicate / delete / share; unit: size summaries and verdicts |
| 4 | Small transitions (2b) | Reduced motion turns them all off; axe a11y passes |
| 5 | Finish review (fresh reviewer), DESIGN.md update, screenshots | `npm run check` and `npm run e2e` green |

**Deploys:** each step is pushed to the branch. Vercel and Supabase are now connected to this session,
so I can check the branch preview's build and logs myself and send you its link. Nothing is promoted to
production without your go-ahead.

**Effort, roughly:**
- hero morph: small–medium;
- Home/Pick split: medium;
- dashboard: medium–large (the biggest piece);
- small transitions: small.

The steps are independent, so they can ship separately if you'd rather see the hero first.

---

## Questions for the owner (each has my recommendation)
1. **Who can open the dashboard?** Everyone, at `/designs`, with sign-in as an optional panel
   *(recommended)*. The alternative is signed-in people only.
2. **Which optional dashboard ideas?** I'd do 1 (sort/filter), 2 (strength summary) and 4 (download
   everything) now, and hold 3 (compare) unless you want it for the presentation.
3. **Hero cycle:** the three real handheld presets *(recommended)*, or the current three lid sizes
   only.
4. **Pick → design screen figure move (2b-1):** yes *(recommended)*. It is the one transition that makes
   the "figure" idea feel continuous.
5. **Mockups first (step 0)** for the dashboard and the two indexes *(recommended, because the
   dashboard is a new surface)*. The alternative is building directly and reviewing on the preview.
