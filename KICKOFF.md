# Kickoff Prompt — Everyday Leverage v1 (unattended run)

Paste everything below the line into Claude Code as the first message.

---

You are building Everyday Leverage v1 unattended. I am unavailable until morning; do not stop to ask questions.

Read PLAN.md fully, then docs/everyday-leverage-guide.md. PLAN.md is authoritative for v1.

Work through Stages 0–5 in order yourself, sequentially (ignore the "parallel tracks" note — you are the only worker).

Rules:
- Never wait for input. When a decision is unclear, choose the option most consistent with PLAN.md, log it in DECISIONS.md (one line: decision + reason), and continue.
- Keep `npm run check` (typecheck, lint, test, build) green. Commit and push to main after each meaningful unit of work, with clear messages. Never push a broken build.
- If something blocks you for more than ~20 minutes, stub it behind a clear "coming soon" UI state with a TODO, log it in STATUS.md, and move on.
- Never commit secrets. The Gemini key exists only as the Vercel env vars GEMINI_API_KEY / GEMINI_MODEL; the app must work fully without it.
- The "Uncalibrated estimate" badge rule in PLAN.md §0 is mandatory.

Priority order if time runs short (finish each level before going deeper):
1. Scaffold, Designer page, viewer, and all 9 families buildable from presets with STL export and a strength verdict.
2. Fit-check template PDF (true scale), print sheet, request-a-print sheet, bed fit + validator, task finder.
3. Heat-map, cross-section, ghosts, drawings, 3MF, zip package, calibration page.
4. Gemini features, Learn pages, profiles/share links, nets, gauges, DXF, mounting template, animations, auto-split.
5. Accessibility audit, mobile polish, performance, e2e tests.

Finish by writing STATUS.md: what is done, what is stubbed or partial, known bugs, and how to test each feature locally and on the Vercel deploy.
