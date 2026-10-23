# Gate 2: design checklist for the v3 redesign

Every proposal in gate 3 and the final build is checked against this list. Sources are linked at the end. Numbers in brackets point to them.

## A. Typography

1. **Body text 17–18 px**, never below 16 px for reading text.
   - The web range is 15–25 px [1]. Older users need larger type than younger users [2].
   - Labels and captions may go to 14 px. They're never light grey.
2. **Line spacing 1.5–1.6 for body** (the recommended range is 120–145% [1]; we sit above it for older readers [3]). **1.05–1.2 for headlines.**
3. **Line length 60–72 characters** for paragraphs. The acceptable range is 45–90 [1]; the reference sites measure 66–80 (gate 1).
4. **Two typefaces, chosen on purpose:**
   - a serif for display and headings;
   - a sans for interface text, labels and numbers;
   - a mono only for measurements in drawings, if at all.
   - No Inter, Space Grotesk, Instrument Serif or Geist [5][6]. No system fonts as the voice [1]. No monospace for running text [1].
5. **At most three type sizes per screen**, plus the hero [4]. Hierarchy also comes from weight and colour, not size alone [7].
6. **Serif headline at its normal weight**, with letter spacing tightened about 1–2% at display sizes (gate 1). Never faux bold.
7. **Sentence case for headings and labels.** Capitals only for short labels under one line, with 5–12% extra letter spacing [1]. No all-caps section labels [6].
8. **Proper punctuation:** curly quotes, real dashes, real ellipses, a proper × in dimensions [1].
9. **No one-word italic accent in headlines** (an AI tell [6]). Italic only where it has a meaning, such as figure captions.
10. **Left-aligned text.** No centred paragraphs [1][3]. A centred hero is the default AI look [6].

## B. Layout and hierarchy

11. **One left edge per breakpoint.** Every heading, paragraph and figure lines up to it (Stripe uses one edge for 42 blocks, gate 1).
12. **Spacing from one scale:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 px [7].
    - Space inside a group is smaller than the space between groups [4][7].
    - More space above a heading than below it.
13. **Lead with the key point.** The hero states the whole idea in the first two lines [8].
    - Headings start with the informative words [8].
14. **The real product shows by the first scroll:** the live part and a glimpse of the Designer, not a decorative image (gate 1).
15. **Squint test:** blur the screenshot. The primary action and headline must still stand out [4].
16. **No more than two large elements per screen** [4].
17. **Fewer boxes.** Group with space first; add hairlines or a tint only where space isn't enough [4][7].
    - No nested cards.
    - No coloured left or top borders on cards [6].
18. **Section structure specific to the product**, not the template order nav → hero → features → testimonials → pricing → FAQ → CTA → footer [5].
    - No three identical icon cards [5][6].
    - No stat banner [6].
    - No badge above the headline [5][6].

## C. Colour

19. **Design in greyscale first**, then add colour [7].
20. **One accent colour** for actions. The **three strength colours** (comfortable, marginal, likely to fail) appear only where they carry data: the meter, the stress map, the verdict.
21. **Three text greys from one hue:** ink, secondary, tertiary (as on Linear and Anthropic, gate 1).
    - The darkest is dark grey, not pure black [7].
    - All meet 4.5:1, and the large text we rely on aims for 7:1 [3].
22. **Never colour alone:** every strength level also has a word and a shape [3][4].
23. **No gradients, glows or glassmorphism** unless a gradient carries data, like the stress map [5][6].
24. **Light or dark decided on purpose.** We use light: the people this serves read and print in daylight, and serif type reads best dark-on-light. High contrast stays as the accessibility option.

## D. Controls and interaction (older users and weak grip)

25. **48 px minimum targets**; the main actions are 56 px. Labels are part of the target [3].
26. **Clear hover and focus states** on every link and control, with a visible focus ring [3].
27. **Links look like links:** underlined, or a distinct colour plus underline on hover. Link text says where it goes [3][8].
28. **Forms (sign-in, profile, measurements):**
    - visible labels, with examples of the expected format;
    - errors next to the field in plain words, with the fix;
    - accept flexible input, for example "32", "32 mm" or "3.2 cm" [2][3].
29. **No surprises:** no pop-ups, no auto-advancing content, no context change on focus [2][3].
30. **Motion:**
    - **One** authored moment per page, never fade-up on every section [5].
    - Ease-out, starting from already-visible content.
    - Reduced motion turns it off entirely [3].
31. **Text resizes to 200%** without losing content [3]. The 125% and 150% settings stay.
32. **Keyboard:** logical order, skip link, no traps [3]. The number keys stay as optional shortcuts.

## E. Content and copy

33. **Plain language**, short sentences, abbreviations expanded on first use (for example "PETG plastic") [3].
34. **No vague headlines** ("Elevate your…", "Welcome to…") [5].
    - Never invent claims, stats, logos or testimonials [5].
35. **No company-site filler:** logo walls, pricing, "Contact sales", news, a large footer (gate 1).
    - The footer is one or two lines: the disclaimer plus four links.
36. **Not numbered steps 1-2-3 by default** [6]. The Brief → Measure → Check → Print strip stays, because it is the app's real progress indicator, not decoration.

## F. Browser details (signs of a site that was built, not assembled)

37. Theme the parts of the page we didn't draw from the palette:
    - text selection;
    - caret;
    - focus ring;
    - scrollbars;
    - link underline offset;
    - tabular numbers for measurements.

## How each mockup is scored

Before you see it, each mockup gets this table:

| Check | Pass / fail |
|---|---|
| Items 1–10 (type) | |
| Items 11–18 (layout) | |
| Items 19–24 (colour) | |
| Items 25–32 (controls) | |
| Items 33–36 (content) | |
| Count of "AI tells" (any of 4, 9, 10, 17, 18, 23, 30, 34) | target: 0 |
| Contrast pairs measured | all ≥ 4.5:1 |

## Sources

1. [Butterick, *Practical Typography*: summary of key rules](https://practicaltypography.com/summary-of-key-rules.html)
2. [Nielsen Norman Group: usability for senior citizens](https://www.nngroup.com/articles/usability-for-senior-citizens/)
3. [W3C WAI: developing websites for older people](https://www.w3.org/WAI/older-users/developing/)
4. [Nielsen Norman Group: visual hierarchy in UX](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)
5. [925 Studios: AI slop web design guide (2026)](https://www.925studios.co/blog/ai-slop-web-design-guide), and [Developers Digest: 16 AI design slop patterns](https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it)
6. [Developers Digest: AI design slop and how to spot it](https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it)
7. *Refactoring UI* (Wathan & Schoger), from secondary summaries: [tactical principles](https://cdn.jsdelivr.net/npm/claude-code-skills@0.5.0/data/skills/ux-ui-design-system/references/refactoring-ui.md)
8. [Nielsen Norman Group: F-shaped reading pattern](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/)
9. Gate 1 measurements: `gate1-references.md`
